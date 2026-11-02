/**
 * engine/rules/eternal.js
 * 
 * Single source of truth for Battle Spirits Eternal format game rules.
 * All modules query this configuration; nothing hard-codes rules elsewhere.
 */

export const ETERNAL_RULES = {
  formatName: 'Eternal',

  // Deck Construction Rules
  deck: {
    minSize: 40,
    maxSize: Infinity, // No upper limit
    maxCopiesPerName: 3,
    blockIconsRestricted: false // Block icons do not restrict in Eternal
  },

  // Initial Game Setup
  setup: {
    initialLife: 5,
    initialReserveCores: 4, // 3 normal cores + 1 Soul Core
    initialHandSize: 4,
    mulliganAllowed: true, // House rule / modern standard: once per match
    mulliganHandSize: 4
  },

  // Turn Flow Rules
  turn: {
    firstPlayerSkipsCoreStep: true,
    firstPlayerSkipsAttackStep: true,
    secondPlayerSkipsSteps: false,
    
    // Explicit 7-step sequence (no step can be skipped arbitrarily)
    steps: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],

    // Refresh step resolution order:
    // 1. Refresh cards (Heavy Exhausted -> Exhausted; Exhausted -> Refreshed)
    // 2. Move cores from Core Trash to Reserve
    refreshStepOrder: ['REFRESH_CARDS', 'CORE_TRASH_TO_RESERVE']
  },

  // Win and Loss Conditions
  winLoss: {
    lifeLossThreshold: 0,
    // In Eternal, deck-out loss occurs specifically during player's START step
    deckOutTiming: 'START_STEP'
  },

  // Core & Zone Rules
  zones: {
    coreTrashSeparateFromCardGrave: true,
    burstSlotLimit: 1,
    mirageSlotLimit: 1,
    removedZonePlayable: true // Cards in Open/Removed Zone can be cast/summoned if effect permits
  },

  // Soul Core Rules
  soulCore: {
    opponentCannotSendToVoid: true,
    cannotGoToLifeExceptSeal: true
  },

  // Card Type Distinctions
  types: {
    ultimatesAreSpirits: false, // Ultimates do not count for "Spirit" effects
    bravesCombineStatsWhenBraved: true
  }
};
