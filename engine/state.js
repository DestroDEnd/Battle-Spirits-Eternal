/**
 * engine/state.js
 * 
 * Game State and Card Instance representations for Battle Spirits Eternal.
 */

import { ETERNAL_RULES } from './rules/eternal.js';

let nextInstanceId = 1;

export function resetInstanceIdCounter() {
  nextInstanceId = 1;
}

export function createCardInstance(cardData, owner = 'player') {
  const id = `inst_${nextInstanceId++}`;
  const family = cardData.family || (Array.isArray(cardData.families) ? cardData.families.join(' ') : '');
  const type = cardData.type || 'Spirit';
  const isContractPartner = Boolean(
    cardData.is_contract_partner ||
    cardData.isContractPartner ||
    type === 'Contract Nexus' ||
    (type.includes('Contract') && family.toLowerCase().includes('flag'))
  );
  return {
    id,
    cardNumber: cardData.card_number || cardData.cardNumber || cardData.id || 'UNKNOWN',
    name: cardData.name || 'Unknown',
    type,
    family,
    cost: typeof cardData.cost === 'number' ? cardData.cost : parseInt(cardData.cost || '0', 10),
    colors: cardData.colors || [cardData.color || 'Red'],
    symbols: cardData.symbols || [cardData.color || 'Red'],
    reduction: cardData.reduction || {},
    levels: cardData.levels || { 1: { cost: 1, bp: 1000 } },
    effect: cardData.effect || cardData.raw_effect || '',
    keywords: cardData.keywords || null,
    face: cardData.face || ((cardData.card_number || cardData.cardNumber || '').includes('-A') ? 'B' : (cardData.card_number || cardData.cardNumber || '').endsWith('B') ? 'B' : 'A'),
    compiledIr: cardData.compiledIr || null,
    owner,
    currentOwner: owner,
    isVanilla: Boolean(cardData.is_vanilla),
    isContractPartner,
    burst: cardData.burst || null,
    isBurst: Boolean(cardData.isBurst || cardData.burst)
  };
}

export function createFieldStack(topCard, initialCores = { normal: 1, soul: 0 }, initialBraves = []) {
  const stackId = `stack_${topCard.id}`;
  const initialFace = topCard.face || 'A';
  return {
    id: stackId,
    top: topCard,
    under: [], // Cards stacked beneath (e.g. Pre-Advent)
    braves: initialBraves, // Braved Brave cards
    cores: {
      normal: initialCores.normal || 0,
      soul: initialCores.soul ? 1 : 0
    },
    state: 'REFRESHED', // REFRESHED | EXHAUSTED | HEAVY_EXHAUSTED
    owner: topCard.owner,
    standby: null, // null or { type, previousLevel, by, cause, sourceCard }
    isSoulState: false,
    currentFace: initialFace,
    isFlipped: initialFace === 'B'
  };
}

export function createInitialPlayerState(playerId, deckCards = []) {
  return {
    id: playerId,
    life: ETERNAL_RULES.setup.initialLife,
    reserve: {
      normal: ETERNAL_RULES.setup.initialReserveCores - 1, // 3 normal
      soul: 1 // 1 Soul Core
    },
    trash: {
      normal: 0,
      soul: 0
    },
    counters: 0,
    burst: null,
    mirage: null,
    deck: [...deckCards],
    hand: [],
    field: [], // Array of field stacks
    nexus: [], // Nexuses placed on field
    grave: [], // Card graveyard
    removed: [], // Removed / Open Zone
    hasUsedMulligan: false,
    burstSetThisTurn: false,
    mirageSetThisTurn: false,
    combatDamageTakenThisTurn: 0
  };
}

export function createGameState(playerDeck = [], opponentDeck = [], firstPlayer = 'player') {
  return {
    turnNumber: 1,
    activePlayer: firstPlayer,
    firstPlayer,
    step: 'START',
    winner: null,
    winReason: null,
    players: {
      player: createInitialPlayerState('player', playerDeck),
      opponent: createInitialPlayerState('opponent', opponentDeck)
    },
    combat: null,
    modifiers: [], // Dynamic continuous modifiers
    pendingPrompts: [] // Active decisions awaiting player input
  };
}
