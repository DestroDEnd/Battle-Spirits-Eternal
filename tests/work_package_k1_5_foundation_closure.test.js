import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { compileCard } from '../compiler/index.js';
import { parseAbilityHeaders } from '../compiler/header_parser.js';
import {
  createAbilityDescriptor,
  createAbilityDescriptorV3,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  deriveSemanticAbilityIdV3
} from '../compiler/identity.js';
import {
  createGame,
  evaluateBraveCondition,
  evaluateSummonCondition,
  parseMirageDeclaration,
  setMirageFromHand,
  getActiveMirageAbilities,
  parseReleaseDeclaration,
  executeReleaseRuntime,
  hasTeam
} from '../engine/index.js';
import { createGameState, createFieldStack, createCardInstance, getTotalPlayerCores } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { computeEffectiveBP, computeLevel } from '../engine/continuous.js';
import { queryCandidates, resolveTargets } from '../engine/selectors.js';
import { evaluateStructuredCondition, CONDITION_RESULT, parseConditionToStructured } from '../engine/conditions.js';
import { buildVerifiedOperationRegistry } from '../scripts/audit_514_cards_exhaustive.mjs';
import { assertApprovedFileHash, isApprovedFileHash } from '../scripts/versioned_baseline_registry.mjs';

class DeterministicPromptResolver {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = typeof prompt.count === 'number' && Number.isFinite(prompt.count) ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0 };
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

function loadShardCard(shardFile, cardNumber) {
  const sh = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const card = sh[cardNumber];
  assert.ok(card, `Card ${cardNumber} not found in ${shardFile}`);
  return JSON.parse(JSON.stringify(card));
}

function loadDetailedCard(cardNumber) {
  const det = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));
  const card = det[cardNumber];
  assert.ok(card, `Card ${cardNumber} not found in data/cards_detailed.json`);
  return JSON.parse(JSON.stringify(card));
}

test('K1.5-A1: Production compiler/identity.js integrates V3 semanticIdV3 & timingSemantics while keeping V2 physicalId/semanticId backward-compatible', () => {
  const compiledOpp = compileCard({
    cardNumber: 'K15-OPP-01',
    name: 'Test Opp Destroyed',
    type: 'Spirit',
    color: 'White',
    cost: 3,
    effect: '[LV1][LV2] (When Destroyed by the Opponent)\nDraw 1 card.'
  });
  const compiledAny = compileCard({
    cardNumber: 'K15-ANY-01',
    name: 'Test Any Destroyed',
    type: 'Spirit',
    color: 'White',
    cost: 3,
    effect: '[LV1][LV2] (When Destroyed)\nDraw 1 card.'
  });

  const abOpp = compiledOpp.abilities[0];
  const abAny = compiledAny.abilities[0];

  assert.equal(abOpp.header.timingCause, 'OPPONENT');
  assert.equal(abAny.header.timingCause, 'ANY');
  assert.ok(abOpp.semanticIdV3.startsWith('SEM3#AB_WHEN_DESTROYED_'));
  assert.notEqual(abOpp.semanticIdV3, abAny.semanticIdV3, 'V3 semanticIdV3 must separate opponent-only vs unrestricted destruction');
  assert.equal(abOpp.timingSemantics.timingCause, 'OPPONENT');

  // V2 backward compatibility check against real frozen shard cards
  const bs01Card = loadShardCard('BS01.json', 'BS01-034');
  const firstAb = bs01Card.abilities[0];
  const descV2 = createAbilityDescriptor(firstAb);
  assert.equal(derivePhysicalAbilityId(bs01Card.cardNumber, descV2, 1), firstAb.physicalId);
  assert.equal(deriveSemanticAbilityId(descV2), firstAb.semanticId);

  const descV3 = createAbilityDescriptorV3(firstAb);
  assert.ok(deriveSemanticAbilityIdV3(descV3).startsWith('SEM3#AB_'));
});

test('K1.5-A2: Header parser resolves leaked multi-line timingLabels, original-cost restriction, Depleted/Destroyed, and nested Mirage/Brave/Summon headers', () => {
  const origCost = parseAbilityHeaders('[LV1] (When summoned by paying the original cost)\nDraw 1 card.');
  assert.equal(origCost.timing, 'WHEN_SUMMONED');
  assert.ok(origCost.activationRestrictions.includes('PAID_ORIGINAL_COST'));
  assert.equal(origCost.cleanBody, 'Draw 1 card.');

  const depDest = parseAbilityHeaders('[LV1][LV2] (When Depleted/Destroyed by the Opponent)\nDraw 1 card.');
  assert.equal(depDest.timing, 'WHEN_DESTROYED');
  assert.equal(depDest.timingCause, 'OPPONENT');
  assert.deepEqual(depDest.timingTriggers, ['WHEN_DEPLETED', 'WHEN_DESTROYED']);

  const bs60 = parseAbilityHeaders('[Mirage: Cost 2 ([Blue Core]]}\n[During Set]\nDraw 1 card.');
  assert.equal(bs60.prefixes[0], 'Mirage: Cost 2 (Blue Core)');
  assert.ok(!bs60.cleanBody.startsWith('}'));

  const bs35Brave = parseAbilityHeaders('[Brave Condition: [Right] Cost 4 or more<br>[Left] Cost 4 or more]');
  assert.equal(bs35Brave.cleanBody, '');
  assert.ok(/\[Right\].*Cost 4 or more.*\[Left\].*Cost 4 or more/i.test(bs35Brave.keyword));

  const a76Summon = parseAbilityHeaders('[Summon Condition: You must have 1 or more White spirits on your field.');
  assert.equal(a76Summon.cleanBody, '');
  assert.ok(/Summon Condition/i.test(a76Summon.keyword));
});

test('K1.5-B1 & B2: Runtime Brave Condition (multi-slot + ownership) and Summon Condition enforce legality cleanly without partial mutation', async () => {
  const game = createGame({
    playerDeck: makeFillerDeck('p', 40, 'player'),
    opponentDeck: makeFillerDeck('o', 40, 'opponent'),
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver()
  });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 10, soul: 1 };

  const bs35Det = loadDetailedCard('BS35-067');
  const bs35Ir = compileCard({ ...bs35Det, cardNumber: 'BS35-067' });
  const braveInst = createCardInstance({
    ...bs35Det,
    id: 'bs35_brave',
    cardNumber: 'BS35-067',
    compiledIr: bs35Ir,
    abilities: bs35Ir.abilities
  }, 'player');

  const lowOwn = createFieldStack({ id: 'own_low', cardNumber: 'L1', type: 'Spirit', cost: 2, bp: 1000, owner: 'player' }, { normal: 1 });
  const highOwn = createFieldStack({ id: 'own_high', cardNumber: 'H1', type: 'Spirit', cost: 5, bp: 5000, owner: 'player' }, { normal: 1 });
  const highOpp = createFieldStack({ id: 'opp_high', cardNumber: 'OH1', type: 'Spirit', cost: 5, bp: 5000, owner: 'opponent' }, { normal: 1 });

  game.state.players.player.field.push(lowOwn, highOwn);
  game.state.players.opponent.field.push(highOpp);
  game.state.players.player.hand.push(braveInst);

  // Negative 1: cannot brave onto opponent Spirit
  const resOpp = await game.playCard(braveInst.id, [], 'player', { braveTargetStackId: highOpp.id });
  assert.equal(resOpp.success, false);
  assert.equal(resOpp.reason, 'BRAVE_CONDITION_NOT_MET');
  assert.equal(game.state.players.player.reserve.normal, 10);

  // Negative 2: Cost 2 violates Cost 4 or more
  const resLow = await game.playCard(braveInst.id, [], 'player', { braveTargetStackId: lowOwn.id });
  assert.equal(resLow.success, false);
  assert.equal(resLow.reason, 'BRAVE_CONDITION_NOT_MET');
  assert.equal(game.state.players.player.reserve.normal, 10);

  // Positive: Cost 5 owned Spirit on Right/Left slot succeeds
  const resOk = await game.playCard(braveInst.id, [], 'player', { braveTargetStackId: highOwn.id, braveSlot: 'Right' });
  assert.equal(resOk.success, true);
  assert.equal(highOwn.braves.length, 1);

  // Summon Condition: BATTLE-SPIRITS-A76 requires 1+ White Spirit on field
  const a76Det = loadDetailedCard('BATTLE-SPIRITS-A76');
  const a76Ir = compileCard({ ...a76Det, cardNumber: 'BATTLE-SPIRITS-A76' });
  const a76Inst = createCardInstance({
    ...a76Det,
    id: 'ult_a76',
    cardNumber: 'BATTLE-SPIRITS-A76',
    cost: 4,
    type: 'Ultimate',
    compiledIr: a76Ir,
    abilities: a76Ir.abilities
  }, 'player');
  game.state.players.player.hand.push(a76Inst);

  const badSummon = await game.playCard(a76Inst.id, [], 'player');
  assert.equal(badSummon.success, false);
  assert.equal(badSummon.reason, 'SUMMON_CONDITION_NOT_MET');

  game.state.players.player.field.push(createFieldStack({ id: 'wh_sp', type: 'Spirit', color: 'White', colors: ['White'], cost: 2, owner: 'player' }, { normal: 1 }));
  const goodSummon = await game.playCard(a76Inst.id, [], 'player');
  assert.equal(goodSummon.success, true);
});

test('K1.5-B3 & B4: Runtime Mirage replacement & During Set execution + Release / True Release atomic core movement', async () => {
  const game = createGame({
    playerDeck: makeFillerDeck('p', 40, 'player'),
    opponentDeck: makeFillerDeck('o', 40, 'opponent'),
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver()
  });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 6, soul: 0 };

  const oldMirage = createCardInstance({
    id: 'mir_old',
    cardNumber: 'MIR-OLD',
    type: 'Spirit',
    cost: 4,
    compiledIr: { abilities: [{ type: 'ABILITY', header: { prefixes: ['Mirage: Cost 1 (Red Core)'], timing: 'PASSIVE' }, clauses: [] }] }
  }, 'player');
  const newMirage = createCardInstance({
    id: 'mir_new',
    cardNumber: 'MIR-NEW',
    type: 'Magic',
    cost: 4,
    compiledIr: {
      abilities: [
        { type: 'ABILITY', header: { prefixes: ['Mirage: Cost 2 (Blue Core)'], timing: 'PASSIVE' }, clauses: [] },
        {
          type: 'ABILITY',
          header: { prefixes: ['During Set'], timing: 'WHEN_ATTACKS', levels: [1, 2, 3] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');
  game.state.players.player.mirage = oldMirage;
  game.state.players.player.hand.push(newMirage);

  const mirEvents = [];
  game.events.on('MIRAGE_SET', e => mirEvents.push(e));

  const setRes = await game.setMirage(newMirage.id, 'player');
  assert.equal(setRes.success, true);
  assert.equal(game.state.players.player.mirage.id, newMirage.id);
  assert.equal(game.state.players.player.grave.some(c => c.id === oldMirage.id), true, 'Previous Mirage must move to grave');
  assert.equal(mirEvents.length, 1);

  // Release / True Release during attack
  const relCard = compileCard({
    cardNumber: 'K15-REL-01',
    name: 'Release Tester',
    type: 'Spirit',
    color: 'Yellow',
    cost: 4,
    effect: '[LV1][LV2] [Release: 2] (When Attacks)\nDraw 1 card.'
  });
  const atkStack = createFieldStack({
    id: 'atk_rel',
    cardNumber: 'K15-REL-01',
    type: 'Spirit',
    cost: 4,
    bp: 5000,
    levels: { 1: { cost: 1, bp: 5000 }, 2: { cost: 3, bp: 7000 } },
    owner: 'player',
    compiledIr: relCard,
    abilities: relCard.abilities
  }, { normal: 1 });
  const poorNexus = createFieldStack({ id: 'nex_poor', cardNumber: 'NX-1', type: 'Nexus', cost: 3, owner: 'player' }, { normal: 1 });
  game.state.players.player.field.push(atkStack, poorNexus);

  // Negative Release: Nexus has only 1 core, requires 2 -> atomic fail, 0 cores moved
  const badRel = await game.executeRelease(atkStack.id, null, 'player');
  assert.equal(badRel.released, false);
  assert.equal(badRel.reason, 'INSUFFICIENT_NEXUS_CORES');
  assert.equal(poorNexus.cores.normal, 1);

  // Positive Release + Mirage During Set trigger on declareAttack
  poorNexus.cores.normal = 2;
  game.state.step = 'ATTACK';
  const handBeforeAtk = game.state.players.player.hand.length;
  const atkRes = await game.declareAttack(atkStack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(poorNexus.cores.normal, 0, 'Release must move 2 cores from friendly Nexus');
  assert.equal(atkStack.cores.normal, 3, 'Release must move 2 cores onto attacking Spirit');
  // +1 draw from Release-gated WHEN_ATTACKS + 1 draw from active Mirage During Set ability
  assert.equal(game.state.players.player.hand.length, handBeforeAtk + 2);

  // True Release moves Soul Core from Nexus onto Spirit
  const trNexus = createFieldStack({ id: 'nex_soul', cardNumber: 'NX-SOUL', type: 'Nexus', cost: 3, owner: 'player' }, { normal: 0, soul: 1 });
  game.state.players.player.field.push(trNexus);
  const trRes = await executeReleaseRuntime(game.state, atkStack, { keyword: 'True Release', isTrueRelease: true, coreCount: 1, requireSoulCore: true }, { controller: 'player' }, game.events);
  assert.equal(trRes.released, true);
  assert.equal(trRes.soulCoreMoved, true);
  assert.equal(trNexus.cores.soul, 0);
  assert.equal(atkStack.cores.soul, 1);
});

test('K1.5-C1: Team restrictions are consumed at runtime by TEAM_PRESENCE conditions, selectors, and GAIN_TEAM modifiers', () => {
  const state = createGameState();
  const c1 = compileCard({ ...loadDetailedCard('26RDB01-001'), cardNumber: '26RDB01-001' });
  const c2 = compileCard({ ...loadDetailedCard('26RDB01-002'), cardNumber: '26RDB01-002' });
  const cNon = { id: 'non_team', cardNumber: 'NT-1', type: 'Spirit', cost: 2, owner: 'player', teams: ['Twilight Gothic'] };

  const s1 = createFieldStack({ ...c1, id: 'st1', owner: 'player' }, { normal: 1 });
  const s2 = createFieldStack({ ...c2, id: 'st2', owner: 'player' }, { normal: 1 });
  const s3 = createFieldStack(cNon, { normal: 1 });
  s1.state = 'EXHAUSTED';
  s2.state = 'EXHAUSTED';
  state.players.player.field.push(s1, s2);
  state.players.player.hand.push({ ...c2, id: 'h_team' }, { ...cNon, id: 'h_non' });

  // queryCandidates filters.team on field and hand
  const redField = queryCandidates(state, { side: 'self', zone: 'field', types: ['Spirit'], filter: { team: 'Red Stella' } }, { controller: 'player' });
  assert.equal(redField.length, 2);
  const shinyHand = queryCandidates(state, { side: 'self', zone: 'hand', types: ['Any'], filter: { team: 'Shiny Hearts' } }, { controller: 'player' });
  assert.equal(shinyHand.length, 1);
  assert.equal(shinyHand[0].card.id, 'h_team');

  // TEAM_PRESENCE: "If all your Spirits/Nexuses have [Red Stella]"
  const allRedCond = 'If all your Spirits/Nexuses have [Red Stella]';
  assert.equal(evaluateStructuredCondition(state, allRedCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  state.players.player.field.push(s3);
  assert.equal(evaluateStructuredCondition(state, allRedCond, { controller: 'player' }).result, CONDITION_RESULT.FALSE);

  // Continuous GAIN_TEAM makes non-team Spirit also satisfy Red Stella
  state.modifiers.push({ type: 'GAIN_TEAM', targetStackId: s3.id, teams: ['Red Stella'], duration: 'THIS_TURN' });
  assert.equal(evaluateStructuredCondition(state, allRedCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  // TEAM_PRESENCE: "While you control three or more Spirits with different team names" (Red Stella, Shiny Hearts, Twilight Gothic)
  const diffTeamsCond = 'While you control three or more Spirits with different team names';
  assert.equal(evaluateStructuredCondition(state, diffTeamsCond, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
});

test('K1.5-D1: Top K.1.1 unparsed condition patterns parse cleanly and evaluate TRUE/FALSE in runtime', () => {
  const state = createGameState();
  const host = createFieldStack({ id: 'h_1', cardNumber: 'H1', name: 'ContractSword', type: 'Spirit', cost: 4, families: ['Zero Contract'], owner: 'player' }, { normal: 1 });
  const brave = { id: 'b_1', cardNumber: 'B1', name: 'Imagine Brave', type: 'Brave', cost: 4, families: ['Imagine'], owner: 'player' };
  host.braves.push(brave);
  state.players.player.field.push(host);

  const bravedName = 'While braved to "ContractSword"';
  assert.equal(parseConditionToStructured(bravedName).type, 'BRAVE_STACK_STATE');
  assert.equal(evaluateStructuredCondition(state, bravedName, { controller: 'player', sourceStack: host }).result, CONDITION_RESULT.TRUE);

  const bravedFam = 'while braved to a "Zero Contract" family Spirit';
  assert.equal(evaluateStructuredCondition(state, bravedFam, { controller: 'player', sourceStack: host }).result, CONDITION_RESULT.TRUE);

  const everyFam = 'If every Spirit/Ultimate you control has "Zero Contract" family';
  assert.equal(evaluateStructuredCondition(state, everyFam, { controller: 'player' }).result, CONDITION_RESULT.TRUE);

  const multiAtk = 'While your "ContractSword"/"AltSword" is attacking';
  assert.equal(evaluateStructuredCondition(state, multiAtk, { controller: 'player' }).result, CONDITION_RESULT.FALSE);
  state.combat = { attackerStackId: host.id, attackerSide: 'player' };
  assert.equal(evaluateStructuredCondition(state, multiAtk, { controller: 'player' }).result, CONDITION_RESULT.TRUE);
  state.combat = null;

  const cardResultCond = 'If that card has "Fairy"/"Saga" family';
  assert.equal(evaluateStructuredCondition(state, cardResultCond, { controller: 'player', previousTarget: { family: 'Saga' } }).result, CONDITION_RESULT.TRUE);
  assert.equal(evaluateStructuredCondition(state, cardResultCond, { controller: 'player', previousTarget: { family: 'Dragon' } }).result, CONDITION_RESULT.FALSE);

  assert.equal(evaluateStructuredCondition(state, 'If possible', { controller: 'player' }).result, CONDITION_RESULT.TRUE);
});

test('K1.5-D2: Four blocked complex cards and two compiler-drift cards execute cleanly through runtime resolver', async () => {
  const resolver = new AsyncResolver(new DeterministicPromptResolver());

  // 1. 26RDB01-024: TARGET_SELECT 2 opposing Spirits -> Exhaust them
  const s26Rdb024 = loadShardCard('26RDB01.json', '26RDB01-024');
  const st1 = createGameState();
  const oppS1 = createFieldStack({ id: 'o1', type: 'Spirit', cost: 2, owner: 'opponent' }, { normal: 1 });
  const oppS2 = createFieldStack({ id: 'o2', type: 'Spirit', cost: 2, owner: 'opponent' }, { normal: 1 });
  st1.players.opponent.field.push(oppS1, oppS2);
  const resRdb = await resolver.resolveAbility(st1, s26Rdb024.abilities[1], { controller: 'player', sourceCard: s26Rdb024 });
  assert.equal(resRdb.success, true);
  assert.equal(oppS1.state, 'EXHAUSTED');

  // 2. 26RSD07-001: BOUNCE self to deckbottom
  const c26Rsd001 = loadShardCard('26RSD07.json', '26RSD07-001');
  const st2 = createGameState();
  const selfCard = createCardInstance({ ...c26Rsd001, id: 'cz_1' }, 'player');
  const czStack = createFieldStack(selfCard, { normal: 1 });
  st2.players.player.field.push(czStack);
  const resRsd = await resolver.resolveAbility(st2, c26Rsd001.abilities[0], { controller: 'player', sourceCard: selfCard, sourceStack: czStack });
  assert.equal(resRsd.success, true);
  assert.equal(st2.players.player.deck[st2.players.player.deck.length - 1].id, selfCard.id);

  // 3. BS27-082: Trigger Counter + BP_DEBUFF + Flash TREAT_RULE enemy Spirit LV1
  const cBs27 = loadShardCard('BS27.json', 'BS27-082');
  const cBs27Fresh = compileCard({ ...loadDetailedCard('BS27-082'), cardNumber: 'BS27-082' });
  const st3 = createGameState();
  const oppLv3 = createFieldStack({
    id: 'opp_lv3',
    type: 'Spirit',
    cost: 4,
    owner: 'opponent',
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 2, bp: 5000 }, 3: { cost: 4, bp: 8000 } }
  }, { normal: 4 });
  st3.players.opponent.field.push(oppLv3);
  assert.equal(computeLevel(oppLv3, st3), 3);
  const resTreat = await resolver.resolveAbility(st3, cBs27Fresh.abilities[2], { controller: 'player', sourceCard: cBs27 });
  assert.equal(resTreat.success, true);
  assert.equal(computeLevel(oppLv3, st3), 1, 'BS27-082 Flash must treat opposing Spirit as LV1');

  // 4. BS33-069: compiler drift repaired + Soul Burst INDESTRUCTIBLE + DEPLOY_NEXUS + WHEN_DEPLOYED SET_LEVEL opposing Spirits to LV1
  const cBs33Det = loadDetailedCard('BS33-069');
  const cBs33Fresh = compileCard({ ...cBs33Det, cardNumber: 'BS33-069' });
  assert.equal(cBs33Fresh.isFullySupported, true, 'BS33-069 compiler drift fixed: zero unsupported clauses');
  const st4 = createGameState();
  const burstNex = createCardInstance({ ...cBs33Det, id: 'nex_bs33', type: 'Nexus', compiledIr: cBs33Fresh }, 'player');
  st4.players.player.burst = burstNex;
  const oppHighLv = createFieldStack({
    id: 'opp_hlv',
    type: 'Spirit',
    cost: 4,
    owner: 'opponent',
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 5000 } }
  }, { normal: 3 });
  st4.players.opponent.field.push(oppHighLv);

  const resBurst = await resolver.resolveAbility(st4, cBs33Fresh.abilities[0], { controller: 'player', sourceCard: burstNex });
  assert.equal(resBurst.success, true);
  assert.equal(st4.players.player.field.some(s => s.top.id === burstNex.id), true, 'BS33-069 Soul Burst deploys itself onto field');
  const resDep = await resolver.resolveAbility(st4, cBs33Fresh.abilities[1], { controller: 'player', sourceCard: burstNex });
  assert.equal(resDep.success, true);
  assert.equal(computeLevel(oppHighLv, st4), 1, 'BS33-069 When Deployed sets all opposing Spirits to LV1');

  // 5. BS19-X05 & 26RBS02-083 execute through runtime
  const cBs19 = compileCard({ cardNumber: 'BS19-X05' });
  assert.equal(cBs19.abilities[0].clauses[0].op.op, 'BP_DEBUFF');
  assert.equal(cBs19.abilities[0].clauses[0].op.count, 2);
  const c26Rbs083 = loadShardCard('26RBS02.json', '26RBS02-083');
  const st5 = createGameState();
  const rbsCard = createCardInstance({ ...c26Rbs083, type: 'Spirit', cost: 4, levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } } }, 'player');
  const rbsStack = createFieldStack(rbsCard, { normal: 3 });
  st5.players.player.field.push(rbsStack);
  st5.players.player.deck.push({ id: 'd_top', name: 'D', type: 'Spirit', owner: 'player' });
  const drawR = await resolver.resolveAbility(st5, c26Rbs083.abilities[1], { controller: 'player', sourceCard: rbsCard, sourceStack: rbsStack });
  assert.equal(drawR.success, true);
  assert.equal(st5.players.player.hand.length, 1);
});

test('K1.5-E1: All 8 Batch 1 operations execute genuine real shard cards through full game runtime + evidence registry verification', async () => {
  const vops = buildVerifiedOperationRegistry();
  for (const opName of ['DRAW', 'BP_BUFF', 'BP_DEBUFF', 'DESTROY', 'BOUNCE', 'EXHAUST', 'REFRESH', 'MOVE_CORE']) {
    const entry = vops[opName];
    assert.ok(entry && entry.handlerPresent, `${opName} must have runtime handler`);
    const variants = Object.values(entry.variants || {});
    assert.ok(variants.some(v => v.status === 'SEMANTICALLY_VERIFIED'), `${opName} must have at least one SEMANTICALLY_VERIFIED variant`);
  }

  // Execute real shard cards through full createGame runtime flow (playCard / declareAttack / declareBlock / activateAbility):
  const resolver = new DeterministicPromptResolver();
  const buildGame = () => {
    const g = createGame({
      playerDeck: makeFillerDeck('p', 40, 'player'),
      opponentDeck: makeFillerDeck('o', 40, 'opponent'),
      firstPlayer: 'player',
      promptResolver: resolver
    });
    g.state.players.player.reserve = { normal: 15, soul: 1 };
    g.state.players.opponent.reserve = { normal: 10, soul: 0 };
    return g;
  };

  // 1. DRAW (SD01-034 Double Draw / Draw, Main Magic played via game.playCard)
  {
    const g = buildGame();
    g.state.step = 'MAIN';
    const raw = loadShardCard('SD01.json', 'SD01-034');
    const card = createCardInstance({ id: 'rc_draw', cardNumber: 'SD01-034', type: 'Magic', color: 'Red', cost: 4, compiledIr: raw, abilities: raw.abilities }, 'player');
    g.state.players.player.hand.push(card);
    const before = g.state.players.player.hand.length - 1;
    const expectedDraw = raw.abilities?.[0]?.clauses?.[0]?.op?.count || 2;
    const res = await g.playCard(card.id, [], 'player');
    assert.equal(res.success, true);
    // SD01-034 Clause 0 draws 2 cards, Clause 1+2 reveals 1 Red Spirit from filler deck and adds it to hand (+3 total)
    assert.equal(g.state.players.player.hand.length, before + expectedDraw + 1, 'SD01-034 draws 2 + adds revealed Red Spirit through playCard');
  }

  // 2. MOVE_CORE (BS01-061 Apewhip, WHEN_SUMMONED via game.playCard)
  {
    const g = buildGame();
    g.state.step = 'MAIN';
    g.state.players.player.voidCores.normal = 3;
    const raw = loadShardCard('BS01.json', 'BS01-061');
    const card = createCardInstance({ id: 'rc_mc', cardNumber: 'BS01-061', type: 'Spirit', color: 'Green', cost: 2, levels: { 1: { cost: 1, bp: 2000 } }, compiledIr: raw, abilities: raw.abilities }, 'player');
    g.state.players.player.hand.push(card);
    const voidBefore = g.state.players.player.voidCores.normal;
    const res = await g.playCard(card.id, [], 'player');
    assert.equal(res.success, true);
    assert.equal(g.state.players.player.voidCores.normal, voidBefore - 1, 'BS01-061 moves 1 core from Void');
  }

  // 3. DESTROY (BS38-008 WHEN_ATTACKS via game.declareAttack + empty-target negative check)
  {
    const g = buildGame();
    g.state.step = 'ATTACK';
    const raw = loadShardCard('BS38.json', 'BS38-008');
    const stk = createFieldStack(createCardInstance({ id: 'rc_dest', cardNumber: 'BS38-008', type: 'Spirit', color: 'Red', cost: 3, levels: { 1: { cost: 1, bp: 3000 } }, compiledIr: raw, abilities: raw.abilities }, 'player'), { normal: 1 });
    const oppTarget = createFieldStack(createCardInstance({ id: 'opp_weak', type: 'Spirit', cost: 1, bp: 1000, levels: { 1: { cost: 1, bp: 1000 } } }, 'opponent'), { normal: 1 });
    g.state.players.player.field.push(stk);
    g.state.players.opponent.field.push(oppTarget);
    const res = await g.declareAttack(stk.id, 'player');
    assert.equal(res.success, true);
    assert.equal(g.state.players.opponent.grave.some(c => c.id === oppTarget.top.id), true, 'BS38-008 destroys opposing low-BP Spirit on attack');
  }

  // 4. BP_BUFF (BS01-077 WHEN_BLOCKS via game.declareBlock)
  {
    const g = buildGame();
    g.state.step = 'ATTACK';
    const raw = loadShardCard('BS01.json', 'BS01-077');
    const det = loadDetailedCard('BS01-077');
    const blkCard = createCardInstance({ ...det, id: 'rc_buff', cardNumber: 'BS01-077', type: 'Spirit', color: 'White', compiledIr: raw, abilities: raw.abilities }, 'opponent');
    const atkStk = createFieldStack(createCardInstance({ id: 'p_atk', type: 'Spirit', color: 'Red', cost: 2, bp: 2000, levels: { 1: { cost: 1, bp: 2000 } } }, 'player'), { normal: 1 });
    const lv2Cost = blkCard.levels?.LV2?.cost ?? blkCard.levels?.[2]?.cost ?? 2;
    const blkStk = createFieldStack(blkCard, { normal: lv2Cost });
    g.state.players.player.field.push(atkStk);
    g.state.players.opponent.field.push(blkStk);
    const bpBefore = computeEffectiveBP(g.state, blkStk);
    g.state.combat = { attackerStackId: atkStk.id, attackerSide: 'player', stage: 'BLOCK' };
    const res = await g.declareBlock(blkStk.id, 'opponent');
    assert.equal(res.success, true);
    assert.ok(res.blockerBp > bpBefore, `BS01-077 boosts effective BP on block (${bpBefore} -> ${res.blockerBp})`);
  }

  // 5. BP_DEBUFF (BS19-109 Magic via game.playCard)
  {
    const g = buildGame();
    g.state.step = 'ATTACK';
    const raw = loadShardCard('BS19.json', 'BS19-109');
    const oppStk = createFieldStack(createCardInstance({ id: 'opp_deb', type: 'Spirit', cost: 3, bp: 5000, levels: { 1: { cost: 1, bp: 5000 } } }, 'opponent'), { normal: 1 });
    g.state.players.opponent.field.push(oppStk);
    const card = createCardInstance({ id: 'rc_deb', cardNumber: 'BS19-109', type: 'Magic', color: 'Yellow', cost: 2, effect: 'Flash', compiledIr: raw, abilities: raw.abilities }, 'player');
    g.state.players.player.hand.push(card);
    const bpBefore = computeEffectiveBP(oppStk, g.state);
    const res = await g.playCard(card.id, [], 'player');
    assert.equal(res.success, true);
    assert.ok(computeEffectiveBP(oppStk, g.state) < bpBefore, 'BS19-109 Magic debuffs opposing BP via playCard');
  }

  // 6 & 7. EXHAUST (BS02-066 WHEN_SUMMONED) & REFRESH (BS01-059 real shard ability via activateAbility)
  {
    const g = buildGame();
    g.state.step = 'MAIN';
    const rawEx = loadShardCard('BS02.json', 'BS02-066');
    const oppTarget = createFieldStack(createCardInstance({ id: 'opp_exh', type: 'Spirit', cost: 2, bp: 2000 }, 'opponent'), { normal: 1 });
    g.state.players.opponent.field.push(oppTarget);
    const exCard = createCardInstance({ id: 'rc_ex', cardNumber: 'BS02-066', type: 'Spirit', color: 'Green', cost: 3, levels: { 1: { cost: 1, bp: 2000 } }, compiledIr: rawEx, abilities: rawEx.abilities }, 'player');
    g.state.players.player.hand.push(exCard);
    const playEx = await g.playCard(exCard.id, [], 'player');
    assert.equal(playEx.success, true);
    assert.equal(oppTarget.state, 'EXHAUSTED');

    const rawRef = loadShardCard('BS01.json', 'BS01-059');
    const refAb = rawRef.abilities[0];
    assert.equal(refAb.clauses[0].op.op, 'REFRESH');
    const refStk = createFieldStack(createCardInstance({ id: 'rc_ref', cardNumber: 'BS01-059', type: 'Spirit', cost: 3, compiledIr: rawRef, abilities: rawRef.abilities }, 'player'), { normal: 1 });
    refStk.state = 'EXHAUSTED';
    g.state.players.player.field.push(refStk);
    const actRes = await g.activateAbility(refStk.top.id, refAb.physicalId, 'player');
    assert.equal(actRes.success, true);
    assert.equal(refStk.state, 'REFRESHED');
  }

  // 8. BOUNCE (BS01.json::BATTLE-SPIRITS-A244 Dream Ribbon FLASH Magic via game.playCard)
  {
    const g = buildGame();
    g.state.step = 'ATTACK';
    const rawBnc = loadShardCard('BS01.json', 'BATTLE-SPIRITS-A244');
    const oppBnc = createFieldStack(createCardInstance({ id: 'opp_bnc', type: 'Spirit', cost: 2, bp: 1000, levels: { 1: { cost: 1, bp: 1000 } } }, 'opponent'), { normal: 1 });
    g.state.players.opponent.field.push(oppBnc);
    const bncCard = createCardInstance({ id: 'rc_bnc', cardNumber: 'BATTLE-SPIRITS-A244', type: 'Magic', color: 'White', cost: 2, effect: 'Flash', compiledIr: rawBnc, abilities: rawBnc.abilities }, 'player');
    g.state.players.player.hand.push(bncCard);
    const playBnc = await g.playCard(bncCard.id, [], 'player');
    assert.equal(playBnc.success, true);
    assert.equal(g.state.players.opponent.hand.some(c => c.id === oppBnc.top.id), true, 'Dream Ribbon bounces opposing Spirit to hand on Flash play');
  }
});

test('K1.5-G1: Versioned baseline registry approves authorized evolutions and rejects any unapproved file tampering', () => {
  const unapproved = isApprovedFileHash('engine/index.js', '0000000000000000000000000000000000000000000000000000000000000000', 'c05a54ed1fb2d0a0846aca7a53fa966dfdddd804b5743240edba8e7741a21bb4');
  assert.equal(unapproved.approved, false);

  const histExact = assertApprovedFileHash('engine/restrictions.js', '3fd1c1a466ce2cbc80474f4edfa0ccd7659bb4b359f9ec035dfb4069a88d4b77', '3fd1c1a466ce2cbc80474f4edfa0ccd7659bb4b359f9ec035dfb4069a88d4b77');
  assert.equal(histExact.mode, 'HISTORICAL_EXACT');
});
