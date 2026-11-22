# Phase 4C.3.3.1.1 — Payment Commit Semantics, Rules Provenance & Reproducible Acceptance Report

## 1. Executive Summary

Phase 4C.3.3.1.1 resolved all remaining acceptance blockers from the Phase 4C.3.3.1 audit:
1. Implemented **3-phase non-rollback payment transaction semantics** in `engine/payment.js` with shared `transactionId`, duplicate-commit protection, and structured `PaymentEventDispatchError` on post-commit handler failure.
2. Reconciled **Eternal rules-version provenance** honestly: local implementation targets **Ver. 17.0**, official Bandai portal (`https://www.battlespirits.com/rule/official-rule-manual-eternal/`) is documented, and official rulebook citations / Ver. 17.0 vs Ver. 17.1 deltas remain `NEEDS_MANUAL_REVIEW` until the official PDF is locally audited.
3. Enforced **restored-game deck validation** in `createGame({ state, strictRules: true })` via `options.originalDecks` or verifiable non-bypassed `state.deckValidation` SHA-256 attestation.
4. Built a **genuinely reproducible Option B package** bundling `tests/RFC8785_TEST_VECTORS.json`, `battle_arena.js`, `package.json`, complete JS/MJS closure, `EXTERNAL_DEPENDENCY_INVENTORY.json`, and `scripts/run_verified_suites.mjs` (which runs 14 self-contained suites cleanly and refuses `--with-data` when external `data/` files are absent).

## 2. Independent Test Results by Category

| Category | Suites | Discovered / Executed | Passed | Failed | Exit Code | Duration |
| :--- | :---: | :---: | :---: | :---: | :---: | ---: |
| **A. Core Rules & Eternal** | 7 | 42 / 42 | 42 | 0 | 0 | 816.99 ms |
| **B. Identity & Activation** (w/ `data/`) | 7 | 379 / 379 | 379 | 0 | 0 | 7,824.06 ms |
| **C. Compiler & Data Integrity** (w/ `data/`) | 2 | 14 / 14 | 14 | 0 | 0 | 1,902.19 ms |
| **D1. Self-Contained Runner** (from extracted ZIP) | 14 | 179 / 179 | 179 | 0 | 0 | 1,721.90 ms |
| **D2. Full Runner** (w/ `data/`) | 20 | 474 / 474 | 474 | 0 | 0 | 10,956.17 ms |

## 3. Package Manifest Verification

`MANIFEST.txt` inside the ZIP records normalized forward-slash paths, byte sizes, and SHA-256 digests for all **208** payload files (including this report, excluding `MANIFEST.txt` itself).
