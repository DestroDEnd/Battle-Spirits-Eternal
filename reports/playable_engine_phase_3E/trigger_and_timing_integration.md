# BATTLE SPIRITS ETERNAL — PHASE 3E
## Trigger and Timing Integration Report

---

### Timing Windows Verified in Production Gameplay
1. **Start Step:** Initial resource calculation, turn history reset.
2. **Core Step:** Moving 1 core from Void to Reserve (skipped Turn 1).
3. **Draw Step:** Drawing 1 card from Deck (skipped Turn 1).
4. **Refresh Step:** Refreshing exhausted Spirits and Nexuses (skipped Turn 1).
5. **Main Step:** Voluntary summoning, ability activations, core reallocations.
6. **Attack Step:**
   - Attack Declaration window.
   - Flash Window (alternating priority).
   - Blocker Choice window.
   - Battle Resolution (BP comparison or Life damage).
   - End of Attack window.
7. **End Step:** End-of-turn continuous modifier pruning.
