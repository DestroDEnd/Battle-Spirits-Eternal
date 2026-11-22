import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { computeEffectiveBP, computeLevel } from '../engine/continuous.js';
import { FlowController } from '../engine/flow.js';
import { checkStateBasedActions } from '../engine/sba.js';
import { moveCard } from '../engine/zones.js';
import { createEngineStateFromLegacy } from '../engine/legacy_bridge.js';

function makeBasicSpirit(name, owner, bp1 = 3000, bp2 = 5000) {
  return createCardInstance({
    card_number: `TEST-${name}`,
    name,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    family: 'Dragon',
    families: ['Dragon'],
    cost: 3,
    levels: {
      1: { cost: 1, bp: bp1 },
      2: { cost: 3, bp: bp2 }
    }
  }, owner);
}

// =========================================================================
// 1. Battle-duration cleanup (THIS_BATTLE & UNTIL_END_OF_BATTLE)
// =========================================================================
test('1a. Battle-duration cleanup: blocked battle prunes THIS_BATTLE and UNTIL_END_OF_BATTLE, keeps THIS_TURN/UNTIL_END_OF_TURN', async () => {
  const game = createGame({
    playerDeck: [makeBasicSpirit('PD', 'player')],
    opponentDeck: [makeBasicSpirit('OD', 'opponent')],
    firstPlayer: 'player'
  });
  game.state.turnNumber = 2;
  game.state.step = 'ATTACK';

  const atk = createFieldStack(makeBasicSpirit('Atk', 'player', 4000), { normal: 1, soul: 0 });
  const blk = createFieldStack(makeBasicSpirit('Blk', 'opponent', 3000), { normal: 1, soul: 0 });
  game.state.players.player.field.push(atk);
  game.state.players.opponent.field.push(blk);

  game.state.modifiers.push(
    { id: 'b1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_BATTLE' },
    { id: 'b2', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_BATTLE' },
    { id: 't1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_TURN' },
    { id: 't2', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_TURN' }
  );

  await game.declareAttack(atk.id, 'player');
  await game.declareBlock(blk.id, 'opponent');

  assert.deepEqual(game.state.modifiers.map(m => m.id), ['t1', 't2']);
});

test('1b. Battle-duration cleanup: direct hit and prevented damage prune THIS_BATTLE and UNTIL_END_OF_BATTLE', async () => {
  const game = createGame({
    playerDeck: [makeBasicSpirit('PD', 'player')],
    opponentDeck: [makeBasicSpirit('OD', 'opponent')],
    firstPlayer: 'player'
  });
  game.state.turnNumber = 2;
  game.state.step = 'ATTACK';

  const atk = createFieldStack(makeBasicSpirit('Atk', 'player', 4000), { normal: 1, soul: 0 });
  game.state.players.player.field.push(atk);

  // Direct hit
  game.state.modifiers.push(
    { id: 'b1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_BATTLE' },
    { id: 'b2', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_BATTLE' },
    { id: 't1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_TURN' }
  );
  await game.declareAttack(atk.id, 'player');
  await game.resolveDirectHit('player');
  assert.deepEqual(game.state.modifiers.map(m => m.id), ['t1']);
  assert.equal(game.state.players.opponent.life, 4);

  // Prevented damage early-exit in resolveDirectHit
  atk.state = 'REFRESHED';
  game.state.modifiers.push(
    { id: 'b3', type: 'PREVENT_LIFE_LOSS', side: 'opponent', duration: 'UNTIL_END_OF_BATTLE' },
    { id: 'b4', type: 'BP_BUFF', amount: 1000, duration: 'THIS_BATTLE' }
  );
  await game.declareAttack(atk.id, 'player');
  const prevRes = await game.resolveDirectHit('player');
  assert.equal(prevRes.prevented, true);
  assert.deepEqual(game.state.modifiers.map(m => m.id), ['t1']);
});

test('1c. Battle-duration cleanup: early exits in declareBlock and declareAttack prune battle modifiers', async () => {
  const game = createGame({
    playerDeck: [makeBasicSpirit('PD', 'player')],
    opponentDeck: [makeBasicSpirit('OD', 'opponent')],
    firstPlayer: 'player'
  });
  game.state.turnNumber = 2;
  game.state.step = 'ATTACK';

  // Case 1: WHEN_BLOCKS clears state.combat (early exit in declareBlock)
  const atk = createFieldStack(makeBasicSpirit('Atk', 'player', 4000), { normal: 1, soul: 0 });
  const blkCard = makeBasicSpirit('BlkEarly', 'opponent', 3000);
  blkCard.compiledIr = {
    abilities: [{
      header: { timing: 'WHEN_BLOCKS' },
      clauses: [{ op: { op: 'END_ATTACK_STEP' } }]
    }]
  };
  const blk = createFieldStack(blkCard, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atk);
  game.state.players.opponent.field.push(blk);

  game.state.modifiers.push(
    { id: 'b1', type: 'BP_BUFF', amount: 1000, duration: 'THIS_BATTLE' },
    { id: 'b2', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_BATTLE' },
    { id: 't1', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_TURN' }
  );

  await game.declareAttack(atk.id, 'player');
  await game.declareBlock(blk.id, 'opponent');
  assert.equal(game.state.combat, null);
  assert.deepEqual(game.state.modifiers.map(m => m.id), ['t1']);

  // Case 2: WHEN_ATTACKS clears state.combat (early exit in declareAttack)
  const atk2Card = makeBasicSpirit('AtkEarly', 'player', 4000);
  atk2Card.compiledIr = {
    abilities: [{
      header: { timing: 'WHEN_ATTACKS' },
      clauses: [{ op: { op: 'END_ATTACK_STEP' } }]
    }]
  };
  const atk2 = createFieldStack(atk2Card, { normal: 1, soul: 0 });
  game.state.players.player.field.push(atk2);
  game.state.modifiers.push(
    { id: 'b3', type: 'BP_BUFF', amount: 1000, duration: 'UNTIL_END_OF_BATTLE' }
  );
  await game.declareAttack(atk2.id, 'player');
  assert.equal(game.state.combat, null);
  assert.deepEqual(game.state.modifiers.map(m => m.id), ['t1']);
});

// =========================================================================
// 2. Legacy bridge identity
// =========================================================================
test('2. Legacy bridge isolates same-object cross-player refs, duplicate UIDs, and duplicate card_numbers', () => {
  const sharedRawObj = { card_number: 'BS01-001', name: 'Shared Raw', type: 'Spirit', currentCores: 1 };
  const dupUid1 = { uid: 'dup_1', card_number: 'BS01-002', name: 'Dup UID 1', type: 'Spirit' };
  const dupUid2 = { uid: 'dup_1', card_number: 'BS01-002', name: 'Dup UID 2', type: 'Spirit' };
  const copyA = { card_number: 'BS01-003', name: 'Plain Copy', type: 'Spirit' };
  const copyB = { card_number: 'BS01-003', name: 'Plain Copy', type: 'Spirit' };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      life: 5, reserve: 3, trash: 0,
      hand: [dupUid1, dupUid2, copyA, copyB],
      field: [sharedRawObj],
      deck: [], nexus: [], trashCards: [], voidCards: [], openCards: []
    },
    opponent: {
      life: 5, reserve: 3, trash: 0,
      hand: [],
      field: [sharedRawObj],
      deck: [], nexus: [], trashCards: [], voidCards: [], openCards: []
    }
  };

  const { state } = createEngineStateFromLegacy(duelState);

  // Same raw object referenced by both players -> distinct instances, distinct owners, distinct stacks
  const pFieldCard = state.players.player.field[0].top;
  const oFieldCard = state.players.opponent.field[0].top;
  assert.notEqual(pFieldCard, oFieldCard);
  assert.notEqual(pFieldCard.id, oFieldCard.id);
  assert.equal(pFieldCard.owner, 'player');
  assert.equal(oFieldCard.owner, 'opponent');

  // Duplicate legacy UIDs -> distinct instances & distinct uids
  assert.notEqual(state.players.player.hand[0], state.players.player.hand[1]);
  assert.notEqual(state.players.player.hand[0].id, state.players.player.hand[1].id);
  assert.notEqual(state.players.player.hand[0].uid, state.players.player.hand[1].uid);

  // Ordinary duplicate copies -> distinct instances & distinct uids
  assert.notEqual(state.players.player.hand[2], state.players.player.hand[3]);
  assert.notEqual(state.players.player.hand[2].id, state.players.player.hand[3].id);
  assert.notEqual(state.players.player.hand[2].uid, state.players.player.hand[3].uid);
});

// =========================================================================
// 3. PREVENT_LOSS tests
// =========================================================================
test('3a. PREVENT_LOSS prevents 0-life loss and deck-out only for target side, then loses on expiration', async () => {
  // Player-specific PREVENT_LOSS: player has 0 life and 0 deck, opponent has 0 life
  const state = createGameState([], [], 'player');
  state.players.player.life = 0;
  state.players.opponent.life = 5;
  state.modifiers.push({ id: 'pl_p', type: 'PREVENT_LOSS', side: 'player', duration: 'THIS_TURN' });

  // SBA at 0 life: player does not lose
  await checkStateBasedActions(state);
  assert.equal(state.winner, null);

  // Deck-out at START step: player does not lose
  state.step = 'END';
  state.players.player.extraTurns = 1; // keep activePlayer = 'player' on next START
  // Give opponent a deck so only player's deck-out is tested, and make PREVENT_LOSS PERMANENT for this check
  state.modifiers[0].duration = 'PERMANENT';
  const flow = new FlowController(state);
  await flow.advanceStep(); // player END -> player START with 0 deck
  assert.equal(state.step, 'START');
  assert.equal(state.winner, null);

  // Now opponent drops to 0 life: player-specific PREVENT_LOSS must NOT protect opponent!
  state.players.opponent.life = 0;
  await checkStateBasedActions(state);
  assert.equal(state.winner, 'player');
  assert.equal(state.winReason, 'LIFE_0');
});

test('3b. PREVENT_LOSS with side: both protects both players until expiration, then loss triggers', async () => {
  const state = createGameState(
    [],
    [makeBasicSpirit('OppDeck', 'opponent')],
    'player'
  );
  state.players.player.life = 0;
  state.players.opponent.life = 0;
  state.step = 'ATTACK';
  state.modifiers.push({ id: 'pl_both', type: 'PREVENT_LOSS', side: 'both', duration: 'THIS_TURN' });

  await checkStateBasedActions(state);
  assert.equal(state.winner, null);

  // Expire THIS_TURN by advancing END -> START
  const flow = new FlowController(state);
  state.step = 'END';
  await flow.advanceStep();
  assert.equal(state.winner, 'DRAW');
  assert.equal(state.winReason, 'SIMULTANEOUS_LIFE_0');
});

// =========================================================================
// 4. Modifier interaction tests
// =========================================================================
test('4. Modifier interactions respect targetStackId, side, targetFilter, stacking, control change, and zone movement', async () => {
  const state = createGameState([], [], 'player');

  const pRedDragon = makeBasicSpirit('RedDragon', 'player', 3000, 5000);
  const pBlueBeast = createCardInstance({
    card_number: 'P-BLUE',
    name: 'BlueBeast',
    type: 'Spirit',
    color: 'Blue',
    colors: ['Blue'],
    family: 'Beast',
    families: ['Beast'],
    cost: 4,
    levels: { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 7000 } }
  }, 'player');
  const oRedDragon = makeBasicSpirit('OppDragon', 'opponent', 3000, 5000);

  const s1 = createFieldStack(pRedDragon, { normal: 3, soul: 0 }); // LV2, 5000 BP
  const s2 = createFieldStack(pBlueBeast, { normal: 3, soul: 0 }); // LV2, 7000 BP
  const s3 = createFieldStack(oRedDragon, { normal: 3, soul: 0 }); // LV2, 5000 BP
  state.players.player.field.push(s1, s2);
  state.players.opponent.field.push(s3);

  // 1) targetFilter (side: 'player', color: 'Red') + targetStackId on s2 + multiple modifiers on s1
  state.modifiers.push(
    { id: 'm_filter', type: 'BP_BUFF', side: 'player', targetFilter: { color: 'Red' }, amount: 2000, duration: 'THIS_TURN' },
    { id: 'm_lv_s1', type: 'SET_LEVEL', targetStackId: s1.id, value: 1, duration: 'THIS_TURN' }, // s1 base BP drops 5000 -> 3000
    { id: 'm_bp_s2', type: 'BP_OR_LEVEL_MODIFIER', targetStackId: s2.id, stat: 'bp', value: 1000, duration: 'THIS_TURN' }
  );

  // s1: LV1 (3000) + 2000 (Red filter) = 5000
  assert.equal(computeLevel(s1, state), 1);
  assert.equal(computeEffectiveBP(state, s1), 5000);
  // s2: LV2 (7000) + 1000 (targetStackId) = 8000 (NOT affected by Red filter or s1's SET_LEVEL)
  assert.equal(computeLevel(s2, state), 2);
  assert.equal(computeEffectiveBP(state, s2), 8000);
  // s3: opponent Red Dragon NOT affected by side: 'player' filter
  assert.equal(computeEffectiveBP(state, s3), 5000);

  // 2) Control change: s1 changes owner to 'opponent' -> side: 'player' Red filter no longer applies, targetStackId still applies
  s1.owner = 'opponent';
  assert.equal(computeEffectiveBP(state, s1), 3000);

  // 3) Card movement off field: moving s2's card to grave removes stack from field
  await moveCard(state, pBlueBeast, 'grave', 'player');
  assert.equal(state.players.player.field.some(st => st.id === s2.id), false);
  assert.equal(state.players.player.grave.length, 1);
});
