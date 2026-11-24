/**
 * engine/session_store.js
 * 
 * Persistent Match Storage Layer for Battle Spirits Eternal (Phase M).
 * Backed by SQLite (battle_spirits.db via node:sqlite DatabaseSync) with WAL mode,
 * atomic updates, optimistic concurrency versioning, and action idempotency.
 */

import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export class SessionStore {
  constructor(options = {}) {
    this.dbPath = options.dbPath || process.env.DB_PATH || path.join(process.cwd(), 'battle_spirits.db');
    this.inMemory = Boolean(options.inMemory);
    this.db = null;
    this._initDb();
  }

  _initDb() {
    if (this.inMemory) {
      this.db = new DatabaseSync(':memory:');
      this.initSchema();
      return;
    }

    const dbDir = path.dirname(path.resolve(this.dbPath));
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
      } catch (err) {
        const fatalErr = new Error(`FATAL_STORAGE_ERROR: Failed to create database directory "${dbDir}": ${err.message}`);
        fatalErr.code = 'FATAL_STORAGE_ERROR';
        throw fatalErr;
      }
    }

    try {
      fs.accessSync(dbDir, fs.constants.W_OK);
    } catch (err) {
      const fatalErr = new Error(`FATAL_STORAGE_ERROR: Database directory "${dbDir}" is not writable: ${err.message}`);
      fatalErr.code = 'FATAL_STORAGE_ERROR';
      throw fatalErr;
    }

    try {
      this.db = new DatabaseSync(this.dbPath);
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA busy_timeout = 5000;');
      this.initSchema();
    } catch (err) {
      const fatalErr = new Error(`FATAL_STORAGE_ERROR: Could not initialize SQLite database at "${this.dbPath}": ${err.message}`);
      fatalErr.code = 'FATAL_STORAGE_ERROR';
      throw fatalErr;
    }
  }

  validateStorageHealth() {
    if (this.inMemory) {
      return {
        healthy: true,
        mode: 'in-memory',
        path: ':memory:',
        wal: false,
        writable: true
      };
    }

    try {
      if (!this.db) {
        return { healthy: false, error: 'Database instance not initialized' };
      }
      const journalModeRow = this.db.prepare('PRAGMA journal_mode;').get();
      const testStmt = this.db.prepare('SELECT 1 as alive;').get();
      if (!testStmt || testStmt.alive !== 1) {
        return { healthy: false, error: 'Sanity query failed' };
      }
      return {
        healthy: true,
        mode: 'sqlite-wal',
        path: this.dbPath,
        journalMode: journalModeRow ? journalModeRow.journal_mode : 'unknown',
        writable: true
      };
    } catch (err) {
      return {
        healthy: false,
        error: err.message
      };
    }
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS match_sessions (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        player1_id TEXT NOT NULL,
        player1_name TEXT NOT NULL,
        player1_control TEXT NOT NULL,
        player1_token_hash TEXT NOT NULL,
        player1_connected INTEGER DEFAULT 0,
        player1_last_heartbeat INTEGER DEFAULT 0,
        player2_id TEXT NOT NULL,
        player2_name TEXT NOT NULL,
        player2_control TEXT NOT NULL,
        player2_token_hash TEXT NOT NULL,
        player2_connected INTEGER DEFAULT 0,
        player2_last_heartbeat INTEGER DEFAULT 0,
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

      CREATE INDEX IF NOT EXISTS idx_match_sessions_status ON match_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_match_sessions_updated ON match_sessions(updated_at);
      CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id, seq);
      CREATE INDEX IF NOT EXISTS idx_match_actions_match ON match_actions(match_id);

      CREATE TABLE IF NOT EXISTS matchmaking_tickets (
        ticket_id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        deck_id TEXT,
        deck_json TEXT,
        status TEXT NOT NULL,
        match_id TEXT,
        auth_token TEXT,
        player_side TEXT,
        opponent_name TEXT,
        opponent_deck TEXT,
        queued_at INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        matched_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_mm_status_queued ON matchmaking_tickets(status, queued_at);
      CREATE INDEX IF NOT EXISTS idx_mm_player_status ON matchmaking_tickets(player_id, status);
    `);

    // Add heartbeat columns to existing tables if upgrading schema
    try {
      this.db.exec(`ALTER TABLE match_sessions ADD COLUMN player1_last_heartbeat INTEGER DEFAULT 0;`);
    } catch (_) {}
    try {
      this.db.exec(`ALTER TABLE match_sessions ADD COLUMN player2_last_heartbeat INTEGER DEFAULT 0;`);
    } catch (_) {}
  }

  saveSession(session) {
    const stmt = this.db.prepare(`
      INSERT INTO match_sessions (
        id, mode, status,
        player1_id, player1_name, player1_control, player1_token_hash, player1_connected, player1_last_heartbeat,
        player2_id, player2_name, player2_control, player2_token_hash, player2_connected, player2_last_heartbeat,
        state_json, version, active_player, turn_number, phase,
        winner_id, finish_reason, created_at, updated_at, last_action_id
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      session.id,
      session.mode,
      session.status,
      session.player1.id,
      session.player1.name,
      session.player1.controlType,
      session.player1.tokenHash || hashToken(session.player1.authToken),
      session.player1.connected ? 1 : 0,
      session.player1.lastHeartbeat || 0,
      session.player2.id,
      session.player2.name,
      session.player2.controlType,
      session.player2.tokenHash || hashToken(session.player2.authToken),
      session.player2.connected ? 1 : 0,
      session.player2.lastHeartbeat || 0,
      typeof session.state === 'string' ? session.state : JSON.stringify(session.state),
      session.version || 1,
      session.activePlayer || 'player',
      session.turnNumber || 1,
      session.phase || 'START',
      session.winnerId || null,
      session.finishReason || null,
      session.createdAt || Date.now(),
      session.updatedAt || Date.now(),
      session.lastActionId || null
    );

    return this.loadSession(session.id);
  }

  loadSession(matchId) {
    const stmt = this.db.prepare('SELECT * FROM match_sessions WHERE id = ?');
    const row = stmt.get(matchId);
    if (!row) return null;

    let parsedState = null;
    try {
      parsedState = JSON.parse(row.state_json);
    } catch {
      parsedState = row.state_json;
    }

    return {
      id: row.id,
      mode: row.mode,
      status: row.status,
      player1: {
        id: row.player1_id,
        name: row.player1_name,
        controlType: row.player1_control,
        tokenHash: row.player1_token_hash,
        connected: Boolean(row.player1_connected),
        lastHeartbeat: row.player1_last_heartbeat || 0
      },
      player2: {
        id: row.player2_id,
        name: row.player2_name,
        controlType: row.player2_control,
        tokenHash: row.player2_token_hash,
        connected: Boolean(row.player2_connected),
        lastHeartbeat: row.player2_last_heartbeat || 0
      },
      state: parsedState,
      version: row.version,
      activePlayer: row.active_player,
      turnNumber: row.turn_number,
      phase: row.phase,
      winnerId: row.winner_id,
      finishReason: row.finish_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActionId: row.last_action_id
    };
  }

  updateSessionState(matchId, stateJson, expectedVersion, updates = {}) {
    // Optimistic concurrency control
    const current = this.loadSession(matchId);
    if (!current) {
      throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
    }

    if (expectedVersion !== undefined && expectedVersion !== null && current.version !== expectedVersion) {
      const err = new Error(`STALE_VERSION_CONFLICT: Expected version ${expectedVersion}, but current database version is ${current.version}`);
      err.code = 'STALE_VERSION_CONFLICT';
      err.currentVersion = current.version;
      throw err;
    }

    const nextVersion = current.version + 1;
    const now = Date.now();

    const newStatus = updates.status || current.status;
    const newActivePlayer = updates.activePlayer || current.activePlayer;
    const newTurnNumber = updates.turnNumber !== undefined ? updates.turnNumber : current.turnNumber;
    const newPhase = updates.phase || current.phase;
    const newWinner = updates.winnerId !== undefined ? updates.winnerId : current.winnerId;
    const newFinishReason = updates.finishReason !== undefined ? updates.finishReason : current.finishReason;

    // Player 1 updates
    const newP1Id = updates.player1Id || (updates.player1 && updates.player1.id) || current.player1.id;
    const newP1Name = updates.player1Name || (updates.player1 && updates.player1.name) || current.player1.name;
    const newP1Control = updates.player1Control || (updates.player1 && updates.player1.controlType) || current.player1.controlType;
    const newP1TokenHash = updates.player1TokenHash || (updates.player1 && updates.player1.tokenHash) || current.player1.tokenHash;
    const newP1Conn = updates.player1Connected !== undefined ? (updates.player1Connected ? 1 : 0) : (current.player1.connected ? 1 : 0);
    const newP1Heartbeat = updates.player1LastHeartbeat !== undefined ? updates.player1LastHeartbeat : (current.player1.lastHeartbeat || 0);

    // Player 2 updates
    const newP2Id = updates.player2Id || (updates.player2 && updates.player2.id) || current.player2.id;
    const newP2Name = updates.player2Name || (updates.player2 && updates.player2.name) || current.player2.name;
    const newP2Control = updates.player2Control || (updates.player2 && updates.player2.controlType) || current.player2.controlType;
    const newP2TokenHash = updates.player2TokenHash || (updates.player2 && updates.player2.tokenHash) || current.player2.tokenHash;
    const newP2Conn = updates.player2Connected !== undefined ? (updates.player2Connected ? 1 : 0) : (current.player2.connected ? 1 : 0);
    const newP2Heartbeat = updates.player2LastHeartbeat !== undefined ? updates.player2LastHeartbeat : (current.player2.lastHeartbeat || 0);

    const lastActionId = updates.lastActionId || current.lastActionId;
    const stateStr = typeof stateJson === 'string' ? stateJson : JSON.stringify(stateJson);

    const stmt = this.db.prepare(`
      UPDATE match_sessions SET
        state_json = ?,
        version = ?,
        status = ?,
        player1_id = ?,
        player1_name = ?,
        player1_control = ?,
        player1_token_hash = ?,
        player1_connected = ?,
        player1_last_heartbeat = ?,
        player2_id = ?,
        player2_name = ?,
        player2_control = ?,
        player2_token_hash = ?,
        player2_connected = ?,
        player2_last_heartbeat = ?,
        active_player = ?,
        turn_number = ?,
        phase = ?,
        winner_id = ?,
        finish_reason = ?,
        last_action_id = ?,
        updated_at = ?
      WHERE id = ? AND version = ?
    `);

    const res = stmt.run(
      stateStr,
      nextVersion,
      newStatus,
      newP1Id,
      newP1Name,
      newP1Control,
      newP1TokenHash,
      newP1Conn,
      newP1Heartbeat,
      newP2Id,
      newP2Name,
      newP2Control,
      newP2TokenHash,
      newP2Conn,
      newP2Heartbeat,
      newActivePlayer,
      newTurnNumber,
      newPhase,
      newWinner,
      newFinishReason,
      lastActionId,
      now,
      matchId,
      current.version
    );

    if (res.changes === 0) {
      throw new Error(`CONCURRENT_MODIFICATION_DETECTED: Match "${matchId}" was modified concurrently`);
    }

    return this.loadSession(matchId);
  }

  saveClock(matchId, clockData) {
    const stmt = this.db.prepare(`
      INSERT INTO match_clocks (
        match_id, active_player, turn_number, turn_duration_ms,
        turn_start_ms, deadline_ms, remaining_ms, paused, pause_reason,
        accumulated_pause_ms, last_tick_ms, warning_threshold_ms, timeout_processed
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(match_id) DO UPDATE SET
        active_player = excluded.active_player,
        turn_number = excluded.turn_number,
        turn_duration_ms = excluded.turn_duration_ms,
        turn_start_ms = excluded.turn_start_ms,
        deadline_ms = excluded.deadline_ms,
        remaining_ms = excluded.remaining_ms,
        paused = excluded.paused,
        pause_reason = excluded.pause_reason,
        accumulated_pause_ms = excluded.accumulated_pause_ms,
        last_tick_ms = excluded.last_tick_ms,
        warning_threshold_ms = excluded.warning_threshold_ms,
        timeout_processed = excluded.timeout_processed
    `);

    stmt.run(
      matchId,
      clockData.activePlayer || 'player',
      clockData.turnNumber || 1,
      clockData.turnDurationMs || 240000,
      clockData.turnStartMs || Date.now(),
      clockData.deadlineMs || (Date.now() + 240000),
      clockData.remainingMs !== undefined ? clockData.remainingMs : 240000,
      clockData.paused ? 1 : 0,
      clockData.pauseReason || null,
      clockData.accumulatedPauseMs || 0,
      clockData.lastTickMs || Date.now(),
      clockData.warningThresholdMs || 60000,
      clockData.timeoutProcessed ? 1 : 0
    );

    return this.loadClock(matchId);
  }

  loadClock(matchId) {
    const stmt = this.db.prepare('SELECT * FROM match_clocks WHERE match_id = ?');
    const row = stmt.get(matchId);
    if (!row) return null;
    return {
      matchId: row.match_id,
      activePlayer: row.active_player,
      turnNumber: row.turn_number,
      turnDurationMs: row.turn_duration_ms,
      turnStartMs: row.turn_start_ms,
      deadlineMs: row.deadline_ms,
      remainingMs: row.remaining_ms,
      paused: Boolean(row.paused),
      pauseReason: row.pause_reason,
      accumulatedPauseMs: row.accumulated_pause_ms,
      lastTickMs: row.last_tick_ms,
      warningThresholdMs: row.warning_threshold_ms,
      timeoutProcessed: Boolean(row.timeout_processed)
    };
  }

  recordAction(matchId, actionId, playerId, actionType, payload, version) {
    // Idempotency check: Reject duplicate action IDs
    const existing = this.db.prepare('SELECT action_id FROM match_actions WHERE action_id = ?').get(actionId);
    if (existing) {
      const err = new Error(`DUPLICATE_ACTION_ID: Action "${actionId}" was already processed`);
      err.code = 'DUPLICATE_ACTION_ID';
      throw err;
    }

    const stmt = this.db.prepare(`
      INSERT INTO match_actions (
        action_id, match_id, player_id, action_type, payload_json, version, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      actionId,
      matchId,
      playerId,
      actionType,
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      version,
      Date.now()
    );
  }

  getAction(actionId) {
    if (!actionId) return null;
    const stmt = this.db.prepare('SELECT * FROM match_actions WHERE action_id = ?');
    const row = stmt.get(actionId);
    if (!row) return null;
    let payload = null;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = row.payload_json;
    }
    return {
      actionId: row.action_id,
      matchId: row.match_id,
      playerId: row.player_id,
      actionType: row.action_type,
      payload,
      version: row.version,
      createdAt: row.created_at
    };
  }

  commitActionTransaction({ matchId, expectedVersion, actionRecord, sessionUpdates, eventRecord, stateJson, clockUpdates }) {
    this.db.exec('BEGIN TRANSACTION');
    try {
      // 1. Verify session under transaction
      const current = this.loadSession(matchId);
      if (!current) {
        throw new Error(`MATCH_NOT_FOUND: Match "${matchId}" does not exist`);
      }

      // Check if actionId was already committed by a concurrent request
      if (actionRecord && actionRecord.actionId) {
        const existing = this.db.prepare('SELECT action_id FROM match_actions WHERE action_id = ?').get(actionRecord.actionId);
        if (existing) {
          const err = new Error(`DUPLICATE_ACTION_ID: Action "${actionRecord.actionId}" was already processed`);
          err.code = 'DUPLICATE_ACTION_ID';
          throw err;
        }
      }

      // 2. Check optimistic concurrency version
      if (expectedVersion !== undefined && expectedVersion !== null && current.version !== expectedVersion) {
        const err = new Error(`STALE_VERSION_CONFLICT: Expected version ${expectedVersion}, but current database version is ${current.version}`);
        err.code = 'STALE_VERSION_CONFLICT';
        err.currentVersion = current.version;
        throw err;
      }

      // 3. Insert into match_actions
      if (actionRecord) {
        const insertActionStmt = this.db.prepare(`
          INSERT INTO match_actions (
            action_id, match_id, player_id, action_type, payload_json, version, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insertActionStmt.run(
          actionRecord.actionId,
          matchId,
          actionRecord.playerId,
          actionRecord.actionType,
          typeof actionRecord.payload === 'string' ? actionRecord.payload : JSON.stringify(actionRecord.payload),
          current.version,
          Date.now()
        );
      }

      // 3. Update match_sessions
      const nextVersion = current.version + 1;
      const now = Date.now();
      const stateStr = typeof stateJson === 'string' ? stateJson : JSON.stringify(stateJson);
      const updates = sessionUpdates || {};

      const updateSessionStmt = this.db.prepare(`
        UPDATE match_sessions SET
          state_json = ?,
          version = ?,
          active_player = ?,
          turn_number = ?,
          phase = ?,
          last_action_id = ?,
          updated_at = ?
        WHERE id = ?
      `);

      updateSessionStmt.run(
        stateStr,
        nextVersion,
        updates.activePlayer || current.activePlayer,
        updates.turnNumber !== undefined ? updates.turnNumber : current.turnNumber,
        updates.phase || current.phase,
        actionRecord ? actionRecord.actionId : current.lastActionId,
        now,
        matchId
      );

      // 4. Insert into match_events if eventRecord provided
      if (eventRecord) {
        const insertEventStmt = this.db.prepare(`
          INSERT INTO match_events (match_id, seq, type, payload_json, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        insertEventStmt.run(
          matchId,
          eventRecord.seq,
          eventRecord.type,
          typeof eventRecord.payload === 'string' ? eventRecord.payload : JSON.stringify(eventRecord.payload),
          Date.now()
        );
      }

      // 5. Update clock if provided
      if (clockUpdates) {
        this.saveClock(matchId, clockUpdates);
      }

      this.db.exec('COMMIT');

      // Return refreshed session
      return this.loadSession(matchId);
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  recordEvent(matchId, seq, type, payload) {
    const stmt = this.db.prepare(`
      INSERT INTO match_events (match_id, seq, type, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      matchId,
      seq,
      type,
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      Date.now()
    );
  }

  getEvents(matchId, sinceSeq = 0) {
    const stmt = this.db.prepare(`
      SELECT seq, type, payload_json, created_at
      FROM match_events
      WHERE match_id = ? AND seq > ?
      ORDER BY seq ASC
    `);

    const rows = stmt.all(matchId, sinceSeq);
    return rows.map(r => {
      let parsed = null;
      try { parsed = JSON.parse(r.payload_json); } catch { parsed = r.payload_json; }
      return {
        seq: r.seq,
        type: r.type,
        payload: parsed,
        createdAt: r.created_at
      };
    });
  }

  getMaxEventSeq(matchId) {
    const stmt = this.db.prepare('SELECT MAX(seq) as max_seq FROM match_events WHERE match_id = ?');
    const row = stmt.get(matchId);
    return (row && row.max_seq) ? row.max_seq : 0;
  }

  listActiveSessionsByTokenHash(tokenHash) {
    if (!tokenHash) return [];
    const sql = `
      SELECT id, mode, status, player1_id, player1_name, player2_id, player2_name,
             active_player, turn_number, phase, updated_at
      FROM match_sessions
      WHERE status NOT IN ('COMPLETED', 'FORFEITED', 'CANCELLED')
        AND (player1_token_hash = ? OR player2_token_hash = ?)
      ORDER BY updated_at DESC
    `;
    const stmt = this.db.prepare(sql);
    return stmt.all(tokenHash, tokenHash);
  }

  listSessionHistoryByTokenHash(tokenHash, limit = 50) {
    if (!tokenHash) return [];
    const sql = `
      SELECT id, mode, status, player1_id, player1_name, player2_id, player2_name,
             winner_id, finish_reason, turn_number, created_at, updated_at
      FROM match_sessions
      WHERE status IN ('COMPLETED', 'FORFEITED', 'CANCELLED')
        AND (player1_token_hash = ? OR player2_token_hash = ?)
      ORDER BY updated_at DESC LIMIT ?
    `;
    const stmt = this.db.prepare(sql);
    return stmt.all(tokenHash, tokenHash, limit);
  }

  listActiveSessions(playerId = null) {
    let sql = `
      SELECT id, mode, status, player1_id, player1_name, player2_id, player2_name,
             active_player, turn_number, phase, updated_at
      FROM match_sessions
      WHERE status NOT IN ('COMPLETED', 'FORFEITED', 'CANCELLED')
    `;
    const params = [];
    if (playerId) {
      sql += ' AND (player1_id = ? OR player2_id = ?)';
      params.push(playerId, playerId);
    }
    sql += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  listSessionHistory(limit = 50, playerId = null) {
    let sql = `
      SELECT id, mode, status, player1_id, player1_name, player2_id, player2_name,
             winner_id, finish_reason, turn_number, created_at, updated_at
      FROM match_sessions
      WHERE status IN ('COMPLETED', 'FORFEITED', 'CANCELLED')
    `;
    const params = [];
    if (playerId) {
      sql += ' AND (player1_id = ? OR player2_id = ?)';
      params.push(playerId, playerId);
    }
    sql += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  deleteSession(matchId) {
    this.db.prepare('DELETE FROM match_actions WHERE match_id = ?').run(matchId);
    this.db.prepare('DELETE FROM match_events WHERE match_id = ?').run(matchId);
    this.db.prepare('DELETE FROM match_clocks WHERE match_id = ?').run(matchId);
    this.db.prepare('DELETE FROM match_sessions WHERE id = ?').run(matchId);
  }
}

let defaultStore = null;

export function getDefaultSessionStore() {
  if (!defaultStore) {
    defaultStore = new SessionStore();
  }
  return defaultStore;
}
