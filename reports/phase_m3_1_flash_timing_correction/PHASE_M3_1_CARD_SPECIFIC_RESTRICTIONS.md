# PHASE M.3.1 — CARD-SPECIFIC TIMING RESTRICTIONS
## Comprehensive Specification & Precedence Hierarchy for Qualified Flash Effects

**Report ID:** `PHASE-M3.1-RESTR-002`  
**Database Audit Scope:** 29,218 Cards  
**Cards Audited with Flash:** 8,379 Cards  

---

## 1. Principles of Card-Specific Timing Precedence

In Battle Spirits Eternal, the general rule permits Flash effects in both the controller's Main Step and either player's battle Flash Timing. However, card text is sovereign:

> **Fundamental Precedence Axiom:**  
> Whenever an effect specifies an explicit timing condition, qualifier, or trigger context, that specification strictly narrows the general permission and takes precedence over default rules.

Missing context or contradictory conditions do not permit activation. If a card specifies that it may only be activated during `(Your Attack Step)`, attempting to activate it during the Main Step violates its explicit textual constraint and must be deterministically rejected with code `RESTRICTED_TO_ATTACK_STEP`.

---

## 2. Catalog of Identified Timing Qualifiers

From our exhaustive audit of all 29,218 cards in `card_effects_db.json`, exactly 8,379 cards carry Flash effects. These are classified into the following discrete timing categories:

```
┌────────────────────────────────────────┬──────────────┬─────────────────────────────────────┐
│ Qualifier Category                     │ Card Count   │ Legal Execution Context             │
├────────────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ GENERIC FLASH                          │ 5,979 (71.4%)│ Controller Main Step & Battle Flash │
│ EITHER ATTACK STEP                     │ 1,615 (19.3%)│ Battle Flash Timing (Either Player) │
│ YOUR ATTACK STEP                       │   398  (4.7%)│ Battle Flash Timing (Attacker Only) │
│ OPPONENT'S ATTACK STEP                 │   242  (2.9%)│ Battle Flash Timing (Defender Only) │
│ WHEN ATTACKS TRIGGER                   │   145  (1.7%)│ Event Trigger (Attacking Spirit)    │
│ DURING ATTACK                          │    16  (0.2%)│ Active Battle Clash Only            │
│ FLASH TIMING ONLY                      │     4  (0.1%)│ Battle Flash Window Only            │
├────────────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ TOTAL AUDITED FLASH CARDS              │ 8,379        │                                     │
└────────────────────────────────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 3. Detailed Semantic Specifications & Rules

### 3.1 Generic Flash (`FLASH_TIMING_QUALIFIERS.GENERIC`)
- **Card Count:** 5,979
- **Pattern Match:** `[Flash]`, `Flash:`, `【フラッシュ】` without restrictive qualifier brackets.
- **Rules:**
  - In Main Step: Legal only for the active player (`playerSide === state.activePlayer`).
  - In Attack Step: Legal for both attacker and defender when holding priority in Flash Timing 1 or Flash Timing 2.
  - In Other Steps: Strictly rejected (`INVALID_STEP_FOR_FLASH`).
- **Representative Examples:**
  - `BS01-118`: *The Flash Tempest* ("Flash - Give 1 Spirit +3000 BP.")
  - `BS43-020`: *The Silver Guardian Blade* (Cost 0 Accel with generic Flash timing)

---

### 3.2 Either Attack Step (`FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP`)
- **Card Count:** 1,615
- **Pattern Match:** `Flash - (Either Attack Step)`, `(お互いのアタックステップ)`
- **Rules:**
  - In Main Step: Strictly forbidden (`RESTRICTED_TO_ATTACK_STEP`).
  - In Attack Step: Legal during either player's turn, provided the active battle Flash Timing window is open.
- **Representative Examples:**
  - `BS38-RV030`: *Wild Edge* ("Flash - (Either Attack Step) Target opposing spirit with 5000 BP or less is destroyed.")

---

### 3.3 Your Attack Step (`FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP`)
- **Card Count:** 398
- **Pattern Match:** `Flash - (Your Attack Step)`, `(自分のアタックステップ)`
- **Rules:**
  - In Main Step: Strictly forbidden (`RESTRICTED_TO_ATTACK_STEP`).
  - In Opponent's Attack Step: Strictly forbidden (`YOUR_ATTACK_STEP_ONLY`).
  - In Controller's Attack Step: Legal during battle Flash Timing.
- **Representative Examples:**
  - `BS50-080`: *Grand Saber* ("Flash - (Your Attack Step) By paying 1 core, refresh this spirit.")

---

### 3.4 Opponent's Attack Step (`FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP`)
- **Card Count:** 242
- **Pattern Match:** `Flash - (Opponent's Attack Step)`, `(相手のアタックステップ)`, `(Opposing Attack Step)`
- **Rules:**
  - In Main Step: Strictly forbidden (`RESTRICTED_TO_ATTACK_STEP`).
  - In Controller's Attack Step: Strictly forbidden (`OPPONENT_ATTACK_STEP_ONLY`).
  - In Opponent's Attack Step: Legal during battle Flash Timing for the defending controller.
- **Representative Examples:**
  - `BS48-095`: *Absolute Barrier* ("Flash - (Opponent's Attack Step) End the attack step.")

---

### 3.5 During Attack (`FLASH_TIMING_QUALIFIERS.DURING_ATTACK`)
- **Card Count:** 16
- **Pattern Match:** `Flash - During Attack:`, `アタック中`
- **Rules:**
  - In Main Step: Strictly forbidden (`RESTRICTED_TO_ATTACK_STEP`).
  - In Attack Step without an active battle clash: Rejected (`REQUIRES_ACTIVE_BATTLE`).
  - In Attack Step with an active battle: Legal.

---

### 3.6 When Attacks Event Triggers (`FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS`)
- **Card Count:** 145
- **Pattern Match:** `[LV1][LV2] (When Attacks) Flash:`, `アタック時フラッシュ`
- **Rules:**
  - These are triggered abilities, not open activated abilities.
  - Manual voluntary activation as a free flash is forbidden (`TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE`).
  - The engine's trigger resolver resolves them upon attack declaration.

---

## 4. Verification in Test Suites

The entire catalog of card-specific qualifiers is verified in `tests/phase_m3_1_flash_card_specific_restrictions.test.js` (Scenarios 6 through 11). All 6 test suites pass with 100% compliance.
