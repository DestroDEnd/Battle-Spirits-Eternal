# BATTLE SPIRITS ETERNAL — PHASE 3B
## Remaining Limitations and Engineering Debt

---

1. **Operation Variant Verification Tier:**
   - 293 operation variants in `engine/ops/index.js` reside in the `HANDLER_PRESENT` tier. While code exists for all 296 cases, they require systematic variant-level regression testing during Phase 3D.

2. **Complex Replacement Priority:**
   - Multi-replacement arbitration (when two replacement effects simultaneously attempt to modify the same event) currently resolves in first-registered order. An interactive replacement selector will be finalized in Phase 3C.

3. **Multi-sided Card Rebirth Animation Protocol:**
   - Rebirth flip transitions are mathematically and logically correct in state; client-side 3D flipping animation protocol is pending Phase 3F polish.
