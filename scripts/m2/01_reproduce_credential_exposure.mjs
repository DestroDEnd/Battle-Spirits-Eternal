/**
 * scripts/m2/01_reproduce_credential_exposure.mjs
 * Reproduction script proving credential exposure in state_json and API responses.
 */
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../../engine/session_manager.js';
import { SessionStore } from '../../engine/session_store.js';

async function reproduce() {
  console.log('[WP-A] Running credential exposure reproduction...');
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });

  const match = await manager.createMatch({
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const p1Token = match.player1Token;
  const p2Token = match.player2Token;

  console.log('Created match:', match.matchId);
  console.log('p1Token:', p1Token);
  console.log('p2Token:', p2Token);

  // 1. Check SQLite state_json
  const rawRow = store.db.prepare('SELECT state_json FROM match_sessions WHERE id = ?').get(match.matchId);
  const stateJsonStr = rawRow.state_json;
  const containsP1TokenInStateJson = stateJsonStr.includes(p1Token);
  const containsP2TokenInStateJson = stateJsonStr.includes(p2Token);

  console.log('state_json contains p1Token:', containsP1TokenInStateJson);
  console.log('state_json contains p2Token:', containsP2TokenInStateJson);

  // 2. Check getPlayerMatchState for anonymous spectator (null)
  const spectatorState = await manager.getPlayerMatchState(match.matchId, null);
  const spectatorJson = JSON.stringify(spectatorState);
  const spectatorContainsP1Token = spectatorJson.includes(p1Token);
  const spectatorContainsP2Token = spectatorJson.includes(p2Token);
  console.log('Spectator state contains p1Token:', spectatorContainsP1Token);
  console.log('Spectator state contains p2Token:', spectatorContainsP2Token);

  // 3. Check getPlayerMatchState for player 1 (does player 1 see opponent token?)
  const p1State = await manager.getPlayerMatchState(match.matchId, p1Token);
  const p1Json = JSON.stringify(p1State);
  const p1ContainsP2Token = p1Json.includes(p2Token);
  console.log('Player 1 state contains opponent (p2) token:', p1ContainsP2Token);

  // 4. Check getPlayerMatchState for player 2 (does player 2 see opponent token?)
  const p2State = await manager.getPlayerMatchState(match.matchId, p2Token);
  const p2Json = JSON.stringify(p2State);
  const p2ContainsP1Token = p2Json.includes(p1Token);
  console.log('Player 2 state contains opponent (p1) token:', p2ContainsP1Token);

  return {
    containsP1TokenInStateJson,
    containsP2TokenInStateJson,
    spectatorContainsP1Token,
    spectatorContainsP2Token,
    p1ContainsP2Token,
    p2ContainsP1Token
  };
}

reproduce().then(res => {
  console.log('Reproduction result:', res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
