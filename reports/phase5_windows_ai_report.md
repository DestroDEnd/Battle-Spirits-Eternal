# Battle Spirits Eternal - Phase 5 Timing Windows, Prompts, & AI Report

Generated: 2026-11-02

## 1. Executive Summary
Phase 5 establishes deterministic priority timing windows, asynchronous decision management, heuristic AI targeting, and opening setup (contract partner guarantee and mulligan) for Battle Spirits Eternal:

- **Test Suite Results**: **47 / 47 tests passing (100% green)**.
- **Architectural Modules Implemented**:
  - `engine/prompt_manager.js` (Unified Promise-based Prompt Manager)
  - `engine/windows.js` (TimingWindowManager for Burst & Flash windows with APNAP priority)
  - `engine/ai.js` (AIDecider with strategic threat scoring based on `ai_weights.json`)
  - `engine/mulligan.js` (Contract Partner guarantee and opening mulligan flow)

---

## 2. Key Mechanics & Rules Compliance

### Burst Windows
- Evaluates triggers immediately upon `LIFE_REDUCED`, `DESTROYED`, and `SUMMONED` events.
- **APNAP Ordering**: Turn player is prompted first; if passed, inactive player is prompted.
- **R20 Verified**: Sacrifice does NOT trigger "destroyed by opponent" bursts (e.g. Burgu-Hearts).
- **R21 Verified**: Life loss does not trigger "depleted/destroyed" bursts (e.g. Siegfrieden XV).
- **R22 Verified**: Vanilla summons do not trigger "after opposing summon effect" bursts.

### Flash Windows
- **Flash Timing 1** (post-attack declaration): Blocker (defender) acts first, then attacker, alternating until both pass consecutively.
- **Flash Timing 2** (post-block declaration): Attacker acts first, then blocker, alternating until both pass consecutively.
- **R17 Verified**: Flash turn restrictions strictly enforced (e.g. Magic cards with `Opposing Attack Step` timing are not castable on the controller's own turn).

### Heuristic AI
- Evaluates candidate units by strategic threat formula:
  $$\text{Threat} = (\text{BP} \times w_{\text{bp}}) + (\text{Cost} \times w_{\text{cost}}) + (\text{Symbols} \times w_{\text{symbols}}) + (\text{isAdvent} ? w_{\text{advent}} : 0)$$
- Never blindly selects index `[0]`; targets the highest priority boss/threat.
- Dynamically calculates blocker tradeoffs to preserve board advantage while preventing lethal damage.

### Contract Partner & Mulligan
- **R39 Verified**: Guaranteed Contract Partner card in opening hand.
- **R41 Verified**: Exactly 1 optional opening hand redraw (mulligan) supported for both human and AI.
