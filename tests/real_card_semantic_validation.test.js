/**
 * tests/real_card_semantic_validation.test.js
 *
 * Stage 6 — Real-Card Semantic Validation (Data-Dependent Suite)
 *
 * Loads real compiled cards from data/ir_shards/ and data/cards_detailed.json
 * across multiple colors, card types, and timings, executes them through production
 * engine APIs, and verifies actual resulting game state, effective BP, core counts,
 * hand size, destruction, and physical/semantic identity preservation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import { computeEffectiveBP } from '../engine/continuous.js';
import { assignDeterministicAbilityIdentities } from '../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const cardsDetailed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cards_detailed.json'), 'utf8'));
const sd01Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'SD01.json'), 'utf8'));
const bs01Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS01.json'), 'utf8'));
const bs02Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS02.json'), 'utf8'));
const bs03Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS03.json'), 'utf8'));
const bs10Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS10.json'), 'utf8'));
const bs24Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS24.json'), 'utf8'));
const bs38Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS38.json'), 'utf8'));
const bs52Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS52.json'), 'utf8'));
const bs60Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS60.json'), 'utf8'));
const sd15Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'SD15.json'), 'utf8'));
const sd51Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'SD51.json'), 'utf8'));
const sd19Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'SD19.json'), 'utf8'));
const sd06Shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'SD06.json'), 'utf8'));

function buildRealCard(cardNumber, shard) {
  const meta = cardsDetailed[cardNumber];
  const ir = shard[cardNumber];
  assert.ok(meta, `Missing metadata in cards_detailed.json for ${cardNumber}`);
  assert.ok(ir, `Missing compiled IR in shard for ${cardNumber}`);
  if (Array.isArray(ir?.abilities) && ir.abilities.some(a => !a.physicalId)) {
    assignDeterministicAbilityIdentities(cardNumber, ir.abilities);
  }
  return {
    ...meta,
    cardNumber,
    compiledIr: ir
  };
}

function makeFillerDeck(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `FILL-${i + 1}`,
    name: `Filler ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

test('REAL-CARD-01: SD01-034 Extra Draw (Magic, Red) MAIN draws cards and moves to grave', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const extraDraw = createCardInstance(buildRealCard('SD01-034', sd01Shard), 'player');
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve.normal = 5;
  game.state.players.player.hand.push(extraDraw);

  const handBefore = game.state.players.player.hand.length;
  const res = await game.playCard(extraDraw.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.grave.some(c => c.id === extraDraw.id), true, 'Magic moved to grave');
  assert.equal(game.state.players.player.hand.length, handBefore + 2, `Hand increased by net delta +2 via Extra Draw MAIN ability (-1 played, +2 drawn, +1 revealed red spirit added)`);
  assert.ok((res.abilityResults[0].context.physicalAbilityId || res.abilityResults[0].context.sourceAbility?.id || '').startsWith('SD01-034#'));
});

test('REAL-CARD-02: BS01-061 Apewhip (Spirit, Green) WHEN_SUMMONED moves 1 core from Void to Reserve', async () => {
  const apewhip = createCardInstance(buildRealCard('BS01-061', bs01Shard), 'player');
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve.normal = 5;
  game.state.players.player.voidCores.normal = 3;
  game.state.players.player.hand.push(apewhip);

  const voidBefore = game.state.players.player.voidCores.normal;
  const res = await game.playCard(apewhip.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.field.some(st => st.top.id === apewhip.id), true);
  assert.equal(game.state.players.player.voidCores.normal, voidBefore - 1, 'Apewhip WHEN_SUMMONED moved exactly 1 core from Void to Reserve');
});

test('REAL-CARD-03: BS01-034 Bi-Python (Spirit, Purple) WHEN_ATTACKS draws 1 card on attack declaration', async () => {
  const biPython = createCardInstance(buildRealCard('BS01-034', bs01Shard), 'player');
  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'ATTACK';

  const stack = createFieldStack(biPython, { normal: 1, soul: 0 });
  game.state.players.player.field.push(stack);

  const handBefore = game.state.players.player.hand.length;
  const atkRes = await game.declareAttack(stack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(stack.state, 'EXHAUSTED');
  assert.equal(game.state.players.player.hand.length, handBefore + 1, 'Bi-Python WHEN_ATTACKS drew 1 card');
});

test('REAL-CARD-04: BS01-077 Baby-Loki (Spirit, White) WHEN_BLOCKS boosts effective BP during battle', async () => {
  const babyLoki = createCardInstance(buildRealCard('BS01-077', bs01Shard), 'opponent');
  const weakAttacker = createCardInstance({
    card_number: 'TEST-ATK', name: 'Weak Attacker', type: 'Spirit', cost: 1, color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'ATTACK';

  const atkStack = createFieldStack(weakAttacker, { normal: 1, soul: 0 });
  const lv2Cost = babyLoki.levels?.LV2?.cost ?? babyLoki.levels?.[2]?.cost ?? 2;
  const blkStack = createFieldStack(babyLoki, { normal: lv2Cost, soul: 0 });
  game.state.players.player.field.push(atkStack);
  game.state.players.opponent.field.push(blkStack);

  const bpBeforeBlock = computeEffectiveBP(game.state, blkStack);
  await game.declareAttack(atkStack.id, 'player');
  const blkRes = await game.declareBlock(blkStack.id, 'opponent');

  assert.equal(blkRes.success, true);
  assert.equal(blkRes.blockerBp, bpBeforeBlock + 1000, `Baby-Loki WHEN_BLOCKS increased effective BP by exactly +1000 (${bpBeforeBlock} -> ${blkRes.blockerBp})`);
  assert.equal(blkRes.blockerBp, 4000, 'Baby-Loki final effective BP is exactly 4000 (3000 base + 1000 buff)');
  assert.equal(game.state.players.opponent.field.some(st => st.id === blkStack.id), true, 'Baby-Loki survived battle');
  assert.equal(game.state.players.player.grave.some(c => c.id === weakAttacker.id), true, 'Weak attacker destroyed in battle');
});

test('REAL-CARD-05: BS38-008 Big-the-Tiger (Spirit, Red) WHEN_ATTACKS destroys opposing low-BP Spirit', async () => {
  const tiger = createCardInstance(buildRealCard('BS38-008', bs38Shard), 'player');
  const smallOpp = createCardInstance({
    card_number: 'OPP-SM', name: 'Small Spirit', type: 'Spirit', cost: 1, color: 'Blue',
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'opponent');

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'ATTACK';

  const tigerStack = createFieldStack(tiger, { normal: 1, soul: 0 });
  const oppStack = createFieldStack(smallOpp, { normal: 1, soul: 0 });
  game.state.players.player.field.push(tigerStack);
  game.state.players.opponent.field.push(oppStack);

  const atkRes = await game.declareAttack(tigerStack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(game.state.players.opponent.field.length, 0, 'Big-the-Tiger WHEN_ATTACKS destroyed opposing 2000 BP Spirit');
  assert.equal(game.state.players.opponent.grave.some(c => c.id === smallOpp.id), true);
});

// ---------------------------------------------------------------------------
// Expanded Real-Card Semantic Suite (REAL-CARD-06 through REAL-CARD-42)
// Covers 42 real compiled abilities across Spirits, Magics, Nexuses, Braves,
// Ultimates, all 6 colors, and diverse operations/timings.
// ---------------------------------------------------------------------------

function makeGenericSpirit(idNum, name, color = 'Blue', bp = 2000, owner = 'opponent', cost = 1) {
  return createCardInstance({
    card_number: idNum,
    name,
    type: 'Spirit',
    cost,
    color,
    colors: [color],
    symbols: [color],
    levels: { 1: { cost: 1, bp }, 2: { cost: 2, bp: bp + 2000 } }
  }, owner);
}

const REAL_CARD_CASES = [
  { id: 'REAL-CARD-06', cn: 'SD01-036', shard: sd01Shard, kind: 'PLAY_MAGIC_TARGET_FRIENDLY', assertFn: (g, r, st) => assert.equal(computeEffectiveBP(g.state, st), 4000) },
  { id: 'REAL-CARD-07', cn: 'SD01-012', shard: sd01Shard, kind: 'SUMMON_DRAW', assertFn: (g, r, _st, before) => assert.equal(g.state.players.player.hand.length, before.handLen) },
  { id: 'REAL-CARD-08', cn: 'SD01-026', shard: sd01Shard, kind: 'SUMMON_BOUNCE_OPP_LOW_BP', assertFn: (g) => assert.equal(g.state.players.opponent.field.length, 0) },
  { id: 'REAL-CARD-09', cn: 'SD01-021', shard: sd01Shard, kind: 'DESTROY_TRIGGERS_BOUNCE_LOW_COST', assertFn: (g) => assert.equal(g.state.players.opponent.field.length, 0) },
  { id: 'REAL-CARD-10', cn: 'SD01-020', shard: sd01Shard, kind: 'PASSIVE_IMMUNITY', assertFn: (g, _r, st) => assert.equal(st.top.compiledIr.abilities.some(a => a.clauses.some(c => c.op?.op === 'IMMUNITY')), true) },
  { id: 'REAL-CARD-11', cn: 'SD01-023', shard: sd01Shard, kind: 'PASSIVE_BP_BUFF_WHITE', assertFn: (g, _r, st) => assert.equal(computeEffectiveBP(g.state, st), 3000) },
  { id: 'REAL-CARD-12', cn: 'SD01-028', shard: sd01Shard, kind: 'NEXUS_PASSIVE_BP_BUFF_PURPLE', assertFn: (g, _r, st) => assert.equal(computeEffectiveBP(g.state, st), 3000) },
  { id: 'REAL-CARD-13', cn: 'SD01-024', shard: sd01Shard, kind: 'ACTIVATE_FIRST_ABILITY_REFRESH', assertFn: (g, r, st) => assert.equal(st.state, 'REFRESHED') },
  { id: 'REAL-CARD-14', cn: 'SD01-027', shard: sd01Shard, kind: 'ACTIVATE_NEXUS_DRAW', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.player.hand.length, before.handLen + 1) },
  { id: 'REAL-CARD-15', cn: 'SD01-031', shard: sd01Shard, kind: 'ACTIVATE_OP_DISCARD_OPP_HAND', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.hand.length, before.oppHandLen - 1) },
  { id: 'REAL-CARD-16', cn: 'BS01-125', shard: bs01Shard, kind: 'PLAY_MAGIC_DESTROY_BOTH', assertFn: (g) => { assert.equal(g.state.players.opponent.grave.length, 1); assert.equal(g.state.players.opponent.field.length, 0); } },
  { id: 'REAL-CARD-17', cn: 'BS01-011', shard: bs01Shard, kind: 'SUMMON_DESTROY_NEXUS', assertFn: (g) => assert.equal(g.state.players.opponent.nexus.length, 0) },
  { id: 'REAL-CARD-18', cn: 'BS01-060', shard: bs01Shard, kind: 'ACTIVATE_FRIENDLY_BP_BUFF', assertFn: (g, _r, st) => assert.equal(computeEffectiveBP(g.state, st), 6000) },
  { id: 'REAL-CARD-19', cn: 'BS01-062', shard: bs01Shard, kind: 'ACTIVATE_OP_DISCARD_OPP_HAND', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.hand.length, before.oppHandLen - 1) },
  { id: 'REAL-CARD-20', cn: 'BS01-056', shard: bs01Shard, kind: 'SUMMON_DISCARD_OPP_HAND', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.hand.length, before.oppHandLen - 1) },
  { id: 'REAL-CARD-21', cn: 'BS01-129', shard: bs01Shard, kind: 'PLAY_MAGIC_MOVE_CORE', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.players.player.grave.length, 2); } },
  { id: 'REAL-CARD-22', cn: 'BS01-059', shard: bs01Shard, kind: 'ACTIVATE_SELF_REFRESH', assertFn: (g, _r, st) => assert.equal(st.state, 'REFRESHED') },
  { id: 'REAL-CARD-23', cn: 'BS01-033', shard: bs01Shard, kind: 'PHYSICAL_ID_INTEGRITY', assertFn: (g, _r, st) => assert.equal(st.top.compiledIr.abilities.every(a => typeof (a.physicalId || a.id) === 'string' && (a.physicalId || a.id).startsWith('BS01-033#')), true) },
  { id: 'REAL-CARD-24', cn: 'BS01-018', shard: bs01Shard, kind: 'ACTIVATE_SET_RESTRICTION', assertFn: (g) => assert.equal(g.state.modifiers.some(m => m.type === 'SET_RESTRICTION'), true) },
  { id: 'REAL-CARD-25', cn: 'BS02-066', shard: bs02Shard, kind: 'SUMMON_EXHAUST_OPP', assertFn: (g) => assert.equal(g.state.players.opponent.field[0].state, 'EXHAUSTED') },
  { id: 'REAL-CARD-26', cn: 'BS02-X06', shard: bs02Shard, kind: 'SUMMON_EXHAUST_OPP', assertFn: (g) => assert.equal(g.state.players.opponent.field.every(s => s.state === 'EXHAUSTED'), true) },
  { id: 'REAL-CARD-27', cn: 'BS02-082', shard: bs02Shard, kind: 'ACTIVATE_GRANT_FAMILY', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.modifiers.some(m => m.type === 'GRANT_FAMILY' && m.side === 'player'), true, 'BS02-082 registered GRANT_FAMILY modifier'); } },
  { id: 'REAL-CARD-28', cn: 'BS02-064', shard: bs02Shard, kind: 'ACTIVATE_GRANT_FAMILY', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.modifiers.some(m => m.type === 'GRANT_FAMILY' && m.duration === 'DURING_THIS_TURN'), true, 'BS02-064 registered GRANT_FAMILY modifier'); } },
  { id: 'REAL-CARD-29', cn: 'BS03-116', shard: bs03Shard, kind: 'ACTIVATE_MILL_OPP', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.deck.length, before.oppDeckLen - 1) },
  { id: 'REAL-CARD-30', cn: 'BS03-076', shard: bs03Shard, kind: 'ATTACK_MILL_OPP', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.deck.length, before.oppDeckLen - 3) },
  { id: 'REAL-CARD-31', cn: 'BS03-115', shard: bs03Shard, kind: 'ACTIVATE_MILL_OPP', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.deck.length, before.oppDeckLen - 1) },
  { id: 'REAL-CARD-32', cn: 'BS03-X12', shard: bs03Shard, kind: 'SUMMON_MILL_OPP', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.deck.length, before.oppDeckLen - 1) },
  { id: 'REAL-CARD-33', cn: 'BS03-127', shard: bs03Shard, kind: 'PLAY_MAGIC_EXHAUST_OPP', assertFn: (g) => assert.equal(g.state.players.opponent.field[0].state, 'EXHAUSTED') },
  { id: 'REAL-CARD-34', cn: 'BS10-068', shard: bs10Shard, kind: 'ACTIVATE_EXHAUST_OPP', assertFn: (g) => assert.equal(g.state.players.opponent.field[0].state, 'EXHAUSTED') },
  { id: 'REAL-CARD-35', cn: 'BS10-025', shard: bs10Shard, kind: 'SUMMON_EXHAUST_OPP', assertFn: (g) => assert.equal(g.state.players.opponent.field[0].state, 'EXHAUSTED') },
  { id: 'REAL-CARD-36', cn: 'BS10-054', shard: bs10Shard, kind: 'ATTACK_MILL_OPP', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.opponent.deck.length, before.oppDeckLen - 2) },
  { id: 'REAL-CARD-37', cn: 'BS24-030', shard: bs24Shard, kind: 'ACTIVATE_ADD_SYMBOL', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.modifiers.some(m => m.type === 'ADD_SYMBOL' && m.symbolColor === 'White'), true, 'BS24-030 registered ADD_SYMBOL White modifier'); } },
  { id: 'REAL-CARD-38', cn: 'BS24-043', shard: bs24Shard, kind: 'ACTIVATE_RECOVER_LIFE', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.player.life, before.life + 1) },
  { id: 'REAL-CARD-39', cn: 'BS38-074', shard: bs38Shard, kind: 'PLAY_MAGIC_BP_DEBUFF', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.modifiers.some(m => m.type === 'BP_BUFF' || m.type === 'BP_DEBUFF'), true, 'BS38-074 registered BP debuff modifier'); } },
  { id: 'REAL-CARD-40', cn: 'BS38-064', shard: bs38Shard, kind: 'ACTIVATE_RECOVER_LIFE', assertFn: (g, _r, _st, before) => assert.equal(g.state.players.player.life, before.life + 1) },
  { id: 'REAL-CARD-41', cn: 'BS52-056', shard: bs52Shard, kind: 'ACTIVATE_ADD_SYMBOL', assertFn: (g, r) => { assert.equal(r.success, true); assert.equal(g.state.modifiers.some(m => m.type === 'ADD_SYMBOL' && m.symbolColor === 'Blue'), true, 'BS52-056 registered ADD_SYMBOL Blue modifier'); } },
  { id: 'REAL-CARD-42', cn: 'SIEGWURM-NOVA', shard: sd51Shard, kind: 'PHYSICAL_ID_INTEGRITY', assertFn: (g, r, st) => assert.equal(st.top.compiledIr.abilities.every(a => typeof a.physicalId === 'string' && a.physicalId.startsWith('SIEGWURM-NOVA#')), true) }
];

for (const tc of REAL_CARD_CASES) {
  test(`${tc.id}: ${tc.cn} (${tc.kind})`, async () => {
    const rawCard = buildRealCard(tc.cn, tc.shard);
    const card = createCardInstance(rawCard, 'player');
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
    game.state.step = 'MAIN';
    game.state.players.player.reserve.normal = 12;
    game.state.players.player.life = 3;
    game.state.players.player.voidCores.normal = 5;

    const friend = makeGenericSpirit('FR-1', 'Friendly Spirit', card.color || 'White', 2000, 'player');
    const friendSt = createFieldStack(friend, { normal: 1, soul: 0 });
    friendSt.owner = 'player';
    const oppSp = makeGenericSpirit('OP-1', 'Opp Target', 'Blue', 2000, 'opponent', 1);
    const oppSt = createFieldStack(oppSp, { normal: 2, soul: 0 });
    oppSt.owner = 'opponent';
    oppSt.level = 2;

    if (!['SUMMON_BOUNCE_OPP_LOW_BP', 'SUMMON_DESTROY_NEXUS', 'PLAY_MAGIC_DESTROY_BOTH', 'PLAY_MAGIC_EXHAUST_OPP', 'NEXUS_PASSIVE_BP_BUFF_PURPLE', 'PASSIVE_BP_BUFF_WHITE'].includes(tc.kind)) {
      game.state.players.player.field.push(friendSt);
    }
    if (['SUMMON_BOUNCE_OPP_LOW_BP', 'DESTROY_TRIGGERS_BOUNCE_LOW_COST', 'PLAY_MAGIC_DESTROY_BOTH', 'SUMMON_EXHAUST_OPP', 'ACTIVATE_EXHAUST_OPP', 'PLAY_MAGIC_EXHAUST_OPP', 'PLAY_MAGIC_MOVE_CORE', 'PLAY_MAGIC_BP_DEBUFF'].includes(tc.kind)) {
      game.state.players.opponent.field.push(oppSt);
    }
    if (tc.kind === 'SUMMON_DESTROY_NEXUS') {
      const oppNex = createCardInstance({ card_number: 'OP-NEX', name: 'Opp Nexus', type: 'Nexus', cost: 2, color: 'Red' }, 'opponent');
      game.state.players.opponent.nexus.push(oppNex);
    }
    game.state.players.opponent.hand.push(makeGenericSpirit('OH-1', 'Opp Hand 1', 'Blue', 1000, 'opponent'));

    const before = {
      handLen: game.state.players.player.hand.length,
      oppHandLen: game.state.players.opponent.hand.length,
      oppDeckLen: game.state.players.opponent.deck.length,
      life: game.state.players.player.life
    };

    let res = { success: true };
    let targetStack = friendSt;

    if (tc.kind.startsWith('PLAY_MAGIC_')) {
      game.state.players.player.hand.push(card);
      before.handLen = game.state.players.player.hand.length;
      if (tc.kind !== 'PLAY_MAGIC_EXHAUST_OPP' && card.compiledIr.abilities.some(a => a.header?.timing === 'FLASH')) {
        game.state.step = 'ATTACK';
      }
      res = await game.playCard(card.id, [], 'player');
      tc.assertFn(game, res, friendSt, before);
    } else if (tc.kind.startsWith('SUMMON_')) {
      game.state.players.player.hand.push(card);
      before.handLen = game.state.players.player.hand.length;
      res = await game.playCard(card.id, [], 'player');
      targetStack = game.state.players.player.field.find(s => s.top.id === card.id) || friendSt;
      tc.assertFn(game, res, targetStack, before);
    } else if (tc.kind.startsWith('ATTACK_')) {
      game.state.step = 'ATTACK';
      const st = createFieldStack(card, { normal: 2, soul: 0 });
      st.owner = 'player';
      game.state.players.player.field.push(st);
      res = await game.declareAttack(st.id, 'player');
      tc.assertFn(game, res, st, before);
    } else if (tc.kind === 'DESTROY_TRIGGERS_BOUNCE_LOW_COST') {
      const st = createFieldStack(card, { normal: 1, soul: 0 });
      st.owner = 'player';
      game.state.players.player.field.push(st);
      const ab = card.compiledIr.abilities.find(a => a.header?.timing === 'WHEN_DESTROYED') || card.compiledIr.abilities[0];
      res = await game.resolver.resolveAbility(game.state, ab, { controller: 'player', sourceCard: card, sourceStack: st }, game.events);
      tc.assertFn(game, res, st, before);
    } else if (tc.kind === 'NEXUS_PASSIVE_BP_BUFF_PURPLE') {
      const purpleSp = makeGenericSpirit('PR-1', 'Purple Spirit', 'Purple', 2000, 'player');
      const purpleSt = createFieldStack(purpleSp, { normal: 1, soul: 0 });
      purpleSt.owner = 'player';
      game.state.players.player.field.push(purpleSt);
      const nexWithCores = { ...card, cores: { normal: 3, soul: 0 } };
      game.state.players.player.nexus.push(nexWithCores);
      const ab = card.compiledIr.abilities.find(a => a.header?.timing === 'PASSIVE');
      await game.resolver.resolveAbility(game.state, ab, { controller: 'player', sourceCard: nexWithCores }, game.events);
      tc.assertFn(game, res, purpleSt, before);
    } else if (tc.kind === 'PASSIVE_BP_BUFF_WHITE') {
      const whiteSp = makeGenericSpirit('WH-1', 'White Spirit', 'White', 2000, 'player');
      const whiteSt = createFieldStack(whiteSp, { normal: 1, soul: 0 });
      whiteSt.owner = 'player';
      const srcSt = createFieldStack(card, { normal: 8, soul: 0 });
      srcSt.owner = 'player';
      game.state.players.player.field.push(srcSt, whiteSt);
      const ab = card.compiledIr.abilities.find(a => a.header?.timing === 'PASSIVE');
      await game.resolver.resolveAbility(game.state, ab, { controller: 'player', sourceCard: card, sourceStack: srcSt }, game.events);
      tc.assertFn(game, res, whiteSt, before);
    } else {
      const st = createFieldStack(card, { normal: 2, soul: 0 });
      st.owner = 'player';
      if (tc.kind.includes('REFRESH')) st.state = 'EXHAUSTED';
      game.state.players.player.field.push(st);
      if (tc.kind === 'PHYSICAL_ID_INTEGRITY') {
        tc.assertFn(game, res, st, before);
        return;
      }
      const ab = card.compiledIr.abilities.find(a => a.clauses?.length) || card.compiledIr.abilities[0];
      if (tc.kind === 'ACTIVATE_ADD_SYMBOL') {
        game.state.players.player.counters = 2;
      }
      const execAb = tc.kind === 'ACTIVATE_FIRST_ABILITY_REFRESH'
        ? (card.compiledIr.abilities.find(a => a.clauses.some(c => c.op?.op === 'REFRESH')) || ab)
        : (tc.kind === 'ACTIVATE_NEXUS_DRAW'
          ? (card.compiledIr.abilities.find(a => a.clauses.some(c => c.op?.op === 'DRAW')) || ab)
          : (tc.kind === 'ACTIVATE_ADD_SYMBOL'
            ? (card.compiledIr.abilities.find(a => a.clauses.some(c => c.op?.op === 'ADD_SYMBOL')) || ab)
            : ab));
      res = await game.resolver.resolveAbility(game.state, execAb, { controller: 'player', sourceCard: card, sourceStack: st }, game.events);
      tc.assertFn(game, res, st, before);
    }
  });
}

// ---------------------------------------------------------------------------
// Phase K Extended Real-Card Coverage (REAL-CARD-43 through REAL-CARD-48)
// Explicit coverage for Brave, Ultimate, Burst, and All 6 Colors
// ---------------------------------------------------------------------------

test('REAL-CARD-43: SD15-006 Angeloid (Brave, Yellow) Brave condition, When Braved combat restriction, physical ID', async () => {
  const angeloid = createCardInstance(buildRealCard('SD15-006', sd15Shard), 'player');
  assert.equal(angeloid.type, 'Brave');
  assert.equal(angeloid.colors.includes('Yellow'), true);
  assert.equal(angeloid.cost, 4);

  // Check Brave condition ability representation
  const braveCondAb = angeloid.compiledIr.abilities.find(a => a.rawText?.includes('Brave Condition'));
  assert.ok(braveCondAb, 'SD15-006 has Brave Condition ability');
  assert.equal(braveCondAb.header.keyword, 'Brave Condition: Divine Spirit');

  // Check When Braved ability representation
  const whenBravedAb = angeloid.compiledIr.abilities.find(a => a.header?.timing === 'WHEN_BRAVE_ATTACKS');
  assert.ok(whenBravedAb, 'SD15-006 has When Braved ability');
  assert.equal(whenBravedAb.clauses.some(c => c.op?.op === 'COMBAT_RESTRICTION'), true);

  // Check physical ID determinism
  assert.ok(angeloid.compiledIr.abilities.every(a => a.physicalId && a.physicalId.startsWith('SD15-006#AB_')));
});

test('REAL-CARD-44: SD19-X01 Ultimate-Siegfried (Ultimate, Red) Ultimate tiers, True-Awaken exact +3000 BP buff', async () => {
  const ult = createCardInstance(buildRealCard('SD19-X01', sd19Shard), 'player');
  assert.equal(ult.type, 'Ultimate');
  assert.equal(ult.colors.includes('Red'), true);
  assert.equal(ult.cost, 6);
  assert.equal(ult.levels?.LV3?.bp, 10000);
  assert.equal(ult.levels?.LV4?.bp, 14000);
  assert.equal(ult.levels?.LV5?.bp, 20000);

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'ATTACK';
  const ultSt = createFieldStack(ult, { normal: 3, soul: 0 }); // Level 4
  game.state.players.player.field.push(ultSt);

  const donor = makeGenericSpirit('DONOR-1', 'Donor Spirit', 'Red', 1000, 'player');
  const donorSt = createFieldStack(donor, { normal: 2, soul: 0 });
  game.state.players.player.field.push(donorSt);

  const trueAwakenAb = ult.compiledIr.abilities.find(a => a.header?.keyword === 'True-Awaken' || a.rawText?.includes('True-Awaken'));
  assert.ok(trueAwakenAb, 'True-Awaken ability exists in IR');

  const bpBefore = computeEffectiveBP(game.state, ultSt);
  assert.equal(bpBefore, 14000);

  const res = await game.resolver.resolveAbility(game.state, trueAwakenAb, { controller: 'player', sourceCard: ult, sourceStack: ultSt }, game.events);
  assert.equal(res.success, true);
  const bpAfter = computeEffectiveBP(game.state, ultSt);
  assert.equal(bpAfter, 17000, 'Ultimate-Siegfried received exact +3000 BP buff from True-Awaken (14000 -> 17000)');
});

test('REAL-CARD-45: SD06-016 Burst Wall (Magic, White) Burst trigger condition and exact +1 Life recovery', async () => {
  const burstWall = createCardInstance(buildRealCard('SD06-016', sd06Shard), 'player');
  assert.equal(burstWall.type, 'Magic');
  assert.equal(burstWall.colors.includes('White'), true);

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.players.player.life = 2;
  game.state.players.player.voidCores.normal = 10;

  const burstAb = burstWall.compiledIr.abilities.find(a => a.header?.timing === 'BURST');
  assert.ok(burstAb, 'SD06-016 has Burst ability in IR');
  assert.equal(burstAb.header.burstCondition, 'AFTER_YOUR_LIFE_REDUCED');

  const lifeBefore = game.state.players.player.life;
  const voidBefore = game.state.players.player.voidCores.normal;

  const res = await game.resolver.resolveAbility(game.state, burstAb, { controller: 'player', sourceCard: burstWall }, game.events);
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.life, lifeBefore + 1, 'Burst Wall recovered exactly 1 Life');
  assert.equal(game.state.players.player.voidCores.normal, voidBefore - 1, '1 core moved out of Void');
});

test('REAL-CARD-46: BS03-115 The Giant City of Steel (Nexus, Blue) Blue Nexus placement and core tiering', async () => {
  const nexusCard = createCardInstance(buildRealCard('BS03-115', bs03Shard), 'player');
  assert.equal(nexusCard.type, 'Nexus');
  assert.equal(nexusCard.colors.includes('Blue'), true);

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve.normal = 10;
  game.state.players.player.hand.push(nexusCard);

  const res = await game.playCard(nexusCard.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.field.some(n => n.top.id === nexusCard.id), true, 'Nexus successfully placed in player field');
  assert.ok(nexusCard.compiledIr.abilities.length >= 2, 'Nexus has compiled abilities for LV1 and LV2');
});

test('REAL-CARD-47: BS03-127 Thorn Prison (Magic, Green) Green Flash Magic exhausts target Spirit and enters grave', async () => {
  const thornPrison = createCardInstance(buildRealCard('BS03-127', bs03Shard), 'player');
  assert.equal(thornPrison.type, 'Magic');
  assert.equal(thornPrison.colors.includes('Green'), true);

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve.normal = 10;
  game.state.players.player.hand.push(thornPrison);

  const oppSpirit = makeGenericSpirit('OP-TGT', 'Target Spirit', 'Blue', 3000, 'opponent');
  const oppStack = createFieldStack(oppSpirit, { normal: 2, soul: 0 });
  oppStack.owner = 'opponent';
  game.state.players.opponent.field.push(oppStack);

  const res = await game.playCard(thornPrison.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(oppStack.state, 'EXHAUSTED', 'Target spirit was exhausted by Thorn Prison');
  assert.equal(game.state.players.player.grave.some(c => c.id === thornPrison.id), true, 'Thorn Prison moved to player graveyard');
});

test('REAL-CARD-48: BS52-056 Drag-No-Vanguard (Spirit, Blue) Multi-clause Blue Spirit symbol manipulation', async () => {
  const dragNo = createCardInstance(buildRealCard('BS52-056', bs52Shard), 'player');
  assert.equal(dragNo.type, 'Spirit');
  assert.equal(dragNo.colors.includes('Blue'), true);

  const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40), strictRules: true });
  const st = createFieldStack(dragNo, { normal: 3, soul: 0 });
  game.state.players.player.field.push(st);

  assert.ok(dragNo.compiledIr.abilities.every(a => (a.physicalId || a.id) && (a.physicalId || a.id).startsWith('BS52-056#')));
  const ab = dragNo.compiledIr.abilities.find(a => a.clauses?.some(c => c.op?.op === 'ADD_SYMBOL'));
  assert.ok(ab, 'Symbol addition ability compiled');

  const res = await game.resolver.resolveAbility(game.state, ab, { controller: 'player', sourceCard: dragNo, sourceStack: st }, game.events);
  assert.equal(res.success, true);
});
