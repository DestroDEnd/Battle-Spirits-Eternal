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

function makeCardMapper() {
  const byUid = new Map();
  const legacyById = new Map();

  function toEngine(raw, owner) {
    if (!raw) return null;
    const uid = raw.uid || raw.card_number || raw.cardNumber || `legacy-${byUid.size}`;
    if (byUid.has(uid)) return byUid.get(uid);
    const card = createCardInstance({
      ...raw,
      card_number: raw.card_number || raw.cardNumber || raw.id || '',
      levels: normalizeLevels(raw.levels),
      families: raw.families || (raw.family ? [raw.family] : []),
      colors: raw.colors || [raw.color || 'Red'],
      compiledIr: raw.compiledIr || null
    }, owner);
    card.uid = uid;
    card.owner = owner;
    card.currentOwner = raw.currentOwner || owner;
    byUid.set(uid, card);
    legacyById.set(card.id, raw);
    return card;
  }

  function toLegacy(card) {
    if (!card) return null;
    return legacyById.get(card.id) || byUid.get(card.uid) && legacyById.get(byUid.get(card.uid).id) || null;
  }

  return { byUid, legacyById, toEngine, toLegacy };
}

function getLegacySoulCard(legacyPlayer) {
  if (legacyPlayer.soulCoreLocation !== 'field' || !legacyPlayer.soulCoreSpiritUid) return null;
  return legacyPlayer.soulCoreSpiritUid;
}

function copyLegacyCardState(engineCard, legacyCard) {
  if (!engineCard || !legacyCard) return;
  legacyCard.currentOwner = engineCard.currentOwner || engineCard.owner;
  legacyCard.type = engineCard.type;
  legacyCard.cost = engineCard.cost;
  legacyCard.color = Array.isArray(engineCard.colors) ? (engineCard.colors[0] || legacyCard.color) : legacyCard.color;
  legacyCard.colors = Array.isArray(engineCard.colors) ? [...engineCard.colors] : [legacyCard.color || 'Red'];
  legacyCard.family = engineCard.family || legacyCard.family || '';
  legacyCard.families = Array.isArray(engineCard.families) ? [...engineCard.families] : (engineCard.family ? [engineCard.family] : []);
  legacyCard.levels = engineCard.levels;
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
  state.modifiers = Array.isArray(duelState.modifiers) ? [...duelState.modifiers] : [];

  for (const side of ['player', 'opponent']) {
    const legacy = duelState[side] || {};
    const player = state.players[side];
    const reserveTotal = Math.max(0, Number(legacy.reserve) || 0);
    const trashTotal = Math.max(0, Number(legacy.trash) || 0);
    const soulLocation = legacy.soulCoreLocation || 'reserve';
    player.life = Number(legacy.life ?? 5);
    player.reserve.soul = soulLocation === 'reserve' ? 1 : 0;
    player.reserve.normal = Math.max(0, reserveTotal - player.reserve.soul);
    player.trash.soul = soulLocation === 'trash' ? 1 : 0;
    player.trash.normal = Math.max(0, trashTotal - player.trash.soul);
    player.deck = (legacy.deck || []).map(card => mapper.toEngine(card, side));
    player.hand = (legacy.hand || []).map(card => mapper.toEngine(card, side));
    player.grave = (legacy.trashCards || legacy.grave || []).map(card => mapper.toEngine(card, side));
    player.removed = [...(legacy.voidCards || []), ...(legacy.openCards || [])]
      .map(card => mapper.toEngine(card, side));
    player.burst = mapper.toEngine(legacy.burst || legacy.burstCard, side);
    player.mirage = mapper.toEngine(legacy.mirage, side);
    player.nexus = (legacy.nexus || legacy.nexusCards || []).map(card => mapper.toEngine(card, side));
    player.revealed = [];
    player.burstSetThisTurn = Boolean(legacy.burstSetThisTurn);
    player.mirageSetThisTurn = Boolean(legacy.mirageSetThisTurn);

    const allFieldCards = [...(legacy.field || []), ...(legacy.nexus || legacy.nexusCards || [])];
    const seen = new Set();
    for (const raw of allFieldCards) {
      if (!raw) continue;
      const uid = raw.uid || raw.card_number || raw.cardNumber;
      if (seen.has(uid)) continue;
      seen.add(uid);
      const card = mapper.toEngine(raw, side);
      const soulUid = getLegacySoulCard(legacy);
      const hasSoul = Boolean(raw.hasSoulCore || raw.hasSoul || (soulUid && soulUid === uid));
      const totalCores = Math.max(0, Number(raw.currentCores ?? raw.cores ?? (raw.type?.includes('Nexus') ? 1 : 0)) || 0);
      const stack = createFieldStack(card, {
        normal: Math.max(0, totalCores - (hasSoul ? 1 : 0)),
        soul: hasSoul ? 1 : 0
      });
      stack.id = `stack_${uid}`;
      stack.owner = side;
      stack.state = raw.isExhausted ? 'EXHAUSTED' : (raw.isHeavyExhausted ? 'HEAVY_EXHAUSTED' : 'REFRESHED');
      stack.isSoulState = Boolean(raw.isSoulState);
      stack.braves = (raw.braves || (raw.brave ? [raw.brave] : [])).map(brave => mapper.toEngine(brave, side));
      stack.under = (raw.under || raw.preAdventCards || []).map(under => mapper.toEngine(under, side));
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
      card.hasSoulCore = hasSoul;
      card.isExhausted = stack.state !== 'REFRESHED';
      card.isHeavyExhausted = stack.state === 'HEAVY_EXHAUSTED';
      card.isSoulState = Boolean(stack.isSoulState);
      card.currentLevel = computeLevel(stack, state);
      card.currentBp = computeEffectiveBP(state, stack);
      card.braves = (stack.braves || []).map(brave => mapper.toLegacy(brave)).filter(Boolean);
      if (hasSoul) {
        legacy.soulCoreLocation = 'field';
        legacy.soulCoreSpiritUid = card.uid;
      }
      if ((stack.top.type || '').toLowerCase().includes('nexus')) nexusCards.push(card);
      else fieldCards.push(card);
    }
    legacy.field = fieldCards;
    legacy.nexus = nexusCards;
    legacy.nexusCards = nexusCards;
    legacy.modifiers = state.modifiers;
  }
  duelState.turn = state.turnNumber;
  duelState.activePlayer = state.activePlayer;
  duelState.modifiers = state.modifiers;
}

function selectionKey(item) {
  const card = item?.card || item?.stack?.top || item;
  return card?.uid || card?.id || item?.stack?.id || item?.id || null;
}

function bridgePrompt(prompt, mapper, promptResolver) {
  return {
    async choose(data) {
      if (!promptResolver) return new DefaultPromptResolver().choose(data);
      const exposed = {
        ...data,
        candidates: (data.candidates || []).map(candidate => {
          if (candidate?.stack?.top) {
            const legacyCard = mapper.toLegacy(candidate.stack.top);
            return { ...candidate, card: legacyCard || candidate.card, legacyCard, legacyStackId: candidate.stack.id };
          }
          if (candidate?.card?.id) {
            const legacyCard = mapper.toLegacy(candidate.card);
            return { ...candidate, card: legacyCard || candidate.card, legacyCard };
          }
          return candidate;
        })
      };
      const selection = await promptResolver.choose(exposed);
      if (!Array.isArray(selection) || !data.candidates) return selection;
      const selectedKeys = new Set(selection.map(selectionKey).filter(Boolean));
      return data.candidates.filter(candidate => selectedKeys.has(selectionKey(candidate)));
    }
  };
}

export async function resolveLegacyAbility(duelState, legacySourceCard, ability, controller = 'player', options = {}) {
  if (!duelState || !legacySourceCard || !ability) return { success: false, reason: 'INVALID_LEGACY_EFFECT_CONTEXT' };
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
    legacySourceCard
  }, events);
  await checkStateBasedActions(state, events);
  syncEngineStateToLegacy(state, duelState, mapper);
  return result;
}
