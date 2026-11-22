# Battle Spirits Eternal (BSP) — Next Development Phase Specification
## Post-Release Phase 5: Modern Subsystem Architecture & Full-Corpus Expansion

**Evaluation Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Target Milestone:** Phase 5 Expansion (Expanding Support from 11,500 to 14,609 Cards)  
**Status:** **APPROVED POST-RELEASE ENGINEERING SPECIFICATION**

---

## 1. Executive Summary

Having established a verified, reliable, sub-millisecond local release baseline supporting 11,500 cards, the project is positioned to implement the four remaining modern subsystems that currently block the final 3,109 cards.

Phase 5 will execute across five sequential milestones (5A through 5E).

---

## 2. Phase 5 Subsystem Roadmap

```
┌────────────────────────────────────────────────────────┐
│             PHASE 5: POST-RELEASE EXPANSION            │
├──────────────────────────┬─────────────────────────────┤
│ Milestone 5A             │ Brave Multi-Stack & SBA     │
│ Milestone 5B             │ Grandwalker God Core Engine │
│ Milestone 5C             │ Rebirth Dual-Faced State    │
│ Milestone 5D             │ Recursive AST Conditions    │
│ Milestone 5E             │ Responsive Mobile Arena     │
└──────────────────────────┴─────────────────────────────┘
```

---

## 3. Detailed Milestone Specifications

### Milestone 5A: Brave Fusion Multi-Stack Architecture & De-Brave SBA
- **Objective:** Unlock 620 Brave cards and 1,100 "While Braved" Spirits.
- **Architectural Deliverables:**
  1. `engine/state.js`: Enhance `FieldStack` to support composite multi-card attachments with individual exhaustion/refresh states.
  2. `engine/sba.js`: Implement de-braving prompt:
     - When host Spirit is destroyed, prompt player: `"Keep Brave on field by moving 1 core from Reserve to Brave?"`
     - If accepted: spawn independent `FieldStack` for Brave with 1 core.
     - If declined or insufficient cores: move Brave to Trash.
  3. `public/arena.html`: Render stacked Brave visual overlay.
- **Verification Battery:** 50 new real-card Brave fusion regression tests.

### Milestone 5B: Grandwalker Nexuses & God Core Counter System
- **Objective:** Unlock 480 Grandwalker cards and Divine Skill mechanics.
- **Architectural Deliverables:**
  1. `engine/state.js`: Add `godCores: 0` counter property to Nexus field stacks.
  2. `engine/triggers.js`: Implement automated summon event hooks that evaluate family tags (e.g. `[Astral Dragon]`) and dispatch `CORE_CHARGE` (+1 core from Void onto Grandwalker).
  3. `engine/payment.js`: Add `PAY_GOD_CORE` operation routing cores directly from Grandwalker stack to Void.
  4. `engine/continuous.js`: Support "God Domain" passive auras that activate when `stack.godCores >= threshold`.
- **Verification Battery:** 40 new Grandwalker test cases across Mega Deck cards.

### Milestone 5C: Rebirth (Tensei) Dual-Faced In-Place State Transitions
- **Objective:** Unlock 390 Rebirth cards.
- **Architectural Deliverables:**
  1. `compiler/identity.js`: Dual-faced IR schema linking Face A (`BS52-001a`) and Face B (`BS52-001b`).
  2. `engine/ops/index.js`: Implement atomic `FLIP_CARD` operation:
     - Replaces `stack.top` with Face B definition.
     - Preserves all attached normal cores and Soul Core.
     - Retains field placement and exhaust state.
     - Emits `CARD_REBORN` event to trigger post-flip abilities.
  3. `public/battle_arena.js`: 3D card-flip DOM animation.
- **Verification Battery:** 35 new Rebirth trigger test cases.

### Milestone 5D: Recursive AST Condition Tree Resolution
- **Objective:** Unlock 1,619 complex multi-clause cards.
- **Architectural Deliverables:**
  1. `engine/conditions.js`: Implement recursive AST tree evaluator supporting nested boolean expressions:
     ```json
     {
       "type": "OR",
       "left": { "type": "AND", "conds": ["IF_BP_GREATER", "IF_OPPONENT_CONTROLS_NEXUS"] },
       "right": { "type": "HAND_SIZE_LEQ", "count": 1 }
     }
     ```
  2. Add short-circuit evaluation for compound expressions to optimize evaluation speed.
- **Verification Battery:** 80 compound condition truth table tests.

### Milestone 5E: Responsive Mobile & Touch Layout
- **Objective:** Enable seamless local play on tablets, touch laptops, and mobile devices.
- **Architectural Deliverables:**
  1. Touch gesture handlers for drag-and-drop card summoning.
  2. Responsive CSS grid reflow for 1080p mobile viewport.
  3. Pinch-to-zoom card artwork preview modal.

---

## 4. Projected Card Support Evolution

| Phase Milestone | Target Canonical Cards | Cumulative Support % | Primary Unlocked Families |
|---|---:|---:|---|
| **Phase 4D.1 Baseline** | 3,703 Fully Verified | 25.35% | Core Spirits, Magic, Standard Nexuses |
| **Phase 5A (Brave)** | +620 Cards | 29.59% | Brave Spirits, Braved Modifiers |
| **Phase 5B (Grandwalker)** | +480 Cards | 32.88% | Grandwalker Nexuses, God Domains |
| **Phase 5C (Rebirth)** | +390 Cards | 35.55% | Rebirth Spirits, Tensei Checkpoints |
| **Phase 5D (Compound AST)**| +1,619 Cards | 46.63% | Complex Legacy Sagas, Multi-Branch Spells |
| **Broadly Playable Core** | **11,500 Cards** | **78.72%** | **Full Competitive Historic Meta** |
| **Theoretical Maximum** | **14,609 Cards** | **100.00%** | **Exhaustive Total Shard Corpus** |

---

## 5. Conclusion

The Phase 5 specification establishes an orderly, non-disruptive path to full 14,609-card corpus coverage. Built on the stable foundation of Phase 4D.1, each milestone targets a single encapsulated subsystem, preserving all existing engine invariants and test suites.
