import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BSEngineAdapter } from '../engine_adapter.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { INTERACTION_TYPES, INTERACTION_STATUS } from '../engine/interaction.js';

test('UI-INTEGRATION-01: BSEngineAdapter initializes complete duel session with interaction controller', () => {
  const session = BSEngineAdapter.initDuelSession();

  assert.ok(session.game !== null);
  assert.ok(session.state !== null);
  assert.ok(session.flow !== null);
  assert.ok(session.events !== null);
  assert.ok(session.interactionController !== null);
  assert.ok(session.promptManager !== null);
  assert.ok(session.aiDecider !== null);
  assert.ok(session.windows !== null);

  assert.equal(session.state.turnNumber, 1);
  assert.equal(session.state.activePlayer, 'player');
  assert.equal(session.state.step, 'START');
});

test('UI-INTEGRATION-02: Event-driven UI updates on engine events and interactive prompts', async () => {
  const session = BSEngineAdapter.initDuelSession();
  const game = session.game;
  const state = session.state;
  const events = session.events;

  const capturedEvents = [];
  events.on('*', (ev) => {
    capturedEvents.push(ev.type);
  });

  // Advance START -> REFRESH -> MAIN on Turn 1
  await game.advanceStep();
  while (state.step !== 'MAIN') {
    await game.advanceStep();
  }

  assert.ok(capturedEvents.includes('STEP_START'));
  assert.equal(state.step, 'MAIN');

  // Set up an opponent spirit to target
  const oppCard = createCardInstance({ id: 'opp_tgt', card_number: 'OPP-X', name: 'Opp Spirit', type: 'Spirit' }, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  state.players.opponent.field.push(oppStack);

  let promptReceived = null;
  events.on('INTERACTION_REQUESTED', (ev) => {
    promptReceived = ev.interaction;
  });

  // Resolve ability requiring target selection
  const ability = {
    header: { timing: 'WHEN_SUMMONED' },
    clauses: [
      {
        op: {
          op: 'EXHAUST',
          target: { side: 'opp', types: ['Spirit'] }
        }
      }
    ]
  };

  const resolvePromise = game.resolver.resolveAbility(state, ability, { controller: 'player' });

  // Microtask tick
  await new Promise(r => setImmediate(r));

  assert.ok(promptReceived !== null, 'UI must receive INTERACTION_REQUESTED event');
  assert.equal(promptReceived.player, 'player');
  assert.ok(promptReceived.type === 'SELECT_EXHAUST' || promptReceived.type === 'SELECT_TARGET');

  // Submit response via game API
  const submitRes = await game.submitInteractionResponse(promptReceived.id, {
    selected: [promptReceived.candidates[0].candidateId]
  });
  assert.equal(submitRes.success, true);

  const finalRes = await resolvePromise;
  assert.equal(finalRes.success, true);
  assert.equal(oppStack.state, 'EXHAUSTED', 'Target spirit must become EXHAUSTED');
});
