# BATTLE SPIRITS ETERNAL — PHASE L.1
# INTERACTION PROTOCOL SECURITY & INTEGRITY AUDIT

**Module:** `engine/interaction.js`  
**Security Standard:** Player Authority & Anti-Impersonation Specification  
**Date:** 2026-11-22  

---

## 1. Audit Scope & Security Objective

The Universal Interaction Protocol governs all asynchronous player decisions during effect resolution. Because game integrity depends upon valid, authorized, and non-replayable responses, Phase L.1 audited and hardened the protocol against:
1. Unauthorized responders and player impersonation.
2. Cross-match replay attacks and stale response resubmission.
3. Candidate spoofing and selections from empty candidate pools.
4. Candidate staleness caused by intervening state mutations.
5. Nested interaction deadlocks and context clobbering.

---

## 2. Security Controls & Validation Layers

Each incoming response passed to `InteractionController.respond()` or `validateInteractionResponse()` undergoes multi-stage validation:

```
[Interaction Response Received]
           │
           ▼
[Layer 1: Lifecycle & Replay Check]
  - Is interaction ID in resolvedInteractions? ──► REJECT (ALREADY_RESOLVED_OR_STALE)
  - Is status WAITING_FOR_PLAYER?              ──► REJECT (ALREADY_RESOLVED_OR_STALE)
           │
           ▼ (Transitions to VALIDATING_RESPONSE)
[Layer 2: Match Context & Authentication]
  - Match ID matches active matchContext?      ──► REJECT (MATCH_CONTEXT_MISMATCH)
  - Auth token matches decisionOwner token?    ──► REJECT (UNAUTHORIZED_RESPONDER)
           │
           ▼
[Layer 3: Mandatory / Optional Constraint]
  - If mandatory and declined/cancelled?       ──► REJECT (CANNOT_CANCEL_MANDATORY_INTERACTION)
           │
           ▼
[Layer 4: Candidate Pool Integrity]
  - Empty pool but candidate selected?         ──► REJECT (ILLEGAL_CANDIDATE_SELECTED)
  - Candidate not in legal candidate pool?     ──► REJECT (ILLEGAL_CANDIDATE_SELECTED)
  - Duplicate selection when distinct req'd?   ──► REJECT (DUPLICATE_CANDIDATE_SELECTED)
  - Selection count < min or > max?            ──► REJECT (INSUFFICIENT/EXCESS_SELECTIONS)
           │
           ▼
[Layer 5: Current-State Revalidation]
  - Target still exists on expected zone?      ──► REJECT (CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE)
           │
           ▼ (Transitions to RESOLVING -> RESOLVED)
[Execution Committed to State]
```

---

## 3. Detailed Threat Mitigation & Test Evidence

### 3.1 Player Impersonation & Token Validation
- **Threat:** Player B attempts to answer an interaction owned by Player A.
- **Mitigation:** In `validateInteractionResponse()`, if `authContext` or `matchContext` is provided, `authContext.authToken` must match `matchContext.authTokens[interaction.decisionOwner]`.
- **Test Evidence:** `TC-L1-A01` (`tests/phase_l1_player_authority_adversarial.test.js`) verifies rejection with `UNAUTHORIZED_RESPONDER`.

### 3.2 Anti-Replay & Atomic State Guard
- **Threat:** Malicious or concurrent client resubmits a previously accepted response to duplicate an effect.
- **Mitigation:** Upon response validation, `InteractionController` marks the interaction as `VALIDATING_RESPONSE`, then `RESOLVING`, and adds the interaction ID to an internal `Set` (`resolvedInteractions`). Any subsequent call with the same ID is immediately aborted.
- **Test Evidence:** `TC-L1-A03` verifies rejection with `ALREADY_RESOLVED_OR_STALE`.

### 3.3 Candidate Pool Spoofing & Empty Pools
- **Threat:** Client injects an arbitrary card ID not provided in the engine's candidate pool, or selects a target when no valid targets exist.
- **Mitigation:** Candidate IDs are verified against pre-compiled `legalCandidateIds`, `legalCardIds`, and `legalStackIds`. Selections from empty candidate pools return `ILLEGAL_CANDIDATE_SELECTED`.
- **Test Evidence:** `TC-L1-C01` and `TC-L1-C02` verify rejection.

### 3.4 Current-State Candidate Revalidation
- **Threat:** A target spirit was legal when the interaction was issued, but an intervening continuous effect or trigger destroyed it while the player modal was open. Client sends response selecting the destroyed spirit.
- **Mitigation:** `validateInteractionResponse()` looks up `origCand.zone` and verifies that the target unit is still present in `state.players[side].field` (or `trash`/`hand`). If missing, the response is rejected with:
  `CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE: Target "..." is no longer in expected zone "field"`.
- **Test Evidence:** `TC-L1-C04` verifies rejection after state mutation.

### 3.5 Nested Interaction Integrity
- **Threat:** Resolving an ability triggers a secondary nested decision (e.g. destroy target spirit, which triggers tribute or core allocation), corrupting outer resolver state.
- **Mitigation:** `InteractionController` manages an active interaction stack per player. Resolving the child interaction resumes execution and pops context without losing the parent interaction scope.
- **Test Evidence:** `TC-L1-R01` verifies nested interactions resolve in LIFO order with complete state preservation.

---

## 4. Audit Verdict

The interaction subsystem is hardened, tamper-resistant, and strictly enforces the player-authoritative contract across all game modes.
