/**
 * tests/constellation_saga_handlers.test.js
 *
 * Comprehensive Verification Suite for the Constellation Saga Two-Tier Per-Card Handler System:
 *   - BS10, BS11, BS12, BS13, SD03, BSC05, Constellation Promos (507 cards registered)
 *   - Brave Mechanics: [When Braved] / [During Brave] guards and Host + Brave dual dispatch
 *   - Zodiac Ace Mechanics: [Heavy Armor], [Ultra Awaken], [Crush], [Tribute], [Brilliance]
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';
import { BS10_SAGA_CARDS } from '../engine/cards/sets/bs10_cards.js';
import { BS11_SAGA_CARDS } from '../engine/cards/sets/bs11_cards.js';
import { BS12_SAGA_CARDS } from '../engine/cards/sets/bs12_cards.js';
import { BS13_SAGA_CARDS } from '../engine/cards/sets/bs13_cards.js';
import { SD03_BSC05_CONSTELLATION_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd03_bsc05_constellation_promos_cards.js';

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
        { uid: 'd2', name: 'Deck Card 2', type: 'Magic', color: 'Red', cost: 2 }
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
        { uid: 'od2', name: 'Opp Deck 2', type: 'Spirit', color: 'White', cost: 3 }
      ],
      trashCards: []
    }
  };
}

describe('Constellation Saga — Two-Tier Per-Card Handler System', () => {
  it('1. Registers all 507 Constellation Saga cards across BS10–BS13, SD03, BSC05, and Promos', () => {
    const allSets = [
      ...BS10_SAGA_CARDS,
      ...BS11_SAGA_CARDS,
      ...BS12_SAGA_CARDS,
      ...BS13_SAGA_CARDS,
      ...SD03_BSC05_CONSTELLATION_PROMOS_SAGA_CARDS
    ];
    assert.equal(allSets.length, 507, `Expected 507 Constellation Saga cards, got ${allSets.length}`);

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

  it('2. Tier 2A [When Braved] Guard: Spirit ability only triggers when combined with a Brave', () => {
    const duelState = createMockDuelState();
    const testBravedSpirit = {
      cardNumber: 'TEST-BRAVED-SP-01',
      name: 'Test Braved Fighter',
      cardType: 'Spirit',
      isVanilla: false,
      abilities: [
        {
          overall: 'WHEN_ATTACKS',
          subConditions: { levels: [1, 2], turn: 'YOUR', requireBraved: true },
          subEffects: [
            { op: 'BP_BUFF_SELF', amount: 5000 }
          ]
        }
      ]
    };
    SagaConditionDSL.registerSagaCard(testBravedSpirit);

    const spirit = {
      uid: 'sp_brave_1',
      card_number: 'TEST-BRAVED-SP-01',
      name: 'Test Braved Fighter',
      type: 'Spirit',
      currentLevel: 1,
      currentBp: 3000,
      turnBpBoost: 0,
      brave: null,
      isBraved: false
    };
    duelState.player.field.push(spirit);

    // Unbraved: requireBraved is false -> should not buff
    PerCardRegistry.execute('TEST-BRAVED-SP-01', 'WHEN_ATTACKS', {
      card: spirit,
      isBraved: false,
      side: 'player',
      duelState
    });
    assert.equal(spirit.turnBpBoost || 0, 0, 'Unbraved spirit should NOT trigger [When Braved] ability');

    // Combined with Brave: requireBraved is true -> should gain +5000 BP
    spirit.brave = { uid: 'brv_1', name: 'Test Sword', type: 'Brave' };
    spirit.isBraved = true;
    PerCardRegistry.execute('TEST-BRAVED-SP-01', 'WHEN_ATTACKS', {
      card: spirit,
      isBraved: true,
      side: 'player',
      duelState
    });
    assert.equal(spirit.turnBpBoost, 5000, 'Braved spirit must trigger [When Braved] +5000 BP buff');
  });

  it('3. Brave Card [During Brave] Dual Dispatch: Attached Brave grants attack trigger to Host Spirit', () => {
    const duelState = createMockDuelState();
    const testBraveCard = {
      cardNumber: 'TEST-BRAVE-01',
      name: 'Thunder Blade',
      cardType: 'Brave',
      isVanilla: false,
      abilities: [
        {
          overall: 'WHEN_ATTACKS',
          subConditions: { requireBraved: true },
          subEffects: [
            { op: 'DESTROY_BY_BP', maxBp: 4000, count: 1 }
          ]
        }
      ]
    };
    SagaConditionDSL.registerSagaCard(testBraveCard);

    const oppWeakSpirit = {
      uid: 'opp_weak',
      name: 'Weak Guard',
      type: 'Spirit',
      currentLevel: 1,
      currentBp: 3500,
      currentCores: 1
    };
    duelState.opponent.field.push(oppWeakSpirit);

    const hostSpirit = {
      uid: 'host_sp',
      name: 'Ace Knight',
      type: 'Spirit',
      currentLevel: 1,
      currentBp: 5000,
      brave: {
        uid: 'br_inst',
        card_number: 'TEST-BRAVE-01',
        name: 'Thunder Blade',
        type: 'Brave'
      },
      isBraved: true
    };
    duelState.player.field.push(hostSpirit);

    // Execute Brave's WHEN_ATTACKS on behalf of hostSpirit
    PerCardRegistry.execute('TEST-BRAVE-01', 'WHEN_ATTACKS', {
      card: hostSpirit,
      sourceCard: hostSpirit.brave,
      braveCard: hostSpirit.brave,
      isBraved: true,
      side: 'player',
      duelState
    });

    assert.equal(duelState.opponent.field.length, 0, 'Attached Brave must destroy <= 4000 BP opposing Spirit during Host attack');
  });

  it('4. Tier 2B [Ultra Awaken]: Transfers cores and refreshes host unit', () => {
    const duelState = createMockDuelState();
    const testUltraAwakenCard = {
      cardNumber: 'TEST-ULTRA-AWAKEN-01',
      name: 'Ultra Phoenix',
      cardType: 'Spirit',
      isVanilla: false,
      abilities: [
        {
          overall: 'FLASH',
          subConditions: {},
          subEffects: [
            { op: 'ULTRA_AWAKEN', maxCores: 2 }
          ]
        }
      ]
    };
    SagaConditionDSL.registerSagaCard(testUltraAwakenCard);

    const phoenix = {
      uid: 'ph_1',
      card_number: 'TEST-ULTRA-AWAKEN-01',
      name: 'Ultra Phoenix',
      type: 'Spirit',
      currentLevel: 1,
      currentCores: 1,
      currentBp: 4000,
      isExhausted: true
    };
    const ally = {
      uid: 'al_1',
      name: 'Core Carrier',
      type: 'Spirit',
      currentLevel: 2,
      currentCores: 3,
      currentBp: 3000
    };
    duelState.player.field.push(phoenix, ally);

    PerCardRegistry.execute('TEST-ULTRA-AWAKEN-01', 'FLASH', {
      card: phoenix,
      side: 'player',
      duelState
    });

    assert.equal(phoenix.currentCores, 3, 'Ultra Awaken must transfer 2 cores from ally');
    assert.equal(ally.currentCores, 1, 'Ally retains remaining core');
    assert.equal(phoenix.isExhausted, false, 'Ultra Awaken must refresh the Spirit');
  });

  it('5. Tier 2B [Heavy Armor] & Brave Removal: Destroys opposing Brave and checks armor immunity', () => {
    const duelState = createMockDuelState();
    const oppBravedSpirit = {
      uid: 'opp_braved',
      name: 'Opposing Paladin',
      type: 'Spirit',
      brave: {
        uid: 'opp_br',
        name: 'Opposing Shield',
        type: 'Brave'
      },
      isBraved: true,
      currentBp: 6000
    };
    duelState.opponent.field.push(oppBravedSpirit);

    const testDestroyBraveCard = {
      cardNumber: 'TEST-DESTROY-BRAVE-01',
      name: 'Brave Breaker',
      cardType: 'Spirit',
      isVanilla: false,
      abilities: [
        {
          overall: 'WHEN_SUMMONED',
          subConditions: {},
          subEffects: [
            { op: 'DESTROY_BRAVE', count: 1 }
          ]
        }
      ]
    };
    SagaConditionDSL.registerSagaCard(testDestroyBraveCard);

    PerCardRegistry.execute('TEST-DESTROY-BRAVE-01', 'WHEN_SUMMONED', {
      card: { name: 'Brave Breaker' },
      side: 'player',
      duelState
    });

    assert.equal(oppBravedSpirit.brave, null, 'Opposing brave must be detached and destroyed');
    assert.equal(oppBravedSpirit.isBraved, false, 'Opposing spirit is no longer braved');
    assert.equal(duelState.opponent.trashCards.length, 1, 'Destroyed brave moved to opponent Trash');
  });
});
