# Battle Spirits Eternal (BSP) — System Architecture & Dependency Map
## Release Readiness Program — Phase A1 Architectural Specification

**Evaluation Date:** 2026-11-21  
**Project Workspace:** `c:/Users/namis/Downloads/BSP`  
**Governing Format:** Battle Spirits Eternal Format Rules (`engine/rules/eternal.js`)  
**Status:** **AUTHORITATIVE ARCHITECTURE BASELINE**

---

## 1. Architectural Overview & System Model

Battle Spirits Eternal is an asynchronous, rules-authoritative Battle Spirits engine and local game platform. The system enforces strict separation between:
1. **The Game Rules Engine (`engine/`):** Owns all authoritative state, state transitions, validation, and effect resolution.
2. **The Card Compiler Pipeline (`compiler/`):** Compiles natural card text and Japanese/English rules text into RFC 8785 deterministic Intermediate Representation (IR).
3. **The Interaction Protocol (`engine/interaction.js`):** Coordinates non-blocking decision requests between the engine, AI players, and human UI.
4. **The Presentation & Client Layer (`public/`, `app.js`):** Renders state, captures user intent, and presents prompts without direct state manipulation privileges.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION CLIENT                           │
│     (Browser Arena DOM / CLI Test Harness / AI Decision Agent)        │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │  Interaction Protocol (Promises)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ENGINE INTERACTION FACADE                       │
│    engine/interaction.js (InteractionController) / prompt_manager.js   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                       AUTHORITATIVE GAME ENGINE                        │
│                                                                        │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │   Turn & Phase Flow   │                 │     Event Bus & SBA    │  │
│  │    (engine/flow.js)   │                 │  (events.js / sba.js)  │  │
│  └───────────┬───────────┘                 └───────────┬────────────┘  │
│              │                                         │               │
│              ▼                                         ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Ability Resolver Pipeline                     │  │
│  │                      (engine/resolver.js)                        │  │
│  └───────────┬─────────────────────────────┬────────────────────────┘  │
│              │                             │                           │
│              ▼                             ▼                           │
│  ┌───────────────────────┐     ┌──────────────────────────────────┐    │
│  │  Targeting & Query    │     │      Operation Dispatcher        │    │
│  │ (engine/selectors.js) │     │      (engine/ops/index.js)       │    │
│  └───────────┬───────────┘     └───────────┬──────────────────────┘    │
│              │                             │                           │
│              ▼                             ▼                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   State Mutation & Conservation                  │  │
│  │               (engine/state.js / engine/zones.js)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Subsystem Dependency & Invocation Matrix

| Subsystem Module | Core Responsibilities | Inward Callers (Invoked By) | Outward Dependencies (Invokes) | Authoritative Responsibility |
|---|---|---|---|---|
| **`engine/index.js`** | Core facade, game lifecycle, factory (`createGame`) | Tests, Arena UI, CLI scripts | `flow.js`, `state.js`, `zones.js`, `resolver.js`, `payment.js`, `continuous.js`, `sba.js` | Top-level lifecycle coordinator |
| **`engine/state.js`** | Game state factory, stack creation, state validation | `index.js`, `flow.js`, `zones.js`, `ops/index.js` | None (pure data model) | **Authoritative State Model** |
| **`engine/zones.js`** | Atomic card & core movement between zones | `flow.js`, `ops/index.js`, `payment.js`, `sba.js` | `state.js`, `events.js` | **Zone Exclusivity & Conservation** |
| **`engine/flow.js`** | Step sequencing, phase advancement, turn loop | `index.js`, Test suites | `state.js`, `zones.js`, `triggers.js`, `windows.js`, `continuous.js`, `sba.js` | **Turn & Phase Authority** |
| **`engine/resolver.js`** | IR clause execution, link semantics, commit/rollback | `flow.js`, `triggers.js`, `windows.js` | `ops/index.js`, `selectors.js`, `conditions.js`, `restrictions.js`, `interaction.js` | **Ability Execution Authority** |
| **`engine/ops/index.js`** | Atomic operation handlers (288 opcodes) | `resolver.js` | `zones.js`, `selectors.js`, `continuous.js`, `payment.js`, `conditions.js`, `telemetry.js` | Operation dispatch |
| **`engine/selectors.js`** | Target candidate queries & validation | `resolver.js`, `ops/index.js`, UI adapters | `continuous.js`, `interaction.js` | **Target Legality Validation** |
| **`engine/continuous.js`** | Continuous BP recalculation, symbol count, levels | `flow.js`, `resolver.js`, `selectors.js`, `sba.js` | `state.js` | **Continuous Rules Authority** |
| **`engine/conditions.js`** | Condition evaluation (AST & structured expressions) | `resolver.js`, `ops/index.js` | `state.js`, `continuous.js` | Condition validation |
| **`engine/restrictions.js`**| Activation limits (`ONCE_PER_TURN`, `ONCE_PER_STEP`) | `resolver.js`, `index.js`, `flow.js` | None (pure limit tracker) | **Activation Limit Authority** |
| **`engine/triggers.js`** | Trigger queue management, trigger prioritization | `flow.js`, `resolver.js`, `events.js` | `resolver.js` | Trigger ordering |
| **`engine/windows.js`** | Timing window manager (Flash, Burst, Priority) | `flow.js`, `triggers.js` | `resolver.js`, `interaction.js` | Priority & window authority |
| **`engine/sba.js`** | State-Based Actions (Depletion, 0 BP destruction) | `flow.js`, `resolver.js`, `index.js` | `zones.js`, `events.js` | **Rule Enforcement Integrity** |
| **`engine/payment.js`** | Cost calculation, reduction symbols, payment plans | `index.js`, `flow.js`, `ops/index.js` | `zones.js`, `continuous.js` | **Resource Cost Authority** |
| **`engine/interaction.js`**| Canonical asynchronous interaction controller | `resolver.js`, `windows.js`, `selectors.js` | None (Promise coordinator) | **Player Decision Protocol** |
| **`engine/prompt_manager.js`**| Backward-compatible prompt manager wrapper | Legacy adapters, test harnesses | `interaction.js` | Compatibility layer |
| **`engine/events.js`** | Asynchronous event bus (`EventBus`) | Entire engine | None | Asynchronous event propagation |
| **`engine/telemetry.js`** | Runtime opcode execution telemetry logger | `ops/index.js` | None | Evidence & trace recorder |
| **`compiler/index.js`** | Text $\rightarrow$ AST $\rightarrow$ IR compilation pipeline | Build scripts, dynamic compilers | `header_parser.js`, `clause_splitter.js`, `clause_patterns.js`, `identity.js` | **IR Compilation Authority** |
| **`compiler/identity.js`** | RFC 8785 dual-digest identity derivation | `compiler/index.js`, Shard generators | Node `crypto` | **Deterministic Card Identity** |

---

## 3. Authoritative State & Validation Boundaries

### 3.1 Authoritative State Ownership
- **Game State Root (`DuelState`):** Defined in `engine/state.js`. Contains `players.player`, `players.opponent`, `turn`, `step`, `phase`, `combat`, `modifiers`, `pendingInteractions`, and `history`.
- **Card Identity:** Every card is an immutable instance (`CardInstance`) created via `createCardInstance(data, owner)`. A card possesses a canonical `cardNumber` (e.g. `BS01-001`), an instance `id` (`card_1_...`), and original owner attributes.
- **Field Stacks (`FieldStack`):** On-field cards are encapsulated in field stacks (`stack.top`, `stack.under`, `stack.cores`, `stack.status`). Cores are tracked per stack (`cores.normal`, `cores.soul`).

### 3.2 Authoritative Validation Responsibility
- **Deck Format Legality:** Enforced by `validateDeck` in `engine/rules/eternal.js`.
- **Activation Limits:** Enforced by `evaluateRestriction`, `reserveRestriction`, and `commitRestriction` in `engine/restrictions.js`.
- **Target Selection Legality:** Enforced by `queryCandidates` in `engine/selectors.js`.
- **Payment & Resource Affordability:** Enforced by `canAffordCost` and `buildPaymentPlan` in `engine/payment.js`.
- **Continuous Rules & State-Based Actions:** Enforced by `checkStateBasedActions` in `engine/sba.js` and `computeEffectiveBP` in `engine/continuous.js`.

---

## 4. Execution Lifecycles

### 4.1 Card Effect Entry & Resolution
```
1. Trigger Event Occurs (e.g. WHEN_SUMMONED) 
   ──► TriggerQueueManager.enqueueTrigger(event)
2. Active Player Priority Sort
   ──► Active Player triggers ordered before Non-Active Player triggers
3. AsyncResolver.resolveAbility(state, ability, context)
   ├── Step 1: evaluateAbilityPrefixPrerequisites (during set, lv requirement)
   ├── Step 2: reserveRestriction (capacity reservation)
   ├── Step 3: Sequential Clause Loop (mainClauses)
   │     ├── evaluateCondition (Condition AST check)
   │     ├── Optional Prompt Check ("you can", "you may")
   │     ├── Cost Execution & Atomic Commitment (commitActivation())
   │     ├── Target Query & Selection (executeTargeting / queryCandidates)
   │     └── Opcode Execution (executeOp -> executeOpCore)
   └── Step 4: followUpClauses (afterResolves)
4. State-Based Action Stabilization (sba.js: 0 BP destruction, depletion to trash)
```

### 4.2 Asynchronous Interaction Cycle
```
[Engine Needs Decision: e.g. Select Target Spirit]
   │
   ├── 1. InteractionController.request({ type: 'SELECT_TARGET', candidates: [...] })
   │      └── Creates InteractionRequest with status WAITING_FOR_PLAYER
   │      └── Returns pending Promise
   │
   ├── 2. UI Adapter receives event: INTERACTION_REQUESTED
   │      └── Renders candidate selection modal
   │
   ├── 3. User / AI submits selection UID
   │      └── adapter calls InteractionController.respond(interactionId, { selected: [uid] })
   │
   ├── 4. Engine validates candidate against legal set
   │      ├── [INVALID] Reject response; request remains WAITING_FOR_PLAYER
   │      └── [VALID] Mark RESOLVED; resolve Promise with selection
   │
   └── 5. Engine resumes execution with resolved target
```

---

## 5. Architectural Quality Assessment

### 5.1 Duplicated Logic Identified
1. **Target Selection Filtering:** Basic filtering was historically replicated across certain opcode handlers. Phase 4D centralized this into `engine/selectors.js:queryCandidates`.
2. **Core Movement:** Core movement was previously manipulated directly on stack objects. This has been unified through `engine/zones.js:moveCore`, ensuring global conservation.

### 5.2 Compatibility Layers
1. **`engine/prompt_manager.js`:** Bridges modern `InteractionController` requests to legacy test harnesses expecting synchronous prompt callbacks. This layer is fully functional and regression-tested.
2. **`engine/parameter_recovery.js`:** Dynamically reconstructs missing parameters in legacy IR clauses by re-parsing raw clause text. Ensures backward compatibility with older IR shards.

### 5.3 Integration Health
- **Engine Core:** 100% integrated.
- **Opcode Library:** All 288 unique opcodes have handlers registered in `engine/ops/index.js`.
- **Browser Arena Integration:** 100% verified without synthetic DOM state injection.
