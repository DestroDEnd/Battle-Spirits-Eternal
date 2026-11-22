import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack } from '../engine/state.js';
import { getDetailedCardMap } from '../tests/helpers/card_e2e_framework.mjs';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));
const detMap = getDetailedCardMap();

const testCards = [
  { key: 'BATTLE-SPIRITS-A9188', ab: 1 },
  { key: 'BATTLE-SPIRITS-A9305', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11148', ab: 0 },
  { key: 'BATTLE-SPIRITS-A11637', ab: 1 },
  { key: 'VER-THANDIA2', ab: 0 }
];

for (const tc of testCards) {
  const cardData = shard[tc.key];
  const ab = cardData.abilities[tc.ab];
  const det = detMap.get(tc.key);

  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();

  const hostCard = {
    ...cardData,
    id: `${tc.key}_HOST`,
    owner: 'player',
    cost: typeof cardData.cost === 'number' ? cardData.cost : 4,
    levels: cardData.levels || { 1: { cost: 1, bp: 4000 } },
    compiledIr: { abilities: cardData.abilities || [ab] }
  };
  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  hostStack.owner = 'player';
  state.players.player.field.push(hostStack);

  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  const storedOp = ab.clauses[0].op;
  const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
  const tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
  const types = Array.isArray(tgtSpec.types) && tgtSpec.types.length > 0 ? tgtSpec.types : ['Spirit'];
  const eligType = types[0];

  const eligCard = {
    id: 'ELIG-TGT',
    owner: tgtSide,
    type: eligType,
    cost: 2,
    color: 'Red',
    colors: ['Red'],
    families: ['Dragon'],
    levels: { 1: { cost: 1, bp: 2000 } }
  };
  const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
  eligStack.owner = tgtSide;
  if (String(tgtSpec.state || '').toUpperCase() === 'EXHAUSTED' || tgtSpec.filter?.exhausted) eligStack.state = 'EXHAUSTED';

  const ineligCard = {
    id: 'INELIG-TGT',
    owner: tgtSide,
    type: 'Spirit',
    cost: 8,
    levels: { 1: { cost: 1, bp: 20000 } }
  };
  const ineligStack = createFieldStack(ineligCard, { normal: 1, soul: 0 });
  ineligStack.owner = tgtSide;

  state.players[tgtSide].field.push(eligStack, ineligStack);

  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  console.log(`\n=== ${tc.key} ===`);
  console.log('Clause rawText:', ab.clauses[0].rawText);
  console.log('storedOp:', JSON.stringify(storedOp));
  console.log('Result status:', res.results?.[0]?.status);
  console.log('Result reason:', res.results?.[0]?.reason);
  console.log('Result success:', res.success);
}
