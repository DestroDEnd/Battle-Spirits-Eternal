import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { resolveTargets } from '../engine/selectors.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/BS03.json', 'utf8'));

for (const key of ['BATTLE-SPIRITS-A11148', 'BATTLE-SPIRITS-A11637']) {
  const cardData = shard[key];
  const abIdx = key === 'BATTLE-SPIRITS-A11148' ? 0 : 1;
  const ab = cardData.abilities[abIdx];
  const g = createGame();
  const state = g.state;

  const hostCard = createCardInstance({
    ...cardData,
    id: `${key}_HOST`,
    type: 'Nexus',
    owner: 'player',
    cost: 3,
    levels: { 1: { cost: 1, bp: 0 } },
    compiledIr: { abilities: [ab] }
  }, 'player');
  const hostStack = createFieldStack(hostCard, { normal: 1, soul: 0 });
  hostStack.owner = 'player';
  state.players.player.field.push(hostStack);

  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack, currentClause: ab.clauses[0] };

  // Add dummy spirit with Magician and no printed effects
  const pSpirit = createCardInstance({
    id: 'P_SPIRIT',
    type: 'Spirit',
    owner: 'player',
    cost: 2,
    families: ['Magician'],
    effect: '', // no printed effect
    isVanilla: true,
    levels: { 1: { cost: 1, bp: 2000 } }
  }, 'player');
  const pStack = createFieldStack(pSpirit, { normal: 1, soul: 0 });
  pStack.owner = 'player';
  state.players.player.field.push(pStack);

  const resolver = new AsyncResolver(new DefaultPromptResolver());
  const emitter = { async emit() {} };
  const res = await resolver.resolveAbility(state, ab, ctx, emitter);
  console.log(`=== ${key} ===`);
  console.log('Clause rawText:', ab.clauses[0].rawText);
  console.log('StoredOp:', JSON.stringify(ab.clauses[0].op));
  console.log('Result:', JSON.stringify(res.results, null, 2));
}
