/**
 * tests/phase_k_mechanics.test.js
 *
 * Phase K Work Package E Verification Suite:
 * - E1: Brave Multi-Stack & De-braving
 * - E2: Grandwalker God Cores
 * - E3: Rebirth Flip State
 * - E4: Compound & Nested Conditions
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import { commitStackExit } from '../engine/zones.js';
import { payGodCores } from '../engine/payment.js';
import { executeOp } from '../engine/ops/index.js';
import { evaluateStructuredCondition, CONDITION_TYPES, CONDITION_RESULT } from '../engine/conditions.js';

function makeFillerDeck(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `FILL-${i + 1}`,
    name: `Filler ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

// ============================================================================
// E1: Brave Multi-Stack & De-braving Tests
// ============================================================================

test('E1-01: separateBrave separates attached Brave into independent Spirit form on field', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const host = createCardInstance({ card_number: 'SP-1', name: 'Host Spirit', type: 'Spirit', cost: 3, color: 'Red' }, 'player');
  const brave = createCardInstance({ card_number: 'BR-1', name: 'Sword Brave', type: 'Brave', cost: 4, color: 'Red' }, 'player');

  const hostStack = createFieldStack(host, { normal: 2, soul: 0 }, [brave]);
  game.state.players.player.field.push(hostStack);
  game.state.players.player.reserve.normal = 5;

  assert.equal(hostStack.braves.length, 1);
  assert.equal(game.state.players.player.field.length, 1);

  const res = await game.separateBrave(hostStack.id, brave.id, 1, 'player');
  assert.equal(res.success, true);
  assert.equal(hostStack.braves.length, 0, 'Brave removed from host stack');
  assert.equal(game.state.players.player.field.length, 2, 'Brave now exists as independent field stack');
  assert.equal(res.braveStack.top.id, brave.id);
  assert.equal(res.braveStack.cores.normal, 1);
  assert.equal(game.state.players.player.reserve.normal, 4, '1 core deducted from reserve');
});

test('E1-02: commitStackExit with retainBraves keeps Brave on field as Spirit form', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const host = createCardInstance({ card_number: 'SP-2', name: 'Dying Spirit', type: 'Spirit', cost: 3, color: 'White' }, 'player');
  const brave = createCardInstance({ card_number: 'BR-2', name: 'Shield Brave', type: 'Brave', cost: 3, color: 'White' }, 'player');

  const hostStack = createFieldStack(host, { normal: 1, soul: 0 }, [brave]);
  game.state.players.player.field.push(hostStack);
  game.state.players.player.reserve.normal = 3;

  await commitStackExit(game.state, hostStack, 'grave', { cause: 'destroy', by: 'opponent', retainBraves: true }, game.events);

  assert.equal(game.state.players.player.grave.some(c => c.id === host.id), true, 'Host spirit entered grave');
  assert.equal(game.state.players.player.grave.some(c => c.id === brave.id), false, 'Brave did NOT enter grave');
  assert.equal(game.state.players.player.field.some(st => st.top.id === brave.id), true, 'Brave retained on field');
  assert.equal(game.state.players.player.reserve.normal, 3, 'Host core returned to reserve (+1) and 1 core allocated to Brave (-1), netting 3 cores in reserve');
});

test('E1-03: commitStackExit sends Brave to grave when retention is not requested', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const host = createCardInstance({ card_number: 'SP-3', name: 'Departing Spirit', type: 'Spirit', cost: 2, color: 'Green' }, 'player');
  const brave = createCardInstance({ card_number: 'BR-3', name: 'Horn Brave', type: 'Brave', cost: 2, color: 'Green' }, 'player');

  const hostStack = createFieldStack(host, { normal: 1, soul: 0 }, [brave]);
  game.state.players.player.field.push(hostStack);

  await commitStackExit(game.state, hostStack, 'grave', { cause: 'destroy', by: 'rule' }, game.events, { retainBraves: false });

  assert.equal(game.state.players.player.grave.some(c => c.id === host.id), true);
  assert.equal(game.state.players.player.grave.some(c => c.id === brave.id), true, 'Brave sent to grave with host');
  assert.equal(game.state.players.player.field.length, 0);
});

// ============================================================================
// E2: Grandwalker God Cores Tests
// ============================================================================

test('E2-01: payGodCores moves cores directly from Grandwalker stack to Void', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const gwCard = createCardInstance({ card_number: 'BS44-X01', name: 'Grandwalker Apollo', type: 'Grandwalker Nexus', cost: 2, color: 'Red' }, 'player');
  const gwStack = createFieldStack(gwCard, { normal: 5, soul: 0 });
  game.state.players.player.field.push(gwStack);
  game.state.players.player.voidCores.normal = 10;

  const res = await payGodCores(game.state, gwStack.id, 3, 'player', game.events);
  assert.equal(res.success, true);
  assert.equal(res.count, 3);
  assert.equal(gwStack.cores.normal, 2, '3 cores deducted from Grandwalker stack');
  assert.equal(game.state.players.player.voidCores.normal, 13, '3 cores transferred to Void');
});

test('E2-02: PAY_GOD_CORE op via executeOp enforces core conservation and Void transfer', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const gwCard = createCardInstance({ card_number: 'BS47-X02', name: 'Grandwalker Zeus', type: 'Grandwalker Nexus', cost: 2, color: 'White' }, 'player');
  const gwStack = createFieldStack(gwCard, { normal: 4, soul: 0 });
  game.state.players.player.field.push(gwStack);
  game.state.players.player.voidCores.normal = 5;

  const op = { op: 'PAY_GOD_CORE', count: 2 };
  const res = await executeOp(game.state, op, { controller: 'player', sourceStack: gwStack, sourceCard: gwCard }, null, game.events);

  assert.equal(res.success, true);
  assert.equal(res.movedCount, 2);
  assert.equal(gwStack.cores.normal, 2);
  assert.equal(game.state.players.player.voidCores.normal, 7);
});

test('E2-03: PAY_GOD_CORE fails gracefully when stack has insufficient God cores', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const gwCard = createCardInstance({ card_number: 'BS48-X03', name: 'Grandwalker Hermes', type: 'Grandwalker Nexus', cost: 2, color: 'Green' }, 'player');
  const gwStack = createFieldStack(gwCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(gwStack);

  const res = await payGodCores(game.state, gwStack.id, 3, 'player', game.events);
  assert.equal(res.success, false);
  assert.equal(res.reason, 'INSUFFICIENT_GOD_CORES');
  assert.equal(gwStack.cores.normal, 1, 'Cores untouched on rejection');
});

// ============================================================================
// E3: Rebirth Flip State Tests
// ============================================================================

test('E3-01: game.flipCard inverts card face state while preserving placementId and cores', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const rebirthCard = createCardInstance({ card_number: 'BS52-TX01', name: 'The DragonKnight (Face A)', type: 'Spirit', cost: 3, color: 'Red', face: 'A' }, 'player');
  const stack = createFieldStack(rebirthCard, { normal: 3, soul: 1 });
  game.state.players.player.field.push(stack);

  assert.equal(stack.currentFace, 'A');
  assert.equal(stack.isFlipped, false);
  const initialPlacementId = stack.placementId;

  const flip1 = await game.flipCard(stack.id, {
    faceData: { name: 'The DragonKnight Sovereign (Face B)', bp: 7000 }
  }, 'player');

  assert.equal(flip1.success, true);
  assert.equal(stack.currentFace, 'B');
  assert.equal(stack.isFlipped, true);
  assert.equal(stack.placementId, initialPlacementId, 'Placement ID preserved across flip');
  assert.equal(stack.cores.normal, 3, 'Normal cores preserved');
  assert.equal(stack.cores.soul, 1, 'Soul core preserved');
  assert.equal(stack.top.name, 'The DragonKnight Sovereign (Face B)');

  // Flip back to Face A
  const flip2 = await game.flipCard(stack.id, {}, 'player');
  assert.equal(flip2.success, true);
  assert.equal(stack.currentFace, 'A');
  assert.equal(stack.isFlipped, false);
});

test('E3-02: FLIP_CARD op via executeOp emits CARD_FLIPPED event and toggles state', async () => {
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
  const card = createCardInstance({ card_number: 'BS53-TX02', name: 'Rebirth Nexus', type: 'Nexus', cost: 2, color: 'Blue', face: 'A' }, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  let emitted = null;
  game.events.on('CARD_FLIPPED', ev => { emitted = ev; });

  const op = { op: 'FLIP_CARD' };
  const res = await executeOp(game.state, op, { controller: 'player', sourceStack: stack, sourceCard: card }, null, game.events);

  assert.equal(res.success, true);
  assert.equal(stack.currentFace, 'B');
  assert.equal(stack.isFlipped, true);
  assert.ok(emitted, 'CARD_FLIPPED event emitted');
  assert.equal(emitted.face, 'B');
});

// ============================================================================
// E4: Compound & Nested Conditions Tests
// ============================================================================

test('E4-01: evaluateStructuredCondition evaluates nested AND(OR(A, B), NOT(C)) tree', () => {
  const state = {
    players: {
      player: { life: 4, reserve: { normal: 3, soul: 0 }, field: [] },
      opponent: { life: 2, reserve: { normal: 1, soul: 0 }, field: [] }
    }
  };

  const condA = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'LTE', threshold: 3, side: 'self' }; // 4 <= 3 -> FALSE
  const condB = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.RESERVE_CORE_THRESHOLD, operator: 'GTE', count: 2, side: 'self' }; // 3 >= 2 -> TRUE
  const condC = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'EQ', threshold: 5, side: 'self' }; // 4 == 5 -> FALSE

  const nestedCond = {
    kind: 'STRUCTURED_CONDITION',
    type: CONDITION_TYPES.COMPOUND,
    combinator: 'AND',
    conditions: [
      {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COMPOUND,
        combinator: 'OR',
        conditions: [condA, condB] // FALSE OR TRUE -> TRUE
      },
      {
        kind: 'STRUCTURED_CONDITION',
        type: CONDITION_TYPES.COMPOUND,
        combinator: 'NOT',
        conditions: [condC] // NOT(FALSE) -> TRUE
      }
    ]
  };

  const res = evaluateStructuredCondition(state, nestedCond, { controller: 'player' });
  assert.equal(res.result, CONDITION_RESULT.TRUE, 'Nested AND(OR, NOT) evaluated to TRUE');
});

test('E4-02: evaluateStructuredCondition handles subconditions array, operands array, and lowercase combinators', () => {
  const state = {
    players: {
      player: { life: 5, reserve: { normal: 0, soul: 0 }, field: [] },
      opponent: { life: 5, reserve: { normal: 0, soul: 0 }, field: [] }
    }
  };

  const c1 = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'GTE', threshold: 5, side: 'self' }; // TRUE
  const c2 = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'LTE', threshold: 2, side: 'self' }; // FALSE

  // Using subconditions and lowercase 'or'
  const compoundOr = {
    kind: 'STRUCTURED_CONDITION',
    type: CONDITION_TYPES.COMPOUND,
    combinator: 'or',
    subconditions: [c1, c2]
  };

  const resOr = evaluateStructuredCondition(state, compoundOr, { controller: 'player' });
  assert.equal(resOr.result, CONDITION_RESULT.TRUE);

  // Using operands and symbol '&&'
  const compoundAnd = {
    kind: 'STRUCTURED_CONDITION',
    type: CONDITION_TYPES.COMPOUND,
    operator: '&&',
    operands: [c1, c2]
  };

  const resAnd = evaluateStructuredCondition(state, compoundAnd, { controller: 'player' });
  assert.equal(resAnd.result, CONDITION_RESULT.FALSE);
});
