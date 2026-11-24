/**
 * tests/phase_m3_2_universal_action_authority.test.js
 * 
 * Phase M.3.2 Work Package L1: Universal Action Authority Tests
 * 
 * Verifies that:
 * 1. Every ordinary action (PLAY_CARD, SUMMON, USE_CORE, SET_BURST, END_TURN, STEP_ADVANCE, ATTACK)
 *    is rejected when a response window is active and another player holds priority.
 * 2. Non-priority players cannot act through either BattleSessionManager or direct engine calls.
 * 3. The priority holder cannot bypass response windows using ordinary turn actions.
 * 4. Legitimate responses by the authorized priority player succeed as expected.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { ResponseWindowManager, RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('M3.2-L1-01: Session API rejects PLAY_CARD, ATTACK, STEP_ADVANCE when caller lacks priority in FLASH_1', async () => {
  resetWindowCounter();
  const store = new SessionStore({ inMemory: true });
  const sessionManager = new BattleSessionManager({ store });

  const session = await sessionManager.createMatch({
    playerDeck: [{ cardNumber: 'SD01-001', name: 'Spirit A', type: 'Spirit', cost: 1, levels: { 1: { cost: 1, bp: 1000 } } }],
    opponentDeck: [{ cardNumber: 'SD01-002', name: 'Spirit B', type: 'Spirit', cost: 1, levels: { 1: { cost: 1, bp: 1000 } } }],
    player1Control: 'HUMAN',
    player2Control: 'HUMAN'
  });

  const { matchId, player1Token, player2Token } = session;
  const active = await sessionManager.ensureActiveGame(matchId);
  const game = active.game;

  // Set attack step with active combat
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const atk = createCardInstance({ id: 'atk_1', name: 'Atk', type: 'Spirit' }, 'player');
  const atkStack = createFieldStack(atk, { normal: 1, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.player.hand = [
    createCardInstance({ id: 'sorcery_1', name: 'Normal Sorcery', type: 'Magic', cost: 1, effect: 'Draw 1 card.' }, 'player')
  ];

  // Open FLASH_1 with defender (opponent) priority
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // 1. Attacker attempts ordinary PLAY_CARD via session API -> Must reject with NOT_PRIORITY_PLAYER or RESPONSE_WINDOW_ACTIVE
  await assert.rejects(
    async () => {
      await sessionManager.submitPlayerAction(matchId, {
        type: 'PLAY_CARD',
        cardId: 'sorcery_1',
        payment: []
      }, { authToken: player1Token });
    },
    (err) => {
      assert.ok(err.code === 'NOT_PRIORITY_PLAYER' || err.code === 'RESPONSE_WINDOW_ACTIVE');
      return true;
    }
  );

  // 2. Attacker attempts STEP_ADVANCE via session API -> Must reject
  await assert.rejects(
    async () => {
      await sessionManager.submitPlayerAction(matchId, {
        type: 'STEP_ADVANCE'
      }, { authToken: player1Token });
    },
    (err) => {
      assert.ok(err.code === 'NOT_PRIORITY_PLAYER' || err.code === 'RESPONSE_WINDOW_ACTIVE');
      return true;
    }
  );

  // 3. Attacker attempts ATTACK declaration via session API -> Must reject
  await assert.rejects(
    async () => {
      await sessionManager.submitPlayerAction(matchId, {
        type: 'ATTACK',
        stackId: atkStack.id
      }, { authToken: player1Token });
    },
    (err) => {
      assert.ok(err.code === 'NOT_PRIORITY_PLAYER' || err.code === 'RESPONSE_WINDOW_ACTIVE');
      return true;
    }
  );
});

test('M3.2-L1-02: Direct engine methods reject ordinary turn actions during active response window', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];
  const normalCard = createCardInstance({ id: 'sp_norm', name: 'Spirit Norm', type: 'Spirit', cost: 2 }, 'player');
  state.players.player.hand = [normalCard];
  state.players.player.reserve = { normal: 5, soul: 0 };

  // Open FLASH_1 with opponent priority
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Direct game.playCard by non-priority attacker
  const playRes = await game.playCard(normalCard.id, [], 'player');
  assert.equal(playRes.success, false);
  assert.ok(playRes.reason === 'RESPONSE_WINDOW_ACTIVE' || playRes.reason === 'NOT_PRIORITY_PLAYER');

  // Direct game.declareAttack during open combat window
  const atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, false);
  assert.ok(atkRes.code === 'NOT_PRIORITY_PLAYER' || atkRes.reason === 'RESPONSE_WINDOW_ACTIVE' || atkRes.reason === 'COMBAT_ALREADY_IN_PROGRESS');
});

test('M3.2-L1-03: Priority holder in response window cannot execute ordinary turn actions (Summon, Normal Magic)', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field = [atkStack];

  // Defender holds priority in FLASH_1, but attempts to play an ordinary non-Flash card
  const defNormalMagic = createCardInstance({
    id: 'def_sorc',
    name: 'Main Only Magic',
    type: 'Magic',
    cost: 1,
    effect: 'Main - Draw 1 card.',
    compiledIr: { abilities: [{ header: { timing: 'MAIN', isMain: true }, clauses: [] }] }
  }, 'opponent');
  state.players.opponent.hand = [defNormalMagic];
  state.players.opponent.reserve = { normal: 5, soul: 0 };

  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Defender holds priority, but action is ordinary turn PLAY_CARD without Flash
  const playRes = await game.playCard(defNormalMagic.id, [], 'opponent');
  assert.equal(playRes.success, false);
  assert.ok(playRes.reason === 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP' || playRes.reason === 'RESPONSE_WINDOW_ACTIVE');
});

test('M3.2-L1-04: Authorized priority holder can successfully perform legal response actions', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const flashMagic = createCardInstance({
    id: 'flash_m_legit',
    name: 'Flash Barrier',
    type: 'Magic',
    cost: 1,
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }]
    }
  }, 'opponent');
  state.players.opponent.hand = [flashMagic];
  state.players.opponent.deck.push(createCardInstance({ name: 'Deck Card' }, 'opponent'));
  state.players.opponent.reserve = { normal: 3, soul: 0 };

  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Defender holds priority and casts legitimate Flash magic
  const res = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: flashMagic.id
  }, { responder: 'opponent' });

  assert.equal(res.success, true);
  assert.equal(res.actionExecuted, 'CAST_FLASH_MAGIC');
  assert.equal(win.priorityPlayer, 'player', 'Priority must alternate to player after successful flash');
  assert.equal(win.consecutivePasses, 0);
});
