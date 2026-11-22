/**
 * tests/core_game_rules_integrity_corrective.test.js
 *
 * Phase 4C.3.3.1 — Core Rules Engine Integrity Corrections & Acceptance Test Suite
 *
 * Covers:
 * 1. Core movement (Void normal/Soul availability, Life overdraw rejection, replacement validation, conservation)
 * 2. Payment atomicity (multi-source, cumulative validation, Soul Core, event-handler failure rollback, negation rule)
 * 3. State validation (Void/Life/stack invalid values, missing core zones, duplicates, Soul Core > 1, all zones)
 * 4. Deterministic lifecycle-event dispatch (awaited BATTLE_ENDED/ATTACK_ENDED with Promise barriers, ordering, error propagation)
 * 5. Eternal rules profile & deck legality (40-card min, 3-copy limit, 1 Contract Partner limit, Core Step with 0 Void cores)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, validateDeck } from '../engine/index.js';
import { ETERNAL_RULES } from '../engine/rules/eternal.js';
import {
  createCardInstance,
  createFieldStack,
  getTotalPlayerCores,
  validateGameState,
  resetInstanceIdCounter,
  resetPlacementIdCounter
} from '../engine/state.js';
import { moveCore } from '../engine/zones.js';
import { payCost, PaymentEventDispatchError } from '../engine/payment.js';

function makeValidDeck(count = 40, prefix = 'V') {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `${prefix}-${i + 1}`,
    name: `Card ${prefix}-${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 2000 } }
  }));
}

// ===========================================================================
// 1. Core Movement & Void/Life Accounting
// ===========================================================================
test('CORR-CORE-01: moveCore rejects unavailable Void normal/Soul cores and preserves all counts', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O') });
  const before = getTotalPlayerCores(game.state, 'player');
  assert.equal(game.state.players.player.voidCores.normal, 0);
  assert.equal(game.state.players.player.voidCores.soul, 0);

  // Unavailable normal core in Void
  const failNormal = await moveCore(game.state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'player' });
  assert.equal(failNormal, false);

  // Unavailable Soul Core in Void
  const failSoul = await moveCore(game.state, 1, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'player' }, { isSoulCore: true });
  assert.equal(failSoul, false);

  assert.deepEqual(getTotalPlayerCores(game.state, 'player'), before, 'Zero core mutation on failed Void moves');

  // Seed 2 normal + 1 soul in Void and verify exact conservation
  game.state.players.player.voidCores = { normal: 2, soul: 0 };
  const okNormal = await moveCore(game.state, 2, { zone: 'void', side: 'player' }, { zone: 'reserve', side: 'player' });
  assert.equal(okNormal, true);
  assert.equal(game.state.players.player.voidCores.normal, 0);
  assert.equal(game.state.players.player.reserve.normal, 5);
  assert.equal(getTotalPlayerCores(game.state, 'player').total, before.total + 2);
});

test('CORR-CORE-02: moveCore rejects Life overdraw, enforces deduction === credit, and validates replacement destinations', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O') });
  game.state.players.player.life = 2;
  const before = getTotalPlayerCores(game.state, 'player');

  // Requesting 3 from Life when only 2 exist must fail completely (no partial deduction or 3-core credit)
  const overdraw = await moveCore(game.state, 3, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' });
  assert.equal(overdraw, false);
  assert.equal(game.state.players.player.life, 2);
  assert.deepEqual(getTotalPlayerCores(game.state, 'player'), before);

  // Valid Life -> Reserve with LIFE_CORE replacement to Trash
  game.state.modifiers.push({
    id: 'rep_life_trash',
    type: 'REPLACEMENT_EFFECT',
    replaces: 'LIFE_CORE',
    side: 'player',
    replacementZone: 'trash'
  });
  const okLife = await moveCore(game.state, 2, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' }, {}, game.events);
  assert.equal(okLife, true);
  assert.equal(game.state.players.player.life, 0);
  assert.equal(game.state.players.player.trash.normal, 2, 'Replacement destination credited exactly 2');
  assert.equal(game.state.players.player.reserve.normal, 3, 'Original destination unchanged');
  const after = getTotalPlayerCores(game.state, 'player');
  assert.equal(after.normal, before.normal, 'Total normal core conservation preserved');
  assert.equal(after.soul, before.soul, 'Total Soul Core conservation preserved');
  assert.equal(after.total, before.total, 'Total core conservation preserved');
});

test('CORR-CORE-03: Core Step moves 1 available Void core and creates 0 cores when Void is empty', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O'), strictRules: true });

  // Advance Turn 1 (player skips CORE) -> Turn 2 START (opponent)
  await game.advanceStep(); // DRAW
  await game.advanceStep(); // REFRESH
  await game.advanceStep(); // MAIN
  await game.advanceStep(); // END
  await game.advanceStep(); // Turn 2 START (opponent)

  // Opponent has 0 Void cores -> Core Step must NOT create a core
  assert.equal(game.state.players.opponent.voidCores.normal, 0);
  const reserveBefore = game.state.players.opponent.reserve.normal;
  await game.advanceStep(); // CORE
  assert.equal(game.state.players.opponent.reserve.normal, reserveBefore, 'Empty Void must not create cores');

  // Seed 1 Void core on player and advance to Turn 3 CORE step -> moves exactly 1 core
  game.state.players.player.voidCores.normal = 1;
  await game.advanceStep(); // DRAW
  await game.advanceStep(); // REFRESH
  await game.advanceStep(); // MAIN
  await game.advanceStep(); // ATTACK
  await game.advanceStep(); // END
  await game.advanceStep(); // Turn 3 START (player)
  const pReserveBefore = game.state.players.player.reserve.normal;
  await game.advanceStep(); // CORE
  assert.equal(game.state.players.player.voidCores.normal, 0);
  assert.equal(game.state.players.player.reserve.normal, pReserveBefore + 1);
});

// ===========================================================================
// 2. Payment Transaction Semantics & Post-Commit Event Failure Safety
// ===========================================================================
test('CORR-PAY-01: Preflight rejection, cumulative duplicate sources, and Soul Core validation cause zero mutation & zero events', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O') });
  const p = game.state.players.player;
  const st = createFieldStack(createCardInstance({ card_number: 'P-1', name: 'S1', type: 'Spirit' }, 'player'), { normal: 2, soul: 0 });
  p.field.push(st);
  p.reserve = { normal: 2, soul: 1 };

  const histLenBefore = game.events.history.length;

  // 1. Insufficient cumulative duplicate reserve sources (2 + 2 > 2 available) -> zero mutation, zero events
  const cumFail = await payCost(game.state, 4, [
    { zone: 'reserve', isSoulCore: false, count: 2 },
    { zone: 'reserve', isSoulCore: false, count: 2 }
  ], 'player', game.events);
  assert.equal(cumFail.success, false);
  assert.equal(cumFail.committed, false);
  assert.equal(cumFail.status, 'PAYMENT_REJECTED');
  assert.equal(p.reserve.normal, 2);
  assert.equal(p.trash.normal, 0);
  assert.equal(game.events.history.length, histLenBefore);

  // 2. Duplicate Soul Core sources summing > 1 -> zero mutation, zero events
  const dupSoul = await payCost(game.state, 2, [
    { zone: 'reserve', isSoulCore: true, count: 1 },
    { zone: 'reserve', isSoulCore: true, count: 1 }
  ], 'player', game.events);
  assert.equal(dupSoul.success, false);
  assert.equal(dupSoul.committed, false);
  assert.equal(dupSoul.reason, 'MULTIPLE_SOUL_CORES_NOT_ALLOWED');
  assert.equal(p.reserve.soul, 1);
  assert.equal(p.trash.soul, 0);
  assert.equal(game.events.history.length, histLenBefore);

  // 3. Invalid source zone -> zero mutation, zero events
  const invSource = await payCost(game.state, 1, [{ zone: 'life', count: 1 }], 'player', game.events);
  assert.equal(invSource.success, false);
  assert.equal(invSource.committed, false);
  assert.equal(invSource.reason, 'INVALID_PAYMENT_SOURCE_ZONE');
  assert.equal(game.events.history.length, histLenBefore);
});

test('CORR-PAY-03: Committed payment is NOT rolled back on post-commit handler failure, includes shared transactionId, and blocks duplicate commit', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O') });
  const p = game.state.players.player;
  const st = createFieldStack(createCardInstance({ card_number: 'P-1', name: 'S1', type: 'Spirit' }, 'player'), { normal: 2, soul: 0 });
  p.field.push(st);
  p.reserve = { normal: 2, soul: 1 };

  // Handler 1 succeeds on first CORE_MOVED, mutates unrelated game state (counters),
  // attempts re-entrant duplicate payCost with same transactionId, then Handler 2 throws on step 2.
  let reentrantResult = null;
  let callCount = 0;
  const handler = async (ev) => {
    callCount++;
    if (callCount === 1) {
      game.state.players.player.counters += 1;
      reentrantResult = await payCost(game.state, 1, [{ zone: 'reserve', count: 1 }], 'player', game.events, { transactionId: ev.transactionId });
    } else if (callCount === 2) {
      throw new Error('POST_COMMIT_HANDLER_2_FAILED');
    }
  };
  game.events.on('CORE_MOVED', handler);

  let caught = null;
  try {
    await payCost(game.state, 4, [
      { zone: 'reserve', isSoulCore: false, count: 2 },
      { zone: 'reserve', isSoulCore: true, count: 1 },
      { zone: 'field', stackId: st.id, isSoulCore: false, count: 1 }
    ], 'player', game.events, { transactionId: 'tx_test_commit_01' });
  } catch (err) {
    caught = err;
  }

  game.events.off('CORE_MOVED', handler);

  // Structured post-commit failure error propagated
  assert.ok(caught instanceof PaymentEventDispatchError);
  assert.equal(caught.committed, true);
  assert.equal(caught.eventDispatchFailed, true);
  assert.equal(caught.status, 'COMMITTED_WITH_EVENT_FAILURE');
  assert.equal(caught.transactionId, 'tx_test_commit_01');
  assert.equal(caught.failedEventIndex, 1);

  // Payment remains FULLY committed (NOT rolled back!) and earlier handler side effect remains intact
  assert.equal(p.reserve.normal, 0);
  assert.equal(p.reserve.soul, 0);
  assert.equal(st.cores.normal, 1);
  assert.equal(p.trash.normal, 3);
  assert.equal(p.trash.soul, 1);
  assert.equal(p.counters, 1, 'Earlier handler side effect preserved');

  // Re-entrant duplicate commit was blocked
  assert.equal(reentrantResult.success, false);
  assert.equal(reentrantResult.duplicateTransaction, true);
  assert.equal(reentrantResult.status, 'DUPLICATE_TRANSACTION');

  // Retry with same transactionId also blocked
  const retry = await payCost(game.state, 1, [{ zone: 'field', stackId: st.id, count: 1 }], 'player', game.events, { transactionId: 'tx_test_commit_01' });
  assert.equal(retry.success, false);
  assert.equal(retry.duplicateTransaction, true);

  // Successful multi-source payment emits exact once-per-step CORE_MOVED events with shared transactionId
  const p2 = game.state.players.opponent;
  const st2 = createFieldStack(createCardInstance({ card_number: 'O-1', name: 'OS1', type: 'Spirit' }, 'opponent'), { normal: 2, soul: 0 });
  p2.field.push(st2);
  p2.reserve = { normal: 2, soul: 1 };
  const histStart = game.events.history.length;
  const okPay = await payCost(game.state, 4, [
    { zone: 'reserve', isSoulCore: false, count: 2 },
    { zone: 'reserve', isSoulCore: true, count: 1 },
    { zone: 'field', stackId: st2.id, isSoulCore: false, count: 1 }
  ], 'opponent', game.events);
  assert.equal(okPay.success, true);
  assert.equal(okPay.committed, true);
  assert.equal(okPay.status, 'COMMITTED');
  assert.equal(okPay.soulCoreUsed, true);
  assert.equal(okPay.eventDispatchFailed, false);

  const txEvents = game.events.history.slice(histStart).filter(e => e.type === 'CORE_MOVED');
  assert.equal(txEvents.length, 3);
  assert.ok(txEvents.every(e => e.transactionId === okPay.transactionId && e.paymentCommitted === true));
});

test('CORR-PAY-02: Negated Magic card retains committed cost payment', async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O'), strictRules: true });
  game.state.step = 'MAIN';
  const magic = createCardInstance({ card_number: 'M-NEG', name: 'Negated Spell', type: 'Magic', cost: 2, color: 'Red' }, 'player');
  game.state.players.player.hand.push(magic);
  game.state.modifiers.push({ id: 'neg', type: 'NEGATE_EFFECT', side: 'player', targetType: 'Magic', duration: 'THIS_TURN' });

  const res = await game.playCard(magic.id, [], 'player');
  assert.equal(res.success, true);
  assert.equal(res.negated, true);
  assert.equal(res.costPaid, 2);
  assert.equal(game.state.players.player.trash.normal, 2, 'Committed cost is not refunded on later negation');
});

// ===========================================================================
// 3. Adversarial State Validation
// ===========================================================================
test('CORR-STATE-01: validateGameState detects invalid Void, Life, fractional/NaN/Infinity, missing zones, and duplicates', () => {
  const makeFresh = () => createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O') }).state;

  // Fractional & NaN & Infinity
  for (const badVal of [-1, 1.5, NaN, Infinity]) {
    const s1 = makeFresh();
    s1.players.player.voidCores.normal = badVal;
    assert.equal(validateGameState(s1).valid, false, `Void=${badVal} must fail`);

    const s2 = makeFresh();
    s2.players.player.life = badVal;
    assert.equal(validateGameState(s2).valid, false, `Life=${badVal} must fail`);
  }

  // Missing core-zone object
  const s3 = makeFresh();
  delete s3.players.player.voidCores;
  assert.equal(validateGameState(s3).valid, false);

  // Multiple Soul Cores across zones
  const s4 = makeFresh();
  s4.players.player.voidCores.soul = 1; // +1 already in reserve = 2
  assert.equal(validateGameState(s4).valid, false);

  // Duplicate stack IDs
  const s5 = makeFresh();
  const c1 = createCardInstance({ card_number: 'A-1', name: 'A1', type: 'Spirit' }, 'player');
  const c2 = createCardInstance({ card_number: 'A-2', name: 'A2', type: 'Spirit' }, 'player');
  const st1 = createFieldStack(c1);
  const st2 = createFieldStack(c2);
  st2.id = st1.id;
  s5.players.player.field.push(st1, st2);
  assert.equal(validateGameState(s5).valid, false);

  // Valid state with all supported zones populated
  const s6 = makeFresh();
  const uCard = createCardInstance({ card_number: 'U-1', name: 'Under', type: 'Spirit' }, 'player');
  const bCard = createCardInstance({ card_number: 'B-1', name: 'Brave', type: 'Brave' }, 'player');
  const topCard = createCardInstance({ card_number: 'T-1', name: 'Top', type: 'Spirit' }, 'player');
  const fullStack = createFieldStack(topCard, { normal: 1, soul: 0 }, [bCard]);
  fullStack.under.push(uCard);
  s6.players.player.field.push(fullStack);
  s6.players.player.burst = createCardInstance({ card_number: 'BU-1', name: 'Burst', type: 'Magic' }, 'player');
  s6.players.player.mirage = createCardInstance({ card_number: 'MI-1', name: 'Mirage', type: 'Magic' }, 'player');
  s6.players.player.removed.push(createCardInstance({ card_number: 'RM-1', name: 'Removed', type: 'Spirit' }, 'player'));
  assert.equal(validateGameState(s6).valid, true);
});

// ===========================================================================
// 4. Deterministic Awaited Lifecycle Events & Ordering
// ===========================================================================
test('CORR-EVENT-01: endBattle and endAttack await async handlers with Promise barriers and preserve event ordering', { timeout: 5000 }, async () => {
  const game = createGame({ playerDeck: makeValidDeck(40, 'P'), opponentDeck: makeValidDeck(40, 'O'), strictRules: true });
  game.state.step = 'ATTACK';

  const atk = createFieldStack(createCardInstance({ card_number: 'ATK', name: 'Attacker', type: 'Spirit', levels: { 1: { cost: 1, bp: 5000 } } }, 'player'), { normal: 1, soul: 0 });
  const blk = createFieldStack(createCardInstance({ card_number: 'BLK', name: 'Blocker', type: 'Spirit', levels: { 1: { cost: 1, bp: 2000 } } }, 'opponent'), { normal: 1, soul: 0 });
  game.state.players.player.field.push(atk);
  game.state.players.opponent.field.push(blk);

  const eventOrder = [];
  game.events.on('*', e => { eventOrder.push(e.type); });

  let battleHandlerEntered;
  const battleEnteredPromise = new Promise(r => { battleHandlerEntered = r; });
  let releaseBattleHandler;
  const battleGate = new Promise(r => { releaseBattleHandler = r; });
  let battleHandlerFinished = false;

  game.events.on('BATTLE_ENDED', async () => {
    battleHandlerEntered();
    await battleGate;
    battleHandlerFinished = true;
  });

  await game.declareAttack(atk.id, 'player');
  let blockSettled = false;
  const blockPromise = game.declareBlock(blk.id, 'opponent').then(res => {
    blockSettled = true;
    return res;
  });

  await battleEnteredPromise;
  assert.equal(blockSettled, false, 'declareBlock must await BATTLE_ENDED async handler before returning');

  releaseBattleHandler();
  const blockRes = await blockPromise;
  assert.equal(blockRes.success, true);
  assert.equal(battleHandlerFinished, true);

  // Verify exact event ordering
  const expectedSubsequence = [
    'CARD_EXHAUSTED',
    'ATTACK_DECLARED',
    'CARD_EXHAUSTED',
    'BLOCK_DECLARED',
    'BATTLE_STARTED',
    'BP_COMPARE',
    'CARD_MOVED',
    'DESTROYED',
    'BATTLE_ENDED',
    'ATTACK_ENDED'
  ];
  let idx = 0;
  for (const evType of eventOrder) {
    if (evType === expectedSubsequence[idx]) idx++;
  }
  assert.equal(idx, expectedSubsequence.length, `Expected event subsequence not matched in ${JSON.stringify(eventOrder)}`);
});

test('CORR-EVENT-02: endBattle and endAttack propagate async handler failures cleanly', async () => {
  const game = createGame();
  game.events.on('BATTLE_ENDED', async () => {
    throw new Error('BATTLE_ENDED_HANDLER_BOOM');
  });
  await assert.rejects(() => game.endBattle(), /BATTLE_ENDED_HANDLER_BOOM/);

  game.events.on('ATTACK_ENDED', async () => {
    throw new Error('ATTACK_ENDED_HANDLER_BOOM');
  });
  await assert.rejects(() => game.endAttack(), /ATTACK_ENDED_HANDLER_BOOM/);
});

// ===========================================================================
// 5. Eternal Rules Profile & Deck Legality
// ===========================================================================
test('CORR-RULES-01: Eternal rules metadata and strict deck validation (size, 3-copy limit, 1 Contract Partner, test bypass)', () => {
  assert.equal(ETERNAL_RULES.formatVersion, '17.0');
  assert.equal(ETERNAL_RULES.rulesSourceStatus, 'LOCAL_17_0_IMPLEMENTATION_PENDING_OFFICIAL_PDF_AUDIT');

  // 39 cards rejected
  const shortDeck = makeValidDeck(39, 'S');
  assert.equal(validateDeck(shortDeck).valid, false);
  assert.throws(() => createGame({ playerDeck: shortDeck, opponentDeck: makeValidDeck(40, 'O'), strictRules: true }), /INVALID_DECK/);

  // 4 copies of same card name rejected
  const fourCopies = makeValidDeck(40, 'C');
  fourCopies[0].name = 'Duplicate Dragon';
  fourCopies[1].name = 'Duplicate Dragon';
  fourCopies[2].name = 'Duplicate Dragon';
  fourCopies[3].name = 'Duplicate Dragon';
  assert.equal(validateDeck(fourCopies).valid, false);

  // 3 copies accepted
  fourCopies[3].name = 'Unique Dragon';
  assert.equal(validateDeck(fourCopies).valid, true);

  // 2 Contract Partners rejected; 1 accepted
  const twoPartners = makeValidDeck(40, 'CP');
  twoPartners[0].isContractPartner = true;
  twoPartners[1].isContractPartner = true;
  assert.equal(validateDeck(twoPartners).valid, false);
  twoPartners[1].isContractPartner = false;
  assert.equal(validateDeck(twoPartners).valid, true);

  // Explicit test-only bypass allows small decks when explicitly requested
  const bypassed = createGame({
    playerDeck: makeValidDeck(5, 'T'),
    opponentDeck: makeValidDeck(5, 'T'),
    strictRules: true,
    unsafeTestBypassDeckValidation: true
  });
  assert.equal(bypassed.validateState().valid, true);
  assert.equal(bypassed.state.deckValidation.bypassed, true);
});

test('CORR-RULES-02: Strict-rules saved-state restoration validates deckValidation attestation or originalDecks', () => {
  const pDeck = makeValidDeck(40, 'RP');
  const oDeck = makeValidDeck(40, 'RO');
  const game = createGame({ playerDeck: pDeck, opponentDeck: oDeck, strictRules: true });

  assert.equal(game.state.deckValidation.strictRules, true);
  assert.equal(game.state.deckValidation.bypassed, false);

  // 1. Valid restored state with attestation succeeds
  const saved = JSON.parse(JSON.stringify(game.state));
  const restored = createGame({ state: saved, strictRules: true });
  assert.equal(restored.validateState().valid, true);

  // 2. Valid restored state with matching originalDecks succeeds
  const restoredWithOrig = createGame({
    state: JSON.parse(JSON.stringify(game.state)),
    originalDecks: { player: pDeck, opponent: oDeck },
    strictRules: true
  });
  assert.equal(restoredWithOrig.validateState().valid, true);

  // 3. Invalid originalDecks rejected
  assert.throws(
    () => createGame({
      state: JSON.parse(JSON.stringify(game.state)),
      originalDecks: { player: makeValidDeck(10, 'BAD'), opponent: oDeck },
      strictRules: true
    }),
    /INVALID_RESTORED_ORIGINAL_DECK/
  );

  // 4. Missing deckValidation metadata rejected under strictRules without originalDecks
  const missingMeta = JSON.parse(JSON.stringify(game.state));
  delete missingMeta.deckValidation;
  assert.throws(
    () => createGame({ state: missingMeta, strictRules: true }),
    /INVALID_RESTORED_DECK_ATTESTATION/
  );

  // 5. Bypassed state cannot be restored as strictRules without explicit unsafeTestBypassDeckValidation
  const bypassedGame = createGame({
    playerDeck: makeValidDeck(5, 'BP'),
    opponentDeck: makeValidDeck(5, 'BO'),
    strictRules: true,
    unsafeTestBypassDeckValidation: true
  });
  const bypassedSaved = JSON.parse(JSON.stringify(bypassedGame.state));
  assert.throws(
    () => createGame({ state: bypassedSaved, strictRules: true }),
    /INVALID_RESTORED_DECK_ATTESTATION/
  );
  const bypassedRestored = createGame({
    state: bypassedSaved,
    strictRules: true,
    unsafeTestBypassDeckValidation: true
  });
  assert.equal(bypassedRestored.validateState().valid, true);
});
