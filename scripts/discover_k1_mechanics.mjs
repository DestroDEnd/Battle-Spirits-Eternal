/**
 * scripts/discover_k1_mechanics.mjs
 *
 * Full-Database Mechanic Discovery, Semantic Pattern Cataloging & Prioritized Batch Planning
 * across all 514 IR shards (15,398 card records / 14,609 unique canonical cards / 36,422 abilities).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createDefaultKeywordRegistry } from '../engine/keywords/index.js';
import { parseConditionToStructured } from '../engine/conditions.js';
import { OPERATION_EVIDENCE_REGISTRY, OPERATION_CONTRACTS } from './evidence_registry.mjs';

const SHARD_DIR = path.resolve('data/ir_shards');
const OUT_DIR = path.resolve('reports/work_package_k1');
fs.mkdirSync(OUT_DIR, { recursive: true });

const detailedMap = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));
const fgAudit = JSON.parse(fs.readFileSync('reports/work_package_fg/shard_audit_summary.json', 'utf8'));
const kwRegistryEngine = createDefaultKeywordRegistry();
const engineKwNames = new Set(
  [...(kwRegistryEngine.keywords?.keys ? kwRegistryEngine.keywords.keys() : Object.keys(kwRegistryEngine.keywords || {}))].map(k => String(k).toLowerCase())
);
const opsSrc = fs.readFileSync('engine/ops/index.js', 'utf8');
const implementedOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));
const condSrc = fs.readFileSync('engine/conditions.js', 'utf8');
const evaluatedCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));

function getReleaseFamily(shardFile) {
  const s = String(shardFile).replace(/\.json$/i, '');
  if (/^BS\d+|^26RBS/i.test(s)) return 'Main Booster';
  if (/^SD\d+|^26RSD|^DB\d+|^26RDB/i.test(s)) return 'Starter / Build Deck';
  if (/^CB\d+|^26RCB/i.test(s)) return 'Collaboration Booster';
  if (/^BSC\d+|^CP\d+|^EX/i.test(s)) return 'Extra / Theme Booster';
  if (/^PB|^PC|^PX|^LM/i.test(s)) return 'Premium Bandai / Box Set';
  return 'Promotional / Special Release';
}

const shardFiles = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort();

let totalCardRecords = 0;
const canonicalCards = new Map();
const bySet = new Map();
const byReleaseFamily = {};
const byCardType = {};
const byCardColor = {};

const keywordMap = new Map();
const opMap = new Map();
const condMap = new Map();
const condFailMap = new Map();
const triggerMap = new Map();
const structureCounts = {
  SINGLE_OP: 0,
  COMPOUND_MULTI_CLAUSE: 0,
  CONDITIONAL: 0,
  CHOOSE_OR_BRANCH: 0,
  OPTIONAL: 0,
  MANDATORY: 0,
  BY_DOING_SEQUENCE: 0,
  AFTER_RESOLVES_SEQUENCE: 0,
  COST_GATED: 0,
  REPLACEMENT: 0,
  PREVENTION_OR_IMMUNITY: 0,
  MULTI_TARGET_OR_ALL: 0,
  ZERO_CLAUSE_HEADER_OR_VANILLA: 0,
};

const semanticPatterns = new Map();
const manualReviewAbilities = [];

for (const sf of shardFiles) {
  const sh = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, sf), 'utf8'));
  const relFam = getReleaseFamily(sf);
  byReleaseFamily[relFam] = (byReleaseFamily[relFam] || 0) + 1;

  for (const card of Object.values(sh)) {
    if (!card || !card.cardNumber) continue;
    totalCardRecords++;
    const cid = card.cardNumber;
    const det = detailedMap[cid] || {};
    const cType = det.type || 'Unknown';
    const cColor = det.color || 'Unknown';
    byCardType[cType] = (byCardType[cType] || 0) + 1;
    byCardColor[cColor] = (byCardColor[cColor] || 0) + 1;

    if (!bySet.has(sf)) bySet.set(sf, { shard: sf, releaseFamily: relFam, cards: 0, canonicalCards: new Set(), abilities: 0, supportedAbilities: 0 });
    const setRec = bySet.get(sf);
    setRec.cards++;
    setRec.canonicalCards.add(cid);

    if (!canonicalCards.has(cid)) {
      canonicalCards.set(cid, { cardNumber: cid, name: card.name, type: cType, color: cColor, shard: sf, releaseFamily: relFam, abilitiesCount: (card.abilities || []).length });
    }

    for (let abIdx = 0; abIdx < (card.abilities || []).length; abIdx++) {
      const ab = card.abilities[abIdx];
      setRec.abilities++;
      const clauses = ab.clauses || [];
      const hasUnsupportedClause = clauses.some(cl => !cl.op || cl.op.op === 'UNSUPPORTED' || !implementedOps.has(cl.op.op));
      if (!hasUnsupportedClause && clauses.length > 0) setRec.supportedAbilities++;

      for (const kw of (ab.keywords || [])) {
        const kwName = String(kw.name || kw.keyword || kw.hook || 'UNKNOWN').trim();
        if (!kwName) continue;
        if (!keywordMap.has(kwName)) {
          keywordMap.set(kwName, {
            name: kwName,
            variants: new Set(),
            canonicalCards: new Set(),
            abilities: new Set(),
            sets: new Set(),
            relatedOps: new Set(),
            triggers: new Set(),
            runtimeSupported: engineKwNames.has(kwName.toLowerCase()),
            frequency: 0,
          });
        }
        const kr = keywordMap.get(kwName);
        kr.frequency++;
        if (kw.parameter) kr.variants.add(String(kw.parameter));
        kr.canonicalCards.add(cid);
        kr.abilities.add(ab.physicalId || `${cid}#a${abIdx}`);
        kr.sets.add(sf);
        kr.triggers.add(String(ab.header?.timing || 'PASSIVE'));
        for (const cl of clauses) if (cl.op?.op) kr.relatedOps.add(cl.op.op);
      }

      const timing = String(ab.header?.timing || 'PASSIVE').toUpperCase();
      if (!triggerMap.has(timing)) {
        triggerMap.set(timing, { timing, abilityCount: 0, canonicalCards: new Set(), sampleCards: [] });
      }
      const tr = triggerMap.get(timing);
      tr.abilityCount++;
      tr.canonicalCards.add(cid);
      if (tr.sampleCards.length < 5) tr.sampleCards.push(cid);

      if (clauses.length === 0) structureCounts.ZERO_CLAUSE_HEADER_OR_VANILLA++;
      else if (clauses.length === 1) structureCounts.SINGLE_OP++;
      else structureCounts.COMPOUND_MULTI_CLAUSE++;

      if (clauses.some(c => c.condition || c.op?.condition)) structureCounts.CONDITIONAL++;
      if (clauses.some(c => c.link === 'or')) structureCounts.CHOOSE_OR_BRANCH++;
      if (clauses.some(c => c.isOptional)) structureCounts.OPTIONAL++;
      else if (clauses.length > 0) structureCounts.MANDATORY++;
      if (clauses.some(c => c.link === 'byDoing' || c.link === 'ifYouDo' || c.link === 'whenYouveDoneSo')) structureCounts.BY_DOING_SEQUENCE++;
      if (clauses.some(c => c.link === 'afterResolves')) structureCounts.AFTER_RESOLVES_SEQUENCE++;
      if (clauses.some(c => c.isCost)) structureCounts.COST_GATED++;
      if (clauses.some(c => c.op?.op === 'REPLACEMENT_EFFECT')) structureCounts.REPLACEMENT++;
      if (clauses.some(c => ['IMMUNITY', 'PREVENT_LOSS', 'CANNOT_REFRESH', 'CANNOT_EXHAUST', 'SET_RESTRICTION', 'GLOBAL_RESTRICTION'].includes(c.op?.op))) structureCounts.PREVENTION_OR_IMMUNITY++;
      if (clauses.some(c => c.op?.all || (typeof c.op?.count === 'number' && c.op.count > 1))) structureCounts.MULTI_TARGET_OR_ALL++;

      const patternClauses = [];
      let abNeedsManual = false;
      const abOps = [];
      const abConds = [];

      for (const cl of clauses) {
        const opName = cl.op?.op || 'UNSUPPORTED';
        abOps.push(opName);
        if (!opMap.has(opName)) {
          const reg = OPERATION_EVIDENCE_REGISTRY[opName];
          opMap.set(opName, {
            op: opName,
            implemented: implementedOps.has(opName),
            registeredInEvidence: Boolean(reg),
            hasContract: Boolean(OPERATION_CONTRACTS[opName]),
            clauseCount: 0,
            canonicalCards: new Set(),
            sets: new Set(),
          });
        }
        const or = opMap.get(opName);
        or.clauseCount++;
        or.canonicalCards.add(cid);
        or.sets.add(sf);

        if (opName === 'UNSUPPORTED' || !implementedOps.has(opName) || !OPERATION_EVIDENCE_REGISTRY[opName]) {
          abNeedsManual = true;
        }

        for (const rawCond of [cl.condition, cl.op?.condition]) {
          if (!rawCond || typeof rawCond !== 'string') continue;
          const parsed = parseConditionToStructured(rawCond);
          const cTypeKey = (parsed && parsed.type && evaluatedCondTypes.has(parsed.type)) ? parsed.type : 'PARSE_FAILURE';
          abConds.push(cTypeKey);
          if (cTypeKey === 'PARSE_FAILURE') {
            abNeedsManual = true;
            const norm = rawCond.replace(/\d+/g, '<N>').replace(/"[^"]+"/g, '"<STR>"').trim();
            if (!condFailMap.has(norm)) condFailMap.set(norm, { normalizedPattern: norm, count: 0, sampleRaw: rawCond, sampleCards: [] });
            const cf = condFailMap.get(norm);
            cf.count++;
            if (cf.sampleCards.length < 3) cf.sampleCards.push(cid);
          } else {
            if (!condMap.has(cTypeKey)) condMap.set(cTypeKey, { type: cTypeKey, evaluatorSupported: true, count: 0, sampleCards: [] });
            const cr = condMap.get(cTypeKey);
            cr.count++;
            if (cr.sampleCards.length < 5 && !cr.sampleCards.includes(cid)) cr.sampleCards.push(cid);
          }
        }

        patternClauses.push({
          op: opName,
          link: cl.link || null,
          isCost: Boolean(cl.isCost),
          isOptional: Boolean(cl.isOptional),
          hasCondition: Boolean(cl.condition || cl.op?.condition),
          targetSide: cl.op?.target?.side || cl.op?.side || (typeof cl.op?.target === 'string' ? cl.op.target : null),
        });
      }

      if (abNeedsManual && manualReviewAbilities.length < 500) {
        manualReviewAbilities.push({ cardNumber: cid, shard: sf, abilityId: ab.physicalId || `${cid}#a${abIdx}`, timing, ops: abOps, conds: abConds });
      }

      const normStruct = { timing, clauses: patternClauses };
      const patHash = crypto.createHash('sha256').update(JSON.stringify(normStruct)).digest('hex').slice(0, 12);
      const patId = `PAT-${patHash}`;
      if (!semanticPatterns.has(patId)) {
        semanticPatterns.set(patId, {
          patternId: patId,
          normalizedStructure: normStruct,
          requiredOps: [...new Set(abOps)],
          requiredConditions: [...new Set(abConds)],
          triggerDependency: timing,
          abilityCount: 0,
          canonicalCards: new Set(),
          sampleAbilityIds: [],
          sampleCards: [],
          fullyVerifiedOps: abOps.every(o => implementedOps.has(o) && OPERATION_EVIDENCE_REGISTRY[o]),
        });
      }
      const sp = semanticPatterns.get(patId);
      sp.abilityCount++;
      sp.canonicalCards.add(cid);
      if (sp.sampleCards.length < 5 && !sp.sampleCards.includes(cid)) sp.sampleCards.push(cid);
      if (sp.sampleAbilityIds.length < 5) sp.sampleAbilityIds.push(ab.physicalId || `${cid}#a${abIdx}`);
    }
  }
}

const invOut = {
  generatedAt: new Date().toISOString(),
  totalShards: shardFiles.length,
  totalCardRecords,
  uniqueCanonicalCards: canonicalCards.size,
  totalAbilities: fgAudit.totalAbilities,
  totalClauses: fgAudit.totalClauses,
  shardsByReleaseFamily: byReleaseFamily,
  cardRecordsByType: byCardType,
  cardRecordsByColor: byCardColor,
};
fs.writeFileSync(path.join(OUT_DIR, 'k1_full_database_inventory.json'), JSON.stringify(invOut, null, 2));

const kwOut = [...keywordMap.values()]
  .map(k => ({
    name: k.name,
    frequency: k.frequency,
    canonicalCardCount: k.canonicalCards.size,
    abilityCount: k.abilities.size,
    setCount: k.sets.size,
    variants: [...k.variants].slice(0, 20),
    relatedOps: [...k.relatedOps],
    triggers: [...k.triggers],
    runtimeSupportedInRegistry: k.runtimeSupported,
  }))
  .sort((a, b) => b.frequency - a.frequency);
fs.writeFileSync(path.join(OUT_DIR, 'k1_keyword_registry.json'), JSON.stringify({ generatedAt: new Date().toISOString(), totalKeywords: kwOut.length, keywords: kwOut }, null, 2));

const opOut = [...opMap.values()]
  .map(o => ({ op: o.op, implemented: o.implemented, registeredInEvidence: o.registeredInEvidence, hasContract: o.hasContract, clauseCount: o.clauseCount, canonicalCardCount: o.canonicalCards.size, setCount: o.sets.size }))
  .sort((a, b) => b.clauseCount - a.clauseCount);
fs.writeFileSync(path.join(OUT_DIR, 'k1_operation_registry.json'), JSON.stringify({ generatedAt: new Date().toISOString(), uniqueOps: opOut.length, operations: opOut }, null, 2));

const condTypesOut = [...condMap.values()].sort((a, b) => b.count - a.count);
const condFailsOut = [...condFailMap.values()].sort((a, b) => b.count - a.count);
fs.writeFileSync(path.join(OUT_DIR, 'k1_condition_registry.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  supportedConditionTypes: condTypesOut,
  parseFailureTotal: condFailsOut.reduce((s, x) => s + x.count, 0),
  uniqueNormalizedFailurePatterns: condFailsOut.length,
  topParseFailurePatterns: condFailsOut.slice(0, 100),
}, null, 2));

const trigOut = [...triggerMap.values()]
  .map(t => ({ timing: t.timing, abilityCount: t.abilityCount, canonicalCardCount: t.canonicalCards.size, sampleCards: t.sampleCards }))
  .sort((a, b) => b.abilityCount - a.abilityCount);
fs.writeFileSync(path.join(OUT_DIR, 'k1_trigger_registry.json'), JSON.stringify({ generatedAt: new Date().toISOString(), uniqueTimings: trigOut.length, triggers: trigOut }, null, 2));

fs.writeFileSync(path.join(OUT_DIR, 'k1_effect_structure_registry.json'), JSON.stringify({ generatedAt: new Date().toISOString(), structureCounts }, null, 2));

const patternsOut = [...semanticPatterns.values()]
  .map(p => ({
    patternId: p.patternId,
    abilityCount: p.abilityCount,
    canonicalCardCount: p.canonicalCards.size,
    triggerDependency: p.triggerDependency,
    requiredOps: p.requiredOps,
    requiredConditions: p.requiredConditions,
    fullyVerifiedOps: p.fullyVerifiedOps,
    normalizedStructure: p.normalizedStructure,
    sampleCards: p.sampleCards,
    sampleAbilityIds: p.sampleAbilityIds,
  }))
  .sort((a, b) => b.abilityCount - a.abilityCount);

fs.writeFileSync(path.join(OUT_DIR, 'k1_semantic_pattern_catalog.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalUniqueSemanticPatterns: patternsOut.length,
  top100Patterns: patternsOut.slice(0, 100),
}, null, 2));

const crossSet = [...bySet.values()].map(s => ({
  shard: s.shard,
  releaseFamily: s.releaseFamily,
  cards: s.cards,
  canonicalCards: s.canonicalCards.size,
  abilities: s.abilities,
  supportedAbilities: s.supportedAbilities,
}));
fs.writeFileSync(path.join(OUT_DIR, 'k1_cross_set_coverage.json'), JSON.stringify({ generatedAt: new Date().toISOString(), totalSets: crossSet.length, sets: crossSet }, null, 2));

const depGraph = {
  generatedAt: new Date().toISOString(),
  nodes: [
    'GameStateManager', 'ZoneManager', 'FlowController', 'TriggerQueueManager',
    'AsyncResolver', 'TargetingSystem', 'ConditionEvaluator', 'RestrictionManager',
    'BattleManager', 'ReplacementEffects', 'PreventionEffects', 'KeywordRegistry', 'OperationHandlers'
  ],
  edges: [
    { from: 'TriggeredEffects', to: ['TriggerQueueManager', 'AsyncResolver', 'RestrictionManager'] },
    { from: 'ConditionalEffects', to: ['ConditionEvaluator', 'GameStateManager'] },
    { from: 'TargetedEffects', to: ['TargetingSystem', 'PreventionEffects'] },
    { from: 'ReplacementEffects', to: ['ZoneManager', 'EventBus'] },
    { from: 'CompoundEffects', to: ['AsyncResolver', 'ConditionEvaluator', 'TargetingSystem'] },
    { from: 'BattleEffects', to: ['BattleManager', 'TargetingSystem', 'TriggerQueueManager'] },
    { from: 'KeywordMechanics', to: ['KeywordRegistry', 'OperationHandlers', 'ContinuousModifiers'] },
  ],
};
fs.writeFileSync(path.join(OUT_DIR, 'k1_mechanic_dependency_graph.json'), JSON.stringify(depGraph, null, 2));

const batches = [
  {
    batchId: 'K1-BATCH-01',
    priority: 1,
    title: 'Core Verified Single-Op & Draw/Destroy/Buff/Bounce/Core Patterns',
    mechanicFamilies: ['DRAW', 'BP_BUFF', 'BP_DEBUFF', 'DESTROY', 'BOUNCE', 'EXHAUST', 'REFRESH', 'MOVE_CORE'],
    estimatedAbilityCoverage: patternsOut.filter(p => p.fullyVerifiedOps && p.normalizedStructure.clauses.length <= 2).reduce((s, p) => s + p.abilityCount, 0),
    dependencies: ['AsyncResolver', 'TargetingSystem', 'ZoneManager'],
    risk: 'LOW',
    reason: 'Highest frequency across all 514 shards with verified runtime handlers; delivers immediate high-volume card coverage.',
  },
  {
    batchId: 'K1-BATCH-02',
    priority: 2,
    title: 'Condition Evaluator Expansion (Top Parse-Failure Patterns: Braved-To, Counters, Life, Named-Control)',
    mechanicFamilies: ['BRAVE_STACK_STATE', 'COUNTER_THRESHOLD', 'LIFE_THRESHOLD', 'CONTROL_CARD'],
    estimatedAbilityCoverage: condFailsOut.slice(0, 30).reduce((s, c) => s + c.count, 0),
    dependencies: ['ConditionEvaluator', 'K1-BATCH-01'],
    risk: 'LOW_MEDIUM',
    reason: 'Unlocks hundreds of conditional abilities blocked on condition parse failures.',
  },
  {
    batchId: 'K1-BATCH-03',
    priority: 3,
    title: 'High-Frequency Keyword Mechanics (Burst, Accel, Advent, Contract Advent, Rebirth, Mirage)',
    mechanicFamilies: ['Burst', 'Accel', 'Advent', 'Contract Advent', 'Rebirth', 'Mirage'],
    estimatedAbilityCoverage: kwOut.slice(0, 10).reduce((s, k) => s + k.abilityCount, 0),
    dependencies: ['KeywordRegistry', 'TriggerQueueManager', 'TimingWindowManager'],
    risk: 'MEDIUM',
    reason: 'Core Battle Spirits mechanics spanning Main Boosters, SDs, and Collabs.',
  },
  {
    batchId: 'K1-BATCH-04',
    priority: 4,
    title: 'Incomplete-Parameter Closure & Bare-Stub Operations (582 Clauses)',
    mechanicFamilies: ['DECK_OR_HAND_ACTION', 'MODIFY_EFFECT', 'COUNT_OPERATION', 'DECK_ACTION', 'TOKEN_DEPLOYMENT'],
    estimatedAbilityCoverage: fgAudit.operations.evidenceBreakdown.PARAMETERS_INCOMPLETE,
    dependencies: ['Compiler', 'OperationHandlers'],
    risk: 'MEDIUM',
    reason: 'Closes remaining 582 parameter-incomplete clauses without guesswork.',
  },
  {
    batchId: 'K1-BATCH-05',
    priority: 5,
    title: 'Replacement, Prevention, Unverified/Unsupported Variants (118 + 17) & Complex Multi-Clause Cards',
    mechanicFamilies: ['REPLACEMENT_EFFECT', 'IMMUNITY', 'TRIGGERED_WATCHER', 'COPY_EFFECT'],
    estimatedAbilityCoverage: fgAudit.operations.evidenceBreakdown.PARTIALLY_SUPPORTED + fgAudit.operations.evidenceBreakdown.NEEDS_MANUAL_REVIEW,
    dependencies: ['ZoneManager', 'EventBus', 'K1-BATCH-01..04'],
    risk: 'HIGH',
    reason: 'Handles rare/complex interactions (including 26RBS02-083, 26RDB01-024, 26RSD07-001) after foundational batches.',
  }
];
fs.writeFileSync(path.join(OUT_DIR, 'k1_batch_implementation_plan.json'), JSON.stringify({ generatedAt: new Date().toISOString(), batches }, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'k1_priority_analysis.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  top10Keywords: kwOut.slice(0, 10),
  top15Operations: opOut.slice(0, 15),
  top15SemanticPatterns: patternsOut.slice(0, 15),
}, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'k1_manual_review_queue.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalSampledManualReviewAbilities: manualReviewAbilities.length,
  auditSummaryTotalManualReviewAbilities: fgAudit.abilities.NEEDS_MANUAL_REVIEW,
  auditSummaryTotalManualReviewCards: fgAudit.cardStatusProposal.NEEDS_MANUAL_REVIEW,
  sampleQueue: manualReviewAbilities,
}, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'k1_runtime_support_mapping.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  implementedHandlers: implementedOps.size,
  evaluatedConditionTypes: evaluatedCondTypes.size,
  registeredKeywordsInEngine: engineKwNames.size,
  corpusBreakdown: fgAudit.operations.evidenceBreakdown,
}, null, 2));

console.log(JSON.stringify({
  totalCardRecords,
  uniqueCanonicalCards: canonicalCards.size,
  uniqueKeywords: kwOut.length,
  uniqueOps: opOut.length,
  uniqueSemanticPatterns: patternsOut.length,
  uniqueTimings: trigOut.length,
  parseFailureTotal: condFailsOut.reduce((s, x) => s + x.count, 0),
}, null, 2));
