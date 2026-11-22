import fs from 'fs';
import { runCardAbilityE2E } from '../tests/helpers/card_e2e_framework.mjs';

const failures = [
  { test: '036', shard: '26RBS02.json', key: '26RBS02-X14', ab: 1, op: 'BOUNCE' },
  { test: '048', shard: '26RCB01.json', key: '26RCB01-008', ab: 0, op: 'BOUNCE' },
  { test: '049', shard: '26RCB01.json', key: '26RCB01-011', ab: 1, op: 'BOUNCE' },
  { test: '050', shard: '26RCB01.json', key: '26RCB01-052', ab: 0, op: 'BOUNCE' },
  { test: '052', shard: '26RCB01.json', key: '26RCB01-049', ab: 1, op: 'BOUNCE' },
  { test: '053', shard: '26RCB01.json', key: '26RCB01-021', ab: 1, op: 'BOUNCE' },
  { test: '054', shard: '26RCB01.json', key: '26RCB01-019', ab: 0, op: 'BOUNCE' },
  { test: '055', shard: '26RCB01.json', key: '26RCB01-048', ab: 1, op: 'BOUNCE' },
  { test: '057', shard: '26RCB01.json', key: '26RCB01-024', ab: 0, op: 'BOUNCE' },
  { test: '068', shard: '26RSD07.json', key: '26RSD07-007', ab: 0, op: 'BOUNCE' },
  { test: '069', shard: '26RSD07.json', key: '26RSD07-X02', ab: 0, op: 'BOUNCE' },
  { test: '104', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A6513', ab: 0, op: 'EXHAUST' },
  { test: '105', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A9188', ab: 1, op: 'EXHAUST' },
  { test: '106', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A9305', ab: 0, op: 'EXHAUST' },
  { test: '108', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A11148', ab: 0, op: 'EXHAUST' },
  { test: '109', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A11637', ab: 1, op: 'EXHAUST' },
  { test: '110', shard: 'BS03.json', key: 'VER-THANDIA2', ab: 0, op: 'EXHAUST' }
];

console.log('Testing 17 cards before modifications:');
let passed = 0;
let failed = 0;

for (const item of failures) {
  try {
    await runCardAbilityE2E({
      shardFile: item.shard,
      cardKey: item.key,
      cardNumber: item.key,
      abIdx: item.ab,
      expectedOp: item.op,
      requireCompilerMatch: true
    });
    console.log(`PASS: Test ${item.test} (${item.key})`);
    passed++;
  } catch (err) {
    console.log(`FAIL: Test ${item.test} (${item.key}): ${err.message}`);
    failed++;
  }
}
console.log(`Results: ${passed} passed, ${failed} failed.`);
