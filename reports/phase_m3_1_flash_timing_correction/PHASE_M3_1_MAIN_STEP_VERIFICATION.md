# PHASE M.3.1 — MAIN STEP VERIFICATION REPORT
## Validation of Flash Availability and Action Authority in Controller's Main Step

**Report ID:** `PHASE-M3.1-MAIN-004`  
**Test Suite:** `tests/phase_m3_1_flash_general_availability.test.js`, `tests/phase_m3_1_flash_regression.test.js`  
**Arena Module:** `battle_arena.js`  

---

## 1. Objectives & Scope

The primary defect corrected in Phase M.3.1 was the blanket rejection of Flash effects during the Main Step. This report documents the rigorous verification of all Main Step Flash interactions:
1. Generic Flash Magic cards played from hand.
2. Dual-timing Magic cards offering both Main and Flash options.
3. Generic Flash Spirit / Nexus abilities activated from the field.
4. Generic Flash Accel cards activated from hand.
5. Strict rejection of qualified Flash effects restricted to the Attack Step.
6. Rejection of non-active player activation attempts during opponent Main Step.
7. Verification that Main Step Flash activations do not create artificial response windows or pass priority.

---

## 2. Test Execution & Results

### 2.1 Generic Flash Magic from Hand
- **Test Case:** `PHASE-M3.1-GEN-01`
- **Result:** **PASSED** (24.7ms)
- **Behavior:** The active player successfully cast *Generic Flash Surge* (Cost 2) during their Main Step. The cost was deducted from reserve, BP buff effect resolved, and the card moved to the graveyard (`grave`).

### 2.2 Generic Flash Spirit Ability from Field
- **Test Case:** `PHASE-M3.1-GEN-02`
- **Result:** **PASSED** (1.4ms)
- **Behavior:** *Flash Knight* on field activated its `phy_knight_draw` ability during the controller's Main Step. 1 card was drawn into hand successfully.

### 2.3 Generic Flash Accel from Hand
- **Test Case:** `PHASE-M3.1-GEN-03`, `tests/accel_mechanics.test.js: Test 7`
- **Result:** **PASSED** (1.3ms, 20.9ms)
- **Behavior:** Active player executed *Accel Scout* (Cost 1) during Main Step. Effect resolved, 1 card was drawn, and the card was moved face-up to `removed` zone with `isAccelRemoved = true` and `canSummonFromRemoved = true`.

### 2.4 Dual-Timing Magic Card Selection
- **Test Case:** `PHASE-M3.1-REG-01`
- **Result:** **PASSED** (54.6ms)
- **Behavior:**
  - When played with `{ timing: 'MAIN' }`, resolved the Main effect (drew 2 cards).
  - When played with `{ timing: 'FLASH' }`, resolved the Flash effect (applied +3000 BP).

### 2.5 Rejection of Attack-Step-Restricted Flash in Main Step
- **Test Cases:** `PHASE-M3.1-SPEC-01`, `PHASE-M3.1-SPEC-02`, `PHASE-M3.1-SPEC-03`, `PHASE-M3.1-SPEC-06`
- **Result:** **ALL PASSED**
- **Behavior:**
  - Cards specifying `(Your Attack Step)` in Main Step -> Rejected with `RESTRICTED_TO_ATTACK_STEP`.
  - Cards specifying `(Opponent's Attack Step)` in Main Step -> Rejected with `RESTRICTED_TO_ATTACK_STEP`.
  - Cards specifying `(Either Attack Step)` in Main Step -> Rejected with `RESTRICTED_TO_ATTACK_STEP`.
  - Cards specifying `During Flash Timing only` in Main Step -> Rejected with `RESTRICTED_TO_ATTACK_STEP`.

### 2.6 Non-Active Player Protection
- **Test Case:** `PHASE-M3.1-GEN-04`
- **Result:** **PASSED** (0.4ms)
- **Behavior:** Opponent attempting to cast a Flash card during player's Main Step was rejected with `NOT_ACTIVE_PLAYER`.

### 2.7 No Artificial Response Window Creation
- **Test Case:** `PHASE-M3.1-GEN-06`
- **Result:** **PASSED** (0.9ms)
- **Behavior:** Controller played two Flash cards in sequence during Main Step. Zero response windows were opened in `game.state.responseWindows`, and active player priority remained with the turn player.

---

## 3. Client UI Verification (`battle_arena.js`)

In the arena client:
- `canPlayCardInCurrentPhase(card, 'player')` returns `true` for Magic cards with generic Flash in Main Step.
- `renderPlayerHand` displays:
  - `⚡ Flash (Cost)` button for generic Flash magic cards in Main Step.
  - Dual `📜 Main (Cost)` and `⚡ Flash (Cost)` buttons side-by-side for cards with both timings.
- Accel cards with generic Flash display `⚡ Accel (Cost)` during Main Step.
- Cards with explicit Attack Step qualifiers do not display Flash action buttons in Main Step, avoiding UI confusion.
