import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';
async function test() {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({ mode: 'HUMAN_VS_HUMAN' });
  const active = await manager.ensureActiveGame(match.matchId);
  console.log('Alice hand:', active.game.state.players.player.hand.map(c => ({ id: c.id, name: c.name, type: c.type })));
}
test();
