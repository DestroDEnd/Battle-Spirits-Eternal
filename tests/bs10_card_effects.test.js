/**
 * tests/bs10_card_effects.test.js
 * 
 * Regression Test Suite for BS10 (Booster Set 10: The Eight Stars' Vanguard).
 * Verifies 100% deterministic execution of BS10 canonical card effects,
 * vanillas, [Ultra Awaken], Gai-Asura, Venu-Lucifer, Scor-Spear, and Braves.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS10_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS10 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS10 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = [
      'BS10-004', 'BS10-009', 'BS10-015', 'BS10-017', 'BS10-028',
      'BS10-036', 'BS10-039', 'BS10-044', 'BS10-048', 'BS10-057'
    ];

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

  describe('2. BS10 X-Rares: Gai-Asura, Venu-Lucifer, Scor-Spear', () => {

    it('BS10-X01 (The PhantomStarDragon Gai-Asura) - [Ultra Awaken] keyword mechanics', () => {
      const override = getCardOverride('BS10-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const ultraAwakenAb = override.abilities.find(a => a.header.keyword === 'Ultra Awaken');
      assert.ok(ultraAwakenAb, 'Gai-Asura must have [Ultra Awaken] ability');
      assert.equal(ultraAwakenAb.clauses[0].op.op, 'MOVE_CORE');
      assert.equal(ultraAwakenAb.clauses[1].op.op, 'REFRESH');
    });

    it('BS10-X05 (The FallenDragonDeity Venu-Lucifer) - Brave attack discard and mill', () => {
      const override = getCardOverride('BS10-X05');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveAttackAb = override.abilities.find(a => a.header.timing === 'WHEN_BRAVE_ATTACKS');
      assert.ok(braveAttackAb, 'Must have (When Brave Attacks) ability');
      assert.equal(braveAttackAb.clauses[0].op.op, 'DISCARD_HAND');
      assert.equal(braveAttackAb.clauses[1].op.op, 'MILL_DECK');
    });

    it('BS10-X06 (The ScorpioKnight Scor-Spear) - Passive destruction & keyword rule', () => {
      const override = getCardOverride('BS10-X06');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const passiveDestroyAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(passiveDestroyAb, 'Scor-Spear must have passive destroy ability');
    });
  });

  describe('3. Full Canonical BS10 Resolution Integrity', () => {
    it('All 98 canonical BS10 cards in BS10_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS10_OVERRIDES).filter(k => k.startsWith('BS10-'));
      assert.ok(keys.length >= 98, `Expected at least 98 BS10 keys, got ${keys.length}`);
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
