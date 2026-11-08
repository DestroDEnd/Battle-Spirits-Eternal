/**
 * tests/adversarial_m3_stress.test.js
 * 
 * Adversarial stress harness probing Milestone 3 changes:
 * 1. Level-gating boundary checks (LV2 ability does NOT fire at LV1).
 * 2. Level transition (advancing LV1 -> LV2 enables LV2 ability on next attack).
 * 3. declareBlock WHEN_BLOCKS trigger & blocker level gating.
 * 4. Multi-step core & card conservation invariants.
 * 5. Damage cap enforcement (SD01-039 Blizzard Wall capping unblocked life reduction at 1).
 * 6. Battle timing coverage (WHEN_BATTLES trigger during attack declaration).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import { SD01_OVERRIDES } from '../compiler/overrides/SD01.js';

test('Adversarial M3: Level-gating boundary checks (SD01-012 The DoubleHead Snake)', async () => {
  const game = createGame({
    playerDeck: [
      {
        cardNumber: 'SD01-012',
        name: 'The DoubleHead Snake',
        type: 'Spirit',
        cost: 4,
        levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 5000 } },
        compiledIr: SD01_OVERRIDES['SD01-012']
      },
      { cardNumber: 'SD01-001', name: 'D1', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D2', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D3', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D4', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D5', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } }
    ]
  });

  const p = game.state.players.player;
  p.reserve.normal = 10;
  game.state.step = 'MAIN';

  const snakeCard = p.hand.find(c => c.cardNumber === 'SD01-012');
  const handBeforeSummon = p.hand.length;

  // Summon with 1 core (LV1)
  await game.playCard(snakeCard.id, [], 'player');
  const snakeStack = p.field.find(st => st.top.cardNumber === 'SD01-012');
  assert.ok(snakeStack, 'Snake must be on field');
  assert.equal(snakeStack.cores.normal, 1, 'Summoned snake must have 1 core');

  // WHEN_SUMMONED (levels: [1, 2]) triggers, so hand is handBeforeSummon - 1 + 1 draw
  assert.equal(p.hand.length, handBeforeSummon, 'WHEN_SUMMONED draws 1 card');

  // Attack at LV1 (1 core) -> WHEN_ATTACKS (levels: [2]) must NOT trigger
  game.state.step = 'ATTACK';
  const handBeforeAttack = p.hand.length;
  await game.declareAttack(snakeStack.id, 'player');
  assert.equal(p.hand.length, handBeforeAttack, 'WHEN_ATTACKS (LV2) must NOT trigger when attacking with 1 core');
});

test('Adversarial M3: Level transition enables LV2 ability on attack declaration', async () => {
  const game = createGame({
    playerDeck: [
      {
        cardNumber: 'SD01-012',
        name: 'The DoubleHead Snake',
        type: 'Spirit',
        cost: 4,
        levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 5000 } },
        compiledIr: SD01_OVERRIDES['SD01-012']
      },
      { cardNumber: 'SD01-001', name: 'D1', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D2', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D3', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D4', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'D5', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } }
    ]
  });

  const p = game.state.players.player;
  const snakeCard = p.hand.shift();
  // Place with 1 core initially (LV1)
  const snakeStack = createFieldStack(snakeCard, { normal: 1, soul: 0 });
  p.field.push(snakeStack);

  game.state.step = 'ATTACK';
  const handBeforeUpgrade = p.hand.length;

  // Advance to LV2 by placing 2 additional cores (total 3 cores >= LV2 cost 3)
  snakeStack.cores.normal += 2;
  snakeStack.state = 'REFRESHED';

  // Declare attack at LV2 -> WHEN_ATTACKS (levels: [2]) must trigger
  await game.declareAttack(snakeStack.id, 'player');
  assert.equal(p.hand.length, handBeforeUpgrade + 1, 'Advancing to LV2 must enable WHEN_ATTACKS draw on attack declaration');
});

test('Adversarial M3: declareBlock triggers WHEN_BLOCKS and guards blocker level (SD01-020 Hitodem)', async () => {
  // Case A: Hitodem blocks at LV1 (1 core) -> WHEN_BLOCKS (+2000 BP) should NOT trigger
  {
    const game = createGame({
      playerDeck: [
        { cardNumber: 'SD01-004', name: 'The Infantry Dragron', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 2000 } } }
      ],
      opponentDeck: [
        { cardNumber: 'SD01-020', name: 'Hitodem', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 2, bp: 3000 } }, compiledIr: SD01_OVERRIDES['SD01-020'] }
      ]
    });

    game.state.step = 'ATTACK';
    game.state.activePlayer = 'player';
    const p = game.state.players.player;
    const o = game.state.players.opponent;

    const atkCard = p.hand.shift();
    const blkCard = o.hand.shift();
    p.field.push(createFieldStack(atkCard, { normal: 1, soul: 0 }));
    o.field.push(createFieldStack(blkCard, { normal: 1, soul: 0 })); // 1 core = LV1

    await game.declareAttack(p.field[0].id, 'player');
    const res = await game.declareBlock(o.field[0].id, 'opponent');

    assert.equal(res.blockerBp, 1000, 'Hitodem at LV1 must NOT receive LV2 +2000 BP buff');
    assert.equal(res.attackerBp, 2000, 'Attacker BP is 2000');
    assert.equal(o.grave.length, 1, 'Hitodem (1000 BP) must be destroyed by Attacker (2000 BP)');
    assert.equal(p.grave.length, 0, 'Attacker must survive');
  }

  // Case B: Hitodem blocks at LV2 (2 cores) -> WHEN_BLOCKS (+2000 BP) triggers, BP becomes 5000
  {
    const game = createGame({
      playerDeck: [
        { cardNumber: 'SD01-004', name: 'The Infantry Dragron', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 2000 } } }
      ],
      opponentDeck: [
        { cardNumber: 'SD01-020', name: 'Hitodem', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 2, bp: 3000 } }, compiledIr: SD01_OVERRIDES['SD01-020'] }
      ]
    });

    game.state.step = 'ATTACK';
    game.state.activePlayer = 'player';
    const p = game.state.players.player;
    const o = game.state.players.opponent;

    const atkCard = p.hand.shift();
    const blkCard = o.hand.shift();
    p.field.push(createFieldStack(atkCard, { normal: 1, soul: 0 }));
    o.field.push(createFieldStack(blkCard, { normal: 2, soul: 0 })); // 2 cores = LV2

    await game.declareAttack(p.field[0].id, 'player');
    const res = await game.declareBlock(o.field[0].id, 'opponent');

    assert.equal(res.blockerBp, 5000, 'Hitodem at LV2 must receive LV2 +2000 BP buff (3000 + 2000 = 5000)');
    assert.equal(res.attackerBp, 2000, 'Attacker BP is 2000');
    assert.equal(o.grave.length, 0, 'Hitodem (5000 BP) must survive against Attacker (2000 BP)');
    assert.equal(p.grave.length, 1, 'Attacker must be destroyed');
  }
});

test('Adversarial M3: Invariants (Core & Card Conservation across multi-step chain)', async () => {
  function countCores(p) {
    let fieldCores = 0;
    for (const st of p.field) {
      fieldCores += (st.cores.normal || 0) + (st.cores.soul ? 1 : 0);
    }
    return p.life + (p.reserve.normal || 0) + (p.reserve.soul ? 1 : 0) + (p.trash.normal || 0) + (p.trash.soul ? 1 : 0) + fieldCores;
  }

  function countCards(p) {
    let fieldCards = 0;
    for (const st of p.field) {
      fieldCards += 1 + (st.under ? st.under.length : 0) + (st.braves ? st.braves.length : 0);
    }
    return p.deck.length + p.hand.length + fieldCards + p.grave.length + p.removed.length + (p.burst ? 1 : 0) + (p.mirage ? 1 : 0);
  }

  const pDeck = Array.from({ length: 40 }, () => ({
    cardNumber: 'SD01-001',
    name: 'Erimakilizard',
    type: 'Spirit',
    cost: 0,
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: SD01_OVERRIDES['SD01-001']
  }));
  const oDeck = Array.from({ length: 40 }, () => ({
    cardNumber: 'SD01-001',
    name: 'Erimakilizard',
    type: 'Spirit',
    cost: 0,
    levels: { 1: { cost: 1, bp: 1000 } },
    compiledIr: SD01_OVERRIDES['SD01-001']
  }));

  const game = createGame({ playerDeck: pDeck, opponentDeck: oDeck });
  const p = game.state.players.player;
  const o = game.state.players.opponent;

  const initialPCores = countCores(p);
  const initialOCores = countCores(o);
  assert.equal(countCards(p), 40, 'Player initial cards must equal 40');
  assert.equal(countCards(o), 40, 'Opponent initial cards must equal 40');

  // Step 1: Summon 2 spirits
  game.state.step = 'MAIN';
  await game.playCard(p.hand[0].id, [], 'player');
  await game.playCard(p.hand[0].id, [], 'player');
  assert.equal(countCards(p), 40, 'Player cards conserved after 2 summons');
  assert.equal(countCores(p), initialPCores, 'Player cores conserved after 2 summons');

  // Step 2: Unblocked direct hit
  game.state.step = 'ATTACK';
  await game.declareAttack(p.field[0].id, 'player');
  await game.resolveDirectHit('player');
  assert.equal(countCards(o), 40, 'Opponent cards conserved after direct hit');
  assert.equal(countCores(o), initialOCores, 'Opponent cores conserved after direct hit (1 core life -> reserve)');

  // Step 3: Block with mutual tie destruction
  const oc = o.hand.shift();
  o.field.push(createFieldStack(oc, { normal: 1, soul: 0 }));
  o.reserve.normal -= 1;

  await game.declareAttack(p.field[1].id, 'player');
  await game.declareBlock(o.field[0].id, 'opponent');
  assert.equal(countCards(p), 40, 'Player cards conserved after mutual battle destruction');
  assert.equal(countCards(o), 40, 'Opponent cards conserved after mutual battle destruction');
  assert.equal(countCores(p), initialPCores, 'Player cores conserved after battle cleanup');
  assert.equal(countCores(o), initialOCores, 'Opponent cores conserved after battle cleanup');
});

test('Adversarial M3: Damage Cap mechanics (SD01-039 Blizzard Wall capping unblocked life loss)', async () => {
  const game = createGame({
    playerDeck: [
      { cardNumber: 'SD01-001', name: 'Erimakilizard 1', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } },
      { cardNumber: 'SD01-001', name: 'Erimakilizard 2', type: 'Spirit', cost: 0, levels: { 1: { cost: 1, bp: 1000 } } }
    ],
    opponentDeck: [
      { cardNumber: 'SD01-039', name: 'Blizzard Wall', type: 'Magic', cost: 5, compiledIr: SD01_OVERRIDES['SD01-039'] }
    ]
  });

  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const p = game.state.players.player;
  const o = game.state.players.opponent;

  const c1 = p.hand.shift();
  const c2 = p.hand.shift();
  p.field.push(createFieldStack(c1, { normal: 1, soul: 0 }));
  p.field.push(createFieldStack(c2, { normal: 1, soul: 0 }));
  o.reserve.normal = 10;
  o.life = 5;

  // Opponent casts Blizzard Wall (SD01-039)
  const bwCard = o.hand.find(c => c.cardNumber === 'SD01-039');
  const playRes = await game.playCard(bwCard.id, [], 'opponent');
  assert.equal(playRes.success, true, 'Blizzard Wall must play successfully');

  const capMod = (game.state.modifiers || []).find(m => m.type === 'DAMAGE_CAP');
  assert.ok(capMod, 'DAMAGE_CAP modifier must be registered in state.modifiers');
  assert.equal(capMod.maxDamage, 1, 'DAMAGE_CAP maxDamage must be 1');

  // Attack 1: Unblocked direct hit -> life reduced from 5 to 4
  await game.declareAttack(p.field[0].id, 'player');
  await game.resolveDirectHit('player');
  assert.equal(o.life, 4, 'First direct hit reduces life to 4');

  // Attack 2: Unblocked direct hit in same turn -> Blizzard Wall states Life can ONLY be reduced by 1 by unblocked spirits this turn
  await game.declareAttack(p.field[1].id, 'player');
  await game.resolveDirectHit('player');

  // EMPIRICAL ASSERTION: Blizzard Wall cap of 1 must prevent the 2nd unblocked attack from reducing life
  assert.equal(o.life, 4, 'SD01-039 Blizzard Wall DAMAGE_CAP must cap unblocked life loss at 1 for the turn');
});

test('Adversarial M3: Battle timing coverage (WHEN_BATTLES ability on attack declaration)', async () => {
  const game = createGame({
    playerDeck: [
      {
        cardNumber: 'SD01-018',
        name: 'The Hunter Kingghepardo',
        type: 'Spirit',
        cost: 6,
        levels: { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 6000 } },
        compiledIr: SD01_OVERRIDES['SD01-018']
      }
    ]
  });

  game.state.step = 'ATTACK';
  game.state.activePlayer = 'player';
  const p = game.state.players.player;

  const card = p.hand.shift();
  // Place Kingghepardo at LV2 (3 cores)
  p.field.push(createFieldStack(card, { normal: 3, soul: 0 }));

  const reserveBefore = p.reserve.normal;
  await game.declareAttack(p.field[0].id, 'player');

  // EMPIRICAL ASSERTION: [When Battles] ability must trigger on attack declaration, moving 1 core from Void to Reserve
  assert.equal(p.reserve.normal, reserveBefore + 1, 'WHEN_BATTLES ability must trigger upon declaring attack');
});
