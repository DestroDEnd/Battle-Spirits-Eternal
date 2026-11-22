import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { executeOp } from '../engine/ops/index.js';
import { commitStackExit, moveCard } from '../engine/zones.js';
import { computeEffectiveBP } from '../engine/continuous.js';

function mkCard(id, opts = {}) {
  return {
    id,
    cardNumber: opts.cardNumber || id,
    name: opts.name || `Card_${id}`,
    type: opts.type || 'Spirit',
    color: opts.color || 'Red',
    colors: opts.colors || [opts.color || 'Red'],
    cost: opts.cost ?? 3,
    families: opts.families || ['Dragon'],
    symbols: opts.symbols || ['Red'],
    levels: opts.levels || { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } },
    keywords: opts.keywords || [],
    owner: opts.owner || 'player',
    compiledIr: opts.compiledIr || { abilities: [] },
  };
}

// Scenario 1: Attack declaration triggering ability that selects the battling Spirit
test('K01-XSUB-01: Attack declaration trigger resolves BP debuff on active battling opponent Spirit', async () => {
  const game = createGame({ firstPlayer: 'player' });
  const { state, events } = game;
  state.step = 'ATTACK';
  const atkAb = {
    id: 'ATK-BAT-1',
    physicalId: 'ATK-BAT-1#a0',
    semanticId: 'SEM#ATK-BAT-1',
    header: { timing: 'WHEN_ATTACKS', levels: [1, 2] },
    clauses: [{ op: { op: 'BP_DEBUFF', amount: 2000, target: { target: 'battling', side: 'opp' }, duration: 'THIS_TURN' } }]
  };
  const atkSt = createFieldStack(mkCard('ATK-1', { owner: 'player', compiledIr: { abilities: [atkAb] } }), { normal: 1 });
  atkSt.owner = 'player';
  const blkSt = createFieldStack(mkCard('BLK-1', { owner: 'opponent', levels: { 1: { cost: 1, bp: 5000 } } }), { normal: 1 });
  blkSt.owner = 'opponent';
  state.players.player.field.push(atkSt);
  state.players.opponent.field.push(blkSt);

  await game.declareAttack(atkSt.id, 'player');
  // declareAttack triggered WHEN_ATTACKS (BP_DEBUFF -2000 on blkSt)
  assert.equal(computeEffectiveBP(state, blkSt), 3000, 'Battling blocker BP must decrease by 2000');
});

// Scenario 2: Triggered ability attempting to activate after usage limit is reached
test('K01-XSUB-02: Triggered ability blocked after OPT limit is reached', async () => {
  const game = createGame();
  const { state, triggers } = game;
  state.players.player.voidCores.normal = 5;
  state.players.player.deck = [mkCard('D1'), mkCard('D2')];
  const ab = {
    id: 'TRIG-OPT',
    physicalId: 'TRIG-OPT#a0',
    semanticId: 'SEM#TRIG-OPT',
    header: { timing: 'WHEN_ATTACKS', limit: 'ONCE_PER_TURN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
  };
  const st = createFieldStack(mkCard('TRG-1', { compiledIr: { abilities: [ab] } }), { normal: 1 });
  st.owner = 'player';
  state.players.player.field.push(st);

  triggers.detectAndQueue({ _eventId: 'e1', type: 'ATTACK_DECLARED', attacker: st, player: 'player' });
  const r1 = await triggers.resolvePendingQueue();
  assert.equal(r1[0].status, 'RESOLVED');

  triggers.detectAndQueue({ _eventId: 'e2', type: 'ATTACK_DECLARED', attacker: st, player: 'player' });
  const r2 = await triggers.resolvePendingQueue();
  assert.equal(r2[0].status, 'CANCELLED');
  assert.equal(state.players.player.hand.length, 1);
});

// Scenario 3: Target becoming invalid between selection and resolution
test('K01-XSUB-03: Removed/invalidated target between clauses causes safe no-op/failure without crash', async () => {
  const { state } = createGame();
  const oppSt = createFieldStack(mkCard('OPP-GONE', { owner: 'opponent' }), { normal: 1 });
  oppSt.owner = 'opponent';
  state.players.opponent.field.push(oppSt);

  const ctx = { controller: 'player', previousTarget: oppSt.top, selectedTargets: [oppSt] };
  // Target leaves field before resolution
  state.players.opponent.field = [];
  const res = await executeOp(state, { op: 'DESTROY', target: 'PREVIOUS_TARGET' }, ctx, new DefaultPromptResolver());
  assert.equal(res.success, false);
});

// Scenario 4 & 5: Replacement effect intercepting destruction (including maxCost) and Prevention (Armor) blocking destruction
test('K01-XSUB-04 & 05: Replacement redirects destruction to deck_bottom when cost <= 5; Armor prevents destruction before replacement', async () => {
  const { state, events } = createGame();
  state.modifiers.push({
    id: 'rep-1',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'DESTRUCTION',
    replacementZone: 'deck_bottom',
    side: 'opponent',
    filter: { type: 'Spirit', maxCost: 5 },
    duration: 'THIS_TURN'
  });

  const cost4 = createFieldStack(mkCard('C4', { owner: 'opponent', cost: 4 }), { normal: 1 });
  cost4.owner = 'opponent';
  state.players.opponent.field.push(cost4);

  state.players.opponent.field = state.players.opponent.field.filter(s => s.id !== cost4.id);
  await commitStackExit(state, cost4, 'grave', { cause: 'destroy', isDestruction: true }, null);
  assert.equal(state.players.opponent.deck.some(c => c.id === 'C4'), true, 'Cost 4 Spirit must go to deck_bottom via replacement');
  assert.equal(state.players.opponent.grave.some(c => c.id === 'C4'), false);

  // Armor prevents destruction via executeOp before commitStackExit is ever reached
  const armored = createFieldStack(mkCard('ARM-1', { owner: 'opponent', cost: 4, keywords: [{ name: 'Armor', parameter: 'Red', hook: 'armor' }], compiledIr: { keywords: [{ name: 'Armor', parameter: 'Red', hook: 'armor' }], abilities: [] } }), { normal: 1 });
  armored.owner = 'opponent';
  state.players.opponent.field.push(armored);
  const srcRed = mkCard('SRC-RED', { color: 'Red', colors: ['Red'] });
  const dRes = await executeOp(state, { op: 'DESTROY', target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player', sourceCard: srcRed }, new DefaultPromptResolver(), events);
  assert.equal(dRes.destroyedCount || 0, 0, 'Armored Spirit must not be destroyed');
  assert.equal(state.players.opponent.field.some(s => s.id === armored.id), true, 'Armored Spirit must remain on field');
});

// Scenario 6: Multiple distinct abilities triggered by one event on same card
test('K01-XSUB-06: One event queues multiple distinct abilities on the same card deterministically', async () => {
  const game = createGame();
  const { state, triggers } = game;
  state.players.player.voidCores.normal = 5;
  state.players.player.deck = [mkCard('D1'), mkCard('D2')];
  const ab1 = { id: 'A1', physicalId: 'C#A1', semanticId: 'S#A1', header: { timing: 'WHEN_ATTACKS', levels: [1] }, clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }] };
  const ab2 = { id: 'A2', physicalId: 'C#A2', semanticId: 'S#A2', header: { timing: 'WHEN_ATTACKS', levels: [1] }, clauses: [{ op: { op: 'RECOVER_LIFE', count: 1 } }] };
  const st = createFieldStack(mkCard('MULTI', { compiledIr: { abilities: [ab1, ab2] } }), { normal: 1 });
  st.owner = 'player';
  state.players.player.field.push(st);

  const q = triggers.detectAndQueue({ _eventId: 'ev_multi', type: 'ATTACK_DECLARED', attacker: st, player: 'player' });
  assert.equal(q.length, 2, 'Both distinct abilities must be queued');
  const res = await triggers.resolvePendingQueue();
  assert.equal(res.filter(r => r.status === 'RESOLVED').length, 2);
  assert.equal(state.players.player.hand.length, 1);
  assert.equal(state.players.player.life, 6);
});

// Scenario 7: Compound effect whose first operation changes the condition of its second operation
test('K01-XSUB-07: Compound effect updates state in clause 1 enabling clause 2 condition', async () => {
  const { state } = createGame();
  state.players.player.voidCores.normal = 5;
  state.players.player.life = 4;
  state.players.player.deck = [mkCard('D1')];
  const ab = {
    id: 'COMP-COND',
    physicalId: 'COMP#1',
    semanticId: 'SEM#COMP1',
    header: { timing: 'FLASH' },
    clauses: [
      { op: { op: 'RECOVER_LIFE', count: 1 } }, // life 4 -> 5
      { condition: 'While your Life is 5 or more', op: { op: 'DRAW', count: 1, side: 'self' } }
    ]
  };
  const res = await new AsyncResolver().resolveAbility(state, ab, { controller: 'player' });
  assert.equal(res.success, true);
  assert.equal(state.players.player.life, 5);
  assert.equal(state.players.player.hand.length, 1);
});

// Scenario 8: Battle ending clears state.combat, state.battle, and THIS_BATTLE restrictions/modifiers
test('K01-XSUB-08: endBattle cleans up state.combat, state.battle, and THIS_BATTLE modifiers/restrictions', async () => {
  const game = createGame();
  const { state } = game;
  state.combat = { attackerStackId: 'atk1', attackerSide: 'player', blockerStackId: 'blk1' };
  state.battle = { attacker: { id: 'atk1' }, blocker: { id: 'blk1' } };
  state.modifiers.push({ id: 'bat-mod', type: 'BP_BUFF', targetStackId: 'atk1', amount: 3000, duration: 'THIS_BATTLE' });

  await game.endBattle();
  assert.equal(state.combat, null);
  assert.equal(state.battle, null);
  assert.equal(state.modifiers.some(m => m.id === 'bat-mod'), false);
});

// Scenario 9: Card leaving field while its queued trigger is pending cancels the trigger
test('K01-XSUB-09: Card leaving field cancels pending field-dependent trigger before resolution', async () => {
  const game = createGame();
  const { state, triggers } = game;
  state.players.player.deck = [mkCard('D1')];
  const ab = { id: 'EXIT-1', physicalId: 'EX#1', semanticId: 'S#EX1', header: { timing: 'WHEN_ATTACKS', levels: [1] }, clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }] };
  const st = createFieldStack(mkCard('LEAVE-SP', { compiledIr: { abilities: [ab] } }), { normal: 1 });
  st.owner = 'player';
  state.players.player.field.push(st);

  triggers.detectAndQueue({ _eventId: 'ev_leave', type: 'ATTACK_DECLARED', attacker: st, player: 'player' });
  await moveCard(state, st.top, 'hand', 'player', { cause: 'bounce', by: 'opponent' });

  const res = await triggers.resolvePendingQueue();
  assert.equal(res[0].status, 'CANCELLED');
  assert.equal(res[0].reason, 'SOURCE_LEFT_FIELD');
  assert.equal(state.players.player.deck.length, 1);
});

// Scenario 10: Multiple effects attempting to move the same card do not duplicate it
test('K01-XSUB-10: Two consecutive moveCard calls on the same card move it once without duplication', async () => {
  const { state } = createGame();
  const c = mkCard('SINGLE-COPY');
  const st = createFieldStack(c, { normal: 1 });
  st.owner = 'player';
  state.players.player.field.push(st);

  const m1 = await moveCard(state, c, 'hand', 'player', { cause: 'bounce', by: 'opponent' });
  const m2 = await moveCard(state, c, 'grave', 'player', { cause: 'destroy', by: 'opponent' });
  assert.equal(m1, true);
  assert.equal(m2, true);
  assert.equal(state.players.player.hand.filter(x => x.id === 'SINGLE-COPY').length, 0);
  assert.equal(state.players.player.grave.filter(x => x.id === 'SINGLE-COPY').length, 1);
});
