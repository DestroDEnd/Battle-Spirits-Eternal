# BATTLE SPIRITS ETERNAL — PHASE 3B
## Interaction and Timing Contracts

---

### 1. Interaction Protocol Contract

Every interactive decision generated during gameplay must satisfy the **Authoritative Interaction Protocol**:

```json
{
  "interactionId": "prompt_1732174800000_abc12",
  "type": "TARGET_SELECTION | CONFIRM_OPTIONAL | CHOOSE_OR_BRANCH | CHOOSE_COLOR | BLOCK_CHOICE | FLASH_ACTION",
  "title": "Select 1 opposing Spirit with 5000 BP or less",
  "chooser": "player | opponent",
  "candidates": [
    {
      "id": "stack_p2_1",
      "card": { "cardNumber": "BS01-015", "name": "DarkGoras" },
      "currentBP": 4000,
      "level": 1
    }
  ],
  "min": 1,
  "max": 1,
  "upTo": false,
  "optional": false,
  "context": {
    "sourceCardNumber": "BS01-001",
    "timing": "WHEN_SUMMONED"
  }
}
```

#### Response Requirements:
1. **Candidate Legality:** Response candidates must be strict subsets of provided candidate IDs.
2. **Bounds Enforcement:** Selection length must be within `[min, max]` unless `optional` or `upTo` is true.
3. **No Direct Mutation:** Submitting a response resolves the pending Promise; the engine then mutates state.
4. **Idempotence & Rejection:** Stale interaction IDs or duplicate submissions return `{ success: false, reason: "STALE_OR_DUPLICATE_INTERACTION" }`.

---

### 2. Timing Window Protocol

| Timing Window | Allowed Actions | Step / Phase Restriction | Priority Arbitration |
| :--- | :--- | :--- | :--- |
| **MAIN_STEP** | Summoning, Nexus deployment, Magic [Main], Core transfers, Ability activation [Main]. | Active Player only; Turn 1 allowed. | Active player retains continuous priority. |
| **ATTACK_DECLARATION** | Select attacking spirit, exhaust, declare battle target. | Active Player only; Skipped on Turn 1. | Active player declares attack. |
| **FLASH_WINDOW** | Magic [Flash], Spirit [Flash], Accel abilities. | Both players alternately. Defending player acts first. | Alternates until both players pass consecutively. |
| **BLOCK_DECLARATION** | Select ready blocker, exhaust, declare block. | Defending Player only. | Defending player chooses blocker or passes to take life damage. |
| **BURST_WINDOW** | Burst declaration on trigger condition. | Player owning set burst matching trigger event. | Window opens immediately upon event; resolves before downstream effects. |
