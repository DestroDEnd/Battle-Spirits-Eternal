import assert from 'node:assert/strict';
import { createGame } from '../../engine/index.js';
import { createCardInstance, createFieldStack } from '../../engine/state.js';
import { ResponseWindowManager, RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../../engine/windows.js';
import { validateFlashTiming } from '../../engine/flash_timing.js';

console.log('=== RUNNING DEFECT REPRODUCTION AUDIT (PHASE A) ===');

// --- DEFECT A1: Ordinary action bypass during response windows ---
console.log('\n--- Checking Defect A1: Ordinary action bypass during response windows ---');
{
  resetWindowCounter();
  const game = createGame();
  const attacker = createCardInstance({ id: 'ATK_SP', name: 'Atk Spirit', type: 'Spirit' }, 'player');
  const defender = createCardInstance({ id: 'DEF_SP', name: 'Def Spirit', type: 'Spirit' }, 'opponent');
  const magicCard = createCardInstance({
    id: 'FLASH_MAGIC',
    name: 'Flash Magic',
    type: 'Magic',
    cost: 1,
    effect: 'Flash - Give a Spirit +1000 BP.',
    compiledIr: { abilities: [{ header: { isFlash: true, timing: 'FLASH' }, clauses: [] }] }
  }, 'player');

  game.state.players.player.field = [createFieldStack(attacker, { normal: 1, soul: 0 })];
  game.state.players.opponent.field = [createFieldStack(defender, { normal: 1, soul: 0 })];
  game.state.players.player.hand = [magicCard];
  game.state.players.player.reserve = { normal: 5, soul: 0 };
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  // Open FLASH_1 window with defender holding priority
  const win = await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  console.log(`Current Window: ${win.windowType}, Priority Player: ${win.priorityPlayer}`);
  // Attacker attempts to play card while defender holds priority:
  const playRes = await game.playCard(magicCard.id, [], 'player');
  console.log(`Defect A1 Result: Attacker playCard returned success=${playRes.success}, reason=${playRes.reason}`);
  if (playRes.success) {
    console.log('>>> CONFIRMED DEFECT A1: Attacker bypassed response window and played card while defender held priority!');
  } else {
    console.log('>>> Defect A1 NOT present or already guarded.');
  }
}

// --- DEFECT A2: Direct block declaration bypasses Flash 1 ---
console.log('\n--- Checking Defect A2: Direct block declaration bypasses Flash 1 ---');
{
  resetWindowCounter();
  const game = createGame();
  const atkStack = createFieldStack(createCardInstance({ name: 'Atk' }, 'player'), { normal: 1, soul: 0 });
  const blkStack = createFieldStack(createCardInstance({ name: 'Blk' }, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.player.field = [atkStack];
  game.state.players.opponent.field = [blkStack];
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  // Declare attack to open FLASH_1
  await game.declareAttack(atkStack.id, 'player');
  const win = game.windows.getCurrentWindow();
  console.log(`Current Window: ${win?.windowType}`);

  // Call game.declareBlock directly while FLASH_1 is still open
  const blkRes = await game.declareBlock(blkStack.id, 'opponent');
  console.log(`Defect A2 Result: declareBlock returned success=${blkRes.success}`);
  const winAfter = game.windows.getCurrentWindow();
  console.log(`Window after direct declareBlock: ${winAfter?.windowType || 'NONE'}`);
  if (blkRes.success && (!winAfter || winAfter.windowType !== RESPONSE_WINDOW_TYPES.FLASH_1)) {
    console.log('>>> CONFIRMED DEFECT A2: Direct declareBlock bypassed Flash 1 timing and closed the window!');
  } else {
    console.log('>>> Defect A2 NOT present or already guarded.');
  }
}

// --- DEFECT A3: Generic Flash field ability incorrectly rejected in Main Step ---
console.log('\n--- Checking Defect A3: Generic Flash field ability in Main Step ---');
{
  const game = createGame();
  const flashSpirit = createCardInstance({
    id: 'FLASH_SPIRIT_01',
    name: 'Flash Knight',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_knight_flash',
          physicalId: 'phy_knight_flash',
          header: { timing: 'FLASH', isFlash: true, isMain: false, levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.field = [createFieldStack(flashSpirit, { normal: 2, soul: 0 })];
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';

  const actRes = await game.activateAbility(flashSpirit.id, 'phy_knight_flash', 'player');
  console.log(`Defect A3 Result: activateAbility returned success=${actRes.success}, code=${actRes.code}, reason=${actRes.reason}`);
  if (!actRes.success && actRes.code === 'FLASH_ONLY_DURING_ATTACK_STEP') {
    console.log('>>> CONFIRMED DEFECT A3: Generic Flash field ability rejected in Main Step with FLASH_ONLY_DURING_ATTACK_STEP!');
  } else {
    console.log('>>> Defect A3 NOT present or already guarded.');
  }
}

// --- DEFECT A4: Incorrect handling of (When Attacks) Flash ---
console.log('\n--- Checking Defect A4: (When Attacks) Flash handling ---');
{
  const game = createGame();
  const triggerSpirit = createCardInstance({
    id: 'TRIGGER_SPIRIT',
    name: 'Trigger Spirit',
    type: 'Spirit',
    cost: 4,
    levels: { 1: { cost: 1, bp: 4000 } },
    effect: '[LV1] (When Attacks) Flash: Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_when_att',
          physicalId: 'phy_when_att',
          header: { timing: 'FLASH', isFlash: true, timingLabel: '(When Attacks) Flash', levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.players.player.field = [createFieldStack(triggerSpirit, { normal: 2, soul: 0 })];
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';

  const actRes = await game.activateAbility(triggerSpirit.id, 'phy_when_att', 'player');
  console.log(`Defect A4 Result: activateAbility returned success=${actRes.success}, code=${actRes.code}`);
  if (!actRes.success && actRes.code === 'FLASH_ONLY_DURING_ATTACK_STEP') {
    console.log('>>> CONFIRMED DEFECT A4: (When Attacks) Flash rejected with FLASH_ONLY_DURING_ATTACK_STEP instead of being identified as a triggered ability!');
  } else {
    console.log(`>>> Defect A4 status: code is ${actRes.code}`);
  }
}

// --- DEFECT A5: Flash timing validator does not enforce response-window priority ---
console.log('\n--- Checking Defect A5: Flash timing validator does not enforce response-window priority ---');
{
  resetWindowCounter();
  const game = createGame();
  const flashMagic = createCardInstance({
    id: 'FLASH_MAGIC_A5',
    name: 'Flash Magic A5',
    type: 'Magic',
    effect: 'Flash - Draw 1 card.',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [] }]
    }
  }, 'player');

  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';

  // Open window where OPPONENT holds priority
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'opponent'
  });

  // Check validation for player who does NOT hold priority
  const valRes = validateFlashTiming(flashMagic, game.state, 'player');
  console.log(`Defect A5 Result: validateFlashTiming for non-priority player returned allowed=${valRes.allowed}, code=${valRes.code}`);
  if (valRes.allowed === true) {
    console.log('>>> CONFIRMED DEFECT A5: validateFlashTiming returned allowed=true for player who does NOT hold response window priority!');
  } else {
    console.log('>>> Defect A5 NOT present or already guarded.');
  }
}
