import test from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

test('Petit Bat (BS67-CX01) Contract Partner Handler Suite', async (t) => {
  await t.test('1. Registration: BS67-CX01 is registered with WHEN_ATTACKS trigger', () => {
    assert.equal(PerCardRegistry.has('BS67-CX01', 'WHEN_ATTACKS'), true);
    const def = PerCardRegistry.get('BS67-CX01');
    assert.equal(def.name, 'Petit Bat');
    assert.equal(def.cardType, 'Contract Spirit');
  });

  await t.test('2. Execution: When Petit Bat attacks, increases counters +2 and draws 1 card', () => {
    const duelState = {
      player: {
        counters: 0,
        deck: [{ name: 'Bone-Rabbit', cost: 1 }],
        hand: [],
        field: [{ uid: 'u1', card_number: 'BS67-CX01', name: 'Petit Bat' }]
      },
      opponent: { field: [] }
    };

    let logCalled = false;
    const mockArenaApi = {
      addLog: (msg) => { logCalled = true; },
      AudioFX: { draw: () => {} },
      renderDuelTable: () => {},
      renderPlayerHand: () => {}
    };

    PerCardRegistry.execute('BS67-CX01', 'WHEN_ATTACKS', {
      card: duelState.player.field[0],
      side: 'player',
      duelState,
      arenaApi: mockArenaApi
    });

    assert.equal(duelState.player.counters, 2);
    assert.equal(duelState.player.hand.length, 1);
    assert.equal(duelState.player.hand[0].name, 'Bone-Rabbit');
    assert.equal(logCalled, true);
  });

  await t.test('3. Counter Cap: Counters do not exceed maximum cap of 10', () => {
    const duelState = {
      player: {
        counters: 9,
        deck: [{ name: 'Leo-Smog' }],
        hand: [],
        field: [{ uid: 'u1', card_number: 'BS67-CX01', name: 'Petit Bat' }]
      },
      opponent: { field: [] }
    };

    PerCardRegistry.execute('BS67-CX01', 'WHEN_ATTACKS', {
      card: duelState.player.field[0],
      side: 'player',
      duelState,
      arenaApi: null
    });

    assert.equal(duelState.player.counters, 10);
  });
});
