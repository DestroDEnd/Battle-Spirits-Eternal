/**
 * scripts/benchmark_engine_performance.mjs
 * 
 * Performance & Reliability Benchmark Suite for Work Package K.
 */

import { performance } from 'node:perf_hooks';
import { createGame } from '../engine/index.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';
import { computeEffectiveBP, computeLevel } from '../engine/continuous.js';
import { resolveTargets } from '../engine/selectors.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';

console.log('Running Performance & Reliability Benchmarks...');

// Benchmark 1: 1,000 Consecutive BP Calculations
const bpCard = createCardInstance({ name: 'Lord-Dragon', cost: 6, bp: [5000, 7000, 10000] });
const bpState = createGameState();
const bpStack = createFieldStack(bpCard, 'player');
bpState.players.player.field.push(bpStack);
bpStack.cores = 3;

const bpTimes = [];
for (let i = 0; i < 1000; i++) {
  const t0 = performance.now();
  const bp = computeEffectiveBP(bpStack, bpState);
  bpTimes.push(performance.now() - t0);
}
bpTimes.sort((a, b) => a - b);
const bp_p50 = bpTimes[Math.floor(bpTimes.length * 0.5)];
const bp_p95 = bpTimes[Math.floor(bpTimes.length * 0.95)];
const bp_p99 = bpTimes[Math.floor(bpTimes.length * 0.99)];
const bp_total = bpTimes.reduce((a, b) => a + b, 0);

console.log(`BP Calculations: Total ${bp_total.toFixed(2)}ms (p50: ${bp_p50.toFixed(4)}ms, p95: ${bp_p95.toFixed(4)}ms, p99: ${bp_p99.toFixed(4)}ms)`);

// Benchmark 2: 200-Candidate Target Filtering
const targetState = createGameState();
for (let i = 0; i < 200; i++) {
  const c = createCardInstance({ name: `Spirit_${i}`, cost: (i % 6) + 1, bp: 2000 + (i * 50) }, i % 2 === 0 ? 'player' : 'opponent');
  const stack = createFieldStack(c, c.owner);
  stack.cores = (i % 3) + 1;
  targetState.players[c.owner].field.push(stack);
}

const targetTimes = [];
for (let i = 0; i < 100; i++) {
  const t0 = performance.now();
  const targets = resolveTargets(targetState, {
    side: 'opp',
    type: 'Spirit',
    maxBp: 5000
  }, { controller: 'player' });
  targetTimes.push(performance.now() - t0);
}
targetTimes.sort((a, b) => a - b);
const target_p50 = targetTimes[Math.floor(targetTimes.length * 0.5)];
const target_p95 = targetTimes[Math.floor(targetTimes.length * 0.95)];
const target_p99 = targetTimes[Math.floor(targetTimes.length * 0.99)];
const target_total = targetTimes.reduce((a, b) => a + b, 0);

console.log(`200-Candidate Target Filtering: Total ${target_total.toFixed(2)}ms (p50: ${target_p50.toFixed(4)}ms, p95: ${target_p95.toFixed(4)}ms, p99: ${target_p99.toFixed(4)}ms)`);

// Benchmark 3: 50 Concurrent Independent Games Simulation
const gameTimes = [];
for (let g = 0; g < 50; g++) {
  const t0 = performance.now();
  const game = createGame();
  game.state.players.player.life = 5;
  game.state.players.opponent.life = 5;
  gameTimes.push(performance.now() - t0);
}
gameTimes.sort((a, b) => a - b);
const game_p50 = gameTimes[Math.floor(gameTimes.length * 0.5)];
const game_p95 = gameTimes[Math.floor(gameTimes.length * 0.95)];
const game_p99 = gameTimes[Math.floor(gameTimes.length * 0.99)];
const game_total = gameTimes.reduce((a, b) => a + b, 0);

console.log(`50 Independent Games Creation: Total ${game_total.toFixed(2)}ms (p50: ${game_p50.toFixed(4)}ms, p95: ${game_p95.toFixed(4)}ms, p99: ${game_p99.toFixed(4)}ms)`);

// Memory Usage
const mem = process.memoryUsage();
console.log(`Memory Usage: RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB, Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB, Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);

export const benchmarkResults = {
  bp: { count: 1000, totalMs: bp_total, p50: bp_p50, p95: bp_p95, p99: bp_p99 },
  targeting: { candidates: 200, iterations: 100, totalMs: target_total, p50: target_p50, p95: target_p95, p99: target_p99 },
  concurrentGames: { count: 50, totalMs: game_total, p50: game_p50, p95: game_p95, p99: game_p99 },
  memory: {
    rssMb: mem.rss / 1024 / 1024,
    heapUsedMb: mem.heapUsed / 1024 / 1024,
    heapTotalMb: mem.heapTotal / 1024 / 1024
  }
};
