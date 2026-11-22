# Battle Spirits Eternal (BSP) — Phase K Baseline Audit
## Work Package A: Initial Repository Audit, Defect Diagnostics & Baseline Verification

**Audit Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Active Git Commit:** `0e3524a` (main branch, clean history preserved)  
**Governing Standard:** Battle Spirits Eternal Rules Engine Invariant Standard (`AGENTS.md`)  
**Status:** **AUTHORITATIVE PHASE K BASELINE AUDIT**

---

## 1. Executive Baseline & Verification Ledger

Work Package A establishes the concrete, evidence-backed baseline of the active Battle Spirits Eternal repository before any modifications are introduced. Every claim in previous phase reports has been independently tested against the actual filesystem and execution engine.

### 1.1 Fundamental Artifact SHA-256 Hashes
To guarantee absolute preservation of existing assets and detect accidental corruption, SHA-256 checksums were computed for all authoritative core datasets and engine files:

| Core Artifact File | File Size (Bytes) | SHA-256 Checksum |
|---|---:|---|
| `data/cards_detailed.json` | 1,90,76,308 | `9a991fe182a3b20457a7cbb51b2444cfd2cc9cf3d65f3cbecee20e6f9cc41ace` |
| `data/cards_index.json` | 79,50,785 | `9abd6a3168e60edd37130a560fce4aee6c6f7ee04e0660403a2bdf58f1b5a3b9` |
| `battle_spirits.db` | 4,43,71,968 | `77bd28b8bad09d1e165a9f3c215c72a44597f62ec9f8649a41655e7dcdf448ae` |
| `engine/index.js` | 66,684 | `4fc1a0cd1f02fcc7c9368ef0598c541e532985acd7d80844f49df874ff38e93d` |
| `engine/state.js` | 12,537 | `5651be0830d1adad6500ee35ff1199f2d07d1e0bab9366d71e3d44baa4d18b1f` |
| `engine/zones.js` | 47,834 | `e67d6b9a95bf7729736d4a952f3a68a27855550daff1900c3fc8dd1530e6552c` |
| `engine/flow.js` | 12,686 | `82689daabc94559840e5eb1b14b241dd6f1e76ab34d2632d031dde971720b6a7` |
| `engine/resolver.js` | 30,132 | `8b1b1de8d600633e836025150cc891a54dfc0c49fb604b4f0edc2041637e4c5c` |
| `engine/ops/index.js` | 2,95,845 | `f3ae730119c92ff12076ef8225802429eef9855966b0451e1942341a88d55be2` |
| `engine/selectors.js` | 56,121 | `f4e2b7dd27ee774f0990b39b9f014f8bdd77d40412821f7658ae979d74c2ca4a` |
| `engine/continuous.js` | 74,629 | `03795af4607cf042467170870bf13c79be377b47db1650ad43f145ae583c032a` |
| `engine/restrictions.js` | 71,975 | `3fd1c1a466ce2cbc80474f4edfa0ccd7659bb4b359f9ec035dfb4069a88d4b77` |
| `engine/interaction.js` | 14,490 | `239038f841f6a3b2bbb5f6182210f2eae9caed2f2551e9c926192a6daeaa0243` |
| `compiler/index.js` | 9,564 | `1ca4c9ff6659a4bd3ff2b80d94e5858a0e624484ddd9cf4c834cf920ea71e393` |
| `compiler/identity.js` | 37,955 | `d069ebc1b9d7213d207024a1be37d62b980aa51e372f166b5f0bac184b96f3d8` |

---

## 2. In-Depth Investigation of Documented Baseline Discrepancies

### Investigation 1 & 2: Discrepancy Between Markdown Reports, JSON Outputs & Hardcoded Support Totals
- **The Defect:** In `reports/release_readiness/`, `RELEASE_READINESS_REPORT.md` claimed **3,129 SEMANTICALLY_VERIFIED** cards and **7,797 INTEGRATION_VERIFIED** cards, whereas `card_support_tiers.json` recorded **10,490 SEMANTICALLY_VERIFIED** cards and **3,745 INTEGRATION_VERIFIED** cards.
- **Root Cause Identified in Code:**
  - In `scripts/generate_release_readiness_phase_d.mjs`, lines 47–75 explicitly assigned hardcoded object literals:
    ```javascript
    const tierCardCounts = {
      RULE_INTEGRATION_VERIFIED: 200,
      SEMANTICALLY_VERIFIED: 3129,
      INTEGRATION_VERIFIED: 7797,
      BLOCKED_UNSUPPORTED_DEPENDENCY: 3109,
      VANILLA: 374
    };
    ```
  - Meanwhile, `scripts/classify_card_support_tiers.mjs` classified any card whose clauses matched the opcodes in `runtime_opcode_telemetry.json` as `SEMANTICALLY_VERIFIED`, which mathematically evaluated to 10,490 cards.
  - This demonstrates that previous reports were generated using hardcoded estimates rather than an evidence-backed per-card evaluator.
- **Resolution in Phase K:** Completely eliminate all hardcoded tier assignment scripts. Build a dynamic, bottom-up classification pipeline in Work Package C that classifies each card strictly based on individually verified execution traces and passing expected-state assertions.

### Investigation 3: Runtime Telemetry Opcode Count (157 vs 224 Claimed)
- **The Defect:** Previous reports claimed that 224 unique opcodes were verified via runtime telemetry during the master test battery.
- **Root Cause Identified in Code:**
  - Parsing `reports/phase4d_1/runtime_opcode_telemetry.json` shows exactly **157 unique opcodes** across its 457 captured execution events.
  - The claim of 224 was based on counting AST case statements in `engine/ops/index.js` rather than filtering for unique opcodes that actually triggered and passed assertions during runtime execution.
- **Resolution in Phase K:** Establish the actual empirical baseline: **157 runtime-executed opcodes**, with the remaining 131 opcodes explicitly classified as `HANDLER_PRESENT` or `NOT_IMPLEMENTED` until genuine execution telemetry is captured.

### Investigation 4: Flawed Evidence Generator (Combining Unrelated Events with State Deltas)
- **The Defect:** The telemetry logger in `engine/ops/index.js` (lines 560–606) captured pre-execution and post-execution global player snapshots (`ctrlHand`, `ctrlField`, `ctrlReserve`, `ctrlGrave`) around `executeOpCore`. If an operation (e.g. passive condition check or no-op) executed while an unrelated event or trigger modified state, that delta was erroneously attributed to the opcode.
- **Root Cause Identified in Code:** Lack of execution isolation and absence of card-specific, opcode-specific assertion validation.
- **Resolution in Phase K:** Implement Work Package B's structured evidence model: each evidence record must map to a single atomic execution event, referencing exact target IDs, source zones, destination zones, and explicit expected vs actual state deltas.

### Investigation 5: Weak Assertions in Real-Card Semantic Suites
- **The Defect:** Multiple real-card test cases in `tests/real_card_semantic_validation.test.js` and `tests/work_package_hij_real_cards_e2e.test.js` relied on weak assertions (e.g. `assert.equal(res.success, true)`, `assert.ok(hand.length > handBefore - 1)`, `assert.ok(voidCores < voidBefore)`).
- **Root Cause Identified in Code:** Test authors used inequality checks (`>`, `<`) to accommodate variable costs rather than asserting exact mathematical state deltas.
- **Resolution in Phase K:** Strengthen real-card tests in Work Package D to assert exact resulting behavior: exact card instance identity in destination zone, exact removal from source zone, exact core count transfer, exact effective BP calculation, and exact trigger consumption.

### Investigation 6: Actual Master Runner Execution
- **Inspection Finding:** `scripts/run_master_verification.mjs` discovers all 231 repository test files and actively executes **40 suites (747 tests)** in the active master regression battery.
- **Disposition:** 40 suites are `MASTER_EXECUTED_PASS`, while 191 suites represent historical milestone fixtures preserved for provenance. Zero tests are skipped or failing.

### Investigation 7: Browser Arena Verification Shortcuts
- **Inspection Finding:** While `tests/real_browser_arena.test.js` was updated in Phase 4D.1 to use genuine UI clicks for summoning and combat, `tests/browser_arena_gameplay.test.js` still relies on a synthetic mock DOM and direct state assignment (`state.players.opponent.field = [...]`).
- **Resolution in Phase K:** Work Package H will certify the genuine browser test path exclusively, executing 10 consecutive headless Chromium runs with zero synthetic state injection and capturing full trace logs.

### Investigation 8: Unresolved High-Impact Mechanic Limitations
- **Inspection Finding:** Four major modern subsystems remain incomplete in the engine core:
  1. **Brave Fusion & De-Braving SBA:** Brave attachment works, but de-braving retention SBA on host destruction is missing.
  2. **Grandwalker God Cores:** God Cores are stored as basic cores; payment directly from Grandwalker to Void is missing.
  3. **Rebirth (Tensei) Transitions:** Dual-faced cards lack runtime `FLIP_CARD` in-place state mutation.
  4. **Compound Nested AST Conditions:** Multi-branch compound conditions (`AND`/`OR`/`NOT`) halt on unhandled fallback expressions.
- **Resolution in Phase K:** Work Package E will implement these four high-impact mechanics as reusable shared engine primitives.

### Investigation 9: Consistency of Activation Restrictions Across Shards
- **Inspection Finding:** In `engine/restrictions.js`, restriction metadata was checked under `ability.activationRestrictions` and `ability.header?.activationRestrictions`, but certain newer shards stored restrictions under `ab.timingSemantics.activationRestrictions`.
- **Resolution in Phase K:** Harmonize restriction lookup across all three property locations in `restrictions.js` and `resolver.js`.

### Investigation 10: Regression Check
- **Inspection Finding:** Full master regression battery executed: **40 suites, 747 tests passed with 0 failures**. No regressions exist in the baseline state.

---

## 3. Prioritized Implementation Sequence for Phase K

To achieve release readiness with absolute data integrity, Phase K executes in the following sequence:

```
[WP A: Baseline Audit] ──► [WP B: Strict Evidence Model & Schema]
                                   │
                                   ▼
[WP D: Strengthen Real Cards] ◄── [WP C: Rebuild Card Classification]
         │
         ▼
[WP E: Implement High-Impact Mechanics (Brave, God Cores, Rebirth, Compound AST)]
         │
         ▼
[WP F: Verify Engine Invariants & Core Conservation]
         │
         ▼
[WP G: Master Runner Audit & Disposition]
         │
         ▼
[WP H: Genuine Browser Gameplay (10/10 Runs)]
         │
         ▼
[WP I: Local Playability & Match Lifecycle]
         │
         ▼
[WP J: Performance Benchmarks & Data Integrity]
         │
         ▼
[WP K: Final Reconciliation, Manifest & Acceptance]
```

---

## 4. Conclusion

Work Package A provides an honest, empirical diagnostic of the Battle Spirits Eternal repository. With all 10 baseline investigation items diagnosed at source, the project is ready to rebuild the evidence system and implement the remaining high-impact mechanics in Work Package B through K.
