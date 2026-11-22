# Battle Spirits Eternal — Work Package F/G Audit Handoff Report

**Generated:** `2026-11-19T09:31:30+05:30`  
**Runtime Verified:** Node.js `v24.16.0` (Windows)  
**Scope:** Packaging-only optimization. Zero modifications were made to the game engine, compiler, compiled IR shards, card database, or test suites.

---

## 1. Archive Size & Compression Summary

| Metric | Value |
| :--- | :--- |
| **Previous Handoff Archive (`work_package_fg_handoff.zip`)** | `258,233,791` bytes (`246.27 MB`) |
| **New Audit Bundle (`work_package_fg_audit_bundle.zip`)** | **`22,892,822` bytes (`21.83 MB`)** |
| **Size Reduction vs. Previous Handoff Archive** | **`91.13%` smaller** (`-224.44 MB`, `11.28x` smaller) |
| **Uncompressed Size of Included Files** | `215,066,104` bytes (`205.10 MB`) |
| **Compression Ratio (Uncompressed / Compressed)** | **`9.39x`** (`89.36%` compression reduction via ZIP Deflate `Optimal`) |
| **Included Files (covered by `MANIFEST.txt`)** | **`1,770`** files (`1,771` total ZIP entries including root `MANIFEST.txt`) |
| **Excluded Files** | **`1,720`** files (`857,586,207` bytes / `817.86 MB`) |
| **Target Threshold (`< 500 MB`, single ZIP archive)** | **Achieved** (`21.83 MB` in a single `.zip` archive) |

---

## 2. Exclusion Categories & Reasons

No engine source files, compiler files, authoritative IR shards, card indexes, test files, or test fixtures were excluded. All `1,720` excluded files (`817.86 MB`) belong to non-audit categories:

| Exclusion Category | Files | Uncompressed Size | Reason |
| :--- | ---: | ---: | :--- |
| `previous_handoff_and_zip_archives` | 48 | `415.79 MB` | Nested historical handoff ZIPs (`work_package_fg_handoff.zip`, `work_package_de_handoff.zip`, `work_package_c3_1_handoff.zip`, `work_package_c3_handoff.zip`, `work_package_c2_handoff.zip`, `work_package_c1_handoff.zip`, `phase4c3_*`, etc.) |
| `server_monolithic_card_effects_db` | 1 | `120.50 MB` | Legacy monolithic `card_effects_db.json` used only by `server.js` web endpoint and offline `compile_per_card_db.mjs`; not read by the engine, 514 shards, exhaustive audit, or test suite |
| `unrelated_historical_reports` | 415 | `77.66 MB` | Historical milestone CSV/JSON/MD reports under `reports/` (the 3 historical files asserted by tests — `reports/phase1_honest_effect_classification.md`, `reports/work_package_c3/shard_migration_diff.json`, and `reports/work_package_c3/shard_audit_summary.json` — and current `reports/work_package_fg/` data files were **preserved**) |
| `duplicate_ir_shards_staging` | 514 | `72.35 MB` | Exact staging duplicate (`data/ir_shards_staging/`) of `data/ir_shards/` |
| `server_sqlite_db_files` | 3 | `62.80 MB` | SQLite web-server database (`battle_spirits.db`, `-wal`, `-shm`) used only by `server.js` and offline DB scripts; not required by any test or audit script |
| `ir_shards_pre_compilation_backup` | 514 | `56.51 MB` | Pre-compilation backup copy (`data/ir_shards_pre_compilation_backup/`) superseded by authoritative `data/ir_shards/` |
| `unrelated_agent_scratch_and_legacy_dirs` | 225 | `12.25 MB` | Unrelated directories (`more/`, `.agents/`, `Users/`, `.freebuff/`, `phase4c3_1_8_final_specification_lock/`) not referenced by engine, compiler, or tests |
| `.git/` & `node_modules/` | — | — | Excluded by policy (`node_modules/` is not present; project uses pure Node.js built-ins) |

---

## 3. Preserved Corpus & Subsystems Verification

All required audit components are preserved untouched inside `work_package_fg_audit_bundle.zip`:
- **Engine & Implementation (`engine/`, `compiler/`):** Complete rules engine, resolver (`engine/resolver.js`), selectors (`engine/selectors.js`), structured condition parser/evaluator (`engine/conditions.js`), continuous effects/modifiers/restrictions/immunity (`engine/continuous.js`), operation handlers (`engine/ops/index.js`), zones, state, flow, events, payment, and legacy bridge.
- **Compiled IR & Card Data (`data/`):**
  - **514 compiled IR shards** confirmed in `data/ir_shards/`.
  - **14,609 unique base card numbers** (`15,398` compiled card records).
  - **36,422 ability records**, **51,734 clauses**, **4,940 condition instances**.
  - `data/cards_index.json`, `data/cards_detailed.json`, `data/per_shard_validation_inventory.json`, `data/card_implementation_status.json`, and all `345` files in `data/effects/`.
- **Tests, Runners & Verification (`tests/`, `scripts/`, `scratch/`):** Complete test directory (`192` test suites in `tests/run_all.js`), `scripts/run_verified_suites.mjs`, `scripts/audit_514_cards_exhaustive.mjs`, `scripts/evidence_registry.mjs`, `scripts/discover_executable_tests.mjs`, and test-referenced `scratch/` fixtures.
- **Project Configuration (`package.json`):** Zero external npm dependencies (`package.json` has no `dependencies` or `devDependencies`, and no `package-lock.json` is needed; pure Node.js `v24.16.0` built-ins).

---

## 4. SHA-256 Manifest Verification

`MANIFEST.txt` is stored at the root of `work_package_fg_audit_bundle.zip` in the format:
`<sha256_hex>  <exact_bytes>  <relative_path>`

- **Manifest Coverage:** `1,770 / 1,770` included files (excludes `MANIFEST.txt` itself; contains zero excluded files).
- **Clean-Extraction Manifest Result:** **PASS** — `1,770 / 1,770` files matched both SHA-256 hash and exact byte size, with `0` extra untracked files.

### Independent Manifest Verification Command (PowerShell)
```powershell
$dir = (Get-Location).Path
$sha = [System.Security.Cryptography.SHA256]::Create()
$lines = Get-Content (Join-Path $dir 'MANIFEST.txt')
$verified = 0
foreach ($line in $lines) {
  if (-not $line) { continue }
  $hash, $size, $rel = $line -split '  ', 3
  $target = Join-Path $dir $rel
  if (-not (Test-Path $target)) { throw "Missing: $rel" }
  if ((Get-Item $target).Length -ne [int64]$size) { throw "Size mismatch: $rel" }
  $s = [System.IO.File]::OpenRead($target)
  try { $actual = ([BitConverter]::ToString($sha.ComputeHash($s))).Replace('-','').ToLowerInvariant() } finally { $s.Dispose() }
  if ($actual -ne $hash) { throw "SHA-256 mismatch: $rel" }
  $verified++
}
Write-Host "PASS: $verified / $($lines.Count) files verified."
```

---

## 5. Clean-Extraction Reproduction Results

The archive `work_package_fg_audit_bundle.zip` was extracted into a clean temporary directory (`$env:TEMP\bsp_fg_audit_verify`) and every verification command was executed from that extracted directory under **Node.js `v24.16.0`** (with no `npm install` required because `package.json` has zero external dependencies):

| Step | Exact Command | Observed Result |
| :--- | :--- | :--- |
| **1. Manifest Integrity** | PowerShell SHA-256 + byte-size verifier above | **PASS** (`1,770 / 1,770` matched, `0` extra files) |
| **2. Shard Count** | `(Get-ChildItem data/ir_shards -Filter *.json).Count` | **PASS** (`514` shards present) |
| **3. Exhaustive 514-Shard Audit** | `node scripts/audit_514_cards_exhaustive.mjs` | **PASS** (`shards=514`, `records=15398`, `uniqueBaseCards=14609`, `abilities=36422`, `clauses=51734`, `conditions=4940`, `reconciledOps=True`, `reconciledConds=True`) |
| **4. Verified Suite Runner** | `node scripts/run_verified_suites.mjs --all` | **PASS** (`615` tests, `615` pass, `0` fail, `0` skipped) |
| **5. F/G Targeted + Identity Tests** | `node --test tests/work_package_fg_targeting_conditions_continuous.test.js tests/identity_subsystem_e2e_acceptance.test.js` | **PASS** (`46` tests, `46` pass, `0` fail, `0` skipped) |
| **6. Complete Test Suite** | `node tests/run_all.js` | **PASS** (`2,008` tests, `335` suites, `2,008` pass, `0` fail, `0` skipped) |

---

## 6. Intentional Exclusions & Limitations

- **`battle_spirits.db` (`-wal`, `-shm`) and `card_effects_db.json`:** Intentionally excluded (`183.30 MB` combined) because they are used only by the live HTTP server (`server.js`) and offline database-compilation scripts (`scripts/compile_per_card_db.mjs`, `scripts/compile_sagas_1_to_3.mjs`, `scripts/clean_and_optimize_db.js`). They are not required for engine inspection, 514-shard auditing, or reproducing any of the `2,008` automated tests.
- **No `package-lock.json`:** The project has zero third-party npm packages (`package.json` uses Node.js built-ins only), so no lockfile exists and `npm install` is unnecessary.

---

## 7. Final Deliverable Locations

1. **Audit Bundle ZIP:** `c:\Users\namis\OneDrive\Documents\BSP\reports\work_package_fg\work_package_fg_audit_bundle.zip` (`22,892,822` bytes / `21.83 MB`)
2. **Audit Report:** `c:\Users\namis\OneDrive\Documents\BSP\reports\work_package_fg\work_package_fg_audit_report.md`
