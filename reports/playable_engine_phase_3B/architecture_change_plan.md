# BATTLE SPIRITS ETERNAL — PHASE 3B
## Architecture Change Plan (Phase 3C & Phase 3D)

---

### 1. Phase 3C: Foundational Dependencies Roadmap
1. **Atomic Cost Payment Rollback:**
   - Implement transactional core/hand deductions in `engine/payment.js` allowing complete rollback if an multi-step activation aborts before Stage 4 Commitment.
2. **Replacement Effect Arbitration:**
   - Formalize replacement queue in `engine/continuous.js` to resolve simultaneous replacement triggers (e.g., discard instead of destroy vs return to hand instead of destroy).
3. **Continuous Modifier Caching & Layering:**
   - Add timestamped priority layering to `computeEffectiveBP` and keyword evaluations to ensure deterministic resolution.

### 2. Phase 3D: Effect Family Implementation Roadmap
- **Batch 1 (Wave 1):** Combat & Destruction (`DESTROY`, `BOUNCE`, `BP_BUFF`, `BP_DEBUFF`, `EXHAUST`, `REFRESH`).
- **Batch 2 (Wave 2):** Core & Resource Flow (`MOVE_CORE`, `MOVE_SOUL_CORE`, `CORE_CHARGE`, `DRAW`, `DISCARD`, `MILL`).
- **Batch 3 (Wave 3):** Targeting, Decisions & Restrictions (`TARGET_SELECT`, `CHOOSE_COLOR`, `LIMIT_ONCE_PER_TURN`).
- **Batch 4 (Wave 4):** Specialized Mechanics (`ADVENT`, `MIRAGE`, `BURST`, `REBIRTH`, `GRANDWALKER`).

### 3. Non-Negotiable Safety Constraints
- Zero modifications to `data/cards_detailed.json` or the 514 shards in `data/ir_shards/`.
- All tests must pass before advancing to next phase.
- Master verification runner must maintain 100% pass rate.
