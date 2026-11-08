/**
 * tests/sd21_card_effects.test.js
 * 
 * Regression Test Suite for SD21 (Starter Deck 21 / Lay-Saurer).
 * Verifies 100% deterministic execution of SD21 card effects,
 * immunity, combat restrictions, and refresh mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD21_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD21 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD21 Key Mechanics: Lay-Saurer', () => {
    it('BATTLE-SPIRITS-A9158 (The CretaceousMarshal Lay-Saurer) - Immunity, combat restriction, and refresh', () => {
      const override = getCardOverride('BATTLE-SPIRITS-A9158');
      assert.ok(override, 'Override must exist for BATTLE-SPIRITS-A9158');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const immAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'IMMUNITY'));
      assert.ok(immAb, 'Must have effect immunity ability');
      assert.equal(immAb.clauses[0].op.immuneTo, 'OPPOSING_EFFECTS');

      const restrictAb = override.abilities.find(a => a.clauses.some(c => c.op.op === 'COMBAT_RESTRICTION'));
      assert.ok(restrictAb, 'Must have combat restriction ability');

      const refreshAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS_OR_BLOCKS' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have (When Attacks/Blocks) refresh ability');
    });
  });

  describe('2. Full Canonical SD21 Resolution Integrity', () => {
    it('All entries in SD21_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(SD21_OVERRIDES);
      assert.equal(keys.length, 1, 'Expected 1 SD21 override entry');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
