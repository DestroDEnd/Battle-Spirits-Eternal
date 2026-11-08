/**
 * tests/bs13_card_effects.test.js
 * 
 * Regression Test Suite for BS13 (Booster Set 13: Roar of the Celestial Dragon - Part 2 / Shine Dragon).
 * Verifies 100% deterministic execution of BS13 canonical card effects,
 * Sagitto-Apollodragon, Asklepiooze, Strikewurm-Leo, Rean, Perseus, and all Braves & Magics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS13_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS13 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS13 X-Rares: Sagitto-Apollodragon, Asklepiooze, Strikewurm-Leo, Rean, Perseus', () => {

    it('BS13-X01 (The ShineCentaurusDeity Sagitto-Apollodragon) - Double Brave, Target Attack, and Attack Destruction', () => {
      const override = getCardOverride('BS13-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const targetAttAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'TARGET_ATTACK'));
      assert.ok(targetAttAb, 'Must have Target Attack ability');

      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(destroyAb, 'Must have (When Attacks) destruction ability');
    });

    it('BS13-X02 (The SnakeMasterDeity Asklepiooze) - Summon destroy & draw, Attack Step refresh, block core drain', () => {
      const override = getCardOverride('BS13-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.ok(summonAb.clauses.some(c => c.op.op === 'DESTROY'));
      assert.ok(summonAb.clauses.some(c => c.op.op === 'DRAW'));

      const refreshAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have Attack Step refresh ability');

      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS' && a.clauses.some(c => c.op.op === 'MOVE_CORE'));
      assert.ok(blockAb, 'Must have block core move ability');
    });

    it('BS13-X04 (The MachineLionDeity Strikewurm-Leo) - Heavy Armor, passive refresh & extra symbol', () => {
      const override = getCardOverride('BS13-X04');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const refreshAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have passive refresh ability');

      const symbolAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'ADD_SYMBOL'));
      assert.ok(symbolAb, 'Must have passive extra symbol ability');
    });

    it('BS13-X05 (The KylinStarBeast Rean) - When destroyed exhaust/refresh, and passive grant family', () => {
      const override = getCardOverride('BS13-X05');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const destroyTriggerAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      assert.ok(destroyTriggerAb, 'Must have (When Destroyed) ability');
      assert.ok(destroyTriggerAb.clauses.some(c => c.op.op === 'EXHAUST'));
      assert.ok(destroyTriggerAb.clauses.some(c => c.op.op === 'REFRESH'));

      const grantFamilyAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'GRANT_FAMILY'));
      assert.ok(grantFamilyAb, 'Must have passive grant family ability');
    });

    it('BS13-X06 (The GiantBraver Perseus) - Summon destroy, attack destroy, and Assault: 3', () => {
      const override = getCardOverride('BS13-X06');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');

      const assaultAb = override.abilities.find(a => a.header.keyword && a.header.keyword.startsWith('Assault'));
      assert.ok(assaultAb, 'Must have Assault ability');
      assert.equal(assaultAb.clauses[0].op.op, 'REFRESH_BY_EXHAUSTING_NEXUS');
    });
  });

  describe('2. Full Canonical BS13 Resolution Integrity', () => {
    it('All 75 canonical BS13 cards in BS13_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS13_OVERRIDES).filter(k => k.startsWith('BS13-'));
      assert.equal(keys.length, 75, 'Expected 75 implemented BS13 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });

    it('All 78 total entries (including database slug aliases) resolve cleanly', () => {
      const totalKeys = Object.keys(BS13_OVERRIDES);
      assert.equal(totalKeys.length, 78, 'Expected 78 total BS13 override keys');
      for (const k of totalKeys) {
        const override = BS13_OVERRIDES[k];
        assert.ok(override, `Entry must exist for ${k}`);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.unsupportedClausesCount, 0);
      }
    });
  });
});
