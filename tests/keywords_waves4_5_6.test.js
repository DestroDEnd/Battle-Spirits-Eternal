import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { extractKeywords, KEYWORD_CATALOG } from '../compiler/keyword_compiler.js';
import { computeEffectiveBP, canAttack, canBlock, isImmune } from '../engine/continuous.js';

test('Keyword Catalog - Comprehensive coverage and stacking extraction', () => {
  // 1. Coverage check of major Wave 4, 5, 6 keywords
  const requiredKeywords = [
    'Immortality', 'Tribute', 'Unsheathe', 'Bombardment', 'Pursuit', 'Showdown',
    'Soar', 'Bunshin', 'Ice Wall', 'Kagemusha', 'Silver Wheel', 'Excite', 'Load',
    'Fast Draw', 'Dispersion', 'Summon Bolt', 'AFO', 'Stampede',
    'On Stage', 'Show Up', 'Friend', 'Appeal', 'My Unit', 'Solo Part', 'Digivolution',
    'Trans-Am', 'Clock Up', 'Funnel', 'Barrage',
    'Flag Contract Advent', 'Soul Magic', 'Amplify', 'Rumble', 'Current', 'Shamanism'
  ];

  for (const kw of requiredKeywords) {
    assert.ok(KEYWORD_CATALOG[kw], `KEYWORD_CATALOG must contain ${kw}`);
  }

  // 2. Ver 17.0 Stacking: Two distinct instances of Crush on the same card must both be extracted
  const doubleCrushText = '[LV1][LV2] [Crush]\n[LV2] [Crush]';
  const extractedCrush = extractKeywords(doubleCrushText);
  assert.equal(extractedCrush.filter(k => k.name === 'Crush').length, 2, 'Must extract two separate Crush instances');

  // 3. Ver 17.0 Stacking: Two distinct Windstorm with different parameters
  const multiWindstormText = '[LV1] [Windstorm: 1]\n[LV2] [Windstorm: 2]';
  const extractedWind = extractKeywords(multiWindstormText);
  assert.equal(extractedWind.length, 2);
  assert.equal(extractedWind[0].parameter, '1');
  assert.equal(extractedWind[1].parameter, '2');

  // 4. Parameter extraction with double colon e.g. [Neo-Core Charge:: (Cond)]
  const neoChargeText = '[Neo-Core Charge:: (Cost 3 or more)]';
  const extractedNeo = extractKeywords(neoChargeText);
  assert.equal(extractedNeo.length, 1);
  assert.equal(extractedNeo[0].name, 'Neo-Core Charge');
  assert.equal(extractedNeo[0].parameter, '(Cost 3 or more)');
});

test('Wave 4 - Pursuit allows exhausted Spirit to declare attack by becoming Heavy Exhausted', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const pursuitSpirit = createCardInstance({
    cardNumber: 'BS52-005',
    name: 'Pursuit Hunter',
    cost: 3,
    effect: '[LV1][LV2] [Pursuit] (Your Attack Step) This exhausted Spirit can heavy exhaust to attack.'
  }, 'player');

  const stack = createFieldStack(pursuitSpirit, { normal: 1, soul: 0 });
  stack.state = 'EXHAUSTED'; // Currently exhausted
  p.field.push(stack);

  // In continuous.js, canAttack must be true for exhausted spirit with Pursuit
  assert.equal(canAttack(game.state, stack), true, 'Exhausted spirit with Pursuit must be eligible to attack');

  // Trigger attack declaration via hook
  const handler = game.keywords.get('Pursuit');
  assert.ok(handler);
  await handler.hooks.onAttackDeclared({
    game,
    state: game.state,
    stack,
    attackerStack: stack,
    card: pursuitSpirit,
    keyword: { name: 'Pursuit' }
  });

  // State transitions from EXHAUSTED -> HEAVY_EXHAUSTED
  assert.equal(stack.state, 'HEAVY_EXHAUSTED');
});

test('Wave 4 - Soar allows opponent exhausted Spirit to block and refreshes attacker at battle end', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const soarSpirit = createCardInstance({
    cardNumber: 'BS35-024',
    name: 'Gale Phoenix',
    cost: 5,
    effect: '[LV1][LV2] [Soar] (When Attacks) At the end of battle, this Spirit refreshes. (The opponent can block with exhausted Spirits/Ultimates).'
  }, 'player');

  const attackerStack = createFieldStack(soarSpirit, { normal: 2, soul: 0 });
  p.field.push(attackerStack);

  const defenderSpirit = createCardInstance({
    cardNumber: 'BS01-020',
    name: 'Opponent Defender',
    cost: 3
  }, 'opponent');

  const defenderStack = createFieldStack(defenderSpirit, { normal: 1, soul: 0 });
  defenderStack.state = 'EXHAUSTED'; // Exhausted!
  opp.field.push(defenderStack);

  // Set up combat state with Soar attacker
  game.state.combat = {
    attackerStackId: attackerStack.id,
    attacker: attackerStack,
    soarActive: true
  };

  // canBlock allows exhausted blocker because attacker has Soar
  assert.equal(canBlock(game.state, defenderStack), true, 'Exhausted spirit can block against Soar');

  // At end of battle, Soar refreshes the attacker
  attackerStack.state = 'EXHAUSTED';
  const handler = game.keywords.get('Soar');
  assert.ok(handler);
  await handler.hooks.onBattleEnd({
    game,
    state: game.state,
    attackerStack,
    card: soarSpirit,
    keyword: { name: 'Soar' }
  });

  assert.equal(attackerStack.state, 'REFRESHED', 'Soar refreshes attacker at end of battle');
});

test('Wave 4 - Bunshin creates Cost 0 3000 BP Bunshin token Spirit from decktop', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  // Deck has cards
  p.deck = [
    createCardInstance({ name: 'Decktop Hidden Token' }, 'player'),
    createCardInstance({ name: 'Card 2' }, 'player')
  ];
  p.reserve.normal = 3;

  const bunshinCard = createCardInstance({
    cardNumber: 'CB01-026',
    name: 'Baltan Seijin',
    cost: 3,
    effect: '[LV1][LV2] [Bunshin: 1] (When Summoned) Put one card from decktop facedown onto the Field as Bunshin Spirit.'
  }, 'player');

  const handler = game.keywords.get('Bunshin');
  assert.ok(handler);

  const result = await handler.executeBunshin(game, 'player', 1);
  assert.equal(result.success, true);
  assert.equal(p.field.length, 1);

  const tokenStack = p.field[0];
  assert.equal(tokenStack.top.isBunshin, true);
  assert.equal(tokenStack.top.cost, 0);
  assert.equal(computeEffectiveBP(game.state, tokenStack), 3000);
  assert.equal(tokenStack.cores.normal, 1);
  assert.equal(p.deck.length, 1);
});

test('Wave 4 - Ice Wall negates opposing Magic of specified colors', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const iceWallSpirit = createCardInstance({
    cardNumber: 'BS12-032',
    name: 'HeavyBoots Vidar',
    cost: 4,
    effect: '[LV1][LV2] [Ice Wall: Purple/White] (Opposing Turn) When opponent uses Magic, by exhausting this Spirit, negate it.'
  }, 'player');

  const stack = createFieldStack(iceWallSpirit, { normal: 1, soul: 0 });
  stack.state = 'REFRESHED';
  p.field.push(stack);

  const handler = game.keywords.get('Ice Wall');
  assert.ok(handler);

  // Opponent uses a Purple Magic
  const oppMagic = createCardInstance({
    name: 'Dark Flame',
    type: 'Magic',
    colors: ['Purple']
  }, 'opponent');

  const magicEvent = {
    type: 'MAGIC_USED',
    card: oppMagic,
    player: 'opponent',
    negated: false
  };

  await handler.hooks.onMagicUsed({
    game,
    state: game.state,
    stack,
    event: magicEvent,
    keyword: { name: 'Ice Wall', parameter: 'Purple/White' }
  });

  assert.equal(magicEvent.negated, true, 'Ice Wall must negate the Magic');
  assert.equal(stack.state, 'EXHAUSTED', 'Ice Wall spirit exhausts to negate');
});

test('Wave 4 - Load increments Counter and stacks decktop face-down under Contract Partner', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  p.counters = 0;

  const partnerCard = createCardInstance({
    cardNumber: 'BS63-CX01',
    name: 'The PartnerBurai Vrick',
    isContractPartner: true
  }, 'player');

  const partnerStack = createFieldStack(partnerCard, { normal: 1, soul: 1 });
  p.field.push(partnerStack);

  const deckCard = createCardInstance({ name: 'Loaded Bullet Card' }, 'player');
  p.deck = [deckCard];

  const handler = game.keywords.get('Load');
  assert.ok(handler);

  const res = await handler.executeLoad(game, 'player', 1);
  assert.equal(res.success, true);
  assert.equal(p.counters, 1, 'Counter increased by 1');
  assert.equal(partnerStack.under.length, 1, 'Card loaded under partner stack');
  assert.equal(partnerStack.under[0].name, 'Loaded Bullet Card');
  assert.equal(p.deck.length, 0);
});

test('Wave 5 - Clock Up restricts blockers to Spirits with Clock Up', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const clockUpAttacker = createCardInstance({
    cardNumber: 'CB06-030',
    name: 'Kamen Rider Kabuto',
    effect: '[LV1][LV2] [Clock Up] (When Attacks) Can only be blocked by Spirits with "Clock Up".'
  }, 'player');

  const attackerStack = createFieldStack(clockUpAttacker, { normal: 1, soul: 0 });
  p.field.push(attackerStack);

  const normalBlocker = createCardInstance({
    cardNumber: 'BS01-002',
    name: 'Normal Soldier'
  }, 'opponent');
  const normalStack = createFieldStack(normalBlocker, { normal: 1, soul: 0 });
  opp.field.push(normalStack);

  const clockUpBlocker = createCardInstance({
    cardNumber: 'CB06-031',
    name: 'Kamen Rider Gatack',
    effect: '[LV1][LV2] [Clock Up]'
  }, 'opponent');
  const gatackStack = createFieldStack(clockUpBlocker, { normal: 1, soul: 0 });
  opp.field.push(gatackStack);

  game.state.combat = {
    attackerStackId: attackerStack.id,
    onlyBlockableByKeyword: 'Clock Up'
  };

  // Normal blocker cannot block against Clock Up
  assert.equal(canBlock(game.state, normalStack), false, 'Normal spirit cannot block against Clock Up');

  // Spirit with Clock Up can block
  assert.equal(canBlock(game.state, gatackStack), true, 'Spirit with Clock Up can block');
});

test('Wave 5 - On Stage returns Spirit to deckbottom and free-summons Stage Style in Refreshed state', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const idolSpirit = createCardInstance({
    cardNumber: 'BSC23-008',
    name: 'Siegfreeda',
    family: 'Diva',
    effect: '[LV1][LV2] [On Stage] (Your Attack Step) Instead of attacking, return this Spirit to deckbottom to summon "Stage Style" Siegfreeda.'
  }, 'player');

  const stack = createFieldStack(idolSpirit, { normal: 2, soul: 0 });
  p.field.push(stack);

  const stageStyleCard = createCardInstance({
    cardNumber: 'BSC23-X01',
    name: 'The StageForm Siegfreeda',
    family: 'Stage Style',
    cost: 6,
    levels: { 1: { cost: 1, bp: 5000 } }
  }, 'player');
  p.hand.push(stageStyleCard);

  const handler = game.keywords.get('On Stage');
  assert.ok(handler);

  const res = await handler.executeOnStage(game, stack, stageStyleCard, 'player');
  assert.equal(res.success, true);

  // Initial spirit went to deck bottom
  assert.equal(p.deck[p.deck.length - 1].id, idolSpirit.id);

  // Stage Style card is now top of the field stack in REFRESHED state
  assert.equal(stack.top.id, stageStyleCard.id);
  assert.equal(stack.state, 'REFRESHED');
  assert.equal(stack.cores.normal, 2, 'Cores preserved on stack');
});

test('Wave 6 - Rumble mills cards at battle end reduced by blocker cost', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  opp.deck = Array.from({ length: 10 }, (_, i) => createCardInstance({ name: `Opp Deck ${i}` }, 'opponent'));

  const rumbleAttacker = createCardInstance({
    cardNumber: '26RBS01-082',
    name: 'Badgernan',
    effect: '[LV1-2] [Rumble: 4] [During Attack] At end of battle, discard four cards from opposing decktop minus blocker cost.'
  }, 'player');

  const attackerStack = createFieldStack(rumbleAttacker, { normal: 1, soul: 0 });
  p.field.push(attackerStack);

  const blockerCard = createCardInstance({
    cardNumber: 'BS01-015',
    name: 'Blocker Unit',
    cost: 2
  }, 'opponent');

  const handler = game.keywords.get('Rumble');
  assert.ok(handler);

  // Rumble: 4 with Cost 2 blocker -> mills 4 - 2 = 2 cards
  await handler.hooks.onBattleEnd({
    game,
    state: game.state,
    attackerStack,
    blockerCard,
    keyword: { name: 'Rumble', parameter: '4' }
  });

  assert.equal(opp.deck.length, 8);
  assert.equal(opp.grave.length, 2);
});
