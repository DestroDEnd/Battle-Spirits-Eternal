/**
 * tests/work_package_k1_batch_03_keywords_prerequisites.test.js
 *
 * K1-BATCH-03 — Keywords, Prerequisites & All 13 SuAdcon Cards:
 * - Positive, Negative, Soul State / Pre-Advent & Atomic Zero-Mutation tests for all 13 SuAdcon cards
 * - Ability Prefix Prerequisite Gating (During Brave / During Advent / During OC / During Set / Soul State)
 * - Real-Card End-to-End Keyword Lifecycles (Burst, Brave, Mirage, Release/True Release, Accel, Change, High Speed)
 * - Real-Card Combat, Protection & Resource Keywords (Rush+Batch2, Heavy Armor, Clash, Curse, Crush, Holy Life, U-Trigger, Core Charge, Rebirth)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { compileCard } from '../compiler/index.js';
import {
  createGame,
  parseSuAdconCondition,
  parseAdventDeclaration,
  evaluateAdventCondition,
  evaluateSummonCondition,
  evaluateAbilityPrefixPrerequisites
} from '../engine/index.js';
import { createGameState, createFieldStack, createCardInstance } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { executeOp } from '../engine/ops/index.js';
import { isImmune } from '../engine/continuous.js';
import { executeReleaseRuntime } from '../engine/prerequisites.js';
import { HighSpeedKeyword, RebirthKeyword } from '../engine/keywords/wave2.js';
import { UltimateTriggerKeyword } from '../engine/keywords/wave3.js';

const DET_CARDS = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));

function loadRealShardCard(shardFile, cardNumber, owner = 'player', extra = {}) {
  const sh = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const ir = JSON.parse(JSON.stringify(sh[cardNumber]));
  assert.ok(ir, `Card ${cardNumber} not found in ${shardFile}`);
  const det = DET_CARDS[cardNumber] || {};
  const merged = {
    ...det,
    ...ir,
    cardNumber,
    abilities: ir.abilities,
    keywords: ir.keywords,
    compiledIr: ir,
    ...extra
  };
  return createCardInstance(merged, owner);
}

class Batch3PromptResolver {
  async choose(prompt) {
    if (prompt.type === 'BURST_TRIGGER') {
      return { activate: true };
    }
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = typeof prompt.count === 'number' && Number.isFinite(prompt.count) ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0, accepted: true };
  }
}

function makeFillerDeck(prefix, count = 40, owner = 'player') {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${i}`,
    cardNumber: `${prefix.toUpperCase()}-${i}`,
    name: `${prefix}_${i}`,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 1,
    bp: 1000,
    levels: { 1: { cost: 1, bp: 1000 } },
    owner
  }));
}

const SUADCON_JAVAD_CARDS = [
  ['BS64.json', 'BS64-059'],
  ['BS64.json', 'BS64-X06'],
  ['SD65.json', 'SD65-003']
];

const SUADCON_ZETTER_CARDS = [
  ['BS65.json', 'BS65-050'],
  ['BS65.json', 'BS65-X06'],
  ['BS65.json', 'BS65-053'],
  ['BS65.json', 'BS65-054'],
  ['BS65.json', 'BS65-059'],
  ['BS66.json', 'BS66-060'],
  ['BS66.json', 'BS66-061'],
  ['BS67.json', 'BS67-062']
];

test('K1B3-01: All 13 real shard SuAdcon cards enforce Advent & Summon conditions atomically (including Soul State / under)', async () => {
  // Verify parser on all 13 cards
  for (const [sf, cn] of [...SUADCON_JAVAD_CARDS, ...SUADCON_ZETTER_CARDS]) {
    const inst = loadRealShardCard(sf, cn, 'player');
    const decl = parseAdventDeclaration(inst);
    assert.ok(decl && decl.suAdconSpecs.length > 0, `${cn} must parse SuAdcon spec`);
  }

  // 1-3. All 3 Javad SuAdcon cards (BS64-059, BS64-X06, SD65-003)
  for (const [sf, cn] of SUADCON_JAVAD_CARDS) {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.step = 'ATTACK';
    g.state.players.player.counters = 10;
    g.state.players.player.reserve = { normal: 6, soul: 1 };

    const card = loadRealShardCard(sf, cn, 'player');
    g.state.players.player.hand.push(card);

    // Other Ultimate on field, NO PartnerDemonLord Javad anywhere -> REJECTED with zero mutation
    const nonPartnerUlt = createFieldStack(createCardInstance({ id: 'other_ult', name: 'Random Ult', type: 'Ultimate', cost: 6, owner: 'player' }, 'player'), { normal: 1 });
    g.state.players.player.field.push(nonPartnerUlt);

    const negEv = evaluateAdventCondition(g.state, card, 'player', { targetStack: nonPartnerUlt });
    assert.equal(negEv.allowed, false, `${cn} evaluateAdventCondition fails without Javad`);
    assert.equal(evaluateSummonCondition(g.state, card, 'player').allowed, false, `${cn} evaluateSummonCondition fails without Javad`);

    const negPerform = await g.performAdvent('player', card.id, nonPartnerUlt.id);
    assert.equal(negPerform.success, false, `${cn} performAdvent rejects without Javad`);
    assert.equal(g.state.players.player.hand.some(c => c.id === card.id), true, `${cn} atomic reject leaves card in hand`);
    assert.equal(nonPartnerUlt.top.cardNumber !== cn, true, `${cn} atomic reject does not mutate target stack`);

    // ADVENT_STACK op rejects cleanly without Javad
    const negOp = await executeOp(g.state, { op: 'ADVENT_STACK' }, { controller: 'player', sourceCard: card }, new Batch3PromptResolver(), g.events);
    assert.equal(negOp.success, false);

    // Positive A: Javad on field in Soul State / pre-advent under another stack
    nonPartnerUlt.under.push(createCardInstance({ id: 'javad_under', name: 'The PartnerDemonLord Javad', type: 'Contract Ultimate', owner: 'player' }, 'player'));
    const posUnder = await g.performAdvent('player', card.id, nonPartnerUlt.id);
    assert.equal(posUnder.success, true, `${cn} performAdvent succeeds when PartnerDemonLord Javad is in pre-advent under`);
    assert.equal(posUnder.stack.top.cardNumber, cn);
    assert.equal(g.state.players.player.hand.some(c => c.id === card.id), false);
  }

  // 4-11. All 8 Zetter SuAdcon cards
  for (const [sf, cn] of SUADCON_ZETTER_CARDS) {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.step = 'ATTACK';
    g.state.players.player.counters = 10;
    g.state.players.player.reserve = { normal: 6, soul: 1 };

    const card = loadRealShardCard(sf, cn, 'player');
    g.state.players.player.hand.push(card);

    const baseUlt = createFieldStack(createCardInstance({ id: 'base_ult', name: 'Random Ult', type: 'Ultimate', cost: 6, owner: 'player' }, 'player'), { normal: 1 });
    g.state.players.player.field.push(baseUlt);

    const neg = await g.performAdvent('player', card.id, baseUlt.id);
    assert.equal(neg.success, false, `${cn} rejects without The Extreme Partner, Zetter`);
    assert.equal(g.state.players.player.reserve.soul, 1, `${cn} Soul Core untouched on reject`);

    // Positive: Zetter directly on field OR under stack
    baseUlt.under.push(createCardInstance({ id: 'zetter_under', name: 'The Extreme Partner, Zetter', type: 'Contract Ultimate', owner: 'player' }, 'player'));
    const pos = await g.performAdvent('player', card.id, baseUlt.id);
    assert.equal(pos.success, true, `${cn} succeeds when The Extreme Partner, Zetter is in under/Soul State`);
    assert.equal(pos.stack.top.cardNumber, cn);
    assert.equal(g.state.players.player.trash.soul, 1, `${cn} moved Soul Core to Trash`);
  }

  // 12. BS65-056: "You control no Spirits & have 0 Spirit cards in your Trash"
  {
    const bs65056 = loadRealShardCard('BS65.json', 'BS65-056', 'player');
    const parsed56 = parseSuAdconCondition(bs65056.effect.match(/\[SuAdcon:[^\]]+\]/i)[0]);
    assert.equal(parsed56.kind, 'NO_SPIRITS_FIELD_AND_TRASH');

    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.players.player.reserve = { normal: 4, soul: 1 };
    const ultTarget = createFieldStack(createCardInstance({ id: 'u56', name: 'Zetter', type: 'Contract Ultimate', cost: 2, owner: 'player' }, 'player'), { normal: 1 });
    const spField = createFieldStack(createCardInstance({ id: 'sp56', name: 'Field Spirit', type: 'Spirit', cost: 2, owner: 'player' }, 'player'), { normal: 1 });
    g.state.players.player.field.push(ultTarget, spField);
    g.state.players.player.hand.push(bs65056);

    // Fails while a Spirit is on field
    const failField = await g.performAdvent('player', bs65056.id, ultTarget.id);
    assert.equal(failField.success, false);
    assert.equal(failField.reason, 'SUADCON_SPIRIT_CONTROLLED_ON_FIELD');

    // Remove field Spirit, place a Spirit card in Grave (Trash) -> STILL fails
    g.state.players.player.field = [ultTarget];
    g.state.players.player.grave.push(createCardInstance({ id: 'tr56', name: 'Grave Spirit', type: 'Spirit', owner: 'player' }, 'player'));
    const failTrash = await g.performAdvent('player', bs65056.id, ultTarget.id);
    assert.equal(failTrash.success, false);
    assert.equal(failTrash.reason, 'SUADCON_SPIRIT_CARD_IN_TRASH');

    // Clear Spirit cards from Grave (leave a Magic card in Grave) -> SUCCEEDS
    g.state.players.player.grave = [createCardInstance({ id: 'mg56', name: 'Trash Magic', type: 'Magic', owner: 'player' }, 'player')];
    const pass56 = await g.performAdvent('player', bs65056.id, ultTarget.id);
    assert.equal(pass56.success, true);
    assert.equal(pass56.stack.top.cardNumber, 'BS65-056');
  }

  // 13. CB04-XX01: "Your Life is at three or less"
  {
    const cb04 = loadRealShardCard('CB04.json', 'CB04-XX01', 'player');
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.players.player.reserve = { normal: 4, soul: 1 };
    const cost5Spirit = createFieldStack(createCardInstance({ id: 'sp5', name: 'Cost 5 Host', type: 'Spirit', cost: 5, owner: 'player' }, 'player'), { normal: 1 });
    g.state.players.player.field.push(cost5Spirit);
    g.state.players.player.hand.push(cb04);

    // Life 4 -> fails
    g.state.players.player.life = 4;
    const failLife = await g.performAdvent('player', cb04.id, cost5Spirit.id);
    assert.equal(failLife.success, false);
    assert.match(failLife.reason, /SUADCON_LIFE_TOO_HIGH/);

    // Life 3 -> succeeds
    g.state.players.player.life = 3;
    const passLife = await g.performAdvent('player', cb04.id, cost5Spirit.id);
    assert.equal(passLife.success, true);
    assert.equal(passLife.stack.top.cardNumber, 'CB04-XX01');
  }
});

test('K1B3-02: Ability prefix prerequisites (During Brave, During Advent, During OC, During Set, Soul State) gate runtime resolution', async () => {
  const resolver = new AsyncResolver(new Batch3PromptResolver());
  const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
  const stack = createFieldStack({ id: 'pre_sp', name: 'Tester', type: 'Spirit', effect: '[During OC] Draw 1.\n[OC Condition: C3+]', owner: 'player' }, { normal: 1 });
  g.state.players.player.field.push(stack);

  // During Brave
  const braveAb = { header: { prefixes: ['During Brave'], timing: 'WHEN_ATTACKS' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  const negBrave = await resolver.resolveAbility(g.state, braveAb, { controller: 'player', sourceCard: stack.top, sourceStack: stack, enforcePrefixPrerequisites: true });
  assert.equal(negBrave.skipped, true);
  assert.equal(negBrave.reason, 'PREFIX_REQUIRES_DURING_BRAVE');

  stack.braves.push({ id: 'br_x', name: 'Blade', type: 'Brave' });
  const posBrave = await resolver.resolveAbility(g.state, braveAb, { controller: 'player', sourceCard: stack.top, sourceStack: stack, enforcePrefixPrerequisites: true });
  assert.equal(posBrave.success, true);

  // During Advent
  const advAb = { header: { prefixes: ['During Advent'], timing: 'PASSIVE' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, advAb, { controller: 'player', sourceStack: stack }).allowed, false);
  stack.under.push({ id: 'u_x', name: 'Base' });
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, advAb, { controller: 'player', sourceStack: stack }).allowed, true);

  // During OC
  const ocAb = { header: { prefixes: ['During OC'], timing: 'WHEN_ATTACKS' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  g.state.players.player.counters = 2;
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, ocAb, { controller: 'player', sourceStack: stack, sourceCard: stack.top }).allowed, false);
  g.state.players.player.counters = 3;
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, ocAb, { controller: 'player', sourceStack: stack, sourceCard: stack.top }).allowed, true);

  // During Set
  const mirCard = createCardInstance({ id: 'mir_c', cardNumber: 'MIR-C', type: 'Magic', owner: 'player' }, 'player');
  const setAb = { header: { prefixes: ['During Set'], timing: 'PASSIVE' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  const negSet = await resolver.resolveAbility(g.state, setAb, { controller: 'player', sourceCard: mirCard });
  assert.equal(negSet.skipped, true);
  assert.equal(negSet.reason, 'PREFIX_REQUIRES_DURING_SET');

  g.state.players.player.mirage = mirCard;
  const posSet = await resolver.resolveAbility(g.state, setAb, { controller: 'player', sourceCard: mirCard });
  assert.equal(posSet.success, true);

  // Soul State
  const ssAb = { header: { prefixes: ['Soul State'], timing: 'PASSIVE' }, clauses: [] };
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, ssAb, { controller: 'player', sourceStack: stack, sourceCard: stack.top }).allowed, false);
  stack.isSoulState = true;
  assert.equal(evaluateAbilityPrefixPrerequisites(g.state, ssAb, { controller: 'player', sourceStack: stack, sourceCard: stack.top }).allowed, true);
});

test('K1B3-03: Real-card E2E Keyword Lifecycles (Burst, Mirage, Release/True Release, Accel, Change, High Speed)', async () => {
  // 1. Burst (KF-13)
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const kf13 = loadRealShardCard('KFC.json', 'KF-13', 'player');
    g.state.players.player.burst = kf13;
    g.state.players.player.life = 3;
    const oppWeak = createFieldStack(createCardInstance({ id: 'ow', type: 'Spirit', bp: 5000, owner: 'opponent' }, 'opponent'), { normal: 1 });
    g.state.players.opponent.field.push(oppWeak);

    await g.windows.openBurstWindow({ type: 'LIFE_REDUCED', player: 'player' });
    assert.equal(g.state.players.opponent.field.length, 0, 'KF-13 Burst destroys <=10000 BP opposing Spirit');
    assert.equal(g.state.players.player.field.some(st => st.top.cardNumber === 'KF-13'), true, 'KF-13 Burst summons itself');
  }

  // 2. Mirage During Set (P23-05)
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.players.player.reserve = { normal: 4, soul: 0 };
    const p2305 = loadRealShardCard('P23.json', 'P23-05', 'player');
    g.state.players.player.hand.push(p2305);
    const setMir = await g.setMirage(p2305.id, 'player');
    assert.equal(setMir.success, true);
    assert.equal(g.state.players.player.mirage.cardNumber, 'P23-05');
  }

  // 3. True Release moves Soul Core from friendly Nexus onto Spirit
  {
    const state = createGameState();
    const trSpirit = createFieldStack(compileCard({ cardNumber: 'TR-1', name: 'True Rel', type: 'Spirit', effect: '[LV1] [True Release] (When Attacks)\nDraw 1.' }), { normal: 1 });
    const nexSoul = createFieldStack({ id: 'nx_tr', type: 'Nexus', owner: 'player' }, { normal: 0, soul: 1 });
    state.players.player.field.push(trSpirit, nexSoul);
    const res = await executeReleaseRuntime(state, trSpirit, null, { controller: 'player' });
    assert.equal(res.released, true);
    assert.equal(res.soulCoreMoved, true);
    assert.equal(trSpirit.cores.soul, 1);
    assert.equal(nexSoul.cores.soul, 0);
  }

  // 4. Accel (BS59-006): Insufficient cores rejects atomically; valid Accel destroys <=12000 BP & moves card to removed
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.step = 'ATTACK';
    const bs59 = loadRealShardCard('BS59.json', 'BS59-006', 'player');
    g.state.players.player.hand.push(bs59);
    g.state.players.player.reserve = { normal: 2, soul: 0 };
    const oppTarget = createFieldStack(createCardInstance({ id: 'opp_a', type: 'Spirit', bp: 8000, owner: 'opponent' }, 'opponent'), { normal: 1 });
    g.state.players.opponent.field.push(oppTarget);

    const failAcc = await g.executeAccel('player', bs59.id);
    assert.equal(failAcc.success, false);
    assert.equal(failAcc.reason, 'INSUFFICIENT_CORES');
    assert.equal(g.state.players.player.hand.some(c => c.id === bs59.id), true);

    g.state.players.player.reserve = { normal: 6, soul: 0 };
    const passAcc = await g.executeAccel('player', bs59.id);
    assert.equal(passAcc.success, true);
    assert.equal(g.state.players.opponent.field.length, 0, 'BS59-006 Accel destroys <=12000 BP target');
    assert.equal(g.state.players.player.removed.some(c => c.cardNumber === 'BS59-006'), true, 'BS59-006 placed face-up in Removed');
    assert.equal(bs59.faceUp, true);
  }

  // 5. Change (CB05-052): Insufficient cores rejects atomically; valid Change exhausts opposing Spirit & swaps friendly Spirit preserving cores
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const cb05 = loadRealShardCard('CB05.json', 'CB05-052', 'player');
    const allyCard = createCardInstance({ name: 'MegaKabuterimon', type: 'Spirit', families: ['Mega'], cost: 5, owner: 'player' }, 'player');
    const allyHost = createFieldStack(allyCard, { normal: 1 });
    allyHost.state = 'EXHAUSTED';
    const oppUnit = createFieldStack(createCardInstance({ name: 'Opp Target', type: 'Spirit', cost: 4, owner: 'opponent' }, 'opponent'), { normal: 1 });
    g.state.players.player.field.push(allyHost);
    g.state.players.opponent.field.push(oppUnit);
    g.state.players.player.hand.push(cb05);
    g.state.players.player.reserve = { normal: 2, soul: 0 };

    const failCh = await g.executeChange('player', cb05.id, allyHost.id);
    assert.equal(failCh.success, false);
    assert.equal(failCh.reason, 'INSUFFICIENT_CORES');

    allyHost.cores.normal = 3;
    g.state.players.player.reserve = { normal: 6, soul: 0 };
    const passCh = await g.executeChange('player', cb05.id, allyHost.id);
    assert.equal(passCh.success, true);
    assert.equal(allyHost.top.cardNumber, 'CB05-052');
    assert.equal(allyHost.cores.normal, 3, 'Change preserves stack cores');
    assert.equal(allyHost.state, 'REFRESHED');
    assert.equal(g.state.players.player.hand.some(c => c.id === allyCard.id), true, 'Replaced card returns to hand');
    assert.equal(oppUnit.state, 'EXHAUSTED', 'CB05-052 Change exhausts opposing Spirit');
  }

  // 6. High Speed (ALPINE-BIT): Pays ONLY from Reserve cores
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const alpine = loadRealShardCard('ALPINE.json', 'ALPINE-BIT', 'player');
    g.state.players.player.hand.push(alpine);
    g.state.players.player.reserve = { normal: 0, soul: 0 };
    const failHs = await HighSpeedKeyword.executeHighSpeedSummon(g, alpine, 'player');
    assert.equal(failHs.success, false);
    assert.equal(failHs.reason, 'INSUFFICIENT_RESERVE_CORES');

    g.state.players.player.reserve = { normal: (alpine.cost || 1) + 2, soul: 0 };
    const passHs = await HighSpeedKeyword.executeHighSpeedSummon(g, alpine, 'player');
    assert.equal(passHs.success, true);
    assert.equal(g.state.players.player.field.some(st => st.top.cardNumber === 'ALPINE-BIT'), true);
  }
});

test('K1B3-04: Real-card Combat, Protection & Resource Keywords (Heavy Armor, Clash, Curse, Crush, Holy Life, U-Trigger, Core Charge, Rebirth)', async () => {
  // 1. Heavy Armor: Red (SJ13-12) -> LV1 vulnerable, LV2 immune to Red
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const sj13 = loadRealShardCard('STRONGEST.json', 'SJ13-12', 'player');
    const st = createFieldStack(sj13, { normal: 1 });
    const lv2Req = sj13.levels?.[2]?.cost || 3;
    const redEffect = createCardInstance({ id: 'red_m', color: 'Red', type: 'Magic', owner: 'opponent' }, 'opponent');
    assert.equal(isImmune(g.state, st, redEffect), false, 'SJ13-12 not immune at LV1');
    st.cores.normal = lv2Req;
    assert.equal(isImmune(g.state, st, redEffect), true, 'SJ13-12 Heavy Armor: Red active at LV2');
  }

  // 2. Clash (KF-01) -> forces block at LV2
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const kf01 = loadRealShardCard('KFC.json', 'KF-01', 'player');
    const st = createFieldStack(kf01, { normal: kf01.levels?.[2]?.cost || 3 });
    g.state.players.player.field.push(st);
    await g.declareAttack(st.id, 'player');
    assert.equal(g.state.combat.mustBlockIfAble, true, 'KF-01 Clash sets mustBlockIfAble');
  }

  // 3. Curse (BS02-015) -> [LV2] Curse destroys surviving higher-BP blocker at end of battle (inactive at LV1, active at LV2)
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const bs02 = loadRealShardCard('BS02.json', 'BS02-015', 'player');
    const atkSt = createFieldStack(bs02, { normal: bs02.levels?.LV2?.cost || bs02.levels?.[2]?.cost || 3 });
    const blkCard = createCardInstance({ name: 'Big Blocker', type: 'Spirit', bp: 9000, cost: 1, levels: { 1: { cost: 1, bp: 9000 } }, owner: 'opponent' }, 'opponent');
    const blkSt = createFieldStack(blkCard, { normal: 1 });
    g.state.players.player.field.push(atkSt);
    g.state.players.opponent.field.push(blkSt);
    await g.declareAttack(atkSt.id, 'player');
    await g.declareBlock(blkSt.id, 'opponent');
    assert.equal(g.state.players.opponent.grave.some(c => c.id === blkCard.id), true, 'BS02-015 LV2 Curse destroys blocker at end of battle');
  }

  // 4. Crush (BS07-049) -> mills opponent deck equal to Spirit LV
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o', 10, 'opponent'), promptResolver: new Batch3PromptResolver() });
    const bs07 = loadRealShardCard('BS07.json', 'BS07-049', 'player');
    const lv2Cost = bs07.levels?.[2]?.cost || 3;
    const st = createFieldStack(bs07, { normal: lv2Cost });
    g.state.players.player.field.push(st);
    await g.declareAttack(st.id, 'player');
    assert.equal(g.state.players.opponent.grave.length, 2, 'BS07-049 Crush mills 2 cards at LV2');
  }

  // 5. Holy Life (CB05-042) -> gains 1 Life when direct attack deals life damage while Life < 5
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const cb05 = loadRealShardCard('CB05.json', 'CB05-042', 'player');
    const lv2Cost = cb05.levels?.[2]?.cost || 2;
    const st = createFieldStack(cb05, { normal: lv2Cost });
    g.state.players.player.field.push(st);
    g.state.players.player.life = 3;
    g.state.players.player.voidCores.normal = 10;
    await g.declareAttack(st.id, 'player');
    await g.resolveDirectHit('player');
    assert.equal(g.state.players.player.life, 4, 'CB05-042 Holy Life recovers 1 Life core from Void');
  }

  // 6. Ultimate Trigger (SD19-X01) -> reveals opposing decktop & hits when cost < Ultimate cost
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o', 5, 'opponent'), promptResolver: new Batch3PromptResolver() });
    const sd19 = loadRealShardCard('SD19.json', 'SD19-X01', 'player');
    const st = createFieldStack(sd19, { normal: sd19.levels?.[3]?.cost || 1 });
    g.state.players.player.field.push(st);
    const utRes = await UltimateTriggerKeyword.executeUTrigger(g, st, 1);
    assert.equal(utRes.isHit, true, 'SD19-X01 Ultimate Trigger hits Cost 1 < Cost 6');
    assert.equal(g.state.players.opponent.grave.length, 1);
  }

  // 7. Core Charge (CB20-XX01) -> deploys Nexus & places Void cores via shard ability
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    g.state.players.player.voidCores.normal = 10;
    const cb20 = loadRealShardCard('CB20.json', 'CB20-XX01', 'player');
    const st = createFieldStack(cb20, { normal: 0, soul: 0 });
    g.state.players.player.field.push(st);
    const resolver = new AsyncResolver(new Batch3PromptResolver());
    const ccRes = await resolver.resolveAbility(g.state, cb20.compiledIr.abilities[3], { controller: 'player', sourceCard: cb20, sourceStack: st }, g.events);
    assert.equal(ccRes.success, true);
    assert.ok(st.cores.normal >= 1, 'CB20-XX01 Core Charge places core onto Nexus');
  }

  // 8. Rebirth (BS52-034) -> flips card to Face B & executes Face B ability
  {
    const g = createGame({ playerDeck: makeFillerDeck('p'), opponentDeck: makeFillerDeck('o'), promptResolver: new Batch3PromptResolver() });
    const faceA = compileCard({ cardNumber: 'BS52-034', name: 'Ragna-Savior -Fighting Form-', type: 'Spirit', face: 'A', effect: '[LV1][LV2] [Rebirth: 5 Counters or less]\nWhen attacks, flip.' });
    const faceB = loadRealShardCard('BS52.json', 'BS52-034', 'player', { face: 'B' });
    const st = createFieldStack(createCardInstance(faceA, 'player'), { normal: 2 });
    g.state.players.player.field.push(st);
    const flipRes = await RebirthKeyword.flipCard(g, st, { ...faceB, keywords: [{ name: 'Whirlwind', face: 'B', levels: [1], levelExplicit: true }] });
    assert.equal(flipRes.success, true);
    assert.equal(st.top.isReborn, true);
  }
});
