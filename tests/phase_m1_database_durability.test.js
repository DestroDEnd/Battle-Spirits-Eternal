/**
 * tests/phase_m1_database_durability.test.js
 * 
 * Battle Spirits Eternal — Phase M.1 Work Package B:
 * Verify Elimination of Silent In-Memory DB Fallback, Fatal Storage Errors & Storage Health.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';

test('PHASE-M1-WP-B: Test 1 - Explicit inMemory: true works as intended for test configurations', () => {
  const store = new SessionStore({ inMemory: true });
  assert.equal(store.inMemory, true);
  assert.ok(store.db, 'Database instance should exist');

  const health = store.validateStorageHealth();
  assert.equal(health.healthy, true);
  assert.equal(health.mode, 'in-memory');
  assert.equal(health.writable, true);
});

test('PHASE-M1-WP-B: Test 2 - Durable SQLite storage is initialized with WAL mode and health passes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-durability-'));
  const dbPath = path.join(tmpDir, 'durable.db');

  const store = new SessionStore({ dbPath });
  assert.equal(store.inMemory, false);

  const health = store.validateStorageHealth();
  assert.equal(health.healthy, true);
  assert.equal(health.mode, 'sqlite-wal');
  assert.equal(health.journalMode.toLowerCase(), 'wal');
  assert.equal(health.writable, true);
});

test('PHASE-M1-WP-B: Test 3 - Unwritable/invalid database path throws explicit FATAL_STORAGE_ERROR and does NOT fall back to :memory:', () => {
  // Use a path where a file is treated as a directory to force an impossible filesystem path
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-fail-'));
  const blockerFile = path.join(tmpDir, 'blocker_file');
  fs.writeFileSync(blockerFile, 'blocking file content');

  // Attempting to create db inside a file as directory: blockerFile/sub/db.sqlite
  const impossibleDbPath = path.join(blockerFile, 'sub', 'db.sqlite');

  assert.throws(
    () => {
      new SessionStore({ dbPath: impossibleDbPath });
    },
    (err) => {
      assert.equal(err.code, 'FATAL_STORAGE_ERROR', 'Must throw FATAL_STORAGE_ERROR');
      assert.ok(err.message.includes('FATAL_STORAGE_ERROR'), 'Message must indicate fatal storage failure');
      return true;
    },
    'Must throw fatal storage error instead of silently falling back to in-memory'
  );
});

test('PHASE-M1-WP-B: Test 4 - Database initialization failure surfaces immediately to callers', () => {
  // Provide an invalid path
  const badPath = 'Z:\\non_existent_drive_98765\\impossible\\test.db';
  assert.throws(
    () => new SessionStore({ dbPath: badPath }),
    (err) => {
      assert.equal(err.code, 'FATAL_STORAGE_ERROR');
      return true;
    }
  );
});

test('PHASE-M1-WP-B: Test 5 - Process restart preserves durable session across stores without volatility', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-restart-'));
  const dbPath = path.join(tmpDir, 'restart_test.db');

  // Step 1: Create session with Manager 1
  const store1 = new SessionStore({ dbPath });
  const manager1 = new BattleSessionManager({ store: store1 });
  const match = await manager1.createMatch({
    player1: { id: 'p1', name: 'Alice' }
  });

  // Step 2: "Process restart" - instantiate completely new store & manager pointing to same file
  const store2 = new SessionStore({ dbPath });
  const manager2 = new BattleSessionManager({ store: store2 });

  const restored = await manager2.getMatch(match.matchId);
  assert.ok(restored, 'Match must exist in restored database');
  assert.equal(restored.id, match.matchId);
  assert.equal(restored.player1.id, 'p1');
});

test('PHASE-M1-WP-B: Test 6 - Storage write failures are surfaced directly rather than silently switching to memory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-m1-writefail-'));
  const dbPath = path.join(tmpDir, 'write_fail.db');
  const store = new SessionStore({ dbPath });

  // Corrupt or close DB
  store.db.close();

  assert.throws(
    () => {
      store.loadSession('some_match');
    },
    (err) => {
      assert.ok(err, 'Error must be thrown when database is closed/corrupted');
      return true;
    }
  );

  // Verify store does not silently switch to :memory:
  assert.equal(store.inMemory, false);
});
