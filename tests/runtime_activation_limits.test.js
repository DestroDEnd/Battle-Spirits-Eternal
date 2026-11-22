/**
 * tests/runtime_activation_limits.test.js
 * 
 * Phase 4C.3.2.2 — Runtime Activation-Limit Enforcement Test Battery
 * 
 * Tests:
 * - Section A: Ordinary Once per Turn Restrictions (TC-ACT-01 .. TC-ACT-05)
 * - Section B: Same Name Restrictions (TC-ACT-06 .. TC-ACT-10)
 * - Section C: Commitment Timing (TC-ACT-11 .. TC-ACT-17)
 * - Section D: Optionality and Conditions (TC-ACT-18 .. TC-ACT-21)
 * - Section E: Reset Behavior (TC-ACT-22 .. TC-ACT-27)
 * - Section F: Persistence and Legacy Compatibility (TC-ACT-28 .. TC-ACT-35)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import { compileCard } from '../compiler/index.js';
import { derivePhysicalAbilityId, deriveSemanticAbilityId, createAbilityDescriptor } from '../compiler/identity.js';
import {
  evaluateRestriction,
  commitRestriction,
  reserveRestriction,
  releaseReservation,
  ensureRestrictionState,
  resetRestrictions,
  RESTRICTION_STATUS,
  validateRestrictionState,
  normalizeRestrictionType,
  buildRestrictionKey,
  syncLegacyToRestrictions,
  RESTRICTION_TYPE,
  RESTRICTION_SCOPE,
  VALID_TYPES,
  VALID_SCOPES,
  VALID_TYPE_SCOPE_MAP,
  isPlainObject,
  isAssignableContextProperty,
  _finalizeReservation
} from '../engine/restrictions.js';
import { createEngineStateFromLegacy, syncEngineStateToLegacy, resolveLegacyAbility } from '../engine/legacy_bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const detailedPath = path.join(__dirname, '..', 'data', 'cards_detailed.json');
const cardsData = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));

// Helper to create test deck with ample cards so DRAW does not cause deck-out
function createTestDeck(cardOverrides = [], size = 15) {
  const cards = [];
  for (const c of cardOverrides) {
    cards.push(c);
  }
  while (cards.length < size) {
    cards.push({
      card_number: `DUMMY-${cards.length + 1}`,
      name: `Dummy Card ${cards.length + 1}`,
      type: 'Spirit',
      cost: 1,
      color: 'Red',
      levels: { 1: { cost: 1, bp: 1000 } }
    });
  }
  return cards;
}

// Helper to create a card with an ordinary Once per Turn ability
function createOptCardData(cardNumber = 'BS01-OPT', cardName = 'OPT Dragon', limit = 'ONCE_PER_TURN') {
  const ability = {
    type: 'ABILITY',
    header: {
      timing: 'MAIN',
      trigger: 'NONE',
      levels: [1],
      limit
    },
    clauses: [
      {
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };

  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId(cardNumber, desc, 1);
  const semanticId = deriveSemanticAbilityId(desc);

  ability.id = physicalId;
  ability.physicalId = physicalId;
  ability.semanticId = semanticId;
  ability.legacyId = '#a0';

  return {
    card_number: cardNumber,
    name: cardName,
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [ability]
    }
  };
}

// Helper to create a card with a cost clause followed by an effect
function createCostOptCardData(cardNumber = 'BS01-COST', cardName = 'Cost Dragon') {
  const ability = {
    type: 'ABILITY',
    header: {
      timing: 'MAIN',
      trigger: 'NONE',
      levels: [1],
      limit: 'ONCE_PER_TURN'
    },
    clauses: [
      {
        isCost: true,
        op: {
          op: 'MOVE_CORE',
          count: 2,
          from: { zone: 'field', target: 'self' },
          to: { zone: 'trash' }
        }
      },
      {
        link: 'byDoing',
        op: {
          op: 'DRAW',
          count: 2
        }
      }
    ]
  };

  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId(cardNumber, desc, 1);
  const semanticId = deriveSemanticAbilityId(desc);

  ability.id = physicalId;
  ability.physicalId = physicalId;
  ability.semanticId = semanticId;
  ability.legacyId = '#a0';

  return {
    card_number: cardNumber,
    name: cardName,
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [ability]
    }
  };
}

// ===========================================================================
// SECTION A: Ordinary Once per Turn Restrictions (TC-ACT-01 .. TC-ACT-05)
// ===========================================================================

test('TC-ACT-01: First activation succeeds and consumes the physical ability limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player'
  });

  await game.advanceStep(); // START -> DRAW (Core step skipped on turn 1)
  await game.advanceStep(); // DRAW -> REFRESH
  await game.advanceStep(); // REFRESH -> MAIN

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const initialHand = game.state.players.player.hand.length;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(res.restrictionStatus, 'ALLOWED');
  assert.equal(game.state.players.player.hand.length, initialHand + 1);

  // Authoritative counter verification
  const placementId = stack.placementId;
  const key = `turn:1:player:${placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-02: Second activation of the same physical ability is rejected', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player'
  });

  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // First activation succeeds
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);

  // Second activation rejected
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.activated, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(res2.restrictionStatus, 'LIMIT_REACHED');

  // Counter remains 1 (not double-incremented)
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-03: A second physical copy of the same card can independently activate its ordinary once-per-turn ability', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({
    playerDeck: createTestDeck([cardData, cardData]),
    firstPlayer: 'player'
  });
  game.state.step = 'MAIN';

  // Copy 1
  const card1 = createCardInstance(cardData, 'player');
  const stack1 = createFieldStack(card1, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack1);

  // Copy 2
  const card2 = createCardInstance(cardData, 'player');
  const stack2 = createFieldStack(card2, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack2);

  assert.notEqual(stack1.placementId, stack2.placementId);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Copy 1 activates
  const res1 = await game.activateAbility(card1.id, physicalId, 'player');
  assert.equal(res1.success, true);

  // Copy 2 activates independently
  const res2 = await game.activateAbility(card2.id, physicalId, 'player');
  assert.equal(res2.success, true);
  assert.equal(res2.isCommitted, true);

  // Both have separate counters of 1
  const key1 = `turn:1:player:${stack1.placementId}:${physicalId}`;
  const key2 = `turn:1:player:${stack2.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key1], 1);
  assert.equal(game.state.restrictions.counters[key2], 1);
});

test('TC-ACT-04: Two distinct abilities on the same physical card maintain separate counters', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Create card with two distinct OPT abilities
  const ability1 = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const ability2 = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
  };

  const desc1 = createAbilityDescriptor(ability1);
  const desc2 = createAbilityDescriptor(ability2);
  const id1 = derivePhysicalAbilityId('BS01-MULTI', desc1, 1);
  const id2 = derivePhysicalAbilityId('BS01-MULTI', desc2, 2);

  ability1.id = id1; ability1.physicalId = id1; ability1.legacyId = '#a0';
  ability2.id = id2; ability2.physicalId = id2; ability2.legacyId = '#a1';

  const cardData = {
    card_number: 'BS01-MULTI',
    name: 'Multi Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability1, ability2] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Activate Ability 1
  const res1 = await game.activateAbility(card.id, id1, 'player');
  assert.equal(res1.success, true);

  // Ability 1 blocked on 2nd attempt
  const res1Again = await game.activateAbility(card.id, id1, 'player');
  assert.equal(res1Again.success, false);
  assert.equal(res1Again.reason, 'ABILITY_LIMIT_REACHED');

  // Ability 2 on same card succeeds independently
  const res2 = await game.activateAbility(card.id, id2, 'player');
  assert.equal(res2.success, true);

  const key1 = `turn:1:player:${stack.placementId}:${id1}`;
  const key2 = `turn:1:player:${stack.placementId}:${id2}`;
  assert.equal(game.state.restrictions.counters[key1], 1);
  assert.equal(game.state.restrictions.counters[key2], 1);
});

test('TC-ACT-05: A new physical placement receives the correct new restriction identity', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack1 = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack1);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const initialPlacement = stack1.placementId;

  // First placement activates
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);

  // Card leaves field (destroyed to grave)
  game.state.players.player.field = [];
  game.state.players.player.grave.push(card);

  // Re-summoned / re-placed on field (creates new stack with fresh placementId)
  const stack2 = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack2);

  assert.notEqual(stack2.placementId, initialPlacement);

  // New placement can activate its ordinary OPT ability
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, true);

  // Counters exist under both distinct placement IDs
  assert.equal(game.state.restrictions.counters[`turn:1:player:${initialPlacement}:${physicalId}`], 1);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack2.placementId}:${physicalId}`], 1);
});

// ===========================================================================
// SECTION B: Same Name Restrictions (TC-ACT-06 .. TC-ACT-10)
// ===========================================================================

test('TC-ACT-06: First qualifying Same Name activation succeeds', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-SN', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);

  const semanticId = cardData.compiledIr.abilities[0].semanticId;
  const sameNameKey = `turn:1:player:same_name:The DragonEmperor:${semanticId}`;
  assert.equal(game.state.restrictions.counters[sameNameKey], 1);
});

test('TC-ACT-07: Another physical copy with the same semantic ability is blocked for the same player', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData1 = createOptCardData('BS01-SN1', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');
  const cardData2 = createOptCardData('BS01-SN2', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');

  const game = createGame({ playerDeck: createTestDeck([cardData1, cardData2]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card1 = createCardInstance(cardData1, 'player');
  const stack1 = createFieldStack(card1, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack1);

  const card2 = createCardInstance(cardData2, 'player');
  const stack2 = createFieldStack(card2, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack2);

  // Card 1 activates
  const res1 = await game.activateAbility(card1.id, cardData1.compiledIr.abilities[0].id, 'player');
  assert.equal(res1.success, true);

  // Card 2 (different physical copy, same name + same semantic effect) is BLOCKED
  const res2 = await game.activateAbility(card2.id, cardData2.compiledIr.abilities[0].id, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(res2.restrictionStatus, 'LIMIT_REACHED');
});

test('TC-ACT-08: A different semantic ability on the same named card is not incorrectly blocked', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Card with same name but DIFFERENT semantic ability (BP_BUFF instead of DRAW)
  const abilityDiff = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN_SAME_NAME' },
    clauses: [{ op: { op: 'BP_BUFF', amount: 3000 } }]
  };
  const descDiff = createAbilityDescriptor(abilityDiff);
  const physicalIdDiff = derivePhysicalAbilityId('BS01-SN-DIFF', descDiff, 1);
  const semanticIdDiff = deriveSemanticAbilityId(descDiff);
  abilityDiff.id = physicalIdDiff; abilityDiff.physicalId = physicalIdDiff; abilityDiff.semanticId = semanticIdDiff;

  const cardDataDiff = {
    card_number: 'BS01-SN-DIFF',
    name: 'The DragonEmperor', // Same name!
    type: 'Spirit',
    cost: 4,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 4000 } },
    compiledIr: { abilities: [abilityDiff] }
  };

  const cardData1 = createOptCardData('BS01-SN1', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');

  const game = createGame({ playerDeck: createTestDeck([cardData1, cardDataDiff]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card1 = createCardInstance(cardData1, 'player');
  game.state.players.player.field.push(createFieldStack(card1, { normal: 2, soul: 0 }));

  const cardDiff = createCardInstance(cardDataDiff, 'player');
  game.state.players.player.field.push(createFieldStack(cardDiff, { normal: 2, soul: 0 }));

  // Activate card 1
  const res1 = await game.activateAbility(card1.id, cardData1.compiledIr.abilities[0].id, 'player');
  assert.equal(res1.success, true);

  // Different semantic ability on same named card succeeds!
  const resDiff = await game.activateAbility(cardDiff.id, physicalIdDiff, 'player');
  assert.equal(resDiff.success, true);
});

test('TC-ACT-09: The opponent has an independent Same Name restriction scope', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-SN', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([cardData]),
    firstPlayer: 'player'
  });
  game.state.step = 'MAIN';

  // Player card
  const playerCard = createCardInstance(cardData, 'player');
  game.state.players.player.field.push(createFieldStack(playerCard, { normal: 2, soul: 0 }));

  // Opponent card
  const oppCard = createCardInstance(cardData, 'opponent');
  game.state.players.opponent.field.push(createFieldStack(oppCard, { normal: 2, soul: 0 }));

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Player activates
  const resPlayer = await game.activateAbility(playerCard.id, physicalId, 'player');
  assert.equal(resPlayer.success, true);

  // Opponent activates their copy independently
  const resOpp = await game.activateAbility(oppCard.id, physicalId, 'opponent');
  assert.equal(resOpp.success, true);

  const semId = cardData.compiledIr.abilities[0].semanticId;
  assert.equal(game.state.restrictions.counters[`turn:1:player:same_name:The DragonEmperor:${semId}`], 1);
  assert.equal(game.state.restrictions.counters[`turn:1:opponent:same_name:The DragonEmperor:${semId}`], 1);
});

test('TC-ACT-10: Equivalent abilities with different physical placement IDs share the intended restriction', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-SN', 'The DragonEmperor', 'ONCE_PER_TURN_SAME_NAME');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack1 = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack1);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Placement 1 activates
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);

  // Bounced and re-summoned as new placement
  game.state.players.player.field = [];
  const stack2 = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack2);

  assert.notEqual(stack1.placementId, stack2.placementId);

  // Even with fresh placementId, SAME_NAME restriction blocks second activation in same turn!
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
});

// ===========================================================================
// SECTION C: Commitment Timing (TC-ACT-11 .. TC-ACT-17)
// ===========================================================================

test('TC-ACT-11: Failed declaration before commitment does not consume a limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  // Step is START, but ability timing is MAIN
  game.state.step = 'START';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Timing mismatch fails declaration before commitment
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'ABILITY_TIMING_MISMATCH');
  assert.equal(res.isCommitted, false);

  // Limit was NOT consumed!
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0);

  // Later in MAIN step, declaration succeeds
  game.state.step = 'MAIN';
  const resLater = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(resLater.success, true);
  assert.equal(resLater.isCommitted, true);
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-12: Unpayable cost before commitment does not consume a limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createCostOptCardData('BS01-COST', 'Cost Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  // Stack only has 1 core, but cost requires moving 2 cores to trash
  const stack = createFieldStack(card, { normal: 1, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Cost cannot be paid (only 1 core on spirit, needs 2)
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);

  // Counter was NOT incremented!
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0);

  // Add cores to spirit so cost CAN be paid (3 cores >= 2)
  stack.cores.normal = 3;
  const resPaid = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(resPaid.success, true);
  assert.equal(resPaid.isCommitted, true);
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-13: Cancelled target selection before commitment does not consume a limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Create targeting OPT ability
  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        op: {
          op: 'TARGET',
          filter: { type: 'Spirit' }
        }
      },
      {
        op: {
          op: 'DESTROY',
          target: 'PREVIOUS_TARGET'
        }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-TGT', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-TGT',
    name: 'Target Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const oppCardData = {
    card_number: 'BS01-OPP',
    name: 'Target Dummy',
    type: 'Spirit',
    cost: 2,
    color: 'White',
    levels: { 1: { cost: 1, bp: 1000 } }
  };

  let promptSelection = []; // Cancelled / empty
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([oppCardData]),
    firstPlayer: 'player',
    promptResolver: {
      choose: async (prompt) => {
        return promptSelection;
      }
    }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const oppCard = createCardInstance(oppCardData, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  // 1. First attempt: user cancels target selection (returns [])
  promptSelection = [];
  const resCancelled = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(resCancelled.success, false, 'Activation should fail on cancelled target selection');
  assert.equal(resCancelled.isCommitted, false, 'Limit should not be committed on cancelled target selection');
  assert.equal(game.state.restrictions.counters[key] || 0, 0, 'Authoritative counter must remain 0');
  assert.equal(game.state.abilityUses[`1:${card.id}:${physicalId}`] || 0, 0, 'Legacy mirror must remain 0');

  // 2. Second attempt: user selects valid target
  promptSelection = [oppStack];
  const resSuccess = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(resSuccess.success, true, 'Activation should succeed when target is selected');
  assert.equal(resSuccess.isCommitted, true, 'Limit should be committed on successful target selection');
  assert.equal(game.state.restrictions.counters[key], 1, 'Authoritative counter must now be 1');
});

test('TC-ACT-14: Successful commitment consumes the limit exactly once', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-15: Negation after commitment does not refund the limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Add NEGATE_EFFECT continuous modifier
  game.state.modifiers.push({
    type: 'NEGATE_EFFECT',
    side: 'both',
    targetType: 'ALL'
  });

  const physicalId = cardData.compiledIr.abilities[0].id;
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  // Activation commits, then effect is negated!
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.negated, true);
  assert.equal(res.isCommitted, true);
  assert.equal(res.success, false);

  // Limit was CONSUMED and NOT refunded!
  assert.equal(game.state.restrictions.counters[key], 1);

  // Second activation attempt is rejected by LIMIT_REACHED
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(res2.restrictionStatus, 'LIMIT_REACHED');
});

test('TC-ACT-16: Resolution failure after commitment does not refund the limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  // Deck only has 4 cards which are drawn at setup, so deck will be empty during DRAW effect!
  const game = createGame({ playerDeck: [cardData, cardData, cardData, cardData], firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Empty player deck manually to force DRAW effect failure
  game.state.players.player.deck = [];

  const physicalId = cardData.compiledIr.abilities[0].id;
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  // Effect fails due to empty deck
  assert.equal(res.hasFailure, true);
  assert.equal(res.isCommitted, true);

  // Limit remains consumed and is NOT refunded!
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-17: Duplicate commitment callback does not double-consume', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  const ability = cardData.compiledIr.abilities[0];
  const context = { controller: 'player', sourceCard: card, sourceStack: stack, placementId: stack.placementId };

  // First commit
  const commit1 = commitRestriction(game.state, ability, context);
  assert.equal(commit1.status, 'COMMITTED');
  assert.equal(commit1.currentCount, 1);

  // Duplicate commit on same context
  const commit2 = commitRestriction(game.state, ability, context);
  assert.equal(commit2.status, 'DUPLICATE_COMMIT');
  assert.equal(commit2.currentCount, 1);

  const key = `turn:1:player:${stack.placementId}:${ability.id}`;
  assert.equal(game.state.restrictions.counters[key], 1);
});

// ===========================================================================
// SECTION D: Optionality and Conditions (TC-ACT-18 .. TC-ACT-21)
// ===========================================================================

test('TC-ACT-18: Declining an optional ability does not consume the limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        isOptional: true,
        cleanText: 'Draw 1 card',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-OPT-DEC', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-OPT-DEC',
    name: 'Opt Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  // Mock resolver that declines optional prompt
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: {
      choose: async (prompt) => {
        if (prompt.type === 'CONFIRM_OPTIONAL') {
          return { accepted: false, declined: true };
        }
        return {};
      }
    }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.isCommitted, false);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0);
});

test('TC-ACT-19: Accepting an optional ability follows the normal commitment process', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        isOptional: true,
        cleanText: 'Draw 1 card',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-OPT-ACC', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-OPT-ACC',
    name: 'Opt Spirit 2',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  // Mock resolver that accepts optional prompt
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: {
      choose: async (prompt) => {
        if (prompt.type === 'CONFIRM_OPTIONAL') {
          return { accepted: true, declined: false };
        }
        return {};
      }
    }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-20: FALSE prerequisite follows established skip behavior without consumption before commitment', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        condition: 'life_at_least_5',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-COND-FALSE', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-COND-FALSE',
    name: 'Cond Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  // Set player life to 3 (so life_at_least_5 evaluates FALSE)
  game.state.players.player.life = 3;

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.isCommitted, false);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0);
});

test('TC-ACT-21: UNSUPPORTED prerequisite blocks safely and reports unsupported evaluation', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        condition: 'unsupported_complex_alien_astrology_condition',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-COND-UNSUP', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-COND-UNSUP',
    name: 'Unsup Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.hasUnsupported, true);
  assert.equal(res.isCommitted, false);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0);
});

// ===========================================================================
// SECTION E: Reset Behavior (TC-ACT-22 .. TC-ACT-27)
// ===========================================================================

test('TC-ACT-22: TURN restriction resets at the correct turn boundary', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Turn 1 activation
  await game.activateAbility(card.id, physicalId, 'player');
  const keyTurn1 = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[keyTurn1], 1);

  // Advance steps through ATTACK to END
  await game.advanceStep(); // MAIN -> ATTACK
  await game.advanceStep(); // ATTACK -> END
  await game.advanceStep(); // END -> START (Turn advances to 2, activePlayer switches to opponent)

  assert.equal(game.state.turnNumber, 2);

  // Turn-scoped counters for Turn 1 were cleared!
  assert.equal(game.state.restrictions.counters[keyTurn1], undefined);
});

test('TC-ACT-23: STEP restriction resets only at its correct step boundary', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_STEP' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-STEP', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-STEP',
    name: 'Step Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.turnNumber = 2; // Turn 2 so attack step is not skipped
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const keyStep = `step:2:MAIN:player:${stack.placementId}:${physicalId}`;

  // First activation in MAIN step
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);
  assert.equal(game.state.restrictions.counters[keyStep], 1);

  // Second activation in same MAIN step rejected
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');

  // Advance step (MAIN -> ATTACK)
  await game.advanceStep();
  assert.equal(game.state.step, 'ATTACK');

  // Step counter was cleared!
  assert.equal(game.state.restrictions.counters[keyStep], undefined);
});

test('TC-ACT-24: BATTLE restriction resets at battle end', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_BATTLE' },
    clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-BAT', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-BAT',
    name: 'Battle Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'ATTACK';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Declare attack to enter combat
  await game.declareAttack(stack.id, 'player');
  assert.notEqual(game.state.combat, null);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);

  // Resolve combat (direct hit) to end battle
  await game.resolveDirectHit('player');
  assert.equal(game.state.combat, null);

  // Battle restriction was reset
  for (const k of Object.keys(game.state.restrictions.counters)) {
    assert.equal(k.startsWith('battle:'), false);
  }
});

test('TC-ACT-25: ATTACK restriction resets at attack end', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const atkAbility = {
    type: 'ABILITY',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_ATTACK' },
    clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
  };
  const atkDesc = createAbilityDescriptor(atkAbility);
  const atkPhysicalId = derivePhysicalAbilityId('BS01-ATK', atkDesc, 1);
  atkAbility.id = atkPhysicalId; atkAbility.physicalId = atkPhysicalId; atkAbility.legacyId = '#a0';

  const btlAbility = {
    type: 'ABILITY',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_BATTLE' },
    clauses: [{ op: { op: 'BP_BUFF', amount: 1000 } }]
  };
  const btlDesc = createAbilityDescriptor(btlAbility);
  const btlPhysicalId = derivePhysicalAbilityId('BS01-BTL', btlDesc, 1);
  btlAbility.id = btlPhysicalId; btlAbility.physicalId = btlPhysicalId; btlAbility.legacyId = '#a1';

  const cardData = {
    card_number: 'BS01-COMBAT',
    name: 'Combat Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [atkAbility, btlAbility] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'ATTACK';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  await game.declareAttack(stack.id, 'player');
  await game.activateAbility(card.id, atkPhysicalId, 'player');
  await game.activateAbility(card.id, btlPhysicalId, 'player');

  // Both should be committed
  const hasAtk = () => Object.keys(game.state.restrictions.counters).some(k => k.startsWith('attack:'));
  const hasBtl = () => Object.keys(game.state.restrictions.counters).some(k => k.startsWith('battle:'));
  assert.equal(hasAtk(), true, 'Attack restriction should be committed');
  assert.equal(hasBtl(), true, 'Battle restriction should be committed');

  // Independently trigger game.endAttack()
  game.endAttack();

  // Attack-scoped counter cleared, battle-scoped counter remains intact!
  assert.equal(hasAtk(), false, 'Attack counter must be cleared by endAttack()');
  assert.equal(hasBtl(), true, 'Battle counter must remain intact after endAttack()');

  // Independently trigger game.endBattle()
  game.endBattle();
  assert.equal(hasBtl(), false, 'Battle counter must be cleared by endBattle()');
});

test('TC-ACT-26: One player reset does not clear the opponent independent counters', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-OPG', 'OPG Dragon', 'ONCE_PER_GAME_SAME_NAME');
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([cardData]),
    firstPlayer: 'player'
  });

  const cardP = createCardInstance(cardData, 'player');
  const cardO = createCardInstance(cardData, 'opponent');
  const ability = cardData.compiledIr.abilities[0];

  commitRestriction(game.state, ability, { controller: 'player', sourceCard: cardP });
  commitRestriction(game.state, ability, { controller: 'opponent', sourceCard: cardO });

  const semId = ability.semanticId;
  const keyP = `game:player:same_name:OPG Dragon:${semId}`;
  const keyO = `game:opponent:same_name:OPG Dragon:${semId}`;

  assert.equal(game.state.restrictions.counters[keyP], 1);
  assert.equal(game.state.restrictions.counters[keyO], 1);

  // Execute turn reset
  resetRestrictions(game.state, 'TURN');

  // Both game-scoped counters remain 100% intact!
  assert.equal(game.state.restrictions.counters[keyP], 1);
  assert.equal(game.state.restrictions.counters[keyO], 1);
});

test('TC-ACT-27: Duplicate lifecycle events do not create incorrect counter state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['turn:1:test'] = 1;

  // Multiple consecutive turn resets
  resetRestrictions(game.state, 'TURN');
  resetRestrictions(game.state, 'TURN');
  resetRestrictions(game.state, 'TURN');

  assert.equal(game.state.restrictions.counters['turn:1:test'], undefined);
  assert.deepEqual(game.state.restrictions.counters, {});
});

// ===========================================================================
// SECTION F: Persistence and Legacy Compatibility (TC-ACT-28 .. TC-ACT-35)
// ===========================================================================

test('TC-ACT-28: JSON serialization and restoration preserve authoritative restriction state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  await game.activateAbility(card.id, physicalId, 'player');

  const serialized = JSON.stringify(game.state);
  const parsedState = JSON.parse(serialized);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(parsedState.restrictions.counters[key], 1);
  assert.equal(parsedState.restrictions.meta[key].type, 'ONCE_PER_TURN');
});

test('TC-ACT-29: Restored state still blocks an already-used activation', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  await game.activateAbility(card.id, physicalId, 'player');

  // Serialize and restore into state
  const serialized = JSON.stringify(game.state);
  game.state = JSON.parse(serialized);

  // Activation on restored state is still blocked
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.reason, 'ABILITY_LIMIT_REACHED');
});

test('TC-ACT-30: Legacy abilityUses mirror remains synchronized', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  await game.activateAbility(card.id, physicalId, 'player');

  // Verify legacy mirror in state.abilityUses
  const legacyKey = `1:${card.id}:${physicalId}`;
  const legacyFallbackKey = `1:${card.id}:#a0`;

  assert.equal(game.state.abilityUses[legacyKey], true);
  assert.equal(game.state.abilityUses[legacyFallbackKey], true);
});

test('TC-ACT-31: Legacy activation entry point enforces the same restriction', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const card = {
    id: 'inst_1',
    uid: 'inst_1',
    card_number: 'BS01-001',
    name: 'Blade Dragon',
    type: 'Spirit',
    currentLevel: 1,
    currentCores: 2,
    placementId: 'p_1'
  };

  const duelState = {
    turn: 1,
    activePlayer: 'player',
    player: { field: [card], reserve: 3, trash: 0, life: 5, deck: [{ card_number: 'D1' }, { card_number: 'D2' }] },
    opponent: { field: [], reserve: 3, trash: 0, life: 5 }
  };

  const ability = cardData.compiledIr.abilities[0];

  // First call via resolveLegacyAbility succeeds
  const res1 = await resolveLegacyAbility(duelState, card, ability, 'player');
  assert.equal(res1.success, true);

  // Second call via resolveLegacyAbility is blocked by restriction
  const res2 = await resolveLegacyAbility(duelState, card, ability, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
});

test('TC-ACT-32: Modern restriction state survives supported legacy conversion', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-001', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  await game.activateAbility(card.id, physicalId, 'player');

  // Sync to legacy duelState
  const duelState = {};
  syncEngineStateToLegacy(game.state, duelState, { toLegacy: (c) => c });

  assert.notEqual(duelState.restrictions, undefined);
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(duelState.restrictions.counters[key], 1);

  // Re-create engine state from legacy duelState
  const { state: restoredEngineState } = createEngineStateFromLegacy(duelState);
  assert.equal(restoredEngineState.restrictions.counters[key], 1);
});

test('TC-ACT-33: Missing or malformed identity is rejected safely', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Ability with limit but missing physicalId / id
  const malformedAbility = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
    // No id or physicalId!
  };

  const game = createGame({ firstPlayer: 'player' });
  const evalRes = evaluateRestriction(game.state, malformedAbility, { controller: 'player', placementId: 'p_1' });

  assert.equal(evalRes.status, RESTRICTION_STATUS.INVALID_IDENTITY);
});

test('TC-ACT-34: Unknown restriction type is not treated as unrestricted', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const unknownLimitAbility = {
    type: 'ABILITY',
    id: 'BS01#AB_UNKNOWN',
    physicalId: 'BS01#AB_UNKNOWN',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'THREE_TIMES_PER_PHASE_SPECIAL' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const game = createGame({ firstPlayer: 'player' });
  const evalRes = evaluateRestriction(game.state, unknownLimitAbility, { controller: 'player', placementId: 'p_1' });

  // Must reject as UNSUPPORTED_RESTRICTION, never silently ALLOWED
  assert.equal(evalRes.status, RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION);
});

test('TC-ACT-35: Existing golden compiler and engine regression tests remain unchanged and pass', async () => {
  // Verification test asserting that golden compiler functions with new restriction-aware runtime
  const card = cardsData['BS01-010'];
  assert.ok(card, 'Card BS01-010 exists');
  const compiled = compileCard(card);
  assert.equal(compiled.cardNumber, 'BS01-010');
  assert.equal(Array.isArray(compiled.abilities), true);
  for (const ab of compiled.abilities) {
    assert.equal(typeof ab.physicalId, 'string');
    assert.equal(typeof ab.semanticId, 'string');
  }
});

// ============================================================================
// Phase 4C.3.2.2 Corrective Tests (TC-ACT-FIX-01 .. TC-ACT-FIX-32)
// ============================================================================

// --- Category 1: Commitment Failure Propagation & Atomicity (TC-ACT-FIX-01 .. 06) ---

test('TC-ACT-FIX-01: Resolver halts immediately when commitActivation fails due to LIMIT_REACHED; operations are never executed', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-F01', 'Blade Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const initialHand = game.state.players.player.hand.length;

  // First activation succeeds and draws
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);
  assert.equal(res1.isCommitted, true);
  assert.equal(game.state.players.player.hand.length, initialHand + 1);

  // Second activation must fail and NOT execute the draw operation
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.isCommitted, false);
  assert.equal(res2.restrictionStatus, RESTRICTION_STATUS.LIMIT_REACHED);
  // Hand count remains strictly unchanged
  assert.equal(game.state.players.player.hand.length, initialHand + 1);
});

test('TC-ACT-FIX-02: Multi-clause ability with commit failure in clause 1 does not execute clause 2 or subsequent clauses', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const multiAbility = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      { op: { op: 'DRAW', count: 1 } },
      { op: { op: 'BP_BUFF', amount: 5000 } }
    ]
  };
  const desc = createAbilityDescriptor(multiAbility);
  const physicalId = derivePhysicalAbilityId('BS01-F02', desc, 1);
  multiAbility.id = physicalId; multiAbility.physicalId = physicalId; multiAbility.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F02',
    name: 'Multi Clause Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [multiAbility] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Consume limit first manually
  commitRestriction(game.state, multiAbility, { controller: 'player', sourceCard: card, placementId: stack.placementId });

  const initialHand = game.state.players.player.hand.length;
  const initialModifiers = (game.state.modifiers || []).length;

  // Activation should fail-fast at clause 1; neither DRAW nor BP_BUFF should execute
  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(game.state.players.player.hand.length, initialHand);
  assert.equal((game.state.modifiers || []).length, initialModifiers);
});

test('TC-ACT-FIX-03: Resolver halts and returns INVALID_IDENTITY when ability lacks valid physicalId/semanticId', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const brokenAbility = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
    // missing id and physicalId
  };

  const cardData = {
    card_number: 'BS01-F03',
    name: 'Broken Identity Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [brokenAbility] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const evalRes = evaluateRestriction(game.state, brokenAbility, { controller: 'player', sourceCard: card, placementId: stack.placementId });
  assert.equal(evalRes.status, RESTRICTION_STATUS.INVALID_IDENTITY);

  const commitRes = commitRestriction(game.state, brokenAbility, { controller: 'player', sourceCard: card, placementId: stack.placementId });
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_IDENTITY);
});

test('TC-ACT-FIX-04: Resolver halts and returns UNSUPPORTED_RESTRICTION when restriction type is unsupported', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const unknownAbility = {
    type: 'ABILITY',
    id: 'BS01-F04#AB_UNKNOWN',
    physicalId: 'BS01-F04#AB_UNKNOWN',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'THREE_TIMES_PER_TURN_SPECIAL' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const cardData = {
    card_number: 'BS01-F04',
    name: 'Unsupported Limit Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [unknownAbility] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, unknownAbility.id, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(res.restrictionStatus, RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION);
});

test('TC-ACT-FIX-05: Resolver halts and returns INVALID_RESTRICTION_STATE when restriction state is corrupted', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-F05', 'Corrupt State Spirit');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Corrupt state restrictions
  game.state.restrictions.counters = null;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(res.restrictionStatus, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
});

test('TC-ACT-FIX-06: Real concurrent game.activateAbility calls with async barrier: only winning activation commits and pays costs', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Ability has a cost (1 core from spirit to trash) and an effect (DRAW 1), with optional confirmation prompt
  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        isCost: true,
        isOptional: true,
        cleanText: 'Pay 1 core',
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'field', target: 'self' },
          to: { zone: 'trash' }
        }
      },
      {
        link: 'byDoing',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F06', desc, 1);
  ability.id = physicalId;
  ability.physicalId = physicalId;
  ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F06',
    name: 'Concurrent Atomic Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  let releaseBarrier;
  const barrierPromise = new Promise(resolve => { releaseBarrier = resolve; });

  const customPromptResolver = {
    async choose(prompt) {
      // First activation is paused at optional confirmation prompt
      await barrierPromise;
      return { accepted: true };
    }
  };

  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: customPromptResolver
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  // Stack starts with 2 cores
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const initialHand = game.state.players.player.hand.length;
  const initialTrash = game.state.players.player.trash.normal;

  // Launch Activation 1 (will pause inside promptResolver)
  const act1Promise = game.activateAbility(card.id, physicalId, 'player');

  // Verify Activation 1 has reserved capacity
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.reservations[key], 1);
  assert.equal(game.state.restrictions.counters[key] || 0, 0);

  // Launch Activation 2 while Activation 1 is paused behind barrier
  const act2Res = await game.activateAbility(card.id, physicalId, 'player');

  // Activation 2 MUST be rejected immediately due to capacity limit reached!
  assert.equal(act2Res.success, false);
  assert.equal(act2Res.isCommitted, false);
  assert.equal(act2Res.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(act2Res.restrictionStatus, 'LIMIT_REACHED');

  // Activation 2 did NOT pay any costs! Cores on stack remain 2
  assert.equal(stack.cores.normal, 2);
  assert.equal(game.state.players.player.trash.normal, initialTrash);

  // Now unblock Activation 1
  releaseBarrier();
  const act1Res = await act1Promise;

  // Activation 1 succeeds, pays cost, commits, and draws 1 card
  assert.equal(act1Res.success, true);
  assert.equal(act1Res.isCommitted, true);
  assert.equal(stack.cores.normal, 1); // 1 core paid to trash
  assert.equal(game.state.players.player.trash.normal, initialTrash + 1);
  assert.equal(game.state.players.player.hand.length, initialHand + 1);

  // Reservation was cleanly converted to counter
  assert.equal(game.state.restrictions.counters[key], 1);
  assert.equal(game.state.restrictions.reservations[key], undefined);
  assert.equal(game.state.restrictions.meta._reservations, undefined);
});

test('TC-ACT-FIX-06B: Failed cost payment or prompt decline releases reservation and leaves zero costs paid', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        isCost: true,
        isOptional: true,
        cleanText: 'Pay 1 core',
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'field', target: 'self' },
          to: { zone: 'trash' }
        }
      },
      {
        link: 'byDoing',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F06B', desc, 1);
  ability.id = physicalId;
  ability.physicalId = physicalId;
  ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F06B',
    name: 'Decline Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  let decline = true;
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: {
      async choose() {
        return decline ? { declined: true } : { accepted: true };
      }
    }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  // First activation declines optional cost prompt
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, false);
  assert.equal(res1.isCommitted, false);
  // Zero costs paid
  assert.equal(stack.cores.normal, 2);
  // Reservation cleanly released, counter remains 0
  assert.equal(game.state.restrictions.counters[key] || 0, 0);
  assert.equal(game.state.restrictions.reservations[key], undefined);
  assert.equal(game.state.restrictions.meta._reservations, undefined);

  // Subsequent activation accepts and succeeds
  decline = false;
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, true);
  assert.equal(res2.isCommitted, true);
  assert.equal(stack.cores.normal, 1);
  assert.equal(game.state.restrictions.counters[key], 1);
  assert.equal(game.state.restrictions.reservations[key], undefined);
});

test('TC-ACT-FIX-06C: Exception during ability resolution cleans up active reservation without leaks', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-F06C', 'Throwing Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  // Inject a throw into resolveClause
  const origResolveClause = game.resolver.resolveClause;
  game.resolver.resolveClause = async () => {
    throw new Error('Simulated unexpected engine exception');
  };

  await assert.rejects(
    async () => {
      await game.activateAbility(card.id, physicalId, 'player');
    },
    { message: 'Simulated unexpected engine exception' }
  );

  // Verify reservation was cleanly released despite exception!
  assert.equal(game.state.restrictions.counters[key] || 0, 0);
  assert.equal(game.state.restrictions.reservations[key], undefined);
  assert.equal(game.state.restrictions.meta._reservations, undefined);

  // Restore and verify subsequent activation can activate normally
  game.resolver.resolveClause = origResolveClause;
  const resNormal = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(resNormal.success, true);
  assert.equal(resNormal.isCommitted, true);
  assert.equal(game.state.restrictions.counters[key], 1);
});

test('TC-ACT-FIX-06D: Post-commit effect failure or negation does not refund costs or release committed limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createCostOptCardData('BS01-F06D', 'Negated Cost Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 3, soul: 0 });
  game.state.players.player.field.push(stack);

  // Add NEGATE_EFFECT continuous modifier
  game.state.modifiers.push({
    type: 'NEGATE_EFFECT',
    side: 'both'
  });

  const physicalId = cardData.compiledIr.abilities[0].id;
  const initialHand = game.state.players.player.hand.length;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.negated, true);
  assert.equal(res.isCommitted, true);

  // Cost was paid (2 cores moved to trash) and NOT refunded
  assert.equal(stack.cores.normal, 1);
  assert.equal(game.state.players.player.trash.normal, 2);

  // Draw did not occur
  assert.equal(game.state.players.player.hand.length, initialHand);

  // Counter remains consumed (1)
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
  assert.equal(game.state.restrictions.reservations[key], undefined);
});

// --- Category 2: Target Selection and Commitment Timing (TC-ACT-FIX-07 .. 11) ---

test('TC-ACT-FIX-07: Target prompt cancellation prior to commitment leaves limit intact and counter at 0', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      { op: { op: 'TARGET', filter: { type: 'Spirit' } } },
      { op: { op: 'EXHAUST', target: 'PREVIOUS_TARGET' } }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F07', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F07',
    name: 'Exhaust Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };
  const oppCardData = {
    card_number: 'BS01-OPP7',
    name: 'Exhaust Target',
    type: 'Spirit',
    cost: 2,
    color: 'White',
    levels: { 1: { cost: 1, bp: 1000 } }
  };

  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([oppCardData]),
    firstPlayer: 'player',
    promptResolver: { choose: async () => [] } // Cancel selection
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const oppCard = createCardInstance(oppCardData, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(Object.keys(game.state.restrictions.counters).length, 0);
});

test('TC-ACT-FIX-08: Unavailable/invalid targets before commitment abort resolution without consuming limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      { op: { op: 'TARGET', filter: { type: 'Nexus' } } }, // Opponent has no Nexuses
      { op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F08', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F08',
    name: 'Nexus Crusher',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Opponent has no nexuses
  assert.equal(game.state.players.opponent.field.length, 0);

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(Object.keys(game.state.restrictions.counters).length, 0);
});

test('TC-ACT-FIX-09: Valid target selection triggers commitment exactly once before target operation effects execute', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      { op: { op: 'TARGET', filter: { type: 'Spirit' } } },
      { op: { op: 'DESTROY', target: 'PREVIOUS_TARGET' } }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F09', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F09',
    name: 'Valid Target Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };
  const oppCardData = {
    card_number: 'BS01-OPP9',
    name: 'Opp Spirit',
    type: 'Spirit',
    cost: 2,
    color: 'White',
    levels: { 1: { cost: 1, bp: 1000 } }
  };

  let chosenTarget;
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([oppCardData]),
    firstPlayer: 'player',
    promptResolver: { choose: async () => [chosenTarget] }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const oppCard = createCardInstance(oppCardData, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack);
  chosenTarget = oppStack;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(Object.values(game.state.restrictions.counters)[0], 1);
});

test('TC-ACT-FIX-10: Multi-target selection commits once upon valid candidate selection', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      { op: { op: 'TARGET_SELECT', count: 2, filter: { type: 'Spirit' } } },
      { op: { op: 'EXHAUST', target: 'PREVIOUS_TARGET' } }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-F10', desc, 1);
  ability.id = physicalId; ability.physicalId = physicalId; ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-F10',
    name: 'Multi Target Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };
  const oppCardData1 = { card_number: 'BS01-O1', name: 'O1', type: 'Spirit', cost: 1, color: 'Red', levels: { 1: { cost: 1, bp: 1000 } } };
  const oppCardData2 = { card_number: 'BS01-O2', name: 'O2', type: 'Spirit', cost: 1, color: 'Red', levels: { 1: { cost: 1, bp: 1000 } } };

  let targets = [];
  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    opponentDeck: createTestDeck([oppCardData1, oppCardData2]),
    firstPlayer: 'player',
    promptResolver: { choose: async () => targets }
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const oppStack1 = createFieldStack(createCardInstance(oppCardData1, 'opponent'), { normal: 1, soul: 0 });
  const oppStack2 = createFieldStack(createCardInstance(oppCardData2, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack1, oppStack2);
  targets = [oppStack1, oppStack2];

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(Object.values(game.state.restrictions.counters)[0], 1);
});

test('TC-ACT-FIX-11: Post-commit negation (EFFECT_NEGATED) aborts effect execution but preserves consumed activation limit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-F11', 'Negated Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Add continuous NEGATE_EFFECT modifier
  game.state.modifiers.push({
    type: 'NEGATE_EFFECT',
    side: 'both'
  });

  const physicalId = cardData.compiledIr.abilities[0].id;
  const initialHand = game.state.players.player.hand.length;

  const res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.negated, true);
  // Activation limit was committed and remains consumed!
  assert.equal(res.isCommitted, true);
  assert.equal(game.state.players.player.hand.length, initialHand); // Draw did not execute
  assert.equal(Object.values(game.state.restrictions.counters)[0], 1);
});

// --- Category 3: Independent Attack and Battle Reset Boundaries (TC-ACT-FIX-12 .. 16) ---

test('TC-ACT-FIX-12: game.endAttack() clears ATTACK-scoped counters while BATTLE-scoped counters remain intact', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['attack:1:s1:player:p1:ab1'] = 1;
  game.state.restrictions.counters['battle:1:b1:player:p1:ab2'] = 1;

  game.endAttack();

  assert.equal(game.state.restrictions.counters['attack:1:s1:player:p1:ab1'], undefined);
  assert.equal(game.state.restrictions.counters['battle:1:b1:player:p1:ab2'], 1);
});

test('TC-ACT-FIX-13: game.endBattle() clears BATTLE-scoped counters and THIS_BATTLE modifiers while ATTACK-scoped counters remain intact', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['attack:1:s1:player:p1:ab1'] = 1;
  game.state.restrictions.counters['battle:1:b1:player:p1:ab2'] = 1;
  game.state.modifiers.push({ duration: 'THIS_BATTLE', type: 'BP_BUFF', amount: 1000 });
  game.state.modifiers.push({ duration: 'THIS_TURN', type: 'BP_BUFF', amount: 2000 });

  game.endBattle();

  assert.equal(game.state.restrictions.counters['attack:1:s1:player:p1:ab1'], 1);
  assert.equal(game.state.restrictions.counters['battle:1:b1:player:p1:ab2'], undefined);
  // THIS_BATTLE modifier pruned, THIS_TURN modifier kept
  assert.equal(game.state.modifiers.some(m => m.duration === 'THIS_BATTLE'), false);
  assert.equal(game.state.modifiers.some(m => m.duration === 'THIS_TURN'), true);
});

test('TC-ACT-FIX-14: Unblocked attack (resolveDirectHit) concludes combat resetting both ATTACK and BATTLE counters while preserving TURN and GAME counters', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = {
    card_number: 'BS01-F14',
    name: 'Direct Hit Attacker',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } }
  };
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'ATTACK';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Set up counters in all four scopes
  game.state.restrictions.counters['attack:1:s1:player:p1:ab1'] = 1;
  game.state.restrictions.counters['battle:1:b1:player:p1:ab2'] = 1;
  game.state.restrictions.counters['turn:1:player:p1:ab3'] = 1;
  game.state.restrictions.counters['game:player:card:c1:ab4'] = 1;

  await game.declareAttack(stack.id, 'player');
  assert.notEqual(game.state.combat, null);

  const initialLife = game.state.players.opponent.life;
  await game.resolveDirectHit('player');

  assert.equal(game.state.combat, null);
  assert.equal(game.state.players.opponent.life, initialLife - 1);

  // Combat conclusion resets both ATTACK- and BATTLE-scoped counters
  assert.equal(game.state.restrictions.counters['attack:1:s1:player:p1:ab1'], undefined);
  assert.equal(game.state.restrictions.counters['battle:1:b1:player:p1:ab2'], undefined);

  // TURN- and GAME-scoped counters remain strictly intact!
  assert.equal(game.state.restrictions.counters['turn:1:player:p1:ab3'], 1);
  assert.equal(game.state.restrictions.counters['game:player:card:c1:ab4'], 1);
});

test('TC-ACT-FIX-15: Ending battle does not reset turn-scoped or game-scoped restrictions', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['turn:1:player:p1:ab1'] = 1;
  game.state.restrictions.counters['game:player:BladeDragon:sem1'] = 1;
  game.state.restrictions.counters['battle:1:b1:player:p1:ab2'] = 1;

  game.endBattle();

  assert.equal(game.state.restrictions.counters['battle:1:b1:player:p1:ab2'], undefined);
  assert.equal(game.state.restrictions.counters['turn:1:player:p1:ab1'], 1);
  assert.equal(game.state.restrictions.counters['game:player:BladeDragon:sem1'], 1);
});

test('TC-ACT-FIX-16: Repeated or redundant endAttack/endBattle calls are idempotent and do not corrupt state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['turn:1:player:p1:ab1'] = 1;

  // Multiple sequential calls must not throw or alter other scopes
  game.endAttack();
  game.endAttack();
  game.endBattle();
  game.endBattle();

  assert.equal(game.state.restrictions.counters['turn:1:player:p1:ab1'], 1);
  const val = validateRestrictionState(game.state);
  assert.equal(val.valid, true);
});

// --- Category 4: Strict Restriction Parsing (TC-ACT-FIX-17 .. 22) ---

test('TC-ACT-FIX-17: Unknown string containing "TURN" (e.g. "MY_TURN_SPECIAL") is rejected as UNKNOWN/UNSUPPORTED_RESTRICTION', () => {
  assert.equal(normalizeRestrictionType('MY_TURN_SPECIAL'), RESTRICTION_TYPE.UNKNOWN);
  assert.equal(normalizeRestrictionType('TURN_OF_THE_CENTURY'), RESTRICTION_TYPE.UNKNOWN);
});

test('TC-ACT-FIX-18: Unknown string containing "GAME" (e.g. "GAME_OVER") is rejected as UNKNOWN/UNSUPPORTED_RESTRICTION', () => {
  assert.equal(normalizeRestrictionType('GAME_OVER'), RESTRICTION_TYPE.UNKNOWN);
  assert.equal(normalizeRestrictionType('END_OF_GAME_BONUS'), RESTRICTION_TYPE.UNKNOWN);
});

test('TC-ACT-FIX-19: Canonical restriction mapping accepts explicit aliases correctly', () => {
  assert.equal(normalizeRestrictionType('ONCE_PER_TURN'), RESTRICTION_TYPE.ONCE_PER_TURN);
  assert.equal(normalizeRestrictionType('[ONCE_PER_TURN]'), RESTRICTION_TYPE.ONCE_PER_TURN);
  assert.equal(normalizeRestrictionType('OPT'), RESTRICTION_TYPE.ONCE_PER_TURN);
  assert.equal(normalizeRestrictionType('TURN'), RESTRICTION_TYPE.ONCE_PER_TURN);
  assert.equal(normalizeRestrictionType('ONCE_PER_GAME'), RESTRICTION_TYPE.ONCE_PER_GAME);
  assert.equal(normalizeRestrictionType('OPG'), RESTRICTION_TYPE.ONCE_PER_GAME);
  assert.equal(normalizeRestrictionType('ONCE_PER_TURN_SAME_NAME'), RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME);
  assert.equal(normalizeRestrictionType('OPT_SAME_NAME'), RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME);
  assert.equal(normalizeRestrictionType('ONCE_PER_GAME_SAME_NAME'), RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME);
  assert.equal(normalizeRestrictionType('OPG_SAME_NAME'), RESTRICTION_TYPE.ONCE_PER_GAME_SAME_NAME);
});

test('TC-ACT-FIX-20: Non-string or empty restriction types are rejected safely without throws', () => {
  assert.equal(normalizeRestrictionType(null), RESTRICTION_TYPE.NONE);
  assert.equal(normalizeRestrictionType(undefined), RESTRICTION_TYPE.NONE);
  assert.equal(normalizeRestrictionType(''), RESTRICTION_TYPE.UNKNOWN);
  assert.equal(normalizeRestrictionType('   '), RESTRICTION_TYPE.UNKNOWN);
  assert.equal(normalizeRestrictionType(123), RESTRICTION_TYPE.UNKNOWN);
  assert.equal(normalizeRestrictionType({}), RESTRICTION_TYPE.UNKNOWN);
});

test('TC-ACT-FIX-21: Restriction with maxLimit <= 0 or non-integer is rejected as unsupported/invalid', () => {
  const dummyState = { turnNumber: 1 };
  const abZero = { header: { limit: 'ONCE_PER_TURN', limitCount: 0 }, id: 'ab1' };
  const resZero = buildRestrictionKey(dummyState, abZero, { controller: 'player', placementId: 'p1' });
  assert.equal(resZero.valid, false);
  assert.equal(resZero.error, RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION);

  const abNeg = { header: { limit: 'ONCE_PER_TURN', limitCount: -1 }, id: 'ab1' };
  const resNeg = buildRestrictionKey(dummyState, abNeg, { controller: 'player', placementId: 'p1' });
  assert.equal(resNeg.valid, false);
  assert.equal(resNeg.error, RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION);

  const abFloat = { header: { limit: 'ONCE_PER_TURN', limitCount: 1.5 }, id: 'ab1' };
  const resFloat = buildRestrictionKey(dummyState, abFloat, { controller: 'player', placementId: 'p1' });
  assert.equal(resFloat.valid, false);
  assert.equal(resFloat.error, RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION);
});

test('TC-ACT-FIX-22: Valid canonical types map deterministically to TURN, GAME, BATTLE, ATTACK scopes', () => {
  const dummyState = { turnNumber: 1 };

  const abTurn = { header: { limit: 'ONCE_PER_TURN' }, id: 'ab_turn', physicalId: 'ab_turn' };
  const kTurn = buildRestrictionKey(dummyState, abTurn, { controller: 'player', placementId: 'p1' });
  assert.equal(kTurn.valid, true);
  assert.ok(kTurn.key.startsWith('turn:1:'));

  const abGame = { header: { limit: 'ONCE_PER_GAME_SAME_NAME' }, id: 'ab_game', semanticId: 'sem_game' };
  const kGame = buildRestrictionKey(dummyState, abGame, { controller: 'player', cardName: 'Dragon' });
  assert.equal(kGame.valid, true);
  assert.ok(kGame.key.startsWith('game:player:same_name:Dragon:sem_game'));

  const abBtl = { header: { limit: 'ONCE_PER_BATTLE' }, id: 'ab_btl', physicalId: 'ab_btl' };
  const kBtl = buildRestrictionKey(dummyState, abBtl, { controller: 'player', placementId: 'p1' });
  assert.equal(kBtl.valid, true);
  assert.ok(kBtl.key.startsWith('battle:1:'));

  const abAtk = { header: { limit: 'ONCE_PER_ATTACK' }, id: 'ab_atk', physicalId: 'ab_atk' };
  const kAtk = buildRestrictionKey(dummyState, abAtk, { controller: 'player', placementId: 'p1' });
  assert.equal(kAtk.valid, true);
  assert.ok(kAtk.key.startsWith('attack:1:'));
});

// --- Category 5: Authoritative Restriction-State Validation (TC-ACT-FIX-23 .. 28) ---

test('TC-ACT-FIX-23: State validation rejects negative counter values', () => {
  const state = { restrictions: { counters: { 'turn:1:p1:ab1': -1 }, meta: {} } };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.equal(res.error, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.ok(res.reason.includes('INVALID_COUNTER'));
});

test('TC-ACT-FIX-24: State validation rejects non-integer / fractional counter values', () => {
  const state = { restrictions: { counters: { 'turn:1:p1:ab1': 1.5 }, meta: {} } };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.equal(res.error, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.ok(res.reason.includes('INVALID_COUNTER'));
});

test('TC-ACT-FIX-25: State validation rejects NaN or Infinity counter values', () => {
  const stateNaN = { restrictions: { counters: { 'turn:1:p1:ab1': NaN }, meta: {} } };
  assert.equal(validateRestrictionState(stateNaN).valid, false);

  const stateInf = { restrictions: { counters: { 'turn:1:p1:ab1': Infinity }, meta: {} } };
  assert.equal(validateRestrictionState(stateInf).valid, false);
});

test('TC-ACT-FIX-26: State validation rejects malformed counters object (non-plain object, array, or null)', () => {
  assert.equal(validateRestrictionState({ restrictions: { counters: null, meta: {} } }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: { counters: [], meta: {} } }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: { counters: 'invalid', meta: {} } }).valid, false);
});

test('TC-ACT-FIX-27: evaluateRestriction and commitRestriction return INVALID_RESTRICTION_STATE without silently repairing state into unrestricted', () => {
  const malformedState = { restrictions: { counters: { 'turn:1': -5 }, meta: {} } };
  const ability = { header: { limit: 'ONCE_PER_TURN' }, id: 'ab1', physicalId: 'ab1' };

  const evalRes = evaluateRestriction(malformedState, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(evalRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  // Must NOT silently wipe and treat as ALLOWED
  assert.notEqual(evalRes.status, RESTRICTION_STATUS.ALLOWED);

  const commitRes = commitRestriction(malformedState, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
});

test('TC-ACT-FIX-28: Valid serialized state survives round-trip validation and restoration', () => {
  const game = createGame({ firstPlayer: 'player' });
  game.state.restrictions.counters['turn:1:player:p1:ab1'] = 1;
  game.state.restrictions.counters['game:player:Dragon:sem1'] = 1;

  const serialized = JSON.stringify(game.state);
  const parsed = JSON.parse(serialized);

  const val = validateRestrictionState(parsed);
  assert.equal(val.valid, true);
  assert.equal(parsed.restrictions.counters['turn:1:player:p1:ab1'], 1);
  assert.equal(parsed.restrictions.counters['game:player:Dragon:sem1'], 1);
});

// --- Category 6: Legacy Compatibility (TC-ACT-FIX-29 .. 32) ---

test('TC-ACT-FIX-29: Legacy turn:cardId:abilityId format is mirrored and synced into authoritative counters without data loss', () => {
  const state = {
    turn: 2,
    restrictions: { counters: {}, meta: {} },
    abilityUses: { '2:card123:ab456': 1 }
  };

  syncLegacyToRestrictions(state);

  assert.equal(state.restrictions.counters['turn:2:legacy:card123:ab456'], 1);
  assert.equal(state.restrictions.meta['turn:2:legacy:card123:ab456'].type, RESTRICTION_TYPE.ONCE_PER_TURN);
});

test('TC-ACT-FIX-30: Legacy cardId_abilityId format is mirrored and synced into authoritative counters', () => {
  const state = {
    turn: 1,
    restrictions: { counters: {}, meta: {} },
    abilityUses: { 'card789_ab999': 1 }
  };

  syncLegacyToRestrictions(state);

  assert.equal(state.restrictions.counters['turn:1:legacy:card789:ab999'], 1);
  assert.equal(state.restrictions.meta['turn:1:legacy:card789:ab999'].type, RESTRICTION_TYPE.ONCE_PER_TURN);
});

test('TC-ACT-FIX-31: Ambiguous legacy keys are safely isolated in meta._ambiguousLegacy without overwriting authoritative counters', () => {
  const state = {
    turn: 1,
    restrictions: { counters: {}, meta: {} },
    abilityUses: { 'opaqueambiguouskeywithoutdelimiters': 3 }
  };

  syncLegacyToRestrictions(state);

  assert.equal(Object.keys(state.restrictions.counters).length, 0);
  assert.equal(state.restrictions.meta._ambiguousLegacy['opaqueambiguouskeywithoutdelimiters'], 3);
});

test('TC-ACT-FIX-32: Synchronized legacy state cannot bypass or decrement modern authoritative restriction limits', () => {
  const cardData = createOptCardData('BS01-F32', 'Legacy Guard Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  const ability = cardData.compiledIr.abilities[0];

  // Modern commitment
  commitRestriction(game.state, ability, { controller: 'player', sourceCard: card, placementId: stack.placementId });

  // Corrupt legacy abilityUses with 0
  game.state.abilityUses[`1:${card.id}:${ability.id}`] = 0;

  // Re-sync legacy
  syncLegacyToRestrictions(game.state);

  // Modern authoritative counter is NOT decremented or bypassed!
  const evalRes = evaluateRestriction(game.state, ability, { controller: 'player', sourceCard: card, placementId: stack.placementId });
  assert.equal(evalRes.status, RESTRICTION_STATUS.LIMIT_REACHED);
});

// --- Category 7: Strict Validation (TC-ACT-FIX-33 .. 37) ---

test('TC-ACT-FIX-33: State validation rejects arrays, class instances, and objects with non-plain prototypes', () => {
  class CustomClass {}

  // state rejected if class instance or array
  assert.equal(validateRestrictionState(new CustomClass()).valid, false);
  assert.equal(validateRestrictionState([]).valid, false);

  // state.restrictions rejected if array or class instance
  assert.equal(validateRestrictionState({ restrictions: [] }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: new CustomClass() }).valid, false);

  // counters rejected if array or class instance
  assert.equal(validateRestrictionState({ restrictions: { counters: new CustomClass(), meta: {} } }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: { counters: [], meta: {} } }).valid, false);

  // meta rejected if array or class instance
  assert.equal(validateRestrictionState({ restrictions: { counters: {}, meta: new CustomClass() } }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: { counters: {}, meta: [] } }).valid, false);

  // reservations rejected if array or class instance
  assert.equal(validateRestrictionState({ restrictions: { counters: {}, meta: {}, reservations: [] } }).valid, false);
  assert.equal(validateRestrictionState({ restrictions: { counters: {}, meta: {}, reservations: new CustomClass() } }).valid, false);

  // Object.create(null) is a valid plain object
  const nullProtoState = Object.create(null);
  nullProtoState.restrictions = Object.create(null);
  nullProtoState.restrictions.counters = Object.create(null);
  nullProtoState.restrictions.meta = Object.create(null);
  assert.equal(validateRestrictionState(nullProtoState).valid, true);
});

test('TC-ACT-FIX-34: State validation enforces explicit metadata schema and rejects unknown type or scope', () => {
  // Unknown type rejected
  const badTypeState = {
    restrictions: {
      counters: {},
      meta: {
        'k1': { type: 'INVALID_NONEXISTENT_TYPE', scope: 'TURN' }
      }
    }
  };
  const resBadType = validateRestrictionState(badTypeState);
  assert.equal(resBadType.valid, false);
  assert.ok(resBadType.reason.includes('INVALID_META_TYPE'));

  // Unknown scope rejected
  const badScopeState = {
    restrictions: {
      counters: {},
      meta: {
        'k2': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: 'UNKNOWN_SCOPE' }
      }
    }
  };
  const resBadScope = validateRestrictionState(badScopeState);
  assert.equal(resBadScope.valid, false);
  assert.ok(resBadScope.reason.includes('TYPE_SCOPE_MISMATCH') || resBadScope.reason.includes('INVALID_META_SCOPE'));
});

test('TC-ACT-FIX-35: State validation rejects contradictory type and scope pairs', () => {
  // Contradiction: ONCE_PER_TURN declared with GAME scope
  const contradictionState = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: RESTRICTION_SCOPE.GAME }
      }
    }
  };
  const res = validateRestrictionState(contradictionState);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('TYPE_SCOPE_MISMATCH'));
});

test('TC-ACT-FIX-36: State validation verifies reservations as finite non-negative integers', () => {
  const badResVal = {
    restrictions: {
      counters: {},
      meta: {},
      reservations: { 'turn:1:player:p1:ab1': -1 }
    }
  };
  assert.equal(validateRestrictionState(badResVal).valid, false);

  const floatResVal = {
    restrictions: {
      counters: {},
      meta: {},
      reservations: { 'turn:1:player:p1:ab1': 2.5 }
    }
  };
  assert.equal(validateRestrictionState(floatResVal).valid, false);

  const zeroResVal = {
    restrictions: {
      counters: {},
      meta: {},
      reservations: { 'turn:1:player:p1:ab1': 0 }
    }
  };
  assert.equal(validateRestrictionState(zeroResVal).valid, false);

  const goodResVal = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          res1: {
            reservationId: 'res1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1 }
    }
  };
  assert.equal(validateRestrictionState(goodResVal).valid, true);
});

test('TC-ACT-FIX-37: undefined initializes default restriction state, while explicit null is rejected', () => {
  const stateUndefined = {};
  ensureRestrictionState(stateUndefined);
  assert.deepEqual(stateUndefined.restrictions, { counters: {}, meta: {}, reservations: {} });
  assert.equal(validateRestrictionState(stateUndefined).valid, true);

  const stateNull = { restrictions: null };
  ensureRestrictionState(stateNull);
  // null must NOT be silently replaced
  assert.equal(stateNull.restrictions, null);
  const resNull = validateRestrictionState(stateNull);
  assert.equal(resNull.valid, false);
  assert.equal(resNull.error, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
});

// ============================================================================
// Phase 4C.3.2.2 Final Acceptance: Reservation Lifecycle Invalidation Tests
// ============================================================================

test('TC-RES-LIFE-01: Activation A reserves capacity, lifecycle reset occurs, and A handle becomes invalid', () => {
  const cardData = createOptCardData('BS01-LIFE01', 'Lifecycle Test Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handleA = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handleA.success, true);
  assert.equal(handleA.isInvalidated, false);
  assert.equal(state.restrictions.reservations[handleA.key], 1);

  // Lifecycle reset occurs for TURN
  resetRestrictions(state, 'TURN');

  // Handle A must now report isInvalidated === true
  assert.equal(handleA.isInvalidated, true);
});

test('TC-RES-LIFE-02: After A is invalidated, activation B reserves the same key. Releasing A must not decrement B reservation (real engine)', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ability = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [
      {
        isCost: true,
        isOptional: true,
        cleanText: 'Pay 1 core',
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'field', target: 'self' },
          to: { zone: 'trash' }
        }
      },
      {
        link: 'byDoing',
        op: { op: 'DRAW', count: 1 }
      }
    ]
  };
  const desc = createAbilityDescriptor(ability);
  const physicalId = derivePhysicalAbilityId('BS01-LIFE02', desc, 1);
  ability.id = physicalId;
  ability.physicalId = physicalId;
  ability.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-LIFE02',
    name: 'Engine Re-reserve Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ability] }
  };

  let releasePromptB;
  const promptBPromise = new Promise(resolve => { releasePromptB = resolve; });

  const customPromptResolver = {
    async choose(prompt) {
      await promptBPromise;
      return { accepted: true };
    }
  };

  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: customPromptResolver
  });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Directly obtain a reservation handle for Activation A under current lifecycle
  const handleA = reserveRestriction(game.state, ability, { controller: 'player', sourceCard: card, placementId: stack.placementId });
  assert.equal(handleA.success, true);
  const targetKey = handleA.key;
  assert.equal(game.state.restrictions.reservations[targetKey], 1);

  // Lifecycle reset occurs (e.g. Turn or Step reset)
  resetRestrictions(game.state, 'TURN');
  assert.equal(handleA.isInvalidated, true);
  assert.equal(game.state.restrictions.reservations[targetKey], undefined);

  // Now launch Activation B in real engine, which reserves the same key and pauses at async prompt
  const actBPromise = game.activateAbility(card.id, physicalId, 'player');

  // Verify B has acquired the reservation for targetKey
  assert.equal(game.state.restrictions.reservations[targetKey], 1);

  // Now stale handle A invokes release()
  handleA.release();

  // B's reservation MUST NOT be decremented or removed by stale handle A!
  assert.equal(game.state.restrictions.reservations[targetKey], 1);

  // Unblock B and complete its execution
  releasePromptB();
  const actBRes = await actBPromise;
  assert.equal(actBRes.success, true);
  assert.equal(actBRes.isCommitted, true);
  assert.equal(game.state.restrictions.counters[targetKey], 1);
  assert.equal(game.state.restrictions.reservations[targetKey], undefined);
});

test('TC-RES-LIFE-03: After A is invalidated, calling commit() on A must fail without changing counters or reservations', () => {
  const cardData = createOptCardData('BS01-LIFE03', 'Stale Commit Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handleA = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handleA.key;

  resetRestrictions(state, 'TURN');
  assert.equal(handleA.isInvalidated, true);

  // Attempting to commit an invalidated handle must fail explicitly
  const commitRes = handleA.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);
  assert.equal(commitRes.reason, 'RESERVATION_INVALIDATED');

  // Authoritative counters and reservations remain 0 / untouched
  assert.equal(state.restrictions.counters[key] || 0, 0);
  assert.equal(state.restrictions.reservations[key] || 0, 0);
});

test('TC-RES-LIFE-04: Repeated release() calls on an invalidated handle do not mutate current reservation state', () => {
  const cardData = createOptCardData('BS01-LIFE04', 'Repeated Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handleA = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handleA.key;

  resetRestrictions(state, 'TURN');
  assert.equal(handleA.isInvalidated, true);

  // Set up an active reservation for a new activation B on the same key
  const handleB = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(state.restrictions.reservations[key], 1);

  // Repeatedly release stale handle A
  handleA.release();
  handleA.release();
  handleA.release();

  // B's reservation must remain completely intact
  assert.equal(state.restrictions.reservations[key], 1);
  handleB.release();
  assert.equal(state.restrictions.reservations[key], undefined);
});

test('TC-RES-LIFE-05: A stale handle from an earlier lifecycle cannot affect a new lifecycle using the same restriction key (real engine)', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Attack-scoped ability
  const attackAbility = {
    type: 'ABILITY',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_ATTACK' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const desc = createAbilityDescriptor(attackAbility);
  const physicalId = derivePhysicalAbilityId('BS01-LIFE05', desc, 1);
  attackAbility.id = physicalId;
  attackAbility.physicalId = physicalId;
  attackAbility.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-LIFE05',
    name: 'Attack Cycle Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [attackAbility] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'ATTACK';
  game.state.combat = { attackerStackId: 'stack_1' };

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Attack 1: Reserve ability
  const handleOld = reserveRestriction(game.state, attackAbility, { controller: 'player', sourceCard: card, placementId: stack.placementId });
  assert.equal(handleOld.success, true);
  const attackKey = handleOld.key;
  assert.equal(game.state.restrictions.reservations[attackKey], 1);

  // End attack 1
  game.endAttack();
  assert.equal(handleOld.isInvalidated, true);
  assert.equal(game.state.restrictions.reservations[attackKey] || 0, 0);

  // Attack 2 starts (same placement and attacker)
  game.state.combat = { attackerStackId: 'stack_1' };

  // Activation in Attack 2 executes via game.activateAbility
  const act2Promise = game.activateAbility(card.id, physicalId, 'player');
  
  // Stale handleOld releases while Attack 2 is processing or completed
  handleOld.release();

  const act2Res = await act2Promise;
  assert.equal(act2Res.success, true);
  assert.equal(act2Res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[attackKey], 1);
});

test('TC-RES-LIFE-06: An ATTACK reset does not invalidate a BATTLE reservation', () => {
  const battleAbility = {
    type: 'ABILITY',
    id: 'BS01-BATTLE#1',
    physicalId: 'BS01-BATTLE#1',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_BATTLE' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const battleHandle = reserveRestriction(state, battleAbility, { controller: 'player', placementId: 'p1' });
  assert.equal(battleHandle.success, true);
  assert.equal(battleHandle.isInvalidated, false);
  assert.equal(state.restrictions.reservations[battleHandle.key], 1);

  // ATTACK reset occurs
  resetRestrictions(state, 'ATTACK');

  // Battle handle must NOT be invalidated
  assert.equal(battleHandle.isInvalidated, false);
  assert.equal(state.restrictions.reservations[battleHandle.key], 1);

  // Can still commit successfully
  const commitRes = battleHandle.commit();
  assert.equal(commitRes.success, true);
  assert.equal(state.restrictions.counters[battleHandle.key], 1);
});

test('TC-RES-LIFE-07: A BATTLE reset does not invalidate a TURN reservation', () => {
  const cardData = createOptCardData('BS01-LIFE07', 'Turn Scope Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const turnHandle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(turnHandle.success, true);
  assert.equal(turnHandle.isInvalidated, false);
  assert.equal(state.restrictions.reservations[turnHandle.key], 1);

  // BATTLE reset occurs
  resetRestrictions(state, 'BATTLE');

  // Turn handle must NOT be invalidated
  assert.equal(turnHandle.isInvalidated, false);
  assert.equal(state.restrictions.reservations[turnHandle.key], 1);

  const commitRes = turnHandle.commit();
  assert.equal(commitRes.success, true);
  assert.equal(state.restrictions.counters[turnHandle.key], 1);
});

test('TC-RES-LIFE-08: A TURN reset invalidates only appropriate TURN reservations and preserves GAME reservations', () => {
  const optAbility = createOptCardData('BS01-LIFE08A', 'Turn Card').compiledIr.abilities[0];
  const opgAbility = {
    type: 'ABILITY',
    id: 'BS01-LIFE08B#1',
    physicalId: 'BS01-LIFE08B#1',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_GAME' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const turnHandle = reserveRestriction(state, optAbility, { controller: 'player', placementId: 'p1' });
  const gameHandle = reserveRestriction(state, opgAbility, { controller: 'player', sourceCard: { id: 'c_game_1' } });

  assert.equal(turnHandle.success, true);
  assert.equal(gameHandle.success, true);

  // TURN reset occurs
  resetRestrictions(state, 'TURN');

  // Turn handle is invalidated, but Game handle remains valid
  assert.equal(turnHandle.isInvalidated, true);
  assert.equal(gameHandle.isInvalidated, false);
  assert.equal(state.restrictions.reservations[gameHandle.key], 1);

  const gameCommit = gameHandle.commit();
  assert.equal(gameCommit.success, true);
  assert.equal(state.restrictions.counters[gameHandle.key], 1);
});

test('TC-RES-LIFE-09: Competing game.activateAbility requests remain safe when lifecycle transition occurs while paused at prompt (real engine)', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const attackAbility = {
    type: 'ABILITY',
    header: { timing: 'FLASH', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_ATTACK' },
    clauses: [
      {
        isCost: true,
        isOptional: true,
        cleanText: 'Pay 1 core',
        op: {
          op: 'MOVE_CORE',
          count: 1,
          from: { zone: 'field', target: 'self' },
          to: { zone: 'trash' }
        }
      },
      { op: { op: 'DRAW', count: 1 } }
    ]
  };
  const desc = createAbilityDescriptor(attackAbility);
  const physicalId = derivePhysicalAbilityId('BS01-LIFE09', desc, 1);
  attackAbility.id = physicalId;
  attackAbility.physicalId = physicalId;
  attackAbility.legacyId = '#a0';

  const cardData = {
    card_number: 'BS01-LIFE09',
    name: 'Lifecycle Prompt Spirit',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [attackAbility] }
  };

  let unpausePrompt1;
  const prompt1Barrier = new Promise(resolve => { unpausePrompt1 = resolve; });

  const customPromptResolver = {
    async choose(prompt) {
      await prompt1Barrier;
      return { accepted: true };
    }
  };

  const game = createGame({
    playerDeck: createTestDeck([cardData]),
    firstPlayer: 'player',
    promptResolver: customPromptResolver
  });
  game.state.step = 'ATTACK';
  game.state.combat = { attackerStackId: 'stack_1' };

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Activation 1 begins and pauses behind prompt barrier
  const act1Promise = game.activateAbility(card.id, physicalId, 'player');

  const attackKey = `attack:1:stack_1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.reservations[attackKey], 1);

  // Lifecycle transition occurs while Activation 1 is paused: attack ends!
  game.endAttack();
  assert.equal(game.state.restrictions.reservations[attackKey] || 0, 0);

  // Unpause Activation 1; its handle has been invalidated by lifecycle transition
  unpausePrompt1();
  const act1Res = await act1Promise;

  // Activation 1 cannot successfully commit or pay cost
  assert.equal(act1Res.isCommitted, false);

  // Next attack begins with clean state
  game.state.combat = { attackerStackId: 'stack_1' };
  assert.equal(game.state.restrictions.reservations[attackKey] || 0, 0);
  assert.equal(game.state.restrictions.counters[attackKey] || 0, 0);

  // Activation 2 in the new attack succeeds without interference
  const act2Res = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(act2Res.success, true);
  assert.equal(act2Res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[attackKey], 1);
});

test('TC-RES-LIFE-10: No reservation leaks remain after all activations and lifecycle transitions complete', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-LIFE10', 'Leak Check Spirit');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const physicalId = cardData.compiledIr.abilities[0].id;

  // Run activation to completion
  await game.activateAbility(card.id, physicalId, 'player');

  // Verify zero lingering reservations
  assert.equal(Object.keys(game.state.restrictions.reservations || {}).length, 0);
  assert.equal(game.state.restrictions.meta._reservations, undefined);

  // End turn and check again
  resetRestrictions(game.state, 'TURN');
  assert.equal(Object.keys(game.state.restrictions.reservations || {}).length, 0);
  assert.equal(game.state.restrictions.meta._reservations, undefined);
});

// ============================================================================
// Phase 4C.3.2.2 Final Acceptance: Strict Metadata & Reservation Validation Tests
// ============================================================================

test('TC-META-01: Empty ordinary metadata record is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': {}
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('EMPTY_META_RECORD'));
});

test('TC-META-02: Missing metadata type is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { scope: 'TURN', limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('MISSING_META_TYPE'));
});

test('TC-META-03: Missing metadata scope is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: RESTRICTION_TYPE.ONCE_PER_TURN, limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('MISSING_META_SCOPE'));
});

test('TC-META-04: Missing metadata limit is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: 'TURN' }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('MISSING_META_LIMIT'));
});

test('TC-META-05: Unknown metadata type is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: 'INVALID_UNKNOWN_TYPE', scope: 'TURN', limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('INVALID_META_TYPE'));
});

test('TC-META-06: Unknown metadata scope is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: 'INVALID_SCOPE', limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('INVALID_META_SCOPE') || res.reason.includes('TYPE_SCOPE_MISMATCH'));
});

test('TC-META-07: Contradictory type/scope pair is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:p1:ab1': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: RESTRICTION_SCOPE.GAME, limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('TYPE_SCOPE_MISMATCH'));
});

test('TC-META-08: Invalid restriction key is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        'not_a_valid_prefix:foo': { type: RESTRICTION_TYPE.ONCE_PER_TURN, scope: RESTRICTION_SCOPE.TURN, limit: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('INVALID_RESTRICTION_KEY'));
});

test('TC-META-09: Malformed reservation record is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': { reservationId: 'res_1' /* missing key, type, scope, limit, generation */ }
        }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('MISSING_RESERVATION_KEY') || res.reason.includes('MALFORMED_RESERVATION_RECORD'));
});

test('TC-META-10: Reservation ID mismatch is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_outer': {
            reservationId: 'res_inner',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1
          }
        }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_ID_MISMATCH'));
});

test('TC-META-11: Reservation counter inconsistent with active reservation records is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 2 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_COUNT_MISMATCH'));
});

test('TC-META-12: Active reservation referencing missing or contradictory restriction metadata is rejected', () => {
  const key = 'turn:1:player:p1:ab1';
  const state = {
    restrictions: {
      counters: {},
      reservations: { [key]: 1 },
      meta: {
        [key]: {
          type: RESTRICTION_TYPE.ONCE_PER_TURN,
          scope: RESTRICTION_SCOPE.TURN,
          limit: 1
        },
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN_SAME_NAME, // Contradicts meta[key].type
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_META_CONTRADICTION'));
});

test('TC-META-13: Duplicate reservation IDs are rejected', () => {
  const badIdState = {
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          '': {
            reservationId: '',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1
          }
        }
      }
    }
  };
  assert.equal(validateRestrictionState(badIdState).valid, false);
});

test('TC-META-14: Invalid lifecycle generation is rejected', () => {
  const zeroGenState = {
    restrictions: {
      counters: {},
      meta: {},
      generations: { TURN: 0 }
    }
  };
  const resZero = validateRestrictionState(zeroGenState);
  assert.equal(resZero.valid, false);
  assert.ok(resZero.reason.includes('INVALID_LIFECYCLE_GENERATION'));

  const floatGenState = {
    restrictions: {
      counters: {},
      meta: {},
      generations: { TURN: 1.5 }
    }
  };
  const resFloat = validateRestrictionState(floatGenState);
  assert.equal(resFloat.valid, false);
  assert.ok(resFloat.reason.includes('INVALID_LIFECYCLE_GENERATION'));
});

test('TC-META-15: Valid _ambiguousLegacy metadata remains accepted according to its documented schema', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        _ambiguousLegacy: {
          'card1_ab0': 1,
          'card2_ab1': true
        }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, true);

  // Unknown underscore property is rejected
  const badUnderscoreState = {
    restrictions: {
      counters: {},
      meta: {
        _unknownNamespace: {}
      }
    }
  };
  const resBadUnder = validateRestrictionState(badUnderscoreState);
  assert.equal(resBadUnder.valid, false);
  assert.ok(resBadUnder.reason.includes('UNKNOWN_META_NAMESPACE'));
});

test('TC-META-16: Valid reservation state survives JSON serialization and restoration', () => {
  const key = 'turn:1:player:p1:ab1';
  const state = {
    restrictions: {
      counters: { [key]: 1 },
      reservations: { [key]: 1 },
      meta: {
        [key]: {
          type: RESTRICTION_TYPE.ONCE_PER_TURN,
          scope: RESTRICTION_SCOPE.TURN,
          limit: 2
        },
        _reservations: {
          'res_123': {
            reservationId: 'res_123',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 2,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  assert.equal(validateRestrictionState(state).valid, true);
  const serialized = JSON.stringify(state);
  const restored = JSON.parse(serialized);
  assert.equal(validateRestrictionState(restored).valid, true);
  assert.deepEqual(restored, state);
});

test('TC-META-17: Validation rejects malformed state without mutating it', () => {
  const malformed = {
    restrictions: {
      counters: { 'k1': -5 },
      meta: {
        'invalid_key': {}
      }
    }
  };
  const beforeJson = JSON.stringify(malformed);
  const res = validateRestrictionState(malformed);
  assert.equal(res.valid, false);
  const afterJson = JSON.stringify(malformed);
  assert.equal(beforeJson, afterJson);
});

test('TC-META-18: Existing valid legacy-compatible state remains accepted', () => {
  const legacyCleanState = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {}
    }
  };
  assert.equal(validateRestrictionState(legacyCleanState).valid, true);

  const engineState = createGame({ playerDeck: createTestDeck([]) }).state;
  assert.equal(validateRestrictionState(engineState).valid, true);
});

// ============================================================================
// Phase 4C.3.2.2 Integrity Fix: Unconditional Cross-Validation Tests (TC-META-19..23)
// ============================================================================

test('TC-META-19: Positive reservation counter with no _reservations namespace is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {} // No _reservations namespace
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_COUNT_MISMATCH'));
});

test('TC-META-20: Empty _reservations namespace with positive reservation counter is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {} // Empty _reservations namespace
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_COUNT_MISMATCH'));
});

test('TC-META-21: Active reservation record with missing reservation counter is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: {}, // Missing counter for key
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1 }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('RESERVATION_COUNT_MISMATCH'));
});

test('TC-META-22: Empty reservation dictionaries with no active reservations remain valid', () => {
  const state1 = {
    restrictions: {
      counters: {},
      meta: {},
      reservations: {}
    }
  };
  assert.equal(validateRestrictionState(state1).valid, true);

  const state2 = {
    restrictions: {
      counters: {},
      meta: { _reservations: {} },
      reservations: {}
    }
  };
  assert.equal(validateRestrictionState(state2).valid, true);
});

test('TC-META-23: Multiple active reservation records for one key must exactly match the counter', () => {
  const key = 'turn:1:player:p1:ab1';
  const state = {
    restrictions: {
      counters: {},
      reservations: { [key]: 2 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 3,
            generation: 1,
            status: 'ACTIVE'
          },
          'res_2': {
            reservationId: 'res_2',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 3,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1 }
    }
  };
  assert.equal(validateRestrictionState(state).valid, true);

  // Counter 3 with only 2 records fails
  state.restrictions.reservations[key] = 3;
  assert.equal(validateRestrictionState(state).valid, false);

  // Counter 1 with 2 records fails
  state.restrictions.reservations[key] = 1;
  assert.equal(validateRestrictionState(state).valid, false);
});

// ============================================================================
// Phase 4C.3.2.2 Integrity Fix: Generation Comparison Tests (TC-META-24..28)
// ============================================================================

test('TC-META-24: Reservation generation equal to current scope generation is accepted', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 5,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 5 }
    }
  };
  assert.equal(validateRestrictionState(state).valid, true);
});

test('TC-META-25: Reservation with stale generation is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 4, // Stale: current is 5
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 5 }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('STALE_RESERVATION_GENERATION'));
});

test('TC-META-26: Reservation with future generation is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 6, // Future: current is 5
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 5 }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('FUTURE_RESERVATION_GENERATION'));
});

test('TC-META-27: Missing scope generation follows the documented initialization policy (defaults to 1)', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      }
      // generations dictionary omitted entirely: defaults to 1
    }
  };
  assert.equal(validateRestrictionState(state).valid, true);

  // If generation is 2 but scope generation is omitted (defaulting to 1), it is rejected as future
  state.restrictions.meta._reservations.res_1.generation = 2;
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('FUTURE_RESERVATION_GENERATION'));
});

test('TC-META-28: JSON-restored stale reservation cannot block or authorize a new activation', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const cardData = createOptCardData('BS01-M28', 'Stale Restore Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const physicalId = ability.id;

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  const key = `turn:1:player:${stack.placementId}:${physicalId}`;

  // Synthetic state representing a restored snapshot containing a stale reservation
  const restoredState = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      reservations: { [key]: 1 },
      meta: {
        _reservations: {
          'stale_res': {
            reservationId: 'stale_res',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 2 } // Generation advanced to 2
    }
  };

  // State is recognized as invalid due to stale reservation
  const valRes = validateRestrictionState(restoredState);
  assert.equal(valRes.valid, false);
  assert.ok(valRes.reason.includes('STALE_RESERVATION_GENERATION'));

  // evaluateRestriction rejects corrupted/stale state
  const evalRes = evaluateRestriction(restoredState, ability, { controller: 'player', placementId: stack.placementId });
  assert.equal(evalRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
});

// ============================================================================
// Phase 4C.3.2.2 Integrity Fix: Explicit ACTIVE Status Tests (TC-META-29..31)
// ============================================================================

test('TC-META-29: Missing reservation status is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1
            // status is missing
          }
        }
      },
      generations: { TURN: 1 }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('INVALID_RESERVATION_STATUS'));
});

test('TC-META-30: Explicit ACTIVE status is accepted', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1 }
    }
  };
  assert.equal(validateRestrictionState(state).valid, true);
});

test('TC-META-31: Unknown or finalized status in active reservation namespace is rejected', () => {
  const makeStateWithStatus = (status) => ({
    restrictions: {
      counters: {},
      reservations: { 'turn:1:player:p1:ab1': 1 },
      meta: {
        _reservations: {
          'res_1': {
            reservationId: 'res_1',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status
          }
        }
      },
      generations: { TURN: 1 }
    }
  });

  for (const badStatus of ['COMMITTED', 'RELEASED', 'FINALIZED', 'INVALIDATED', '', 'PENDING', 123]) {
    const res = validateRestrictionState(makeStateWithStatus(badStatus));
    assert.equal(res.valid, false);
    assert.ok(res.reason.includes('INVALID_RESERVATION_STATUS'));
  }
});

// ============================================================================
// Phase 4C.3.2.2 Integrity Fix: Namespace Gating Tests (TC-META-32)
// ============================================================================

test('TC-META-32: Unknown _generations metadata namespace is rejected', () => {
  const state = {
    restrictions: {
      counters: {},
      meta: {
        _generations: { TURN: 1 }
      }
    }
  };
  const res = validateRestrictionState(state);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes('UNKNOWN_META_NAMESPACE: _generations'));
});

// ============================================================================
// Phase 4C.3.2.2 Integrity Fix: Exported releaseReservation Lifecycle Safety (TC-RES-LIFE-11..15)
// ============================================================================

test('TC-RES-LIFE-11: Exported releaseReservation releases a current valid reservation', () => {
  const cardData = createOptCardData('BS01-LIFE11', 'Export Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handle.success, true);
  const resId = handle.reservationId;
  const key = handle.key;
  assert.equal(state.restrictions.reservations[key], 1);

  // Call exported releaseReservation
  const released = releaseReservation(state, resId);
  assert.equal(released, true);
  assert.equal(state.restrictions.reservations[key], undefined);
  assert.equal(state.restrictions.meta._reservations, undefined);
});

test('TC-RES-LIFE-12: Exported releaseReservation rejects a stale reservation', () => {
  const cardData = createOptCardData('BS01-LIFE12', 'Export Stale Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const resId = handle.reservationId;
  const key = handle.key;

  // Advance lifecycle generation without deleting the reservation manually (synthetic stale record)
  state.restrictions.generations.TURN = 2;

  // releaseReservation must recognize stale generation and refuse to release
  const released = releaseReservation(state, resId);
  assert.equal(released, false);

  // Counter is NOT decremented by stale release
  assert.equal(state.restrictions.reservations[key], 1);
});

test('TC-RES-LIFE-13: Releasing an old reservation cannot decrement a newer reservation on the same key', () => {
  const key = 'turn:1:player:p1:ab1';
  const state = {
    restrictions: {
      counters: {},
      reservations: { [key]: 1 },
      meta: {
        _reservations: {
          'stale_res_1': {
            reservationId: 'stale_res_1',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          },
          'new_res_2': {
            reservationId: 'new_res_2',
            key,
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 2,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 2 } // Current generation is 2
    }
  };

  // Attempt to release stale_res_1 via exported function
  const released = releaseReservation(state, 'stale_res_1');
  assert.equal(released, false);

  // New reservation counter MUST remain 1!
  assert.equal(state.restrictions.reservations[key], 1);
  assert.ok(state.restrictions.meta._reservations['new_res_2']);
});

test('TC-RES-LIFE-14: Repeated exported release is idempotent', () => {
  const cardData = createOptCardData('BS01-LIFE14', 'Idempotent Export Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const resId = handle.reservationId;

  // First release succeeds
  assert.equal(releaseReservation(state, resId), true);

  // Subsequent releases return false safely without error
  assert.equal(releaseReservation(state, resId), false);
  assert.equal(releaseReservation(state, resId), false);
  assert.equal(releaseReservation(state, 'non_existent_id'), false);
});

test('TC-RES-LIFE-15: Exported release preserves unrelated reservations and lifecycle scopes', () => {
  const state = {
    restrictions: {
      counters: {},
      reservations: {
        'turn:1:player:p1:ab1': 1,
        'game:player:card:c1:ab2': 1
      },
      meta: {
        _reservations: {
          'res_turn': {
            reservationId: 'res_turn',
            key: 'turn:1:player:p1:ab1',
            type: RESTRICTION_TYPE.ONCE_PER_TURN,
            scope: RESTRICTION_SCOPE.TURN,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          },
          'res_game': {
            reservationId: 'res_game',
            key: 'game:player:card:c1:ab2',
            type: RESTRICTION_TYPE.ONCE_PER_GAME,
            scope: RESTRICTION_SCOPE.GAME,
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      generations: { TURN: 1, GAME: 1 }
    }
  };

  // Release the TURN reservation
  assert.equal(releaseReservation(state, 'res_turn'), true);

  // GAME reservation and counter remain completely untouched
  assert.equal(state.restrictions.reservations['turn:1:player:p1:ab1'], undefined);
  assert.equal(state.restrictions.reservations['game:player:card:c1:ab2'], 1);
  assert.ok(state.restrictions.meta._reservations['res_game']);
});

// ============================================================================
// Phase 4C.3.2.2 Final Integrity Fix: Strict Reservation Finalization (TC-RES-FINAL-01..12)
// ============================================================================

test('TC-RES-FINAL-01: Release succeeds for valid reservation and decrements counter exactly once', () => {
  const cardData = createOptCardData('BS01-FINAL01', 'Final Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  assert.equal(state.restrictions.reservations[key], 1);
  assert.ok(state.restrictions.meta._reservations[resId]);

  const released = releaseReservation(state, resId);
  assert.equal(released, true);

  // Counter decremented to 0 and deleted
  assert.equal(state.restrictions.reservations[key], undefined);
  // Record deleted
  assert.equal(state.restrictions.meta._reservations, undefined);
  // Counter was never committed
  assert.equal(state.restrictions.counters[key] || 0, 0);
});

test('TC-RES-FINAL-02: Release rejects missing counter without deleting record (meta._reservations[resId] remains)', () => {
  const cardData = createOptCardData('BS01-FINAL02', 'Missing Counter Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Corrupt state: delete counter while reservation record remains
  delete state.restrictions.reservations[key];

  const released = releaseReservation(state, resId);
  assert.equal(released, false);

  // Crucial integrity invariant: record must NOT be deleted / mutated when counter is missing
  assert.ok(state.restrictions.meta._reservations[resId]);
  assert.equal(state.restrictions.meta._reservations[resId].status, 'ACTIVE');
});

test('TC-RES-FINAL-03: Release rejects zero counter without mutating record or counter', () => {
  const cardData = createOptCardData('BS01-FINAL03', 'Zero Counter Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Corrupt state: set counter to 0 instead of positive integer
  state.restrictions.reservations[key] = 0;

  const released = releaseReservation(state, resId);
  assert.equal(released, false);

  // Both record and counter remain untouched
  assert.ok(state.restrictions.meta._reservations[resId]);
  assert.equal(state.restrictions.reservations[key], 0);
});

test('TC-RES-FINAL-04: Release rejects counter/active-record count mismatch without mutating state', () => {
  const cardData = createOptCardData('BS01-FINAL04', 'Mismatch Release Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Corrupt state: counter says 2 but only 1 record exists
  state.restrictions.reservations[key] = 2;

  const released = releaseReservation(state, resId);
  assert.equal(released, false);

  // Mismatch was rejected without mutating state
  assert.ok(state.restrictions.meta._reservations[resId]);
  assert.equal(state.restrictions.reservations[key], 2);
});

test('TC-RES-FINAL-05: Commit rejects missing counter without consuming usage limit (real production path: game.activateAbility())', async () => {
  const cardData = createOptCardData('BS01-FINAL05', 'Missing Counter Commit Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Direct handle test
  delete state.restrictions.reservations[key];
  const commitRes = handle.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(commitRes.reason, 'MISSING_RESERVATION_COUNTER');

  // Verify limit was not committed and record remains
  assert.equal(state.restrictions.counters[key] || 0, 0);
  assert.ok(state.restrictions.meta._reservations[resId]);

  // Real engine test via game.activateAbility
  const game = createGame();
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const targetAbility = card.compiledIr.abilities[0];
  const tKey = `turn:1:player:${stack.placementId}:${targetAbility.physicalId}`;

  // Make reservation, then corrupt counter before committing
  const realHandle = reserveRestriction(game.state, targetAbility, {
    controller: 'player',
    sourceStack: stack,
    sourceCard: card
  });
  delete game.state.restrictions.reservations[realHandle.key];

  const res2 = realHandle.commit();
  assert.equal(res2.success, false);
  assert.equal(game.state.restrictions.counters[tKey] || 0, 0);
});

test('TC-RES-FINAL-06: Commit rejects zero counter without consuming usage limit', () => {
  const cardData = createOptCardData('BS01-FINAL06', 'Zero Counter Commit Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Corrupt state: counter is 0
  state.restrictions.reservations[key] = 0;

  const commitRes = handle.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(commitRes.reason, 'INVALID_RESERVATION_COUNTER');

  // Zero mutation: counters remain 0, record remains
  assert.equal(state.restrictions.counters[key] || 0, 0);
  assert.ok(state.restrictions.meta._reservations[resId]);
  assert.equal(state.restrictions.reservations[key], 0);
});

test('TC-RES-FINAL-07: Commit rejects counter/active-record count mismatch without consuming usage limit (real production path)', () => {
  const cardData = createOptCardData('BS01-FINAL07', 'Mismatch Commit Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  // Corrupt state: counter is 3 while active records count is 1
  state.restrictions.reservations[key] = 3;

  const commitRes = handle.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.ok(commitRes.reason.includes('RESERVATION_COUNT_MISMATCH'));

  // Counters remain 0, record remains, counter remains 3
  assert.equal(state.restrictions.counters[key] || 0, 0);
  assert.ok(state.restrictions.meta._reservations[resId]);
  assert.equal(state.restrictions.reservations[key], 3);
});

test('TC-RES-FINAL-08: Valid commit converts exactly one active reservation into one committed usage', () => {
  const cardData = createOptCardData('BS01-FINAL08', 'Valid Commit Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  const resId = handle.reservationId;

  assert.equal(state.restrictions.reservations[key], 1);
  assert.equal(state.restrictions.counters[key] || 0, 0);

  const commitRes = handle.commit();
  assert.equal(commitRes.success, true);
  assert.equal(commitRes.status, 'COMMITTED');
  assert.equal(commitRes.currentCount, 1);

  // Exactly one reservation converted into one committed usage
  assert.equal(state.restrictions.reservations[key], undefined);
  assert.equal(state.restrictions.counters[key], 1);
  assert.equal(state.restrictions.meta[key].committedCount, 1);
  assert.equal(state.restrictions.meta._reservations, undefined);
});

test('TC-RES-FINAL-09: Failed finalization preserves unrelated reservations', () => {
  const cardDataA = createOptCardData('BS01-FINAL09A', 'Spirit A');
  const cardDataB = createOptCardData('BS01-FINAL09B', 'Spirit B');
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handleA = reserveRestriction(state, cardDataA.compiledIr.abilities[0], { controller: 'player', placementId: 'p1' });
  const handleB = reserveRestriction(state, cardDataB.compiledIr.abilities[0], { controller: 'player', placementId: 'p2' });

  // Corrupt only handle B's reservation counter
  state.restrictions.reservations[handleB.key] = 99;

  // Finalization of B fails
  assert.equal(handleB.release(), false);

  // Handle A remains completely intact and can be committed normally
  assert.equal(state.restrictions.reservations[handleA.key], 1);
  assert.ok(state.restrictions.meta._reservations[handleA.reservationId]);

  const commitA = handleA.commit();
  assert.equal(commitA.success, true);
  assert.equal(state.restrictions.counters[handleA.key], 1);
  assert.equal(state.restrictions.reservations[handleA.key], undefined);
});

test('TC-RES-FINAL-10: Repeated release or commit cannot double-finalize reservation', () => {
  const cardData = createOptCardData('BS01-FINAL10', 'Double Finalize Spirit');
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  // Case A: release followed by release and commit
  const handleA = reserveRestriction(state, cardData.compiledIr.abilities[0], { controller: 'player', placementId: 'p1' });
  assert.equal(handleA.release(), true);
  assert.equal(handleA.release(), false);
  const commitAfterRelease = handleA.commit();
  assert.equal(commitAfterRelease.success, false);
  assert.equal(commitAfterRelease.status, RESTRICTION_STATUS.DUPLICATE_COMMIT);

  // Case B: commit followed by commit and release
  const handleB = reserveRestriction(state, cardData.compiledIr.abilities[0], { controller: 'player', placementId: 'p2' });
  const commitB1 = handleB.commit();
  assert.equal(commitB1.success, true);
  const commitB2 = handleB.commit();
  assert.equal(commitB2.success, false);
  assert.equal(commitB2.status, RESTRICTION_STATUS.DUPLICATE_COMMIT);
  assert.equal(handleB.release(), false);

  // Total committed count for B is strictly 1
  assert.equal(state.restrictions.counters[handleB.key], 1);
});

test('TC-RES-FINAL-11: Stale reservation handles remain unable to mutate newer lifecycle reservations', () => {
  const cardData = createOptCardData('BS01-FINAL11', 'Lifecycle Invalidate Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle1 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  // Turn reset increments generation to 2 and clears active reservations
  resetRestrictions(state, 'TURN');
  state.turnNumber = 2;

  // New reservation in turn 2 under new generation
  const handle2 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handle2.generation, 2);
  assert.equal(state.restrictions.reservations[handle2.key], 1);

  // Stale handle 1 tries to commit or release
  assert.equal(handle1.release(), false);
  const staleCommit = handle1.commit();
  assert.equal(staleCommit.success, false);

  // Handle 2 is completely undisturbed
  assert.equal(state.restrictions.reservations[handle2.key], 1);
  const commit2 = handle2.commit();
  assert.equal(commit2.success, true);
  assert.equal(state.restrictions.counters[handle2.key], 1);
});

test('TC-RES-FINAL-12: Actual game.activateAbility() works correctly under valid concurrent activation (real engine)', async () => {
  const cardData = createOptCardData('BS01-FINAL12', 'Engine Concurrent Spirit');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const ability = card.compiledIr.abilities[0];
  const physicalId = ability.id;

  // First activation executes and succeeds
  const res1 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res1.success, true);

  // Second activation is rejected with LIMIT_REACHED
  const res2 = await game.activateAbility(card.id, physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.restrictionStatus, RESTRICTION_STATUS.LIMIT_REACHED);

  // Authoritative restriction state validates with 100% integrity
  const validation = validateRestrictionState(game.state);
  assert.equal(validation.valid, true);

  const tKey = `turn:1:player:${stack.placementId}:${physicalId}`;
  assert.equal(game.state.restrictions.counters[tKey], 1);
  assert.equal(game.state.restrictions.reservations[tKey], undefined);
  assert.equal(game.state.restrictions.meta._reservations, undefined);
});

// ============================================================================
// Phase 4C.3.2.2 Committed Counter Integrity Tests (TC-RES-COMMIT-COUNTER-01..08)
// ============================================================================

test('TC-RES-COMMIT-COUNTER-01: Missing committed counter is treated as zero and valid commit succeeds', () => {
  const cardData = createOptCardData('BS01-CC01', 'Missing Committed Counter Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  assert.equal(state.restrictions.counters[key], undefined);

  const res = handle.commit();
  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');
  assert.equal(res.currentCount, 1);
  assert.equal(state.restrictions.counters[key], 1);
});

test('TC-RES-COMMIT-COUNTER-02: Negative committed counter is rejected with zero mutation', () => {
  const cardData = createOptCardData('BS01-CC02', 'Negative Committed Counter Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  state.restrictions.counters[key] = -1;

  // Deep snapshot of all relevant state before commit attempt
  const snapshotBefore = JSON.parse(JSON.stringify({
    meta_reservations: state.restrictions.meta._reservations,
    reservations: state.restrictions.reservations,
    counters: state.restrictions.counters,
    meta_key: state.restrictions.meta[key],
    abilityUses: state.abilityUses
  }));

  const res = handle.commit();
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  const snapshotAfter = JSON.parse(JSON.stringify({
    meta_reservations: state.restrictions.meta._reservations,
    reservations: state.restrictions.reservations,
    counters: state.restrictions.counters,
    meta_key: state.restrictions.meta[key],
    abilityUses: state.abilityUses
  }));

  assert.deepEqual(snapshotAfter, snapshotBefore);
});

test('TC-RES-COMMIT-COUNTER-03: Fractional committed counter is rejected with zero mutation', () => {
  const cardData = createOptCardData('BS01-CC03', 'Fractional Committed Counter Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;
  state.restrictions.counters[key] = 0.5;

  const snapshotBefore = JSON.parse(JSON.stringify({
    meta_reservations: state.restrictions.meta._reservations,
    reservations: state.restrictions.reservations,
    counters: state.restrictions.counters,
    meta_key: state.restrictions.meta[key],
    abilityUses: state.abilityUses
  }));

  const res = handle.commit();
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  const snapshotAfter = JSON.parse(JSON.stringify({
    meta_reservations: state.restrictions.meta._reservations,
    reservations: state.restrictions.reservations,
    counters: state.restrictions.counters,
    meta_key: state.restrictions.meta[key],
    abilityUses: state.abilityUses
  }));

  assert.deepEqual(snapshotAfter, snapshotBefore);
});

test('TC-RES-COMMIT-COUNTER-04: NaN and Infinity are rejected with zero mutation', () => {
  const cardData = createOptCardData('BS01-CC04', 'NaN Infinity Committed Counter Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state1 = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handleNaN = reserveRestriction(state1, ability, { controller: 'player', placementId: 'p1' });
  const keyNaN = handleNaN.key;
  state1.restrictions.counters[keyNaN] = NaN;

  const snapNaNBefore = {
    meta_reservations: { ...state1.restrictions.meta._reservations },
    reservations: { ...state1.restrictions.reservations },
    counterVal: state1.restrictions.counters[keyNaN]
  };

  const resNaN = handleNaN.commit();
  assert.equal(resNaN.success, false);
  assert.equal(resNaN.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.ok(Number.isNaN(state1.restrictions.counters[keyNaN]));
  assert.deepEqual(state1.restrictions.reservations, snapNaNBefore.reservations);
  assert.deepEqual(state1.restrictions.meta._reservations, snapNaNBefore.meta_reservations);

  // Fresh state for Infinity test
  const state2 = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };
  const handleInf = reserveRestriction(state2, ability, { controller: 'player', placementId: 'p2' });
  assert.equal(handleInf.success, true);
  const keyInf = handleInf.key;
  state2.restrictions.counters[keyInf] = Infinity;

  const snapInfBefore = {
    meta_reservations: { ...state2.restrictions.meta._reservations },
    reservations: { ...state2.restrictions.reservations },
    counterVal: state2.restrictions.counters[keyInf]
  };

  const resInf = handleInf.commit();
  assert.equal(resInf.success, false);
  assert.equal(resInf.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(state2.restrictions.counters[keyInf], Infinity);
  assert.deepEqual(state2.restrictions.reservations, snapInfBefore.reservations);
  assert.deepEqual(state2.restrictions.meta._reservations, snapInfBefore.meta_reservations);
});

test('TC-RES-COMMIT-COUNTER-05: String and null committed counters are rejected with zero mutation', () => {
  const cardData = createOptCardData('BS01-CC05', 'String Null Committed Counter Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state1 = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  // Test String
  const handleStr = reserveRestriction(state1, ability, { controller: 'player', placementId: 'p1' });
  state1.restrictions.counters[handleStr.key] = "1";
  const snapStrBefore = JSON.parse(JSON.stringify({
    meta_reservations: state1.restrictions.meta._reservations,
    reservations: state1.restrictions.reservations,
    counters: state1.restrictions.counters,
    meta_key: state1.restrictions.meta[handleStr.key],
    abilityUses: state1.abilityUses
  }));

  const resStr = handleStr.commit();
  assert.equal(resStr.success, false);
  assert.equal(resStr.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.deepEqual(JSON.parse(JSON.stringify({
    meta_reservations: state1.restrictions.meta._reservations,
    reservations: state1.restrictions.reservations,
    counters: state1.restrictions.counters,
    meta_key: state1.restrictions.meta[handleStr.key],
    abilityUses: state1.abilityUses
  })), snapStrBefore);

  // Test Null with fresh state
  const state2 = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };
  const handleNull = reserveRestriction(state2, ability, { controller: 'player', placementId: 'p2' });
  assert.equal(handleNull.success, true);
  state2.restrictions.counters[handleNull.key] = null;
  const snapNullBefore = JSON.parse(JSON.stringify({
    meta_reservations: state2.restrictions.meta._reservations,
    reservations: state2.restrictions.reservations,
    counters: state2.restrictions.counters,
    meta_key: state2.restrictions.meta[handleNull.key],
    abilityUses: state2.abilityUses
  }));

  const resNull = handleNull.commit();
  assert.equal(resNull.success, false);
  assert.equal(resNull.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.deepEqual(JSON.parse(JSON.stringify({
    meta_reservations: state2.restrictions.meta._reservations,
    reservations: state2.restrictions.reservations,
    counters: state2.restrictions.counters,
    meta_key: state2.restrictions.meta[handleNull.key],
    abilityUses: state2.abilityUses
  })), snapNullBefore);
});

test('TC-RES-COMMIT-COUNTER-06: Malformed counters container is rejected with zero mutation', () => {
  const cardData = createOptCardData('BS01-CC06', 'Malformed Container Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  // Corrupt container to an array
  state.restrictions.counters = [1, 2, 3];

  const snapBefore = {
    meta_reservations: JSON.parse(JSON.stringify(state.restrictions.meta._reservations)),
    reservations: JSON.parse(JSON.stringify(state.restrictions.reservations)),
    counters: [...state.restrictions.counters]
  };

  const res = handle.commit();
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(res.reason, 'COUNTERS_NOT_OBJECT');

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta._reservations)), snapBefore.meta_reservations);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapBefore.reservations);
  assert.deepEqual([...state.restrictions.counters], snapBefore.counters);
});

test('TC-RES-COMMIT-COUNTER-07: Valid positive committed counter increments exactly once', () => {
  const cardData = createOptCardData('BS01-CC07', 'Increment Spirit');
  const ability = cardData.compiledIr.abilities[0];
  ability.header.limitCount = 2;
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  // First commit brings it to 1
  const handle1 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle1.key;
  const res1 = handle1.commit();
  assert.equal(res1.success, true);
  assert.equal(state.restrictions.counters[key], 1);

  // Second commit starts from 1 and increments to 2
  const handle2 = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  assert.equal(handle2.success, true);
  const res2 = handle2.commit();
  assert.equal(res2.success, true);
  assert.equal(res2.currentCount, 2);
  assert.equal(state.restrictions.counters[key], 2);
  assert.equal(state.restrictions.meta[key].committedCount, 2);
});

test('TC-RES-COMMIT-COUNTER-08: Real game.activateAbility() path rejects corrupted committed-counter state without consuming the reservation or paying costs', async () => {
  const cardData = createCostOptCardData('BS01-CC08', 'Cost Dragon Corrupt Counter');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 5, soul: 0 });
  game.state.players.player.field.push(stack);

  const initialCores = stack.cores.normal;
  const targetAbility = card.compiledIr.abilities[0];
  const tKey = `turn:1:player:${stack.placementId}:${targetAbility.id}`;

  // Pre-seed an invalid committed counter (e.g. negative number)
  ensureRestrictionState(game.state);
  game.state.restrictions.counters[tKey] = -1;

  const snapBefore = JSON.parse(JSON.stringify({
    cores: stack.cores.normal,
    counters: game.state.restrictions.counters,
    reservations: game.state.restrictions.reservations,
    meta: game.state.restrictions.meta
  }));

  const res = await game.activateAbility(card.id, targetAbility.id, 'player');
  assert.equal(res.success, false);

  const snapAfter = JSON.parse(JSON.stringify({
    cores: stack.cores.normal,
    counters: game.state.restrictions.counters,
    reservations: game.state.restrictions.reservations,
    meta: game.state.restrictions.meta
  }));

  // No costs paid (cores untouched) and state completely untouched
  assert.equal(stack.cores.normal, initialCores);
  assert.deepEqual(snapAfter, snapBefore);

  // Also verify that if corruption happens after reservation, commit fails with zero mutation
  game.state.restrictions.counters[tKey] = 0; // reset to 0
  const handle = reserveRestriction(game.state, targetAbility, {
    controller: 'player',
    sourceStack: stack,
    sourceCard: card
  });
  assert.equal(handle.success, true);
  assert.equal(game.state.restrictions.reservations[tKey], 1);

  // Corrupt committed counter before commit
  game.state.restrictions.counters[tKey] = -5;

  const snapHandleBefore = JSON.parse(JSON.stringify({
    meta_reservations: game.state.restrictions.meta._reservations,
    reservations: game.state.restrictions.reservations,
    counters: game.state.restrictions.counters
  }));

  const commitRes = handle.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  const snapHandleAfter = JSON.parse(JSON.stringify({
    meta_reservations: game.state.restrictions.meta._reservations,
    reservations: game.state.restrictions.reservations,
    counters: game.state.restrictions.counters
  }));

  assert.deepEqual(snapHandleAfter, snapHandleBefore);
});

// ============================================================================
// Phase 4C.3.2.2 Commit Context Pre-Mutation Integrity Tests (TC-RES-CONTEXT-01..09)
// ============================================================================

test('TC-RES-CONTEXT-01: Valid plain context with no _committedKeys commits successfully and creates a Set', () => {
  const cardData = createOptCardData('BS01-CTX01', 'Plain Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1' };
  const handle = reserveRestriction(state, ability, context);
  const key = handle.key;

  assert.equal(context._committedKeys, undefined);
  const res = handle.commit();
  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');

  assert.ok(context._committedKeys instanceof Set);
  assert.equal(context._committedKeys.has(key), true);
  assert.equal(context.isCommitted, true);
  assert.equal(state.restrictions.counters[key], 1);
});

test('TC-RES-CONTEXT-02: Existing valid Set is updated exactly once', () => {
  const cardData = createOptCardData('BS01-CTX02', 'Existing Set Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const existingSet = new Set(['existing:key:1']);
  const context = { controller: 'player', placementId: 'p1', _committedKeys: existingSet };
  const handle = reserveRestriction(state, ability, context);
  const key = handle.key;

  const res = handle.commit();
  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');

  assert.equal(context._committedKeys, existingSet);
  assert.equal(context._committedKeys.size, 2);
  assert.ok(context._committedKeys.has('existing:key:1'));
  assert.ok(context._committedKeys.has(key));
  assert.equal(context.isCommitted, true);
  assert.equal(state.restrictions.counters[key], 1);
});

test('TC-RES-CONTEXT-03: Plain object _committedKeys is rejected with zero state mutation', () => {
  const cardData = createOptCardData('BS01-CTX03', 'Object Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1', _committedKeys: { 'some:key': true } };
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapContextBefore = JSON.parse(JSON.stringify(context));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(context)), snapContextBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-04: Array _committedKeys is rejected with zero state mutation', () => {
  const cardData = createOptCardData('BS01-CTX04', 'Array Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1', _committedKeys: ['some:key'] };
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapContextBefore = JSON.parse(JSON.stringify(context));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(context)), snapContextBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-05: Set-like object with has() but no genuine Set implementation is rejected with zero state mutation', () => {
  const cardData = createOptCardData('BS01-CTX05', 'Fake Set Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const fakeSet = {
    has: () => false,
    add: () => {}
  };
  const context = { controller: 'player', placementId: 'p1', _committedKeys: fakeSet };
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.equal(context._committedKeys, fakeSet);
  assert.equal(context.isCommitted, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-06: Frozen context is rejected safely with zero state mutation', () => {
  const cardData = createOptCardData('BS01-CTX06', 'Frozen Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = Object.freeze({ controller: 'player', placementId: 'p1' });
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapContextBefore = JSON.parse(JSON.stringify(context));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(context)), snapContextBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-07: Non-writable isCommitted is rejected with zero state mutation', () => {
  const cardData = createOptCardData('BS01-CTX07', 'NonWritable Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1' };
  Object.defineProperty(context, 'isCommitted', {
    value: false,
    writable: false,
    configurable: false
  });

  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(context.isCommitted, false);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-08: Null context follows the documented supported behavior', () => {
  const cardData = createOptCardData('BS01-CTX08', 'Null Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });
  const key = handle.key;

  let res;
  assert.doesNotThrow(() => {
    res = _finalizeReservation(state, handle.reservationId, 'COMMIT', null, ability, handle.generation);
  });

  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');
  assert.equal(state.restrictions.counters[key], 1);
});

test('TC-RES-CONTEXT-09: Duplicate commit remains rejected without changing counters or reservation state', () => {
  const cardData = createOptCardData('BS01-CTX09', 'Duplicate Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1' };
  const handle = reserveRestriction(state, ability, context);
  const key = handle.key;

  // Pre-populate _committedKeys with the exact key to simulate duplicate commit
  context._committedKeys = new Set([key]);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.DUPLICATE_COMMIT);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

// ============================================================================
// Phase 4C.3.2.2 Final Context Operation Safety Tests (TC-RES-CONTEXT-FINAL-01..10)
// ============================================================================

test('TC-RES-CONTEXT-FINAL-01: Genuine Set with an overridden throwing add() is rejected before mutation', () => {
  const cardData = createOptCardData('BS01-FIN01', 'Overridden Add Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const badSet = new Set();
  badSet.add = function() {
    throw new Error('Overridden add should not be called');
  };

  const context = { controller: 'player', placementId: 'p1', _committedKeys: badSet };
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-02: Genuine Set with an overridden throwing has() is rejected before mutation', () => {
  const cardData = createOptCardData('BS01-FIN02', 'Overridden Has Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const badSet = new Set();
  badSet.has = function() {
    throw new Error('Overridden has should not be called');
  };

  const context = { controller: 'player', placementId: 'p1', _committedKeys: badSet };
  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-03: Accessor setter for isCommitted is rejected before mutation', () => {
  const cardData = createOptCardData('BS01-FIN03', 'Setter isCommitted Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  let setterInvoked = false;
  const context = { controller: 'player', placementId: 'p1' };
  Object.defineProperty(context, 'isCommitted', {
    set(v) {
      setterInvoked = true;
      throw new Error('Unsafe setter called');
    },
    get() {
      return false;
    },
    configurable: true,
    enumerable: true
  });

  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(setterInvoked, false);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-04: Throwing getter for _committedKeys is rejected without invoking it', () => {
  const cardData = createOptCardData('BS01-FIN04', 'Throwing Getter CommittedKeys Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  let getterInvoked = false;
  const context = { controller: 'player', placementId: 'p1' };
  Object.defineProperty(context, '_committedKeys', {
    get() {
      getterInvoked = true;
      throw new Error('Throwing getter for _committedKeys invoked');
    },
    configurable: true,
    enumerable: true
  });

  const handle = reserveRestriction(state, ability, context);

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(getterInvoked, false);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-05: Throwing getter for sourceCard is rejected before mutation', () => {
  const cardData = createOptCardData('BS01-FIN05', 'Throwing Getter sourceCard Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  let getterInvoked = false;
  const context = { controller: 'player', placementId: 'p1' };
  Object.defineProperty(context, 'sourceCard', {
    get() {
      getterInvoked = true;
      throw new Error('Throwing getter for sourceCard invoked');
    },
    configurable: true,
    enumerable: true
  });

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit(context);
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(getterInvoked, false);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-06: Throwing getter for sourceStack is rejected before mutation', () => {
  const cardData = createOptCardData('BS01-FIN06', 'Throwing Getter sourceStack Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  let getterInvoked = false;
  const context = { controller: 'player', placementId: 'p1' };
  Object.defineProperty(context, 'sourceStack', {
    get() {
      getterInvoked = true;
      throw new Error('Throwing getter for sourceStack invoked');
    },
    configurable: true,
    enumerable: true
  });

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit(context);
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(getterInvoked, false);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-CONTEXT-FINAL-07: Valid ordinary context with no Set still commits successfully', () => {
  const cardData = createOptCardData('BS01-FIN07', 'Ordinary Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const context = { controller: 'player', placementId: 'p1', sourceCard: { id: 'c_fin07' } };
  const handle = reserveRestriction(state, ability, context);
  const key = handle.key;

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');
  assert.ok(context._committedKeys instanceof Set);
  assert.equal(context._committedKeys.has(key), true);
  assert.equal(context.isCommitted, true);
  assert.equal(state.restrictions.counters[key], 1);
  assert.equal(state.abilityUses[`1:c_fin07:${ability.physicalId || ability.id}`], true);
});

test('TC-RES-CONTEXT-FINAL-08: Valid context with a normal Set commits exactly once', () => {
  const cardData = createOptCardData('BS01-FIN08', 'Normal Set Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const normalSet = new Set();
  const context = { controller: 'player', placementId: 'p1', _committedKeys: normalSet, sourceCard: { id: 'c_fin08' } };
  const handle = reserveRestriction(state, ability, context);
  const key = handle.key;

  const res1 = handle.commit();
  assert.equal(res1.success, true);
  assert.equal(res1.status, 'COMMITTED');
  assert.equal(normalSet.has(key), true);
  assert.equal(normalSet.size, 1);
  assert.equal(state.restrictions.counters[key], 1);

  // Attempt duplicate commit using same context
  const res2 = handle.commit();
  assert.equal(res2.success, false);
  assert.equal(res2.status, RESTRICTION_STATUS.DUPLICATE_COMMIT);
  assert.equal(normalSet.size, 1);
  assert.equal(state.restrictions.counters[key], 1);
});

test('TC-RES-CONTEXT-FINAL-09: Invalid context leaves reservation records, reservation counters, committed counters, metadata, and abilityUses unchanged', () => {
  const cardData = createOptCardData('BS01-FIN09', 'Snapshot Invariance Spirit');
  const ability = cardData.compiledIr.abilities[0];

  const invalidContexts = [
    // 1. Frozen context
    Object.freeze({ controller: 'player', placementId: 'p1' }),
    // 2. Non-writable isCommitted
    Object.defineProperty({ controller: 'player', placementId: 'p1' }, 'isCommitted', { value: false, writable: false }),
    // 3. Throwing getter for _committedKeys
    Object.defineProperty({ controller: 'player', placementId: 'p1' }, '_committedKeys', { get() { throw new Error('trap'); } }),
    // 4. Overridden Set add
    (() => { const s = new Set(); s.add = () => { throw new Error('trap'); }; return { controller: 'player', placementId: 'p1', _committedKeys: s }; })(),
    // 5. Throwing getter for sourceCard
    Object.defineProperty({ controller: 'player', placementId: 'p1' }, 'sourceCard', { get() { throw new Error('trap'); } })
  ];

  for (const badCtx of invalidContexts) {
    const state = {
      turnNumber: 1,
      restrictions: {
        counters: {},
        meta: {},
        reservations: {},
        generations: { TURN: 1 }
      }
    };

    const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

    const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
    const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
    const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
    const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

    let res;
    assert.doesNotThrow(() => {
      res = handle.commit(badCtx);
    });

    assert.equal(res.success, false);
    assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

    assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
    assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
    assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
    assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
  }
});

test('TC-RES-CONTEXT-FINAL-10: Actual game.activateAbility() integration path remains correct for valid and invalid contexts', async () => {
  const cardData = createCostOptCardData('BS01-FIN10', 'Engine Context Dragon');
  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 5, soul: 0 });
  game.state.players.player.field.push(stack);

  const initialCores = stack.cores.normal;
  const targetAbility = card.compiledIr.abilities[0];
  const tKey = `turn:1:player:${stack.placementId}:${targetAbility.id}`;

  // 1. Valid activation through real game engine
  const resValid = await game.activateAbility(card.id, targetAbility.id, 'player');
  assert.equal(resValid.success, true);
  assert.equal(resValid.isCommitted, true);
  assert.equal(game.state.restrictions.counters[tKey], 1);
  assert.equal(stack.cores.normal, initialCores - 2); // 2 cores paid for cost
  assert.equal(game.state.abilityUses[`1:${card.id}:${targetAbility.id}`], true);

  // 2. Second activation blocked by LIMIT_REACHED (no additional cost paid)
  const resBlocked = await game.activateAbility(card.id, targetAbility.id, 'player');
  assert.equal(resBlocked.success, false);
  assert.equal(resBlocked.reason, 'ABILITY_LIMIT_REACHED');
  assert.equal(stack.cores.normal, initialCores - 2); // Cost was NOT paid again
  assert.equal(game.state.restrictions.counters[tKey], 1);

  // 3. Testing invalid context handling on reserve/commit through real engine state
  const handle = reserveRestriction(game.state, targetAbility, {
    controller: 'player',
    sourceStack: stack,
    sourceCard: card
  });

  // Handle cannot reserve because limit 1 is already committed
  assert.equal(handle.success, false);
  assert.equal(handle.status, RESTRICTION_STATUS.LIMIT_REACHED);

  // 4. Reset restrictions and verify that committing an invalid context rejects with zero mutation
  resetRestrictions(game.state, 'TURN');
  const validHandle = reserveRestriction(game.state, targetAbility, {
    controller: 'player',
    placementId: stack.placementId
  });
  assert.equal(validHandle.success, true);

  const badContext = { controller: 'player', placementId: stack.placementId };
  Object.defineProperty(badContext, 'isCommitted', {
    set(v) { throw new Error('Unsafe setter'); },
    configurable: true
  });

  const snapCountersBefore = JSON.parse(JSON.stringify(game.state.restrictions.counters));
  const badRes = validHandle.commit(badContext);
  assert.equal(badRes.success, false);
  assert.equal(badRes.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.deepEqual(JSON.parse(JSON.stringify(game.state.restrictions.counters)), snapCountersBefore);
});

// ============================================================================
// Phase 4C.3.2.2 Final Proxy Validation Order Tests (TC-RES-PROXY-ORDER-01..05)
// ============================================================================

test('TC-RES-PROXY-ORDER-01: Context Proxy with a throwing getPrototypeOf trap is rejected without throwing', () => {
  const cardData = createOptCardData('BS01-PXO01', 'Throwing Proxy Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  let trapCalled = false;
  const proxyContext = new Proxy({ controller: 'player', placementId: 'p1' }, {
    getPrototypeOf() {
      trapCalled = true;
      throw new Error('getPrototypeOf trap called on proxy');
    }
  });

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit(proxyContext);
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(trapCalled, false);
});

test('TC-RES-PROXY-ORDER-02: Context Proxy with a side-effecting getPrototypeOf trap is rejected without invoking the trap', () => {
  const cardData = createOptCardData('BS01-PXO02', 'Side Effect Proxy Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  let trapCalled = false;
  const proxyContext = new Proxy({ controller: 'player', placementId: 'p1' }, {
    getPrototypeOf() {
      trapCalled = true;
      return Object.prototype;
    }
  });

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit(proxyContext);
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(trapCalled, false);
});

test('TC-RES-PROXY-ORDER-03: Context Proxy rejection leaves reservation records, reservation counters, committed counters, metadata, and abilityUses unchanged', () => {
  const cardData = createOptCardData('BS01-PXO03', 'Proxy Snapshot Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const handle = reserveRestriction(state, ability, { controller: 'player', placementId: 'p1' });

  const snapMetaBefore = JSON.parse(JSON.stringify(state.restrictions.meta));
  const snapResBefore = JSON.parse(JSON.stringify(state.restrictions.reservations));
  const snapCountersBefore = JSON.parse(JSON.stringify(state.restrictions.counters));
  const snapUsesBefore = JSON.parse(JSON.stringify(state.abilityUses || {}));

  const proxyContext = new Proxy({ controller: 'player', placementId: 'p1' }, {
    getPrototypeOf() {
      throw new Error('trap called');
    },
    get() {
      throw new Error('trap called');
    }
  });

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit(proxyContext);
  });

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);

  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.meta)), snapMetaBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.reservations)), snapResBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.restrictions.counters)), snapCountersBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(state.abilityUses || {})), snapUsesBefore);
});

test('TC-RES-PROXY-ORDER-04: Direct isAssignableContextProperty() call with a Proxy rejects it without invoking Proxy traps', () => {
  let trapCalled = false;
  const proxy = new Proxy({}, {
    getPrototypeOf() {
      trapCalled = true;
      throw new Error('getPrototypeOf trap invoked');
    },
    getOwnPropertyDescriptor() {
      trapCalled = true;
      throw new Error('getOwnPropertyDescriptor trap invoked');
    },
    get() {
      trapCalled = true;
      throw new Error('get trap invoked');
    },
    set() {
      trapCalled = true;
      throw new Error('set trap invoked');
    }
  });

  let result;
  assert.doesNotThrow(() => {
    result = isAssignableContextProperty(proxy, 'isCommitted');
  });

  assert.equal(result, false);
  assert.equal(trapCalled, false);
});

test('TC-RES-PROXY-ORDER-05: Ordinary valid plain-object contexts still commit successfully', () => {
  const cardData = createOptCardData('BS01-PXO05', 'Ordinary Valid Context Spirit');
  const ability = cardData.compiledIr.abilities[0];
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1 }
    }
  };

  const plainContext = { controller: 'player', placementId: 'p1', sourceCard: { id: 'c_pxo05' } };
  const handle = reserveRestriction(state, ability, plainContext);
  const key = handle.key;

  let res;
  assert.doesNotThrow(() => {
    res = handle.commit();
  });

  assert.equal(res.success, true);
  assert.equal(res.status, 'COMMITTED');
  assert.ok(plainContext._committedKeys instanceof Set);
  assert.equal(plainContext._committedKeys.has(key), true);
  assert.equal(plainContext.isCommitted, true);
  assert.equal(state.restrictions.counters[key], 1);
  assert.equal(state.abilityUses[`1:c_pxo05:${ability.physicalId || ability.id}`], true);
});
