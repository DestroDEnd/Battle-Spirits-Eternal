import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';
async function test() {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice', deck: [{ name: 'Siekwurm Nova', bp: 6000, type: 'Spirit', cost: 1 }] }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  console.log('Pending interactions:', JSON.stringify(active.game.state.pendingInteractions, null, 2));
}
test();
