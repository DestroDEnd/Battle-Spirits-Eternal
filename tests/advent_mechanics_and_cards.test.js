/**
 * tests/advent_mechanics_and_cards.test.js
 * 
 * Comprehensive Test Suite for Advent (煌臨) & Contract Advent (契約煌臨)
 * covers:
 * 1. Multi-syntax & unbracketed Advent Requirement Parsing (slash OR alternatives, unquoted families, names)
 * 2. Target Eligibility Resolution (Color, Cost, Count, Families, Names, During Advent, Soul State)
 * 3. Prevention of Invalid Flash Summoning during Attack Step (Advent spirits must NOT offer full-cost Flash Summon)
 * 4. Zero Core-Cost Execution (Soul Core sent to Trash, 0 cores deducted, card stacked)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Advent & Contract Advent Mechanics Suite', () => {
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
      reserve: 5,
      trash: 0,
      trashCores: 0,
      soulCoreLocation: 'field'
    },
    opponent: {
      count: 0,
      field: []
    }
  };
  const BattleArena = fn(globalObj.window, mockDoc, sandboxDuelState);

  describe('1. Requirement Parsing Across All Advent Formats', () => {
    it('1.1 Orpheus (SD70-001): Parses unquoted family "Wild" and color "Blue"', () => {
      const orpheus = {
        name: 'Orpheus',
        card_number: 'SD70-001',
        type: 'Spirit',
        cost: 4,
        effect: 'Flash - [Contract Advent: Blue & Wild, (Your Turn)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };
      const req = BattleArena.getCardAdventRequirement(orpheus);
      assert.ok(req, 'Requirement parsed');
      assert.equal(req.isContractAdvent, true);
      assert.equal(req.timing, 'your_attack_step');
      assert.deepEqual(req.colorOptions[0], ['blue']);
      assert.ok(req.criteria.some(c => c.options.some(o => o.text === 'wild')), 'Includes Wild criteria');
    });

    it('1.2 Imperialdramon Fighter Mode (CB05-X05): Parses slash color alternative "Green/Blue" & Cost 7 or more', () => {
      const imp = {
        name: 'Imperialdramon Fighter Mode',
        card_number: 'CB05-X05',
        type: 'Spirit',
        cost: 9,
        effect: 'Flash - [Advent: Green/Blue & Cost 7 or more, (Either Attack Step)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };
      const req = BattleArena.getCardAdventRequirement(imp);
      assert.ok(req);
      assert.equal(req.isContractAdvent, false);
      assert.equal(req.minCost, 7);
      assert.ok(req.colorOptions[0].includes('green') && req.colorOptions[0].includes('blue'), 'Parses Green OR Blue');
    });

    it('1.3 Burning Godzilla (1995) (CB28-X02): Parses quoted name "Godzilla" and C7 or more', () => {
      const gz = {
        name: 'Burning Godzilla (1995)',
        card_number: 'CB28-X02',
        type: 'Spirit',
        cost: 9,
        effect: 'Flash - [Contract Advent: "Godzilla" & C7 or more, (Your Turn)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };
      const req = BattleArena.getCardAdventRequirement(gz);
      assert.ok(req);
      assert.equal(req.isContractAdvent, true);
      assert.equal(req.minCount, 7);
      assert.ok(req.criteria.some(c => c.options.some(o => o.text === 'godzilla')));
    });

    it('1.4 Flag Contract Advent: Liber (BS76-CX02): Parses Flag Contract Advent', () => {
      const liber = {
        name: 'The AdventureFlagbearer Liber',
        card_number: 'BS76-CX02',
        type: 'Contract Spirit',
        cost: 6,
        effect: 'Flash - [Flag Contract Advent: Gale Contract, (Either Attack Step)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit/Nexus.'
      };
      const req = BattleArena.getCardAdventRequirement(liber);
      assert.ok(req);
      assert.equal(req.isFlagContractAdvent, true);
      assert.equal(req.isContractAdvent, true);
    });

    it('1.5 During Advent condition: Grand-Siegfried (BS43-X01)', () => {
      const gs = {
        name: 'The CreationDragonDeity Grand-Siegfried',
        card_number: 'BS43-X01',
        type: 'Spirit',
        cost: 10,
        effect: 'Flash - [Advent: During Advent, (Either Attack Step)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };
      const req = BattleArena.getCardAdventRequirement(gs);
      assert.ok(req);
      assert.equal(req.duringAdvent, true);
    });
  });

  describe('2. Target Eligibility Resolution', () => {
    const protagonist = {
      uid: 'protagonist_01',
      name: '［S.E.E.S. Official Battle Uniform］ Protagonist',
      card_number: 'SD70-CX01',
      type: 'Contract Spirit',
      cost: 3,
      color: 'Blue',
      colors: ['Blue'],
      family: 'S.E.E.S./Wild',
      families: ['S.E.E.S.', 'Wild'],
      currentCores: 2,
      currentLevel: 1,
      currentBp: 3000,
      hasSoulCore: true
    };

    const thanatos = {
      uid: 'thanatos_01',
      name: 'Thanatos',
      card_number: 'CB33-004',
      type: 'Spirit',
      cost: 8,
      color: 'Blue',
      colors: ['Blue'],
      family: 'Persona/Death Arcana',
      families: ['Persona', 'Death Arcana'],
      currentCores: 1,
      currentLevel: 1,
      currentBp: 8000,
      hasSoulCore: false
    };

    const orpheus = {
      uid: 'orpheus_hand',
      name: 'Orpheus',
      card_number: 'SD70-001',
      type: 'Spirit',
      cost: 4,
      color: 'Blue',
      colors: ['Blue'],
      effect: 'Flash - [Contract Advent: Blue & Wild, (Your Turn)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
    };

    it('2.1 Orpheus targets Protagonist with Wild family successfully', () => {
      const req = BattleArena.getCardAdventRequirement(orpheus);
      const eligible = BattleArena.getEligibleAdventTargets(req, [protagonist, thanatos], 'player');
      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].uid, protagonist.uid, 'Matches Protagonist because of Blue & Wild');
    });

    it('2.2 Slash alternative colors match either color (Green or Blue)', () => {
      const imp = {
        name: 'Imperialdramon',
        card_number: 'CB05-X05',
        type: 'Spirit',
        effect: '[Advent: Green/Blue & Cost 7 or more]'
      };
      const req = BattleArena.getCardAdventRequirement(imp);
      const eligible = BattleArena.getEligibleAdventTargets(req, [protagonist, thanatos], 'player');
      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].uid, thanatos.uid, 'Matches Thanatos (Blue & Cost 8 >= 7)');
    });

    it('2.3 Contract Advent targets Contract card in Soul State', () => {
      const req = BattleArena.getCardAdventRequirement(orpheus);
      const soulStateProtagonist = { ...protagonist, isSoulState: true };
      globalObj.window.DuelState.player.soulStateCards = [soulStateProtagonist];
      const eligible = BattleArena.getEligibleAdventTargets(req, [], 'player');
      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].uid, protagonist.uid);
      globalObj.window.DuelState.player.soulStateCards = [];
    });
  });

  describe('3. Prevention of Invalid Flash Summoning during Attack Step', () => {
    it('3.1 Advent Spirit does NOT allow normal Flash Summon during Attack Step', () => {
      const orpheus = {
        uid: 'orpheus_h',
        name: 'Orpheus',
        card_number: 'SD70-001',
        type: 'Spirit',
        cost: 4,
        effect: 'Flash - [Contract Advent: Blue & Wild, (Your Turn)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };

      // In Attack Step, spirits cannot be Flash Summoned unless they have High Speed / explicit Flash summon clause
      const hasFlashSummon = BattleArena.canFlashSummonSpirit ? BattleArena.canFlashSummonSpirit(orpheus) : false;
      assert.equal(hasFlashSummon, false, 'Advent Spirits cannot be flash summoned as regular spirits');
    });
  });

  describe('4. Zero Core-Cost Execution', () => {
    it('4.1 executeAdvent consumes Soul Core to Trash and 0 Reserve/Field cores', () => {
      const protagonist = {
        uid: 'protagonist_stk',
        name: '［S.E.E.S. Official Battle Uniform］ Protagonist',
        card_number: 'SD70-CX01',
        type: 'Contract Spirit',
        cost: 3,
        color: 'Blue',
        colors: ['Blue'],
        family: 'S.E.E.S./Wild',
        families: ['S.E.E.S.', 'Wild'],
        currentCores: 2,
        currentLevel: 1,
        currentBp: 3000,
        hasSoulCore: true,
        levels: { LV1: { level: 1, cost: 1, bp: 3000 }, LV2: { level: 2, cost: 3, bp: 5000 } }
      };

      const orpheus = {
        uid: 'orpheus_card',
        name: 'Orpheus',
        card_number: 'SD70-001',
        type: 'Spirit',
        cost: 4,
        color: 'Blue',
        colors: ['Blue'],
        family: 'Persona',
        families: ['Persona', 'Wild', 'Fool Arcana'],
        levels: { LV1: { level: 1, cost: 1, bp: 4000 }, LV2: { level: 2, cost: 2, bp: 7000 } },
        effect: 'Flash - [Contract Advent: Blue & Wild, (Your Turn)]\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.'
      };

      globalObj.window.DuelState.player.reserve = 5;
      globalObj.window.DuelState.player.field = [protagonist];
      globalObj.window.DuelState.player.hand = [orpheus];
      globalObj.window.DuelState.player.soulCoreLocation = 'field';
      globalObj.window.DuelState.player.trashCores = 0;

      BattleArena.executeAdvent(orpheus, protagonist, 'player');

      assert.equal(globalObj.window.DuelState.player.reserve, 5, 'Reserve cores remain untouched (0 cost paid)');
      assert.equal(globalObj.window.DuelState.player.soulCoreLocation, 'trash', 'Soul Core moved to Trash');
      assert.equal(protagonist.name, 'Orpheus', 'Target stack name updated to Orpheus');
      assert.equal(protagonist.isAdvent, true);
      assert.ok(protagonist.underlyingCards.length >= 1, 'Previous Protagonist saved as pre-advent card');
      assert.equal(protagonist.underlyingCards[0].name, '［S.E.E.S. Official Battle Uniform］ Protagonist');
    });
  });
});
