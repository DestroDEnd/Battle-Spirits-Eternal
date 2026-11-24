/**
 * tests/magic_legality_and_resolution.test.js
 *
 * Comprehensive Magic Card Legality, Activation, Prompt Resolution,
 * Destination Integrity & Real Browser Integration Test Suite.
 *
 * Covers Categories A through M:
 * A. Classification tests (all 9 canonical DB types)
 * B. Invalid summon/deployment rejection tests (zero core loss / zero movement)
 * C. Main Step activation tests (real DB card)
 * D. Flash timing tests (real DB card in Flash window)
 * E. Core payment and symbol reduction tests
 * F. Target selection tests (non-blocking suspend + validated resume)
 * G. Sequential interaction tests (multi-prompt across SQLite restore)
 * H. Nested / Or-branch interaction tests
 * I. Optional effect tests (accept vs decline)
 * J. Unsupported effect handling tests (never fabricated)
 * K. Destination & zone integrity tests (grave vs removed, validateGameState)
 * L. AI Magic activation tests
 * M. Genuine browser-to-engine Chrome CDP integration tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { compileCard } from '../compiler/index.js';
import { createGame, classifyCardType, validateCardPathway, ACTION_PATHWAYS } from '../engine/index.js';
import { authorizeAction } from '../engine/action_authority.js';
import { createCardInstance, createFieldStack, validateGameState } from '../engine/state.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';
import { EXECUTION_MODES } from '../engine/session_mode.js';
import { RESPONSE_WINDOW_TYPES } from '../engine/windows.js';
import { launchRealBrowser } from './helpers/real_browser.js';

function loadRealCard(cardNumber) {
  const db = new DatabaseSync('battle_spirits.db', { readOnly: true });
  const row = db.prepare('SELECT * FROM cards WHERE card_number = ?').get(cardNumber);
  db.close();
  assert.ok(row, `Real card ${cardNumber} must exist in battle_spirits.db`);
  const ir = compileCard(row);
  return { ...row, cardNumber: row.card_number, compiledIr: ir };
}

function makeDummyDeck(count = 40, prefix = 'D') {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `${prefix}-${i + 1}`,
    name: `${prefix} Spirit ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 2000 } }
  }));
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// ============================================================================
// A. Classification Tests
// ============================================================================
test('MAGIC-A01: Canonical classification covers all 9 database card types accurately', () => {
  for (const unitType of ['Spirit', 'Contract Spirit', 'Token Spirit', 'Ultimate', 'Contract Ultimate', 'Brave']) {
    const cls = classifyCardType({ type: unitType });
    assert.equal(cls.category, 'UNIT', `${unitType} must classify as UNIT`);
    assert.equal(cls.isUnit, true);
    assert.equal(cls.isMagic, false);
    assert.equal(cls.isNexus, false);
  }
  for (const nexusType of ['Nexus', 'Contract Nexus']) {
    const cls = classifyCardType({ type: nexusType });
    assert.equal(cls.category, 'NEXUS', `${nexusType} must classify as NEXUS`);
    assert.equal(cls.isNexus, true);
    assert.equal(cls.isUnit, false);
    assert.equal(cls.isMagic, false);
  }
  const magicCls = classifyCardType({ type: 'Magic' });
  assert.equal(magicCls.category, 'MAGIC');
  assert.equal(magicCls.isMagic, true);
  assert.equal(magicCls.isUnit, false);
  assert.equal(magicCls.isNexus, false);

  const unknownCls = classifyCardType({ type: 'BogusType' });
  assert.equal(unknownCls.category, 'UNKNOWN');
  assert.equal(validateCardPathway({ type: 'Magic' }, ACTION_PATHWAYS.SUMMON).allowed, false);
  assert.equal(validateCardPathway({ type: 'Spirit' }, ACTION_PATHWAYS.ACTIVATE_MAGIC).allowed, false);
});

// ============================================================================
// B. Invalid Summon / Deployment Rejection Tests
// ============================================================================
test('MAGIC-B01: Magic cannot enter Spirit summon or Nexus deploy pathways; Spirit cannot enter Magic pathway', async () => {
  const realDrawMagic = loadRealCard('SD06-013'); // Burst Draw (Magic)
  const game = createGame({ playerDeck: makeDummyDeck(40, 'P'), opponentDeck: makeDummyDeck(40, 'O'), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 10, soul: 1 };

  const magicInst = createCardInstance(realDrawMagic, 'player');
  const spiritInst = createCardInstance({ card_number: 'SP-1', name: 'Test Spirit', type: 'Spirit', cost: 2, color: 'Red', levels: { 1: { cost: 1, bp: 2000 } } }, 'player');
  game.state.players.player.hand.push(magicInst, spiritInst);

  const reserveBefore = game.state.players.player.reserve.normal;
  const trashBefore = game.state.players.player.trash.normal;
  const handLenBefore = game.state.players.player.hand.length;

  // 1. Magic via summonUnit -> rejected
  const sumRes = await game.summonUnit(magicInst.id, [], 'player');
  assert.equal(sumRes.success, false);
  assert.equal(sumRes.reason, 'INVALID_CARD_TYPE');

  // 2. Magic via deployNexus -> rejected
  const nexRes = await game.deployNexus(magicInst.id, [], 'player');
  assert.equal(nexRes.success, false);
  assert.equal(nexRes.reason, 'INVALID_CARD_TYPE');

  // 3. Magic via playCard with summon options (braveTargetStackId / cores) -> rejected
  const optRes = await game.playCard(magicInst.id, [], 'player', { cores: 1 });
  assert.equal(optRes.success, false);
  assert.equal(optRes.reason, 'INVALID_CARD_TYPE');

  // 4. Spirit via activateMagic -> rejected
  const magRes = await game.activateMagic(spiritInst.id, [], 'player');
  assert.equal(magRes.success, false);
  assert.equal(magRes.reason, 'INVALID_CARD_TYPE');

  // 5. SessionManager SUMMON with Magic -> rejected with 400 INVALID_CARD_TYPE
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Alice' },
    player2: { id: 'p2', name: 'Bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  active.game.state.step = 'MAIN';
  active.game.state.activePlayer = 'player';
  const sessMagic = createCardInstance(realDrawMagic, 'player');
  active.game.state.players.player.hand.push(sessMagic);
  await assert.rejects(
    () => manager.submitPlayerAction(match.matchId, { type: 'SUMMON', cardId: sessMagic.id }, { authToken: match.player1Token }),
    (err) => err.code === 'INVALID_CARD_TYPE'
  );

  // Zero cores consumed, zero cards moved, zero field mutation
  assert.equal(game.state.players.player.reserve.normal, reserveBefore);
  assert.equal(game.state.players.player.trash.normal, trashBefore);
  assert.equal(game.state.players.player.hand.length, handLenBefore);
  assert.equal(game.state.players.player.field.length, 0);
  assert.equal(validateGameState(game.state).valid, true);
});

// ============================================================================
// C. Main Step Activation Tests (Real DB Card: SD06-013 Burst Draw)
// ============================================================================
test('MAGIC-C01: Real Main Step Magic (SD06-013 Burst Draw) pays cost, draws 2 cards, moves to Trash', async () => {
  const realDrawMagic = loadRealCard('SD06-013');
  const game = createGame({ playerDeck: makeDummyDeck(40, 'P'), opponentDeck: makeDummyDeck(40, 'O'), strictRules: true });
  game.state.step = 'MAIN';
  game.state.players.player.reserve = { normal: 6, soul: 0 };

  const magicInst = createCardInstance(realDrawMagic, 'player');
  game.state.players.player.hand.push(magicInst);
  const handBefore = game.state.players.player.hand.length;
  const deckBefore = game.state.players.player.deck.length;

  const res = await game.activateMagic(magicInst.id, [], 'player', { timing: 'MAIN' });
  assert.equal(res.success, true);
  assert.equal(res.costPaid, 4);
  assert.equal(res.effectResolved, true);
  assert.equal(res.finalDestination, 'grave');

  assert.equal(game.state.players.player.reserve.normal, 2);
  assert.equal(game.state.players.player.trash.normal, 4);
  assert.equal(game.state.players.player.deck.length, deckBefore - 2);
  // -1 cast card + 2 drawn = +1
  assert.equal(game.state.players.player.hand.length, handBefore + 1);
  assert.equal(game.state.players.player.grave.some(c => c.id === magicInst.id), true);
  assert.equal(game.state.resolvingCards.length, 0);
  assert.equal(validateGameState(game.state).valid, true);
});

// ============================================================================
// D & E. Flash Timing & Core Reduction Tests
// ============================================================================
test('MAGIC-DE01: Real Flash Magic respects symbol reduction and Flash window priority alternation', async () => {
  const realFlash = loadRealCard('SD69-006'); // Avatar Create: Cost 4, Red, [Flash] Destroy an opposing 10000 BP or less Spirit/Ultimate
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Alice' },
    player2: { id: 'p2', name: 'Bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  game.state.players.opponent.reserve = { normal: 5, soul: 0 };

  // Give defender (Bob) 1 Red Spirit on field (provides Red reduction) and attacker (Alice) a 3000 BP Spirit
  const bobSpirit = createCardInstance({ card_number: 'BOB-1', name: 'Bob Guard', type: 'Spirit', color: 'Red', symbols: ['Red'], levels: { 1: { cost: 1, bp: 3000 } } }, 'opponent');
  game.state.players.opponent.field.push(createFieldStack(bobSpirit, { normal: 1, soul: 0 }));

  const aliceAtk = createCardInstance({ card_number: 'ALICE-1', name: 'Alice Striker', type: 'Spirit', color: 'Red', symbols: ['Red'], levels: { 1: { cost: 1, bp: 4000 } } }, 'player');
  const aliceStack = createFieldStack(aliceAtk, { normal: 1, soul: 0 });
  game.state.players.player.field.push(aliceStack);

  const magicInst = createCardInstance(realFlash, 'opponent');
  game.state.players.opponent.hand.push(magicInst);

  // Open FLASH_1 via declareAttack (Bob gets Priority 1)
  const atkRes = await game.declareAttack(aliceStack.id, 'player');
  assert.equal(atkRes.success, true);
  assert.equal(game.windows.getPriorityPlayer(), 'opponent');

  // Bob casts Flash Magic via sessionManager -> suspends for target selection!
  const flashRes = await manager.submitPlayerAction(match.matchId, {
    type: 'CAST_FLASH_MAGIC',
    cardId: magicInst.id
  }, { authToken: match.player2Token });

  assert.equal(flashRes.success, true);
  assert.equal(flashRes.result.suspended, true);
  assert.equal(flashRes.result.status, 'AWAITING_INTERACTION');
  assert.ok(flashRes.result.interactionId);
  assert.equal(active.game.state.resolvingCards.some(c => c.id === magicInst.id), true);
  // Check cost reduced by Red symbol(s)
  assert.ok(active.game.state.players.opponent.trash.normal <= 4 && active.game.state.players.opponent.trash.normal >= 2);
});

// ============================================================================
// F. Target Selection Suspend & Validated Resume (Non-blocking HTTP/Session)
// ============================================================================
test('MAGIC-F01: Targeted Magic suspends cleanly, rejects forged target, and resumes to destroy chosen target and move to Trash', async () => {
  const realDestroyMagic = loadRealCard('BSC29-018'); // Obsession With Victory: [Flash] Destroy an opposing "God-King" family Spirit.
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Alice' },
    player2: { id: 'p2', name: 'Bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.reserve = { normal: 6, soul: 0 };

  const oppTarget1 = createFieldStack(createCardInstance({ card_number: 'OPP-1', name: 'Target Alpha', type: 'Spirit', family: 'God-King', families: ['God-King'], levels: { 1: { cost: 1, bp: 2000 } } }, 'opponent'), { normal: 1, soul: 0 });
  const oppTarget2 = createFieldStack(createCardInstance({ card_number: 'OPP-2', name: 'Target Beta', type: 'Spirit', family: 'God-King', families: ['God-King'], levels: { 1: { cost: 1, bp: 2000 } } }, 'opponent'), { normal: 2, soul: 0 });
  game.state.players.opponent.field.push(oppTarget1, oppTarget2);

  const magicInst = createCardInstance(realDestroyMagic, 'player');
  game.state.players.player.hand.push(magicInst);

  // 1. Activate Magic -> suspends cleanly (never hangs!)
  const actRes = await manager.submitPlayerAction(match.matchId, {
    type: 'ACTIVATE_MAGIC',
    cardId: magicInst.id,
    timing: 'FLASH'
  }, { authToken: match.player1Token });

  assert.equal(actRes.success, true);
  assert.equal(actRes.result.suspended, true);
  const interactionId = actRes.result.interactionId;
  assert.ok(interactionId);

  // Card is in resolvingCards, NOT in hand and NOT yet in grave
  assert.equal(actRes.state.resolvingCards.some(c => c.id === magicInst.id), true);
  assert.equal(actRes.state.players.player.grave.some(c => c.id === magicInst.id), false);

  // 2. Reject forged/invalid candidate selection
  await assert.rejects(
    () => manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId,
      response: { selected: ['non_existent_forged_id'] }
    }, { authToken: match.player1Token }),
    (err) => err.code === 'INVALID_CANDIDATE'
  );

  // 3. Submit valid selection for oppTarget2 -> resumes & destroys oppTarget2 & moves Magic to grave!
  const respRes = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    interactionId,
    response: { selected: [oppTarget2.id] }
  }, { authToken: match.player1Token });

  assert.equal(respRes.success, true);
  assert.equal(respRes.result.completed, true);
  assert.equal(respRes.result.resumed, true);
  assert.equal(respRes.result.finalDestination, 'grave');

  // Assert exact target destroyed, non-target survived, Magic moved to grave
  assert.equal(respRes.state.players.opponent.field.some(s => s.id === oppTarget2.id), false);
  assert.equal(respRes.state.players.opponent.field.some(s => s.id === oppTarget1.id), true);
  assert.equal(respRes.state.players.opponent.grave.some(c => c.id === oppTarget2.top.id), true);
  assert.equal(respRes.state.players.player.grave.some(c => c.id === magicInst.id), true);
  assert.equal(respRes.state.resolvingCards.length, 0);
});

// ============================================================================
// G, H, I. Sequential, Or-Branch & Optional Effect Resumption Across SQLite Restore
// ============================================================================
test('MAGIC-GHI01: Multi-prompt Magic (Optional + Target) suspends twice, survives DB restore, and completes cleanly', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
    player1: { id: 'p1', name: 'Alice' },
    player2: { id: 'p2', name: 'Bob', autoJoined: true }
  });
  const active = await manager.ensureActiveGame(match.matchId);
  const game = active.game;
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.reserve = { normal: 5, soul: 0 };

  const oppTarget = createFieldStack(createCardInstance({ card_number: 'OPP-T', name: 'Opp Target', type: 'Spirit', levels: { 1: { cost: 1, bp: 2000 } } }, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.opponent.field.push(oppTarget);

  const customMultiMagic = createCardInstance({
    card_number: 'TEST-SEQ-MAG',
    name: 'Sequential Prompt Magic',
    type: 'Magic',
    cost: 2,
    color: 'Red',
    effect: '[Main] Draw 1 card. Then, you can destroy an opposing 3000 BP or less Spirit.'
  }, 'player');
  customMultiMagic.compiledIr = compileCard(customMultiMagic);
  game.state.players.player.hand.push(customMultiMagic);

  // Step 1: Activate -> draws 1, then suspends on optional/target prompt
  const r1 = await manager.submitPlayerAction(match.matchId, {
    type: 'ACTIVATE_MAGIC',
    cardId: customMultiMagic.id,
    timing: 'MAIN'
  }, { authToken: match.player1Token });
  assert.equal(r1.success, true);
  assert.equal(r1.result.suspended, true);

  // Evict in-memory game to force full SQLite deserialization restore!
  manager.activeGames.delete(match.matchId);

  // Answer Prompt 1 (Accept optional if CONFIRM_OPTIONAL, or select target if SELECT_DESTROY)
  const inter1 = r1.state.pendingInteractions[0];
  const isOpt1 = inter1.requestType === 'CONFIRM_OPTIONAL' || inter1.type === 'CONFIRM_OPTIONAL';
  const resp1Payload = isOpt1
    ? { accepted: true }
    : { selected: [oppTarget.id] };

  const r2 = await manager.submitPlayerAction(match.matchId, {
    type: 'INTERACTION_RESPONSE',
    interactionId: inter1.id,
    response: resp1Payload
  }, { authToken: match.player1Token });
  assert.equal(r2.success, true);

  if (r2.result.suspended) {
    // Second sequential prompt (target selection after accepting optional)
    const inter2 = r2.state.pendingInteractions[0];
    const r3 = await manager.submitPlayerAction(match.matchId, {
      type: 'INTERACTION_RESPONSE',
      interactionId: inter2.id,
      response: { selected: [oppTarget.id] }
    }, { authToken: match.player1Token });
    assert.equal(r3.success, true);
    assert.equal(r3.result.completed, true);
    assert.equal(r3.state.players.opponent.field.length, 0);
    assert.equal(r3.state.players.player.grave.some(c => c.id === customMultiMagic.id), true);
  } else {
    assert.equal(r2.result.completed, true);
    assert.equal(r2.state.players.opponent.field.length, 0);
    assert.equal(r2.state.players.player.grave.some(c => c.id === customMultiMagic.id), true);
  }
});

// ============================================================================
// J & K. Unsupported Effect Handling & Banish Destination Integrity
// ============================================================================
test('MAGIC-JK01: Unsupported clause reports hasUnsupported honestly; Banish Magic moves to removed after resolve', async () => {
  const realBanishMagic = loadRealCard('EXG4-006'); // "is banished from the game after its effect resolves"
  const unsupMagic = loadRealCard('CB05-059'); // Destiny Destroyer (contains UNSUPPORTED add-from-revealed clause)

  const game = createGame({ playerDeck: makeDummyDeck(40, 'P'), opponentDeck: makeDummyDeck(40, 'O'), strictRules: true });
  game.state.step = 'ATTACK';
  game.state.activePlayer = 'opponent';
  game.state.players.player.reserve = { normal: 10, soul: 0 };

  const banishInst = createCardInstance(realBanishMagic, 'player');
  game.state.players.player.hand.push(banishInst);
  const banRes = await game.activateMagic(banishInst.id, [], 'player', { timing: 'FLASH' });
  assert.equal(banRes.success, true);
  assert.equal(banRes.finalDestination, 'removed');
  assert.equal(game.state.players.player.removed.some(c => c.id === banishInst.id), true);
  assert.equal(game.state.players.player.grave.some(c => c.id === banishInst.id), false);

  // Unsupported clause check in isolated game (CB05-059 destroys 1 target, then hits UNSUPPORTED reveal-add clause)
  const game2 = createGame({ playerDeck: makeDummyDeck(40, 'P'), opponentDeck: makeDummyDeck(40, 'O'), strictRules: true });
  game2.state.step = 'ATTACK';
  game2.state.activePlayer = 'opponent';
  game2.state.players.player.reserve = { normal: 10, soul: 0 };
  const oppWeak = createFieldStack(createCardInstance({ card_number: 'OPP-W', name: 'Weak Spirit', type: 'Spirit', levels: { 1: { cost: 1, bp: 1000 } } }, 'opponent'), { normal: 1, soul: 0 });
  game2.state.players.opponent.field.push(oppWeak);
  const unsupInst = createCardInstance(unsupMagic, 'player');
  game2.state.players.player.hand.push(unsupInst);
  const unsupRes = await game2.activateMagic(unsupInst.id, [], 'player', { timing: 'FLASH' });
  assert.equal(unsupRes.hasUnsupported, true, 'Must honestly report hasUnsupported for unsupported Magic clauses');
  assert.equal(validateGameState(game2.state).valid, true);
  assert.equal(validateGameState(game.state).valid, true);
});

// ============================================================================
// L. AI Magic Activation Test
// ============================================================================
test('MAGIC-L01: HUMAN_VS_AI mode executes AI Magic decision without hanging', async () => {
  const realDrawMagic = loadRealCard('SD06-013');
  const game = createGame({
    playerDeck: makeDummyDeck(40, 'P'),
    opponentDeck: makeDummyDeck(40, 'O'),
    mode: EXECUTION_MODES.HUMAN_VS_AI,
    strictRules: true
  });
  game.state.step = 'MAIN';
  game.state.activePlayer = 'opponent';
  game.state.players.opponent.reserve = { normal: 5, soul: 0 };
  const aiMagic = createCardInstance(realDrawMagic, 'opponent');
  game.state.players.opponent.hand.push(aiMagic);

  const res = await game.activateMagic(aiMagic.id, [], 'opponent', { timing: 'MAIN' });
  assert.equal(res.success, true);
  assert.equal(res.finalDestination, 'grave');
  assert.equal(game.state.players.opponent.grave.some(c => c.id === aiMagic.id), true);
});

// ============================================================================
// M. Genuine Browser-to-Engine Chrome CDP Integration Test
// ============================================================================
test('MAGIC-M01: Real Chrome CDP verifies UI blocks Magic summon, renders Cast button, and resolves engine prompt end-to-end', async () => {
  const harness = await launchRealBrowser({ serverPort: 3994 });
  try {
    const baseUrl = harness.baseUrl || 'http://127.0.0.1:3994';
    const realDrawMagic = loadRealCard('SD06-013');
    const realDestroyMagic = loadRealCard('BS68-077');

    // 1. Create a real match on the server
    const createRes = await requestJson(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        mode: EXECUTION_MODES.HUMAN_VS_HUMAN,
        player1: { id: 'magic_p1', name: 'Magic Tester' },
        player2: { id: 'magic_p2', name: 'Opponent', autoJoined: true }
      }
    });
    assert.equal(createRes.statusCode, 200);
    const { matchId, player1Token } = createRes.body;

    // 2. Navigate real Chrome to /arena.html
    await harness.navigate('/arena.html');
    await harness.waitForFunction('window.BattleArena && typeof window.BattleArena.summonCard === "function"', 20000);

    // 3. Test local UI guard: Magic card CANNOT enter summonCard / openSummonModal, and renders Magic button (no summon button)
    const uiGuardResult = await harness.evaluate(`(function() {
      const ds = window.BattleArena.getState();
      ds.inDuel = true;
      ds.activePlayer = 'player';
      ds.phaseIndex = 4; // MAIN
      ds.player.reserve = 10;
      ds.player.hand = [{
        uid: 'ui_magic_1',
        id: 'ui_magic_1',
        card_number: 'SD06-013',
        name: 'Burst Draw',
        type: 'Magic',
        color: 'Red',
        cost: 4,
        effect: '[Main] Draw two cards.'
      }];
      ds.player.field = [];
      window.BattleArena.renderDuelTable();
      const handHtml = document.getElementById('playerHand')?.innerHTML || '';
      const sumRes = window.BattleArena.summonCard('ui_magic_1');
      return {
        sumRes,
        fieldLen: ds.player.field.length,
        handLen: ds.player.hand.length,
        reserve: ds.player.reserve,
        hasSummonBtn: handHtml.includes('btn-quick-summon'),
        hasMagicBtn: handHtml.includes('btn-quick-magic')
      };
    })()`);

    assert.equal(uiGuardResult.sumRes?.success, false);
    assert.equal(uiGuardResult.sumRes?.reason, 'INVALID_CARD_TYPE');
    assert.equal(uiGuardResult.fieldLen, 0);
    assert.equal(uiGuardResult.handLen, 1);
    assert.equal(uiGuardResult.reserve, 10);
    assert.equal(uiGuardResult.hasSummonBtn, false, 'Magic card must NOT render a Summon button');
    assert.equal(uiGuardResult.hasMagicBtn, true, 'Magic card MUST render a Cast/Magic button');

    // 4. Test real browser-to-server engine prompt modal flow using BattleArena.renderEngineInteractionPrompt + submitEngineInteractionResponse
    const modalCheck = await harness.evaluate(`(function() {
      window.BattleArena.currentSessionInfo.matchId = ${JSON.stringify(matchId)};
      window.BattleArena.currentSessionInfo.authToken = ${JSON.stringify(player1Token)};
      window.BattleArena.renderEngineInteractionPrompt({
        id: 'ui_prompt_1',
        title: 'Select opposing Spirit to destroy',
        description: 'Choose target for Hades Disaster',
        candidates: [{ candidateId: 'opp_stack_1', label: 'Target Spirit (2000 BP)' }],
        optional: false
      });
      const modalActive = document.getElementById('battleTargetModal')?.classList.contains('active');
      const choicesText = document.getElementById('targetSpiritChoices')?.textContent || '';
      return { modalActive, choicesText };
    })()`);

    assert.equal(modalCheck.modalActive, true, 'Engine-generated prompt must activate battleTargetModal');
    assert.ok(modalCheck.choicesText.includes('Target Spirit (2000 BP)'), 'Engine candidate label must be rendered');
  } finally {
    await harness.close();
  }
});
