import test from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';

test('The PartnerMachine Stark (BS60-CX04) Contract Partner Suite', async (t) => {
  await t.test('1. Registration: BS60-CX04 is registered with MAIN and WHEN_ATTACKS triggers', () => {
    assert.equal(PerCardRegistry.has('BS60-CX04', 'MAIN'), true);
    assert.equal(PerCardRegistry.has('BS60-CX04', 'WHEN_ATTACKS'), true);
    const def = PerCardRegistry.get('BS60-CX04');
    assert.equal(def.name, 'The PartnerMachine Stark');
    assert.equal(def.cardType, 'Contract Spirit');
  });

  await t.test('2. Main Step Trigger: Increases counter by 1 and puts core from Void to Trash', () => {
    const handler = PerCardRegistry.get('BS60-CX04');
    const card = { uid: 'stark-01', name: 'The PartnerMachine Stark', currentLevel: 1 };
    const duelState = {
      player: {
        counters: 0,
        counter: 0,
        trash: 0,
        field: [card]
      }
    };
    const ctx = {
      card,
      side: 'player',
      duelState,
      arenaApi: {
        addLog() {},
        AudioFX: { coreChime() {} },
        renderDuelTable() {}
      }
    };

    handler.triggers.MAIN(ctx);
    assert.equal(duelState.player.counters, 1);
    assert.equal(duelState.player.trash, 1);
  });

  await t.test('3. When Attacks Trigger: Activates set Silver Zero burst', () => {
    const handler = PerCardRegistry.get('BS60-CX04');
    const card = { uid: 'stark-01', name: 'The PartnerMachine Stark', currentLevel: 1 };
    let activated = false;
    const duelState = {
      player: {
        field: [card],
        burst: { name: 'Clear Wall', card_number: 'BS60-092', family: 'Silver Zero' }
      }
    };
    const ctx = {
      card,
      side: 'player',
      duelState,
      arenaApi: {
        activateBurst(side) {
          if (side === 'player') activated = true;
        },
        addLog() {}
      }
    };

    handler.triggers.WHEN_ATTACKS(ctx);
    assert.equal(activated, true);
    assert.equal(card._starkBurstActivatedOncePerGame, true);
  });
});
