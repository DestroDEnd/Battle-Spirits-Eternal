/**
 * tests/prompt_manager_compatibility.test.js
 * 
 * Verifies backward compatibility and unified lifecycle between
 * PromptManager and InteractionController in Battle Spirits Eternal.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PromptManager } from '../engine/prompt_manager.js';
import { InteractionController, INTERACTION_TYPES, INTERACTION_STATUS } from '../engine/interaction.js';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

test('COMPAT-01: Legacy prompt request and response preserves exact legacy response contract', async () => {
  const pm = new PromptManager();
  const promise = pm.request({
    type: 'CONFIRM_OPTIONAL',
    title: 'Activate legacy effect?',
    chooser: 'player'
  });

  assert.equal(pm.hasPendingPrompt('player'), true);
  const active = pm.getActivePrompt();
  assert.ok(active);
  assert.equal(active.type, 'CONFIRM_OPTIONAL');

  // Resolve with legacy simple object
  const ok = pm.resolve(active.id, { accepted: true });
  assert.equal(ok, true);

  const res = await promise;
  // Strictly deep-equal to legacy response shape without unsolicited injected fields
  assert.deepEqual(res, { accepted: true });
  assert.equal(pm.hasPendingPrompt(), false);
});

test('COMPAT-02: New structured interaction request and response returns normalized structure', async () => {
  const ctrl = new InteractionController();
  const promise = ctrl.request({
    type: INTERACTION_TYPES.SELECT_CARDS,
    candidates: [{ candidateId: 'c_1', name: 'Card 1' }, { candidateId: 'c_2', name: 'Card 2' }],
    minSelections: 1,
    maxSelections: 1,
    player: 'player'
  });

  const active = ctrl.getActiveInteraction('player');
  assert.ok(active);
  assert.equal(active.type, INTERACTION_TYPES.SELECT_CARDS);

  const res = ctrl.respond(active.id, { selected: ['c_1'] });
  assert.equal(res.success, true);
  assert.deepEqual(res.response, { accepted: true, selected: ['c_1'] });

  const resolved = await promise;
  assert.deepEqual(resolved, { accepted: true, selected: ['c_1'] });
});

test('COMPAT-03: Optional interaction declined is properly recorded and resolved', async () => {
  const pm = new PromptManager();
  const promise = pm.request({
    type: 'CONFIRM_OPTIONAL',
    optional: true,
    chooser: 'player'
  });

  const active = pm.getActivePrompt();
  assert.ok(active);

  // Player declines
  const ok = pm.resolve(active.id, { accepted: false, declined: true });
  assert.equal(ok, true);

  const res = await promise;
  assert.equal(res.declined, true);
  assert.equal(pm.hasPendingPrompt(), false);
});

test('COMPAT-04: Mandatory interaction rejected when invalid response is submitted', async () => {
  const pm = new PromptManager();
  let resolved = false;

  const promise = pm.request({
    type: INTERACTION_TYPES.SELECT_CARDS,
    optional: false,
    minSelections: 1,
    maxSelections: 1,
    candidates: [{ candidateId: 'target_1' }],
    chooser: 'player'
  }).then(val => {
    resolved = true;
    return val;
  });

  const active = pm.getActivePrompt();
  assert.ok(active);

  // Attempt to decline mandatory prompt
  const declineResult = pm.resolve(active.id, { accepted: false });
  assert.equal(declineResult, false, 'Declining mandatory interaction must fail validation');
  assert.equal(resolved, false, 'Promise must not resolve on invalid decline');

  // Attempt to select an illegal candidate
  const illegalResult = pm.resolve(active.id, { selected: ['non_existent_card'] });
  assert.equal(illegalResult, false, 'Selecting illegal candidate must fail validation');
  assert.equal(resolved, false, 'Promise must remain pending');

  // Now submit valid selection
  const validResult = pm.resolve(active.id, { selected: ['target_1'] });
  assert.equal(validResult, true);

  const res = await promise;
  assert.equal(resolved, true);
  assert.deepEqual(res, { selected: ['target_1'] });
});

test('COMPAT-05: Valid card selection through candidate pool boundary', async () => {
  const pm = new PromptManager();
  const promise = pm.request({
    type: 'SELECT_CARDS',
    candidates: [
      { candidateId: 'cand_a', name: 'Alpha Spirit' },
      { candidateId: 'cand_b', name: 'Beta Spirit' }
    ],
    minSelections: 1,
    maxSelections: 2,
    chooser: 'player'
  });

  const active = pm.getActivePrompt();
  const ok = pm.resolve(active.id, { selected: ['cand_b'] });
  assert.equal(ok, true);

  const res = await promise;
  assert.deepEqual(res, { selected: ['cand_b'] });
});

test('COMPAT-06: Duplicate response is rejected via replay protection', async () => {
  const pm = new PromptManager();
  const promise = pm.request({
    type: 'CONFIRM_ACTION',
    chooser: 'player'
  });

  const active = pm.getActivePrompt();
  const first = pm.resolve(active.id, { accepted: true });
  assert.equal(first, true);

  // Repeat submission of same prompt ID
  const duplicate = pm.resolve(active.id, { accepted: true });
  assert.equal(duplicate, false, 'Duplicate resolution of already-resolved prompt must return false');

  const res = await promise;
  assert.deepEqual(res, { accepted: true });
});

test('COMPAT-07: Stale response returns failure and does not mutate state', () => {
  const pm = new PromptManager();
  const staleResult = pm.resolve('non_existent_id_9999', { accepted: true });
  assert.equal(staleResult, false);
});

test('COMPAT-08: Async resolver pause and resume on unified interaction controller', async () => {
  const game = createGame({ interactive: true, strictRules: false, unsafeTestBypassDeckValidation: true });
  const state = game.state;

  const targetCard = createCardInstance({ id: 'target_sp', card_number: 'TG-1', name: 'Target Spirit', type: 'Spirit' }, 'opponent');
  const targetStack = createFieldStack(targetCard, { normal: 2, soul: 0 });
  state.players.opponent.field.push(targetStack);

  let interactionDispatched = null;
  game.events.on('INTERACTION_REQUESTED', (ev) => {
    interactionDispatched = ev.interaction;
  });

  const ability = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [
      {
        op: {
          op: 'DESTROY',
          target: { side: 'opp', types: ['Spirit'] }
        }
      }
    ]
  };

  // Launch async resolution
  const resolvePromise = game.resolver.resolveAbility(state, ability, { controller: 'player' });

  // Microtask tick to ensure pause
  await new Promise(r => setImmediate(r));

  assert.ok(interactionDispatched !== null);
  assert.equal(game.state.pendingInteractions.length, 1);
  assert.equal(targetStack.state, 'REFRESHED');

  // Submit response via game API
  const submitRes = await game.submitInteractionResponse(interactionDispatched.id, {
    selected: [interactionDispatched.candidates[0].candidateId]
  });
  assert.equal(submitRes.success, true);

  // Resolver resumes and completes
  const finalResult = await resolvePromise;
  assert.equal(finalResult.success, true);
  assert.equal(game.state.pendingInteractions.length, 0);
  assert.equal(state.players.opponent.field.length, 0, 'Target spirit must be destroyed');
});

test('COMPAT-09: Nested prompt and sequential interaction lifecycle', async () => {
  const pm = new PromptManager();

  const promise1 = pm.request({ id: 'p_1', type: 'CONFIRM_OPTIONAL', chooser: 'player' });
  const promise2 = pm.request({ id: 'p_2', type: 'SELECT_CARDS', chooser: 'player', candidates: [{ candidateId: 'c1' }] });

  assert.equal(pm.hasPendingPrompt(), true);
  assert.equal(pm.getActivePrompt().id, 'p_1');

  // Resolve first prompt
  assert.equal(pm.resolve('p_1', { accepted: true }), true);
  const res1 = await promise1;
  assert.deepEqual(res1, { accepted: true });

  // Second prompt now active
  assert.equal(pm.getActivePrompt().id, 'p_2');
  assert.equal(pm.resolve('p_2', { selected: ['c1'] }), true);
  const res2 = await promise2;
  assert.deepEqual(res2, { selected: ['c1'] });

  assert.equal(pm.hasPendingPrompt(), false);
  assert.equal(pm.getActivePrompt(), null);
});
