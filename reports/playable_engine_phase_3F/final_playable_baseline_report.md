# BATTLE SPIRITS ETERNAL — PHASE 3F
## Final Playable Baseline Report

---

### 1. Baseline Summary
The local Battle Spirits Eternal implementation is now a verified, reproducible, genuinely playable local development baseline. The game engine resolves complete multi-turn matches, executes real card abilities end-to-end, enforces Eternal format rules, and drives the interactive web arena without direct state tampering.

### 2. Verified Match Capabilities
- **Legal Deck Loading:** Validates 40-card decks with SHA-256 attestation digests.
- **Turn Progression:** Automatically moves START -> CORE -> DRAW -> REFRESH -> MAIN -> ATTACK -> END, enforcing Turn 1 skip rules.
- **Card Summoning:** Pays effective costs via reserve and field cores, placing spirits with cores on field stacks.
- **Combat Flow:** Declares attacks, evaluates flash windows, offers blocker choices, compares BP, and inflicts unblocked life damage.
- **Game Termination:** Detects legitimate win/loss conditions (Life reduced to 0, or deckout on turn start).
