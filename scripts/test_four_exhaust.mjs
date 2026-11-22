import { runCardAbilityE2E } from '../tests/helpers/card_e2e_framework.mjs';

const testCards = [
  { key: 'BATTLE-SPIRITS-A9188', ab: 1 },
  { key: 'BATTLE-SPIRITS-A9305', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11148', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11637', ab: 1 },
  { key: 'VER-THANDIA2', ab: 0 }
];

for (const tc of testCards) {
  try {
    await runCardAbilityE2E({
      shardFile: 'BS03.json',
      cardKey: tc.key,
      cardNumber: tc.key,
      abIdx: tc.ab,
      expectedOp: 'EXHAUST',
      requireCompilerMatch: true
    });
    console.log(`PASS: ${tc.key}`);
  } catch (err) {
    console.log(`FAIL: ${tc.key} -> ${err.message}`);
    if (err.actual !== undefined) {
      console.log(`  actual: ${err.actual}, expected: ${err.expected}`);
    }
  }
}
