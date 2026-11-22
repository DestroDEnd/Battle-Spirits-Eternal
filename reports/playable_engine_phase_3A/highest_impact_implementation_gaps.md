# Highest-Impact Implementation Gaps Report

**Project:** Battle Spirits Eternal (BSP)  
**Phase:** Phase 3A  
**Date:** 2026-11-21  

---

## 1. Top 20 Implementation Gaps by Clause Frequency

Elevating these 20 high-frequency variants with dedicated before/after state assertion test cases yields the highest return in verified card coverage:

| Rank | Opcode :: Variant | Affected Clauses | Current Status | Impact Domain |
|---|---|---|---|---|
| **#1** | `MOVE_CORE::default` | **6746** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#2** | `BOUNCE::default` | **3144** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#3** | `KEYWORD_RULE::default` | **1674** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#4** | `TREAT_RULE::default` | **1170** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#5** | `REVEAL_DECKTOP::default` | **1146** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#6** | `ADD_TO_HAND::default` | **981** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#7** | `ADVENT_STACK::default` | **908** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#8** | `DISCARD_HAND::default` | **859** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#9** | `IMMUNITY::default` | **858** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#10** | `SUMMON_FREE::default` | **835** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#11** | `ADD_SYMBOL::default` | **787** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#12** | `SUMMON_THIS_CARD::default` | **746** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#13** | `COMBAT_RESTRICTION::default` | **657** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#14** | `ADD_COUNTER::default` | **625** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#15** | `MILL_DECK::default` | **582** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#16** | `GRANT_FAMILY::default` | **573** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#17** | `CONTINUOUS_RULE::default` | **506** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#18** | `DEPLOY_NEXUS::default` | **463** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#19** | `DISCARD_REVEALED::default` | **456** | `HANDLER_PRESENT` | High-frequency card gameplay |
| **#20** | `UNBLOCKABLE::default` | **424** | `HANDLER_PRESENT` | High-frequency card gameplay |
