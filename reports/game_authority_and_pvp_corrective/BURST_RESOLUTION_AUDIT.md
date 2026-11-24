# BURST RESOLUTION AUDIT (INCLUDING LORD DRAGON BAZZEL)

## Inspected Paths
- `engine/response_window.js` (`openBurstWindow`, `matchesBurstCondition`)
- `engine/index.js` (`LIFE_REDUCED`, `DESTROYED`, `SUMMONED` EventBus hooks)
- `battle_arena.js` (`checkBurstTrigger`, `openBurstPromptModal`, `activateBurst`, `executeWhenSummonedEffects`, `runAiMainStep`, `runAiAttackStep`, Bazzel `WHEN_ATTACKS` block at line 9549)

## Root Causes of the Lord Dragon Bazzel / Disappearing Burst Defect
1. **Missing Continuation & Synchronous AI Loop in `battle_arena.js`:**
   - `executeWhenSummonedEffects` (`battle_arena.js:10003`) calls `checkBurstTrigger(enemySide, "AFTER_OPPONENT_SUMMON_EFFECT", { spirit })` with no `onResume` callback.
   - `runAiMainStep()` (`battle_arena.js:16352`) loops synchronously through up to 3 summons and exits immediately, scheduling `runAiAttackStep()` even while `DuelState.activeBurstTrigger` is still pending for the human player.
   - `runAiAttackStep()` then attacks and inflicts direct Life damage (`DuelState.player.life -= 1`), calling `checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', ...)` which overwrites `DuelState.activeBurstTrigger` and replaces `#battleBurstPromptModal` (or `closeBurstPromptModal` / `endTurn` clears it).
2. **Missing Modal Auto-Activation Fallback (`battle_arena.js:15051`):**
   - `if (!modal) { activateBurst('player', true); return; }` auto-activates a human player's Burst if the DOM modal element is absent.
3. **Incorrect `promptResolver` Argument in `engine/response_window.js:490`:**
   - `resolver.resolveAbility(state, ab, { controller: side, ... }, this.game.events)` passes `EventBus` as the 4th argument (`promptResolver`) instead of `null` / `resolver.promptResolver`.
4. **Unconditional AI Burst Activation (`engine/ai.js:136`):**
   - `AIDecider.decide()` returns `{ activate: true }` for every `BURST_TRIGGER` regardless of `prompt.chooser` or board utility.
