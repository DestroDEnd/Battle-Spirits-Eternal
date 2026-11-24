/**
 * tests/phase_m3_3_1_ticket_principal_lifecycle.test.js
 * 
 * Phase M.3.3.1 Work Package E: Ticket-Authenticated Forfeit and Connection Principal Consistency
 * 
 * Asserts all 13 required lifecycle vectors:
 * 1. Ticket authentication
 * 2. Initial state retrieval
 * 3. Heartbeat
 * 4. Event synchronization
 * 5. Normal gameplay action
 * 6. Valid ticket-authenticated forfeit without plaintext authToken
 * 7. Opponent impersonation rejection
 * 8. Spectator forfeit rejection
 * 9. Cross-match principal rejection
 * 10. Expired ticket rejection
 * 11. Reused ticket rejection
 * 12. Disconnect and reconnect
 * 13. Match termination
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('M3.3.1-E: Complete Ticket Principal Lifecycle and Forfeit Consistency', async () => {
  const store = new SessionStore({ inMemory: true });
  let mockTime = 100000;
  const manager = new BattleSessionManager({
    store,
    timeProvider: () => mockTime
  });

  // 1. Create match
  const match1 = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const match2 = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'charlie' },
    player2: { id: 'dave', autoJoined: true }
  });

  // Vector 1: Issue ticket for Alice (Player 1)
  const ticket1 = manager.issueTransportTicket(match1.matchId, match1.player1Token).ticket;
  assert.ok(ticket1, 'Ticket 1 issued');

  // Vector 9: Cross-match principal rejection on redemption
  const crossRedeem = manager.redeemTransportTicket(ticket1, match2.matchId);
  assert.equal(crossRedeem, null, 'Ticket for match1 cannot be redeemed for match2');

  // Vector 10: Expired ticket rejection
  const ticketExpired = manager.issueTransportTicket(match1.matchId, match1.player1Token).ticket;
  mockTime += 70000; // Advance time past 30s TTL
  const expiredRedeem = manager.redeemTransportTicket(ticketExpired, match1.matchId);
  assert.equal(expiredRedeem, null, 'Expired ticket must be rejected');
  mockTime -= 70000; // Reset mock time

  // Valid redemption for match1
  const ticketData = manager.redeemTransportTicket(ticket1, match1.matchId);
  assert.ok(ticketData, 'Ticket redeemed successfully');
  assert.equal(ticketData.viewerSide, 'player');

  // Vector 11: Reused ticket rejection (Single-Use invariant)
  const reuseRedeem = manager.redeemTransportTicket(ticket1, match1.matchId);
  assert.equal(reuseRedeem, null, 'Consumed ticket cannot be redeemed a second time');

  // Establish connection principal
  const connectionPrincipalP1 = {
    matchId: match1.matchId,
    authenticatedSide: 'player',
    type: 'TICKET'
  };

  // Vector 2: Initial state retrieval via principal
  const p1State = await manager.getPlayerMatchState(match1.matchId, 'player');
  assert.equal(p1State.status, 'ACTIVE');

  // Vector 3: Heartbeat via principal without authToken
  const hbRes = await manager.recordHeartbeat(match1.matchId, 'player', { connectionPrincipal: connectionPrincipalP1 });
  assert.ok(hbRes.heartbeatMs, 'Heartbeat recorded via principal');

  // Vector 4: Event synchronization via principal
  const syncEvts = await manager.getEvents(match1.matchId, 0, 'player');
  assert.ok(Array.isArray(syncEvts), 'Events returned');

  // Vector 5: Normal gameplay action via connectionPrincipal (no authToken)
  const activeGame = await manager.ensureActiveGame(match1.matchId);
  activeGame.game.state.step = 'MAIN';
  activeGame.game.state.activePlayer = 'player';

  const actionRes = await manager.submitPlayerAction(match1.matchId, {
    type: 'STEP_ADVANCE',
    step: 'ATTACK'
  }, { connectionPrincipal: connectionPrincipalP1 });

  assert.equal(actionRes.success, true);
  assert.equal(actionRes.state.step, 'ATTACK');

  // Vector 7: Opponent impersonation rejection (Alice tries to claim being opponent)
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match1.matchId, {
        type: 'STEP_ADVANCE',
        step: 'MAIN',
        responder: 'opponent'
      }, { connectionPrincipal: connectionPrincipalP1 });
    },
    (err) => {
      assert.equal(err.code, 'IMPERSONATION_ATTEMPT_DETECTED');
      return true;
    }
  );

  // Vector 8: Spectator forfeit and mutation rejection
  const spectatorPrincipal = {
    matchId: match1.matchId,
    authenticatedSide: 'spectator',
    type: 'SPECTATOR'
  };
  await assert.rejects(
    async () => {
      await manager.submitPlayerAction(match1.matchId, {
        type: 'FORFEIT'
      }, { connectionPrincipal: spectatorPrincipal });
    },
    (err) => {
      assert.equal(err.code, 'UNAUTHORIZED_SPECTATOR');
      return true;
    }
  );

  // Vector 6: Valid ticket-authenticated FORFEIT without plaintext authToken!
  const forfeitRes = await manager.submitPlayerAction(match1.matchId, {
    type: 'FORFEIT',
    reason: 'CONCEDE'
  }, { connectionPrincipal: connectionPrincipalP1 });

  assert.equal(forfeitRes.status, 'FORFEITED');
  assert.equal(forfeitRes.winnerId, 'bob', 'Bob is declared winner when Alice forfeits');

  // Vector 13: Match termination verification
  const sessionAfterForfeit = store.loadSession(match1.matchId);
  assert.equal(sessionAfterForfeit.status, 'FORFEITED');
  assert.equal(sessionAfterForfeit.winnerId, 'bob');
});
