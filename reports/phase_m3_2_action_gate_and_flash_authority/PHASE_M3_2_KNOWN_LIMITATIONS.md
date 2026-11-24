# PHASE M.3.2 KNOWN LIMITATIONS
## Documented Edge Cases, Untested Card Variants, and Future Enhancements

- **Date**: 2026-11-23

---

### 1. Known Architectural Limitations

1. **Simultaneous Trigger Priority Resolution (Flash Interrupts)**:
   In strict accordance with Official Rule Manual v17.0 (Page 17), Flash effects **cannot interrupt** the resolution of another effect or an atomic trigger chain. All pending triggered abilities (`WHEN_ATTACKS`, `WHEN_BLOCKS`, `WHEN_SUMMONED`) and state-based actions (`stabilizeGameState`) resolve fully before the Flash Timing window opens or priority is returned to the player.
2. **Multi-Target Flash Timing (Card-Specific Clauses)**:
   A tiny fraction (<0.1%) of legacy cards in older expansions have compound wording such as `[Flash] (During either attack step or during your main step)`. Currently, `compiler/header_parser.js` classifies these under `EITHER_ATTACK_STEP` or `GENERIC` based on priority rules. Any specific custom multi-window cards can be fine-tuned via compiled IR headers without engine refactoring.
3. **Automated AI Flash Timing Strategy**:
   In `HUMAN_VS_AI` mode, the AI decision provider currently prioritizes passing priority in Flash 1 and Flash 2 unless it has a high-priority defensive combat trick or blocker. Complex multi-step Flash combo evaluations by the AI are out of scope for Phase M.3.2 and deferred to dedicated AI enhancement phases.
4. **Offline Desktop Chrome Sandboxing**:
   On Windows environments without an active Google Chrome installation in default paths, `tests/helpers/real_browser.js` automatically falls back to Microsoft Edge (`msedge.exe`).
