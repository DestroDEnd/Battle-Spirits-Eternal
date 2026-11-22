import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const cards = [
  { key: 'BATTLE-SPIRITS-A6513', ab: 0 },
  { key: 'BATTLE-SPIRITS-A9188', ab: 1 },
  { key: 'BATTLE-SPIRITS-A9305', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11148', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11637', ab: 1 },
  { key: 'VER-THANDIA2', ab: 0 }
];

for (const c of cards) {
  const cardData = shard[c.key];
  const ab = cardData.abilities[c.ab];
  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();

  const hostCard = createCardInstance({
    ...cardData,
    id: `${c.key}_HOST`,
    type: 'Spirit',
    owner: 'player',
    cost: 4,
    levels: { 1: { cost: 1, bp: 4000 } },
    compiledIr: { abilities: [ab] }
  }, 'player');
  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  hostStack.owner = 'player';
  state.players.player.field.push(hostStack);

  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  // create candidate stacks on both sides
  const oppCard = createCardInstance({
    id: 'OPP_TGT',
    type: 'Spirit',
    owner: 'opponent',
    cost: 2,
    families: ['Giant Beast', 'Magician'],
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'opponent');
  const oppStack = createFieldStack(oppCard, { normal: 1, soul: 0 });
  oppStack.owner = 'opponent';
  state.players.opponent.field.push(oppStack);

  const myCard = createCardInstance({
    id: 'MY_TGT',
    type: 'Spirit',
    owner: 'player',
    cost: 2,
    families: ['Giant Beast', 'Magician'],
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');
  const myStack = createFieldStack(myCard, { normal: 1, soul: 0 });
  myStack.owner = 'player';
  state.players.player.field.push(myStack);

  // If text says exhausted, exhaust them
  if (/exhausted/i.test(ab.clauses[0].rawText)) {
    hostStack.state = 'EXHAUSTED';
    myStack.state = 'EXHAUSTED';
    oppStack.state = 'EXHAUSTED';
  }

  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  console.log(`=== ${c.key} === success=${res.success}, status=${res.results?.[0]?.status}, reason=${res.results?.[0]?.reason}`);
}
