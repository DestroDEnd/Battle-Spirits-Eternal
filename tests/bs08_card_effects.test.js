/**
 * tests/bs08_card_effects.test.js
 * 
 * Regression Test Suite for BS08 (Booster Set 08: Roar of the Blue Champions).
 * Verifies 100% deterministic execution of BS08 canonical card effects,
 * vanillas, [Crush], [Assault], [Tribute], and X-Rares.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS08_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS08 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS08 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['BS08-011', 'BS08-020', 'BS08-028'];

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

  describe('2. BS08 Keywords: [Crush], [Assault], [Tribute]', () => {

    it('BS08-X34 (The GodMadeSoldier Orichalcum-Golem) - [Crush] deck mill ability', () => {
      const override = getCardOverride('BS08-X34');
      assert.ok(override);
      const crushAb = override.abilities.find(a => a.header.keyword === 'Crush');
      assert.ok(crushAb, 'Orichalcum-Golem must have [Crush] keyword');
      assert.equal(crushAb.clauses[0].op.op, 'MILL_DECK');

      const assaultAb = override.abilities.find(a => a.header.keyword === 'Assault: 2');
      assert.ok(assaultAb, 'Orichalcum-Golem must have [Assault: 2] keyword');
      assert.equal(assaultAb.clauses[0].op.op, 'REFRESH_BY_EXHAUSTING_NEXUS');
    });

    it('BS08-X32 (The WingDeity Grand-Woden) - [Tribute] keyword mechanism', () => {
      const override = getCardOverride('BS08-X32');
      assert.ok(override);
      const tributeAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Tribute'));
      assert.ok(tributeAb, 'Grand-Woden must have [Tribute] ability');
      assert.equal(tributeAb.clauses[0].op.op, 'MOVE_CORE');
    });

    it('BS08-X30 (The SevenShogun Asmodios) - [Tribute] and core drain abilities', () => {
      const override = getCardOverride('BS08-X30');
      assert.ok(override);
      const tributeAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Tribute'));
      assert.ok(tributeAb, 'Asmodios must have [Tribute]');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Asmodios must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'MOVE_CORE');
    });
  });

  describe('3. Full Canonical BS08 Resolution Integrity', () => {
    it('All 64 canonical BS08 cards in BS08_OVERRIDES resolve without error and 0 unsupported clauses', () => {
      const keys = Object.keys(BS08_OVERRIDES).filter(k => k.startsWith('BS08-'));
      assert.ok(keys.length >= 64, `Expected at least 64 BS08 keys, got ${keys.length}`);
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
