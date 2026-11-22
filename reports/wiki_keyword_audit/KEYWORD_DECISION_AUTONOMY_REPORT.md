# KEYWORD DECISION AUTONOMY REPORT

## Overview
Battle Spirits Eternal requires a player-authoritative decision model. The game engine must never silently select targets, cards, modes, or branches without presenting them to the player for explicit decision or confirmation.

### Confirmed Autonomy Violations

#### 1. True-Curse Silent Candidate Fallback
- **Location**: `engine/keywords/wave1.js:58`
- **Code**:
  ```javascript
  const selected = Array.isArray(chosen) ? chosen[0] : chosen;
  const target = (selected && (selected.stack || selected)) || oppField[0];
  ```
- **Violation**: If the player declines or submits an invalid response, the engine silently falls back to `oppField[0]`, destroying an opposing unit without player consent.

#### 2. Clash Defending Player Choice Omission in Engine Flow
- **Location**: `engine/keywords/wave1.js:19` & `engine/ai.js:122`
- **Violation**: Clash forces the opponent to block. In official rules, the defending player chooses WHICH eligible Spirit blocks. In BSP, the core rules engine does not pause or request a block choice; only the AI heuristic simulates blocking.

#### 3. Waves 2-6 Zero-Interaction Execution
- **Location**: `engine/keywords/wave2.js`, `wave3.js`, `wave4.js`, `wave5.js`, `wave6.js`
- **Violation**: Zero occurrences of `resolver.promptResolver.choose` or structured interaction requests exist across Waves 2 through 6. All selections either default to index `[0]` or execute deterministically without player confirmation.

| Keyword | Location | Choice Type | Autonomy Status | Defect Description |
|---|---|---|---|---|
| True-Curse | wave1.js:58 | Target Destruction | VIOLATION | Silent fallback to oppField[0] |
| Clash | wave1.js:19 | Mandatory Blocker Selection | UNENFORCED | Defending player block choice omitted in flow |
| Waves 2-6 | wave2-6.js | General Targeting | UNIMPLEMENTED | No prompt controller integration |
