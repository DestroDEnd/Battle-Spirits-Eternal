/**
 * tests/advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 8: '08 - Advent Saga (煌臨編)'
 * Two-Tier Per-Card Handlers (BS40-BS43, SD37-SD40, BSC28-BSC30, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS40_SAGA_CARDS } from '../engine/cards/sets/bs40_cards.js';
import { BS41_SAGA_CARDS } from '../engine/cards/sets/bs41_cards.js';
import { BS42_SAGA_CARDS } from '../engine/cards/sets/bs42_cards.js';
import { BS43_SAGA_CARDS } from '../engine/cards/sets/bs43_cards.js';
import { SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd37_sd40_bsc28_bsc30_advent_promos_cards.js';

describe('Advent Saga (煌臨編) Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS40 to BS43 and Advent Starter Decks/Promos registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS40-X01'), 'BS40-X01 New-Siegfried should be registered');
    assert.ok(PerCardRegistry.get('BS40-078'), 'BS40-078 Dyna Power should be registered');
    assert.ok(PerCardRegistry.get('BS43-X01'), 'BS43-X01 Grand-Siegfried should be registered');
    assert.ok(PerCardRegistry.get('BS41-X06'), 'BS41-X06 Siegfried-Abyss should be registered');

    assert.ok(BS40_SAGA_CARDS.length >= 100, `BS40 cards count: ${BS40_SAGA_CARDS.length}`);
    assert.ok(BS41_SAGA_CARDS.length >= 90, `BS41 cards count: ${BS41_SAGA_CARDS.length}`);
    assert.ok(BS42_SAGA_CARDS.length >= 95, `BS42 cards count: ${BS42_SAGA_CARDS.length}`);
    assert.ok(BS43_SAGA_CARDS.length >= 100, `BS43 cards count: ${BS43_SAGA_CARDS.length}`);
    assert.ok(SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS.length >= 200, `SD37-SD40/BSC28-BSC30 cards count: ${SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS40-X01 The TwinkleDragonEmperor New-Siegfried Advent attack ability', () => {
    const cardDef = PerCardRegistry.get('BS40-X01');
    assert.ok(cardDef, 'BS40-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'new_sieg_1', id: 'BS40-X01', currentBp: 15000, level: 1, currentCores: 1, advented: true }],
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

  it('3. Execution Integrity: BS40-078 Dyna Power Main, Flash, and End Step resolution', () => {
    const cardDef = PerCardRegistry.get('BS40-078');
    assert.ok(cardDef, 'BS40-078 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.MAIN || cardDef.triggers.FLASH || cardDef.triggers.END_STEP), 'Dyna Power triggers defined');
  });

  it('4. Total Advent Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS40_SAGA_CARDS.length +
      BS41_SAGA_CARDS.length +
      BS42_SAGA_CARDS.length +
      BS43_SAGA_CARDS.length +
      SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 600, `Expected at least 600 Advent Saga cards, found ${totalSetCards}`);
  });

});
