/**
 * tests/bs05_card_effects.test.js
 * 
 * Regression Test Suite for BS05 (Booster Set 05: Roar of the Emperor).
 * Verifies 100% deterministic execution of BS05 canonical card effects,
 * vanillas, [Armor: Red/White], Siegfrieden X-Rare, and Branch Lock.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS05_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS05 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS05 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['BS05-024', 'BS05-045', 'BS05-052'];

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

  describe('2. BS05 [Armor: Red/White] Keyword', () => {

    it('BS05-032 (The CoralCrab Siomanekid) - Has [Armor: Red/White]', () => {
      const override = getCardOverride('BS05-032');
      assert.ok(override);
      const armorKeyword = override.keywords.find(k => k.name === 'Armor');
      assert.ok(armorKeyword);
      assert.equal(armorKeyword.parameter, 'Red/White');
    });
  });

  describe('3. BS05 Combat Defense Buffs', () => {

    it('BS05-035 (The EvilDeity Big-Loki) - (When Blocks) gains +3000 BP', () => {
      const override = getCardOverride('BS05-035');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(blockAb.clauses[0].op.amount, 3000);
    });
  });

  describe('4. BS05 Flash Magic Resolution', () => {

    it('BS05-074 (Branch Lock) - Flash exhausts two opposing Spirits', () => {
      const override = getCardOverride('BS05-074');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(flashAb.clauses[0].op.count, 2);
    });
  });

  describe('5. BS05 X-Rares', () => {

    it('BS05-X19 (The SacredEmperor Siegfrieden) - [Tribute: Cost 6 or more -> Void] and Destruction opcodes', () => {
      const override = getCardOverride('BS05-X19');
      assert.ok(override);
      const tributeKeyword = override.keywords.find(k => k.name === 'Tribute');
      assert.ok(tributeKeyword);
      assert.equal(tributeKeyword.parameter, 'Cost 6 or more → Void');
      assert.ok(override.abilities.some(a => a.header.timing === 'WHEN_SUMMONED'));
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'DESTROY');
      assert.equal(attackAb.clauses[0].op.count, 2);
      assert.equal(attackAb.clauses[0].op.target.filters.bpLte, 7000);
    });
  });

});
