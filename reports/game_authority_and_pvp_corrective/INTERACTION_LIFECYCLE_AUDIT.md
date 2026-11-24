# INTERACTION LIFECYCLE AUDIT

## Inspected Modules
- `engine/interaction.js`
- `engine/prompt_manager.js`
- `engine/resolver.js`
- `engine/index.js`
- `engine/session_mode.js`

## Findings
1. **Unchecked Fallback in `engine/index.js` (`resolverDelegate.choose`):**
   - `if (options.ai && prompt.chooser === 'opponent')` hardcodes `'opponent'` and ignores `state.matchContext`.
   - When `options.interactive` and `options.usePromptManager` are false, `resolverDelegate.choose` calls `defaultFallback.choose(prompt)` (`DefaultPromptResolver`), even when `state.matchContext.isHuman(chooser)` is true!
2. **Unsafe Auto-Acceptance in `DefaultPromptResolver.choose` (`engine/resolver.js:865`):**
   - Returns `{ accepted: true, declined: false }` for `CONFIRM_OPTIONAL` / `CONFIRM_ACTION`, and `{ activate: true, accepted: true }` for `BURST_TRIGGER` / `OPTIONAL_TRIGGER`.
   - Only `HEADLESS_SIMULATION` (or explicit headless test configuration) should permit automated fallback; human-owned interactions without a UI/interaction controller must throw or fail explicitly (`HUMAN_INTERACTION_UNROUTABLE`) instead of silently accepting.
3. **Missing Owner Verification in `InteractionController.respond` (`engine/interaction.js`):**
   - `respond(interactionId, response, authContext)` should enforce that when `authContext` specifies a `playerSide` or `controlType`, an opponent or unauthorized AI cannot resolve another player's `decisionOwner` interaction.
