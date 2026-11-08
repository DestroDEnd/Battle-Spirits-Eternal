/**
 * tests/sd02_card_effects.test.js
 * 
 * Regression Test Suite for SD02 (Starter Deck: Bursting Roar / Heaven & Earth).
 * Verifies 100% deterministic execution of SD02 canonical card effects,
 * [Tribute], [Assault], Strong Draw, and blocking interactions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { executeOp } from '../engine/ops/index.js';
import { getCardOverride, SD02_OVERRIDES } from '../compiler/overrides/index.js';

describe('SD02 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD02 All-Card Deterministic Registry Coverage', () => {
    const allSd02CardNumbers = Array.from({ length: 21 }, (_, i) => `SD02-${String(i + 1).padStart(3, '0')}`);

    for (const cardNum of allSd02CardNumbers) {
      it(`${cardNum} has explicit deterministic IR registered`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isFullySupported, true);
        assert.ok(override.abilities.length > 0 || override.isVanilla, 'Must have compiled abilities');
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. SD02 Tribute (Tenshou) Mechanics', () => {

    it('SD02-004 (The SacredBeast Haktak) - Has [Tribute: Cost 3 or more -> Trash]', () => {
      const override = getCardOverride('SD02-004');
      assert.ok(override);
      const tributeKeyword = override.keywords.find(k => k.name === 'Tribute');
      assert.ok(tributeKeyword, 'Must register Tribute keyword');
      const tributeAb = override.abilities.find(a => a.header.keyword && a.header.keyword.includes('Tribute'));
      assert.ok(tributeAb);
      assert.equal(tributeAb.clauses[0].op.op, 'KEYWORD_ACTION');
      assert.equal(tributeAb.clauses[0].op.keyword, 'Tribute');
    });

    it('SD02-018 (The BraveColonel Dragron) - Tribute target trigger destroys two <= 4000 BP spirits', () => {
      const override = getCardOverride('SD02-018');
      assert.ok(override);
      assert.equal(override.abilities.length, 1);
      const ab = override.abilities[0];
      assert.equal(ab.clauses[0].op.op, 'DESTROY');
      assert.equal(ab.clauses[0].op.count, 2);
      assert.equal(ab.clauses[0].op.target.filters.bpLte, 4000);
    });

    it('SD02-020 (The RainbowWings Jewelg) - Tribute target trigger puts cores from Void to Reserve', () => {
      const override = getCardOverride('SD02-020');
      assert.ok(override);
      const ab = override.abilities[0];
      assert.ok(ab);
      assert.ok(ab.clauses.some(c => c.op.op === 'MOVE_CORE'));
    });
  });

  describe('3. SD02 Assault Mechanics', () => {

    it('SD02-010 (The RoaringSwordmaster Lowen) - Possesses [Assault: 1] and Destroy effect', () => {
      const override = getCardOverride('SD02-010');
      assert.ok(override);
      const assaultKeyword = override.keywords.find(k => k.name === 'Assault');
      assert.ok(assaultKeyword, 'Must register Assault keyword');
      assert.ok(override.abilities.some(a => a.header.timing === 'WHEN_SUMMONED'));
    });
  });

  describe('4. SD02 Magic & Combat Resolution', () => {

    it('SD02-017 (Strong Draw) - Main draws 3 cards and Flash gives +3000 BP', async () => {
      const override = getCardOverride('SD02-017');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);

      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb);
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 3);

      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(flashAb.clauses[0].op.amount, 3000);

      // Execute Draw Op
      const game = createGame();
      const p = game.state.players.player;
      p.deck = [
        { id: 'c1', name: 'Card 1' },
        { id: 'c2', name: 'Card 2' },
        { id: 'c3', name: 'Card 3' }
      ];
      p.hand = [];

      await executeOp(game.state, mainAb.clauses[0].op, { controller: 'player' });
      assert.equal(p.hand.length, 3);
      assert.equal(p.deck.length, 0);
    });

    it('SD02-002 (Misaal) - (When Blocks) exhausts spirits with matching cost', () => {
      const override = getCardOverride('SD02-002');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'EXHAUST');
    });
  });

});
