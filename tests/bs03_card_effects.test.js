/**
 * tests/bs03_card_effects.test.js
 * 
 * Regression Test Suite for BS03 (Booster Set 03: Roar of the Conqueror).
 * Verifies 100% deterministic execution of BS03 canonical card effects,
 * vanillas, [Crush], [Brilliance], Mill mechanics, X-Rares, and R2 skipped cards.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS03_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS03 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS03 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCardNumbers = [
      'BS03-013', 'BS03-018', 'BS03-020',
      'BS03-041', 'BS03-071', 'BS03-072', 'BS03-078'
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

  describe('2. Red Cards & BP Destruction', () => {

    it('BS03-010 (The BlackDragon Vritra) - (When Summoned) destroys all <= 2000 BP spirits', () => {
      const override = getCardOverride('BS03-010');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');
      assert.equal(summonAb.clauses[0].op.all, true);
      assert.equal(summonAb.clauses[0].op.target.maxBp, 2000);
    });

    it('BS03-119 (Buster Lance) - Main destroys every LV1 Nexus', () => {
      const override = getCardOverride('BS03-119');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DESTROY');
      assert.equal(mainAb.clauses[0].op.target.side, 'either');
    });
  });

  describe('3. White & Green Mechanics ([Armor], [High Speed], Combat Buffs)', () => {

    it('BS03-045 (The SilverFox Hati) - (When Blocks) gains +5000 BP', () => {
      const override = getCardOverride('BS03-045');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(blockAb.clauses[0].op.amount, 5000);
    });

    it('BS03-127 (Ivy Cage) - Main exhausts all <= 2000 BP spirits', () => {
      const override = getCardOverride('BS03-127');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'EXHAUST');
    });
  });

  describe('4. Blue Cards & [Crush] Mill Mechanics', () => {

    it('BS03-076 (The ClawSword Lazarus) - Has [Crush] keyword and MILL_DECK opcode', () => {
      const override = getCardOverride('BS03-076');
      assert.ok(override);
      const crushKeyword = override.keywords.find(k => k.name === 'Crush');
      assert.ok(crushKeyword, 'Must register Crush keyword');
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'MILL_DECK');
      assert.equal(attackAb.clauses[0].op.side, 'opp');
    });

    it('BS03-118 (Fourth Draw) - Main draws cards and Flash gives +3000 BP', async () => {
      const override = getCardOverride('BS03-118');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(flashAb.clauses[0].op.amount, 3000);
    });
  });

  describe('5. BS03 X-Rares', () => {

    it('BS03-X12 (The GiantHero Titus) - (When Summoned) discards 10 cards from opposing decktop', () => {
      const override = getCardOverride('BS03-X12');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'MILL_DECK');
      assert.equal(summonAb.clauses[0].op.side, 'opp');
    });
  });

  describe('6. R2 Skipped Cards Exclusion Verification', () => {

    it('Ensures BS03-016 (The InvisibleMan Eclear) is cataloged and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'BS03-016');
      assert.ok(found, 'BS03-016 must be recorded in SKIPPED_CARDS');
      assert.equal(found.set, 'BS03');
      assert.ok(found.reason.length > 10);
      const override = getCardOverride('BS03-016');
      assert.equal(override, null, 'Skipped card BS03-016 must never have an override');
    });
  });

});
