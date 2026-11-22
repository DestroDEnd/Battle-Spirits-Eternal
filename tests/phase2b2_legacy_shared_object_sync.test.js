import test from 'node:test';
import assert from 'node:assert/strict';

import { createEngineStateFromLegacy, syncEngineStateToLegacy } from '../engine/legacy_bridge.js';

function makeEmptySide() {
  return {
    life: 5,
    reserve: 3,
    trash: 0,
    deck: [],
    hand: [],
    field: [],
    nexus: [],
    trashCards: [],
    voidCards: [],
    openCards: [],
    revealed: []
  };
}

test('1. Shared raw object in both players fields syncs independently via syncEngineStateToLegacy', () => {
  const sharedRaw = {
    card_number: 'BS01-001',
    name: 'Goradon',
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    family: 'Dragon',
    families: ['Dragon'],
    cost: 2,
    currentCores: 1,
    levels: { 1: { cost: 1, bp: 2000 }, 2: { cost: 3, bp: 4000 } }
  };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: { ...makeEmptySide(), field: [sharedRaw] },
    opponent: { ...makeEmptySide(), field: [sharedRaw] }
  };

  const { state, mapper } = createEngineStateFromLegacy(duelState);
  const pCard = state.players.player.field[0].top;
  const oCard = state.players.opponent.field[0].top;

  assert.notEqual(pCard, oCard);
  assert.notEqual(pCard.id, oCard.id);
  assert.equal(pCard.owner, 'player');
  assert.equal(oCard.owner, 'opponent');

  pCard.name = 'Player Goradon';
  pCard.cost = 4;
  oCard.name = 'Opponent Goradon';
  oCard.cost = 6;

  syncEngineStateToLegacy(state, duelState, mapper);

  assert.notEqual(duelState.player.field[0], duelState.opponent.field[0]);
  assert.equal(duelState.player.field[0].name, 'Player Goradon');
  assert.equal(duelState.player.field[0].cost, 4);
  assert.equal(duelState.opponent.field[0].name, 'Opponent Goradon');
  assert.equal(duelState.opponent.field[0].cost, 6);

  // Mutating one synchronized legacy card must not affect the other
  duelState.player.field[0].name = 'Mutated Player Only';
  duelState.player.field[0].colors.push('White');
  assert.equal(duelState.opponent.field[0].name, 'Opponent Goradon');
  assert.deepEqual(duelState.opponent.field[0].colors, ['Red']);
});

test('2. Same-owner repeated references resolve to same engine instance; duplicate UIDs and card_numbers remain distinct', () => {
  const repeatedSameOwner = { card_number: 'BS01-N01', name: 'Nexus', type: 'Nexus', currentCores: 1 };
  const dupUid1 = { uid: 'same_uid', card_number: 'BS01-010', name: 'Copy 1', type: 'Spirit' };
  const dupUid2 = { uid: 'same_uid', card_number: 'BS01-010', name: 'Copy 2', type: 'Spirit' };
  const dupNum1 = { card_number: 'BS01-011', name: 'Plain 1', type: 'Spirit' };
  const dupNum2 = { card_number: 'BS01-011', name: 'Plain 2', type: 'Spirit' };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      ...makeEmptySide(),
      field: [repeatedSameOwner],
      nexus: [repeatedSameOwner],
      hand: [dupUid1, dupUid2, dupNum1, dupNum2]
    },
    opponent: makeEmptySide()
  };

  const { state, mapper } = createEngineStateFromLegacy(duelState);
  // Same-owner repeated reference (field + nexus) maps to the same engine card instance
  assert.equal(state.players.player.field[0].top, state.players.player.nexus[0]);
  // Duplicate UIDs and duplicate card_numbers remain distinct
  assert.notEqual(state.players.player.hand[0], state.players.player.hand[1]);
  assert.notEqual(state.players.player.hand[2], state.players.player.hand[3]);

  syncEngineStateToLegacy(state, duelState, mapper);
  assert.notEqual(duelState.player.hand[0], duelState.player.hand[1]);
  assert.notEqual(duelState.player.hand[2], duelState.player.hand[3]);
});

test('3. Shared raw objects across different zones and nested braves/under-cards sync independently', () => {
  const sharedZoneCard = { card_number: 'BS02-001', name: 'Zone Shared', type: 'Spirit', cost: 3 };
  const sharedBrave = { card_number: 'BS10-B01', name: 'Shared Brave', type: 'Brave', cost: 4 };
  const sharedUnder = { card_number: 'BS40-U01', name: 'Shared Under', type: 'Spirit', cost: 2 };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: {
      ...makeEmptySide(),
      hand: [sharedZoneCard],
      field: [{
        card_number: 'BS40-P',
        name: 'Player Top',
        type: 'Spirit',
        currentCores: 1,
        braves: [sharedBrave],
        under: [sharedUnder]
      }]
    },
    opponent: {
      ...makeEmptySide(),
      trashCards: [sharedZoneCard],
      field: [{
        card_number: 'BS40-O',
        name: 'Opp Top',
        type: 'Spirit',
        currentCores: 1,
        braves: [sharedBrave],
        under: [sharedUnder]
      }]
    }
  };

  const { state, mapper } = createEngineStateFromLegacy(duelState);
  state.players.player.hand[0].cost = 1;
  state.players.opponent.grave[0].cost = 9;
  state.players.player.field[0].braves[0].name = 'Player Brave';
  state.players.opponent.field[0].braves[0].name = 'Opp Brave';
  state.players.player.field[0].under[0].name = 'Player Under';
  state.players.opponent.field[0].under[0].name = 'Opp Under';

  syncEngineStateToLegacy(state, duelState, mapper);

  assert.notEqual(duelState.player.hand[0], duelState.opponent.trashCards[0]);
  assert.equal(duelState.player.hand[0].cost, 1);
  assert.equal(duelState.opponent.trashCards[0].cost, 9);

  assert.notEqual(duelState.player.field[0].braves[0], duelState.opponent.field[0].braves[0]);
  assert.equal(duelState.player.field[0].braves[0].name, 'Player Brave');
  assert.equal(duelState.opponent.field[0].braves[0].name, 'Opp Brave');

  assert.notEqual(duelState.player.field[0].under[0], duelState.opponent.field[0].under[0]);
  assert.equal(duelState.player.field[0].under[0].name, 'Player Under');
  assert.equal(duelState.opponent.field[0].under[0].name, 'Opp Under');
});
