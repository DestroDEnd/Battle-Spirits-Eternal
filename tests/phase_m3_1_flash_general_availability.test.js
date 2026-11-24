import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  classifyFlashTiming,
  validateFlashTiming,
  FLASH_TIMING_QUALIFIERS,
  FLASH_AVAILABILITY
} from '../engine/flash_timing.js';

test('PHASE-M3.1-GEN-01: Generic Flash Magic is legal in controller Main Step', async () => {
  const game = createGame();
  const flashMagic = createCardInstance({
    id: 'GEN_FLASH_MAGIC_01',
    name: 'Generic Flash Surge',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - Target Spirit gets +3000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_surge',
          header: { timing: 'FLASH', isFlash: true, isMain: false },
          clauses: [{ op: { op: 'BP_BUFF', amount: 3000 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [flashMagic];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  const playRes = await game.playCard(flashMagic.id, [], 'player');
  assert.equal(playRes.success, true, 'Generic Flash Magic must succeed in controller Main Step');
  assert.equal(playRes.costPaid, 2, 'Cost must be paid');
  assert.equal(game.state.players.player.grave.length, 1, 'Card moved to grave after resolution');
});

test('PHASE-M3.1-GEN-02: Generic Flash Spirit ability is legal in controller Main Step', async () => {
  const game = createGame();
  const flashSpirit = createCardInstance({
    id: 'GEN_FLASH_SPIRIT_01',
    name: 'Flash Knight',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_knight_draw',
          physicalId: 'phy_knight_draw',
          header: { timing: 'FLASH', isFlash: true, levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.field = [createFieldStack(flashSpirit, { normal: 2, soul: 0 })];
  game.state.players.player.deck = [createCardInstance({ name: 'Deck Top' }, 'player')];

  const actRes = await game.activateAbility(flashSpirit.id, 'phy_knight_draw', 'player');
  assert.equal(actRes.success, true, 'Generic Flash ability on field must succeed in Main Step');
  assert.equal(game.state.players.player.hand.length, 1, 'Drew 1 card from ability');
});

test('PHASE-M3.1-GEN-03: Generic Flash Accel is legal in controller Main Step', async () => {
  const game = createGame();
  const accelSpirit = createCardInstance({
    id: 'GEN_FLASH_ACCEL_01',
    name: 'Accel Scout',
    type: 'Spirit',
    cost: 4,
    effect: 'Flash - [Accel: Cost 1] Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_accel_draw',
          header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [accelSpirit];
  game.state.players.player.deck = [createCardInstance({ name: 'Deck Card' }, 'player')];
  game.state.players.player.reserve = { normal: 4, soul: 0 };

  const accelRes = await game.executeAccel('player', accelSpirit.id);
  assert.equal(accelRes.success, true, 'Generic Flash Accel must succeed in Main Step');
  assert.equal(accelRes.zone, 'removed', 'Accel card sent to removed zone');
  assert.equal(game.state.players.player.removed.length, 1);
});

test('PHASE-M3.1-GEN-04: Non-active player cannot activate Flash during opponent Main Step', async () => {
  const game = createGame();
  const opponentFlashMagic = createCardInstance({
    id: 'OPP_FLASH_01',
    name: 'Opponent Defense Flash',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - Target Spirit gets +2000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_opp_flash',
          header: { timing: 'FLASH', isFlash: true },
          clauses: [{ op: { op: 'BP_BUFF', amount: 2000 } }]
        }
      ]
    }
  }, 'opponent');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player'; // Player's turn, opponent is NOT active player
  game.state.players.opponent.hand = [opponentFlashMagic];
  game.state.players.opponent.reserve = { normal: 5, soul: 0 };

  // Validation function check
  const valRes = validateFlashTiming(opponentFlashMagic, game.state, 'opponent');
  assert.equal(valRes.allowed, false, 'Non-active player cannot activate Flash during opponent Main Step');
  assert.equal(valRes.code, 'NOT_ACTIVE_PLAYER');

  // Execution check
  const playRes = await game.playCard(opponentFlashMagic.id, [], 'opponent');
  assert.equal(playRes.success, false);
  assert.equal(playRes.reason, 'NOT_ACTIVE_PLAYER');
});

test('PHASE-M3.1-GEN-05: Flash activations rejected outside Main and Attack steps', async () => {
  const game = createGame();
  const flashCard = createCardInstance({
    id: 'FLASH_STEPS_01',
    name: 'Test Flash Card',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Draw 1 card.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [] }]
    }
  }, 'player');

  const invalidSteps = ['START', 'CORE', 'DRAW', 'REFRESH', 'END'];
  for (const step of invalidSteps) {
    game.state.step = step;
    game.state.activePlayer = 'player';
    const valRes = validateFlashTiming(flashCard, game.state, 'player');
    assert.equal(valRes.allowed, false, `Flash must be rejected in ${step} step`);
    assert.equal(valRes.code, 'INVALID_STEP_FOR_FLASH');
  }
});

test('PHASE-M3.1-GEN-06: Consecutive Flash activations in Main Step do not open response windows or pass priority', async () => {
  const game = createGame();
  const flash1 = createCardInstance({
    id: 'FLASH_SEQ_01',
    name: 'Flash Seq 1',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Draw 1 card.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }]
    }
  }, 'player');

  const flash2 = createCardInstance({
    id: 'FLASH_SEQ_02',
    name: 'Flash Seq 2',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Draw 1 card.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [flash1, flash2];
  game.state.players.player.deck = [
    createCardInstance({ name: 'D1' }, 'player'),
    createCardInstance({ name: 'D2' }, 'player')
  ];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  // Play Flash 1
  const res1 = await game.playCard(flash1.id, [], 'player');
  assert.equal(res1.success, true);
  assert.equal(game.state.activePlayer, 'player', 'Player retains active player priority');
  assert.equal(game.state.responseWindows?.length || 0, 0, 'No battle response window created in Main Step');

  // Play Flash 2 immediately without opponent priority intervention
  const res2 = await game.playCard(flash2.id, [], 'player');
  assert.equal(res2.success, true);
  assert.equal(game.state.activePlayer, 'player');
  assert.equal(game.state.players.player.grave.length, 2);
});
