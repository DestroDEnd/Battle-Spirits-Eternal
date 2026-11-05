/**
 * engine/rules/eternal.js
 * 
 * Single source of truth for Battle Spirits Eternal format game rules.
 * Governs flow, setup, SBA, priority, and 17.0 mechanics.
 */

export const ETERNAL_RULES = {
  formatName: 'Eternal',
  formatVersion: '17.0',

  // Deck Construction Rules
  deck: {
    minSize: 40,
    maxSize: Infinity, // No upper limit
    maxCopiesPerName: 3,
    blockIconsRestricted: false, // Block icons do not restrict in Eternal (BS01 through BS76+)
    maxContractPartners: 1, // Contract Spirit or Flag Nexus
    allowCollaborationCards: true
  },

  // Initial Game Setup
  setup: {
    initialLife: 5,
    initialReserveCores: 4, // 3 normal cores + 1 Soul Core
    initialReserveSoulCores: 1,
    initialHandSize: 4,
    mulliganAllowed: true, // Modern standard: once per match
    mulliganHandSize: 4,
    guaranteedContractPartner: true // 1 designated partner revealed into opening hand
  },

  // Turn Flow Rules
  turn: {
    firstPlayerSkipsCoreStep: true,
    firstPlayerSkipsAttackStep: true,
    secondPlayerSkipsSteps: false,
    hasMainStep2: false, // Main Step 2 is Standard-only; strictly FALSE in Eternal
    
    // Explicit 7-step sequence (no step can be skipped arbitrarily)
    steps: ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'],

    // Refresh step resolution order:
    // 1. Refresh cards (Heavy Exhausted -> Exhausted; Exhausted -> Refreshed)
    // 2. Move cores from Core Trash to Reserve
    refreshStepOrder: ['REFRESH_CARDS', 'CORE_TRASH_TO_RESERVE'],

    // Flash timing priority
    flashPriorityFirst: 'DEFENDING_PLAYER' // Defending (non-turn) player always acts first
  },

  // Win and Loss Conditions
  winLoss: {
    lifeLossThreshold: 0,
    // In Eternal, deck-out loss occurs specifically during player's START step
    deckOutTiming: 'START_STEP',
    simultaneousLife0Draw: true
  },

  // Core & Zone Rules (Ver 17.0 Unified Standby)
  zones: {
    coreTrashSeparateFromCardGrave: true,
    burstSlotLimit: 1,
    mirageSlotLimit: 1,
    removedZonePlayable: true, // Cards in Open/Removed Zone can be cast/summoned if effect permits
    unifiedStandbyState: true, // All removal routes enter unified Standby
    standbyRetainsLevelAndBP: true, // Depleted card evaluated at pre-depletion level
    standbyContributesSymbols: true, // Standby cards provide reduction symbols
    standbyCoresHeldUntilExit: true // Cores only return to reserve upon physical exit
  },

  // Burst Rules (Ver 17.0)
  burst: {
    simultaneousDeclarationWithHand: true,
    declarationPriorityOrder: ['NON_TURN_PLAYER', 'TURN_PLAYER'],
    resolutionOrder: 'FIFO_DECLARED',
    interruptersTriggerOnDeclaration: true // e.g. Spitzer Dragon
  },

  // Soul Core Rules
  soulCore: {
    opponentCannotSendToVoid: true,
    cannotGoToLifeExceptSeal: true,
    depletionAllowedOnActivation: true // Ver 17.0: Can move Soul Core even if depleted
  },

  // Card Type Distinctions
  types: {
    ultimatesAreSpirits: false, // Ultimates do not count for "Spirit" effects
    bravesCombineStatsWhenBraved: true,
    flagNexusesCanEnterSoulState: true,
    flagContractAdventTargets: ['Spirit', 'Nexus', 'SoulState']
  },

  // Keywords
  keywords: {
    allowAttributeKeywordStacking: true // Ver 17.0: Crush, Assault etc. can stack
  }
};
