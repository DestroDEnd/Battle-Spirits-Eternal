import { runCardAbilityE2E } from '../tests/helpers/card_e2e_framework.mjs';

async function testCard(opts) {
  try {
    await runCardAbilityE2E(opts);
    console.log(`PASS: ${opts.cardNumber}`);
  } catch (err) {
    console.log(`FAIL: ${opts.cardNumber}`);
    console.log(err);
  }
}

await testCard({ shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A6513", cardNumber: "BATTLE-SPIRITS-A6513", abIdx: 0, expectedOp: "EXHAUST", requireCompilerMatch: true });
