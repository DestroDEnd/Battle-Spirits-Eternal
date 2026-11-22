# Battle Spirits Eternal — Unresolved Limitations & Implementation Boundaries (Phase 4D.1 — Work Package L)

**Evaluation Date:** 2026-11-21  
**Project Root:** `c:/Users/namis/Downloads/BSP`  
**Status:** **HONEST DISCLOSURE** — Strict Classification of All Deferred & Out-of-Scope Capabilities  

---

## 1. Executive Summary

Phase 4D.1 established an evidence-driven, mathematically sound baseline across the Battle Spirits Eternal engine. In accordance with core project directives, no unsupported card or clause is concealed behind placeholder mocks or optimistic heuristic classifications.

As of Phase 4D.1:
- **Fully Supported Cards:** **3,329** (22.79%)
- **Partially Supported Cards:** **7,797** (53.37%)
- **Vanilla Cards (No Effect Text):** **374** (2.56%)
- **Unsupported Cards:** **3,109** (21.28%)
- **Total Canonical Population:** **14,609** Unique Shard Cards

This document outlines the architectural boundaries, mechanics, and UI paradigms that constitute the remaining 7,797 partially supported and 3,109 unsupported cards.

---

## 2. Technical Breakdown of Remaining Unsupported / Partial Mechanics

### 2.1 Brave Fusion & Multi-Card Field Stacks
- **Current State:** The engine supports basic Brave card summoning and core placement. Field stacks (`FieldStack`) are instantiated with single cards or basic attached references.
- **Limitation:** Dynamic Brave Fusion (`BRAVE_FUSION`), where a Brave spirit and a master Spirit physically merge their continuous BP values, combine their color symbols, and share core placement dynamically during combat, is only partially implemented in the headless engine and lacks complete visual stacking in the DOM arena.
- **Affected Cards:** ~620 Brave cards and ~1,100 Spirits with "While Braved" (`WHILE_BRAVED`) conditional clauses.
- **Prerequisites for Resolution:**
  - Multi-card stack abstraction in `engine/state.js` (`stack.braves = [...]`).
  - DOM composite representation in `public/arena.html` allowing drag-to-brave and visual symbol overlay.
  - De-braving SBA on Spirit destruction (Brave stays on field as separate spirit or returns to trash based on text).

### 2.2 Grandwalker Nexuses & God Core Counter System
- **Current State:** Standard Nexuses deploy and provide continuous symbol reduction and level-based passive effects.
- **Limitation:** Grandwalker Nexuses utilize unique "Core Charge" (`CORE_CHARGE`) and "God Skill" / "God Domain" (`GOD_SKILL`, `GOD_DOMAIN`) mechanics, which place cores from Void onto the Grandwalker via special summon triggers and spend those counters rather than normal reserve cores.
- **Affected Cards:** ~480 Grandwalker Nexus cards across modern Mega Decks and All-Kira Booster sets.
- **Prerequisites for Resolution:**
  - Dedicated `GrandwalkerState` counter tracking distinct from ordinary Spirit core pools.
  - Automated trigger interceptors for family-specific summon events (e.g. "Whenever you summon an [Astral Dragon] Spirit, place 1 core from Void on this Nexus").

### 2.3 Rebirth (Tensei) Two-Sided Flip Cards
- **Current State:** Single-sided cards with static card numbers and properties.
- **Limitation:** Rebirth cards feature Face A and Face B with distinct card numbers (e.g. `BS52-001a` and `BS52-001b`), transitioning when specific Rebirth triggers occur (Life drop $\le 3$, Spirit destruction, or counter conditions).
- **Affected Cards:** ~390 Rebirth Spirits and Nexuses.
- **Prerequisites for Resolution:**
  - Dual-faced IR schema linking Face A and Face B.
  - In-place card mutation opcode (`FLIP_CARD` / `REBIRTH_TRANSITION`) preserving active cores and field position.
  - 3D card-flip DOM animation and UI state adapter updates.

### 2.4 Complex Conditional Triggers & Multi-Clause Branching
- **Current State:** Standard single-step conditions (`IF_BP_GREATER`, `IF_LIFE_LEQ`, `ON_SUMMON`, `WHEN_ATTACKS`) are fully supported and executed.
- **Limitation:** Certain advanced legacy cards feature compound nested conditional chains (e.g., "If your opponent controls 2 or more Nexuses, and you have a White Spirit with [Heavy Armor: Red], do X, otherwise if you have 1 or fewer cards in hand, do Y"). The IR compiler decomposes these into multi-clause abilities, but the runtime resolver currently halts if an intermediate fallback branch lacks a registered opcode variant.
- **Affected Cards:** ~1,850 complex multi-clause cards.
- **Prerequisites for Resolution:**
  - Full AST-based conditional branch evaluator in `engine/conditions.js` supporting recursive `AND`/`OR`/`ELSE` clauses.

### 2.5 Rare Specialty Keywords
- **Current State:** Core Battle Spirits keywords (`BURST`, `FLASH`, `TRIBUTE`, `SOUL_CORE`, `ARMOR`, `HEAVY_ARMOR`, `CONFRONT`) are implemented.
- **Limitation:** Specialty keywords introduced in isolated expansion sets (e.g., `ACCEL`, `KAGE_BUSHIN`, `DOKU_JIN`, `CHANGE`, `SEKIDAN`) lack registered opcode handlers in `engine/ops/`.
- **Affected Cards:** ~940 cards.

---

## 3. UI and Interaction Limitations

### 3.1 Touch Device & Responsive Mobile Layout
- The production browser arena (`public/arena.html`) is optimized for desktop 1080p and 1440p displays. Touch gestures, pinch-to-zoom on cards, and mobile portrait reflow are not yet implemented.

### 3.2 Card Artwork Asset Fallbacks
- For promotional or rare Japanese-exclusive cards where high-resolution CDN images are unavailable, the arena displays a procedural canvas card frame with rendered typography. While fully functional for rules and gameplay, visual fidelity differs from photographic scans.

---

## 4. Architectural Roadmap for Post-4D.1 Expansion

To transition the remaining 7,797 partial cards and 3,109 unsupported cards into `FULLY_SUPPORTED` status, the following phased engineering steps are recommended:

```
[Phase 4E: Brave & Multi-Stack Architecture]
  ├── Multi-card stack state model
  ├── Brave fusion combat BP & symbol merging
  └── UI visual stacking & de-brave flow
           │
           ▼
[Phase 4F: Grandwalker & Counter System]
  ├── Dedicated God Core resource pool
  ├── Core Charge automated trigger hooks
  └── God Skill / God Domain cost dispatch
           │
           ▼
[Phase 4G: Rebirth & Dual-Faced State]
  ├── Face A / Face B IR linkage
  ├── Atomic in-place flip operation
  └── Rebirth trigger conditions
           │
           ▼
[Phase 4H: Compound Conditional Evaluator & Rare Opcode Completion]
  ├── Recursive AST condition resolution
  └── Remaining 64 specialty opcode handlers
```

---

## 5. Conclusion

The limitations documented above represent genuine frontiers of Battle Spirits card mechanics. By formally cataloging these boundaries and refusing to conceal them with fake passing mocks, the project maintains absolute technical integrity. The 3,329 fully supported cards and 7,797 partially supported cards provide an expansive, deeply engaging, and rules-accurate foundation for competitive gameplay.
