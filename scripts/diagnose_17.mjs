import fs from 'fs';
import path from 'path';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { createGameState, createCardInstance, createFieldStack } from '../engine/state.js';

const shard = JSON.parse(fs.readFileSync('data/ir_shards/26RCB01.json', 'utf8'));
const cardData = shard['26RCB01-008'];
console.log('Card Name:', cardData.name);
console.log('Abilities count:', cardData.abilities.length);
const ab = cardData.abilities[0];
console.log('Ability 0:', JSON.stringify(ab, null, 2));

// Setup state like card_e2e_framework
const state = createGameState();
const hostCard = createCardInstance({ ...cardData, id: 'HOST' }, 'player');
const hostStack = createFieldStack(hostCard, { normal: 2, soul: 1 });
state.players.player.field.push(hostStack);

const storedOp = ab.clauses[0].op;
console.log('Stored op:', JSON.stringify(storedOp, null, 2));

const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
const tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
const eligCard = createCardInstance({ id: 'ELIG-TGT', type: 'Spirit', cost: 2, levels: { 1: { cost: 1, bp: 2000 } } }, tgtSide);
const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
eligStack.owner = tgtSide;
state.players[tgtSide].field.push(eligStack);

const resolver = new AsyncResolver(new DefaultPromptResolver());
const emitter = new EventBus();
const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

resolver.resolveAbility(state, ab, ctx, emitter).then(res => {
  console.log('\nResolve Result:', JSON.stringify(res, null, 2));
}).catch(err => {
  console.error('\nResolve Error:', err);
});
