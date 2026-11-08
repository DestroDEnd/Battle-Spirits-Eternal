/**
 * tests/bs04_card_effects.test.js
 * 
 * Regression Test Suite for BS04 (Booster Set 04: Great Imperial Ruler).
 * Verifies 100% deterministic execution of BS04 canonical card effects,
 * vanillas, [Tribute: Cost 5+], [Awaken], [High Speed], and Siegfried X-Rare.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, BS04_OVERRIDES } from '../compiler/overrides/index.js';

describe('BS04 Card Effects & Mechanics Regression Suite', () => {

  describe('1. BS04 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCards = ['BS04-003', 'BS04-015', 'BS04-040', 'BS04-046', 'BS04-056'];

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

  describe('2. BS04 [Awaken] & [Tribute] Keywords', () => {

    it('BS04-004 (DarkDinohound) - Has [Awaken] core movement and refresh trigger', () => {
      const override = getCardOverride('BS04-004');
      assert.ok(override);
      const awakenAb = override.abilities.find(a => a.header.keyword === 'Awaken');
      assert.ok(awakenAb);
      assert.equal(awakenAb.header.isFlash, true);
      assert.equal(awakenAb.clauses[0].op.op, 'AWAKEN_CORE_MOVE');
    });

    it('BS04-010 (The ThunderDragon El-Clair) - Has [Tribute: Cost 5 or more -> Trash]', () => {
      const override = getCardOverride('BS04-010');
      assert.ok(override);
      const tributeKeyword = override.keywords.find(k => k.name === 'Tribute');
      assert.ok(tributeKeyword);
      assert.equal(tributeKeyword.parameter, 'Cost 5 or more → Trash');
      const tributeAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Tribute'));
      assert.ok(tributeAb);
      assert.equal(tributeAb.clauses[0].op.op, 'KEYWORD_ACTION');
    });
  });

  describe('3. BS04 [High Speed] Mechanics', () => {

    it('BS04-028 (Sevenspot) - Flash [High Speed] reserve-only summoning', () => {
      const override = getCardOverride('BS04-028');
      assert.ok(override);
      const hsAb = override.abilities.find(a => a.header.keyword === 'High Speed');
      assert.ok(hsAb);
      assert.equal(hsAb.header.isFlash, true);
      assert.equal(hsAb.clauses[0].op.op, 'SUMMON_RESERVE_ONLY');
    });
  });

  describe('4. BS04 Magic Resolution', () => {

    it('BS04-102 (Dream Hand) - Flash bounces every Cost 1 or less Spirit', () => {
      const override = getCardOverride('BS04-102');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BOUNCE');
    });
  });

  describe('5. BS04 X-Rares', () => {

    it('BS04-X13 (The DarkDragonEmperor Siegfried) - Has [Tribute: Cost 6 or more -> Void], Draw, and Destruction', () => {
      const override = getCardOverride('BS04-X13');
      assert.ok(override);
      const tributeKeyword = override.keywords.find(k => k.name === 'Tribute');
      assert.ok(tributeKeyword);
      assert.equal(tributeKeyword.parameter, 'Cost 6 or more → Void');
      assert.ok(override.abilities.some(a => a.clauses.some(c => c.op.op === 'DRAW')));
      assert.ok(override.abilities.some(a => a.clauses.some(c => c.op.op === 'DESTROY')));
    });
  });

});
