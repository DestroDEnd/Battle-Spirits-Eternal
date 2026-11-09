import test from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

test('The PartnerWingedDragon Terad (BS62-CX01) Suite', async (t) => {
  await t.test('1. Registration: BS62-CX01 is registered with WHEN_SUMMONED and WHEN_ATTACKS triggers', () => {
    assert.equal(PerCardRegistry.has('BS62-CX01', 'WHEN_SUMMONED'), true);
    assert.equal(PerCardRegistry.has('BS62-CX01', 'WHEN_ATTACKS'), true);
    const def = PerCardRegistry.get('BS62-CX01');
    assert.equal(def.name, 'The PartnerWingedDragon Terad');
    assert.equal(def.cardType, 'Contract Spirit');
  });

  await t.test('2. Execution: When Terad is summoned, sends 1 core from Trash to Terad and adds +1 counter', () => {
    const terad = { uid: 'u1', card_number: 'BS62-CX01', name: 'The PartnerWingedDragon Terad', currentCores: 1 };
    const duelState = {
      player: {
        trash: 3,
        counters: 0,
        field: [terad]
      },
      opponent: { field: [] }
    };

    let logged = false;
    const mockArenaApi = {
      addLog: (msg) => { logged = true; },
      AudioFX: { coreChime: () => {} },
      renderDuelTable: () => {},
      renderPlayerHand: () => {}
    };

    PerCardRegistry.execute('BS62-CX01', 'WHEN_SUMMONED', {
      card: terad,
      side: 'player',
      duelState,
      arenaApi: mockArenaApi
    });

    assert.equal(duelState.player.trash, 2);
    assert.equal(terad.currentCores, 2);
    assert.equal(duelState.player.counters, 1);
    assert.equal(logged, true);
  });

  await t.test('3. Execution: When Terad attacks, sends 1 core from Trash to Terad and adds +1 counter', () => {
    const terad = { uid: 'u1', card_number: 'BS62-CX01', name: 'The PartnerWingedDragon Terad', currentCores: 2 };
    const duelState = {
      player: {
        trash: 2,
        counters: 1,
        field: [terad]
      },
      opponent: { field: [] }
    };

    PerCardRegistry.execute('BS62-CX01', 'WHEN_ATTACKS', {
      card: terad,
      side: 'player',
      duelState,
      arenaApi: null
    });

    assert.equal(duelState.player.trash, 1);
    assert.equal(terad.currentCores, 3);
    assert.equal(duelState.player.counters, 2);
  });
});
