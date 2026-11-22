# AUDIT METHODOLOGY AND LIMITATIONS
**Phase:** W.1 Wiki Keyword Audit Correction & Validation
**Generated:** 2026-11-22T07:40:47.498Z

---

## 1. Audit Principles and Non-Negotiable Rules

Phase W.1 was executed under strict AUDIT-ONLY invariants:
1. **Zero Source Code Modifications:** Production engine, compiler, card databases, and existing test suites were completely frozen.
2. **Rejection of Presumed Truth:** The previous audit was treated solely as a discovery baseline. Every claim was independently investigated from source code, AST inspection, and runtime tests.
3. **Strict E0–E5 Test Evidence Model:** Generic string matches in test filenames or bodies were rejected. Only explicit assertions testing resulting game state were accepted as evidence.
4. **Player Decision Autonomy:** Prohibited silent fallbacks (e.g. `|| oppField[0]`) and mandated async prompt resolution for human PvP.
5. **Separation of Corpus Metrics:** Unique cards (14,443) and physical shard instances (15,398) were tracked separately.

---

## 2. Limitations

1. **Card Database Scope:** The local database contains 14,443 cards. Modern anime spinoffs and unprinted promotional keywords have 0 physical cards in the corpus.
2. **Headless Engine Coverage:** Tests executed in Node.js headless environment; visual DOM rendering was audited via unit structure rather than browser rendering.
