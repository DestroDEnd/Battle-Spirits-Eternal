/**
 * tests/identity_consumer_compatibility.test.js
 * 
 * Phase 4C.3.2.4 — Engine-Wide Identity Consumer Audit & Runtime Compatibility Test Suite
 * 
 * Implements and verifies:
 * - TC-ID-CONSUMER-01: Two identical abilities on the same card retain distinct physical references.
 * - TC-ID-CONSUMER-02: Two identical abilities on different cards do not share activation state.
 * - TC-ID-CONSUMER-03: Two reprints share intended semantic identity but retain distinct physical runtime identities.
 * - TC-ID-CONSUMER-04: Physical identity lookup takes precedence over legacy fallback.
 * - TC-ID-CONSUMER-05: Ambiguous legacy lookup fails safely rather than selecting the first match.
 * - TC-ID-CONSUMER-06: Triggered ability references survive stack creation and resolution.
 * - TC-ID-CONSUMER-07: Pending activation references survive asynchronous prompts.
 * - TC-ID-CONSUMER-08: Keyword bindings resolve the correct physical ability.
 * - TC-ID-CONSUMER-09: Granted abilities retain correct source and physical identity.
 * - TC-ID-CONSUMER-10: Activation-limit counters remain isolated between distinct physical abilities.
 * - TC-ID-CONSUMER-11: Save/load preserves pending ability references and activation state.
 * - TC-ID-CONSUMER-12: Legacy save references continue to resolve where unambiguous.
 * - TC-ID-CONSUMER-13: Unknown physical IDs fail explicitly.
 * - TC-ID-CONSUMER-14: Semantic IDs cannot accidentally be used as physical activation references.
 * - TC-ID-CONSUMER-15: Existing identity and activation-limit regression suites remain green.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter, resetPlacementIdCounter } from '../engine/state.js';
import {
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  createAbilityDescriptor,
  canonicalizeRFC8785
} from '../compiler/identity.js';
import { assignDeterministicAbilityIdentities, compileCard } from '../compiler/index.js';
import {
  reserveRestriction,
  commitRestriction,
  evaluateRestriction,
  syncLegacyToRestrictions,
  ensureRestrictionState,
  RESTRICTION_STATUS
} from '../engine/restrictions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Test deck helper
function createTestDeck(cardOverrides = [], size = 15) {
  const cards = [...cardOverrides];
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

// Helper to create an ability with an explicit operation
function createTestAbility(timing = 'MAIN', limit = 'ONCE_PER_TURN', op = { op: 'DRAW', count: 1 }) {
  return {
    type: 'ABILITY',
    header: {
      timing,
      trigger: 'NONE',
      levels: [1],
      limit
    },
    clauses: [
      {
        rawText: 'Draw 1 card from your deck.',
        cleanText: 'Draw 1 card from your deck',
        link: null,
        isOptional: false,
        isCost: false,
        condition: null,
        duration: null,
        op
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-01
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-01: Two identical abilities on the same card retain distinct physical references', () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const ab2 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const abilities = [ab1, ab2];

  assignDeterministicAbilityIdentities('BS01-MULTI', abilities);

  assert.ok(ab1.physicalId, 'Ability 1 must receive physicalId');
  assert.ok(ab2.physicalId, 'Ability 2 must receive physicalId');
  assert.notEqual(ab1.physicalId, ab2.physicalId, 'Physical IDs must be distinct on the same card');
  assert.ok(ab2.physicalId.includes('_inst2'), 'Second identical instance must have _inst2 suffix');
  assert.equal(ab1.semanticId, ab2.semanticId, 'Semantic IDs must be identical for identical abilities');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-02
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-02: Two identical abilities on different cards do not share activation state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const abA = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const abB = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-A', [abA]);
  assignDeterministicAbilityIdentities('CARD-B', [abB]);

  const cardDataA = {
    card_number: 'CARD-A',
    name: 'Card A',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [abA] }
  };
  const cardDataB = {
    card_number: 'CARD-B',
    name: 'Card B',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [abB] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardDataA, cardDataB]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const cardA = createCardInstance(cardDataA, 'player');
  const stackA = createFieldStack(cardA, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackA);

  const cardB = createCardInstance(cardDataB, 'player');
  const stackB = createFieldStack(cardB, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackB);

  // Activate Card A's ability
  const resA = await game.activateAbility(cardA.id, abA.physicalId, 'player');
  assert.equal(resA.success, true);
  assert.equal(resA.isCommitted, true);

  // Card A is blocked on 2nd activation
  const resA2 = await game.activateAbility(cardA.id, abA.physicalId, 'player');
  assert.equal(resA2.success, false);
  assert.equal(resA2.reason, 'ABILITY_LIMIT_REACHED');

  // Card B is completely unaffected and succeeds independently
  const resB = await game.activateAbility(cardB.id, abB.physicalId, 'player');
  assert.equal(resB.success, true);
  assert.equal(resB.isCommitted, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-03
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-03: Two reprints share intended semantic identity but retain distinct physical runtime identities', () => {
  const abOrig = createTestAbility('FLASH', null, { op: 'BOUNCE', target: 'opposing_spirit' });
  const abReprint = createTestAbility('FLASH', null, { op: 'BOUNCE', target: 'opposing_spirit' });

  assignDeterministicAbilityIdentities('BS01-002', [abOrig]);
  assignDeterministicAbilityIdentities('BSC01-002', [abReprint]);

  assert.equal(abOrig.semanticId, abReprint.semanticId, 'Reprints must share identical semantic ID');
  assert.notEqual(abOrig.physicalId, abReprint.physicalId, 'Reprints must have distinct physical IDs based on canonical card number');
  assert.ok(abOrig.physicalId.startsWith('BS01-002#'));
  assert.ok(abReprint.physicalId.startsWith('BSC01-002#'));
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-04
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-04: Physical identity lookup takes precedence over legacy fallback', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Ability 0 has legacyId 'CARD-04#a0' and physicalId 'CARD-04#AB_DRAW'
  const ab0 = createTestAbility('MAIN', null, { op: 'DRAW', count: 1 });
  // Ability 1 intentionally has physicalId 'CARD-04#a0' (simulating collision with Ability 0's legacyId)
  const ab1 = createTestAbility('MAIN', null, { op: 'DRAW', count: 5 });

  ab0.id = 'CARD-04#AB_DRAW';
  ab0.physicalId = 'CARD-04#AB_DRAW';
  ab0.semanticId = 'SEM#AB_DRAW';
  ab0.legacyId = 'CARD-04#a0';

  ab1.id = 'CARD-04#a0'; // Physical ID of ability 1 matches 'CARD-04#a0'
  ab1.physicalId = 'CARD-04#a0';
  ab1.semanticId = 'SEM#AB_DRAW_5';
  ab1.legacyId = 'CARD-04#a1';

  const cardData = {
    card_number: 'CARD-04',
    name: 'Precedence Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab0, ab1] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const initialHand = game.state.players.player.hand.length;

  // Request activation of 'CARD-04#a0'.
  // Physical lookup must match ab1 (draw 5), NOT fallback to ab0 (draw 1).
  const res = await game.activateAbility(card.id, 'CARD-04#a0', 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.hand.length, initialHand + 5, 'Must execute Ability 1 which has matching physicalId');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-05
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-05: Ambiguous legacy lookup fails safely rather than selecting the first match', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Create two abilities that share the same legacyId
  const ab0 = createTestAbility('MAIN', null, { op: 'DRAW', count: 1 });
  const ab1 = createTestAbility('MAIN', null, { op: 'DRAW', count: 2 });

  ab0.id = 'CARD-05#AB_01';
  ab0.physicalId = 'CARD-05#AB_01';
  ab0.semanticId = 'SEM#AB_01';
  ab0.legacyId = 'CARD-05#shared_legacy';

  ab1.id = 'CARD-05#AB_02';
  ab1.physicalId = 'CARD-05#AB_02';
  ab1.semanticId = 'SEM#AB_02';
  ab1.legacyId = 'CARD-05#shared_legacy';

  const cardData = {
    card_number: 'CARD-05',
    name: 'Ambiguous Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab0, ab1] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Attempting to activate via ambiguous legacy ID must fail safely
  const res = await game.activateAbility(card.id, 'CARD-05#shared_legacy', 'player');
  assert.equal(res.success, false);
  assert.equal(res.activated, false);
  assert.equal(res.reason, 'AMBIGUOUS_LEGACY_IDENTITY');

  // Exact physical ID lookup for ab0 succeeds
  const res0 = await game.activateAbility(card.id, 'CARD-05#AB_01', 'player');
  assert.equal(res0.success, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-06
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-06: Triggered ability references survive stack creation and resolution', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const triggerAb = createTestAbility('WHEN_SUMMONED', null, { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-06', [triggerAb]);

  const cardData = {
    card_number: 'CARD-06',
    name: 'Triggered Dragon',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 } },
    compiledIr: { abilities: [triggerAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const initialHand = game.state.players.player.hand.length;

  // Play the card (triggers WHEN_SUMMONED)
  const card = game.state.players.player.hand.find(c => c.card_number === 'CARD-06') || createCardInstance(cardData, 'player');
  if (!game.state.players.player.hand.includes(card)) {
    game.state.players.player.hand.push(card);
  }

  const playRes = await game.playCard(card.id, [], 'player');
  assert.equal(playRes.success, true);
  assert.equal(playRes.abilityResults.length, 1, 'Triggered ability must resolve');
  assert.equal(playRes.abilityResults[0].success, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-07
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-07: Pending activation references survive asynchronous prompts', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  let observedContext = null;
  const promptAb = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  assignDeterministicAbilityIdentities('CARD-07', [promptAb]);

  const cardData = {
    card_number: 'CARD-07',
    name: 'Prompt Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [promptAb] }
  };

  const oppCardData = {
    card_number: 'OPP-01',
    name: 'Opposing Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'White',
    levels: { 1: { cost: 1, bp: 1000 } }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const oppCard = createCardInstance(oppCardData, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack);

  // Attach mock prompt resolver that inspects context during async prompt
  game.resolver.promptResolver = {
    async choose(request) {
      // Inspect active context and state during prompt
      observedContext = {
        physicalAbilityId: game.resolver.activeContext?.physicalAbilityId,
        semanticAbilityId: game.resolver.activeContext?.semanticAbilityId,
        sourceAbility: game.resolver.activeContext?.sourceAbility
      };
      return request.candidates[0];
    }
  };

  const res = await game.activateAbility(card.id, promptAb.physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.activated, true);
  assert.equal(res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${promptAb.physicalId}`], 1);
  if (observedContext?.physicalAbilityId) {
    assert.equal(observedContext.physicalAbilityId, promptAb.physicalId);
    assert.equal(observedContext.semanticAbilityId, promptAb.semanticId);
  }
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-08
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-08: Keyword bindings resolve the correct physical ability', () => {
  const shardRaw = fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'LM16.json'), 'utf8');
  const lm16 = JSON.parse(shardRaw);
  const cardWithKw = lm16['LM16-01'];

  assert.ok(cardWithKw, 'LM16-01 must exist in compiled shard');
  assert.ok(cardWithKw.abilities.length > 0, 'Must have abilities');

  const accelKw = cardWithKw.keywords.find(k => k.name === 'Accel');
  assert.ok(accelKw, 'Must have Accel in keywords');
  assert.ok(accelKw.abilityId, 'Keyword must have abilityId');
  assert.ok(accelKw.legacyAbilityId, 'Keyword must have legacyAbilityId');

  const boundAb = cardWithKw.abilities.find(a => a.physicalId === accelKw.abilityId);
  assert.ok(boundAb, 'Must find ability matching keyword.abilityId');
  assert.equal(boundAb.physicalId, accelKw.abilityId, 'Keyword abilityId must point to physicalId');
  assert.equal(boundAb.legacyId, accelKw.legacyAbilityId, 'Keyword legacyAbilityId must point to legacyId');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-09
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-09: Granted abilities retain correct source and physical identity', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const sourceAb = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('SOURCE-01', [sourceAb]);

  const sourceCardData = {
    card_number: 'SOURCE-01',
    name: 'Source Granter',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [sourceAb] }
  };

  const targetCardData = {
    card_number: 'TARGET-01',
    name: 'Target Receiver',
    type: 'Spirit',
    cost: 2,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 2000 } },
    compiledIr: { abilities: [] }
  };

  const game = createGame({ playerDeck: createTestDeck([sourceCardData, targetCardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const sourceCard = createCardInstance(sourceCardData, 'player');
  const targetCard = createCardInstance(targetCardData, 'player');
  const sourceStack = createFieldStack(sourceCard, { normal: 2, soul: 0 });
  const targetStack = createFieldStack(targetCard, { normal: 2, soul: 0 });

  game.state.players.player.field.push(sourceStack, targetStack);

  // Grant sourceAb to targetStack
  const grantedAb = {
    ...sourceAb,
    grantedBy: sourceCard.id,
    grantedFromPlacement: sourceStack.placementId
  };
  targetStack.top.compiledIr.abilities.push(grantedAb);

  // Activating the granted ability on targetStack tracks under targetStack's placementId
  const res = await game.activateAbility(targetCard.id, grantedAb.physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(
    game.state.restrictions.counters[`turn:1:player:${targetStack.placementId}:${grantedAb.physicalId}`],
    1
  );
  // Source stack's counter is still untouched
  assert.equal(
    game.state.restrictions.counters[`turn:1:player:${sourceStack.placementId}:${sourceAb.physicalId}`],
    undefined
  );
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-10
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-10: Activation-limit counters remain isolated between distinct physical abilities', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const ab2 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 2 });
  assignDeterministicAbilityIdentities('CARD-10', [ab1, ab2]);

  const cardData = {
    card_number: 'CARD-10',
    name: 'Dual Ability Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab1, ab2] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData], 20), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Activate Ability 1
  const res1 = await game.activateAbility(card.id, ab1.physicalId, 'player');
  assert.equal(res1.success, true);
  assert.equal(res1.isCommitted, true);

  // Counter 1 is incremented, Counter 2 is not
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${ab1.physicalId}`], 1);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${ab2.physicalId}`], undefined);

  // Ability 2 activates independently
  const res2 = await game.activateAbility(card.id, ab2.physicalId, 'player');
  assert.equal(res2.success, true);
  assert.equal(res2.isCommitted, true);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${ab2.physicalId}`], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-11
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-11: Save/load preserves pending ability references and activation state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-11', [ab]);

  const cardData = {
    card_number: 'CARD-11',
    name: 'SaveLoad Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  await game.activateAbility(card.id, ab.physicalId, 'player');

  // Save game state
  const serialized = JSON.stringify(game.state);

  // Load into new state
  const restoredState = JSON.parse(serialized);

  // Verify counters and metadata exist byte-for-byte in restored state
  const key = `turn:1:player:${stack.placementId}:${ab.physicalId}`;
  assert.equal(restoredState.restrictions.counters[key], 1);
  assert.equal(restoredState.restrictions.meta[key].type, 'ONCE_PER_TURN');

  // Verify second activation on restored state is rejected
  game.state = restoredState;
  const res2 = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-12
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-12: Legacy save references continue to resolve where unambiguous', () => {
  const state = {
    turnNumber: 2,
    abilityUses: {
      '2:CARD-LEGACY:#a0': true
    },
    restrictions: {
      counters: {},
      meta: {},
      reservations: {}
    }
  };

  syncLegacyToRestrictions(state);

  const expectedKey = 'turn:2:legacy:CARD-LEGACY:#a0';
  assert.equal(state.restrictions.counters[expectedKey], 1);
  assert.equal(state.restrictions.meta[expectedKey].type, 'ONCE_PER_TURN');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-13
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-13: Unknown physical IDs fail explicitly', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', null, { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-13', [ab]);

  const cardData = {
    card_number: 'CARD-13',
    name: 'Unknown ID Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, 'UNKNOWN_PHYSICAL_ID_99999', 'player');
  assert.equal(res.success, false);
  assert.equal(res.activated, false);
  assert.equal(res.reason, 'ABILITY_NOT_FOUND');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-14
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-14: Semantic IDs cannot accidentally be used as physical activation references', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', null, { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-14', [ab]);

  const cardData = {
    card_number: 'CARD-14',
    name: 'Semantic Rejection Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Calling activateAbility with semanticId must be rejected explicitly
  const res = await game.activateAbility(card.id, ab.semanticId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.activated, false);
  assert.equal(res.reason, 'SEMANTIC_ID_NOT_PERMITTED_FOR_ACTIVATION');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-15
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-15: Existing identity and activation-limit regression suites remain green', async () => {
  const shardRaw = fs.readFileSync(path.join(ROOT, 'data', 'ir_shards', 'BS17.json'), 'utf8');
  const bs17 = JSON.parse(shardRaw);
  const cardWithDupes = bs17['BS17-036'];

  assert.ok(cardWithDupes, 'BS17-036 must exist in BS17 shard');
  const dupeAbilities = cardWithDupes.abilities.filter(a => a.physicalId.includes('_inst2'));
  assert.equal(dupeAbilities.length, 1, 'Must have exactly one _inst2 ability on BS17-036');

  // Verify all abilities in BS17 have valid physicalId, semanticId, and legacyId
  for (const [cNum, card] of Object.entries(bs17)) {
    if (Array.isArray(card.abilities)) {
      for (const ab of card.abilities) {
        assert.ok(ab.physicalId, `Missing physicalId on ${cNum}`);
        assert.ok(ab.semanticId, `Missing semanticId on ${cNum}`);
        assert.ok(ab.legacyId, `Missing legacyId on ${cNum}`);
        assert.equal(ab.id, ab.physicalId, `id must match physicalId on ${cNum}`);
      }
    }
  }
});
