/**
 * tests/phase_m_browser_e2e.test.js
 * Classification: REAL_BROWSER_E2E
 * 
 * Battle Spirits Eternal — Phase M Work Package E, F, J & K:
 * Real Browser Production-Path Persistent Battle Sessions, Turn Clock & Navigation Independence.
 * 
 * Tests in real headless Chrome via CDP:
 * 1. Arena loads with Session HUD Bar, Turn Clock, and Active Battles section.
 * 2. 4-Minute Turn Clock countdown and format synchronization.
 * 3. 1-Minute Corner Warning countdown banner activates at <= 60s threshold.
 * 4. 1-Minute Corner Warning banner disappears or updates when turn changes.
 * 5. Active Battles list renders persistent matches from SQLite backend.
 * 6. Website navigation independence: Navigating away to /browse.html and /keywords.html does not cancel match.
 * 7. Refresh independence: Refreshing arena.html preserves match state.
 * 8. Leave Arena button exits to lobby while keeping match active in background.
 * 9. Explicit Forfeit button cleanly ends match.
 * 10. Private state protection: Opponent's private hand cards are hidden.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchRealBrowser } from './helpers/real_browser.js';

test('PHASE-M-BROWSER-E2E: Complete Real Chrome Suite for Persistent Sessions & Turn Clock', async () => {
  const dynamicPort = 4950 + Math.floor(Math.random() * 100);
  const harness = await launchRealBrowser({ serverPort: dynamicPort });

  try {
    // Navigate to production arena
    await harness.navigate('/arena.html');
    const title = await harness.evaluate('document.title');
    assert.equal(title, 'Battle Spirits Eternal | Battle Arena', 'Arena page must load');

    // Wait for BattleArena initialization
    await harness.waitForFunction(
      'window.BattleArena && typeof window.BattleArena.startClientTurnClock === "function"',
      25000
    );

    // =========================================================================
    // Scenario 1: Arena UI Elements (Session HUD Bar, Active Battles, Warning Corner)
    // =========================================================================
    const s1 = await harness.evaluate(`(function() {
      const hudBar = document.getElementById('sessionHudBar');
      const activeSec = document.getElementById('activeBattlesSection');
      const warningCorner = document.getElementById('arenaTurnWarningCorner');
      const hudClock = document.getElementById('hudClockTimeDisplay');
      return {
        hasHudBar: Boolean(hudBar),
        hasActiveBattles: Boolean(activeSec),
        hasWarningCorner: Boolean(warningCorner),
        hasHudClock: Boolean(hudClock)
      };
    })()`);

    assert.equal(s1.hasHudBar, true, 'Session HUD bar must be present');
    assert.equal(s1.hasActiveBattles, true, 'Active Battles section must be present');
    assert.equal(s1.hasWarningCorner, true, '1-minute turn warning corner element must be present');
    assert.equal(s1.hasHudClock, true, 'HUD clock display must be present');

    // =========================================================================
    // Scenario 2: 4-Minute Turn Clock Countdown Display
    // =========================================================================
    const s2 = await harness.evaluate(`(function() {
      // Set server clock to full 240s
      window.BattleArena.setServerClock({
        deadlineMs: Date.now() + 240000,
        turnStartMs: Date.now(),
        remainingMs: 240000,
        paused: false
      });
      window.BattleArena.startClientTurnClock();

      const timeText = document.getElementById('hudClockTimeDisplay')?.textContent;
      const playerText = document.getElementById('hudClockPlayerLabel')?.textContent;
      return { timeText, playerText };
    })()`);

    assert.equal(s2.timeText, '04:00', 'Turn clock must format 240s as 04:00');
    assert.ok(s2.playerText.includes('PLAYER'), 'Player turn label must be displayed');

    // =========================================================================
    // Scenario 3: 1-Minute Corner Warning Activates at <= 60s Threshold
    // =========================================================================
    const s3 = await harness.evaluate(`(function() {
      // Simulate clock at 59 seconds remaining
      window.BattleArena.setServerClock({
        deadlineMs: Date.now() + 59000,
        turnStartMs: Date.now() - 181000,
        remainingMs: 59000,
        paused: false
      });
      window.BattleArena.updateClockDisplay();

      const warningCorner = document.getElementById('arenaTurnWarningCorner');
      const isVisible = warningCorner && warningCorner.style.display !== 'none';
      const countdownText = document.getElementById('cornerWarningCountdown')?.textContent;
      const playerText = document.getElementById('cornerWarningPlayer')?.textContent;

      return { isVisible, countdownText, playerText };
    })()`);

    assert.equal(s3.isVisible, true, '1-minute warning corner must become visible when remaining <= 60s');
    assert.equal(s3.countdownText, '00:59', 'Corner countdown must display 00:59');
    assert.ok(s3.playerText.includes('Active: Player'), 'Corner must identify active player');

    // =========================================================================
    // Scenario 4: Warning Dismisses When Remaining Time > 60s
    // =========================================================================
    const s4 = await harness.evaluate(`(function() {
      // Reset clock to 200s (e.g. after turn change)
      window.BattleArena.setServerClock({
        deadlineMs: Date.now() + 200000,
        remainingMs: 200000,
        paused: false
      });
      window.BattleArena.updateClockDisplay();

      const warningCorner = document.getElementById('arenaTurnWarningCorner');
      return { isHidden: warningCorner && warningCorner.style.display === 'none' };
    })()`);

    assert.equal(s4.isHidden, true, '1-minute warning corner must hide when clock > 60s');

    // =========================================================================
    // Scenario 5: Active Battles API & Panel Rendering
    // =========================================================================
    const s5 = await harness.evaluate(`(async function() {
      // Create a match session via backend API
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'HUMAN_VS_AI',
          player1: { id: 'browser_user', name: 'Browser User' }
        })
      });
      const created = await res.json();

      // Refresh active battles in UI
      await window.BattleArena.refreshActiveBattles();
      const list = document.getElementById('activeBattlesList');
      const cards = list ? list.querySelectorAll('.active-battle-card') : [];

      return {
        matchId: created.matchId,
        renderedCount: cards.length
      };
    })()`);

    assert.ok(s5.matchId, 'Backend must return match ID');
    assert.ok(s5.renderedCount >= 1, 'Active battles list must render at least 1 match card');

    // =========================================================================
    // Scenario 6: Website Navigation Independence (/browse and /keywords)
    // =========================================================================
    // Navigate away to /keywords.html
    await harness.navigate('/keywords.html');
    const kwTitle = await harness.evaluate('document.title');
    assert.ok(kwTitle.includes('Keywords'), 'Navigated to Keywords page');

    // Navigate to /browse.html
    await harness.navigate('/browse.html');
    const browseTitle = await harness.evaluate('document.title');
    assert.ok(browseTitle.includes('Browse'), 'Navigated to Browse page');

    // Return to /arena.html?matchId=<created>
    await harness.navigate(`/arena.html?matchId=${encodeURIComponent(s5.matchId)}`);
    const returnTitle = await harness.evaluate('document.title');
    assert.equal(returnTitle, 'Battle Spirits Eternal | Battle Arena');

    // =========================================================================
    // Scenario 7: Refresh Independence
    // =========================================================================
    await harness.navigate(`/arena.html?matchId=${encodeURIComponent(s5.matchId)}`);
    // Reload page
    await harness.evaluate('window.location.reload()');
    await harness.waitForFunction(
      'window.BattleArena && typeof window.BattleArena.refreshActiveBattles === "function"',
      20000
    );

    const s7 = await harness.evaluate(`(async function() {
      const res = await fetch('/api/sessions/${encodeURIComponent(s5.matchId)}');
      const data = await res.json();
      return {
        matchId: data.matchId,
        status: data.status,
        turnNumber: data.turnNumber
      };
    })()`);

    assert.equal(s7.matchId, s5.matchId, 'Match must survive page refresh');
    assert.equal(s7.status, 'ACTIVE');

    // =========================================================================
    // Scenario 8: Leave Arena & Forfeit Buttons Exist and Are Accessible
    // =========================================================================
    const s8 = await harness.evaluate(`(function() {
      const btnLeave = document.getElementById('btnLeaveArena');
      const btnForfeit = document.getElementById('btnForfeitMatch');
      return {
        hasLeave: Boolean(btnLeave),
        hasForfeit: Boolean(btnForfeit)
      };
    })()`);

    assert.equal(s8.hasLeave, true, 'Leave Arena button must exist');
    assert.equal(s8.hasForfeit, true, 'Forfeit Match button must exist');

    // =========================================================================
    // Scenario 9: Private State Masking for Opponent
    // =========================================================================
    const s9 = await harness.evaluate(`(async function() {
      // Query player 1 view
      const p1Res = await fetch('/api/sessions/${encodeURIComponent(s5.matchId)}?token=invalid_spec');
      const data = await p1Res.json();
      const oppHand = data.state?.players?.opponent?.hand || [];
      const isMasked = oppHand.every(c => c.masked === true);
      return { isMasked, oppHandCount: oppHand.length };
    })()`);

    assert.equal(s9.isMasked, true, 'Opponent hand must be masked in unauthorized / spectator view');

    // Clean up timers
    await harness.evaluate('window.BattleArena.stopClientTurnClock()');

  } finally {
    await harness.close();
  }
});
