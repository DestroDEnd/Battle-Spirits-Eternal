# Phase 4C.3.3.1 — Core Rules Engine Integrity Corrections & Acceptance Report

## 1. Executive Summary

Phase 4C.3.3.1 corrected all source-verified core-resource, state-validation, payment-atomicity, awaited lifecycle-event, and Eternal deck-legality defects discovered during the Phase 4C.3.3 audit. All **472 / 472** tests across 20 test suites pass with exit code 0.

## 2. Source-Verified Defects & Corrections

1. **Void-Source Validation (`engine/zones.js`, `engine/flow.js`)**: Removed `Math.max(0, ...)` clamping in `moveCore()` and enforced `voidCores.normal` / `voidCores.soul` availability before any mutation. Fixed Core Step in `flow.js` to pass `{ zone: 'void', side: this.state.activePlayer }`.
2. **Life-Source Exactness (`engine/zones.js`)**: Replaced `Math.min(count, life)` deduction with pre-mutation `fromPlayer.life >= count` validation and exact `count` deduction so deducted === credited.
3. **Total Core Accounting & State Validation (`engine/state.js`)**: Updated `getTotalPlayerCores()` to include `voidCores` and `byZone` breakdown; updated `validateGameState()` to report missing core-zone containers, invalid `voidCores`/`life`/`stack.cores` counts, invalid `combat` objects, and Soul Core conservation violations.
4. **Payment Atomicity (`engine/payment.js`)**: Implemented two-phase synchronous commit + `CORE_MOVED` event dispatch with full rollback if any event handler throws.
5. **Awaited Lifecycle & Activation Events (`engine/index.js`, `engine/resolver.js`)**: Converted `endBattle()`, `endAttack()`, and `abilityContext.commitActivation()` to `async` and awaited all `BATTLE_ENDED`, `ATTACK_ENDED`, and `ACTIVATION_COMMITTED` dispatches at every call site.
6. **Eternal Rules Version & Deck Legality (`engine/rules/eternal.js`, `engine/index.js`)**: Documented the repository's verified **Ver. 17.0** baseline (effective April 2026; Ver. 17.1 deltas marked `NEEDS_MANUAL_REVIEW`), added `validateDeck()` (40-card min, 3 copies/name max, 1 Contract Partner max), and enforced it in `createGame({ strictRules: true })` with explicit `unsafeTestBypassDeckValidation` opt-out.

## 3. Event Ordering Contract

Battle resolution emits events in strict deterministic awaited order:
`CARD_EXHAUSTED` (attacker) $\rightarrow$ `ATTACK_DECLARED` $\rightarrow$ `CARD_EXHAUSTED` (blocker) $\rightarrow$ `BLOCK_DECLARED` $\rightarrow$ `BATTLE_STARTED` $\rightarrow$ `BP_COMPARE` $\rightarrow$ `CARD_MOVED` $\rightarrow$ `DESTROYED` $\rightarrow$ `BATTLE_ENDED` $\rightarrow$ `ATTACK_ENDED`.

## 4. Test Execution Summary

- **Total Discovered / Executed**: 472 / 472
- **Passed / Failed / Skipped**: 472 / 0 / 0 (100%)
- **Exit Code**: 0
- **Duration**: 9,133.42 ms

## 5. Key Payload Checksums (Full 199-File Manifest in `MANIFEST.txt`)

> [!NOTE]
> `MANIFEST.txt` inside the handoff ZIP covers all 200 payload files including this report, and excludes its own checksum.

| File Path | Size (Bytes) | SHA-256 Checksum |
| :--- | ---: | :--- |
| `ARCHITECTURE_AND_DEPENDENCY_MAP.md` | 1,600 | `72ee1374c36877c3b810142f8864652231fe5943e0041081abc77387292252b7` |
| `DEFECT_REGISTER.md` | 2,431 | `8f1f07d552b0b522e6cf2a38086533bca1bf745bffc9dc03822236bf6a10efc8` |
| `IMPLEMENTED_RULES_INVENTORY.md` | 2,528 | `9833c58b6d9f380d951f40629680b4a6cb24a17c40f40c7085c67055b486b99b` |
| `REPRODUCTION_INSTRUCTIONS.md` | 2,452 | `d7c29c4a30751613ebb75dedcab32eaea7ada112a8cd04c2611b517b4abd2727` |
| `TEST_INVENTORY.md` | 1,033 | `1202be0b0faa612ddb571d8f3240eeb965a0639a3428267186f34323778b14bd` |
| `TRACEABILITY_MATRIX.md` | 927 | `fcbb06d7314f4aa116ed26a47aac5c62fa1bb56ba9f2cbfad547b2c15355fd46` |
| `UNSUPPORTED_AND_PARTIAL_RULES_INVENTORY.md` | 1,289 | `3480a59a4cad9256b11e531fccf7fe4b6af602edf920d808f54c02ce27dd73b7` |
| `engine/flow.js` | 12,518 | `9308c9867360e356cfe763e0bf41067cd534717a83f2439010119eed9c5e9e3c` |
| `engine/index.js` | 41,468 | `c23773856b6654b7899b7a854d740037841653b663b533bc62e4c2ff696b6879` |
| `engine/payment.js` | 10,840 | `7c9ba901855ec536d4f1223790126c645558c27c6f500363556a3dc7d070cbda` |
| `engine/resolver.js` | 24,520 | `e1fae5cd1193c0976cf573c24d54cb8918dfb8c1d31394eb4dc557afccacb289` |
| `engine/rules/eternal.js` | 5,967 | `9bc90d1dfa278665e6468021ed39003b27c0f064876f71f2f6e8a94f79d2c37e` |
| `engine/state.js` | 11,990 | `3be7ca0c3821e9de2c6bf6fabf4044e947cdb00e5929bfa25b03c38aa74f79b9` |
| `engine/zones.js` | 36,109 | `27aa6afe5c815ebe8648da333bbe7b6a93476e7a1aff865c4c54c7ab5b830c3f` |
| `execution_logs/test_run.log` | 93,772 | `7edf45944218b3b6dd8782e11f9d8cee248717cf6b5c5d814bd4d03c13774ee7` |
| `tests/core_game_rules_engine.test.js` | 22,709 | `c2e624cc63eb3a01c9460a324772a4e07b6d7308282fab1ff1e1a21ebb2120a1` |
| `tests/core_game_rules_integrity_corrective.test.js` | 17,174 | `fa69d36d37419e10a3dde5e619805741aa207a04f8b6afff31cdd384e68cead1` |
