/**
 * engine/card_types.js
 *
 * Canonical Card-Type Classification & Action Pathway Legality Contract
 * for Battle Spirits Eternal.
 *
 * Covers all canonical database types:
 *   - Spirit, Contract Spirit, Token Spirit
 *   - Ultimate, Contract Ultimate
 *   - Brave
 *   - Nexus, Contract Nexus
 *   - Magic
 */

export const CARD_CATEGORIES = Object.freeze({
  UNIT: 'UNIT',
  NEXUS: 'NEXUS',
  MAGIC: 'MAGIC',
  UNKNOWN: 'UNKNOWN'
});

export const ACTION_PATHWAYS = Object.freeze({
  SUMMON: 'SUMMON',
  DEPLOY_NEXUS: 'DEPLOY_NEXUS',
  ACTIVATE_MAGIC: 'ACTIVATE_MAGIC',
  SET_BURST: 'SET_BURST',
  SET_MIRAGE: 'SET_MIRAGE'
});

/**
 * Classifies a card object or raw type string into canonical Battle Spirits categories.
 * @param {Object|string} cardOrType
 */
export function classifyCardType(cardOrType) {
  const rawType = typeof cardOrType === 'string'
    ? cardOrType.trim()
    : String(cardOrType?.type || '').trim();
  const low = rawType.toLowerCase();

  const isContract = low.includes('contract');
  const isToken = low.includes('token');

  if (low === 'magic') {
    return {
      rawType,
      category: CARD_CATEGORIES.MAGIC,
      isUnit: false,
      isSpirit: false,
      isUltimate: false,
      isBrave: false,
      isNexus: false,
      isMagic: true,
      isContract: false,
      isToken: false
    };
  }

  if (low === 'nexus' || low === 'contract nexus') {
    return {
      rawType,
      category: CARD_CATEGORIES.NEXUS,
      isUnit: false,
      isSpirit: false,
      isUltimate: false,
      isBrave: false,
      isNexus: true,
      isMagic: false,
      isContract,
      isToken: false
    };
  }

  if (low === 'spirit' || low === 'contract spirit' || low === 'token spirit') {
    return {
      rawType,
      category: CARD_CATEGORIES.UNIT,
      isUnit: true,
      isSpirit: true,
      isUltimate: false,
      isBrave: false,
      isNexus: false,
      isMagic: false,
      isContract,
      isToken
    };
  }

  if (low === 'ultimate' || low === 'contract ultimate') {
    return {
      rawType,
      category: CARD_CATEGORIES.UNIT,
      isUnit: true,
      isSpirit: false,
      isUltimate: true,
      isBrave: false,
      isNexus: false,
      isMagic: false,
      isContract,
      isToken: false
    };
  }

  if (low === 'brave') {
    return {
      rawType,
      category: CARD_CATEGORIES.UNIT,
      isUnit: true,
      isSpirit: false,
      isUltimate: false,
      isBrave: true,
      isNexus: false,
      isMagic: false,
      isContract: false,
      isToken: false
    };
  }

  return {
    rawType,
    category: CARD_CATEGORIES.UNKNOWN,
    isUnit: false,
    isSpirit: false,
    isUltimate: false,
    isBrave: false,
    isNexus: false,
    isMagic: false,
    isContract,
    isToken
  };
}

/**
 * Validates whether a card is legally permitted to enter the given action pathway.
 * @param {Object} card
 * @param {string} pathway - One of ACTION_PATHWAYS
 * @returns {{ allowed: boolean, reason?: string, code?: string, details?: string, classification: Object }}
 */
export function validateCardPathway(card, pathway) {
  const cls = classifyCardType(card);
  if (!card || cls.category === CARD_CATEGORIES.UNKNOWN) {
    return {
      allowed: false,
      reason: 'INVALID_CARD_TYPE',
      code: 'INVALID_CARD_TYPE',
      details: `Unknown or missing card type "${cls.rawType}"`,
      classification: cls
    };
  }

  if (pathway === ACTION_PATHWAYS.SUMMON) {
    if (!cls.isUnit) {
      return {
        allowed: false,
        reason: 'INVALID_CARD_TYPE',
        code: 'INVALID_CARD_TYPE',
        details: `Cannot summon card of type "${cls.rawType}" through the Spirit/Ultimate/Brave summoning pathway`,
        classification: cls
      };
    }
    return { allowed: true, classification: cls };
  }

  if (pathway === ACTION_PATHWAYS.DEPLOY_NEXUS) {
    if (!cls.isNexus) {
      return {
        allowed: false,
        reason: 'INVALID_CARD_TYPE',
        code: 'INVALID_CARD_TYPE',
        details: `Cannot deploy card of type "${cls.rawType}" through the Nexus deployment pathway`,
        classification: cls
      };
    }
    return { allowed: true, classification: cls };
  }

  if (pathway === ACTION_PATHWAYS.ACTIVATE_MAGIC) {
    if (!cls.isMagic) {
      return {
        allowed: false,
        reason: 'INVALID_CARD_TYPE',
        code: 'INVALID_CARD_TYPE',
        details: `Cannot activate card of type "${cls.rawType}" through the Magic activation pathway`,
        classification: cls
      };
    }
    return { allowed: true, classification: cls };
  }

  if (pathway === ACTION_PATHWAYS.SET_BURST) {
    const eff = String(card.effect || card.raw_effect || '');
    const hasBurst = Boolean(
      (card.compiledIr?.abilities || []).some(a => a.header?.timing === 'BURST' || a.header?.burstCondition) ||
      /\[Burst[:\s]|【バースト/i.test(eff)
    );
    if (!hasBurst) {
      return {
        allowed: false,
        reason: 'CARD_HAS_NO_BURST',
        code: 'CARD_HAS_NO_BURST',
        details: `Card "${card.name || card.id}" does not have a Burst effect`,
        classification: cls
      };
    }
    return { allowed: true, classification: cls };
  }

  if (pathway === ACTION_PATHWAYS.SET_MIRAGE) {
    const eff = String(card.effect || card.raw_effect || '');
    const hasMirage = Boolean(
      (card.compiledIr?.abilities || []).some(a => String(a.header?.keyword || '').toLowerCase() === 'mirage' || a.header?.isMirage) ||
      /\[Mirage[:\s]|【ミラージュ/i.test(eff)
    );
    if (!hasMirage) {
      return {
        allowed: false,
        reason: 'CARD_HAS_NO_MIRAGE',
        code: 'CARD_HAS_NO_MIRAGE',
        details: `Card "${card.name || card.id}" does not have a Mirage effect`,
        classification: cls
      };
    }
    return { allowed: true, classification: cls };
  }

  return {
    allowed: false,
    reason: 'UNKNOWN_PATHWAY',
    code: 'UNKNOWN_PATHWAY',
    details: `Unknown pathway "${pathway}"`,
    classification: cls
  };
}
