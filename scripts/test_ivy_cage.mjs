import fs from 'fs';
import { runCardAbilityE2E } from '../tests/helpers/card_e2e_framework.mjs';

try {
  await runCardAbilityE2E({
    shardFile: 'BS03.json',
    cardKey: 'BS03-127',
    cardNumber: 'BS03-127',
    abIdx: 0,
    expectedOp: 'EXHAUST',
    requireCompilerMatch: true
  });
  console.log('PASS BS03-127');
} catch (e) {
  console.error('FAIL BS03-127:', e);
}
