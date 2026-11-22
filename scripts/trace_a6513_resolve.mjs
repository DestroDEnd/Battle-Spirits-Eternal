import fs from 'fs';
import { createGame } from '../engine/index.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { resolveTargets } from '../engine/selectors.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cardData = shard['BATTLE-SPIRITS-A6513'];
const ab = cardData.abilities[0];

const g = createGame();
const state = g.state;

const hostCard = createCardInstance({
  ...cardData,
  id: 'HOST',
  type: 'Spirit',
  owner: 'player',
  cost: 4,
  levels: { 1: { cost: 1, bp: 4000 } },
  compiledIr: { abilities: [ab] }
}, 'player');
const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = {
  controller: 'player',
  sourceCard: hostCard,
  sourceStack: hostStack,
  currentClause: ab.clauses[0]
};

const myCard = createCardInstance({
  id: 'MY_TGT',
  type: 'Spirit',
  owner: 'player',
  cost: 2,
  levels: { 1: { cost: 1, bp: 2000 } }
}, 'player');
const myStack = createFieldStack(myCard, { normal: 1, soul: 0 });
myStack.owner = 'player';
state.players.player.field.push(myStack);

const targetSpec = ab.clauses[0].op.target;
console.log('Clause rawText:', ab.clauses[0].rawText);
console.log('targetSpec:', targetSpec);

resolveTargets(state, targetSpec, ctx, null, { defaultSide: 'opp', defaultTypes: ['Spirit'] }).then(res => {
  console.log('Targets result:', JSON.stringify(res, null, 2));
});
