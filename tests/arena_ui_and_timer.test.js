import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Arena UI & Timer Enhancements Suite', async (t) => {
  const arenaHtml = fs.readFileSync(path.join(process.cwd(), 'arena.html'), 'utf8');
  const battleArenaJs = fs.readFileSync(path.join(process.cwd(), 'battle_arena.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf8');

  await t.test('1. Timer Elements & HUD Structure', () => {
    assert.ok(arenaHtml.includes('id="hudClockTimeDisplay"'), 'hudClockTimeDisplay must exist');
    assert.ok(arenaHtml.includes('id="hudClockPlayerLabel"'), 'hudClockPlayerLabel must exist');
    assert.ok(arenaHtml.includes('id="hudClockProgressFill"'), 'hudClockProgressFill must exist');
    assert.ok(arenaHtml.includes('id="arenaTurnWarningCorner"'), 'arenaTurnWarningCorner must exist');
  });

  await t.test('2. Dedicated Starting Hand Banner Container', () => {
    assert.ok(arenaHtml.includes('id="startingHandBannerContainer"'), 'startingHandBannerContainer must exist in arena.html');
    // Ensure it is placed outside #playerHand so hand cards are never squished
    const containerIdx = arenaHtml.indexOf('id="startingHandBannerContainer"');
    const handTrackIdx = arenaHtml.indexOf('id="playerHand"');
    assert.ok(containerIdx !== -1 && handTrackIdx !== -1, 'Both elements must exist');
    assert.ok(containerIdx < handTrackIdx, 'startingHandBannerContainer must be outside and above #playerHand');
  });

  await t.test('3. Client Turn Clock Implementation in battle_arena.js', () => {
    assert.ok(battleArenaJs.includes('function startClientTurnClock(durationSec = 240)'), 'startClientTurnClock must accept duration');
    assert.ok(battleArenaJs.includes('function updateClockDisplay()'), 'updateClockDisplay must exist');
    assert.ok(battleArenaJs.includes('function stopClientTurnClock()'), 'stopClientTurnClock must exist');
    assert.ok(battleArenaJs.includes('function declareWinner('), 'declareWinner function must exist');

    // Ensure startClientTurnClock is hooked into match start and turn transitions
    assert.ok(battleArenaJs.includes('startClientTurnClock(240);'), 'Clock must be started at 240s');
  });

  await t.test('4. Active Battles & Lobby Hidden During Duels', () => {
    assert.ok(stylesCss.includes('body.arena-in-duel #activeBattlesSection'), 'activeBattlesSection must be suppressed in CSS');
    assert.ok(stylesCss.includes('body.arena-in-duel .active-battles-section'), 'active-battles-section must be suppressed in CSS');
    assert.ok(battleArenaJs.includes("if (activeBattlesSec) activeBattlesSec.style.display = 'none';"), 'Lobby renderer must hide activeBattlesSec during duel');
  });

  await t.test('5. Starting Hand Prompt Dismissal on Turn > 1', () => {
    // In renderPlayerHand, turn > 1 auto-confirms hand
    assert.ok(battleArenaJs.includes('if (DuelState.turn > 1) {'), 'Must check if turn > 1');
    assert.ok(battleArenaJs.includes('bannerContainer.style.display = \'none\';'), 'Must hide banner container when confirmed or turn > 1');
  });

  await t.test('6. Burst & Turn Badge Visual Collision Prevention', () => {
    assert.ok(stylesCss.includes('body.arena-in-duel .burst-center-turn-slot'), 'burst-center-turn-slot must have arena-in-duel styling');
    assert.ok(stylesCss.includes('min-height: 0 !important;'), 'burst-center-turn-slot min-height must be zero to prevent overflow');
    assert.ok(stylesCss.includes('body.arena-in-duel .burst-field-zone'), 'burst-field-zone must have arena-in-duel styling');
    assert.ok(stylesCss.includes('body.arena-in-duel .hand-card-item'), 'hand-card-item must have readable sizing in duel');
  });
});
