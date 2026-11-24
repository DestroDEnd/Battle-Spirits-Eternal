/**
 * scripts/m2/04_reproduce_failed_action_poisoning.mjs
 * Reproduction script demonstrating failed-action poisoning of actionId idempotency key.
 */
import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';

async function reproduce() {
  console.log('[WP-C1] Running failed-action poisoning reproduction...');
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;

  // Create a pending interaction for alice
  game.interactionController.request({
    matchId: match.matchId,
    decisionOwner: 'player',
    requestType: 'SELECT_TARGET',
    candidates: [{ candidateId: 'valid_target_1' }]
  });

  const interactionId = game.state.pendingInteractions[0].id;
  const fixedActionId = 'act_fixed_retry_test_123';

  // Attempt 1: Submit an invalid response that will be rejected by the engine
  let firstAttemptError = null;
  try {
    await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: fixedActionId,
      interactionId,
      response: {
        selected: ['non_existent_invalid_target']
      }
    }, { authToken: match.player1Token });
  } catch (err) {
    firstAttemptError = err.message;
    console.log('First attempt rejected as expected:', err.message);
  }

  // Attempt 2: Retry with valid response using the EXACT SAME actionId
  let secondAttemptResult = null;
  let secondAttemptError = null;
  try {
    secondAttemptResult = await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      actionId: fixedActionId,
      interactionId,
      response: {
        selected: ['valid_target_1']
      }
    }, { authToken: match.player1Token });
    console.log('Second attempt succeeded:', secondAttemptResult.success);
  } catch (err) {
    secondAttemptError = err.message;
    console.log('Second attempt failed with error:', err.message);
  }

  const isPoisoned = secondAttemptResult?.duplicate === true || (secondAttemptError && secondAttemptError.includes('DUPLICATE'));
  console.log('Action ID was poisoned by previous failed attempt:', isPoisoned);

  return {
    firstAttemptError,
    secondAttemptResult,
    secondAttemptError,
    isPoisoned
  };
}

reproduce().then(res => {
  console.log('Reproduction summary:', res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
