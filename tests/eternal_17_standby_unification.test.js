import test from 'node:test';
import assert from 'node:assert/strict';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';
import { createGameState, createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { EventBus } from '../engine/events.js';
import { moveCard, moveCore, stageStackStandby, commitStackExit, flushStandbyStacks } from '../engine/zones.js';
import { computeLevel, computeFieldSymbols } from '../engine/continuous.js';
import { checkStateBasedActions } from '../engine/sba.js';

test('Eternal 17.0 Specification Profile Check', () => {
  assert.equal(ETERNAL_RULES.formatVersion, '17.0');
  assert.equal(ETERNAL_RULES.turn.hasMainStep2, false);
  assert.deepEqual(ETERNAL_RULES.turn.steps, ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END']);
  assert.equal(ETERNAL_RULES.zones.unifiedStandbyState, true);
  assert.equal(ETERNAL_RULES.zones.standbyRetainsLevelAndBP, true);
  assert.equal(ETERNAL_RULES.zones.standbyContributesSymbols, true);
  assert.equal(ETERNAL_RULES.burst.simultaneousDeclarationWithHand, true);
  assert.deepEqual(ETERNAL_RULES.burst.declarationPriorityOrder, ['NON_TURN_PLAYER', 'TURN_PLAYER']);
  assert.equal(ETERNAL_RULES.soulCore.depletionAllowedOnActivation, true);
  assert.equal(ETERNAL_RULES.types.flagNexusesCanEnterSoulState, true);
  assert.equal(ETERNAL_RULES.keywords.allowAttributeKeywordStacking, true);
});

test('Eternal 17.0 Standby - Depleted Spirit enters standby preserving previous level and cores until commit', async () => {
  resetInstanceIdCounter();
  const state = createGameState([], [], 'player');
  const events = new EventBus();

  const spiritCard = createCardInstance({
    cardNumber: 'BS01-001',
    name: 'Blade Spirit',
    cost: 3,
    colors: ['Red'],
    symbols: ['Red'],
    levels: {
      1: { cost: 1, bp: 2000 },
      2: { cost: 3, bp: 4000 }
    }
  }, 'player');

  // Start with 3 cores (LV2)
  const stack = createFieldStack(spiritCard, { normal: 3, soul: 0 });
  state.players.player.field.push(stack);

  assert.equal(computeLevel(stack), 2);

  // Remove all 3 cores to Reserve (simulating cost payment or opponent effect)
  await moveCore(state, 3, { zone: 'field', side: 'player', stackId: stack.id }, { zone: 'reserve', side: 'player' }, { cause: 'cost_payment' }, events);

  assert.equal(stack.cores.normal, 0);

  // Run SBA
  const sbaResult = await checkStateBasedActions(state, events, { stageOnly: true });
  assert.equal(sbaResult.changed, true);

  // The stack should now be in standby state, NOT immediately in grave!
  assert.ok(stack.standby, 'Stack should have standby object');
  assert.equal(stack.standby.type, 'depletion');
  assert.equal(stack.standby.previousLevel, 2);

  // In Standby state:
  // 1. computeLevel respects previousLevel when in depletion standby
  assert.equal(computeLevel(stack), 2);

  // 2. Symbols still contribute for cost reduction during standby
  const symbols = computeFieldSymbols(state, 'player');
  assert.equal(symbols.Red, 1);

  // 3. Stack is still on the field
  assert.equal(state.players.player.field.length, 1);
  assert.equal(state.players.player.grave.length, 0);

  // Flush standby (e.g. after derivative effects resolve)
  await flushStandbyStacks(state, events);

  // Now the stack has left the field to grave
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.grave.length, 1);
  assert.equal(state.players.player.grave[0].id, spiritCard.id);
});

test('Eternal 17.0 Standby - Destruction Standby transitions to Depletion if cores removed during standby', async () => {
  resetInstanceIdCounter();
  const state = createGameState([], [], 'player');
  const events = new EventBus();

  const contractSpirit = createCardInstance({
    cardNumber: 'SD65-CX01',
    name: 'Partner Demon Lord Javad',
    cost: 1,
    colors: ['Purple'],
    symbols: ['Purple'],
    levels: { 1: { cost: 1, bp: 2000 } },
    isContractPartner: true
  }, 'player');

  // Card has 1 Soul Core on field
  const stack = createFieldStack(contractSpirit, { normal: 0, soul: 1 });
  state.players.player.field.push(stack);

  // Destroyed by opponent
  await stageStackStandby(state, stack, 'destruction', { by: 'opponent', cause: 'destroy' }, events);
  assert.ok(stack.standby);
  assert.equal(stack.standby.type, 'destruction');
  assert.equal(stack.standby.by, 'opponent');

  // While in standby, player spends the 1 Soul Core to pay cost for a triggered effect
  await moveCore(state, 1, { zone: 'field', side: 'player', stackId: stack.id }, { zone: 'trash', side: 'player' }, { isSoulCore: true, cause: 'cost_payment' }, events);

  // Run SBA
  await checkStateBasedActions(state, events);

  // Standby should now transition to 'depletion' by 'self'
  assert.equal(stack.standby.type, 'depletion');
  assert.equal(stack.standby.by, 'self');

  // Because it was depleted by self, it cannot enter Soul State when flushed!
  await flushStandbyStacks(state, events);

  assert.equal(stack.isSoulState, false);
  assert.equal(state.players.player.grave.length, 1);
});
