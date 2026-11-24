# PHASE M.3.1 — KNOWN LIMITATIONS & FUTURE SCOPE
## Documented Scope Boundaries, Architectural Trade-offs, and Future Enhancements

**Report ID:** `PHASE-M3.1-LIMIT-007`  
**Phase:** M.3.1  

---

## 1. Scope Boundaries & Deliberate Exclusions

Phase M.3.1 was strictly scoped as a **timing correction and card-specific timing enforcement package**. To preserve stability and architectural integrity, the following areas were kept within their designed operational boundaries:

### 1.1 Separation of Pure Unit/Integration Suites from E2E Headless Browsers
- The primary regression suites (`tests/phase_m3_1_*.test.js`, `tests/phase_m3_*.test.js`, `tests/accel_mechanics.test.js`, `tests/arena_ui_and_timer.test.js`) test the deterministic engine kernel and DOM logic in virtualized vm/jsdom environments (completing in under 1.6 seconds).
- `tests/phase_m3_e2e_real_browser.test.js` launches two full Chromium instances over real WebSockets to test browser-level rendering; it is isolated to standalone manual verification runs due to external network and process timeout characteristics.

### 1.2 Continuous Cost Modifiers Dependent on Turn Owner
- Certain rare cards reduce their Flash cost if played during the opponent's turn (e.g., "If used during opponent's attack step, cost becomes 0").
- `calculateEffectiveCost` handles general symbol reduction and core discounts. Specific conditional discounts tied to battle stage are evaluated at payment resolution time.

### 1.3 Event-Triggered Flash Interleaved Timing
- Certain rare cards have abilities formatted as `[LV1][LV2] (When Attacks) Flash: ...`. As proven in Scenario 10 (`PHASE-M3.1-SPEC-05`), these abilities are triggers that fire on attack declaration rather than open activated abilities. They are correctly rejected if a user attempts to activate them manually as a free flash action outside their trigger context.

---

## 2. Minor Known Limitations

1. **Unofficial Fan Translations:**
   - In rare unofficial fan-translated cards, unconventional parentheses (e.g. nested square brackets inside curved brackets) may occasionally require dynamic text normalization. The regex patterns in `engine/flash_timing.js` handle standard bracket styles, Japanese full-width brackets (`（`, `）`, `【`, `】`), and hyphenated delimiters.
2. **AI Action Selection in Main Step Flash:**
   - The AI in `engine/ai.js` prioritizes Main Step summons and deployments. While the AI can execute Flash Accel and Flash magic when conditions are met, full heuristic optimization of Main Step Flash timing for AI opponents is slated for expansion in Phase M.4.

---

## 3. Future Work Package Roadmap

- **Phase M.3.2:** Granular priority timing timers and client ping-timeout auto-passing.
- **Phase M.4:** Advanced AI Flash timing heuristics during both Main Step and Attack Step battles.
- **Phase M.5:** Cross-card timing contention and simultaneous trigger resolution order.
