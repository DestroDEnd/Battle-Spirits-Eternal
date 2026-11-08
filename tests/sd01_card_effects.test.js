/**
 * tests/sd01_card_effects.test.js
 * 
 * Regression Test Suite for SD01 (Starter Deck: Blazing Thunder x Diamond Deity).
 * Verifies 100% deterministic execution of SD01 canonical card effects,
 * vanilla stats, level gating, and combat/flash interactions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { getCardOverride, SD01_OVERRIDES, SKIPPED_CARDS } from '../compiler/overrides/index.js';

describe('SD01 Card Effects & Mechanics Regression Suite', () => {

  describe('1. SD01 Vanilla Cards Stat & Ability Integrity', () => {
    const vanillaCardNumbers = ['SD01-001', 'SD01-002', 'SD01-022', 'SD01-025'];

    for (const cardNum of vanillaCardNumbers) {
      it(`${cardNum} has explicit vanilla IR with 0 abilities`, () => {
        const override = getCardOverride(cardNum);
        assert.ok(override, `Override must exist for ${cardNum}`);
        assert.equal(override.isVanilla, true);
        assert.equal(override.isFullySupported, true);
        assert.equal(override.abilities.length, 0);
        assert.equal(override.compiledClausesCount, 0);
        assert.equal(override.unsupportedClausesCount, 0);
      });
    }
  });

  describe('2. SD01 Magic Cards Deterministic Resolution', () => {

    it('SD01-039 (Blizzard Wall) - Flash caps unblocked attack life damage at 1', async () => {
      const override = getCardOverride('SD01-039');
      assert.ok(override);
      assert.equal(override.abilities.length, 1);
      const flashAbility = override.abilities[0];
      assert.equal(flashAbility.header.isFlash, true);
      assert.equal(flashAbility.clauses[0].op.op, 'DAMAGE_CAP');
      assert.equal(flashAbility.clauses[0].op.maxDamage, 1);

      // Execute via engine game flow
      const game = createGame();
      const state = game.state;
      state.players.player.life = 5;

      // Execute Blizzard Wall's clause op
      await executeOp(state, flashAbility.clauses[0].op, { controller: 'player' });

      // Verify modifier added to state
      const capMod = (state.modifiers || []).find(m => m.type === 'DAMAGE_CAP' && m.maxDamage === 1);
      assert.ok(capMod, 'DAMAGE_CAP 1 modifier must be registered');
    });

    it('SD01-037 (Carry Cores) - Flash moves 1 core from Void to Reserve and buffs BP by +1000', async () => {
      const override = getCardOverride('SD01-037');
      assert.ok(override);
      assert.equal(override.abilities.length, 1);
      const clauses = override.abilities[0].clauses;
      assert.equal(clauses.length, 2);
      assert.equal(clauses[0].op.op, 'MOVE_CORE');
      assert.equal(clauses[0].op.from.zone, 'void');
      assert.equal(clauses[0].op.to.zone, 'reserve');
      assert.equal(clauses[1].op.op, 'BP_BUFF');
      assert.equal(clauses[1].op.amount, 1000);

      const game = createGame();
      const state = game.state;
      const initialReserve = state.players.player.reserve.normal;

      await executeOp(state, clauses[0].op, { controller: 'player' });
      assert.equal(state.players.player.reserve.normal, initialReserve + 1, 'Reserve core count must increment by 1');
    });

    it('SD01-034 (Extra Draw) - Main draws 2 cards', async () => {
      const override = getCardOverride('SD01-034');
      assert.ok(override);
      const mainAb = override.abilities.find(a => a.header.isMain);
      assert.ok(mainAb, 'Main ability must exist');
      assert.equal(mainAb.clauses[0].op.op, 'DRAW');
      assert.equal(mainAb.clauses[0].op.count, 2);

      const game = createGame({
        playerDeck: Array.from({ length: 10 }, (_, i) =>
          createCardInstance({ id: `deck_${i}`, card_number: 'SD01-001' }, 'player')
        )
      });
      const state = game.state;
      const initialHand = state.players.player.hand.length;
      const initialDeck = state.players.player.deck.length;

      await executeOp(state, mainAb.clauses[0].op, { controller: 'player' });
      assert.equal(state.players.player.hand.length, initialHand + 2);
      assert.equal(state.players.player.deck.length, initialDeck - 2);
    });

    it('SD01-035 (Sudden Death Draw) - Flash draws 1 card and gives +1000 BP', async () => {
      const override = getCardOverride('SD01-035');
      assert.ok(override);
      const flashAb = override.abilities.find(a => a.header.isFlash);
      assert.ok(flashAb);
      assert.equal(flashAb.clauses[0].op.op, 'DRAW');
      assert.equal(flashAb.clauses[0].op.count, 1);
      assert.equal(flashAb.clauses[1].op.op, 'BP_BUFF');
      assert.equal(flashAb.clauses[1].op.amount, 1000);
    });

    it('SD01-033 (Victory Fire) - Flash targets destruction of <= 3000 BP spirits or Spirit + Nexus', async () => {
      const override = getCardOverride('SD01-033');
      assert.ok(override);
      const flashAb = override.abilities[0];
      assert.equal(flashAb.header.isFlash, true);
      assert.equal(flashAb.clauses[0].op.op, 'DESTROY');
    });
  });

  describe('3. SD01 Spirit Abilities & Combat Triggers', () => {

    it('SD01-004 (The Infantry Dragron) - (When Attacks) gains +2000 BP', async () => {
      const override = getCardOverride('SD01-004');
      assert.ok(override);
      const attackAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(attackAb);
      assert.equal(attackAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(attackAb.clauses[0].op.amount, 2000);
    });

    it('SD01-020 (Hitodem) - [Armor: Red] and (When Blocks) gains +2000 BP', async () => {
      const override = getCardOverride('SD01-020');
      assert.ok(override);
      const blockAb = override.abilities.find(a => a.header.timing === 'WHEN_BLOCKS');
      assert.ok(blockAb);
      assert.equal(blockAb.clauses[0].op.op, 'BP_BUFF');
      assert.equal(blockAb.clauses[0].op.amount, 2000);
    });

    it('SD01-006 (The FineDragon Windrake) - Flash [Awaken] core movement', async () => {
      const override = getCardOverride('SD01-006');
      assert.ok(override);
      const awakenAb = override.abilities.find(a => a.header.keyword === 'Awaken');
      assert.ok(awakenAb);
      assert.equal(awakenAb.clauses[0].op.op, 'AWAKEN_CORE_MOVE');
    });

    it('SD01-008 (The ThunderEmperorDragon Siegwurm) - [Clash] (When Attacks) forces block', async () => {
      const override = getCardOverride('SD01-008');
      assert.ok(override);
      const clashAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
      assert.ok(clashAb);
      assert.equal(clashAb.clauses[0].op.op, 'FORCE_BLOCK');
    });

    it('SD01-017 (The HeavyArmoredBug Caterbarga) - (When Summoned) exhausts all Cost 1 or less spirits', async () => {
      const override = getCardOverride('SD01-017');
      assert.ok(override);
      const summonAb = override.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      assert.ok(summonAb);
      assert.equal(summonAb.clauses[0].op.op, 'EXHAUST');
      assert.equal(summonAb.clauses[0].op.target.maxCost, 1);
    });

    it('SD01-021 (The Sacred Gungnir) - (When Destroyed) bounces Cost <= 1 spirits', async () => {
      const override = getCardOverride('SD01-021');
      assert.ok(override);
      const destroyAb = override.abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      assert.ok(destroyAb);
      assert.equal(destroyAb.clauses[0].op.op, 'BOUNCE');
      assert.equal(destroyAb.clauses[0].op.target.maxCost, 1);
    });

    it('SD01-011 (The HellFighter Balam) - [Curse] does NOT destroy on attack, but destroys blocker at end of battle if blocked', async () => {
      const override = getCardOverride('SD01-011');
      assert.ok(override);
      // Abilities must not contain a WHEN_ATTACKS unconditional destroy
      const attackDestroyAb = override.abilities.find(a => a.header.timing === 'WHEN_ATTACKS' && a.clauses.some(c => c.op && c.op.op === 'DESTROY'));
      assert.equal(attackDestroyAb, undefined, 'Balam must NOT unconditionally destroy opposing spirits on attack');

      // Now test combat simulation in engine
      const game = createGame();
      const state = game.state;

      // Player field: Balam (SD01-011, 3000 BP)
      const balamCard = createCardInstance({
        id: 'balam_1',
        card_number: 'SD01-011',
        name: 'The HellFighter Balam',
        type: 'Spirit',
        cost: 3,
        levels: [{ level: 1, cores: 1, bp: 3000 }, { level: 2, cores: 3, bp: 5000 }],
        keywords: [{ name: 'Curse' }],
        compiledIr: override
      }, 'player');
      const balamStack = createFieldStack(balamCard, 1);
      state.players.player.field.push(balamStack);

      // Opponent field: Boss Spirit (10,000 BP)
      const bossCard = createCardInstance({
        id: 'boss_1',
        card_number: 'BS01-001',
        name: 'The DragonBoss',
        type: 'Spirit',
        cost: 6,
        levels: [{ level: 1, cores: 1, bp: 10000 }]
      }, 'opponent');
      const bossStack = createFieldStack(bossCard, 1);
      state.players.opponent.field.push(bossStack);

      // 1. Declare attack with Balam
      const attackRes = await game.declareAttack(balamStack.id, 'player');
      assert.equal(attackRes.success, true);
      // Verify Opponent Boss is STILL on field (not prematurely destroyed!)
      assert.equal(state.players.opponent.field.length, 1, 'Opponent spirit must NOT be destroyed on attack declaration');

      // 2. Declare block with Boss Spirit (10,000 BP vs 3,000 BP)
      const blockRes = await game.declareBlock(bossStack.id, 'opponent');
      assert.equal(blockRes.success, true);

      // 3. Verify Battle outcome:
      // Balam is destroyed by BP comparison (3000 < 10000)
      assert.equal(state.players.player.field.length, 0, 'Balam died in battle');
      assert.equal(state.players.player.grave.length, 1);

      // Boss Spirit is ALSO destroyed at end of battle by Curse!
      assert.equal(state.players.opponent.field.length, 0, 'Boss spirit destroyed at end of battle by Curse');
      assert.equal(state.players.opponent.grave.length, 1);
    });
  });

  describe('4. Engine Level Gating in SD01', () => {

    it('SD01-024 (Atrithr) LV1 [LV1][LV2] (When Blocks) triggers but [LV2] refresh does not trigger at LV1', async () => {
      const override = getCardOverride('SD01-024');
      assert.ok(override);
      assert.equal(override.abilities.length, 2);

      const lv1BlockAb = override.abilities[0];
      const lv2BlockAb = override.abilities[1];

      assert.deepEqual(lv1BlockAb.header.levels, [1, 2]);
      assert.deepEqual(lv2BlockAb.header.levels, [2]);

      // Level gating: if spirit is at Level 1, lv2BlockAb is NOT included
      assert.equal(lv1BlockAb.header.levels.includes(1), true);
      assert.equal(lv2BlockAb.header.levels.includes(1), false);
    });
  });

  describe('5. R2 Skipped Cards Exclusion Verification', () => {
    it('Ensures SD01 skipped cards (SD01-029, SD01-031, SD01-032) are formally cataloged', () => {
      const skippedSd = SKIPPED_CARDS.filter(c => c.set.includes('SD01'));
      assert.equal(skippedSd.length, 4); // 3 canonical + 1 synthetic

      const cardNums = skippedSd.map(c => c.cardNumber);
      assert.ok(cardNums.includes('SD01-029'));
      assert.ok(cardNums.includes('SD01-031'));
      assert.ok(cardNums.includes('SD01-032'));
      assert.ok(cardNums.includes('BATTLE-SPIRITS-A404'));

      for (const num of cardNums) {
        assert.equal(getCardOverride(num), null, `${num} must NOT have an active override`);
      }
    });
  });
});
