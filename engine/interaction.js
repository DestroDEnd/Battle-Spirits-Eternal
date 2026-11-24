/**
 * engine/interaction.js
 * 
 * Formal Interaction Protocol and Controller for Battle Spirits Eternal.
 * Manages player decisions, selection requests, pause/resume lifecycles,
 * validation of choices against legal candidates, and protection against
 * duplicate, stale, or concurrent resolution.
 */

import { normalizeCardZone, validateTargetAvailability } from './selectors.js';

let nextInteractionSeq = 1;

export function resetInteractionCounter() {
  nextInteractionSeq = 1;
}

export const INTERACTION_TYPES = Object.freeze({
  // Universal Decision Contract (18 Canonical Types)
  ACTIVATE_EFFECT: 'ACTIVATE_EFFECT',
  SELECT_EFFECT: 'SELECT_EFFECT',
  SELECT_MODE: 'SELECT_MODE',
  SELECT_CARDS: 'SELECT_CARDS',
  SELECT_TARGETS: 'SELECT_TARGETS',
  SELECT_PLAYER: 'SELECT_PLAYER',
  SELECT_ZONE: 'SELECT_ZONE',
  SELECT_ORDER: 'SELECT_ORDER',
  SELECT_PAYMENT_METHOD: 'SELECT_PAYMENT_METHOD',
  SELECT_CORE_ALLOCATION: 'SELECT_CORE_ALLOCATION',
  SELECT_SUMMON: 'SELECT_SUMMON',
  SELECT_BLOCKER: 'SELECT_BLOCKER',
  SELECT_ATTACKER: 'SELECT_ATTACKER',
  SELECT_OPTIONAL_ACTION: 'SELECT_OPTIONAL_ACTION',
  SELECT_REPLACEMENT_EFFECT: 'SELECT_REPLACEMENT_EFFECT',
  SELECT_BRANCH: 'SELECT_BRANCH',
  CONFIRM_ACTION: 'CONFIRM_ACTION',
  DECLINE_OPTIONAL_EFFECT: 'DECLINE_OPTIONAL_EFFECT',

  // Canonical and Backward-Compatible Aliases
  SELECT_TARGET: 'SELECT_TARGETS',
  CHOOSE_OPTION: 'SELECT_MODE',
  PAY_CORES: 'SELECT_CORE_ALLOCATION',
  CHOOSE_CORES: 'SELECT_CORE_ALLOCATION',
  SELECT_CARD: 'SELECT_CARDS',
  CHOOSE_EFFECT_ORDER: 'SELECT_ORDER',
  CONFIRM_OPTIONAL: 'SELECT_OPTIONAL_ACTION',
  BURST_TRIGGER: 'ACTIVATE_EFFECT',
  FLASH_ACTION: 'ACTIVATE_EFFECT',
  BLOCK_CHOICE: 'SELECT_BLOCKER',
  CHOOSE_OR_BRANCH: 'SELECT_BRANCH'
});

export const INTERACTION_STATUS = Object.freeze({
  READY: 'READY',
  WAITING_FOR_PLAYER: 'WAITING_FOR_PLAYER',
  VALIDATING_RESPONSE: 'VALIDATING_RESPONSE',
  RESOLVING: 'RESOLVING',
  COMPLETED: 'COMPLETED',
  RESOLVED: 'RESOLVED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED'
});

/**
 * Creates a normalized, serializable universal interaction request object.
 * Strictly adheres to the Phase L Universal Decision Contract.
 */
export function createInteractionRequest(data = {}) {
  const interactionId = data.interactionId || data.id || `interaction_${nextInteractionSeq++}`;
  const rawType = data.requestType || data.type || INTERACTION_TYPES.CONFIRM_ACTION;
  const canonicalType = INTERACTION_TYPES[rawType] || rawType;
  
  const requestingPlayer = data.requestingPlayer || data.controller || data.context?.controller || 'system';
  const decisionOwner = data.decisionOwner || data.player || data.chooser || 'player';
  
  const sourceCardId = data.sourceCardId || data.context?.sourceCard?.id || data.sourceCard?.id || null;
  const sourceAbilityId = data.sourceAbilityId || data.context?.sourceAbility?.id || data.abilityId || null;
  const physicalAbilityId = data.physicalAbilityId || data.context?.physicalAbilityId || null;
  const effectId = data.effectId || data.context?.effectId || null;
  const operationId = data.operationId || data.op?.op || data.context?.operationId || null;
  const timingWindow = data.timingWindow || data.timing || data.context?.timing || 'MAIN';
  
  const isOptional = Boolean(
    data.optional ||
    data.isOptional ||
    data.upTo ||
    canonicalType === INTERACTION_TYPES.SELECT_OPTIONAL_ACTION ||
    canonicalType === INTERACTION_TYPES.DECLINE_OPTIONAL_EFFECT ||
    (canonicalType === INTERACTION_TYPES.CONFIRM_ACTION && data.optional !== false)
  );
  const mandatory = !isOptional;

  const rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];
  const candidates = rawCandidates.map((c, idx) => {
    if (c && typeof c === 'object') {
      const cardObj = c.card || (c.top ? c.top : null) || (c.id ? c : null);
      const stackObj = c.stack || (c.cores ? c : null);
      const normalizedZone = normalizeCardZone(c.zone || (stackObj ? 'field' : (cardObj ? cardObj.zone : null)) || null);
      const physicalSide = c.side || (stackObj ? stackObj.owner : null) || decisionOwner;
      return {
        candidateId: String(c.candidateId || (cardObj ? cardObj.id : (stackObj ? stackObj.id : `cand_${idx}`))),
        cardId: c.cardId || (cardObj ? cardObj.id : null),
        cardNumber: c.cardNumber || (cardObj ? (cardObj.cardNumber || cardObj.card_number) : null),
        name: c.name || (cardObj ? cardObj.name : null),
        cardType: c.cardType || (cardObj ? cardObj.cardType : null),
        owner: c.owner || (cardObj ? cardObj.owner : null),
        controller: c.controller || (cardObj ? cardObj.controller : null) || physicalSide,
        stackId: c.stackId || (stackObj ? stackObj.id : null),
        zone: normalizedZone,
        side: physicalSide,
        action: c.action || null,
        raw: c
      };
    }
    return { candidateId: String(c), value: c };
  });

  const options = Array.isArray(data.options) ? data.options : [];
  const defaultCount = typeof data.count === 'number' ? data.count : 1;
  const minSelections = typeof data.minSelections === 'number'
    ? data.minSelections
    : (typeof data.min === 'number' ? data.min : (isOptional ? 0 : defaultCount));
  const maxSelections = typeof data.maxSelections === 'number'
    ? data.maxSelections
    : (typeof data.max === 'number' ? data.max : defaultCount);

  const selectionConstraints = {
    min: minSelections,
    max: maxSelections,
    count: defaultCount,
    upTo: Boolean(data.upTo),
    exact: Boolean(data.exact),
    maxTotalBp: data.maxTotalBp || null,
    maxTotalCost: data.maxTotalCost || null,
    ...(data.selectionConstraints || data.constraints || data.selector || {})
  };

  const allowedActions = Array.isArray(data.allowedActions)
    ? data.allowedActions
    : (isOptional ? ['CONFIRM', 'DECLINE', 'SELECT'] : ['CONFIRM', 'SELECT']);

  const defaultAction = data.defaultAction || (isOptional ? 'DECLINE' : null);
  const deadlinePolicy = data.deadlinePolicy || { timeoutMs: 0, onTimeout: 'PAUSE' };

  return {
    // Phase L Universal Contract Fields
    interactionId,
    id: interactionId, // Backward compatibility alias
    matchId: data.matchId || 'local_match',
    requestType: canonicalType,
    type: data.type || canonicalType, // Preserves caller's type for backward compatibility
    rawType: data.type || canonicalType,
    requestingPlayer,
    decisionOwner,
    player: decisionOwner, // Backward compatibility alias
    sourceCardId,
    sourceAbilityId,
    physicalAbilityId,
    effectId,
    operationId,
    timingWindow,
    mandatory,
    optional: isOptional,
    candidates,
    selectionConstraints,
    minSelections, // Backward compatibility alias
    maxSelections, // Backward compatibility alias
    allowedActions,
    defaultAction,
    deadlinePolicy,
    context: data.context || null,
    status: INTERACTION_STATUS.WAITING_FOR_PLAYER,
    createdAt: Date.now(),
    resolutionMetadata: null,

    // UI and Display Metadata
    title: data.title || '',
    description: data.description || '',
    options,
    sourceZone: data.sourceZone || data.context?.sourceZone || data.selector?.zone || data.from || null,
    targetSide: data.targetSide || data.selector?.side || data.side || null,
    constraints: selectionConstraints,
    validResponseFormat: {
      type: canonicalType,
      allowedFields: ['selected', 'option', 'accepted', 'declined', 'cancelled', 'payment', 'order', 'action']
    },
    resolvedAt: null,
    response: null
  };
}

/**
 * Validates player response against the interaction request, current state, and trusted authentication.
 */
export function validateInteractionResponse(interaction, response, state = null, authContext = null) {
  if (!interaction) {
    return { valid: false, reason: 'INTERACTION_NOT_FOUND' };
  }
  if (interaction.status !== INTERACTION_STATUS.WAITING_FOR_PLAYER && interaction.status !== INTERACTION_STATUS.VALIDATING_RESPONSE) {
    return { valid: false, reason: 'ALREADY_RESOLVED_OR_STALE', currentStatus: interaction.status };
  }
  if (!response || typeof response !== 'object') {
    return { valid: false, reason: 'INVALID_RESPONSE_FORMAT: Response must be an object' };
  }

  // Trusted Match Context Authentication
  if (state?.matchContext) {
    const authRes = state.matchContext.validateAuth(interaction.decisionOwner, authContext);
    if (!authRes.valid) {
      return { valid: false, reason: authRes.reason };
    }
  }

  // Direct authContext validation
  if (authContext && typeof authContext === 'object') {
    if (authContext.matchId && interaction.matchId && authContext.matchId !== interaction.matchId) {
      return {
        valid: false,
        reason: `MATCH_MISMATCH: Response match "${authContext.matchId}" does not match active interaction match "${interaction.matchId}"`
      };
    }
    const responder = authContext.responder || authContext.player || authContext.playerSide;
    if (responder && interaction.decisionOwner && responder !== interaction.decisionOwner) {
      return {
        valid: false,
        reason: `UNAUTHORIZED_RESPONDER: Responder "${responder}" is not authorized for decision owner "${interaction.decisionOwner}"`
      };
    }
    const claimedPlayer = response.player || response.responder;
    if (claimedPlayer && responder && claimedPlayer !== responder) {
      return {
        valid: false,
        reason: `IMPERSONATION_ATTEMPT_DETECTED: Claimed player "${claimedPlayer}" does not match authenticated responder "${responder}"`
      };
    }
  }

  // Player ownership validation (prevent Player A answering for Player B)
  const responder = response.player || response.responder || response.decisionOwner;
  if (responder && interaction.decisionOwner && responder !== interaction.decisionOwner) {
    return {
      valid: false,
      reason: `UNAUTHORIZED_DECISION_OWNER: Expected ${interaction.decisionOwner}, received ${responder}`
    };
  }

  // 1. Handle decline / cancellation
  if (response.declined === true || response.cancelled === true || response.accepted === false) {
    if (!interaction.optional) {
      return { valid: false, reason: 'CANNOT_CANCEL_MANDATORY_INTERACTION' };
    }
    return { valid: true, value: { accepted: false, declined: true, cancelled: true, selected: [] } };
  }

  // 2. Handle selection of candidates
  const selectedList = Array.isArray(response.selected)
    ? response.selected
    : (Array.isArray(response.candidates) ? response.candidates : (Array.isArray(response) ? response : null));

  if (selectedList !== null) {
    const selCount = selectedList.length;

    // Disallow selections from empty candidate pool
    if ((!interaction.candidates || interaction.candidates.length === 0) && selCount > 0) {
      return {
        valid: false,
        reason: 'ILLEGAL_CANDIDATE_SELECTED: Cannot select candidates from an empty candidate pool'
      };
    }

    if (selCount < interaction.minSelections) {
      return {
        valid: false,
        reason: `INSUFFICIENT_SELECTIONS: Expected at least ${interaction.minSelections}, received ${selCount}`
      };
    }
    if (selCount > interaction.maxSelections) {
      return {
        valid: false,
        reason: `EXCESS_SELECTIONS: Expected at most ${interaction.maxSelections}, received ${selCount}`
      };
    }

    // Disallow duplicate selections where prohibited
    if (!interaction.selectionConstraints?.allowDuplicates && selCount > 1) {
      const stringKeys = selectedList.map(item =>
        typeof item === 'string'
          ? item
          : (item?.candidateId || item?.cardId || item?.id || item?.stackId || JSON.stringify(item))
      );
      if (new Set(stringKeys).size !== stringKeys.length) {
        return {
          valid: false,
          reason: 'DUPLICATE_CANDIDATE_SELECTED: Selecting the same candidate multiple times is prohibited'
        };
      }
    }

    // Verify each selected item belongs to legal candidates pool
    if (interaction.candidates && interaction.candidates.length > 0) {
      const legalCandidateIds = new Set(interaction.candidates.map(c => c.candidateId));
      const legalCardIds = new Set(interaction.candidates.map(c => c.cardId).filter(Boolean));
      const legalStackIds = new Set(interaction.candidates.map(c => c.stackId).filter(Boolean));

      for (const item of selectedList) {
        const candId = typeof item === 'object' && item ? item.candidateId : null;
        const idToCheck = typeof item === 'string'
          ? item
          : (candId || item?.cardId || item?.id || item?.card?.id || item?.stack?.id || item?.stackId);

        const exactCand = candId
          ? interaction.candidates.find(c => c.candidateId === candId)
          : interaction.candidates.find(c =>
            c.candidateId === idToCheck || c.cardId === idToCheck || c.stackId === idToCheck || c.value === idToCheck
          );

        const isLegal = Boolean(exactCand) || legalCandidateIds.has(idToCheck) || legalCardIds.has(idToCheck) || legalStackIds.has(idToCheck);
        if (!isLegal) {
          return {
            valid: false,
            reason: `ILLEGAL_CANDIDATE_SELECTED: Item "${idToCheck}" is not among legal candidates`
          };
        }

        if (exactCand && item && typeof item === 'object') {
          if (item.zone && exactCand.zone && normalizeCardZone(item.zone) !== normalizeCardZone(exactCand.zone)) {
            return {
              valid: false,
              reason: `CANDIDATE_ZONE_MISMATCH: Selected item zone "${item.zone}" does not match candidate zone "${exactCand.zone}"`
            };
          }
          if (item.side && exactCand.side && item.side !== exactCand.side) {
            return {
              valid: false,
              reason: `CANDIDATE_SIDE_MISMATCH: Selected item side "${item.side}" does not match candidate side "${exactCand.side}"`
            };
          }
        }
      }
    }

    // Revalidate against current state (Part D3) across all canonical zones
    if (state && selectedList.length > 0) {
      for (const item of selectedList) {
        const candId = typeof item === 'object' && item ? item.candidateId : null;
        const idToCheck = typeof item === 'string'
          ? item
          : (candId || item?.cardId || item?.id || item?.card?.id || item?.stack?.id || item?.stackId);

        const origCand = candId
          ? (interaction.candidates || []).find(c => c.candidateId === candId)
          : (interaction.candidates || []).find(c =>
            c.candidateId === idToCheck || c.cardId === idToCheck || c.stackId === idToCheck || c.value === idToCheck
          );

        if (origCand && origCand.zone) {
          const expectedZone = normalizeCardZone(origCand.zone);
          const expectedSide = origCand.side || interaction.decisionOwner;
          if (state.players) {
            const targetObj = (origCand.raw && typeof origCand.raw === 'object')
              ? origCand.raw
              : {
                  id: origCand.cardId || origCand.stackId || origCand.candidateId,
                  cardId: origCand.cardId,
                  stackId: origCand.stackId,
                  zone: expectedZone,
                  side: expectedSide
                };
            const isStillValid = validateTargetAvailability(state, targetObj, expectedZone, expectedSide);
            if (!isStillValid) {
              return {
                valid: false,
                reason: `CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE: Target "${idToCheck}" is no longer in expected zone "${expectedZone}" on side "${expectedSide}"`
              };
            }
          } else {
            const playerState = state[expectedSide] || null;
            if (playerState && expectedZone === 'field') {
              const fieldUnits = playerState.field || [];
              const stillOnField = fieldUnits.some(u =>
                (u.id === idToCheck || u.uid === idToCheck || u.id === origCand.stackId || u.top?.id === idToCheck || u.card?.id === idToCheck)
              );
              if (!stillOnField) {
                return {
                  valid: false,
                  reason: `CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE: Target "${idToCheck}" is no longer in expected zone "field"`
                };
              }
            } else if (playerState && expectedZone === 'grave') {
              const trashCards = playerState.trashCards || playerState.grave || [];
              const stillInTrash = trashCards.some(c => (c.id === idToCheck || c.uid === idToCheck));
              if (!stillInTrash) {
                return {
                  valid: false,
                  reason: `CANDIDATE_NO_LONGER_VALID_IN_CURRENT_STATE: Target "${idToCheck}" is no longer in expected zone "${origCand.zone}"`
                };
              }
            }
          }
        }
      }
    }

    return { valid: true, value: { accepted: true, selected: selectedList } };
  }

  // 3. Handle simple boolean acceptance
  if (response.accepted === true && (!response.selected || response.selected.length === 0)) {
    if (!interaction.optional && interaction.candidates && interaction.candidates.length > 0 && interaction.minSelections > 0) {
      return { valid: false, reason: 'MANDATORY_SELECTION_REQUIRED: Candidate selection is mandatory for this interaction' };
    }
    return { valid: true, value: { accepted: true, declined: false, selected: [] } };
  }

  // 4. Handle option choices (e.g. CHOOSE_OPTION / CHOOSE_OR_BRANCH)
  if (response.option !== undefined || response.index !== undefined) {
    const optVal = response.option !== undefined ? response.option : interaction.options[response.index];
    if (interaction.options.length > 0) {
      const match = interaction.options.find(o => o === optVal || o?.id === optVal?.id || o?.label === optVal?.label);
      if (!match && !interaction.options.includes(optVal)) {
        return { valid: false, reason: 'INVALID_OPTION_CHOSEN' };
      }
    }
    return { valid: true, value: { accepted: true, option: optVal } };
  }

  // Fallback for custom objects with accepted: true
  return { valid: true, value: response };
}

export class InteractionSuspendedError extends Error {
  constructor(interaction) {
    super(`INTERACTION_SUSPENDED: ${interaction?.id || 'unknown'}`);
    this.name = 'InteractionSuspendedError';
    this.interaction = interaction;
    this.interactionId = interaction?.id || interaction?.interactionId || null;
  }
}

/**
 * Manages active and pending interaction requests within a game instance.
 */
export class InteractionController {
  constructor(state, events = null, options = {}) {
    this.state = state;
    this.events = events;
    this.options = options;
    this.suspendOnRequest = Boolean(options.suspendOnRequest);
    this.pendingResolvers = new Map(); // interactionId -> { resolve, reject }
    this.resolvedInteractions = new Map(); // interactionId -> response (replay protection)
    this.history = [];
    this.automatedProvider = options.automatedProvider || null;
    this.aiDecisionProvider = options.aiDecisionProvider || null;

    if (this.state && !Array.isArray(this.state.pendingInteractions)) {
      this.state.pendingInteractions = [];
    }
  }

  /**
   * Issues an interaction request, records it in state, and returns a Promise.
   */
  request(data) {
    const interaction = createInteractionRequest({
      ...data,
      matchId: data.matchId || this.state?.matchContext?.matchId || this.state?.matchId || 'local_match'
    });
    
    const owner = interaction.decisionOwner;
    const matchCtx = this.state?.matchContext;

    // Strict AI Isolation: Invoke AI decision provider ONLY if match context explicitly permits AI for this player
    if (matchCtx && matchCtx.canAiDecide(owner) && this.aiDecisionProvider && typeof this.aiDecisionProvider === 'function') {
      const aiResponse = this.aiDecisionProvider(interaction, this.state);
      if (aiResponse !== undefined && aiResponse !== null) {
        interaction.status = INTERACTION_STATUS.RESOLVED;
        interaction.resolvedAt = Date.now();
        interaction.response = aiResponse;
        this.history.push(interaction);
        return Promise.resolve(aiResponse);
      }
    }

    // Headless simulation provider: ONLY invoked if mode is explicitly HEADLESS_SIMULATION
    if ((!matchCtx || matchCtx.canSimulate(owner)) && this.automatedProvider && typeof this.automatedProvider === 'function') {
      // In HUMAN_VS_HUMAN mode, automatedProvider is strictly prohibited
      if (!matchCtx || matchCtx.mode !== 'HUMAN_VS_HUMAN') {
        const autoResponse = this.automatedProvider(interaction, this.state);
        if (autoResponse !== undefined && autoResponse !== null) {
          interaction.status = INTERACTION_STATUS.RESOLVED;
          interaction.resolvedAt = Date.now();
          interaction.response = autoResponse;
          this.history.push(interaction);
          return Promise.resolve(autoResponse);
        }
      }
    }

    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.pendingResolvers.set(interaction.id, {
      resolve: resolvePromise,
      reject: rejectPromise,
      interaction,
      isLegacyPrompt: Boolean(data.isLegacyPrompt),
      resolveLegacy: (rawResp) => {
        resolvePromise(rawResp);
      }
    });

    if (this.state) {
      if (!Array.isArray(this.state.pendingInteractions)) {
        this.state.pendingInteractions = [];
      }
      this.state.pendingInteractions.push(interaction);
      if (Array.isArray(this.state.pendingPrompts)) {
        this.state.pendingPrompts.push(interaction);
      }
    }

    if (this.events) {
      this.events.emit({
        type: 'INTERACTION_REQUESTED',
        interactionId: interaction.id,
        interaction
      });
    }

    if (this.suspendOnRequest && this._inResolverExecution && data.allowSuspend !== false) {
      throw new InteractionSuspendedError(interaction);
    }

    return promise;
  }

  /**
   * Responds to an interaction, validates the input, and resolves the pending Promise.
   */
  respond(interactionId, response, authContext = null) {
    if (this.resolvedInteractions.has(interactionId)) {
      return { success: false, reason: 'ALREADY_RESOLVED_OR_STALE', interactionId };
    }

    const pending = this.pendingResolvers.get(interactionId);
    let interaction = pending ? pending.interaction : null;

    if (!interaction && this.state?.pendingInteractions) {
      interaction = this.state.pendingInteractions.find(i => i.id === interactionId);
    }

    if (!interaction) {
      return { success: false, reason: 'INTERACTION_NOT_FOUND', interactionId };
    }

    // Lifecycle state guard
    if (interaction.status !== INTERACTION_STATUS.WAITING_FOR_PLAYER) {
      return { success: false, reason: 'ALREADY_RESOLVED_OR_STALE', interactionId, currentStatus: interaction.status };
    }

    // Atomic validation state transition
    interaction.status = INTERACTION_STATUS.VALIDATING_RESPONSE;

    const validation = validateInteractionResponse(interaction, response, this.state, authContext);
    if (!validation.valid) {
      interaction.status = INTERACTION_STATUS.WAITING_FOR_PLAYER;
      return {
        success: false,
        reason: validation.reason,
        interactionId,
        currentStatus: interaction.status
      };
    }

    // Transition to RESOLVING
    interaction.status = INTERACTION_STATUS.RESOLVING;

    // Final status based on response intent
    const finalStatus = (validation.value.declined || validation.value.cancelled)
      ? INTERACTION_STATUS.DECLINED
      : INTERACTION_STATUS.RESOLVED;

    interaction.status = finalStatus;
    interaction.resolvedAt = Date.now();
    interaction.response = validation.value;

    this.history.push(interaction);
    this.resolvedInteractions.set(interactionId, validation.value);
    this.pendingResolvers.delete(interactionId);

    // Remove from state pending lists
    if (this.state?.pendingInteractions) {
      const idx = this.state.pendingInteractions.findIndex(i => i.id === interactionId);
      if (idx !== -1) this.state.pendingInteractions.splice(idx, 1);
    }
    if (this.state?.pendingPrompts) {
      const idx = this.state.pendingPrompts.findIndex(i => i.id === interactionId);
      if (idx !== -1) this.state.pendingPrompts.splice(idx, 1);
    }

    if (this.events) {
      const p = this.events.emit({
        type: 'INTERACTION_RESOLVED',
        interactionId,
        status: finalStatus,
        response: validation.value
      });
      if (p && typeof p.catch === 'function') {
        p.catch(err => console.error('[InteractionController] Event dispatch error:', err));
      }
    }

    if (pending) {
      if (pending.isLegacyPrompt && typeof pending.resolveLegacy === 'function') {
        pending.resolveLegacy(response);
      } else {
        pending.resolve(validation.value);
      }
    }

    return { success: true, interactionId, response: validation.value, status: finalStatus };
  }

  /**
   * Cancels a pending interaction if permitted.
   */
  cancel(interactionId, reason = 'CANCELLED_BY_PLAYER') {
    const pending = this.pendingResolvers.get(interactionId);
    if (!pending) return { success: false, reason: 'INTERACTION_NOT_FOUND' };

    const interaction = pending.interaction;
    if (!interaction.optional) {
      return { success: false, reason: 'CANNOT_CANCEL_MANDATORY_INTERACTION' };
    }

    interaction.status = INTERACTION_STATUS.CANCELLED;
    interaction.resolvedAt = Date.now();
    this.pendingResolvers.delete(interactionId);

    if (this.state?.pendingInteractions) {
      const idx = this.state.pendingInteractions.findIndex(i => i.id === interactionId);
      if (idx !== -1) this.state.pendingInteractions.splice(idx, 1);
    }

    pending.resolve({ accepted: false, cancelled: true, reason });
    return { success: true, interactionId, cancelled: true };
  }

  clear() {
    for (const [id, pending] of this.pendingResolvers.entries()) {
      pending.interaction.status = INTERACTION_STATUS.CANCELLED;
      pending.reject(new Error('Interaction cancelled due to reset'));
    }
    this.pendingResolvers.clear();
    this.history = [];
    if (this.state) {
      this.state.pendingInteractions = [];
      this.state.pendingPrompts = [];
    }
  }

  getActiveInteraction(playerSide = null) {
    const list = this.getPendingInteractions(playerSide);
    return list.length > 0 ? list[0] : null;
  }

  getPendingInteractions(playerSide = null) {
    let list;
    if (this.state?.pendingInteractions) {
      list = this.state.pendingInteractions;
    } else {
      list = Array.from(this.pendingResolvers.values()).map(p => p.interaction);
    }
    if (!playerSide) return [...list];
    return list.filter(i => i.player === playerSide || i.chooser === playerSide);
  }

  /**
   * Adapter interface for AsyncResolver (matches promptResolver.choose).
   */
  async choose(prompt) {
    const res = await this.request(prompt);
    if (res && typeof res === 'object' && Array.isArray(res.selected)) {
      return res.selected;
    }
    if (res && typeof res === 'object' && res.option !== undefined) {
      return res.option;
    }
    return res;
  }
}
