# BATTLE SPIRITS ETERNAL — ENGINE ARCHITECTURE INVENTORY
## Subsystem Map & Contract Specifications

**Format Profile:** Eternal Rules Profile (`engine/rules/eternal.js`)  
**Core Facade:** `engine/index.js` (`createGame`)  
**State Model:** `engine/state.js`  
**Event Pipeline:** `engine/events.js`  
**Flow Controller:** `engine/flow.js`  
**Resolver Engine:** `engine/resolver.js`  

---

## 1. Engine Core Subsystems

| Subsystem | Primary Module | Core Responsibilities |
|---|---|---|
| **State Management** | `engine/state.js` | Game state instantiation, player state, field stacks, placement IDs, invariant validation. |
| **Zone Management** | `engine/zones.js` | Atomic card and core movements (`moveCard`, `moveCore`), zone transitions, soul core handling. |
| **Flow & Steps** | `engine/flow.js` | Turn lifecycle (`START`, `CORE`, `DRAW`, `REFRESH`, `MAIN`, `ATTACK`, `END`), Turn 1 step skips, deckout check. |
| **Cost & Payment** | `engine/payment.js` | Effective cost calculation, symbol reduction, atomic payment plans, payment execution. |
| **Continuous Layer** | `engine/continuous.js` | Dynamic BP computation, level evaluation, symbol evaluation, action restrictions, immunities. |
| **Combat Resolution** | `engine/index.js` | Attack declaration, block declaration, BP comparison, unblocked direct hit resolution, life depletion. |
| **Ability Resolver** | `engine/resolver.js` | Async ability evaluation, prerequisite checks, trigger dispatch, prompt resolution. |
| **Operations Library** | `engine/ops/index.js` | Generic opcode handlers (`DRAW`, `DESTROY`, `BOUNCE`, `EXHAUST`, `MOVE_CORE`, `BP_BUFF`, etc.). |
| **Target Selectors** | `engine/selectors.js` | Target candidate querying, condition filtering, extreme tie resolution, side narrowing. |
| **State-Based Actions** | `engine/sba.js` | Zero BP destruction, core depletion (0 cores on spirit), life loss checking. |

---

## 2. API Contract Specification

1. **Card Play (`game.playCard`):**
   - Timing checks (MAIN vs ATTACK flash).
   - Atomic cost payment with rollback on failure.
   - Core placement for LV1 sustenance.
   - Trigger dispatch for `SUMMONED`.

2. **Attack Declaration (`game.declareAttack`):**
   - Validates refreshed status and attack eligibility.
   - Transitions state to `EXHAUSTED`.
   - Opens Flash window and fires `WHEN_ATTACKS` triggers.

3. **Block Declaration (`game.declareBlock`):**
   - Validates blocker is refreshed spirit.
   - Transitions blocker to `EXHAUSTED`.
   - Executes BP comparison, destroys losing spirit to grave, recycles cores to reserve.

4. **Direct Hit (`game.resolveDirectHit`):**
   - Calculates symbol damage.
   - Depletes Life cores and routes them to Reserve.
   - Triggers `LIFE_0` game over when Life reaches 0.
