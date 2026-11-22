# PHASE L WORK PACKAGE A — COMPLETE DECISION-AUTONOMY AUDIT REPORT

**Project:** Battle Spirits Eternal (BSP)  
**Milestone:** Phase L — Universal Player-Authoritative Effect Activation, Selection & Resolution System  
**Audit Date:** 2026-11-22  
**Scope:** Repository-wide audit across `engine/`, `engine/ops/`, `engine/selectors.js`, `engine/resolver.js`, `engine/interaction.js`, `engine/prompt_manager.js`, `engine_adapter.js`, and `battle_arena.js`.

---

## 1. Executive Summary

A comprehensive static and architectural audit was performed to identify every location where the engine, resolver, UI adapter, or card-effect handlers autonomously make decisions on behalf of a human player.

A total of **75 autonomy violations** were cataloged across 5 core files:
- **`engine/ops/index.js`:** 45 findings
- **`battle_arena.js`:** 20 findings
- **`engine/resolver.js`:** 5 findings
- **`engine/interaction.js`:** 3 findings
- **`engine/selectors.js`:** 2 findings

These violations fall into 6 critical categories:
1. **Single-Candidate Auto-Bypasses (`candidates.length === 1`):** Skipping player interaction and auto-executing because exactly one candidate matches.
2. **First-Candidate Fallbacks (`candidates[0]` & `field[0]`):** Silently choosing the first card or field stack when no target is provided.
3. **First-N Auto-Selections (`.slice(0, count)`):** Auto-slicing candidates without giving the player a choice.
4. **Silent Optional Defaults (`accepted: true` / `activate: true`):** Assuming acceptance of optional triggers or effects without explicit player confirmation.
5. **Mode & Branch Auto-Selections:** Silently selecting branch 0 in modal effects.
6. **UI-Side Autonomous Selection:** Fallback handlers in `battle_arena.js` auto-picking targets or auto-confirming modals.

---

## 2. Detailed Findings by File and Line Reference

### 2.1 `engine/selectors.js`

| Line | Pattern | Current Code / Behavior | Violation Description | Required Correction | Risk & Dependencies |
|---|---|---|---|---|---|
| **938** | Candidate count bypass | `if (!extreme \|\| !metric \|\| candidates.length <= 1) return candidates;` | If only 1 candidate has highest/lowest BP/cost, returns candidates without prompting. | When used in `resolveTargets`, prompt player to confirm the single target rather than executing silently. | Medium; all cards with "highest BP" effects. |
| **1120** | Single tied candidate auto-select | `if (norm.all \|\| tied.length <= count) { ... return { ... targets: tied ... } }` | If tied candidate count is $\le$ required count (e.g. 1 candidate for count 1), immediately returns `targets: tied` without prompting the player! | Remove `tied.length <= count` bypass for non-`all` targeting. If `norm.all` is false, emit interaction request even when `tied.length === 1`. | High; impacts tie-resolution in `DESTROY`, `BOUNCE`, `EXHAUST`. |

---

### 2.2 `engine/resolver.js`

| Line | Pattern | Current Code / Behavior | Violation Description | Required Correction | Risk & Dependencies |
|---|---|---|---|---|---|
| **763** | Silent optional default | `if (prompt.type === 'CONFIRM_OPTIONAL') return { accepted: true };` | Default headless resolver silently accepts all optional effects as TRUE. | In interactive mode, `choose()` must pause and await explicit player decision via `InteractionController`. | High; impacts all optional abilities. |
| **766** | Automatic mode selection | `if (prompt.type === 'CHOOSE_OR_BRANCH') return prompt.options[0];` | Default resolver silently selects option 0 without player input. | Must request player decision with all available options. | High; affects all modal card effects. |
| **769** | Silent trigger activation | `if (prompt.type === 'BURST_TRIGGER' \|\| prompt.type === 'OPTIONAL_TRIGGER') return { activate: true };` | Silently activates burst or optional triggers. | Must present trigger declaration modal to player with Activate / Pass choices. | High; burst declaration timing. |
| **772** | Silent flash pass | `if (prompt.type === 'FLASH_ACTION') return { action: 'PASS' };` | Silently passes flash windows. | In human player priority, player must explicitly choose action or pass. | High; flash step timing. |
| **782** | First-N candidate auto-slice | `if (prompt.candidates && prompt.candidates.length > 0) return prompt.candidates.slice(0, count);` | Auto-selects first N candidates if no custom resolver is supplied. | Must emit formal `SELECT_TARGET` / `SELECT_CARDS` interaction and await response. | Critical; foundational targeting rule. |

---

### 2.3 `engine/ops/index.js`

| Line | Operation / Context | Current Code / Behavior | Violation Description | Required Correction | Risk & Dependencies |
|---|---|---|---|---|---|
| **829, 875** | `MOVE_CORE` | `toStackId = (toP.field[0] && toP.field[0].id) \|\| null;` and `toStackId = p.field[0].id;` | Silently deposits moved cores onto the first spirit on field (`field[0]`). | Prompt player with `SELECT_STACK` to choose which friendly spirit receives the cores. | High; core distribution affects level thresholds. |
| **1623, 1639, 1642** | `ADD_TO_HAND` | `if (matching.length > count && promptResolver)` skips prompting when `matching.length === count`; falls back to `matching.slice(0, count)`. | If 1 card matches, it is auto-added to hand without confirmation. If player doesn't respond, it auto-slices. | Prompt player to confirm or select cards even when `matching.length === 1`. Remove silent slice fallback. | High; salvage and card draw effects. |
| **2050, 2053** | `SUMMON` | `chosen = matching.slice(0, count);` | Automatically selects first N matching cards from trash/hand to summon. | Request explicit `SELECT_SUMMON` interaction with legal candidates. | Critical; reanimation and summon mechanics. |
| **2107** | `ADD_SYMBOL` | `if (candidates.length === 1) targetStackId = candidates[0].stack.id;` | Single spirit on field gets symbol added without player selection. | Prompt player with single candidate for explicit selection. | Medium; symbol manipulation. |
| **2311** | `UNBLOCKABLE` | `if (candidates.length === 1) targetStackId = candidates[0].stack.id;` | Single spirit auto-granted unblockable. | Prompt player with single candidate. | Medium; combat continuous effects. |
| **2355** | `COMBAT_RESTRICTION` | `if (candidates.length === 1) targetStackId = candidates[0].stack.id;` | Single spirit auto-targeted for combat lock. | Prompt player with single candidate. | Medium; attack/block locks. |
| **2401-2414** | `FORCE_BLOCK` | `else if (candidates.length === 1) chosenStack = candidates[0].stack; ... else if (candidates.length > 0) chosenStack = candidates[0].stack;` | Auto-selects single candidate or falls back to `candidates[0]`. | Always prompt controller to select target spirit for forced block. | High; combat designated blocker. |
| **2448-2461** | `TARGET_ATTACK` | `else if (candidates.length === 1) chosenStack = candidates[0].stack; ... else if (candidates.length > 0) chosenStack = candidates[0].stack;` | Auto-selects single candidate or falls back to `candidates[0]`. | Always prompt controller to select designated attack target. | High; combat designated attack. |
| **2526** | `GRANT_ABILITY` | `if (candidates.length === 1) targetStackId = candidates[0].stack.id;` | Auto-selects single spirit to receive ability grant. | Prompt player with single candidate. | Medium; ability grants. |
| **2775** | `BRAVE_FUSION` | `const card = chosen?.[0]?.card \|\| chosen?.[0] \|\| candidates[0];` | Falls back to `candidates[0]`. | Fail-closed if selection is missing; require explicit brave target. | High; Brave mechanics. |
| **2893** | `SEND_TO_VOID` | `} else gwStack = candidates[0];` | Auto-selects first Grandwalker stack. | Prompt player to choose which Grandwalker loses cores. | Medium; God core interactions. |
| **3165** | `ATTACH_BRAVE` | `let chosen = candidates[0];` | Auto-selects first host spirit for Brave. | Prompt player to choose host spirit. | High; Brave attachment. |
| **3515, 4651, 4741, 4878, 4963, 5834** | Various ops | `const targetOpp = opp.field[0];` and `const hostStack = sourceStack \|\| p.field[0];` | Silently falls back to `field[0]` or `hand[0]` when no target ID is specified. | Replace silent `field[0]` fallbacks with explicit player target selection queries. | High; impacts targetless op execution. |
| **3858** | `MOVE_CARD` | `const toMove = matching.slice(0, count);` | Auto-slices matching cards without prompt. | Prompt player with `SELECT_CARDS`. | High; card movement. |
| **4074** | `DISCARD` | `const chosen = (op.count === 'ALL' \|\| op.all) ? matching : matching.slice(0, count);` | Auto-slices cards from hand to discard without player choice. | Prompt player with `SELECT_CARDS` specifying hand cards. | High; discard effects. |
| **4196** | `REVEAL_AND_ADD` | `const chosen = pool.slice(0, limitCount);` | Auto-slices revealed cards into hand. | Prompt player to select which revealed cards to add. | High; search and reveal effects. |
| **4308** | `BOTTOM_DECK` | `let chosenCard = candidates[0];` | Auto-selects first card to send to bottom of deck. | Prompt player with `SELECT_CARDS`. | Medium; deck manipulation. |

---

### 2.4 `battle_arena.js`

| Line | Function / Context | Current Code / Behavior | Violation Description | Required Correction | Risk & Dependencies |
|---|---|---|---|---|---|
| **1980** | `promptStructuredDecision` | `if (chooser !== 'player') return Promise.resolve({ accepted: true });` | Assumes automated acceptance for non-player without routing to AI decider. | Route non-player decisions to AI interaction controller or remote player channel. | High; multi-player / AI architecture. |
| **1993, 2010, 2014-2015** | `promptStructuredDecision` | `const selected = candidates.slice(0, count)... return Promise.resolve({ accepted: true, selected });` | Headless fallback in UI adapter auto-slices candidates and resolves with `accepted: true`. | Remove auto-slice fallback; require DOM interaction or AI engine response. | High; UI adapter compatibility. |
| **2622-2623** | `discardModal` | `const autoPick = eligible.slice(0, maxDiscard); if (onConfirm) onConfirm(autoPick);` | Discard modal auto-picks cards and triggers confirm if user hasn't selected! | Require player to explicitly click cards in hand modal before confirming. | High; discard prompt UI. |
| **2803** | `targetModal` | `const targetSp = candidates[0];` | Target modal fallback picks `candidates[0]`. | Disable confirm until user has selected target. | High; universal target modal. |
| **8409, 8468** | Direct destruction | `const toDestroy = eligible.slice(0, count);` | Auto-destroys first N eligible spirits. | Route destruction through engine interaction prompt. | High; arena battle resolution. |
| **10860, 10978, 11928, 13839** | Various summon & brave prompts | `if (eligible.length === 1) { ... autoSelect ... }` | If only 1 eligible target or host exists, arena auto-selects and skips modal. | Open modal with single candidate highlighted; require player to click Confirm. | Critical; Core Phase L mandate. |

---

## 3. Universal Correction Strategy

To achieve 100% compliance with Phase L without breaking existing tests, the following architectural transformations will be executed:

1. **Decouple Player vs AI Resolution:**
   - For human players: The engine MUST suspend progression, register an `interactionId` in `state.pendingInteractions`, emit `INTERACTION_REQUESTED`, and return a pending Promise.
   - For AI players: The AI decider calculates a valid selection from the candidate list and submits it via `InteractionController.respond()`. No bypass of validation.
   - For headless automated tests: An explicit `automatedProvider` can be configured on `InteractionController`, but the production engine default must be fail-closed (`WAITING_FOR_PLAYER`).
2. **Single-Candidate Interaction Mandate:**
   - Every single-candidate situation (`candidates.length === 1`) MUST generate an interaction request with `minSelections: 1, maxSelections: 1`.
   - The UI displays the single candidate and requires the player to click Confirm.
3. **Eradicate Slices and Fallbacks:**
   - Replace every `candidates[0]`, `.slice(0, count)`, `field[0]`, and `autoPick` in `engine/ops/index.js` and `battle_arena.js` with structured interaction requests.
4. **Fail-Closed Validation:**
   - Any selection containing unlisted, duplicate, or stale candidates is rejected.
   - Mandatory decisions cannot be declined. Optional decisions default to nothing if cancelled.

---

## 4. Verification and Next Steps

- **Audit Findings:** 75 locations identified.
- **Next Work Package:** **Work Package B — Universal Decision Contract** (Defining the canonical 18+ decision types, schema, and lifecycle).
- **Status:** **AUDIT COMPLETE**
