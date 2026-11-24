/**
 * engine/flash_timing.js
 * 
 * Phase M.3.1 - Flash Effect Timing Scope Correction & Card-Specific Timing Enforcement.
 * 
 * Implements authoritative Battle Spirits Eternal Version 17.0 rules:
 * - A generic Flash effect can be used during controller's Main Step (active player only)
 *   and during either player's Flash Timing in battle.
 * - Explicit card-specific timing restrictions (e.g. "Your Attack Step", "Opponent's Attack Step",
 *   "Either Attack Step", "During Attack") narrow the general permission and take precedence.
 * - Ordinary Main Step Flash activation does not create an artificial response window for the opponent.
 * - Battle Flash Timing preserves alternating priority and consecutive-pass closure.
 */

export const FLASH_TIMING_QUALIFIERS = {
  GENERIC: 'GENERIC',
  YOUR_ATTACK_STEP: 'YOUR_ATTACK_STEP',
  OPPONENTS_ATTACK_STEP: 'OPPONENTS_ATTACK_STEP',
  EITHER_ATTACK_STEP: 'EITHER_ATTACK_STEP',
  DURING_ATTACK: 'DURING_ATTACK',
  WHEN_ATTACKS: 'WHEN_ATTACKS',
  FLASH_TIMING_ONLY: 'FLASH_TIMING_ONLY',
  NONE: 'NONE'
};

export const FLASH_AVAILABILITY = {
  CONTROLLER_MAIN_STEP: 'CONTROLLER_MAIN_STEP',
  CONTROLLER_ATTACK_STEP: 'CONTROLLER_ATTACK_STEP',
  OPPONENT_ATTACK_STEP: 'OPPONENT_ATTACK_STEP',
  EITHER_PLAYER_BATTLE_FLASH_TIMING: 'EITHER_PLAYER_BATTLE_FLASH_TIMING'
};

/**
 * Inspects a card or ability and returns its structured timing specification.
 * Supports both pre-compiled IR structures and runtime card objects.
 */
export function classifyFlashTiming(cardOrAbility) {
  if (!cardOrAbility) {
    return createEmptyTimingSpec();
  }

  // 1. If it's already an ability object with pre-attached flashTimingSpec, return it
  if (cardOrAbility.flashTimingSpec) {
    return cardOrAbility.flashTimingSpec;
  }
  if (cardOrAbility.header?.flashTimingSpec) {
    return cardOrAbility.header.flashTimingSpec;
  }

  // 2. If it's an Ability with a header
  if (cardOrAbility.header) {
    return classifyAbilityHeader(cardOrAbility.header, cardOrAbility);
  }

  // 3. If it's a Card with compiledIr abilities
  if (cardOrAbility.compiledIr?.abilities?.length) {
    const flashAbilities = cardOrAbility.compiledIr.abilities.filter(a =>
      a.header?.isFlash || String(a.header?.timing || '').toUpperCase() === 'FLASH' ||
      String(a.header?.timingLabel || '').toLowerCase().includes('flash')
    );
    if (flashAbilities.length > 0) {
      // Return specification of the primary flash ability
      return classifyAbilityHeader(flashAbilities[0].header, flashAbilities[0]);
    }
  }

  // 4. Raw effect text inspection
  const text = String(
    cardOrAbility.effect ||
    cardOrAbility.raw_effect ||
    cardOrAbility.compiledIr?.originalEffectText ||
    cardOrAbility.text ||
    ''
  );

  return classifyFromText(text, cardOrAbility);
}

function createEmptyTimingSpec() {
  return {
    effectType: 'PASSIVE',
    isFlash: false,
    isGenericFlash: false,
    isTriggered: false,
    isContinuous: false,
    timingQualifier: FLASH_TIMING_QUALIFIERS.NONE,
    generalAvailability: [],
    additionalRestrictions: {
      allowedSteps: [],
      allowedTurnOwners: [],
      requiresBattle: false,
      requiresFlashWindow: false,
      triggerCondition: null
    }
  };
}

function classifyAbilityHeader(header, ability) {
  const isFlash = Boolean(
    header.isFlash ||
    String(header.timing || '').toUpperCase() === 'FLASH' ||
    String(header.timingLabel || '').toLowerCase().includes('flash') ||
    (header.timings || []).includes('FLASH')
  );

  if (!isFlash) {
    return createEmptyTimingSpec();
  }

  const timingLabel = String(header.timingLabel || '').toLowerCase();
  const rawBody = String(ability?.cleanBody || ability?.text || '');
  const combined = `${timingLabel} ${rawBody}`.toLowerCase();

  let timingQualifier = FLASH_TIMING_QUALIFIERS.GENERIC;
  let isTriggered = false;
  let triggerCondition = null;

  if (/(?:when\s+(?:this\s+spirit\s+)?attacks|アタック時)/i.test(combined) || header.timing === 'WHEN_ATTACKS') {
    timingQualifier = FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS;
    isTriggered = true;
    triggerCondition = 'WHEN_ATTACKS';
  } else if (/your\s+attack\s+step|自分のアタックステップ/i.test(combined) || header.timingOwner === 'SELF') {
    timingQualifier = FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP;
  } else if (/(?:opponent'?s|opposing)\s+attack\s+step|相手のアタックステップ/i.test(combined) || header.timingOwner === 'OPPONENT') {
    timingQualifier = FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP;
  } else if (/either\s+attack\s+step|お互いのアタックステップ/i.test(combined) || header.timingOwner === 'EITHER') {
    timingQualifier = FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP;
  } else if (/during\s+attack\b/i.test(combined)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.DURING_ATTACK;
  } else if (/flash\s+timing/i.test(combined)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.FLASH_TIMING_ONLY;
  }

  return buildTimingSpecification(timingQualifier, isTriggered, triggerCondition);
}

function classifyFromText(text, card) {
  const isFlash = /(?:^|[\r\n]|\s)(?:\[Flash\]|【フラッシュ】|Flash(?:\s*[-–]|\s*:))/i.test(text) ||
    /\[(?:accel|advent)[^\]]*flash[^\]]*\]/i.test(text);

  if (!isFlash) {
    return createEmptyTimingSpec();
  }

  let timingQualifier = FLASH_TIMING_QUALIFIERS.GENERIC;
  let isTriggered = false;
  let triggerCondition = null;

  // Check if it's an event trigger attached to attack
  if (/(?:\[LV\d+\][^\n]*\((?:When Attacks|アタック時)\)[^\n]*Flash\b|(?:When Attacks|アタック時)[^\n]*Flash\b|Flash[^\n]*\((?:When Attacks|アタック時)\)|アタック時[^\n]*【フラッシュ】|【フラッシュ】[^\n]*アタック時)/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS;
    isTriggered = true;
    triggerCondition = 'WHEN_ATTACKS';
  } else if (/flash[^-–]*[-–]?\s*\(+your\s+attack\s+step\)+|自分のアタックステップ/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP;
  } else if (/flash[^-–]*[-–]?\s*\(+(?:opponent'?s|opposing)\s+attack\s+step\)+|相手のアタックステップ/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP;
  } else if (/flash[^-–]*[-–]?\s*\(+either\s+attack\s+step\)+|お互いのアタックステップ/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP;
  } else if (/flash[^-–]*[-–]?\s*during\s+attack\b/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.DURING_ATTACK;
  } else if (/flash[^-–]*[-–]?\s*during\s+flash\s+timing\b/i.test(text)) {
    timingQualifier = FLASH_TIMING_QUALIFIERS.FLASH_TIMING_ONLY;
  }

  return buildTimingSpecification(timingQualifier, isTriggered, triggerCondition);
}

function buildTimingSpecification(timingQualifier, isTriggered = false, triggerCondition = null) {
  const isGeneric = (timingQualifier === FLASH_TIMING_QUALIFIERS.GENERIC);
  const allowedSteps = [];
  const allowedTurnOwners = [];
  let requiresBattle = false;
  let requiresFlashWindow = false;
  const generalAvailability = [];

  switch (timingQualifier) {
    case FLASH_TIMING_QUALIFIERS.GENERIC:
      allowedSteps.push('MAIN', 'ATTACK');
      allowedTurnOwners.push('SELF', 'OPPONENT');
      generalAvailability.push(
        FLASH_AVAILABILITY.CONTROLLER_MAIN_STEP,
        FLASH_AVAILABILITY.EITHER_PLAYER_BATTLE_FLASH_TIMING
      );
      break;

    case FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('SELF');
      requiresFlashWindow = true;
      generalAvailability.push(FLASH_AVAILABILITY.CONTROLLER_ATTACK_STEP);
      break;

    case FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('OPPONENT');
      requiresFlashWindow = true;
      generalAvailability.push(FLASH_AVAILABILITY.OPPONENT_ATTACK_STEP);
      break;

    case FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('SELF', 'OPPONENT');
      requiresFlashWindow = true;
      generalAvailability.push(FLASH_AVAILABILITY.EITHER_PLAYER_BATTLE_FLASH_TIMING);
      break;

    case FLASH_TIMING_QUALIFIERS.DURING_ATTACK:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('SELF', 'OPPONENT');
      requiresBattle = true;
      requiresFlashWindow = true;
      generalAvailability.push(FLASH_AVAILABILITY.EITHER_PLAYER_BATTLE_FLASH_TIMING);
      break;

    case FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('SELF');
      requiresBattle = true;
      isTriggered = true;
      triggerCondition = 'WHEN_ATTACKS';
      break;

    case FLASH_TIMING_QUALIFIERS.FLASH_TIMING_ONLY:
      allowedSteps.push('ATTACK');
      allowedTurnOwners.push('SELF', 'OPPONENT');
      requiresFlashWindow = true;
      generalAvailability.push(FLASH_AVAILABILITY.EITHER_PLAYER_BATTLE_FLASH_TIMING);
      break;

    default:
      break;
  }

  return {
    effectType: 'FLASH',
    isFlash: true,
    isGenericFlash: isGeneric,
    isTriggered,
    isContinuous: false,
    timingQualifier,
    generalAvailability,
    additionalRestrictions: {
      allowedSteps,
      allowedTurnOwners,
      requiresBattle,
      requiresFlashWindow,
      triggerCondition
    }
  };
}

/**
 * Validates whether a card or ability can legally be activated in the given game state.
 * 
 * Rules Enforced:
 * 1. Generic Flash effects can be used:
 *    - In Controller's Main Step (active player only).
 *    - In Either Player's Attack Step during Flash Timing.
 * 2. Card-specific restrictions:
 *    - "Your Attack Step" -> Attack Step when player is turn player only (never Main Step).
 *    - "Opponent's Attack Step" -> Attack Step when player is defending only (never Main Step).
 *    - "Either Attack Step" -> Either player's Attack Step only (never Main Step).
 *    - "During Attack" -> Requires an active battle (combatEvent != null).
 * 3. Step restrictions:
 *    - Cannot be activated in START, CORE, DRAW, REFRESH, or END steps unless bypassTiming is set.
 */
export function validateFlashTiming(cardOrAbility, state, playerSide, options = {}) {
  const spec = classifyFlashTiming(cardOrAbility);

  if (!spec.isFlash) {
    return {
      allowed: false,
      reason: 'NOT_A_FLASH_EFFECT',
      code: 'NOT_A_FLASH_EFFECT',
      specification: spec
    };
  }

  // Triggered abilities are not voluntarily activated as free flash actions
  if (spec.isTriggered) {
    return {
      allowed: false,
      reason: 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE',
      code: 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE',
      specification: spec
    };
  }

  if (options.bypassTiming) {
    return { allowed: true, reason: null, code: 'OK', specification: spec };
  }

  const currentStep = String(state?.step || state?.currentStep || state?.phase || '').toUpperCase();
  const activePlayer = state?.activePlayer || (state?.turn % 2 === 1 ? 'player' : 'opponent');
  const isControllerTurn = (playerSide === activePlayer);

  // ── 1. MAIN STEP EVALUATION ──
  if (currentStep === 'MAIN' || currentStep === 'MAIN_STEP') {
    // Only the active player can initiate actions during the Main Step
    if (!isControllerTurn) {
      return {
        allowed: false,
        reason: 'NOT_ACTIVE_PLAYER',
        code: 'NOT_ACTIVE_PLAYER',
        details: 'Only the active player can take actions during their Main Step.',
        specification: spec
      };
    }

    // Card-specific Attack Step restrictions strictly forbid Main Step usage
    if (spec.timingQualifier === FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP ||
        spec.timingQualifier === FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP ||
        spec.timingQualifier === FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP ||
        spec.timingQualifier === FLASH_TIMING_QUALIFIERS.DURING_ATTACK ||
        spec.timingQualifier === FLASH_TIMING_QUALIFIERS.FLASH_TIMING_ONLY) {
      return {
        allowed: false,
        reason: 'RESTRICTED_TO_ATTACK_STEP',
        code: 'RESTRICTED_TO_ATTACK_STEP',
        details: `This effect specifies (${spec.timingQualifier}) and cannot be used during the Main Step.`,
        specification: spec
      };
    }

    // Generic Flash effect is permitted during controller's Main Step!
    if (spec.isGenericFlash || spec.additionalRestrictions.allowedSteps.includes('MAIN')) {
      return {
        allowed: true,
        reason: null,
        code: 'OK',
        specification: spec
      };
    }

    return {
      allowed: false,
      reason: 'INVALID_TIMING_FOR_MAIN_STEP',
      code: 'INVALID_TIMING_FOR_MAIN_STEP',
      specification: spec
    };
  }

  // ── 2. ATTACK STEP / BATTLE EVALUATION ──
  const isWinActiveCheck = Boolean(
    state?.windows &&
    typeof state.windows.isResponseWindowActive === 'function' &&
    state.windows.isResponseWindowActive()
  );
  const curWinCheck = isWinActiveCheck ? state.windows.getCurrentWindow() : (state?.responseWindow || null);
  const isFlashWindowActive = Boolean(curWinCheck && (curWinCheck.windowType === 'FLASH_1' || curWinCheck.windowType === 'FLASH_2' || curWinCheck.windowType === 'FLASH'));

  if (currentStep === 'ATTACK' || currentStep === 'ATTACK_STEP' || isFlashWindowActive) {
    // Priority and Window Check (Phase M.3.2 Defect A5)
    if (options.bypassTiming !== true) {
      const isWinActive = Boolean(
        state?.windows &&
        typeof state.windows.isResponseWindowActive === 'function' &&
        state.windows.isResponseWindowActive()
      );
      const curWin = isWinActive ? state.windows.getCurrentWindow() : (state?.responseWindow || null);

      if (curWin && (curWin.resolutionStatus === 'OPEN' || curWin.status === 'OPEN')) {
        const winType = curWin.windowType || curWin.type;
        if (winType !== 'FLASH_1' && winType !== 'FLASH_2' && winType !== 'FLASH') {
          return {
            allowed: false,
            reason: 'FLASH_TIMING_NOT_OPEN',
            code: 'FLASH_TIMING_NOT_OPEN',
            details: `Current response window "${winType}" is not a Flash Timing window.`,
            specification: spec
          };
        }
        if (curWin.priorityPlayer && curWin.priorityPlayer !== playerSide) {
          return {
            allowed: false,
            reason: 'NOT_PRIORITY_PLAYER',
            code: 'NOT_PRIORITY_PLAYER',
            details: `Flash Timing priority in window "${winType}" is owned by "${curWin.priorityPlayer}", but caller is "${playerSide}".`,
            specification: spec
          };
        }
      } else if (state?.combat) {
        // In active combat without an open Flash window, Flash cannot be played
        return {
          allowed: false,
          reason: 'FLASH_TIMING_NOT_OPEN',
          code: 'FLASH_TIMING_NOT_OPEN',
          details: 'No Flash Timing window is currently active in combat.',
          specification: spec
        };
      }
    }

    // Check Turn Owner restrictions
    if (spec.timingQualifier === FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP && !isControllerTurn) {
      return {
        allowed: false,
        reason: 'YOUR_ATTACK_STEP_ONLY',
        code: 'YOUR_ATTACK_STEP_ONLY',
        details: 'Effect specifies (Your Attack Step) and cannot be activated during opponent attack step.',
        specification: spec
      };
    }

    if (spec.timingQualifier === FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP && isControllerTurn) {
      return {
        allowed: false,
        reason: 'OPPONENT_ATTACK_STEP_ONLY',
        code: 'OPPONENT_ATTACK_STEP_ONLY',
        details: "Effect specifies (Opponent's Attack Step) and cannot be activated during your attack step.",
        specification: spec
      };
    }

    // Check active battle requirement
    if (spec.additionalRestrictions.requiresBattle) {
      const hasActiveBattle = Boolean(state?.combatEvent || state?.inBattle || state?.attacker);
      if (!hasActiveBattle) {
        return {
          allowed: false,
          reason: 'REQUIRES_ACTIVE_BATTLE',
          code: 'REQUIRES_ACTIVE_BATTLE',
          details: 'Effect specifies During Attack and requires an active battle clash.',
          specification: spec
        };
      }
    }

    // In Attack Step, generic flash and matched card-specific flash are legal
    return {
      allowed: true,
      reason: null,
      code: 'OK',
      specification: spec
    };
  }

  // ── 3. OTHER STEPS (START, CORE, DRAW, REFRESH, END) ──
  return {
    allowed: false,
    reason: 'INVALID_STEP_FOR_FLASH',
    code: 'INVALID_STEP_FOR_FLASH',
    details: `Flash effects cannot be activated during ${currentStep || 'this step'}.`,
    specification: spec
  };
}

/**
 * Returns true if a card or ability is a generic Flash effect with no additional step/owner restrictions.
 */
export function isGenericFlash(cardOrAbility) {
  const spec = classifyFlashTiming(cardOrAbility);
  return spec.isFlash && spec.isGenericFlash;
}

/**
 * Convenience check for Main Step legal play.
 */
export function isFlashAllowedInMainStep(cardOrAbility, state, playerSide) {
  const res = validateFlashTiming(cardOrAbility, state, playerSide);
  return res.allowed;
}

/**
 * Convenience check for Attack Step legal play.
 */
export function isFlashAllowedInAttackStep(cardOrAbility, state, playerSide) {
  const res = validateFlashTiming(cardOrAbility, state, playerSide);
  return res.allowed;
}
