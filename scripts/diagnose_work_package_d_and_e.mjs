/**
 * scripts/diagnose_work_package_d_and_e.mjs
 * 
 * Phase 4D.1 — Work Packages D & E:
 * Comprehensive Card Support Diagnostics, Opcode-to-Card Dependency Graph,
 * Shared Mechanic Grouping (E1-E8), Implementation Priority Backlog,
 * and Roadmap.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'reports', 'phase4d_1');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('Starting Phase 4D.1 Work Packages D & E analysis...');

// 1. Load genuine telemetry
const telemetryFile = path.join(OUT_DIR, 'runtime_opcode_telemetry.json');
let telemetryOpcodes = new Set();
if (fs.existsSync(telemetryFile)) {
  const telData = JSON.parse(fs.readFileSync(telemetryFile, 'utf8'));
  for (const item of telData.telemetry || []) {
    if (item.opcode) telemetryOpcodes.add(item.opcode);
  }
}

// 2. Identify implemented opcodes in engine/ops/index.js
const opsIndexSource = fs.readFileSync(path.join(ROOT, 'engine', 'ops', 'index.js'), 'utf8');
const handledOpcodesInEngine = new Set();
const caseRegex = /case\s+['"]([A-Z0-9_]+)['"]\s*:/g;
let match;
while ((match = caseRegex.exec(opsIndexSource)) !== null) {
  handledOpcodesInEngine.add(match[1]);
}

// Base supported opcodes established in master baseline
const BASE_SUPPORTED_OPS = new Set([
  'DESTROY', 'BOUNCE', 'BOUNCE_TO_DECKBOTTOM', 'RETURN_DECK_BOTTOM',
  'BP_BUFF', 'BP_DEBUFF', 'SET_BP', 'BP_FORMULA',
  'EXHAUST', 'REFRESH', 'CANNOT_REFRESH',
  'FORCE_ATTACK', 'FORCE_BLOCK', 'CHOOSE_BLOCKER', 'TARGET_ATTACK', 'PIERCING', 'UNBLOCKABLE',
  'CORE_CHARGE', 'MOVE_CORE', 'PAY_CORE', 'RAMP_CORE', 'SEND_CORE_TO_RESERVE',
  'SUMMON', 'SUMMON_FREE', 'SUMMON_THIS_CARD', 'SUMMON_MULTI', 'DEPLOY_NEXUS',
  'REVEAL_CARDS', 'DRAW', 'DISCARD', 'MOVE_CARD', 'RETURN_TO_HAND', 'SWAP_CARDS',
  'SELECT_TARGET', 'SELECT_CARDS', 'CONFIRM_OPTIONAL', 'CHOOSE_OPTION',
  'ACTIVATE_BURST', 'SET_BURST', 'RESOLVE_BURST', 'SET_MIRAGE', 'ACTIVATE_MIRAGE',
  'PERFORM_ADVENT', 'ACTIVATE_ACCEL', 'ACTIVATE_CHANGE', 'BRAVE_FUSION',
  'IMMUNITY', 'CANNOT_BE_DESTROYED', 'CANNOT_BE_BOUNCED', 'PREVENT_DESTRUCTION',
  'REPLACEMENT_EFFECT', 'MODIFY_DESTINATION', 'CANCEL_ATTACK', 'END_ATTACK_STEP',
  'ADD_SYMBOL', 'REMOVE_SYMBOL', 'TREAT_SYMBOL_AS',
  'CANNOT_USE_ABILITY', 'CANNOT_ACTIVATE_BURST', 'CANNOT_ATTACK', 'CANNOT_BLOCK',
  'LOSE_EFFECTS', 'TREAT_AS_VANILLA', 'CHANGE_COLOR', 'COPY_ABILITY',
  'KEYWORD_ABILITY'
]);

// 3. Define the 8 Shared Mechanic Groups (E1 through E8)
const MECHANIC_GROUPS = {
  E1: {
    id: 'E1',
    name: 'Core Manipulation & Resource Transfer',
    description: 'Core flow, reserve transfers, Void charging, soul core routing, payment and cost reduction.',
    opcodes: ['CORE_CHARGE', 'MOVE_CORE', 'PAY_CORE', 'RAMP_CORE', 'SEND_CORE_TO_RESERVE', 'MOVE_SOUL_CORE', 'SEND_CORE_TO_TRASH', 'SEND_CORE_TO_VOID', 'SWAP_CORES', 'CORE_LOCK', 'AWAKEN_CORE_MOVE', 'RECYCLE_CORES', 'PLACE_CORE_FROM_VOID', 'SEND_LIFE', 'RECOVER_LIFE', 'LIFE_DAMAGE']
  },
  E2: {
    id: 'E2',
    name: 'Continuous Effects & Static Modifiers',
    description: 'BP modifications, symbol modification, color treating, passive protections (Armor, Heavy Armor, Immunity).',
    opcodes: ['BP_BUFF', 'BP_DEBUFF', 'SET_BP', 'BP_FORMULA', 'SWITCH_BP', 'BP_COMPARISON', 'BP_MATCH', 'ADD_SYMBOL', 'REMOVE_SYMBOL', 'TREAT_SYMBOL_AS', 'CHANGE_COLOR', 'LOSE_EFFECTS', 'TREAT_AS_VANILLA', 'COPY_ABILITY', 'CANNOT_BE_DESTROYED', 'CANNOT_BE_BOUNCED', 'IMMUNITY', 'INDESTRUCTIBLE', 'ARMOR', 'HEAVY_ARMOR']
  },
  E3: {
    id: 'E3',
    name: 'Replacement Effects & Destruction Prevention',
    description: 'Prevention of destruction, depletion or bounce, redirecting zones, remain on field mechanics.',
    opcodes: ['REPLACEMENT_EFFECT', 'PREVENT_DESTRUCTION', 'MODIFY_DESTINATION', 'REMAIN_ON_FIELD', 'REPLACE_DESTRUCTION', 'REPLACE_BOUNCE', 'PREVENT_BOUNCE', 'PREVENT_DEPLETION', 'CANCEL_DESTRUCTION']
  },
  E4: {
    id: 'E4',
    name: 'Timing Windows & Activation Conditions',
    description: 'Step/phase triggers, When Destroyed, Flash timing, combat trigger evaluation, structured conditions.',
    opcodes: ['WHEN_SUMMONED', 'WHEN_ATTACKING', 'WHEN_BLOCKED', 'WHEN_BLOCKING', 'WHEN_DESTROYED', 'FLASH', 'BURST_TRIGGER', 'START_OF_TURN', 'END_OF_TURN', 'START_OF_STEP', 'END_OF_STEP', 'ON_CORE_REMOVED', 'ON_LEAVE_FIELD', 'ON_LEVEL_UP', 'PASSIVE']
  },
  E5: {
    id: 'E5',
    name: 'Target Resolution & Candidate Filtering',
    description: 'Multi-criteria target querying, candidate validation, prompt decision resolution, redirection.',
    opcodes: ['SELECT_TARGET', 'SELECT_CARDS', 'CHOOSE_OPTION', 'CONFIRM_OPTIONAL', 'CHOOSE_BLOCKER', 'REDIRECT_TARGET', 'TARGET_ATTACK', 'FORCE_ATTACK', 'FORCE_BLOCK']
  },
  E6: {
    id: 'E6',
    name: 'Special Card Type Mechanics',
    description: 'Subsystems for Brave (fusion/separation), Mirage (set/trigger), Grandwalker Nexuses (divine skills), Contract cards (soul state), Ultimates (U-trigger), and Advent.',
    opcodes: ['BRAVE_FUSION', 'BRAVE_SEPARATION', 'ACTIVATE_MIRAGE', 'SET_MIRAGE', 'ACTIVATE_BURST', 'SET_BURST', 'RESOLVE_BURST', 'PERFORM_ADVENT', 'ACTIVATE_ACCEL', 'ACTIVATE_CHANGE', 'CONTRACT_PARTNER', 'SOUL_STATE', 'GRANDWALKER_CHARGING', 'DIVINE_SKILL', 'ULTIMATE_TRIGGER', 'U_TRIGGER', 'HIT_OR_CRITICAL']
  },
  E7: {
    id: 'E7',
    name: 'Keyword Ability Delegation',
    description: 'Delegation to specialized keyword handlers (Curse, Confront, Tribute, Immortal, Awakening, Bound, etc.).',
    opcodes: ['KEYWORD_ABILITY', 'ACTIVATE_KEYWORD', 'RESOLVE_KEYWORD', 'TREAT_AS_KEYWORD']
  },
  E8: {
    id: 'E8',
    name: 'Deck & Hand Manipulation',
    description: 'Drawing, discarding, deck search, milling, revealing, and bottom-deck bounce.',
    opcodes: ['DRAW', 'DISCARD', 'DISCARD_HAND', 'SWAP_CARDS', 'SWAP_HAND', 'MILL', 'REVEAL_CARDS', 'REVEAL_DECKTOP', 'SEARCH_DECK', 'DECK_SEARCH', 'RETURN_TO_HAND', 'BOUNCE', 'BOUNCE_TO_DECKBOTTOM', 'RETURN_DECK_BOTTOM', 'RETURN_DECK_TOP', 'LOOK_AT_DECK', 'SHUFFLE']
  }
};

function assignMechanicGroup(opcode) {
  const op = String(opcode).toUpperCase();
  for (const [key, group] of Object.entries(MECHANIC_GROUPS)) {
    if (group.opcodes.includes(op)) return key;
  }
  if (op.includes('CORE') || op.includes('LIFE')) return 'E1';
  if (op.includes('BP') || op.includes('SYMBOL') || op.includes('COLOR') || op.includes('IMMUN')) return 'E2';
  if (op.includes('PREVENT') || op.includes('REPLACE') || op.includes('REMAIN')) return 'E3';
  if (op.includes('TIMING') || op.includes('TRIGGER') || op.includes('STEP')) return 'E4';
  if (op.includes('TARGET') || op.includes('CHOOSE') || op.includes('SELECT')) return 'E5';
  if (op.includes('BRAVE') || op.includes('MIRAGE') || op.includes('BURST') || op.includes('ADVENT') || op.includes('GRANDWALKER') || op.includes('CONTRACT') || op.includes('ULTIMATE')) return 'E6';
  if (op.includes('KEYWORD')) return 'E7';
  if (op.includes('DECK') || op.includes('HAND') || op.includes('DRAW') || op.includes('DISCARD') || op.includes('MILL') || op.includes('REVEAL') || op.includes('BOUNCE')) return 'E8';
  return 'E5'; // Default to interaction/target
}

// 4. Scan all 514 shards
const shardsDir = path.join(ROOT, 'data', 'ir_shards');
const shardFiles = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json'));

const cardMap = new Map();
const opcodeUsage = new Map(); // opcode -> { cards: Set, clauses: number }

for (const sf of shardFiles) {
  const content = JSON.parse(fs.readFileSync(path.join(shardsDir, sf), 'utf8'));
  const cards = Array.isArray(content) ? content : Object.values(content);

  for (const card of cards) {
    if (!card) continue;
    const cardNum = card.cardNumber || card.id;
    if (!cardNum || cardMap.has(cardNum)) continue;

    const abs = card.abilities || [];
    const abilityAnalysis = [];
    let supportedAbCount = 0;
    let unsupportedAbCount = 0;
    const cardOpcodes = new Set();
    const blockingOpcodes = new Set();
    const blockingTimings = new Set();
    const specialMechanics = new Set();

    // Check special card mechanics
    const typeLower = String(card.type || '').toLowerCase();
    const nameLower = String(card.name || '').toLowerCase();
    if (typeLower.includes('brave')) specialMechanics.add('BRAVE');
    if (typeLower.includes('ultimate')) specialMechanics.add('ULTIMATE');
    if (typeLower.includes('nexus') && (nameLower.includes('grandwalker') || nameLower.includes('god'))) specialMechanics.add('GRANDWALKER');
    if (card.isContractPartner || nameLower.includes('partner') || nameLower.includes('contract')) specialMechanics.add('CONTRACT');

    for (const ab of abs) {
      const timing = ab.header?.timing || 'PASSIVE';
      const clauses = ab.clauses || [];
      const abOpcodes = [];
      let abSupported = true;
      const abMissingOps = [];

      // Check special mechanics in ability
      if (timing === 'BURST_TRIGGER' || ab.header?.flashTiming === 'BURST') specialMechanics.add('BURST');
      if (timing === 'MIRAGE' || ab.header?.isMirage) specialMechanics.add('MIRAGE');
      if (timing === 'ADVENT' || ab.header?.isAdvent) specialMechanics.add('ADVENT');

      for (const cl of clauses) {
        const opName = cl.op?.op;
        if (opName) {
          abOpcodes.push(opName);
          cardOpcodes.add(opName);

          if (!opcodeUsage.has(opName)) {
            opcodeUsage.set(opName, { cards: new Set(), clauses: 0 });
          }
          const rec = opcodeUsage.get(opName);
          rec.cards.add(cardNum);
          rec.clauses++;

          if (!BASE_SUPPORTED_OPS.has(opName)) {
            abSupported = false;
            abMissingOps.push(opName);
            blockingOpcodes.add(opName);
          }
        }
      }

      if (clauses.length === 0) {
        // Empty clause: compiler gap
        abSupported = false;
      }

      if (abSupported && clauses.length > 0) {
        supportedAbCount++;
      } else {
        unsupportedAbCount++;
      }

      abilityAnalysis.push({
        id: ab.physicalId || ab.id,
        semanticId: ab.semanticId,
        timing,
        clauseCount: clauses.length,
        opcodes: abOpcodes,
        isSupported: abSupported && clauses.length > 0,
        missingOpcodes: abMissingOps
      });
    }

    let classification = 'FULLY_SUPPORTED';
    let primaryRootCause = 'NONE';

    if (abs.length === 0) {
      classification = 'VANILLA';
    } else if (unsupportedAbCount === 0) {
      classification = 'FULLY_SUPPORTED';
    } else if (supportedAbCount > 0) {
      classification = 'PARTIALLY_SUPPORTED';
      primaryRootCause = blockingOpcodes.size > 0 ? 'MISSING_OPCODE' : 'UNSUPPORTED_TIMING';
    } else {
      classification = 'UNSUPPORTED';
      if (specialMechanics.size > 0) {
        primaryRootCause = 'COMPLEX_MECHANIC';
      } else if (blockingOpcodes.size > 0) {
        primaryRootCause = 'MISSING_OPCODE';
      } else if (abs.some(a => a.clauses?.length === 0)) {
        primaryRootCause = 'COMPILER_GAP';
      } else {
        primaryRootCause = 'UNSUPPORTED_TIMING';
      }
    }

    cardMap.set(cardNum, {
      cardNumber: cardNum,
      name: card.name,
      type: card.type || 'Spirit',
      color: card.color || (card.colors ? card.colors[0] : 'Red'),
      cost: typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10),
      totalAbilities: abs.length,
      supportedAbilitiesCount: supportedAbCount,
      unsupportedAbilitiesCount: unsupportedAbCount,
      classification,
      primaryRootCause,
      blockingOpcodes: Array.from(blockingOpcodes),
      blockingTimings: Array.from(blockingTimings),
      specialMechanics: Array.from(specialMechanics),
      abilities: abilityAnalysis
    });
  }
}

const allCards = Array.from(cardMap.values());
const fullySupported = allCards.filter(c => c.classification === 'FULLY_SUPPORTED');
const partiallySupported = allCards.filter(c => c.classification === 'PARTIALLY_SUPPORTED');
const vanilla = allCards.filter(c => c.classification === 'VANILLA');
const unsupported = allCards.filter(c => c.classification === 'UNSUPPORTED');

console.log(`Audited Population: ${allCards.length} cards`);
console.log(`- FULLY_SUPPORTED:     ${fullySupported.length}`);
console.log(`- PARTIALLY_SUPPORTED: ${partiallySupported.length}`);
console.log(`- VANILLA:             ${vanilla.length}`);
console.log(`- UNSUPPORTED:         ${unsupported.length}`);

// 5. Opcode Dependency Graph & Impact Simulation
const opcodeDependencyGraph = [];

for (const [opName, usage] of opcodeUsage.entries()) {
  const isBaseSupported = BASE_SUPPORTED_OPS.has(opName);
  const isEngineImplemented = handledOpcodesInEngine.has(opName);
  const isTelemetryVerified = telemetryOpcodes.has(opName);

  let handlerStatus = 'UNIMPLEMENTED';
  if (isEngineImplemented && isTelemetryVerified) handlerStatus = 'VERIFIED';
  else if (isEngineImplemented || isBaseSupported) handlerStatus = 'IMPLEMENTED';
  else handlerStatus = 'UNIMPLEMENTED';

  // Compute unlock impact: how many cards have this opcode as their ONLY blocker?
  const exclusiveUnlockCards = [];
  const partialUnlockCards = [];

  for (const card of allCards) {
    if (card.blockingOpcodes.includes(opName)) {
      if (card.blockingOpcodes.length === 1) {
        exclusiveUnlockCards.push(card.cardNumber);
      } else {
        partialUnlockCards.push(card.cardNumber);
      }
    }
  }

  const priorityScore = (exclusiveUnlockCards.length * 10) + (partialUnlockCards.length * 1);
  const mechanicGroup = assignMechanicGroup(opName);

  opcodeDependencyGraph.push({
    opcode: opName,
    mechanicGroup,
    handlerStatus,
    telemetryVerified: isTelemetryVerified,
    totalCardsUsing: usage.cards.size,
    totalClausesUsing: usage.clauses,
    exclusiveUnlockCardsCount: exclusiveUnlockCards.length,
    partialUnlockCardsCount: partialUnlockCards.length,
    exclusiveUnlockCards: exclusiveUnlockCards.slice(0, 50),
    priorityScore
  });
}

opcodeDependencyGraph.sort((a, b) => b.priorityScore - a.priorityScore || b.totalCardsUsing - a.totalCardsUsing);

// 6. Build Root Cause Matrix
const rootCauseCounts = {
  PARTIALLY_SUPPORTED: {},
  UNSUPPORTED: {}
};

for (const c of partiallySupported) {
  rootCauseCounts.PARTIALLY_SUPPORTED[c.primaryRootCause] = (rootCauseCounts.PARTIALLY_SUPPORTED[c.primaryRootCause] || 0) + 1;
}
for (const c of unsupported) {
  rootCauseCounts.UNSUPPORTED[c.primaryRootCause] = (rootCauseCounts.UNSUPPORTED[c.primaryRootCause] || 0) + 1;
}

const cardSupportRootCauseMatrix = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalCards: allCards.length,
    breakdown: {
      FULLY_SUPPORTED: fullySupported.length,
      PARTIALLY_SUPPORTED: partiallySupported.length,
      VANILLA: vanilla.length,
      UNSUPPORTED: unsupported.length
    }
  },
  rootCauses: {
    partiallySupported: rootCauseCounts.PARTIALLY_SUPPORTED,
    unsupported: rootCauseCounts.UNSUPPORTED
  },
  topBlockingOpcodes: opcodeDependencyGraph.filter(o => o.handlerStatus === 'UNIMPLEMENTED' || o.exclusiveUnlockCardsCount > 0).slice(0, 25)
};

// 7. Diagnostics files
const unsupportedDiagnostics = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalUnsupportedCards: unsupported.length
  },
  cards: unsupported.map(c => ({
    cardNumber: c.cardNumber,
    name: c.name,
    type: c.type,
    color: c.color,
    cost: c.cost,
    primaryRootCause: c.primaryRootCause,
    blockingOpcodes: c.blockingOpcodes,
    specialMechanics: c.specialMechanics,
    abilitiesCount: c.totalAbilities
  }))
};

const partialDiagnostics = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalPartiallySupportedCards: partiallySupported.length
  },
  cards: partiallySupported.map(c => ({
    cardNumber: c.cardNumber,
    name: c.name,
    type: c.type,
    color: c.color,
    cost: c.cost,
    totalAbilities: c.totalAbilities,
    supportedAbilitiesCount: c.supportedAbilitiesCount,
    unsupportedAbilitiesCount: c.unsupportedAbilitiesCount,
    blockingOpcodes: c.blockingOpcodes,
    specialMechanics: c.specialMechanics
  }))
};

// 8. Shared Mechanic Grouping & Implementation Priority Backlog (Work Package E)
const backlogTasks = [];

for (const [groupId, group] of Object.entries(MECHANIC_GROUPS)) {
  const groupOps = opcodeDependencyGraph.filter(o => o.mechanicGroup === groupId);
  const totalCardsInGroup = new Set();
  let exclusiveFullUnlocks = 0;
  let partialUnlocks = 0;

  for (const op of groupOps) {
    exclusiveFullUnlocks += op.exclusiveUnlockCardsCount;
    partialUnlocks += op.partialUnlockCardsCount;
    const usage = opcodeUsage.get(op.opcode);
    if (usage) {
      for (const cardNum of usage.cards) totalCardsInGroup.add(cardNum);
    }
  }

  backlogTasks.push({
    taskId: `TASK-${groupId}`,
    mechanicGroupId: groupId,
    name: group.name,
    description: group.description,
    totalOpcodes: groupOps.length,
    opcodes: groupOps.map(o => o.opcode),
    affectedCardCount: totalCardsInGroup.size,
    estimatedFullUnlocks: exclusiveFullUnlocks,
    estimatedPartialUnlocks: partialUnlocks,
    implementationEffort: totalCardsInGroup.size > 2000 ? 'HIGH' : (totalCardsInGroup.size > 800 ? 'MEDIUM' : 'LOW'),
    priorityRank: 0
  });
}

// Rank backlog tasks by total card count impact (affected cards)
backlogTasks.sort((a, b) => b.affectedCardCount - a.affectedCardCount);
backlogTasks.forEach((t, i) => t.priorityRank = i + 1);

const implementationBacklog = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalMechanicClusters: backlogTasks.length,
    totalCardsGoverned: allCards.length
  },
  backlog: backlogTasks
};

// Shared mechanic dependency graph (E1 -> E8 dependencies)
const sharedMechanicDependencyGraph = {
  metadata: {
    generatedAt: new Date().toISOString(),
    architecture: 'Layered Engine Primitives & Rules Orchestration'
  },
  nodes: Object.entries(MECHANIC_GROUPS).map(([id, g]) => ({
    id,
    name: g.name,
    description: g.description
  })),
  dependencies: [
    { from: 'E1', to: 'E2', reason: 'Continuous BP/level computation requires active cores on stacks' },
    { from: 'E1', to: 'E5', reason: 'Candidate filtering often evaluates core counts in reserve/trash' },
    { from: 'E2', to: 'E3', reason: 'Replacement effects evaluate protection modifiers and effective BP' },
    { from: 'E2', to: 'E4', reason: 'Timing triggers depend on active abilities enabled at specific levels' },
    { from: 'E4', to: 'E5', reason: 'Triggered effects resolve target selections through interaction prompt' },
    { from: 'E5', to: 'E8', reason: 'Target selection drives card movement, bounce destinations, and hand swaps' },
    { from: 'E1', to: 'E6', reason: 'Special card types (Brave, Mirage, Grandwalker, Contract) require specialized core and soul core routing' },
    { from: 'E2', to: 'E7', reason: 'Keyword abilities resolve continuous rules and combat modifications' }
  ]
};

// Write output JSON files
fs.writeFileSync(path.join(OUT_DIR, 'card_support_root_cause_matrix.json'), JSON.stringify(cardSupportRootCauseMatrix, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'opcode_card_dependency_graph.json'), JSON.stringify(opcodeDependencyGraph, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'unsupported_card_diagnostics.json'), JSON.stringify(unsupportedDiagnostics, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'partial_card_diagnostics.json'), JSON.stringify(partialDiagnostics, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'implementation_priority_backlog.json'), JSON.stringify(implementationBacklog, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'shared_mechanic_dependency_graph.json'), JSON.stringify(sharedMechanicDependencyGraph, null, 2));

console.log('Saved JSON deliverables for Work Packages D and E.');
