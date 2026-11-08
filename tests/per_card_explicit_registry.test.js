/**
 * tests/per_card_explicit_registry.test.js
 * 
 * Comprehensive Unit and Regression Test Suite for Deterministic Per-Card Registry.
 * Verifies exact card_number resolution and guarantees zero regex/NLP fallback.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CardRegistry, PerCardRegistry } from '../engine/cards/index.js';

test('1. Registry Initialization & Canonical Key Lookup', () => {
  assert.ok(PerCardRegistry instanceof CardRegistry, 'PerCardRegistry should be an instance of CardRegistry');
  assert.ok(PerCardRegistry.getAll().length >= 15, 'Should have registered cards from sets');

  // Verify canonical registration
  assert.equal(PerCardRegistry.has('SD65-X01', 'WHEN_SUMMONED'), true);
  assert.equal(PerCardRegistry.has('sd65-x01', 'when_summoned'), true, 'Case-insensitive lookup');
  assert.equal(PerCardRegistry.has('SD65-X03', 'WHEN_ATTACKS'), true);
  assert.equal(PerCardRegistry.has('BS14-096', 'BURST'), true);
  assert.equal(PerCardRegistry.has('BS14-096', 'FLASH'), true);
  assert.equal(PerCardRegistry.has('SD65-CX01', 'SOUL_STATE'), true);
  assert.equal(PerCardRegistry.has('SD65-CX01', 'FLASH'), true);
  assert.equal(PerCardRegistry.has('BS38-CP05', 'WHEN_SUMMONED'), true);
  assert.equal(PerCardRegistry.has('SD36-001', 'WHEN_SUMMONED'), true);
  assert.equal(PerCardRegistry.has('BATTLE-SPIRITS-A27', 'WHEN_SUMMONED'), true, 'Alias lookup for Birgoyle');
});

test('2. SD65-X01 (Bram-Zahfag): When Summoned destroys all opposing Spirits and activates Once-per-Game Life Lock', () => {
  const logs = [];
  const destroyedTrash = [];
  const mockApi = {
    addLog: (msg, type) => logs.push({ msg, type }),
    AudioFX: { destroy: () => {}, lifeDamage: () => {} },
    renderDuelTable: () => {},
    renderPlayerHand: () => {},
    sendToTrash: (c, s, r) => destroyedTrash.push({ card: c, side: s, reason: r }),
    handleDestroyedSpiritCores: (c, s) => {
      duelState.opponent.reserve += c.currentCores || 0;
      c.currentCores = 0;
    },
    askOptionalEffect: (c, text, onYes, onNo) => {
      onYes(); // Simulate user selecting YES to Once-per-Game lock
    },
    showToast: () => {}
  };

  const bramCard = {
    uid: 'bram_1',
    card_number: 'SD65-X01',
    name: 'The Hellflame FourDemonLord Bram-Zahfag',
    type: 'Ultimate',
    currentLevel: 3,
    currentCores: 1
  };

  const duelState = {
    player: {
      life: 3,
      reserve: 2,
      field: [bramCard]
    },
    opponent: {
      life: 5,
      reserve: 2,
      field: [
        { uid: 'opp_sp_1', name: 'Zombie-Snake', type: 'Spirit', currentCores: 1, currentBp: 2000 },
        { uid: 'opp_sp_2', name: 'The NetherCorpseKing', type: 'Spirit', currentCores: 2, currentBp: 6000 },
        { uid: 'opp_ult_1', name: 'Opposing Ultimate', type: 'Ultimate', currentCores: 1, currentBp: 12000 }
      ]
    }
  };

  // Execute WHEN_SUMMONED
  PerCardRegistry.execute('SD65-X01', 'WHEN_SUMMONED', {
    card: bramCard,
    side: 'player',
    duelState,
    arenaApi: mockApi
  });

  // Verify all opposing Spirits were destroyed, but opposing Ultimate was preserved (Rule: Spirits only!)
  assert.equal(duelState.opponent.field.length, 1, 'Only opposing Ultimate should survive');
  assert.equal(duelState.opponent.field[0].uid, 'opp_ult_1');
  assert.equal(destroyedTrash.length, 2, '2 Spirits sent to Trash');
  assert.equal(duelState.opponent.reserve, 5, '2 + 1 + 2 = 5 cores returned to opponent reserve');

  // Verify Once-per-Game Life-to-Void Summon Lock
  assert.equal(duelState.player.life, 2, 'Player life reduced by 1 to pay Life-to-Void lock');
  assert.equal(duelState.player.usedBramZahfagOncePerGame, true, 'Flagged as used Once per Game');
  assert.equal(duelState.spiritSummonLock.lockedSide, 'opponent');
  assert.equal(duelState.spiritSummonLock.untilStartStepOf, 'player');
  assert.equal(duelState.opponentCantSummonSpirits, true);
  assert.ok(logs.some(l => l.msg.includes('Hellflame catastrophe destroyed all 2 opposing Spirit(s)')));
  assert.ok(logs.some(l => l.msg.includes('Sent 1 Life to the Void! Opponent cannot summon Spirit cards')));
});

test('3. SD65-X03 (Van-Tous): When Attacks returns card to decktop, gives +2 Void Cores and sets turn-wide Burst lock', () => {
  const logs = [];
  const mockApi = {
    addLog: (msg, type) => logs.push({ msg, type }),
    AudioFX: { coreChime: () => {} },
    renderDuelTable: () => {},
    renderPlayerHand: () => {},
    recalculateSpiritBp: (u) => { u.currentBp = 13000 + (u.currentCores >= 3 ? 7000 : 0); },
    promptUniversalTargetModal: (opts, cb) => {
      // Simulate selecting the hand card
      cb([opts.customPool[0]]);
    },
    showToast: () => {}
  };

  const vtCard = {
    uid: 'vt_1',
    card_number: 'SD65-X03',
    name: 'The Hellwind FourDemonLord Van-Tous',
    type: 'Ultimate',
    currentLevel: 3,
    currentCores: 1
  };

  const handCard = { uid: 'h_1', name: 'Grey-Tude', cost: 3 };

  const duelState = {
    burstLockThisTurn: null,
    player: {
      hand: [handCard],
      deck: [{ uid: 'd_1', name: 'Deck Card' }],
      field: [vtCard]
    },
    opponent: {
      burst: { uid: 'b_1', name: 'Curse of Hades', type: 'Magic' }
    }
  };

  PerCardRegistry.execute('SD65-X03', 'WHEN_ATTACKS', {
    card: vtCard,
    side: 'player',
    duelState,
    arenaApi: mockApi
  });

  // Verify hand card moved to decktop
  assert.equal(duelState.player.hand.length, 0);
  assert.equal(duelState.player.deck[0].uid, 'h_1', 'Card placed at decktop');

  // Verify 2 cores added from Void to Van-Tous
  assert.equal(vtCard.currentCores, 3, '1 + 2 = 3 cores from Void');

  // Verify turn-wide Burst lock
  assert.equal(duelState.burstLockThisTurn, 'opponent', 'Opponent locked from activating Bursts for the turn');
  assert.ok(logs.some(l => l.msg.includes('locked opponent from activating Burst effects during this turn')));
});

test('4. BS14-096 (Curse of Hades): Burst strictly destroys exhausted Cost <= 5 Spirit and NEVER exhausts ready spirits', () => {
  const logs = [];
  const trashed = [];
  const mockApi = {
    addLog: (msg, type) => logs.push({ msg, type }),
    AudioFX: { destroy: () => {} },
    renderDuelTable: () => {},
    renderPlayerHand: () => {},
    sendToTrash: (c, s, r) => trashed.push({ card: c, side: s, reason: r }),
    handleDestroyedSpiritCores: (c, s) => {
      duelState.player.reserve += c.currentCores || 0;
      c.currentCores = 0;
    },
    askOptionalEffect: (c, text, onYes, onNo) => {
      onNo(); // Skip flash for this test
    },
    showToast: () => {}
  };

  const hadesCard = {
    uid: 'hades_1',
    card_number: 'BS14-096',
    name: 'Curse of Hades',
    type: 'Magic',
    cost: 4
  };

  const readySeeker = {
    uid: 'seeker_1',
    name: 'The Hellwind Searcher Kagerou-Seeker',
    type: 'Ultimate',
    isExhausted: false,
    cost: 3,
    currentCores: 1
  };

  const readySpirit = {
    uid: 'sp_ready',
    name: 'Ready Soldier',
    type: 'Spirit',
    isExhausted: false,
    cost: 2,
    currentCores: 1
  };

  const exhaustedSpirit = {
    uid: 'sp_exhausted',
    name: 'Exhausted Zombie',
    type: 'Spirit',
    isExhausted: true,
    cost: 4,
    currentCores: 1,
    currentBp: 3000
  };

  const duelState = {
    burstLockThisTurn: null,
    player: {
      reserve: 2,
      field: [readySeeker, readySpirit, exhaustedSpirit]
    },
    opponent: {
      reserve: 2,
      field: []
    }
  };

  // Case A: Opponent triggers Curse of Hades when an exhausted Cost 4 spirit is present
  PerCardRegistry.execute('BS14-096', 'BURST', {
    card: hadesCard,
    side: 'opponent',
    duelState,
    arenaApi: mockApi
  });

  // Exhausted spirit destroyed!
  assert.equal(duelState.player.field.some(s => s.uid === 'sp_exhausted'), false, 'Exhausted spirit destroyed');
  assert.equal(trashed.length, 1);
  assert.equal(trashed[0].card.uid, 'sp_exhausted');

  // Ready seeker and ready soldier were NOT touched or exhausted!
  assert.equal(readySeeker.isExhausted, false, 'Ready Seeker must NOT be exhausted');
  assert.equal(readySpirit.isExhausted, false, 'Ready Spirit must NOT be exhausted');

  // Case B: Trigger again when NO exhausted spirits exist
  logs.length = 0;
  PerCardRegistry.execute('BS14-096', 'BURST', {
    card: hadesCard,
    side: 'opponent',
    duelState,
    arenaApi: mockApi
  });

  // Verify informative notice logged and ready units STILL not exhausted!
  assert.ok(logs.some(l => l.msg.includes('No opposing exhausted Cost 5 or less Spirit found')));
  assert.equal(readySeeker.isExhausted, false, 'Still ready');
  assert.equal(readySpirit.isExhausted, false, 'Still ready');
});

test('5. BS14-096 (Curse of Hades) respects Van-Tous Burst Lock', () => {
  const logs = [];
  const mockApi = {
    addLog: (msg, type) => logs.push({ msg, type })
  };

  const duelState = {
    burstLockThisTurn: 'opponent', // Locked by Van-Tous
    player: { field: [] },
    opponent: { field: [] }
  };

  PerCardRegistry.execute('BS14-096', 'BURST', {
    card: { uid: 'h1', card_number: 'BS14-096', name: 'Curse of Hades' },
    side: 'opponent',
    duelState,
    arenaApi: mockApi
  });

  assert.ok(logs.some(l => l.msg.includes('Cannot activate Burst! Blocked by Turn Burst Lock')));
});

test('6. SD65-CX01 (Javad): Soul State core drain trigger increments Count +2', () => {
  const logs = [];
  const mockApi = {
    addLog: (msg, type) => logs.push({ msg, type }),
    renderDuelTable: () => {}
  };

  const duelState = {
    player: {
      counters: 1,
      javadCountBoostUsedThisTurn: false
    },
    opponent: {}
  };

  PerCardRegistry.execute('SD65-CX01', 'SOUL_STATE', {
    card: { card_number: 'SD65-CX01', name: 'The PartnerDemonLord Javad' },
    side: 'player',
    duelState,
    arenaApi: mockApi
  });

  assert.equal(duelState.player.counters, 3, '1 + 2 = 3 counters');
  assert.equal(duelState.player.javadCountBoostUsedThisTurn, true);
});
