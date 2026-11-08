/**
 * tests/bs02_card_effects.test.js
 * 
 * Regression Test Suite for BS02 (Booster Set 02: Clash of the Colosseum).
 * Verifies 100% deterministic execution of BS02 canonical card effects,
 * [Awaken], [Curse], [High Speed], [Armor], X-Rares, and R2 skipped cards.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS02_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS02 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS02 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCardNumbers = [
      'BS02-001', 'BS02-003', 'BS02-023',
      'BS02-039', 'BS02-051', 'BS02-053'
    ];

    for (const cardNum of vanillaCardNumbers) {
      it(`${cardNum} has explicit vanilla IR with 0 abilities`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.compiledClausesCount, 0);
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. Red Cards & [Awaken] Mechanics', () => {

    it('BS02-007 (The RiseDragon Balmung) - Flash [Awaken] core movement', () => {
      const override = getCardOverride('BS02-007');
      assert.ok(override);
      const awakenAb = override.abilities.find(a => a.header.keyword === 'Awaken');
      assert.ok(awakenAb, 'Must possess Awaken ability');
      assert.equal(awakenAb.header.isFlash, true);
      assert.equal(awakenAb.clauses[0].op.op, 'AWAKEN_CORE_MOVE');
    });

    it('BS02-008 (Fisdragoon) - (When Attacks) gains +1000 BP', () => {
      const override = getCardOverride('BS02-008');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(attackAb.clauses[0].op.amount, 1000);
    });

    it('BS02-088 (Cross Fire) - Main destroys opposing and player Nexus', () => {
      const override = getCardOverride('BS02-088');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.ok(mainAb.clauses.some(c => c.op.op === 'DESTROY'));
    });
  });

  describe('3. Purple Cards & [Curse] Mechanics', () => {

    it('BS02-015 (Humpdump) - [Curse] destroys blocking spirit at battle resolution', () => {
      const override = getCardOverride('BS02-015');
      assert.ok(override);
      const curseAb = override.abilities.find(a => a.header.keyword === 'Curse');
      assert.ok(curseAb);
      assert.equal(curseAb.clauses[0].op.op, 'DESTROY');
      assert.equal(curseAb.header.timing, 'WHEN_ATTACKS');
    });

    it('BS02-020 (Lady-Frankelly) - [Curse] registered on LV2/LV3', () => {
      const override = getCardOverride('BS02-020');
      assert.ok(override);
      const curseAb = override.abilities.find(a => a.header.keyword === 'Curse');
      assert.ok(curseAb);
      assert.deepEqual(curseAb.header.levels, [2, 3]);
    });

    it('BS02-092 (Energy Drain) - Main drains core from opposing Nexus/Reserve to Trash', () => {
      const override = getCardOverride('BS02-092');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(mainAb.clauses[0].op.to.zone, 'trash');
    });
  });

  describe('4. Green Cards & [High Speed] Mechanics', () => {

    it('BS02-030 (The Soldier Antman) - Flash [High Speed] summon from Hand with Reserve cores', () => {
      const override = getCardOverride('BS02-030');
      assert.ok(override);
      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb);
      assert.equal(hsAb.header.isFlash, true);
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON_RESERVE_ONLY');
    });

    it('BS02-097 (Nature Forces) - Flash sends cores from Trash to Spirit', () => {
      const override = getCardOverride('BS02-097');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(flashAb.clauses[0].op.from.zone, 'trash');
    });
  });

  describe('5. White Cards & [Armor] Mechanics', () => {

    it('BS02-040 (Lobsterk) - [Armor: Red] provides Red immunity', () => {
      const override = getCardOverride('BS02-040');
      assert.ok(override);
      const armorKeyword = override.keywords.find(k => k.name === 'Armor');
      assert.ok(armorKeyword);
      assert.equal(armorKeyword.parameter, 'Red');
    });

    it('BS02-102 (White Potion) - Flash refreshes a spirit you control', async () => {
      const override = getCardOverride('BS02-102');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'REFRESH');

      const game = createGame();
      const p = game.state.players.player;
      p.field = [{
        id: 'spirit-1',
        stackId: 'spirit-1',
        state: 'EXHAUSTED',
        cores: { normal: 2, soul: 0 },
        top: { id: 'spirit-1', type: 'Spirit', cost: 3 }
      }];

      const promptResolver = {
        choose: async (prompt) => prompt.candidates || []
      };

      await executeOp(game.state, flashAb.clauses[0].op, { controller: 'player', promptResolver });
      assert.equal(p.field[0].state, 'REFRESHED');
    });
  });

  describe('6. Yellow Cards & Magic Hand Manipulation', () => {

    it('BS02-061 (The Angelia Angu) - (When Summoned) refreshes a Yellow Spirit', () => {
      const override = getCardOverride('BS02-061');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'REFRESH');
    });

    it('BS02-072 (Trickster) - (When Summoned) salvages Magic card from Trash to Hand', () => {
      const override = getCardOverride('BS02-072');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'SALVAGE');
      assert.equal(summonAb.clauses[0].op.cardType, 'Magic');
    });
  });

  describe('7. BS02 X-Rares', () => {

    it('BS02-X05 (The TwinRowdy Diranos) - [Awaken] buff +1000 BP', () => {
      const override = getCardOverride('BS02-X05');
      assert.ok(override);
      const buffAb = override.abilities[0];
      assert.ok(buffAb);
      assert.equal(buffAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(buffAb.clauses[0].op.amount, 1000);
    });

    it('BS02-X06 (The SevenShogun Destlord) - (When Summoned) exhausts every LV2 Spirit', () => {
      const override = getCardOverride('BS02-X06');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(summonAb.clauses[0].op.target.level, 2);
    });

    it('BS02-X07 (The Gigantic Thor) - Armed Machine synergy and BP buff', () => {
      const override = getCardOverride('BS02-X07');
      assert.ok(override);
      assert.ok(override.abilities.length > 0);
    });

    it('BS02-X08 (The ArcAngelia Mikafar) - (When Summoned) reveals cards and adds Magics to Hand', () => {
      const override = getCardOverride('BS02-X08');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.ok(summonAb.clauses.some(c => c.op.op === 'REVEAL_DECKTOP'));
      assert.ok(summonAb.clauses.some(c => c.op.op === 'SALVAGE'));
    });
  });

  describe('8. R2 Skipped Cards Exclusion Verification', () => {
    const expectedSkipped = ['BS02-078', 'BS02-087', 'BS02-108', 'BS02-109'];

    for (const cardNum of expectedSkipped) {
      it(`Ensures BS02 skipped card ${cardNum} is formally cataloged and has no override`, () => {
        const found = SKIPPED_CARDS.find(c => c.cardNumber === cardNum);
        assert.ok(found, `Must be recorded in SKIPPED_CARDS: ${cardNum}`);
        assert.equal(found.set, 'BS02');
        assert.ok(found.reason.length > 10, 'Must provide detailed ruling rationale');
        const override = getCardOverride(cardNum);
        assert.equal(override, null, `Skipped card ${cardNum} must never have an override`);
      });
    }
  });

});
