/**
 * tests/bs09_card_effects.test.js
 * 
 * Regression Test Suite for BS09 (Booster Set 09: Super Battle of Transcendence).
 * Verifies 100% deterministic execution of BS09 canonical card effects,
 * Siegwurm-Nova, Ragna-Rock, Beldegaulle, Odin Type-X, and R2 skipped card Ambrocius.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, BS09_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('BS09 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS09 X-Rares: Siegwurm-Nova, Ragna-Rock, Beldegaulle, Odin Type-X', () => {

    it('BS09-X35 (The SupernovaDragon Siegwurm-Nova) - Summon life recovery, attack destruction, and [Clash]', () => {
      const override = getCardOverride('BS09-X35');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned) ability');
      assert.equal(summonAb.clauses[0].op.op, 'RECOVER_LIFE');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb, 'Must have (When Attacks) ability');
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');

      const clashAb = override.abilities.find(a => a.header.keyword === 'Clash');
      assert.ok(clashAb, 'Must have [Clash]');
      assert.equal(clashAb.clauses[0].op.op, 'FORCE_BLOCK');
    });

    it('BS09-X36 (The SevenShogun Beldegaulle) - [Immortality] and summon destruction', () => {
      const override = getCardOverride('BS09-X36');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const immAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Immortality'));
      assert.ok(immAb, 'Must have [Immortality]');
      assert.equal(immAb.clauses[0].op.op, 'SUMMON');

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned)');
      assert.equal(summonAb.clauses[0].op.op, 'DESTROY');
    });

    it('BS09-X37 (The DoomKnightLord Ragna-Rock) - Summon exhaust & battle refresh', () => {
      const override = getCardOverride('BS09-X37');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned)');
      assert.equal(summonAb.clauses[0].op.op, 'EXHAUST');

      const battleAb = override.abilities.find(a => a.header.timing === 'WHEN_BATTLES');
      assert.ok(battleAb, 'Must have (When Battles)');
      assert.equal(battleAb.clauses[0].op.op, 'REFRESH');
    });

    it('BS09-X38 (The ImpregnableKnightLord Odin Type-X) - Summon bounce & all-color Armor', () => {
      const override = getCardOverride('BS09-X38');
      assert.ok(override);
      assert.equal(override.isFullySupported, true);

      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb, 'Must have (When Summoned)');
      assert.equal(summonAb.clauses[0].op.op, 'BOUNCE');

      const armorAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Armor'));
      assert.ok(armorAb, 'Must have [Armor]');
      assert.equal(armorAb.clauses[0].op.op, 'CONTINUOUS_RULE');
    });
  });

  describe('2. R2 Skipped Card Exclusion: Ambrocius', () => {
    it('BS09-X39 (The MagicalEmpress Ambrocius) is cataloged in SKIPPED_CARDS and has no override', () => {
      const found = SKIPPED_CARDS.find(c => c.cardNumber === 'BS09-X39');
      assert.ok(found, 'BS09-X39 must be recorded in SKIPPED_CARDS per R2');
      assert.equal(found.set, 'BS09');
      assert.ok(found.reason.includes('Removed Zone'), 'Reason must document legacy Removed Zone');

      const override = getCardOverride('BS09-X39');
      assert.equal(override, null, 'Skipped card must not have an override');
    });
  });

  describe('3. Full Canonical BS09 Resolution Integrity', () => {
    it('All 49 implemented BS09 cards in BS09_OVERRIDES resolve with isFullySupported and 0 unsupported clauses', () => {
      const keys = Object.keys(BS09_OVERRIDES).filter(k => k.startsWith('BS09-'));
      assert.equal(keys.length, 49, 'Expected 49 implemented BS09 keys');
      for (const k of keys) {
        const override = getCardOverride(k);
        assert.ok(override, `Override must exist for ${k}`);
        assert.equal(override.isFullySupported, true, `${k} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${k} must have 0 unsupported clauses`);
      }
    });
  });
});
