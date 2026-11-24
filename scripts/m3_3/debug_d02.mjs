import { createCardInstance } from '../../engine/state.js';
import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';

async function run() {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game || active;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const card = createCardInstance({ name: 'Affordable Spell', type: 'Magic', cost: 1 }, 'player');
  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 0, soul: 0 };

  const retryActionId = 'act_retry_test_1';
  try {
    await manager.submitPlayerAction(match.matchId, {
      actionId: retryActionId,
      type: 'PLAY_CARD',
      cardId: card.id
    }, { authToken: match.player1Token });
  } catch (err) {
    console.log('Attempt 1 failed:', err.message);
  }

  console.log('card.id:', card.id);
  console.log('hand after rollback:', game.state.players.player.hand.map(c => ({ id: c.id, name: c.name })));
  
  // Update reserve on active.game.state
  active.game.state.players.player.reserve.normal = 1;

  try {
    const res = await manager.submitPlayerAction(match.matchId, {
      actionId: retryActionId,
      type: 'PLAY_CARD',
      cardId: card.id
    }, { authToken: match.player1Token });
    console.log('Attempt 2 success:', res.success);
  } catch (err) {
    console.log('Attempt 2 failed:', err.message);
  }
}
run();
