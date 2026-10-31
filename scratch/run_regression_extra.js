const { spawnSync } = require('child_process');
const tests = ['test_universal_effects_engine','test_universal_card_effects','test_burst_activation_rules','test_attack_step_flash','test_blocks','test_advent_and_unique_effects','test_timing_restrictions_and_advent','test_brave_and_nexus','test_nexus_flash_and_grand_skill','test_single_target_flash','test_ai_recovery_and_step_sync','test_tribute_and_flash'];
for (const t of tests) {
  const r = spawnSync('node', ['scratch/' + t + '.js'], { encoding: 'utf-8' });
  console.log((r.status === 0 ? 'PASS ' : 'FAIL ') + t + (r.status === 0 ? '' : '\n' + (r.stderr || r.stdout).split('\n').slice(0, 8).join('\n')));
}
