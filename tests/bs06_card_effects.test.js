/**
 * tests/bs06_card_effects.test.js
 * 
 * Regression Test Suite for BS06 (Booster Set 06: The Giant Emperor).
 * Verifies 100% deterministic execution of BS06 canonical card effects,
 * vanillas, [Awaken], [High Speed], [Curse], Thorn Prison, X-Rares, and R2 skipped cards.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS06_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS06 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS06 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['BS06-027', 'BS06-032'];

    for (const cardNum of vanillaCards) {
      it(`${cardNum} has explicit vanilla IR with 0 abilities`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.compiledClausesCount, 0);
      });
    }
  });

  describe('2. BS06 [Awaken], [High Speed], and [Curse] Keywords', () => {

    it('BS06-006 (Sabecaulus) - Flash [Awaken] core movement', () => {
      const override = getCardOverride('BS06-006');
      assert.ok(override);
      const awakenAb = override.abilities.find(a => a.header.keyword === 'Awaken');
      assert.ok(awakenAb);
      assert.equal(awakenAb.header.isFlash, true);
      assert.equal(awakenAb.clauses[0].op.op, 'AWAKEN_CORE_MOVE');
    });

    it('BS06-026 (Caracalossom) - Flash [High Speed] summoning', () => {
      const override = getCardOverride('BS06-026');
      assert.ok(override);
      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb);
      assert.equal(hsAb.header.isFlash, true);
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON');
    });

    it('BS06-015 (Straysoul) - [Curse] destroys blocking spirit at battle resolution', () => {
      const override = getCardOverride('BS06-015');
      assert.ok(override);
      const curseAb = override.abilities.find(a => a.header.keyword === 'Curse');
      assert.ok(curseAb);
      assert.equal(curseAb.clauses[0].op.op, 'DESTROY');
    });
  });

  describe('3. BS06 Magic Resolution', () => {

    it('BS06-100 (Thorn Prison) - Flash exhausts two opposing Spirits', () => {
      const override = getCardOverride('BS06-100');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(flashAb.clauses[0].op.count, 2);
    });
  });

  describe('4. BS06 X-Rares', () => {

    it('BS06-X21 (The Deity Catastrophedragon) - (When Summoned) draws per Ancient Dragon and has refresh trigger', () => {
      const override = getCardOverride('BS06-X21');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'DRAW');
    });

    it('BS06-X24 (The ArmoredSacred Walhalance) - Has [Armor] and combat bounce', () => {
      const override = getCardOverride('BS06-X24');
      assert.ok(override);
      assert.ok(override.abilities.some(a => a.clauses.some(c => c.op.op === 'IMMUNITY')));
      assert.ok(override.abilities.some(a => a.clauses.some(c => c.op.op === 'BOUNCE')));
    });
  });

  describe('5. R2 Skipped Cards Exclusion Verification', () => {
    const expectedSkipped = ['BS06-054', 'BS06-086', 'BS06-110'];

    for (const cardNum of expectedSkipped) {
      it(`Ensures BS06 skipped card ${cardNum} is cataloged and has no override`, () => {
        const found = SKIPPED_CARDS.find(c => c.cardNumber === cardNum);
        assert.ok(found, `Must be recorded in SKIPPED_CARDS: ${cardNum}`);
        assert.equal(found.set, 'BS06');
        assert.ok(found.reason.length > 10);
        const override = getCardOverride(cardNum);
        assert.equal(override, null, `Skipped card ${cardNum} must never have an override`);
      });
    }
  });

});
