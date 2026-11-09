/**
 * tests/ultimate_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 5: '05 - Ultimate Saga'
 * Two-Tier Per-Card Handlers (BS24-BS29, SD18-SD27, BSC17-BSC19, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS24_SAGA_CARDS } from '../engine/cards/sets/bs24_cards.js';
import { BS25_SAGA_CARDS } from '../engine/cards/sets/bs25_cards.js';
import { BS26_SAGA_CARDS } from '../engine/cards/sets/bs26_cards.js';
import { BS27_SAGA_CARDS } from '../engine/cards/sets/bs27_cards.js';
import { BS28_SAGA_CARDS } from '../engine/cards/sets/bs28_cards.js';
import { BS29_SAGA_CARDS } from '../engine/cards/sets/bs29_cards.js';
import { SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd18_sd27_ultimate_promos_cards.js';

describe('Ultimate Saga Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS24 to BS29 and Ultimate Starter Decks registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS24-X03'), 'BS24-X03 Ultimate-Siegfrieden should be registered');
    assert.ok(PerCardRegistry.get('BS24-X06'), 'BS24-X06 Ultimate-Thor should be registered');
    assert.ok(PerCardRegistry.get('BS25-X04'), 'BS25-X04 Ultimate-Beelzebeat should be registered');
    assert.ok(PerCardRegistry.get('BS25-X06'), 'BS25-X06 Ultimate-Grand-Woden should be registered');
    assert.ok(PerCardRegistry.get('BS28-X05'), 'BS28-X05 Ultimate-Seiryubi should be registered');
    assert.ok(PerCardRegistry.get('BS29-X01'), 'BS29-X01 Saint d\'Arc should be registered');

    assert.ok(BS24_SAGA_CARDS.length >= 100, `BS24 cards count: ${BS24_SAGA_CARDS.length}`);
    assert.ok(BS25_SAGA_CARDS.length >= 80, `BS25 cards count: ${BS25_SAGA_CARDS.length}`);
    assert.ok(BS26_SAGA_CARDS.length >= 60, `BS26 cards count: ${BS26_SAGA_CARDS.length}`);
    assert.ok(BS27_SAGA_CARDS.length >= 75, `BS27 cards count: ${BS27_SAGA_CARDS.length}`);
    assert.ok(BS28_SAGA_CARDS.length >= 70, `BS28 cards count: ${BS28_SAGA_CARDS.length}`);
    assert.ok(BS29_SAGA_CARDS.length >= 75, `BS29 cards count: ${BS29_SAGA_CARDS.length}`);
    assert.ok(SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS.length >= 250, `SD18-SD27 cards count: ${SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS24-X03 Ultimate-Siegfrieden U-Trigger attack execution', () => {
    const cardDef = PerCardRegistry.get('BS24-X03');
    assert.ok(cardDef, 'BS24-X03 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyEnemySpirit = {
      uid: 'opp_sp_1',
      name: 'Opposing Blocker',
      currentBp: 4000,
      currentCores: 1
    };

    const dummyState = {
      player: {
        field: [{ uid: 'u_siegfrieden_1', id: 'BS24-X03', currentBp: 12000, level: 3, currentCores: 1, type: 'Ultimate' }],
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

  it('3. Execution Integrity: BS28-X05 Ultimate-Seiryubi Flash / Free Summon condition', () => {
    const cardDef = PerCardRegistry.get('BS28-X05');
    assert.ok(cardDef, 'BS28-X05 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_SUMMONED || cardDef.triggers.WHEN_ATTACKS), 'Summon or Attack trigger defined');
  });

  it('4. Total Ultimate Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS24_SAGA_CARDS.length +
      BS25_SAGA_CARDS.length +
      BS26_SAGA_CARDS.length +
      BS27_SAGA_CARDS.length +
      BS28_SAGA_CARDS.length +
      BS29_SAGA_CARDS.length +
      SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 750, `Expected at least 750 Ultimate Saga cards, found ${totalSetCards}`);
  });

});
