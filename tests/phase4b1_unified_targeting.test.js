/**
 * tests/phase4b1_unified_targeting.test.js
 *
 * Automated regression test suite for Phase 4B.1: Unified Targeting Pipeline.
 * Tests all 22 required targeting specifications:
 * 1. Single-target interactive selection
 * 2. Multiple-target selection
 * 3. Choose-up-to-N
 * 4. Mandatory selection
 * 5. Optional selection
 * 6. No legal targets
 * 7. Invalid target selection
 * 8. Opponent versus player controller restrictions
 * 9. Field targeting
 * 10. Trash targeting
 * 11. Hand targeting without revealing hidden opponent information
 * 12. Revealed-zone targeting
 * 13. Removed-zone targeting
 * 14. Stable card identity
 * 15. Previous-target context
 * 16. Previous-targets context
 * 17. TARGET followed by DESTROY
 * 18. TARGET followed by BOUNCE
 * 19. TARGET followed by ADD_TO_HAND
 * 20. Target invalidation between connected clauses
 * 21. Multiple targeting operations in one effect
 * 22. Existing high-level DESTROY and BOUNCE prompts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  queryCandidates,
  validateSelection,
  validateTargetAvailability,
  executeTargeting
} from '../engine/selectors.js';

import {
  AsyncResolver
} from '../engine/resolver.js';

import {
  createGameState,
  createCardInstance,
  createFieldStack
} from '../engine/state.js';

import {
  executeOp
} from '../engine/ops/index.js';

import {
  moveCard
} from '../engine/zones.js';

function makeCard(overrides = {}) {
  return {
    id: `card_${Math.random().toString(36).substr(2, 6)}`,
    card_number: 'TEST-001',
    name: 'Test Combatant',
    type: 'Spirit',
    family: 'Dragon',
    cost: 3,
    colors: ['Red'],
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 3000 } },
    ...overrides
  };
}

class MockPromptResolver {
  constructor(handler) {
    this.handler = handler;
    this.prompts = [];
  }
  async choose(prompt) {
    this.prompts.push(prompt);
    if (this.handler) return await this.handler(prompt);
    return prompt.candidates?.slice(0, prompt.count || 1) || [];
  }
}

// ============================================================================
// 1. Single-target interactive selection
// ============================================================================
test('1. Single-target interactive selection: prompts chooser and returns exact chosen card', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'Alpha' }), 'opponent');
  const spiritB = createCardInstance(makeCard({ name: 'Beta' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA), createFieldStack(spiritB));

  const resolver = new MockPromptResolver(async (prompt) => {
    assert.equal(prompt.type, 'SELECT_TARGET');
    assert.equal(prompt.candidates.length, 2);
    // Explicitly choose second candidate 'Beta'
    return [prompt.candidates[1]];
  });

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, resolver);

  assert.equal(res.success, true);
  assert.equal(res.count, 1);
  assert.equal(res.cards[0].name, 'Beta');
  assert.equal(context.previousTarget.name, 'Beta');
  assert.equal(context.selectedTargets[0].card.name, 'Beta');
});

// ============================================================================
// 2. Multiple-target selection
// ============================================================================
test('2. Multiple-target selection: allows choosing multiple targets up to count', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'One' }), 'opponent');
  const s2 = createCardInstance(makeCard({ name: 'Two' }), 'opponent');
  const s3 = createCardInstance(makeCard({ name: 'Three' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1), createFieldStack(s2), createFieldStack(s3));

  const resolver = new MockPromptResolver(async (prompt) => {
    assert.equal(prompt.count, 2);
    // Return One and Three
    return [prompt.candidates[0], prompt.candidates[2]];
  });

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 2 }, context, resolver);

  assert.equal(res.success, true);
  assert.equal(res.count, 2);
  assert.equal(res.cards[0].name, 'One');
  assert.equal(res.cards[1].name, 'Three');
  assert.equal(context.previousTargets.length, 2);
  assert.equal(context.selectedTargets.length, 2);
});

// ============================================================================
// 3. Choose-up-to-N
// ============================================================================
test('3. Choose-up-to-N: allows choosing fewer than maximum count when upTo: true', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'One' }), 'opponent');
  const s2 = createCardInstance(makeCard({ name: 'Two' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1), createFieldStack(s2));

  // Count is 2, but player only chooses 1
  const resolver = new MockPromptResolver(async (prompt) => {
    assert.equal(prompt.upTo, true);
    return [prompt.candidates[0]];
  });

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 2, upTo: true }, context, resolver);

  assert.equal(res.success, true);
  assert.equal(res.count, 1);
  assert.equal(res.cards[0].name, 'One');
});

// ============================================================================
// 4. Mandatory selection
// ============================================================================
test('4. Mandatory selection: rejects declining or choosing fewer than required', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'One' }), 'opponent');
  const s2 = createCardInstance(makeCard({ name: 'Two' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1), createFieldStack(s2));

  // Mandatory selection of 2, but player returns only 1
  const resolver = new MockPromptResolver(async () => []);

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 2, optional: false, upTo: false }, context, resolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'MANDATORY_TARGET_DECLINED');
});

// ============================================================================
// 5. Optional selection
// ============================================================================
test('5. Optional selection: cleanly succeeds with 0 targets when declined', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'One' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1));

  const resolver = new MockPromptResolver(async () => []); // Declines

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1, optional: true }, context, resolver);

  assert.equal(res.success, true);
  assert.equal(res.declined, true);
  assert.equal(res.count, 0);
  assert.equal(context.selectedTargets.length, 0);
});

// ============================================================================
// 6. No legal targets
// ============================================================================
test('6. No legal targets: returns structured failure without crashing', async () => {
  const state = createGameState([], []); // Field empty

  const resolver = new MockPromptResolver(async () => {
    throw new Error('Should not prompt when no candidates');
  });

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, resolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_LEGAL_TARGETS');
  assert.equal(res.candidates.length, 0);
});

// ============================================================================
// 7. Invalid target selection
// ============================================================================
test('7. Invalid target selection: catches illegal card not in candidates', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'One' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1));

  const alienCard = createCardInstance(makeCard({ name: 'Alien' }), 'opponent');

  const resolver = new MockPromptResolver(async () => [alienCard]); // Return card not on field

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, resolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_TARGET_SELECTION');
});

// ============================================================================
// 8. Opponent versus player controller restrictions
// ============================================================================
test('8. Opponent versus player controller restrictions: strictly isolates player sides', () => {
  const state = createGameState([], []);
  const playerSpirit = createCardInstance(makeCard({ name: 'Mine' }), 'player');
  const oppSpirit = createCardInstance(makeCard({ name: 'Theirs' }), 'opponent');

  state.players.player.field.push(createFieldStack(playerSpirit));
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const oppCands = queryCandidates(state, { side: 'opp' }, { controller: 'player' });
  assert.equal(oppCands.length, 1);
  assert.equal(oppCands[0].card.name, 'Theirs');

  const selfCands = queryCandidates(state, { side: 'self' }, { controller: 'player' });
  assert.equal(selfCands.length, 1);
  assert.equal(selfCands[0].card.name, 'Mine');

  const bothCands = queryCandidates(state, { side: 'both' }, { controller: 'player' });
  assert.equal(bothCands.length, 2);
});

// ============================================================================
// 9. Field targeting
// ============================================================================
test('9. Field targeting: targets field stacks and attached braves', () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ type: 'Spirit' }), 'opponent');
  const brave = createCardInstance(makeCard({ type: 'Brave' }), 'opponent');
  const stack = createFieldStack(spirit, { normal: 1, soul: 0 }, [brave]);
  state.players.opponent.field.push(stack);

  // Query Spirit
  const spiritCands = queryCandidates(state, { zone: 'field', types: ['Spirit'] }, { controller: 'player' });
  assert.equal(spiritCands.length, 1);
  assert.equal(spiritCands[0].type, 'stack');

  // Query Brave
  const braveCands = queryCandidates(state, { zone: 'field', types: ['Brave'] }, { controller: 'player' });
  assert.equal(braveCands.length, 1);
  assert.equal(braveCands[0].type, 'brave');
});

// ============================================================================
// 10. Trash targeting
// ============================================================================
test('10. Trash targeting: queries cards in graveyard with type/cost filters', () => {
  const state = createGameState([], []);
  const magic = createCardInstance(makeCard({ type: 'Magic', cost: 4 }), 'player');
  const spirit = createCardInstance(makeCard({ type: 'Spirit', cost: 2 }), 'player');
  state.players.player.grave.push(magic, spirit);

  const cands = queryCandidates(state, { zone: 'trash', side: 'self', types: ['Magic'] }, { controller: 'player' });
  assert.equal(cands.length, 1);
  assert.equal(cands[0].card.type, 'Magic');
  assert.equal(cands[0].zone, 'grave');
});

// ============================================================================
// 11. Hand targeting without revealing hidden opponent information
// ============================================================================
test('11. Hand targeting: disallows generic opponent hand enumeration', () => {
  const state = createGameState([], []);
  state.players.opponent.hand.push(createCardInstance(makeCard(), 'opponent'));
  state.players.player.hand.push(createCardInstance(makeCard(), 'player'));

  // Player targeting own hand
  const selfHand = queryCandidates(state, { zone: 'hand', side: 'self' }, { controller: 'player' });
  assert.equal(selfHand.length, 1);

  // Player targeting opponent hand without explicit authorization -> blocked
  const oppHandBlocked = queryCandidates(state, { zone: 'hand', side: 'opp' }, { controller: 'player' });
  assert.equal(oppHandBlocked.length, 0, 'Generic selector must not expose hidden opponent hand');

  // Explicit authorized discard
  const oppHandAuth = queryCandidates(state, { zone: 'hand', side: 'opp', allowOpponentHand: true }, { controller: 'player' });
  assert.equal(oppHandAuth.length, 1);
});

// ============================================================================
// 12. Revealed-zone targeting
// ============================================================================
test('12. Revealed-zone targeting: queries cards currently in revealed pool', () => {
  const state = createGameState([], []);
  const rev1 = createCardInstance(makeCard({ family: 'Astral' }), 'player');
  const rev2 = createCardInstance(makeCard({ family: 'Beast' }), 'player');
  state.players.player.revealed = [rev1, rev2];

  const cands = queryCandidates(state, { zone: 'revealed', side: 'self', filter: { family: 'Astral' } }, { controller: 'player' });
  assert.equal(cands.length, 1);
  assert.equal(cands[0].card.family, 'Astral');
  assert.equal(cands[0].zone, 'revealed');
});

// ============================================================================
// 13. Removed-zone targeting
// ============================================================================
test('13. Removed-zone targeting: queries cards in removed / open zone', () => {
  const state = createGameState([], []);
  const remCard = createCardInstance(makeCard({ name: 'Removed One' }), 'player');
  state.players.player.removed.push(remCard);

  const cands = queryCandidates(state, { zone: 'removed', side: 'self' }, { controller: 'player' });
  assert.equal(cands.length, 1);
  assert.equal(cands[0].card.name, 'Removed One');
  assert.equal(cands[0].zone, 'removed');
});

// ============================================================================
// 14. Stable card identity
// ============================================================================
test('14. Stable card identity: two identical card copies remain distinct by ID', async () => {
  const state = createGameState([], []);
  const copy1 = createCardInstance(makeCard({ card_number: 'SD01-001', name: 'Rex' }), 'opponent');
  const copy2 = createCardInstance(makeCard({ card_number: 'SD01-001', name: 'Rex' }), 'opponent');
  assert.notEqual(copy1.id, copy2.id);

  state.players.opponent.field.push(createFieldStack(copy1), createFieldStack(copy2));

  // Choose specifically copy2
  const resolver = new MockPromptResolver(async (prompt) => [prompt.candidates[1]]);

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, resolver);

  assert.equal(res.cards[0].id, copy2.id);
  assert.equal(context.previousTarget.id, copy2.id);
});

// ============================================================================
// 15. Previous-target context
// ============================================================================
test('15. Previous-target context: TARGET establishes previousTarget for subsequent clause', async () => {
  const state = createGameState([], []);
  const targetSpirit = createCardInstance(makeCard({ name: 'Target' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(targetSpirit));

  const resolver = new MockPromptResolver(async (prompt) => [prompt.candidates[0]]);

  const context = { controller: 'player' };
  await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, resolver);

  assert.equal(context.previousTarget.id, targetSpirit.id);

  // Subsequent TARGET with target: 'PREVIOUS_TARGET' reuses the validated target
  const res2 = await executeTargeting(state, { op: 'TARGET', target: 'PREVIOUS_TARGET' }, context, resolver);
  assert.equal(res2.success, true);
  assert.equal(res2.cards[0].id, targetSpirit.id);
});

// ============================================================================
// 16. Previous-targets context
// ============================================================================
test('16. Previous-targets context: multiple targets are preserved in previousTargets', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard(), 'opponent');
  const s2 = createCardInstance(makeCard(), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1), createFieldStack(s2));

  const resolver = new MockPromptResolver(async (p) => p.candidates);

  const context = { controller: 'player' };
  await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 2 }, context, resolver);

  assert.equal(context.previousTargets.length, 2);
  assert.equal(context.selectedTargets.length, 2);
});

// ============================================================================
// 17. TARGET followed by DESTROY
// ============================================================================
test('17. End-to-End: TARGET followed by DESTROY destroys exact chosen card', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'Alpha' }), 'opponent');
  const spiritB = createCardInstance(makeCard({ name: 'Beta' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA), createFieldStack(spiritB));

  const promptResolver = new MockPromptResolver(async (prompt) => {
    // Choose Beta to target
    return [prompt.candidates[1]];
  });

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_target_destroy',
    clauses: [
      {
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);

  // Alpha remains on field; Beta was destroyed and moved to grave
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.name, 'Alpha');
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].name, 'Beta');
});

// ============================================================================
// 18. TARGET followed by BOUNCE
// ============================================================================
test('18. End-to-End: TARGET followed by BOUNCE returns exact chosen card to hand', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'Bouncy' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spirit));

  const promptResolver = new MockPromptResolver(async (prompt) => [prompt.candidates[0]]);

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_target_bounce',
    clauses: [
      {
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'BOUNCE', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.hand.length, 1);
  assert.equal(state.players.opponent.hand[0].name, 'Bouncy');
});

// ============================================================================
// 19. TARGET followed by ADD_TO_HAND
// ============================================================================
test('19. End-to-End: TARGET followed by ADD_TO_HAND retrieves exact card from trash', async () => {
  const state = createGameState([], []);
  const cardInGrave = createCardInstance(makeCard({ name: 'Graveyard Dragon' }), 'player');
  state.players.player.grave.push(cardInGrave);

  const promptResolver = new MockPromptResolver(async (prompt) => [prompt.candidates[0]]);

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_target_salvage',
    clauses: [
      {
        op: { op: 'TARGET', zone: 'trash', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.grave.length, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].name, 'Graveyard Dragon');
});

// ============================================================================
// 20. Target invalidation between connected clauses
// ============================================================================
test('20. Target invalidation: prevents operating on target removed before second clause', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'Frail Spirit' }), 'opponent');
  const stack = createFieldStack(spirit);
  state.players.opponent.field.push(stack);

  const context = { controller: 'player' };
  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);

  // Clause 1 targets the spirit
  await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, promptResolver);
  assert.equal(context.previousTarget.name, 'Frail Spirit');

  // Intervening effect destroys it beforehand (moved to grave)
  state.players.opponent.field = [];
  state.players.opponent.grave.push(spirit);

  // Clause 2 tries to DESTROY the previous target
  assert.equal(validateTargetAvailability(state, context.previousTarget, 'field'), false);

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_inv_destroy',
    clauses: [
      {
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, context);
  // Fails cleanly due to target unavailability without throwing an exception
  assert.equal(res.success, false);
});

// ============================================================================
// 21. Multiple targeting operations in one effect
// ============================================================================
test('21. Multiple targeting operations in one effect: tracks distinct selections', async () => {
  const state = createGameState([], []);
  const mySpirit = createCardInstance(makeCard({ name: 'Ally' }), 'player');
  const oppSpirit = createCardInstance(makeCard({ name: 'Enemy' }), 'opponent');

  state.players.player.field.push(createFieldStack(mySpirit));
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  let step = 0;
  const promptResolver = new MockPromptResolver(async (prompt) => {
    step++;
    if (step === 1) {
      assert.equal(prompt.candidates[0].card.name, 'Ally');
      return [prompt.candidates[0]];
    } else {
      assert.equal(prompt.candidates[0].card.name, 'Enemy');
      return [prompt.candidates[0]];
    }
  });

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_dual_target',
    clauses: [
      {
        op: { op: 'TARGET', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'TARGET', side: 'opp', count: 1 }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(step, 2);
});

// ============================================================================
// 22. Existing high-level DESTROY and BOUNCE prompts
// ============================================================================
test('22. Existing high-level DESTROY and BOUNCE prompts continue prompting directly', async () => {
  const state = createGameState([], []);
  const s1 = createCardInstance(makeCard({ name: 'Victim' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(s1));

  let destroyPrompted = false;
  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'SELECT_DESTROY') {
      destroyPrompted = true;
      return [prompt.candidates[0]];
    }
    return [];
  });

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_direct_destroy',
    clauses: [
      {
        op: { op: 'DESTROY', count: 1 }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(destroyPrompted, true);
  assert.equal(state.players.opponent.grave.length, 1);
});

// ============================================================================
// PHASE 4B.1.1 CORRECTIVE PATCH TESTS
// ============================================================================

// 23. Optional decline clears all three targeting context properties
test('23. Optional decline clears all three targeting context properties', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'Active' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spirit));

  // Start with existing context
  const context = {
    controller: 'player',
    previousTarget: spirit,
    previousTargets: [spirit],
    selectedTargets: [{ card: spirit, zone: 'field' }]
  };

  // Optional targeting is declined by prompt resolver
  const promptResolver = new MockPromptResolver(async () => []);
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', optional: true, count: 1 }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.declined, true);
  assert.equal(context.previousTarget, null);
  assert.deepEqual(context.previousTargets, []);
  assert.deepEqual(context.selectedTargets, []);

  // Subsequent DESTROY with PREVIOUS_TARGET must fail
  const destRes = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(destRes.success, false);
  assert.equal(destRes.reason, 'NO_PREVIOUS_TARGET');
  assert.equal(state.players.opponent.field.length, 1);
});

// 24. A failed targeting operation cannot reuse a previous target
test('24. A failed targeting operation cannot reuse a previous target', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'TargetA', cost: 5 }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spirit));

  const context = {
    controller: 'player',
    previousTarget: spirit,
    previousTargets: [spirit],
    selectedTargets: [{ card: spirit, zone: 'field' }]
  };

  // Mandatory targeting for cost <= 2 fails because cost is 5
  const promptResolver = new MockPromptResolver(async (p) => p.candidates);
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', filter: { costLte: 2 }, count: 1 }, context, promptResolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_LEGAL_TARGETS');
  assert.equal(context.previousTarget, null);
  assert.deepEqual(context.previousTargets, []);
  assert.deepEqual(context.selectedTargets, []);

  // Subsequent DESTROY with PREVIOUS_TARGET must not reuse spirit
  const destRes = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(destRes.success, false);
  assert.equal(destRes.reason, 'NO_PREVIOUS_TARGET');
  assert.equal(state.players.opponent.field.length, 1);
});

// 25. A target selected from trash can be legally reused when the subsequent operation permits it
test('25. A target selected from trash can be legally reused when the subsequent operation permits it', async () => {
  const state = createGameState([], []);
  const cardTrash = createCardInstance(makeCard({ name: 'TrashHero', type: 'Spirit', cost: 3 }), 'player');
  state.players.player.grave.push(cardTrash);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_salvage_previous',
    clauses: [
      {
        op: { op: 'TARGET', zone: 'trash', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.grave.length, 0);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, cardTrash.id);
});

// 26. A target selected from revealed cards can be reused correctly
test('26. A target selected from revealed cards can be reused correctly', async () => {
  const state = createGameState([], []);
  const cardRev = createCardInstance(makeCard({ name: 'RevealedSpell', type: 'Magic' }), 'player');
  state.players.player.revealed = [cardRev];

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_reveal_to_hand',
    clauses: [
      {
        op: { op: 'TARGET', zone: 'revealed', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, cardRev.id);
  assert.equal(state.players.player.revealed.length, 0);
});

// 27. A target selected from removed cards can be reused correctly
test('27. A target selected from removed cards can be reused correctly', async () => {
  const state = createGameState([], []);
  const cardRemoved = createCardInstance(makeCard({ name: 'BanishedCreature', type: 'Spirit' }), 'player');
  state.players.player.removed.push(cardRemoved);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_removed_to_hand',
    clauses: [
      {
        op: { op: 'TARGET', zone: 'removed', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, cardRemoved.id);
  assert.equal(state.players.player.removed.length, 0);
});

// 28. DESTROY rejects a target that has moved out of the field
test('28. DESTROY rejects a target that has moved out of the field', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'DoomedSpirit' }), 'opponent');
  const stack = createFieldStack(spirit);
  state.players.opponent.field.push(stack);

  const context = { controller: 'player' };
  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);

  // Target the spirit on field
  const tRes = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, promptResolver);
  assert.equal(tRes.success, true);

  // Before DESTROY runs, move the target out of field into trash
  await moveCard(state, spirit, 'grave', 'opponent');
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);

  // DESTROY with PREVIOUS_TARGET should reject it
  const dRes = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(dRes.success, false);
  assert.equal(dRes.reason, 'PREVIOUS_TARGET_UNAVAILABLE');
  assert.equal(state.players.opponent.grave.length, 1); // no double-destruction
});

// 29. BOUNCE rejects an invalidated field target
test('29. BOUNCE rejects an invalidated field target', async () => {
  const state = createGameState([], []);
  const spirit = createCardInstance(makeCard({ name: 'BounceTarget' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spirit));

  const context = { controller: 'player' };
  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);

  const tRes = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, promptResolver);
  assert.equal(tRes.success, true);

  // Move target to grave before bounce executes
  await moveCard(state, spirit, 'grave', 'opponent');
  assert.equal(state.players.opponent.field.length, 0);

  // BOUNCE with PREVIOUS_TARGET must reject it
  const bRes = await executeOp(state, { op: 'BOUNCE', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(bRes.success, false);
  assert.equal(bRes.reason, 'PREVIOUS_TARGET_UNAVAILABLE');
  assert.equal(state.players.opponent.hand.length, 0);
});

// 30. ADD_TO_HAND prioritizes PREVIOUS_TARGET over revealed-card pools
test('30. ADD_TO_HAND prioritizes PREVIOUS_TARGET over revealed-card pools', async () => {
  const state = createGameState([], []);
  const cardTrash = createCardInstance(makeCard({ name: 'FromTrash' }), 'player');
  state.players.player.grave.push(cardTrash);

  const cardRev1 = createCardInstance(makeCard({ name: 'Rev1' }), 'player');
  const cardRev2 = createCardInstance(makeCard({ name: 'Rev2' }), 'player');
  state.players.player.revealed = [cardRev1, cardRev2];

  const context = {
    controller: 'player',
    revealedCards: [cardRev1, cardRev2],
    previousTarget: cardTrash,
    previousTargets: [cardTrash],
    selectedTargets: [{ card: cardTrash, zone: 'grave' }]
  };

  const promptResolver = new MockPromptResolver(async () => []);
  const res = await executeOp(state, { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET', count: 1 }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, cardTrash.id);
  // Revealed cards remain untouched!
  assert.equal(context.revealedCards.length, 2);
  assert.equal(state.players.player.revealed.length, 2);
});

// 31. ADD_TO_HAND moves the exact selected physical card
test('31. ADD_TO_HAND moves the exact selected physical card', async () => {
  const state = createGameState([], []);
  const copy1 = createCardInstance(makeCard({ name: 'CloneSpell', cardNumber: 'BS01-099' }), 'player');
  const copy2 = createCardInstance(makeCard({ name: 'CloneSpell', cardNumber: 'BS01-099' }), 'player');
  assert.notEqual(copy1.id, copy2.id);
  state.players.player.grave.push(copy1, copy2);

  const promptResolver = new MockPromptResolver(async (prompt) => {
    // Specifically pick copy2 (candidate index 1)
    return [prompt.candidates[1]];
  });

  const resolver = new AsyncResolver(promptResolver);
  const ability = {
    id: 'ab_exact_clone_salvage',
    clauses: [
      {
        op: { op: 'TARGET', zone: 'trash', side: 'self', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'ADD_TO_HAND', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, copy2.id);
  assert.equal(state.players.player.grave.length, 1);
  assert.equal(state.players.player.grave[0].id, copy1.id);
});

// 32. A successful DRAW does not overwrite previous targeting context
test('32. A successful DRAW does not overwrite previous targeting context', async () => {
  const state = createGameState([], []);
  const targetSpirit = createCardInstance(makeCard({ name: 'OpponentSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(targetSpirit));

  const deckCard = createCardInstance(makeCard({ name: 'DrawnCard' }), 'player');
  state.players.player.deck.push(deckCard);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_draw_destroy',
    clauses: [
      {
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'DECK_OR_HAND_ACTION', action: 'DRAW', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  // Hand received drawn card
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, deckCard.id);
  // Target spirit was destroyed, NOT the drawn card!
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, targetSpirit.id);
});

// 33. A successful SUMMON does not overwrite previous targeting context
test('33. A successful SUMMON does not overwrite previous targeting context', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const friendlySpirit = createCardInstance(makeCard({ name: 'FriendlySummon', cost: 3 }), 'player');
  state.players.player.hand.push(friendlySpirit);
  state.players.player.reserve.normal = 5;

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_summon_destroy',
    clauses: [
      {
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'SUMMON_FREE', from: 'HAND', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });
  assert.equal(res.success, true);
  // Friendly spirit summoned to field
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, friendlySpirit.id);
  // Opposing target spirit destroyed
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 34. A Spirit whose top card has changed cannot be treated as the originally selected Spirit
test('34. A Spirit whose top card has changed cannot be treated as the originally selected Spirit', async () => {
  const state = createGameState([], []);
  const baseSpirit = createCardInstance(makeCard({ name: 'BaseSpirit' }), 'opponent');
  const stack = createFieldStack(baseSpirit);
  state.players.opponent.field.push(stack);

  const context = { controller: 'player' };
  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);

  // Target baseSpirit
  const tRes = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 1 }, context, promptResolver);
  assert.equal(tRes.success, true);

  // An Advent occurs: top card becomes adventSpirit, baseSpirit placed underneath
  const adventSpirit = createCardInstance(makeCard({ name: 'AdventSpirit' }), 'opponent');
  stack.under = [baseSpirit];
  stack.top = adventSpirit;

  // Attempt DESTROY on previous target (baseSpirit)
  const dRes = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(dRes.success, false);
  assert.equal(dRes.reason, 'PREVIOUS_TARGET_UNAVAILABLE');
  // Stack on field remains untouched
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, adventSpirit.id);
  assert.equal(state.players.opponent.grave.length, 0);
});

// 35. An attached Brave is validated independently from its host stack
test('35. An attached Brave is validated independently from its host stack', async () => {
  const state = createGameState([], []);
  const hostSpirit = createCardInstance(makeCard({ name: 'HostSpirit' }), 'opponent');
  const braveCard = createCardInstance(makeCard({ name: 'BraveBlade', type: 'Brave', cost: 4 }), 'opponent');
  const stack = createFieldStack(hostSpirit);
  stack.braves = [braveCard];
  state.players.opponent.field.push(stack);

  const context = { controller: 'player' };
  const promptResolver = new MockPromptResolver(async (p) => {
    const braveCand = p.candidates.find(c => c.type === 'brave');
    return [braveCand];
  });

  // Target attached brave
  const tRes = await executeTargeting(state, { op: 'TARGET', types: ['Brave'], side: 'opp', count: 1 }, context, promptResolver);
  assert.equal(tRes.success, true);
  assert.equal(context.previousTarget.id, braveCard.id);

  // Detach / send brave to trash; host stack remains on field
  stack.braves = [];
  state.players.opponent.grave.push(braveCard);

  // Operation on previous target brave must fail because brave is no longer attached
  const dRes = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, context, promptResolver);
  assert.equal(dRes.success, false);
  assert.equal(dRes.reason, 'PREVIOUS_TARGET_UNAVAILABLE');
  // Host spirit remains safely on field
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, hostSpirit.id);
});

// 36. Multiple target selections preserve the intended selection and ordering
test('36. Multiple target selections preserve the intended selection and ordering', async () => {
  const state = createGameState([], []);
  const sA = createCardInstance(makeCard({ name: 'CardA' }), 'opponent');
  const sB = createCardInstance(makeCard({ name: 'CardB' }), 'opponent');
  const sC = createCardInstance(makeCard({ name: 'CardC' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(sA), createFieldStack(sB), createFieldStack(sC));

  // Resolver picks [sC, sA] in that specific order
  const promptResolver = new MockPromptResolver(async (p) => {
    const candC = p.candidates.find(c => c.card.id === sC.id);
    const candA = p.candidates.find(c => c.card.id === sA.id);
    return [candC, candA];
  });

  const context = { controller: 'player' };
  const res = await executeTargeting(state, { op: 'TARGET', side: 'opp', count: 2 }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(context.previousTargets.length, 2);
  assert.equal(context.previousTargets[0].id, sC.id);
  assert.equal(context.previousTargets[1].id, sA.id);
  assert.equal(context.selectedTargets[0].card.id, sC.id);
  assert.equal(context.selectedTargets[1].card.id, sA.id);
});

// 37. High-level DESTROY and BOUNCE continue to work through the unified targeting contract
test('37. High-level DESTROY and BOUNCE continue to work through the unified targeting contract', async () => {
  const state = createGameState([], []);
  const sDest = createCardInstance(makeCard({ name: 'DestroyMe' }), 'opponent');
  const sBounce = createCardInstance(makeCard({ name: 'BounceMe' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(sDest), createFieldStack(sBounce));

  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'SELECT_DESTROY') {
      const cand = prompt.candidates.find(c => c.card.id === sDest.id);
      return [cand];
    }
    if (prompt.type === 'SELECT_BOUNCE') {
      const cand = prompt.candidates.find(c => c.card.id === sBounce.id);
      return [cand];
    }
    return [];
  });

  const resolver = new AsyncResolver(promptResolver);

  // High-level DESTROY
  const dRes = await resolver.resolveAbility(state, {
    id: 'ab_high_destroy',
    clauses: [{ op: { op: 'DESTROY', count: 1 } }]
  }, { controller: 'player' });

  assert.equal(dRes.success, true);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, sDest.id);

  // High-level BOUNCE
  const bRes = await resolver.resolveAbility(state, {
    id: 'ab_high_bounce',
    clauses: [{ op: { op: 'BOUNCE', count: 1 } }]
  }, { controller: 'player' });

  assert.equal(bRes.success, true);
  assert.equal(state.players.opponent.hand.length, 1);
  assert.equal(state.players.opponent.hand[0].id, sBounce.id);
  assert.equal(state.players.opponent.field.length, 0);
});

// ============================================================================
// PHASE 4B.1.2: FINAL TARGETING CONTEXT CORRECTIONS (Tests 38–48)
// ============================================================================

// 38. Direct DRAW does not overwrite an existing previous target
test('38. Direct DRAW does not overwrite an existing previous target', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const drawnCard = createCardInstance(makeCard({ name: 'DrawnCard' }), 'player');
  state.players.player.deck.push(drawnCard);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_draw_destroy',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'then', op: { op: 'DRAW', count: 1 } },
      { link: 'then', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const context = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, context);

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, drawnCard.id);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 39. DECK_OR_HAND_ACTION DRAW does not overwrite an existing previous target
test('39. DECK_OR_HAND_ACTION DRAW does not overwrite an existing previous target', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const drawnCard = createCardInstance(makeCard({ name: 'DrawnViaAction' }), 'player');
  state.players.player.deck.push(drawnCard);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_deckaction_destroy',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'then', op: { op: 'DECK_OR_HAND_ACTION', action: 'DRAW', count: 1 } },
      { link: 'then', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, drawnCard.id);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 40. SUMMON does not overwrite an existing previous target
test('40. SUMMON does not overwrite an existing previous target', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const friendlySpirit = createCardInstance(makeCard({ name: 'FriendlySummoned', cost: 1 }), 'player');
  state.players.player.hand.push(friendlySpirit);
  state.players.player.reserve.normal = 5;

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_summon_destroy',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'then', op: { op: 'SUMMON', count: 1 } },
      { link: 'then', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, friendlySpirit.id);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 41. SUMMON_FREE does not overwrite an existing previous target
test('41. SUMMON_FREE does not overwrite an existing previous target', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const freeSpirit = createCardInstance(makeCard({ name: 'FreeSummoned' }), 'player');
  state.players.player.hand.push(freeSpirit);
  state.players.player.reserve.normal = 3;

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_summonfree_destroy',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'then', op: { op: 'SUMMON_FREE', from: 'HAND', count: 1 } },
      { link: 'then', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.field[0].top.id, freeSpirit.id);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 42. REVEAL_DECKTOP does not overwrite an existing previous target
test('42. REVEAL_DECKTOP does not overwrite an existing previous target', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'OppTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const topCard = createCardInstance(makeCard({ name: 'RevealedTopCard' }), 'player');
  state.players.player.deck.push(topCard);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_reveal_destroy',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'then', op: { op: 'REVEAL_DECKTOP', count: 1 } },
      { link: 'then', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.player.revealed.length, 1);
  assert.equal(state.players.player.revealed[0].id, topCard.id);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, oppSpirit.id);
});

// 43. DESTROY can propagate the destroyed target where the effect requires it
test('43. DESTROY can propagate the destroyed target where the effect requires it', async () => {
  const state = createGameState([], []);
  const firstWolf = createCardInstance(makeCard({ name: 'Wolf1', family: 'Wolf', bp: 4000 }), 'opponent');
  const snakeSpirit = createCardInstance(makeCard({ name: 'Snake1', family: 'Snake', bp: 3000 }), 'opponent');
  const secondWolf = createCardInstance(makeCard({ name: 'Wolf2', family: 'Wolf', bp: 8000 }), 'opponent');
  state.players.opponent.field.push(
    createFieldStack(firstWolf),
    createFieldStack(snakeSpirit),
    createFieldStack(secondWolf)
  );

  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'SELECT_DESTROY') {
      return [prompt.candidates[0]];
    }
    return [];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_chain_destroy_family',
    clauses: [
      {
        op: { op: 'DESTROY', count: 1, filter: { bpLte: 5000 } }
      },
      {
        link: 'then',
        op: { op: 'DESTROY', count: 1, filter: { sameFamilyAsPrevious: true } }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  // Both Wolf spirits destroyed, Snake spirit untouched
  assert.equal(state.players.opponent.grave.length, 2);
  const graveIds = state.players.opponent.grave.map(c => c.id);
  assert.ok(graveIds.includes(firstWolf.id));
  assert.ok(graveIds.includes(secondWolf.id));
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, snakeSpirit.id);
});

// 44. BOUNCE can propagate the affected target where the effect requires it
test('44. BOUNCE can propagate the affected target where the effect requires it', async () => {
  const state = createGameState([], []);
  const bouncedBird = createCardInstance(makeCard({ name: 'Bird1', family: 'WingedBeast' }), 'opponent');
  const otherBird = createCardInstance(makeCard({ name: 'Bird2', family: 'WingedBeast' }), 'opponent');
  const fishSpirit = createCardInstance(makeCard({ name: 'Fish1', family: 'Spikedshell' }), 'opponent');
  state.players.opponent.field.push(
    createFieldStack(bouncedBird),
    createFieldStack(otherBird),
    createFieldStack(fishSpirit)
  );

  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'SELECT_BOUNCE') {
      const cand = prompt.candidates.find(c => c.card.id === bouncedBird.id);
      return [cand];
    }
    if (prompt.type === 'SELECT_DESTROY') {
      const cand = prompt.candidates.find(c => c.card.id === otherBird.id);
      return [cand];
    }
    return [];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_bounce_then_destroy_same_family',
    clauses: [
      {
        op: { op: 'BOUNCE', count: 1 }
      },
      {
        link: 'then',
        op: { op: 'DESTROY', count: 1, filter: { sameFamilyAsPrevious: true } }
      }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  // Bounced card in opponent hand
  assert.equal(state.players.opponent.hand.length, 1);
  assert.equal(state.players.opponent.hand[0].id, bouncedBird.id);
  // Matching family card destroyed in grave
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, otherBird.id);
  // Unrelated card remains on field
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, fishSpirit.id);
});

// 45. A successful TARGET inside an afterResolves clause updates targeting context
test('45. A successful TARGET inside an afterResolves clause updates targeting context', async () => {
  const state = createGameState([], []);
  const oppSpirit = createCardInstance(makeCard({ name: 'AfterTargetSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(oppSpirit));

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_after_target',
    clauses: [
      { op: { op: 'ADD_COUNTER', count: 1 } },
      { link: 'afterResolves', op: { op: 'TARGET', side: 'opp', count: 1 } }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.success, true);
  assert.ok(ctx.previousTarget);
  assert.equal(ctx.previousTarget.id, oppSpirit.id);
  assert.equal(ctx.previousTargets.length, 1);
  assert.equal(ctx.previousTargets[0].id, oppSpirit.id);
  assert.equal(ctx.selectedTargets.length, 1);
  assert.equal(ctx.selectedTargets[0].card.id, oppSpirit.id);
});

// 46. A failed TARGET inside an afterResolves clause clears targeting context
test('46. A failed TARGET inside an afterResolves clause clears targeting context', async () => {
  const state = createGameState([], []);
  const existingSpirit = createCardInstance(makeCard({ name: 'ExistingSpirit' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(existingSpirit));

  const promptResolver = new MockPromptResolver(async () => []);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_after_failed_target',
    clauses: [
      { op: { op: 'COUNT_OPERATION', amount: 1 } },
      // TARGET with filter that matches no card on field -> fails
      { link: 'afterResolves', op: { op: 'TARGET', side: 'opp', filter: { name: 'NonExistent' }, count: 1 } }
    ]
  };

  const ctx = {
    controller: 'player',
    previousTarget: existingSpirit,
    previousTargets: [existingSpirit],
    selectedTargets: [{ card: existingSpirit }]
  };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(ctx.previousTarget, null);
  assert.deepEqual(ctx.previousTargets, []);
  assert.deepEqual(ctx.selectedTargets, []);
});

// 47. A subsequent afterResolves clause can consume the exact selected target
test('47. A subsequent afterResolves clause can consume the exact selected target', async () => {
  const state = createGameState([], []);
  const targetSpirit = createCardInstance(makeCard({ name: 'TargetMe' }), 'opponent');
  const safeSpirit = createCardInstance(makeCard({ name: 'KeepSafe' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(targetSpirit), createFieldStack(safeSpirit));

  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'SELECT_TARGET') {
      const cand = prompt.candidates.find(c => c.card.id === targetSpirit.id);
      return [cand];
    }
    return [];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_after_target_and_destroy',
    clauses: [
      { op: { op: 'ADD_COUNTER', count: 1 } },
      { link: 'afterResolves', op: { op: 'TARGET', side: 'opp', count: 1 } },
      { link: 'afterResolves', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const res = await resolver.resolveAbility(state, ability, { controller: 'player' });

  assert.equal(res.success, true);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, targetSpirit.id);
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, safeSpirit.id);
});

// 48. An ordinary afterResolves operation cannot overwrite targeting context accidentally
test('48. An ordinary afterResolves operation cannot overwrite targeting context accidentally', async () => {
  const state = createGameState([], []);
  const targetSpirit = createCardInstance(makeCard({ name: 'TargetInMain' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(targetSpirit));

  const deckCard = createCardInstance(makeCard({ name: 'DrawnCardInAfter' }), 'player');
  state.players.player.deck.push(deckCard);

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_main_target_after_draw_destroy',
    clauses: [
      // Main clause sets previousTarget to targetSpirit
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      // afterResolves DRAW draws deckCard (must NOT overwrite previousTarget)
      { link: 'afterResolves', op: { op: 'DRAW', count: 1 } },
      // afterResolves DESTROY uses PREVIOUS_TARGET (must destroy targetSpirit)
      { link: 'afterResolves', op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.success, true);
  // Card drawn to hand
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.hand[0].id, deckCard.id);
  // Target spirit destroyed from field to grave
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, targetSpirit.id);
});

// ============================================================================
// PHASE 4B.1.3: SKIPPED TARGET CLAUSE CONTEXT PRESERVATION (Tests 49–53)
// ============================================================================

// 49. TARGET A followed by a TARGET B clause whose condition is FALSE preserves A, and subsequent DESTROY PREVIOUS_TARGET destroys A
test('49. TARGET A followed by a TARGET B clause whose condition is FALSE preserves A, and subsequent DESTROY PREVIOUS_TARGET destroys A', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'SpiritAlpha' }), 'opponent');
  const spiritB = createCardInstance(makeCard({ name: 'SpiritBeta' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA), createFieldStack(spiritB));

  // Player controls 0 spirits on field
  state.players.player.field = [];

  const promptResolver = new MockPromptResolver(async (prompt) => {
    // If prompted, return candidates[0]
    return [prompt.candidates[0]];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_a_then_skip_b_then_destroy',
    clauses: [
      // Clause 1: Targets spiritA
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      // Clause 2: Has condition that evaluates to FALSE ("while you control a spirit"), skipped before execution
      {
        link: 'then',
        condition: 'while you control a spirit',
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      // Clause 3: DESTROY PREVIOUS_TARGET must destroy spiritA (not cleared by skipped clause 2)
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.success, true);
  assert.equal(res.results[0].success, true);
  assert.equal(res.results[1].skipped, true);
  assert.equal(res.results[1].conditionResult, 'FALSE');
  assert.equal(res.results[2].success, true);

  // spiritA destroyed to grave, spiritB remains on field
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, spiritA.id);
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, spiritB.id);

  // Context still holds spiritA
  assert.equal(ctx.previousTarget.id, spiritA.id);
});

// 50. A TARGET clause with an unsupported condition preserves the existing target while reporting UNSUPPORTED_CONDITION
test('50. A TARGET clause with an unsupported condition preserves the existing target while reporting UNSUPPORTED_CONDITION', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'SpiritAlpha' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA));

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_then_unsupported_condition_target',
    clauses: [
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      {
        link: 'then',
        condition: 'completely_unsupported_mystery_condition_xyz',
        op: { op: 'TARGET', side: 'opp', count: 1 }
      }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.hasUnsupported, true);
  assert.equal(res.results[1].reason, 'UNSUPPORTED_CONDITION');
  assert.equal(res.results[1].skipped, true);

  // Target A is preserved in context despite the second targeting clause having an unsupported condition
  assert.ok(ctx.previousTarget);
  assert.equal(ctx.previousTarget.id, spiritA.id);
  assert.equal(ctx.previousTargets.length, 1);
  assert.equal(ctx.previousTargets[0].id, spiritA.id);
  assert.equal(ctx.selectedTargets.length, 1);
  assert.equal(ctx.selectedTargets[0].card.id, spiritA.id);
});

// 51. An executed TARGET operation with no legal candidates still clears stale targeting context
test('51. An executed TARGET operation with no legal candidates still clears stale targeting context', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'SpiritAlpha' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA));

  const promptResolver = new MockPromptResolver(async (p) => [p.candidates[0]]);
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_then_executed_fail_target_then_destroy',
    clauses: [
      // Clause 1: Targets spiritA
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      // Clause 2: Executed targeting operation that finds 0 legal candidates
      {
        link: 'then',
        op: { op: 'TARGET', side: 'opp', filter: { name: 'NonExistentCard' }, count: 1 }
      },
      // Clause 3: DESTROY PREVIOUS_TARGET must fail because executed failure cleared context
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  // Clause 2 failed with NO_LEGAL_TARGETS
  assert.equal(res.results[1].success, false);
  assert.equal(res.results[1].reason, 'NO_LEGAL_TARGETS');

  // Context must be cleared
  assert.equal(ctx.previousTarget, null);
  assert.deepEqual(ctx.previousTargets, []);
  assert.deepEqual(ctx.selectedTargets, []);

  // Clause 3 failed because target was cleared
  assert.equal(res.results[2].success, false);
  assert.equal(res.results[2].reason, 'NO_PREVIOUS_TARGET');

  // spiritA is NOT destroyed
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, spiritA.id);
  assert.equal(state.players.opponent.grave.length, 0);
});

// 52. An executed optional TARGET operation that the player declines follows the documented decline policy
test('52. An executed optional TARGET operation that the player declines follows the documented decline policy', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'SpiritAlpha' }), 'opponent');
  const spiritB = createCardInstance(makeCard({ name: 'SpiritBeta' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA), createFieldStack(spiritB));

  const promptResolver = new MockPromptResolver(async (prompt) => {
    // If prompt is optional, player declines by returning empty array
    if (prompt.optional) {
      return [];
    }
    return [prompt.candidates[0]];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_then_executed_optional_decline_then_destroy',
    clauses: [
      // Clause 1: Selects spiritA
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      // Clause 2: Executed optional target, player declines
      {
        link: 'then',
        op: { op: 'TARGET', side: 'opp', optional: true, count: 1 }
      },
      // Clause 3: DESTROY PREVIOUS_TARGET must fail because optional decline cleared context
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.results[1].declined, true);

  // Context must be cleared under documented decline policy
  assert.equal(ctx.previousTarget, null);
  assert.deepEqual(ctx.previousTargets, []);
  assert.deepEqual(ctx.selectedTargets, []);

  // Clause 3 failed with NO_PREVIOUS_TARGET
  assert.equal(res.results[2].success, false);
  assert.equal(res.results[2].reason, 'NO_PREVIOUS_TARGET');

  // Neither spirit destroyed
  assert.equal(state.players.opponent.field.length, 2);
  assert.equal(state.players.opponent.grave.length, 0);
});

// 53. An optional TARGET clause declined before execution follows the documented decline policy
test('53. An optional TARGET clause declined before execution follows the documented decline policy', async () => {
  const state = createGameState([], []);
  const spiritA = createCardInstance(makeCard({ name: 'SpiritAlpha' }), 'opponent');
  state.players.opponent.field.push(createFieldStack(spiritA));

  const promptResolver = new MockPromptResolver(async (prompt) => {
    if (prompt.type === 'CONFIRM_OPTIONAL') {
      return { accepted: false, declined: true };
    }
    return [prompt.candidates[0]];
  });
  const resolver = new AsyncResolver(promptResolver);

  const ability = {
    id: 'ab_target_then_clause_optional_decline_then_destroy',
    clauses: [
      // Clause 1: Selects spiritA
      { op: { op: 'TARGET', side: 'opp', count: 1 } },
      // Clause 2: Optional clause declined before execution
      {
        link: 'then',
        isOptional: true,
        cleanText: 'You may target an opposing Spirit',
        op: { op: 'TARGET', side: 'opp', count: 1 }
      },
      // Clause 3: DESTROY PREVIOUS_TARGET must fail because optional targeting clause was declined
      {
        link: 'then',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const ctx = { controller: 'player' };
  const res = await resolver.resolveAbility(state, ability, ctx);

  assert.equal(res.results[1].optionalDeclined, true);
  assert.equal(res.results[1].skipped, true);

  // Targeting context cleared per documented decline policy
  assert.equal(ctx.previousTarget, null);
  assert.deepEqual(ctx.previousTargets, []);
  assert.deepEqual(ctx.selectedTargets, []);

  // Clause 3 failed with NO_PREVIOUS_TARGET
  assert.equal(res.results[2].success, false);
  assert.equal(res.results[2].reason, 'NO_PREVIOUS_TARGET');

  // spiritA remains safe on field
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, spiritA.id);
  assert.equal(state.players.opponent.grave.length, 0);
});
