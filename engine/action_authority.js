/**
 * engine/action_authority.js
 * 
 * Phase M.3.2 — Universal Action Authority & Response Window Enforcement
 * 
 * Centralized, authoritative action gatekeeper used by BOTH:
 * 1. BattleSessionManager.submitPlayerAction() (REST/WebSocket session gateway)
 * 2. Direct engine methods in engine/index.js & engine/response_window.js
 * 
 * Ensures that:
 * - The active response window strictly controls priority and permitted actions.
 * - Non-priority players cannot perform ordinary actions (Play Card, Summon, Use Core, etc.).
 * - Direct engine methods cannot bypass the response window lifecycle.
 * - Failed action attempts produce deterministic error codes without state mutation.
 */

import { RESPONSE_WINDOW_TYPES, RESPONSE_WINDOW_STATUS } from './windows.js';
import { classifyFlashTiming, validateFlashTiming } from './flash_timing.js';
import { validateCardPathway, ACTION_PATHWAYS } from './card_types.js';

export const ACTION_CATEGORIES = Object.freeze({
  TURN_CONTROLLED: 'TURN_CONTROLLED',
  RESPONSE_WINDOW: 'RESPONSE_WINDOW',
  INTERACTION: 'INTERACTION',
  ADMINISTRATIVE: 'ADMINISTRATIVE'
});

export const TURN_CONTROLLED_ACTIONS = new Set([
  'STEP_ADVANCE',
  'ADVANCE_STEP',
  'ATTACK',
  'DECLARE_ATTACK',
  'PLAY_CARD',
  'SUMMON',
  'DEPLOY_NEXUS',
  'ACTIVATE_MAGIC',
  'CAST_MAGIC',
  'SET_BURST',
  'SET_MIRAGE',
  'USE_CORE',
  'MOVE_CORE',
  'TRANSFER_CORE',
  'CORE_TRANSFER',
  'END_TURN',
  'ACTIVATE_ABILITY',
  'ACTIVATE_FIELD_ABILITY',
  'EXECUTE_ACCEL',
  'USE_ACCEL',
  'EXECUTE_CHANGE',
  'PERFORM_ADVENT',
  'SEPARATE_BRAVE'
]);

export const RESPONSE_WINDOW_ACTIONS = new Set([
  'FLASH_ACTION',
  'CAST_FLASH_MAGIC',
  'PLAY_FLASH',
  'ACTIVATE_FLASH_ABILITY',
  'HIGH_SPEED_SUMMON',
  'USE_ACCEL',
  'DECLARE_BLOCK',
  'BLOCK',
  'PASS_BLOCK',
  'NO_BLOCK',
  'PASS_PRIORITY',
  'PASS',
  'FLASH_PASS',
  'PASS_FLASH',
  'RESPONSE_WINDOW_ACTION',
  'ACTIVATE_BURST',
  'RESOLVE_BURST',
  'SELECT_TARGET'
]);

export const INTERACTION_ACTIONS = new Set([
  'INTERACTION_RESPONSE'
]);

export const ADMINISTRATIVE_ACTIONS = new Set([
  'FORFEIT',
  'HEARTBEAT'
]);

/**
 * Authoritatively validates whether playerSide can execute actionType in the current game state.
 * 
 * @param {Object} game - Game engine instance containing state and windows
 * @param {string} playerSide - 'player' or 'opponent'
 * @param {string} actionType - The canonical action type
 * @param {Object} [actionPayload={}] - Additional action details (card, ability, etc.)
 * @param {Object} [options={}] - Options (bypassTiming, etc.)
 * @returns {{ allowed: boolean, reason?: string, code?: string, details?: any, status?: number }}
 */
export function authorizeAction(game, playerSide, actionType, actionPayload = {}, options = {}) {
  if (!actionType || typeof actionType !== 'string' || !actionType.trim()) {
    return {
      allowed: false,
      reason: 'INVALID_ACTION_TYPE',
      code: 'INVALID_ACTION_TYPE',
      details: 'Missing or empty action type',
      status: 400
    };
  }

  if (!game || !game.state) {
    return { allowed: false, reason: 'INVALID_GAME_INSTANCE', code: 'INVALID_GAME_INSTANCE', status: 500 };
  }

  const state = game.state;

  if (state.winner) {
    return { allowed: false, reason: 'GAME_ALREADY_OVER', code: 'GAME_ALREADY_OVER', status: 400 };
  }

  // Contract: Triggered abilities (such as When Attacks) cannot be manually activated as free Flash actions
  const targetAbility = actionPayload?.ability;
  if (targetAbility) {
    const timingSpec = classifyFlashTiming(targetAbility);
    if (timingSpec.isTriggered) {
      return {
        allowed: false,
        reason: 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE',
        code: 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE',
        details: 'Triggered abilities (such as When Attacks) cannot be manually activated as free Flash actions.',
        status: 400
      };
    }
  }

  const isTurnControlled = TURN_CONTROLLED_ACTIONS.has(actionType);
  const isResponseWindow = RESPONSE_WINDOW_ACTIONS.has(actionType);
  const isInteraction = INTERACTION_ACTIONS.has(actionType);
  const isAdministrative = ADMINISTRATIVE_ACTIONS.has(actionType);

  if (!isTurnControlled && !isResponseWindow && !isInteraction && !isAdministrative) {
    return {
      allowed: false,
      reason: 'INVALID_ACTION_TYPE',
      code: 'INVALID_ACTION_TYPE',
      details: `Unrecognized or unauthorized action type "${actionType}"`,
      status: 400
    };
  }

  if (actionType === 'FORFEIT' || actionType === 'HEARTBEAT') {
    return { allowed: true, category: ACTION_CATEGORIES.ADMINISTRATIVE };
  }

  if (actionType === 'SUMMON' || actionType === 'DEPLOY_NEXUS' || actionType === 'ACTIVATE_MAGIC' || actionType === 'CAST_MAGIC' || actionType === 'CAST_FLASH_MAGIC') {
    const p = state.players[playerSide];
    if (!p) {
      return { allowed: false, reason: 'INVALID_PLAYER', code: 'INVALID_PLAYER', status: 400 };
    }
    const cardParam = actionPayload.cardId || actionPayload.card;
    const cardId = typeof cardParam === 'string' ? cardParam : (cardParam?.id || cardParam?.cardNumber);
    const cardName = typeof cardParam === 'object' ? cardParam?.name : null;

    if (!cardId && !cardName) {
      return {
        allowed: false,
        reason: 'INVALID_CARD_SOURCE',
        code: 'INVALID_CARD_SOURCE',
        details: `${actionType} action must reference a valid cardId or card`,
        status: 400
      };
    }

    const findInList = (list) => (list || []).find(c =>
      (cardId && (c.id === cardId || c.cardNumber === cardId)) ||
      (cardName && c.name && c.name.toLowerCase() === cardName.toLowerCase())
    );

    const targetCard = findInList(p.hand) || findInList(p.removed);
    if (!targetCard) {
      return {
        allowed: false,
        reason: 'CARD_NOT_IN_HAND',
        code: 'CARD_NOT_IN_HAND',
        details: `Card "${cardId || cardName}" not found in ${playerSide}'s hand or eligible zone`,
        status: 400
      };
    }

    const expectedPathway = actionType === 'SUMMON'
      ? ACTION_PATHWAYS.SUMMON
      : actionType === 'DEPLOY_NEXUS'
      ? ACTION_PATHWAYS.DEPLOY_NEXUS
      : ACTION_PATHWAYS.ACTIVATE_MAGIC;

    const pathwayCheck = validateCardPathway(targetCard, expectedPathway);
    if (!pathwayCheck.allowed) {
      return {
        allowed: false,
        reason: pathwayCheck.reason,
        code: pathwayCheck.code,
        details: pathwayCheck.details,
        status: 400
      };
    }
  }

  // 1. Check Active Response Window
  const isWinActive = Boolean(
    game.windows &&
    typeof game.windows.isResponseWindowActive === 'function' &&
    game.windows.isResponseWindowActive()
  );
  const curWin = isWinActive ? game.windows.getCurrentWindow() : (state.responseWindow || null);

  const isWinOpenOrResolving = curWin && (
    curWin.resolutionStatus === RESPONSE_WINDOW_STATUS.OPEN ||
    curWin.resolutionStatus === RESPONSE_WINDOW_STATUS.RESOLVING ||
    curWin.status === RESPONSE_WINDOW_STATUS.OPEN ||
    curWin.status === RESPONSE_WINDOW_STATUS.RESOLVING
  );

  if (isWinActive && isWinOpenOrResolving) {
    // ── RULE 1: ORDINARY TURN ACTIONS ARE STRICTLY LOCKED DURING RESPONSE WINDOWS ──
    if (TURN_CONTROLLED_ACTIONS.has(actionType)) {
      // Exception: If actionType is PLAY_CARD or ACTIVATE_ABILITY with a valid Flash effect, it must be routed as a Flash action
      const isFlashAction = ((actionType === 'PLAY_CARD' || actionType === 'ACTIVATE_MAGIC' || actionType === 'CAST_MAGIC') && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH' || String(actionPayload.timing || '').toUpperCase() === 'FLASH')) ||
                            (actionType === 'ACTIVATE_ABILITY' && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH')) ||
                            (actionType === 'USE_ACCEL' && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH'));

      if (!isFlashAction) {
        return {
          allowed: false,
          reason: 'RESPONSE_WINDOW_ACTIVE',
          code: 'RESPONSE_WINDOW_ACTIVE',
          details: `Cannot execute ordinary turn action "${actionType}" while response window "${curWin.windowType}" is active`,
          window: curWin,
          status: 403
        };
      }
    }

    // ── RULE 2: PRIORITY PLAYER OWNERSHIP ──
    if (curWin.priorityPlayer && curWin.priorityPlayer !== playerSide) {
      return {
        allowed: false,
        reason: 'NOT_PRIORITY_PLAYER',
        code: 'NOT_PRIORITY_PLAYER',
        details: `Response window "${curWin.windowType}" priority is owned by "${curWin.priorityPlayer}", but caller is "${playerSide}"`,
        currentPriority: curWin.priorityPlayer,
        attemptedPlayer: playerSide,
        window: curWin,
        status: 403
      };
    }

    // ── RULE 3: WINDOW-SPECIFIC ACTION ELIGIBILITY ──
    const winType = curWin.windowType || curWin.type;

    // A. Flash Timing Windows (FLASH_1, FLASH_2, FLASH)
    if (winType === RESPONSE_WINDOW_TYPES.FLASH_1 || winType === RESPONSE_WINDOW_TYPES.FLASH_2 || winType === RESPONSE_WINDOW_TYPES.FLASH || winType === 'FLASH') {
      if (actionType === 'DECLARE_BLOCK' || actionType === 'BLOCK' || actionType === 'PASS_BLOCK' || actionType === 'NO_BLOCK') {
        return {
          allowed: false,
          reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          code: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          details: `Cannot declare or pass block during Flash Timing window "${winType}". Flash timing must close with 2 consecutive passes first.`,
          window: curWin,
          status: 403
        };
      }
    }

    // B. Block Declaration Window (BLOCK_DECLARATION)
    if (winType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      const isBlockAction = (actionType === 'DECLARE_BLOCK' || actionType === 'BLOCK' || actionType === 'PASS_BLOCK' || actionType === 'NO_BLOCK');
      if (!isBlockAction) {
        return {
          allowed: false,
          reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          code: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          details: `Flash or ordinary actions are not permitted during Block Declaration window. Defender must declare a block or pass block.`,
          window: curWin,
          status: 403
        };
      }
    }

    // C. Burst Window
    if (winType === RESPONSE_WINDOW_TYPES.BURST) {
      if (actionType !== 'ACTIVATE_BURST' && actionType !== 'PASS' && actionType !== 'PASS_PRIORITY') {
        return {
          allowed: false,
          reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          code: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
          details: `Only Burst activation or pass is permitted during Burst response window.`,
          window: curWin,
          status: 403
        };
      }
    }

    return { allowed: true, category: ACTION_CATEGORIES.RESPONSE_WINDOW, window: curWin };
  }

  // 2. No Active Response Window: Turn-Controlled Actions
  if (!isWinActive) {
    // If player attempts to declare block or pass block when no block declaration window is open
    if (actionType === 'DECLARE_BLOCK' || actionType === 'PASS_BLOCK' || actionType === 'NO_BLOCK') {
      return {
        allowed: false,
        reason: 'NOT_BLOCK_DECLARATION_WINDOW',
        code: 'NOT_BLOCK_DECLARATION_WINDOW',
        details: 'Block cannot be declared outside an active Block Declaration response window',
        status: 403
      };
    }

    // Turn player authorization check
    if (TURN_CONTROLLED_ACTIONS.has(actionType)) {
      const isFlashAction = ((actionType === 'PLAY_CARD' || actionType === 'ACTIVATE_MAGIC' || actionType === 'CAST_MAGIC') && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH' || String(actionPayload.timing || '').toUpperCase() === 'FLASH')) ||
                            (actionType === 'ACTIVATE_ABILITY' && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH')) ||
                            (actionType === 'USE_ACCEL' && (actionPayload.isFlash || actionPayload.options?.timing === 'FLASH'));

      if (!isFlashAction && playerSide !== state.activePlayer) {
        return {
          allowed: false,
          reason: 'NOT_ACTIVE_PLAYER',
          code: 'NOT_ACTIVE_PLAYER',
          details: `Action "${actionType}" can only be executed by active player "${state.activePlayer}", but caller is "${playerSide}"`,
          status: 403
        };
      }

      // Step advancement lock when pending interaction exists
      const hasPendingInteractions = (state.pendingInteractions || []).some(
        i => i.status === 'WAITING_FOR_PLAYER' || i.status === 'pending' || i.status === 'WAITING_FOR_INPUT'
      );
      if ((actionType === 'STEP_ADVANCE' || actionType === 'ADVANCE_STEP') && hasPendingInteractions) {
        return {
          allowed: false,
          reason: 'PENDING_INTERACTION_ACTIVE',
          code: 'PENDING_INTERACTION_ACTIVE',
          details: 'Cannot advance step while an interaction decision is pending',
          status: 403
        };
      }

      // Attack declaration check when combat already in progress
      if ((actionType === 'ATTACK' || actionType === 'DECLARE_ATTACK') && state.combat) {
        return {
          allowed: false,
          reason: 'COMBAT_ALREADY_IN_PROGRESS',
          code: 'COMBAT_ALREADY_IN_PROGRESS',
          details: 'Cannot declare an attack while combat is already in progress',
          status: 403
        };
      }

      // Attack Step: Cannot play cards or abilities without Flash timing
      if (state.step === 'ATTACK') {
        if (actionType === 'PLAY_CARD' && !actionPayload.isFlash && !actionPayload.options?.bypassTiming) {
          return {
            allowed: false,
            reason: 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP',
            code: 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP',
            status: 403
          };
        }
      }

      return { allowed: true, category: ACTION_CATEGORIES.TURN_CONTROLLED };
    }

    // Flash Action / Flash Ability Contextual Authorization when No Response Window is Active
    if (actionType === 'ACTIVATE_FLASH_ABILITY' || (actionType === 'ACTIVATE_ABILITY' && actionPayload?.isFlash)) {
      if (state.step === 'MAIN') {
        if (playerSide !== state.activePlayer) {
          return {
            allowed: false,
            reason: 'NOT_ACTIVE_PLAYER',
            code: 'NOT_ACTIVE_PLAYER',
            details: `Flash abilities can only be activated by active player "${state.activePlayer}" in Main Step, but caller is "${playerSide}"`,
            status: 403
          };
        }
        if (targetAbility) {
          const valRes = validateFlashTiming(targetAbility, state, playerSide, actionPayload.options);
          if (!valRes.allowed) {
            return {
              allowed: false,
              reason: valRes.reason,
              code: valRes.code,
              details: valRes.details || 'Flash timing restricted in Main Step',
              status: 403
            };
          }
        }
        return { allowed: true, category: ACTION_CATEGORIES.TURN_CONTROLLED };
      }

      if (state.step === 'ATTACK') {
        return {
          allowed: false,
          reason: 'NO_ACTIVE_FLASH_WINDOW',
          code: 'NO_ACTIVE_FLASH_WINDOW',
          details: 'Flash abilities cannot be activated during Attack Step outside an active Flash response window.',
          status: 403
        };
      }

      return {
        allowed: false,
        reason: 'STEP_TIMING_MISMATCH',
        code: 'STEP_TIMING_MISMATCH',
        details: `Flash abilities cannot be activated during ${state.step} step.`,
        status: 403
      };
    }
  }

  // 3. Interaction Response Handling
  if (actionType === 'INTERACTION_RESPONSE') {
    const interactionId = actionPayload.interactionId;
    const interaction = (state.pendingInteractions || []).find(i => i.id === interactionId || i.interactionId === interactionId);
    if (!interaction) {
      return {
        allowed: false,
        reason: 'INTERACTION_NOT_FOUND',
        code: 'INTERACTION_NOT_FOUND',
        details: `Interaction "${interactionId}" does not exist or has already resolved`,
        status: 404
      };
    }
    const st = String(interaction.status || '').toUpperCase();
    const isPending = st === 'WAITING_FOR_PLAYER' || st === 'PENDING';
    if (!isPending) {
      return {
        allowed: false,
        reason: 'INTERACTION_NOT_PENDING',
        code: 'INTERACTION_NOT_PENDING',
        details: `Interaction "${interactionId}" is no longer pending (status: ${interaction.status})`,
        status: 400
      };
    }
    if (interaction.decisionOwner !== playerSide) {
      return {
        allowed: false,
        reason: 'UNAUTHORIZED_DECISION_OWNER',
        code: 'UNAUTHORIZED_DECISION_OWNER',
        details: `Interaction is owned by "${interaction.decisionOwner}", but caller is "${playerSide}"`,
        status: 403
      };
    }

    if (curWin && (curWin.originatingInteractionId === interactionId || interaction.context?.windowId === curWin.windowId)) {
      if (curWin.priorityPlayer !== playerSide) {
        return {
          allowed: false,
          reason: 'NOT_PRIORITY_PLAYER',
          code: 'NOT_PRIORITY_PLAYER',
          details: `Response window "${curWin.windowType}" priority is owned by "${curWin.priorityPlayer}", but caller is "${playerSide}"`,
          status: 403
        };
      }
    }

    return { allowed: true, category: ACTION_CATEGORIES.INTERACTION, interaction };
  }

  if (isAdministrative) {
    return { allowed: true, category: ACTION_CATEGORIES.ADMINISTRATIVE };
  }

  return {
    allowed: false,
    reason: 'INVALID_ACTION_TYPE',
    code: 'INVALID_ACTION_TYPE',
    details: `Unrecognized or unauthorized action type "${actionType}"`,
    status: 400
  };
}
