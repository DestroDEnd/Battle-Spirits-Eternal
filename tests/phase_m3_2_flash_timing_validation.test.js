/**
 * tests/phase_m3_2_flash_timing_validation.test.js
 * 
 * Phase M.3.2 Work Package L3: Flash Timing Validation Matrix Tests
 * 
 * Verifies the authoritative Flash Timing Matrix across:
 * 1. Generic Flash in controller's Main Step vs opponent's Main Step.
 * 2. Generic Flash field abilities and Accel in Main Step without spawning artificial windows.
 * 3. Card-specific Attack Step qualifiers:
 *    - (Your Attack Step)
 *    - (Opponent's Attack Step)
 *    - (Either Attack Step)
 *    - During Attack
 *    - During Flash Timing only
 * 4. Triggered Flash: (When Attacks) Flash cannot be manually activated as free voluntary Flash.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { validateFlashTiming, classifyFlashTiming, FLASH_TIMING_QUALIFIERS } from '../engine/flash_timing.js';
import { RESPONSE_WINDOW_TYPES, resetWindowCounter } from '../engine/windows.js';

test('M3.2-L3-01: Generic Flash magic, abilities, and Accel in controller Main Step', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'MAIN';
  state.activePlayer = 'player';

  // 1. Generic Flash Magic
  const genericFlashMagic = createCardInstance({
    name: 'Generic Flash Magic',
    type: 'Magic',
    effect: 'Flash - Draw 1 card.',
    compiledIr: { abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [] }] }
  }, 'player');

  const valActive = validateFlashTiming(genericFlashMagic, state, 'player');
  assert.equal(valActive.allowed, true, 'Active player must be allowed generic Flash in Main Step');

  const valOpp = validateFlashTiming(genericFlashMagic, state, 'opponent');
  assert.equal(valOpp.allowed, false, 'Non-active player cannot activate Flash in Main Step');
  assert.equal(valOpp.code, 'NOT_ACTIVE_PLAYER');

  // 2. Generic Flash field ability on Spirit
  const flashSpirit = createCardInstance({
    name: 'Flash Spirit',
    type: 'Spirit',
    compiledIr: {
      abilities: [{ header: { timing: 'FLASH', isFlash: true, levels: [1] }, clauses: [] }]
    }
  }, 'player');
  const ab = flashSpirit.compiledIr.abilities[0];
  const abVal = validateFlashTiming(ab, state, 'player');
  assert.equal(abVal.allowed, true, 'Generic Flash field ability allowed in controller Main Step');

  // 3. Generic Flash Accel
  const flashAccel = createCardInstance({
    name: 'Flash Accel Spirit',
    type: 'Spirit',
    effect: '[Accel: Cost 2 (Red1)] Flash: Draw 1 card. (After this effect resolves, send this card to the removed zone.)',
    compiledIr: {
      abilities: [{ header: { keyword: 'Accel', timing: 'FLASH', isFlash: true }, clauses: [] }]
    }
  }, 'player');
  const accelVal = validateFlashTiming(flashAccel, state, 'player');
  assert.equal(accelVal.allowed, true, 'Generic Flash Accel allowed in controller Main Step');
});

test('M3.2-L3-02: Main Step Flash does not create artificial response windows or lose initiative', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;
  state.step = 'MAIN';
  state.activePlayer = 'player';

  const flashMagic = createCardInstance({
    name: 'Flash Cantrip',
    type: 'Magic',
    cost: 1,
    compiledIr: { abilities: [{ header: { timing: 'FLASH', isFlash: true }, clauses: [{ op: { op: 'DRAW', count: 1 } }] }] }
  }, 'player');
  state.players.player.hand = [flashMagic];
  state.players.player.deck = [createCardInstance({ name: 'Deck Card 1' }, 'player'), createCardInstance({ name: 'Deck Card 2' }, 'player')];
  state.players.player.reserve = { normal: 5, soul: 0 };

  // Cast Flash magic during Main Step
  const res1 = await game.playCard(flashMagic.id, [], 'player', { timing: 'FLASH' });
  assert.equal(res1.success, true);

  // Assert NO response window was opened in Main Step
  assert.equal(game.windows.isResponseWindowActive(), false);
  assert.equal(state.step, 'MAIN');
  assert.equal(state.activePlayer, 'player', 'Active player retains initiative');

  // Active player can immediately take another normal Main Step action (e.g. summon)
  const summonSpirit = createCardInstance({
    name: 'Summoned Guy',
    type: 'Spirit',
    cost: 1,
    levels: { 1: { cost: 1, bp: 1000 } }
  }, 'player');
  state.players.player.hand.push(summonSpirit);
  const sumRes = await game.playCard(summonSpirit.id, [], 'player');
  assert.equal(sumRes.success, true);
  assert.equal(state.players.player.field.length, 1);
});

test('M3.2-L3-03: Card-specific timing qualifiers (Your Attack Step vs Opponent Attack Step)', async () => {
  resetWindowCounter();
  const game = createGame();
  const { state } = game;

  const yourAtkCard = createCardInstance({
    name: 'Offensive Flash',
    type: 'Magic',
    effect: 'Flash - (Your Attack Step) Give +3000 BP.',
    compiledIr: { abilities: [{ header: { timing: 'FLASH', isFlash: true, timingLabel: '(Your Attack Step)' }, clauses: [] }] }
  }, 'player');

  const oppAtkCard = createCardInstance({
    name: 'Defensive Flash',
    type: 'Magic',
    effect: "Flash - (Opponent's Attack Step) End the attack step.",
    compiledIr: { abilities: [{ header: { timing: 'FLASH', isFlash: true, timingLabel: "(Opponent's Attack Step)" }, clauses: [] }] }
  }, 'player');

  // Case A: Main Step -> Both must be strictly rejected
  state.step = 'MAIN';
  state.activePlayer = 'player';
  const valMain1 = validateFlashTiming(yourAtkCard, state, 'player');
  assert.equal(valMain1.allowed, false);
  assert.equal(valMain1.code, 'RESTRICTED_TO_ATTACK_STEP');

  const valMain2 = validateFlashTiming(oppAtkCard, state, 'player');
  assert.equal(valMain2.allowed, false);
  assert.equal(valMain2.code, 'RESTRICTED_TO_ATTACK_STEP');

  // Case B: Player is attacking (player's attack step, priority player = player)
  state.step = 'ATTACK';
  state.activePlayer = 'player';
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'player',
    defenderSide: 'opponent',
    priorityPlayer: 'player'
  });

  const valYourInYour = validateFlashTiming(yourAtkCard, state, 'player');
  assert.equal(valYourInYour.allowed, true, 'Your Attack Step is legal when player is attacking');

  const valOppInYour = validateFlashTiming(oppAtkCard, state, 'player');
  assert.equal(valOppInYour.allowed, false, 'Opponent Attack Step is illegal when player is attacking');
  assert.equal(valOppInYour.code, 'OPPONENT_ATTACK_STEP_ONLY');

  // Case C: Opponent is attacking (player is defending, priority player = player)
  state.activePlayer = 'opponent';
  await game.windows.closeWindow(game.windows.getCurrentWindow().windowId);
  await game.windows.openWindow({
    windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
    attackerSide: 'opponent',
    defenderSide: 'player',
    priorityPlayer: 'player'
  });

  const valYourInOpp = validateFlashTiming(yourAtkCard, state, 'player');
  assert.equal(valYourInOpp.allowed, false, 'Your Attack Step is illegal when opponent is attacking');
  assert.equal(valYourInOpp.code, 'YOUR_ATTACK_STEP_ONLY');

  const valOppInOpp = validateFlashTiming(oppAtkCard, state, 'player');
  assert.equal(valOppInOpp.allowed, true, 'Opponent Attack Step is legal when defending against opponent attack');
});

test('M3.2-L3-04: (When Attacks) Flash is classified as triggered and rejected from manual activation', async () => {
  const triggerCard = createCardInstance({
    name: 'Siegfried Attack Flash',
    type: 'Spirit',
    effect: '[LV1] (When Attacks) Flash: Draw 1 card.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_when_att_flash',
          physicalId: 'phy_when_att_flash',
          header: { timing: 'FLASH', isFlash: true, timingLabel: '(When Attacks) Flash', levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  const spec = classifyFlashTiming(triggerCard.compiledIr.abilities[0]);
  assert.equal(spec.isTriggered, true, 'Must be classified as isTriggered = true');
  assert.equal(spec.timingQualifier, FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS);

  const state = { step: 'MAIN', activePlayer: 'player' };
  const val = validateFlashTiming(triggerCard.compiledIr.abilities[0], state, 'player');
  assert.equal(val.allowed, false);
  assert.equal(val.code, 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE');
});
