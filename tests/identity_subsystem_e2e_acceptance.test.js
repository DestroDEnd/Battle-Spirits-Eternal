/**
 * tests/identity_subsystem_e2e_acceptance.test.js
 * 
 * Phase 4C.3.2.5.1 — Corrected End-to-End Identity Subsystem Acceptance Test Suite
 * 
 * Implements genuine production-path integration tests for:
 * - TC-E2E-ACCEPT-01: Supported entry point activation and physical ID resolution
 * - TC-E2E-ACCEPT-02: Physical Copy Isolation (independent activation & limit tracking for copies A & B)
 * - TC-E2E-ACCEPT-03: Reprint semantic equivalence & ONCE_PER_TURN_SAME_NAME grouping
 * - TC-E2E-ACCEPT-04: Genuine Triggered Ability Resolution via playCard / WHEN_SUMMONED
 * - TC-E2E-ACCEPT-05: Genuine Concurrent Activation with controlled asynchronous prompt barrier
 * - TC-E2E-ACCEPT-06: Identity references & committed counters survive save/load restoration
 * - TC-E2E-ACCEPT-07: Stale reservation handles remain invalid after restoration & resets
 * - TC-E2E-ACCEPT-08: Repeated compilation produces identical, idempotent IDs
 * - TC-E2E-ACCEPT-09: Collision registry rejects colliding descriptor and protects registered state
 * - TC-E2E-ACCEPT-10: END-to-START transitions advance all 4 generations atomically without double STEP advance
 * - TC-E2E-ACCEPT-11: Ambiguous legacy fallback fails safely with explicit error
 * - TC-E2E-ACCEPT-12: Semantic ID cannot be used as a physical activation reference
 * - TC-E2E-ACCEPT-13: Complete, exhaustive 514-shard dataset validation & reconciliation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateAllShards } from '../scripts/validate_514_shards_exhaustive.mjs';

import { createGame } from '../engine/index.js';
import { FlowController } from '../engine/flow.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import {
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  createAbilityDescriptor,
  canonicalizeRFC8785,
  globalCollisionRegistry,
  AbilityCollisionRegistry,
  FatalCollisionError
} from '../compiler/identity.js';
import { assignDeterministicAbilityIdentities } from '../compiler/index.js';
import {
  reserveRestriction,
  commitRestriction,
  releaseReservation,
  evaluateRestriction,
  resetRestrictions,
  restoreRestrictionState,
  validateRestrictionState,
  preflightGenerations,
  RESTRICTION_STATUS
} from '../engine/restrictions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Helper to create dummy cards for deck
function makeDummyDeck(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `DUMMY-${i + 1}`,
    name: `Dummy ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

// Helper to create an ability with an explicit operation and deterministic IDs
function makeTestAbility(cardNumber, timing = 'MAIN', limit = 'ONCE_PER_TURN', op = { op: 'BOOST_BP', amount: 1000 }) {
  const ab = {
    id: `${cardNumber}#ab_0`,
    type: 'ABILITY',
    header: {
      timing,
      trigger: 'NONE',
      levels: [1],
      limit
    },
    clauses: [
      {
        rawText: 'Boost 1000 BP.',
        cleanText: 'Boost 1000 BP',
        link: null,
        isOptional: false,
        isCost: false,
        condition: null,
        duration: null,
        op
      }
    ]
  };

  assignDeterministicAbilityIdentities(cardNumber, [ab]);
  return ab;
}

function makeTestCardData(cardNumber, name, abilities = []) {
  return {
    card_number: cardNumber,
    name,
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 5000 } },
    compiledIr: { abilities }
  };
}

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-01: Same physical ability activated through supported entry points
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-01: Same physical ability activated through supported entry points resolves consistently', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = makeTestAbility('BS52-001', 'MAIN', 'ONCE_PER_TURN', { op: 'BOOST_BP', amount: 1000 });
  const cardData = makeTestCardData('BS52-001', 'Test Dragon', [ab]);

  const game = createGame({ playerDeck: makeDummyDeck(10), opponentDeck: makeDummyDeck(10) });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // 1. Activate via game.activateAbility(cardId, physicalId)
  const res1 = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(res1.activated, true, 'First activation succeeds');
  assert.equal(res1.isCommitted, true, 'First activation committed');

  // 2. Second activation of the same physical ability in the same turn must be rejected by ONCE_PER_TURN limit
  const res2 = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(res2.success, false, 'Second activation rejected due to once-per-turn limit');
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');

  // Verify that the restriction key was registered on the physicalId
  const key = `turn:1:player:${stack.placementId || card.placementId}:${ab.physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-02: Physical Copy Isolation (Corrected genuine integration path)
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-02: Distinct physical copies retain separate physical activation state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Create an ability with ordinary ONCE_PER_TURN (per-instance limit)
  const ab = makeTestAbility('BS52-002', 'MAIN', 'ONCE_PER_TURN', { op: 'BOOST_BP', amount: 1000 });
  const cardData = makeTestCardData('BS52-002', 'Twin Dragon', [ab]);

  const game = createGame({ playerDeck: makeDummyDeck(10), opponentDeck: makeDummyDeck(10) });
  game.state.step = 'MAIN';

  // Create two distinct physical card instances representing the same card
  const copyA = createCardInstance(cardData, 'player');
  const copyB = createCardInstance(cardData, 'player');
  assert.notEqual(copyA.id, copyB.id, 'Instances have distinct runtime IDs');

  const stackA = createFieldStack(copyA, { normal: 2, soul: 0 });
  const stackB = createFieldStack(copyB, { normal: 2, soul: 0 });
  assert.notEqual(stackA.placementId, stackB.placementId, 'Distinct placement IDs');

  game.state.players.player.field.push(stackA);
  game.state.players.player.field.push(stackB);

  // 1. Activate copy A successfully
  const resA1 = await game.activateAbility(copyA.id, ab.physicalId, 'player');
  assert.equal(resA1.activated, true, 'Copy A first activation succeeds');
  assert.equal(resA1.isCommitted, true, 'Copy A first activation committed');

  // 2. Activate copy B successfully (independent capacity)
  const resB1 = await game.activateAbility(copyB.id, ab.physicalId, 'player');
  assert.equal(resB1.activated, true, 'Copy B first activation succeeds independently');
  assert.equal(resB1.isCommitted, true, 'Copy B first activation committed independently');

  // 3. Attempt copy A again: must be rejected by its ONCE_PER_TURN limit
  const resA2 = await game.activateAbility(copyA.id, ab.physicalId, 'player');
  assert.equal(resA2.success, false, 'Copy A second activation rejected');
  assert.equal(resA2.reason, 'ABILITY_LIMIT_REACHED');

  // 4. Attempt copy B again: must also be rejected by its independent limit
  const resB2 = await game.activateAbility(copyB.id, ab.physicalId, 'player');
  assert.equal(resB2.success, false, 'Copy B second activation rejected');
  assert.equal(resB2.reason, 'ABILITY_LIMIT_REACHED');

  // 5. Inspect authoritative restriction counters: both exist independently under their distinct placementIds
  const keyA = `turn:1:player:${stackA.placementId}:${ab.physicalId}`;
  const keyB = `turn:1:player:${stackB.placementId}:${ab.physicalId}`;
  assert.notEqual(keyA, keyB, 'Keys are strictly isolated by placementId');
  assert.equal(game.state.restrictions.counters[keyA], 1, 'Copy A counter is 1');
  assert.equal(game.state.restrictions.counters[keyB], 1, 'Copy B counter is 1');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-03: Reprints sharing semantic restrictions where appropriate
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-03: Reprints share semantic identity and share ONCE_PER_TURN_SAME_NAME restrictions', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Card A: Original print BS01-001
  const abA = makeTestAbility('BS01-001', 'MAIN', 'ONCE_PER_TURN_SAME_NAME', { op: 'BOOST_BP', amount: 1000 });
  // Card B: Promo reprint SD01-001 with identical text and name
  const abB = makeTestAbility('SD01-001', 'MAIN', 'ONCE_PER_TURN_SAME_NAME', { op: 'BOOST_BP', amount: 1000 });

  // Both should share identical semanticId
  assert.equal(abA.semanticId, abB.semanticId, 'Original and reprint share identical semanticId');
  assert.notEqual(abA.physicalId, abB.physicalId, 'Original and reprint retain distinct physicalIds');

  const cardDataA = makeTestCardData('BS01-001', 'Gale Phoenix', [abA]);
  const cardDataB = makeTestCardData('SD01-001', 'Gale Phoenix', [abB]);

  const game = createGame({ playerDeck: makeDummyDeck(10), opponentDeck: makeDummyDeck(10) });
  game.state.step = 'MAIN';

  const instA = createCardInstance(cardDataA, 'player');
  const instB = createCardInstance(cardDataB, 'player');

  const stackA = createFieldStack(instA, { normal: 2, soul: 0 });
  const stackB = createFieldStack(instB, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackA);
  game.state.players.player.field.push(stackB);

  // Activate Card A
  const resA = await game.activateAbility(instA.id, abA.physicalId, 'player');
  assert.equal(resA.activated, true, 'Card A activation succeeds');

  // Activate Card B: blocked under ONCE_PER_TURN_SAME_NAME
  const resB = await game.activateAbility(instB.id, abB.physicalId, 'player');
  assert.equal(resB.success, false, 'Card B activation blocked under ONCE_PER_TURN_SAME_NAME');
  assert.equal(resB.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-04: Genuine Triggered Ability Resolution (Production-path integration)
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-04: Triggered ability queuing and resolution preserves physical and semantic identity through genuine game action', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Create an ability with WHEN_SUMMONED timing and ON_SUMMON trigger
  const ab = {
    id: 'SUMMON_TRIG#ab_0',
    type: 'ABILITY',
    header: { timing: 'WHEN_SUMMONED', trigger: 'ON_SUMMON', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ rawText: 'Draw 1 card from your deck.', cleanText: 'Draw 1 card from your deck', op: { op: 'DRAW', count: 1 } }]
  };
  assignDeterministicAbilityIdentities('BS52-TRIG', [ab]);

  const cardData = {
    card_number: 'BS52-TRIG',
    name: 'Trigger Dragon',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab] }
  };

  const deckCards = Array.from({ length: 15 }, (_, i) => ({ card_number: `D-${i + 1}`, type: 'Spirit' }));
  const game = createGame({ playerDeck: deckCards });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 5, soul: 1 };

  // Put card into player's hand
  const inst = createCardInstance(cardData, 'player');
  game.state.players.player.hand.push(inst);

  const eventLog = [];
  game.events.on('*', e => eventLog.push(e));

  const initialHandSize = game.state.players.player.hand.length; // 4 drawn at setup + 1 inst = 5

  // 1. Perform the real production game action: playCard
  const playRes = await game.playCard(inst.id, [{ from: 'reserve', isSoulCore: false }], 'player');
  assert.equal(playRes.success, true, 'Play card succeeds');

  // 2. Confirm production events were emitted in order
  const eventTypes = eventLog.map(e => e.type);
  assert.ok(eventTypes.includes('SUMMONED'), 'SUMMONED event emitted');
  assert.ok(eventTypes.includes('ACTIVATION_COMMITTED'), 'ACTIVATION_COMMITTED event emitted');

  // 3. Verify that the production trigger system discovered and executed the ability
  assert.equal(playRes.abilityResults.length, 1, 'One triggered ability executed');
  const abRes = playRes.abilityResults[0];
  assert.equal(abRes.success, true, 'Triggered ability succeeded');
  assert.equal(abRes.activated, true, 'Triggered ability was marked activated');
  assert.equal(abRes.isCommitted, true, 'Triggered ability committed its reservation');

  // 4. Verify identity preservation throughout resolution context
  assert.equal(abRes.context.physicalAbilityId, ab.physicalId, 'Context physicalAbilityId matches');
  assert.equal(abRes.context.semanticAbilityId, ab.semanticId, 'Context semanticAbilityId matches');
  assert.equal(abRes.context.sourceAbility.legacyId, ab.legacyId, 'Context legacyId preserved');

  // 5. Verify game-state mutation: inst removed from hand (-1) and draw executed (+1) -> net hand size unchanged
  assert.equal(game.state.players.player.hand.length, initialHandSize, 'Hand size mutated correctly via DRAW operation');

  // 6. Verify authoritative restriction counter is keyed to physicalId
  const committedKey = `turn:1:player:p_1:${ab.physicalId}`;
  assert.equal(game.state.restrictions.counters[committedKey], 1, 'Committed counter registered under physical ID');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-05: Genuine Concurrent Activation with Deterministic Barrier
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-05: Concurrent activations maintain isolated contexts across deterministic asynchronous prompt barrier', { timeout: 5000 }, async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const abA = {
    id: 'CONCUR_A#ab_0',
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ rawText: 'Optional draw', isOptional: true, op: { op: 'DRAW', count: 1 } }]
  };
  const abB = {
    id: 'CONCUR_B#ab_0',
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ rawText: 'Optional draw', isOptional: true, op: { op: 'DRAW', count: 1 } }]
  };
  assignDeterministicAbilityIdentities('BS52-CA', [abA]);
  assignDeterministicAbilityIdentities('BS52-CB', [abB]);

  const cardDataA = {
    card_number: 'BS52-CA',
    name: 'Alpha Concur',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [abA] }
  };
  const cardDataB = {
    card_number: 'BS52-CB',
    name: 'Beta Concur',
    type: 'Spirit',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [abB] }
  };

  const deckCards = Array.from({ length: 20 }, (_, i) => ({ card_number: `D-${i + 1}`, type: 'Spirit' }));

  let signalEnteredA = null;
  let signalEnteredB = null;
  const enteredA = new Promise(resolve => { signalEnteredA = resolve; });
  const enteredB = new Promise(resolve => { signalEnteredB = resolve; });

  let resumeA = null;
  let resumeB = null;
  const activePrompts = [];

  // Deterministic prompt resolver barrier using explicit synchronization promises
  const promptResolver = {
    choose: (prompt) => {
      activePrompts.push(prompt);
      if (prompt.context.sourceCard.cardNumber === 'BS52-CA') {
        return new Promise(resolve => {
          resumeA = () => resolve({ declined: false });
          signalEnteredA();
        });
      }
      if (prompt.context.sourceCard.cardNumber === 'BS52-CB') {
        return new Promise(resolve => {
          resumeB = () => resolve({ declined: false });
          signalEnteredB();
        });
      }
      return Promise.resolve({ declined: false });
    }
  };

  const game = createGame({ playerDeck: deckCards, promptResolver });
  game.state.step = 'MAIN';

  const instA = createCardInstance(cardDataA, 'player');
  const instB = createCardInstance(cardDataB, 'player');
  const stackA = createFieldStack(instA, { normal: 2, soul: 0 });
  const stackB = createFieldStack(instB, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackA);
  game.state.players.player.field.push(stackB);

  const keyA = `turn:1:player:${stackA.placementId}:${abA.physicalId}`;
  const keyB = `turn:1:player:${stackB.placementId}:${abB.physicalId}`;

  // 1. Start activation A and deterministically await its entry into the prompt barrier
  let settledA = false;
  const promiseA = game.activateAbility(instA.id, abA.physicalId, 'player').then(r => {
    settledA = true;
    return r;
  });
  await enteredA;
  assert.ok(resumeA, 'Activation A is paused at prompt resolver barrier');
  assert.equal(settledA, false, 'Activation A has not settled while at barrier');

  // 2. Start activation B while A remains paused, and deterministically await its barrier entry
  let settledB = false;
  const promiseB = game.activateAbility(instB.id, abB.physicalId, 'player').then(r => {
    settledB = true;
    return r;
  });
  await enteredB;
  await Promise.all([enteredA, enteredB]);

  assert.ok(resumeB, 'Activation B is paused at prompt resolver barrier');
  assert.equal(settledB, false, 'Activation B has not settled while at barrier');

  // 3. Confirm both activations are simultaneously active, pending, and holding distinct reservations
  assert.equal(activePrompts.length, 2, 'Both activations are simultaneously active and pending');
  assert.equal(game.state.restrictions.reservations[keyA], 1, 'Reservation counter active for A');
  assert.equal(game.state.restrictions.reservations[keyB], 1, 'Reservation counter active for B');
  assert.equal(Object.keys(game.state.restrictions.meta._reservations).length, 2, 'Two active reservation records');

  // 4. Resume B first (out of order), verifying A remains pending
  resumeB();
  const resB = await promiseB;
  assert.equal(resB.activated, true, 'Activation B completed while A was still pending');
  assert.equal(resB.success, true);
  assert.equal(settledA, false, 'Activation A remains pending after B completes');

  // Confirm B committed its counter while A has not yet committed
  assert.equal(game.state.restrictions.counters[keyB], 1, 'B committed its counter');
  assert.equal(game.state.restrictions.counters[keyA], undefined, 'A has not yet committed');
  assert.equal(game.state.restrictions.reservations[keyB], undefined, 'B reservation finalized and removed');
  assert.equal(game.state.restrictions.reservations[keyA], 1, 'A reservation still active');

  // 5. Resume A second
  resumeA();
  const resA = await promiseA;
  assert.equal(resA.activated, true, 'Activation A completed after B');
  assert.equal(resA.success, true);
  assert.equal(game.state.restrictions.counters[keyA], 1, 'A committed its counter');
  assert.equal(game.state.restrictions.reservations[keyA], undefined, 'A reservation finalized and removed');
  assert.equal(Object.keys(game.state.restrictions.meta._reservations || {}).length, 0, 'Zero leaked reservation records');

  // 6. Verify context isolation, physical identity references, and commitment keys
  const ctxA = resA.result.context;
  const ctxB = resB.result.context;
  assert.notEqual(ctxA, ctxB, 'Contexts are distinct objects');
  assert.equal(ctxA.physicalAbilityId, abA.physicalId, 'Context A preserves physicalAbilityId A');
  assert.equal(ctxB.physicalAbilityId, abB.physicalId, 'Context B preserves physicalAbilityId B');
  assert.notEqual(ctxA._committedKeys, ctxB._committedKeys, 'Context Sets are distinct objects');
  assert.equal(ctxA._committedKeys.has(keyA), true, 'Context A owns key A');
  assert.equal(ctxA._committedKeys.has(keyB), false, 'Context A does not contain key B');
  assert.equal(ctxB._committedKeys.has(keyB), true, 'Context B owns key B');
  assert.equal(ctxB._committedKeys.has(keyA), false, 'Context B does not contain key A');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-06: Identity references surviving serialization and restoration
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-06: Identity references and committed state survive serialization and restoration', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = makeTestAbility('BS52-020', 'MAIN', 'ONCE_PER_TURN', { op: 'BOOST_BP', amount: 1000 });
  const cardData = makeTestCardData('BS52-020', 'Omega Dragon', [ab]);

  const game = createGame({ playerDeck: makeDummyDeck(10), opponentDeck: makeDummyDeck(10) });
  game.state.step = 'MAIN';

  const inst = createCardInstance(cardData, 'player');
  const stack = createFieldStack(inst, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Activate to commit a limit
  const res = await game.activateAbility(inst.id, ab.physicalId, 'player');
  assert.equal(res.activated, true);

  // Serialize state
  const serialized = JSON.stringify(game.state);

  // Restore into a fresh game
  const restoredGame = createGame({ state: JSON.parse(serialized) });

  // 1. Verify card identity is preserved
  const restoredInst = restoredGame.state.players.player.field[0].top;
  assert.equal(restoredInst.cardNumber, 'BS52-020');
  assert.equal(restoredInst.compiledIr.abilities[0].physicalId, ab.physicalId);

  // 2. Verify committed counter survived
  const key = `turn:1:player:${stack.placementId || inst.placementId}:${ab.physicalId}`;
  assert.equal(restoredGame.state.restrictions.counters[key], 1);

  // 3. Attempting to activate again in the restored game must be rejected (limit preserved)
  const resRestored = await restoredGame.activateAbility(restoredInst.id, ab.physicalId, 'player');
  assert.equal(resRestored.success, false);
  assert.equal(resRestored.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-07: Stale reservation handles remaining invalid after restoration and lifecycle resets
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-07: Stale reservation handles remain invalid after restoration and lifecycle resets', () => {
  const game = createGame();
  const ability = {
    physicalId: 'BS-TEST#ab_0',
    header: { limit: 'ONCE_PER_TURN' }
  };
  const context = {
    controller: 'player',
    sourceCard: { cardNumber: 'BS-TEST', placementId: 'p_1' },
    placementId: 'p_1'
  };

  // Reserve activation to get handle
  const res = reserveRestriction(game.state, ability, context);
  assert.equal(res.success, true);

  // Perform TURN reset
  const resetRes = resetRestrictions(game.state, 'TURN');
  assert.equal(resetRes.success, true);

  // Handle must now be rejected as stale
  const commitRes = res.commit(context);
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, 'RESERVATION_INVALIDATED');
  assert.match(commitRes.reason, /RESERVATION_INVALIDATED|STALE_RESERVATION_HANDLE|RESERVATION_NOT_FOUND/);

  const releaseRes = res.release();
  assert.equal(releaseRes, false);
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-08: Repeated compilation preserving existing identity values
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-08: Repeated compilation produces identical, idempotent physical and semantic IDs', () => {
  const rawAb1 = {
    id: 'ab_0',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1] },
    clauses: [{ op: { op: 'BOOST_BP', amount: 3000 } }]
  };
  const rawAb2 = {
    id: 'ab_0',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1] },
    clauses: [{ op: { op: 'BOOST_BP', amount: 3000 } }]
  };

  assignDeterministicAbilityIdentities('BS52-030', [rawAb1]);
  assignDeterministicAbilityIdentities('BS52-030', [rawAb2]);

  assert.equal(rawAb1.physicalId, rawAb2.physicalId, 'Physical ID is deterministic');
  assert.equal(rawAb1.semanticId, rawAb2.semanticId, 'Semantic ID is deterministic');
  assert.equal(rawAb1.legacyId, rawAb2.legacyId, 'Legacy ID is deterministic');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-09: Collision detection not corrupting existing registrations
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-09: Collision registry rejects colliding descriptor and leaves registered state uncorrupted', () => {
  const registry = new AbilityCollisionRegistry();

  const descA = { type: 'ABILITY', timing: 'FLASH', trigger: 'NONE', marker: 'A' };
  const descB = { type: 'ABILITY', timing: 'FLASH', trigger: 'NONE', marker: 'B' };

  const physicalId = 'BS-TEST#AB_FLASH_NONE_ALL_fakehash1234567890abcdef_fakehash1234567890';

  // Register A
  const resA = registry.register(physicalId, descA, 'TEST-001');
  assert.equal(resA.status, 'NEW');

  // Registering identical descriptor A with identical ID is an idempotent no-op (status: MATCH)
  const resA2 = registry.register(physicalId, descA, 'TEST-001');
  assert.equal(resA2.status, 'MATCH');

  // Registering different descriptor B with same physicalId must throw FatalCollisionError
  assert.throws(
    () => registry.register(physicalId, descB, 'TEST-002'),
    FatalCollisionError
  );

  // Original registration A remains intact and queryable
  const registered = registry.get(physicalId);
  assert.ok(registered);
  assert.match(registered.canonicalJson, /"marker":"A"/);
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-10: END-to-START transitions preserving all lifecycle invariants
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-10: END-to-START transition advances all four generations atomically without double STEP advance', async () => {
  const dummyCards = Array.from({ length: 40 }, (_, i) => ({ id: 'c' + i, cardNumber: 'BS-0' + i, type: 'Spirit' }));
  const game = createGame({ playerDeck: dummyCards.slice(0, 20), opponentDeck: dummyCards.slice(20) });

  assert.equal(game.state.restrictions.generations.TURN, 1);
  assert.equal(game.state.restrictions.generations.STEP, 1);
  assert.equal(game.state.restrictions.generations.BATTLE, 1);
  assert.equal(game.state.restrictions.generations.ATTACK, 1);

  // Advance Turn 1 to END step
  await game.nextStep(); // START -> DRAW
  await game.nextStep(); // DRAW -> REFRESH
  await game.nextStep(); // REFRESH -> MAIN
  await game.nextStep(); // MAIN -> END
  assert.equal(game.state.step, 'END');

  // Verify generations before END transition
  assert.equal(game.state.restrictions.generations.STEP, 5);
  assert.equal(game.state.restrictions.generations.TURN, 1);

  // Transition from END to Turn 2 START
  await game.nextStep(); // END -> START
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'opponent');

  // At the END boundary:
  // TURN, STEP, BATTLE, ATTACK must all advance exactly once:
  assert.equal(game.state.restrictions.generations.TURN, 2, 'TURN advanced from 1 to 2');
  assert.equal(game.state.restrictions.generations.STEP, 6, 'STEP advanced from 5 to 6 (no double advance)');
  assert.equal(game.state.restrictions.generations.BATTLE, 2, 'BATTLE advanced from 1 to 2');
  assert.equal(game.state.restrictions.generations.ATTACK, 2, 'ATTACK advanced from 1 to 2');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-11: Ambiguous legacy lookup fails safely while unambiguous lookup succeeds
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-11: Ambiguous legacy fallback fails safely with explicit error', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = makeTestAbility('BS52-040', 'MAIN', null, { op: 'BOOST_BP', amount: 1000 });
  const ab2 = makeTestAbility('BS52-040', 'MAIN', null, { op: 'BOOST_BP', amount: 2000 });
  // Intentionally set identical legacyId on both abilities
  ab1.legacyId = 'shared_legacy_id';
  ab2.legacyId = 'shared_legacy_id';

  const cardData = makeTestCardData('BS52-040', 'Legacy Dragon', [ab1, ab2]);

  const game = createGame();
  game.state.step = 'MAIN';

  const inst = createCardInstance(cardData, 'player');
  game.state.players.player.field.push(createFieldStack(inst, { normal: 2, soul: 0 }));

  // Activating with ambiguous legacyId returns structured failure with AMBIGUOUS_LEGACY_IDENTITY
  const res = await game.activateAbility(inst.id, 'shared_legacy_id', 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'AMBIGUOUS_LEGACY_IDENTITY');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-12: Semantic ID cannot be used as a physical activation reference
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-12: Semantic ID cannot be used as a physical activation reference', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = makeTestAbility('BS52-050', 'MAIN', null, { op: 'BOOST_BP', amount: 1000 });
  const cardData = makeTestCardData('BS52-050', 'Semantic Safety Dragon', [ab]);

  const game = createGame();
  game.state.step = 'MAIN';

  const inst = createCardInstance(cardData, 'player');
  game.state.players.player.field.push(createFieldStack(inst, { normal: 2, soul: 0 }));

  // Activating with semanticId must fail explicitly
  const res = await game.activateAbility(inst.id, ab.semanticId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'SEMANTIC_ID_NOT_PERMITTED_FOR_ACTIVATION');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-13: Complete Exhaustive 514-Shard Provenance, Contract & Collision Validation
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-13: Exhaustive 514-shard provenance, identity contract, and descriptor-level collision validation', () => {
  const result = validateAllShards();

  assert.equal(result.status, 'PASS', `Validation failed: ${result.errors.join('; ')}`);
  assert.equal(result.expectedShards, 514, '514 expected shards');
  assert.equal(result.discoveredShards, 514, '514 discovered shards');
  assert.equal(result.verifiedShards, 514, '514 verified shards');
  assert.equal(result.missingShards.length, 0, 'Zero missing shards');
  assert.equal(result.unexpectedShards.length, 0, 'Zero unexpected shards');
  assert.equal(result.hashMismatches.length, 0, 'Zero hash or size mismatches');

  assert.equal(result.totalCards, 15398, 'Reconciled 15,398 compiled card records');
  assert.equal(result.uniqueCanonicalCards, 14609, 'Reconciled 14,609 unique canonical card numbers');
  assert.equal(result.totalAbilities, 36422, 'Reconciled 36,422 compiled abilities');
  assert.equal(result.validPhysicalIds, 36422, 'All 36,422 physical IDs satisfy format, id===physicalId, and re-derivation contract');
  assert.equal(result.validSemanticIds, 36422, 'All 36,422 semantic IDs satisfy format and re-derivation contract');
  assert.equal(result.validLegacyIds, 36422, 'All 36,422 legacy IDs satisfy type and format contract');

  assert.equal(result.uniquePhysicalIds, 34855, 'Reconciled 34,855 unique physical ability IDs');
  assert.equal(result.uniqueSemanticIds, 18496, 'Reconciled 18,496 unique semantic ability IDs');

  assert.equal(result.physicalCollisions, 0, 'Zero physical identity collisions after descriptor comparison');
  assert.equal(result.semanticCollisions, 0, 'Zero semantic identity collisions after descriptor comparison');
  assert.equal(result.legitimateRepeatedPhysicalGroups, 1567, 'All 1,567 repeated physical IDs classified as legitimate cross-shard canonical records');
  assert.equal(result.legitimateRepeatedSemanticGroups, 3789, 'All 3,789 repeated semantic IDs classified as legitimate semantic equivalences');
  assert.equal(result.unresolvedDuplicateGroups, 0, 'Zero unresolved duplicate groups');
  assert.equal(result.malformedRecords, 0, 'Zero malformed records');
  assert.equal(result.ambiguousLegacyCards, 0, 'Zero cards with ambiguous legacy IDs');
});

// ---------------------------------------------------------------------------
// TC-E2E-ACCEPT-14: Provenance enforcement rejects modified, missing, or extra shards
// ---------------------------------------------------------------------------
test('TC-E2E-ACCEPT-14: Dataset provenance validation immediately rejects modified, missing, or unexpected shards', () => {
  const realShardsDir = path.join(ROOT, 'data', 'ir_shards');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-shard-prov-'));
  try {
    // Copy all 514 shards into temp dir for negative testing
    const files = fs.readdirSync(realShardsDir);
    for (const f of files) {
      fs.copyFileSync(path.join(realShardsDir, f), path.join(tmpDir, f));
    }

    // 1. Modified shard (SHA-256 mismatch)
    const targetFile = path.join(tmpDir, files[0]);
    const origContent = fs.readFileSync(targetFile);
    fs.writeFileSync(targetFile, Buffer.concat([origContent, Buffer.from(' ')]));
    const modRes = validateAllShards({ shardsDir: tmpDir });
    assert.equal(modRes.status, 'FAIL');
    assert.equal(modRes.hashMismatches.length, 1);
    assert.equal(modRes.hashMismatches[0].file, files[0]);

    // Restore file
    fs.writeFileSync(targetFile, origContent);

    // 2. Extra unexpected shard
    const extraFile = path.join(tmpDir, 'EXTRA_UNEXPECTED.json');
    fs.writeFileSync(extraFile, '{}');
    const extraRes = validateAllShards({ shardsDir: tmpDir });
    assert.equal(extraRes.status, 'FAIL');
    assert.deepEqual(extraRes.unexpectedShards, ['EXTRA_UNEXPECTED.json']);
    fs.unlinkSync(extraFile);

    // 3. Missing shard
    fs.unlinkSync(targetFile);
    const missRes = validateAllShards({ shardsDir: tmpDir });
    assert.equal(missRes.status, 'FAIL');
    assert.deepEqual(missRes.missingShards, [files[0]]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
