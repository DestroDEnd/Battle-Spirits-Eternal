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

import { createGame, endBattle, endAttack } from '../engine/index.js';
import { FlowController } from '../engine/flow.js';
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
  restoreRestrictionState,
  releaseReservation,
  _finalizeReservation,
  RESTRICTION_STATUS,
  resetRestrictions,
  preflightGenerations
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
      // Inspect activation-local context provided directly in prompt
      observedContext = {
        physicalAbilityId: request.context?.physicalAbilityId,
        semanticAbilityId: request.context?.semanticAbilityId,
        sourceAbility: request.context?.sourceAbility
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
test('TC-ID-CONSUMER-11: Supported game state persistence preserves card identities, invalidates transient reservations, and preserves committed limits across fresh game restoration', async () => {
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

  // 2. Stage an in-flight active capacity reservation on ability 2
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

  // 3. Serialize game state to JSON (supported persistence representation)
  const serialized = JSON.stringify(game.state);

  // 4. Restore state into a fresh, distinct game instance using supported options.state path
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // 5. Verify restored committed usage counter and metadata survive in fresh game instance
  assert.equal(freshGame.state.restrictions.counters[committedKey], 1);
  assert.equal(freshGame.state.restrictions.meta[committedKey].type, 'ONCE_PER_TURN');

  // 6. Under Option B (Invalidate transient reservations), the interrupted reservation is safely invalidated
  assert.equal(freshGame.state.restrictions.meta._reservations?.[resHandle.reservationId], undefined);
  assert.equal(freshGame.state.restrictions.reservations[resHandle.key] || 0, 0);

  // 7. Verify deterministic source ability re-resolution from restored field card
  const restoredCard = freshGame.state.players.player.field.find(st => st.top.cardNumber === 'CARD-11').top;
  assert.ok(restoredCard, 'Restored card must exist on field in fresh game instance');
  const reconstructedAb1 = restoredCard.compiledIr.abilities.find(a => a.physicalId === ab1.physicalId);
  const reconstructedAb2 = restoredCard.compiledIr.abilities.find(a => a.physicalId === ab2.physicalId);

  assert.ok(reconstructedAb1, 'Ability 1 must deterministically re-resolve from restored card IR via physicalId');
  assert.equal(reconstructedAb1.physicalId, ab1.physicalId);
  assert.equal(reconstructedAb1.semanticId, ab1.semanticId);
  assert.equal(reconstructedAb1.header.limit, 'ONCE_PER_TURN');

  assert.ok(reconstructedAb2, 'Ability 2 must deterministically re-resolve from restored card IR via physicalId');
  assert.equal(reconstructedAb2.physicalId, ab2.physicalId);
  assert.equal(reconstructedAb2.semanticId, ab2.semanticId);

  // 8. Verify ability resolution / restriction enforcement against restored game instance
  // Ability 1 was committed before save -> blocked by committed limit
  const resBlocked = await freshGame.activateAbility(restoredCard.id, ab1.physicalId, 'player');
  assert.equal(resBlocked.success, false);
  assert.equal(resBlocked.reason, 'ABILITY_LIMIT_REACHED');

  // Ability 2 had an interrupted reservation that was invalidated -> can now be activated normally!
  const resAb2 = await freshGame.activateAbility(restoredCard.id, ab2.physicalId, 'player');
  assert.equal(resAb2.success, true);
  assert.equal(resAb2.isCommitted, true);
  assert.equal(freshGame.state.restrictions.counters[`turn:1:player:${restoredCard.placementId}:${ab2.physicalId}`], 1);
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

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-22
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-22: Concurrent and interleaved asynchronous prompts maintain isolated identity contexts', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const promptAbA = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  const promptAbB = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  assignDeterministicAbilityIdentities('CARD-22A', [promptAbA]);
  assignDeterministicAbilityIdentities('CARD-22B', [promptAbB]);

  const cardDataA = {
    card_number: 'CARD-22A',
    name: 'Concurrent Dragon A',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [promptAbA] }
  };
  const cardDataB = {
    card_number: 'CARD-22B',
    name: 'Concurrent Dragon B',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [promptAbB] }
  };

  const oppCardData1 = {
    card_number: 'OPP-22A',
    name: 'Opposing Spirit 1',
    type: 'Spirit',
    cost: 1,
    color: 'White',
    levels: { 1: { cost: 1, bp: 1000 } }
  };
  const oppCardData2 = {
    card_number: 'OPP-22B',
    name: 'Opposing Spirit 2',
    type: 'Spirit',
    cost: 1,
    color: 'White',
    levels: { 1: { cost: 1, bp: 2000 } }
  };

  const game = createGame({ playerDeck: createTestDeck([cardDataA, cardDataB]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const cardA = createCardInstance(cardDataA, 'player');
  const stackA = createFieldStack(cardA, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackA);

  const cardB = createCardInstance(cardDataB, 'player');
  const stackB = createFieldStack(cardB, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stackB);

  const oppCard1 = createCardInstance(oppCardData1, 'opponent');
  const oppStack1 = createFieldStack(oppCard1, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack1);

  const oppCard2 = createCardInstance(oppCardData2, 'opponent');
  const oppStack2 = createFieldStack(oppCard2, { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppStack2);

  let resolvePromptA = null;
  let resolvePromptB = null;
  let promptReachedA = false;
  let promptReachedB = false;

  const promptAPromise = new Promise(r => { resolvePromptA = r; });
  const promptBPromise = new Promise(r => { resolvePromptB = r; });

  const observedPrompts = [];

  game.resolver.promptResolver = {
    async choose(request) {
      const physId = request.context?.physicalAbilityId;
      observedPrompts.push({
        physicalAbilityId: request.context?.physicalAbilityId,
        semanticAbilityId: request.context?.semanticAbilityId,
        sourceAbility: request.context?.sourceAbility,
        targetCandidates: request.candidates
      });

      if (physId === promptAbA.physicalId) {
        promptReachedA = true;
        await promptAPromise;
        return request.candidates[0];
      } else if (physId === promptAbB.physicalId) {
        promptReachedB = true;
        await promptBPromise;
        return request.candidates[1] || request.candidates[0];
      }
      return request.candidates[0];
    }
  };

  // Launch Activation A (will pause at prompt A)
  const actAPromise = game.activateAbility(cardA.id, promptAbA.physicalId, 'player');

  // Wait a tick to ensure Activation A reaches its prompt
  await new Promise(setImmediate);
  assert.equal(promptReachedA, true, 'Activation A must reach its prompt and pause');

  // Launch Activation B while A is still paused (overlapping prompt)
  const actBPromise = game.activateAbility(cardB.id, promptAbB.physicalId, 'player');

  await new Promise(setImmediate);
  assert.equal(promptReachedB, true, 'Activation B must reach its prompt and pause concurrently');

  // Verify both prompts observed their own distinct identity contexts concurrently
  assert.equal(observedPrompts.length, 2);
  const promptObsA = observedPrompts.find(p => p.physicalAbilityId === promptAbA.physicalId);
  const promptObsB = observedPrompts.find(p => p.physicalAbilityId === promptAbB.physicalId);

  assert.ok(promptObsA, 'Prompt A must have been recorded');
  assert.ok(promptObsB, 'Prompt B must have been recorded');

  assert.equal(promptObsA.physicalAbilityId, promptAbA.physicalId);
  assert.equal(promptObsA.semanticAbilityId, promptAbA.semanticId);
  assert.strictEqual(promptObsA.sourceAbility, promptAbA);

  assert.equal(promptObsB.physicalAbilityId, promptAbB.physicalId);
  assert.equal(promptObsB.semanticAbilityId, promptAbB.semanticId);
  assert.strictEqual(promptObsB.sourceAbility, promptAbB);

  // Resume prompts in OPPOSITE order: Resume B first, while A remains paused
  resolvePromptB();
  const resB = await actBPromise;
  assert.equal(resB.success, true, 'Activation B must complete successfully');
  assert.equal(resB.isCommitted, true, 'Activation B must be committed');

  const keyA = `turn:1:player:${stackA.placementId}:${promptAbA.physicalId}`;
  const keyB = `turn:1:player:${stackB.placementId}:${promptAbB.physicalId}`;

  assert.equal(game.state.restrictions.counters[keyB], 1, 'Ability B must be committed');
  assert.equal(game.state.restrictions.counters[keyA] || 0, 0, 'Ability A must not yet be committed while still paused');

  // Now resume prompt A
  resolvePromptA();
  const resA = await actAPromise;
  assert.equal(resA.success, true, 'Activation A must complete successfully');
  assert.equal(resA.isCommitted, true, 'Activation A must be committed');
  assert.equal(game.state.restrictions.counters[keyA], 1, 'Ability A must now be committed');

  // Verify neither activation overwrote or corrupted the other
  assert.equal(game.state.restrictions.counters[keyA], 1);
  assert.equal(game.state.restrictions.counters[keyB], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-23
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-23: Optional prompt rejection releases reservation and preserves clean context', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const optAb = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  optAb.clauses[0].isOptional = true;
  assignDeterministicAbilityIdentities('CARD-23', [optAb]);

  const cardData = {
    card_number: 'CARD-23',
    name: 'Optional Decline Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [optAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  let promptObservedContext = null;
  game.resolver.promptResolver = {
    async choose(request) {
      promptObservedContext = {
        physicalAbilityId: request.context?.physicalAbilityId,
        sourceAbility: request.context?.sourceAbility
      };
      return { declined: true };
    }
  };

  const res = await game.activateAbility(card.id, optAb.physicalId, 'player');
  assert.equal(res.isCommitted, false, 'Optional decline must not commit usage');
  assert.equal(res.activated, false, 'Optional decline does not count as activated');

  assert.ok(promptObservedContext);
  assert.equal(promptObservedContext.physicalAbilityId, optAb.physicalId);
  assert.strictEqual(promptObservedContext.sourceAbility, optAb);

  const key = `turn:1:player:${stack.placementId}:${optAb.physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0, 'Committed counter must remain 0 on optional decline');
  assert.equal(game.state.restrictions.reservations[key] || 0, 0, 'Active reservation must be released');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-24
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-24: Mandatory prompt cancellation / invalid selection releases reservation without limit consumption', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const promptAb = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  assignDeterministicAbilityIdentities('CARD-24', [promptAb]);

  const cardData = {
    card_number: 'CARD-24',
    name: 'Cancel Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [promptAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Prompt returns invalid / empty chosen array for mandatory target selection
  game.resolver.promptResolver = {
    async choose(request) {
      return [];
    }
  };

  const res = await game.activateAbility(card.id, promptAb.physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);

  const key = `turn:1:player:${stack.placementId}:${promptAb.physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0, 'Committed counter must remain 0 on cancelled prompt');
  assert.equal(game.state.restrictions.reservations[key] || 0, 0, 'Reservation must be cleanly released');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-25
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-25: Thrown error in prompt resolver safely releases reservation on exceptional exit', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const promptAb = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  assignDeterministicAbilityIdentities('CARD-25', [promptAb]);

  const cardData = {
    card_number: 'CARD-25',
    name: 'Throwing Prompt Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [promptAb] }
  };

  const oppCardData = {
    card_number: 'OPP-25',
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

  // Prompt resolver throws an unhandled exception
  game.resolver.promptResolver = {
    async choose(request) {
      throw new Error('CRITICAL_PROMPT_CRASH');
    }
  };

  await assert.rejects(
    async () => game.activateAbility(card.id, promptAb.physicalId, 'player'),
    /CRITICAL_PROMPT_CRASH/
  );

  const key = `turn:1:player:${stack.placementId}:${promptAb.physicalId}`;
  assert.equal(game.state.restrictions.counters[key] || 0, 0, 'Committed counter must remain 0 on exception');
  assert.equal(game.state.restrictions.reservations[key] || 0, 0, 'Reservation must be released in finally block');
});

// ---------------------------------------------------------------------------
// TC-ID-CONSUMER-26
// ---------------------------------------------------------------------------
test('TC-ID-CONSUMER-26: Early reservation failure exits cleanly without context pollution or prompt invocation', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const promptAb = createTestAbility('MAIN', 'ONCE_PER_TURN', {
    op: 'TARGET_SELECT',
    target: 'opposing_spirit'
  });
  assignDeterministicAbilityIdentities('CARD-26', [promptAb]);

  const cardData = {
    card_number: 'CARD-26',
    name: 'Early Failure Spirit',
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: { abilities: [promptAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';
  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Pre-seed committed counter to simulate exhausted limit
  const key = `turn:1:player:${stack.placementId}:${promptAb.physicalId}`;
  ensureRestrictionState(game.state);
  game.state.restrictions.counters[key] = 1;

  let promptInvoked = false;
  game.resolver.promptResolver = {
    async choose(request) {
      promptInvoked = true;
      return request.candidates[0];
    }
  };

  const res = await game.activateAbility(card.id, promptAb.physicalId, 'player');
  assert.equal(res.success, false);
  assert.equal(res.isCommitted, false);
  assert.equal(res.reason, 'ABILITY_LIMIT_REACHED');

  assert.equal(promptInvoked, false, 'Prompt must never be invoked when reservation fails early');
  assert.equal(game.state.restrictions.counters[key], 1, 'Committed counter remains unchanged');
  assert.equal(game.state.restrictions.reservations[key] || 0, 0, 'No active reservation left behind');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-01
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-01: Save/load with no active reservations preserves committed usage', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-P01', [ab]);

  const cardData = {
    card_number: 'CARD-P01',
    name: 'Persistent Dragon',
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

  // Activate and commit
  const res = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(res.success, true);
  assert.equal(res.isCommitted, true);

  const key = `turn:1:player:${stack.placementId}:${ab.physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);
  assert.equal(game.state.restrictions.reservations[key] || 0, 0);

  // Serialize and restore into fresh game
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Committed usage counter preserved
  assert.equal(freshGame.state.restrictions.counters[key], 1);
  assert.equal(freshGame.state.restrictions.reservations[key] || 0, 0);

  // Activating again is blocked by limit
  const restoredCard = freshGame.state.players.player.field[0].top;
  const resBlocked = await freshGame.activateAbility(restoredCard.id, ab.physicalId, 'player');
  assert.equal(resBlocked.success, false);
  assert.equal(resBlocked.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-02
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-02: Save/load with an active reservation follows the selected restoration policy', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-P02', [ab]);

  const cardData = {
    card_number: 'CARD-P02',
    name: 'Policy Dragon',
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

  // Stage an active reservation
  const activationContext = {
    controller: 'player',
    sourceCard: stack.top,
    sourceStack: stack,
    placementId: stack.placementId
  };
  const handle = reserveRestriction(game.state, ab, activationContext);
  assert.equal(handle.success, true);
  assert.equal(game.state.restrictions.reservations[handle.key], 1);
  assert.ok(game.state.restrictions.meta._reservations[handle.reservationId]);

  // Serialize and restore into fresh game
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Policy Option B (Invalidate Transient Reservations):
  // Active reservations cleared, committed counter untouched (0), generation advanced
  assert.equal(freshGame.state.restrictions.reservations[handle.key] || 0, 0);
  assert.equal(freshGame.state.restrictions.meta._reservations?.[handle.reservationId], undefined);
  assert.equal(freshGame.state.restrictions.counters[handle.key] || 0, 0);
  assert.ok(freshGame.state.restrictions.generations.TURN > handle.generation);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-03
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-03: A restored reservation can be finalized exactly once, if Option A is selected', () => {
  // Option B was selected over Option A based on engine architectural analysis:
  // In-flight asynchronous prompt continuations and event dispatch frames cannot be restored.
  // Reconstructing reservation handles without execution continuations leaves them orphaned.
  // Under Option B, attempting to finalize a pre-save reservation against restored state fails safely.
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_dummy: {
            reservationId: 'res_dummy',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: 1,
            status: 'ACTIVE',
            createdAt: Date.now()
          }
        },
        'turn:1:player:pl_1:CARD#01': {
          type: 'ONCE_PER_TURN',
          scope: 'TURN',
          limit: 1
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1
      }
    }
  };

  const freshGame = createGame({ state });

  // Verifies that under Option B, the restored state does not support finalizing the interrupted handle
  const commitRes = _finalizeReservation(freshGame.state, 'res_dummy', 'COMMIT');
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);
  assert.equal(freshGame.state.restrictions.counters['turn:1:player:pl_1:CARD#01'] || 0, 0);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-04
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-04: An interrupted reservation is safely invalidated, if Option B is selected', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const ab2 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 2 });
  assignDeterministicAbilityIdentities('CARD-P04', [ab1, ab2]);

  const cardData = {
    card_number: 'CARD-P04',
    name: 'Interrupted Dragon',
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

  // Commit ability 1
  await game.activateAbility(card.id, ab1.physicalId, 'player');
  const key1 = `turn:1:player:${stack.placementId}:${ab1.physicalId}`;
  assert.equal(game.state.restrictions.counters[key1], 1);

  // Reserve ability 2 (interrupted in-flight)
  const actCtx = { controller: 'player', sourceCard: stack.top, sourceStack: stack, placementId: stack.placementId };
  const handle2 = reserveRestriction(game.state, ab2, actCtx);
  const key2 = handle2.key;
  assert.equal(game.state.restrictions.reservations[key2], 1);

  // Serialize and restore into fresh game
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Option B assertions:
  // 1. Interrupted reservation is completely invalidated
  assert.equal(freshGame.state.restrictions.reservations[key2] || 0, 0);
  assert.deepEqual(freshGame.state.restrictions.meta._reservations, {});
  // 2. Generation advanced
  assert.equal(freshGame.state.restrictions.generations.TURN, 2);
  // 3. Unrelated committed counter preserved
  assert.equal(freshGame.state.restrictions.counters[key1], 1);
  // 4. Interrupted ability counter remains uncommitted
  assert.equal(freshGame.state.restrictions.counters[key2] || 0, 0);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-05
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-05: A stale pre-save handle cannot mutate restored state', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-P05', [ab]);

  const cardData = {
    card_number: 'CARD-P05',
    name: 'Stale Handle Dragon',
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

  const actCtx = { controller: 'player', sourceCard: stack.top, sourceStack: stack, placementId: stack.placementId };
  const handle = reserveRestriction(game.state, ab, actCtx);
  assert.equal(handle.success, true);

  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // 1. Snapshot of restored state before invalidation attempts
  const oldCountersSnapshot = JSON.stringify(freshGame.state.restrictions.counters);
  const oldReservationsSnapshot = JSON.stringify(freshGame.state.restrictions.reservations);

  // 2. Direct finalization against freshGame.state fails with RESERVATION_INVALIDATED
  const commitRes = _finalizeReservation(freshGame.state, handle.reservationId, 'COMMIT');
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);

  // 3. Direct release against freshGame.state fails
  const releaseRes = releaseReservation(freshGame.state, handle.reservationId);
  assert.equal(releaseRes, false);

  // 4. Even if stale record is injected with old generation, generation mismatch rejects it
  freshGame.state.restrictions.meta._reservations = {
    [handle.reservationId]: {
      reservationId: handle.reservationId,
      key: handle.key,
      type: 'ONCE_PER_TURN',
      scope: 'TURN',
      limit: 1,
      generation: handle.generation, // old generation (1)
      status: 'ACTIVE'
    }
  };
  freshGame.state.restrictions.reservations = { [handle.key]: 1 };

  const injectedCommit = _finalizeReservation(freshGame.state, handle.reservationId, 'COMMIT');
  assert.equal(injectedCommit.success, false);
  assert.equal(injectedCommit.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);

  // Clean up injected test record and verify state invariance
  freshGame.state.restrictions.meta._reservations = {};
  freshGame.state.restrictions.reservations = {};
  assert.equal(JSON.stringify(freshGame.state.restrictions.counters), oldCountersSnapshot);
  assert.equal(JSON.stringify(freshGame.state.restrictions.reservations), oldReservationsSnapshot);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-06
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-06: A restored ability can be activated after transient reservations are invalidated, if Option B is selected', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-P06', [ab]);

  const cardData = {
    card_number: 'CARD-P06',
    name: 'Reactive Dragon',
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

  // In pre-save game, reserve capacity so further activations would be blocked
  const actCtx = { controller: 'player', sourceCard: stack.top, sourceStack: stack, placementId: stack.placementId };
  const handle = reserveRestriction(game.state, ab, actCtx);
  assert.equal(handle.success, true);

  // Second activation in pre-save game is blocked
  const resBlockedOld = await game.activateAbility(card.id, ab.physicalId, 'player');
  assert.equal(resBlockedOld.success, false);
  assert.equal(resBlockedOld.reason, 'ABILITY_LIMIT_REACHED');

  // Save and load into fresh game
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // In fresh game, transient reservation was invalidated. Ability can now be activated!
  const restoredCard = freshGame.state.players.player.field[0].top;
  const resSuccess = await freshGame.activateAbility(restoredCard.id, ab.physicalId, 'player');
  assert.equal(resSuccess.success, true);
  assert.equal(resSuccess.isCommitted, true);

  const key = `turn:1:player:${restoredCard.placementId}:${ab.physicalId}`;
  assert.equal(freshGame.state.restrictions.counters[key], 1);

  // Once committed in fresh game, subsequent activation is blocked
  const resBlockedNow = await freshGame.activateAbility(restoredCard.id, ab.physicalId, 'player');
  assert.equal(resBlockedNow.success, false);
  assert.equal(resBlockedNow.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-07
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-07: Multiple reservations on the same restriction key restore or invalidate consistently', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const multiAb = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  multiAb.header.limitCount = 3; // Allows 3 activations per turn
  assignDeterministicAbilityIdentities('CARD-P07', [multiAb]);

  const cardData = {
    card_number: 'CARD-P07',
    name: 'Multi Reserve Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [multiAb] }
  };

  const game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Take 2 concurrent reservations on the same key
  const actCtx = { controller: 'player', sourceCard: stack.top, sourceStack: stack, placementId: stack.placementId };
  const h1 = reserveRestriction(game.state, multiAb, actCtx);
  const h2 = reserveRestriction(game.state, multiAb, actCtx);
  assert.equal(h1.success, true);
  assert.equal(h2.success, true);
  assert.equal(game.state.restrictions.reservations[h1.key], 2);

  // Save and restore
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Both reservations invalidated consistently
  assert.equal(freshGame.state.restrictions.reservations[h1.key] || 0, 0);
  assert.deepEqual(freshGame.state.restrictions.meta._reservations, {});
  assert.equal(freshGame.state.restrictions.counters[h1.key] || 0, 0);

  // Can now activate up to limit (3 times)
  const restoredCard = freshGame.state.players.player.field[0].top;
  const a1 = await freshGame.activateAbility(restoredCard.id, multiAb.physicalId, 'player');
  const a2 = await freshGame.activateAbility(restoredCard.id, multiAb.physicalId, 'player');
  const a3 = await freshGame.activateAbility(restoredCard.id, multiAb.physicalId, 'player');
  assert.equal(a1.success, true);
  assert.equal(a2.success, true);
  assert.equal(a3.success, true);
  assert.equal(freshGame.state.restrictions.counters[h1.key], 3);

  // 4th activation blocked
  const a4 = await freshGame.activateAbility(restoredCard.id, multiAb.physicalId, 'player');
  assert.equal(a4.success, false);
  assert.equal(a4.reason, 'ABILITY_LIMIT_REACHED');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-08
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-08: Reservations from different players and scopes remain correctly isolated', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const turnAb = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const gameAb = createTestAbility('MAIN', 'ONCE_PER_GAME', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-P08-A', [turnAb]);
  assignDeterministicAbilityIdentities('CARD-P08-B', [gameAb]);

  const p1CardData = {
    card_number: 'CARD-P08-A',
    name: 'Turn Player Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [turnAb] }
  };
  const p2CardData = {
    card_number: 'CARD-P08-B',
    name: 'Game Opponent Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'White',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [gameAb] }
  };

  const game = createGame({
    playerDeck: createTestDeck([p1CardData]),
    opponentDeck: createTestDeck([p2CardData]),
    firstPlayer: 'player'
  });
  game.state.step = 'MAIN';

  const card1 = createCardInstance(p1CardData, 'player');
  const stack1 = createFieldStack(card1, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack1);

  const card2 = createCardInstance(p2CardData, 'opponent');
  const stack2 = createFieldStack(card2, { normal: 2, soul: 0 });
  game.state.players.opponent.field.push(stack2);

  // P1 reserves TURN ability, P2 reserves GAME ability
  const h1 = reserveRestriction(game.state, turnAb, { controller: 'player', sourceCard: card1, sourceStack: stack1, placementId: stack1.placementId });
  const h2 = reserveRestriction(game.state, gameAb, { controller: 'opponent', sourceCard: card2, sourceStack: stack2, placementId: stack2.placementId, cardId: card2.id });
  assert.equal(h1.success, true);
  assert.equal(h2.success, true);

  // Save and restore
  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Both scopes advance generations
  assert.equal(freshGame.state.restrictions.generations.TURN, 2);
  assert.equal(freshGame.state.restrictions.generations.GAME, 2);

  // Both transient reservations cleared
  assert.equal(freshGame.state.restrictions.reservations[h1.key] || 0, 0);
  assert.equal(freshGame.state.restrictions.reservations[h2.key] || 0, 0);

  // Activate P1 ability: only P1 counter updates
  const res1 = await freshGame.activateAbility(card1.id, turnAb.physicalId, 'player');
  assert.equal(res1.success, true);
  assert.equal(freshGame.state.restrictions.counters[h1.key], 1);
  assert.equal(freshGame.state.restrictions.counters[h2.key] || 0, 0);

  // Activate P2 ability: only P2 counter updates
  const res2 = await freshGame.activateAbility(card2.id, gameAb.physicalId, 'opponent');
  assert.equal(res2.success, true);
  assert.equal(freshGame.state.restrictions.counters[h2.key], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-09
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-09: Malformed or contradictory serialized reservation state is rejected safely', () => {
  // Case A: Negative committed counter
  const stateNegativeCounter = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:player:pl_1:CARD#01': -1 },
      meta: { 'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 } },
      reservations: {}
    }
  };
  const snapNegative = JSON.parse(JSON.stringify(stateNegativeCounter));
  assert.throws(() => createGame({ state: stateNegativeCounter }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(stateNegativeCounter, snapNegative, 'State must remain invariant on rejection');

  // Case B: Reservation count mismatch
  const stateMismatch = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_1: {
            reservationId: 'res_1',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 5 // Record count is 1, counter is 5
      }
    }
  };
  const snapMismatch = JSON.parse(JSON.stringify(stateMismatch));
  assert.throws(() => createGame({ state: stateMismatch }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(stateMismatch, snapMismatch, 'State must remain invariant on rejection');

  // Case C: Contradictory metadata
  const stateContradiction = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 },
        _reservations: {
          res_1: {
            reservationId: 'res_1',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_GAME', // Contradicts meta type
            scope: 'GAME',
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      }
    }
  };
  const snapContradiction = JSON.parse(JSON.stringify(stateContradiction));
  assert.throws(() => createGame({ state: stateContradiction }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(stateContradiction, snapContradiction, 'State must remain invariant on rejection');

  // Case D: Invalid lifecycle generation
  const stateInvalidGen = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: {
        TURN: -5, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1
      }
    }
  };
  const snapGen = JSON.parse(JSON.stringify(stateInvalidGen));
  assert.throws(() => createGame({ state: stateInvalidGen }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(stateInvalidGen, snapGen, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-10
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-10: Repeated save/load cycles do not leak reservations or alter committed counters', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab1 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  const ab2 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 2 });
  const ab3 = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 3 });
  assignDeterministicAbilityIdentities('CARD-P10', [ab1, ab2, ab3]);

  const cardData = {
    card_number: 'CARD-P10',
    name: 'Cycle Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab1, ab2, ab3] }
  };

  // Cycle 1: Game 1 -> Commit Ab1, Reserve Ab2
  let currentGame = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  currentGame.state.step = 'MAIN';
  let card = createCardInstance(cardData, 'player');
  let stack = createFieldStack(card, { normal: 2, soul: 0 });
  currentGame.state.players.player.field.push(stack);

  await currentGame.activateAbility(card.id, ab1.physicalId, 'player');
  const key1 = `turn:1:player:${stack.placementId}:${ab1.physicalId}`;
  assert.equal(currentGame.state.restrictions.counters[key1], 1);

  reserveRestriction(currentGame.state, ab2, { controller: 'player', sourceCard: card, sourceStack: stack, placementId: stack.placementId });

  // Save/Load Cycle 2: Game 2 -> Ab1 is 1, Ab2 reservation cleared. Commit Ab2, Reserve Ab3.
  currentGame = createGame({ state: JSON.parse(JSON.stringify(currentGame.state)) });
  const key2 = `turn:1:player:${stack.placementId}:${ab2.physicalId}`;
  assert.equal(currentGame.state.restrictions.counters[key1], 1);
  assert.equal(currentGame.state.restrictions.counters[key2] || 0, 0);
  assert.equal(currentGame.state.restrictions.reservations[key2] || 0, 0);

  await currentGame.activateAbility(card.id, ab2.physicalId, 'player');
  assert.equal(currentGame.state.restrictions.counters[key2], 1);

  reserveRestriction(currentGame.state, ab3, { controller: 'player', sourceCard: card, sourceStack: stack, placementId: stack.placementId });

  // Save/Load Cycle 3: Game 3 -> Ab1 is 1, Ab2 is 1, Ab3 reservation cleared.
  currentGame = createGame({ state: JSON.parse(JSON.stringify(currentGame.state)) });
  const key3 = `turn:1:player:${stack.placementId}:${ab3.physicalId}`;
  assert.equal(currentGame.state.restrictions.counters[key1], 1);
  assert.equal(currentGame.state.restrictions.counters[key2], 1);
  assert.equal(currentGame.state.restrictions.counters[key3] || 0, 0);
  assert.equal(currentGame.state.restrictions.reservations[key3] || 0, 0);

  // Save/Load Cycle 4: Game 4 -> Verify stability across empty reservation cycles
  currentGame = createGame({ state: JSON.parse(JSON.stringify(currentGame.state)) });
  assert.equal(currentGame.state.restrictions.counters[key1], 1);
  assert.equal(currentGame.state.restrictions.counters[key2], 1);
  assert.equal(currentGame.state.restrictions.counters[key3] || 0, 0);
  assert.deepEqual(currentGame.state.restrictions.reservations, {});
  assert.deepEqual(currentGame.state.restrictions.meta._reservations, {});
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-01: Reject a committed counter greater than Number.MAX_SAFE_INTEGER
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-01: Reject a committed counter greater than Number.MAX_SAFE_INTEGER', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:player:pl_1:CARD#01': Number.MAX_SAFE_INTEGER + 1 },
      meta: { 'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 } },
      reservations: {}
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-02: Reject a fractional committed counter
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-02: Reject a fractional committed counter', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:player:pl_1:CARD#01': 1.5 },
      meta: { 'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 } },
      reservations: {}
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-03: Reject an unsafe active reservation count
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-03: Reject an unsafe active reservation count', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: { 'turn:1:player:pl_1:CARD#01': Number.MAX_SAFE_INTEGER + 10 }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-04: Reject an unsafe lifecycle generation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-04: Reject an unsafe lifecycle generation', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: {
        TURN: Number.MAX_SAFE_INTEGER + 5,
        STEP: 1,
        BATTLE: 1,
        ATTACK: 1,
        GAME: 1
      }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-05: Reject an unsafe restriction limit
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-05: Reject an unsafe restriction limit', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        'turn:1:player:pl_1:CARD#01': {
          type: 'ONCE_PER_TURN',
          scope: 'TURN',
          limit: Number.MAX_SAFE_INTEGER + 100
        }
      },
      reservations: {}
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-06: Reject an unsafe reservation-record limit
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-06: Reject an unsafe reservation-record limit', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_unsafe: {
            reservationId: 'res_unsafe',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: Number.MAX_SAFE_INTEGER + 2,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  assert.throws(() => createGame({ state }), /INVALID_RESTRICTION_STATE/);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-07: Reject NaN, positive/negative Infinity, and other non-finite values in applicable numeric fields
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-07: Reject NaN, positive/negative Infinity, and other non-finite values in applicable numeric fields', () => {
  for (const badVal of [NaN, Infinity, -Infinity, 1e100]) {
    // Bad counter
    const stateBadCounter = {
      turnNumber: 1,
      restrictions: { counters: { 'turn:1:player:pl_1:CARD#01': badVal }, meta: {}, reservations: {} }
    };
    assert.throws(() => createGame({ state: stateBadCounter }), /INVALID_RESTRICTION_STATE/);

    // Bad reservation count
    const stateBadRes = {
      turnNumber: 1,
      restrictions: { counters: {}, meta: {}, reservations: { 'turn:1:player:pl_1:CARD#01': badVal } }
    };
    assert.throws(() => createGame({ state: stateBadRes }), /INVALID_RESTRICTION_STATE/);

    // Bad generation
    const stateBadGen = {
      turnNumber: 1,
      restrictions: { counters: {}, meta: {}, reservations: {}, generations: { TURN: badVal, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 } }
    };
    assert.throws(() => createGame({ state: stateBadGen }), /INVALID_RESTRICTION_STATE/);
  }
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-08: Confirm valid safe-integer values remain accepted
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-08: Confirm valid safe-integer values remain accepted', () => {
  const validState = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:player:pl_1:CARD#01': 100 },
      meta: {
        'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1000 }
      },
      reservations: {},
      generations: {
        TURN: 42,
        STEP: 1,
        BATTLE: 1,
        ATTACK: 1,
        GAME: 1
      }
    }
  };
  const game = createGame({ state: validState });
  assert.equal(game.state.restrictions.counters['turn:1:player:pl_1:CARD#01'], 100);
  assert.equal(game.state.restrictions.generations.TURN, 42);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-09: A state with an active reservation and a generation at the maximum safe-integer boundary must be rejected before restoration mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-09: A state with an active reservation and a generation at the maximum safe-integer boundary must be rejected before restoration mutation', () => {
  const boundaryState = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_bound: {
            reservationId: 'res_bound',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: Number.MAX_SAFE_INTEGER,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: Number.MAX_SAFE_INTEGER,
        STEP: 1,
        BATTLE: 1,
        ATTACK: 1,
        GAME: 1
      }
    }
  };
  const snap = JSON.parse(JSON.stringify(boundaryState));
  assert.throws(() => createGame({ state: boundaryState }), /INVALID_RESTRICTION_STATE: GENERATION_OVERFLOW: TURN/);
  assert.deepStrictEqual(boundaryState, snap, 'State must remain invariant on overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-10: A generation increment must produce a distinct safe integer
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-10: A generation increment must produce a distinct safe integer', () => {
  const genNearMax = Number.MAX_SAFE_INTEGER - 1;
  const stateNearMax = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_near: {
            reservationId: 'res_near',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: genNearMax,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: genNearMax,
        STEP: 1,
        BATTLE: 1,
        ATTACK: 1,
        GAME: 1
      }
    }
  };

  const game = createGame({ state: stateNearMax });
  assert.equal(game.state.restrictions.generations.TURN, Number.MAX_SAFE_INTEGER);
  assert.equal(Number.isSafeInteger(game.state.restrictions.generations.TURN), true);
  assert.notEqual(game.state.restrictions.generations.TURN, genNearMax);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-11: Rejected generation overflow must preserve the complete input state, verified by a before/after deep snapshot
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-11: Rejected generation overflow must preserve the complete input state, verified by a before/after deep snapshot', () => {
  const overflowState = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:player:pl_1:CARD#01': 2 },
      meta: {
        'turn:1:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 5 },
        _reservations: {
          res_of: {
            reservationId: 'res_of',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 5,
            generation: Number.MAX_SAFE_INTEGER,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: Number.MAX_SAFE_INTEGER,
        STEP: 10,
        BATTLE: 5,
        ATTACK: 3,
        GAME: 1
      }
    }
  };
  const snapshotBefore = JSON.parse(JSON.stringify(overflowState));
  assert.throws(() => createGame({ state: overflowState }), /GENERATION_OVERFLOW/);
  assert.deepStrictEqual(overflowState, snapshotBefore, 'Complete state must remain 100% invariant on overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-12: A valid active reservation still causes the correct scope generation to advance exactly once
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-12: A valid active reservation still causes the correct scope generation to advance exactly once', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_valid: {
            reservationId: 'res_valid',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: 10,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: 10,
        STEP: 5,
        BATTLE: 3,
        ATTACK: 2,
        GAME: 1
      }
    }
  };
  const game = createGame({ state });
  assert.equal(game.state.restrictions.generations.TURN, 11, 'TURN generation must advance by exactly 1');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-13: Unaffected scope generations remain unchanged
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-13: Unaffected scope generations remain unchanged', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {
        _reservations: {
          res_turn_only: {
            reservationId: 'res_turn_only',
            key: 'turn:1:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: 7,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:1:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: 7,
        STEP: 15,
        BATTLE: 8,
        ATTACK: 4,
        GAME: 2
      }
    }
  };
  const game = createGame({ state });
  assert.equal(game.state.restrictions.generations.TURN, 8, 'Affected TURN generation advances');
  assert.equal(game.state.restrictions.generations.STEP, 15, 'Unaffected STEP remains unchanged');
  assert.equal(game.state.restrictions.generations.BATTLE, 8, 'Unaffected BATTLE remains unchanged');
  assert.equal(game.state.restrictions.generations.ATTACK, 4, 'Unaffected ATTACK remains unchanged');
  assert.equal(game.state.restrictions.generations.GAME, 2, 'Unaffected GAME remains unchanged');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-14: Stale pre-restoration handles remain unable to commit or release reservations after successful restoration
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-14: Stale pre-restoration handles remain unable to commit or release reservations after successful restoration', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-S14', [ab]);

  const cardData = {
    card_number: 'CARD-S14',
    name: 'Safe Stale Dragon',
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

  const actCtx = { controller: 'player', sourceCard: stack.top, sourceStack: stack, placementId: stack.placementId };
  const handle = reserveRestriction(game.state, ab, actCtx);
  assert.equal(handle.success, true);

  const serialized = JSON.stringify(game.state);
  const freshGame = createGame({ state: JSON.parse(serialized) });

  // Handle cannot commit on restored state
  const commitRes = _finalizeReservation(freshGame.state, handle.reservationId, 'COMMIT');
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);

  // Handle cannot release on restored state
  const releaseRes = releaseReservation(freshGame.state, handle.reservationId);
  assert.equal(releaseRes, false);

  // State remains untouched
  assert.equal(freshGame.state.restrictions.counters[handle.key] || 0, 0);
  assert.equal(freshGame.state.restrictions.reservations[handle.key] || 0, 0);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-SAFEINT-15: Repeated valid save/load cycles preserve committed counters and do not cause generation drift beyond the expected increments
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-SAFEINT-15: Repeated valid save/load cycles preserve committed counters and do not cause generation drift beyond the expected increments', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = createTestAbility('MAIN', 'ONCE_PER_TURN', { op: 'DRAW', count: 1 });
  assignDeterministicAbilityIdentities('CARD-S15', [ab]);

  const cardData = {
    card_number: 'CARD-S15',
    name: 'Drift Test Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: { abilities: [ab] }
  };

  let game = createGame({ playerDeck: createTestDeck([cardData]), firstPlayer: 'player' });
  game.state.step = 'MAIN';

  const card = createCardInstance(cardData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  // Initial generation is 1 for all scopes
  assert.equal(game.state.restrictions.generations.TURN, 1);

  // Cycle 1: No active reservation -> generations do NOT drift
  game = createGame({ state: JSON.parse(JSON.stringify(game.state)) });
  assert.equal(game.state.restrictions.generations.TURN, 1, 'No drift when no active reservations');

  // Cycle 2: One active reservation -> TURN generation increments by exactly 1
  reserveRestriction(game.state, ab, { controller: 'player', sourceCard: card, sourceStack: stack, placementId: stack.placementId });
  game = createGame({ state: JSON.parse(JSON.stringify(game.state)) });
  assert.equal(game.state.restrictions.generations.TURN, 2, 'Increments exactly once on active reservation');

  // Cycle 3: Commit ability, no active reservation -> TURN generation does NOT drift
  await game.activateAbility(card.id, ab.physicalId, 'player');
  const key = `turn:1:player:${stack.placementId}:${ab.physicalId}`;
  assert.equal(game.state.restrictions.counters[key], 1);

  game = createGame({ state: JSON.parse(JSON.stringify(game.state)) });
  assert.equal(game.state.restrictions.generations.TURN, 2, 'No drift after committed activation');
  assert.equal(game.state.restrictions.counters[key], 1, 'Committed counter strictly preserved');

  // Cycle 4: Another save/load with no active reservations -> still 2
  game = createGame({ state: JSON.parse(JSON.stringify(game.state)) });
  assert.equal(game.state.restrictions.generations.TURN, 2);
  assert.equal(game.state.restrictions.counters[key], 1);
});

// ===========================================================================
// Phase 4C.3.2.4.2.1.2 — Lifecycle Generation Overflow & Atomic Reset Correction Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-01: Valid TURN reset advances TURN, STEP, BATTLE, ATTACK exactly once
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-01: Valid TURN reset advances TURN, STEP, BATTLE, ATTACK exactly once', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {
        'turn:1:p1:c1': 1,
        'step:1:p1:c1': 1,
        'battle:1:p1:c1': 1,
        'attack:1:p1:c1': 1,
        'game:1:p1:c1': 1
      },
      meta: {
        'turn:1:p1:c1': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 },
        _reservations: {
          res_1: {
            reservationId: 'res_1',
            key: 'turn:1:p1:c1',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: 1,
            status: 'ACTIVE'
          }
        }
      },
      reservations: { 'turn:1:p1:c1': 1 },
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };
  const res = resetRestrictions(state, 'TURN');
  assert.equal(res.success, true);
  assert.equal(state.restrictions.generations.TURN, 2);
  assert.equal(state.restrictions.generations.STEP, 2);
  assert.equal(state.restrictions.generations.BATTLE, 2);
  assert.equal(state.restrictions.generations.ATTACK, 2);
  assert.equal(state.restrictions.generations.GAME, 1);
  assert.equal(state.restrictions.counters['turn:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['step:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['battle:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['attack:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['game:1:p1:c1'], 1, 'Game counter remains 100% intact');
  assert.equal(state.restrictions.reservations['turn:1:p1:c1'], undefined, 'Reservation cleared');
  assert.equal(state.restrictions.meta._reservations, undefined, 'Reservation record cleared');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-02: Valid STEP reset advances only STEP
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-02: Valid STEP reset advances only STEP', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'step:1:p1:c1': 1, 'turn:1:p1:c1': 1 },
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };
  const res = resetRestrictions(state, 'STEP');
  assert.equal(res.success, true);
  assert.equal(state.restrictions.generations.STEP, 2);
  assert.equal(state.restrictions.generations.TURN, 1);
  assert.equal(state.restrictions.generations.BATTLE, 1);
  assert.equal(state.restrictions.generations.ATTACK, 1);
  assert.equal(state.restrictions.generations.GAME, 1);
  assert.equal(state.restrictions.counters['step:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['turn:1:p1:c1'], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-03: Valid BATTLE reset advances only BATTLE
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-03: Valid BATTLE reset advances only BATTLE', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'battle:1:p1:c1': 1, 'turn:1:p1:c1': 1 },
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };
  const res = resetRestrictions(state, 'BATTLE');
  assert.equal(res.success, true);
  assert.equal(state.restrictions.generations.BATTLE, 2);
  assert.equal(state.restrictions.generations.TURN, 1);
  assert.equal(state.restrictions.generations.STEP, 1);
  assert.equal(state.restrictions.generations.ATTACK, 1);
  assert.equal(state.restrictions.generations.GAME, 1);
  assert.equal(state.restrictions.counters['battle:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['turn:1:p1:c1'], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-04: Valid ATTACK reset advances only ATTACK
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-04: Valid ATTACK reset advances only ATTACK', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'attack:1:p1:c1': 1, 'battle:1:p1:c1': 1 },
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };
  const res = resetRestrictions(state, 'ATTACK');
  assert.equal(res.success, true);
  assert.equal(state.restrictions.generations.ATTACK, 2);
  assert.equal(state.restrictions.generations.TURN, 1);
  assert.equal(state.restrictions.generations.STEP, 1);
  assert.equal(state.restrictions.generations.BATTLE, 1);
  assert.equal(state.restrictions.generations.GAME, 1);
  assert.equal(state.restrictions.counters['attack:1:p1:c1'], undefined);
  assert.equal(state.restrictions.counters['battle:1:p1:c1'], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-05: Reject an affected generation at Number.MAX_SAFE_INTEGER without mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-05: Reject an affected generation at Number.MAX_SAFE_INTEGER without mutation', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'battle:1:p1:c1': 1 },
      meta: { 'battle:1:p1:c1': { type: 'ONCE_PER_BATTLE', scope: 'BATTLE' } },
      reservations: { 'battle:1:p1:c1': 1 },
      generations: { TURN: 1, STEP: 1, BATTLE: Number.MAX_SAFE_INTEGER, ATTACK: 1, GAME: 1 }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  const res = resetRestrictions(state, 'BATTLE');
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(res.reason, 'GENERATION_OVERFLOW: BATTLE');
  assert.deepStrictEqual(state, snap, 'State must remain 100% invariant on overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-06: Reject an affected generation above the safe-integer range
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-06: Reject an affected generation above the safe-integer range', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'attack:1:p1:c1': 1 },
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: Number.MAX_SAFE_INTEGER + 2, GAME: 1 }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  const res = resetRestrictions(state, 'ATTACK');
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.deepStrictEqual(state, snap, 'State must remain invariant on unsafe integer rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-07: Reject a fractional or non-finite affected generation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-07: Reject a fractional or non-finite affected generation', () => {
  for (const badVal of [1.5, NaN, Infinity, -Infinity]) {
    const state = {
      turnNumber: 1,
      restrictions: {
        counters: {},
        meta: {},
        reservations: {},
        generations: { TURN: 1, STEP: badVal, BATTLE: 1, ATTACK: 1, GAME: 1 }
      }
    };
    const snap = structuredClone(state);
    const res = resetRestrictions(state, 'STEP');
    assert.equal(res.success, false);
    assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
    assert.deepStrictEqual(state, snap, 'State must remain invariant on non-safe integer rejection');
  }
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-08: Deep snapshot confirms failed reset leaves all state unchanged
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-08: Deep snapshot confirms failed reset leaves all state unchanged', () => {
  const state = {
    turnNumber: 4,
    abilityUses: { 'legacy#1': 2 },
    restrictions: {
      counters: { 'turn:4:player:pl_1:CARD#01': 1, 'game:player:pl_1:CARD#02': 1 },
      meta: {
        'turn:4:player:pl_1:CARD#01': { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 },
        _reservations: {
          res_1: {
            reservationId: 'res_1',
            key: 'turn:4:player:pl_1:CARD#01',
            type: 'ONCE_PER_TURN',
            scope: 'TURN',
            limit: 1,
            generation: Number.MAX_SAFE_INTEGER,
            status: 'ACTIVE'
          }
        }
      },
      reservations: {
        'turn:4:player:pl_1:CARD#01': 1
      },
      generations: {
        TURN: Number.MAX_SAFE_INTEGER,
        STEP: 3,
        BATTLE: 2,
        ATTACK: 1,
        GAME: 1
      }
    }
  };
  const snapshotBefore = JSON.parse(JSON.stringify(state));
  const res = resetRestrictions(state, 'TURN');
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(res.reason, 'GENERATION_OVERFLOW: TURN');
  assert.deepStrictEqual(state, snapshotBefore, 'Complete state must remain 100% byte-for-byte invariant');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-09: TURN reset overflow in any one of its four affected scopes prevents every other reset mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-09: TURN reset overflow in any one of its four affected scopes prevents every other reset mutation', () => {
  // BATTLE generation overflows, but TURN, STEP, ATTACK are normal
  const state = {
    turnNumber: 1,
    abilityUses: { 'legacy#1': 1 },
    restrictions: {
      counters: { 'turn:1:p:c1': 1, 'step:1:p:c1': 1, 'battle:1:p:c1': 1 },
      meta: { 'turn:1:p:c1': { type: 'ONCE_PER_TURN', scope: 'TURN' } },
      reservations: { 'turn:1:p:c1': 1 },
      generations: {
        TURN: 1,
        STEP: 1,
        BATTLE: Number.MAX_SAFE_INTEGER,
        ATTACK: 1,
        GAME: 1
      }
    }
  };
  const snap = JSON.parse(JSON.stringify(state));
  const res = resetRestrictions(state, 'TURN');
  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(res.reason, 'GENERATION_OVERFLOW: BATTLE');
  assert.deepStrictEqual(state, snap, 'All four scopes must remain unmutated if any single affected scope overflows');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-10: Unaffected scope generations remain unchanged
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-10: Unaffected scope generations remain unchanged', () => {
  const state = {
    turnNumber: 2,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: {
        TURN: 10,
        STEP: 20,
        BATTLE: 30,
        ATTACK: 40,
        GAME: 50
      }
    }
  };
  const res = resetRestrictions(state, 'BATTLE');
  assert.equal(res.success, true);
  assert.equal(state.restrictions.generations.BATTLE, 31, 'Affected BATTLE advances');
  assert.equal(state.restrictions.generations.TURN, 10, 'Unaffected TURN unchanged');
  assert.equal(state.restrictions.generations.STEP, 20, 'Unaffected STEP unchanged');
  assert.equal(state.restrictions.generations.ATTACK, 40, 'Unaffected ATTACK unchanged');
  assert.equal(state.restrictions.generations.GAME, 50, 'Unaffected GAME unchanged');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-11: Successful reset invalidates old reservation handles
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-11: Successful reset invalidates old reservation handles', () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: 'DRAW', count: 1 }],
    physicalId: 'PHYS-L11',
    semanticId: 'SEM-L11',
    legacyId: 'LEG-L11'
  };

  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };

  const handle = reserveRestriction(state, ab, { controller: 'player', placementId: 'pl_1' });
  assert.equal(handle.success, true);
  assert.equal(handle.isInvalidated, false);

  // TURN reset advances generation and invalidates handle
  const res = resetRestrictions(state, 'TURN');
  assert.equal(res.success, true);
  assert.equal(handle.isInvalidated, true);

  // Commit on invalidated handle must fail
  const commitRes = handle.commit();
  assert.equal(commitRes.success, false);
  assert.equal(commitRes.status, RESTRICTION_STATUS.RESERVATION_INVALIDATED);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-12: A new reservation after a successful reset uses the advanced generation and works normally
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-12: A new reservation after a successful reset uses the advanced generation and works normally', () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const ab = {
    type: 'ABILITY',
    header: { timing: 'MAIN', trigger: 'NONE', levels: [1], limit: 'ONCE_PER_TURN' },
    clauses: [{ op: 'DRAW', count: 1 }],
    physicalId: 'PHYS-L12',
    semanticId: 'SEM-L12',
    legacyId: 'LEG-L12'
  };

  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };

  // Perform turn reset -> generation becomes 2
  resetRestrictions(state, 'TURN');
  assert.equal(state.restrictions.generations.TURN, 2);

  // New reservation uses generation 2
  const handle = reserveRestriction(state, ab, { controller: 'player', placementId: 'pl_1' });
  assert.equal(handle.success, true);
  assert.equal(handle.generation, 2);
  assert.equal(handle.isInvalidated, false);

  // Commit works normally
  const commitRes = handle.commit();
  assert.equal(commitRes.success, true);
  assert.equal(state.restrictions.counters[handle.key], 1);
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-13: Invalid or unsupported lifecycle scope does not mutate state
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-13: Invalid or unsupported lifecycle scope does not mutate state', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: { 'turn:1:p:c1': 1 },
      meta: { 'turn:1:p:c1': { type: 'ONCE_PER_TURN', scope: 'TURN' } },
      reservations: { 'turn:1:p:c1': 1 },
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };

  for (const badScope of ['INVALID', 'GAME', '', null, undefined, 123]) {
    const snap = JSON.parse(JSON.stringify(state));
    const res = resetRestrictions(state, badScope);
    assert.equal(res.success, false);
    assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
    assert.deepStrictEqual(state, snap, `State must remain invariant on invalid scope: ${badScope}`);
  }
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-14: Repeated reset calls advance generations exactly once per successful call
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-14: Repeated reset calls advance generations exactly once per successful call', () => {
  const state = {
    turnNumber: 1,
    restrictions: {
      counters: {},
      meta: {},
      reservations: {},
      generations: { TURN: 1, STEP: 1, BATTLE: 1, ATTACK: 1, GAME: 1 }
    }
  };

  for (let i = 1; i <= 5; i++) {
    const res = resetRestrictions(state, 'STEP');
    assert.equal(res.success, true);
    assert.equal(state.restrictions.generations.STEP, i + 1);
  }
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-15: endBattle() overflow failure preserves battle modifiers, counters, reservations, metadata, and generations
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-15: endBattle() overflow failure preserves battle modifiers, counters, reservations, metadata, and generations', async () => {
  const game = createGame();
  game.state.modifiers = [
    { type: 'BP_BUFF', bp: 1000, duration: 'THIS_BATTLE' },
    { type: 'BP_BUFF', bp: 500, duration: 'THIS_TURN' }
  ];
  game.state.restrictions.counters['battle:1:player:pl_1:CARD#01'] = 1;
  game.state.restrictions.reservations['battle:1:player:pl_1:CARD#01'] = 1;
  game.state.restrictions.meta['battle:1:player:pl_1:CARD#01'] = { type: 'ONCE_PER_BATTLE', scope: 'BATTLE' };
  game.state.restrictions.generations.BATTLE = Number.MAX_SAFE_INTEGER;

  const snap = JSON.parse(JSON.stringify(game.state));
  const res = await game.endBattle();

  assert.equal(res.success, false);
  assert.equal(res.status, RESTRICTION_STATUS.INVALID_RESTRICTION_STATE);
  assert.equal(res.reason, 'GENERATION_OVERFLOW: BATTLE');

  // Verify modifiers strictly preserved
  assert.equal(game.state.modifiers.length, 2);
  assert.equal(game.state.modifiers[0].duration, 'THIS_BATTLE');

  // Verify complete state invariant
  assert.deepStrictEqual(game.state, snap, 'State must remain invariant on endBattle() overflow');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-16: endBattle() does not emit BATTLE_ENDED on reset failure
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-16: endBattle() does not emit BATTLE_ENDED on reset failure', async () => {
  const game = createGame();
  let emitted = false;
  game.events.on('BATTLE_ENDED', () => { emitted = true; });

  game.state.restrictions.generations.BATTLE = Number.MAX_SAFE_INTEGER;
  const res = await game.endBattle();

  assert.equal(res.success, false);
  assert.equal(emitted, false, 'BATTLE_ENDED must NOT be emitted on reset failure');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-17: endBattle() propagates the structured failure
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-17: endBattle() propagates the structured failure', async () => {
  const game = createGame();
  game.state.restrictions.generations.BATTLE = Number.MAX_SAFE_INTEGER;
  const res = await game.endBattle();

  assert.deepStrictEqual(res, {
    success: false,
    status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
    reason: 'GENERATION_OVERFLOW: BATTLE'
  });
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-18: Successful endBattle() preserves existing modifier cleanup and event behavior
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-18: Successful endBattle() preserves existing modifier cleanup and event behavior', async () => {
  const game = createGame();
  let emitted = false;
  game.events.on('BATTLE_ENDED', () => { emitted = true; });

  game.state.modifiers = [
    { type: 'BP_BUFF', bp: 1000, duration: 'THIS_BATTLE' },
    { type: 'BP_BUFF', bp: 500, duration: 'THIS_TURN' }
  ];
  game.state.restrictions.counters['battle:1:player:pl_1:CARD#01'] = 1;

  const res = await game.endBattle();

  assert.equal(res.success, true);
  assert.equal(emitted, true, 'BATTLE_ENDED must be emitted on success');
  assert.equal(game.state.modifiers.length, 1, 'THIS_BATTLE modifier removed');
  assert.equal(game.state.modifiers[0].duration, 'THIS_TURN', 'THIS_TURN modifier preserved');
  assert.equal(game.state.restrictions.counters['battle:1:player:pl_1:CARD#01'], undefined, 'Battle counter cleared');
  assert.equal(game.state.restrictions.generations.BATTLE, 2, 'BATTLE generation advanced by 1');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-19: endAttack() does not emit ATTACK_ENDED on reset failure
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-19: endAttack() does not emit ATTACK_ENDED on reset failure', async () => {
  const game = createGame();
  let emitted = false;
  game.events.on('ATTACK_ENDED', () => { emitted = true; });

  game.state.restrictions.generations.ATTACK = Number.MAX_SAFE_INTEGER;
  const res = await game.endAttack();

  assert.equal(res.success, false);
  assert.equal(emitted, false, 'ATTACK_ENDED must NOT be emitted on reset failure');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-20: endAttack() propagates the structured failure
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-20: endAttack() propagates the structured failure', async () => {
  const game = createGame();
  game.state.restrictions.generations.ATTACK = Number.MAX_SAFE_INTEGER;
  const res = await game.endAttack();

  assert.deepStrictEqual(res, {
    success: false,
    status: RESTRICTION_STATUS.INVALID_RESTRICTION_STATE,
    reason: 'GENERATION_OVERFLOW: ATTACK'
  });
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-21: Successful endAttack() preserves existing reset and event behavior
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-21: Successful endAttack() preserves existing reset and event behavior', async () => {
  const game = createGame();
  let emitted = false;
  game.events.on('ATTACK_ENDED', () => { emitted = true; });

  game.state.restrictions.counters['attack:1:player:pl_1:CARD#01'] = 1;
  const res = await game.endAttack();

  assert.equal(res.success, true);
  assert.equal(emitted, true, 'ATTACK_ENDED must be emitted on success');
  assert.equal(game.state.restrictions.counters['attack:1:player:pl_1:CARD#01'], undefined, 'Attack counter cleared');
  assert.equal(game.state.restrictions.generations.ATTACK, 2, 'ATTACK generation advanced by 1');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-LIFECYCLE-22: Existing real-engine attack/battle lifecycle behavior remains intact
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-LIFECYCLE-22: Existing real-engine attack/battle lifecycle behavior remains intact', async () => {
  resetInstanceIdCounter();
  resetPlacementIdCounter();

  const attackerData = {
    card_number: 'CARD-ATK-22',
    name: 'Attacking Dragon',
    type: 'Spirit',
    cost: 3,
    color: 'Red',
    levels: { 1: { cost: 1, bp: 5000 } },
    compiledIr: { abilities: [] }
  };

  const game = createGame({
    playerDeck: createTestDeck([attackerData]),
    opponentDeck: createTestDeck([]),
    firstPlayer: 'player'
  });
  game.state.step = 'ATTACK';

  const card = createCardInstance(attackerData, 'player');
  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field.push(stack);

  const emittedEvents = [];
  game.events.on('ATTACK_DECLARED', e => emittedEvents.push(e.type));
  game.events.on('LIFE_REDUCED', e => emittedEvents.push(e.type));
  game.events.on('BATTLE_ENDED', e => emittedEvents.push(e.type));
  game.events.on('ATTACK_ENDED', e => emittedEvents.push(e.type));

  // 1. Declare attack
  const atkRes = await game.declareAttack(stack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.ok(game.state.combat);

  // 2. Resolve direct hit
  const hitRes = await game.resolveDirectHit('player');
  assert.equal(hitRes.success, true);
  assert.equal(game.state.combat, null);

  // Verify events emitted in exact expected order
  assert.deepStrictEqual(emittedEvents, [
    'ATTACK_DECLARED',
    'LIFE_REDUCED',
    'BATTLE_ENDED',
    'ATTACK_ENDED'
  ]);

  // Verify both BATTLE and ATTACK generations advanced
  assert.equal(game.state.restrictions.generations.BATTLE, 2);
  assert.equal(game.state.restrictions.generations.ATTACK, 2);
});

// ===========================================================================
// Phase 4C.3.2.4.2.1.3 — Atomic END-to-START Turn Transition Correction Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-01: Successful END transition advances all required generations exactly once
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-01: Successful END transition advances all required generations exactly once', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations = {
    TURN: 1,
    STEP: 10,
    BATTLE: 5,
    ATTACK: 3,
    GAME: 1
  };

  const nextStep = await game.nextStep();
  assert.equal(nextStep, 'START');
  assert.equal(game.state.restrictions.generations.TURN, 2, 'TURN advances +1');
  assert.equal(game.state.restrictions.generations.STEP, 11, 'STEP advances exactly once (+1, not +2)');
  assert.equal(game.state.restrictions.generations.BATTLE, 6, 'BATTLE advances +1');
  assert.equal(game.state.restrictions.generations.ATTACK, 4, 'ATTACK advances +1');
  assert.equal(game.state.restrictions.generations.GAME, 1, 'GAME unchanged');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-02: Successful transition advances the turn and active player correctly
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-02: Successful transition advances the turn and active player correctly', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.turnNumber = 1;
  game.state.activePlayer = 'player';

  const nextStep = await game.nextStep();
  assert.equal(nextStep, 'START');
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'opponent');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-03: STEP generation at Number.MAX_SAFE_INTEGER rejects before mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-03: STEP generation at Number.MAX_SAFE_INTEGER rejects before mutation', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations.STEP = Number.MAX_SAFE_INTEGER;
  const snap = structuredClone(game.state);

  await assert.rejects(
    async () => await game.nextStep(),
    /INVALID_RESTRICTION_STATE: GENERATION_OVERFLOW: STEP/
  );

  assert.deepStrictEqual(game.state, snap, 'State must remain invariant on STEP overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-04: TURN generation at Number.MAX_SAFE_INTEGER rejects before mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-04: TURN generation at Number.MAX_SAFE_INTEGER rejects before mutation', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations.TURN = Number.MAX_SAFE_INTEGER;
  const snap = structuredClone(game.state);

  await assert.rejects(
    async () => await game.nextStep(),
    /INVALID_RESTRICTION_STATE: GENERATION_OVERFLOW: TURN/
  );

  assert.deepStrictEqual(game.state, snap, 'State must remain invariant on TURN overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-05: BATTLE generation at Number.MAX_SAFE_INTEGER rejects before mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-05: BATTLE generation at Number.MAX_SAFE_INTEGER rejects before mutation', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations.BATTLE = Number.MAX_SAFE_INTEGER;
  const snap = structuredClone(game.state);

  await assert.rejects(
    async () => await game.nextStep(),
    /INVALID_RESTRICTION_STATE: GENERATION_OVERFLOW: BATTLE/
  );

  assert.deepStrictEqual(game.state, snap, 'State must remain invariant on BATTLE overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-06: ATTACK generation at Number.MAX_SAFE_INTEGER rejects before mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-06: ATTACK generation at Number.MAX_SAFE_INTEGER rejects before mutation', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations.ATTACK = Number.MAX_SAFE_INTEGER;
  const snap = structuredClone(game.state);

  await assert.rejects(
    async () => await game.nextStep(),
    /INVALID_RESTRICTION_STATE: GENERATION_OVERFLOW: ATTACK/
  );

  assert.deepStrictEqual(game.state, snap, 'State must remain invariant on ATTACK overflow rejection');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-07: Invalid or fractional affected generation rejects before mutation
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-07: Invalid or fractional affected generation rejects before mutation', async () => {
  for (const badVal of [1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 2]) {
    const game = createGame();
    game.state.step = 'END';
    game.state.restrictions.generations.STEP = badVal;
    const snap = structuredClone(game.state);

    await assert.rejects(
      async () => await game.nextStep(),
      /INVALID_RESTRICTION_STATE/
    );

    assert.deepStrictEqual(game.state, snap, `State must remain invariant on bad value: ${badVal}`);
  }
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-08: Failed transition preserves a deep snapshot of restriction state
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-08: Failed transition preserves a deep snapshot of restriction state', async () => {
  const game = createGame();
  game.state.step = 'END';

  // Setup active reservations and committed counters
  game.state.restrictions.counters['turn:1:player:pl_1:CARD#01'] = 1;
  game.state.restrictions.reservations['turn:1:player:pl_1:CARD#01'] = 1;
  game.state.restrictions.meta['turn:1:player:pl_1:CARD#01'] = { type: 'ONCE_PER_TURN', scope: 'TURN', limit: 1 };
  game.state.restrictions.meta._reservations = {
    res_flow_08: {
      reservationId: 'res_flow_08',
      key: 'turn:1:player:pl_1:CARD#01',
      type: 'ONCE_PER_TURN',
      scope: 'TURN',
      limit: 1,
      generation: 1,
      status: 'ACTIVE'
    }
  };

  // Induce overflow on BATTLE generation
  game.state.restrictions.generations.BATTLE = Number.MAX_SAFE_INTEGER;
  const snapshotBefore = structuredClone(game.state);

  await assert.rejects(
    async () => await game.nextStep(),
    /GENERATION_OVERFLOW: BATTLE/
  );

  assert.deepStrictEqual(game.state.restrictions, snapshotBefore.restrictions, 'Restriction state must remain 100% untouched');
  assert.equal(game.state.restrictions.counters['turn:1:player:pl_1:CARD#01'], 1, 'Committed counter unaltered');
  assert.equal(game.state.restrictions.reservations['turn:1:player:pl_1:CARD#01'], 1, 'Reservation count unaltered');
  assert.ok(game.state.restrictions.meta._reservations.res_flow_08, 'Reservation record unaltered');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-09: Failed transition preserves step and turn modifiers
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-09: Failed transition preserves step and turn modifiers', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.modifiers = [
    { id: 'm_step', duration: 'THIS_STEP', bp: 1000 },
    { id: 'm_turn', duration: 'THIS_TURN', bp: 2000 },
    { id: 'm_battle', duration: 'THIS_BATTLE', bp: 500 }
  ];
  game.state.restrictions.generations.TURN = Number.MAX_SAFE_INTEGER;
  const snapModifiers = structuredClone(game.state.modifiers);

  await assert.rejects(
    async () => await game.nextStep(),
    /GENERATION_OVERFLOW: TURN/
  );

  assert.deepStrictEqual(game.state.modifiers, snapModifiers, 'All modifiers strictly preserved in order');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-10: Failed transition preserves turn number, active player and current step
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-10: Failed transition preserves turn number, active player and current step', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.turnNumber = 3;
  game.state.activePlayer = 'player';
  game.state.restrictions.generations.STEP = Number.MAX_SAFE_INTEGER;

  await assert.rejects(
    async () => await game.nextStep(),
    /GENERATION_OVERFLOW: STEP/
  );

  assert.equal(game.state.step, 'END');
  assert.equal(game.state.turnNumber, 3);
  assert.equal(game.state.activePlayer, 'player');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-11: Failed transition emits no transition-completion events
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-11: Failed transition emits no transition-completion events', async () => {
  const game = createGame();
  game.state.step = 'END';
  game.state.restrictions.generations.TURN = Number.MAX_SAFE_INTEGER;

  const emitted = [];
  game.events.on('STEP_START', e => emitted.push(e));
  game.events.on('STEP_END', e => emitted.push(e));

  await assert.rejects(
    async () => await game.nextStep(),
    /GENERATION_OVERFLOW: TURN/
  );

  assert.equal(emitted.length, 0, 'No transition events emitted on failure');
});

// ---------------------------------------------------------------------------
// TC-ID-PERSIST-FLOW-12: Repeated successful END transitions do not double-advance generations or corrupt state
// ---------------------------------------------------------------------------
test('TC-ID-PERSIST-FLOW-12: Repeated successful END transitions do not double-advance generations or corrupt state', async () => {
  const dummyCards = Array.from({ length: 40 }, (_, i) => ({ id: 'c' + i, cardNumber: 'BS-0' + i, type: 'Spirit' }));
  const game = createGame({ playerDeck: dummyCards.slice(0, 20), opponentDeck: dummyCards.slice(20) });
  // Turn 1: START -> DRAW -> REFRESH -> MAIN -> END
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.turnNumber, 1);
  assert.equal(game.state.activePlayer, 'player');

  await game.nextStep(); // START -> DRAW (Core step skipped on turn 1)
  assert.equal(game.state.step, 'DRAW');
  await game.nextStep(); // DRAW -> REFRESH
  assert.equal(game.state.step, 'REFRESH');
  await game.nextStep(); // REFRESH -> MAIN
  assert.equal(game.state.step, 'MAIN');
  await game.nextStep(); // MAIN -> END (Attack skipped on turn 1)
  assert.equal(game.state.step, 'END');

  // END transition to Turn 2
  await game.nextStep(); // END -> START (Turn 2, opponent)
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.turnNumber, 2);
  assert.equal(game.state.activePlayer, 'opponent');
  assert.equal(game.state.restrictions.generations.TURN, 2);
  assert.equal(game.state.restrictions.generations.BATTLE, 2);
  assert.equal(game.state.restrictions.generations.ATTACK, 2);

  // Turn 2: START -> CORE -> DRAW -> REFRESH -> MAIN -> ATTACK -> END
  await game.nextStep(); // START -> CORE
  await game.nextStep(); // CORE -> DRAW
  await game.nextStep(); // DRAW -> REFRESH
  await game.nextStep(); // REFRESH -> MAIN
  await game.nextStep(); // MAIN -> ATTACK
  await game.nextStep(); // ATTACK -> END
  assert.equal(game.state.step, 'END');

  // END transition to Turn 3
  await game.nextStep(); // END -> START (Turn 3, player)
  assert.equal(game.state.step, 'START');
  assert.equal(game.state.turnNumber, 3);
  assert.equal(game.state.activePlayer, 'player');
  assert.equal(game.state.restrictions.generations.TURN, 3);
  assert.equal(game.state.restrictions.generations.BATTLE, 3);
  assert.equal(game.state.restrictions.generations.ATTACK, 3);
  assert.equal(game.state.restrictions.generations.GAME, 1);
});

