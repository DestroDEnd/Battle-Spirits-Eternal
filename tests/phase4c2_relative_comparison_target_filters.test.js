/**
 * tests/phase4c2_relative_comparison_target_filters.test.js
 * 
 * Comprehensive regression and verification test suite for Phase 4C.2:
 * DEF-REL-TARGET-01: Relative BP/Cost/Core Comparison Target Filter Compiler Correction.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { splitClauses } from '../compiler/clause_splitter.js';
import { compileClauseToOp, parseRelativeComparison } from '../compiler/clause_patterns.js';
import { queryCandidates, evaluateComparison, executeTargeting } from '../engine/selectors.js';
import { canBlock, computeEffectiveBP } from '../engine/continuous.js';
import { AsyncResolver } from '../engine/resolver.js';

// Test Helpers
function makeCard(props = {}) {
  return {
    id: props.id || 'card_' + Math.random().toString(36).substring(2, 9),
    name: props.name || 'Sample Spirit',
    type: props.type || 'Spirit',
    cost: props.cost !== undefined ? props.cost : 3,
    bp: props.bp !== undefined ? props.bp : 4000,
    color: props.color || 'Red',
    symbols: props.symbols || ['Red'],
    families: props.families || ['AstralDragon'],
    owner: props.owner || 'player',
    levels: props.levels || {
      '1': { cost: 1, bp: props.bp || 4000 },
      '2': { cost: 3, bp: (props.bp || 4000) + 2000 }
    }
  };
}

function makeFieldStack(card, opts = {}) {
  const c = typeof card === 'string' ? makeCard({ id: card }) : card;
  return {
    id: 'stack_' + c.id,
    top: c,
    card: c,
    owner: opts.owner || c.owner || 'player',
    controller: opts.owner || c.owner || 'player',
    state: opts.state || 'REFRESHED',
    cores: opts.cores !== undefined ? opts.cores : 1,
    level: opts.level || 1,
    braves: opts.braves || []
  };
}

function makeGameState() {
  return {
    players: {
      player: {
        field: [],
        nexus: [],
        hand: [],
        grave: [],
        trash: [],
        revealed: [],
        removed: [],
        void: 100,
        reserve: 5,
        life: 5
      },
      opponent: {
        field: [],
        nexus: [],
        hand: [],
        grave: [],
        trash: [],
        revealed: [],
        removed: [],
        void: 100,
        reserve: 5,
        life: 5
      }
    },
    combat: null,
    modifiers: []
  };
}

class MockPromptResolver {
  constructor(chooseFn) {
    this.chooseFn = chooseFn;
  }
  async choose(prompt) {
    if (this.chooseFn) return this.chooseFn(prompt);
    return prompt.candidates || [];
  }
}

// =========================================================================
// 1. COMPILER TESTS
// =========================================================================

test('1.1 Compiler correctly parses relative BP comparison (LTE) on DESTROY', () => {
  const text = "Destroy an opposing Spirit with BP equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  assert.equal(clauses.length, 1);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'DESTROY');
  assert.equal(op.count, 1);
  assert.deepEqual(op.target.types, ['Spirit']);
  assert.equal(op.target.side, 'opp');
  assert.deepEqual(op.target.filters.comparison, {
    property: 'BP',
    operator: 'LTE',
    reference: 'self'
  });
});

test('1.2 Compiler correctly parses relative Cost comparison (LTE) with target Spirit reference', () => {
  const text = "Target an opposing Spirit with a cost equal or inferior to that Spirit's. Destroy it.";
  const clauses = splitClauses(text);
  assert.equal(clauses.length, 2);

  const targetOp = compileClauseToOp(clauses[0]);
  assert.equal(targetOp.op, 'TARGET');
  assert.equal(targetOp.target.side, 'opp');
  assert.deepEqual(targetOp.target.filters.comparison, {
    property: 'COST',
    operator: 'LTE',
    reference: 'target'
  });

  const destroyOp = compileClauseToOp(clauses[1]);
  assert.equal(destroyOp.op, 'DESTROY');
  assert.equal(destroyOp.target, 'PREVIOUS_TARGET');
});

test('1.3 Compiler correctly parses relative Core comparison on EXHAUST with multi-type target', () => {
  const text = "Exhaust all opposing Spirits/Nexuses with a number of cores on them equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'EXHAUST');
  assert.equal(op.count, 'ALL');
  assert.deepEqual(op.target.types, ['Spirit', 'Nexus']);
  assert.equal(op.target.side, 'opp');
  assert.deepEqual(op.target.filters.comparison, {
    property: 'CORES',
    operator: 'LTE',
    reference: 'self'
  });
});

test('1.4 Compiler correctly parses strict LT comparison on UNBLOCKABLE', () => {
  const text = "This Ultimate can't be blocked by opposing Spirits/Ultimates with LV inferior to this Ultimate's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'UNBLOCKABLE');
  assert.equal(op.target, 'self');
  assert.deepEqual(op.filter.types, ['Spirit', 'Ultimate']);
  assert.deepEqual(op.filter.filters.comparison, {
    property: 'LEVEL',
    operator: 'LT',
    reference: 'self'
  });
});

test('1.5 Compiler preserves coexisting static filters (e.g. EXHAUSTED) alongside comparison', () => {
  const text = "You can banish up to three opposing exhausted Spirits/Ultimates with a BP equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'DESTROY');
  assert.equal(op.count, 3);
  assert.equal(op.upTo, true);
  assert.deepEqual(op.target.types, ['Spirit', 'Ultimate']);
  assert.equal(op.target.filters.state, 'EXHAUSTED');
  assert.deepEqual(op.target.filters.comparison, {
    property: 'BP',
    operator: 'LTE',
    reference: 'self'
  });
});

test('1.6 Compiler parses relative cost comparison on BOUNCE to deckbottom', () => {
  const text = "Return an opposing Spirit/Ultimate with a cost equal or inferior to that target's to the deckbottom.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'BOUNCE');
  assert.equal(op.destination, 'DECK_BOTTOM');
  assert.deepEqual(op.target.types, ['Spirit', 'Ultimate']);
  assert.deepEqual(op.target.filters.comparison, {
    property: 'COST',
    operator: 'LTE',
    reference: 'target'
  });
});

test('1.7 Compiler correctly parses symbol count comparison', () => {
  const text = "Destroy an opposing Spirit/Ultimate with a number of symbols equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'DESTROY');
  assert.deepEqual(op.target.filters.comparison, {
    property: 'SYMBOLS',
    operator: 'LTE',
    reference: 'self'
  });
});

// =========================================================================
// 2. ENGINE RUNTIME TESTS
// =========================================================================

test('2.1 Engine selectors: filters candidates by dynamic BP <= source Spirit BP', () => {
  const state = makeGameState();
  const sourceCard = makeCard({ id: 'src_card', bp: 5000, cost: 4 });
  const sourceStack = makeFieldStack(sourceCard, { owner: 'player', cores: 1 });
  state.players.player.field.push(sourceStack);

  const opp1 = makeFieldStack(makeCard({ id: 'opp_weak', bp: 3000, cost: 3 }), { owner: 'opponent' });
  const opp2 = makeFieldStack(makeCard({ id: 'opp_equal', bp: 5000, cost: 5 }), { owner: 'opponent' });
  const opp3 = makeFieldStack(makeCard({ id: 'opp_strong', bp: 6000, cost: 6 }), { owner: 'opponent' });
  state.players.opponent.field.push(opp1, opp2, opp3);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'BP', operator: 'LTE', reference: 'self' }
    }
  };

  const candidates = queryCandidates(state, selector, {
    controller: 'player',
    sourceStack,
    sourceCard
  });

  const ids = candidates.map(c => c.card.id);
  assert.deepEqual(ids, ['opp_weak', 'opp_equal']);
  assert.equal(ids.includes('opp_strong'), false);
});

test('2.2 Engine selectors: strict LT excludes candidate with equal BP', () => {
  const state = makeGameState();
  const sourceCard = makeCard({ id: 'src_card', bp: 5000 });
  const sourceStack = makeFieldStack(sourceCard, { owner: 'player' });
  state.players.player.field.push(sourceStack);

  const opp1 = makeFieldStack(makeCard({ id: 'opp_4000', bp: 4000 }), { owner: 'opponent' });
  const opp2 = makeFieldStack(makeCard({ id: 'opp_5000', bp: 5000 }), { owner: 'opponent' });
  state.players.opponent.field.push(opp1, opp2);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'BP', operator: 'LT', reference: 'self' }
    }
  };

  const candidates = queryCandidates(state, selector, {
    controller: 'player',
    sourceStack,
    sourceCard
  });

  const ids = candidates.map(c => c.card.id);
  assert.deepEqual(ids, ['opp_4000']);
  assert.equal(ids.includes('opp_5000'), false);
});

test('2.3 Engine selectors: filters candidates by dynamic cost <= target Spirit cost', () => {
  const state = makeGameState();
  const targetCard = makeCard({ id: 'tgt_spirit', cost: 4 });
  const targetStack = makeFieldStack(targetCard, { owner: 'player' });

  const opp1 = makeFieldStack(makeCard({ id: 'opp_cost2', cost: 2 }), { owner: 'opponent' });
  const opp2 = makeFieldStack(makeCard({ id: 'opp_cost4', cost: 4 }), { owner: 'opponent' });
  const opp3 = makeFieldStack(makeCard({ id: 'opp_cost6', cost: 6 }), { owner: 'opponent' });
  state.players.opponent.field.push(opp1, opp2, opp3);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'COST', operator: 'LTE', reference: 'target' }
    }
  };

  const candidates = queryCandidates(state, selector, {
    controller: 'player',
    previousTarget: targetStack
  });

  const ids = candidates.map(c => c.card.id);
  assert.deepEqual(ids, ['opp_cost2', 'opp_cost4']);
  assert.equal(ids.includes('opp_cost6'), false);
});

test('2.4 Engine selectors: filters candidates by core count <= source Spirit cores', () => {
  const state = makeGameState();
  const sourceCard = makeCard({ id: 'src_card' });
  const sourceStack = makeFieldStack(sourceCard, { owner: 'player', cores: 2 });
  state.players.player.field.push(sourceStack);

  const opp1 = makeFieldStack(makeCard({ id: 'opp_1core' }), { owner: 'opponent', cores: 1 });
  const opp2 = makeFieldStack(makeCard({ id: 'opp_2cores' }), { owner: 'opponent', cores: 2 });
  const opp3 = makeFieldStack(makeCard({ id: 'opp_3cores' }), { owner: 'opponent', cores: 3 });
  state.players.opponent.field.push(opp1, opp2, opp3);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'CORES', operator: 'LTE', reference: 'self' }
    }
  };

  const candidates = queryCandidates(state, selector, {
    controller: 'player',
    sourceStack,
    sourceCard
  });

  const ids = candidates.map(c => c.card.id);
  assert.deepEqual(ids, ['opp_1core', 'opp_2cores']);
  assert.equal(ids.includes('opp_3cores'), false);
});

test('2.5 Engine selectors: dynamic BP modifier on source updates candidate eligibility dynamically', () => {
  const state = makeGameState();
  const sourceCard = makeCard({ id: 'src_card', bp: 4000 });
  const sourceStack = makeFieldStack(sourceCard, { owner: 'player' });
  state.players.player.field.push(sourceStack);

  const opp5000 = makeFieldStack(makeCard({ id: 'opp_5000', bp: 5000 }), { owner: 'opponent' });
  state.players.opponent.field.push(opp5000);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'BP', operator: 'LTE', reference: 'self' }
    }
  };

  // Initially: source is 4000 BP, opp is 5000 BP -> no candidate
  let candidates = queryCandidates(state, selector, { controller: 'player', sourceStack, sourceCard });
  assert.equal(candidates.length, 0);

  // Apply continuous +2000 BP buff modifier to sourceStack
  state.modifiers.push({
    type: 'BP_BUFF',
    amount: 2000,
    targetStackId: sourceStack.id
  });

  // Now: source effective BP is 6000 BP -> opp_5000 matches!
  candidates = queryCandidates(state, selector, { controller: 'player', sourceStack, sourceCard });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].card.id, 'opp_5000');
});

test('2.6 Engine selectors: missing or unresolvable reference yields 0 candidates safely', () => {
  const state = makeGameState();
  const opp1 = makeFieldStack(makeCard({ id: 'opp_1', bp: 3000 }), { owner: 'opponent' });
  state.players.opponent.field.push(opp1);

  const selector = {
    side: 'opp',
    types: ['Spirit'],
    filters: {
      comparison: { property: 'BP', operator: 'LTE', reference: 'target' } // no previous target!
    }
  };

  const candidates = queryCandidates(state, selector, {
    controller: 'player',
    previousTarget: null
  });

  assert.equal(candidates.length, 0);
});

test('2.7 Engine combat: UNBLOCKABLE modifier with core comparison prevents lower-core blocker', () => {
  const state = makeGameState();
  const attackerCard = makeCard({ id: 'attacker', bp: 7000 });
  const attackerStack = makeFieldStack(attackerCard, { owner: 'player', cores: 3 });
  state.players.player.field.push(attackerStack);

  const weakBlockerCard = makeCard({ id: 'weak_blocker', bp: 8000 });
  const weakBlockerStack = makeFieldStack(weakBlockerCard, { owner: 'opponent', cores: 2 });

  const heavyBlockerCard = makeCard({ id: 'heavy_blocker', bp: 8000 });
  const heavyBlockerStack = makeFieldStack(heavyBlockerCard, { owner: 'opponent', cores: 4 });

  state.players.opponent.field.push(weakBlockerStack, heavyBlockerStack);

  state.combat = {
    attackerStackId: attackerStack.id,
    attackerSide: 'player'
  };

  // Add UNBLOCKABLE modifier to attacker: cannot be blocked by spirits with cores <= attacker cores
  state.modifiers.push({
    type: 'UNBLOCKABLE',
    targetStackId: attackerStack.id,
    side: 'player',
    filter: {
      types: ['Spirit'],
      filters: {
        comparison: { property: 'CORES', operator: 'LTE', reference: 'self' }
      }
    }
  });

  // weakBlocker has 2 cores (<= 3): cannot block!
  assert.equal(canBlock(state, weakBlockerStack), false);

  // heavyBlocker has 4 cores (> 3): CAN block!
  assert.equal(canBlock(state, heavyBlockerStack), true);
});

// =========================================================================
// 3. REAL-CARD VALIDATION TESTS (Canonical 235 Inventory)
// =========================================================================

test('3.1 26RBS02-X16#a1: Target opposing Spirit with cost <= that Spirit\'s, destroy it', async () => {
  const text = "When your \"Cyantree\" family Spirit that is originally Nexus exhausts, you can target an opposing Spirit with a cost equal or inferior to that Spirit's. Destroy it.";
  const clauses = splitClauses(text);
  assert.equal(clauses.length, 2);

  const op1 = compileClauseToOp(clauses[0]);
  const op2 = compileClauseToOp(clauses[1]);

  assert.equal(op1.op, 'TARGET');
  assert.deepEqual(op1.target.filters.comparison, {
    property: 'COST',
    operator: 'LTE',
    reference: 'target'
  });
  assert.equal(op2.op, 'DESTROY');
  assert.equal(op2.target, 'PREVIOUS_TARGET');
});

test('3.2 BSCO-003#a0: Destroy an opposing Spirit with BP equal or inferior to this Spirit\'s', async () => {
  const text = "Destroy an opposing Spirit with BP equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'DESTROY');
  assert.equal(op.count, 1);
  assert.deepEqual(op.target.filters.comparison, {
    property: 'BP',
    operator: 'LTE',
    reference: 'self'
  });
});

test('3.3 BSCO-023#a1: Exhaust an opposing Spirit with a cost equal or inferior to this Spirit\'s', async () => {
  const text = "Exhaust an opposing Spirit with a cost equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'EXHAUST');
  assert.equal(op.count, 1);
  assert.deepEqual(op.target.filters.comparison, {
    property: 'COST',
    operator: 'LTE',
    reference: 'self'
  });
});

test('3.4 BRAVE-TIGER#a0: Destroy an opposing Spirit with BP equal or inferior to this Spirit\'s', async () => {
  const text = "Destroy an opposing Spirit with BP equal or inferior to this Spirit's.";
  const clauses = splitClauses(text);
  const op = compileClauseToOp(clauses[0]);

  assert.equal(op.op, 'DESTROY');
  assert.deepEqual(op.target.filters.comparison, {
    property: 'BP',
    operator: 'LTE',
    reference: 'self'
  });
});

test('3.5 BS41-068#a0: Destroy opposing Spirit/Ultimate with cost <= discarded card', async () => {
  const text = "Draw a card. Then, discard a cards from your Hand. Destroy an opposing Spirit/Ultimate with a cost equal or inferior to that of the card discarded by this effect.";
  const clauses = splitClauses(text);
  assert.equal(clauses.length, 3);

  const destroyOp = compileClauseToOp(clauses[2]);
  assert.equal(destroyOp.op, 'DESTROY');
  assert.deepEqual(destroyOp.target.types, ['Spirit', 'Ultimate']);
  assert.deepEqual(destroyOp.target.filters.comparison, {
    property: 'COST',
    operator: 'LTE',
    reference: 'effect_card'
  });
});

test('3.6 CB15-X03#a1: Exhaust all opposing Spirits/Nexuses with cores <= this Spirit\'s', async () => {
  const text = "Exhaust all opposing Spirits/Nexuses with a number of cores on them equal or inferior to this Spirit's. Then, return two opposing exhausted Spirits/Nexuses to the deckbottom.";
  const clauses = splitClauses(text);
  assert.equal(clauses.length, 2);

  const exhaustOp = compileClauseToOp(clauses[0]);
  assert.equal(exhaustOp.op, 'EXHAUST');
  assert.equal(exhaustOp.count, 'ALL');
  assert.deepEqual(exhaustOp.target.types, ['Spirit', 'Nexus']);
  assert.deepEqual(exhaustOp.target.filters.comparison, {
    property: 'CORES',
    operator: 'LTE',
    reference: 'self'
  });
});

test('3.7 All 235 confirmed affected abilities compile with comparison filters (100% Coverage)', async () => {
  const fs = await import('fs');
  const records = JSON.parse(fs.readFileSync('scratch/def_rel_target_235.json', 'utf8'));
  assert.equal(records.length, 235);

  let successCount = 0;
  for (const r of records) {
    const clauses = splitClauses(r.originalText);
    const ops = clauses.map(c => compileClauseToOp(c)).filter(Boolean);
    const hasComp = ops.some(op =>
      op.target?.filters?.comparison ||
      op.filter?.filters?.comparison ||
      op.filter?.comparison ||
      op.grantedOp?.target?.filters?.comparison
    );
    if (hasComp) successCount++;
  }

  assert.equal(successCount, 235);
});
