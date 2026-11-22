# BATTLE SPIRITS ETERNAL — PHASE L.1
# AI DECISION PROVIDER ISOLATION & BOUNDARY AUDIT

**Target Subsystem:** AI Adapter & Decision Provider (`engine/interaction.js`, `battle_arena.js`)  
**Isolation Rule:** AI Decision Provider must NEVER be invoked for human players in any mode.  
**Date:** 2026-11-22  

---

## 1. Boundary Specification

In Battle Spirits Eternal, AI algorithms (heuristic search, BP comparison, blocker selection, optional effect evaluators) are designed exclusively for non-human opponents.

To prevent accidental "silent auto-play" where AI decision logic leaks into human gameplay, Phase L.1 established an architectural boundary:

```
[Interaction Request Issued]
            │
            ▼
    [Check Match Mode]
            │
    ┌───────┴───────┐
    ▼               ▼
HUMAN_VS_HUMAN   HUMAN_VS_AI / AI_VS_AI
    │               │
    │         Is decisionOwner AI?
    │          ┌────┴────┐
    │          ▼ YES     ▼ NO (Human)
    │     [Call AI]      │
    │                    │
    └──────────┬─────────┘
               ▼
   [Strict Human Wait State: WAITING_FOR_PLAYER]
   (Requires explicit Promise resolution)
```

---

## 2. Guard Implementation

In `engine/interaction.js`:
```javascript
// Strict AI Provider Isolation
if (matchCtx && matchCtx.canAiDecide(owner) && this.aiDecisionProvider && typeof this.aiDecisionProvider === 'function') {
  const aiResponse = this.aiDecisionProvider(interaction, this.state);
  if (aiResponse !== undefined && aiResponse !== null) {
    interaction.status = INTERACTION_STATUS.RESOLVED;
    interaction.resolvedAt = Date.now();
    interaction.response = aiResponse;
    this.history.push(interaction);
    return Promise.resolve(aiResponse);
  }
}
```

In `engine/session_mode.js`:
```javascript
canAiDecide(side) {
  // In HUMAN_VS_HUMAN mode, AI decisions are strictly prohibited for both players
  if (this.mode === EXECUTION_MODES.HUMAN_VS_HUMAN) return false;
  return this.isAi(side);
}
```

---

## 3. Adversarial Test Evidence

### 3.1 Test TC-L1-P01 (`tests/phase_l1_player_authority_adversarial.test.js`)
- **Setup:** `HUMAN_VS_HUMAN` match mode. AI provider registered with active spy counter.
- **Trial 1 (Player 1 prompt):** AI spy counter remained 0. Engine returned unresolved pending Promise.
- **Trial 2 (Player 2 prompt):** AI spy counter remained 0. Engine returned unresolved pending Promise.
- **Result:** **PASSED** — Proves zero AI invocation during human PvP.

### 3.2 Test TC-L1-P02 (`tests/phase_l1_player_authority_adversarial.test.js`)
- **Setup:** `HUMAN_VS_AI` match mode. Primary player is Human, opponent is AI.
- **Trial 1 (Human prompt):** AI provider called 0 times. Interaction paused in `WAITING_FOR_PLAYER`.
- **Trial 2 (AI prompt):** AI provider called exactly 1 time, resolving AI decision autonomously.
- **Result:** **PASSED** — Proves AI provider is strictly isolated to AI-controlled seats.

### 3.3 Real-Browser Scenario 10 (`tests/phase_l1_browser_e2e.test.js`)
- Evaluated in real headless Chrome via CDP.
- Confirmed that with `setMatchMode('HUMAN_VS_HUMAN')`, `BattleArena.isHumanPlayer('opponent')` is `true` and the AI defense callback is bypassed.
- **Result:** **PASSED** in real Chrome.

---

## 4. Conclusion

AI decision provider isolation is absolute, verifiable, and enforces the boundary between automated bots and human decision owners.
