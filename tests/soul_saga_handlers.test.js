/**
 * tests/soul_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 6: '06 - Soul Saga (Burning Legend)'
 * Two-Tier Per-Card Handlers (BS30-BS34, SD28-SD32, BSC20-BSC22, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS30_SAGA_CARDS } from '../engine/cards/sets/bs30_cards.js';
import { BS31_SAGA_CARDS } from '../engine/cards/sets/bs31_cards.js';
import { BS32_SAGA_CARDS } from '../engine/cards/sets/bs32_cards.js';
import { BS33_SAGA_CARDS } from '../engine/cards/sets/bs33_cards.js';
import { BS34_SAGA_CARDS } from '../engine/cards/sets/bs34_cards.js';
import { SD28_SD32_SOUL_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd28_sd32_soul_promos_cards.js';

describe('Soul Saga (Burning Legend) Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS30 to BS34 and Soul Starter Decks registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS31-X01'), 'BS31-X01 Souldragon should be registered');
    assert.ok(PerCardRegistry.get('BS33-029'), 'BS33-029 Tensei should be registered');
    assert.ok(PerCardRegistry.get('BS34-CP02'), 'BS34-CP02 Nakagami should be registered');
    assert.ok(PerCardRegistry.get('SD29-CP01'), 'SD29-CP01 Ashigaru Raptor should be registered');

    assert.ok(BS30_SAGA_CARDS.length >= 80, `BS30 cards count: ${BS30_SAGA_CARDS.length}`);
    assert.ok(BS31_SAGA_CARDS.length >= 120, `BS31 cards count: ${BS31_SAGA_CARDS.length}`);
    assert.ok(BS32_SAGA_CARDS.length >= 85, `BS32 cards count: ${BS32_SAGA_CARDS.length}`);
    assert.ok(BS33_SAGA_CARDS.length >= 80, `BS33 cards count: ${BS33_SAGA_CARDS.length}`);
    assert.ok(BS34_SAGA_CARDS.length >= 90, `BS34 cards count: ${BS34_SAGA_CARDS.length}`);
    assert.ok(SD28_SD32_SOUL_PROMOS_SAGA_CARDS.length >= 200, `SD28-SD32 cards count: ${SD28_SD32_SOUL_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS31-X01 Souldragon attack ability execution', () => {
    const cardDef = PerCardRegistry.get('BS31-X01');
    assert.ok(cardDef, 'BS31-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyEnemySpirit = {
      uid: 'opp_sp_1',
      name: 'Opposing Blocker',
      currentBp: 4000,
      currentCores: 1
    };

    const dummyState = {
      player: {
        field: [{ uid: 'souldragon_1', id: 'BS31-X01', currentBp: 6000, level: 1, currentCores: 1, hasSoulCore: true }],
        reserve: 2,
        trash: 0,
        hand: []
      },
      opponent: {
        field: [dummyEnemySpirit],
        reserve: 0,
        trash: 0
      }
    };

    const ctx = {
      card: dummyState.player.field[0],
      sourceCard: dummyState.player.field[0],
      side: 'player',
      duelState: dummyState,
      arenaApi: {
        addLog: () => {},
        AudioFX: { destroy: () => {}, slash: () => {}, summon: () => {} },
        destroyCard: () => {},
        sendToTrash: () => {}
      }
    };

    const applied = cardDef.triggers.WHEN_ATTACKS(ctx);
    assert.equal(typeof applied, 'boolean');
  });

  it('3. Execution Integrity: BS34-CP02 Nakagami summon and trigger definitions', () => {
    const cardDef = PerCardRegistry.get('BS34-CP02');
    assert.ok(cardDef, 'BS34-CP02 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_SUMMONED || cardDef.triggers.WHEN_ATTACKS), 'Summon or Attack trigger defined');
  });

  it('4. Total Soul Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS30_SAGA_CARDS.length +
      BS31_SAGA_CARDS.length +
      BS32_SAGA_CARDS.length +
      BS33_SAGA_CARDS.length +
      BS34_SAGA_CARDS.length +
      SD28_SD32_SOUL_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 650, `Expected at least 650 Soul Saga cards, found ${totalSetCards}`);
  });

});
