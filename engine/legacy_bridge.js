/**
 * Temporary data-shape adapter for the browser arena.
 * Card effects are compiled and resolved by the structured engine; this file
 * only translates the arena's rendered duel state into and out of engine state.
 */
import { createGameState, createCardInstance, createFieldStack } from './state.js';
import { AsyncResolver, DefaultPromptResolver } from './resolver.js';
import { EventBus } from './events.js';
import { computeEffectiveBP, computeLevel } from './continuous.js';
import { checkStateBasedActions } from './sba.js';
import { ensureRestrictionState, syncLegacyToRestrictions } from './restrictions.js';

const LEGACY_ZONES = ['deck', 'hand', 'trashCards', 'voidCards', 'openCards'];

function normalizeLevels(levels) {
  if (!levels) return { 1: { cost: 1, bp: 1000 } };
  const entries = Array.isArray(levels)
    ? levels.map((level, index) => [String(level.level || index + 1), level])
    : Object.entries(levels);
  const normalized = {};
  for (const [key, value] of entries) {
    const level = Number(value?.level || String(key).match(/\d+/)?.[0]);
    if (!Number.isFinite(level)) continue;
    normalized[level] = {
      cost: Number(value?.cost ?? value?.cores ?? 1),
      bp: Number(value?.bp ?? value?.BP ?? 1000)
    };
  }
  return Object.keys(normalized).length ? normalized : { 1: { cost: 1, bp: 1000 } };
}

function deepCloneLegacyCard(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Cannot clone non-object legacy card');
  }
  try {
    return structuredClone(raw);
  } catch {
    const cloneValue = (val, seen = new WeakMap()) => {
      if (val === null || typeof val !== 'object') return val;
      if (seen.has(val)) return seen.get(val);
      if (Array.isArray(val)) {
        const arr = [];
        seen.set(val, arr);
        for (let i = 0; i < val.length; i++) {
          arr[i] = cloneValue(val[i], seen);
        }
        return arr;
      }
      const copy = {};
      seen.set(val, copy);
      for (const [k, v] of Object.entries(val)) {
        copy[k] = cloneValue(v, seen);
      }
      return copy;
    };
    return cloneValue(raw);
  }
}

function makeCardMapper() {
  const byInstanceKey = new Map();
  const rawToEngineByOwner = new Map();
  const claimedRawOwner = new WeakMap();
  const legacyById = new Map();
  let uidSeq = 1;

  function toEngine(raw, owner = 'player') {
    if (!raw) return null;
    if (!rawToEngineByOwner.has(owner)) {
      rawToEngineByOwner.set(owner, new WeakMap());
    }
    const ownerMap = rawToEngineByOwner.get(owner);
    if (ownerMap.has(raw)) {
      return ownerMap.get(raw);
    }

    const firstOwner = claimedRawOwner.get(raw);
    let legacyTarget = raw;
    if (firstOwner && firstOwner !== owner) {
      legacyTarget = deepCloneLegacyCard(raw);
    } else if (!firstOwner) {
      claimedRawOwner.set(raw, owner);
    }

    const baseUid = legacyTarget.uid ? String(legacyTarget.uid) : null;
    let instanceUid = baseUid;
    if (!instanceUid || byInstanceKey.has(`${owner}:${instanceUid}`)) {
      instanceUid = baseUid
        ? `${owner}:${baseUid}#${uidSeq++}`
        : `legacy_${owner}_${uidSeq++}`;
    }

    const card = createCardInstance({
      ...legacyTarget,
      card_number: legacyTarget.card_number || legacyTarget.cardNumber || legacyTarget.id || '',
      levels: normalizeLevels(legacyTarget.levels),
      families: legacyTarget.families || (legacyTarget.family ? [legacyTarget.family] : []),
      colors: legacyTarget.colors || [legacyTarget.color || 'Red'],
      compiledIr: legacyTarget.compiledIr || null
    }, owner);
    card.uid = instanceUid;
    card.owner = owner;
    card.currentOwner = legacyTarget.currentOwner || owner;
    ownerMap.set(raw, card);
    byInstanceKey.set(`${owner}:${instanceUid}`, card);
    legacyById.set(card.id, legacyTarget);
    return card;
  }

  function toLegacy(card) {
    if (!card) return null;
    if (legacyById.has(card.id)) return legacyById.get(card.id);
    const owner = card.owner || 'player';
    const mapped = byInstanceKey.get(`${owner}:${card.uid}`);
    return mapped ? legacyById.get(mapped.id) || null : null;
  }

  return { byUid: byInstanceKey, legacyById, toEngine, toLegacy };
}

function getLegacySoulCard(legacyPlayer) {
  if (legacyPlayer.soulCoreLocation !== 'field' || !legacyPlayer.soulCoreSpiritUid) return null;
  return legacyPlayer.soulCoreSpiritUid;
}

function copyLegacyCardState(engineCard, legacyCard) {
  if (!engineCard || !legacyCard) return;
  legacyCard.currentOwner = engineCard.currentOwner || engineCard.owner;
  legacyCard.name = engineCard.name || legacyCard.name;
  legacyCard.type = engineCard.type;
  legacyCard.cost = engineCard.cost;
  legacyCard.color = Array.isArray(engineCard.colors) ? (engineCard.colors[0] || legacyCard.color) : legacyCard.color;
  legacyCard.colors = Array.isArray(engineCard.colors) ? [...engineCard.colors] : [legacyCard.color || 'Red'];
  legacyCard.family = engineCard.family || legacyCard.family || '';
  legacyCard.families = Array.isArray(engineCard.families) ? [...engineCard.families] : (engineCard.family ? [engineCard.family] : []);
  legacyCard.levels = engineCard.levels ? deepCloneLegacyCard(engineCard.levels) : legacyCard.levels;
  legacyCard.compiledIr = engineCard.compiledIr || legacyCard.compiledIr || null;
  legacyCard.effect = engineCard.effect || legacyCard.effect || '';
}

export function createEngineStateFromLegacy(duelState) {
  const mapper = makeCardMapper();
  const state = createGameState();
  state.turnNumber = Number(duelState.turn || duelState.turnNumber || 1);
  state.activePlayer = duelState.activePlayer === 'opponent' ? 'opponent' : 'player';
  const legacyPhases = duelState.phases || [];
  const phase = legacyPhases[duelState.phaseIndex] || duelState.step || 'START';
  state.step = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'].includes(phase) ? phase : 'MAIN';
  const initialMods = Array.isArray(duelState.modifiers) ? duelState.modifiers
    : (Array.isArray(duelState.continuousEffects) ? duelState.continuousEffects : []);
  state.modifiers = [...initialMods];
  state.continuousEffects = state.modifiers;
  state.combat = duelState.combat ? { ...duelState.combat } : null;
  state.abilityUses = duelState.abilityUses ? { ...duelState.abilityUses } : {};
  if (duelState.restrictions && typeof duelState.restrictions === 'object' && duelState.restrictions.counters) {
    state.restrictions = JSON.parse(JSON.stringify(duelState.restrictions));
  } else {
    ensureRestrictionState(state);
    syncLegacyToRestrictions(state);
  }
  state.usedStructuredAbilities = Array.isArray(duelState.usedStructuredAbilities)
    ? [...duelState.usedStructuredAbilities]
    : (duelState.usedStructuredAbilities && typeof duelState.usedStructuredAbilities === 'object'
      ? { ...duelState.usedStructuredAbilities }
      : null);
  state.winner = duelState.winner ?? null;
  state.winReason = duelState.winReason ?? null;

  for (const side of ['player', 'opponent']) {
    const legacy = duelState[side] || {};
    const player = state.players[side];
    const reserveTotal = Math.max(0, Number(legacy.reserve) || 0);
    const trashTotal = Math.max(0, Number(legacy.trash) || 0);
    const soulLocation = legacy.soulCoreLocation || 'reserve';
    player.life = Number(legacy.life ?? 5);
    player.counters = Number(legacy.counters || 0);
    player.extraTurns = Number(legacy.extraTurns || 0);
    player.reserve.soul = soulLocation === 'reserve' ? 1 : 0;
    player.reserve.normal = Math.max(0, reserveTotal - player.reserve.soul);
    player.trash.soul = soulLocation === 'trash' ? 1 : 0;
    player.trash.normal = Math.max(0, trashTotal - player.trash.soul);
    player.deck = (legacy.deck || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.hand = (legacy.hand || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.grave = (legacy.trashCards || legacy.grave || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.removed = (legacy.voidCards || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.openCards = (legacy.openCards || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.burst = mapper.toEngine(legacy.burst || legacy.burstCard, side);
    player.mirage = mapper.toEngine(legacy.mirage, side);
    // Nexuses are represented as field stacks in player.field (avoid duplicate entries across player.nexus and player.field)
    player.nexus = [];
    player.revealed = (legacy.revealed || legacy.revealedCards || []).map(card => mapper.toEngine(card, side)).filter(Boolean);
    player.burstSetThisTurn = Boolean(legacy.burstSetThisTurn);
    player.mirageSetThisTurn = Boolean(legacy.mirageSetThisTurn);

    const allFieldCards = [...(legacy.field || []), ...(legacy.nexus || legacy.nexusCards || [])];
    const seenRaw = new Set();
    const seenCardIds = new Set();
    for (const raw of allFieldCards) {
      if (!raw || seenRaw.has(raw)) continue;
      seenRaw.add(raw);
      const card = mapper.toEngine(raw, side);
      if (!card || seenCardIds.has(card.id)) continue;
      seenCardIds.add(card.id);
      const soulUid = getLegacySoulCard(legacy);
      const hasSoul = Boolean(raw.hasSoulCore || raw.hasSoul || (soulUid && (soulUid === raw.uid || soulUid === card.uid)));
      const totalCores = Math.max(0, Number(raw.currentCores ?? raw.cores ?? (raw.type?.includes('Nexus') ? 1 : 0)) || 0);
      const stack = createFieldStack(card, {
        normal: Math.max(0, totalCores - (hasSoul ? 1 : 0)),
        soul: hasSoul ? 1 : 0
      }, [], { placementId: raw.placementId || card.placementId });
      stack.id = `stack_${card.id}`;
      stack.owner = side;
      stack.state = raw.isExhausted ? 'EXHAUSTED' : (raw.isHeavyExhausted ? 'HEAVY_EXHAUSTED' : 'REFRESHED');
      stack.isSoulState = Boolean(raw.isSoulState);
      stack.bonusLevel = Number(raw.bonusLevel || 0);
      stack.braves = (raw.braves || (raw.brave ? [raw.brave] : [])).map(brave => mapper.toEngine(brave, side)).filter(Boolean);
      stack.under = (raw.under || raw.preAdventCards || []).map(under => mapper.toEngine(under, side)).filter(Boolean);
      player.field.push(stack);
    }
  }

  return { state, mapper };
}

export function syncEngineStateToLegacy(state, duelState, mapper) {
  for (const side of ['player', 'opponent']) {
    const enginePlayer = state.players[side];
    const legacy = duelState[side];
    if (!legacy) continue;
    legacy.life = enginePlayer.life;
    legacy.counters = Number(enginePlayer.counters || 0);
    legacy.extraTurns = Number(enginePlayer.extraTurns || 0);
    legacy.burstSetThisTurn = Boolean(enginePlayer.burstSetThisTurn);
    legacy.mirageSetThisTurn = Boolean(enginePlayer.mirageSetThisTurn);
    legacy.reserve = enginePlayer.reserve.normal + enginePlayer.reserve.soul;
    legacy.trash = enginePlayer.trash.normal + enginePlayer.trash.soul;
    if (enginePlayer.reserve.soul > 0) {
      legacy.soulCoreLocation = 'reserve';
      legacy.soulCoreSpiritUid = null;
    } else if (enginePlayer.trash.soul > 0) {
      legacy.soulCoreLocation = 'trash';
      legacy.soulCoreSpiritUid = null;
    }

    const copyZone = zone => (enginePlayer[zone] || []).map(card => {
      const old = mapper.toLegacy(card);
      copyLegacyCardState(card, old);
      return old || card;
    });
    legacy.deck = copyZone('deck');
    legacy.hand = copyZone('hand');
    legacy.trashCards = copyZone('grave');
    legacy.voidCards = copyZone('removed');
    if (Array.isArray(enginePlayer.openCards) || Array.isArray(legacy.openCards)) {
      legacy.openCards = copyZone('openCards');
    }
    legacy.revealed = copyZone('revealed');
    if (Array.isArray(legacy.revealedCards)) {
      legacy.revealedCards = legacy.revealed;
    }
    legacy.burst = mapper.toLegacy(enginePlayer.burst);
    legacy.mirage = mapper.toLegacy(enginePlayer.mirage);

    const fieldCards = [];
    const nexusCards = [];
    for (const stack of enginePlayer.field || []) {
      const card = mapper.toLegacy(stack.top);
      if (!card) continue;
      copyLegacyCardState(stack.top, card);
      const hasSoul = Boolean(stack.cores.soul);
      const totalCores = (stack.cores.normal || 0) + (hasSoul ? 1 : 0);
      card.currentCores = totalCores;
      card.placementId = stack.placementId;
      card.hasSoulCore = hasSoul;
      card.isExhausted = stack.state !== 'REFRESHED';
      card.isHeavyExhausted = stack.state === 'HEAVY_EXHAUSTED';
      card.isSoulState = Boolean(stack.isSoulState);
      card.bonusLevel = Number(stack.bonusLevel || 0);
      card.currentLevel = computeLevel(stack, state);
      card.currentBp = computeEffectiveBP(state, stack);
      card.braves = (stack.braves || []).map(brave => {
        const lb = mapper.toLegacy(brave);
        copyLegacyCardState(brave, lb);
        return lb;
      }).filter(Boolean);
      card.under = (stack.under || []).map(under => {
        const lu = mapper.toLegacy(under);
        copyLegacyCardState(under, lu);
        return lu || under;
      }).filter(Boolean);
      if (Array.isArray(card.preAdventCards)) {
        card.preAdventCards = [...card.under];
      }
      if (hasSoul) {
        legacy.soulCoreLocation = 'field';
        legacy.soulCoreSpiritUid = card.uid;
      }
      if ((stack.top.type || '').toLowerCase().includes('nexus')) nexusCards.push(card);
      else fieldCards.push(card);
    }
    for (const nxEntry of enginePlayer.nexus || []) {
      const nxTop = nxEntry?.top || nxEntry;
      if (!nxTop) continue;
      const card = mapper.toLegacy(nxTop);
      if (!card) continue;
      if (!nexusCards.some(existing => (existing.uid && card.uid && existing.uid === card.uid) || (existing.id && card.id && existing.id === card.id))) {
        nexusCards.push(card);
      }
    }
    legacy.field = fieldCards;
    legacy.nexus = nexusCards;
    legacy.nexusCards = nexusCards;
    legacy.modifiers = state.modifiers;
    legacy.continuousEffects = state.modifiers;
  }
  duelState.turn = state.turnNumber;
  duelState.activePlayer = state.activePlayer;
  duelState.combat = state.combat ? { ...state.combat } : null;
  duelState.abilityUses = state.abilityUses ? { ...state.abilityUses } : {};
  if (state.restrictions) {
    duelState.restrictions = JSON.parse(JSON.stringify(state.restrictions));
  }
  if (state.usedStructuredAbilities !== null && state.usedStructuredAbilities !== undefined) {
    duelState.usedStructuredAbilities = Array.isArray(state.usedStructuredAbilities)
      ? [...state.usedStructuredAbilities]
      : { ...state.usedStructuredAbilities };
  }
  duelState.winner = state.winner ?? null;
  duelState.winReason = state.winReason ?? null;
  duelState.modifiers = state.modifiers;
  duelState.continuousEffects = state.modifiers;
}

export function pruneLegacyModifiers(duelState, expiryScope = 'BATTLE') {
  if (!duelState) return;
  const mods = Array.isArray(duelState.modifiers) ? duelState.modifiers
    : (Array.isArray(duelState.continuousEffects) ? duelState.continuousEffects : []);
  let filtered = mods;
  if (expiryScope === 'BATTLE') {
    filtered = mods.filter(m =>
      m.duration !== 'THIS_BATTLE' && m.duration !== 'UNTIL_END_OF_BATTLE' &&
      m.duration !== 'THIS_STEP' && m.duration !== 'UNTIL_END_OF_STEP'
    );
  } else if (expiryScope === 'TURN') {
    filtered = mods.filter(m =>
      m.duration !== 'THIS_TURN' && m.duration !== 'UNTIL_END_OF_TURN' &&
      m.duration !== 'THIS_BATTLE' && m.duration !== 'UNTIL_END_OF_BATTLE' &&
      m.duration !== 'THIS_STEP' && m.duration !== 'UNTIL_END_OF_STEP'
    );
  }
  duelState.modifiers = filtered;
  duelState.continuousEffects = filtered;
  for (const side of ['player', 'opponent']) {
    if (duelState[side]) {
      duelState[side].modifiers = filtered;
      duelState[side].continuousEffects = filtered;
    }
  }
}

function selectionKey(item) {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (item?.candidateId) return String(item.candidateId);
  const card = item?.card || item?.stack?.top || item;
  return card?.uid || card?.id || item?.stack?.id || item?.id || null;
}

function candidateMatchesKey(candidate, keySet, allCandidateIds = null) {
  if (!candidate || !keySet.size) return false;
  if (candidate.candidateId && keySet.has(String(candidate.candidateId))) return true;
  // If the caller returned canonical candidateIds, do not fall back to cross-zone card/uid matching
  if (allCandidateIds && Array.from(keySet).some(k => allCandidateIds.has(k))) {
    return false;
  }
  const keys = [
    selectionKey(candidate),
    candidate.id,
    candidate.uid,
    candidate.card?.uid,
    candidate.card?.id,
    candidate.stack?.id,
    candidate.stack?.top?.uid,
    candidate.stack?.top?.id
  ].filter(Boolean).map(String);
  return keys.some(k => keySet.has(k));
}

function bridgePrompt(prompt, mapper, promptResolver) {
  return {
    async choose(data) {
      if (!promptResolver) return new DefaultPromptResolver().choose(data);
      const exposed = {
        ...data,
        candidates: (data.candidates || []).map((candidate, idx) => {
          const candidateId = candidate?.candidateId || (candidate?.stack?.id ? `field:${candidate.side || candidate.stack.owner || 'player'}:${candidate.stack.id}` : null) || `cand_${idx}`;
          if (candidate && typeof candidate === 'object' && !candidate.candidateId) {
            candidate.candidateId = candidateId;
          }
          const baseMeta = {
            candidateId,
            zone: candidate?.zone || (candidate?.stack ? 'field' : (candidate?.card?.zone || null)),
            side: candidate?.side || candidate?.stack?.owner || null,
            stackId: candidate?.stackId || candidate?.stack?.id || null,
            cardId: candidate?.cardId || candidate?.card?.id || candidate?.stack?.top?.id || null
          };
          if (candidate?.stack?.top) {
            const legacyCard = mapper.toLegacy(candidate.stack.top);
            return { ...candidate, ...baseMeta, card: legacyCard || candidate.card, legacyCard, legacyStackId: candidate.stack.id };
          }
          if (candidate?.card?.id) {
            const legacyCard = mapper.toLegacy(candidate.card);
            return { ...candidate, ...baseMeta, card: legacyCard || candidate.card, legacyCard };
          }
          return { ...candidate, ...baseMeta };
        })
      };
      const allCandidateIds = new Set(
        (data.candidates || []).map(c => c?.candidateId).filter(Boolean).map(String)
      );
      function extractAllKeys(item) {
        const keys = [];
        if (typeof item === 'string' || typeof item === 'number') {
          keys.push(String(item));
        } else if (item) {
          if (item.candidateId) keys.push(String(item.candidateId));
          if (item.id) keys.push(String(item.id));
          if (item.uid) keys.push(String(item.uid));
          const card = item.card || item.stack?.top;
          if (card?.uid) keys.push(String(card.uid));
          if (card?.id) keys.push(String(card.id));
          if (item.stack?.id) keys.push(String(item.stack.id));
        }
        return keys;
      }
      const selection = await promptResolver.choose(exposed);
      if (!data.candidates) return selection;
      if (Array.isArray(selection)) {
        const selectedKeys = new Set(selection.flatMap(extractAllKeys).filter(Boolean).map(String));
        return data.candidates.filter(candidate => candidateMatchesKey(candidate, selectedKeys, allCandidateIds));
      }
      if (selection && typeof selection === 'object' && Array.isArray(selection.selected)) {
        const selectedKeys = new Set(selection.selected.flatMap(extractAllKeys).filter(Boolean).map(String));
        const mapped = data.candidates.filter(candidate => candidateMatchesKey(candidate, selectedKeys, allCandidateIds));
        return { ...selection, selected: mapped };
      }
      return selection;
    }
  };
}

export async function resolveLegacyAbility(duelState, legacySourceCard, ability, controller = 'player', options = {}) {
  if (!duelState || !legacySourceCard || !ability) return { success: false, reason: 'INVALID_LEGACY_EFFECT_CONTEXT' };
  const prefixes = (ability?.header?.prefixes || []).map(p => String(p).toLowerCase());
  const bypassLevelCheck = (Boolean(legacySourceCard.isSoulState) && prefixes.some(p => p.includes('soul state'))) ||
    Boolean(options?.context?.isContractPreAdvent) || prefixes.some(p => p.includes('contract pre-advent'));
  if (!bypassLevelCheck && Array.isArray(ability?.header?.levels) && ability.header.levels.length > 0) {
    const curLevel = Number(legacySourceCard.currentLevel || 1);
    if (!ability.header.levels.includes(curLevel)) {
      return { success: false, reason: 'ABILITY_LEVEL_MISMATCH' };
    }
  }
  const { state, mapper } = createEngineStateFromLegacy(duelState);
  const sourceCard = mapper.toEngine(legacySourceCard, controller);
  const sourceStack = state.players[controller].field.find(stack => stack.top.id === sourceCard?.id) || null;
  const promptResolver = options.promptResolver || (typeof options.choose === 'function' ? options : null);
  const resolver = new AsyncResolver(bridgePrompt(null, mapper, promptResolver));
  const events = new EventBus();
  const result = await resolver.resolveAbility(state, ability, {
    ...(options.context || {}),
    controller,
    sourceCard,
    sourceStack,
    placementId: sourceStack?.placementId || legacySourceCard.placementId || (sourceCard?.id ? `p_${sourceCard.id}` : null),
    legacySourceCard
  }, events);
  await checkStateBasedActions(state, events);
  syncEngineStateToLegacy(state, duelState, mapper);
  return result;
}
