# Phase 2 — Magic Card-Type Classification & Action Legality Audit

## 1. Canonical Card-Type Classification Contract (`engine/card_types.js`)

All 9 canonical card types present in `battle_spirits.db` are classified by `classifyCardType(cardOrType)` into three authoritative pathways (`ACTION_PATHWAYS`):

| Pathway | Permitted Canonical Types | Rejected Types |
|---|---|---|
| `SUMMON` | `Spirit`, `Contract Spirit`, `Token Spirit`, `Ultimate`, `Contract Ultimate`, `Brave` | `Magic`, `Nexus`, `Contract Nexus`, `UNKNOWN` |
| `DEPLOY_NEXUS` | `Nexus`, `Contract Nexus` | `Magic`, `Spirit`, `Contract Spirit`, `Token Spirit`, `Ultimate`, `Contract Ultimate`, `Brave`, `UNKNOWN` |
| `ACTIVATE_MAGIC` | `Magic` | `Spirit`, `Contract Spirit`, `Token Spirit`, `Ultimate`, `Contract Ultimate`, `Brave`, `Nexus`, `Contract Nexus`, `UNKNOWN` |

## 2. Multi-Layer Legality Enforcement

1. **Action Authority Gatekeeper (`engine/action_authority.js`)**:
   - `SUMMON` -> `validateCardPathway(targetCard, ACTION_PATHWAYS.SUMMON)` (HTTP 400 `INVALID_CARD_TYPE` on Magic/Nexus).
   - `DEPLOY_NEXUS` -> `validateCardPathway(targetCard, ACTION_PATHWAYS.DEPLOY_NEXUS)`.
   - `ACTIVATE_MAGIC` / `CAST_MAGIC` / `CAST_FLASH_MAGIC` -> `validateCardPathway(targetCard, ACTION_PATHWAYS.ACTIVATE_MAGIC)` (HTTP 400 `INVALID_CARD_TYPE` on Spirit/Nexus).
2. **Core Engine Facade (`engine/index.js`)**:
   - Dedicated methods `game.summonUnit()`, `game.deployNexus()`, and `game.activateMagic()` enforce `options.pathway` before `payCost()` or any zone/state mutation.
   - `playCard()` rejects mismatched options (`braveTargetStackId` on non-Brave, `cores` on non-Unit) before payment.
3. **Session Manager (`engine/session_manager.js`)**:
   - `SUMMON`, `DEPLOY_NEXUS`, `ACTIVATE_MAGIC`, and `CAST_MAGIC` route exclusively through their respective canonical engine pathways.
4. **Browser Arena UI (`battle_arena.js`)**:
   - `summonCard()`, `openSummonModal()`, and `checkCardFreeSummonEligibility()` reject non-Unit cards (`Magic`, `Nexus`, `Contract Nexus`) immediately.
   - `deployNexus()` rejects non-Nexus cards; `castMagic()` rejects non-Magic cards.
