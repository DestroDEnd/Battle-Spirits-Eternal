/**
 * tests/arena_ir_shard_loader.test.js
 * 
 * Verifies that BattleArena lazily and dynamically loads compiled IR shards
 * from data/ir_shards/ by set prefix, providing 100% structured IR coverage
 * for any card in any modern or classic deck (AGENTS.md Rule 1).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { BSEngineAdapter } from '../engine_adapter.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createTestArena() {
  const doc = {
    readyState: 'complete',
    getElementById: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } } }),
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const sandbox = {
    window: {},
    document: doc,
    localStorage: { getItem() {}, setItem() {} },
    sessionStorage: { getItem() {}, setItem() {} },
    AudioFX: { init() {}, playTone() {}, click() {}, lifeDamage() {}, coreMove() {}, coreChime() {}, spiritSummon() {}, soulCoreIgnite() {} },
    showToast() {},
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    require
  };
  sandbox.window = sandbox;
  sandbox.BSEngineAdapter = BSEngineAdapter;
  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);
  return sandbox.window.BattleArena;
}

test('IR Shard Loader - dynamically loads BS60-X05 from data/ir_shards/BS60.json', async () => {
  const BA = createTestArena();

  assert.ok(typeof BA.getLoadedCardIr === 'function' || typeof BA.loadCardIrShard === 'function', 'BattleArena must expose IR shard loading helpers');

  const cardNum = 'BS60-X05';
  let ir = null;
  if (typeof BA.loadCardIrShard === 'function') {
    ir = await BA.loadCardIrShard(cardNum);
  } else if (typeof BA.getLoadedCardIr === 'function') {
    ir = BA.getLoadedCardIr(cardNum);
  }

  assert.ok(ir, `Must resolve compiled IR for ${cardNum} from data/ir_shards/BS60.json`);
  assert.equal(ir.cardNumber, cardNum);
  assert.ok(Array.isArray(ir.abilities), 'Must have compiled abilities array');
  assert.ok(ir.abilities.length >= 2, 'BS60-X05 must have at least 2 abilities');

  // Verify ability operations compiled cleanly
  const allOps = ir.abilities.flatMap(ab => (ab.clauses || []).map(c => c.op?.op));
  assert.ok(allOps.includes('IMMUNITY'), 'Must contain IMMUNITY op for White spirits');
  assert.ok(allOps.includes('BOUNCE'), 'Must contain BOUNCE op');
  assert.ok(allOps.includes('REFRESH'), 'Must contain REFRESH op');
});

test('getCardEffectsData - converts compiled IR abilities into triggers structure', async () => {
  const BA = createTestArena();
  const card = {
    card_number: 'BS60-X05',
    name: 'The DawnKnightLord God-Yggdrasil',
    type: 'Spirit',
    cost: 8
  };

  if (typeof BA.loadCardIrShard === 'function') {
    await BA.loadCardIrShard('BS60-X05');
  }

  const effectsData = BA.getCardEffectsData(card);
  assert.ok(effectsData, 'getCardEffectsData must return compiled effects data for BS60-X05');
  assert.ok(effectsData.triggers, 'Must contain triggers dictionary');
  assert.ok(effectsData.triggers.BURST, 'Must have BURST trigger');
  assert.ok(effectsData.triggers.WHEN_ATTACKS, 'Must have WHEN_ATTACKS trigger');
});

test('Arena target prompt adapter returns a Promise for legacy async effect handlers', () => {
  const BA = createTestArena();
  const prompt = BA.getArenaApi().promptUniversalTargetModal({
    card: { name: 'Prompt regression' },
    candidates: [],
    minPick: 1,
    maxPick: 1
  });
  assert.ok(prompt && typeof prompt.then === 'function', 'target prompt adapter must be awaitable');
});

test('Manual core allocation is rejected for Grandwalker Nexuses', () => {
  const BA = createTestArena();
  const state = BA.getState();
  state.activePlayer = 'player';
  state.phases = ['MAIN'];
  state.phaseIndex = 0;
  state.player.reserve = 3;
  state.player.nexus = [{ uid: 'grandwalker-test', name: 'Grandwalker test', type: 'Nexus', family: 'Grandwalker', currentCores: 1, levels: [{ cores: 1 }, { cores: 3 }] }];

  BA.addCoreToNexus('grandwalker-test');

  assert.equal(state.player.reserve, 3, 'reserve must not be reduced by manual core allocation');
  assert.equal(state.player.nexus[0].currentCores, 1, 'Grandwalker Nexus core count must not be manually increased');
});

test('SD46-CP01 Grand Skill draws through structured IR and cannot be reused in the same turn', async () => {
  const BA = createTestArena();
  const ir = await BA.loadCardIrShard('SD46-CP01');
  const grandSkill = ir.abilities.find(ability => (ability.header?.prefixes || []).some(prefix => /Grand Skill:\s*2/i.test(prefix)));
  assert.ok(grandSkill?.clauses.some(clause => clause.op?.op === 'GRANDWALKER_ACTION' && clause.op.costCores === 2), 'the browser shard must include the Grand Skill core payment');
  assert.ok(grandSkill?.clauses.some(clause => clause.op?.op === 'DRAW'), 'the browser shard must include the follow-up draw');
  const state = BA.getState();
  state.inDuel = true;
  state.activePlayer = 'player';
  state.turn = 1;
  state.phases = ['MAIN'];
  state.phaseIndex = 0;
  state.player.nexus = [{
    uid: 'sd46-gw-test', card_number: 'SD46-CP01', name: 'Mogami Shunta', type: 'Nexus', family: 'Grandwalker',
    effect: '[Grand Skill: 2] [Main] (Once per turn, send two cores from this Nexus to the Void) Draw a card.',
    currentCores: 3, currentLevel: 1, levels: [{ cores: 1 }, { cores: 3 }]
  }];
  state.player.deck = [{ uid: 'sd46-draw-test', card_number: 'T-DRAW', name: 'Draw test', type: 'Spirit', cost: 1 }];
  state.player.hand = [];

  await BA.activateGrandSkill('sd46-gw-test');
  assert.equal(state.player.hand.length, 1, 'Grand Skill should draw its card');
  assert.equal(state.player.nexus[0].currentCores, 1, 'Grand Skill should pay its two core cost');

  const second = await BA.activateGrandSkill('sd46-gw-test');
  assert.equal(second?.reason, undefined, 'the UI activation handler should safely ignore the repeated activation');
  assert.equal(state.player.hand.length, 1, 'once-per-turn must prevent a second draw');
});

test('LM16-01 Accel in the Arena resolves structured choices before placing itself in Open Zone', async () => {
  const BA = createTestArena();
  const ir = await BA.loadCardIrShard('LM16-01');
  const accel = ir.abilities[0];
  assert.ok(accel.clauses.some(clause => clause.op?.op === 'ADD_TO_HAND' && clause.op.filterGroups?.length === 2), 'LM16-01 IR must encode both card choices');

  const state = BA.getState();
  state.inDuel = true;
  state.activePlayer = 'player';
  state.phases = ['MAIN'];
  state.phaseIndex = 0;
  state.player.reserve = 10;
  const revol = {
    uid: 'lm16-accel-test', card_number: 'LM16-01', name: 'The FiftyFirstBeast Revol-Koleon', type: 'Spirit',
    family: 'Ten Crown', color: 'Red', effect: '[Accel: Cost 4 ([Red Core][Red Core])]',
    levels: [{ level: 1, cores: 1, bp: 3000 }], currentLevel: 1, currentCores: 0
  };
  const braveA = { uid: 'lm16-brave-a', card_number: 'T-BA', name: 'Imagine Brave A', type: 'Brave', family: 'Imagine', cost: 3, color: 'Red' };
  const braveB = { uid: 'lm16-brave-b', card_number: 'T-BB', name: 'Imagine Brave B', type: 'Brave', family: 'Imagine', cost: 3, color: 'Red' };
  const spirit = { uid: 'lm16-spirit', card_number: 'T-KING', name: 'God-King Spirit', type: 'Spirit', family: 'God-King', cost: 3, color: 'Red' };
  const unmatched = { uid: 'lm16-other', card_number: 'T-OTHER', name: 'Other Spirit', type: 'Spirit', family: 'Other', cost: 3, color: 'Red' };
  state.player.hand = [revol];
  state.player.deck = [braveA, braveB, spirit, unmatched];
  state.player.openCards = [];
  state.player.voidCards = [];

  await BA.castAccel(revol.uid);

  assert.equal(state.player.hand.some(card => card.uid === revol.uid), false, 'Accel card should leave Hand');
  assert.ok(state.player.openCards.some(card => card.uid === revol.uid), 'Accel card should be face-up in Open Zone');
  assert.ok(state.player.hand.some(card => card.uid === braveA.uid || card.uid === braveB.uid), 'one Imagine Brave should be selected');
  assert.ok(state.player.hand.some(card => card.uid === spirit.uid), 'one God-King/Ten Crown Spirit should be selected');
  assert.ok(state.player.trashCards.some(card => card.uid === braveA.uid || card.uid === braveB.uid), 'the unselected matching Brave should be discarded');
  assert.deepEqual(state.player.deck.map(card => card.uid), [unmatched.uid], 'only the three revealed cards should leave the deck');
});
