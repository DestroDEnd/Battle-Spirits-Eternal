const { execSync } = require('child_process');

const suites = [
  { name: 'User Fixes Master Suite', cmd: 'node scratch/test_all_user_fixes.js' },
  { name: 'Canva Arena Handlers & Braved Condition Gating', cmd: 'node scratch/test_canva_arena_handlers.js' },
  { name: 'Optional Popup, Dedupe & Flash Window', cmd: 'node scratch/test_optional_flash_dedupe.js' },
  { name: 'Brave & Nexus Mechanics', cmd: 'node scratch/test_brave_logic.js' },
  { name: 'Logout & Social Data Cleansing', cmd: 'node scratch/test_logout_clear.js' },
  { name: 'Featured X-Rares & JSON Fetching', cmd: 'node scratch/test_featured_and_batch.js' },
  { name: '100% Complete 14,529 Cards Verification Audit', cmd: 'py scratch/verify_all_14529_cards.py' }
];

console.log('====================================================');
console.log('🚀 RUNNING ALL MASTER REGRESSION & COVERAGE SUITES');
console.log('====================================================\n');

let allPassed = true;

for (const suite of suites) {
  console.log(`▶ Executing: ${suite.name}...`);
  try {
    const out = execSync(suite.cmd, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(out.trim());
    console.log(`✔ PASSED: ${suite.name}\n`);
  } catch (err) {
    console.error(`✖ FAILED: ${suite.name}`);
    console.error(err.stdout || err.stderr || err.message);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('====================================================');
  console.log('🎉 ALL MASTER TEST SUITES PASSED FLAWLESSLY (100%)!');
  console.log('====================================================');
} else {
  console.error('❌ Master verification had failures.');
  process.exit(1);
}
