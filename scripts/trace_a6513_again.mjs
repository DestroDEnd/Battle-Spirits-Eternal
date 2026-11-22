import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const key = 'BATTLE-SPIRITS-A6513';
const cardData = shard[key];
const ab = cardData.abilities[0];
const g = createGame();
const state = g.state;

const hostCard = createCardInstance({
  ...cardData,
  id: `${key}_HOST`,
  type: 'Spirit',
  owner: 'player',
  cost: 4,
  levels: { 1: { cost: 1, bp: 4000 } },
  compiledIr: { abilities: [ab] }
}, 'player');
const hostStack = createFieldStack(hostCard, { normal: 1, soul: 0 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack, currentClause: ab.clauses[0] };

const pSpirit = createCardInstance({
  id: 'P_SPIRIT',
  type: 'Spirit',
  owner: 'player',
  cost: 2,
  levels: { 1: { cost: 1, bp: 2000 } }
}, 'player');
const pStack = createFieldStack(pSpirit, { normal: 1, soul: 0 });
pStack.owner = 'player';
state.players.player.field.push(pStack);

const resolver = new AsyncResolver(new DefaultPromptResolver());
const emitter = { async emit() {} };
const res = await resolver.resolveAbility(state, ab, ctx, emitter);
console.log(`=== ${key} ===`);
console.log('Result:', JSON.stringify(res.results, null, 2));
