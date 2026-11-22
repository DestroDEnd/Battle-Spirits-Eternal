import fs from 'node:fs';
import path from 'node:path';
import { parseConditionToStructured } from '../engine/conditions.js';

const SHARD_DIR = path.resolve('data/ir_shards');
const OPS_FILE = path.resolve('engine/ops/index.js');

// Extract all implemented switch cases from engine/ops/index.js
const opsSrc = fs.readFileSync(OPS_FILE, 'utf8');
const implementedOps = new Set();
for (const m of opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)) {
  implementedOps.add(m[1]);
}

const shardFiles = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.json')).sort();

const opCounts = new Map();
const condCounts = new Map();
const condTypes = new Map();
let totalCards = 0;
let totalAbilities = 0;
let totalClauses = 0;
let totalConditions = 0;
let supportedConditions = 0;
let unsupportedConditions = 0;

for (const file of shardFiles) {
  const raw = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, file), 'utf8'));
  const cards = Array.isArray(raw) ? raw : (raw.cards || Object.values(raw));
  for (const card of cards) {
    totalCards++;
    const abilities = card?.compiledIr?.abilities || card?.abilities || [];
    for (const ab of abilities) {
      totalAbilities++;
      const condsToCheck = [];
      if (ab?.header?.condition) condsToCheck.push(ab.header.condition);
      if (ab?.condition) condsToCheck.push(ab.condition);
      for (const cl of ab?.clauses || []) {
        totalClauses++;
        if (cl?.condition) condsToCheck.push(cl.condition);
        if (cl?.op?.op) {
          const opName = String(cl.op.op);
          opCounts.set(opName, (opCounts.get(opName) || 0) + 1);
        }
        if (cl?.op?.condition) condsToCheck.push(cl.op.condition);
      }
      for (const c of condsToCheck) {
        totalConditions++;
        const key = typeof c === 'string' ? c : JSON.stringify(c);
        condCounts.set(key, (condCounts.get(key) || 0) + 1);
        const parsed = parseConditionToStructured(c);
        if (parsed) {
          supportedConditions++;
          condTypes.set(parsed.type, (condTypes.get(parsed.type) || 0) + 1);
        } else {
          unsupportedConditions++;
        }
      }
    }
  }
}

const sortedOps = [...opCounts.entries()].sort((a, b) => b[1] - a[1]);
const supportedOpEntries = sortedOps.filter(([op]) => implementedOps.has(op));
const unsupportedOpEntries = sortedOps.filter(([op]) => !implementedOps.has(op));
const totalOpInstances = sortedOps.reduce((s, [, c]) => s + c, 0);
const supportedOpInstances = supportedOpEntries.reduce((s, [, c]) => s + c, 0);

const sortedConds = [...condCounts.entries()].sort((a, b) => b[1] - a[1]);
const unsupportedCondEntries = sortedConds.filter(([c]) => {
  try {
    const val = c.startsWith('{') ? JSON.parse(c) : c;
    return !parseConditionToStructured(val);
  } catch {
    return !parseConditionToStructured(c);
  }
});

const summary = {
  shards: shardFiles.length,
  totalCards,
  totalAbilities,
  totalClauses,
  operations: {
    uniqueOps: sortedOps.length,
    implementedUniqueOps: supportedOpEntries.length,
    unimplementedUniqueOps: unsupportedOpEntries.length,
    totalOpInstances,
    supportedOpInstances,
    instanceCoveragePct: Number(((supportedOpInstances / Math.max(1, totalOpInstances)) * 100).toFixed(2)),
    top30Ops: sortedOps.slice(0, 30).map(([op, count]) => ({ op, count, implemented: implementedOps.has(op) })),
    top20UnimplementedOps: unsupportedOpEntries.slice(0, 20).map(([op, count]) => ({ op, count }))
  },
  conditions: {
    totalConditionInstances: totalConditions,
    uniqueConditions: sortedConds.length,
    supportedInstances: supportedConditions,
    unsupportedInstances: unsupportedConditions,
    instanceCoveragePct: Number(((supportedConditions / Math.max(1, totalConditions)) * 100).toFixed(2)),
    byStructuredType: Object.fromEntries([...condTypes.entries()].sort((a, b) => b[1] - a[1])),
    top25UnsupportedConditions: unsupportedCondEntries.slice(0, 25).map(([condition, count]) => ({ condition, count }))
  }
};

console.log(JSON.stringify(summary, null, 2));
