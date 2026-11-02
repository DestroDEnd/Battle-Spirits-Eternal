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
  return {
    id,
    cardNumber: cardData.card_number || cardData.cardNumber || cardData.id || 'UNKNOWN',
    name: cardData.name || 'Unknown',
    type: cardData.type || 'Spirit',
    cost: typeof cardData.cost === 'number' ? cardData.cost : parseInt(cardData.cost || '0', 10),
    colors: cardData.colors || [cardData.color || 'Red'],
    symbols: cardData.symbols || [cardData.color || 'Red'],
    reduction: cardData.reduction || {},
    levels: cardData.levels || { 1: { cost: 1, bp: 1000 } },
    effect: cardData.effect || '',
    compiledIr: cardData.compiledIr || null,
    owner,
    currentOwner: owner,
    isVanilla: Boolean(cardData.is_vanilla),
    isContractPartner: Boolean(cardData.is_contract_partner)
  };
}

export function createFieldStack(topCard, initialCores = { normal: 1, soul: 0 }, initialBraves = []) {
  const stackId = `stack_${topCard.id}`;
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
    owner: topCard.owner
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
    mirageSetThisTurn: false
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
