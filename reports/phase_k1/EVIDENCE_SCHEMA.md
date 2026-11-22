# Phase K.1 Evidence Schema Specification (v1.0.0)

**Document Version:** 1.0.0  
**Phase:** Phase K.1 Unified Targeting, Source-Zone Integrity & Evidence Verification Closure  
**Module:** `engine/evidence.js`  
**Test Suite:** `tests/phase_k1_evidence_adversarial.test.js` (17/17 PASS, 100%)

---

## 1. Overview and Design Objectives

In previous phases (Phase 4D.1 and Phase K), card support reporting relied partially on heuristic indicators:
1. Regex matching on opcode strings (`case 'OP':`).
2. Regex extraction of card IDs from test titles (`cardRegex.exec(testName)`).
3. Unbound opcode execution telemetry decoupled from test assertions.
4. Manually assigned support tiers.

Under **Phase K.1 Work Package J**, these heuristic mechanisms are permanently deprecated and removed. All claims of runtime support and semantic verification must be backed by structured, versioned, event-bound evidence records.

---

## 2. Evidence Record Schema (22 Required Fields)

Every evidence record must strictly conform to Schema Version `1.0.0` with the following 22 fields:

| Field Name | Type | Description | Mandatory | Example |
|---|---|---|---|---|
| `evidenceId` | String | Unique, deterministic, cryptographically hashed evidence identifier | Yes | `EVID-DESTROY-BS42082-9f3a1c2d` |
| `schemaVersion` | String | Must equal `'1.0.0'` | Yes | `'1.0.0'` |
| `timestamp` | String | ISO 8601 timestamp of execution event | Yes | `'2026-11-22T10:01:00.000Z'` |
| `runId` | String | Unique identifier of the test execution run | Yes | `'RUN-20261122-100100'` |
| `testId` | String | Unique identifier of test case (`<suite>::<test>`) | Yes | `'tests/real_card_semantic_validation.test.js::BS42-082'` |
| `cardId` | String | Canonical card number | Yes | `'BS42-082'` |
| `cardInstanceId` | String | Unique instance identifier in match state | Yes | `'inst_BS42-082_1'` |
| `abilityId` | String | Structured ability ID | Yes | `'SEM#BS42-082#a0'` |
| `opcode` | String | Operation code executed | Yes | `'DESTROY'` |
| `executionId` | String | Unique execution event ID binding execution to state delta | Yes | `'EXEC-2026-TEST-001'` |
| `sourceZone` | String\|null | Declared source zone of actor or effect | Yes (null allowed) | `'field'` |
| `targetZone` | String\|null | Destination zone of targeted card/core | Yes (null allowed) | `'trash'` |
| `targetSide` | String\|null | Declared target side (`'player'` or `'opponent'`) | Yes (null allowed) | `'opponent'` |
| `targetCardInstanceId` | String\|null | Unique instance identifier of targeted card | Yes (null allowed) | `'inst_OPP_SPIRIT_1'` |
| `beforeState` | Object | Authoritative pre-execution state snapshot | Yes | `{ zones: { field: [...] } }` |
| `afterState` | Object | Authoritative post-execution state snapshot | Yes | `{ zones: { trash: [...] } }` |
| `expectedResult` | Object | Expected outcome contract | Yes | `{ success: true, targetCardInstanceId: ... }` |
| `actualResult` | Object | Actual outcome produced by engine execution | Yes | `{ executionId: ..., targetCardInstanceId: ... }` |
| `assertionOutcome` | Object | Exact assertions evaluated (`{ passed: boolean, assertions: string[] }`) | Yes | `{ passed: true, assertions: ['target_placed_in_trash'] }` |
| `resolverOutcome` | Object | Outcome returned by resolver (`{ success: boolean, status: string }`) | Yes | `{ success: true, status: 'SUCCESS' }` |
| `evidenceClassification` | String | Canonical classification tier (one of 8 standard values) | Yes | `'SEMANTICALLY_VERIFIED'` |
| `provenance` | Object | Traceable origin metadata (`testSuite`, `testName`, `executionPath`, `engineVersion`) | Yes | `{ testSuite: '...', executionPath: 'PRODUCTION_ENGINE' }` |

---

## 3. Standard Evidence Classifications

The engine defines 8 discrete, mutually exclusive classifications:

1. **`CORPUS_PRESENT`**: Card exists in the raw card database (`data/cards_detailed.json` or SQLite).
2. **`COMPILED`**: Card has been compiled into intermediate representation (IR shards) without errors.
3. **`HANDLER_PRESENT`**: All constituent opcodes have declared handler routines in `engine/ops/index.js`.
4. **`HANDLER_REACHABLE`**: Opcodes can be invoked through the production dispatcher without parser or signature errors.
5. **`INTEGRATION_EXECUTED`**: Card abilities have executed in an integrated game context with successful execution status.
6. **`SEMANTICALLY_VERIFIED`**: Full end-to-end semantic verification: exact card identity, exact source zone, exact target validation, state transition assertion, event-level binding, and zero contradictory mutations.
7. **`BLOCKED`**: Card relies on an unimplemented game subsystem (e.g. unhandled Rebirth/Brave fusion/Grandwalker God mechanics).
8. **`UNSUPPORTED`**: Opcode or mechanic is not implemented.

---

## 4. Provenance Traceability Chain

Evidence records must originate from genuine test executions following this unbroken chain:

$$\text{Test Execution} \longrightarrow \text{Card Instance} \longrightarrow \text{Ability} \longrightarrow \text{Opcode Execution} \longrightarrow \text{State Transition} \longrightarrow \text{Assertions} \longrightarrow \text{Evidence Record}$$

Any break in this chain (e.g. direct state mutation, synthetic candidate injection, or unbound telemetry) immediately invalidates the record.

---

## 5. Machine-Verifiable Adversarial Rules

Validation via `validateEvidenceRecord(record, seenIds, options)` enforces 16 strict adversarial rejection rules:
- `ADV-K1-01`: Rejects cross-event mismatch (`executionId` mismatch between execution and actual result).
- `ADV-K1-02`: Rejects unrelated card ID (`cardInstanceId` not matching `cardId`).
- `ADV-K1-03`: Rejects unrelated ability ID (`abilityId` not belonging to `cardId`).
- `ADV-K1-04`: Rejects unrelated test name (`testId` not reconciling with `testName`).
- `ADV-K1-05`: Rejects opcode telemetry without assertions (`assertions.length === 0`).
- `ADV-K1-06`: Rejects state changes caused by direct test mutation.
- `ADV-K1-07`: Rejects legacy execution mislabeled as production execution.
- `ADV-K1-08`: Rejects missing target identity on targeting operations (`DESTROY`, `BOUNCE`, etc.).
- `ADV-K1-09`: Rejects incorrect source zone (`cardInstanceId` not in `sourceZone` in `beforeState`).
- `ADV-K1-10`: Rejects incorrect target side (`targetSide` mismatch with owner in `beforeState`).
- `ADV-K1-11`: Rejects contradictory before/after states (e.g. destroyed card still in field).
- `ADV-K1-12`: Rejects duplicate evidence IDs.
- `ADV-K1-13`: Rejects invalid schema versions (`schemaVersion !== '1.0.0'`).
- `ADV-K1-14`: Rejects missing provenance object or fields.
- `ADV-K1-15`: Rejects stale evidence from previous test runs.
- `ADV-K1-16`: Rejects evidence generated by failed tests or failed resolver executions.
