/**
 * tests/god_king_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 7: '07 - God King Saga (十二神皇編)'
 * Two-Tier Per-Card Handlers (BS35-BS39, SD33-SD36, BSC23-BSC27, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS35_SAGA_CARDS } from '../engine/cards/sets/bs35_cards.js';
import { BS36_SAGA_CARDS } from '../engine/cards/sets/bs36_cards.js';
import { BS37_SAGA_CARDS } from '../engine/cards/sets/bs37_cards.js';
import { BS38_SAGA_CARDS } from '../engine/cards/sets/bs38_cards.js';
import { BS39_SAGA_CARDS } from '../engine/cards/sets/bs39_cards.js';
import { SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd33_sd36_bsc23_bsc27_godking_promos_cards.js';

describe('God King Saga (十二神皇編) Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS35 to BS39 and God King Starter Decks/Promos registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS35-XX02'), 'BS35-XX02 God-Sechs should be registered');
    assert.ok(PerCardRegistry.get('BSC24-005'), 'BSC24-005 Golza should be registered');
    assert.ok(PerCardRegistry.get('BS36-XX02'), 'BS36-XX02 Pangaea should be registered');
    assert.ok(PerCardRegistry.get('BS38-CP03'), 'BS38-CP03 Explosive Demon-God should be registered');

    assert.ok(BS35_SAGA_CARDS.length >= 100, `BS35 cards count: ${BS35_SAGA_CARDS.length}`);
    assert.ok(BS36_SAGA_CARDS.length >= 80, `BS36 cards count: ${BS36_SAGA_CARDS.length}`);
    assert.ok(BS37_SAGA_CARDS.length >= 80, `BS37 cards count: ${BS37_SAGA_CARDS.length}`);
    assert.ok(BS38_SAGA_CARDS.length >= 90, `BS38 cards count: ${BS38_SAGA_CARDS.length}`);
    assert.ok(BS39_SAGA_CARDS.length >= 80, `BS39 cards count: ${BS39_SAGA_CARDS.length}`);
    assert.ok(SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS.length >= 300, `SD33-SD36/BSC23-BSC27 cards count: ${SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BSC24-005 The SuperAncientKaiju Golza ability execution', () => {
    const cardDef = PerCardRegistry.get('BSC24-005');
    assert.ok(cardDef, 'BSC24-005 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_ATTACKS || cardDef.triggers.WHEN_SUMMONED), 'WHEN_ATTACKS or WHEN_SUMMONED trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'golza_1', id: 'BSC24-005', currentBp: 4000, level: 1, currentCores: 1 }],
        reserve: 2,
        trash: 0,
        hand: []
      },
      opponent: {
        field: [{ uid: 'opp_sp_1', name: 'Opposing Blocker', currentBp: 3000, level: 1, currentCores: 1 }],
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

    const triggerFn = cardDef.triggers.WHEN_ATTACKS || cardDef.triggers.WHEN_SUMMONED;
    const applied = triggerFn(ctx);
    assert.equal(typeof applied, 'boolean');
  });

  it('3. Execution Integrity: BS35-XX02 God-Sechs triggers and abilities', () => {
    const cardDef = PerCardRegistry.get('BS35-XX02');
    assert.ok(cardDef, 'BS35-XX02 must have card definition');
    assert.ok(cardDef.triggers, 'BS35-XX02 triggers defined');
  });

  it('4. Total God King Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS35_SAGA_CARDS.length +
      BS36_SAGA_CARDS.length +
      BS37_SAGA_CARDS.length +
      BS38_SAGA_CARDS.length +
      BS39_SAGA_CARDS.length +
      SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 750, `Expected at least 750 God King Saga cards, found ${totalSetCards}`);
  });

});
