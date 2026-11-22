/**
 * tests/phase4b2_destroy_bounce.test.js
 * 
 * Comprehensive Test Suite for Phase 4B.2:
 * DESTROY and BOUNCE Parameter Variant Implementation
 * 
 * Covers all 8 specification areas:
 * 1. DESTROY — simultaneous destruction (all: true)
 * 2. DESTROY — total BP comparison (TOTAL_BP_LTE / maxTotalBp)
 * 3. DESTROY — total cost comparison (TOTAL_COST_LTE / maxTotalCost)
 * 4. DESTROY — Armor bypass (ignoreArmor: true)
 * 5. BOUNCE — deck_top destination
 * 6. BOUNCE — deck_bottom destination
 * 7. BOUNCE — graveyard destination
 * 8. BOUNCE — prompt context messaging
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../engine/events.js';
import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp, resolveBounceDestination, getBouncePromptTitle } from '../engine/ops/index.js';
import { executeTargeting, queryCandidates, validateSelection } from '../engine/selectors.js';
import { AsyncResolver } from '../engine/resolver.js';

function createMockCard(id, name, overrides = {}) {
  const bpVal = overrides.bp || 3000;
  return {
    id,
    name,
    card_number: id,
    cardNumber: id,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 3,
    level: 1,
    bp: bpVal,
    owner: 'opponent',
    currentOwner: 'opponent',
    levels: {
      1: { bp: bpVal, cost: 1 },
      2: { bp: bpVal + 2000, cost: 3 }
    },
    ap: {
      levels: [
        { level: 1, bp: bpVal, cost: 1 },
        { level: 2, bp: bpVal + 2000, cost: 3 }
      ]
    },
    ...overrides
  };
}

// =============================================================================
// SECTION 1: DESTROY — SIMULTANEOUS DESTRUCTION (all: true)
// =============================================================================

test('1.1 all: true destroys all matching spirits simultaneously without prompt', async () => {
  const state = createGameState();
  const c1 = createMockCard('BS01-001', 'Spirit A', { bp: 3000, cost: 3 });
  const c2 = createMockCard('BS01-002', 'Spirit B', { bp: 4000, cost: 4 });
  const c3 = createMockCard('BS01-003', 'Spirit C', { bp: 9000, cost: 7 }); // Over BP threshold

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 }),
    createFieldStack(c3, { normal: 1, soul: 0 })
  ];

  let promptCalled = false;
  const promptResolver = {
    choose: async () => {
      promptCalled = true;
      return [];
    }
  };

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const res = await executeOp(state, {
    op: 'DESTROY',
    all: true,
    filter: { bpLte: 5000 }
  }, context, promptResolver);

  assert.equal(promptCalled, false, 'Player prompt must NOT be called when all: true is active');
  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, 'BS01-003');
  assert.equal(state.players.opponent.grave.length, 2);
});

test('1.2 all: true respects side restrictions (opp vs either/both)', async () => {
  const state = createGameState();
  const oppCard = createMockCard('OPP-001', 'Opp Spirit', { bp: 3000, owner: 'opponent' });
  const selfCard = createMockCard('SELF-001', 'Self Spirit', { bp: 3000, owner: 'player' });

  state.players.opponent.field = [createFieldStack(oppCard, { normal: 1, soul: 0 })];
  state.players.player.field = [createFieldStack(selfCard, { normal: 1, soul: 0 })];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  // Destroy all opposing spirits
  const resOpp = await executeOp(state, {
    op: 'DESTROY',
    all: true,
    side: 'opp'
  }, context, { choose: async () => [] });

  assert.equal(resOpp.destroyedCount, 1);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.player.field.length, 1, 'Player field must not be affected by side: opp');

  // Now destroy both sides with side: either
  const resEither = await executeOp(state, {
    op: 'DESTROY',
    all: true,
    side: 'either'
  }, context, { choose: async () => [] });

  assert.equal(resEither.destroyedCount, 1);
  assert.equal(state.players.player.field.length, 0, 'Player spirit destroyed by side: either');
});

test('1.3 all: true dismantles attached Braves to graveyard exactly once without duplicate processing', async () => {
  const state = createGameState();
  const hostCard = createMockCard('HOST-001', 'Host Spirit', { bp: 4000 });
  const braveCard = createMockCard('BRV-001', 'Attached Brave', { type: 'Brave', bp: 2000, cost: 4 });

  const stack = createFieldStack(hostCard, { normal: 2, soul: 0 });
  stack.braves = [braveCard];
  state.players.opponent.field = [stack];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const res = await executeOp(state, {
    op: 'DESTROY',
    all: true,
    types: ['Any'] // Would match both Spirit and Brave if evaluated naively
  }, context, { choose: async () => [] });

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 1, 'Only top card is destroyed as stack entity');
  assert.equal(state.players.opponent.field.length, 0);
  // Brave must be placed in graveyard by stack dismantling exactly once
  const braveInGrave = state.players.opponent.grave.filter(c => c.id === 'BRV-001');
  assert.equal(braveInGrave.length, 1, 'Brave should be in grave exactly once');
});

test('1.4 all: true with empty candidate set succeeds with destroyedCount: 0 without crashing', async () => {
  const state = createGameState();
  state.players.opponent.field = [];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const res = await executeOp(state, {
    op: 'DESTROY',
    all: true
  }, context, { choose: async () => [] });

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 0);
  assert.deepEqual(res.cards, []);
  assert.equal(context.previousTarget, null);
  assert.deepEqual(context.previousTargets, []);
});

// =============================================================================
// SECTION 2: DESTROY — TOTAL BP COMPARISON (TOTAL_BP_LTE / maxTotalBp)
// =============================================================================

test('2.1 TOTAL_BP_LTE allows selecting multiple targets whose aggregate BP is <= maxTotalBp', async () => {
  const state = createGameState();
  const c1 = createMockCard('BP-001', 'Spirit 1', { bp: 3000 });
  const c2 = createMockCard('BP-002', 'Spirit 2', { bp: 4000 });
  const c3 = createMockCard('BP-003', 'Spirit 3', { bp: 6000 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 }),
    createFieldStack(c3, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  // Target multiple spirits up to total 7000 BP (c1 + c2 = 7000 BP)
  const promptResolver = {
    choose: async (prompt) => {
      assert.equal(prompt.mode, 'TOTAL_BP_LTE');
      assert.equal(prompt.maxTotalBp, 7000);
      assert.equal(prompt.candidates.length, 3);
      // Select c1 and c2
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_BP_LTE',
    maxTotalBp: 7000
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1);
  assert.equal(state.players.opponent.field[0].top.id, 'BP-003');
});

test('2.2 TOTAL_BP_LTE rejects selection whose aggregate BP exceeds maxTotalBp', async () => {
  const state = createGameState();
  const c1 = createMockCard('BP-001', 'Spirit 1', { bp: 4000 });
  const c2 = createMockCard('BP-002', 'Spirit 2', { bp: 5000 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      // 4000 + 5000 = 9000 > 8000
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_BP_LTE',
    maxTotalBp: 8000
  }, context, promptResolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_TARGET_SELECTION');
  assert.equal(state.players.opponent.field.length, 2, 'No spirits destroyed on invalid selection');
});

test('2.3 TOTAL_BP_LTE evaluates authoritative continuous BP modifiers dynamically', async () => {
  const state = createGameState();
  const c1 = createMockCard('BP-001', 'Spirit 1', { bp: 3000 });
  const c2 = createMockCard('BP-002', 'Spirit 2', { bp: 3000 });

  const st1 = createFieldStack(c1, { normal: 1, soul: 0 });
  const st2 = createFieldStack(c2, { normal: 1, soul: 0 });
  state.players.opponent.field = [st1, st2];

  // Apply a +3000 BP continuous buff to c1, making its authoritative BP 6000
  state.modifiers = [{
    id: 'mod_bp_1',
    type: 'BP_BUFF',
    targetStackId: st1.id,
    amount: 3000
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      // If authoritative BP is used, c1 is 6000 and c2 is 3000 -> 9000 > 7000
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_BP_LTE',
    maxTotalBp: 7000
  }, context, promptResolver);

  assert.equal(res.success, false, 'Must reject selection because buffed spirit pushes total over threshold');
});

test('2.4 TOTAL_BP_LTE rejects duplicate candidate selection to prevent double-counting', () => {
  const c1 = createMockCard('BP-001', 'Spirit 1', { bp: 3000 });
  const cand = { type: 'stack', stack: { id: 'st1' }, card: c1, bp: 3000, cost: 3 };
  const candidates = [cand];

  // Try to submit duplicate item to fake 6000 BP
  const chosen = [cand, cand];
  const valid = validateSelection(candidates, chosen, { mode: 'TOTAL_BP_LTE', maxTotalBp: 8000 });
  assert.equal(valid, false, 'Duplicate candidate selection must be rejected');
});

// =============================================================================
// SECTION 3: DESTROY — TOTAL COST COMPARISON (TOTAL_COST_LTE / maxTotalCost)
// =============================================================================

test('3.1 TOTAL_COST_LTE allows selecting multiple targets whose aggregate cost is <= maxTotalCost', async () => {
  const state = createGameState();
  const c1 = createMockCard('C-001', 'Spirit 1', { cost: 3 });
  const c2 = createMockCard('C-002', 'Spirit 2', { cost: 4 });
  const c3 = createMockCard('C-003', 'Spirit 3', { cost: 6 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 }),
    createFieldStack(c3, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      assert.equal(prompt.mode, 'TOTAL_COST_LTE');
      assert.equal(prompt.maxTotalCost, 8);
      // Select c1 (3) + c2 (4) = 7 <= 8
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 8
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 1);
});

test('3.2 TOTAL_COST_LTE rejects selection whose aggregate cost exceeds maxTotalCost', async () => {
  const state = createGameState();
  const c1 = createMockCard('C-001', 'Spirit 1', { cost: 5 });
  const c2 = createMockCard('C-002', 'Spirit 2', { cost: 5 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      // 5 + 5 = 10 > 9
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 9
  }, context, promptResolver);

  assert.equal(res.success, false);
  assert.equal(res.reason, 'INVALID_TARGET_SELECTION');
});

test('3.3 TOTAL_COST_LTE correctly integrates calculateEffectiveCost with COST_MODIFIER', async () => {
  const state = createGameState();
  const c1 = createMockCard('C-001', 'Spirit 1', { cost: 5 });
  const c2 = createMockCard('C-002', 'Spirit 2', { cost: 5 });

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  // Set c1 cost to 2 via continuous COST_MODIFIER
  state.modifiers = [{
    id: 'mod_cost_1',
    type: 'COST_MODIFIER',
    targetCardId: c1.id,
    setCost: 2
  }];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      // c1 effective cost is 2, c2 is 5 -> total 7 <= 8
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 8
  }, context, promptResolver);

  assert.equal(res.success, true, 'Should succeed because c1 cost was modified to 2');
  assert.equal(res.destroyedCount, 2);
});

// =============================================================================
// SECTION 4: DESTROY — ARMOR BYPASS (ignoreArmor: true)
// =============================================================================

test('4.1 Normal DESTROY is blocked by Armor', async () => {
  const state = createGameState();
  const armoredCard = createMockCard('ARM-001', 'Armored Spirit', {
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  const stack = createFieldStack(armoredCard, { normal: 1, soul: 0 });
  state.players.opponent.field = [stack];

  const sourceCard = createMockCard('SRC-001', 'Red Source', { owner: 'player', currentOwner: 'player', color: 'Red', colors: ['Red'] });
  state.players.player.field = [createFieldStack(sourceCard, { normal: 1, soul: 0 })];
  const context = { controller: 'player', sourceCard };

  const res = await executeOp(state, {
    op: 'DESTROY'
  }, context, { choose: async () => [] });

  assert.equal(res.success, false);
  assert.equal(res.reason, 'NO_LEGAL_TARGETS', 'Armor: Red blocks targeting from Red source');
});

test('4.2 ignoreArmor: true allows DESTROY to bypass Armor / Heavy Armor', async () => {
  const state = createGameState();
  const armoredCard = createMockCard('ARM-001', 'Armored Spirit', {
    keywords: [{ name: 'Heavy Armor', parameter: 'Red' }]
  });
  const stack = createFieldStack(armoredCard, { normal: 1, soul: 0 });
  state.players.opponent.field = [stack];

  const sourceCard = createMockCard('SRC-001', 'Red Source', { owner: 'player', currentOwner: 'player', color: 'Red', colors: ['Red'] });
  state.players.player.field = [createFieldStack(sourceCard, { normal: 1, soul: 0 })];
  const context = { controller: 'player', sourceCard };

  const promptResolver = {
    choose: async (prompt) => {
      assert.equal(prompt.candidates.length, 1);
      return [prompt.candidates[0]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    ignoreArmor: true
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 1);
  assert.equal(state.players.opponent.field.length, 0);
});

test('4.3 ignoreArmor: true does NOT bypass cannotBeDestroyed protection modifiers', async () => {
  const state = createGameState();
  const protectedCard = createMockCard('PROT-001', 'Protected Spirit', {
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  const stack = createFieldStack(protectedCard, { normal: 1, soul: 0 });
  state.players.opponent.field = [stack];

  // Grant cannotBeDestroyed protection
  state.modifiers = [{
    id: 'prot_1',
    type: 'PROTECTION',
    targetStackId: stack.id,
    cannotBeDestroyed: true
  }];

  const sourceCard = createMockCard('SRC-001', 'Red Source', { owner: 'player', currentOwner: 'player', color: 'Red', colors: ['Red'] });
  state.players.player.field = [createFieldStack(sourceCard, { normal: 1, soul: 0 })];
  const context = { controller: 'player', sourceCard };

  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    ignoreArmor: true
  }, context, promptResolver);

  assert.equal(res.destroyedCount, 0, 'Card with cannotBeDestroyed must NOT be destroyed even with ignoreArmor: true');
  assert.equal(state.players.opponent.field.length, 1);
});

// =============================================================================
// SECTION 5: BOUNCE — DECK_TOP DESTINATION
// =============================================================================

test('5.1 BOUNCE to deck_top places single card at index 0 of owner deck', async () => {
  const state = createGameState();
  const deckCard = createMockCard('DECK-001', 'Existing Top Card');
  state.players.opponent.deck = [deckCard];

  const targetCard = createMockCard('TGT-001', 'Bounced Card');
  state.players.opponent.field = [createFieldStack(targetCard, { normal: 1, soul: 0 })];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'deck_top'
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.deck.length, 2);
  assert.equal(state.players.opponent.deck[0].id, 'TGT-001', 'Bounced card must be at top of deck (index 0)');
  assert.equal(state.players.opponent.deck[1].id, 'DECK-001');
});

test('5.2 BOUNCE to deck_top preserves selection order from top to bottom', async () => {
  const state = createGameState();
  state.players.opponent.deck = [createMockCard('EXISTING-001', 'Existing Card')];

  const c1 = createMockCard('C1-001', 'Card 1');
  const c2 = createMockCard('C2-002', 'Card 2');
  const c3 = createMockCard('C3-003', 'Card 3');

  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 }),
    createFieldStack(c3, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      // Choose in order: c1, c2, c3
      return [prompt.candidates[0], prompt.candidates[1], prompt.candidates[2]];
    }
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'deck_top',
    count: 3
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.bouncedCount, 3);
  assert.equal(state.players.opponent.field.length, 0);

  // Deck ordering requirement: c1 at index 0, c2 at index 1, c3 at index 2
  assert.equal(state.players.opponent.deck[0].id, 'C1-001');
  assert.equal(state.players.opponent.deck[1].id, 'C2-002');
  assert.equal(state.players.opponent.deck[2].id, 'C3-003');
  assert.equal(state.players.opponent.deck[3].id, 'EXISTING-001');
});

// =============================================================================
// SECTION 6: BOUNCE — DECK_BOTTOM DESTINATION
// =============================================================================

test('6.1 BOUNCE to deck_bottom places card at end of owner deck', async () => {
  const state = createGameState();
  const deckCard = createMockCard('DECK-001', 'Existing Card');
  state.players.opponent.deck = [deckCard];

  const targetCard = createMockCard('TGT-001', 'Bounced Card');
  state.players.opponent.field = [createFieldStack(targetCard, { normal: 1, soul: 0 })];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'deck_bottom'
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(state.players.opponent.deck.length, 2);
  assert.equal(state.players.opponent.deck[0].id, 'DECK-001');
  assert.equal(state.players.opponent.deck[1].id, 'TGT-001', 'Card placed at bottom of deck');
});

test('6.2 resolveBounceDestination handles deck_bottom, deckbottom, bottom, and text heuristics', () => {
  assert.equal(resolveBounceDestination({ destination: 'deck_bottom' }), 'deck_bottom');
  assert.equal(resolveBounceDestination({ destination: 'deckbottom' }), 'deck_bottom');
  assert.equal(resolveBounceDestination({ destination: 'bottom' }), 'deck_bottom');
  assert.equal(resolveBounceDestination({ destination: 'deck_top' }), 'deck_top');
  assert.equal(resolveBounceDestination({ destination: 'decktop' }), 'deck_top');
  assert.equal(resolveBounceDestination({ destination: 'top' }), 'deck_top');
  assert.equal(resolveBounceDestination({ destination: 'grave' }), 'grave');
  assert.equal(resolveBounceDestination({ destination: 'trash' }), 'grave');
  assert.equal(resolveBounceDestination({ destination: 'hand' }), 'hand');
  assert.equal(resolveBounceDestination({}, { text: 'return 1 opposing Spirit to the top of the deck' }), 'deck_top');
  assert.equal(resolveBounceDestination({}, { text: 'return 1 opposing Spirit to the bottom of the deck' }), 'deck_bottom');
  assert.equal(resolveBounceDestination({}, { text: 'send 1 opposing Spirit to the trash' }), 'grave');
});

// =============================================================================
// SECTION 7: BOUNCE — GRAVEYARD DESTINATION
// =============================================================================

test('7.1 BOUNCE to grave routes card to graveyard with cause: bounce', async () => {
  const state = createGameState();
  const targetCard = createMockCard('TGT-001', 'Bounced Card');
  state.players.opponent.field = [createFieldStack(targetCard, { normal: 1, soul: 0 })];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => [prompt.candidates[0]]
  };

  const events = new EventBus();
  let eventEmitted = false;
  events.on('BOUNCED', (payload) => {
    eventEmitted = true;
    assert.equal(payload.destination, 'grave');
    assert.equal(payload.cards[0].id, 'TGT-001');
  });

  const res = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'grave'
  }, context, promptResolver, events);

  assert.equal(res.success, true);
  assert.equal(eventEmitted, true, 'BOUNCED event with destination: grave must be emitted');
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.grave.length, 1);
  assert.equal(state.players.opponent.grave[0].id, 'TGT-001');
});

test('7.2 BOUNCE to grave is NOT blocked by cannotBeDestroyed, but IS blocked by cannotBeBounced', async () => {
  const state = createGameState();
  const c1 = createMockCard('C1-001', 'Immune to Destroy');
  const c2 = createMockCard('C2-002', 'Immune to Bounce');

  const st1 = createFieldStack(c1, { normal: 1, soul: 0 });
  const st2 = createFieldStack(c2, { normal: 1, soul: 0 });
  state.players.opponent.field = [st1, st2];

  state.modifiers = [
    { id: 'm1', type: 'PROTECTION', targetStackId: st1.id, cannotBeDestroyed: true },
    { id: 'm2', type: 'PROTECTION', targetStackId: st2.id, cannotBeBounced: true }
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };

  // 1. Try to bounce c1 (has cannotBeDestroyed: true) to grave
  const res1 = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'grave'
  }, context, { choose: async (p) => [p.candidates.find(c => c.card.id === 'C1-001')] });

  assert.equal(res1.success, true, 'cannotBeDestroyed does NOT prevent bounce-to-grave');
  assert.equal(state.players.opponent.grave.some(c => c.id === 'C1-001'), true);

  // 2. Try to bounce c2 (has cannotBeBounced: true) to grave
  const res2 = await executeOp(state, {
    op: 'BOUNCE',
    destination: 'grave'
  }, context, { choose: async (p) => [p.candidates.find(c => c.card.id === 'C2-002')] });

  assert.equal(res2.bouncedCount, 0, 'cannotBeBounced DOES prevent bounce-to-grave');
  assert.equal(state.players.opponent.field.some(st => st.top.id === 'C2-002'), true);
});

// =============================================================================
// SECTION 8: BOUNCE — PROMPT CONTEXT MESSAGING & HIDDEN HAND
// =============================================================================

test('8.1 BOUNCE prompts include SELECT_BOUNCE type and destination-specific title', async () => {
  assert.equal(getBouncePromptTitle('hand'), 'Select target to return to hand');
  assert.equal(getBouncePromptTitle('deck_top'), 'Select target to return to the top of the deck');
  assert.equal(getBouncePromptTitle('deck_bottom'), 'Select target to return to the bottom of the deck');
  assert.equal(getBouncePromptTitle('grave'), 'Select target to send to the trash');

  const state = createGameState();
  const c = createMockCard('C-001', 'Spirit');
  state.players.opponent.field = [createFieldStack(c, { normal: 1, soul: 0 })];

  let promptInspected = false;
  const promptResolver = {
    choose: async (prompt) => {
      promptInspected = true;
      assert.equal(prompt.type, 'SELECT_BOUNCE');
      assert.equal(prompt.title, 'Select target to return to the top of the deck');
      assert.equal(prompt.selector.destination, 'deck_top');
      return [prompt.candidates[0]];
    }
  };

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  await executeOp(state, {
    op: 'BOUNCE',
    destination: 'deck_top'
  }, context, promptResolver);

  assert.equal(promptInspected, true);
});

test('8.2 BOUNCE from hand protects opponent hidden-hand unless explicitly authorized', () => {
  const state = createGameState();
  state.players.opponent.hand = [
    createMockCard('H-001', 'Hidden Card 1'),
    createMockCard('H-002', 'Hidden Card 2')
  ];

  const context = { controller: 'player' };

  // Unauthorized inquiry should return 0 candidates
  const unauthorized = queryCandidates(state, { zone: 'hand', side: 'opp' }, context);
  assert.equal(unauthorized.length, 0, 'Opponent hidden hand must not be enumerated');

  // Explicitly authorized inquiry
  const authorized = queryCandidates(state, { zone: 'hand', side: 'opp', allowOpponentHand: true }, context);
  assert.equal(authorized.length, 2, 'Explicitly authorized inquiry can enumerate opponent hand');
});

// =============================================================================
// SECTION 9: ADDITIONAL EDGE CASES & INTEGRATION
// =============================================================================

test('9.1 BOUNCE with all: true bounces all matching spirits simultaneously without prompting', async () => {
  const state = createGameState();
  const c1 = createMockCard('BN-001', 'Bounce Target 1', { cost: 3 });
  const c2 = createMockCard('BN-002', 'Bounce Target 2', { cost: 4 });
  state.players.opponent.field = [
    createFieldStack(c1, { normal: 1, soul: 0 }),
    createFieldStack(c2, { normal: 1, soul: 0 })
  ];

  let promptCalled = false;
  const promptResolver = {
    choose: async () => {
      promptCalled = true;
      return [];
    }
  };

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const res = await executeOp(state, {
    op: 'BOUNCE',
    all: true,
    destination: 'hand'
  }, context, promptResolver);

  assert.equal(promptCalled, false, 'No prompt should be shown when all: true is active on BOUNCE');
  assert.equal(res.success, true);
  assert.equal(res.bouncedCount, 2);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.hand.length, 2);
});

test('9.2 TOTAL_BP_LTE boundary condition: exactly equal to maxTotalBp passes, 1 BP over fails', () => {
  const c1 = createMockCard('BP-001', 'Spirit 1', { bp: 5000 });
  const cand1 = { type: 'stack', stack: { id: 's1' }, card: c1, bp: 5000, cost: 3 };
  const candidates = [cand1];

  // Exactly equal: 5000 <= 5000
  assert.equal(validateSelection(candidates, [cand1], { mode: 'TOTAL_BP_LTE', maxTotalBp: 5000 }), true);
  // Over threshold: 5000 > 4999
  assert.equal(validateSelection(candidates, [cand1], { mode: 'TOTAL_BP_LTE', maxTotalBp: 4999 }), false);
});

test('9.3 TOTAL_COST_LTE evaluates mixed card types (Spirit and Ultimate)', async () => {
  const state = createGameState();
  const spirit = createMockCard('SP-001', 'Spirit', { cost: 4, type: 'Spirit' });
  const ultimate = createMockCard('ULT-001', 'Ultimate', { cost: 5, type: 'Ultimate' });

  state.players.opponent.field = [
    createFieldStack(spirit, { normal: 1, soul: 0 }),
    createFieldStack(ultimate, { normal: 1, soul: 0 })
  ];

  const context = { controller: 'player', sourceCard: createMockCard('SRC-001', 'Source') };
  const promptResolver = {
    choose: async (prompt) => {
      assert.equal(prompt.candidates.length, 2);
      // Spirit (4) + Ultimate (5) = 9 <= 9
      return [prompt.candidates[0], prompt.candidates[1]];
    }
  };

  const res = await executeOp(state, {
    op: 'DESTROY',
    types: ['Spirit', 'Ultimate'],
    mode: 'TOTAL_COST_LTE',
    maxTotalCost: 9
  }, context, promptResolver);

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2);
  assert.equal(state.players.opponent.field.length, 0);
});

test('9.4 ignoreArmor: true on mixed set with armored and unarmored spirits', async () => {
  const state = createGameState();
  const armored = createMockCard('ARM-001', 'Armored', {
    keywords: [{ name: 'Armor', parameter: 'Red' }]
  });
  const regular = createMockCard('REG-001', 'Regular');

  state.players.opponent.field = [
    createFieldStack(armored, { normal: 1, soul: 0 }),
    createFieldStack(regular, { normal: 1, soul: 0 })
  ];

  const sourceCard = createMockCard('SRC-001', 'Red Source', { owner: 'player', currentOwner: 'player', color: 'Red', colors: ['Red'] });
  state.players.player.field = [createFieldStack(sourceCard, { normal: 1, soul: 0 })];
  const context = { controller: 'player', sourceCard };

  const res = await executeOp(state, {
    op: 'DESTROY',
    all: true,
    ignoreArmor: true
  }, context, { choose: async () => [] });

  assert.equal(res.success, true);
  assert.equal(res.destroyedCount, 2, 'Both armored and unarmored spirits destroyed with ignoreArmor: true');
  assert.equal(state.players.opponent.field.length, 0);
});

test('9.5 BOUNCE to deck_top via PREVIOUS_TARGET', async () => {
  const state = createGameState();
  const targetCard = createMockCard('PREV-001', 'Target Card');
  state.players.opponent.field = [createFieldStack(targetCard, { normal: 1, soul: 0 })];
  state.players.opponent.deck = [createMockCard('D-001', 'Deck Card')];

  const context = {
    controller: 'player',
    sourceCard: createMockCard('SRC-001', 'Source'),
    previousTarget: targetCard,
    selectedTargets: [{ type: 'stack', stack: state.players.opponent.field[0], card: targetCard, zone: 'field' }]
  };

  const res = await executeOp(state, {
    op: 'BOUNCE',
    target: 'PREVIOUS_TARGET',
    destination: 'deck_top'
  }, context, { choose: async () => [] });

  assert.equal(res.success, true);
  assert.equal(state.players.opponent.field.length, 0);
  assert.equal(state.players.opponent.deck[0].id, 'PREV-001');
});

