# PHASE M.3.2 FLASH TIMING RULES REPORT
## Authoritative Rules Implementation per Battle Spirits Eternal Official Rule Manual v17.0

- **Module**: `engine/flash_timing.js`, `compiler/header_parser.js`
- **Rule Source**: Battle Spirits Eternal Rule Manual v17.0 (Pages 16–17, 24–26, 28–31, 78)
- **Test Suite**: `tests/phase_m3_2_flash_timing_validation.test.js`
- **Date**: 2026-11-23

---

### 1. Distinction: Flash Effect vs. Flash Timing

The engine now cleanly differentiates between:

1. **A Flash Effect (`isFlash: true`)**: An effect marked with the Flash keyword that has permission to be activated by its controller during their Main Step, as well as during either player's Flash Timing in battle.
2. **Flash Timing (`FLASH_1` / `FLASH_2`)**: Dedicated combat response windows occurring during the Attack Step where players alternate priority to activate Flash effects.

A Flash effect used during the Main Step **does NOT** create a Flash Timing window and does not yield priority to the opponent.

---

### 2. Supported Timing Qualifiers

Card effects may impose additional timing qualifiers that restrict the general availability of Flash:

| Timing Qualifier | English Keywords | Japanese Keywords | Allowed Steps | Allowed Turn Owners | Requires Battle |
|---|---|---|---|---|---|
| `GENERIC` | `Flash:`, `[Flash]` | `【フラッシュ】` | `MAIN`, `ATTACK` | Controller in Main; Either in Attack | No |
| `YOUR_ATTACK_STEP` | `(Your Attack Step)` | `自分のアタックステップ` | `ATTACK` | Controller (`SELF`) | Yes (Flash window) |
| `OPPONENTS_ATTACK_STEP` | `(Opponent's Attack Step)` | `相手のアタックステップ` | `ATTACK` | Opponent (`OPPONENT`) | Yes (Flash window) |
| `EITHER_ATTACK_STEP` | `(Either Attack Step)` | `お互いのアタックステップ` | `ATTACK` | `SELF`, `OPPONENT` | Yes (Flash window) |
| `DURING_ATTACK` | `During Attack` | `アタック中` | `ATTACK` | `SELF`, `OPPONENT` | Yes (Active clash) |
| `WHEN_ATTACKS` | `(When Attacks) Flash` | `アタック時【フラッシュ】` | `ATTACK` | `SELF` (Triggered) | Yes (On attack) |
| `FLASH_TIMING_ONLY` | `During Flash Timing only` | `フラッシュタイミングのみ` | `ATTACK` | Either in battle Flash Timing | Yes (Flash window) |

---

### 3. Rules Matrix Verification

All timing permutations are verified in `tests/phase_m3_2_flash_timing_validation.test.js`:

1. **Main Step Generic Flash (`M3.2-L3-01`)**:
   - Magic: Controller playing generic Flash magic from hand during Main Step is **ALLOWED**.
   - Field Ability: Spirit on field activating generic Flash ability during Main Step is **ALLOWED**.
   - Accel: Generic Flash Accel activated from hand during Main Step is **ALLOWED**.
   - Opponent Main Step: Opponent activating Flash during controller's Main Step is **REJECTED** (`NOT_ACTIVE_PLAYER`).
2. **Main Step Initiative (`M3.2-L3-02`)**:
   - Multiple Main Step Flash activations resolve sequentially without opening response windows or surrendering initiative.
3. **Card-Specific Restrictions (`M3.2-L3-03`)**:
   - Card with `(Your Attack Step)` rejected in Main Step (`RESTRICTED_TO_ATTACK_STEP`).
   - Card with `(Your Attack Step)` rejected in Opponent's Attack Step (`YOUR_ATTACK_STEP_ONLY`).
   - Card with `(Opponent's Attack Step)` rejected in Controller's Attack Step (`OPPONENT_ATTACK_STEP_ONLY`).
4. **Triggered Flash Handling (`M3.2-L3-04`)**:
   - `[LV1] (When Attacks) Flash:` rejected from manual voluntary activation with `FLASH_TRIGGERED_ABILITY_NOT_MANUAL`.
