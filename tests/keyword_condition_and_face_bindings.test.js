import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { compileCard } from '../compiler/index.js';
import { isImmune } from '../engine/continuous.js';

test('Keyword Condition Binding - Level Gating strictly prevents lower-level keyword activation', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  // Compile a card with LV2-gated Clash
  const colonelRaw = {
    cardNumber: 'BS14-001',
    name: 'Colonel-Dragon',
    levels: {
      1: { cost: 1, bp: 3000 },
      2: { cost: 3, bp: 5000 },
      3: { cost: 5, bp: 7000 }
    },
    effect: `[LV1][LV2][LV3] (When Attacks)
This Spirit gains +3000 BP.

[LV2][LV3] [Clash] (When Attacks)
The opponent must block if possible.`
  };

  const compiled = compileCard(colonelRaw);
  assert.ok(compiled.keywords.length > 0);
  const clashKw = compiled.keywords.find(k => k.name === 'Clash');
  assert.ok(clashKw, 'Clash keyword found on compiled card');
  assert.deepEqual(clashKw.levels, [2, 3], 'Clash strictly bound to LV2 and LV3');
  assert.equal(clashKw.levelExplicit, true);

  const cardInst = createCardInstance(compiled, 'player');

  // Case A: Spirit on field at LV1 (1 core)
  const stack = createFieldStack(cardInst, { normal: 1, soul: 0 });
  p.field.push(stack);

  const oppSpirit = createFieldStack(createCardInstance({ name: 'Opp Spirit' }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(oppSpirit);

  // Attack at LV1
  await game.declareAttack(stack.id, 'player');

  // Clash MUST NOT be active at LV1!
  assert.equal(Boolean(game.state.combat?.mustBlockIfAble), false, 'Clash should not trigger at LV1');

  // Case B: Level up to LV2 (3 cores)
  stack.cores.normal = 3;
  stack.state = 'REFRESHED';
  game.state.combat = null; // reset combat

  await game.declareAttack(stack.id, 'player');

  // Clash MUST be active at LV2!
  assert.equal(game.state.combat.mustBlockIfAble, true, 'Clash triggers at LV2');
});

test('Keyword Condition Binding - Level Gating for Armor / Heavy Armor immunity', () => {
  resetInstanceIdCounter();
  const game = createGame();

  const heavyArmorCard = compileCard({
    cardNumber: 'TEST-HA-01',
    name: 'Chrysanthe Guard',
    levels: {
      1: { cost: 1, bp: 2000 },
      2: { cost: 2, bp: 4000 }
    },
    effect: `[LV1][LV2]
Either player's Life can't be reduced by attacks of Cost 0/1/3 Spirits.

[LV2] [Heavy Armor: Purple]
This Spirit is unaffected by opposing Purple Spirit/Brave/Nexus/Magic effects.`
  });

  const haKw = heavyArmorCard.keywords.find(k => k.name === 'Heavy Armor');
  assert.ok(haKw);
  assert.deepEqual(haKw.levels, [2], 'Heavy Armor bound strictly to LV2');
  assert.equal(haKw.parameter, 'Purple');

  const cardInst = createCardInstance(heavyArmorCard, 'player');
  const purpleSpell = createCardInstance({ name: 'Dark Spell', color: 'Purple', type: 'Magic' }, 'opponent');

  // At LV1 (1 core): Heavy Armor is NOT active -> Not immune
  const stack = createFieldStack(cardInst, { normal: 1, soul: 0 });
  assert.equal(isImmune(game.state, stack, purpleSpell), false, 'Not immune at LV1');

  // At LV2 (2 cores): Heavy Armor IS active -> Immune to Purple
  stack.cores.normal = 2;
  assert.equal(isImmune(game.state, stack, purpleSpell), true, 'Immune to Purple at LV2');

  // Non-matching color (Red) -> Not immune even at LV2
  const redSpell = createCardInstance({ name: 'Flame Spell', color: 'Red', type: 'Magic' }, 'opponent');
  assert.equal(isImmune(game.state, stack, redSpell), false, 'Not immune to Red');
});

test('Keyword Face Binding - Rebirth cards differentiate Face A and Face B keywords', () => {
  resetInstanceIdCounter();
  const game = createGame();

  // Face A: Has Rebirth trigger
  const faceACard = compileCard({
    cardNumber: 'BS52-034',
    name: 'Ragna-Savior -Fighting Form-',
    face: 'A',
    effect: `[LV1][LV2] [Rebirth: 5 Counters or less]
When this Spirit attacks, you can flip it.`
  });

  assert.equal(faceACard.keywords[0].name, 'Rebirth');
  assert.equal(faceACard.keywords[0].face, 'A');

  // Face B: Has Whirlwind on Reborn side
  const faceBCard = compileCard({
    cardNumber: 'BS52-034-A1560',
    name: 'Ragna-Savior -Flying Form-',
    face: 'B',
    effect: `[During Rebirth] [LV1][LV2][LV3] [Whirlwind: 2] (When Reborn/Attacks)
Heavy exhaust two opposing Spirits/Ultimates.`
  });

  assert.equal(faceBCard.keywords[0].name, 'Whirlwind');
  assert.equal(faceBCard.keywords[0].face, 'B');

  const stack = createFieldStack(createCardInstance(faceBCard, 'player'), { normal: 2, soul: 0 });

  // When stack is not flipped (Face A active): Face B keyword is NOT active
  stack.isFlipped = false;
  stack.currentFace = 'A';
  const activeUnflipped = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(activeUnflipped.length, 0, 'Face B keyword inactive while stack is on Face A');

  // When stack is flipped (Face B active): Face B keyword IS active
  stack.isFlipped = true;
  stack.currentFace = 'B';
  const activeFlipped = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(activeFlipped.length, 1);
  assert.equal(activeFlipped[0].name, 'Whirlwind');
  assert.equal(activeFlipped[0].face, 'B');
});

test('Keyword Condition Binding - Soul State cards only activate Soul State keywords', () => {
  resetInstanceIdCounter();
  const game = createGame();

  const contractCard = compileCard({
    cardNumber: 'BS60-CX01',
    name: 'Top Buddy, Aibou',
    is_contract_partner: true,
    effect: `[Soul State] [Contract Pre-Advent]/[Spirit] [LV1][LV2] Flash - [Toppa Awaken]
You can put any number of cores from your Reserve/Field to a target Spirit/Nexus.

[Contract Pre-Advent]/[Spirit] [LV1][LV2] [Clash] (When Attacks)
The opponent must block if possible.`
  });

  const cardInst = createCardInstance(contractCard, 'player');
  const stack = createFieldStack(cardInst, { normal: 0, soul: 1 });

  // In Soul State:
  stack.isSoulState = true;

  const soulStateActive = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(soulStateActive.some(k => k.name === 'Toppa Awaken'), true, 'Toppa Awaken is active in Soul State');
  assert.equal(soulStateActive.some(k => k.name === 'Clash'), false, 'Clash is NOT active in Soul State');

  // Restored to Spirit form on field:
  stack.isSoulState = false;
  stack.cores.normal = 1;
  const spiritActive = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(spiritActive.some(k => k.name === 'Clash'), true, 'Clash is active when on field as Spirit');
});

test('Keyword Condition Binding - During Advent requirement', () => {
  resetInstanceIdCounter();
  const game = createGame();

  const adventCard = compileCard({
    cardNumber: 'BS40-X01',
    name: 'Gale-Phoenix Advent',
    effect: `[During Advent] [LV1][LV2][LV3] [Whirlwind: 1] (When Attacks)
Heavy exhaust an opposing Spirit.`
  });

  const kw = adventCard.keywords.find(k => k.name === 'Whirlwind');
  assert.ok(kw);
  assert.equal(kw.duringAdvent, true, 'Marked as requiring During Advent');

  const stack = createFieldStack(createCardInstance(adventCard, 'player'), { normal: 1, soul: 0 });

  // Without cards stacked under (not during advent)
  stack.under = [];
  const activeBefore = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(activeBefore.some(k => k.name === 'Whirlwind'), false, 'Whirlwind inactive without Advent stack');

  // With a pre-advent card stacked under
  stack.under = [createCardInstance({ name: 'Base Spirit' }, 'player')];
  const activeAfter = game.keywords.getActiveKeywords(stack, {}, game.state);
  assert.equal(activeAfter.some(k => k.name === 'Whirlwind'), true, 'Whirlwind active During Advent');
});
