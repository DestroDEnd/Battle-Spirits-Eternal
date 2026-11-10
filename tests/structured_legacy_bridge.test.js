import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCard } from '../compiler/index.js';
import { resolveLegacyAbility } from '../engine/legacy_bridge.js';

function makeLegacyCard(cardNumber, name, effect = '', extra = {}) {
  return {
    uid: cardNumber,
    card_number: cardNumber,
    name,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    family: '',
    families: [],
    cost: 2,
    levels: [
      { level: 1, cores: 1, bp: 1000 },
      { level: 2, cores: 3, bp: 3000 }
    ],
    currentCores: 1,
    currentLevel: 1,
    currentBp: 1000,
    isExhausted: false,
    effect,
    ...extra
  };
}

function makeLegacyDuel(source, deck = []) {
  return {
    turn: 2,
    phaseIndex: 4,
    phases: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],
    activePlayer: 'player',
    modifiers: [],
    player: {
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      deck,
      hand: [],
      field: [source],
      nexus: [],
      soulCoreLocation: 'reserve',
      burst: null,
      mirage: null
    },
    opponent: {
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      deck: [],
      hand: [],
      field: [],
      nexus: [],
      soulCoreLocation: 'reserve',
      burst: null,
      mirage: null
    }
  };
}

test('browser-style legacy duel resolves a compiled Draw clause and syncs zones back', async () => {
  const drawn = makeLegacyCard('TEST-DRAW-1', 'Drawn Card');
  const source = makeLegacyCard('TEST-DRAW-SOURCE', 'Draw Spirit');
  const duel = makeLegacyDuel(source, [drawn]);
  const ability = compileCard({
    card_number: source.card_number,
    name: source.name,
    type: 'Spirit',
    effect: '[LV1] (When Summoned) Draw a card.'
  }).abilities[0];

  const result = await resolveLegacyAbility(duel, source, ability, 'player');

  assert.equal(result.success, true);
  assert.equal(duel.player.deck.length, 0);
  assert.equal(duel.player.hand.length, 1);
  assert.equal(duel.player.hand[0], drawn);
});

test('structured target prompts pause and map the selected legacy card back to its zone', async () => {
  const source = makeLegacyCard('TEST-CORE-SOURCE', 'Core Spirit');
  const target = makeLegacyCard('TEST-EXHAUST-TARGET', 'Opposing Spirit');
  const duel = makeLegacyDuel(source);
  duel.opponent.field.push(target);
  const ability = compileCard({
    card_number: source.card_number,
    name: source.name,
    type: 'Spirit',
    effect: '[LV1] (When Summoned) Exhaust an opposing Spirit.'
  }).abilities[0];
  const prompts = [];

  await resolveLegacyAbility(duel, source, ability, 'player', {
    async choose(prompt) {
      prompts.push(prompt.type);
      return [prompt.candidates.find(candidate => candidate.card?.uid === target.uid)];
    }
  });

  assert.ok(prompts.includes('SELECT_EXHAUST'), JSON.stringify(prompts));
  assert.equal(target.isExhausted, true);
});
