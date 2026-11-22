# KEYWORD UNRESOLVED RULES & BOUNDARY SPECIFICATIONS
**Project:** Battle Spirits Eternal (BSP)
**Subsystem:** Rules Engine Boundary Analysis
**Generated:** 2026-11-22T07:04:49.387Z

---

## 1. Overview

In accordance with Non-Negotiable Rule 7, when official sources or the Battle Spirits Wiki present ambiguous rulings, incomplete text, or contradictory edge cases, the system must document the boundary constraints explicitly rather than inventing ad-hoc mechanics.

---

## 2. Documented Boundary Specifications

### 2.1 Simultaneous Mutual Destruction Priority (Curse vs Curse)
- **Boundary:** When an attacking Spirit with [Curse] battles a blocking Spirit that also has [Curse], both trigger blocker/attacker destruction conditions at end of battle.
- **Official Ruling:** Simultaneous triggers resolved by turn player ordering (active player effects resolve first, then non-active player effects). Both units are sent to trash if they were not already destroyed by BP comparison.
- **Engine Implementation:** Order of `onBattleEnd` hooks adheres to active player priority.

### 2.2 Target Attack Against Untargetable / Untouchable Spirits
- **Boundary:** If a Spirit with [Infinite Blade] attempts to target-attack an opposing Spirit with "Cannot be chosen by opposing effects" (Targeting Immunity).
- **Official Ruling:** Target attack is a combat declaration, not an effect choice that targets a Spirit for removal. However, cards that state "Cannot be selected as a battle opponent" or "Cannot be attacked" are immune to target attack declarations.
- **Engine Implementation:** Candidate selector for [Infinite Blade] filters out stacks with active `CANNOT_BE_ATTACKED` restrictions.

### 2.3 Wave Crush Symbol 0 Lock vs Symbol Grant Effects
- **Boundary:** A Spirit with [Wave Crush] has its symbol fixed as 0. What happens if a Magic or Nexus effect gives "This Spirit gets +1 Red symbol"?
- **Official Ruling:** Rule phrase "fixed as zero" (固定) takes precedence over additive symbol grants (加算). The Spirit's symbol remains 0 and cannot deal life damage.
- **Engine Implementation:** `state.combat.fixedSymbolZero = true` unconditionally forces calculated damage to 0 in `resolveDirectHit`.

### 2.4 Banished Cards in Removed Zone Across Eras
- **Boundary:** Modern Battle Spirits sets use "Removed from Game" (除外) and "Banished" (ゲームから除外) interchangeably, while earlier sets had open zone / removed zone distinctions.
- **Engine Implementation:** The engine treats `player.removed` and `player.open` as accessible banished zones for XV Crush verification.
