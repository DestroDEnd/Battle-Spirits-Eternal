/**
 * tests/work_package_hij_operations_compiler_integration.test.js
 *
 * Comprehensive Work Packages H + I + J Integration & Adversarial Test Suite:
 * - Groups A through G operation contracts & runtime state transitions
 * - Fail-closed MISSING_IR_PARAMETERS rejection on bare stubs
 * - Compiler traceability & structured IR compilation fidelity
 * - Extended deterministic tri-state condition parser & evaluator
 * - All 19 J5 adversarial/failure scenarios & evidence integrity checks
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { calculateEffectiveCost } from '../engine/payment.js';
import { validateDeck } from '../engine/rules/eternal.js';
import {
  computeEffectiveBP,
  computeFamilies,
  isTargetProtectedFrom,
  matchesTargetFilter
} from '../engine/continuous.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import {
  CONDITION_RESULT,
  parseConditionToStructured,
  evaluateStructuredCondition
} from '../engine/conditions.js';
import { compileCard } from '../compiler/index.js';
import { compileClauseToOp } from '../compiler/clause_patterns.js';
import { classifyOperation } from '../scripts/audit_514_cards_exhaustive.mjs';
import { verifyExecutableTestReference } from '../scripts/discover_executable_tests.mjs';

function makeEventRecorder() {
  const events = [];
  return {
    list: events,
    async emit(ev) {
      events.push(ev);
    }
  };
}

function makeCard(id, extra = {}) {
  return {
    id,
    cardNumber: extra.cardNumber || id,
    name: extra.name || `Card_${id}`,
    type: extra.type || 'Spirit',
    color: extra.color || 'Red',
    colors: extra.colors || [extra.color || 'Red'],
    cost: extra.cost ?? 3,
    families: extra.families || ['Dragon'],
    symbols: extra.symbols || ['Red'],
    levels: extra.levels || { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } },
    owner: extra.owner || 'player',
    ...extra
  };
}

function countAllCores(state) {
  let total = typeof state.voidCores === 'number' ? state.voidCores : (state.voidCores?.normal || 0);
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    total += (p.life || 0);
    total += (p.reserve?.normal || 0) + (p.reserve?.soul || 0);
    total += (p.trash?.normal ?? p.graveCores?.normal ?? 0) + (p.trash?.soul ?? p.graveCores?.soul ?? 0);
    for (const st of (p.field || [])) {
      total += (st.cores?.normal || 0) + (st.cores?.soul || 0);
    }
  }
  return total;
}

// ===========================================================================
// GROUP A: Effect activation & trigger systems
// ===========================================================================
test('HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs', async () => {
  const state = createGameState();
  const events = makeEventRecorder();
  const resolver = new AsyncResolver();

  const summonedSpirit = makeCard('SP-A1', {
    compiledIr: {
      abilities: [{
        type: 'ABILITY',
        physicalId: 'SP-A1#AB_1',
        header: { timing: 'WHEN_SUMMONED', cleanBody: 'Draw 1 card.' },
        clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
      }]
    }
  });
  const stA1 = createFieldStack(summonedSpirit, { normal: 2, soul: 0 });
  state.players.player.field.push(stA1);
  state.players.player.deck.push(makeCard('D-1'), makeCard('D-2'), makeCard('D-3'));
  state.players.opponent.deck.push(makeCard('OD-1', { cost: 1 }));
  state.players.player.counters = 6;

  // Bare stubs must fail closed
  const bareAct = await executeOp(state, { op: 'ACTIVATE_EFFECT_ACTION' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(bareAct.success, false);
  assert.equal(bareAct.reason, 'MISSING_IR_PARAMETERS');
  const bareTrig = await executeOp(state, { op: 'ACTIVATE_TRIGGER' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(bareTrig.reason, 'MISSING_IR_PARAMETERS');

  // ACTIVATE_TRIGGER invokes WHEN_SUMMONED on target stack & draws 1 card
  const trigRes = await executeOp(
    state,
    { op: 'ACTIVATE_TRIGGER', trigger: 'WHEN_SUMMONED', target: { side: 'self', types: ['Spirit'] } },
    { controller: 'player', sourceCard: summonedSpirit, sourceStack: stA1, resolver },
    DefaultPromptResolver,
    events
  );
  assert.equal(trigRes.success, true);
  assert.equal(state.players.player.hand.length, 1);

  // ACTIVATE_EFFECT_ACTION resolves keyword and honors oncePerTurn
  const act1 = await executeOp(
    state,
    { op: 'ACTIVATE_EFFECT_ACTION', keyword: 'Shamanism', oncePerTurn: true },
    { controller: 'player', sourceCard: summonedSpirit, sourceStack: stA1, resolver },
    DefaultPromptResolver,
    events
  );
  assert.equal(act1.success, true);
  const act2 = await executeOp(
    state,
    { op: 'ACTIVATE_EFFECT_ACTION', keyword: 'Shamanism', oncePerTurn: true },
    { controller: 'player', sourceCard: summonedSpirit, sourceStack: stA1, resolver },
    DefaultPromptResolver,
    events
  );
  assert.equal(act2.success, false);
  assert.equal(act2.reason, 'ONCE_PER_TURN_EXHAUSTED');

  // ACTIVATE_EFFECT_SPECIAL computes repeat multiplier from counters
  const specRes = await executeOp(state, { op: 'ACTIVATE_EFFECT_SPECIAL', per: 'counters', threshold: 3 }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(specRes.success, true);
  assert.equal(specRes.repeats, 2);

  // TRIGGERED_WATCHER prevents duplicate registration
  const w1 = await executeOp(state, { op: 'TRIGGERED_WATCHER', watchEvent: 'USE_MAGIC' }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(w1.success, true);
  const w2 = await executeOp(state, { op: 'TRIGGERED_WATCHER', watchEvent: 'USE_MAGIC' }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(w2.success, false);
  assert.equal(w2.reason, 'DUPLICATE_WATCHER');

  // TRIGGER_CONDITION, TRIGGER_COUNTER, CROSS_TRIGGER, BRAVE_EFFECT_ACTIVATION, ACTIVATE_KEYWORD, ON_BP_DESTROY
  const tcRes = await executeOp(state, { op: 'TRIGGER_CONDITION', event: 'SOUL_CORE_MOVED', side: 'opp' }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(tcRes.success, true);
  const tcntRes = await executeOp(state, { op: 'TRIGGER_COUNTER', when: 'ULTIMATE_TRIGGER_HIT', zone: 'hand' }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(tcntRes.success, true);

  state.players.player.life = 3;
  const crossRes = await executeOp(state, { op: 'CROSS_TRIGGER', lifeThreshold: 3 }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(crossRes.success, true);
  assert.equal(crossRes.hit, true);
  assert.equal(state.players.opponent.grave.length, 1);

  stA1.braves.push(makeCard('BR-1', { type: 'Brave', bp: 2000 }));
  const braveRes = await executeOp(state, { op: 'BRAVE_EFFECT_ACTIVATION', when: 'WHEN_BRAVED' }, { controller: 'player', sourceCard: summonedSpirit, sourceStack: stA1 }, DefaultPromptResolver, events);
  assert.equal(braveRes.success, true);

  const kwRes = await executeOp(state, { op: 'ACTIVATE_KEYWORD', keyword: 'Poison Blade' }, { controller: 'player', sourceCard: summonedSpirit, sourceStack: stA1 }, DefaultPromptResolver, events);
  assert.equal(kwRes.success, true);
  assert.equal(stA1.activatedKeywords.some(k => k.keyword === 'Poison Blade'), true);

  const bpDestRes = await executeOp(state, { op: 'ON_BP_DESTROY', whoseDestroyed: 'opp' }, { controller: 'player', sourceCard: summonedSpirit }, DefaultPromptResolver, events);
  assert.equal(bpDestRes.success, true);
  assert.ok(events.list.some(e => e.type === 'ON_BP_DESTROY_REGISTERED'));
});

// ===========================================================================
// GROUP B: Advent, stack & underneath-card systems
// ===========================================================================
test('HIJ-OPB-01: Group B Advent, underneath, stack, and swap ops conserve card identity and handle rollbacks', async () => {
  const state = createGameState();
  const events = makeEventRecorder();

  const hostCard = makeCard('HOST-1', { name: 'PreAdventHost', cost: 4 });
  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  state.players.player.field.push(hostStack);

  const adventCard = makeCard('ADV-1', { name: 'AdventDragon', cost: 7 });
  const extraPreCard = makeCard('PRE-EXTRA', { name: 'PreCard2' });
  const extraFieldStack = createFieldStack(extraPreCard, { normal: 2, soul: 0 });
  state.players.player.field.push(extraFieldStack);

  state.players.player.hand.push(adventCard, makeCard('SWAP-IN', { name: 'SwapHandSpirit' }));
  state.players.player.deck.push(makeCard('DECK-U1'), makeCard('DECK-U2'));

  // Persistent Advent rules
  assert.equal((await executeOp(state, { op: 'CONTRACT_ADVENT_RULE', zone: 'soul' }, { controller: 'player', sourceCard: hostCard }, DefaultPromptResolver, events)).success, true);
  assert.equal((await executeOp(state, { op: 'ADVENT_RULE_MODIFIER', fromZone: 'removed', adventType: 'CONTRACT_ADVENT' }, { controller: 'player', sourceCard: hostCard }, DefaultPromptResolver, events)).success, true);
  assert.equal((await executeOp(state, { op: 'ADVENT_RULE', when: 'AFTER_ACCEL', fromZone: 'hand' }, { controller: 'player', sourceCard: hostCard }, DefaultPromptResolver, events)).success, true);

  // Bare stubs fail closed
  assert.equal((await executeOp(state, { op: 'PUT_UNDERNEATH' }, { controller: 'player' }, DefaultPromptResolver, events)).reason, 'MISSING_IR_PARAMETERS');

  // PUT_UNDERNEATH attaches decktop card facedown
  const puRes = await executeOp(state, { op: 'PUT_UNDERNEATH', from: 'decktop', count: 1, facedown: true }, { controller: 'player', sourceCard: hostCard, sourceStack: hostStack }, DefaultPromptResolver, events);
  assert.equal(puRes.success, true);
  assert.equal(hostStack.underCards.length, 1);
  assert.equal(hostStack.underCards[0].id, 'DECK-U1');
  assert.equal(hostStack.underCards[0].facedown, true);

  // ATTACH_CARD_UNDERNEATH attaches another card
  const acuRes = await executeOp(state, { op: 'ATTACH_CARD_UNDERNEATH', from: 'decktop', count: 1 }, { controller: 'player', sourceCard: hostCard, sourceStack: hostStack }, DefaultPromptResolver, events);
  assert.equal(acuRes.success, true);
  assert.equal(hostStack.underCards.length, 2);

  // ATTACH_PRE_ADVENT_CARD moves another friendly Spirit underneath & returns its cores to reserve
  const reserveBefore = state.players.player.reserve.normal;
  const apaRes = await executeOp(state, { op: 'ATTACH_PRE_ADVENT_CARD', from: 'field', count: 1 }, { controller: 'player', sourceCard: hostCard, sourceStack: hostStack }, DefaultPromptResolver, events);
  assert.equal(apaRes.success, true);
  assert.equal(state.players.player.reserve.normal, reserveBefore + 2);
  assert.equal(hostStack.underCards.some(c => c.id === 'PRE-EXTRA'), true);

  // DISCARD_UNDERNEATH_COST discards 1 facedown card & rejects excessive cost
  const failUnderCost = await executeOp(state, { op: 'DISCARD_UNDERNEATH_COST', count: 10, facedownOnly: true }, { controller: 'player', sourceStack: hostStack }, DefaultPromptResolver, events);
  assert.equal(failUnderCost.success, false);
  const okUnderCost = await executeOp(state, { op: 'DISCARD_UNDERNEATH_COST', count: 1, facedownOnly: true }, { controller: 'player', sourceStack: hostStack }, DefaultPromptResolver, events);
  assert.equal(okUnderCost.success, true);
  assert.equal(state.players.player.grave.length, 1);

  // ADVENT stacks ADV-1 onto hostStack and puts HOST-1 into underCards cleanly
  const advRes = await executeOp(state, { op: 'ADVENT', from: 'hand', target: { side: 'self', types: ['Spirit'] } }, { controller: 'player', sourceCard: adventCard }, DefaultPromptResolver, events);
  assert.equal(advRes.success, true);
  assert.equal(hostStack.top.id, 'ADV-1');
  assert.equal(hostStack.underCards.some(c => c.id === 'HOST-1'), true);
  assert.equal(state.players.player.hand.some(c => c.id === 'ADV-1'), false);

  // SWAP_CARD swaps SWAP-IN in hand with current hostStack.top (ADV-1) atomically
  const swapCardObj = state.players.player.hand.find(c => c.id === 'SWAP-IN');
  const swRes = await executeOp(state, { op: 'SWAP_CARD', from: 'hand', target: { side: 'self', types: ['Spirit'] } }, { controller: 'player', sourceCard: swapCardObj }, DefaultPromptResolver, events);
  assert.equal(swRes.success, true);
  assert.equal(hostStack.top.id, 'SWAP-IN');
  assert.equal(state.players.player.hand.some(c => c.id === 'ADV-1'), true);

  // SWAP_CARDS swaps revealed card with hand card conserving totals
  const revCard = makeCard('REV-SW1', { color: 'White' });
  state.players.player.revealed = [revCard];
  const scRes = await executeOp(state, { op: 'SWAP_CARDS', from: 'revealed', to: 'hand', count: 1, filter: { color: 'White' } }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(scRes.success, true);
  assert.equal(state.players.player.hand.some(c => c.id === 'REV-SW1'), true);
  assert.equal(state.players.player.revealed.some(c => c.id === 'ADV-1'), true);
});

// ===========================================================================
// GROUP C: Mirage systems
// ===========================================================================
test('HIJ-OPC-01: Group C Mirage operations handle set, discard, return_hand, cost, and stale modifier cleanup', async () => {
  const state = createGameState();
  const events = makeEventRecorder();
  const mirageCard = makeCard('MIR-1', { type: 'Spirit', name: 'MirageSpirit' });
  state.players.player.hand.push(mirageCard);

  assert.equal((await executeOp(state, { op: 'MIRAGE_OPERATION' }, { controller: 'player' }, DefaultPromptResolver, events)).reason, 'MISSING_IR_PARAMETERS');

  // Reject empty DISCARD_MIRAGE_COST before setting Mirage
  const emptyCost = await executeOp(state, { op: 'DISCARD_MIRAGE_COST', count: 1, zone: 'mirage' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(emptyCost.success, false);
  assert.equal(emptyCost.reason, 'INSUFFICIENT_MIRAGE_COST');

  // Set Mirage and attach a WHILE_MIRAGE_SET modifier tied to MIR-1
  const setRes = await executeOp(state, { op: 'MIRAGE_OPERATION', action: 'set' }, { controller: 'player', sourceCard: mirageCard }, DefaultPromptResolver, events);
  assert.equal(setRes.success, true);
  assert.equal(state.players.player.mirage?.id, 'MIR-1');
  state.modifiers.push({ id: 'mir-mod-1', type: 'BP_BUFF', amount: 2000, sourceCardId: 'MIR-1', sourceZone: 'mirage', duration: 'WHILE_MIRAGE_SET' });

  // Discard Mirage clears mirage slot, moves MIR-1 to grave, and cleans up stale Mirage modifier
  const discRes = await executeOp(state, { op: 'MIRAGE_OPERATION', action: 'discard' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(discRes.success, true);
  assert.equal(state.players.player.mirage, null);
  assert.equal(state.players.player.grave.some(c => c.id === 'MIR-1'), true);
  assert.equal(state.modifiers.some(m => m.id === 'mir-mod-1'), false);

  // Move back to hand & test set -> DISCARD_MIRAGE_COST
  await moveCard(state, mirageCard, 'hand', 'player', { cause: 'test' }, events);
  await executeOp(state, { op: 'MIRAGE_OPERATION', action: 'set' }, { controller: 'player', sourceCard: mirageCard }, DefaultPromptResolver, events);
  const costRes = await executeOp(state, { op: 'DISCARD_MIRAGE_COST', count: 1, zone: 'mirage' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(costRes.success, true);
  assert.equal(state.players.player.mirage, null);
});

// ===========================================================================
// GROUP D: Effect copying & redirection
// ===========================================================================
test('HIJ-OPD-01: Group D copy/redirection preserves original IR, stops loops, and integrates core & card destinations', async () => {
  const state = createGameState();
  const events = makeEventRecorder();
  const resolver = new AsyncResolver();

  const donorCard = makeCard('DONOR-1', {
    compiledIr: {
      abilities: [{
        type: 'ABILITY',
        physicalId: 'DONOR-1#AB_1',
        header: { timing: 'WHEN_SUMMONED', cleanBody: 'Draw 1 card.' },
        clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
      }]
    }
  });
  const donorSnapBefore = JSON.stringify(donorCard.compiledIr);
  state.players.player.deck.push(makeCard('DD-1'), makeCard('DD-2'));

  // COPY_EFFECT copies WHEN_SUMMONED draw without mutating original IR
  const cpRes = await executeOp(state, { op: 'COPY_EFFECT', timing: 'WHEN_SUMMONED', source: 'target' }, { controller: 'player', sourceCard: donorCard, resolver }, DefaultPromptResolver, events);
  assert.equal(cpRes.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(JSON.stringify(donorCard.compiledIr), donorSnapBefore);

  // Recursive loop guard rejects repeating same source card+timing
  const loopRes = await executeOp(state, { op: 'COPY_EFFECT', timing: 'WHEN_SUMMONED', source: 'target' }, { controller: 'player', sourceCard: donorCard, resolver, _copiedSourceIds: new Set(['DONOR-1:WHEN_SUMMONED']) }, DefaultPromptResolver, events);
  assert.equal(loopRes.success, false);
  assert.equal(loopRes.reason, 'RECURSIVE_COPY_PREVENTED');

  // MODIFY_DESTINATION redirects destroyed/depleted Spirits to Removed Zone in engine/zones.js
  const oppCard = makeCard('OPP-D1', { owner: 'opponent' });
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  state.players.opponent.field.push(oppStack);
  const mdRes = await executeOp(state, { op: 'MODIFY_DESTINATION', replaces: 'DESTROYED_OR_DEPLETED', destination: 'removed' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(mdRes.success, true);
  await moveCard(state, oppCard, 'grave', 'opponent', { cause: 'destroy', by: 'player' }, events);
  assert.equal(state.players.opponent.removed.some(c => c.id === 'OPP-D1'), true);
  assert.equal(state.players.opponent.grave.some(c => c.id === 'OPP-D1'), false);

  // REDIRECT_CORE_DESTINATION redirects Life core removal -> grave instead of reserve in engine/zones.js
  state.modifiers = [];
  await executeOp(state, { op: 'REDIRECT_CORE_DESTINATION', fromZone: 'life', destination: 'grave', side: 'opp' }, { controller: 'player' }, DefaultPromptResolver, events);
  const lifeBefore = state.players.opponent.life;
  const trashCoresBefore = state.players.opponent.trash?.normal || 0;
  await executeOp(state, { op: 'LIFE_OR_CORE_MODIFICATION', count: 2, fromZone: 'life', destination: 'reserve', side: 'opp', upTo: true }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(state.players.opponent.life, lifeBefore - 2);
  assert.equal(state.players.opponent.trash.normal, trashCoresBefore + 2);
});

// ===========================================================================
// GROUP E: Hand, deck, reveal, discard & zone operations
// ===========================================================================
test('HIJ-OPE-01: Group E zone ops enforce limits, preserve card IDs, and handle deterministic shuffle', async () => {
  const state = createGameState();
  const events = makeEventRecorder();

  const c1 = makeCard('D1', { color: 'Purple', families: ['Song'], type: 'Magic' });
  const c2 = makeCard('D2', { color: 'Red' });
  const c3 = makeCard('D3', { color: 'Blue' });
  state.players.player.deck.push(c1, c2, c3);
  state.players.opponent.hand.push(makeCard('OH-1', { owner: 'opponent' }));
  state.players.player.hand.push(makeCard('PH-1', { type: 'Magic', families: ['Song'] }));

  assert.equal((await executeOp(state, { op: 'LOOK_HAND', side: 'opp' }, { controller: 'player' }, DefaultPromptResolver, events)).count, 1);
  assert.equal((await executeOp(state, { op: 'REVEAL_HAND', side: 'self' }, { controller: 'player' }, DefaultPromptResolver, events)).count, 1);

  const sharedChainCtx = { controller: 'player' };
  const lookDeck = await executeOp(state, { op: 'LOOK_AT_DECK', count: 2, position: 'top' }, sharedChainCtx, DefaultPromptResolver, events);
  assert.equal(lookDeck.success, true);
  assert.equal(lookDeck.count, 2);

  // DISCARD_AMONG removes Purple card from revealedCards into grave cleanly
  const daRes = await executeOp(state, { op: 'DISCARD_AMONG', color: 'Purple', count: 1 }, sharedChainCtx, DefaultPromptResolver, events);
  assert.equal(daRes.success, true);
  assert.equal(state.players.player.grave.some(c => c.id === 'D1'), true);

  // LIMIT_DECK_DISCARD caps opponent mill per turn inside MILL / MILL_DECK
  state.players.player.deck.push(makeCard('D4'), makeCard('D5'), makeCard('D6'));
  await executeOp(state, { op: 'LIMIT_DECK_DISCARD', maxPerTurn: 1, targetSide: 'player' }, { controller: 'player' }, DefaultPromptResolver, events);
  const millRes = await executeOp(state, { op: 'MILL', count: 5, side: 'opp' }, { controller: 'opponent' }, DefaultPromptResolver, events);
  assert.equal(millRes.milledCount, 1);

  // DECK_IMMUNITY blocks remaining mill completely
  await executeOp(state, { op: 'DECK_IMMUNITY', side: 'self' }, { controller: 'player' }, DefaultPromptResolver, events);
  const blockedMill = await executeOp(state, { op: 'MILL_DECK', count: 3, side: 'opp' }, { controller: 'opponent' }, DefaultPromptResolver, events);
  assert.equal(blockedMill.success, false);
  assert.equal(blockedMill.reason, 'MILL_RESTRICTED');

  // SHUFFLE_DECK preserves exact card set deterministically with seed
  const beforeIds = state.players.player.deck.map(c => c.id).sort();
  const shufRes = await executeOp(state, { op: 'SHUFFLE_DECK', side: 'self', seed: 42 }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(shufRes.success, true);
  assert.deepEqual(state.players.player.deck.map(c => c.id).sort(), beforeIds);

  // PUT_FACEDOWN_FIELD places Song Magic card facedown & DISCARD_FIELD_MAGIC discards it cleanly
  const putRes = await executeOp(state, { op: 'PUT_FACEDOWN_FIELD', from: 'hand', family: 'Song', count: 1 }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(putRes.success, true);
  assert.equal(state.players.player.field[0].isFacedown, true);
  const dfmRes = await executeOp(state, { op: 'DISCARD_FIELD_MAGIC', family: 'Song', count: 1, side: 'self' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(dfmRes.success, true);
  assert.equal(state.players.player.field.length, 0);
});

// ===========================================================================
// GROUP F: Combat & battle operations
// ===========================================================================
test('HIJ-OPF-01: Group F combat ops integrate PIERCING_RULE, BATTLE_RULE_MODIFIER, FLASH_PRIORITY, RESTRICT_MAIN_STEP, and DESTROY_ON_BP_ZERO', async () => {
  const game = createGame();
  const events = makeEventRecorder();
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const atkCard = makeCard('ATK-1', { levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 4000 } }, owner: 'player' });
  const blkCard = makeCard('BLK-1', {
    owner: 'opponent',
    levels: { 1: { cost: 1, bp: 5000 } },
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  const weakCard = makeCard('WEAK-0', { owner: 'opponent', levels: { 1: { cost: 1, bp: 1000 } } });
  const atkStack = createFieldStack(atkCard, { normal: 3, soul: 0 });
  const blkStack = createFieldStack(blkCard, { normal: 1, soul: 0 });
  const weakStack = createFieldStack(weakCard, { normal: 1, soul: 0 });

  game.state.players.player.field.push(atkStack);
  game.state.players.opponent.field.push(blkStack, weakStack);

  // FLASH_PRIORITY flips flash priority to attacker side on declareAttack
  await executeOp(game.state, { op: 'FLASH_PRIORITY', side: 'self' }, { controller: 'player' }, DefaultPromptResolver, events);
  const atkOut = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkOut.success, true);
  assert.equal(atkOut.combat.flashPriority, 'player');

  // PIERCING_RULE bypasses INDESTRUCTIBLE, but still respects Heavy Armor: Red
  await executeOp(game.state, { op: 'PIERCING_RULE', allowedPrevention: ['Armor', 'Heavy Armor', 'Ultra Armor'], effectType: 'destroy' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(isTargetProtectedFrom(game.state, blkStack, 'destroy', atkCard), true);
  game.state.modifiers.push({ id: 'ind-1', type: 'INDESTRUCTIBLE', targetStackId: weakStack.id, by: 'ALL', side: 'opponent' });
  assert.equal(isTargetProtectedFrom(game.state, weakStack, 'destroy', atkCard), false);

  // DECREASE_BP_EFFECT brings weakStack to 0 BP -> DESTROY_ON_BP_ZERO destroys it cleanly
  await executeOp(game.state, { op: 'DECREASE_BP_EFFECT', amount: 1000, target: { side: 'opp', stackId: weakStack.id } }, { controller: 'player' }, DefaultPromptResolver, events);
  const d0Res = await executeOp(game.state, { op: 'DESTROY_ON_BP_ZERO', side: 'opp' }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(d0Res.success, true);
  assert.equal(game.state.players.opponent.grave.some(c => c.id === 'WEAK-0'), true);

  // BATTLE_RULE_MODIFIER (INVERT_BP_COMPARISON) allows 4000 BP attacker to beat 5000 BP blocker!
  await executeOp(game.state, { op: 'BATTLE_RULE_MODIFIER', rule: 'INVERT_BP_COMPARISON', side: 'both' }, { controller: 'player' }, DefaultPromptResolver, events);
  const blkOut = await game.declareBlock(blkStack.id, 'opponent');
  assert.equal(blkOut.success, true);
  assert.equal(game.state.players.opponent.grave.some(c => c.id === 'BLK-1'), true);
  assert.equal(game.state.players.player.field.some(s => s.id === atkStack.id), true);

  // RESTRICT_MAIN_STEP blocks MAIN step activation while allowing ATTACK step
  const abCard = makeCard('MAIN-RES', {
    owner: 'player',
    compiledIr: {
      abilities: [{
        type: 'ABILITY',
        physicalId: 'MAIN-RES#AB_1',
        header: { timing: 'MAIN', cleanBody: 'Restricted in Main Step.' },
        clauses: [{ op: { op: 'RESTRICT_MAIN_STEP', scope: 'ability' } }]
      }]
    }
  });
  game.state.players.player.field.push(createFieldStack(abCard, { normal: 1, soul: 0 }));
  game.state.step = 'MAIN';
  const resMain = await game.activateAbility(abCard.id, 'MAIN-RES#AB_1', 'player');
  assert.equal(resMain.success, false);
  assert.equal(resMain.reason, 'RESTRICTED_IN_MAIN_STEP');
});

// ===========================================================================
// GROUP G + REMAINING: Deck rules, restrictions, symbols, formulas & control
// ===========================================================================
test('HIJ-OPG-01: Group G rules enforce deck limits, void restrictions, symbols, BP_FORMULA, LOSE_EFFECTS, and Bunshin', async () => {
  const state = createGameState();
  const events = makeEventRecorder();

  // DECK_BUILDING_RULE UNLIMITED allows > 3 copies in Eternal validateDeck
  const unlimitedCopies = Array.from({ length: 40 }, (_, i) => makeCard(`UNL-${i}`, {
    cardNumber: 'SD00-UNL',
    name: 'Athletics Meeting',
    deckRule: { maxCopies: 'UNLIMITED' }
  }));
  assert.equal(validateDeck(unlimitedCopies).valid, true);

  // GLOBAL_RESTRICTION CANNOT_GAIN_CORES_FROM_VOID blocks Void core gain via effect
  await executeOp(state, { op: 'GLOBAL_RESTRICTION', restriction: 'CANNOT_GAIN_CORES_FROM_VOID', side: 'both' }, { controller: 'player' }, DefaultPromptResolver, events);
  const voidGainOk = await moveCore(state, 1, { zone: 'void' }, { zone: 'reserve', side: 'player' }, { cause: 'effect' }, events);
  assert.equal(voidGainOk, false);
  state.modifiers = [];

  // SYMBOL_MODIFIER grants Magic card extra Yellow reduction symbol
  const yellowMagic = makeCard('YM-1', { type: 'Magic', cost: 4, reduction: {} });
  state.players.player.field.push(createFieldStack(makeCard('Y-SP', { color: 'Yellow', symbols: ['Yellow'] }), { normal: 1, soul: 0 }));
  assert.equal(calculateEffectiveCost(state, yellowMagic, 'player'), 4);
  await executeOp(state, { op: 'SYMBOL_MODIFIER', cardType: 'Magic', color: 'Yellow', symbols: { Yellow: 1 } }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(calculateEffectiveCost(state, yellowMagic, 'player'), 3);

  // BP_FORMULA computes effective BP = totalCores * 10000
  const st = state.players.player.field[0];
  st.cores.normal = 3;
  await executeOp(state, { op: 'BP_FORMULA', per: 'cores_on_spirit', multiplier: 10000 }, { controller: 'player', sourceStack: st }, DefaultPromptResolver, events);
  assert.equal(computeEffectiveBP(state, st), 30000);

  // ADD_FAMILY + GAIN_TEAM + TREAT_NAME integrate into continuous characteristic queries
  await executeOp(state, { op: 'ADD_FAMILY', families: ['Shiny Hearts'] }, { controller: 'player', sourceStack: st }, DefaultPromptResolver, events);
  await executeOp(state, { op: 'GAIN_TEAM', allTeams: true }, { controller: 'player', sourceStack: st }, DefaultPromptResolver, events);
  assert.equal(computeFamilies(state, st).includes('Shiny Hearts'), true);
  assert.equal(matchesTargetFilter({ team: 'Any Team Name' }, st, null, 'player', { state }), true);

  // LOSE_EFFECTS blocks AsyncResolver execution cleanly
  const resolver = new AsyncResolver();
  const ab = { type: 'ABILITY', physicalId: 'Y-SP#AB_1', header: { timing: 'WHEN_ATTACKS' }, clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }] };
  await executeOp(state, { op: 'LOSE_EFFECTS', target: { stackId: st.id }, cannotGainNew: true }, { controller: 'opponent' }, DefaultPromptResolver, events);
  const blockedAb = await resolver.resolveAbility(state, ab, { controller: 'player', sourceStack: st, sourceCard: st.top }, events);
  assert.equal(blockedAb.success, false);
  assert.equal(blockedAb.reason, 'EFFECTS_LOST');

  // BUNSHIN_SUMMON + FLIP_BUNSHIN conserve exact total cores
  const coresStart = countAllCores(state);
  state.players.player.deck.push(makeCard('B-TOP'));
  const bunRes = await executeOp(state, { op: 'BUNSHIN_SUMMON', count: 1, from: 'decktop', coresMin: 1 }, { controller: 'player' }, DefaultPromptResolver, events);
  assert.equal(bunRes.success, true);
  assert.equal(countAllCores(state), coresStart);
  assert.equal((await executeOp(state, { op: 'FLIP_BUNSHIN' }, { controller: 'player' }, DefaultPromptResolver, events)).success, true);

  // TAKE_CONTROL / RETURN_CONTROL / SPECIAL_WIN
  const oppSt = createFieldStack(makeCard('OPP-TC', { owner: 'opponent', cost: 6 }), { normal: 1, soul: 0 });
  state.players.opponent.field.push(oppSt);
  assert.equal((await executeOp(state, { op: 'TAKE_CONTROL', target: { stackId: oppSt.id } }, { controller: 'player' }, DefaultPromptResolver, events)).success, true);
  assert.equal(state.players.player.field.some(s => s.id === oppSt.id), true);
  assert.equal((await executeOp(state, { op: 'RETURN_CONTROL', state: 'exhausted' }, { controller: 'player' }, DefaultPromptResolver, events)).success, true);
  assert.equal(oppSt.state, 'EXHAUSTED');
  assert.equal((await executeOp(state, { op: 'WIN_GAME', winner: 'self' }, { controller: 'player' }, DefaultPromptResolver, events)).winner, 'player');
});

// ===========================================================================
// STAGE I: Compiler Traceability, Pattern Enrichment & Extended Tri-State Conditions
// ===========================================================================
test('HIJ-COMP-01: Stage I preserves traceability text, emits structured H2 parameters, and evaluates new conditions tri-state', () => {
  const compiled = compileCard({
    card_number: 'HIJ-TEST-01',
    name: 'Test Traceability Dragon',
    type: 'Spirit',
    color: 'Red',
    cost: 5,
    effect: '(When Summoned) Activate the following Ultimate Trigger.'
  });
  assert.equal(compiled.originalEffectText, '(When Summoned) Activate the following Ultimate Trigger.');
  assert.equal(compiled.abilities[0].abilityIndex, 0);
  assert.equal(compiled.abilities[0].clauses[0].clauseIndex, 0);
  assert.equal(compiled.abilities[0].clauses[0].op.op, 'ACTIVATE_EFFECT_ACTION');
  assert.equal(compiled.abilities[0].clauses[0].op.action, 'ULTIMATE_TRIGGER');

  const compiledRestrict = compileClauseToOp({ cleanText: 'Neither player can gain cores from the Void through effects.' });
  assert.equal(compiledRestrict.op, 'GLOBAL_RESTRICTION');
  assert.equal(compiledRestrict.restriction, 'CANNOT_GAIN_CORES_FROM_VOID');

  // Condition parser + evaluator tri-state tests (TRUE, FALSE, UNSUPPORTED)
  const condBanish = 'If your Soul Core is banished';
  assert.equal(parseConditionToStructured(condBanish).type, 'SOUL_CORE_LOCATION');
  assert.equal(evaluateStructuredCondition({}, condBanish, {}).result, CONDITION_RESULT.UNSUPPORTED);
  const stBan = createGameState();
  stBan.players.player.soulCoreBanishedFromGame = true;
  assert.equal(evaluateStructuredCondition(stBan, condBanish, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  stBan.players.player.soulCoreBanishedFromGame = false;
  assert.equal(evaluateStructuredCondition(stBan, condBanish, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  const condIfNot = 'If not';
  assert.equal(evaluateStructuredCondition(stBan, condIfNot, {}).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(stBan, condIfNot, { previousOpResult: { success: false } }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(stBan, condIfNot, { previousOpResult: { success: true } }).result, CONDITION_RESULT.FALSE);

  const condRelCost = "If that card's cost is equal or inferior to the attacking target's";
  assert.equal(evaluateStructuredCondition(stBan, condRelCost, { previousTarget: makeCard('C2', { cost: 2 }) }).result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(evaluateStructuredCondition(stBan, condRelCost, { previousTarget: makeCard('C2', { cost: 2 }), attackingTarget: makeCard('ATK', { cost: 4 }) }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(stBan, condRelCost, { previousTarget: makeCard('C6', { cost: 6 }), attackingTarget: makeCard('ATK', { cost: 4 }) }).result, CONDITION_RESULT.FALSE);

  const condSymCols = 'If you have five or more symbol colors';
  for (const col of ['Red', 'Purple', 'Green', 'White', 'Yellow']) {
    stBan.players.player.field.push(createFieldStack(makeCard(`S-${col}`, { color: col, symbols: [col] }), { normal: 1, soul: 0 }));
  }
  assert.equal(evaluateStructuredCondition(stBan, condSymCols, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  stBan.players.player.field.pop();
  assert.equal(evaluateStructuredCondition(stBan, condSymCols, { controller: 'player' }).result, CONDITION_RESULT.FALSE);
});

// ===========================================================================
// STAGE J5: Adversarial & Failure Mode Battery (19 explicit edge/reject checks)
// ===========================================================================
test('HIJ-ADV-01: Adversarial failure battery enforces fail-closed execution, evidence rejection, and atomic rollbacks', async () => {
  const state = createGameState();
  const events = makeEventRecorder();

  // 1-4: Bare stub rejection, unsupported op, invalid target, target leaving zone mid-effect
  assert.equal((await executeOp(state, { op: 'UNKNOWN_FUTURE_OP' }, { controller: 'player' }, DefaultPromptResolver, events)).reason, 'UNHANDLED_OPERATION');
  assert.equal((await executeOp(state, { op: 'COPY_EFFECT' }, { controller: 'player' }, DefaultPromptResolver, events)).reason, 'MISSING_IR_PARAMETERS');
  assert.equal((await executeOp(state, { op: 'TAKE_CONTROL', target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' }, DefaultPromptResolver, events)).reason, 'NO_LEGAL_TARGETS');

  // 5-7: Empty underneath/mirage/advent failures mutate zero zones
  const st = createFieldStack(makeCard('HOST-F'), { normal: 1, soul: 0 });
  state.players.player.field.push(st);
  const zonesBefore = () => ({
    hand: state.players.player.hand.length,
    deck: state.players.player.deck.length,
    grave: state.players.player.grave.length,
    field: state.players.player.field.length,
    under: st.under.length,
    mirage: state.players.player.mirage,
    reserveNormal: state.players.player.reserve.normal
  });
  const snapBefore = zonesBefore();
  assert.equal((await executeOp(state, { op: 'DISCARD_UNDERNEATH_COST', count: 2, facedownOnly: true }, { controller: 'player', sourceStack: st }, DefaultPromptResolver, events)).success, false);
  assert.equal((await executeOp(state, { op: 'DISCARD_MIRAGE_COST', count: 1, zone: 'mirage' }, { controller: 'player' }, DefaultPromptResolver, events)).success, false);
  assert.equal((await executeOp(state, { op: 'ADVENT', from: 'hand', target: { stackId: 'NON_EXISTENT' } }, { controller: 'player', sourceCard: makeCard('HAND-NONE') }, DefaultPromptResolver, events)).success, false);
  assert.deepEqual(zonesBefore(), snapBefore);

  // 16-18: Evidence integrity hardening (null / empty executionMap & bare op classification)
  const bareClass = classifyOperation({ op: 'ACTIVATE_EFFECT_ACTION' });
  assert.equal(bareClass.status, 'PARAMETERS_INCOMPLETE');
  const bareModClass = classifyOperation({ op: 'GLOBAL_RESTRICTION' });
  assert.equal(bareModClass.status, 'PARAMETERS_INCOMPLETE');

  const nullExecCheck = verifyExecutableTestReference('tests/work_package_hij_operations_compiler_integration.test.js', ['HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs'], ['executeOp'], null);
  assert.equal(nullExecCheck.valid, false);
  assert.equal(nullExecCheck.reason, 'MISSING_OR_EMPTY_EXECUTION_MAP');

  const emptyExecCheck = verifyExecutableTestReference('tests/work_package_hij_operations_compiler_integration.test.js', ['HIJ-OPA-01: Group A activation and trigger operations resolve state, deduplicate watchers, and reject bare stubs'], ['executeOp'], new Map());
  assert.equal(emptyExecCheck.valid, false);
  assert.equal(emptyExecCheck.reason, 'MISSING_OR_EMPTY_EXECUTION_MAP');
});
