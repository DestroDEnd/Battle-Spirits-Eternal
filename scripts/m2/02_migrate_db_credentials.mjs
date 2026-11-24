/**
 * scripts/m2/02_migrate_db_credentials.mjs
 * Migrates existing SQLite database records to remove raw auth tokens from state_json
 * and event payload_json while preserving all game state, zones, clocks, and events.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scrubCredentials } from '../../engine/state_serialization.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../battle_spirits.db');

export function migrateDatabase(targetDbPath = dbPath) {
  console.log(`[WP-A6] Starting database credential migration on: ${targetDbPath}`);
  const db = new DatabaseSync(targetDbPath);

  let migratedSessionsCount = 0;
  let migratedEventsCount = 0;

  // 1. Migrate match_sessions state_json
  const sessionRows = db.prepare('SELECT id, state_json FROM match_sessions').all();
  console.log(`[WP-A6] Found ${sessionRows.length} match_sessions records to inspect.`);

  const updateSessionStmt = db.prepare('UPDATE match_sessions SET state_json = ? WHERE id = ?');

  db.exec('BEGIN TRANSACTION');
  try {
    for (const row of sessionRows) {
      if (!row.state_json) continue;

      let stateObj;
      try {
        stateObj = JSON.parse(row.state_json);
      } catch (e) {
        console.warn(`[WP-A6] Warning: Failed to parse state_json for session ${row.id}`);
        continue;
      }

      // Deep scrub credentials
      scrubCredentials(stateObj);

      const scrubbedJson = JSON.stringify(stateObj);
      if (scrubbedJson !== row.state_json) {
        updateSessionStmt.run(scrubbedJson, row.id);
        migratedSessionsCount++;
      }
    }

    // 2. Migrate match_events payload_json
    const eventRows = db.prepare('SELECT id, payload_json FROM match_events').all();
    console.log(`[WP-A6] Found ${eventRows.length} match_events records to inspect.`);

    const updateEventStmt = db.prepare('UPDATE match_events SET payload_json = ? WHERE id = ?');

    for (const row of eventRows) {
      if (!row.payload_json) continue;

      let payloadObj;
      try {
        payloadObj = JSON.parse(row.payload_json);
      } catch (e) {
        continue;
      }

      scrubCredentials(payloadObj);
      const scrubbedPayload = JSON.stringify(payloadObj);
      if (scrubbedPayload !== row.payload_json) {
        updateEventStmt.run(scrubbedPayload, row.id);
        migratedEventsCount++;
      }
    }

    db.exec('COMMIT');
    console.log(`[WP-A6] Migration committed successfully.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(`[WP-A6] Migration failed and rolled back:`, err);
    throw err;
  }

  // 3. Post-migration verification
  const verifySessionRows = db.prepare('SELECT id, state_json FROM match_sessions').all();
  let remainingSessionLeaks = 0;
  for (const r of verifySessionRows) {
    if (r.state_json && (r.state_json.includes('authToken') || r.state_json.includes('player1Token') || r.state_json.includes('player2Token'))) {
      remainingSessionLeaks++;
    }
  }

  const verifyEventRows = db.prepare('SELECT id, payload_json FROM match_events').all();
  let remainingEventLeaks = 0;
  for (const r of verifyEventRows) {
    if (r.payload_json && (r.payload_json.includes('authToken') || r.payload_json.includes('player1Token') || r.payload_json.includes('player2Token'))) {
      remainingEventLeaks++;
    }
  }

  console.log(`[WP-A6] Migrated sessions: ${migratedSessionsCount}`);
  console.log(`[WP-A6] Migrated events: ${migratedEventsCount}`);
  console.log(`[WP-A6] Remaining session leaks: ${remainingSessionLeaks}`);
  console.log(`[WP-A6] Remaining event leaks: ${remainingEventLeaks}`);

  if (remainingSessionLeaks > 0 || remainingEventLeaks > 0) {
    throw new Error(`Migration verification failed: Found ${remainingSessionLeaks} session leaks and ${remainingEventLeaks} event leaks.`);
  }

  db.close();
  return {
    migratedSessionsCount,
    migratedEventsCount,
    remainingSessionLeaks,
    remainingEventLeaks
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateDatabase();
}
