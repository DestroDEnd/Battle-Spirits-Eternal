# Battle Spirits Eternal (BSP) — Phase M: Session Persistence Report

**Date:** 2026-11-22  
**Milestone:** Phase M Work Package B & C: Persistent Match Storage & Complete Engine Restoration  
**Auditor:** Antigravity Autonomous Systems Engineering Team  
**Repository:** `C:\Users\namis\Downloads\BSP`

---

## 1. Overview & Objectives

Work Packages B and C mandate that Battle Spirits Eternal battles survive:
1. Web browser page refresh (`arena.html`).
2. Inter-page website navigation (to Keyword Database, Card Database, Deck Builder, and back).
3. Browser tab and window closures.
4. Long-duration dual player disconnections (hours or days).
5. Recoverable server restarts.
6. Interruption at every resolver state without effect duplication, core loss, or dropped prompts.

This report documents the persistence schema, serialization model, restoration engine, and deterministic verification results.

---

## 2. Database Schema Specification

All persistent state is stored in SQLite (`battle_spirits.db`) using Node 24 `node:sqlite DatabaseSync` with WAL journaling enabled:

```sql
CREATE TABLE IF NOT EXISTS match_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  player1_id TEXT NOT NULL,
  player1_name TEXT NOT NULL,
  player1_control TEXT NOT NULL,
  player1_token_hash TEXT NOT NULL,
  player1_connected INTEGER DEFAULT 0,
  player2_id TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player2_control TEXT NOT NULL,
  player2_token_hash TEXT NOT NULL,
  player2_connected INTEGER DEFAULT 0,
  state_json TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  active_player TEXT DEFAULT 'player',
  turn_number INTEGER DEFAULT 1,
  phase TEXT DEFAULT 'START',
  winner_id TEXT DEFAULT NULL,
  finish_reason TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_action_id TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS match_clocks (
  match_id TEXT PRIMARY KEY,
  active_player TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  turn_duration_ms INTEGER DEFAULT 240000,
  turn_start_ms INTEGER NOT NULL,
  deadline_ms INTEGER NOT NULL,
  remaining_ms INTEGER NOT NULL,
  paused INTEGER DEFAULT 0,
  pause_reason TEXT,
  accumulated_pause_ms INTEGER DEFAULT 0,
  last_tick_ms INTEGER NOT NULL,
  warning_threshold_ms INTEGER DEFAULT 60000,
  timeout_processed INTEGER DEFAULT 0,
  FOREIGN KEY(match_id) REFERENCES match_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(match_id) REFERENCES match_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_actions (
  action_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(match_id) REFERENCES match_sessions(id) ON DELETE CASCADE
);
```

---

## 3. Engine Restoration Invariants

The restoration engine in `engine/state_serialization.js` guarantees the following behavioral invariants upon restoring a match snapshot:

1. **Exact Turn and Phase Continuity**: Turn number, active player side, and phase step (`START`, `CORE`, `DRAW`, `REFRESH`, `MAIN`, `ATTACK`, `END`) are restored precisely.
2. **Complete Core Pool Conservation**: Life cores, reserve cores (normal and soul), trash cores, field stack cores, and void cores are fully preserved. Total player cores sum to the exact invariant total.
3. **Card Instance Identity**: All cards retain unique instance IDs (`inst_*`), zone locations, face-up/down orientations, and level configurations.
4. **Pending Interaction Survival**: Any active `createInteractionRequest` awaiting a player response survives serialization and deserialization with its legal candidates, selection constraints, and decision owner intact.
5. **Zero Effect Duplication**: Previously completed effects, card movements, or life reductions are not repeated on restoration.
6. **Continuation Descriptors**: Suspended multi-step card effects preserve their `resolverContinuation` descriptor (`sourceCardId`, `abilityId`, `effectId`, `nextOpIndex`, `executedOps`), resuming from the remaining unexecuted operations.

---

## 4. Test Evidence & Scenarios

Tested deterministically in `tests/phase_m_session_persistence.test.js`:

| Test ID | Scenario Tested | Outcome | Evidence |
|---|---|---|---|
| `TC-M-P01` | Match creation, serialization, and deserialization | ✔ PASS | Reconstituted state properties match original exactly |
| `TC-M-P02` | Leave arena to Keyword Database and reconnect | ✔ PASS | Status remains active; turn number preserved |
| `TC-M-P03` | Navigate to Deck Builder & Card DB and return | ✔ PASS | Active battle persists in list; reconnected seamlessly |
| `TC-M-P04` | 48-hour dual disconnection simulation | ✔ PASS | Clock paused at 195s; resumed at 195s after 2 days |
| `TC-M-P05` | Full manager recreation (server restart) | ✔ PASS | State restored with mutated life, cores, and turn number |
| `TC-M-P06` | Save & restore pending target selection interaction | ✔ PASS | Candidates, constraints, and mandatory status restored |
| `TC-M-P07` | Save & restore optional confirmation interaction | ✔ PASS | Optional flag and decision owner preserved |
| `TC-M-P08` | Interrupted resolver continuation restoration | ✔ PASS | Next op index and executed ops preserved without double-execution |
| `TC-M-P09` | Uninterrupted vs Interrupted-and-Restored comparison | ✔ PASS | Identical field, life, core, and restriction generation values |

All 9 test cases passed with 0 failures.
