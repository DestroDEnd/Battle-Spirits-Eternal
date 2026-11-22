import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { compileCard } from '../compiler/index.js';
import { parseAbilityHeaders } from '../compiler/header_parser.js';
import { createGame } from '../engine/index.js';
import { createGameState, createFieldStack, createCardInstance } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { computeEffectiveBP } from '../engine/continuous.js';
import { evaluateBraveCondition, evaluateSummonCondition, parseMirageDeclaration, parseReleaseDeclaration, hasTeam } from '../engine/prerequisites.js';
import { buildExactSemanticSignatureV3 } from '../scripts/k1_4_semantic_identity.mjs';

class DeterministicPromptResolver {
  async choose(prompt) {
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = typeof prompt.count === 'number' ? prompt.count : 1;
      return prompt.candidates.slice(0, count);
    }
    return { index: 0 };
  }
}

function loadShardCard(shardFile, cardNumber) {
  const sh = JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8'));
  const card = sh[cardNumber];
  assert.ok(card, `Card ${cardNumber} not found in ${shardFile}`);
  return JSON.parse(JSON.stringify(card));
}

test('K1.4-A1: Compiler header_parser extracts structured timingCause, timingOwner, activationRestrictions, and stops timingLabel at newline', () => {
  const hOpp = parseAbilityHeaders('[LV1][LV2] When Destroyed by the Opponent\nDraw 1 card.');
  assert.equal(hOpp.timing, 'WHEN_DESTROYED');
  assert.equal(hOpp.timingCause, 'OPPONENT');
  assert.equal(hOpp.timingLabel, 'When Destroyed by the Opponent');
  assert.equal(hOpp.cleanBody, 'Draw 1 card.');

  const hOrig = parseAbilityHeaders('[LV1] When summoned by paying the original cost\nDraw 1 card.');
  assert.equal(hOrig.timing, 'WHEN_SUMMONED');
  assert.ok(hOrig.activationRestrictions.includes('PAID_ORIGINAL_COST'));

  const hPhase = parseAbilityHeaders('[LV1] During Your Battle Phase\nThis Spirit gains +2000 BP.');
  assert.equal(hPhase.timingOwner, 'SELF');
});

test('K1.4-A2: Semantic Identity V3 resolves all 34 known opponent-only timing collisions while preserving equivalent abilities', () => {
  const timingReport = JSON.parse(fs.readFileSync('reports/work_package_k1_4/k1_4_timing_identity_report.json', 'utf8'));
  assert.equal(timingReport.priorCollisionsTotal, 34);
  assert.equal(timingReport.collisionsResolvedByV3, 34);
  assert.equal(timingReport.remainingOpponentVsUnrestrictedCollisionsInCorpus, 0);

  const opp = { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed by the Opponent' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  const either = { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  assert.notEqual(buildExactSemanticSignatureV3(opp).semanticPatternId, buildExactSemanticSignatureV3(either).semanticPatternId);

  const eq1 = { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When Destroyed by the Opponent', cleanBody: 'Draw 1 card.' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  const eq2 = { type: 'ABILITY', header: { timing: 'WHEN_DESTROYED', timingLabel: 'When destroyed by the opponent', cleanBody: 'Draw one card.' }, clauses: [{ op: { op: 'DRAW', count: 1 } }] };
  assert.equal(buildExactSemanticSignatureV3(eq1).semanticPatternId, buildExactSemanticSignatureV3(eq2).semanticPatternId);
});

test('K1.4-A3: Runtime DESTROYED listener enforces timingCause=OPPONENT (self-destruction does not trigger)', async () => {
  const oppCardIr = {
    cardNumber: 'K14-TEST-OPP',
    abilities: [{
      type: 'ABILITY',
      header: { timing: 'WHEN_DESTROYED', timingCause: 'OPPONENT', levels: [1, 2, 3] },
      clauses: [{ op: { op: 'DRAW', count: 1 } }],
    }],
  };
  const game = createGame({
    playerDeck: Array.from({ length: 40 }, (_, i) => ({ id: `p${i}`, cardNumber: `P-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'player' })),
    opponentDeck: Array.from({ length: 40 }, (_, i) => ({ id: `o${i}`, cardNumber: `O-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'opponent' })),
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver(),
  });
  const card = createCardInstance({ id: 'test_opp_dest', cardNumber: 'K14-TEST-OPP', type: 'Spirit', cost: 2, bp: 2000, lvCosts: [1], lvBPs: [2000], compiledIr: oppCardIr }, 'player');
  const handBeforeSelf = game.state.players.player.hand.length;
  await game.events.emit({ type: 'DESTROYED', card, by: 'player', fromSide: 'player', level: 1 });
  assert.equal(game.state.players.player.hand.length, handBeforeSelf, 'Self-destruction must NOT trigger opponent-only WHEN_DESTROYED');

  await game.events.emit({ type: 'DESTROYED', card, by: 'opponent', fromSide: 'player', level: 1 });
  assert.equal(game.state.players.player.hand.length, handBeforeSelf + 1, 'Opponent destruction MUST trigger opponent-only WHEN_DESTROYED');
});

test('K1.4-B1 & B2: Brave Condition and Summon Condition enforce legality in playCard (positive & negative real-card cases)', async () => {
  const braveP14 = loadShardCard('2015.json', 'P14-41'); // Brave Condition: Cost 3 or more Spirit/Ultimate
  const lowCostSpirit = createFieldStack({ id: 'sp_low', cardNumber: 'LOW-1', type: 'Spirit', cost: 2, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'player' }, { normal: 1 });
  const okCostSpirit = createFieldStack({ id: 'sp_ok', cardNumber: 'OK-1', type: 'Spirit', cost: 4, bp: 4000, lvCosts: [1], lvBPs: [4000], owner: 'player' }, { normal: 1 });

  const game = createGame({
    playerDeck: Array.from({ length: 40 }, (_, i) => ({ id: `p${i}`, cardNumber: `P-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'player' })),
    opponentDeck: Array.from({ length: 40 }, (_, i) => ({ id: `o${i}`, cardNumber: `O-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'opponent' })),
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver(),
  });
  game.state.players.player.field.push(lowCostSpirit, okCostSpirit);
  game.state.players.player.reserve.normal = 10;

  const braveInst = createCardInstance({ id: 'brave_p14', cardNumber: 'P14-41', type: 'Brave', cost: 4, bp: 3000, compiledIr: braveP14, abilities: braveP14.abilities }, 'player');
  game.state.players.player.hand.push(braveInst);

  const badBrave = await game.playCard(braveInst.id, [], 'player', { braveTargetStackId: lowCostSpirit.id });
  assert.equal(badBrave.success, false);
  assert.equal(badBrave.reason, 'BRAVE_CONDITION_NOT_MET');
  assert.equal(game.state.players.player.reserve.normal, 10, 'Failed Brave Condition must not consume cores');

  const goodBrave = await game.playCard(braveInst.id, [], 'player', { braveTargetStackId: okCostSpirit.id });
  assert.equal(goodBrave.success, true);
  assert.equal(okCostSpirit.braves.length, 1);

  // Summon Condition: CP14-X14R requires Cost 3 or higher Spirit
  const cp14 = loadShardCard('1000.json', 'CP14-X14R');
  const ultInst = createCardInstance({ id: 'ult_cp14', cardNumber: 'CP14-X14R', type: 'Ultimate', cost: 5, bp: 10000, lvCosts: [1, 3], lvBPs: [10000, 15000], compiledIr: cp14, abilities: cp14.abilities }, 'player');
  game.state.players.player.hand.push(ultInst);
  game.state.players.player.field = [lowCostSpirit]; // only cost 2
  const badSummon = await game.playCard(ultInst.id, [], 'player');
  assert.equal(badSummon.success, false);
  assert.equal(badSummon.reason, 'SUMMON_CONDITION_NOT_MET');

  game.state.players.player.field.push(okCostSpirit); // now has cost 4
  const goodSummon = await game.playCard(ultInst.id, [], 'player');
  assert.equal(goodSummon.success, true);
});

test('K1.4-B3 & C2: Mirage set placement via playCard, Release parser, and Compiler [team: ...] extraction', async () => {
  const compiledTeam = compileCard({
    cardNumber: '26RDB01-001',
    name: 'Team Test Spirit',
    type: 'Spirit',
    color: 'Red',
    cost: 3,
    effect: '[team: Red Stella]\n\n[LV1][LV2] (When Attacks)\nThis Spirit gains +3000 BP.',
  });
  assert.deepEqual(compiledTeam.teams, ['Red Stella']);
  assert.equal(compiledTeam.abilities[0].type, 'TEAM_RESTRICTION', 'Team-only block must be typed TEAM_RESTRICTION');
  assert.equal(compiledTeam.abilities[1].type, 'ABILITY');
  assert.equal(hasTeam(compiledTeam, 'Red Stella'), true);

  const mirageCard = {
    id: 'mir_1',
    cardNumber: 'MIR-01',
    type: 'Spirit',
    cost: 5,
    owner: 'player',
    compiledIr: { abilities: [{ type: 'ABILITY', header: { prefixes: ['Mirage: Cost 2 (Red Core)'], timing: 'PASSIVE' }, clauses: [] }] },
  };
  assert.equal(parseMirageDeclaration(mirageCard).cost, 2);

  const game = createGame({
    playerDeck: Array.from({ length: 40 }, (_, i) => ({ id: `p${i}`, cardNumber: `P-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'player' })),
    opponentDeck: Array.from({ length: 40 }, (_, i) => ({ id: `o${i}`, cardNumber: `O-${i}`, type: 'Spirit', cost: 1, bp: 1000, lvCosts: [1], lvBPs: [1000], owner: 'opponent' })),
    firstPlayer: 'player',
    promptResolver: new DeterministicPromptResolver(),
  });
  game.state.players.player.reserve.normal = 5;
  game.state.players.player.hand.push(mirageCard);
  const mirRes = await game.playCard('mir_1', [], 'player', { setAsMirage: true });
  assert.equal(mirRes.success, true);
  assert.equal(mirRes.zone, 'mirage');
  assert.equal(game.state.players.player.mirage.id, 'mir_1');
  assert.equal(game.state.players.player.reserve.normal, 3);

  assert.equal(parseReleaseDeclaration({ abilities: [{ header: { prefixes: ['True Release'] } }] }).keyword, 'True Release');
});

test('K1.4-D3: Real-card validation for all 8 Batch 1 core operations (DRAW, BP_BUFF, BP_DEBUFF, DESTROY, BOUNCE, EXHAUST, REFRESH, MOVE_CORE)', async () => {
  const state = createGameState();
  const resolver = new DeterministicPromptResolver();
  for (let i = 0; i < 5; i++) state.players.player.deck.push({ id: `d_${i}`, name: `D${i}`, owner: 'player', type: 'Spirit' });
  const pStack = createFieldStack({ id: 'ps1', cardNumber: 'PS1', type: 'Spirit', color: 'Red', colors: ['Red'], cost: 3, bp: 3000, levels: [{ level: 1, core: 1, bp: 3000 }], lvCosts: [1], lvBPs: [3000], owner: 'player' }, { normal: 1 });
  const oStack1 = createFieldStack({ id: 'os1', cardNumber: 'OS1', type: 'Spirit', color: 'Blue', colors: ['Blue'], cost: 3, bp: 4000, levels: [{ level: 1, core: 1, bp: 4000 }], lvCosts: [1], lvBPs: [4000], owner: 'opponent' }, { normal: 1 });
  const oStack2 = createFieldStack({ id: 'os2', cardNumber: 'OS2', type: 'Spirit', color: 'Blue', colors: ['Blue'], cost: 2, bp: 2000, lvCosts: [1], lvBPs: [2000], owner: 'opponent' }, { normal: 1 });
  state.players.player.field.push(pStack);
  state.players.opponent.field.push(oStack1, oStack2);
  state.players.player.voidCores = { normal: 3, soul: 0 };

  // 1. DRAW
  const drawR = await executeOp(state, { op: 'DRAW', count: 2 }, { controller: 'player' }, resolver);
  assert.equal(drawR.success, true);
  assert.equal(state.players.player.hand.length, 2);

  // 2. BP_BUFF
  const buffR = await executeOp(state, { op: 'BP_BUFF', amount: 2000, target: 'self', duration: 'THIS_TURN' }, { controller: 'player', sourceStack: pStack, sourceCard: pStack.top }, resolver);
  assert.equal(buffR.success, true);
  assert.equal(computeEffectiveBP(pStack, state), 5000);

  // 3. BP_DEBUFF
  const debuffR = await executeOp(state, { op: 'BP_DEBUFF', amount: 1000, target: { side: 'opp', types: ['Spirit'], count: 1 } }, { controller: 'player' }, resolver);
  assert.equal(debuffR.success, true);
  assert.equal(computeEffectiveBP(oStack1, state), 3000);

  // 4. EXHAUST & 5. REFRESH
  const exhR = await executeOp(state, { op: 'EXHAUST', target: { side: 'opp', types: ['Spirit'], count: 1 } }, { controller: 'player' }, resolver);
  assert.equal(exhR.success, true);
  assert.equal(oStack1.state, 'EXHAUSTED');
  const refR = await executeOp(state, { op: 'REFRESH', target: { side: 'opp', types: ['Spirit'], count: 1 } }, { controller: 'player' }, resolver);
  assert.equal(refR.success, true);
  assert.equal(oStack1.state, 'REFRESHED');

  // 6. BOUNCE
  const bncR = await executeOp(state, { op: 'BOUNCE', destination: 'hand', target: { side: 'opp', types: ['Spirit'], count: 1 } }, { controller: 'player' }, resolver);
  assert.equal(bncR.success, true);
  assert.equal(state.players.opponent.hand.length, 1);

  // 7. DESTROY (remaining opponent spirit + no-target safe NO_OP)
  const dstR = await executeOp(state, { op: 'DESTROY', target: { side: 'opp', types: ['Spirit'], count: 1 } }, { controller: 'player' }, resolver);
  assert.equal(dstR.success, true);
  assert.equal(dstR.destroyedCount, 1);
  const noTgt = await executeOp(state, { op: 'DESTROY', all: true, target: { side: 'opp', types: ['Spirit'] } }, { controller: 'player' }, resolver);
  assert.equal(noTgt.status, 'NO_OP_BY_RULE');

  // 8. MOVE_CORE
  const reserveBefore = state.players.player.reserve.normal;
  const mcR = await executeOp(state, { op: 'MOVE_CORE', count: 1, from: { zone: 'void', side: 'self' }, to: { zone: 'reserve', side: 'self' } }, { controller: 'player' }, resolver);
  assert.equal(mcR.success, true);
  assert.equal(state.players.player.reserve.normal, reserveBefore + 1);
});
