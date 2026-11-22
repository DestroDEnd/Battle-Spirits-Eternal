# KEYWORD INTERACTION GAPS REPORT

## Overview
This report catalogs unverified, untested, and fragile cross-keyword interactions within the current BSP engine.

### 1. Armor vs. Piercing Rule / Lose Immunity
- **Finding**: In `engine/continuous.js:658`, `Ultra Heavy Armor` is omitted from `isArmorFamily`. Under `PIERCING_RULE`, normal protections are bypassed while Armor-named effects are preserved. Because Ultra Heavy Armor is missing from the whitelist, it is completely ignored.
- **Affected Keywords**: Ultra Heavy Armor, Knight Armor, Contract Armor, Count Armor, Aurora Armor, PS Armor, VPS Armor, TP Armor, MD Armor.

### 2. Destruction Triggers on Attacking Keywords
- **Finding**: In `engine/keywords/registry.js:115`, the `DESTROYED` event handler filters active keywords using `{ timing: 'WHEN_DESTROYED' }`. Keywords that are printed as attack abilities (e.g. `[LV1][LV2] (When Attacks) [True-Curse]`) have header timing `WHEN_ATTACKS`, causing them to be silently dropped on destruction.
- **Affected Keywords**: True-Curse, Grudging Curse.

### 3. Combat Declaration Conflicts (Clash + Consecutive Blade + Showdown)
- **Finding**: `Clash` sets `mustBlockIfAble = true`. `Consecutive Blade` sets `requiredBlockerCount = 2`. `Showdown` sets `showdownDuel = true`. If a card holds both Clash and Showdown, or Consecutive Blade, the engine has no priority arbitration for blocker count vs duel constraints.
- **Affected Keywords**: Clash, Consecutive Blade, Showdown, True-Clash.

### 4. Multiple Replacement Effects & Standby Lifecycles
- **Finding**: When a Spirit with an exit replacement effect (e.g. `Rebirth`, `Immortality`) is targeted for destruction by an effect, `stageStackStandby` sets a single `standby` object. Coexisting replacement effects overwrite the standby property without an arbitration queue.
- **Affected Keywords**: Rebirth, Immortality, True-Curse.

### 5. Multi-Bracket Extraction Collision
- **Finding**: When bracketed keywords contain internal colons without spaces (e.g. `[Type: Driver]`, `[Type: Song]`), `extractKeywords` splits on the first colon, corrupting the keyword name into `"Type"`.
- **Affected Keywords**: Type: Driver, Type: Song, Type: Field, Type: Flower, Type: Vision.
