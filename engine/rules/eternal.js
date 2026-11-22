/**
 * engine/rules/eternal.js
 * 
 * Single source of truth for Battle Spirits Eternal format game rules.
 * Governs flow, setup, SBA, priority, and 17.0 mechanics.
 *
 * Provenance Note (Phase 4C.3.3.1.1):
 * - Local engine implementation & tests (`tests/eternal_17_*.test.js`) target
 *   Battle Spirits Official Rule Manual [Eternal] Ver. 17.0 (https://www.battlespirits.com/rule/official-rule-manual-eternal/).
 * - No official Ver. 17.0 or Ver. 17.1 rulebook PDF is stored in this repository;
 *   therefore official rulebook page/rule citations and Ver. 17.0 vs Ver. 17.1
 *   deltas remain NEEDS_MANUAL_REVIEW until the official PDF is audited locally.
 */

import { createHash } from 'node:crypto';

export const ETERNAL_RULES = {
  formatName: 'Eternal',
  formatVersion: '17.0',
  officialPortalUrl: 'https://www.battlespirits.com/rule/official-rule-manual-eternal/',
  rulesSourceStatus: 'LOCAL_17_0_IMPLEMENTATION_PENDING_OFFICIAL_PDF_AUDIT',

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

/**
 * Validates a deck against Eternal format deck construction rules:
 * - Minimum deck size (40 cards) and maximum deck size (Infinity)
 * - Maximum copies per canonical card name (3 copies)
 * - Maximum Contract Partners (1 Contract Spirit or Flag Nexus)
 *
 * @param {Array<object>} deckCards
 * @param {object} [rules=ETERNAL_RULES]
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDeck(deckCards, rules = ETERNAL_RULES) {
  const errors = [];
  if (!Array.isArray(deckCards)) {
    return { valid: false, errors: ['Deck must be an array of card definitions'] };
  }

  if (deckCards.length < rules.deck.minSize) {
    errors.push(`Deck size ${deckCards.length} is below minimum ${rules.deck.minSize}`);
  }
  if (Number.isFinite(rules.deck.maxSize) && deckCards.length > rules.deck.maxSize) {
    errors.push(`Deck size ${deckCards.length} exceeds maximum ${rules.deck.maxSize}`);
  }

  const nameCounts = new Map();
  let contractPartners = 0;

  for (let i = 0; i < deckCards.length; i++) {
    const card = deckCards[i];
    if (!card || typeof card !== 'object') {
      errors.push(`Invalid card entry at deck index ${i}`);
      continue;
    }

    const nameKey = String(card.name || '').trim();
    if (!nameKey) {
      errors.push(`Card at deck index ${i} is missing a card name`);
    } else {
      const nextCount = (nameCounts.get(nameKey) || 0) + 1;
      nameCounts.set(nameKey, nextCount);
      const customMax = card.deckRule?.maxCopies;
      const allowedCopies = customMax === 'UNLIMITED'
        ? Infinity
        : (typeof customMax === 'number' && customMax >= 0 ? customMax : rules.deck.maxCopiesPerName);
      if (Number.isFinite(allowedCopies) && nextCount === allowedCopies + 1) {
        errors.push(`Card "${nameKey}" exceeds maximum ${allowedCopies} copies per deck`);
      }
    }

    const family = String(card.family || (Array.isArray(card.families) ? card.families.join(' ') : '')).toLowerCase();
    const type = String(card.type || '');
    const isPartner = Boolean(
      card.is_contract_partner ||
      card.isContractPartner ||
      type === 'Contract Nexus' ||
      (type.includes('Contract') && family.includes('flag'))
    );
    if (isPartner) {
      contractPartners++;
    }
  }

  if (contractPartners > rules.deck.maxContractPartners) {
    errors.push(`Deck contains ${contractPartners} Contract Partners, exceeding maximum ${rules.deck.maxContractPartners}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Computes a deterministic SHA-256 digest over a deck's canonical card entries
 * for deck-legality attestation in saved/restored game states.
 *
 * @param {Array<object>} deckCards
 * @returns {string}
 */
export function computeDeckAttestationDigest(deckCards) {
  const normalized = (Array.isArray(deckCards) ? deckCards : []).map(c => ({
    cardNumber: String(c?.card_number || c?.cardNumber || c?.id || ''),
    name: String(c?.name || '').trim(),
    type: String(c?.type || ''),
    isContractPartner: Boolean(c?.is_contract_partner || c?.isContractPartner || c?.type === 'Contract Nexus')
  }));
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
