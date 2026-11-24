import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  RESPONSE_WINDOW_TYPES,
  resetWindowCounter
} from '../engine/windows.js';

test('PHASE-M3.1-RESP-01: Battle Flash 1 grants defender first priority', async () => {
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_ATTACKER_01', name: 'Attacker Spirit', type: 'Spirit', cost: 3 }, 'player');
  const defender = createCardInstance({ id: 'SP_DEFENDER_01', name: 'Defender Spirit', type: 'Spirit', cost: 3 }, 'opponent');

  const atkStack = createFieldStack(attacker, { normal: 2, soul: 0 });
  const defStack = createFieldStack(defender, { normal: 2, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [defStack];
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  const attRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(attRes.success, true);
  assert.equal(attRes.stage, 'FLASH_1');

  // Verify first priority player is defender ('opponent')
  assert.equal(attRes.flashPriority, 'opponent', 'Defender must receive first priority in Flash 1');

  const curWin = game.windows.getCurrentWindow();
  assert.ok(curWin, 'Flash 1 window should be active');
  assert.equal(curWin.priorityPlayer, 'opponent', 'Defending player holds priority 1 in Flash 1');
});

test('PHASE-M3.1-RESP-02: Priority alternates between defender and attacker on PASS', async () => {
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_ATTACKER_02', name: 'Attacker Spirit', type: 'Spirit', cost: 3 }, 'player');
  const defender = createCardInstance({ id: 'SP_DEFENDER_02', name: 'Defender Spirit', type: 'Spirit', cost: 3 }, 'opponent');

  const atkStack = createFieldStack(attacker, { normal: 2, soul: 0 });
  const defStack = createFieldStack(defender, { normal: 2, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [defStack];
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  await game.declareAttack(atkStack.id, 'player');

  // Defender passes
  const pass1 = await game.passPriority('opponent');
  assert.equal(pass1.success, true);
  assert.equal(pass1.consecutivePasses, 1);
  assert.equal(pass1.nextPriority, 'player', 'Priority must alternate to player (attacker)');
  assert.equal(pass1.windowClosed, false, 'Window must remain open after 1 pass');
});

test('PHASE-M3.1-RESP-03: Two consecutive passes close battle Flash Timing window', async () => {
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_ATTACKER_03', name: 'Attacker Spirit', type: 'Spirit', cost: 3 }, 'player');
  const defender = createCardInstance({ id: 'SP_DEFENDER_03', name: 'Defender Spirit', type: 'Spirit', cost: 3 }, 'opponent');

  const atkStack = createFieldStack(attacker, { normal: 2, soul: 0 });
  const defStack = createFieldStack(defender, { normal: 2, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [defStack];
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  await game.declareAttack(atkStack.id, 'player');

  // Defender passes
  await game.passPriority('opponent');

  // Attacker passes -> 2 consecutive passes closes Flash 1
  const pass2 = await game.passPriority('player');
  assert.equal(pass2.success, true);
  assert.equal(pass2.closed, true, 'Window must close after 2 consecutive passes');
  assert.equal(pass2.windowClosed, true);

  // Next window in lifecycle: BLOCK_DECLARATION
  const nextWin = game.windows.getCurrentWindow();
  assert.ok(nextWin);
  assert.equal(nextWin.windowType, RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION);
});

test('PHASE-M3.1-RESP-04: Passing once does not permanently surrender flash opportunity', async () => {
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_ATTACKER_04', name: 'Attacker Spirit', type: 'Spirit', cost: 3 }, 'player');
  const defender = createCardInstance({ id: 'SP_DEFENDER_04', name: 'Defender Spirit', type: 'Spirit', cost: 3 }, 'opponent');

  const flashCard = createCardInstance({
    id: 'FLASH_ATTACKER_04',
    name: 'Flash Power',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Target Spirit gets +1000 BP.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }] }]
    }
  }, 'player');

  const atkStack = createFieldStack(attacker, { normal: 2, soul: 0 });
  const defStack = createFieldStack(defender, { normal: 2, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [defStack];
  game.state.players.player.hand = [flashCard];
  game.state.players.player.reserve = { normal: 5, soul: 0 };
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  await game.declareAttack(atkStack.id, 'player');

  // 1. Defender passes first
  const passDef = await game.passPriority('opponent');
  assert.equal(passDef.nextPriority, 'player');
  assert.equal(passDef.consecutivePasses, 1);

  // 2. Attacker plays flash magic via window response
  const actRes = await game.windows.submitResponse({
    action: 'CAST_FLASH_MAGIC',
    cardId: flashCard.id
  }, { responder: 'player' });
  assert.equal(actRes.success, true);

  // 3. Consecutive passes reset to 0, and defender gets priority BACK
  const win = game.windows.getCurrentWindow();
  assert.equal(actRes.consecutivePasses, 0, 'Consecutive passes must reset on flash action');
  assert.equal(win.consecutivePasses, 0);
  assert.equal(win.priorityPlayer, 'opponent', 'Priority returned to defender');
});

test('PHASE-M3.1-RESP-05: Main Step Flash activations do not create artificial response windows', async () => {
  resetWindowCounter();
  const game = createGame();
  const flashMagic = createCardInstance({
    id: 'MAIN_FLASH_NOWIN_01',
    name: 'Main Flash Solo',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Draw 1 card.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [flashMagic];
  game.state.players.player.deck = [createCardInstance({ name: 'Deck' }, 'player')];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  const playRes = await game.playCard(flashMagic.id, [], 'player');
  assert.equal(playRes.success, true);

  // Assert no response windows opened
  assert.equal(game.state.responseWindows?.length || 0, 0, 'No response window may be created in Main Step');
  // Assert turn priority remains with player
  assert.equal(game.state.activePlayer, 'player');
});

test('PHASE-M3.1-RESP-06: Second Flash Timing occurs only after block is declared', async () => {
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_ATTACKER_06', name: 'Attacker Spirit', type: 'Spirit', cost: 3 }, 'player');
  const blocker = createCardInstance({ id: 'SP_BLOCKER_06', name: 'Blocker Spirit', type: 'Spirit', cost: 3 }, 'opponent');

  const atkStack = createFieldStack(attacker, { normal: 2, soul: 0 });
  const blkStack = createFieldStack(blocker, { normal: 2, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [blkStack];
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  // Open Block Declaration window
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION,
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  game.state.combat = {
    attackerStackId: atkStack.id,
    attackerSide: 'player',
    blockerStackId: null,
    stage: 'BLOCK'
  };

  // Defender declares block
  const blockRes = await game.windows.submitResponse({
    action: 'DECLARE_BLOCK',
    stackId: blkStack.id
  }, { responder: 'opponent' });

  assert.equal(blockRes.success, true);
  assert.equal(blockRes.openedFlash2, true, 'Block declaration opens Flash 2 window');

  const flash2Win = game.windows.getCurrentWindow();
  assert.ok(flash2Win, 'Flash 2 window active');
  assert.equal(flash2Win.windowType, RESPONSE_WINDOW_TYPES.FLASH_2);
  assert.equal(flash2Win.priorityPlayer, 'opponent', 'Defender receives first priority in Flash 2');
});
