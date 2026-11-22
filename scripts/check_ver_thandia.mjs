import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { getDetailedCardMap, loadStoredShardCard } from '../tests/helpers/card_e2e_framework.mjs';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cardData = shard['VER-THANDIA2'];
const ab = cardData.abilities[0];

const g = createGame();
const state = g.state;
const events = [];
const emitter = { list: events, async emit(ev) { events.push(ev); } };
const resolver = new AsyncResolver();
const prompt = new DefaultPromptResolver();

const hostCard = createCardInstance({
  ...cardData,
  id: 'HOST',
  type: 'Spirit',
  owner: 'player',
  cost: 4,
  levels: { 1: { cost: 1, bp: 4000 } },
  families: ['Giant Beast'],
  compiledIr: { abilities: [ab] }
}, 'player');
const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

const eligCard = createCardInstance({
  id: 'ELIG-TGT',
  owner: 'player',
  type: 'Spirit',
  cost: 2,
  families: ['Giant Beast'],
  levels: { 1: { cost: 1, bp: 2000 } }
}, 'player');
const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
eligStack.owner = 'player';
state.players.player.field.push(eligStack);

const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
console.log('VER-THANDIA2 res:', JSON.stringify(res.results, null, 2));
console.log('eligStack state after:', eligStack.state);
console.log('hostStack state after:', hostStack.state);
