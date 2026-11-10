import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { BS52_SAGA_CARDS } from '../engine/cards/sets/bs52_cards.js';
import { BS53_SAGA_CARDS } from '../engine/cards/sets/bs53_cards.js';
import { BS54_SAGA_CARDS } from '../engine/cards/sets/bs54_cards.js';
import { BS55_SAGA_CARDS } from '../engine/cards/sets/bs55_cards.js';
import { SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd51_sd57_bsc36_rebirth_promos_cards.js';

describe('Rebirth Saga (転醒編) Two-Tier Per-Card Handlers Suite', () => {
  it('1. Registration Integrity: BS52 to BS55 and Rebirth Starter Decks registered in PerCardRegistry', () => {
    assert.ok(BS52_SAGA_CARDS.length >= 120, `BS52 cards count: ${BS52_SAGA_CARDS.length}`);
    assert.ok(BS53_SAGA_CARDS.length >= 120, `BS53 cards count: ${BS53_SAGA_CARDS.length}`);
    assert.ok(BS54_SAGA_CARDS.length >= 110, `BS54 cards count: ${BS54_SAGA_CARDS.length}`);
    assert.ok(BS55_SAGA_CARDS.length >= 130, `BS55 cards count: ${BS55_SAGA_CARDS.length}`);
    assert.ok(SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS.length >= 190, `Starter/BSC cards count: ${SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS.length}`);

    // Verify sample cards are registered in PerCardRegistry
    const sampleNumbers = ['BS52-TX01', 'BS53-001', 'BS54-001', 'BS55-001', 'SD51-008'];
    for (const num of sampleNumbers) {
      const handler = PerCardRegistry.get(num);
      assert.ok(handler, `Card ${num} should be registered in PerCardRegistry`);
      assert.ok(handler.triggers, `Card ${num} should have triggers defined`);
    }
  });

  it('2. Execution Integrity: BS52-TX01 (The Red Divine Dragon Emperor) Reborn trigger execution', () => {
    const handler = PerCardRegistry.get('BS52-TX01');
    assert.ok(handler, 'BS52-TX01 must be registered');
    assert.ok(handler.triggers.WHEN_REBORN, 'BS52-TX01 must have WHEN_REBORN trigger');

    // Context mock for when reborn
    let destroyedCount = 0;
    const ctx = {
      card: { cardNumber: 'BS52-TX01', currentBp: 6000, currentLevel: 1 },
      side: 'player',
      duelState: {
        player: { field: [{ cardNumber: 'BS52-TX01', currentLevel: 1, currentBp: 6000 }], trash: [], reserve: 0 },
        opponent: { field: [{ cardNumber: 'BS01-001', currentLevel: 1, cost: 2, currentBp: 2000 }], trash: [] }
      },
      arenaApi: {
        addLog: () => {},
        AudioFX: {},
        renderDuelTable: () => {},
        recalculateSpiritBp: () => {},
        sendToTrash: (target) => {
          destroyedCount++;
        }
      }
    };

    const res = handler.triggers.WHEN_REBORN(ctx);
    assert.ok(res, 'WHEN_REBORN should apply effects successfully');
    assert.equal(destroyedCount, 1, 'Opposing spirit within cost threshold should be destroyed');
  });

  it('3. Total Rebirth Saga Cards Registered Verification', () => {
    const totalSagaCards =
      BS52_SAGA_CARDS.length +
      BS53_SAGA_CARDS.length +
      BS54_SAGA_CARDS.length +
      BS55_SAGA_CARDS.length +
      SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSagaCards >= 700, `Total Rebirth Saga registered cards: ${totalSagaCards}`);
    console.log(`[Rebirth Saga Handlers] Total registered cards: ${totalSagaCards}`);
  });
});
