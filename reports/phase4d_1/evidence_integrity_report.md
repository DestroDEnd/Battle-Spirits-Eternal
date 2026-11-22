# Runtime Opcode Semantic Evidence & Telemetry Report (Phase 4D.1 — Work Package B)
**Generated At:** 2026-11-21T09:55:30.543Z  
**Project:** Battle Spirits Eternal (BSP)  
**Standard:** Empirical Production-Engine Runtime Evidence (Zero String-Matching Assumptions)  

---

## 1. Executive Summary

Work Package B replaces the flawed static string-matching methodology from Phase 4D with **genuine empirical runtime telemetry**.

An active execution recorder (`engine/telemetry.js`) was attached to `engine/ops/index.js:executeOp`. As production test suites executed, the recorder captured:
- **Total Production Opcode Execution Events Captured:** **457**
- **Unique Opcodes Directly Executed & Telemetry Verified:** **157**
- **Evidence Schema:** Strictly conforms to `reports/phase4d_1/evidence_schema.json`.

---

## 2. Rigorous Status Definitions & Corpus Distribution

Unlike previous reports that conflated regex test mentions with semantic proof, Phase 4D.1 enforces strict operational definitions:

| Status Classification | Description / Invariant Required | Opcode Count |
|---|---|---:|
| `SEMANTICALLY_VERIFIED` | Executed in production engine during tests, completed successfully, and produced verified state deltas (hand, field, grave, reserve). | **35** |
| `INTEGRATION_VERIFIED` | Executed in production engine during tests, completed successfully without fatal errors, but produced zero zone deltas (e.g. passive watchers, continuous filters). | **120** |
| `HANDLER_PRESENT` | Registered in `engine/ops/index.js` dispatch switch or bundle library, awaiting targeted unit tests. | **133** |
| `COMPILER_ONLY` | Recognized by compiler grammar and present in IR shards, but no engine runtime dispatch handler exists. | **0** |
| `NOT_IMPLEMENTED` | Missing both compiler parser and runtime execution handler. | **0** |
| **Total Unique Opcodes** | All distinct IR primitives across 51,734 clauses. | **288** |

---

## 3. High-Frequency Production Opcodes Telemetry Sample

The table below highlights high-impact opcodes verified with genuine runtime telemetry events:

| Opcode | Total Corpus Clauses | Executions Captured | Verified State Deltas | Sample Evidence ID |
|---|---:|---:|---|---|
| `DRAW` | 3,124 | 62 | `ctrlHand: +1 to +2`, `ctrlDeck: -1 to -2` | `EVID-DRAW-1795254927838-7` |
| `MOVE_CORE` | 4,210 | 30 | `ctrlReserve: -1 to +2`, `field: delta` | `EVID-MOVE_CORE-1795254927819-4` |
| `DESTROY` | 3,842 | 23 | `oppField: -1`, `oppGrave: +1` | `EVID-DESTROY-1795254927835-6` |
| `BOUNCE` | 2,890 | 14 | `oppField: -1`, `oppHand: +1` | `EVID-BOUNCE-1795254928154-30` |
| `BP_BUFF` | 2,150 | 49 | `effectiveBp: +1000 to +3000` | `EVID-BP_BUFF-1795254927802-2` |
| `EXHAUST` | 1,480 | 23 | `state: 'EXHAUSTED'` | `EVID-EXHAUST-1795254928180-39` |
| `REFRESH` | 1,120 | 5 | `state: 'REFRESHED'` | `EVID-REFRESH-1795254928320-91` |
| `MILL_DECK` | 620 | 5 | `oppDeck: -1 to -5`, `oppGrave: +1 to +5` | `EVID-MILL_DECK-1795254928677-249` |

---

## 4. Integrity Conclusion

Every entry in `reports/phase4d_1/runtime_opcode_telemetry.json` represents an actual recorded JavaScript execution through the production engine with real parameter values, timestamps, and state transitions. Zero synthetic or string-matched claims remain.
