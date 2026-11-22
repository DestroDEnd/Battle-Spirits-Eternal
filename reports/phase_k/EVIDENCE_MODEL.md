# Battle Spirits Eternal (BSP) — Structured Execution Evidence Model
## Phase K Work Package B: Rigorous Execution Evidence & Multi-Tier Classification Standard

**Evaluation Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Governing Standard:** Phase K Zero-Assumption Evidence Integrity Standard  
**Status:** **AUTHORITATIVE EVIDENCE MODEL**

---

## 1. Principles of the Phase K Evidence System

The evidence model eliminates previous methodology flaws:
1. **No Combination of Disparate Events:** A semantic evidence record represents strictly **one specific execution event** and its corresponding assertions. An operation that succeeds cannot be joined with an unrelated state delta from a subsequent or prior event.
2. **Execution Success $\neq$ Semantic Correctness:** An operation returning `success: true` or `status: 'SUCCESS'` does not prove rules correctness unless specific expected-state postcondition assertions pass.
3. **State Mutation $\neq$ Semantic Correctness:** A change in global player counts (e.g. hand or field size) cannot be attributed to an opcode unless the opcode's target, parameters, and zone transitions are validated.
4. **Handler Existence $\neq$ Semantic Support:** A `case 'OPCODE':` in `engine/ops/index.js` classifies an opcode as `HANDLER_PRESENT`, never `INTEGRATION_VERIFIED` or `SEMANTICALLY_VERIFIED`.
5. **No Card Promotion by Proxy:** A card with multiple compiled abilities cannot be classified as `SEMANTICALLY_VERIFIED` or `RULE_INTEGRATION_VERIFIED` if any of its required abilities remain unverified or blocked.
6. **No Shared Opcode Leakage:** A test verifying card A cannot be used to declare card B verified merely because both cards compile to `DESTROY`.

---

## 2. Structured Evidence Record Schema

Every qualified execution trace must adhere to `reports/phase_k/evidence_schema.json`:

```json
{
  "evidenceId": "EVID-DESTROY-1795254927609-a1b2c3d4",
  "testId": "TEST-CARD-E2E-BS01-001",
  "testSuite": "tests/work_package_hij_real_cards_e2e.test.js",
  "cardNumber": "BS01-001",
  "physicalCardInstanceId": "card_inst_42",
  "physicalAbilityId": "BS01-001#AB_1",
  "semanticAbilityId": "SEM-7f8a9b",
  "compiledAbilityId": "BS01-001#a0",
  "opcode": "DESTROY",
  "opcodeVariant": "DESTROY_OPP_LOW_BP",
  "controller": "player",
  "sourceZone": "field",
  "sourceCard": { "id": "card_inst_42", "cardNumber": "BS01-001" },
  "targetCard": { "id": "card_opp_12", "cardNumber": "BS01-011" },
  "targetSelection": ["card_opp_12"],
  "beforeState": { "oppField": 2, "oppGrave": 0 },
  "afterState": { "oppField": 1, "oppGrave": 1 },
  "expectedStateTransition": { "targetInTrash": true, "targetRemovedFromField": true },
  "actualStateTransition": { "targetInTrash": true, "targetRemovedFromField": true },
  "executionResult": { "success": true, "status": "SUCCESS" },
  "assertionResult": {
    "passed": true,
    "assertedProperties": ["destination_trash", "target_removed_from_field"]
  },
  "evidenceTier": "SEMANTICALLY_VERIFIED",
  "executionTimestamp": "2026-11-21T17:00:00.000Z",
  "durationMs": 0.42
}
```

---

## 3. The 8 Strict Evidence Tiers

| Evidence Tier | Code | Strict Semantic Definition | Required Evidence Proof |
|---|:---:|---|---|
| **NOT_IMPLEMENTED** | `NIM` | The mechanic, opcode, or clause has no handler or AST definition | Static code absence |
| **COMPILER_ONLY** | `CMP` | Compiler parses text into IR, but production runtime support is absent | AST clause exists, no runtime handler |
| **HANDLER_PRESENT** | `HND` | Case statement exists in `engine/ops/index.js`, but unverified by tests | AST + Handler in code |
| **INTEGRATION_VERIFIED** | `INT` | Opcode executes in engine flow, but card-specific state assertions are missing | Runtime execution event |
| **SEMANTICALLY_VERIFIED** | **`SEM`** | **Executed through production engine and ALL card-specific state assertions passed** | Single execution event + passing assertions |
| **RULE_INTEGRATION_VERIFIED** | **`RUL`** | **Verified within complete match lifecycle under full rules (timing, triggers, SBA, interaction)** | Full match / E2E scenario execution |
| **BLOCKED_UNSUPPORTED_DEPENDENCY** | `BLK` | Cannot be implemented or verified because a foundational subsystem is absent | Documented dependency |
| **VANILLA** | **`VAN`** | **Card has zero effect text; ordinary core rules apply** | 0 abilities, clean raw effect |

---

## 4. Operation-Specific Semantic Requirements

To achieve `SEMANTICALLY_VERIFIED` status, specific operations must assert:

1. **`DESTROY`:**
   - Target card was legally eligible under all filter conditions (side, type, BP).
   - Target was removed from source field stack.
   - Target card entered target trash/grave.
   - Any attached cores were returned to target player's reserve.
2. **`DRAW`:**
   - Exact number of cards moved from top of deck into hand.
   - Hand size increased by exact drawn count.
   - Deck size decreased by exact drawn count.
3. **`BOUNCE`:**
   - Target removed from field.
   - Target entered designated destination (Hand, Deck Top, Deck Bottom).
   - Attached cores returned to reserve.
4. **`MOVE_CORE`:**
   - Source pool decreased by exact count.
   - Destination pool increased by exact count.
   - Global core conservation verified ($\Delta C_{\text{universe}} = 0$).
5. **`BP_BUFF` / `BP_DEBUFF`:**
   - Effective BP before execution recorded.
   - Effective BP after execution equals exact $\text{BP}_{\text{before}} \pm \Delta\text{BP}$.
   - Duration tracked and verified to expire at step/turn boundary.
6. **`SUMMON`:**
   - Card entered field stack.
   - Card removed from hand/trash/deck.
   - Effective cost accurately deducted from reserve/field.

---

## 5. Conclusion

The Phase K evidence model establishes an airtight foundation for all card support metrics. No card is promoted without an unbroken chain of custody connecting its compiled IR to verified runtime state mutations.
