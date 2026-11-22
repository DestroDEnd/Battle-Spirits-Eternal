# Battle Spirits Eternal — High-Impact Mechanic Implementation Report
**Phase:** Phase K — Comprehensive Engine Correction & Release Readiness  
**Work Package:** E — High-Impact Mechanic Completion  
**Execution Timestamp:** 2026-11-21  
**Status:** COMPLETE (10/10 Tests Passed — 100.00%)

---

## 1. Executive Summary

Work Package E completes four high-impact Battle Spirits game mechanics that previously lacked comprehensive runtime support or headless integration:
1. **E1 — Brave Multi-Stack & De-braving**: Full runtime support for separating attached Braves into independent Spirit-form field stacks during the Main Step (`game.separateBrave`), and de-braving retention options when the host Spirit leaves the field (`commitStackExit`).
2. **E2 — Grandwalker God Cores**: Transactional God Core payment operations (`payGodCores`, opcode `PAY_GOD_CORE`) deducting cores directly from Grandwalker Nexus stacks to the Void pool, strictly preserving core conservation ($\Delta C = 0$).
3. **E3 — Rebirth Flip State**: Reversible, in-place stack mutation (`FLIP_CARD` / `REBIRTH_FLIP` opcodes, `game.flipCard` API) toggling Face A $\leftrightarrow$ Face B while strictly preserving physical `placementId`, instance `id`, owner, and core allocation.
4. **E4 — Compound & Nested Conditions**: Generalized recursive evaluation of arbitrarily deep `AND`, `OR`, `NOT` condition trees in `engine/conditions.js` with short-circuiting, symbol operator normalization (`&&`, `||`, `!`), and subcondition array/operand compatibility.

All four mechanics were verified with dedicated unit and integration tests in [phase_k_mechanics.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_k_mechanics.test.js), achieving **10/10 PASS (100.00%)**.

---

## 2. Mechanic Implementation Details

### 2.1 E1: Brave Multi-Stack & De-braving
- **Problem**: Previously, when a Spirit stack left the field, all attached Braves in `stack.braves` were unconditionally dumped into `p.grave`. Additionally, players had no engine API to voluntarily detach a Brave into Spirit form during the Main Step.
- **Solution**:
  1. **Field Exit Retention in `engine/zones.js`**: `commitStackExit` now checks `options.retainBraves`, `options.retainBraveIds`, and `options.debraveAllocations`. If retention is requested and player reserve contains sufficient cores ($\ge 1$), a new independent field stack is instantiated (`createFieldStack(braveCard, { normal: allocatedCores, soul: 0 })`), placed onto `p.field`, and event `BRAVE_SEPARATED` is emitted. If retention is declined or no cores are available, the Brave card enters `p.grave`.
  2. **Active Separation API in `engine/index.js`**: Added `game.separateBrave(hostStackId, braveCardId = null, coresFromReserve = 1, playerSide = 'player')`. This verifies that the host stack exists, has attached Braves, and that the player has sufficient reserve cores before detaching the Brave into an independent Spirit form on the field.

### 2.2 E2: Grandwalker God Cores
- **Problem**: Grandwalker Nexus cards accumulate cores ("God Cores") that are expended to pay for God Skills. Standard core movements sent cores to Trash or Reserve, violating the rule that God Core payments move cores directly to the Void.
- **Solution**:
  1. **Transactional Payment Function in `engine/payment.js`**: Exported `payGodCores(state, stackId, count, playerSide, events)`. It verifies available cores on the Grandwalker stack, decrements `stack.cores.normal`, increments `p.voidCores.normal`, and emits `GOD_CORES_PAID`.
  2. **Headless Opcode in `engine/ops/index.js`**: Added handlers for `PAY_GOD_CORE` and `PAY_GOD_CORES` in `executeOp`. Ensures that ability resolution frames can execute God Core payments declaratively from compiled IR.
  3. **Core Conservation**: Cores deducted from the Grandwalker stack are exactly matched by cores added to the Void pool, maintaining zero net change to total game cores ($\Delta C = 0$).

### 2.3 E3: Rebirth Flip State
- **Problem**: Rebirth cards have two faces (Face A and Face B). Transforming a Rebirth card must not replace the field stack or reset its core count, placement ID, or controller.
- **Solution**:
  1. **In-Place Mutation**: `game.flipCard(stackId, options, playerSide)` and opcodes `FLIP_CARD` / `REBIRTH_FLIP` toggle `currentFace` ('A' $\leftrightarrow$ 'B'), toggle boolean flag `isFlipped`, update `topCard.face`, and optionally overlay Face B metadata (`faceData`) while keeping the existing `id`, `placementId`, `cores`, and `owner`.
  2. **Event Dispatch**: Emits `CARD_FLIPPED` notification with `stackId`, `card`, `face`, and `isFlipped` properties.

### 2.4 E4: Compound & Nested Conditions
- **Problem**: Compiled IR for advanced cards contains nested condition trees combining multiple criteria (e.g., life thresholds, core thresholds, card counts) with logical connectives (`AND`, `OR`, `NOT`).
- **Solution**:
  1. **Enhanced AST Traversal in `engine/conditions.js`**: Case `CONDITION_TYPES.COMPOUND` now handles `conditions`, `subconditions`, and `operands` properties uniformly.
  2. **Combinator Normalization**: Supports `AND`, `&&`, `OR`, `||`, `NOT`, `!`, case-insensitively.
  3. **Recursive Evaluation**: Subconditions are mapped through `evaluateStructuredCondition` recursively. Implements proper short-circuit logic:
     - `OR`: Short-circuits to `TRUE` if any subcondition is `TRUE`. Returns `FALSE` only when all subconditions evaluate to `FALSE`.
     - `AND`: Short-circuits to `FALSE` if any subcondition is `FALSE`. Returns `TRUE` only when all subconditions evaluate to `TRUE`.
     - `NOT`: Inverts `TRUE` $\leftrightarrow$ `FALSE` for a single subcondition.
     - Context and Unsupported propagation: Bubbles `INVALID_CONTEXT` and `UNSUPPORTED` cleanly when applicable.

---

## 3. Verification Test Battery

The test suite [phase_k_mechanics.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_k_mechanics.test.js) was executed via `node --test`:

```
✔ E1-01: separateBrave separates attached Brave into independent Spirit form on field (3.9955ms)
✔ E1-02: commitStackExit with retainBraves keeps Brave on field as Spirit form (2.6777ms)
✔ E1-03: commitStackExit sends Brave to grave when retention is not requested (2.6732ms)
✔ E2-01: payGodCores moves cores directly from Grandwalker stack to Void (0.9647ms)
✔ E2-02: PAY_GOD_CORE op via executeOp enforces core conservation and Void transfer (13.6534ms)
✔ E2-03: PAY_GOD_CORE fails gracefully when stack has insufficient God cores (1.3983ms)
✔ E3-01: game.flipCard inverts card face state while preserving placementId and cores (0.9624ms)
✔ E3-02: FLIP_CARD op via executeOp emits CARD_FLIPPED event and toggles state (1.1956ms)
✔ E4-01: evaluateStructuredCondition evaluates nested AND(OR(A, B), NOT(C)) tree (4.7ms)
✔ E4-02: evaluateStructuredCondition handles subconditions array, operands array, and lowercase combinators (0.3135ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 183.2083
```

---

## 4. Artifact & Implementation Links

- Test Suite: [phase_k_mechanics.test.js](file:///c:/Users/namis/Downloads/BSP/tests/phase_k_mechanics.test.js)
- Zone Management: [zones.js](file:///c:/Users/namis/Downloads/BSP/engine/zones.js)
- Payment Primitives: [payment.js](file:///c:/Users/namis/Downloads/BSP/engine/payment.js)
- Operation Primitives: [ops/index.js](file:///c:/Users/namis/Downloads/BSP/engine/ops/index.js)
- Condition Evaluator: [conditions.js](file:///c:/Users/namis/Downloads/BSP/engine/conditions.js)
- Engine Facade: [index.js](file:///c:/Users/namis/Downloads/BSP/engine/index.js)
