# REMAINING GAPS AND FUTURE WORK
**Project:** Battle Spirits Eternal (BSP)  
**Phase:** W.2 — Keyword Reconciliation Integrity & Runtime Verification  
**Generated:** 2026-11-22T11:27:40.140Z  

---

## 1. Architectural & Specification Gaps

1. **Specification Resolution Boilerplate (286 Specs):**
   - While runtime implementations exist in Waves 1–6, 286 JSON specifications in `data/keyword_specs/` use the generic phrase `Mutates game state as specified by official effect text.`.
   - *Future Work:* Progressively replace this boilerplate with structured AST operation descriptors (e.g. `{ op: "MOVE_CORE", from: "VOID", to: "LIFE" }`).

2. **Format Recognition Placeholders (83 Keywords):**
   - 83 keywords are registered in `engine/keywords/registry.js` as format placeholders without dedicated event bus hooks.
   - *Future Work:* As newly designed cards in future sets introduce novel active abilities for these legacy or niche keywords, implement dedicated wave handlers.

3. **External MediaWiki Empty Stub (`Roaring Assault`):**
   - Page ID 51516 on the Fandom wiki has 0 bytes content.
   - *Future Work:* Retain card-level definitions from physical card text (*The BlueGeneral Beast-Demon Guren-Grizzly*).

---

## 2. Test Environment Dependencies

1. **Headless Browser E2E Suites:**
   - 3 test suites (`tests/real_browser_arena.test.js`, `tests/phase_l_browser_e2e.test.js`, `tests/phase_l1_browser_e2e.test.js`) attempt to spawn live browser instances or connect to localhost:3000.
   - *Future Work:* Add environment capability flags (`if (!process.env.RUN_BROWSER_TESTS) return test.skip(...)`) to prevent headless test runner timeouts.
