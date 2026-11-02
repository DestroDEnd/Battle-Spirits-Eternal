# Battle Spirits Eternal - Developer & Agent Rules

All development on Battle Spirits Eternal follows these non-negotiable architectural and procedural rules.

## Core Rules

1. **Never Key Effects on Card Name or Free Text**:
   - Never add `if (card.name === '...')` or ad-hoc RegExp checks directly inside the game flow or arena.
   - All effects must compile into structured IR (Intermediate Representation) and resolve through generic primitives in `engine/ops/`.

2. **Test-First Methodology**:
   - Every bug report must be encoded as a test case in `tests/` before a fix is implemented.
   - A fix is only complete when its automated regression test passes.

3. **Single Source of Truth**:
   - Rules follow the **Eternal Format** profile defined in `engine/rules/eternal.js`.
   - Never hardcode conflicting or ad-hoc rule variants across UI files.

4. **Card Identity by Card Number**:
   - Cards are identified by their canonical card number (`BS44-012`, `SD37-X01`), never by name alone. Name collisions (reprints with differing text, multi-side cards) must be resolved via card numbers and versions.

5. **Asynchronous Prompts & No Timers in Rules Flow**:
   - Decisions (target selection, optional triggers, flash windows, block choice) must return Promises and pause engine progression until resolved.
   - Timers (`setTimeout`) are reserved exclusively for UI animations and must never drive game logic or AI turns.

6. **Full Verification Before Completion**:
   - Always run `npm test` and the data audit script before marking any task as complete.
   - Summaries must report test counts and coverage statistics.
