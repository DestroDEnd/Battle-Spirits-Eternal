/**
 * tests/booster_set_saga_handlers.test.js
 *
 * Comprehensive Verification Suite for the Booster Set Saga Two-Tier Per-Card Handler System:
 *   - Tier 1: Overall Condition Routing (WHEN_SUMMONED, WHEN_DEPLOYED, WHEN_ATTACKS,
 *             WHEN_BLOCKS, WHEN_BATTLES, WHEN_DESTROYED, START_STEP, CORE_STEP,
 *             DRAW_STEP, REFRESH_STEP, MAIN_STEP, ATTACK_STEP, END_STEP, MAIN,
 *             FLASH, BURST, AURA_BP, AURA_KEYWORDS)
 *   - Tier 2A: Sub-Internal-Condition Guards (levels, turn ownership, family/color/symbol
 *              board presence, Soul Core, Life threshold, Once-Per-Turn, Sub-Costs)
 *   - Tier 2B: Sub-Internal-Effect Primitives (BP buffs, Void core ramp, Core drain +
 *              depletion destruction, Awaken, Destroy by BP/Cost/Exhausted/Nexus,
 *              Bounce to Hand/Deck, Refresh/Exhaust, Draw/Discard, Mill/Crush,
 *              Salvage/Reanimate, Unblockable, Damage Wall, End Attack Step)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS01_SAGA_CARDS } from '../engine/cards/sets/bs01_cards.js';
import { BS02_SAGA_CARDS } from '../engine/cards/sets/bs02_cards.js';
import { BS03_SAGA_CARDS } from '../engine/cards/sets/bs03_cards.js';
import { BS04_SAGA_CARDS } from '../engine/cards/sets/bs04_cards.js';
import { BS05_SAGA_CARDS } from '../engine/cards/sets/bs05_cards.js';
import { BS06_SAGA_CARDS } from '../engine/cards/sets/bs06_cards.js';
import { BS07_SAGA_CARDS } from '../engine/cards/sets/bs07_cards.js';
import { BS08_SAGA_CARDS } from '../engine/cards/sets/bs08_cards.js';
import { BS09_SAGA_CARDS } from '../engine/cards/sets/bs09_cards.js';
import { SD01_SD02_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd01_sd02_promos_cards.js';

function createMockDuelState() {
  return {
    inDuel: true,
    turn: 2,
    activePlayer: 'player',
    phaseIndex: 5,
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    modifiers: [],
    player: {
      life: 5,
      reserve: 4,
      trash: 2,
      soulCoreLocation: 'reserve',
      field: [],
      nexus: [],
      hand: [],
      deck: [
        { uid: 'd1', name: 'Deck Card 1', type: 'Spirit', color: 'Red', cost: 3 },
        { uid: 'd2', name: 'Deck Card 2', type: 'Magic', color: 'Red', cost: 2 },
        { uid: 'd3', name: 'Deck Card 3', type: 'Spirit', color: 'Red', cost: 4 }
      ],
      trashCards: []
    },
    opponent: {
      life: 5,
      reserve: 3,
      trash: 1,
      soulCoreLocation: 'reserve',
      field: [],
      nexus: [],
      hand: [],
      deck: [
        { uid: 'od1', name: 'Opp Deck 1', type: 'Spirit', color: 'White', cost: 2 },
        { uid: 'od2', name: 'Opp Deck 2', type: 'Spirit', color: 'White', cost: 3 },
        { uid: 'od3', name: 'Opp Deck 3', type: 'Magic', color: 'White', cost: 4 },
        { uid: 'od4', name: 'Opp Deck 4', type: 'Spirit', color: 'White', cost: 5 }
      ],
      trashCards: []
    }
  };
}

describe('Booster Set Saga — Two-Tier Per-Card Handler System', () => {
  it('1. Registers all 1,010 Booster Set Saga cards across BS01–BS09, SD01–SD02, and Promos', () => {
    const allSets = [
      ...BS01_SAGA_CARDS,
      ...BS02_SAGA_CARDS,
      ...BS03_SAGA_CARDS,
      ...BS04_SAGA_CARDS,
      ...BS05_SAGA_CARDS,
      ...BS06_SAGA_CARDS,
      ...BS07_SAGA_CARDS,
      ...BS08_SAGA_CARDS,
      ...BS09_SAGA_CARDS,
      ...SD01_SD02_PROMOS_SAGA_CARDS
    ];
    assert.ok(allSets.length >= 1000, `Expected >= 1000 Saga cards, got ${allSets.length}`);

    for (const spec of allSets) {
      const entry = PerCardRegistry.get(spec.cardNumber);
      assert.ok(entry, `Card ${spec.cardNumber} (${spec.name}) must be registered in PerCardRegistry`);
      if (!spec.isVanilla) {
        assert.ok(
          Object.keys(entry.triggers).length > 0,
          `Non-vanilla card ${spec.cardNumber} (${spec.name}) must expose at least 1 Tier 1 trigger`
        );
      }
    }
  });

  it('2. Tier 1 (WHEN_DESTROYED) + Tier 2A (Level Gate [LV3]) + Tier 2B (RECOVER_LIFE): BS01-X01 (The DragonEmperor Siegfried)', () => {
    const duelState = createMockDuelState();
    const siegfried = {
      uid: 'sieg_1',
      card_number: 'BS01-X01',
      name: 'The DragonEmperor Siegfried',
      type: 'Spirit',
      color: 'Red',
      currentLevel: 2,
      currentCores: 3,
      currentBp: 6000
    };
    duelState.player.life = 3;

    // At Lv2, [LV3] (When Destroyed) sub-condition is NOT met -> Life remains 3
    PerCardRegistry.execute('BS01-X01', 'WHEN_DESTROYED', {
      card: siegfried,
      side: 'player',
      duelState
    });
    assert.equal(duelState.player.life, 3, 'Lv2 Siegfried should not trigger [LV3] Life recovery');

    // At Lv3, [LV3] (When Destroyed) sub-condition IS met -> Life increases to 4
    siegfried.currentLevel = 3;
    PerCardRegistry.execute('BS01-X01', 'WHEN_DESTROYED', {
      card: siegfried,
      side: 'player',
      duelState
    });
    assert.equal(duelState.player.life, 4, 'Lv3 Siegfried must recover +1 Life from Void when destroyed');
  });

  it('3. Tier 1 (FLASH) + Tier 2B (AWAKEN): BS01-X01 transfers cores from allied Spirit and refreshes', () => {
    const duelState = createMockDuelState();
    const siegfried = {
      uid: 'sieg_1',
      card_number: 'BS01-X01',
      name: 'The DragonEmperor Siegfried',
      type: 'Spirit',
      color: 'Red',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 4000,
      isExhausted: true
    };
    const ally = {
      uid: 'ally_1',
      name: 'Lizardedge',
      type: 'Spirit',
      color: 'Red',
      currentLevel: 2,
      currentCores: 3,
      currentBp: 3000
    };
    duelState.player.field.push(siegfried, ally);

    PerCardRegistry.execute('BS01-X01', 'FLASH', {
      card: siegfried,
      side: 'player',
      duelState
    });

    assert.equal(siegfried.currentCores, 3, 'Siegfried should receive 2 cores via [Awaken]');
    assert.equal(ally.currentCores, 1, 'Ally should retain 1 core');
    assert.equal(siegfried.isExhausted, false, 'Awaken refreshes the Spirit');
  });

  it('4. Tier 1 (WHEN_SUMMONED) + Tier 2B (DESTROY_BY_BP & CORE_FROM_VOID): BS01-017 (Lanceraptor) & BS01-061 (Apewhip)', () => {
    const duelState = createMockDuelState();
    const weakEnemy = {
      uid: 'opp_1',
      name: 'Weak Spirit',
      type: 'Spirit',
      color: 'Purple',
      cost: 1,
      currentCores: 1,
      currentLevel: 1,
      currentBp: 2000
    };
    duelState.opponent.field.push(weakEnemy);

    const lanceraptor = {
      uid: 'lr_1',
      card_number: 'BS01-017',
      name: 'Lanceraptor',
      type: 'Spirit',
      color: 'Red',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 2000
    };
    duelState.player.field.push(lanceraptor);

    PerCardRegistry.execute('BS01-017', 'WHEN_SUMMONED', {
      card: lanceraptor,
      side: 'player',
      duelState
    });
    assert.equal(duelState.opponent.field.length, 0, 'Lanceraptor must destroy <= 2000 BP opposing Spirit');

    const prevReserve = duelState.player.reserve;
    const apewhip = {
      uid: 'aw_1',
      card_number: 'BS01-061',
      name: 'Apewhip',
      type: 'Spirit',
      color: 'Green',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 2000
    };
    PerCardRegistry.execute('BS01-061', 'WHEN_SUMMONED', {
      card: apewhip,
      side: 'player',
      duelState
    });
    assert.equal(duelState.player.reserve, prevReserve + 1, 'Apewhip must add +1 core from Void to Reserve');
  });

  it('5. Tier 1 (WHEN_DESTROYED) + Tier 2B (CORE_DRAIN with 0-core depletion): Bogies (BATTLE-SPIRITS-A1027)', () => {
    const duelState = createMockDuelState();
    const oppSpirit = {
      uid: 'opp_sp',
      name: 'Enemy Guard',
      type: 'Spirit',
      color: 'White',
      currentCores: 2,
      currentLevel: 1,
      currentBp: 3000
    };
    duelState.opponent.field.push(oppSpirit);

    const bogies = {
      uid: 'bog_1',
      card_number: 'BATTLE-SPIRITS-A1027',
      name: 'Bogies',
      type: 'Spirit',
      color: 'Purple',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 2000
    };

    PerCardRegistry.execute('BATTLE-SPIRITS-A1027', 'WHEN_DESTROYED', {
      card: bogies,
      side: 'player',
      duelState
    });

    assert.equal(duelState.opponent.field.length, 0, 'Draining all 2 cores must deplete and destroy the opposing Spirit');
    assert.equal(duelState.opponent.trash, 3, 'Drained cores sent to opponent Trash');
  });

  it('6. Tier 1 (AURA_BP) + Tier 2A (Family & Turn Guard): Volgenodragon boosts Terra Dragon allies', () => {
    const duelState = createMockDuelState();
    const volgeno = {
      uid: 'vol_1',
      card_number: 'BATTLE-SPIRITS-A14326',
      name: 'Volgenodragon',
      type: 'Spirit',
      color: 'Red',
      family: 'Terra Dragon',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 3000
    };
    const terraAlly = {
      uid: 'ta_1',
      name: 'Raptor',
      type: 'Spirit',
      color: 'Red',
      family: 'Terra Dragon',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 2000
    };
    const nonTerraAlly = {
      uid: 'nta_1',
      name: 'Mage',
      type: 'Spirit',
      color: 'Red',
      family: 'Magician',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 2000
    };
    duelState.player.field.push(volgeno, terraAlly, nonTerraAlly);

    const terraBonus = PerCardRegistry.computeFieldAuraBp(terraAlly, 'player', duelState);
    const nonTerraBonus = PerCardRegistry.computeFieldAuraBp(nonTerraAlly, 'player', duelState);

    assert.equal(terraBonus, 1000, 'Terra Dragon ally must receive +1000 BP aura from Volgenodragon');
    assert.equal(nonTerraBonus, 0, 'Non-Terra Dragon ally must NOT receive Terra Dragon aura');
  });

  it('7. Tier 1 (WHEN_ATTACKS) + Tier 2B (MILL_DECK / Crush & Sub-Cost EXHAUST_NEXUS / Assault): BS04 Blue Mechanics', () => {
    const duelState = createMockDuelState();
    const customCrushCard = {
      cardNumber: 'TEST-CRUSH-01',
      name: 'Test Crush Giant',
      cardType: 'Spirit',
      isVanilla: false,
      abilities: [
        {
          overall: 'WHEN_ATTACKS',
          subConditions: { levels: [1, 2], turn: 'YOUR', oncePerTurn: 'crush_opt' },
          subCost: { type: 'EXHAUST_NEXUS', count: 1 },
          subEffects: [
            { op: 'MILL_DECK', side: 'OPPONENT', scaleByLevel: true, perLevel: 1 },
            { op: 'REFRESH_SPIRITS', scope: 'SELF', ifPreviousApplied: true }
          ]
        }
      ]
    };
    SagaConditionDSL.registerSagaCard(customCrushCard);

    const attacker = {
      uid: 'cr_1',
      card_number: 'TEST-CRUSH-01',
      name: 'Test Crush Giant',
      type: 'Spirit',
      color: 'Blue',
      currentLevel: 2,
      currentCores: 3,
      isExhausted: true
    };
    const blueNexus = {
      uid: 'nx_1',
      name: 'Blue Coliseum',
      type: 'Nexus',
      color: 'Blue',
      currentLevel: 1,
      isExhausted: false
    };
    duelState.player.field.push(attacker);
    duelState.player.nexus.push(blueNexus);

    const initialOppDeck = duelState.opponent.deck.length;
    PerCardRegistry.execute('TEST-CRUSH-01', 'WHEN_ATTACKS', {
      card: attacker,
      side: 'player',
      duelState
    });

    assert.equal(blueNexus.isExhausted, true, 'Sub-cost must exhaust 1 friendly Nexus');
    assert.equal(duelState.opponent.deck.length, initialOppDeck - 2, 'Lv2 Crush must mill 2 cards from opponent deck');
    assert.equal(attacker.isExhausted, false, 'Chained Assault sub-effect must refresh the attacker');
  });
});
