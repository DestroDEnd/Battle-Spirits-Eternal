# Implementation Roadmap & Strategic Milestone Plan (Phase 4D.1 — Work Package E)

**Generated At:** 2026-11-21  
**Target:** Elevate Battle Spirits Eternal card support from 25.35% (3,703 cards) to >80.00% (>11,680 cards) across 5 sequential engineering milestones.  
**Governing Standard:** AGENTS.md Rule 1 (Never Key on Card Name) & Rule 2 (Test-First Methodology).  

---

## 1. Roadmap Architecture & Execution Strategy

Rather than implementing cards individually, development executes through **Shared Mechanic Clusters** (E1–E8) identified in the dependency graph. Each milestone delivers generic primitives in `engine/ops/` and `engine/continuous.js`, unlocking hundreds of cards simultaneously while maintaining strict format invariants.

```
       [M1: Core Primitives & Hand/Deck Flow]
                       │
                       ▼
       [M2: Continuous Modifiers & Rules]
                       │
                       ▼
       [M3: Keyword Rule Engine Expansion]
                       │
                       ▼
       [M4: Brave & Mirage Zone Subsystems]
                       │
                       ▼
    [M5: Grandwalker, Contract & Rebirth Cards]
```

---

## 2. Milestone Breakdown & Card Support Projections

### Milestone 1: High-ROI Primitive Operations (M1)
- **Target Mechanics:** `E8` (Deck & Hand) + `E5` (Interaction Primitives)
- **Opcodes to Implement:**
  - `SALVAGE`: Generic graveyard-to-hand card recovery with type, cost, and family filters.
  - `ADD_TO_HAND`: Direct card routing from revealed, deck, or open zones to player hand.
  - `MILL_DECK`: Top-of-deck graveyard discard with event triggers.
  - `OPEN_ZONE`: Dedicated staging zone for revealed cards during deck searches.
  - `DISCARD_HAND`: Prompt-driven or rule-driven hand discarding.
- **Projected Impact:**
  - **Cards Fully Unlocked:** +625 cards
  - **Cards Partially Unlocked:** +2,150 cards
  - **New Cumulative Fully Supported Cards:** 4,328 cards (29.62%)
- **Verification Suite:** `tests/m1_primitives_e2e.test.js`

---

### Milestone 2: Continuous Rules, Families & Dynamic Cost Modifiers (M2)
- **Target Mechanics:** `E2` (Continuous Effects) + `E5` (Targeting Rules)
- **Opcodes to Implement:**
  - `COST_MODIFIER`: Dynamic cost reduction evaluated during payment planning (`engine/payment.js`).
  - `CONTINUOUS_RULE` & `TREAT_RULE`: General continuous rule evaluator supporting symbol substitution, level modification, and color treating.
  - `GRANT_FAMILY`: Dynamic addition of families to active field stacks.
  - `ADD_COUNTER`: Core-like counters placed on nexuses or spirits for threshold triggers.
  - `DAMAGE_CAP`: Combat damage ceiling prevention rules.
- **Projected Impact:**
  - **Cards Fully Unlocked:** +1,245 cards
  - **Cards Partially Unlocked:** +2,820 cards
  - **New Cumulative Fully Supported Cards:** 5,573 cards (38.15%)
- **Verification Suite:** `tests/m2_continuous_rules.test.js`

---

### Milestone 3: Keyword Rule Engine Expansion (M3)
- **Target Mechanics:** `E7` (Keyword Delegation)
- **Keywords & Opcodes to Implement:**
  - `KEYWORD_RULE` & `KEYWORD_ACTION`: Clean delegation to structured keyword resolvers.
  - `Curse` (`呪撃`): Mutual destruction of opposing blocking spirits.
  - `Confront` (`指定アタック`): Forced block declaration on target opposing spirit.
  - `Tribute` (`献身`): Sacrificing friendly units to reduce cost or trigger death rattles.
  - `Awakening` (`覚醒`): Core movement from other spirits during flash timing.
  - `Immortal` (`不死`): Self-resurrection from trash when specified cost spirit is destroyed.
- **Projected Impact:**
  - **Cards Fully Unlocked:** +786 cards
  - **Cards Partially Unlocked:** +1,420 cards
  - **New Cumulative Fully Supported Cards:** 6,359 cards (43.53%)
- **Verification Suite:** `tests/m3_keywords_battery.test.js`

---

### Milestone 4: Brave Fusion & Mirage Zone Subsystems (M4)
- **Target Mechanics:** `E6` (Special Card Types — Part 1)
- **Capabilities to Implement:**
  - `BRAVE_FUSION` & `SEPARATE_BRAVE`: Dual-card stack management where Brave attaches to Spirit, pooling BP, symbols, and abilities, or detaches with 1 core upon destruction.
  - `SET_MIRAGE` & `ACTIVATE_MIRAGE`: Mirage zone placement in the Magic/Burst area, cost payment, and passive/triggered continuous rule broadcasting.
  - `PERFORM_ADVENT` & `ADVENT_STACK`: Placing Advent cards over qualifying base spirits, retaining underlying cards in `stack.under`.
- **Projected Impact:**
  - **Cards Fully Unlocked:** +1,520 cards
  - **Cards Partially Unlocked:** +1,850 cards
  - **New Cumulative Fully Supported Cards:** 7,879 cards (53.93%)
- **Verification Suite:** `tests/m4_brave_mirage_advent.test.js`

---

### Milestone 5: Grandwalker Nexuses, Contract Partner & Rebirth Systems (M5)
- **Target Mechanics:** `E6` (Special Card Types — Part 2)
- **Capabilities to Implement:**
  - `GRANDWALKER_ACTION` & `DIVINE_SKILL`: Grandwalker Nexuses immune to spirit effects, gathering God Cores from deck reveals, and spending God Cores for Divine Skills.
  - `CONTRACT_PARTNER` & `SOUL_STATE`: Contract partner deployment, Soul State preservation on destruction, and Count value tracking.
  - `REBIRTH_FLIP` & `REBIRTH_ACTION`: Reversible two-sided cards flipping upon condition fulfillment.
- **Projected Impact:**
  - **Cards Fully Unlocked:** +1,815 cards
  - **Cards Partially Unlocked:** +1,200 cards
  - **New Cumulative Fully Supported Cards:** 9,694 cards (66.36%)
- **Verification Suite:** `tests/m5_grandwalker_contract.test.js`

---

## 3. Post-Milestone Maintenance & 80%+ Target Path

Following Milestone 5, the residual cards are evaluated by color and set. Standard set-level regression passes will resolve remaining minor variant gaps, bringing total fully supported cards beyond **11,687 cards (>80.00%)**.

| Milestone | Total Fully Supported | Share of Corpus (%) | Primary Beneficiary Archetypes |
|---|---:|---:|---|
| **Baseline (Phase 4D.1)** | **3,703** (incl. Vanilla) | **25.35%** | Basic Beatdown, Simple Removal, Vanilla Cards |
| **Milestone 1** | 4,328 | 29.62% | Mill Decks, Hand Discard, Deck Search Magic |
| **Milestone 2** | 5,573 | 38.15% | Cost Reduction Control, Color/Family Synergies |
| **Milestone 3** | 6,359 | 43.53% | Curse/Confront Aggro, Immortal Purple Control |
| **Milestone 4** | 7,879 | 53.93% | Brave Era Decks, Mirage Magic, Advent Spirits |
| **Milestone 5** | 9,694 | 66.36% | Grandwalker God Decks, Contract Era Decks |
| **Long-Term Target** | **>11,687** | **>80.00%** | Comprehensive Eternal Format Coverage |

---

## 4. Deliverable References

- **Implementation Priority Backlog:** [implementation_priority_backlog.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/implementation_priority_backlog.json)
- **Shared Mechanic Dependency Graph:** [shared_mechanic_dependency_graph.json](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/shared_mechanic_dependency_graph.json)
- **Card Support Gap Analysis:** [support_gap_analysis.md](file:///c:/Users/namis/Downloads/BSP/reports/phase4d_1/support_gap_analysis.md)
