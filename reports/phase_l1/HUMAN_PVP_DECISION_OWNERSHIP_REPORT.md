# BATTLE SPIRITS ETERNAL — PHASE L.1
# HUMAN-VERSUS-HUMAN PvP DECISION OWNERSHIP REPORT

**Scope:** Real-Time PvP, Local Hotseat & Browser Arena Authority  
**Primary Files Modified:** `battle_arena.js`, `engine/interaction.js`, `engine/session_mode.js`  
**Date:** 2026-11-22  

---

## 1. Executive Summary

In multiplayer trading card games, human-versus-human matches require that **every decision made by either player is authoritatively owned by that human player**. The engine must never substitute an AI heuristic, default selection, or automated resolution for either side.

Prior to Phase L.1, the battle arena codebase contained pervasive references to `side === 'player'`, implicitly assuming that player 1 was the only human and player 2 (`opponent`) was always an AI bot. In hotseat or local two-player matches, this caused player 2's blocker declarations, target selections, and optional effect activations to be made silently by the AI engine.

Phase L.1 eliminated this asymmetry entirely. Both players in `HUMAN_VS_HUMAN` now exercise identical, independent decision ownership.

---

## 2. Key Remediation Areas

### 2.1 Blocker Declaration in Combat (`proceedWithPlayerAttack`)
- **Previous Flaw:** When player 1 attacked, defending response was executed via `setTimeout(() => { ... resolveDefenseOutcome(winBlocker); }, 900)`. If player 2 was human, they had no ability to declare blockers or take life damage.
- **Remediation:** In `battle_arena.js`, `proceedWithPlayerAttack` checks `isHumanPlayer('opponent')`. If player 2 is human, the engine presents `promptUniversalTargetModal`:
  ```javascript
  promptUniversalTargetModal({
    side: 'opponent',
    targetSide: 'opponent',
    targetKind: 'spirit',
    customPool: readyBlockers,
    title: '🛡️ Declare Blocker',
    description: `${attacker.name} (${battleBp} BP) is attacking! Choose a spirit to intercept, or Skip to take Life Damage:`,
    minCount: 0,
    maxCount: 1,
    allowSkip: true
  }, (selectedBlockers) => {
    let blk = (selectedBlockers && selectedBlockers[0]) || null;
    resolveDefenseOutcome(blk);
  });
  ```
- **Result:** Player 2 actively selects their blocker or clicks "Skip" to receive Life damage. AI heuristics are completely bypassed.

### 2.2 Target Selection Modals (`promptUniversalTargetModal`)
- **Previous Flaw:** Gated with `if (side !== 'player') return pool.slice(0, count)`.
- **Remediation:** Replaced with `if (!isHumanPlayer(side)) return pool.slice(0, count)`.
- **Result:** When player 2 is human (`HUMAN_VS_HUMAN`), `isHumanPlayer('opponent')` is `true`. The modal UI renders on screen and prompts player 2 for their selection.

### 2.3 Structured Decision System (`promptStructuredDecision`)
- Gated all 4 decision branches (Optional Confirmation, Branch Choice, Target Selection, and Core Allocation) with `!isHumanPlayer(chooser)` instead of `chooser !== 'player'`.
- Both players now receive interactive modals for:
  - `CONFIRM_OPTIONAL`: Player 2 confirms or declines optional effects.
  - `CHOOSE_BRANCH`: Player 2 selects ability modes or effect branches.
  - `SELECT_TARGET`: Player 2 selects exact targets with visual counters.
  - `CORE_ALLOCATION`: Player 2 allocates cores across their field units.

### 2.4 Opposing Symbol & BP Destruction Handlers
- Audited and updated rules handlers 4B (One-Symbol Destruction), 4C (BP Destruction), Core Depletion, and BP Reduction in `battle_arena.js`.
- If `isHumanPlayer(side)` is true, human players receive `promptUniversalTargetModal`. Slicing only occurs when `!isHumanPlayer(side)` (AI players).

---

## 3. Chrome DevTools Real-Browser PvP Verification

Full hotseat PvP execution was verified in real headless Chrome via [tests/phase_l1_browser_e2e.test.js](file:///C:/Users/namis/Downloads/BSP/tests/phase_l1_browser_e2e.test.js):

- **Scenario 5 (Human Defender Blocker Prompt):**
  - Configured match mode: `HUMAN_VS_HUMAN`.
  - Player 1 declared attack with Lord-Dragon.
  - Verified `isHumanPlayer('opponent')` is `true`.
  - Verified blocker modal `#universalTargetModal` opened with title `🛡️ Declare Blocker`.
  - Human defender selected Blocker spirit explicitly via DOM click.
  - Defense resolved intercepting attack with selected blocker.
- **Scenario 10 (Strict AI Decision Provider Isolation):**
  - Initialized match in `HUMAN_VS_HUMAN`.
  - Effect requested for player 2.
  - Verified zero calls to AI decision provider (`aiCalls === 0`).
  - Interaction remained in `WAITING_FOR_PLAYER` until human player 2 confirmed.

---

## 4. Acceptance Criteria Compliance

- [x] Player 1 and Player 2 have distinct, symmetric control configurations.
- [x] In `HUMAN_VS_HUMAN`, no automated fallback or AI heuristic executes for either side.
- [x] Defense and blocking decisions are player-authoritative for both human participants.
- [x] Verified via synchronous unit test suite and real Chrome browser CDP tests.
