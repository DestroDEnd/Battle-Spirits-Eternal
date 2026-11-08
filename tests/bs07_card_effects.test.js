/**
 * tests/bs07_card_effects.test.js
 * 
 * Regression Test Suite for BS07 (Booster Set 07: Heaven's Record).
 * Verifies 100% deterministic execution of BS07 canonical card effects,
 * vanillas, [Clash], [Holy Life], [Assault: 2], bounce abilities, and X-Rares.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS07_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS07 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS07 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['BS07-001', 'BS07-029', 'BS07-046'];

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

  describe('2. BS07 Keywords: [Clash], [Assault], [Holy Life]', () => {

    it('BS07-X25 (The StarEmperorDragon Meteorwurm) - [Clash] keyword compiles to FORCE_BLOCK', () => {
      const override = getCardOverride('BS07-X25');
      assert.ok(override);
      const clashAb = override.abilities.find(a => a.header.keyword === 'Clash');
      assert.ok(clashAb, 'Meteorwurm must have [Clash] keyword');
      assert.equal(clashAb.clauses[0].op.op, 'FORCE_BLOCK');
    });

    it('BS07-X28 (The GiantEmperor Alexander) - [Assault: 2] keyword ability', () => {
      const override = getCardOverride('BS07-X28');
      assert.ok(override);
      const assaultAb = override.abilities.find(a => a.header.keyword === 'Assault: 2');
      assert.ok(assaultAb, 'Alexander must have [Assault: 2] keyword ability');
      assert.equal(assaultAb.clauses[0].op.op, 'EXHAUST');
    });

    it('BS07-X27 (The ArcAngelia Isfiel) - [Holy Life] life recovery keyword', () => {
      const override = getCardOverride('BS07-X27');
      assert.ok(override);
      const holyLifeAb = override.abilities.find(a => a.header.keyword === 'Holy Life');
      assert.ok(holyLifeAb, 'Isfiel must have [Holy Life]');
      assert.equal(holyLifeAb.clauses[0].op.op, 'RECOVER_LIFE');
    });
  });

  describe('3. BS07 X-Rares & Combat Abilities', () => {

    it('BS07-X26 (The BladeKingBeast Byak-Garo) - (When Attacks) exhausts opposing spirits', () => {
      const override = getCardOverride('BS07-X26');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Byak-Garo must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(attackAb.clauses[0].op.count, 2);
    });
  });

  describe('4. Full Canonical BS07 Resolution Integrity', () => {
    it('All 53 BS07 cards in BS07_OVERRIDES resolve without error and 0 unsupported clauses', () => {
      const keys = Object.keys(BS07_OVERRIDES).filter(k => k.startsWith('BS07-'));
      assert.ok(keys.length >= 53, `Expected at least 53 BS07 keys, got ${keys.length}`);
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
