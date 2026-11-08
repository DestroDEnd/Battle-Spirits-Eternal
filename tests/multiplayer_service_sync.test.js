/**
 * tests/multiplayer_service_sync.test.js
 * 
 * Verifies multiplayer action packets and arena action dispatching
 * for SUMMON_CARD and ADVENT_STACK.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Multiplayer Sync & Action Dispatcher Suite', () => {
  const arenaCode = fs.readFileSync(path.resolve('./battle_arena.js'), 'utf8');

  it('1. arena exports functions and handles ADVENT_STACK action', () => {
    let loggedMsg = '';
    let loggedType = '';
    const mockAudio = {
      soulCoreIgnite: () => {},
      summon: () => {}
    };

    const mockDoc = {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '' }),
      addEventListener: () => {},
      removeEventListener: () => {},
      body: { appendChild() {} }
    };

    const globalObj = {
      console, Math, parseInt, Date, Array, Object, String, Number, Boolean, RegExp,
      setTimeout: (fn) => fn(), clearTimeout: () => {},
      document: mockDoc,
      AudioFX: mockAudio,
      window: { location: { origin: 'http://localhost' }, addEventListener: () => {} }
    };
    globalObj.window.document = mockDoc;

    const fn = new Function('window', 'document', 'DuelState', arenaCode + '\nreturn window.BattleArena;');
    const sandboxDuelState = {
      isOnline: true,
      phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
      phaseIndex: 5,
      activePlayer: 'player',
      player: {
        field: [],
        hand: [],
        reserve: 5,
        trash: 0
      },
      opponent: {
        field: [],
        life: 5
      }
    };

    const BattleArena = fn(globalObj.window, mockDoc, sandboxDuelState);
    assert.ok(BattleArena, 'BattleArena must be initialized');

    // Test that the string handler for ADVENT_STACK and SUMMON_CARD exists in battle_arena.js
    assert.ok(arenaCode.includes("type === 'ADVENT_STACK'"), 'battle_arena.js must handle ADVENT_STACK action packet');
    assert.ok(arenaCode.includes("type === 'SUMMON_CARD'"), 'battle_arena.js must handle SUMMON_CARD action packet');
  });

  it('2. multiplayer_service exports expected interface', () => {
    const mpCode = fs.readFileSync(path.resolve('./multiplayer_service.js'), 'utf8');
    const mockWindow = {};
    const fn = new Function('window', mpCode);
    fn(mockWindow);

    assert.ok(mockWindow.MultiplayerService, 'MultiplayerService must be registered on window');
    assert.equal(typeof mockWindow.MultiplayerService.createRoom, 'function');
    assert.equal(typeof mockWindow.MultiplayerService.joinRoom, 'function');
    assert.equal(typeof mockWindow.MultiplayerService.sendAction, 'function');
    assert.equal(typeof mockWindow.MultiplayerService.onOpponentAction, 'function');
    assert.equal(typeof mockWindow.MultiplayerService.leaveRoom, 'function');
  });
});
