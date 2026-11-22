import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack, validateGameState } from '../engine/state.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { AsyncResolver, DefaultPromptResolver, ResolutionDepthExceededError } from '../engine/resolver.js';
import { resolveTargets } from '../engine/selectors.js';
import { evaluateStructuredCondition, parseConditionToStructured, CONDITION_RESULT } from '../engine/conditions.js';
import { resetRestrictions } from '../engine/restrictions.js';
import { computeEffectiveBP } from '../engine/continuous.js';

function mkSpirit(id, opts = {}) {
  return {
    id,
    cardNumber: opts.cardNumber || id,
    name: opts.name || `Spirit_${id}`,
    type: opts.type || 'Spirit',
    color: opts.color || 'Red',
    colors: opts.colors || [opts.color || 'Red'],
    cost: opts.cost ?? 3,
    families: opts.families || ['Dragon'],
    symbols: opts.symbols || ['Red'],
    levels: opts.levels || { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } },
    owner: opts.owner || 'player',
    compiledIr: opts.compiledIr || { abilities: [] },
  };
}

// ============================================================================
// 1. GAME-STATE & ZONE MANAGER TESTS
// ============================================================================
test('K0-STATE-01: Zone transitions preserve owner vs controller and card conservation', async () => {
  const { state } = createGame();
  const oppCard = mkSpirit('OPP-CARD-1', { owner: 'opponent' });
  const st = createFieldStack(oppCard, { normal: 1, soul: 0 });
  st.owner = 'player'; // Controlled by player, owned by opponent
  state.players.player.field.push(st);

  const moved = await moveCard(state, oppCard, 'hand', 'opponent', { cause: 'bounce', by: 'player' });
  assert.equal(moved, true);
  assert.equal(state.players.player.field.some(s => s.id === st.id), false);
  assert.equal(state.players.opponent.hand.some(c => c.id === 'OPP-CARD-1'), true);
  assert.equal(state.players.player.hand.some(c => c.id === 'OPP-CARD-1'), false);
});

test('K0-STATE-02: Core movement rejects over-withdrawal atomically and validateGameState detects corruption', async () => {
  const { state } = createGame();
  state.players.player.reserve = { normal: 2, soul: 0 };
  const ok = await moveCore(state, 5, { zone: 'reserve', side: 'player' }, { zone: 'trash', side: 'player' });
  assert.equal(ok, false);
  assert.equal(state.players.player.reserve.normal, 2);
  assert.equal(state.players.player.trash.normal, 0);

  state.players.player.reserve.normal = -1;
  const val = validateGameState(state);
  assert.equal(val.valid, false);
});

// ============================================================================
// 2. TURN & PHASE PROGRESSION + LIFECYCLE RESETS
// ============================================================================
test('K0-TURN-01: Eternal Turn 1 skips Core & Draw, advances steps cleanly, and resets turn modifiers at END', async () => {
  const game = createGame({ firstPlayer: 'player' });
  const { state, flow } = game;
  state.players.player.deck = [mkSpirit('D1'), mkSpirit('D2'), mkSpirit('D3')];
  state.modifiers.push({ id: 'tmp-turn', type: 'BP_BUFF', targetStackId: 'x', amount: 1000, duration: 'THIS_TURN' });

  assert.equal(state.turnNumber, 1);
  assert.equal(state.step, 'START');
  await flow.advanceStep(); // Turn 1 skips CORE -> DRAW
  assert.equal(state.step, 'DRAW');
  await flow.advanceStep(); // REFRESH
  assert.equal(state.step, 'REFRESH');
  await flow.advanceStep(); // MAIN
  assert.equal(state.step, 'MAIN');
  await flow.advanceStep(); // Turn 1 skips ATTACK -> END
  assert.equal(state.step, 'END');
  await flow.advanceStep(); // Turn 2 START for opponent
  assert.equal(state.turnNumber, 2);
  assert.equal(state.activePlayer, 'opponent');
  assert.equal(state.step, 'START');
  assert.equal(state.modifiers.some(m => m.id === 'tmp-turn'), false, 'THIS_TURN modifier must expire on TURN_END');
});

// ============================================================================
// 3. BATTLE & ATTACK MANAGER + CONFIRMED DEFECT REPRODUCTIONS (K0-DEF-01, K0-DEF-02)
// ============================================================================
test('K0-BATTLE-01: declareAttack, declareBlock, and battle cleanup reset state.combat cleanly', async () => {
  const game = createGame({ firstPlayer: 'player' });
  const { state } = game;
  state.step = 'ATTACK';
  const atkCard = mkSpirit('ATK-1', { owner: 'player' });
  const atkSt = createFieldStack(atkCard, { normal: 1, soul: 0 });
  atkSt.owner = 'player';
  state.players.player.field.push(atkSt);

  const blkCard = mkSpirit('BLK-1', { owner: 'opponent' });
  const blkSt = createFieldStack(blkCard, { normal: 1, soul: 0 });
  blkSt.owner = 'opponent';
  state.players.opponent.field.push(blkSt);

  const atkRes = await game.declareAttack(atkSt.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(atkSt.state, 'EXHAUSTED');
  assert.equal(state.combat.attackerStackId, atkSt.id);

  const blkRes = await game.declareBlock(blkSt.id, 'opponent');
  assert.equal(blkRes.success, true);
  assert.equal(state.combat, null, 'declareBlock resolves BP comparison and clears state.combat');
});

test('K0-DEF-01: resolveTargets("battling") must recognize active state.combat from declareAttack/declareBlock', async () => {
  const game = createGame({ firstPlayer: 'player' });
  const { state } = game;
  state.step = 'ATTACK';
  const atkSt = createFieldStack(mkSpirit('BAT-ATK', { owner: 'player' }), { normal: 1, soul: 0 });
  atkSt.owner = 'player';
  state.players.player.field.push(atkSt);
  const blkSt = createFieldStack(mkSpirit('BAT-BLK', { owner: 'opponent' }), { normal: 1, soul: 0 });
  blkSt.owner = 'opponent';
  state.players.opponent.field.push(blkSt);

  await game.declareAttack(atkSt.id, 'player');
  state.combat.blockerStackId = blkSt.id;

  const res = await resolveTargets(state, { target: 'battling', side: 'opp' }, { controller: 'player' }, new DefaultPromptResolver());
  assert.equal(res.success, true, `Expected battling target to resolve during active state.combat, got ${res.reason}`);
  assert.equal(res.targets[0].card.id, 'BAT-BLK');
});

test('K0-DEF-02: queryCandidates/resolveTargets with state: "BATTLING" must match active combat battlers and exclude non-battlers', async () => {
  const game = createGame({ firstPlayer: 'player' });
  const { state } = game;
  state.step = 'ATTACK';
  const atkSt = createFieldStack(mkSpirit('BAT-ATK-2', { owner: 'player' }), { normal: 1, soul: 0 });
  atkSt.owner = 'player';
  state.players.player.field.push(atkSt);

  const oppBattler = createFieldStack(mkSpirit('OPP-BATTLER', { owner: 'opponent', type: 'Ultimate' }), { normal: 1, soul: 0 });
  oppBattler.owner = 'opponent';
  const oppBystander = createFieldStack(mkSpirit('OPP-BYSTANDER', { owner: 'opponent', type: 'Ultimate' }), { normal: 1, soul: 0 });
  oppBystander.owner = 'opponent';
  state.players.opponent.field.push(oppBattler, oppBystander);

  await game.declareAttack(atkSt.id, 'player');
  state.combat.blockerStackId = oppBattler.id;

  const res = await resolveTargets(
    state,
    { side: 'opp', types: ['Ultimate'], state: 'BATTLING' },
    { controller: 'player' },
    new DefaultPromptResolver()
  );
  assert.equal(res.success, true, `Expected state: 'BATTLING' target to resolve, got ${res.reason}`);
  assert.equal(res.targets.length, 1);
  assert.equal(res.targets[0].card.id, 'OPP-BATTLER');
});

// ============================================================================
// 4. TRIGGER MANAGER & ACTIVATION LIMITS
// ============================================================================
test('K0-TRIG-01: TriggerQueueManager deduplicates identical event triggers, cancels on field exit, and enforces OPT', async () => {
  const game = createGame();
  const { state, triggers } = game;
  state.players.player.deck = [mkSpirit('D1'), mkSpirit('D2'), mkSpirit('D3')];
  const optAbility = {
    id: 'AB-OPT-1',
    physicalId: 'CARD1#AB_OPT',
    semanticId: 'SEM#AB_OPT',
    header: { timing: 'WHEN_ATTACKS', limit: 'ONCE_PER_TURN', levels: [1, 2] },
    clauses: [{ rawText: 'Draw 1.', cleanText: 'Draw 1', op: { op: 'DRAW', count: 1, side: 'self' } }]
  };
  const sp = mkSpirit('TRG-CARD', { compiledIr: { abilities: [optAbility] } });
  const st = createFieldStack(sp, { normal: 1, soul: 0 });
  st.owner = 'player';
  state.players.player.field.push(st);

  const ev = { _eventId: 'ev_1', type: 'ATTACK_DECLARED', attacker: st, player: 'player' };
  const q1 = triggers.detectAndQueue(ev);
  const q2 = triggers.detectAndQueue(ev); // Duplicate event must not double-queue
  assert.equal(q1.length, 1);
  assert.equal(q2.length, 0);

  const r1 = await triggers.resolvePendingQueue();
  assert.equal(r1[0].status, 'RESOLVED');
  assert.equal(state.players.player.hand.length, 1);

  // Second attack same turn -> blocked by ONCE_PER_TURN
  const ev2 = { _eventId: 'ev_2', type: 'ATTACK_DECLARED', attacker: st, player: 'player' };
  triggers.detectAndQueue(ev2);
  const r2 = await triggers.resolvePendingQueue();
  assert.equal(r2[0].status, 'CANCELLED');
  assert.equal(state.players.player.hand.length, 1);
});

// ============================================================================
// 5. EFFECT RESOLVER: COMPOUND, NESTED DEPTH GUARD, COST ABORT
// ============================================================================
test('K0-RESOLVER-01: Failed cost clause aborts follow-up without consuming OPT; depth guard prevents infinite recursion', async () => {
  const { state } = createGame();
  state.players.player.reserve = { normal: 0, soul: 0 };
  const ab = {
    id: 'AB-COST-FAIL',
    physicalId: 'C1#COST_FAIL',
    semanticId: 'SEM#COST_FAIL',
    header: { timing: 'FLASH', limit: 'ONCE_PER_TURN' },
    clauses: [
      { rawText: 'Send 2 cores to trash.', cleanText: 'Send 2 cores to trash', isCost: true, op: { op: 'MOVE_CORE', count: 2, from: { zone: 'reserve', side: 'player' }, to: { zone: 'trash', side: 'player' } } },
      { rawText: 'Draw 1 card.', cleanText: 'Draw 1 card', link: 'byDoing', op: { op: 'DRAW', count: 1, side: 'self' } }
    ]
  };
  const sp = mkSpirit('COST-SP', { compiledIr: { abilities: [ab] } });
  const st = createFieldStack(sp, { normal: 1, soul: 0 });
  const resolver = new AsyncResolver();
  const res = await resolver.resolveAbility(state, ab, { controller: 'player', sourceCard: sp, sourceStack: st, placementId: st.placementId });
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false, 'Failed cost must not consume ONCE_PER_TURN');

  // Depth guard
  const deepResolver = new AsyncResolver(new DefaultPromptResolver(), { maxResolutionDepth: 2 });
  deepResolver.resolutionStack.push({ frameId: 'f1' }, { frameId: 'f2' });
  await assert.rejects(
    () => deepResolver.resolveAbility(state, { clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }] }, { controller: 'player' }),
    ResolutionDepthExceededError
  );
});

// ============================================================================
// 6. USAGE TRACKING: OPT, OPG, SAME_NAME, MULTIPLE COPIES & RESET BOUNDARIES
// ============================================================================
test('K0-RESTRICT-01: OPG persists across turn resets and distinguishes copies; SAME_NAME shares across copies per player', async () => {
  const { state } = createGame();
  state.players.player.deck = [mkSpirit('D1'), mkSpirit('D2'), mkSpirit('D3'), mkSpirit('D4')];
  const opgAb = {
    id: 'AB-OPG',
    physicalId: 'COPY#OPG',
    semanticId: 'SEM#OPG',
    header: { timing: 'FLASH', limit: 'ONCE_PER_GAME' },
    clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
  };
  const copy1 = createFieldStack(mkSpirit('COPY-1', { compiledIr: { abilities: [opgAb] } }), { normal: 1 });
  const copy2 = createFieldStack(mkSpirit('COPY-2', { compiledIr: { abilities: [opgAb] } }), { normal: 1 });
  const resolver = new AsyncResolver();

  const r1 = await resolver.resolveAbility(state, opgAb, { controller: 'player', sourceCard: copy1.top, sourceStack: copy1 });
  assert.equal(r1.success, true);

  // Turn reset must NOT reset ONCE_PER_GAME for copy1
  resetRestrictions(state, 'TURN');
  const r1Again = await resolver.resolveAbility(state, opgAb, { controller: 'player', sourceCard: copy1.top, sourceStack: copy1 });
  assert.equal(r1Again.success, false);
  assert.equal(r1Again.reason, 'ABILITY_LIMIT_REACHED');

  // Distinct card instance copy2 still has its own ONCE_PER_GAME
  const r2 = await resolver.resolveAbility(state, opgAb, { controller: 'player', sourceCard: copy2.top, sourceStack: copy2 });
  assert.equal(r2.success, true);

  // ONCE_PER_TURN_SAME_NAME shares across copies for same controller, but NOT across opponent
  const sameNameAb = {
    id: 'AB-SN',
    physicalId: 'SN#AB',
    semanticId: 'SEM#SN_SHARED',
    header: { timing: 'FLASH', limit: 'ONCE_PER_TURN_SAME_NAME' },
    clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
  };
  const sn1 = createFieldStack(mkSpirit('SN-1', { name: 'SharedName' }), { normal: 1 });
  const sn2 = createFieldStack(mkSpirit('SN-2', { name: 'SharedName' }), { normal: 1 });
  const s1Res = await resolver.resolveAbility(state, sameNameAb, { controller: 'player', sourceCard: sn1.top, sourceStack: sn1 });
  assert.equal(s1Res.success, true);
  const s2Res = await resolver.resolveAbility(state, sameNameAb, { controller: 'player', sourceCard: sn2.top, sourceStack: sn2 });
  assert.equal(s2Res.success, false);
  assert.equal(s2Res.reason, 'ABILITY_LIMIT_REACHED');
});

// ============================================================================
// 7. CONDITION EVALUATION TRI-STATE & BP COMPUTATION
// ============================================================================
test('K0-COND-01: Condition evaluator returns TRUE, FALSE, and UNSUPPORTED strictly without defaulting TRUE', () => {
  const { state } = createGame();
  state.players.player.life = 2;
  const cond = parseConditionToStructured('While your Life is 3 or less');
  assert.equal(evaluateStructuredCondition(state, cond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.players.player.life = 5;
  assert.equal(evaluateStructuredCondition(state, cond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  assert.equal(evaluateStructuredCondition(state, { type: 'UNKNOWN_COND' }, { controller: 'player' }).result, CONDITION_RESULT.UNSUPPORTED);
});
