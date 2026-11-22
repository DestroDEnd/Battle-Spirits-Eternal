import fs from 'fs';

// Let's test the logic on the 7 that just failed + the 17 originally failing
import { runCardAbilityE2E } from '../tests/helpers/card_e2e_framework.mjs';

const toTest = [
  // 11 BOUNCE
  { key: '26RBS02-X14', shard: '26RBS02.json', ab: 1, op: 'BOUNCE' },
  { key: '26RCB01-008', shard: '26RCB01.json', ab: 0, op: 'BOUNCE' },
  { key: '26RCB01-011', shard: '26RCB01.json', ab: 1, op: 'BOUNCE' },
  { key: '26RCB01-052', shard: '26RCB01.json', ab: 0, op: 'BOUNCE' },
  { key: '26RCB01-049', shard: '26RCB01.json', ab: 1, op: 'BOUNCE' },
  { key: '26RCB01-021', shard: '26RCB01.json', ab: 1, op: 'BOUNCE' },
  { key: '26RCB01-019', shard: '26RCB01.json', ab: 0, op: 'BOUNCE' },
  { key: '26RCB01-048', shard: '26RCB01.json', ab: 1, op: 'BOUNCE' },
  { key: '26RCB01-024', shard: '26RCB01.json', ab: 0, op: 'BOUNCE' },
  { key: '26RSD07-007', shard: '26RSD07.json', ab: 0, op: 'BOUNCE' },
  { key: '26RSD07-X02', shard: '26RSD07.json', ab: 0, op: 'BOUNCE' },
  // 6 EXHAUST
  { key: 'BATTLE-SPIRITS-A6513', shard: 'BS03.json', ab: 0, op: 'EXHAUST' },
  { key: 'BATTLE-SPIRITS-A9188', shard: 'BS03.json', ab: 1, op: 'EXHAUST' },
  { key: 'BATTLE-SPIRITS-A9305', shard: 'BS03.json', ab: 0, op: 'EXHAUST' },
  { key: 'BATTLE-SPIRITS-A11148', shard: 'BS03.json', ab: 0, op: 'EXHAUST' },
  { key: 'BATTLE-SPIRITS-A11637', shard: 'BS03.json', ab: 1, op: 'EXHAUST' },
  { key: 'VER-THANDIA2', shard: 'BS03.json', ab: 0, op: 'EXHAUST' },
  // The other 5 that had regression
  { key: '26RBS03-076', shard: '26RBS03.json', ab: 0, op: 'DESTROY' },
  { key: 'BS01-120', shard: 'BS01.json', ab: 0, op: 'DESTROY' },
  { key: 'BS01-011', shard: 'BS01.json', ab: 0, op: 'DESTROY' },
  { key: 'BS01-017', shard: 'BS01.json', ab: 0, op: 'DESTROY' },
  { key: 'BS03-127', shard: 'BS03.json', ab: 0, op: 'EXHAUST' },
  { key: 'BATTLE-SPIRITS-A5282', shard: 'BS04.json', ab: 0, op: 'EXHAUST' }
];

let passCount = 0;
let failCount = 0;
for (const item of toTest) {
  try {
    await runCardAbilityE2E({
      shardFile: item.shard,
      cardKey: item.key,
      cardNumber: item.key,
      abIdx: item.ab,
      expectedOp: item.op,
      requireCompilerMatch: true
    });
    console.log(`PASS: ${item.key} (${item.op})`);
    passCount++;
  } catch (err) {
    console.log(`FAIL: ${item.key} (${item.op}): ${err.message}`);
    failCount++;
  }
}
console.log(`Total: ${passCount} passed, ${failCount} failed.`);
