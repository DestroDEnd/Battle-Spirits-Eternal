import fs from 'fs';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { getDetailedCardMap, loadStoredShardCard } from '../tests/helpers/card_e2e_framework.mjs';

const tests = [
  { key: 'BATTLE-SPIRITS-A6513', shard: 'BS03.json', ab: 0 },
  { key: 'BATTLE-SPIRITS-A9305', shard: 'BS03.json', ab: 0 },
  { key: 'VER-THANDIA2', shard: 'BS03.json', ab: 0 },
  { key: 'BATTLE-SPIRITS-A184', shard: 'BS04.json', ab: 0 }
];

const detMap = getDetailedCardMap();

for (const t of tests) {
  const shard = JSON.parse(fs.readFileSync(`data/ir_shards/${t.shard}`, 'utf8'));
  const cardData = shard[t.key];
  const ab = cardData.abilities[t.ab];
  const det = detMap.get(t.key);

  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();

  const hostCard = createCardInstance({
    ...cardData,
    type: cardData.type || det?.type || 'Spirit',
    id: `${t.key}_HOST`,
    owner: 'player',
    cost: typeof cardData.cost === 'number' ? cardData.cost : (typeof det?.cost === 'number' ? det.cost : 4),
    levels: cardData.levels || det?.levels || { 1: { cost: 1, bp: 4000 } },
    families: cardData.families || det?.families || (det?.family ? [det.family] : []),
    colors: cardData.colors || det?.colors || (det?.color ? [det.color] : ['Red']),
    compiledIr: { abilities: [ab] }
  }, 'player');
  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  hostStack.owner = 'player';
  state.players.player.field.push(hostStack);

  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  const clauseText = String(ab.clauses[0]?.rawText || '');
  const tgtSpec = (typeof ab.clauses[0].op.target === 'object' && ab.clauses[0].op.target) ? ab.clauses[0].op.target : {};
  let tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
  if (tgtSpec.side === 'either') {
    if (/(?:your\s+opponent|opposing)/i.test(clauseText)) tgtSide = 'opponent';
    else if (/(?:spirits?\s+you\s+control|spirit\s+you\s+control|your\s+(?:cost|\d+|spirit|nexus))/i.test(clauseText)) tgtSide = 'player';
  }

  let eligFam = tgtSpec.filter?.family || tgtSpec.filters?.family || 'Dragon';
  const famMatch = clauseText.match(/"([^"]+)"\s*(?:family|spirits?|spirit)/i);
  if (famMatch) eligFam = famMatch[1];

  const eligCard = createCardInstance({
    id: 'ELIG-TGT',
    owner: tgtSide,
    type: 'Spirit',
    cost: 2,
    families: [eligFam, 'Dragon', 'Giant Beast'],
    levels: { 1: { cost: 1, bp: 2000 } }
  }, tgtSide);
  const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
  eligStack.owner = tgtSide;
  state.players[tgtSide].field.push(eligStack);

  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  console.log(`=== ${t.key} === success: ${res.success}`);
  console.log(`  hostStack state: ${hostStack.state}, eligStack state: ${eligStack.state}`);
  console.log(`  either exhausted: ${hostStack.state === 'EXHAUSTED' || eligStack.state === 'EXHAUSTED'}`);
}
