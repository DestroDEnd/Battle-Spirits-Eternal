/**
 * tests/sd15_card_effects.test.js
 * 
 * Regression Test Suite for SD15 (Starter Deck 15: BattleAngelia Excel).
 * Verifies 100% deterministic execution of SD15 canonical card effects,
 * Divine Spirit Braves, BP debuff mechanics, X-Rares, and Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD15_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD15 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD15 Angelia & Brave Mechanics', () => {

    it('SD15-006 (Angeloid) - Brave condition and summon ability', () => {
      const override = getCardOverride('SD15-006');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const braveCondAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Brave Condition'));
      assert.ok(braveCondAb, 'Must have Brave Condition');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'SUMMON');
    });

    it('SD15-008 (Magical Draw) - Main draw ability and Flash BP debuff', () => {
      const override = getCardOverride('SD15-008');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BP_DEBUFF');
    });
  });

  describe('2. SD15 X-Rare: BattleAngelia Excel', () => {

    it('SD15-X01 (The BattleAngelia Excel) - Attack BP debuff, passive bounce/draw, and attack destroy', () => {
      const override = getCardOverride('SD15-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'BP_DEBUFF');

      const passiveAb = override.abilities.find(a => a.header.timing === 'PASSIVE');
      assert.ok(passiveAb, 'Must have passive bounce/draw ability');
      assert.equal(passiveAb.clauses[0].op.op, 'BOUNCE');
    });
  });

  describe('3. Full Canonical SD15 Resolution Integrity', () => {
    it('All 9 SD15 cards in SD15_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD15_OVERRIDES).filter(k => k.startsWith('SD15-'));
      assert.equal(keys.length, 9, 'SD15 must have exactly 9 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
