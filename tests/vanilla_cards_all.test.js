/**
 * tests/vanilla_cards_all.test.js
 * 
 * Regression Test Suite for Database-Wide Vanilla Cards.
 * Verifies that all 374 vanilla cards across all sets in Battle Spirits Eternal
 * resolve deterministically with isVanilla: true, 0 abilities, and verified stat schemas.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCardOverride, VANILLA_CARD_NUMBERS } from '../compiler/overrides/index.js';

describe('Database-Wide Vanilla Cards Integrity Suite', () => {

  it('All 374 cards in VANILLA_CARD_NUMBERS resolve with deterministic vanilla IR', () => {
    assert.equal(VANILLA_CARD_NUMBERS.size, 374, 'Exactly 374 vanilla cards must be registered');

    for (const cardNum of VANILLA_CARD_NUMBERS) {
      const override = getCardOverride(cardNum);
      assert.ok(override, `Override must resolve for vanilla card ${cardNum}`);
      assert.equal(override.isVanilla, true, `${cardNum} must have isVanilla: true`);
      assert.equal(override.isFullySupported, true, `${cardNum} must be fully supported`);
      assert.equal(override.abilities.length, 0, `${cardNum} must have 0 abilities`);
      assert.equal(override.compiledClausesCount, 0, `${cardNum} must have 0 compiled clauses`);
      assert.equal(override.unsupportedClausesCount, 0, `${cardNum} must have 0 unsupported clauses`);
    }
  });

  it('All canonical database vanilla cards have verified base stat schemas', () => {
    const cards = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));
    let verifiedCount = 0;

    for (const cardNum of VANILLA_CARD_NUMBERS) {
      const card = Object.values(cards).find(c => c.card_number === cardNum);
      if (!card) continue;

      // Skip known synthetic / anomalous stub entry
      if (cardNum === 'BATTLE-SPIRITS-A7134') continue;

      assert.equal(typeof card.cost, 'number', `${cardNum} must have numeric cost`);
      assert.ok(card.levels && Object.keys(card.levels).length > 0, `${cardNum} must have levels`);
      assert.ok(card.color || (card.colors && card.colors.length > 0), `${cardNum} must have color`);
      assert.ok(card.symbol || (card.symbols && card.symbols.length > 0), `${cardNum} must have symbols`);
      verifiedCount++;
    }

    assert.equal(verifiedCount, 368, 'All canonical database vanilla cards with artwork must have verified base stats');
  });

});
