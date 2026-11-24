/**
 * scripts/m2/03_reproduce_turn_authority_bypass.mjs
 * Reproduction script demonstrating wrong-player action submission (STEP_ADVANCE by non-active player).
 */
import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';

async function reproduce() {
  console.log('[WP-B1] Running turn authority bypass reproduction...');
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const p1Token = match.player1Token;
  const p2Token = match.player2Token;

  const session = store.loadSession(match.matchId);
  console.log('Match activePlayer:', session.activePlayer); // 'player'

  // Attempt STEP_ADVANCE using Bob's (opponent's) token!
  let bypassSuccess = false;
  let errorMsg = null;
  try {
    const res = await manager.submitPlayerAction(match.matchId, {
      type: 'STEP_ADVANCE',
      step: 'MAIN'
    }, { authToken: p2Token });

    bypassSuccess = res.success;
    console.log('Non-active player action result:', res);
  } catch (err) {
    errorMsg = err.message;
    console.log('Action was rejected with error:', err.message);
  }

  return {
    bypassSuccess,
    errorMsg
  };
}

reproduce().then(res => {
  console.log('Reproduction result:', res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
