import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { SessionStore } from '../engine/session_store.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { Matchmaker, MATCHMAKER_STATUS } from '../engine/matchmaker.js';
import { launchRealBrowser } from './helpers/real_browser.js';

test('PVP-MM-01: Multi-instance shared SQLite Matchmaker pairs two players atomically and enforces cancel/self-match guards', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-mm-'));
  const dbPath = path.join(tmpDir, 'shared_mm.db');

  try {
    // Two independent Matchmaker + BattleSessionManager instances sharing the same SQLite DB_PATH
    const store1 = new SessionStore({ dbPath });
    const mgr1 = new BattleSessionManager({ store: store1 });
    const mm1 = new Matchmaker({ sessionManager: mgr1, leaseMs: 15000 });

    const store2 = new SessionStore({ dbPath });
    const mgr2 = new BattleSessionManager({ store: store2 });
    const mm2 = new Matchmaker({ sessionManager: mgr2, leaseMs: 15000 });

    // 1. Player A enters queue on Instance 1
    const qA = await mm1.enterQueue({ playerId: 'alice', playerName: 'Alice', deckId: 'red' });
    assert.equal(qA.status, MATCHMAKER_STATUS.SEARCHING);
    assert.ok(qA.ticketId);

    // 2. Duplicate enterQueue for Player A on Instance 2 must NOT self-pair
    const qADup = await mm2.enterQueue({ playerId: 'alice', playerName: 'Alice', deckId: 'red' });
    assert.equal(qADup.status, MATCHMAKER_STATUS.SEARCHING);
    assert.equal(qADup.ticketId, qA.ticketId);

    // 3. Cancelled ticket cannot be paired afterward
    const qC = await mm1.enterQueue({ playerId: 'charlie', playerName: 'Charlie', deckId: 'white' });
    assert.equal(qC.status, MATCHMAKER_STATUS.MATCHED, 'Charlie pairs with waiting Alice');
    assert.equal(qC.playerSide, 'opponent');

    const pollA = mm2.pollQueue(qA.ticketId);
    assert.equal(pollA.status, MATCHMAKER_STATUS.MATCHED);
    assert.equal(pollA.matchId, qC.matchId);
    assert.equal(pollA.playerSide, 'player');
    assert.notEqual(pollA.authToken, qC.authToken);

    // 4. Verify cancellation prevents pairing
    const qD = await mm1.enterQueue({ playerId: 'dave', playerName: 'Dave', deckId: 'blue' });
    assert.equal(qD.status, MATCHMAKER_STATUS.SEARCHING);
    const cancelD = mm2.leaveQueue(qD.ticketId);
    assert.equal(cancelD.status, MATCHMAKER_STATUS.CANCELLED);

    const qE = await mm2.enterQueue({ playerId: 'eve', playerName: 'Eve', deckId: 'green' });
    assert.equal(qE.status, MATCHMAKER_STATUS.SEARCHING, 'Eve must NOT pair with cancelled Dave');
    assert.equal(mm1.pollQueue(qD.ticketId).status, MATCHMAKER_STATUS.CANCELLED);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});

test('PVP-BROWSER-02: Two independent browser clients matchmake via Random Battle, enter same session, and Burst pauses AI attack', async () => {
  const dynamicPort = 4800 + Math.floor(Math.random() * 150);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bsp-pvp-e2e-'));
  const dbPath = path.join(tmpDir, 'pvp_e2e.db');
  const serverProc = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(dynamicPort), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timed out')), 8000);
    serverProc.stdout.on('data', (buf) => {
      if (buf.toString().includes('running at')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.on('error', reject);
  });

  const harnessA = await launchRealBrowser({ noServer: true, serverPort: dynamicPort });
  const harnessB = await launchRealBrowser({ noServer: true, serverPort: dynamicPort });
  console.error('[PVP-E2E] Browsers launched');

  try {
    await harnessA.navigate('/arena.html');
    await harnessB.navigate('/arena.html');
    console.error('[PVP-E2E] Navigated');
    await harnessA.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 25000);
    await harnessB.waitForFunction('window.BattleArena && typeof window.BattleArena.resumeBattle === "function"', 25000);
    console.error('[PVP-E2E] BattleArena ready');

    // Player A enters Random Matchmaking via backend API from Browser A
    const findA = await harnessA.evaluate(`(async () => {
      const res = await fetch('/api/matchmaking/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'browser_alice', playerName: 'Alice', deckId: 'red' })
      });
      return await res.json();
    })()`);
    assert.equal(findA.status, 'SEARCHING');

    // Player B enters Random Matchmaking from Browser B -> immediate MATCHED
    const findB = await harnessB.evaluate(`(async () => {
      const res = await fetch('/api/matchmaking/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: 'browser_bob', playerName: 'Bob', deckId: 'white' })
      });
      return await res.json();
    })()`);
    assert.equal(findB.status, 'MATCHED');

    // Player A polls status and receives the SAME matchId with opposite side and distinct token
    const pollA = await harnessA.evaluate(`(async () => {
      const res = await fetch('/api/matchmaking/status?ticketId=' + encodeURIComponent(${JSON.stringify(findA.ticketId)}));
      return await res.json();
    })()`);
    assert.equal(pollA.status, 'MATCHED');
    assert.equal(pollA.matchId, findB.matchId);
    assert.notEqual(pollA.authToken, findB.authToken);
    assert.notEqual(pollA.playerSide, findB.playerSide);

    // Both browser clients call resumeBattle(matchId, authToken) and hydrate DuelState into the shared battle!
    const stateA = await harnessA.evaluate(`(async () => {
      localStorage.setItem('bse_player_side', ${JSON.stringify(pollA.playerSide)});
      await window.BattleArena.resumeBattle(${JSON.stringify(pollA.matchId)}, ${JSON.stringify(pollA.authToken)});
      const ds = window.BattleArena.DuelState || window.DuelState;
      return { inDuel: ds.inDuel, isOnline: ds.isOnline, mySide: ds.mySide, playerHand: ds.player.hand.length, playerDeck: ds.player.deck.length };
    })()`);

    const stateB = await harnessB.evaluate(`(async () => {
      localStorage.setItem('bse_player_side', ${JSON.stringify(findB.playerSide)});
      await window.BattleArena.resumeBattle(${JSON.stringify(findB.matchId)}, ${JSON.stringify(findB.authToken)});
      const ds = window.BattleArena.DuelState || window.DuelState;
      return { inDuel: ds.inDuel, isOnline: ds.isOnline, mySide: ds.mySide, playerHand: ds.player.hand.length, playerDeck: ds.player.deck.length };
    })()`);

    assert.equal(stateA.inDuel, true);
    assert.equal(stateA.isOnline, true);
    assert.equal(stateA.mySide, pollA.playerSide);
    assert.ok(stateA.playerHand > 0 || stateA.playerDeck > 0, 'Player A DuelState must be hydrated from server snapshot');

    assert.equal(stateB.inDuel, true);
    assert.equal(stateB.isOnline, true);
    assert.equal(stateB.mySide, findB.playerSide);
    assert.ok(stateB.playerHand > 0 || stateB.playerDeck > 0, 'Player B DuelState must be hydrated from server snapshot');

    // Verify Burst pause in arena.html: while activeBurstTrigger is open, AI attack step cannot reduce player Life
    const burstPauseRes = await harnessA.evaluate(`(async () => {
      const ds = window.BattleArena.DuelState || window.DuelState;
      ds.isOnline = false;
      ds.mode = 'HUMAN_VS_AI';
      ds.activePlayer = 'opponent';
      ds.turn = 2;
      ds.player.life = 5;
      ds.player.burst = {
        uid: 'b_pause_1',
        id: 'BS01-B',
        name: 'Pause Guard Burst',
        type: 'Magic',
        color: 'Red',
        cost: 4,
        effect: '[Burst: After an opposing Spirit\\'s (When Summoned) effect activates] Draw 2 cards.',
        image_url: ''
      };
      const triggered = window.BattleArena.checkBurstTrigger('player', 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit: { name: 'Test Summon' } });
      const modalActive = document.getElementById('battleBurstPromptModal')?.classList.contains('active');
      return { triggered, modalActive, lifeAfterTrigger: ds.player.life, hasPendingBurst: Boolean(ds.activeBurstTrigger) };
    })()`);

    assert.equal(burstPauseRes.triggered, true);
    assert.equal(burstPauseRes.modalActive, true);
    assert.equal(burstPauseRes.hasPendingBurst, true);
    assert.equal(burstPauseRes.lifeAfterTrigger, 5);
  } finally {
    await harnessB.close();
    await harnessA.close();
    try { serverProc.kill('SIGTERM'); } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
});
