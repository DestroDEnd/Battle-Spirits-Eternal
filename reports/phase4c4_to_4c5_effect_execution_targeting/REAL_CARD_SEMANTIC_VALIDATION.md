# Real-Card Semantic Validation Report (Phase 4C.4 – 4C.5)

**Suite**: `tests/real_card_semantic_validation.test.js`  
**Verified Result**: **42 / 42 passing** (loaded directly from `data/ir_shards/` and `data/cards_detailed.json`).

## Coverage Summary

- **42 real compiled card abilities** across **10 IR shards** (`SD01`, `BS01`, `BS02`, `BS03`, `BS10`, `BS24`, `BS38`, `BS52`, `SD51`, etc.).
- **All 6 colors**: Red, Purple, Green, White, Yellow, Blue.
- **Card types**: Spirit, Magic, Nexus, Brave.
- **Timings**: `MAIN`, `FLASH`, `WHEN_SUMMONED`, `WHEN_ATTACKS`, `WHEN_BLOCKS`, `WHEN_DESTROYED`, `PASSIVE`, `ATTACK_STEP`, `MAIN_STEP`, `TURN_TRIGGER`.
- **Operations verified with state-mutation assertions**:
  - `DRAW` (`SD01-034`, `SD01-012`, `SD01-027`, `BS01-034`)
  - `MOVE_CORE` (`BS01-061`, `BS01-129`)
  - `BP_BUFF` / `BP_DEBUFF` (`BS01-077`, `SD01-036`, `SD01-023`, `SD01-028`, `BS01-060`, `BS38-074`)
  - `DESTROY` (`BS38-008`, `BS01-125`, `BS01-011`)
  - `BOUNCE` (`SD01-026`, `SD01-021`)
  - `REFRESH` / `EXHAUST` (`SD01-024`, `BS01-059`, `BS02-066`, `BS02-X06`, `BS03-127`, `BS10-068`, `BS10-025`)
  - `DISCARD_HAND` (`SD01-031`, `BS01-062`, `BS01-056`)
  - `MILL_DECK` (`BS03-116`, `BS03-076`, `BS03-115`, `BS03-X12`, `BS10-054`)
  - `GRANT_FAMILY` (`BS02-082`, `BS02-064`)
  - `ADD_SYMBOL` (`BS24-030`, `BS52-056`)
  - `RECOVER_LIFE` (`BS24-043`, `BS38-064`)
  - `SET_RESTRICTION` (`BS01-018`)
  - `IMMUNITY` & Physical Ability ID Integrity (`SD01-020`, `BS01-033`, `SIEGWURM-NOVA`)

## Real-Card Bug Discoveries & Fixes

Running real compiled IR cards surfaced two genuine runtime bugs that were fixed and verified:
1. `DISCARD_HAND` (`engine/ops/index.js`): Previously ignored `op.target?.side` / `op.side` and omitted `allowOpponentHand: true`, preventing opponent hand discard effects (`SD01-031`, `BS01-062`, `BS01-056`).
2. `BP_BUFF` (`engine/ops/index.js`): Previously ignored `op.all` / `op.targetGroup === 'ALL_FRIENDLY'` and fell back to `selfStack.id` without `targetFilter`, preventing group passive/active BP buffs (`SD01-023`, `BS01-060`).
