/**
 * tests/work_package_k1_batch_05_complex_effects.test.js
 *
 * Verification suite for K1-BATCH-05:
 * - K1B5-01: 4 Blocked cards (26RBS02-083, 26RDB01-024, 26RSD07-001, BS27-082)
 * - K1B5-02: 2 Drift cards (BS19-X05, BS33-069)
 * - K1B5-03: Replacement/prevention engine semantics (REMAIN_ON_FIELD, LIFE_TO_RESERVE, anti-loop, UNPREVENTABLE)
 * - K1B5-04: Batch 1 carry-forward verification (BS14-105 decktop resolution, fail-closed bare DECK, target.side narrowing)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import { createGame } from '../engine/index.js';
import { executeOp, resolveBounceDestination, narrowEitherSideFromClause } from '../engine/ops/index.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { compileCard } from '../compiler/index.js';
import { splitClauses } from '../compiler/clause_splitter.js';
import { resolveTargets } from '../engine/selectors.js';

const cardData = JSON.parse(fs.readFileSync('./data/cards_detailed.json', 'utf8'));

function getCard(cardNumber) {
  return cardData[cardNumber] || Object.values(cardData).find(c => c.card_number === cardNumber);
}

describe('K1-BATCH-05: Complex Effects, Replacement/Prevention & Batch 1 Carry-Forward', () => {

  describe('K1B5-01: 4 Blocked Cards Compilation & Runtime Execution', () => {
    it('26RBS02-083: Compiles 0-BP destruction replacement and redirects 0-BP spirit to deckbottom', async () => {
      const raw = getCard('26RBS02-083');
      assert.ok(raw, '26RBS02-083 must exist');
      const ir = compileCard(raw);
      assert.ok(ir.abilities.length >= 2, 'Must have at least 2 abilities');

      const repClause = ir.abilities[0].clauses.find(c => c.op?.op === 'REPLACEMENT_EFFECT');
      assert.ok(repClause, 'Must compile REPLACEMENT_EFFECT clause');
      assert.equal(repClause.op.replaces, 'DESTRUCTION');
      assert.equal(repClause.op.replacementZone, 'deck_bottom');
      assert.equal(repClause.op.filter?.zeroBp, true);
      assert.equal(repClause.op.filter?.maxCost, 5);

      // Runtime simulation
      const game = createGame();
      const opp = game.state.players.opponent;
      const targetCard = { id: 'test_opp_sp1', card_number: 'TEST-01', name: 'Test Small Spirit', type: 'Spirit', cost: 4, bp: 2000 };
      opp.field.push({
        id: 'stack_opp_1',
        owner: 'opponent',
        top: targetCard,
        under: [],
        braves: [],
        cores: { normal: 1, soul: 0 },
        state: 'REFRESHED'
      });

      // Active replacement modifier
      game.state.modifiers.push({
        id: 'mod_26rbs02_083',
        type: 'REPLACEMENT_EFFECT',
        replaces: 'DESTRUCTION',
        replacementZone: 'deck_bottom',
        side: 'opp',
        filter: { type: 'Spirit', maxCost: 5, zeroBp: true }
      });

      // Case A: destroyed with 0 BP (bpAtDestroy: 0) -> goes to deckbottom
      const initialDeckLen = opp.deck.length;
      const movedA = await moveCard(game.state, targetCard, 'grave', 'opponent', { cause: 'destroy', bpAtDestroy: 0 });
      assert.equal(movedA, true);
      assert.equal(opp.grave.some(c => c.id === 'test_opp_sp1'), false, 'Must not be in grave');
      assert.equal(opp.deck.length, initialDeckLen + 1, 'Must be sent to deck');
      assert.equal(opp.deck[opp.deck.length - 1].id, 'test_opp_sp1', 'Must be at bottom of deck');

      // Case B: spirit with BP > 0 -> goes to grave normally
      const targetCardB = { id: 'test_opp_sp2', card_number: 'TEST-02', name: 'Test Healthy Spirit', type: 'Spirit', cost: 4, bp: 4000 };
      opp.field.push({
        id: 'stack_opp_2',
        owner: 'opponent',
        top: targetCardB,
        under: [],
        braves: [],
        cores: { normal: 2, soul: 0 },
        state: 'REFRESHED'
      });
      const movedB = await moveCard(game.state, targetCardB, 'grave', 'opponent', { cause: 'destroy', bpAtDestroy: 4000 });
      assert.equal(movedB, true);
      assert.equal(opp.grave.some(c => c.id === 'test_opp_sp2'), true, 'Must go to grave when BP > 0');
    });

    it('26RDB01-024: Compiles opposing hand bounce to deckbottom and moves card from opp hand', async () => {
      const raw = getCard('26RDB01-024');
      assert.ok(raw, '26RDB01-024 must exist');
      const ir = compileCard(raw);

      const bounceAb = ir.abilities.find(a => a.clauses.some(c => c.op?.op === 'BOUNCE'));
      assert.ok(bounceAb, 'Must contain BOUNCE ability');
      const bounceOp = bounceAb.clauses.find(c => c.op?.op === 'BOUNCE').op;
      assert.equal(bounceOp.destination, 'DECK_BOTTOM');
      assert.equal(bounceOp.target?.zone, 'hand');
      assert.equal(bounceOp.target?.side, 'opp');

      // Runtime execution
      const game = createGame();
      const opp = game.state.players.opponent;
      const cardInHand = { id: 'opp_hand_card_1', card_number: 'TEST-H1', name: 'Secret Spell', type: 'Magic' };
      opp.hand.push(cardInHand);
      const initialDeckLen = opp.deck.length;

      const promptResolver = {
        choose: async (p) => [p.candidates[0]]
      };
      const res = await executeOp(game.state, bounceOp, { controller: 'player', currentClause: { rawText: 'opponent returns a card from their Hand to deckbottom' } }, promptResolver);
      assert.equal(res.status, 'SUCCESS');
      assert.equal(res.bouncedCount, 1);
      assert.equal(opp.hand.some(c => c.id === 'opp_hand_card_1'), false, 'Card must leave opp hand');
      assert.equal(opp.deck.length, initialDeckLen + 1);
      assert.equal(opp.deck[opp.deck.length - 1].id, 'opp_hand_card_1', 'Card must be placed at bottom of deck');
    });

    it('26RSD07-001: Compiles self-bounce to deckbottom with destination DECK_BOTTOM', async () => {
      const raw = getCard('26RSD07-001');
      assert.ok(raw, '26RSD07-001 must exist');
      const ir = compileCard(raw);
      assert.ok(ir.abilities.length >= 1);

      const clauses = ir.abilities[0].clauses;
      assert.ok(clauses.length >= 1);
      assert.equal(clauses[0].op.op, 'BOUNCE');
      assert.equal(resolveBounceDestination(clauses[0].op, clauses[0]), 'deck_bottom');

      // Runtime execution: self bounce to deckbottom
      const game = createGame();
      const p = game.state.players.player;
      const selfCard = { id: 'self_zeroider', card_number: '26RSD07-001', name: 'CODE Zeroider', type: 'Spirit', cost: 1 };
      p.field.push({
        id: 'self_stack_01',
        owner: 'player',
        top: selfCard,
        under: [],
        braves: [],
        cores: { normal: 1, soul: 0 },
        state: 'REFRESHED'
      });
      const initialDeckLen = p.deck.length;

      const res = await executeOp(game.state, clauses[0].op, { controller: 'player', sourceCard: selfCard, currentClause: clauses[0] });
      assert.equal(res.status, 'SUCCESS');
      assert.equal(p.field.some(st => st.top.id === 'self_zeroider'), false, 'Self must leave field');
      assert.equal(p.deck[p.deck.length - 1].id, 'self_zeroider', 'Must be at bottom of deck');
    });

    it('BS27-082: Compiles BP debuff with BATTLING state filter during battle', async () => {
      const raw = getCard('BS27-082');
      assert.ok(raw, 'BS27-082 must exist');
      const ir = compileCard(raw);

      const debuffAb = ir.abilities.find(a => a.clauses.some(c => c.op?.op === 'BP_DEBUFF'));
      assert.ok(debuffAb, 'Must have BP_DEBUFF ability');
      const debuffOp = debuffAb.clauses.find(c => c.op?.op === 'BP_DEBUFF').op;
      assert.equal(debuffOp.amount, 10000);
      assert.equal(debuffOp.target?.state, 'BATTLING');
      assert.equal(debuffOp.target?.side, 'opp');

      // Runtime execution
      const game = createGame();
      const opp = game.state.players.opponent;
      const oppU = { id: 'opp_ultimate_1', card_number: 'TEST-U1', name: 'Rival Ultimate', type: 'Ultimate', bp: 15000 };
      const oppStack = { id: 'st_opp_u1', owner: 'opponent', top: oppU, under: [], braves: [], cores: { normal: 1, soul: 0 }, state: 'REFRESHED' };
      opp.field.push(oppStack);
      game.state.battle = { attacker: oppStack };

      const promptResolver = { choose: async () => [oppStack] };
      const res = await executeOp(game.state, debuffOp, { controller: 'player', currentClause: { rawText: 'During this battle, 1 opposing battling Ultimate gets -10000 BP.' } }, promptResolver);
      assert.equal(res.status, 'SUCCESS');
      assert.ok(
        game.state.modifiers.some(m => (m.type === 'BP_DEBUFF' && m.amount === 10000) || (m.type === 'BP_BUFF' && m.amount === -10000)),
        'Must register BP debuff modifier'
      );
    });
  });

  describe('K1B5-02: 2 Drift Cards Compilation & Runtime Structure', () => {
    it('BS19-X05: Compiles cleanly with WHEN_BATTLES, PASSIVE, and ATTACK_STEP timings', () => {
      const raw = getCard('BS19-X05');
      assert.ok(raw, 'BS19-X05 must exist');
      const ir = compileCard(raw);
      assert.ok(ir.abilities.length >= 3, 'Must have 3 abilities');

      const timings = ir.abilities.map(a => a.header?.timing);
      assert.ok(timings.includes('WHEN_BATTLES'));
      assert.ok(timings.includes('PASSIVE'));
      assert.ok(timings.includes('ATTACK_STEP'));

      // Check BP_DEBUFF clause op
      const battlesAb = ir.abilities.find(a => a.header?.timing === 'WHEN_BATTLES');
      assert.ok(battlesAb.clauses.some(c => c.op?.op === 'BP_DEBUFF'));
    });

    it('BS33-069: Compiles cleanly with BURST, WHEN_DEPLOYED, and ATTACK_STEP timings', () => {
      const raw = getCard('BS33-069');
      assert.ok(raw, 'BS33-069 must exist');
      const ir = compileCard(raw);
      assert.ok(ir.abilities.length >= 3, 'Must have 3 abilities');

      const timings = ir.abilities.map(a => a.header?.timing);
      assert.ok(timings.includes('BURST'));
      assert.ok(timings.includes('WHEN_DEPLOYED'));
      assert.ok(timings.includes('ATTACK_STEP'));

      // Burst ability contains indestructible and deploy
      const burstAb = ir.abilities.find(a => a.header?.timing === 'BURST');
      assert.ok(burstAb.clauses.some(c => c.op?.op === 'INDESTRUCTIBLE'));
      assert.ok(burstAb.clauses.some(c => c.op?.op === 'DEPLOY_NEXUS'));
    });
  });

  describe('K1B5-03: Replacement & Prevention Engine Semantics', () => {
    it('REMAIN_ON_FIELD keeps spirit on field exhausted when destroyed', async () => {
      const game = createGame();
      const p = game.state.players.player;
      const heroCard = { id: 'hero_sp', card_number: 'HERO-01', name: 'Immortal Warrior', type: 'Spirit', cost: 5, bp: 5000 };
      const heroStack = {
        id: 'stack_hero',
        owner: 'player',
        top: heroCard,
        under: [],
        braves: [],
        cores: { normal: 2, soul: 0 },
        state: 'REFRESHED'
      };
      p.field.push(heroStack);

      // Register REMAIN_ON_FIELD replacement modifier
      game.state.modifiers.push({
        id: 'mod_remain_01',
        type: 'REPLACEMENT_EFFECT',
        replaces: 'DESTRUCTION',
        remainOnField: true,
        remainExhausted: true,
        targetStackId: 'stack_hero',
        side: 'player'
      });

      const eventsFired = [];
      const events = { emit: async (e) => eventsFired.push(e) };

      const moved = await moveCard(game.state, heroCard, 'grave', 'player', { cause: 'destroy' }, events);
      assert.equal(moved, false, 'moveCard must return false when card remains on field');
      assert.equal(p.field.some(st => st.id === 'stack_hero'), true, 'Stack must remain on field');
      assert.equal(heroStack.state, 'EXHAUSTED', 'Stack state must be updated to EXHAUSTED');
      assert.equal(heroStack.cores.normal, 2, 'Cores must remain on stack');
      assert.ok(eventsFired.some(e => e.type === 'REPLACEMENT_EFFECT_APPLIED' && e.replacedDestination === 'field'));
    });

    it('UNPREVENTABLE bypasses REMAIN_ON_FIELD replacement and destroys spirit', async () => {
      const game = createGame();
      const p = game.state.players.player;
      const heroCard = { id: 'hero_sp_2', card_number: 'HERO-02', name: 'Immortal Warrior 2', type: 'Spirit', cost: 5 };
      const heroStack = {
        id: 'stack_hero_2',
        owner: 'player',
        top: heroCard,
        under: [],
        braves: [],
        cores: { normal: 2, soul: 0 },
        state: 'REFRESHED'
      };
      p.field.push(heroStack);

      game.state.modifiers.push({
        id: 'mod_remain_02',
        type: 'REPLACEMENT_EFFECT',
        replaces: 'DESTRUCTION',
        remainOnField: true,
        targetStackId: 'stack_hero_2',
        side: 'player'
      });

      // Destruction with unpreventable: true
      const moved = await moveCard(game.state, heroCard, 'grave', 'player', { cause: 'destroy', unpreventable: true });
      assert.equal(moved, true, 'moveCard must succeed when unpreventable is true');
      assert.equal(p.field.some(st => st.id === 'stack_hero_2'), false, 'Stack must leave field');
      assert.equal(p.grave.some(c => c.id === 'hero_sp_2'), true, 'Card must enter grave');
    });

    it('LIFE_TO_RESERVE replacement redirects core from life to void', async () => {
      const game = createGame();
      const opp = game.state.players.opponent;
      opp.life = 5;

      // Register life-to-void replacement for opposing life
      game.state.modifiers.push({
        id: 'mod_life_to_void',
        type: 'REPLACEMENT_EFFECT',
        replaces: 'LIFE_TO_RESERVE',
        replacementZone: 'void',
        side: 'player',
        rawText: 'When opposing Life is reduced, it is sent to the Void instead of the Reserve.'
      });

      const initialReserve = opp.reserve.normal;
      const moved = await moveCore(
        game.state,
        1,
        { zone: 'life', side: 'opponent' },
        { zone: 'reserve', side: 'opponent' },
        { cause: 'battle', by: 'player' }
      );

      assert.equal(moved, true);
      assert.equal(opp.life, 4, 'Life must be decremented');
      assert.equal(opp.reserve.normal, initialReserve, 'Reserve must NOT increase because core went to void');
    });

    it('Anti-loop guard prevents cascading re-application of same replacement', async () => {
      const game = createGame();
      const opp = game.state.players.opponent;
      opp.life = 3;

      let callCount = 0;
      game.state.modifiers.push({
        id: 'mod_loop_test',
        type: 'REPLACEMENT_EFFECT',
        replaces: 'LIFE_TO_RESERVE',
        replacementZone: 'void',
        side: 'player',
        rawText: 'opposing life to void'
      });

      const initialReserve = opp.reserve.normal;
      // Call with _replacementApplied: true
      const moved = await moveCore(
        game.state,
        1,
        { zone: 'life', side: 'opponent' },
        { zone: 'reserve', side: 'opponent' },
        { cause: 'battle', by: 'player', _replacementApplied: true }
      );
      assert.equal(moved, true);
      assert.equal(opp.life, 2);
      assert.equal(opp.reserve.normal, initialReserve + 1, 'Core went to reserve as normal because replacement was already marked applied');
    });
  });

  describe('K1B5-04: Batch 1 Carry-Forward Contracts', () => {
    it('BS14-105: destination: DECK with decktop in rawText resolves to deck_top', () => {
      const clause = {
        rawText: 'Return an opposing Spirit to the decktop.',
        destination: 'DECK'
      };
      const dest = resolveBounceDestination({ destination: 'DECK' }, clause);
      assert.equal(dest, 'deck_top', 'Must resolve to deck_top when decktop is in rawText');
    });

    it('destination: DECK with bottom in rawText resolves to deck_bottom', () => {
      const clause = {
        rawText: 'Return an opposing Spirit to the bottom of the deck.',
        destination: 'DECK'
      };
      const dest = resolveBounceDestination({ destination: 'DECK' }, clause);
      assert.equal(dest, 'deck_bottom', 'Must resolve to deck_bottom when bottom is in rawText');
    });

    it('Bare destination: DECK without top/bottom evidence fails closed with null', () => {
      const clause = {
        rawText: 'Return an opposing Spirit to the deck.',
        destination: 'DECK'
      };
      const dest = resolveBounceDestination({ destination: 'DECK' }, clause);
      assert.equal(dest, null, 'Must fail closed to null for ambiguous bare DECK');
    });

    it('narrowEitherSideFromClause narrows target.side: either to opp when text is opposing', () => {
      const target = { side: 'either', types: ['Spirit'], count: 1 };
      const narrowed = narrowEitherSideFromClause(target, 'Destroy one opposing Spirit.');
      assert.equal(narrowed.side, 'opp', 'Must narrow to opp');
    });

    it('narrowEitherSideFromClause narrows target.side: either to self when text is friendly', () => {
      const target = { side: 'either', types: ['Spirit'], count: 1 };
      const narrowed = narrowEitherSideFromClause(target, 'Refresh one of your Spirits.');
      assert.equal(narrowed.side, 'self', 'Must narrow to self');
    });

    it('narrowEitherSideFromClause leaves side as either when text has both or neither', () => {
      const target = { side: 'either', types: ['Spirit'], count: 1 };
      const both = narrowEitherSideFromClause(target, 'Destroy one of your Spirits and one opposing Spirit.');
      assert.equal(both.side, 'either', 'Must stay either when both are present');

      const neither = narrowEitherSideFromClause(target, 'Destroy 1 Spirit.');
      assert.equal(neither.side, 'either', 'Must stay either when neither is present');
    });

    it('resolveTargets automatically narrows side: either using currentClause text', async () => {
      const game = createGame();
      const p = game.state.players.player;
      const opp = game.state.players.opponent;

      p.field.push({ id: 'st_p1', owner: 'player', top: { id: 'p_sp', name: 'My Spirit', type: 'Spirit' }, under: [], braves: [], cores: { normal: 1, soul: 0 } });
      opp.field.push({ id: 'st_opp1', owner: 'opponent', top: { id: 'opp_sp', name: 'Their Spirit', type: 'Spirit' }, under: [], braves: [], cores: { normal: 1, soul: 0 } });

      const promptResolver = { choose: async (p) => [p.candidates[0]] };
      const res = await resolveTargets(
        game.state,
        { side: 'either', types: ['Spirit'], count: 1 },
        { controller: 'player', currentClause: { rawText: 'Destroy 1 opposing Spirit.' } },
        promptResolver
      );

      assert.equal(res.status, 'SUCCESS');
      assert.equal(res.targets.length, 1);
      assert.equal(res.targets[0].card.id, 'opp_sp', 'Must only select opposing spirit');
    });
  });

});
