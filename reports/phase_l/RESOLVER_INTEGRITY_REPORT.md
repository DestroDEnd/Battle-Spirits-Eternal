# BATTLE SPIRITS ETERNAL — PHASE L
# WORK PACKAGES G & H: RESOLVER INTEGRITY, SIMULTANEOUS TRIGGER ORDERING & SUSPENSION INTEGRITY REPORT

**Date:** 2026-11-22  
**Status:** COMPLETE & VERIFIED  
**Repository:** `C:\Users\namis\Downloads\BSP`  
**Test Reference:** [tests/phase_l_player_authoritative_interactions.test.js](file:///C:/Users/namis/Downloads/BSP/tests/phase_l_player_authoritative_interactions.test.js)

---

## 1. Executive Summary

Work Packages G and H harden the engine's core resolution loop (`engine/resolver.js`) and interaction security protocol (`engine/interaction.js`). 

Two core architectural invariants are guaranteed:
1. **Asynchronous Engine Suspension:** The engine must completely suspend execution upon reaching any decision point, entering a `WAITING_FOR_PLAYER` state and resuming only upon receipt of a valid, authorized response Promise.
2. **Player Ownership & Session Security:** No player may answer an interaction directed to their opponent, and stale or replay interactions must be rejected immediately.

---

## 2. Resolver Suspension Mechanism (WP G)

### 2.1 The Promise-Based Suspension Model
When an opcode in `engine/ops/index.js` or `engine/selectors.js` requires a decision, it calls `promptResolver.choose(prompt)`.

In an interactive or browser environment:
1. `promptResolver.choose` generates an `interactionId` and records the prompt in the pending interaction registry.
2. The engine marks its execution state as `WAITING_FOR_PLAYER`.
3. The engine awaits an unresolved `Promise`.
4. Timers (`setTimeout`) are strictly forbidden from resolving or bypassing this promise.
5. Once the player confirms via the UI, the promise resolves and the opcode execution resumes with the verified player data.

This was explicitly verified in `TC-L-10`:
```javascript
// From tests/phase_l_player_authoritative_interactions.test.js (TC-L-10)
let enginePaused = true;
const resolutionPromise = resolver.resolveLegacyAbility(state, card, ability, 'player', { promptResolver });

await new Promise(r => setTimeout(r, 50));
// Verifies engine is still suspended and has NOT finished
assert.equal(suspendedFlag, true, 'Engine must remain suspended in WAITING_FOR_PLAYER state');

// Fulfill prompt explicitly
fulfillPrompt(['opp_unit_target']);
const outcome = await resolutionPromise;
assert.equal(outcome.success, true);
```

---

## 3. Player Ownership & Security Invariants (WP H)

In `engine/interaction.js`, `validateInteractionResponse` enforces strict authorization:

### 3.1 Anti-Impersonation (Rule L-H1)
If an interaction is addressed to `player`, an answer submitted with `submittingPlayer: 'opponent'` is rejected with `UNAUTHORIZED_RESPONDER` (verified in `TC-L-06`).

### 3.2 Anti-Replay / Stale Rejection (Rule L-H2)
Once an interaction is resolved or cancelled:
- Its status transitions from `PENDING` to `RESOLVED` (or `CANCELLED`).
- Any subsequent submission carrying the same `interactionId` is rejected with `ALREADY_RESOLVED_OR_STALE` (verified in `TC-L-07`).

---

## 4. Verification Evidence

| Test ID | Security Check | Expected Error/Behavior | Status |
|---|---|---|---|
| `TC-L-06` | Player B answering prompt for Player A | Error: `UNAUTHORIZED_RESPONDER` | **PASS** |
| `TC-L-07` | Resubmitting previously resolved `interactionId` | Error: `ALREADY_RESOLVED_OR_STALE` | **PASS** |
| `TC-L-10` | Engine suspension on `WAITING_FOR_PLAYER` | Awaits external Promise; does not auto-advance | **PASS** |

---

## 5. Summary

The resolver and interaction protocol form a tamper-resistant, asynchronous foundation that guarantees player authority and prevents unauthorized or automated state manipulation.
