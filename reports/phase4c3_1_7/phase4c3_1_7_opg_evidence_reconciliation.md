# Phase 4C.3.1.7 — Once per Game (OPG) Evidentiary Reconciliation

## 1. Executive Summary & Regulatory Framework

An audit of all 65 canonical Once per Game abilities across `data/cards_detailed.json` and `data/ir_shards/*.json` was conducted to enforce total evidentiary traceability.

### 1.1. Regulatory Foundations
1. **Bandai Official Comprehensive Rules & Official Glossary**:
   - Explicitly defines `「同名ゲーム中に1回」` (Once per Game: Same Name):
     > 「そのプレイヤーがコントロールする同名のすべてのカードにおいて、ゲーム中に1回しか使用できない。」
     (Applies across all cards of that same name controlled by that player for the entire match).
   - All 18 abilities bearing `[Once per game: Same Name]` are **`OFFICIALLY_VERIFIED`**.
2. **Ordinary `[Once per game]` (47 abilities)**:
   - Bandai's rulebook does NOT specify a physical object tracking mechanism across deck shuffles or zone transitions for ordinary OPG.
   - In physical tournaments, players track whether that specific card's game-limit has been expended.
   - In software, the Eternal engine models this by attaching the restriction to the physical card instance (`card.id`).
   - This physical instance persistence model is an **`ENGINE_CONVENTION`**, NOT an explicit general section of Rule 6-1-3.
   - Every ordinary OPG entry is classified with absolute transparency.

---

## 2. Evidence Classification Breakdown (65 Abilities)

| Evidence Classification | Count | Description |
|---|---|---|
| **`OFFICIALLY_VERIFIED`** | **18** | Same Name OPG abilities directly grounded in Comprehensive Rules Sec 8-1-6 & Official Glossary. |
| **`ENGINE_CONVENTION`** | **47** | Ordinary OPG abilities tracking physical instance `card.id` across zone transitions to enforce match budgets. |
| **`UNRESOLVED`** | **0** | Zero unresolved blockers; engine conventions are explicitly defined and justified. |
| **Total OPG Abilities** | **65** | **100% of canonical OPG abilities accounted for.** |
