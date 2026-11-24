# AI AUTHORITY AUDIT

## Inspected Modules
- `engine/ai.js` (`AIDecider`)
- `engine/interaction.js` (`InteractionController`)
- `engine/index.js` (`createGame` resolverDelegate)
- `engine/session_mode.js` (`MatchContext`)

## Findings
1. **`AIDecider.decide(prompt, state)` lacks ownership enforcement:**
   - Never checks `prompt.chooser` or `prompt.decisionOwner` against `this.side` or `state.matchContext?.canAiDecide(...)`. If accidentally invoked for a human-owned prompt, it will answer on the human's behalf.
2. **Unconditional `BURST_TRIGGER` & `CONFIRM_OPTIONAL` acceptance:**
   - `AIDecider` always returns `{ activate: true }` for `BURST_TRIGGER` and `{ accepted: true }` for `CONFIRM_OPTIONAL` without evaluating whether activation is strategically beneficial or checking `this.side`.
3. **Hardcoded `'opponent'` routing in `engine/index.js:307`:**
   - `if (options.ai && prompt.chooser === 'opponent')` ignores `MatchContext`, violating `HUMAN_VS_HUMAN` (where `'opponent'` is human) and `AI_VS_AI` (where `'player'` is AI).
