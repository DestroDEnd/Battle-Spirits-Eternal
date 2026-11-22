import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cardData = shard['BATTLE-SPIRITS-A6513'];
const ab = cardData.abilities[0];

const g = createGame();
const state = g.state;
const events = [];
const emitter = { list: events, async emit(ev) { events.push(ev); } };
const resolver = new AsyncResolver();
const prompt = new DefaultPromptResolver();

const hostCard = createCardInstance({
  ...cardData,
  id: `${cardData.cardNumber || cardData.id}_HOST`,
  owner: 'player',
  cost: 4,
  levels: { 1: { cost: 1, bp: 4000 } },
  compiledIr: { abilities: [ab] }
}, 'player');
const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

const storedOp = ab.clauses[0].op;
const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
const tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
const types = Array.isArray(tgtSpec.types) && tgtSpec.types.length > 0 ? tgtSpec.types : ['Spirit'];
const eligType = types[0];

const eligCard = createCardInstance({
  id: 'ELIG-TGT',
  owner: tgtSide,
  type: eligType,
  cost: 2,
  color: 'Red',
  colors: ['Red'],
  families: ['Dragon'],
  levels: { 1: { cost: 1, bp: 2000 } }
}, tgtSide);
const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
eligStack.owner = tgtSide;
if (String(tgtSpec.state || '').toUpperCase() === 'EXHAUSTED' || tgtSpec.filter?.exhausted) eligStack.state = 'EXHAUSTED';

const ineligCard = createCardInstance({
  id: 'INELIG-TGT',
  owner: tgtSide,
  type: 'Spirit',
  cost: 8,
  levels: { 1: { cost: 1, bp: 20000 } }
}, tgtSide);
const ineligStack = createFieldStack(ineligCard, { normal: 1, soul: 0 });
ineligStack.owner = tgtSide;

state.players[tgtSide].field.push(eligStack, ineligStack);

const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
console.log('Result:', JSON.stringify(res, null, 2));
