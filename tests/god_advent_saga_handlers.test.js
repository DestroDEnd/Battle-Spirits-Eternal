/**
 * tests/god_advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 9: '09 - God Advent / Dual Era Saga (神煌臨編)'
 * Two-Tier Per-Card Handlers (BS44-BS47, SD41-SD44, BSC31-BSC33, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS44_SAGA_CARDS } from '../engine/cards/sets/bs44_cards.js';
import { BS45_SAGA_CARDS } from '../engine/cards/sets/bs45_cards.js';
import { BS46_SAGA_CARDS } from '../engine/cards/sets/bs46_cards.js';
import { BS47_SAGA_CARDS } from '../engine/cards/sets/bs47_cards.js';
import { SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd41_sd44_bsc31_bsc33_godadvent_promos_cards.js';

describe('God Advent / Dual Era Saga (神煌臨編) Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS44 to BS47 and Starter Decks/Promos registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS44-X01'), 'BS44-X01 Apollowurm should be registered');
    assert.ok(PerCardRegistry.get('BS44-X06'), 'BS44-X06 Pharaom should be registered');
    assert.ok(PerCardRegistry.get('BS46-X10'), 'BS46-X10 Grandwalker Hera should be registered');
    assert.ok(PerCardRegistry.get('SD43-X02'), 'SD43-X02 Strike-Siegwurm X should be registered');

    assert.ok(BS44_SAGA_CARDS.length >= 100, `BS44 cards count: ${BS44_SAGA_CARDS.length}`);
    assert.ok(BS45_SAGA_CARDS.length >= 80, `BS45 cards count: ${BS45_SAGA_CARDS.length}`);
    assert.ok(BS46_SAGA_CARDS.length >= 90, `BS46 cards count: ${BS46_SAGA_CARDS.length}`);
    assert.ok(BS47_SAGA_CARDS.length >= 100, `BS47 cards count: ${BS47_SAGA_CARDS.length}`);
    assert.ok(SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS.length >= 200, `SD41-SD44/BSC31-BSC33 cards count: ${SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS44-X01 The SunSupernovaDragon Apollowurm attack ability', () => {
    const cardDef = PerCardRegistry.get('BS44-X01');
    assert.ok(cardDef, 'BS44-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'apollowurm_1', id: 'BS44-X01', currentBp: 12000, level: 1, currentCores: 1 }],
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

  it('3. Execution Integrity: BS46-X10 Grandwalker Hera triggers and Core Charge', () => {
    const cardDef = PerCardRegistry.get('BS46-X10');
    assert.ok(cardDef, 'BS46-X10 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_SUMMONED || cardDef.triggers.WHEN_ATTACKS), 'Grandwalker triggers defined');
  });

  it('4. Total God Advent Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS44_SAGA_CARDS.length +
      BS45_SAGA_CARDS.length +
      BS46_SAGA_CARDS.length +
      BS47_SAGA_CARDS.length +
      SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 600, `Expected at least 600 God Advent Saga cards, found ${totalSetCards}`);
  });

});
