import fs from 'fs';
import { createGame } from '../engine/index.js';
import { createFieldStack } from '../engine/state.js';
import { resolveTargets, queryCandidates } from '../engine/selectors.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/26RCB01.json', 'utf8'));
const cardData = shard['26RCB01-008'];
const ab = cardData.abilities[0];

const g = createGame();
const state = g.state;

const hostCard = {
  ...cardData,
  id: '26RCB01-008_HOST',
  owner: 'player',
  cost: 4,
  levels: { 1: { cost: 1, bp: 4000 } },
  compiledIr: { abilities: [ab] }
};
const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
hostStack.owner = 'player';
state.players.player.field.push(hostStack);

const ctx = {
  controller: 'player',
  sourceCard: hostCard,
  sourceStack: hostStack,
  currentClause: ab.clauses[0]
};

const storedOp = ab.clauses[0].op;
console.log('queryCandidates with op.target:', queryCandidates(state, storedOp.target, ctx));

resolveTargets(state, storedOp.target, ctx).then(res => {
  console.log('resolveTargets res:', res);
});
