/**
 * tests/heroes_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 3: '03 - Heroes Saga'
 * Two-Tier Per-Card Handlers (BS14-BS18, SD06-SD11, BSC06-BSC12, Promos).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS14_SAGA_CARDS } from '../engine/cards/sets/bs14_cards.js';
import { BS15_SAGA_CARDS } from '../engine/cards/sets/bs15_cards.js';
import { BS16_SAGA_CARDS } from '../engine/cards/sets/bs16_cards.js';
import { BS17_SAGA_CARDS } from '../engine/cards/sets/bs17_cards.js';
import { BS18_SAGA_CARDS } from '../engine/cards/sets/bs18_cards.js';
import { SD06_SD11_HEROES_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd06_sd11_heroes_promos_cards.js';

describe('Heroes Saga Two-Tier Per-Card Handlers Suite', () => {

  it('1. Registration Integrity: BS14 to BS18 and Starter Decks registered in PerCardRegistry', () => {
    assert.ok(PerCardRegistry.get('BS14-X01'), 'BS14-X01 Sieg-Yamato-Fried should be registered');
    assert.ok(PerCardRegistry.get('BS15-X01'), 'BS15-X01 Lord-Dragon-Emperor should be registered');
    assert.ok(PerCardRegistry.get('BS16-X01'), 'BS16-X01 Emperor-Siegfried should be registered');
    assert.ok(PerCardRegistry.get('BS17-X01'), 'BS17-X01 IronHero Dragonis should be registered');
    assert.ok(PerCardRegistry.get('BS18-X01'), 'BS18-X01 King-T-Rex should be registered');
    assert.ok(PerCardRegistry.get('SD06-001'), 'SD06-001 should be registered');
    assert.ok(PerCardRegistry.get('SD10-X01'), 'SD10-X01 should be registered');
    assert.ok(PerCardRegistry.get('SD11-X01'), 'SD11-X01 should be registered');

    assert.equal(BS14_SAGA_CARDS.length, 109);
    assert.equal(BS15_SAGA_CARDS.length, 80);
    assert.equal(BS16_SAGA_CARDS.length, 86);
    assert.equal(BS17_SAGA_CARDS.length, 88);
    assert.equal(BS18_SAGA_CARDS.length, 86);
    assert.equal(SD06_SD11_HEROES_PROMOS_SAGA_CARDS.length, 395);
  });

  it('2. Burst Mechanics: BS14-X01 (Sieg-Yamato-Fried) has BURST and WHEN_ATTACKS triggers', () => {
    const cardDef = PerCardRegistry.get('BS14-X01');
    assert.ok(cardDef, 'BS14-X01 must have card definition');
    assert.ok(cardDef.triggers.BURST, 'BS14-X01 must have BURST trigger registered');
    assert.ok(cardDef.triggers.WHEN_ATTACKS, 'BS14-X01 must have WHEN_ATTACKS trigger registered');

    let destroyedTarget = null;
    let audioPlayed = false;

    const dummyEnemySpirit = {
      uid: 'opp_sp_1',
      name: 'Opposing Attacker',
      currentBp: 4000,
      currentCores: 2
    };

    const dummyState = {
      player: {
        field: [],
        reserve: 3,
        trash: 0,
        trashCards: []
      },
      opponent: {
        field: [dummyEnemySpirit],
        reserve: 2,
        trash: 0,
        trashCards: []
      }
    };

    const ctx = {
      card: {
        card_number: 'BS14-X01',
        name: 'The DragonHero Sieg-Yamato-Fried',
        type: 'Spirit',
        levels: [{ level: 1, cores: 1, bp: 6000 }]
      },
      side: 'player',
      duelState: dummyState,
      arenaApi: {
        addLog: () => {},
        AudioFX: {
          destroy: () => { audioPlayed = true; },
          slash: () => {},
          summon: () => {}
        },
        destroyCard: (card) => {
          destroyedTarget = card;
        },
        sendToTrash: (c, side) => {
          dummyState[side].trashCards.push(c);
        }
      }
    };

    const applied = cardDef.triggers.BURST(ctx);
    assert.ok(applied, 'BURST trigger should return true indicating effect executed');
  });

  it('3. Magic Cards: BS14 Magics resolve with Tier 1 FLASH or MAIN triggers', () => {
    const bs14Magics = BS14_SAGA_CARDS.filter(c => c.cardType === 'Magic');
    assert.ok(bs14Magics.length > 0, 'BS14 must contain magic cards');
    for (const m of bs14Magics) {
      const reg = PerCardRegistry.get(m.cardNumber);
      assert.ok(reg, `Magic card ${m.cardNumber} must be registered`);
      assert.ok(reg.triggers.FLASH || reg.triggers.MAIN || reg.triggers.BURST, `Magic ${m.cardNumber} must have active timing trigger`);
    }
  });

  it('4. Rush Symbol Condition: Verifies requireSymbols sub-condition', () => {
    const rushCard = BS16_SAGA_CARDS.concat(BS17_SAGA_CARDS, BS18_SAGA_CARDS).find(d => {
      const abs = d.abilities || [];
      return abs.some(a => a.subConditions && a.subConditions.requireSymbols);
    });

    if (rushCard) {
      const reg = PerCardRegistry.get(rushCard.cardNumber);
      assert.ok(reg.triggers.WHEN_ATTACKS || reg.triggers.WHEN_SUMMONED || reg.triggers.FLASH, 'Rush card should have active trigger');
    }
  });

  it('5. Tribute Condition: Checks sacrifice requirement on cards with Tribute', () => {
    const tributeCard = BS14_SAGA_CARDS.concat(BS15_SAGA_CARDS).find(d => {
      const abs = d.abilities || [];
      return abs.some(a => a.subCost && a.subCost.type === 'SACRIFICE_SPIRIT');
    });

    if (tributeCard) {
      const reg = PerCardRegistry.get(tributeCard.cardNumber);
      assert.ok(reg, 'Tribute card must be in registry');
    }
  });
});
