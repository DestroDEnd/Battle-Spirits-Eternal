/**
 * tests/sword_blade_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 4: '04 - Sword Blade Saga'
 * Two-Tier Per-Card Handlers (BS19-BS23, SD12-SD17, BSC13-BSC16, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS19_SAGA_CARDS } from '../engine/cards/sets/bs19_cards.js';
import { BS20_SAGA_CARDS } from '../engine/cards/sets/bs20_cards.js';
import { BS21_SAGA_CARDS } from '../engine/cards/sets/bs21_cards.js';
import { BS22_SAGA_CARDS } from '../engine/cards/sets/bs22_cards.js';
import { BS23_SAGA_CARDS } from '../engine/cards/sets/bs23_cards.js';
import { SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd12_sd17_swordblade_promos_cards.js';

describe('Sword Blade Saga Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS19 to BS23 and Starter Decks registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS19-X01'), 'BS19-X01 Starblade-Dragon should be registered');
    assert.ok(PerCardRegistry.get('BS19-X07'), 'BS19-X07 Usubakagero should be registered');
    assert.ok(PerCardRegistry.get('BS20-X01'), 'BS20-X01 TheEnd-Dragonis should be registered');
    assert.ok(PerCardRegistry.get('BS21-X01'), 'BS21-X01 Shining-Dragon-Ark should be registered');
    assert.ok(PerCardRegistry.get('BS22-X01'), 'BS22-X01 Gigano-Rex should be registered');
    assert.ok(PerCardRegistry.get('BS23-X01'), 'BS23-X01 Shining-Dragon-Overray should be registered');
    assert.ok(PerCardRegistry.get('BS23-X07'), 'BS23-X07 Truth-Eden should be registered');
    assert.ok(PerCardRegistry.get('BS23-X08'), 'BS23-X08 Lightning-Shion should be registered');

    assert.ok(BS19_SAGA_CARDS.length >= 90, `BS19 cards count: ${BS19_SAGA_CARDS.length}`);
    assert.ok(BS20_SAGA_CARDS.length >= 50, `BS20 cards count: ${BS20_SAGA_CARDS.length}`);
    assert.ok(BS21_SAGA_CARDS.length >= 55, `BS21 cards count: ${BS21_SAGA_CARDS.length}`);
    assert.ok(BS22_SAGA_CARDS.length >= 70, `BS22 cards count: ${BS22_SAGA_CARDS.length}`);
    assert.ok(BS23_SAGA_CARDS.length >= 70, `BS23 cards count: ${BS23_SAGA_CARDS.length}`);
    assert.ok(SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS.length >= 200, `SD12-SD17 cards count: ${SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS.length}`);
  });

  it('2. Execution Integrity: BS19-X01 Starblade-Dragon attack ability execution', () => {
    const cardDef = PerCardRegistry.get('BS19-X01');
    assert.ok(cardDef, 'BS19-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyEnemySpirit = {
      uid: 'opp_sp_1',
      name: 'Opposing Blocker',
      currentBp: 4000,
      currentCores: 1
    };

    const dummyState = {
      player: {
        field: [{ uid: 'starblade_1', id: 'BS19-X01', currentBp: 8000, level: 1, currentCores: 1 }],
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

    let destroyedTarget = null;
    const ctx = {
      card: dummyState.player.field[0],
      sourceCard: dummyState.player.field[0],
      side: 'player',
      duelState: dummyState,
      arenaApi: {
        addLog: () => {},
        AudioFX: { destroy: () => {}, slash: () => {}, summon: () => {} },
        destroyCard: (c) => { destroyedTarget = c; },
        sendToTrash: () => {}
      }
    };

    const applied = cardDef.triggers.WHEN_ATTACKS(ctx);
    assert.equal(typeof applied, 'boolean');
  });

  it('3. Execution Integrity: BS19-X07 Usubakagero Brave effect execution', () => {
    const cardDef = PerCardRegistry.get('BS19-X07');
    assert.ok(cardDef, 'BS19-X07 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_BRAVED, 'WHEN_BRAVED trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'sp_braved_1', id: 'BS19-001', currentBp: 5000, level: 1, braved: true }],
        reserve: 1,
        trash: 0,
        hand: []
      },
      opponent: { field: [], reserve: 0, trash: 0 }
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

    const applied = cardDef.triggers.WHEN_BRAVED(ctx);
    assert.equal(typeof applied, 'boolean');
  });

  it('4. Execution Integrity: BS22-X01 Gigano-Rex Attack execution', () => {
    const cardDef = PerCardRegistry.get('BS22-X01');
    assert.ok(cardDef, 'BS22-X01 must have card definition');
    assert.ok(cardDef.triggers && cardDef.triggers.WHEN_ATTACKS, 'WHEN_ATTACKS trigger defined');

    const dummyState = {
      player: {
        field: [{ uid: 'gigano_1', id: 'BS22-X01', currentBp: 7000, level: 1, currentCores: 1, family: 'Terra Dragon' }],
        reserve: 3,
        trash: 0,
        hand: []
      },
      opponent: {
        field: [{ uid: 'opp_sp_1', currentBp: 3000, level: 1, currentCores: 1 }],
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

  it('5. Execution Integrity: BS23-X08 Lightning-Shion Brave and Depletion', () => {
    const cardDef = PerCardRegistry.get('BS23-X08');
    assert.ok(cardDef, 'BS23-X08 must have card definition');
    assert.ok(cardDef.triggers && (cardDef.triggers.WHEN_SUMMONED || cardDef.triggers.WHEN_BRAVED), 'Summon/Brave trigger defined');
  });

  it('6. Total Sword Blade Saga Cards Registered Verification', () => {
    const totalSetCards = 
      BS19_SAGA_CARDS.length +
      BS20_SAGA_CARDS.length +
      BS21_SAGA_CARDS.length +
      BS22_SAGA_CARDS.length +
      BS23_SAGA_CARDS.length +
      SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS.length;

    assert.ok(totalSetCards >= 500, `Expected at least 500 Sword Blade Saga cards, found ${totalSetCards}`);
  });

});
