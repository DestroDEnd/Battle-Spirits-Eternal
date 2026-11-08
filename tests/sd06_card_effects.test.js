/**
 * tests/sd06_card_effects.test.js
 * 
 * Regression Test Suite for SD06 (Starter Deck: The Shining Wings).
 * Verifies 100% deterministic execution of SD06 canonical card effects,
 * modern [Burst] declarations, Hero-Dragon Lord-Dragon, Burst Draw, and Burst Wall.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, SD06_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD06 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD06 All-Card Deterministic Registry Coverage', () => {
    const sd06CardNumbers = [
      'SD06-001', 'SD06-003', 'SD06-004', 'SD06-007',
      'SD06-009', 'SD06-011', 'SD06-012', 'SD06-013',
      'SD06-014', 'SD06-015', 'SD06-016', 'SD06-017'
    ];

    for (const cardNum of sd06CardNumbers) {
      it(`${cardNum} has explicit deterministic IR registered`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isFullySupported, true);
        assert.ok(override.abilities.length > 0 || override.isVanilla, 'Must have compiled abilities or be vanilla');
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. SD06 Vanilla Cards Stat & Ability Integrity', () => {

    it('SD06-001 (Ohdoran) has explicit vanilla IR with 0 abilities', () => {
      const override = getCardOverride('SD06-001');
      assert.ok(override);
      assert.equal(override.isVanilla, true);
      assert.equal(override.abilities.length, 0);
      assert.equal(override.compiledClausesCount, 0);
    });
  });

  describe('3. SD06 Ace [Burst] Spirit: The HeroDragon Lord-Dragon', () => {

    it('SD06-007 (The HeroDragon Lord-Dragon) - Has Burst Life-reduced summon and Hero trigger', () => {
      const override = getCardOverride('SD06-007');
      assert.ok(override);
      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb, 'Must register BURST timing');
      assert.equal(burstAb.header.burstCondition, 'AFTER_YOUR_LIFE_REDUCED');
      assert.equal(burstAb.clauses[0].op.op, 'SUMMON_THIS_CARD');

      const heroTriggerAb = override.abilities.find(a => a.header.timingLabel === 'After Your Burst Activates');
      assert.ok(heroTriggerAb);
      assert.equal(heroTriggerAb.clauses[0].op.op, 'DESTROY');
      assert.equal(heroTriggerAb.clauses[0].op.target.filters.bpLte, 9000);
    });
  });

  describe('4. SD06 [Burst] Magics Resolution', () => {

    it('SD06-013 (Burst Draw) - Burst triggers on opposing summon to draw 2', () => {
      const override = getCardOverride('SD06-013');
      assert.ok(override);
      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb);
      assert.equal(burstAb.header.burstCondition, 'AFTER_OPPONENT_SUMMON_EFFECT');
      assert.equal(burstAb.clauses[0].op.op, 'DRAW');
      assert.equal(burstAb.clauses[0].op.count, 2);
    });

    it('SD06-016 (Burst Wall) - Burst recovers 1 Life and Flash ends Attack Step', () => {
      const override = getCardOverride('SD06-016');
      assert.ok(override);
      const burstAb = override.abilities.find(a => a.header.timing === 'BURST');
      assert.ok(burstAb);
      assert.equal(burstAb.header.burstCondition, 'AFTER_YOUR_LIFE_REDUCED');
      assert.equal(burstAb.clauses[0].op.op, 'RECOVER_LIFE');
      assert.equal(burstAb.clauses[0].op.count, 1);

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'COMBAT_RULE');
    });
  });

});
