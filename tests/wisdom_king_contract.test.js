import test from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

test('The BlueSeasContractor Gunjou Souun (BSC48-CX03) Suite', async (t) => {
  await t.test('1. Registration: BSC48-CX03 is registered with WHEN_DEPLOYED trigger', () => {
    assert.equal(PerCardRegistry.has('BSC48-CX03', 'WHEN_DEPLOYED'), true);
    const def = PerCardRegistry.get('BSC48-CX03');
    assert.equal(def.name, 'The BlueSeasContractor Gunjou Souun');
    assert.equal(def.cardType, 'Contract Nexus');
  });

  await t.test('2. Execution: When deployed, mills 3 and charges cores for matching targets', () => {
    const souun = { uid: 'nexus-1', card_number: 'BSC48-CX03', name: 'The BlueSeasContractor Gunjou Souun', currentCores: 1 };
    const duelState = {
      player: {
        field: [souun],
        nexus: [souun],
        deck: [
          { name: 'The GreenBird Douji', family: 'Fighting Spirit' },
          { name: 'The Dawn Temple Fortress Arun LT', type: 'Nexus' },
          { name: 'Random Magic', type: 'Magic' }
        ],
        trashCards: [],
        trash: 0
      },
      opponent: { field: [] }
    };

    let logged = [];
    const mockArenaApi = {
      addLog: (msg) => logged.push(msg),
      AudioFX: { coreChime: () => {} },
      renderDuelTable: () => {},
      renderPlayerHand: () => {}
    };

    PerCardRegistry.execute('BSC48-CX03', 'WHEN_DEPLOYED', {
      card: souun,
      side: 'player',
      duelState,
      arenaApi: mockArenaApi
    });

    // 2 matching cards (Fighting Spirit + Nexus) out of 3 milled
    assert.equal(duelState.player.trash, 3);
    assert.equal(duelState.player.trashCards.length, 3);
    assert.equal(souun.currentCores, 3); // 1 initial + 2 charged
    assert.equal(logged.some(l => l.includes('Neo-Core Charge')), true);
  });
});
