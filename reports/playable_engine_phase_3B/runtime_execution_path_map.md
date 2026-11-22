# BATTLE SPIRITS ETERNAL — PHASE 3B
## Runtime Execution Path Map

**Module Authority:** `engine/resolver.js`, `engine/ops/index.js`

---

### 1. Clause Grammar Dispatch Map

When an ability resolves through `AsyncResolver.resolveAbility`, each clause follows a strictly defined execution path based on clause properties and connector grammar:

```
[Ability Activation]
       │
       ▼
[Prefix Check: evaluateAbilityPrefixPrerequisites]
       │
       ▼
[Capacity Check: reserveRestriction (Stage 0 Reservation)]
       │
       ▼
┌───────────────────────────┐
│ Clause Loop (Main Clauses)│
└──────────────┬────────────┘
               │
   ┌───────────┴───────────────────────────────┐
   │                                           │
[Cost Clause: isCost === true]      [Regular Clause]
   │                                           │
   ▼                                           ▼
[executeOp (Cost)]                  [Condition Check: evaluateCondition]
   │                                           │
   ├─ If failed ──> ABORT ABILITY              ├─ If False/Unsupported ──> SKIP CLAUSE
   │                                           │
   ▼                                           ▼
[commitActivation (Stage 4 Commit)] [Optional Prompt: CONFIRM_OPTIONAL]
                                               │
                                    ┌──────────┴───────────────┐
                                    │                          │
                         [Declined: optionalDeclined] [Accepted / Mandatory]
                                    │                          │
                                    ▼                          ▼
                         [Clear Targeting Context]    [Targeting / Op Execution]
                                                               │
                                             ┌─────────────────┴─────────────────┐
                                             │                                   │
                                 [isTargeting === true]             [Ordinary Opcode]
                                             │                                   │
                                             ▼                                   ▼
                                 [executeTargeting]                 [commitActivation]
                                             │                                   │
                                             ▼                                   ▼
                                 [commitActivation]                 [executeOp]
                                             │                                   │
                                             └─────────────────┬─────────────────┘
                                                               │
                                                               ▼
                                               [synchronizeTargetingContext]
                                                               │
                                                               ▼
                                               [Next Clause / afterResolves]
```

---

### 2. Targeting Context Propagation Contract

| Operation Category | Example Opcodes | Targeting Context Behavior on Success | Targeting Context Behavior on Decline / Failure |
| :--- | :--- | :--- | :--- |
| **Dedicated Targeting** | `TARGET`, `TARGET_SELECT`, `SELECT_TARGET`, `TARGET_CARDS` | Sets `previousTarget`, `previousTargets`, and `selectedTargets` to selected cards. | Clears `previousTarget` (null), `previousTargets` ([]), and `selectedTargets` ([]). |
| **Designated Propagators** | `DESTROY`, `BOUNCE` | If downstream grammar requires target (e.g. `sameFamilyAsPrevious`), sets `previousTarget` and `previousTargets` to affected cards. | Preserves existing targeting context without clearing. |
| **Ordinary Operations** | `DRAW`, `SUMMON`, `BP_BUFF`, `MOVE_CORE` | Preserves targeting context untouched. | Preserves existing targeting context untouched. |
| **Condition / Prereq Skip** | Any opcode skipped via `conditionResult !== TRUE` | Targeting context strictly preserved. | N/A |
