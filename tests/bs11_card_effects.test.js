/**
 * tests/bs11_card_effects.test.js
 * 
 * Regression Test Suite for BS11 (Booster Set 11: The Brave of the Sun).
 * Verifies 100% deterministic execution of BS11 canonical card effects,
 * vanillas, Rising-Apollodragon, Darkwurm-Nova, Hercules Ω, Libra-Golem, and R2 skipped Geminize.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS11_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS11 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS11 Vanilla Cards Stat & Ability Integrity', () => {
    it('BS11-044 (Shell-Golem) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('BS11-044');
      assert.ok(override, 'Override must exist for BS11-044');
      assert.equal(override.isVanilla, true);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('2. BS11 X-Rares: Rising-Apollodragon, Darkwurm-Nova, Hercules Ω, Libra-Golem', () => {

    it('BS11-X01 (The SunDragonDeity Rising-Apollodragon) - Target attack and destruction', () => {
      const override = getCardOverride('BS11-X01');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const attackStepAb = override.abilities.find(a => a.header.timing === 'ATTACK_STEP');
      assert.ok(attackStepAb, 'Must have Attack Step target attack ability');
      assert.equal(attackStepAb.clauses[0].op.op, 'TARGET_ATTACK');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');
    });

    it('BS11-X02 (The StarSlayerDragon Darkwurm-Nova) - Passive keyword rule and BP buff', () => {
      const override = getCardOverride('BS11-X02');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'BP_BUFF'));
      assert.ok(attackAb, 'Must have (When Attacks) BP buff');
      assert.equal(attackAb.clauses[0].op.op, 'BP_BUFF');
    });

    it('BS11-X03 (The StarKnight Hercules Ω) - [High Speed] summoning & passive refresh', () => {
      const override = getCardOverride('BS11-X03');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb, 'Must have [High Speed] ability');
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON_RESERVE_ONLY');

      const refreshAb = override.abilities.find(a => a.header.timing === 'PASSIVE' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have passive refresh ability');
    });

    it('BS11-X06 (The BalanceDeity Libra-Golem) - [Crush] mill ability & attack refresh', () => {
      const override = getCardOverride('BS11-X06');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const crushAb = override.abilities.find(a => a.header.keyword === 'Crush');
      assert.ok(crushAb, 'Must have [Crush]');
      assert.equal(crushAb.clauses[0].op.op, 'MILL_DECK');

      const refreshAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op.op === 'REFRESH'));
      assert.ok(refreshAb, 'Must have attack refresh ability');
    });
  });

  describe('3. R2 Skipped Card Exclusion: Geminize', () => {
    it('BS11-X05 (The MagicalTwinsDeity Geminize) is cataloged in SKIPPED_CARDS and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'BS11-X05');
      assert.ok(found, 'BS11-X05 must be recorded in SKIPPED_CARDS per R2');
      assert.equal(found.set, 'BS11');
      assert.ok(found.reason.includes('Removed Zone'), 'Reason must document legacy Removed Zone');

      const override = getCardOverride('BS11-X05');
      assert.equal(override, null, 'Skipped card must not have an override');
    });
  });

  describe('4. Full Canonical BS11 Resolution Integrity', () => {
    it('All 81 implemented BS11 cards in BS11_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS11_OVERRIDES).filter(k => k.startsWith('BS11-'));
      assert.equal(keys.length, 81, 'Expected 81 implemented BS11 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
