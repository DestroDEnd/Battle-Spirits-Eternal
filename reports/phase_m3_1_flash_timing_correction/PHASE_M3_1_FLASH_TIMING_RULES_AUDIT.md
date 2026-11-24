# PHASE M.3.1 — FLASH TIMING RULES AUDIT
## Authoritative Rules Audit based on Battle Spirits Eternal Rule Manual Version 17.0

**Reference Document:** Official Battle Spirits Rule Manual (Ver. 17.0)  
**URL:** `https://asia-en.battlespirits.com/rule/`  
**Report ID:** `PHASE-M3.1-RULES-001`  

---

## 1. Introduction

A key issue identified in the legacy implementation of Battle Spirits Eternal was the conflation of **Flash** (the effect category/timing designation) with **Flash Timing** (the structured priority-driven window during battles).

This report establishes the authoritative rules basis from the official Version 17.0 Rule Manual, detailing the exact timing scope, priority rules, and card-specific overrides.

---

## 2. Rule Manual Citations & Analysis

### 2.1 Flash Definition (Manual Page 78)
> **Flash (フラッシュ):**  
> *"An effect that can be used during your Main Step, or during either player's Flash Timing in battle."*

**Key Takeaways:**
1. Flash is **not** exclusive to the Attack Step.
2. A generic Flash effect inherently possesses two distinct legal windows:
   - **Controller's Main Step** (active player).
   - **Battle Flash Timing** (either player's attack step).
3. The existence of Flash Timing in battle does not erase or override the permission to use Flash during the Main Step.

---

### 2.2 Main Step Actions & Timing (Manual Pages 24–26)
> **Main Step Procedure:**  
> During the Main Step, the active player (turn player) can perform any of the following actions repeatedly in any order, provided they can pay the required costs:
> 1. Summon Spirits / Ultimates.
> 2. Deploy Nexuses.
> 3. Cast Magic cards (using their [Main] or [Flash] effects).
> 4. Activate [Main] or [Flash] abilities on Spirits, Ultimates, or Nexuses.
> 5. Move cores between cards and/or Reserve.
> 6. Use keyword effects permitted in Main Step (e.g., [Change], [Accel]).

**Key Rules Applied:**
- **No Response Window in Main Step:** The non-active player has no priority to take actions during the active player's Main Step unless an effect explicitly states otherwise.
- **Sequential Actions:** The active player retains priority after resolving a Flash effect in the Main Step, and may continue taking other Main Step actions.
- **Magic Card Choice:** If a Magic card has both [Main] and [Flash] effects, the controller selects which section to resolve upon paying its cost.

---

### 2.3 Battle Sequence & Flash Timing (Manual Pages 28–31)
> **Attack Step Flow:**  
> 1. Attack Declaration Step (Turn player exhausts a Spirit/Ultimate to attack).
> 2. Flash Timing 1 (First Flash Timing).
> 3. Block Declaration Step (Defending player may declare a block).
> 4. Flash Timing 2 (Second Flash Timing — only if a block was declared).
> 5. Battle Resolution Step (BP Comparison if blocked; Life Damage if unblocked).
> 6. End of Battle.

> **Flash Usage Rules (Manual Page 31):**  
> - **First Priority:** The defending player always receives the first opportunity to activate a Flash effect during both Flash Timing 1 and Flash Timing 2.
> - **Alternation:** Once the active player/defender resolves an effect, priority passes to the other player.
> - **Passing:** A player may choose to pass their priority. Passing once does not permanently surrender the opportunity; if the opposing player subsequently uses a Flash effect, priority returns to the player who previously passed.
> - **Window Closure:** The Flash Timing window ends strictly when **both players pass consecutively**.
> - **Non-Interruption:** Flash effects cannot interrupt the execution of an already-resolving effect. Any triggered effects (e.g., When Attacks, When Blocks) must fully resolve before Flash Timing opens.

---

## 3. Categorization of Timing Qualifiers

Card texts often specify timing qualifiers that narrow generic Flash availability:

| Qualifier String | Japanese Equivalent | Legal Steps | Turn Player Condition | Battle Clash Required? |
|---|---|---|---|---|
| *None (Generic)* | 【フラッシュ】 | MAIN, ATTACK | Active (Main); Either (Attack) | No in Main; Yes in Attack |
| `(Your Attack Step)` | 自分のアタックステップ | ATTACK only | Controller is attacking | Yes |
| `(Opponent's Attack Step)` | 相手のアタックステップ | ATTACK only | Controller is defending | Yes |
| `(Either Attack Step)` | お互いのアタックステップ | ATTACK only | Either attacking or defending | Yes |
| `During Attack` | アタック中 | ATTACK only | Either attacking or defending | Yes (active combat clash) |
| `(When Attacks) Flash` | アタック時フラッシュ | ATTACK only | Event triggered upon attack | Yes (automatic trigger) |
| `During Flash Timing only` | フラッシュタイミングのみ | ATTACK only | Either attacking or defending | Yes (battle window only) |

---

## 4. Synthesis & Correct Engine Behavior

1. **Active Player in Main Step:**
   - Any card with a generic Flash effect is available.
   - Any card with an explicit Attack Step qualifier is **illegal** and rejected.
2. **Defending Player in Main Step:**
   - Always **illegal** (`NOT_ACTIVE_PLAYER`).
3. **During Battle Flash Timing:**
   - Generic Flash effects are available to both players.
   - Qualified Flash effects are available only if the player matches the turn condition (`Your Attack Step` vs `Opponent's Attack Step`).
4. **Resolution Isolation:**
   - Resolving a Flash effect in Main Step simply executes the clauses and updates game state; it does not trigger window creation.
