import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { FlowController } from '../engine/flow.js';
import { resolveTargets, evaluateComparisonStrict } from '../engine/selectors.js';
import {
  CONDITION_RESULT,
  CONDITION_TYPES,
  evaluateStructuredCondition,
  parseConditionToStructured
} from '../engine/conditions.js';
import {
  computeEffectiveBP,
  computeSymbols,
  pruneExpiredModifiers,
  isActionRestricted,
  isTargetProtectedFrom
} from '../engine/continuous.js';

function loadShardCard(shardFile, cardNumber) {
  const raw = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const card = raw[cardNumber];
  assert.ok(card, `Card ${cardNumber} must exist in ${shardFile}`);
  return JSON.parse(JSON.stringify(card));
}

function makeUnit(id, overrides = {}) {
  return {
    id,
    cardNumber: overrides.cardNumber || id.toUpperCase(),
    name: overrides.name || id,
    type: overrides.type || 'Spirit',
    color: overrides.color || 'Red',
    cost: overrides.cost ?? 3,
    bp: overrides.bp ?? 4000,
    levels: overrides.levels || { 1: { cost: 1, bp: overrides.bp ?? 4000 }, 2: { cost: 3, bp: (overrides.bp ?? 4000) + 3000 } },
    owner: overrides.owner || 'player',
    controller: overrides.controller || overrides.owner || 'player',
    ...overrides
  };
}

class DeterministicPromptResolver {
  constructor(picker = null) {
    this.picker = picker;
  }
  async choose(prompt) {
    if (this.picker) return this.picker(prompt);
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = typeof prompt.count === 'number' ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0 };
  }
}

// ============================================================================
// PART 1 (F1-F4): UNIFIED TARGETING, RELATIVE COMPARISONS & STALE CONTEXT
// ============================================================================

test('WPFG-F1: resolveTargets supports highest/lowest BP with tie choice, upTo, all, and invalid selection rejection', async () => {
  const state = createGameState();
  const s0 = createFieldStack(makeUnit('f1_s0', { owner: 'opponent', bp: 3000, cost: 2 }), { normal: 1 });
  const s1 = createFieldStack(makeUnit('f1_s1', { owner: 'opponent', bp: 3000, cost: 2 }), { normal: 1 });
  const s2 = createFieldStack(makeUnit('f1_s2', { owner: 'opponent', bp: 8000, cost: 5 }), { normal: 1 });
  const s3 = createFieldStack(makeUnit('f1_s3', { owner: 'opponent', bp: 8000, cost: 6 }), { normal: 1 });
  state.players.opponent.field.push(s0, s1, s2, s3);

  // Highest BP tie: player picks second tied candidate (s3)
  const tieRes = await resolveTargets(
    state,
    { side: 'opp', zone: 'field', types: ['Spirit'], highest: 'bp', count: 1 },
    { controller: 'player' },
    new DeterministicPromptResolver(p => [p.candidates[1]])
  );
  assert.equal(tieRes.status, 'SUCCESS');
  assert.equal(tieRes.cards.length, 1);
  assert.equal(tieRes.cards[0].id, 'f1_s3');

  // Highest BP with all: true selects both tied 8000 BP Spirits
  const allTieRes = await resolveTargets(
    state,
    { side: 'opp', zone: 'field', types: ['Spirit'], highest: 'bp', all: true },
    { controller: 'player' },
    new DeterministicPromptResolver()
  );
  assert.equal(allTieRes.status, 'SUCCESS');
  assert.equal(allTieRes.cards.length, 2);

  // Invalid player selection rejected
  const badRes = await resolveTargets(
    state,
    { side: 'opp', zone: 'field', types: ['Spirit'], lowest: 'bp', count: 1 },
    { controller: 'player' },
    new DeterministicPromptResolver(() => [{ card: makeUnit('not_legal') }])
  );
  assert.equal(badRes.status, 'REJECTED');
  assert.equal(badRes.reason, 'INVALID_TARGET_SELECTION');
});

test('WPFG-F2: Stale previousTarget and selectedTargets clear on failed or declined targeting clause', async () => {
  const state = createGameState();
  const events = new EventBus();
  const resolver = new AsyncResolver(new DeterministicPromptResolver(() => ({ declined: true })), events);

  const s1 = createFieldStack(makeUnit('f2_s1', { owner: 'opponent', bp: 2000 }), { normal: 1 });
  const src = createFieldStack(makeUnit('f2_src', { owner: 'player', bp: 5000 }), { normal: 1 });
  state.players.opponent.field.push(s1);
  state.players.player.field.push(src);

  const ability = {
    id: 'fg_stale_ctx_test',
    header: { timing: 'WHEN_SUMMONED', level: 1 },
    clauses: [
      {
        id: 'c1',
        op: { op: 'TARGET_SELECT', side: 'opp', zone: 'field', types: ['Spirit'], count: 1 },
        isOptional: true
      },
      {
        id: 'c2',
        op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' }
      }
    ]
  };

  const ctx = {
    controller: 'player',
    sourceCard: src.top,
    sourceStack: src,
    previousTarget: s1.top,
    previousTargets: [s1.top],
    selectedTargets: [{ stack: s1, card: s1.top }]
  };
  const res = await resolver.resolveAbility(state, ability, ctx, events);
  assert.equal(res.context.previousTarget, null);
  assert.deepEqual(res.context.previousTargets, []);
  assert.equal(state.players.opponent.field.length, 1, 'Declined optional target must not destroy stale previousTarget');
});

test('WPFG-F3: evaluateComparisonStrict handles effective BP/Cost/Symbols and fails closed on missing reference', () => {
  const state = createGameState();
  const src = createFieldStack(makeUnit('f3_src', { owner: 'player', bp: 4000, cost: 3 }), { normal: 1 });
  const opp = createFieldStack(makeUnit('f3_opp', { owner: 'opponent', bp: 6000, cost: 4 }), { normal: 1 });
  state.players.player.field.push(src);
  state.players.opponent.field.push(opp);

  // Buff src effective BP from 4000 -> 7000
  state.modifiers.push({ type: 'BP_BUFF', targetStackId: src.id, amount: 3000, duration: 'THIS_TURN' });

  const passRes = evaluateComparisonStrict(
    state,
    { property: 'BP', operator: 'LTE', reference: 'self' },
    { stack: opp, card: opp.top, side: 'opponent' },
    { sourceStack: src, sourceCard: src.top, controller: 'player' }
  );
  assert.equal(passRes, 'TRUE');

  const missingRef = evaluateComparisonStrict(
    state,
    { property: 'BP', operator: 'LTE', reference: 'previous_target' },
    { stack: opp, card: opp.top, side: 'opponent' },
    { sourceStack: src, sourceCard: src.top, controller: 'player' }
  );
  assert.equal(missingRef, 'FALSE');
});

// ============================================================================
// PART 2 (F5-F7): STRUCTURED CONDITIONS & TRI-STATE SEMANTICS
// ============================================================================

test('WPFG-F5: New structured conditions evaluate accurately across TRUE, FALSE, and UNSUPPORTED', () => {
  const state = createGameState();
  const blue1 = createFieldStack(makeUnit('f5_b1', { owner: 'player', color: 'Blue', symbols: { Blue: 2 } }), { normal: 1 });
  const white1 = createFieldStack(makeUnit('f5_w1', { owner: 'player', color: 'White', symbols: { White: 1 } }), { normal: 1 });
  state.players.player.field.push(blue1, white1);
  state.players.opponent.reserve.normal = 3;
  state.players.player.removed.push(makeUnit('f5_rem', { owner: 'player' }));
  state.turnStats = { attacksDeclared: 1, blocksDeclared: 0 };

  // 1. COLOR_SYMBOL numeric count
  assert.equal(
    evaluateStructuredCondition(state, 'If you control two or more Blue symbols', { controller: 'player' }).result,
    CONDITION_RESULT.TRUE
  );
  assert.equal(
    evaluateStructuredCondition(state, 'If you control three or more White symbols', { controller: 'player' }).result,
    CONDITION_RESULT.FALSE
  );

  // 2. RESERVE_CORE_THRESHOLD
  assert.equal(
    evaluateStructuredCondition(state, 'If there are three or more cores in the opposing Reserve', { controller: 'player' }).result,
    CONDITION_RESULT.TRUE
  );
  assert.equal(
    evaluateStructuredCondition(state, 'If there are five or more cores in the opposing Reserve', { controller: 'player' }).result,
    CONDITION_RESULT.FALSE
  );

  // 3. STACK_STATE
  blue1.state = 'REFRESHED';
  assert.equal(
    evaluateStructuredCondition(state, 'If it is refreshed', { controller: 'player', sourceStack: blue1, sourceCard: blue1.top }).result,
    CONDITION_RESULT.TRUE
  );
  blue1.state = 'EXHAUSTED';
  assert.equal(
    evaluateStructuredCondition(state, 'If it is refreshed', { controller: 'player', sourceStack: blue1, sourceCard: blue1.top }).result,
    CONDITION_RESULT.FALSE
  );

  // 4. CARD_ZONE_STATE (Removed Zone)
  assert.equal(
    evaluateStructuredCondition(state, 'While this card is in your Removed Zone', { controller: 'player', sourceCard: state.players.player.removed[0] }).result,
    CONDITION_RESULT.TRUE
  );

  // 5. BP_ZERO
  const zeroTarget = createFieldStack(makeUnit('f5_z', { owner: 'opponent', bp: 0 }), { normal: 1 });
  assert.equal(
    evaluateStructuredCondition(state, 'if they have 0 BP', { controller: 'player', previousTarget: zeroTarget }).result,
    CONDITION_RESULT.TRUE
  );

  // 6. TURN_HISTORY
  assert.equal(
    evaluateStructuredCondition(state, 'If this is the first attack of the turn', { controller: 'player' }).result,
    CONDITION_RESULT.TRUE
  );

  // 7. Unknown / unsupported condition fails closed as UNSUPPORTED
  const parsedUnknown = parseConditionToStructured('If the moon aligns with Mars');
  assert.equal(parsedUnknown, null);
  assert.equal(
    evaluateStructuredCondition(state, 'If the moon aligns with Mars', { controller: 'player' }).result,
    CONDITION_RESULT.UNSUPPORTED
  );
});

// ============================================================================
// PART 3 (G1-G7): CONTINUOUS EFFECTS, LAYERS, RESTRICTIONS, IMMUNITY & LIFECYCLE
// ============================================================================

test('WPFG-G1: Continuous layer ordering applies SET_LEVEL before BP_BUFF and deactivates WHILE_SOURCE_IN_ZONE when source leaves', () => {
  const state = createGameState();
  const src = createFieldStack(makeUnit('g1_src', { owner: 'player', bp: 3000 }), { normal: 1 });
  const target = createFieldStack(makeUnit('g1_tgt', { owner: 'player', bp: 4000 }), { normal: 1 });
  state.players.player.field.push(src, target);

  // Push BP_BUFF first, SET_LEVEL second to verify layer sorting overrides insertion order
  state.modifiers.push(
    { id: 'm_buff', type: 'BP_BUFF', targetStackId: target.id, amount: 2000, duration: 'WHILE_SOURCE_IN_ZONE', sourceCardId: src.top.id, sourceZone: 'field' },
    { id: 'm_setlv', type: 'SET_LEVEL', targetStackId: target.id, setLevel: 2, duration: 'THIS_TURN' }
  );

  // Layer 1 SET_LEVEL (LV2 = 7000), then Layer 2 BP_BUFF +2000 => 9000
  assert.equal(computeEffectiveBP(state, target), 9000);

  // Remove source from field and prune SOURCE_DEPARTURE -> WHILE_SOURCE_IN_ZONE modifier deactivates cleanly
  state.players.player.field = [target];
  pruneExpiredModifiers(state, 'SOURCE_DEPARTURE');
  assert.equal(computeEffectiveBP(state, target), 7000);

  // Prune THIS_TURN modifiers
  pruneExpiredModifiers(state, 'TURN');
  assert.equal(computeEffectiveBP(state, target), 4000);
});

test('WPFG-G3: Authoritative isActionRestricted and isTargetProtectedFrom enforce rules uniformly', async () => {
  const state = createGameState();
  const pCard = createFieldStack(makeUnit('g3_p', { owner: 'player', bp: 4000 }), { normal: 1 });
  const oCard = createFieldStack(makeUnit('g3_o', { owner: 'opponent', bp: 4000 }), { normal: 1 });
  state.players.player.field.push(pCard);
  state.players.opponent.field.push(oCard);
  state.players.player.deck.push(makeUnit('g3_d1'));

  state.modifiers.push(
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_DRAW', side: 'player', duration: 'THIS_TURN' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_REFRESH', side: 'player', targetStackId: pCard.id, duration: 'THIS_STEP' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_ACTIVATE_BURST', side: 'player', duration: 'THIS_TURN' },
    { type: 'PROTECTION', targetStackId: oCard.id, cannotBeBounced: true, cannotBeTargeted: true, duration: 'THIS_TURN' },
    { type: 'INDESTRUCTIBLE', targetStackId: pCard.id, duration: 'THIS_TURN' }
  );

  assert.equal(isActionRestricted(state, 'CANNOT_DRAW', 'player'), true);
  assert.equal(isActionRestricted(state, 'CANNOT_REFRESH', 'player', pCard), true);
  assert.equal(isActionRestricted(state, 'CANNOT_ACTIVATE_BURST', 'player'), true);

  assert.equal(isTargetProtectedFrom(state, oCard, 'bounce', pCard.top), true);
  assert.equal(isTargetProtectedFrom(state, oCard, 'target', pCard.top), true);
  assert.equal(isTargetProtectedFrom(state, pCard, 'destroy', oCard.top), true);
  assert.equal(isTargetProtectedFrom(state, pCard, 'bounce', oCard.top), false);

  // Verify DRAW op respects centralized restriction
  const drawRes = await executeOp(state, { op: 'DRAW', count: 1 }, { controller: 'player' }, null, new EventBus());
  assert.equal(drawRes.success, false);
  assert.equal(drawRes.reason, 'DRAW_RESTRICTED');

  // Verify REFRESH op and FlowController respect CANNOT_REFRESH
  pCard.state = 'EXHAUSTED';
  const refRes = await executeOp(state, { op: 'REFRESH', target: 'self' }, { controller: 'player', sourceStack: pCard, sourceCard: pCard.top }, null, new EventBus());
  assert.equal(refRes.success, false);
  assert.equal(refRes.reason, 'REFRESH_RESTRICTED');

  // Prune THIS_STEP clears CANNOT_REFRESH while keeping THIS_TURN locks
  pruneExpiredModifiers(state, 'STEP');
  assert.equal(isActionRestricted(state, 'CANNOT_REFRESH', 'player', pCard), false);
  assert.equal(isActionRestricted(state, 'CANNOT_DRAW', 'player'), true);
});

test('WPFG-G6: Large-set effective-stat & restriction evaluation meets performance target (< 500ms for 200 stacks)', () => {
  const state = createGameState();
  for (let i = 0; i < 200; i++) {
    const st = createFieldStack(makeUnit(`perf_${i}`, { owner: i % 2 === 0 ? 'player' : 'opponent', bp: 3000 + i * 10 }), { normal: 1 });
    state.players[st.owner].field.push(st);
  }
  state.modifiers.push(
    { type: 'BP_BUFF', side: 'player', amount: 1000, duration: 'THIS_TURN' },
    { type: 'SET_RESTRICTION', restriction: 'CANNOT_BLOCK', side: 'opponent', duration: 'THIS_TURN' }
  );

  const t0 = performance.now();
  let sumBp = 0;
  for (const st of [...state.players.player.field, ...state.players.opponent.field]) {
    sumBp += computeEffectiveBP(state, st);
    isActionRestricted(state, 'CANNOT_BLOCK', st.owner, st);
  }
  const elapsed = performance.now() - t0;
  assert.ok(sumBp > 0);
  assert.ok(elapsed < 500, `Expected < 500ms for 200 stacks, got ${elapsed.toFixed(2)}ms`);
});

// ============================================================================
// PART 4: CONSOLIDATED F/G + D/E INTEGRATION (FLOW + OPS + CONTINUOUS)
// ============================================================================

test('WPFG-INT: Continuous BP debuff enables threshold DESTROY and FlowController respects CANNOT_REFRESH', async () => {
  const state = createGameState();
  const events = new EventBus();
  const flow = new FlowController(state, events);

  const pStack = createFieldStack(makeUnit('int_p', { owner: 'player', bp: 5000 }), { normal: 1 });
  pStack.state = 'EXHAUSTED';
  const oStack = createFieldStack(makeUnit('int_o', { owner: 'opponent', bp: 5000 }), { normal: 1 });
  state.players.player.field.push(pStack);
  state.players.opponent.field.push(oStack);

  // Lock pStack from refreshing during Refresh Step
  state.modifiers.push({ type: 'CANNOT_REFRESH', side: 'player', targetStackId: pStack.id, duration: 'THIS_TURN' });
  state.phase = 'START_STEP';
  state.turnPlayer = 'player';
  await flow.advanceStep();
  assert.equal(pStack.state, 'EXHAUSTED', 'CANNOT_REFRESH modifier must block Refresh Step');

  // Debuff oStack from 5000 -> 2000, then DESTROY with bpLte: 3000
  state.modifiers.push({ type: 'BP_DEBUFF', targetStackId: oStack.id, amount: 3000, duration: 'THIS_TURN' });
  assert.equal(computeEffectiveBP(state, oStack), 2000);

  const destRes = await executeOp(
    state,
    { op: 'DESTROY', side: 'opp', types: ['Spirit'], filter: { bpLte: 3000 }, count: 1 },
    { controller: 'player', sourceCard: pStack.top, sourceStack: pStack },
    new DeterministicPromptResolver(),
    events
  );
  assert.equal(destRes.success, true);
  assert.equal(state.players.opponent.field.length, 0);
});

// ============================================================================
// PART 5: 24 REAL-CARD F/G END-TO-END CASES FROM IR SHARDS
// ============================================================================

const REAL_FG_CARD_CASES = [
  { sf: '26RBS01.json', cn: '26RBS01-063', kind: 'cond', setup: (state, src) => {
    const ally = createFieldStack(makeUnit('ally_topaz', { owner: 'player', family: ['Topaz'], families: ['Topaz'] }), { normal: 1 });
    ally.state = 'EXHAUSTED';
    state.players.player.field.push(ally);
    state.players.player.reserve.normal = 2;
  }},
  { sf: '26RBS01.json', cn: '26RBS01-069', kind: 'cond', setup: (state) => {
    state.players.opponent.field.push(createFieldStack(makeUnit('o1', { owner: 'opponent', bp: 2000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-058', kind: 'cond', setup: (state) => {
    state.players.player.field.push(
      createFieldStack(makeUnit('w1', { owner: 'player', color: 'White', symbols: { White: 2 } }), { normal: 1 }),
      createFieldStack(makeUnit('w2', { owner: 'player', color: 'White', symbols: { White: 1 } }), { normal: 1 })
    );
    state.players.player.deck.push(makeUnit('d1'), makeUnit('d2'));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-010', kind: 'cond', setup: (state) => {
    const ally = createFieldStack(makeUnit('ally_wf', { owner: 'player', family: ['Windfang'], families: ['Windfang'] }), { normal: 1 });
    ally.state = 'EXHAUSTED';
    state.players.player.field.push(ally);
    state.players.opponent.field.push(createFieldStack(makeUnit('o2', { owner: 'opponent', bp: 3000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-X14', kind: 'cond', setup: (state) => {
    state.players.opponent.field.push(createFieldStack(makeUnit('o3', { owner: 'opponent', bp: 1000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-066', kind: 'cond', setup: (state) => {
    state.players.opponent.field.push(createFieldStack(makeUnit('o4', { owner: 'opponent', bp: 2000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-035', kind: 'mod', setup: (state, src) => { src.state = 'REFRESHED'; } },
  { sf: '26RBS01.json', cn: '26RBS01-062', kind: 'mod', setup: () => {} },
  { sf: '26RBS01.json', cn: '26RBS01-040', kind: 'mod', setup: (state, src) => { src.state = 'REFRESHED'; } },
  { sf: '26RBS01.json', cn: '26RBS01-022', kind: 'mod', setup: () => {} },
  { sf: '26RBS01.json', cn: '26RBS01-050', kind: 'mod', setup: () => {} },
  { sf: '26RBS02.json', cn: '26RBS02-001', kind: 'restr', setup: (state, src) => { src.top.bp = 2000; } },
  { sf: '26RBS02.json', cn: '26RBS02-081', kind: 'restr', setup: () => {} },
  { sf: '26RBS03.json', cn: '26RBS03-046', kind: 'restr', setup: () => {} },
  { sf: '26RBS03.json', cn: '26RBS03-001', kind: 'restr', setup: () => {} },
  { sf: '26RBS02.json', cn: '26RBS02-X13', kind: 'imm', setup: () => {} },
  { sf: '26RBS03.json', cn: '26RBS03-036', kind: 'imm', setup: () => {} },
  { sf: 'BATTLE.json', cn: 'P14-21', kind: 'imm', setup: () => {} },
  { sf: 'BATTLE.json', cn: 'BSCO-019', kind: 'imm', setup: (state) => {
    state.players.player.grave.push(makeUnit('sm1', { owner: 'player', family: ['Supreme Marquis'], families: ['Supreme Marquis'] }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-016', kind: 'target', setup: (state, src) => {
    src.state = 'REFRESHED';
    state.players.opponent.field.push(createFieldStack(makeUnit('o5', { owner: 'opponent', bp: 3000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-008', kind: 'target', setup: (state) => {
    state.players.opponent.field.push(createFieldStack(makeUnit('o6', { owner: 'opponent', bp: 3000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-118', kind: 'target', setup: (state, src) => {
    src.state = 'EXHAUSTED';
    state.turnPlayer = 'opponent';
    state.phase = 'ATTACK_STEP';
  }},
  { sf: '26RBS01.json', cn: '26RBS01-084', kind: 'target', setup: (state) => {
    state.players.opponent.field.push(createFieldStack(makeUnit('o7', { owner: 'opponent', bp: 3000 }), { normal: 1 }));
  }},
  { sf: '26RBS01.json', cn: '26RBS01-052', kind: 'target', setup: (state) => {
    const opp = createFieldStack(makeUnit('o8', { owner: 'opponent', bp: 3000 }), { normal: 1 });
    opp.state = 'REFRESHED';
    state.players.opponent.field.push(opp);
  }}
];

for (const tc of REAL_FG_CARD_CASES) {
  test(`WPFG-REAL-${tc.cn}: resolves real compiled ability (${tc.kind}) cleanly`, async () => {
    const card = loadShardCard(tc.sf, tc.cn);
    card.id = `real_${tc.cn}`;
    card.owner = 'player';
    card.controller = 'player';

    const state = createGameState();
    const events = new EventBus();
    const resolver = new AsyncResolver(new DeterministicPromptResolver(), events);
    const srcStack = createFieldStack(card, { normal: 2 });
    state.players.player.field.push(srcStack);
    tc.setup(state, srcStack);

    const ability = card.abilities[0];
    assert.ok(ability && Array.isArray(ability.clauses), `${tc.cn} must have compiled ability[0]`);

    const res = await resolver.resolveAbility(
      state,
      ability,
      { controller: 'player', sourceCard: card, sourceStack: srcStack },
      events
    );
    assert.ok(res && typeof res === 'object', `${tc.cn} must return a structured resolution object`);
    assert.notEqual(res.reason, 'UNHANDLED_OPERATION', `${tc.cn} must not hit unhandled operation`);
  });
}
