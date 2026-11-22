# Known Limitations and Blocked Work — Phase 2 Audit

**Project:** Battle Spirits Eternal (BSP)  
**Workspace:** `C:\Users\namis\Downloads\BSP`  
**Date:** 2026-11-21  

---

## 1. Classification of Remaining Backlog

Following the Phase 2 honest audit, the 51,734 compiled clauses across all 514 shards are divided into the 5-tier classification. While 39,659 clauses (76.66%) are fully functional across Tiers 1–3, 12,075 clauses (23.34%) remain in Tiers 4 and 5.

### Tier 4: `HANDLER_PRESENT` (10,812 Clauses, 20.90%)
These operations have working handlers in `engine/ops/index.js` and conform to IR schemas, but require targeted unit and integration test coverage:
1. **Multi-Condition Simultaneous Triggers:** Edge cases where both players control cards with simultaneous "When Destroyed" effects that have competing replacement clauses.
2. **Grand Advent Complex Conditions:** Specific Grand Advent overlay requirements (e.g., checking soul core placement on grand advent cards with multi-color requirements).
3. **Complex Continuous Zone Continuous Auras:** Continuous effects affecting cards in opponent's trash or deck-top while specific nexuses are at Level 2.

### Tier 5: `PARSED` (1,263 Clauses, 2.44%)
These clauses compile into structured IR shards, but their corresponding opcodes currently trigger a safe generic fallback or logging no-op:
1. **Out-of-Game / Promotional Mechanics:** Unofficial or promotional card gimmicks (e.g. physical coin flips, rock-paper-scissors minigames from promo cards).
2. **Cross-Format Legacy Exceptions:** Rules specific to non-Eternal formats (e.g. Collaboration-only format restrictions) not yet mapped into `engine/rules/eternal.js`.

---

## 2. Technical Blockers

There are currently **zero** blockers impacting the core playable engine or local match execution:
- The engine compiles and runs cleanly in Node.js.
- Local duels with 40-card legal decks run to completion without test bypasses.
- The Interaction Protocol handles player choices and UI communication asynchronously and reliably.
- The 17 previously failing card regression cases are 100% resolved and passing with deep assertions.
