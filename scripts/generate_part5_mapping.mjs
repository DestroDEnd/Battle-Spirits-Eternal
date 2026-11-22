/**
 * scripts/generate_part5_mapping.mjs
 * 
 * Part 5 — Map Specifications to BSP Engine Architecture
 * Generates:
 * 1. KEYWORD_ENGINE_MAPPING.csv
 * 2. KEYWORD_IMPLEMENTATION_DEPENDENCY_GRAPH.json
 * 3. KEYWORD_ARCHITECTURE_GAPS.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const OUT_DIR = path.join(rootDir, 'reports', 'keyword_reconciliation_implementation');
const inventory = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'WIKI_MASTER_INVENTORY.json'), 'utf8'));

console.log(`Mapping ${inventory.length} keywords to engine subsystems...`);

const mappingRows = [];
const mappingHeaders = [
  'canonical_id',
  'canonical_name',
  'category',
  'compiler_subsystem',
  'runtime_subsystem',
  'event_hooks',
  'operations_reused',
  'new_operations_needed',
  'prompt_controller_required',
  'dependency_batch',
  'architecture_status'
];
mappingRows.push(mappingHeaders.join(','));

const dependencyBatches = {
  Batch_A_Compiler_And_Ownership: [],
  Batch_B_Core_Engine_Defect_Remediation: [],
  Batch_C_Combat_And_Attack_Keywords: [],
  Batch_D_Defensive_Armor_And_Resource_Keywords: [],
  Batch_E_Trigger_Area_And_Modern_Keywords: [],
  Batch_F_Diva_Collab_And_Standard_Keywords: []
};

for (const item of inventory) {
  const name = item.canonical_name;
  const kwId = item.canonical_id;
  const cat = item.category;

  let compilerSub = 'compiler/keyword_compiler.js & header_parser.js';
  let runtimeSub = 'engine/keywords/wave1.js';
  let eventHooks = 'ATTACK_DECLARED';
  let opsReused = 'STANDARD_COMBAT';
  let newOps = 'NONE';
  let promptReq = 'NO';
  let batch = 'Batch_C_Combat_And_Attack_Keywords';
  let status = 'READY';

  // Categorize into dependency batches
  if (['Infinite Blade', 'Awaken', 'True-Clash', 'Showdown', 'Consecutive Blade'].includes(name)) {
    batch = 'Batch_A_Compiler_And_Ownership';
    status = 'DEFECT_OWNERSHIP_CONFUSION';
  } else if (['Curse', 'True-Curse', 'Ultra Heavy Armor', 'Wave Crush', 'XV Crush', 'Heaven Holy Life', 'Chaotic Holy Life', 'Dark Assault', 'Clash', 'Type: Driver', 'Type: Song', 'Type: Field', 'Type: Flower', 'Type: Vision'].includes(name)) {
    batch = 'Batch_B_Core_Engine_Defect_Remediation';
    status = 'CONFIRMED_MECHANICAL_DEFECT';
  } else if (cat === 'Red' || cat === 'Blue' || name.includes('Clash') || name.includes('Crush') || name.includes('Assault') || name.includes('Blade')) {
    batch = 'Batch_C_Combat_And_Attack_Keywords';
    runtimeSub = 'engine/keywords/wave1.js & wave4.js';
    eventHooks = 'ATTACK_DECLARED, BLOCK_DECLARED';
  } else if (cat === 'White' || cat === 'Yellow' || name.includes('Armor') || name.includes('Life') || name.includes('Wall') || name.includes('Wheel') || name.includes('Barrier')) {
    batch = 'Batch_D_Defensive_Armor_And_Resource_Keywords';
    runtimeSub = 'engine/continuous.js & wave1.js & wave4.js';
    eventHooks = 'BP_COMPARE, MAGIC_USED, LIFE_REDUCED';
  } else if (cat === 'All' || name.includes('Burst') || name.includes('Mirage') || name.includes('Accel') || name.includes('Rebirth') || name.includes('Seal') || name.includes('Unleash') || name.includes('Advent') || name.includes('Manifest')) {
    batch = 'Batch_E_Trigger_Area_And_Modern_Keywords';
    runtimeSub = 'engine/keywords/wave2.js & wave3.js & engine/flow.js';
    eventHooks = 'STEP_START, BURST_DECLARED, ATTACK_DECLARED';
  } else {
    batch = 'Batch_F_Diva_Collab_And_Standard_Keywords';
    runtimeSub = 'engine/keywords/wave5.js & wave6.js';
    eventHooks = 'ATTACK_DECLARED, BATTLE_END';
  }

  // Specific operation mapping
  if (name === 'Infinite Blade') {
    newOps = 'TARGET_ATTACK_NO_EXHAUST';
    runtimeSub = 'engine/keywords/wave1.js & engine/flow.js';
  } else if (name === 'Wave Crush') {
    newOps = 'BANISH_DECKTOP_BY_COST';
    runtimeSub = 'engine/keywords/wave1.js';
  } else if (name === 'XV Crush') {
    newOps = 'MILL_10_DESTROY_COST_15';
    runtimeSub = 'engine/keywords/wave1.js';
  }

  if (item.official_definition.toLowerCase().includes('choose') || item.official_definition.toLowerCase().includes('select') || item.official_definition.toLowerCase().includes('destroy')) {
    promptReq = 'YES';
  }

  dependencyBatches[batch].push({
    canonical_id: kwId,
    canonical_name: name,
    category: cat,
    status
  });

  const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  mappingRows.push([
    esc(kwId),
    esc(name),
    esc(cat),
    esc(compilerSub),
    esc(runtimeSub),
    esc(eventHooks),
    esc(opsReused),
    esc(newOps),
    esc(promptReq),
    esc(batch),
    esc(status)
  ].join(','));
}

// 1. KEYWORD_ENGINE_MAPPING.csv
fs.writeFileSync(path.join(OUT_DIR, 'KEYWORD_ENGINE_MAPPING.csv'), mappingRows.join('\n'), 'utf8');
console.log('Saved KEYWORD_ENGINE_MAPPING.csv.');

// 2. KEYWORD_IMPLEMENTATION_DEPENDENCY_GRAPH.json
fs.writeFileSync(path.join(OUT_DIR, 'KEYWORD_IMPLEMENTATION_DEPENDENCY_GRAPH.json'), JSON.stringify(dependencyBatches, null, 2), 'utf8');
console.log('Saved KEYWORD_IMPLEMENTATION_DEPENDENCY_GRAPH.json.');

// 3. KEYWORD_ARCHITECTURE_GAPS.md
let archMd = `# KEYWORD ARCHITECTURE GAPS REPORT

## Overview
This document evaluates the existing BSP engine architecture against the complete rules requirements of all 348 Wiki keywords.

## 1. Compiler Subsystem (compiler/keyword_compiler.js & header_parser.js)
- **Strengths**: Header parser successfully isolates level restrictions, timing steps, and bracketed header keywords.
- **Architectural Gaps**:
  1. \`bindKeywordsToAbilities\` incorrectly ran regex extraction across body text clauses, binding reference-only keywords to cards natively.
  2. Bracket regex \`/\\[([A-Za-z0-9\\.\\-\\s]+?)(?:::\s*([^\\]]+)|:\s*([^\\]]+))?\\]/g\` split at the first colon, destroying keywords containing internal colons (\`[Type: Driver]\`, \`[Type: Song]\`, \`[Type: Field]\`, \`[Type: Flower]\`, \`[Type: Vision]\`).
  3. 73 Wiki keywords were omitted from \`KEYWORD_CATALOG\`.

## 2. Runtime Event Subsystem (engine/keywords/registry.js)
- **Strengths**: Event bus provides comprehensive lifecycle hooks: \`ATTACK_DECLARED\`, \`BLOCK_DECLARED\`, \`LIFE_REDUCED\`, \`DESTROYED\`, \`BATTLE_END\`, \`MAGIC_USED\`, \`BP_COMPARE\`, \`STEP_START\`.
- **Architectural Gaps**:
  1. \`DESTROYED\` event handler filters active keywords strictly using \`{ timing: 'WHEN_DESTROYED' }\`, which drops attack-timed keywords like True-Curse.
  2. Curse sets \`curseTargetStackId\` on block declaration, but no listener or step handler in \`engine/flow.js\` ever reads it.
  3. 66 handlers were registered as empty stubs with \`hooks: {}\`.

## 3. Continuous Immunity & Protection (engine/continuous.js)
- **Strengths**: Robust color and source type filtering under \`isImmune\`.
- **Architectural Gaps**:
  1. \`isArmorFamily\` array omitted \`Ultra Heavy Armor\`.
  2. Custom armor types (\`Knight Armor\`, \`Contract Armor\`, \`PS Armor\`) are not whitelisted in continuous immunity evaluation.

## 4. Player Decision Controller (engine/prompt_manager.js & interaction.js)
- **Strengths**: Asynchronous promise-based prompt resolution with replay protection and candidate validation.
- **Architectural Gaps**:
  1. True-Curse falls back silently to \`oppField[0]\` instead of respecting player choices.
  2. Waves 2 through 6 completely lack prompt controller integration.

## 5. Combat Flow (engine/flow.js & battle_arena.js)
- **Strengths**: Clean step transitions (Attack Declaration -> Flash 1 -> Block Declaration -> Flash 2 -> BP Comparison / Life Reduction -> Battle End).
- **Architectural Gaps**:
  1. Mandatory block enforcement (\`mustBlockIfAble\`) was only checked by AI heuristic, leaving human PvP flow unenforced.
  2. Infinite Blade target attack without exhaustion requires direct flow integration.
`;

fs.writeFileSync(path.join(OUT_DIR, 'KEYWORD_ARCHITECTURE_GAPS.md'), archMd, 'utf8');
console.log('Saved KEYWORD_ARCHITECTURE_GAPS.md.');

console.log('Part 5 Engine Mapping completed successfully.');
