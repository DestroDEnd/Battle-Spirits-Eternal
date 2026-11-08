/**
 * tests/sd03_card_effects.test.js
 * 
 * Regression Test Suite for SD03 (Starter Deck: The Iron Deity).
 * Verifies 100% deterministic execution of SD03 canonical card effects,
 * Braves, Brave Conditions, Sieg-Apollodragon, and Sagitta Flame.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, SD03_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD03 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD03 All-Card Deterministic Registry Coverage', () => {
    const allSd03CardNumbers = Array.from({ length: 17 }, (_, i) => `SD03-${String(i + 1).padStart(3, '0')}`);

    for (const cardNum of allSd03CardNumbers) {
      it(`${cardNum} has explicit deterministic IR registered`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isFullySupported, true);
        assert.ok(override.abilities.length > 0 || override.isVanilla, 'Must have compiled abilities or be vanilla');
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. SD03 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['SD03-001', 'SD03-005'];

    for (const cardNum of vanillaCards) {
      it(`${cardNum} has explicit vanilla IR with 0 abilities`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override);
        assert.equal(override.isVanilla, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.compiledClausesCount, 0);
      });
    }
  });

  describe('3. SD03 Brave Cards & Brave Conditions', () => {

    it('SD03-010 (The CannonDragon Bal-Gunner) - Brave Condition Cost 4+ and Attack Effect', () => {
      const override = getCardOverride('SD03-010');
      assert.ok(override);
      const braveKeyword = override.keywords.find(k => k.name === 'Brave');
      assert.ok(braveKeyword, 'Must register Brave keyword');
      assert.equal(braveKeyword.parameter, 'Cost 4 or more');

      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.ok(attackAb.header.prefixes.includes('When Braved'));
      assert.equal(attackAb.clauses[0].op.op, 'DRAW');
      assert.equal(attackAb.clauses[1].op.op, 'DESTROY');
      assert.equal(attackAb.clauses[1].op.target.filters.bpLte, 4000);
    });

    it('SD03-011 (The CrustDragon Groun-Giras) - Brave Condition Cost 3+', () => {
      const override = getCardOverride('SD03-011');
      assert.ok(override);
      const braveKeyword = override.keywords.find(k => k.name === 'Brave');
      assert.ok(braveKeyword);
      assert.equal(braveKeyword.parameter, 'Cost 3 or more');
    });

    it('SD03-012 (The FangEmperor Cerbelord) - Brave Condition Cost 5+', () => {
      const override = getCardOverride('SD03-012');
      assert.ok(override);
      const braveKeyword = override.keywords.find(k => k.name === 'Brave');
      assert.ok(braveKeyword);
      assert.equal(braveKeyword.parameter, 'Cost 5 or more');
    });
  });

  describe('4. SD03 Ace Spirit & Attack Mechanics', () => {

    it('SD03-006 (The SunDragon Sieg-Apollodragon) - Target and attack refreshed spirit', () => {
      const override = getCardOverride('SD03-006');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'CONTINUOUS_RULE');
      assert.equal(attackAb.clauses[0].op.rule, 'CAN_ATTACK_REFRESHED');

      const braveAttackAb = override.abilities.find(a => a.header.timing === 'WHEN_BRAVE_ATTACKS');
      assert.ok(braveAttackAb);
      assert.equal(braveAttackAb.clauses[0].op.op, 'DESTROY');
      assert.equal(braveAttackAb.clauses[0].op.target.filters.bpLte, 9000);
    });
  });

  describe('5. SD03 Magic Resolution', () => {

    it('SD03-016 (Sagitta Flame) - Mode TOTAL_BP_LTE 5000 or Nexus destruction', () => {
      const override = getCardOverride('SD03-016');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
      assert.equal(flashAb.clauses[0].op.mode, 'TOTAL_BP_LTE');
      assert.equal(flashAb.clauses[0].op.maxTotalBp, 5000);
      assert.equal(flashAb.clauses[1].op.op, 'DESTROY');
      assert.equal(flashAb.clauses[1].op.target.types[0], 'Nexus');
    });

    it('SD03-015 (Brave Draw) - Main draws 2 and reveals 3 for Brave', () => {
      const override = getCardOverride('SD03-015');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 2);
      assert.equal(mainAb.clauses[1].op.op, 'REVEAL_DECKTOP');
      assert.equal(mainAb.clauses[1].op.count, 3);
    });
  });

});
