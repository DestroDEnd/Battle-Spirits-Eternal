# Magic & M4 Regression Preservation

- **M4 Preservation:** All 13 tests across `phase_m4_targeting_zone_side_isolation.test.js` (6/6), `phase_m4_draw_and_movement.test.js` (5/5), `phase_m4_real_cards_validation.test.js` (1/1), and `phase_m4_browser_e2e.test.js` (1/1) pass with zero regressions.
- **Magic Preservation:** All 16 tests across `magic_legality_and_resolution.test.js` (9/9, including `MAGIC-M01` real Chrome CDP) and `magic_summon_and_prompt_integrity.test.js` (7/7) pass.
- **Honest Corpus Coverage (`reports/magic_correction/MAGIC_EFFECT_COVERAGE_MATRIX.json`):**
  - Total Magic cards: `1,577`
  - Compiled: `1,577`
  - Without `UNSUPPORTED` clauses: `1,481`
  - With `UNSUPPORTED` clauses: `96` (kept honestly flagged via `hasUnsupported: true`; none fabricated).
