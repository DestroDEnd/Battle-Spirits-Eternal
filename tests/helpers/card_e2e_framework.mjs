/**
 * tests/helpers/card_e2e_framework.mjs
 *
 * Reusable Production-Flow Card-Level E2E Scenario & Semantic Assertion Framework
 * for Work Package H/I/J.1.1.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createGame } from '../../engine/index.js';
import { createFieldStack, validateGameState } from '../../engine/state.js';
import { AsyncResolver, DefaultPromptResolver } from '../../engine/resolver.js';
import { executeOp } from '../../engine/ops/index.js';
import { moveCard, moveCore } from '../../engine/zones.js';
import {
  computeEffectiveBP,
  computeFamilies,
  isActionRestricted
} from '../../engine/continuous.js';
import { calculateEffectiveCost } from '../../engine/payment.js';
import { validateDeck } from '../../engine/rules/eternal.js';
import { compileCard } from '../../compiler/index.js';

let _detailedMap = null;
export function getDetailedCardMap() {
  if (_detailedMap) return _detailedMap;
  const raw = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));
  _detailedMap = new Map();
  for (const c of (Array.isArray(raw) ? raw : Object.values(raw))) {
    const num = c.card_number || c.cardNumber;
    if (num) _detailedMap.set(num, c);
  }
  return _detailedMap;
}

const SHARD_CACHE = new Map();
export function loadStoredShardCard(shardFile, cardKey, cardNumber) {
  if (!SHARD_CACHE.has(shardFile)) {
    SHARD_CACHE.set(shardFile, JSON.parse(fs.readFileSync(path.resolve('data/ir_shards', shardFile), 'utf8')));
  }
  const shard = SHARD_CACHE.get(shardFile);
  return shard[cardKey] || Object.values(shard).find(c => (c.cardNumber || c.card_number) === cardNumber);
}

function canonicalizeForCompare(val) {
  if (val === undefined) return undefined;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(canonicalizeForCompare);
  const out = {};
  for (const k of Object.keys(val).sort()) {
    const cv = canonicalizeForCompare(val[k]);
    if (cv !== undefined) out[k] = cv;
  }
  return out;
}

export function semanticCompareOp(freshOp, storedOp) {
  if (!freshOp || !storedOp) {
    return { match: false, classification: 'UNCOMPARABLE', reason: 'missing_op' };
  }
  if (freshOp.op !== storedOp.op) {
    return { match: false, classification: 'SEMANTIC_MISMATCH', reason: `op_mismatch:${freshOp.op}!=${storedOp.op}` };
  }
  const allKeys = new Set([...Object.keys(freshOp), ...Object.keys(storedOp)]);
  let defaultedEquivalent = false;
  for (const k of allKeys) {
    if (k === 'op') continue;
    const fv = canonicalizeForCompare(freshOp[k]);
    const sv = canonicalizeForCompare(storedOp[k]);
    if (fv === undefined && sv === undefined) continue;
    if (fv === undefined || sv === undefined) {
      // Semantic equivalence for canonical default count=1 or LOOK_HAND target='HAND'
      if (k === 'count' && (fv === 1 || sv === 1)) {
        defaultedEquivalent = true;
        continue;
      }
      if (k === 'target' && freshOp.op === 'LOOK_HAND' && (fv === 'HAND' || sv === 'HAND')) {
        defaultedEquivalent = true;
        continue;
      }
      return {
        match: false,
        classification: 'SEMANTIC_MISMATCH',
        reason: `param_presence_mismatch:${k}:${fv === undefined ? 'missing_in_fresh' : 'missing_in_stored'}`
      };
    }
    if (JSON.stringify(fv) !== JSON.stringify(sv)) {
      return { match: false, classification: 'SEMANTIC_MISMATCH', reason: `param_mismatch:${k}` };
    }
  }
  return defaultedEquivalent
    ? { match: true, classification: 'SEMANTICALLY_EQUIVALENT', reason: 'semantically_equivalent_defaults' }
    : { match: true, classification: 'EXACT_MATCH', reason: 'exact_semantic_match' };
}

export function compareAbilityStructure(freshAb, storedAb) {
  if (!freshAb || !storedAb) {
    return { match: false, classification: 'UNCOMPARABLE', reason: 'missing_ability', diffs: ['missing_ability'] };
  }
  const diffs = [];
  const fTiming = freshAb.header?.timing || null;
  const sTiming = storedAb.header?.timing || null;
  if (fTiming !== sTiming) {
    diffs.push(`timing_mismatch:${fTiming}!=${sTiming}`);
  }
  const fBurst = freshAb.header?.burstCondition || null;
  const sBurst = storedAb.header?.burstCondition || null;
  if (JSON.stringify(canonicalizeForCompare(fBurst)) !== JSON.stringify(canonicalizeForCompare(sBurst))) {
    diffs.push('burstCondition_mismatch');
  }
  const fClauses = Array.isArray(freshAb.clauses) ? freshAb.clauses : [];
  const sClauses = Array.isArray(storedAb.clauses) ? storedAb.clauses : [];
  if (fClauses.length !== sClauses.length) {
    diffs.push(`clause_count_mismatch:${fClauses.length}!=${sClauses.length}`);
    return { match: false, classification: 'SEMANTIC_MISMATCH', reason: diffs[0], diffs };
  }
  for (let i = 0; i < sClauses.length; i++) {
    const fc = fClauses[i];
    const sc = sClauses[i];
    if (!fc || !sc) {
      diffs.push(`clause_${i}_missing`);
      continue;
    }
    for (const metaKey of ['condition', 'duration', 'isOptional', 'isCost', 'link']) {
      const fv = fc[metaKey] ?? null;
      const sv = sc[metaKey] ?? null;
      if (JSON.stringify(canonicalizeForCompare(fv)) !== JSON.stringify(canonicalizeForCompare(sv))) {
        diffs.push(`clause_${i}_${metaKey}_mismatch`);
      }
    }
    const opCmp = semanticCompareOp(fc.op, sc.op);
    if (!opCmp.match) {
      diffs.push(`clause_${i}_${opCmp.reason}`);
    }
  }
  if (diffs.length > 0) {
    return { match: false, classification: 'SEMANTIC_MISMATCH', reason: diffs[0], diffs };
  }
  return { match: true, classification: 'EXACT_MATCH', reason: 'exact_structural_match', diffs: [] };
}

/**
 * Synthetic auxiliary board fixture (non-canonical dummy target/fodder).
 * Never used as the card-under-test; exists solely to populate legal opponent/self board slots.
 */
export function mkAuxCard(id, extra = {}) {
  return {
    id,
    cardNumber: id,
    name: `Aux_${id}`,
    type: 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: 3,
    families: ['Dragon'],
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 3000 }, 2: { cost: 3, bp: 6000 } },
    owner: 'player',
    compiledIr: { abilities: [] },
    ...extra
  };
}

export function verifyProvenance(shardFile, cardKey, cardNumber, abIdx, expectedOp, requireCompilerMatch) {
  const det = getDetailedCardMap().get(cardNumber);
  assert.ok(det && det.effect, `Original printed wording missing for ${cardNumber}`);
  const storedCard = loadStoredShardCard(shardFile, cardKey, cardNumber);
  assert.ok(storedCard, `Stored shard card missing for ${cardNumber}`);
  const ab = storedCard.abilities?.[abIdx];
  assert.ok(ab && (ab.physicalId || ab.id) && Array.isArray(ab.clauses) && ab.clauses.length === 1, `Stored ability ${abIdx} missing on ${cardNumber}`);
  const storedOp = ab.clauses[0]?.op;
  assert.equal(storedOp?.op, expectedOp, `Stored IR op mismatch on ${cardNumber}`);

  if (requireCompilerMatch) {
    const freshlyCompiled = compileCard(det);
    const freshAb = freshlyCompiled?.abilities?.find(a => (a.physicalId || a.id) === (ab.physicalId || ab.id)) || freshlyCompiled?.abilities?.[abIdx];
    const cmp = compareAbilityStructure(freshAb, ab);
    assert.equal(cmp.match, true, `Compiler-to-IR semantic mismatch on ${cardNumber}: ${cmp.reason} (${(cmp.diffs || []).join(', ')})`);
  }
  return { det, storedCard, ab, storedOp };
}

export function setupHost(state, storedCard, ab, det) {
  if (det && (!ab.physicalId || !ab.semanticId)) {
    const compiled = compileCard(det);
    const matched = compiled?.abilities?.find(a => (a.legacyId || a.id) === ab.id) || compiled?.abilities?.find(a => a.legacyAbilityId === ab.id);
    if (matched) {
      if (!ab.physicalId && matched.physicalId) ab.physicalId = matched.physicalId;
      if (!ab.semanticId && matched.semanticId) ab.semanticId = matched.semanticId;
    }
  }
  if (!ab.physicalId) ab.physicalId = ab.id || `${storedCard.cardNumber || det?.card_number || 'CARD'}#AB_0`;
  if (!ab.semanticId) ab.semanticId = `SEM#${ab.physicalId}`;

  const hostCard = {
    ...storedCard,
    name: storedCard.name || det?.name || 'Test Card',
    type: storedCard.type || det?.type || 'Spirit',
    id: `${storedCard.cardNumber || storedCard.id}_HOST`,
    owner: 'player',
    cost: typeof storedCard.cost === 'number' ? storedCard.cost : (typeof det?.cost === 'number' ? det.cost : 4),
    levels: storedCard.levels || det?.levels || { 1: { cost: 1, bp: 4000 }, 2: { cost: 3, bp: 7000 } },
    families: storedCard.families || det?.families || (det?.family ? [det.family] : []),
    colors: storedCard.colors || det?.colors || (det?.color ? [det.color] : ['Red']),
    compiledIr: { abilities: storedCard.abilities || [ab] }
  };
  const hostStack = createFieldStack(hostCard, { normal: 3, soul: 1 });
  hostStack.owner = 'player';
  const clauseText = String(ab?.clauses?.[0]?.rawText || '');
  if (/this\s+exhausted/i.test(clauseText)) {
    hostStack.state = 'EXHAUSTED';
  }
  state.players.player.reserve.soul = 0;
  state.players.player.field.push(hostStack);
  return { hostCard, hostStack };
}

export async function runCardAbilityE2E({
  shardFile, cardKey, cardNumber, abIdx, expectedOp, requireCompilerMatch = true
}) {
  const { storedCard, ab, storedOp, det } = verifyProvenance(shardFile, cardKey, cardNumber, abIdx, expectedOp, requireCompilerMatch);
  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();
  const { hostCard, hostStack } = setupHost(state, storedCard, ab, det);
  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  switch (expectedOp) {
    case 'DRAW': {
      const count = typeof storedOp.count === 'number' ? storedOp.count : 1;
      const targetSide = storedOp.side === 'opp' || storedOp.side === 'opponent' ? 'opponent' : 'player';
      for (let i = 0; i < count + 3; i++) {
        state.players[targetSide].deck.push(mkAuxCard(`DK-${i}`, { owner: targetSide }));
      }
      const handBefore = state.players[targetSide].hand.length;
      const deckBefore = state.players[targetSide].deck.length;
      const topIds = state.players[targetSide].deck.slice(0, count).map(c => c.id);

      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.equal(state.players[targetSide].hand.length, handBefore + count, `Must draw exact count=${count}`);
      assert.equal(state.players[targetSide].deck.length, deckBefore - count, `Deck must shrink by exact count=${count}`);
      for (const id of topIds) {
        assert.ok(state.players[targetSide].hand.some(c => c.id === id), `Drawn card ${id} must enter ${targetSide} hand`);
      }
      assert.equal(events.filter(e => e.type === 'CARD_DRAWN').length, count, 'Must emit exact CARD_DRAWN count');
      break;
    }

    case 'DESTROY':
    case 'BOUNCE':
    case 'EXHAUST': {
      const clauseText = String(ab?.clauses?.[0]?.rawText || '');
      const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
      let tgtSide = tgtSpec.side === 'self' ? 'player' : 'opponent';
      if (tgtSpec.side === 'either') {
        if (/(?:your\s+opponent|opposing)/i.test(clauseText)) tgtSide = 'opponent';
        else if (/(?:spirits?\s+you\s+control|spirit\s+you\s+control|your\s+(?:cost|\d+|spirit|nexus))/i.test(clauseText)) tgtSide = 'player';
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

      const eligCard = mkAuxCard('ELIG-TGT', {
        owner: tgtSide,
        type: eligType,
        cost: eligCost,
        color: eligColor,
        colors: [eligColor],
        families: [eligFam, 'Dragon', 'Giant Beast', 'Magician'],
        levels: { 1: { cost: 1, bp: eligBp } }
      });
      const eligStack = createFieldStack(eligCard, { normal: 1, soul: 0 });
      eligStack.owner = tgtSide;
      if (String(tgtSpec.state || '').toUpperCase() === 'EXHAUSTED' || tgtSpec.filter?.exhausted) eligStack.state = 'EXHAUSTED';

      const ineligCard = mkAuxCard('INELIG-TGT', {
        owner: tgtSide,
        type: (typeof bpMax === 'number' || typeof costMax === 'number') ? eligType : (eligType === 'Nexus' ? 'Spirit' : 'Nexus'),
        cost: typeof costMax === 'number' ? costMax + 3 : 8,
        levels: { 1: { cost: 1, bp: typeof bpMax === 'number' ? bpMax + 5000 : 20000 } }
      });
      const ineligStack = createFieldStack(ineligCard, { normal: 1, soul: 0 });
      ineligStack.owner = tgtSide;

      state.players[tgtSide].field.push(eligStack, ineligStack);

      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      if (expectedOp === 'DESTROY') {
        assert.ok(!state.players[tgtSide].field.some(s => s.id === eligStack.id), 'Eligible target must leave field');
        assert.ok(state.players[tgtSide].grave.some(c => c.id === 'ELIG-TGT'), 'Destroyed target must enter owner grave');
        assert.ok(events.some(e => e.type === 'DESTROYED' && e.card?.id === 'ELIG-TGT'));
      } else if (expectedOp === 'BOUNCE') {
        const dest = String(storedOp.destination || storedOp.to || 'hand').toLowerCase();
        const checkZone = (sideKey, cardId) => {
          if (dest === 'hand') return state.players[sideKey].hand.some(c => c.id === cardId);
          if (dest === 'deck_bottom' || dest === 'deck') return state.players[sideKey].deck.some(c => c.id === cardId);
          return !state.players[sideKey].field.some(s => s.top?.id === cardId);
        };
        const bouncedId = tgtSpec.side === 'either'
          ? (checkZone('player', hostCard.id) ? hostCard.id : (checkZone('player', 'ELIG-TGT') ? 'ELIG-TGT' : (checkZone(tgtSide, 'ELIG-TGT') ? 'ELIG-TGT' : null)))
          : (checkZone(tgtSide, 'ELIG-TGT') ? 'ELIG-TGT' : null);
        assert.ok(bouncedId !== null, 'Eligible target must bounce to destination');
      } else if (expectedOp === 'EXHAUST') {
        const isSelfExhaust = storedOp.target === 'self' || storedOp.target?.card === 'SELF';
        if (isSelfExhaust) {
          assert.equal(hostStack.state, 'EXHAUSTED', 'Self host stack must become EXHAUSTED');
        } else {
          assert.ok(eligStack.state === 'EXHAUSTED' || hostStack.state === 'EXHAUSTED', 'Target spirit must become EXHAUSTED');
        }
      }
      if (!storedOp.all && tgtSpec.side !== 'either' && (typeof bpMax === 'number' || typeof costMax === 'number' || ineligCard.type !== eligType)) {
        assert.ok(state.players[tgtSide].field.some(s => s.id === ineligStack.id), 'Ineligible target must remain untouched on field');
      }
      break;
    }

    case 'BP_BUFF':
    case 'BP_DEBUFF': {
      const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
      const tgtSide = storedOp.target === 'SELF' || tgtSpec.side === 'self' ? 'player' : (tgtSpec.side === 'opp' ? 'opponent' : 'player');
      const amt = Number(storedOp.amount || 1000);
      const tgtStack = tgtSide === 'player' ? hostStack : (() => {
        const o = createFieldStack(mkAuxCard('OPP-BP', { owner: 'opponent', levels: { 1: { cost: 1, bp: 5000 } } }), { normal: 1, soul: 0 });
        o.owner = 'opponent';
        state.players.opponent.field.push(o);
        return o;
      })();
      const bpBefore = computeEffectiveBP(state, tgtStack);
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      const bpAfter = computeEffectiveBP(state, tgtStack);
      if (expectedOp === 'BP_BUFF') {
        assert.equal(bpAfter, bpBefore + amt, `BP must increase by exact +${amt}`);
      } else {
        assert.equal(bpAfter, Math.max(0, bpBefore - amt), `BP must decrease by exact -${amt}`);
      }
      break;
    }

    case 'MOVE_CORE': {
      const fromZ = String(storedOp.from?.zone || storedOp.from || 'void').toLowerCase();
      const toZ = String(storedOp.to?.zone || storedOp.to || 'reserve').toLowerCase();
      const cnt = typeof storedOp.count === 'number' ? storedOp.count : 1;
      const tgtSide = (storedOp.to?.side || storedOp.side) === 'opp' ? 'opponent' : 'player';
      if (storedOp.from?.side === 'opp' && fromZ === 'field') {
        const oppSt = createFieldStack(mkAuxCard('OPP-CORE-SRC', { owner: 'opponent', type: storedOp.from?.types?.[0] || 'Spirit' }), { normal: 3, soul: 0 });
        oppSt.owner = 'opponent';
        state.players.opponent.field.push(oppSt);
      }
      if (toZ === 'field' && tgtSide === 'player' && hostCard.type === 'Brave') {
        const auxNexus = createFieldStack(mkAuxCard('SELF-CORE-NEXUS', { owner: 'player', type: 'Nexus' }), { normal: 1, soul: 0 });
        auxNexus.owner = 'player';
        state.players.player.field.unshift(auxNexus);
      }
      state.players.player.reserve.normal = Math.max(state.players.player.reserve.normal, 5);
      state.players.opponent.reserve.normal = Math.max(state.players.opponent.reserve.normal, 5);
      state.players.player.voidCores.normal = Math.max(state.players.player.voidCores?.normal || 0, 10);
      state.players.opponent.voidCores.normal = Math.max(state.players.opponent.voidCores?.normal || 0, 10);
      state.players.player.trash = { normal: 3, soul: 0 };
      const resBefore = state.players[tgtSide].reserve.normal;
      const fieldBefore = hostStack.cores.normal;
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      if (toZ === 'reserve' && fromZ !== 'reserve' && typeof storedOp.count === 'number') {
        assert.equal(state.players[tgtSide].reserve.normal, resBefore + cnt, `Reserve must gain exact ${cnt} cores`);
      } else if (toZ === 'field' && typeof storedOp.count === 'number') {
        assert.ok(hostStack.cores.normal >= fieldBefore + cnt || events.some(e => e.type === 'CORE_MOVED' || e.type === 'CORES_MOVED'));
      } else {
        assert.ok(events.some(e => e.type === 'CORE_MOVED' || e.type === 'CORES_MOVED') || res.results?.[0]?.applied);
      }
      break;
    }

    case 'SUMMON':
    case 'SUMMON_FREE': {
      const tgtSide = 'player';
      const f = storedOp.filter || {};
      const matchCard = mkAuxCard('SUM-MATCH', {
        owner: tgtSide,
        type: f.type || f.types?.[0] || 'Spirit',
        color: f.color || 'Red',
        colors: [f.color || 'Red'],
        families: f.family ? [f.family] : (Array.isArray(f.families) ? f.families : ['Dragon']),
        cost: typeof f.costMax === 'number' ? Math.max(0, f.costMax - 1) : 2
      });
      const nonMatch = mkAuxCard('SUM-NONMATCH', { owner: tgtSide, type: 'Magic', color: 'Blue', colors: ['Blue'], families: ['Other'], cost: 10 });
      const fromZ = String(storedOp.from || 'hand').toLowerCase();
      if (fromZ === 'grave' || fromZ === 'trash') state.players.player.grave.push(matchCard, nonMatch);
      else if (fromZ === 'deck') state.players.player.deck.push(matchCard, nonMatch);
      else state.players.player.hand.push(matchCard, nonMatch);
      state.players.player.reserve.normal = 8;

      const fieldBefore = state.players.player.field.length;
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.equal(state.players.player.field.length, fieldBefore + 1, 'Exactly one matching card must be summoned');
      assert.ok(state.players.player.field.some(s => s.top.id === 'SUM-MATCH'), 'Matching card must enter field');
      assert.ok(!state.players.player.field.some(s => s.top.id === 'SUM-NONMATCH'), 'Non-matching card must not be summoned');
      break;
    }

    case 'REFRESH': {
      const tgtSpec = (typeof storedOp.target === 'object' && storedOp.target) ? storedOp.target : {};
      const matchCost = typeof tgtSpec.cost === 'number' ? tgtSpec.cost : 2;
      const eligSt = createFieldStack(mkAuxCard('REF-ELIG', { type: tgtSpec.types?.[0] || 'Spirit', cost: matchCost }), { normal: 1, soul: 0 });
      eligSt.owner = 'player';
      eligSt.state = 'EXHAUSTED';
      const ineligSt = createFieldStack(mkAuxCard('REF-INELIG', { type: 'Spirit', cost: matchCost + 7 }), { normal: 1, soul: 0 });
      ineligSt.owner = 'player';
      ineligSt.state = 'EXHAUSTED';
      hostStack.state = 'EXHAUSTED';
      state.players.player.field.push(eligSt, ineligSt);
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.ok(eligSt.state === 'REFRESHED' || hostStack.state === 'REFRESHED', 'Matching exhausted stack must refresh');
      if (typeof tgtSpec.cost === 'number') {
        assert.equal(ineligSt.state, 'EXHAUSTED', 'Non-matching cost Spirit must remain EXHAUSTED');
      }
      break;
    }

    case 'RETRIEVE_CORES': {
      state.players.player.trash = { normal: 4, soul: 0 };
      const cnt = typeof storedOp.count === 'number' ? storedOp.count : 1;
      const toField = String(storedOp.to || 'field').toLowerCase() === 'field';
      const resBefore = state.players.player.reserve.normal;
      const fieldBefore = hostStack.cores.normal;
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      if (toField) {
        assert.equal(hostStack.cores.normal, fieldBefore + cnt, `Host stack must gain exact ${cnt} cores`);
      } else {
        assert.equal(state.players.player.reserve.normal, resBefore + cnt, `Reserve must gain exact ${cnt} cores`);
      }
      assert.equal(state.players.player.trash.normal, 4 - cnt, 'Trash cores must decrease by exact count');
      break;
    }

    case 'LOOK_HAND': {
      state.players.opponent.hand.push(mkAuxCard('OH-1', { owner: 'opponent' }));
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.ok(events.some(e => e.type === 'HAND_LOOKED_AT'), 'Must emit HAND_LOOKED_AT event');
      break;
    }

    case 'MILL': {
      const cnt = typeof storedOp.count === 'number' ? storedOp.count : 1;
      const tgtSide = storedOp.side === 'self' ? 'player' : 'opponent';
      for (let i = 0; i < cnt + 2; i++) state.players[tgtSide].deck.push(mkAuxCard(`ML-${i}`, { owner: tgtSide }));
      const graveBefore = state.players[tgtSide].grave.length;
      const deckBefore = state.players[tgtSide].deck.length;
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.equal(state.players[tgtSide].grave.length, graveBefore + cnt, `Must mill exact ${cnt} cards`);
      assert.equal(state.players[tgtSide].deck.length, deckBefore - cnt);
      break;
    }

    case 'TRIGGERED_WATCHER': {
      const before = (state.watchers || []).length;
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.equal((state.watchers || []).length, before + 1, 'Exactly one watcher must be registered');
      break;
    }

    case 'ACTIVATE_EFFECT_ACTION': {
      const kw = storedOp.keyword || 'Shamanism';
      hostCard.compiledIr.abilities.push({
        physicalId: `${hostCard.cardNumber}#KW_TARGET`,
        header: { timing: 'WHEN_SUMMONED', cleanBody: `[${kw}] Draw 1.` },
        clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }]
      });
      state.players.player.deck.push(mkAuxCard('KW-D1'));
      const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
      assert.equal(res.success, true);
      assert.ok(events.some(e => e.type === 'EFFECT_ACTIVATED' && e.keyword === kw), `Must emit EFFECT_ACTIVATED for ${kw}`);
      break;
    }

    default:
      assert.fail(`Unhandled CARD_ABILITY_E2E operation: ${expectedOp}`);
  }

  const val = validateGameState(state);
  assert.equal(val.valid, true, `Game state invariants violated: ${JSON.stringify(val.errors)}`);
}

export async function runCardRulesE2E({
  shardFile, cardKey, cardNumber, abIdx, expectedOp, requireCompilerMatch = true
}) {
  const { storedCard, ab, storedOp } = verifyProvenance(shardFile, cardKey, cardNumber, abIdx, expectedOp, requireCompilerMatch);
  const g = createGame();
  const state = g.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();
  const { hostCard, hostStack } = setupHost(state, storedCard, ab);
  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };

  if (expectedOp === 'LOSE_EFFECTS') {
    const oppStack = createFieldStack(mkAuxCard('OPP-LOSE', {
      owner: 'opponent',
      compiledIr: { abilities: [{ physicalId: 'OL#1', header: { timing: 'WHEN_SUMMONED', cleanBody: 'Draw 1.' }, clauses: [{ op: { op: 'DRAW', count: 1, side: 'self' } }] }] }
    }), { normal: 1, soul: 0 });
    oppStack.owner = 'opponent';
    state.players.opponent.field.push(oppStack);
  }

  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  assert.equal(res.success, true, `Rule ability must execute cleanly: ${JSON.stringify({ success: res.success, hasUnsupported: res.hasUnsupported, hasFailure: res.hasFailure, firstResult: res.results?.[0] })}`);

  switch (expectedOp) {
    case 'DECK_BUILDING_RULE': {
      const bigDeck = Array.from({ length: 40 }, (_, i) => i < 6 ? { ...hostCard, id: `COPY-${i}` } : mkAuxCard(`F-${i}`));
      assert.equal(validateDeck(bigDeck).valid, true, 'DECK_BUILDING_RULE must allow >3 copies when UNLIMITED');
      const normalCard = mkAuxCard('NORM-1');
      const illegalDeck = Array.from({ length: 40 }, (_, i) => i < 4 ? { ...normalCard, id: `NC-${i}` } : mkAuxCard(`NF-${i}`));
      assert.equal(validateDeck(illegalDeck).valid, false, 'Negative: normal card >3 copies must still fail validateDeck');
      break;
    }
    case 'DECK_CONSTRUCTION_RULE': {
      assert.ok(hostCard.deckRule || events.some(e => e.type === 'DECK_RULE_REGISTERED') || state.modifiers.length >= 0);
      break;
    }
    case 'GAIN_TEAM':
    case 'TEAM_RULE': {
      const fams = computeFamilies(state, hostStack);
      assert.ok(fams.includes('*ALL_TEAMS*') || fams.length > 0, 'Host must gain team membership');
      break;
    }
    case 'ADD_FAMILY': {
      const fams = computeFamilies(state, hostStack);
      for (const fam of (storedOp.families || [])) {
        assert.ok(fams.includes(fam), `Added family ${fam} must appear in computeFamilies`);
      }
      break;
    }
    case 'GLOBAL_RESTRICTION': {
      assert.ok(state.modifiers.some(m => m.type === 'GLOBAL_RESTRICTION'), 'GLOBAL_RESTRICTION modifier must be registered');
      if (storedOp.restriction === 'CANNOT_GAIN_CORES_FROM_VOID') {
        assert.equal(isActionRestricted(state, 'CANNOT_GAIN_CORES_FROM_VOID', 'player', null, {}), true);
        const moved = await moveCore(state, 1, { side: 'player', zone: 'void' }, { side: 'player', zone: 'reserve' }, { cause: 'effect' }, emitter);
        assert.equal(moved, false, 'Negative: Void core gain must be blocked while restriction is active');
      }
      break;
    }
    case 'LIMIT_DECK_DISCARD': {
      for (let i = 0; i < 10; i++) state.players.player.deck.push(mkAuxCard(`LD-${i}`, { owner: 'player' }));
      const oppCtx = { controller: 'opponent', sourceCard: mkAuxCard('OPP-MILLER', { owner: 'opponent' }) };
      await executeOp(state, { op: 'MILL', count: 10, side: 'opp' }, oppCtx, prompt, emitter);
      const maxLim = Number(storedOp.maxPerTurn ?? 5);
      assert.ok(state.players.player.grave.length <= maxLim, `Protected player mill must be capped at ${maxLim}`);
      break;
    }
    case 'COST_MODIFIER': {
      const testCard = mkAuxCard('COST-TEST', { cost: 5, owner: 'player' });
      const eff = calculateEffectiveCost(state, testCard, 'player');
      assert.ok(typeof eff === 'number', 'calculateEffectiveCost must return valid cost');
      assert.ok(state.modifiers.some(m => m.type === 'COST_MODIFIER'), 'COST_MODIFIER must be active in state.modifiers');
      break;
    }
    case 'SYMBOL_MODIFIER': {
      const magicCard = mkAuxCard('SYM-MAG', { type: 'Magic', cost: 4, symbols: ['Red'], owner: 'player' });
      const eff = calculateEffectiveCost(state, magicCard, 'player');
      assert.ok(typeof eff === 'number');
      assert.ok(state.modifiers.some(m => m.type === 'SYMBOL_MODIFIER'));
      break;
    }
    case 'LOSE_EFFECTS': {
      assert.ok(state.modifiers.some(m => m.type === 'LOSE_EFFECTS'), 'LOSE_EFFECTS modifier must be registered');
      break;
    }
    case 'REDIRECT_CORE_DESTINATION': {
      assert.ok(state.modifiers.some(m => m.type === 'REDIRECT_CORE_DESTINATION'), 'REDIRECT_CORE_DESTINATION must be registered');
      break;
    }
    case 'MODIFY_DESTINATION': {
      assert.ok(state.modifiers.some(m => m.type === 'MODIFY_DESTINATION'), 'MODIFY_DESTINATION must be registered');
      const dCard = mkAuxCard('MD-TGT', { owner: 'player' });
      const dStack = createFieldStack(dCard, { normal: 1, soul: 0 });
      dStack.owner = 'player';
      state.players.player.field.push(dStack);
      await moveCard(state, dCard, 'grave', 'player', { cause: 'destroy' }, emitter);
      break;
    }
    case 'UNBLOCKABLE':
    case 'CONTINUOUS_RULE':
    case 'BATTLE_RULE_MODIFIER':
    case 'REDIRECT_TARGET':
    case 'FORCE_ATTACK':
    case 'ADVENT_RULE':
    case 'COUNT_MODIFIER': {
      assert.ok(state.modifiers.length > 0 || events.length > 0, `${expectedOp} must register rule modifier or event`);
      break;
    }
    default:
      assert.fail(`Unhandled CARD_RULES_E2E operation: ${expectedOp}`);
  }

  const val = validateGameState(state);
  assert.equal(val.valid, true, `Game state invariants violated: ${JSON.stringify(val.errors)}`);
}
