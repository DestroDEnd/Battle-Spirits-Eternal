# PHASE M4 — LEGACY & ENGINE SYNCHRONIZATION

## 1. Root Causes Found

1. **`engine/legacy_bridge.js` (`createEngineStateFromLegacy` / `syncEngineStateToLegacy`):**
   - `createEngineStateFromLegacy` populated `player.nexus` AND also pushed every Nexus from `legacy.nexus` / `legacy.nexusCards` as a stack into `player.field`. Every Nexus existed in two distinct engine zones simultaneously, causing duplicate-instance validation failures in `validateTargetAvailability` and cross-zone candidate ambiguity.
   - `syncEngineStateToLegacy` only synced Nexuses from `enginePlayer.field` and ignored `enginePlayer.nexus`.
2. **`engine/state_serialization.js` (`serializePlayerState` / `revivePlayer`):**
   - `revealed` and `openCards` were omitted during state serialization and revival, dropping revealed/open zone cards across persistent saves, snapshots, and reconnects.

## 2. Corrections Implemented

- **`engine/legacy_bridge.js`:**
  - `createEngineStateFromLegacy` now initializes `player.nexus = []` and stores each field Spirit/Ultimate/Nexus once as a stack in `player.field`.
  - `syncEngineStateToLegacy` syncs Nexuses from `enginePlayer.field` and also merges any entries from `enginePlayer.nexus` without duplication.
- **`engine/state_serialization.js`:**
  - Added `revealed` and `openCards` to both `serializePlayerState` and `revivePlayer`.
