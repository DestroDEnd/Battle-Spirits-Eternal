/**
 * scripts/measure_phase_3F_performance.mjs
 * 
 * Measures engine performance benchmarks for Phase 3F Milestone 32.
 */

import fs from 'fs';
import path from 'path';
import { createGame } from '../engine/index.js';
import { computeEffectiveBP } from '../engine/continuous.js';
import { createFieldStack } from '../engine/state.js';

console.log('--- Benchmarking Battle Spirits Eternal Engine Performance ---');

// 1. Detailed card database load
const t0 = performance.now();
const detailedCards = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));
const t1 = performance.now();
const dbLoadTime = t1 - t0;
console.log(`1. Detailed Card DB Load (14,443 cards): ${dbLoadTime.toFixed(2)} ms`);

// 2. All 514 Shards load
const t2 = performance.now();
const shardFiles = fs.readdirSync('data/ir_shards').filter(f => f.endsWith('.json'));
let shardCards = 0;
let shardAbilities = 0;
let shardClauses = 0;
for (const f of shardFiles) {
  const d = JSON.parse(fs.readFileSync(path.join('data/ir_shards', f), 'utf8'));
  for (const c of Object.values(d)) {
    shardCards++;
    for (const ab of c.abilities || []) {
      shardAbilities++;
      shardClauses += (ab.clauses || []).length;
    }
  }
}
const t3 = performance.now();
const shardsLoadTime = t3 - t2;
console.log(`2. All 514 Shards Load (${shardCards} cards, ${shardAbilities} abilities, ${shardClauses} clauses): ${shardsLoadTime.toFixed(2)} ms`);

// 3. Match initialization latency (100 matches)
const t4 = performance.now();
for (let i = 0; i < 100; i++) {
  const g = createGame({ strictRules: false, unsafeTestBypassDeckValidation: true });
}
const t5 = performance.now();
const avgMatchInit = (t5 - t4) / 100;
console.log(`3. Match Initialization Latency (avg over 100): ${avgMatchInit.toFixed(3)} ms`);

// 4. Turn & Step progression latency (100 full turns)
const game = createGame({ strictRules: false, unsafeTestBypassDeckValidation: true });
const t6 = performance.now();
for (let i = 0; i < 50; i++) {
  await game.advanceStep(); // advance 50 steps
}
const t7 = performance.now();
const avgStepAdvance = (t7 - t6) / 50;
console.log(`4. Step Progression Latency (avg over 50 steps): ${avgStepAdvance.toFixed(3)} ms`);

// 5. Continuous BP Recalculation (10,000 recalculations)
const stack = createFieldStack({
  id: 'card_bench',
  cardNumber: 'BS01-001',
  type: 'Spirit',
  bp: 5000,
  levels: { 1: { cost: 1, bp: 5000 }, 2: { cost: 2, bp: 8000 } }
}, { normal: 2, soul: 0 });

const t8 = performance.now();
for (let i = 0; i < 10000; i++) {
  computeEffectiveBP(game.state, stack);
}
const t9 = performance.now();
const avgBpRecalc = ((t9 - t8) / 10000) * 1000; // in microseconds
console.log(`5. Continuous BP Recalculation: ${(t9 - t8).toFixed(2)} ms for 10,000 calls (${avgBpRecalc.toFixed(2)} µs/call)`);

// 6. Memory usage
const mem = process.memoryUsage();
console.log(`6. Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB, Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB, RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);

const benchmarkResults = {
  dbLoadTimeMs: Number(dbLoadTime.toFixed(2)),
  shardsLoadTimeMs: Number(shardsLoadTime.toFixed(2)),
  avgMatchInitMs: Number(avgMatchInit.toFixed(3)),
  avgStepAdvanceMs: Number(avgStepAdvance.toFixed(3)),
  bpRecalc10kMs: Number((t9 - t8).toFixed(2)),
  bpRecalcMicrosecondsPerCall: Number(avgBpRecalc.toFixed(2)),
  heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
  rssMB: Number((mem.rss / 1024 / 1024).toFixed(2))
};

fs.writeFileSync('reports/benchmark_metrics.json', JSON.stringify(benchmarkResults, null, 2));
console.log('✓ Benchmarks saved to reports/benchmark_metrics.json');
