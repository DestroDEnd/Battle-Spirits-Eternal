import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { extractKeywords, KEYWORD_CATALOG } from '../compiler/keyword_compiler.js';
import { computeEffectiveBP, computeLevel, canAttack, canBlock, isImmune } from '../engine/continuous.js';

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

test('Wave 1 - Supreme Clash forces block and exhausts opposing Spirit/Ultimate', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const supremeClashSpirit = createCardInstance({
    cardNumber: 'BS28-X01',
    name: 'The Ultimate Dragon Emperor',
    effect: '[Supreme Clash]'
  }, 'player');

  const attacker = createFieldStack(supremeClashSpirit, { normal: 2, soul: 0 });
  p.field.push(attacker);

  const oppTarget = createFieldStack(createCardInstance({ name: 'Opp Spirit' }, 'opponent'), { normal: 1, soul: 0 });
  oppTarget.state = 'REFRESHED';
  opp.field.push(oppTarget);

  await game.declareAttack(attacker.id, 'player');

  assert.equal(game.state.combat.mustBlockIfAble, true);
  assert.deepEqual(game.state.combat.blockerTypes, ['Spirit', 'Ultimate']);
  assert.equal(oppTarget.state, 'EXHAUSTED', 'Opposing unit exhausted by Supreme Clash');
});

test('Wave 1 - Grand Assault exhausts a Nexus to refresh attacker and gates blocker symbols', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const grandAssaultSpirit = createCardInstance({
    cardNumber: 'BS38-X01',
    name: 'The Colossus God',
    symbols: ['Blue', 'Blue'],
    effect: '[Grand Assault: 1]'
  }, 'player');

  const attacker = createFieldStack(grandAssaultSpirit, { normal: 3, soul: 0 });
  p.field.push(attacker);

  const nexus = { id: 'nexus_1', name: 'Tower of Water', state: 'REFRESHED' };
  p.nexus = [nexus];

  await game.declareAttack(attacker.id, 'player');

  assert.equal(nexus.state, 'EXHAUSTED', 'Nexus exhausted to trigger Grand Assault');
  assert.equal(attacker.state, 'REFRESHED', 'Attacker refreshed by Grand Assault');
  assert.equal(game.state.combat.blockerMinSymbols, 2, 'Blocker requires at least 2 symbols');

  // Blocker with 1 symbol cannot block
  const singleSymbolBlocker = createFieldStack(createCardInstance({ name: 'Soldier', symbols: ['Blue'] }, 'opponent'), { normal: 1, soul: 0 });
  assert.equal(canBlock(game.state, singleSymbolBlocker), false, '1-symbol blocker cannot block against 2-symbol Grand Assault');
});

test('Wave 1 - Ultra Awaken refreshes on BP comparison if unit has 4 or more cores', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const ultraAwakenSpirit = createCardInstance({
    cardNumber: 'BS10-X01',
    name: 'The PhantomStarDragon Gai-Asura',
    levels: { 1: { cost: 1, bp: 5000 } },
    effect: '[Ultra Awaken]'
  }, 'player');

  // Give attacker 4 cores
  const attacker = createFieldStack(ultraAwakenSpirit, { normal: 4, soul: 0 });
  p.field.push(attacker);

  const blocker = createFieldStack(createCardInstance({ name: 'Opp Blocker', bp: 3000 }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(blocker);

  await game.declareAttack(attacker.id, 'player');
  await game.declareBlock(blocker.id, 'opponent');

  assert.equal(attacker.state, 'REFRESHED', 'Ultra Awaken refreshed unit with 4 cores during battle');
});

test('Wave 2 - Violent High Speed summons from hand when Trash has 5+ cores', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  p.trash.normal = 5; // 5 cores in trash
  p.reserve.normal = 0;

  const vhsCard = createCardInstance({
    cardNumber: 'BS31-028',
    name: 'Sonic Hurricane',
    cost: 3,
    effect: '[Violent High Speed]'
  }, 'player');
  p.hand.push(vhsCard);

  const handler = game.keywords.get('Violent High Speed');
  assert.ok(handler);

  // When trash has 5 cores, summons for 0 cost; 1 core onto spirit, 4 cores into reserve, 0 in trash
  const res = await handler.executeViolentHighSpeedSummon(game, vhsCard, 'player');
  assert.equal(res.success, true);
  assert.equal(p.field.length, 1);
  assert.equal(p.field[0].top.name, 'Sonic Hurricane');
  assert.equal(p.field[0].cores.normal, 1, '1 core placed on summoned Spirit');
  assert.equal(p.trash.normal, 0, 'Trash emptied');
  assert.equal(p.reserve.normal, 4, 'Remaining 4 cores moved to reserve');

  // If trash has < 5 cores, summoning is rejected
  p.trash.normal = 4;
  const vhsCard2 = createCardInstance({ name: 'Sonic 2', cost: 2 }, 'player');
  p.hand.push(vhsCard2);
  const res2 = await handler.executeViolentHighSpeedSummon(game, vhsCard2, 'player');
  assert.equal(res2.success, false);
  assert.equal(res2.reason, 'REQUIRE_AT_LEAST_5_TRASH_CORES');
});

test('Wave 2 - Unleash moves Soul Core to Spirit and triggers ability', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  const stack = createFieldStack(createCardInstance({ name: 'Crystal God' }, 'player'), { normal: 2, soul: 0 });
  p.field.push(stack);

  let effectExecuted = false;
  const handler = game.keywords.get('Unleash');
  assert.ok(handler);

  const res = await handler.executeUnleash(game, stack, async () => {
    effectExecuted = true;
  });

  assert.equal(res.success, true);
  assert.equal(stack.cores.soul, 1, 'Soul Core moved to stack');
  assert.equal(effectExecuted, true);
});

test('Wave 4 - Immortality validates condition and revives from Trash', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  p.reserve.normal = 2;

  const immortalityCard = createCardInstance({
    cardNumber: 'BS02-X08',
    name: 'The NetherworldLord Cursed-Dragon',
    cost: 8,
    effect: '[LV1-3] [Immortality: Cost 4/5] (When Destroyed)'
  }, 'player');
  p.grave.push(immortalityCard);

  const handler = game.keywords.get('Immortality');
  assert.ok(handler);

  // Destroyed card is Cost 4
  const destroyedCost4 = createCardInstance({ cost: 4 }, 'player');
  assert.equal(handler.canReviveOnDestruction(destroyedCost4, immortalityCard), true);

  // Destroyed card is Cost 6 -> does not match Cost 4/5
  const destroyedCost6 = createCardInstance({ cost: 6 }, 'player');
  assert.equal(handler.canReviveOnDestruction(destroyedCost6, immortalityCard), false);

  // Execute revival
  const res = await handler.executeRevival(game, immortalityCard, 'player', 1);
  assert.equal(res.success, true);
  assert.equal(p.field.length, 1);
  assert.equal(p.field[0].top.name, 'The NetherworldLord Cursed-Dragon');
  assert.equal(p.grave.length, 0);
});

test('Wave 4 - Tribute, Unsheathe, Showdown, Spellbind, Spell Blight, and Kagemusha mechanics', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // 1. Tribute
  const tributeTarget = createFieldStack(createCardInstance({ name: 'Sacrifice Unit' }, 'player'), { normal: 2, soul: 0 });
  p.field.push(tributeTarget);
  const tributeHandler = game.keywords.get('Tribute');
  const tRes = await tributeHandler.executeTribute(game, tributeTarget, 'player', 'grave');
  assert.equal(tRes.success, true);
  assert.equal(p.grave.length, 1);
  assert.equal(p.field.length, 0);

  // 2. Unsheathe attaches Sword Brave
  const swordBrave = createCardInstance({ name: 'Dragon Sword', type: 'Brave' }, 'player');
  p.hand.push(swordBrave);
  const spiritStack = createFieldStack(createCardInstance({ name: 'Swordmaster' }, 'player'), { normal: 1, soul: 0 });
  p.field.push(spiritStack);

  const unsheatheHandler = game.keywords.get('Unsheathe');
  const uRes = await unsheatheHandler.executeUnsheathe(game, swordBrave, spiritStack, 'player');
  assert.equal(uRes.success, true);
  assert.equal(spiritStack.braves.length, 1);
  assert.equal(spiritStack.braves[0].name, 'Dragon Sword');

  // 3. Showdown
  const showdownHandler = game.keywords.get('Showdown');
  game.state.combat = {};
  await showdownHandler.hooks.onAttackDeclared({ state: game.state });
  assert.equal(game.state.combat.mustBlockIfAble, true);
  assert.equal(game.state.combat.showdownDuel, true);

  // 4. Spellbind prevents refresh
  const oppTarget = createFieldStack(createCardInstance({ name: 'Opp Unit' }, 'opponent'), { normal: 1, soul: 0 });
  oppTarget.state = 'EXHAUSTED';
  oppTarget.spellbound = true;
  opp.field.push(oppTarget);

  game.flow.state.activePlayer = 'opponent';
  await game.flow.executeStepActions('REFRESH');
  assert.equal(oppTarget.state, 'EXHAUSTED', 'Spellbound spirit stays exhausted during Refresh Step');

  // 5. Spell Blight sends 1 core from opponent's Life to Trash, keeps Spirit refreshed on field
  const spellBlightSpirit = createFieldStack(createCardInstance({ name: 'Belphegor' }, 'player'), { normal: 2, soul: 0 });
  spellBlightSpirit.state = 'EXHAUSTED';
  p.field.push(spellBlightSpirit);
  opp.life = 5;
  opp.trash.normal = 0;

  const spellBlightHandler = game.keywords.get('Spell Blight');
  const sbRes = await spellBlightHandler.executeSpellBlight(game, spellBlightSpirit, 'opponent');
  assert.equal(sbRes.success, true);
  assert.equal(sbRes.preventedDestruction, true);
  assert.equal(opp.life, 4, '1 core removed from opponent life');
  assert.equal(opp.trash.normal, 1, '1 core sent to opponent trash');
  assert.equal(spellBlightSpirit.state, 'REFRESHED', 'Spirit remains refreshed on the field');

  // 6. Kagemusha intercepts targeting
  const kagemushaCard = createCardInstance({ name: 'Shadow Interceptor' }, 'player');
  p.hand.push(kagemushaCard);
  const kagemushaHandler = game.keywords.get('Kagemusha');
  const kRes = await kagemushaHandler.executeKagemusha(game, kagemushaCard, spiritStack, 'player');
  assert.equal(kRes.success, true);
  assert.equal(p.field.some(st => st.top.name === 'Shadow Interceptor' && st.state === 'EXHAUSTED'), true);

  // 7. Bombardment reveals decktop, damages opposing life if Emperor Beast, and adds to hand
  const emperorBeastCard = createCardInstance({ name: 'Revol-Tiger', family: 'Emperor Beast' }, 'player');
  p.deck.unshift(emperorBeastCard);
  opp.life = 5;
  opp.reserve.normal = 0;
  const bombardmentHandler = game.keywords.get('Bombardment');
  await bombardmentHandler.hooks.onAttackDeclared({
    state: game.state,
    attackerStack: spiritStack,
    keyword: { name: 'Bombardment', parameter: '1' },
    game
  });
  assert.equal(opp.life, 4, 'Bombardment dealt 1 life damage');
  assert.equal(opp.reserve.normal, 1, 'Life moved to reserve');
  assert.equal(p.hand.some(c => c.name === 'Revol-Tiger'), true, 'Revealed Emperor Beast added to hand');

  // 8. Leap returns opposing exhausted unit to hand and burns 1 life
  opp.field = [];
  const exhaustedOppSpirit = createFieldStack(createCardInstance({ name: 'Opp Exhausted' }, 'opponent'), { normal: 1, soul: 0 });
  exhaustedOppSpirit.state = 'EXHAUSTED';
  opp.field.push(exhaustedOppSpirit);
  const leapHandler = game.keywords.get('Leap');
  await leapHandler.hooks.onAttackDeclared({
    state: game.state,
    attackerStack: spiritStack,
    resolver: game.resolver,
    game
  });
  assert.equal(opp.life, 3, 'Leap dealt 1 life damage');
  assert.equal(opp.field.some(st => st.top.name === 'Opp Exhausted'), false, 'Exhausted spirit bounced from field');
  assert.equal(opp.hand.some(c => c.name === 'Opp Exhausted'), true, 'Bounced spirit returned to opponent hand');

  // 9. Zero Counter destroys free-summoned opposing unit and returns to hand
  const zeroCounterCard = createCardInstance({ name: 'Zeros Barrier', type: 'Magic' }, 'player');
  p.hand.push(zeroCounterCard);
  p.reserve.normal = 2;
  const freeSummonedOpp = createFieldStack(createCardInstance({ name: 'Free Beast', type: 'Spirit' }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(freeSummonedOpp);
  const zeroCounterHandler = game.keywords.get('Zero Counter');
  const zcRes = await zeroCounterHandler.executeZeroCounter(game, zeroCounterCard, freeSummonedOpp, 'player');
  assert.equal(zcRes.success, true);
  assert.equal(zcRes.returnedToHand, true, 'Zero counter returned to hand by paying 1 cost');
  assert.equal(opp.field.some(st => st.top.name === 'Free Beast'), false, 'Free summoned enemy destroyed');
  assert.equal(opp.grave.some(c => c.name === 'Free Beast'), true, 'Free summoned enemy in grave');

  // 10. Enchain verifies color condition and skips step
  const enchainHandler = game.keywords.get('Enchain');
  const enchainRes = await enchainHandler.executeEnchainSkipStep(game, 'MAIN', 'opponent');
  assert.equal(enchainRes.success, true);
  assert.equal(game.state.skipStepOnce['opponent'].includes('MAIN'), true, 'Opponent main step flagged for skip');
});

test('Wave 5 - My Unit, Solo Part, Duet Part, and Funnel mechanics', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const divaAttacker = createFieldStack(createCardInstance({ name: 'Lead Diva', family: 'Diva' }, 'player'), { normal: 1, soul: 0 });
  const divaBackup = createFieldStack(createCardInstance({ name: 'Chorus Diva', family: 'Diva' }, 'player'), { normal: 1, soul: 0 });
  divaBackup.state = 'EXHAUSTED';
  p.field.push(divaAttacker, divaBackup);

  // My Unit
  const myUnitHandler = game.keywords.get('My Unit');
  const mRes = await myUnitHandler.executeMyUnit(game, divaAttacker, 1, 'player');
  assert.equal(mRes.success, true);

  // Solo Part & Duet Part
  const soloHandler = game.keywords.get('Solo Part');
  const duetHandler = game.keywords.get('Duet Part');
  assert.equal(soloHandler.isActive(game.state, divaAttacker), true);
  assert.equal(duetHandler.isActive(game.state, divaAttacker), true);

  // Funnel destroys opposing unit
  const oppEnemy = createFieldStack(createCardInstance({ name: 'Enemy Gundam' }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(oppEnemy);
  const funnelHandler = game.keywords.get('Funnel');
  const fRes = await funnelHandler.executeFunnel(game, divaAttacker, 2, oppEnemy);
  assert.equal(fRes.success, true);
  assert.equal(opp.field.length, 0);
  assert.equal(opp.grave.length, 1);
});

test('Wave 6 - Flag Contract Advent, Soul Magic, Amplify, and Level Up', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;

  // 1. Flag Contract Advent
  const flagNexus = createFieldStack(createCardInstance({ name: 'Contract Flag Nexus', type: 'Contract Nexus' }, 'player'), { normal: 1, soul: 1 });
  p.field.push(flagNexus);
  const adventCard = createCardInstance({ name: 'Advent Emperor', type: 'Spirit' }, 'player');
  p.hand.push(adventCard);

  const flagHandler = game.keywords.get('Flag Contract Advent');
  const fRes = await flagHandler.executeFlagContractAdvent(game, adventCard, flagNexus, 'player');
  assert.equal(fRes.success, true);
  assert.equal(flagNexus.top.name, 'Advent Emperor');
  assert.equal(flagNexus.under.length, 1);

  // 2. Soul Magic
  p.reserve.soul = 1;
  const magicCard = createCardInstance({ name: 'Cosmic Burst', type: 'Magic' }, 'player');
  const soulMagicHandler = game.keywords.get('Soul Magic');
  const sRes = await soulMagicHandler.executeSoulMagic(game, magicCard, 'player');
  assert.equal(sRes.success, true);
  assert.equal(p.reserve.soul, 0);
  assert.equal(p.trash.soul, 1);

  // 3. Amplify
  const amplifySpirit = createFieldStack(createCardInstance({ name: 'Amplifier', effect: '[Amplify]' }, 'player'), { normal: 1, soul: 0 });
  p.field.push(amplifySpirit);
  p.deck = [createCardInstance({ name: 'Bonus Card' }, 'player')];
  await game.events.emit({
    type: 'MAGIC_USED',
    player: 'player',
    card: magicCard
  });
  assert.equal(p.hand.some(c => c.name === 'Bonus Card'), true, 'Amplify triggered bonus draw on Magic use');

  // 4. Level Up
  const levelUpUnit = createFieldStack(createCardInstance({
    name: 'Trainee',
    levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 3000 } }
  }, 'player'), { normal: 1, soul: 0 });
  p.field.push(levelUpUnit);

  assert.equal(computeLevel(levelUpUnit), 1);
  const levelUpHandler = game.keywords.get('Level Up');
  await levelUpHandler.executeLevelUp(game, levelUpUnit, 1);
  assert.equal(computeLevel(levelUpUnit), 2, 'Level Up incremented level to LV2 without extra cores');
});

test('Wave 4 - Plunder, Draw Lock, God-Army, God Strike, Mealtiply, and Barrier', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // 1. Plunder: Discard magic card from opposing hand to opposing trash and cast
  const oppMagic = createCardInstance({ name: 'Flash Vortex', type: 'Magic' }, 'opponent');
  opp.hand = [oppMagic];
  const plunderHandler = game.keywords.get('Plunder');
  assert.ok(plunderHandler, 'Plunder keyword registered');
  const plRes = await plunderHandler.executePlunder(game, 'player', oppMagic, 'FLASH');
  assert.equal(plRes.success, true);
  assert.equal(opp.hand.length, 0, 'Opponent magic card discarded from hand');
  assert.equal(opp.trash.cards.some(c => c.name === 'Flash Vortex'), true, 'Opponent magic moved to trash');

  // 2. Draw Lock: Reveals decktops face-up and caps effect draws at 1
  p.deck = [createCardInstance({ name: 'P1' }, 'player'), createCardInstance({ name: 'P2' }, 'player'), createCardInstance({ name: 'P3' }, 'player')];
  opp.deck = [createCardInstance({ name: 'O1' }, 'opponent'), createCardInstance({ name: 'O2' }, 'opponent'), createCardInstance({ name: 'O3' }, 'opponent')];
  const drawLockHandler = game.keywords.get('Draw Lock');
  assert.ok(drawLockHandler, 'Draw Lock keyword registered');
  const dlRes = await drawLockHandler.executeDrawLock(game, 3);
  assert.equal(dlRes.success, true);
  assert.equal(game.state.drawCapPerEffect, 1);
  assert.equal(p.faceUpDecktopCards.length, 3);
  assert.equal(opp.faceUpDecktopCards.length, 3);

  // 3. God-Army: Summons 1 God-King from hand and 1 from trash
  const handGk = createCardInstance({ name: 'Hand God King', family: 'God-King', type: 'Spirit' }, 'player');
  const trashGk = createCardInstance({ name: 'Trash God King', family: 'God-King', type: 'Spirit' }, 'player');
  p.hand = [handGk];
  p.trash.cards = [trashGk];
  const godArmyHandler = game.keywords.get('God-Army');
  assert.ok(godArmyHandler, 'God-Army keyword registered');
  const gaRes = await godArmyHandler.executeGodArmy(game, 'player', handGk, trashGk);
  assert.equal(gaRes.success, true);
  assert.equal(p.field.some(st => st.top.name === 'Hand God King'), true);
  assert.equal(p.field.some(st => st.top.name === 'Trash God King'), true);

  // 4. God Strike: Forces blocker to pay 1 life core to Void
  opp.life = 4;
  const gkAttacker = createFieldStack(createCardInstance({ name: 'Attacking God King', family: 'God-King' }, 'player'), { normal: 2, soul: 0 });
  const godStrikeHandler = game.keywords.get('God Strike');
  assert.ok(godStrikeHandler, 'God Strike keyword registered');
  assert.equal(godStrikeHandler.isGodStrikeActive(game.state, 'player', gkAttacker), true);
  const gsRes = await godStrikeHandler.executeGodStrikeBlockCost(game, 'opponent');
  assert.equal(gsRes.success, true);
  assert.equal(opp.life, 3, '1 life subtracted from opponent');
  assert.equal(game.state.void, 1, 'Core sent to Void');

  // 5. Mealtiply: Reveals 2 cards, summons Drifting Spirit, discards rest to trash
  p.deck = [
    createCardInstance({ name: 'Drifting Sprout', family: 'Drifting Spirit', cost: 3, type: 'Spirit' }, 'player'),
    createCardInstance({ name: 'Random Magic', type: 'Magic', cost: 5 }, 'player')
  ];
  const mealtiplyHandler = game.keywords.get('Mealtiply');
  assert.ok(mealtiplyHandler, 'Mealtiply keyword registered');
  const mealRes = await mealtiplyHandler.executeMealtiply(game, 'player', 6, 2);
  assert.equal(mealRes.success, true);
  assert.equal(p.field.some(st => st.top.name === 'Drifting Sprout'), true, 'Drifting Spirit summoned');
  assert.equal(p.trash.cards.some(c => c.name === 'Random Magic'), true, 'Unsummoned card discarded to trash');
});
