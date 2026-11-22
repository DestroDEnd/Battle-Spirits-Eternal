/**
 * tests/work_package_k1_batch_04_parameters.test.js
 *
 * K1-BATCH-04 (Incomplete Parameters):
 * Verifies explicit parameter recovery in compiler/clause_patterns.js & engine/ops/index.js,
 * end-to-end execution across real shard cards, and strict fail-closed rejection on bare stubs
 * without rawText as well as unrecoverable complex prose clauses.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { executeOp } from '../engine/ops/index.js';
import {
  INCOMPLETE_PARAMETER_OPS,
  isIncompleteOpObject,
  recoverExplicitOpParameters,
  classifyIncompleteParameterClause
} from '../engine/parameter_recovery.js';
import { compileClauseToOp, enrichHijClauseOp } from '../compiler/clause_patterns.js';

const ROOT = process.cwd();
const SHARD_DIR = path.join(ROOT, 'data', 'ir_shards');
const DET_CARDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));

let _shardIndex = null;
function getShardCard(cardNumber) {
  if (!_shardIndex) {
    _shardIndex = {};
    for (const f of fs.readdirSync(SHARD_DIR).filter(x => x.endsWith('.json'))) {
      const sh = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, f), 'utf8'));
      for (const [cn, card] of Object.entries(sh)) {
        _shardIndex[cn] = card;
      }
    }
  }
  return _shardIndex[cardNumber] || null;
}

function makeRealCard(cardNumber, overrides = {}) {
  const ir = getShardCard(cardNumber);
  assert.ok(ir, `Expected ${cardNumber} in data/ir_shards`);
  const det = DET_CARDS[cardNumber] || {};
  return createCardInstance({
    ...det,
    ...ir,
    ...overrides,
    cardNumber,
    compiledIr: ir,
    abilities: ir.abilities,
    keywords: ir.keywords
  });
}

function findIncompleteClause(cardNumber, opName = null, predicate = null) {
  const ir = getShardCard(cardNumber);
  assert.ok(ir, `Expected ${cardNumber} in shards`);
  for (const ab of ir.abilities || []) {
    for (const cl of ab.clauses || []) {
      const ops = Array.isArray(cl.ops) ? cl.ops : (cl.op ? [cl.op] : []);
      for (const opObj of ops) {
        if (!opObj) continue;
        if (opName && opObj.op !== opName) continue;
        if (predicate && !predicate(cl, opObj)) continue;
        return { ability: ab, clause: cl, op: opObj };
      }
    }
  }
  return null;
}

const defaultPrompt = {
  choose: async (p) => {
    if (Array.isArray(p?.candidates)) return p.candidates.slice(0, p.count || 1);
    return { confirm: true, declined: false };
  }
};

function makeHarness() {
  const game = createGame();
  const state = game.state;
  state.players.player.voidCores.normal = 10;
  state.players.opponent.voidCores.normal = 10;
  state.players.player.hand = [];
  state.players.opponent.hand = [];
  state.players.player.deck = [];
  state.players.opponent.deck = [];
  state.players.player.grave = [];
  state.players.opponent.grave = [];
  state.players.player.removed = [];
  state.players.opponent.removed = [];
  for (let i = 0; i < 8; i++) {
    state.players.player.deck.push(createCardInstance({ cardNumber: `PD-${i}`, name: `PD${i}`, type: 'Spirit', color: 'Red', cost: 2 }));
    state.players.opponent.deck.push(createCardInstance({ cardNumber: `OD-${i}`, name: `OD${i}`, type: 'Spirit', color: 'Blue', cost: 2 }));
  }
  const resolver = new AsyncResolver(defaultPrompt);
  return { game, state, resolver };
}

test('K1B4-01: Live shard incomplete-parameter clauses recover & execute real state mutations', async () => {
  // 1. BS02-108: Magic cards from Hand -> Removed Zone (any number)
  {
    const { state, resolver } = makeHarness();
    const m1 = createCardInstance({ cardNumber: 'M-1', name: 'M1', type: 'Magic', color: 'Yellow', cost: 2 });
    const m2 = createCardInstance({ cardNumber: 'M-2', name: 'M2', type: 'Magic', color: 'Yellow', cost: 2 });
    const s1 = createCardInstance({ cardNumber: 'S-1', name: 'S1', type: 'Spirit', color: 'Yellow', cost: 2 });
    state.players.player.hand.push(m1, m2, s1);
    const hit = findIncompleteClause('BS02-108', 'DECK_OR_HAND_ACTION');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.player.removed.length, 2);
    assert.deepEqual(state.players.player.hand.map(c => c.cardNumber), ['S-1']);
  }

  // 2. BS39-039: put this card face-up on your Removed Zone
  {
    const { state, resolver } = makeHarness();
    const card = makeRealCard('BS39-039');
    state.players.player.hand.push(card);
    const hit = findIncompleteClause('BS39-039', 'DECK_OR_HAND_ACTION');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', sourceCard: card, resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.player.removed.length, 1);
    assert.equal(state.players.player.removed[0].cardNumber, 'BS39-039');
    assert.equal(state.players.player.removed[0].faceUp, true);
    assert.equal(state.players.player.hand.length, 0);
  }

  // 3. BS45-X06: Send 3 cards from opposing decktop to Trash
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BS45-X06', 'DECK_ACTION');
    const beforeDeck = state.players.opponent.deck.length;
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.opponent.deck.length, beforeDeck - 3);
    assert.equal(state.players.opponent.grave.length, 3);
  }

  // 4. BS53-CP08: send three opposing Lives to the Reserve
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BS53-CP08', 'COUNT_OPERATION');
    const lifeBefore = state.players.opponent.life;
    const resBefore = state.players.opponent.reserve.normal;
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.opponent.life, lifeBefore - 3);
    assert.equal(state.players.opponent.reserve.normal, resBefore + 3);
  }

  // 5. BS60-040: Your counter can +1
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BS60-040', 'COUNT_OPERATION');
    assert.equal(state.players.player.counters || 0, 0);
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.player.counters, 1);
  }

  // 6. BATTLE-SPIRITS-A313: Reveal one card from opposing decktop
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BATTLE-SPIRITS-A313', 'REVEAL_CARDS');
    const ctx = { controller: 'player', oppSide: 'opponent', resolver };
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, ctx);
    assert.equal(res.status, 'SUCCESS');
    assert.equal(ctx.revealedCards.length, 1);
    assert.equal(state.players.opponent.revealed.length, 1);
    assert.equal(state.players.opponent.deck.length, 7);
  }

  // 7. BS27-X01: Put 2 cards from opposing decktop under opposing Spirits/Ultimates facedown
  {
    const { state, resolver } = makeHarness();
    const oppStack = createFieldStack(createCardInstance({ cardNumber: 'OPP-SP', name: 'OppSp', type: 'Spirit', color: 'Blue', cost: 3 }), 1);
    state.players.opponent.field.push(oppStack);
    const hit = findIncompleteClause('BS27-X01', 'PUT_UNDERNEATH');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.opponent.deck.length, 6);
    assert.equal(oppStack.underCards.length, 2);
    assert.equal(oppStack.underCards[0].facedown, true);
  }

  // 8. BS65-XV02: Contract Advent from Removed Zone (ADVENT_RULE_MODIFIER)
  {
    const { state, resolver } = makeHarness();
    const card = makeRealCard('BS65-XV02');
    const hit = findIncompleteClause('BS65-XV02', 'ADVENT_RULE_MODIFIER');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', sourceCard: card, resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.ok(state.modifiers.some(m => m.type === 'ADVENT_RULE_MODIFIER' && m.fromZone === 'removed'));
  }

  // 9. BS61-029: Immediately activate this set Mirage card
  {
    const { state, resolver } = makeHarness();
    const card = makeRealCard('BS61-029');
    state.players.player.mirage = card;
    const hit = findIncompleteClause('BS61-029', 'MIRAGE_OPERATION');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', sourceCard: card, resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.action, 'activate_set_card');
  }

  // 10. BATTLE-SPIRITS-A3454: Toy Beast destruction replacement -> hand
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BATTLE-SPIRITS-A3454', 'REPLACEMENT_EFFECT');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.ok(state.modifiers.some(m => m.type === 'REPLACEMENT_EFFECT' && m.replaces === 'DESTRUCTION' && m.replacementZone === 'hand'));
  }

  // 11. BS26-078: TRIGGER_COUNTER
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BS26-078', 'TRIGGER_COUNTER');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.counter?.counterTiming || res.modifier?.counterTiming, 'ON_OPPOSING_ULTIMATE_TRIGGER_HIT');
  }

  // 12. BS63-CP04: COPY_PRE_ADVENT_EFFECT ("Glow-Kaiser") reading .under
  {
    const { state, resolver } = makeHarness();
    const pre = createCardInstance({
      cardNumber: 'PRE-GK',
      name: 'Glow-Kaiser Dragon',
      type: 'Spirit',
      color: 'Red',
      cost: 3,
      compiledIr: { abilities: [{ header: { timing: 'WHEN_ATTACKS' }, clauses: [] }] }
    });
    const hostCard = makeRealCard('BS63-CP04');
    const hostStack = createFieldStack(hostCard, 2);
    hostStack.under.push(pre);
    state.players.player.field.push(hostStack);
    const hit = findIncompleteClause('BS63-CP04', 'COPY_PRE_ADVENT_EFFECT');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', sourceCard: hostCard, sourceStack: hostStack, resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.grantedCount, 1);
  }

  // 13. BS67-083: USE_FROM_HAND self
  {
    const { state, resolver } = makeHarness();
    const card = makeRealCard('BS67-083');
    state.players.player.hand.push(card);
    const hit = findIncompleteClause('BS67-083', 'USE_FROM_HAND');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', sourceCard: card, resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.player.hand.length, 0);
    assert.ok(state.players.player.grave.some(c => c.cardNumber === 'BS67-083'));
  }

  // 14. BATTLE-SPIRITS-A8791: MILL 5 opposing decktop
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('BATTLE-SPIRITS-A8791', 'MILL');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(state.players.opponent.deck.length, 3);
    assert.equal(state.players.opponent.grave.length, 5);
  }

  // 15. BS58-007: GLOBAL_RESTRICTION (non-flash hand + rebirth)
  {
    const { state, resolver } = makeHarness();
    const ir = getShardCard('BS58-007');
    let checked = 0;
    for (const ab of ir.abilities || []) {
      for (const cl of ab.clauses || []) {
        const ops = Array.isArray(cl.ops) ? cl.ops : (cl.op ? [cl.op] : []);
        for (const o of ops) {
          if (o?.op === 'GLOBAL_RESTRICTION' && isIncompleteOpObject(o)) {
            const res = await resolver.resolveClause(state, ab, cl, { controller: 'player', oppSide: 'opponent', resolver });
            assert.equal(res.status, 'SUCCESS');
            checked++;
          }
        }
      }
    }
    assert.equal(checked, 2);
  }

  // 16. CB15-012: DECK_RULE up to 5 copies
  {
    const { state, resolver } = makeHarness();
    const hit = findIncompleteClause('CB15-012', 'DECK_RULE');
    const res = await resolver.resolveClause(state, hit.ability, hit.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.deckRule?.maxCopies, 5);
  }

  // 17. BS31-084 & BS55-018: MODIFY_EFFECT & MODIFY_EFFECT_VALUE (with clause conditions satisfied)
  {
    const { state, resolver } = makeHarness();
    state.players.player.counters = 3;
    const h1 = findIncompleteClause('BS31-084', 'MODIFY_EFFECT');
    const r1 = await resolver.resolveClause(state, h1.ability, h1.clause, {
      controller: 'player',
      oppSide: 'opponent',
      soulCoreUsed: true,
      usedSoulCore: true,
      soulCorePaid: true,
      payment: { usedSoulCore: true },
      resolver
    });
    assert.equal(r1.status, 'SUCCESS');
    const h2 = findIncompleteClause('BS55-018', 'MODIFY_EFFECT_VALUE');
    const r2 = await resolver.resolveClause(state, h2.ability, h2.clause, { controller: 'player', oppSide: 'opponent', resolver });
    assert.equal(r2.status, 'SUCCESS');
  }
});

test('K1B4-02: Fail-closed guarantees — bare stubs keep MISSING_IR_PARAMETERS & complex prose fails UNRECOVERABLE_COMPLEX', async () => {
  const { state } = makeHarness();

  // Bare stubs without currentClause.rawText MUST NEVER fabricate parameters
  for (const opName of INCOMPLETE_PARAMETER_OPS) {
    const res = await executeOp(state, { op: opName }, { controller: 'player', oppSide: 'opponent' }, defaultPrompt);
    assert.equal(res.status, 'UNSUPPORTED', `Expected bare stub ${opName} to fail closed`);
    assert.match(String(res.reason || ''), /^MISSING_/, `Unexpected reason for bare ${opName}: ${res.reason}`);
  }

  // Real unrecoverable complex prose cards MUST fail closed as UNRECOVERABLE_COMPLEX
  const unrecCards = [
    ['BS06-085', 'DECK_OR_HAND_ACTION'],
    ['BS22-014', 'REPLACEMENT_EFFECT'],
    ['BS31-053', 'MODIFY_EFFECT'],
    ['BS41-023', 'PUT_UNDERNEATH'],
    ['BATTLE-SPIRITS-A12072', 'DECK_ACTION']
  ];
  for (const [cn, opName] of unrecCards) {
    const hit = findIncompleteClause(cn, opName, cl => !recoverExplicitOpParameters({ op: opName }, cl.rawText).recovered);
    assert.ok(hit, `Expected unrecoverable ${opName} sample in ${cn}`);
    const cls = classifyIncompleteParameterClause(hit.op, hit.clause.rawText);
    assert.equal(cls.classification, 'UNRECOVERABLE_COMPLEX');
    const res = await executeOp(state, { ...hit.op }, { controller: 'player', oppSide: 'opponent', currentClause: hit.clause }, defaultPrompt);
    assert.equal(res.status, 'UNSUPPORTED');
    assert.equal(res.reason, 'UNRECOVERABLE_COMPLEX');
  }
});

test('K1B4-03: Compiler compileClauseToOp & enrichHijClauseOp integrate parameter recovery cleanly', () => {
  const compiledMill = compileClauseToOp('Send three cards from the opposing decktop to the Trash.');
  assert.equal(compiledMill.op, 'DECK_ACTION');
  assert.equal(compiledMill.side, 'opp');
  assert.equal(compiledMill.count, 3);
  assert.equal(compiledMill.to, 'grave');

  const compiledUnder = compileClauseToOp('Put two cards from the opposing decktop under any opposing Spirits/Ultimates facedown.');
  assert.equal(compiledUnder.op, 'PUT_UNDERNEATH');
  assert.equal(compiledUnder.fromSide, 'opp');
  assert.equal(compiledUnder.count, 2);
  assert.equal(compiledUnder.facedown, true);

  const enrichedMod = enrichHijClauseOp({ op: 'MODIFY_EFFECT' }, 'If you have three counters or more, this effect banishes +1 card.');
  assert.equal(enrichedMod.param, 'count');
  assert.equal(enrichedMod.delta, 1);
  assert.equal(enrichedMod.targetEffect, 'banish');

  const enrichedCnt = enrichHijClauseOp({ op: 'COUNT_OPERATION' }, 'Your counter can +1.');
  assert.equal(enrichedCnt.count, 1);
  assert.equal(enrichedCnt.side, 'self');
  const recoveredCnt = recoverExplicitOpParameters({ op: 'COUNT_OPERATION' }, 'Your counter can +1.');
  assert.equal(recoveredCnt.params.action, 'ADD_COUNTER');

  const complex = recoverExplicitOpParameters(
    { op: 'REPLACEMENT_EFFECT' },
    'When either player add cores from the Void via Green Spirit effects, send all those added cores back to the Void.'
  );
  assert.equal(complex.recovered, false);
  assert.equal(complex.classification, 'UNRECOVERABLE_COMPLEX');
});
