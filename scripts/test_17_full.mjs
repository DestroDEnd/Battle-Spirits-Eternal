import fs from 'fs';
import assert from 'assert';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { createFieldStack, createCardInstance } from '../engine/state.js';
import { getDetailedCardMap, loadStoredShardCard, compareAbilityStructure } from '../tests/helpers/card_e2e_framework.mjs';
import { compileCard } from '../compiler/index.js';

const failures = [
  { test: '036', shard: '26RBS02.json', key: '26RBS02-X14', ab: 1, op: 'BOUNCE' },
  { test: '048', shard: '26RCB01.json', key: '26RCB01-008', ab: 0, op: 'BOUNCE' },
  { test: '049', shard: '26RCB01.json', key: '26RCB01-011', ab: 1, op: 'BOUNCE' },
  { test: '050', shard: '26RCB01.json', key: '26RCB01-052', ab: 0, op: 'BOUNCE' },
  { test: '052', shard: '26RCB01.json', key: '26RCB01-049', ab: 1, op: 'BOUNCE' },
  { test: '053', shard: '26RCB01.json', key: '26RCB01-021', ab: 1, op: 'BOUNCE' },
  { test: '054', shard: '26RCB01.json', key: '26RCB01-019', ab: 0, op: 'BOUNCE' },
  { test: '055', shard: '26RCB01.json', key: '26RCB01-048', ab: 1, op: 'BOUNCE' },
  { test: '057', shard: '26RCB01.json', key: '26RCB01-024', ab: 0, op: 'BOUNCE' },
  { test: '068', shard: '26RSD07.json', key: '26RSD07-007', ab: 0, op: 'BOUNCE' },
  { test: '069', shard: '26RSD07.json', key: '26RSD07-X02', ab: 0, op: 'BOUNCE' },
  { test: '104', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A6513', ab: 0, op: 'EXHAUST' },
  { test: '105', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A9188', ab: 1, op: 'EXHAUST' },
  { test: '106', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A9305', ab: 0, op: 'EXHAUST' },
  { test: '108', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A11148', ab: 0, op: 'EXHAUST' },
  { test: '109', shard: 'BS03.json', key: 'BATTLE-SPIRITS-A11637', ab: 1, op: 'EXHAUST' },
  { test: '110', shard: 'BS03.json', key: 'VER-THANDIA2', ab: 0, op: 'EXHAUST' }
];

const detMap = getDetailedCardMap();

async function runSingle({ shardFile, cardKey, cardNumber, abIdx, expectedOp }) {
  const det = detMap.get(cardNumber);
  assert.ok(det && det.effect, `Original printed wording missing for ${cardNumber}`);
  const storedCard = loadStoredShardCard(shardFile, cardKey, cardNumber);
  assert.ok(storedCard, `Stored shard card missing for ${cardNumber}`);
  const ab = storedCard.abilities?.[abIdx];
  assert.ok(ab && ab.physicalId && Array.isArray(ab.clauses) && ab.clauses.length === 1, `Stored ability ${abIdx} missing on ${cardNumber}`);
  const storedOp = ab.clauses[0]?.op;
  assert.equal(storedOp?.op, expectedOp, `Stored IR op mismatch on ${cardNumber}`);

  const freshlyCompiled = compileCard(det);
  const freshAb = freshlyCompiled?.abilities?.find(a => a.physicalId === ab.physicalId) || freshlyCompiled?.abilities?.[abIdx];
  const cmp = compareAbilityStructure(freshAb, ab);
  assert.equal(cmp.match, true, `Compiler-to-IR mismatch: ${cmp.reason}`);

  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();

  const hostCard = createCardInstance({
    ...storedCard,
    type: storedCard.type || det?.type || 'Spirit',
    id: `${storedCard.cardNumber || storedCard.id}_HOST`,
    owner: 'player',
    cost: typeof storedCard.cost === 'number' ? storedCard.cost : (typeof det?.cost === 'number' ? det.cost : 4),
    levels: storedCard.levels || det?.levels || { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 7000 } },
    families: storedCard.families || det?.families || (det?.family ? [det.family] : []),
    colors: storedCard.colors || det?.colors || (det?.color ? [det.color] : ['Red']),
    compiledIr: { abilities: storedCard.abilities || [ab] }
  }, 'player');

  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  hostStack.owner = 'player';
  const clauseText = String(ab.clauses[0]?.rawText || '');
  if (/this\s+exhausted/i.test(clauseText)) {
    hostStack.state = 'EXHAUSTED';
  }
  state.players.player.field.push(hostStack);

  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
  let tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
  if (tgtSpec.side === 'either') {
    if (/(?:your\s+opponent|opposing)/i.test(clauseText)) tgtSide = 'opponent';
    else if (/(?:you\s+control|your\s+(?:cost|\d+|spirit|nexus))/i.test(clauseText)) tgtSide = 'player';
  }

  const types = Array.isArray(tgtSpec.types) && tgtSpec.types.length > 0 ? tgtSpec.types : ['Spirit'];
  const eligType = types[0];
  const bpMax = tgtSpec.filter?.bpMax ?? tgtSpec.filters?.bpMax ?? storedOp.bpMax;
  const costMax = tgtSpec.filter?.costMax ?? tgtSpec.filters?.costMax ?? storedOp.costMax;
  const eligBp = typeof bpMax === 'number' ? Math.max(1000, bpMax - 500) : 2000;
  const eligCost = typeof costMax === 'number' ? Math.max(0, costMax - 1) : (typeof tgtSpec.cost === 'number' ? tgtSpec.cost : 2);
  const eligColor = tgtSpec.filter?.color || tgtSpec.filters?.color || 'Red';
  
  let eligFam = tgtSpec.filter?.family || tgtSpec.filters?.family || 'Dragon';
  const famMatch = clauseText.match(/"([^"]+)"\s*(?:family|spirits?|spirit)/i);
  if (famMatch) eligFam = famMatch[1];

  const eligCard = createCardInstance({
    id: 'ELIG-TGT',
    owner: tgtSide,
    type: eligType,
    cost: eligCost,
    color: eligColor,
    colors: [eligColor],
    families: [eligFam, 'Dragon', 'Giant Beast', 'Magician'],
    levels: { 1: { cost: 1, bp: eligBp } }
  }, tgtSide);
  const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
  eligStack.owner = tgtSide;
  if (String(tgtSpec.state || '').toUpperCase() === 'EXHAUSTED' || tgtSpec.filter?.exhausted) {
    eligStack.state = 'EXHAUSTED';
  }

  state.players[tgtSide].field.push(eligStack);

  // If tgtSpec.side is either, also add a valid target to player if tgtSide was opponent, or to opponent if tgtSide was player
  if (tgtSpec.side === 'either') {
    const otherSide = tgtSide === 'player' ? 'opponent' : 'player';
    const otherCard = createCardInstance({
      id: 'OTHER-ELIG-TGT',
      owner: otherSide,
      type: eligType,
      cost: eligCost,
      color: eligColor,
      colors: [eligColor],
      families: [eligFam, 'Dragon', 'Giant Beast', 'Magician'],
      levels: { 1: { cost: 1, bp: eligBp } }
    }, otherSide);
    const otherStack = createFieldStack(otherCard, { normal: 1, soul: 0 });
    otherStack.owner = otherSide;
    state.players[otherSide].field.push(otherStack);
  }

  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  assert.equal(res.success, true, `Ability resolution failed: ${JSON.stringify(res.results)}`);
  return true;
}

let passed = 0;
let failed = 0;
for (const item of failures) {
  try {
    await runSingle({
      shardFile: item.shard,
      cardKey: item.key,
      cardNumber: item.key,
      abIdx: item.ab,
      expectedOp: item.op
    });
    console.log(`PASS: Test ${item.test} (${item.key})`);
    passed++;
  } catch (err) {
    console.log(`FAIL: Test ${item.test} (${item.key}): ${err.message}`);
    failed++;
  }
}
console.log(`Full Results: ${passed} passed, ${failed} failed.`);
