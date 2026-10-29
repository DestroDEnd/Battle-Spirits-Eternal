const { execSync } = require('child_process');
const path = require('path');

const testSuites = [
  'test_soulcore_trash_and_drag.js',
  'test_nexus_flash_and_grand_skill.js',
  'test_timing_restrictions_and_advent.js',
  'test_nexus_viewboard_and_turnskip.js',
  'test_deck_library_and_view.js',
  'test_deck_no_upper_limit.js',
  'test_all_starter_and_deck_effects.js',
  'test_chakrambat_and_all_deck_cards.js',
  'test_universal_card_database.js',
  'test_lord_dragon_and_opponent_life.js',
  'test_advent_and_unique_effects.js',
  'test_multi_symbols.js',
  'test_burst_activation_rules.js',
  'test_arena_redirect.js',
  'test_turn_relocation.js',
  'test_step_navigator_reset.js',
  'test_ai_recovery_and_step_sync.js',
  'test_universal_effects_engine.js',
  'test_brave_and_nexus.js'
];

console.log(`🚀 RUNNING MASTER VERIFICATION ACROSS ALL ${testSuites.length} SUITES...\n`);

let passed = 0;
let failed = 0;

for (const suite of testSuites) {
  process.stdout.write(`⏳ Running ${suite}... `);
  try {
    const fullPath = path.join(__dirname, suite);
    const out = execSync(`node "${fullPath}"`, { encoding: 'utf-8' });
    console.log(`✅ PASSED`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED`);
    console.error(err.stdout || err.stderr || err.message);
    failed++;
  }
}

console.log(`\n==========================================`);
console.log(`RESULTS: ${passed} Passed, ${failed} Failed / ${testSuites.length} Total Suites`);
console.log(`==========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🏆 100% OF ALL TEST SUITES PASSED FLAWLESSLY!');
}
