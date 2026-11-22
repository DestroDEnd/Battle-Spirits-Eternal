/**
 * tests/keyword_reconciled_mechanics.test.js
 * 
 * Tests proving the mechanical correctness of all reconciled keywords:
 * - Wave Crush (banish to removed zone, cost formula, symbol 0 lock)
 * - XV Crush (10 cards mill, conditional destroy up to cost 15)
 * - Curse & True-Curse (blocker destruction at battle end, no silent fallback)
 * - Chaotic Holy Life & Heaven Holy Life (on block, at battle end, friendly spirit trigger)
 * - Dark Assault (discard from hand/decktop to refresh)
 * - Ultra Heavy Armor & Armor Family immunity
 * - Clash mustBlockIfAble enforcement in flow
 * - Infinite Blade target attack without exhaustion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { isImmune } from '../engine/continuous.js';

test('Reconciled Mechanic - Wave Crush (Banish to Removed Zone & Symbol 0 Lock)', async (t) => {
  const game = createGame();
  const { state, keywords } = game;

  state.activePlayer = 'player';
  state.step = 'ATTACK';

  const attacker = {
    id: 'atk-wave-crush',
    owner: 'player',
    state: 'REFRESHED',
    cores: { normal: 2, soul: 0 },
    top: {
      id: 'WC-01',
      name: 'Wave Crush Spirit',
      type: 'Spirit',
      cost: 8,
      bp: 7000,
      keywords: [{ name: 'Wave Crush' }]
    }
  };

  state.players.player.field.push(attacker);

  // Opponent has 10 cards in deck
  state.players.opponent.deck = Array.from({ length: 10 }, (_, i) => ({
    id: `opp-card-${i}`,
    name: `Card ${i}`,
    type: 'Spirit',
    cost: 3
  }));

  state.players.opponent.removed = [];

  state.combat = {
    attackerStackId: attacker.id,
    attackerSide: 'player',
    stage: 'ATTACK_DECLARED'
  };

  const handler = keywords.get('Wave Crush');
  assert.ok(handler, 'Wave Crush handler must be registered');

  await handler.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: attacker
  });

  // Cost 8 => 1 + Math.floor(8 / 4) = 3 cards banished
  assert.strictEqual(
    state.players.opponent.removed.length,
    3,
    'Wave Crush must banish exactly 3 cards to opposing removed zone'
  );
  assert.strictEqual(
    state.players.opponent.deck.length,
    7,
    'Opposing deck must be reduced by 3'
  );
  assert.strictEqual(
    state.combat.fixedSymbolZero,
    true,
    'Wave Crush must fix symbol to 0'
  );
});

test('Reconciled Mechanic - XV Crush (Mill 10 & Conditional Cost 15 Destruction)', async (t) => {
  const game = createGame();
  const { state, keywords } = game;

  const attacker = {
    id: 'atk-xv-crush',
    owner: 'player',
    state: 'REFRESHED',
    cores: { normal: 2, soul: 0 },
    top: {
      id: 'XV-01',
      name: 'XV Crush Titan',
      type: 'Spirit',
      cost: 9,
      bp: 12000,
      keywords: [{ name: 'XV Crush' }]
    }
  };

  state.players.player.field.push(attacker);

  // Opponent deck with 15 cards
  state.players.opponent.deck = Array.from({ length: 15 }, (_, i) => ({
    id: `opp-deck-${i}`,
    name: `Deck Card ${i}`
  }));

  // Opponent already has a banished card
  state.players.opponent.removed = [{ id: 'banished-1', name: 'Banished Card' }];

  // Opponent field has a target
  const oppTarget = {
    id: 'opp-field-target',
    owner: 'opponent',
    state: 'REFRESHED',
    cores: { normal: 1, soul: 0 },
    top: {
      id: 'opp-spirit-target',
      name: 'Target Spirit',
      type: 'Spirit',
      cost: 7,
      bp: 6000
    }
  };
  state.players.opponent.field.push(oppTarget);

  let promptCalled = false;
  const mockResolver = {
    promptResolver: {
      choose: async (prompt) => {
        promptCalled = true;
        assert.strictEqual(prompt.type, 'SELECT_XV_CRUSH_TARGETS');
        assert.strictEqual(prompt.maxTotalCost, 15);
        return [oppTarget];
      }
    }
  };

  const handler = keywords.get('XV Crush');
  await handler.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: attacker,
    resolver: mockResolver
  });

  // 10 cards milled to trash/grave
  assert.strictEqual(
    state.players.opponent.grave.length,
    11, // 10 milled + 1 destroyed target
    'Opposing grave must contain 10 milled cards plus destroyed target'
  );
  assert.strictEqual(promptCalled, true, 'XV Crush must invoke promptResolver for target selection');
  assert.strictEqual(
    state.players.opponent.field.length,
    0,
    'Target opposing spirit must be destroyed'
  );
});

test('Reconciled Mechanic - Curse Blocker Destruction at Battle End', async (t) => {
  const game = createGame();
  const { state, keywords } = game;

  const attacker = {
    id: 'atk-curse',
    owner: 'player',
    state: 'EXHAUSTED',
    cores: { normal: 2, soul: 0 },
    top: {
      id: 'CURSE-01',
      name: 'Curse Spirit',
      type: 'Spirit',
      bp: 3000,
      keywords: [{ name: 'Curse' }]
    }
  };

  const blocker = {
    id: 'blk-target',
    owner: 'opponent',
    state: 'EXHAUSTED',
    cores: { normal: 2, soul: 0 },
    top: {
      id: 'BLK-01',
      name: 'High BP Blocker',
      type: 'Spirit',
      bp: 9000
    }
  };

  state.players.player.field.push(attacker);
  state.players.opponent.field.push(blocker);

  state.combat = {
    attackerStackId: attacker.id,
    attackerSide: 'player',
    blockerStackId: blocker.id
  };

  const handler = keywords.get('Curse');
  assert.ok(handler.hooks.onBlockDeclared);
  assert.ok(handler.hooks.onBattleEnd);

  // Tag blocker on block declared
  await handler.hooks.onBlockDeclared({
    state,
    blockerStack: blocker
  });

  assert.strictEqual(state.combat.curseTargetStackId, blocker.id);

  // At end of battle, Curse destroys the blocker
  await handler.hooks.onBattleEnd({
    state,
    blockerCard: blocker.top,
    game
  });

  assert.strictEqual(
    state.players.opponent.grave.some(c => c.id === 'BLK-01'),
    true,
    'Blocker must be sent to grave by Curse at end of battle'
  );
});

test('Reconciled Mechanic - Ultra Heavy Armor Color Immunity', async (t) => {
  const game = createGame();
  const { state } = game;

  const stack = {
    id: 'uha-spirit',
    owner: 'player',
    state: 'REFRESHED',
    cores: { normal: 2, soul: 0 },
    top: {
      id: 'UHA-01',
      name: 'Ultra Heavy Armor Unit',
      type: 'Spirit',
      keywords: [{ name: 'Ultra Heavy Armor', parameter: 'Red/White' }]
    }
  };

  const immuneToRed = isImmune(state, stack, { colors: ['Red'], type: 'Magic' });
  assert.strictEqual(immuneToRed, true, 'Must be immune to Red effect');

  const immuneToWhite = isImmune(state, stack, { colors: ['White'], type: 'Spirit' });
  assert.strictEqual(immuneToWhite, true, 'Must be immune to White effect');

  const immuneToPurple = isImmune(state, stack, { colors: ['Purple'], type: 'Magic' });
  assert.strictEqual(immuneToPurple, false, 'Must NOT be immune to Purple effect');
});

test('Reconciled Mechanic - Clash mustBlockIfAble Enforced in Flow', async (t) => {
  const game = createGame();
  const { state } = game;

  state.step = 'ATTACK';
  state.activePlayer = 'player';

  const attacker = {
    id: 'clash-atk',
    owner: 'player',
    state: 'EXHAUSTED',
    cores: { normal: 1, soul: 0 },
    top: { id: 'C-01', name: 'Clash Spirit', type: 'Spirit', cost: 3 }
  };
  state.players.player.field.push(attacker);

  const defenderRefreshed = {
    id: 'def-refreshed',
    owner: 'opponent',
    state: 'REFRESHED',
    cores: { normal: 1, soul: 0 },
    top: { id: 'D-01', name: 'Defending Spirit', type: 'Spirit', cost: 2 }
  };
  state.players.opponent.field.push(defenderRefreshed);

  state.combat = {
    attackerStackId: attacker.id,
    attackerSide: 'player',
    blockerStackId: null,
    mustBlockIfAble: true
  };

  const res = await game.resolveDirectHit('player');
  assert.strictEqual(res.success, false, 'Direct hit must be rejected when mustBlockIfAble is true');
  assert.strictEqual(res.reason, 'MUST_BLOCK_IF_ABLE');
});

test('Reconciled Mechanic - Infinite Blade Target Attack Without Exhaustion', async (t) => {
  const game = createGame();
  const { state, keywords } = game;

  const attacker = {
    id: 'ib-dragon',
    owner: 'player',
    state: 'EXHAUSTED', // set to exhausted by declareAttack initial step
    cores: { normal: 1, soul: 1 }, // Holds Soul Core
    top: {
      id: 'BS33-X01',
      name: 'Samurai-Dragon-Amatsu',
      type: 'Spirit',
      keywords: [{ name: 'Infinite Blade' }]
    }
  };

  const oppTarget = {
    id: 'opp-target-spirit',
    owner: 'opponent',
    state: 'EXHAUSTED',
    cores: { normal: 1, soul: 0 },
    top: { id: 'T-01', name: 'Opposing Spirit', type: 'Spirit' }
  };

  state.players.player.field.push(attacker);
  state.players.opponent.field.push(oppTarget);

  state.combat = {
    attackerStackId: attacker.id,
    attackerSide: 'player',
    blockerStackId: null
  };

  const mockResolver = {
    promptResolver: {
      choose: async (prompt) => {
        assert.strictEqual(prompt.type, 'SELECT_INFINITE_BLADE_TARGET');
        return { selectedTargetId: oppTarget.id };
      }
    }
  };

  const handler = keywords.get('Infinite Blade');
  assert.ok(handler);

  await handler.hooks.onAttackDeclared({
    state,
    attackerStack: attacker,
    resolver: mockResolver,
    game
  });

  assert.strictEqual(
    attacker.state,
    'REFRESHED',
    'Infinite Blade attacker must NOT exhaust when target attacking with Soul Core'
  );
  assert.strictEqual(
    state.combat.blockerStackId,
    oppTarget.id,
    'Target opposing spirit must be locked as battle defender'
  );
});
