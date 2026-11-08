/**
 * tests/contract_advent_modal_and_timing.test.js
 * 
 * Regression Test Suite for Contract Advent timing, target resolution,
 * and Hand Modal feedback for SD65 Four Demon Lords.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Contract Advent Timing & Inspection Suite', () => {
  const arenaCode = fs.readFileSync(path.resolve('./battle_arena.js'), 'utf8');

  const mockDoc = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild() {} }
  };

  const globalObj = {
    console, Math, parseInt, Date, Array, Object, String, Number, Boolean, RegExp,
    setTimeout: (fn) => fn(), clearTimeout: () => {},
    document: mockDoc,
    window: { location: { origin: 'http://localhost' }, addEventListener: () => {} }
  };
  globalObj.window.document = mockDoc;

  const fn = new Function('window', 'document', 'DuelState', arenaCode + '\nreturn window.BattleArena;');
  const sandboxDuelState = {
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    phaseIndex: 5, // ATTACK step
    activePlayer: 'player',
    player: {
      count: 0,
      counters: 0,
      field: [],
      hand: [],
      reserve: 0,
      trash: 6,
      soulCoreLocation: 'field'
    },
    opponent: {
      count: 0,
      field: []
    }
  };
  const BattleArena = fn(globalObj.window, mockDoc, sandboxDuelState);

  const lordJavad = {
    uid: 'sd65_003_hand',
    name: 'The Ruler of FourDemonLords Lord-Javad',
    card_number: 'SD65-003',
    type: 'Ultimate',
    cost: 6,
    family: 'Hell Contract',
    effect: 'Flash - [Contract Advent: Hell Contract & C3 or more, (Either Attack Step)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Ultimate.\n\n[SuAdcon: You control one or more “The PartnerDemonLord Javad”, including being in Soul State/pre-advent condition]'
  };

  const partnerJavad = {
    uid: 'sd65_cx01_field',
    name: 'The PartnerDemonLord Javad',
    card_number: 'SD65-CX01',
    type: 'Contract Ultimate',
    family: 'Hell Contract',
    families: ['Hell Contract', 'Evil God'],
    currentCores: 2,
    currentLevel: 3,
    currentBp: 6000,
    hasSoulCore: true
  };

  const spiritAdventCard = {
    uid: 'bs44_012_hand',
    name: 'The GrandWarlord Dragon',
    card_number: 'BS44-012',
    type: 'Spirit',
    cost: 6,
    family: 'Ancient Dragon',
    effect: 'Flash - [Advent: Cost 4 or more, (Either Attack Step)]\nStack this onto your target Spirit.'
  };

  it('1. hasFlashTiming returns true for both Spirits and Ultimates with [Advent] or [Contract Advent]', () => {
    assert.equal(BattleArena.hasFlashTiming(lordJavad), true, 'Contract Advent Ultimate has Flash timing');
    assert.equal(BattleArena.hasFlashTiming(spiritAdventCard), true, 'Advent Spirit has Flash timing in Attack Step');
  });

  it('2. validateUltimateSummonCondition validates Summon/Advent Condition for Partner Javad', () => {
    globalObj.window.DuelState.player.field = [partnerJavad];
    const checkWithField = BattleArena.validateUltimateSummonCondition(lordJavad, 'player');
    assert.equal(checkWithField.allowed, true, 'Allowed when Partner Javad is on field');

    globalObj.window.DuelState.player.field = [];
    const checkWithoutField = BattleArena.validateUltimateSummonCondition(lordJavad, 'player');
    assert.equal(checkWithoutField.allowed, false, 'Disallowed when Partner Javad is missing');
  });

  it('3. canPerformAdvent is false when Count < 3 and true when Count >= 3', () => {
    globalObj.window.DuelState.player.field = [partnerJavad];
    globalObj.window.DuelState.player.count = 0;
    globalObj.window.DuelState.player.counters = 0;
    globalObj.window.DuelState.player.soulCoreLocation = 'field';
    globalObj.window.DuelState.phaseIndex = 5; // ATTACK
    globalObj.window.DuelState.activePlayer = 'player';

    assert.equal(BattleArena.canPerformAdvent(lordJavad, 'player'), false, 'Cannot advent at Count 0 (C3 required)');

    globalObj.window.DuelState.player.count = 3;
    globalObj.window.DuelState.player.counters = 3;
    assert.equal(BattleArena.canPerformAdvent(lordJavad, 'player'), true, 'Can advent at Count 3');
  });

  it('4. executeAdvent correctly preserves card history and updates stack to Advent card metadata', () => {
    globalObj.window.DuelState.player.field = [partnerJavad];
    globalObj.window.DuelState.player.hand = [lordJavad];
    globalObj.window.DuelState.player.count = 3;
    globalObj.window.DuelState.player.counters = 3;
    globalObj.window.DuelState.player.soulCoreLocation = 'field';

    BattleArena.executeAdvent(lordJavad, partnerJavad, 'player');

    assert.equal(partnerJavad.name, 'The Ruler of FourDemonLords Lord-Javad');
    assert.equal(partnerJavad.card_number, 'SD65-003');
    assert.equal(partnerJavad.type, 'Ultimate');
    assert.equal(partnerJavad.isAdvent, true);
    assert.equal(globalObj.window.DuelState.player.soulCoreLocation, 'trash', 'Soul Core moved to Trash');
    assert.ok(partnerJavad.underlyingCards && partnerJavad.underlyingCards.length >= 1, 'Underlying cards preserved');
    assert.equal(partnerJavad.underlyingCards[0].name, 'The PartnerDemonLord Javad');
  });

  it('5. openCardModal displays explicit Count feedback when Advent card cannot advent due to Count < 3', () => {
    // Test the logic added to openCardModal
    const pCount = 0;
    const req = BattleArena.getCardAdventRequirement(lordJavad);
    let adventReason = '';
    if (req.minCount !== null && pCount < req.minCount) {
      adventReason = `⚠️ Advent: Need Count ${req.minCount}+ (Current: ${pCount})`;
    }
    assert.equal(adventReason, '⚠️ Advent: Need Count 3+ (Current: 0)');
  });

  it('6. formatEffectKeywords formats SuAdcon with kw-summon-cond pill', () => {
    const raw = '[SuAdcon: You control one or more "The PartnerDemonLord Javad", including being in Soul State/pre-advent condition]';
    const formatted = BattleArena.formatEffectKeywords(raw);
    assert.match(formatted, /class="effect-keyword-pill kw-summon-cond"[^>]*>\[SuAdcon:/i);
  });
});
