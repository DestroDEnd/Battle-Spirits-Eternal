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
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    require
  };
  sandbox.window = sandbox;
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
