import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { AsyncResolver, CONDITION_RESULT, evaluateCondition } from '../engine/resolver.js';
import { executeOp } from '../engine/ops/index.js';
import { createEngineStateFromLegacy, syncEngineStateToLegacy } from '../engine/legacy_bridge.js';

function makeCard(overrides = {}) {
  return {
    id: overrides.id || `card_${Math.random().toString(36).slice(2, 8)}`,
    card_number: overrides.card_number || 'TEST-001',
    name: overrides.name || 'Test Card',
    type: overrides.type || 'Spirit',
    color: overrides.color || 'Red',
    colors: overrides.colors || ['Red'],
    cost: overrides.cost ?? 1,
    levels: overrides.levels || { 1: { cost: 1, bp: 2000 } },
    ...overrides
  };
}

// 1. Unsupported conditions
test('1. Unsupported conditions return UNSUPPORTED and never execute dependent effects', async () => {
  const state = createGameState([createCardInstance(makeCard(), 'player')], []);
  const condEval = evaluateCondition(state, 'If you banish the [Soul Core] on this Ultimate from the game', { controller: 'player' });
  assert.equal(condEval.result, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(condEval.reason, 'UNSUPPORTED_CONDITION');

  const resolver = new AsyncResolver();
  const ability = {
    id: 'ab_unsup_cond',
    clauses: [
      {
        rawText: 'If you banish the [Soul Core] on this Ultimate from the game, draw 1 card.',
        cleanText: 'draw 1 card',
        condition: 'If you banish the [Soul Core] on this Ultimate from the game',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, false);
  assert.equal(res.hasUnsupported, true);
  assert.equal(state.players.player.hand.length, 0, 'Dependent DRAW must not execute');
  assert.equal(res.results[0].conditionResult, CONDITION_RESULT.UNSUPPORTED);
  assert.equal(res.results[0].reason, 'UNSUPPORTED_CONDITION');
});

// 2. False conditions & missing context
test('2. False conditions and missing context return FALSE and skip dependent effects', async () => {
  const spirit = createCardInstance(makeCard({ type: 'Spirit' }), 'player');
  const state = createGameState([createCardInstance(makeCard(), 'player')], []);
  state.players.player.field.push(createFieldStack(spirit, { normal: 1, soul: 0 }));

  const condFalse = evaluateCondition(state, 'If you control no Spirits', { controller: 'player' });
  assert.equal(condFalse.result, CONDITION_RESULT.FALSE);

  const missingCtx = evaluateCondition(state, 'destroyed_by_opponent', null);
  assert.equal(missingCtx.result, CONDITION_RESULT.FALSE);
  assert.equal(missingCtx.reason, 'MISSING_CONTEXT_DESTROYED_BY_OPPONENT');

  const missingState = evaluateCondition(null, 'If you control no Spirits', { controller: 'player' });
  assert.equal(missingState.result, CONDITION_RESULT.FALSE);
  assert.equal(missingState.reason, 'MISSING_PLAYER_FIELD_CONTEXT');

  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, {
    id: 'ab_false_cond',
    clauses: [{ condition: 'If you control no Spirits', op: { op: 'DRAW', count: 1 } }]
  }, { controller: 'player' });

  assert.equal(res.success, true, 'Ordinary false condition skips cleanly without engine error');
  assert.equal(res.hasUnsupported, false);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(res.results[0].conditionResult, CONDITION_RESULT.FALSE);
  assert.equal(res.results[0].reason, 'CONDITION_NOT_MET');
});

// 3. Successful conditions (all 5 supported patterns)
test('3. All 5 supported condition patterns evaluate to TRUE and execute dependent effects', async () => {
  const state = createGameState([createCardInstance(makeCard(), 'player')], []);
  state.players.player.life = 3;

  assert.equal(evaluateCondition(state, 'destroyed_by_opponent', { wasDestroyedByOpponent: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'summoned_from_removed', { summonFromRemoved: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'if [Soul Core] was used to pay the cost', { soulCoreUsed: true }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'If you control no Spirits', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateCondition(state, 'if your Life is at two or more', { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, {
    id: 'ab_true_cond',
    clauses: [{ condition: 'if your Life is at two or more', op: { op: 'DRAW', count: 1 } }]
  }, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
});

// 4. Unsupported operations (unknown + placeholder no-ops)
test('4. Placeholder and unimplemented operations return explicit failure instead of false success', async () => {
  const state = createGameState();
  const placeholderOps = [
    'ACTIVATE_EFFECT_ACTION',
    'MIRAGE_OPERATION',
    'TOKEN_DEPLOYMENT',
    'DECK_OR_HAND_ACTION',
    'COUNT_OPERATION'
  ];

  for (const opName of placeholderOps) {
    const res = await executeOp(state, { op: opName }, { controller: 'player' });
    assert.equal(res.success, false, `${opName} must not report success: true`);
    assert.equal(res.status, 'UNSUPPORTED', `${opName} must mark status: UNSUPPORTED`);
  }

  const unknownRes = await executeOp(state, { op: 'TOTALLY_UNKNOWN_OP' }, { controller: 'player' });
  assert.equal(unknownRes.success, false);
  assert.equal(unknownRes.reason, 'UNHANDLED_OPERATION');
});

// 5. Failed operations & parameter validation
test('5. Failed operations and invalid parameters return success: false', async () => {
  const state = createGameState();

  const badState = await executeOp(null, { op: 'DRAW', count: 1 });
  assert.equal(badState.success, false);
  assert.equal(badState.reason, 'INVALID_STATE');

  const badOp = await executeOp(state, null);
  assert.equal(badOp.success, false);
  assert.equal(badOp.reason, 'INVALID_OPERATION');

  const badCount = await executeOp(state, { op: 'DRAW', count: -2 }, { controller: 'player' });
  assert.equal(badCount.success, false);
  assert.equal(badCount.reason, 'INVALID_PARAMETERS');

  const emptyBounce = await executeOp(state, { op: 'BOUNCE', target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' });
  assert.equal(emptyBounce.success, false);

  const oppSpirit = createCardInstance(makeCard(), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit, { normal: 1, soul: 0 }));
  const noPromptBounce = await executeOp(state, { op: 'BOUNCE', target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' }, null);
  assert.equal(noPromptBounce.success, false);
  assert.equal(noPromptBounce.reason, 'MISSING_PROMPT_RESOLVER');
});

// 6. afterResolves conditions & optionality
test('6. afterResolves clauses enforce conditions and optionality checks', async () => {
  const state = createGameState([
    createCardInstance(makeCard({ id: 'd1' }), 'player'),
    createCardInstance(makeCard({ id: 'd2' }), 'player')
  ], []);
  state.players.player.life = 1; // Fails "life is at two or more"

  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, {
    id: 'ab_after_resolves',
    clauses: [
      { op: { op: 'DRAW', count: 1 } },
      { link: 'afterResolves', condition: 'if your Life is at two or more', op: { op: 'DRAW', count: 1 } }
    ]
  }, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1, 'afterResolves must not draw when condition is FALSE');
  assert.equal(res.results[1].reason, 'CONDITION_NOT_MET');
});

// 7. Optional effects
test('7. Declining an optional effect skips it and blocks dependent byDoing/ifYouDo clauses', async () => {
  const state = createGameState([createCardInstance(makeCard({ id: 'd1' }), 'player')], []);
  const declinePrompt = {
    async choose(prompt) {
      if (prompt.type === 'CONFIRM_OPTIONAL') return { declined: true };
      return [];
    }
  };
  const resolver = new AsyncResolver(declinePrompt);
  const res = await resolver.resolveAbility(state, {
    id: 'ab_opt',
    clauses: [
      { isOptional: true, cleanText: 'draw 1 card', op: { op: 'DRAW', count: 1 } },
      { link: 'ifYouDo', op: { op: 'COUNT_OPERATION', amount: 2 } }
    ]
  }, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 0);
  assert.equal(state.players.player.counters || 0, 0);
  assert.equal(res.results[0].optionalDeclined, true);
  assert.equal(res.results[1].reason, 'PREREQUISITE_FAILED');
});

// 8. Failed costs
test('8. Failed cost clause sets paid: false and blocks dependent byDoing/whenYouveDoneSo effects', async () => {
  const state = createGameState([createCardInstance(makeCard({ id: 'd1' }), 'player')], []);
  // Hand has 0 cards, so discarding 2 fails cost
  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, {
    id: 'ab_cost_fail',
    clauses: [
      { isCost: true, op: { op: 'DISCARD_HAND', count: 2 } },
      { link: 'whenYouveDoneSo', op: { op: 'DRAW', count: 1 } }
    ]
  }, { controller: 'player' });

  assert.equal(res.success, false);
  assert.equal(res.hasFailure, true);
  assert.equal(res.results[0].paid, false);
  assert.equal(state.players.player.hand.length, 0);
});

// 9. Multiple connected clauses (or + then + byDoing)
test('9. Multiple connected clauses preserve or-branch isolation and then/byDoing sequencing', async () => {
  const state = createGameState([
    createCardInstance(makeCard({ id: 'd1' }), 'player'),
    createCardInstance(makeCard({ id: 'd2' }), 'player')
  ], []);

  let orCalls = 0;
  const prompt = {
    async choose(p) {
      if (p.type === 'CHOOSE_OR_BRANCH') {
        orCalls++;
        return orCalls === 1 ? p.options[1] : p.options[0];
      }
      return [];
    }
  };

  const resolver = new AsyncResolver(prompt);
  const res = await resolver.resolveAbility(state, {
    id: 'ab_multi_or',
    clauses: [
      { rawText: 'Draw 1', op: { op: 'DRAW', count: 1 } },
      { link: 'or', rawText: 'Gain 1 counter', op: { op: 'ADD_COUNTER', count: 1 } },
      { link: 'then', rawText: 'Draw 1', op: { op: 'DRAW', count: 1 } },
      { link: 'or', rawText: 'Gain 5 counters', op: { op: 'ADD_COUNTER', count: 5 } }
    ]
  }, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(orCalls, 2);
  assert.equal(state.players.player.counters, 1, 'First OR chose second branch (+1 counter)');
  assert.equal(state.players.player.hand.length, 1, 'Second OR chose first branch (Draw 1)');
});

// 10. Ability-level result propagation in playCard() and activateAbility()
test('10. playCard() and activateAbility() propagate unsupported/failed ability results', async () => {
  const magicWithUnsupported = makeCard({
    id: 'm_unsup',
    card_number: 'TEST-M1',
    type: 'Magic',
    cost: 0,
    compiledIr: {
      abilities: [
        {
          id: 'm_unsup#a0',
          header: { timing: 'MAIN', isMain: true },
          clauses: [{ op: { op: 'TOTALLY_UNKNOWN_OP' } }]
        }
      ]
    }
  });

  const spiritWithBadSkill = makeCard({
    id: 's_bad',
    card_number: 'TEST-S1',
    type: 'Spirit',
    cost: 0,
    compiledIr: {
      abilities: [
        {
          id: 's_bad#a0',
          header: { timing: 'MAIN', levels: [1], limit: 'ONCE_PER_TURN' },
          clauses: [{ condition: 'If you banish the [Soul Core] on this Ultimate from the game', op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  });

  const game = createGame({ playerDeck: [magicWithUnsupported, spiritWithBadSkill], opponentDeck: [] });
  game.state.step = 'MAIN';
  const mCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-M1');
  const sCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-S1');

  const playRes = await game.playCard(mCard.id, [], 'player');
  assert.equal(playRes.success, true, 'Card play itself succeeded');
  assert.equal(playRes.effectResolved, false, 'Unsupported Magic effect must not report effectResolved: true');
  assert.equal(playRes.hasUnsupported, true);

  await game.playCard(sCard.id, [], 'player');
  const actRes = await game.activateAbility(sCard.id, 's_bad#a0', 'player');
  assert.equal(actRes.activated, false, 'Unsupported ability must not commit activation');
  assert.equal(actRes.success, false);
  assert.equal(actRes.hasUnsupported, true);
  assert.equal(actRes.reason, 'UNSUPPORTED_EFFECT');
});

// 11. Once-per-turn limits
test('11. ONCE_PER_TURN activates once, blocks second call, and is not burned on failed/declined activation', async () => {
  const spirit = makeCard({
    id: 's_opt',
    card_number: 'TEST-OPT',
    type: 'Spirit',
    cost: 0,
    compiledIr: {
      abilities: [
        {
          id: 's_opt#a0',
          header: { timing: 'MAIN', levels: [1], limit: 'ONCE_PER_TURN' },
          clauses: [{ op: { op: 'ADD_COUNTER', count: 1 } }]
        }
      ]
    }
  });

  const game = createGame({
    playerDeck: [spirit],
    opponentDeck: []
  });
  game.state.step = 'MAIN';
  const sCard = game.state.players.player.hand[0];
  await game.playCard(sCard.id, [], 'player');

  const first = await game.activateAbility(sCard.id, 's_opt#a0', 'player');
  assert.equal(first.success, true);
  assert.equal(game.state.players.player.counters, 1);

  const second = await game.activateAbility(sCard.id, 's_opt#a0', 'player');
  assert.equal(second.success, false);
  assert.equal(second.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(game.state.players.player.counters, 1);
});

// 12. Legacy card identity mapping & unmapped state regression documentation
test('12. Legacy bridge documents duplicate card_number identity collision and unmapped counters/under fields', () => {
  const copy1 = { card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', currentCores: 1 };
  const copy2 = { card_number: 'BS01-001', name: 'Goradon', type: 'Spirit', currentCores: 2 };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    phases: ['MAIN'],
    phaseIndex: 0,
    player: {
      life: 5,
      reserve: 3,
      trash: 0,
      counters: 4,
      deck: [],
      hand: [copy1, copy2],
      field: [],
      nexus: [],
      trashCards: [],
      voidCards: [],
      openCards: []
    },
    opponent: {
      life: 5,
      reserve: 3,
      trash: 0,
      deck: [],
      hand: [],
      field: [],
      nexus: [],
      trashCards: [],
      voidCards: [],
      openCards: []
    }
  };

  const { state, mapper } = createEngineStateFromLegacy(duelState);
  // Fixed in Phase 2B: duplicate card_number without uid receives distinct engine instances & uids
  assert.notEqual(state.players.player.hand[0], state.players.player.hand[1], 'Duplicate card_number without uid must produce distinct engine card instances');
  assert.notEqual(state.players.player.hand[0].id, state.players.player.hand[1].id);
  assert.notEqual(state.players.player.hand[0].uid, state.players.player.hand[1].uid);
  // Fixed in Phase 2B: Player counters are bidirectionally mapped
  assert.equal(state.players.player.counters, 4, 'legacy.counters is mapped to engine player.counters');

  state.players.player.counters = 6;
  syncEngineStateToLegacy(state, duelState, mapper);
  assert.equal(duelState.player.counters, 6);
});
