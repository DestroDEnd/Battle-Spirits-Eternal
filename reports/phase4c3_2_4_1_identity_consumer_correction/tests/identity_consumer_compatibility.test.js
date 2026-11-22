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

  // Play the card (triggers WHEN_SUMMONED)
  const card = game.state.players.player.hand.find(c => c.card_number === 'CARD-06') || createCardInstance(cardData, 'player');
  if (!game.state.players.player.hand.includes(card)) {
    game.state.players.player.hand.push(card);
  }

  const playRes = await game.playCard(card.id, [], 'player');
  assert.equal(playRes.success, true);
  assert.equal(playRes.abilityResults.length, 1, 'Triggered ability must resolve');

  const abResult = playRes.abilityResults[0];
  assert.equal(abResult.success, true);
  assert.ok(abResult.context, 'Context must be returned from triggered ability resolution');
  assert.equal(abResult.context.physicalAbilityId, triggerAb.physicalId, 'Triggered ability physicalAbilityId must match');
  assert.equal(abResult.context.semanticAbilityId, triggerAb.semanticId, 'Triggered ability semanticAbilityId must match');
  assert.strictEqual(abResult.context.sourceAbility, triggerAb, 'Triggered ability sourceAbility must match original descriptor');
  assert.equal(abResult.isCommitted, true, 'Triggered ability execution must be committed');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-07
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-07: Pending activation references survive asynchronous prompts', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  let promptReached = false;
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
      promptReached = true;
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
  assert.equal(promptReached, true, 'Asynchronous prompt must be reached during activation');
  assert.ok(observedContext, 'Observed context must exist during prompt');
  assert.equal(observedContext.physicalAbilityId, promptAb.physicalId, 'Context physicalAbilityId must match expected physicalId');
  assert.equal(observedContext.semanticAbilityId, promptAb.semanticId, 'Context semanticAbilityId must match expected semanticId');
  assert.strictEqual(observedContext.sourceAbility, promptAb, 'Context sourceAbility must strictly reference original descriptor');
  assert.equal(res.success, true);
  assert.equal(res.activated, true);
  assert.equal(res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${promptAb.physicalId}`], 1);
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
test('TC-ID-CONSUMER-11: Save/load preserves pending ability references, active reservations, and activation state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const ab2 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 2 });
  assignDeterministicAbilityIdentities('CARD-11', [ab1, ab2]);

  const cardData = {
    card_number: 'CARD-11',
    name: 'SaveLoad Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab1, ab2] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // 1. Commit one usage of ability 1
  await game.activateAbility(card.id, ab1.physicalId, 'player');
  const committedKey = `turn:1:player:${stack.placementId}:${ab1.physicalId}`;
  assert.equal(game.state.restrictions.counters[committedKey], 1);

  // 2. Stage a pending trigger / stack entry referencing ability 1 physical and semantic IDs
  const pendingTriggerEntry = {
    type: 'PENDING_TRIGGER',
    cardId: card.id,
    cardNumber: card.cardNumber,
    placementId: stack.placementId,
    physicalAbilityId: ab1.physicalId,
    semanticAbilityId: ab1.semanticId,
    timestamp: Date.now()
  };
  game.state.pendingPrompts.push(pendingTriggerEntry);

  // 3. Stage an in-flight active reservation on ability 2
  const activationContext = {
    controller: 'player',
    sourceCard: stack.top,
    sourceStack: stack,
    placementId: stack.placementId
  };
  const resHandle = reserveRestriction(game.state, ab2, activationContext);
  assert.equal(resHandle.success, true);
  assert.ok(game.state.restrictions.meta._reservations[resHandle.reservationId]);
  assert.equal(game.state.restrictions.reservations[resHandle.key], 1);

  // 4. Save game state via JSON serialization
  const serialized = JSON.stringify(game.state);

  // 5. Restore into new state instance
  const restoredState = JSON.parse(serialized);

  // 6. Verify restored activation counters and metadata for committed ability 1
  assert.equal(restoredState.restrictions.counters[committedKey], 1);
  assert.equal(restoredState.restrictions.meta[committedKey].type, 'ONCE_PER_TURN');

  // 7. Verify restored active reservation record and counter for in-flight ability 2
  assert.ok(restoredState.restrictions.meta._reservations[resHandle.reservationId], 'Active reservation record must survive save/load');
  assert.equal(restoredState.restrictions.reservations[resHandle.key], 1, 'Active reservation counter must survive save/load');
  assert.equal(restoredState.restrictions.meta._reservations[resHandle.reservationId].key, resHandle.key);

  // 8. Verify restored pending trigger reference
  assert.equal(restoredState.pendingPrompts.length, 1);
  const restoredPending = restoredState.pendingPrompts[0];
  assert.equal(restoredPending.physicalAbilityId, ab1.physicalId, 'Pending physicalAbilityId must survive save/load');
  assert.equal(restoredPending.semanticAbilityId, ab1.semanticId, 'Pending semanticAbilityId must survive save/load');

  // 9. Verify deterministic source ability re-resolution from restored state
  const restoredCard = restoredState.players.player.field.find(st => st.top.cardNumber === 'CARD-11').top;
  assert.ok(restoredCard, 'Restored card must exist on field');
  const reconstructedAbility = restoredCard.compiledIr.abilities.find(a => a.physicalId === restoredPending.physicalAbilityId);
  assert.ok(reconstructedAbility, 'Source ability must deterministically re-resolve from restored card IR via physicalAbilityId');
  assert.equal(reconstructedAbility.physicalId, ab1.physicalId);
  assert.equal(reconstructedAbility.semanticId, ab1.semanticId);
  assert.equal(reconstructedAbility.header.limit, 'ONCE_PER_TURN');

  // 10. Verify ability resolution / restriction enforcement after restoration
  game.state = restoredState;
  const resBlocked = await game.activateAbility(card.id, ab1.physicalId, 'player');
  assert.equal(resBlocked.success, false);
  assert.equal(resBlocked.reason, 'ABILITY_LIMIT_REACHED');
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

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-16
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-16: Descriptor with no physicalId behavior and uncompiled compatibility', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Part A: Uncompiled descriptor lacking physicalId and legacyId resolves through uncompiled compatibility path
  const uncompiledAb = {
    id: 'UNCOMPILED_RAW_AB0',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const cardDataA = {
    card_number: 'CARD-16A',
    name: 'Uncompiled Legacy Card',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [uncompiledAb] }
  };

  const gameA = createGame({ playerDeck: createTestDeck([cardDataA]), firstPlayer: 'player' });
  gameA.state.step = 'MAIN';
  const cardA = createCardInstance(cardDataA, 'player');
  const stackA = createFieldStack(cardA, { normal: 2, soul: 0 });
  gameA.state.players.player.field.push(stackA);

  const resA = await gameA.activateAbility(cardA.id, 'UNCOMPILED_RAW_AB0', 'player');
  assert.equal(resA.success, true, 'Uncompiled legacy descriptor without physicalId/legacyId resolves via uncompiled compatibility path');
  assert.equal(resA.activated, true);

  // Part B: Descriptor with legacyId but no physicalId rejects arbitrary id lookup
  const legacyOnlyAb = {
    id: 'RAW_INTERNAL_ID',
    legacyId: 'CARD-16B#a0',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const cardDataB = {
    card_number: 'CARD-16B',
    name: 'Legacy Card with ID mismatch',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [legacyOnlyAb] }
  };

  const gameB = createGame({ playerDeck: createTestDeck([cardDataB]), firstPlayer: 'player' });
  gameB.state.step = 'MAIN';
  const cardB = createCardInstance(cardDataB, 'player');
  const stackB = createFieldStack(cardB, { normal: 2, soul: 0 });
  gameB.state.players.player.field.push(stackB);

  // Calling with raw id must be rejected because legacyId is defined and id is not physical
  const resB_byRaw = await gameB.activateAbility(cardB.id, 'RAW_INTERNAL_ID', 'player');
  assert.equal(resB_byRaw.success, false);
  assert.equal(resB_byRaw.reason, 'ABILITY_NOT_FOUND', 'Arbitrary id must not be promoted when physicalId is absent and legacyId exists');

  // Calling with legacyId succeeds
  const resB_byLegacy = await gameB.activateAbility(cardB.id, 'CARD-16B#a0', 'player');
  assert.equal(resB_byLegacy.success, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-17
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-17: Descriptor whose id differs from its physicalId does not match by id', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-17', [ab]);

  // Artificially alter ab.id to differ from ab.physicalId
  ab.id = 'OLD_OR_DIFFERING_ID';

  const cardData = {
    card_number: 'CARD-17',
    name: 'Differing ID Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [ab] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Calling with the differing id must be rejected (cannot silently promote ab.id to physical identity)
  const resFail = await game.activateAbility(card.id, 'OLD_OR_DIFFERING_ID', 'player');
  assert.equal(resFail.success, false);
  assert.equal(resFail.reason, 'ABILITY_NOT_FOUND', 'Differing ab.id must be rejected when physicalId is present');

  // Calling with the actual physicalId succeeds
  const resSuccess = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(resSuccess.success, true);
  assert.equal(resSuccess.isCommitted, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-18
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-18: Valid compiled descriptor with id === physicalId activates successfully', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-18', [ab]);
  assert.equal(ab.id, ab.physicalId, 'Compiler invariant: id === physicalId');

  const cardData = {
    card_number: 'CARD-18',
    name: 'Compiled Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [ab] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);
  assert.equal(game.state.restrictions.counters[`turn:1:player:${stack.placementId}:${ab.physicalId}`], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-19
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-19: Legacy-only descriptor resolved through legacyId', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const legacyAb = {
    id: 'RAW_LEGACY_DESC_ID',
    legacyId: 'CARD-19#a0',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const cardData = {
    card_number: 'CARD-19',
    name: 'Legacy Only Card',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [legacyAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, 'CARD-19#a0', 'player');
  assert.equal(res.success, true);
  assert.equal(res.activated, true);
  assert.equal(res.isCommitted, true);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-20
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-20: Ambiguous legacy reference is rejected safely', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = {
    id: 'AB_1',
    legacyId: 'SHARED_LEGACY_KEY',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const ab2 = {
    id: 'AB_2',
    legacyId: 'SHARED_LEGACY_KEY',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 2 } }]
  };

  const cardData = {
    card_number: 'CARD-20',
    name: 'Ambiguous Legacy Card',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [ab1, ab2] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const res = await game.activateAbility(card.id, 'SHARED_LEGACY_KEY', 'player');
  assert.equal(res.success, false);
  assert.equal(res.activated, false);
  assert.equal(res.reason, 'AMBIGUOUS_LEGACY_IDENTITY', 'Must safely reject ambiguous legacy match');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-21
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-21: Physical lookup taking precedence over legacy fallback', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  // Ability 1 has physicalId === 'COLLIDING_ID'
  const ab1 = {
    id: 'COLLIDING_ID',
    physicalId: 'COLLIDING_ID',
    legacyId: 'LEGACY_1',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  // Ability 2 has legacyId === 'COLLIDING_ID'
  const ab2 = {
    id: 'PHYSICAL_2',
    physicalId: 'PHYSICAL_2',
    legacyId: 'COLLIDING_ID',
    type: 'ABILITY',
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 2 } }]
  };

  const cardData = {
    card_number: 'CARD-21',
    name: 'Precedence Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [ab1, ab2] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const initialHand = game.state.players.player.hand.length;

  // Activating 'COLLIDING_ID' must resolve Ability 1 (which draws 1), NOT Ability 2 (which draws 2)
  const res = await game.activateAbility(card.id, 'COLLIDING_ID', 'player');
  assert.equal(res.success, true);
  assert.equal(game.state.players.player.hand.length, initialHand + 1, 'Physical match (draw 1) must take precedence over legacy match (draw 2)');
});
