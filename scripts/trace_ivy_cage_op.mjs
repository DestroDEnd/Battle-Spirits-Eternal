import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { getDetailedCardMap, loadStoredShardCard } from '../tests/helpers/card_e2e_framework.mjs';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cardData = shard['BS03-127'];
const ab = cardData.abilities[0];

const g = createGame();
const state = g.state;
const events = [];
const emitter = { list: events, async emit(ev) { events.push(ev); } };
const resolver = new AsyncResolver();
const prompt = new DefaultPromptResolver();

const detMap = getDetailedCardMap();
const det = detMap.get('BS03-127');

const hostCard = createCardInstance({
  ...cardData,
  type: det?.type || 'Magic',
  id: 'HOST',
  owner: 'player',
  cost: det?.cost || 3,
  levels: det?.levels || {},
  compiledIr: { abilities: [ab] }
}, 'player');
const hostStack = createFieldStack(hostCard, { normal: 1, soul: 0 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

const storedOp = ab.clauses[0].op;
console.log('StoredOp for BS03-127:', JSON.stringify(storedOp, null, 2));

const eligCard = createCardInstance({
  id: 'ELIG-TGT',
  owner: 'opponent',
  type: 'Spirit',
  cost: 2,
  levels: { 1: { cost: 1, bp: 1500 } }
}, 'opponent');
const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
eligStack.owner = 'opponent';
state.players.opponent.field.push(eligStack);

const ineligCard = createCardInstance({
  id: 'INELIG-TGT',
  owner: 'opponent',
  type: 'Spirit',
  cost: 8,
  levels: { 1: { cost: 1, bp: 20000 } }
}, 'opponent');
const ineligStack = createFieldStack(ineligCard, { normal: 1, soul: 0 });
ineligStack.owner = 'opponent';
state.players.opponent.field.push(ineligStack);

const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
console.log('Resolve result:', JSON.stringify(res.results, null, 2));
console.log('eligStack state:', eligStack.state);
