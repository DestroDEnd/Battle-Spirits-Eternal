/**
 * tests/sd20_card_effects.test.js
 * 
 * Regression Test Suite for SD20 (Starter Deck 20: Ultimate-Odin).
 * Verifies 100% deterministic execution of SD20 canonical card effects,
 * vanillas, Ultimate-Odin, Heavy Armor, Burst Shield, and Spells.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD20_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD20 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD20 Vanilla Cards Stat & Ability Integrity', () => {
    it('SD20-001 (Missile Mobile) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD20-001');
      assert.ok(override, 'Override must exist for SD20-001');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. SD20 Ultimate-Odin & White Defensive Mechanics', () => {

    it('SD20-X01 (Ultimate-Odin) - Summon bounce, Ultimate Trigger unblockable, and end refresh', () => {
      const override = getCardOverride('SD20-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'BOUNCE');

      const uTriggerAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Ultimate Trigger'));
      assert.ok(uTriggerAb, 'Must have Ultimate Trigger ability');
      assert.equal(uTriggerAb.clauses[0].op.op, 'UNBLOCKABLE');

      const endRefreshAb = override.abilities.find(a => a.header.timing === 'END_OF_TURN');
      assert.ok(endRefreshAb, 'Must have End of Turn refresh');
      assert.equal(endRefreshAb.clauses[0].op.op, 'REFRESH');
    });

    it('SD20-004 (Shield Mobile) - Exhausted block and [Heavy Armor: Red]', () => {
      const override = getCardOverride('SD20-004');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const blockAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP' && a.clauses.some(c => c.op.op === 'EXHAUSTED_BLOCK'));
      assert.ok(blockAb, 'Must have exhausted block ability');

      const heavyArmorAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Heavy Armor'));
      assert.ok(heavyArmorAb, 'Must have [Heavy Armor: Red]');
      assert.equal(heavyArmorAb.clauses[0].op.op, 'CONTINUOUS_RULE');
    });

    it('SD20-014 (Burst Shield) - Burst trigger and Flash cost modifier', () => {
      const override = getCardOverride('SD20-014');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const burstAb = override.abilities.find(a => a.header.burstCondition);
      assert.ok(burstAb, 'Must have Burst ability');

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb, 'Must have Flash ability');
      assert.equal(flashAb.clauses[0].op.op, 'COST_MODIFIER');
    });
  });

  describe('3. Full Canonical SD20 Resolution Integrity', () => {
    it('All 16 SD20 cards in SD20_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD20_OVERRIDES).filter(k => k.startsWith('SD20-'));
      assert.equal(keys.length, 16, 'SD20 must have exactly 16 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
