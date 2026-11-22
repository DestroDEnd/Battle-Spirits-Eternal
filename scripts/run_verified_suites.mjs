/**
 * scripts/run_verified_suites.mjs
 *
 * Reproducible verification runner separating self-contained suites (14 suites)
 * from external-data-dependent suites (6 suites). Refuses to run data-dependent
 * suites if required external `data/` prerequisites are missing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export const SELF_CONTAINED_SUITES = [
  'tests/core_game_rules_integrity_corrective.test.js',
  'tests/core_game_rules_engine.test.js',
  'tests/timing_triggers_continuous_sba.test.js',
  'tests/effect_execution_targeting_conditions.test.js',
  'tests/work_package_c_ops_conditions_compiler.test.js',
  'tests/work_package_c1_auditor_and_regression.test.js',
  'tests/work_package_c2_evidence_and_compiler.test.js',
  'tests/work_package_c3_evidence_integrity.test.js',
  'tests/work_package_c3_1_evidence_integrity.test.js',
  'tests/engine_core.test.js',
  'tests/eternal_17_burst_declaration.test.js',
  'tests/eternal_17_flag_nexus.test.js',
  'tests/eternal_17_soulcore_keywords.test.js',
  'tests/eternal_17_standby_unification.test.js',
  'tests/phase3_continuous_and_cost_gating.test.js',
  'tests/phase5_windows_ai.test.js',
  'tests/adversarial_m3_stress.test.js',
  'tests/keyword_registry.test.js',
  'tests/physical_ability_identity_corrective.test.js',
  'tests/physical_ability_identity_final.test.js',
  'tests/physical_ability_identity_integrity.test.js',
  'tests/work_package_hij1_conditions_truth_table.test.js',
  'tests/work_package_hij1_operation_variants.test.js',
  'tests/work_package_hij1_adversarial_determinism.test.js',
  'tests/work_package_hij1_1_evidence_adversarial.test.js'
];

export const DATA_DEPENDENT_SUITES = [
  'tests/real_card_semantic_validation.test.js',
  'tests/work_package_de_operations_and_cards.test.js',
  'tests/work_package_fg_targeting_conditions_continuous.test.js',
  'tests/work_package_fg1_restrictions_conditions_evidence.test.js',
  'tests/work_package_fg2_semantics_tristate_restrictions.test.js',
  'tests/data_audit.test.js',
  'tests/golden_compiler.test.js',
  'tests/identity_consumer_compatibility.test.js',
  'tests/identity_subsystem_e2e_acceptance.test.js',
  'tests/physical_ability_identity.test.js',
  'tests/runtime_activation_limits.test.js',
  'tests/work_package_hij_operations_compiler_integration.test.js',
  'tests/work_package_hij_real_cards_e2e.test.js',
  'tests/work_package_hij2_compiler_comparator.test.js',
  'tests/work_package_hij2_runtime_atomicity.test.js'
];

const EXTERNAL_PREREQUISITES = [
  { path: 'data/cards_index.json', kind: 'file' },
  { path: 'data/cards_detailed.json', kind: 'file' },
  { path: 'data/effects', kind: 'dir' },
  { path: 'data/per_shard_validation_inventory.json', kind: 'file' },
  { path: 'data/ir_shards/LM16.json', kind: 'file' },
  { path: 'data/ir_shards/BS17.json', kind: 'file' }
];

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
const args = new Set(process.argv.slice(2));
const includeData = args.has('--with-data') || args.has('--all');

if (includeData) {
  const missing = [];
  for (const req of EXTERNAL_PREREQUISITES) {
    const full = path.join(ROOT, req.path);
    if (!fs.existsSync(full)) {
      missing.push(req.path);
    }
  }
  const shardsDir = path.join(ROOT, 'data', 'ir_shards');
  if (fs.existsSync(shardsDir)) {
    const shardCount = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json')).length;
    if (shardCount !== 514) {
      missing.push(`data/ir_shards/*.json (expected 514, found ${shardCount})`);
    }
  } else {
    missing.push('data/ir_shards/');
  }

  if (missing.length > 0) {
    console.error('REFUSING TO RUN DATA-DEPENDENT SUITES — Missing external prerequisites:');
    for (const m of missing) console.error('  - ' + m);
    process.exit(2);
  }
}

const suitesToRun = includeData
  ? [...SELF_CONTAINED_SUITES, ...DATA_DEPENDENT_SUITES]
  : SELF_CONTAINED_SUITES;

console.log(`Running ${suitesToRun.length} ${includeData ? 'self-contained + data-dependent' : 'self-contained'} test suites...`);
const res = spawnSync('node', ['--test', ...suitesToRun], {
  cwd: ROOT,
  stdio: 'inherit'
});
process.exit(res.status ?? 1);
}
