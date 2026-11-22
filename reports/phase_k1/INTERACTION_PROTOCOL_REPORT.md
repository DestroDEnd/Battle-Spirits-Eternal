# Phase K.1 — Interaction Protocol & Engine Authority Report

## 1. Engine Authoritative Architecture
Under the Battle Spirits Eternal interaction protocol, the engine is strictly authoritative:
1. **Engine Authoritative Decision Generation:**
   The UI never decides what cards, zones, or players are legal targets. The engine constructs a fully resolved `InteractionRequest` detailing:
   - `id`: Unique sequence identifier (`interaction_1`, `interaction_2`, ...).
   - `type`: Standard interaction type (`SELECT_CARDS`, `SELECT_TARGET`, `PAY_CORES`, `CHOOSE_OPTION`, etc.).
   - `player`: The player prompted for intent.
   - `sourceCardId` & `sourceAbilityId`: Identifiers of the ability triggering the prompt.
   - `sourceZone` & `targetSide`: Verified zones and sides.
   - `candidates`: Concrete array of legal card/stack candidates with IDs and zone info.
   - `minSelections` & `maxSelections`: Exact cardinality bounds.
   - `optional`: Whether zero selections or declining is legal.
   - `context`: Current resolution context.
   - `status`: Lifecycle state (`WAITING_FOR_PLAYER`, `RESOLVED`, `CANCELLED`, `EXPIRED`).

2. **Player Intent Submission:**
   The UI returns user intent only (`{ selected: [candidateId, ...] }` or `{ declined: true }`).

3. **Engine Revalidation & Commit:**
   The engine:
   - Verifies the interaction is still active and pending (`WAITING_FOR_PLAYER`).
   - Validates that each selected ID exists in `interaction.candidates`.
   - Validates cardinality against `minSelections` and `maxSelections`.
   - Enforces that non-optional interactions cannot be declined.
   - Re-verifies card availability via `validateTargetAvailability`.
   - Resolves the pending Promise and commits the state mutation.
   - Marks the interaction as `RESOLVED`, permanently barring duplicate or replay attempts.

---

## 2. Verified Capabilities Matrix (`tests/phase_k1_interaction_protocol.test.js`)

| Scenario | Tested Invariant | Result |
| :--- | :--- | :--- |
| **Structured Request** | Emits source zone, target side, candidates, cardinality, and context | **PASS (0.91ms)** |
| **Invalid ID & Bypass** | Forged candidate IDs not in the candidate pool are rejected with `ILLEGAL_CANDIDATE_SELECTED` | **PASS (0.45ms)** |
| **Cardinality Bounds** | Selections below `minSelections` or above `maxSelections` are rejected | **PASS (0.19ms)** |
| **Optionality Enforcement** | Mandatory interactions reject `declined: true`; optional ones accept decline | **PASS (0.16ms)** |
| **Double Resolution Protection** | Resolved interactions reject subsequent responses with `ALREADY_RESOLVED_OR_STALE` | **PASS (0.38ms)** |
| **Sequential / Nested Prompts** | Distinct interaction IDs maintain independent, non-interfering lifecycles | **PASS (3.02ms)** |

Proceed to **Work Package H (Targeting Context Isolation)**.
