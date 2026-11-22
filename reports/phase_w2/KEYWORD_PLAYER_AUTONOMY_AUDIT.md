# KEYWORD PLAYER AUTONOMY AND INTERACTION AUDIT REPORT
**Project:** Battle Spirits Eternal (BSP)  
**Phase:** W.2 — Keyword Reconciliation Integrity & Runtime Verification  
**Subsystem:** Decision Routing & Player Interaction Protocol  
**Generated:** 2026-11-22T11:18:54.280Z  

---

## 1. Executive Summary & Verification Matrix

In accordance with Core Rule 5 (Asynchronous Prompts & No Timers in Rules Flow) and Core Rule 10 (Never silently choose a player decision), every keyword implementation was audited for decision autonomy, human-player authority, and fallback hazards.

| Metric | Count | Percentage | Definition |
| :--- | :---: | :---: | :--- |
| **Deterministic Rules Resolution** | **341** | **98.0%** | No player decision required by Bandai rules (continuous, mandatory counters, fixed formulas). |
| **Fully Compliant Prompts** | **2** | **0.6%** | Engine determines candidates, awaits player async selection, and validates choice without fallbacks. |
| **Autonomy Violations Identified** | **5** | **1.4%** | Handlers containing silent fallbacks (`|| [0]`) or missing player prompts. |
| **Total Keywords Audited** | **348** | **100.0%** | All 348 canonical Wiki keywords audited. |

---

## 2. The 8-Step Player Authority Invariant

The audit verified adherence to the required 8-step decision protocol:
1. **Legal Candidates Determined:** Engine queries game state to isolate valid targets.
2. **Cardinality Enforced:** Minimum and maximum selection bounds established.
3. **Optionality Declared:** Explicit `optional: true/false` passed to prompt resolver.
4. **Authorized Owner:** `chooser` explicitly assigned to player side (`player` or `opponent`).
5. **UI / Interaction Presentation:** Prompt presented to client via async Promise.
6. **Player Intent Submission:** Human player submits selected candidate IDs.
7. **Engine Validation:** Engine verifies selected IDs are subset of legal candidates.
8. **Resolution Resumed:** Ability resolves using validated player choice.

---

## 3. Specific Autonomy Defects Identified (Scheduled for Work Package I Remediation)

The audit discovered **5 specific autonomy defects** in live keyword handlers:

### 1. `Assault` (`engine/keywords/wave1.js:109`)
- **Code:** `const nexusToExhaust = choice.nexus || readyNexuses[0];`
- **Defect:** When a player confirms activation of Assault but does not supply a nexus target, the engine silently exhausts the first refreshed nexus.
- **Required Fix:** Require explicit nexus selection. If no nexus selected, abort refresh.

### 2. `Great Crush` (`engine/keywords/wave1.js:415`)
- **Code:** `const target = (selected && (selected.stack || selected)) || oppSpirits[0];`
- **Defect:** Silently destroys the first opposing spirit if prompt selection returns empty.
- **Required Fix:** Abort destruction if player makes no valid selection.

### 3. `Supreme Clash` (`engine/keywords/wave1.js:516`)
- **Code:** `const target = (selected && (selected.stack || selected)) || oppField[0];`
- **Defect:** Silently exhausts the first opposing field unit if prompt selection returns empty.
- **Required Fix:** Abort exhaust if player makes no valid selection.

### 4. `Grand Assault` (`engine/keywords/wave1.js:549`)
- **Code:** `const nexusToExhaust = selected?.nexus || selected || allNexuses[0];`
- **Defect:** Silently exhausts the first nexus if prompt selection returns empty.
- **Required Fix:** Abort refresh if no nexus selected.

### 5. `Leap` (`engine/keywords/wave4.js:565`)
- **Code:** `const target = exhaustedUnits[0];`
- **Defect:** Automatically bounces the first exhausted unit without presenting a prompt to the player.
- **Required Fix:** Issue a prompt to the player to choose which exhausted Spirit/Ultimate to return to Hand.

---

## 4. Headless & AI Simulation Compatibility

For headless unit testing and AI simulation, the prompt resolver continues to route choices through `engine/ai.js` and deterministic test harnesses. When running under human PvP mode, the asynchronous prompt pauses engine execution until player submission.

---

## 5. Work Package G Verdict

**AUDITED.** All 348 keywords have been classified. 5 specific autonomy violations were discovered and isolated for targeted remediation in Work Package I.
