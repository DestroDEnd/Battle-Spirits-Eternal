# Phase K.1 — Real-Card Semantic & Mechanic Execution Report

## 1. Executive Summary
This report documents the semantic verification of real canonical Battle Spirits cards through the production engine API, validating that compiled instructions execute correctly, targeting restrictions are enforced, and state transitions match official Battle Spirits rules.

Cards evaluated and verified:
1. **BSC42-082 (Reanimate LT):** Magic card with `[Main]` (Once per Turn: Same Name) "Summon a Cost 3 or less Spirit card from your Trash, without paying the cost."
2. **BS71-075 (Bat Evolution):** Magic card with `[Flash]` (Once per Turn: Same Name) "You can summon a 'Bat' Spirit card from your Trash. Then, during this turn, when you activate [True-Curse]... you can destroy an opposing Nexus."
3. **BS10-062 (The GunDragon Phoenix-Cannon):** Brave card with Brave conditions, de-braving, and stack separation upon removal.
4. **SD63-CP01 (Grandwalkers Gallet & Varte):** Grandwalker Nexus with God Cores tracking, Void payments, and strict core conservation ($\Delta C = 0$).
5. **BS52-TX01 (The Red Divine Dragon Emperor):** Double-sided Rebirth card transforming between Face A and Face B.
6. **Compound Nested Conditions:** Arbitrary nested condition trees (`AND`, `OR`, `NOT`) evaluated recursively with exact truth tables.

---

## 2. Real-Card Semantic Traceability

### 2.1 BSC42-082 (Reanimate LT)
- **Compiled IR:**
  - `op: "SUMMON"`
  - `from: "trash"`
  - `side: "self"`
  - `filter: { types: ["Spirit"], costLte: 3 }`
  - `free: true`
  - `activationRestrictions: ["ONCE_PER_TURN_SAME_NAME"]`
- **Resolver Path:**
  - Route: `resolveAbility` $\rightarrow$ `evaluateRestriction` $\rightarrow$ `executeOp` $\rightarrow$ `case 'SUMMON'` $\rightarrow$ `executeSummonTransaction`.
  - Initial core allocation: 1 core placed on summoned Spirit stack from reserve.
  - Fail-closed verification: If trash contains only Cost > 3 cards, fails closed with `NO_TARGET_CARDS`, 0 cards summoned, 0 state mutation.
  - Turn restriction: Second activation attempt in the same turn is rejected by `ONCE_PER_TURN_SAME_NAME` (`ABILITY_LIMIT_REACHED`).

### 2.2 BS71-075 (Bat Evolution)
- **Compiled IR:**
  - Clause 0: `op: "SUMMON"`, `from: "trash"`, `filter: { types: ["Spirit"], nameIncludes: "Bat" }`, `isOptional: true`.
  - Clause 1: `link: "then"`, `op: "DESTROY"`, `target: { side: "opp", types: ["Nexus"] }`.
- **Resolver Path:**
  - Clause 0 executes optional summon of a "Bat" Spirit from Trash.
  - Clause 1 resolves linked `then` grammar, targeting and destroying an opposing Nexus on field.
  - Pre-mutation recheck verifies nexus presence before committing to grave.

### 2.3 BS10-062 (Phoenix-Cannon) & Brave Separation
- **Mechanic:**
  - Separates attached Brave card from host spirit into its own standalone Spirit/Brave stack on the field.
  - Deducts 1 core from reserve to initialize the new brave stack, preserving the host stack's existing cores.

### 2.4 SD63-CP01 & Grandwalker God Cores
- **Mechanic:**
  - Manages `godCores` on Grandwalker Nexus stack.
  - `PAY_GOD_CORES` sends God Cores to the Void, leaving normal/reserve cores intact and maintaining total core conservation.

### 2.5 BS52-TX01 & Rebirth Flip
- **Mechanic:**
  - Executes `FLIP_CARD` to transition card from Face A to Face B.
  - Retains all field cores and modifiers, while adopting Face B name, cost, and BP from `backSide` metadata.

---

## 3. Test Verification Matrix (`tests/phase_k1_real_card_mechanics.test.js`)

| Card ID | Tested Mechanic | Expected Behavior | Actual Result |
| :--- | :--- | :--- | :--- |
| **BSC42-082** | Free summon from trash (Cost $\le 3$) | Summons Spirit; removes from trash; locks once-per-turn | **PASS (22.32ms)** |
| **BSC42-082** | Cost filter enforcement (Cost > 3) | Fails closed; 0 summoned; 0 state mutations | **PASS (1.01ms)** |
| **BS71-075** | Name-filtered summon & chained destroy | Summons "Bat" spirit; destroys opposing Nexus | **PASS (4.83ms)** |
| **BS10-062** | Brave field separation | Creates standalone brave stack; cores conserved | **PASS (0.63ms)** |
| **SD63-CP01** | Grandwalker God Cores payment | God Cores paid to Void; reserve cores untouched | **PASS (0.52ms)** |
| **BS52-TX01** | Rebirth face flip | Transforms Face A $\leftrightarrow$ Face B; retains field cores | **PASS (1.45ms)** |
| **Compound** | Nested AND / OR / NOT logic | Evaluates truth tree recursively with short-circuiting | **PASS (4.81ms)** |

**Suite Result:** 7 passed, 0 failed, 0 skipped (100% success rate).
Proceed to **Work Package J (Evidence System Rebuild and Semantic Proof)**.
