/**
 * scripts/classify_card_effects.mjs
 *
 * Phase 1: Honest Effect Classification
 *
 * Inspects every card in data/ir_shards/*.json, PerCardRegistry (engine/cards/index.js),
 * compiler/overrides/index.js, and tests/** /*.test.js against the actual runtime
 * capabilities in engine/ops/index.js and engine/resolver.js.
 *
 * Outputs:
 *   - data/card_implementation_status.json
 *   - reports/phase1_honest_effect_classification.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PerCardRegistry } from '../engine/cards/index.js';
import { getCardOverride, SKIPPED_CARDS, VANILLA_CARD_NUMBERS } from '../compiler/overrides/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IR_SHARDS_DIR = path.join(ROOT, 'data', 'ir_shards');
const TESTS_DIR = path.join(ROOT, 'tests');
const STATUS_OUT_PATH = path.join(ROOT, 'data', 'card_implementation_status.json');
const REPORT_OUT_PATH = path.join(ROOT, 'reports', 'phase1_honest_effect_classification.md');

// Silent no-op operations in engine/ops/index.js (return { success: true } without mutating game state)
const SILENT_NOOP_OPS = new Set([
  'ACTIVATE_FLASH',
  'CAST_MAGIC_FREE',
  'ACTIVATE_BURST',
  'SET_BURST',
  'ACTIVATE_EFFECT_ACTION',
  'CHANGE',
  'MIRAGE_OPERATION',
  'TOKEN_DEPLOYMENT',
  'ADVENT_PAY',
  'PAY_COST',
  'HEADER',
  'UNSUPPORTED'
]);

// Operations in engine/ops/index.js that only push a modifier type never read by engine/*.js
const DUMMY_MODIFIER_OPS = new Set([
  'CONTINUOUS_RULE',
  'CARD_RULE_MODIFIER',
  'RULE_OR_TEXT_MODIFIER',
  'PLAY_CONDITION',
  'MAGIC_RESTRICTION',
  'INDESTRUCTIBLE',
  'UNPREVENTABLE',
  'CANNOT_REFRESH',
  'PREVENT_WHEN_SUMMONED',
  'RUSH_CONDITION',
  'CONTINUE_BATTLE',
  'SYMBOL_RULE',
  'COST_RULE',
  'TARGET_CONSTRAINT',
  'MODIFY_EFFECT',
  'MODIFY_EFFECT_VALUE',
  'FORMAT_MARKER',
  'COMPARE_LEVELS',
  'COMPARE_LV_INSTEAD_OF_BP',
  'BP_OR_LEVEL_MODIFIER',
  'SET_BP',
  'PREVENT_LOSS',
  'SKIP_STEP',
  'STEP_MODIFIER'
]);

// Executable PASSIVE_RULEs in engine/cards/registry.js
const EXECUTABLE_PASSIVE_RULES = new Set([
  'CAN_BLOCK_WHILE_EXHAUSTED',
  'TREAT_AS_COLOR',
  'BRILLIANCE',
  'DISCARD_HAND',
  'STEP_MODIFIER'
]);

// Exact 5 condition patterns supported by evaluateCondition() in engine/resolver.js
function isConditionEvaluatedByResolver(conditionStr) {
  if (!conditionStr) return true;
  const s = String(conditionStr).toLowerCase().trim();
  if (s === 'destroyed_by_opponent') return true;
  if (s === 'summoned_from_removed') return true;
  if (s.includes('soul core') && (s.includes('pay') || s.includes('used') || s.includes('cost'))) return true;
  if (s.includes('no spirits') || s.includes('control no spirits')) return true;
  if (s.includes('life is at two or more')) return true;
  return false;
}

function extractHandledOpsFromEngine() {
  const opsSrc = fs.readFileSync(path.join(ROOT, 'engine', 'ops', 'index.js'), 'utf8');
  return new Set([...opsSrc.matchAll(/case\s+'([^']+)'/g)].map(m => m[1]));
}

function collectTestedCardNumbers(dir) {
  const tested = new Set();
  const stack = [dir];
  const cardNumRegex = /\b([A-Z0-9]{2,10}-[A-Z0-9]{1,8}(?:-[A-Z0-9]+)?|BATTLE-SPIRITS-[A-Z0-9]+)\b/g;

  while (stack.length > 0) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        const content = fs.readFileSync(full, 'utf8');
        for (const m of content.matchAll(cardNumRegex)) {
          tested.add(m[1].toUpperCase());
        }
      }
    }
  }
  return tested;
}

function analyzePerCardEntry(entry) {
  if (!entry) return { exists: false };
  const triggerNames = Object.keys(entry.triggers || {});
  const sagaAbilities = Array.isArray(entry.sagaAbilities) ? entry.sagaAbilities : null;

  let executableCount = 0;
  let placeholderCount = 0;

  if (sagaAbilities && sagaAbilities.length > 0) {
    for (const ab of sagaAbilities) {
      if (ab.overall === 'AURA_BP' || ab.overall === 'AURA_KEYWORDS') {
        executableCount++;
        continue;
      }
      const subs = ab.subEffects || [];
      if (subs.length === 0) {
        placeholderCount++;
      } else if (subs.every(s => s.op !== 'PASSIVE_RULE' || EXECUTABLE_PASSIVE_RULES.has(s.rule))) {
        executableCount++;
      } else {
        placeholderCount++;
      }
    }
  } else if (triggerNames.length > 0) {
    executableCount = triggerNames.length;
  }

  return {
    exists: true,
    isVanilla: Boolean(entry.isVanilla),
    triggerCount: triggerNames.length,
    executableCount,
    placeholderCount
  };
}

function main() {
  const handledOps = extractHandledOpsFromEngine();
  const testedCards = collectTestedCardNumbers(TESTS_DIR);

  const shardFiles = fs.readdirSync(IR_SHARDS_DIR).filter(f => f.endsWith('.json')).sort();
  const cardsStatus = {};

  const statusCounts = {
    VERIFIED: 0,
    PARTIAL: 0,
    UNIMPLEMENTED: 0,
    NEEDS_MANUAL_REVIEW: 0
  };

  const sourceCounts = {
    vanilla: 0,
    perCardRegistry: 0,
    compilerOverride: 0,
    compiledIrOnly: 0,
    skippedList: 0
  };

  const unsupportedOpCounts = new Map();
  const noopOrDummyOpCounts = new Map();
  const unparsedConditionCounts = new Map();
  const unsupportedClauseTextCounts = new Map();

  for (const file of shardFiles) {
    const shard = JSON.parse(fs.readFileSync(path.join(IR_SHARDS_DIR, file), 'utf8'));
    for (const [key, card] of Object.entries(shard)) {
      const cardNumber = String(card.cardNumber || card.card_number || key).trim();
      if (cardsStatus[cardNumber]) continue;
      const canonUpper = cardNumber.toUpperCase();
      const name = card.name || cardNumber;

      const override = getCardOverride(cardNumber, card);
      const hasOverride = Boolean(override);
      const isVanillaOverride = VANILLA_CARD_NUMBERS.has(cardNumber);
      const isSkipped = SKIPPED_CARDS instanceof Set ? SKIPPED_CARDS.has(cardNumber) : Boolean(SKIPPED_CARDS && SKIPPED_CARDS[cardNumber]);

      const regEntry = PerCardRegistry.get(canonUpper);
      const regInfo = analyzePerCardEntry(regEntry);
      const hasTest = testedCards.has(canonUpper);

      const abilities = Array.isArray(card.abilities) ? card.abilities : [];
      const isVanilla = Boolean(card.isVanilla) || isVanillaOverride || (abilities.length === 0 && (card.compiledClausesCount || 0) === 0 && (card.unsupportedClausesCount || 0) === 0 && !regInfo.exists);

      let executableClauses = 0;
      let brokenClauses = 0;
      const unsupportedOps = [];
      const noopOrDummyOps = [];
      const unparsedConditions = [];
      const reasons = [];

      for (const ab of abilities) {
        if (ab.type === 'CONDITION') continue;
        for (const un of (ab.unsupported || [])) {
          brokenClauses++;
          const tpl = String(un).replace(/\d+/g, 'N').trim();
          unsupportedClauseTextCounts.set(tpl, (unsupportedClauseTextCounts.get(tpl) || 0) + 1);
        }
        for (const cl of (ab.clauses || [])) {
          const opName = cl?.op?.op || 'NULL';
          let clauseBroken = false;

          if (cl.condition && !isConditionEvaluatedByResolver(cl.condition)) {
            clauseBroken = true;
            unparsedConditions.push(cl.condition);
            unparsedConditionCounts.set(cl.condition, (unparsedConditionCounts.get(cl.condition) || 0) + 1);
          }

          if (!handledOps.has(opName)) {
            clauseBroken = true;
            unsupportedOps.push(opName);
            unsupportedOpCounts.set(opName, (unsupportedOpCounts.get(opName) || 0) + 1);
          } else if (SILENT_NOOP_OPS.has(opName) || DUMMY_MODIFIER_OPS.has(opName)) {
            clauseBroken = true;
            noopOrDummyOps.push(opName);
            noopOrDummyOpCounts.set(opName, (noopOrDummyOpCounts.get(opName) || 0) + 1);
          }

          if (clauseBroken) {
            brokenClauses++;
          } else {
            executableClauses++;
          }
        }
      }

      // Classify card honestly
      let status;
      if (isVanilla) {
        status = 'VERIFIED';
        sourceCounts.vanilla++;
        reasons.push('Vanilla card with no effect text');
      } else if (regInfo.exists) {
        sourceCounts.perCardRegistry++;
        if (regInfo.placeholderCount > 0 && regInfo.executableCount > 0) {
          status = 'PARTIAL';
          reasons.push(`PerCardRegistry has ${regInfo.executableCount} executable abilities and ${regInfo.placeholderCount} PASSIVE_RULE placeholders`);
        } else if (regInfo.placeholderCount > 0 && regInfo.executableCount === 0) {
          status = executableClauses > 0 ? 'PARTIAL' : 'UNIMPLEMENTED';
          reasons.push('PerCardRegistry contains only PASSIVE_RULE placeholders');
        } else if (hasTest && brokenClauses === 0) {
          status = 'VERIFIED';
          reasons.push('Complete PerCardRegistry handler with automated test coverage');
        } else if (hasTest && brokenClauses > 0) {
          // PerCardRegistry takes precedence over compiledIr, but compiledIr still has unverified/broken clauses
          status = 'VERIFIED';
          reasons.push('Complete PerCardRegistry handler with automated test coverage (overrides IR)');
        } else {
          status = 'NEEDS_MANUAL_REVIEW';
          reasons.push('PerCardRegistry handler exists but lacks automated test coverage');
        }
      } else {
        if (hasOverride) sourceCounts.compilerOverride++;
        else sourceCounts.compiledIrOnly++;
        if (isSkipped) sourceCounts.skippedList++;

        if (executableClauses > 0 && brokenClauses === 0) {
          if (hasTest) {
            status = 'VERIFIED';
            reasons.push('All IR ops & conditions supported and covered by tests');
          } else {
            status = 'NEEDS_MANUAL_REVIEW';
            reasons.push('IR ops & conditions supported, but lacks automated test coverage');
          }
        } else if (executableClauses > 0 && brokenClauses > 0) {
          status = 'PARTIAL';
          if (unsupportedOps.length > 0) reasons.push(`Unhandled ops: ${[...new Set(unsupportedOps)].join(', ')}`);
          if (noopOrDummyOps.length > 0) reasons.push(`No-op/stub ops: ${[...new Set(noopOrDummyOps)].join(', ')}`);
          if (unparsedConditions.length > 0) reasons.push(`Unparsed conditions: ${unparsedConditions.length}`);
        } else {
          status = 'UNIMPLEMENTED';
          if (abilities.length === 0) reasons.push('No compiled abilities');
          if (unsupportedOps.length > 0) reasons.push(`Only unhandled ops: ${[...new Set(unsupportedOps)].join(', ')}`);
          if (noopOrDummyOps.length > 0) reasons.push(`Only no-op/stub ops: ${[...new Set(noopOrDummyOps)].join(', ')}`);
          if (unparsedConditions.length > 0) reasons.push(`Unparsed conditions: ${unparsedConditions.length}`);
        }
      }

      statusCounts[status]++;
      cardsStatus[cardNumber] = {
        cardNumber,
        name,
        status,
        hasPerCardRegistry: regInfo.exists,
        hasCompilerOverride: hasOverride,
        hasTest,
        executableClauses,
        brokenClauses,
        unsupportedOps: [...new Set(unsupportedOps)],
        noopOrDummyOps: [...new Set(noopOrDummyOps)],
        unparsedConditions: [...new Set(unparsedConditions)],
        reasons
      };
    }
  }

  const totalCards = Object.keys(cardsStatus).length;
  fs.writeFileSync(STATUS_OUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalCards,
    statusCounts,
    sourceCounts,
    cards: cardsStatus
  }, null, 2));

  const topUnsupportedOps = [...unsupportedOpCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  const topNoopOps = [...noopOrDummyOpCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  const topUnparsedConds = [...unparsedConditionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);

  const pct = (n) => ((n / totalCards) * 100).toFixed(2);
  const lines = [
    '# Phase 1: Honest Card Effect Classification Report',
    `Generated on: ${new Date().toISOString()}`,
    '',
    '## Summary Counts',
    `- **Total Cards Inspected**: ${totalCards}`,
    `- **VERIFIED**: ${statusCounts.VERIFIED} (${pct(statusCounts.VERIFIED)}%)`,
    `- **PARTIAL**: ${statusCounts.PARTIAL} (${pct(statusCounts.PARTIAL)}%)`,
    `- **NEEDS_MANUAL_REVIEW**: ${statusCounts.NEEDS_MANUAL_REVIEW} (${pct(statusCounts.NEEDS_MANUAL_REVIEW)}%)`,
    `- **UNIMPLEMENTED**: ${statusCounts.UNIMPLEMENTED} (${pct(statusCounts.UNIMPLEMENTED)}%)`,
    '',
    '## Implementation Source Breakdown',
    `- **Vanilla (No Effect Text)**: ${sourceCounts.vanilla}`,
    '- **PerCardRegistry (`engine/cards/`)**: ' + sourceCounts.perCardRegistry,
    '- **Compiler Explicit Overrides (`compiler/overrides/`)**: ' + sourceCounts.compilerOverride,
    '- **Compiled IR Only (`data/ir_shards/`)**: ' + sourceCounts.compiledIrOnly,
    '',
    '## Top Unhandled Operations (`UNHANDLED_OPERATION` in `engine/ops/index.js`)',
    '| Operation | Clause Count |',
    '| :--- | ---: |',
    ...topUnsupportedOps.map(([op, count]) => `| \`${op}\` | ${count} |`),
    '',
    '## Top Silent No-Op / Dummy Modifier Operations',
    '| Operation | Clause Count |',
    '| :--- | ---: |',
    ...topNoopOps.map(([op, count]) => `| \`${op}\` | ${count} |`),
    '',
    '## Top Unparsed Conditions (Ignored by `evaluateCondition()` in `engine/resolver.js`)',
    '| Condition Text | Clause Count |',
    '| :--- | ---: |',
    ...topUnparsedConds.map(([cond, count]) => `| ${cond.replace(/\|/g, '\\|')} | ${count} |`),
    ''
  ];

  fs.mkdirSync(path.dirname(REPORT_OUT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_OUT_PATH, lines.join('\n'));

  console.log('Phase 1 Classification Complete.');
  console.log('Total Cards:', totalCards);
  console.log('Status Counts:', statusCounts);
  console.log('Source Counts:', sourceCounts);
}

main();
