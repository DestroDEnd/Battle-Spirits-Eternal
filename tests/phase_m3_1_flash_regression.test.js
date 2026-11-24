import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import {
  classifyFlashTiming,
  validateFlashTiming,
  FLASH_TIMING_QUALIFIERS
} from '../engine/flash_timing.js';
import { parseAbilityHeaders } from '../compiler/header_parser.js';

test('PHASE-M3.1-REG-01: Magic cards with both Main and Flash can choose either during Main Step', async () => {
  const game = createGame();
  const dualCard = createCardInstance({
    id: 'DUAL_TIMING_MAGIC_01',
    name: 'Dual Timing Command',
    type: 'Magic',
    cost: 3,
    effect: 'Main - Draw 2 cards. Flash - Target Spirit gets +3000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_main_draw',
          header: { timing: 'MAIN', isMain: true, isFlash: false },
          clauses: [{ op: { op: 'DRAW', count: 2 } }]
        },
        {
          id: 'ab_flash_buff',
          header: { timing: 'FLASH', isFlash: true, isMain: false },
          clauses: [{ op: { op: 'BP_BUFF', amount: 3000 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [dualCard];
  game.state.players.player.deck = [
    createCardInstance({ name: 'D1' }, 'player'),
    createCardInstance({ name: 'D2' }, 'player')
  ];
  game.state.players.player.reserve = { normal: 6, soul: 0 };

  // Cast with explicit options.timing = 'MAIN'
  const resMain = await game.playCard(dualCard.id, [], 'player', { timing: 'MAIN' });
  assert.equal(resMain.success, true);
  assert.equal(game.state.players.player.hand.length, 2, 'Drew 2 cards via Main ability');

  // Now create a duplicate and cast with explicit options.timing = 'FLASH' in Main step
  const dualCard2 = createCardInstance({
    id: 'DUAL_TIMING_MAGIC_02',
    name: 'Dual Timing Command 2',
    type: 'Magic',
    cost: 3,
    effect: 'Main - Draw 2 cards. Flash - Target Spirit gets +3000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_main_draw2',
          header: { timing: 'MAIN', isMain: true, isFlash: false },
          clauses: [{ op: { op: 'DRAW', count: 2 } }]
        },
        {
          id: 'ab_flash_buff2',
          header: { timing: 'FLASH', isFlash: true, isMain: false },
          clauses: [{ op: { op: 'BP_BUFF', amount: 3000 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.hand.push(dualCard2);
  const resFlash = await game.playCard(dualCard2.id, [], 'player', { timing: 'FLASH' });
  assert.equal(resFlash.success, true);
  assert.equal(resFlash.abilityResults.length, 1);
});

test('PHASE-M3.1-REG-02: Magic cards with only Main cannot be cast during Attack Step', async () => {
  const game = createGame();
  const mainOnlyMagic = createCardInstance({
    id: 'MAIN_ONLY_MAGIC_01',
    name: 'Pure Main Sorcery',
    type: 'Magic',
    cost: 2,
    effect: 'Main - Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_pure_main',
          header: { timing: 'MAIN', isMain: true, isFlash: false },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [mainOnlyMagic];
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  const res = await game.playCard(mainOnlyMagic.id, [], 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP');
});

test('PHASE-M3.1-REG-03: Accel with Flash executes to removed zone and can be summoned in Main Step', async () => {
  const game = createGame();
  const accelCard = createCardInstance({
    id: 'REG_ACCEL_01',
    name: 'Accel Pioneer',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 } },
    effect: 'Flash - [Accel: Cost 1] Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_pioneer_accel',
          header: { keyword: 'Accel', isFlash: true, timing: 'FLASH' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.hand = [accelCard];
  game.state.players.player.deck = [createCardInstance({ name: 'Deck 1' }, 'player')];
  game.state.players.player.reserve = { normal: 10, soul: 0 };

  // 1. Execute Flash Accel in Main Step
  const resAccel = await game.executeAccel('player', accelCard.id);
  assert.equal(resAccel.success, true);
  assert.equal(resAccel.zone, 'removed');
  assert.equal(game.state.players.player.removed.length, 1);
  assert.equal(game.state.players.player.removed[0].id, accelCard.id);

  // 2. Summon from Removed Zone in Main Step
  const resSummon = await game.playCard(accelCard.id, [], 'player');
  assert.equal(resSummon.success, true);
  assert.equal(game.state.players.player.removed.length, 0);
  assert.equal(game.state.players.player.field.length, 1);
  assert.equal(game.state.players.player.field[0].top.id, accelCard.id);
});

test('PHASE-M3.1-REG-04: Combat resolution and life damage intact with Flash corrections', async () => {
  const game = createGame();
  const attacker = createCardInstance({ id: 'SP_UNBLOCKED_ATK', name: 'Direct Attacker', bp: 5000, type: 'Spirit', symbols: ['Red'] }, 'player');
  const atkStack = createFieldStack(attacker, { normal: 1, soul: 0 });
  atkStack.state = 'REFRESHED';
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.life = 5;
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  // Declare Attack
  await game.declareAttack(atkStack.id, 'player');

  // Both players pass Flash 1
  await game.passPriority('opponent');
  await game.passPriority('player');

  // Opponent passes block
  const unblockRes = await game.windows.submitResponse({ action: 'PASS_BLOCK' }, { responder: 'opponent' });
  assert.equal(unblockRes.success, true);
  assert.equal(unblockRes.skippedFlash2, true, 'Second Flash skipped on unblocked attack');

  // Life damage applied
  const remainingLife = (typeof game.state.players.opponent.life === 'number')
    ? game.state.players.opponent.life
    : game.state.players.opponent.life.normal;
  assert.equal(remainingLife, 4, 'Defender life reduced by 1');
});

test('PHASE-M3.1-REG-05: Compiler attaches flashTimingSpec to compiled ability headers', () => {
  const parsed = parseAbilityHeaders('Flash - (Your Attack Step) Target Spirit gets +3000 BP.');
  assert.ok(parsed.flashTimingSpec, 'flashTimingSpec must be present');
  assert.equal(parsed.flashTimingSpec.isFlash, true);
  assert.equal(parsed.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP);
  assert.equal(parsed.flashTimingSpec.additionalRestrictions.allowedTurnOwners.includes('SELF'), true);
});

test('PHASE-M3.1-REG-06: Classification supports Japanese keywords and bracketed formats', () => {
  const jpCard = {
    effect: '【フラッシュ】自分のアタックステップ：相手のスピリット1体を疲労させる。'
  };
  const spec = classifyFlashTiming(jpCard);
  assert.equal(spec.isFlash, true);
  assert.equal(spec.timingQualifier, FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP);

  const jpEitherCard = {
    effect: '【フラッシュ】お互いのアタックステップ：ボイドからコア1個をリザーブに置く。'
  };
  const specEither = classifyFlashTiming(jpEitherCard);
  assert.equal(specEither.isFlash, true);
  assert.equal(specEither.timingQualifier, FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP);
});
