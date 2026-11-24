import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  classifyFlashTiming,
  validateFlashTiming,
  FLASH_TIMING_QUALIFIERS
} from '../engine/flash_timing.js';

test('PHASE-M3.1-SPEC-01: (Your Attack Step) qualifier restricts execution to controller attack step', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'RESTR_YOUR_ATTACK_01',
    name: 'Attack Commander Blade',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - (Your Attack Step) Give a Spirit +4000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_your_att',
          header: { timing: 'FLASH', isFlash: true, timingOwner: 'SELF' },
          clauses: [{ op: { op: 'BP_BUFF', amount: 4000 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  // 1. In MAIN step -> MUST FAIL with RESTRICTED_TO_ATTACK_STEP
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const resMain = await game.playCard(card.id, [], 'player');
  assert.equal(resMain.success, false);
  assert.equal(resMain.code, 'RESTRICTED_TO_ATTACK_STEP');

  // 2. In OPPONENT attack step -> MUST FAIL with YOUR_ATTACK_STEP_ONLY
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'opponent';
  const resOpp = await game.playCard(card.id, [], 'player');
  assert.equal(resOpp.success, false);
  assert.equal(resOpp.code, 'YOUR_ATTACK_STEP_ONLY');

  // 3. In CONTROLLER attack step -> MUST SUCCEED
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const resAtt = await game.playCard(card.id, [], 'player');
  assert.equal(resAtt.success, true);
});

test('PHASE-M3.1-SPEC-02: (Opponent Attack Step) qualifier restricts execution to opponent attack step', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'RESTR_OPP_ATTACK_01',
    name: 'Defensive Barrier',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - (Opponent\'s Attack Step) End the attack step.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_opp_att',
          header: { timing: 'FLASH', isFlash: true, timingOwner: 'OPPONENT' },
          clauses: []
        }
      ]
    }
  }, 'player');

  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  // 1. In MAIN step -> MUST FAIL with RESTRICTED_TO_ATTACK_STEP
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const resMain = await game.playCard(card.id, [], 'player');
  assert.equal(resMain.success, false);
  assert.equal(resMain.code, 'RESTRICTED_TO_ATTACK_STEP');

  // 2. In CONTROLLER attack step -> MUST FAIL with OPPONENT_ATTACK_STEP_ONLY
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const resSelf = await game.playCard(card.id, [], 'player');
  assert.equal(resSelf.success, false);
  assert.equal(resSelf.code, 'OPPONENT_ATTACK_STEP_ONLY');

  // 3. In OPPONENT attack step -> MUST SUCCEED
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'opponent';
  const resOpp = await game.playCard(card.id, [], 'player');
  assert.equal(resOpp.success, true);
});

test('PHASE-M3.1-SPEC-03: (Either Attack Step) qualifier permits either attack step but rejects Main Step', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'RESTR_EITHER_ATTACK_01',
    name: 'Dual Phase Surge',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - (Either Attack Step) Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_either_att',
          header: { timing: 'FLASH', isFlash: true, timingOwner: 'EITHER' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.hand = [card];
  game.state.players.player.deck = [
    createCardInstance({ name: 'D1' }, 'player'),
    createCardInstance({ name: 'D2' }, 'player')
  ];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  // 1. In MAIN step -> MUST FAIL with RESTRICTED_TO_ATTACK_STEP
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const resMain = await game.playCard(card.id, [], 'player');
  assert.equal(resMain.success, false);
  assert.equal(resMain.code, 'RESTRICTED_TO_ATTACK_STEP');

  // 2. In CONTROLLER attack step -> Allowed
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const spec = classifyFlashTiming(card);
  assert.equal(spec.timingQualifier, FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP);
  const valSelf = validateFlashTiming(card, game.state, 'player');
  assert.equal(valSelf.allowed, true);

  // 3. In OPPONENT attack step -> Allowed
  game.state.activePlayer = 'opponent';
  const valOpp = validateFlashTiming(card, game.state, 'player');
  assert.equal(valOpp.allowed, true);
});

test('PHASE-M3.1-SPEC-04: During Attack qualifier requires active battle clash', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'RESTR_DURING_ATTACK_01',
    name: 'Clash Interceptor',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - During Attack: Give target Spirit +5000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_during_att',
          header: { timing: 'FLASH', isFlash: true, timingLabel: 'Flash - During Attack' },
          clauses: [{ op: { op: 'BP_BUFF', amount: 5000 } }]
        }
      ]
    }
  }, 'player');

  // 1. In MAIN step -> MUST FAIL
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const valMain = validateFlashTiming(card, game.state, 'player');
  assert.equal(valMain.allowed, false);
  assert.equal(valMain.code, 'RESTRICTED_TO_ATTACK_STEP');

  // 2. In ATTACK step but NO active battle -> MUST FAIL with REQUIRES_ACTIVE_BATTLE
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  game.state.combatEvent = null;
  game.state.inBattle = false;
  game.state.attacker = null;
  const valNoBattle = validateFlashTiming(card, game.state, 'player');
  assert.equal(valNoBattle.allowed, false);
  assert.equal(valNoBattle.code, 'REQUIRES_ACTIVE_BATTLE');

  // 3. In ATTACK step WITH active battle -> Allowed
  game.state.combatEvent = { attacker: 'spirit_01' };
  const valBattle = validateFlashTiming(card, game.state, 'player');
  assert.equal(valBattle.allowed, true);
});

test('PHASE-M3.1-SPEC-05: When Attacks event-triggers cannot be manually activated as free Flash', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'TRIGGER_WHEN_ATTACKS_01',
    name: 'Attack Trigger Dragon',
    type: 'Spirit',
    cost: 5,
    effect: '[LV1][LV2] (When Attacks) Flash: Destroy an opponent\'s Spirit with 4000 BP or less.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_when_att',
          physicalId: 'phy_when_att',
          header: { timing: 'FLASH', isFlash: true, timingLabel: '(When Attacks) Flash' },
          clauses: []
        }
      ]
    }
  }, 'player');

  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field = [stack];
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';

  const valRes = validateFlashTiming(card.compiledIr.abilities[0], game.state, 'player');
  assert.equal(valRes.allowed, false);
  assert.equal(valRes.code, 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE');

  const actRes = await game.activateAbility(card.id, 'phy_when_att', 'player');
  assert.equal(actRes.success, false);
  assert.equal(actRes.code, 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE');
});

test('PHASE-M3.1-SPEC-06: Flash Timing Only qualifier is rejected during Main Step', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'RESTR_FLASH_TIMING_ONLY_01',
    name: 'Battle Flash Only Shield',
    type: 'Magic',
    cost: 2,
    effect: 'Flash - During Flash Timing only: Refresh target Spirit.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_fto',
          header: { timing: 'FLASH', isFlash: true, timingLabel: 'Flash - During Flash Timing only' },
          clauses: []
        }
      ]
    }
  }, 'player');

  // In Main step
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  const valMain = validateFlashTiming(card, game.state, 'player');
  assert.equal(valMain.allowed, false);
  assert.equal(valMain.code, 'RESTRICTED_TO_ATTACK_STEP');

  // In Attack step
  game.state.step = 'ATTACK';
  const valAttack = validateFlashTiming(card, game.state, 'player');
  assert.equal(valAttack.allowed, true);
});
