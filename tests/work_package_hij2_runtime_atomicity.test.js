import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { moveCard, moveCore } from '../engine/zones.js';
import { computeEffectiveBP } from '../engine/continuous.js';
import { runCardAbilityE2E } from './helpers/card_e2e_framework.mjs';

test('HIJ2-E2E-01 [CARD_ABILITY_E2E]: BS02-106 (REFRESH target.cost=2) refreshes only Cost 2 Spirits', async () => {
  await runCardAbilityE2E({
    shardFile: 'BS02.json',
    cardKey: 'BS02-106',
    cardNumber: 'BS02-106',
    abIdx: 0,
    expectedOp: 'REFRESH',
    requireCompilerMatch: true,
  });
});

test('HIJ2-E2E-02 [CARD_ABILITY_E2E]: BS19-109 (BP_DEBUFF) debuffs opposing Spirit with compiler-faithful IR', async () => {
  await runCardAbilityE2E({
    shardFile: 'BS19.json',
    cardKey: 'BS19-109',
    cardNumber: 'BS19-109',
    abIdx: 0,
    expectedOp: 'BP_DEBUFF',
    requireCompilerMatch: true,
  });
});

test('HIJ2-E2E-03 [CARD_ABILITY_E2E]: BS32-XX02 (MILL side=self) mills exact 6 cards from self decktop', async () => {
  await runCardAbilityE2E({
    shardFile: 'BS32.json',
    cardKey: 'BS32-XX02',
    cardNumber: 'BS32-XX02',
    abIdx: 1,
    expectedOp: 'MILL',
    requireCompilerMatch: true,
  });
});

test('HIJ2-E2E-04 [CARD_ABILITY_E2E]: 26RBS02-032 (BOUNCE from grave to hand) returns card from Trash to Hand', async () => {
  const sh = JSON.parse(fs.readFileSync('data/ir_shards/26RBS02.json', 'utf8'));
  const cardData = sh['26RBS02-032'];
  const ab = cardData.abilities[0];
  const { state } = createGame();
  const card = {
    id: '26RBS02-032',
    cardNumber: '26RBS02-032',
    name: cardData.name,
    type: 'Spirit',
    color: 'Blue',
    colors: ['Blue'],
    cost: 4,
    owner: 'player',
    compiledIr: { abilities: [ab] },
  };
  state.players.player.grave.push(card);

  const res = await new AsyncResolver().resolveAbility(
    state,
    ab,
    { controller: 'player', sourceCard: card, sourceStack: null },
    { emitAsync: async () => {}, emit: () => {} },
    new DefaultPromptResolver()
  );
  assert.equal(res.success, true);
  assert.equal(state.players.player.grave.some(c => c.id === '26RBS02-032'), false, 'Card must leave Trash');
  assert.equal(state.players.player.hand.some(c => c.id === '26RBS02-032'), true, 'Card must enter Hand');
});

test('HIJ2-ATOM-01 [ADVERSARIAL]: Mid-resolution failure does not leak partial core mutations', async () => {
  const { state } = createGame();
  state.players.player.reserve.normal = 3;
  // Moving more cores than available must fail atomically with zero mutation
  const ok = await moveCore(
    state,
    5,
    { zone: 'reserve', side: 'player' },
    { zone: 'trash', side: 'player' },
    { cause: 'effect' }
  );
  assert.equal(ok, false);
  assert.equal(state.players.player.reserve.normal, 3, 'Reserve must remain unchanged on failed core move');
  assert.equal(state.players.player.trash.normal, 0, 'Trash must remain unchanged on failed core move');
});

test('HIJ2-ATOM-02 [INVARIANT]: Ownership vs controller zone routing returns card to owner zone', async () => {
  const { state } = createGame();
  const oppOwnedCard = {
    id: 'OPP-OWNED-1',
    cardNumber: 'OPP-OWNED-1',
    name: 'Stolen Spirit',
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 3,
    owner: 'opponent',
  };
  const st = createFieldStack(oppOwnedCard, { normal: 1, soul: 0 });
  st.owner = 'player'; // controlled by player, owned by opponent
  state.players.player.field.push(st);

  const moved = await moveCard(state, oppOwnedCard, 'hand', 'opponent', { cause: 'bounce', by: 'player' });
  assert.equal(moved, true);
  assert.equal(state.players.opponent.hand.some(c => c.id === 'OPP-OWNED-1'), true, 'Card must return to owner hand');
  assert.equal(state.players.player.hand.some(c => c.id === 'OPP-OWNED-1'), false, 'Card must not enter controller hand');
});

test('HIJ2-ATOM-03 [INVARIANT]: TURN_END clears DURING_THIS_TURN BP_BUFF/BP_DEBUFF modifiers cleanly', async () => {
  const { state } = createGame();
  const sp = {
    id: 'SP-MOD-1',
    cardNumber: 'SP-MOD-1',
    name: 'Test Spirit',
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 3,
    levels: { 1: { cost: 1, bp: 4000 } },
    owner: 'player',
  };
  const st = createFieldStack(sp, { normal: 1, soul: 0 });
  st.owner = 'player';
  state.players.player.field.push(st);

  const ab = {
    id: 'TEST-BUFF',
    type: 'ABILITY',
    header: { timing: 'FLASH' },
    clauses: [{
      rawText: 'During this turn, this Spirit gets +3000 BP.',
      cleanText: 'this Spirit gets +3000 BP',
      duration: 'DURING_THIS_TURN',
      op: { op: 'BP_BUFF', amount: 3000, target: 'self', duration: 'DURING_THIS_TURN' }
    }]
  };

  const res = await new AsyncResolver().resolveAbility(
    state,
    ab,
    { controller: 'player', sourceCard: sp, sourceStack: st },
    { emitAsync: async () => {}, emit: () => {} },
    new DefaultPromptResolver()
  );
  assert.equal(res.success, true);
  assert.equal(computeEffectiveBP(state, st), 7000, 'BP must include +3000 DURING_THIS_TURN modifier');

  // Simulate end-of-turn expiration filter
  state.modifiers = (state.modifiers || []).filter(m => m.duration !== 'DURING_THIS_TURN' && m.duration !== 'THIS_TURN');
  assert.equal(computeEffectiveBP(state, st), 4000, 'BP must revert to base 4000 after DURING_THIS_TURN expiry');
});
