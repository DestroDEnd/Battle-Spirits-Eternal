import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/index.js';
import { SagaConditionDSL } from '../engine/cards/condition_dsl.js';

function createMockDuelState() {
  return {
    turn: 1,
    activePlayer: 'player',
    phaseIndex: 4,
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    modifiers: [],
    player: {
      life: 5,
      reserve: 5,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      hand: [],
      deck: [
        { uid: 'd1', cardNumber: 'SD01-001', name: 'Deck Card 1', type: 'Spirit', color: 'Red', cost: 1 },
        { uid: 'd2', cardNumber: 'SD01-033', name: 'Victory Fire', type: 'Magic', color: 'Red', cost: 4 },
        { uid: 'd3', cardNumber: 'SD02-017', name: 'Strong Draw', type: 'Magic', color: 'Blue', cost: 3 },
        { uid: 'd4', cardNumber: 'SD01-002', name: 'Deck Card 4', type: 'Spirit', color: 'Red', cost: 2 },
        { uid: 'd5', cardNumber: 'SD01-003', name: 'Deck Card 5', type: 'Spirit', color: 'Red', cost: 3 }
      ],
      field: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null
    },
    opponent: {
      life: 5,
      reserve: 5,
      trash: 0,
      trashCards: [],
      voidCards: [],
      nexus: [],
      hand: [],
      deck: [
        { uid: 'od1', cardNumber: 'SD01-001', name: 'Opp Deck 1', type: 'Spirit', color: 'Red', cost: 1 },
        { uid: 'od2', cardNumber: 'SD01-002', name: 'Opp Deck 2', type: 'Spirit', color: 'Red', cost: 2 }
      ],
      field: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null
    }
  };
}

describe('Sagas 1–3 Semantic Fidelity & Behavioral Regression Suite', () => {
  let duelState;
  beforeEach(() => {
    duelState = createMockDuelState();
  });

  it('1. Bans all fake BP_BUFF_SELF: 1000 fallback stubs on cards whose text does not mention BP', () => {
    const allEntries = PerCardRegistry.getAll();
    const violations = [];
    for (const entry of allEntries) {
      const id = entry.cardNumber;
      if (!/^(BS0[1-9]|BS1[0-8]|SD0[1-9]|SD1[01]|BSC05)-/.test(id)) continue;
      if (!entry.sagaAbilities) continue;
      const raw = (entry.effect || entry.rawEffect || '').toLowerCase();
      for (const ab of entry.sagaAbilities) {
        for (const eff of (ab.subEffects || [])) {
          if (eff.op === 'BP_BUFF_SELF' && !raw.includes('bp') && !raw.includes('excite')) {
            violations.push(`${id} (${entry.name}): has fake BP_BUFF_SELF fallback for "${entry.effect || entry.rawEffect}"`);
          }
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it('2. Bans all dummy AURA_KEYWORDS: "Passive" or "Tribute" no-op stubs across Sagas 1–3', () => {
    const allEntries = PerCardRegistry.getAll();
    const violations = [];
    for (const entry of allEntries) {
      const id = entry.cardNumber;
      if (!/^(BS0[1-9]|BS1[0-8]|SD0[1-9]|SD1[01]|BSC05)-/.test(id)) continue;
      if (!entry.sagaAbilities) continue;
      for (const ab of entry.sagaAbilities) {
        if (ab.overall === 'AURA_KEYWORDS' && (ab.keyword === 'Passive' || ab.keyword === 'Tribute')) {
          violations.push(`${id} (${entry.name}): has dummy AURA_KEYWORDS "${ab.keyword}" stub`);
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it('3. Ensures all Magic cards with [Main] register a MAIN trigger (never only MAIN_STEP)', () => {
    const allEntries = PerCardRegistry.getAll();
    const violations = [];
    for (const entry of allEntries) {
      const id = entry.cardNumber;
      if (!/^(BS0[1-9]|BS1[0-8]|SD0[1-9]|SD1[01]|BSC05)-/.test(id)) continue;
      if (entry.cardType !== 'Magic') continue;
      const raw = entry.effect || entry.rawEffect || '';
      if (/\[Main\]|\bMain\s*:/i.test(raw)) {
        if (!PerCardRegistry.has(id, 'MAIN')) {
          violations.push(`${id} (${entry.name}): Magic card with [Main] is missing MAIN trigger`);
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it('4. SD02-004 The SacredBeast Haktak: chooses between Imaginary Beast or Beast Head and draws 1 per controlled Spirit of that family', () => {
    const haktak = {
      uid: 'h1',
      cardNumber: 'SD02-004',
      name: 'The SacredBeast Haktak',
      type: 'Spirit',
      color: 'Blue',
      cost: 6,
      family: 'Imaginary Beast',
      currentLevel: 1,
      currentCores: 1
    };
    // Case A: Only Haktak (1 Imaginary Beast) on field -> draws 1 card
    duelState.player.field = [haktak];
    const startHand = duelState.player.hand.length;
    PerCardRegistry.execute('SD02-004', 'WHEN_SUMMONED', {
      card: haktak,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.equal(duelState.player.hand.length, startHand + 1);

    // Case B: Haktak + 2 Beast Head spirits on field -> chooses family with more spirits (2) and draws 2 cards
    const duelState2 = createMockDuelState();
    duelState2.player.field = [
      haktak,
      { uid: 'bh1', name: 'Grhinos 1', type: 'Spirit', family: 'Beast Head', currentLevel: 1, currentCores: 1 },
      { uid: 'bh2', name: 'Grhinos 2', type: 'Spirit', family: 'Beast Head', currentLevel: 1, currentCores: 1 }
    ];
    PerCardRegistry.execute('SD02-004', 'WHEN_SUMMONED', {
      card: haktak,
      side: 'player',
      duelState: duelState2,
      arenaApi: {}
    });
    assert.equal(duelState2.player.hand.length, 2);
  });

  it('5. SD02-005 The Angelia Cherubim: reveals 1 card per Yellow symbol, adds 1 Magic card among them to Hand, and puts rest on deckbottom', () => {
    const cherubim = {
      uid: 'ch1',
      cardNumber: 'SD02-005',
      name: 'The Angelia Cherubim',
      type: 'Spirit',
      color: 'Yellow',
      cost: 5,
      currentLevel: 1,
      currentCores: 1
    };
    const yellowAlly = {
      uid: 'ya1',
      cardNumber: 'SD02-003',
      name: 'Dunamis',
      type: 'Spirit',
      color: 'Yellow',
      cost: 3,
      currentLevel: 1,
      currentCores: 1
    };
    duelState.player.field = [cherubim, yellowAlly]; // 2 Yellow symbols
    PerCardRegistry.execute('SD02-005', 'WHEN_SUMMONED', {
      card: cherubim,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.ok(duelState.player.hand.some(c => c.uid === 'd2'));
    assert.equal(duelState.player.deck[duelState.player.deck.length - 1].uid, 'd1');
  });

  it('6. SD02-006 The Assassin Weaseve: at LV2 When Destroyed, deploys a Nexus card from Trash without paying cost', () => {
    const weaseve = {
      uid: 'w1',
      cardNumber: 'SD02-006',
      name: 'The Assassin Weaseve',
      type: 'Spirit',
      color: 'Blue',
      cost: 2,
      currentLevel: 2,
      currentCores: 3
    };
    const nexusInTrash = {
      uid: 'nx1',
      cardNumber: 'SD02-013',
      name: 'The Generate Altar',
      type: 'Nexus',
      color: 'Blue',
      cost: 3
    };
    duelState.player.trashCards = [nexusInTrash];
    PerCardRegistry.execute('SD02-006', 'WHEN_DESTROYED', {
      card: weaseve,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.ok(duelState.player.nexus.some(n => n.uid === 'nx1'));
    assert.ok(!duelState.player.trashCards.some(c => c.uid === 'nx1'));
  });

  it('7. SD02-010 The RoaringSwordmaster Lowen: When Summoned destroys opposing Cost 0/1/2/3/4 Spirits, one of each', () => {
    const lowen = {
      uid: 'low1',
      cardNumber: 'SD02-010',
      name: 'The RoaringSwordmaster Lowen',
      type: 'Spirit',
      color: 'Blue',
      cost: 6,
      currentLevel: 1,
      currentCores: 1
    };
    duelState.opponent.field = [
      { uid: 'o0', name: 'Cost 0 Spirit', type: 'Spirit', cost: 0, currentBp: 6000, currentCores: 1 },
      { uid: 'o2a', name: 'Cost 2 Spirit A', type: 'Spirit', cost: 2, currentBp: 7000, currentCores: 1 },
      { uid: 'o2b', name: 'Cost 2 Spirit B', type: 'Spirit', cost: 2, currentBp: 2000, currentCores: 1 },
      { uid: 'o4', name: 'Cost 4 Spirit', type: 'Spirit', cost: 4, currentBp: 8000, currentCores: 1 },
      { uid: 'o5', name: 'Cost 5 Spirit', type: 'Spirit', cost: 5, currentBp: 2000, currentCores: 1 }
    ];
    PerCardRegistry.execute('SD02-010', 'WHEN_SUMMONED', {
      card: lowen,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    const remainingUids = duelState.opponent.field.map(s => s.uid);
    assert.ok(!remainingUids.includes('o0'));
    assert.ok(!remainingUids.includes('o4'));
    assert.ok(remainingUids.includes('o5'));
    assert.equal(remainingUids.filter(u => u.startsWith('o2')).length, 1);
  });

  it('8. SD02-018, SD02-019, SD02-020, SD02-021: execute WHEN_TRIBUTED effects when used for Tribute', () => {
    const jewelg = { uid: 'j1', cardNumber: 'SD02-020', name: 'The RainbowWings Jewelg', type: 'Spirit', currentLevel: 1, currentCores: 1 };
    const beforeReserve = duelState.player.reserve;
    PerCardRegistry.execute('SD02-020', 'WHEN_TRIBUTED', {
      card: jewelg,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.equal(duelState.player.reserve, beforeReserve + 2);

    const dragron = { uid: 'dr1', cardNumber: 'SD02-018', name: 'The BraveColonel Dragron', type: 'Spirit', currentLevel: 1, currentCores: 1 };
    duelState.opponent.field = [
      { uid: 'e1', name: 'Small 1', type: 'Spirit', currentBp: 3000, currentCores: 1, effect: '' },
      { uid: 'e2', name: 'Small 2', type: 'Spirit', currentBp: 4000, currentCores: 1, effect: '' },
      { uid: 'e3', name: 'Tribute Spirit', type: 'Spirit', currentBp: 3000, currentCores: 1, effect: '[Tribute: Cost 3 -> Trash]' }
    ];
    PerCardRegistry.execute('SD02-018', 'WHEN_TRIBUTED', {
      card: dragron,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.deepEqual(duelState.opponent.field.map(s => s.uid), ['e3']);
  });

  it('9. BATTLE-SPIRITS-A2208 Return Draw: MAIN registers floating bounce-draw effect instead of drawing immediately', () => {
    const returnDraw = {
      uid: 'rd1',
      cardNumber: 'BATTLE-SPIRITS-A2208',
      name: 'Return Draw',
      type: 'Magic',
      color: 'Yellow',
      cost: 3
    };
    const beforeHand = duelState.player.hand.length;
    PerCardRegistry.execute('BATTLE-SPIRITS-A2208', 'MAIN', {
      card: returnDraw,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.equal(duelState.player.hand.length, beforeHand);
    assert.equal(duelState.player.returnDrawActiveThisTurn, true);
  });

  it('10. SD02-011 The BeastPrince Bahamunt: When Summoned looks at opposing Hand and discards a Magic card', () => {
    const bahamunt = {
      uid: 'bah1',
      cardNumber: 'SD02-011',
      name: 'The BeastPrince Bahamunt',
      type: 'Spirit',
      color: 'Blue',
      cost: 6,
      currentLevel: 1,
      currentCores: 1
    };
    duelState.opponent.hand = [
      { uid: 'oh1', name: 'Opp Spirit', type: 'Spirit', cost: 2 },
      { uid: 'oh2', name: 'Opp Magic', type: 'Magic', cost: 4 }
    ];
    PerCardRegistry.execute('SD02-011', 'WHEN_SUMMONED', {
      card: bahamunt,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.deepEqual(duelState.opponent.hand.map(c => c.uid), ['oh1']);
    assert.ok(duelState.opponent.trashCards.some(c => c.uid === 'oh2'));
  });

  it('11. SD02-008 The RhinoMousquetair Grhinos: When Attacks destroys Cost 1 or less Spirit and at LV2 refreshes via [Assault: 1]', () => {
    const grhinos = {
      uid: 'gr1',
      cardNumber: 'SD02-008',
      name: 'The RhinoMousquetair Grhinos',
      type: 'Spirit',
      color: 'Blue',
      cost: 3,
      currentLevel: 2,
      currentCores: 3,
      isExhausted: true
    };
    const blueNexus = {
      uid: 'bnx1',
      cardNumber: 'SD02-013',
      name: 'The Generate Altar',
      type: 'Nexus',
      color: 'Blue',
      cost: 3,
      currentLevel: 1,
      currentCores: 0,
      isExhausted: false
    };
    duelState.player.field = [grhinos];
    duelState.player.nexus = [blueNexus];
    duelState.opponent.field = [
      { uid: 'oc1', name: 'Cost 1 Opp', type: 'Spirit', cost: 1, currentBp: 2000, currentCores: 1 },
      { uid: 'oc3', name: 'Cost 3 Opp', type: 'Spirit', cost: 3, currentBp: 4000, currentCores: 1 }
    ];
    PerCardRegistry.execute('SD02-008', 'WHEN_ATTACKS', {
      card: grhinos,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.deepEqual(duelState.opponent.field.map(s => s.uid), ['oc3']);
    assert.equal(grhinos.isExhausted, false);
    assert.equal(blueNexus.isExhausted, true);
  });

  it('12. SD02-017 Strong Draw: MAIN draws 3 cards and discards 2 cards from Hand', () => {
    const strongDraw = {
      uid: 'sd17',
      cardNumber: 'SD02-017',
      name: 'Strong Draw',
      type: 'Magic',
      color: 'Blue',
      cost: 3
    };
    duelState.player.hand = [];
    PerCardRegistry.execute('SD02-017', 'MAIN', {
      card: strongDraw,
      side: 'player',
      duelState,
      arenaApi: {}
    });
    assert.equal(duelState.player.hand.length, 1);
    assert.equal(duelState.player.trashCards.length, 2);
  });
});
