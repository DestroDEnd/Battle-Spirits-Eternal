import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';
import { createCardInstance } from '../../engine/state.js';

async function testRetry() {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;

  game.state.activePlayer = 'player';
  game.state.step = 'MAIN';

  const card = createCardInstance({ name: 'Affordable Spell', type: 'Magic', cost: 1 }, 'player');
  game.state.players.player.hand = [card];
  game.state.players.player.reserve = { normal: 0, soul: 0 };

  try {
    await manager.submitPlayerAction(match.matchId, {
      actionId: 'act_1',
      type: 'PLAY_CARD',
      cardId: card.id
    }, { authToken: match.player1Token });
  } catch (e) {
    console.log('Attempt 1 failed with:', e.message);
  }

  console.log('Hand before retry:', game.state.players.player.hand.map(c => ({ id: c.id, name: c.name })));
  console.log('Reserve before update:', game.state.players.player.reserve);
  game.state.players.player.reserve.normal = 1;
  console.log('Reserve after update:', game.state.players.player.reserve);

  try {
    const res = await manager.submitPlayerAction(match.matchId, {
      actionId: 'act_1',
      type: 'PLAY_CARD',
      cardId: card.id
    }, { authToken: match.player1Token });
    console.log('Attempt 2 success:', res.success);
  } catch (e) {
    console.log('Attempt 2 failed with:', e.message);
  }
}

testRetry().catch(console.error);
