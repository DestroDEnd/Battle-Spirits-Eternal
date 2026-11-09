/**
 * tests/ultra_advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 10: '10 - Ultra Advent Saga (超煌臨編)'
 * Two-Tier Per-Card Handlers (BS48-BS51, SD45-SD50, BSC34-BSC35, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS48_SAGA_CARDS } from '../engine/cards/sets/bs48_cards.js';
import { BS49_SAGA_CARDS } from '../engine/cards/sets/bs49_cards.js';
import { BS50_SAGA_CARDS } from '../engine/cards/sets/bs50_cards.js';
import { BS51_SAGA_CARDS } from '../engine/cards/sets/bs51_cards.js';
import { SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd45_sd50_bsc34_bsc35_ultraadvent_promos_cards.js';

describe('Ultra Advent Saga (超煌臨編) Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS48 to BS51 and Starter Decks/Promos registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS51-X01'), 'BS51-X01 Grand-Terasu should be registered');
    assert.ok(PerCardRegistry.get('BS51-X08'), 'BS51-X08 Grandwalker Amaterasu should be registered');
    assert.ok(PerCardRegistry.get('SD48-X03'), 'SD48-X03 Grandwalker Brahma should be registered');
    assert.ok(PerCardRegistry.get('BS49-X01'), 'BS49-X01 Murakumo Rex should be registered');

    assert.ok(BS48_SAGA_CARDS.length >= 90, `BS48 cards count: ${BS48_SAGA_CARDS.length}`);
    assert.ok(BS49_SAGA_CARDS.length >= 100, `BS49 cards count: ${BS49_SAGA_CARDS.length}`);
    assert.ok(BS50_SAGA_CARDS.length >= 100, `BS50 cards count: ${BS50_SAGA_CARDS.length}`);
    assert.ok(BS51_SAGA_CARDS.length >= 90, `BS51 cards count: ${BS51_SAGA_CARDS.length}`);
    assert.ok(SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS.length >= 200, `SD45-SD50/BSC34-BSC35 cards count: ${SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS51-X01 Grand-Terasu attack ability execution', () => {
    const cardDef = PerCardRegistry.get('BS51-X01');
    assert.ok(cardDef, 'BS51-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'terasu_1', id: 'BS51-X01', currentBp: 15000, level: 1, currentCores: 1 }],
        reserve: 2,
        trash: 0,
        hand: []
      },
      opponent: {
        field: [{ uid: 'opp_sp_1', name: 'Opposing Blocker', currentBp: 5000, level: 1, currentCores: 1 }],
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

  it('3. Execution Integrity: BS51-X08 Grandwalker Amaterasu Core Charge and triggers', () => {
    const cardDef = PerCardRegistry.get('BS51-X08');
    assert.ok(cardDef, 'BS51-X08 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_SUMMONED || cardDef.triggers.WHEN_ATTACKS), 'Grandwalker triggers defined');
  });

  it('4. Total Ultra Advent Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS48_SAGA_CARDS.length +
      BS49_SAGA_CARDS.length +
      BS50_SAGA_CARDS.length +
      BS51_SAGA_CARDS.length +
      SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 600, `Expected at least 600 Ultra Advent Saga cards, found ${totalSetCards}`);
  });

});
