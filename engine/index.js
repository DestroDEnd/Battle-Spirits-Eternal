/**
 * engine/index.js
 * 
 * Battle Spirits Eternal Game Engine Core Facade.
 * Connects state, zones, events, continuous layer, payment, ops, and flow.
 */

import { ETERNAL_RULES, validateDeck, computeDeckAttestationDigest } from './rules/eternal.js';
export { validateDeck };
import { createGameState, createCardInstance, createFieldStack, validateGameState, createEmptyTurnHistory } from './state.js';
import { EventBus } from './events.js';
import { FlowController } from './flow.js';
import { AsyncResolver, DefaultPromptResolver } from './resolver.js';
import { moveCard, moveCore } from './zones.js';
import { calculateEffectiveCost, canAffordCost, buildPaymentPlan, payCost, payGodCores } from './payment.js';
import { computeLevel, computeEffectiveBP, computeSymbols, canAttack, canBlock, pruneExpiredModifiers, isActionRestricted, getActiveStackKeywords } from './continuous.js';
import { checkStateBasedActions, stabilizeGameState } from './sba.js';
import { createDefaultKeywordRegistry } from './keywords/index.js';
import { TimingWindowManager, RESPONSE_WINDOW_TYPES, RESPONSE_WINDOW_STATUS } from './windows.js';
import { authorizeAction } from './action_authority.js';
import { classifyCardType, validateCardPathway, ACTION_PATHWAYS } from './card_types.js';
export { classifyCardType, validateCardPathway, ACTION_PATHWAYS };
import { TriggerQueueManager } from './triggers.js';
import { PromptManager } from './prompt_manager.js';
import { InteractionController, INTERACTION_TYPES, INTERACTION_STATUS } from './interaction.js';
import { EXECUTION_MODES, PLAYER_CONTROL_TYPES, MatchContext, createMatchContext } from './session_mode.js';
export { InteractionController, INTERACTION_TYPES, INTERACTION_STATUS, PromptManager, EXECUTION_MODES, PLAYER_CONTROL_TYPES, MatchContext, createMatchContext };
import { matchesCardFilter } from './ops/index.js';
import { evaluateRestriction, reserveRestriction, releaseReservation, RESTRICTION_STATUS, resetRestrictions, restoreRestrictionState } from './restrictions.js';
import {
  validateFlashTiming,
  classifyFlashTiming,
  FLASH_TIMING_QUALIFIERS,
  FLASH_AVAILABILITY,
  isGenericFlash,
  isFlashAllowedInMainStep,
  isFlashAllowedInAttackStep
} from './flash_timing.js';
export {
  validateFlashTiming,
  classifyFlashTiming,
  FLASH_TIMING_QUALIFIERS,
  FLASH_AVAILABILITY,
  isGenericFlash,
  isFlashAllowedInMainStep,
  isFlashAllowedInAttackStep
};
import {
  evaluateBraveCondition,
  evaluateSummonCondition,
  parseSuAdconCondition,
  parseAdventDeclaration,
  evaluateAdventCondition,
  evaluateAbilityPrefixPrerequisites,
  parseMirageDeclaration,
  setMirageFromHand,
  getActiveMirageAbilities,
  parseReleaseDeclaration,
  executeReleaseRuntime,
  hasTeam,
  extractCardTeams
} from './prerequisites.js';
export {
  evaluateBraveCondition,
  evaluateSummonCondition,
  parseSuAdconCondition,
  parseAdventDeclaration,
  evaluateAdventCondition,
  evaluateAbilityPrefixPrerequisites,
  parseMirageDeclaration,
  setMirageFromHand,
  getActiveMirageAbilities,
  parseReleaseDeclaration,
  executeReleaseRuntime,
  hasTeam,
  extractCardTeams
};

export async function endBattle(state, events = null) {
  const resetRes = resetRestrictions(state, 'BATTLE');
  if (resetRes && !resetRes.success) {
    return resetRes;
  }

  pruneExpiredModifiers(state, 'BATTLE');
  if (state) {
    state.combat = null;
    state.battle = null;
  }

  if (events) {
    await events.emit({ type: 'BATTLE_ENDED' });
  }

  return resetRes || { success: true };
}

export async function endAttack(state, events = null) {
  const resetRes = resetRestrictions(state, 'ATTACK');
  if (resetRes && !resetRes.success) {
    return resetRes;
  }

  pruneExpiredModifiers(state, 'ATTACK');

  if (events) {
    await events.emit({ type: 'ATTACK_ENDED' });
  }

  return resetRes || { success: true };
}

async function pruneBattleModifiers(state) {
  return await endBattle(state, null);
}

function isValidDeckAttestationEntry(entry) {
  return Boolean(
    entry &&
    typeof entry === 'object' &&
    entry.valid === true &&
    Number.isInteger(entry.deckSize) &&
    entry.deckSize >= ETERNAL_RULES.deck.minSize &&
    typeof entry.digest === 'string' &&
    /^[0-9a-f]{64}$/.test(entry.digest)
  );
}

export function createGame(options = {}) {
  let newGameDeckValidation = null;

  if (options.strictRules && !options.state && !options.unsafeTestBypassDeckValidation) {
    const pDeck = options.playerDeck || [];
    const oDeck = options.opponentDeck || [];
    const pDeckRes = validateDeck(pDeck);
    if (!pDeckRes.valid) {
      const err = new Error(`INVALID_DECK (player): ${pDeckRes.errors.join('; ')}`);
      err.code = 'INVALID_DECK';
      err.side = 'player';
      err.errors = pDeckRes.errors;
      throw err;
    }
    const oDeckRes = validateDeck(oDeck);
    if (!oDeckRes.valid) {
      const err = new Error(`INVALID_DECK (opponent): ${oDeckRes.errors.join('; ')}`);
      err.code = 'INVALID_DECK';
      err.side = 'opponent';
      err.errors = oDeckRes.errors;
      throw err;
    }
    newGameDeckValidation = {
      strictRules: true,
      bypassed: false,
      formatVersion: ETERNAL_RULES.formatVersion,
      player: { valid: true, deckSize: pDeck.length, digest: computeDeckAttestationDigest(pDeck) },
      opponent: { valid: true, deckSize: oDeck.length, digest: computeDeckAttestationDigest(oDeck) }
    };
  } else if (options.strictRules && !options.state && options.unsafeTestBypassDeckValidation) {
    newGameDeckValidation = {
      strictRules: true,
      bypassed: true,
      formatVersion: ETERNAL_RULES.formatVersion
    };
  }

  const playerDeckCards = (options.playerDeck || []).map(c => createCardInstance(c, 'player'));
  const opponentDeckCards = (options.opponentDeck || []).map(c => createCardInstance(c, 'opponent'));
  const firstPlayer = options.firstPlayer || 'player';

  let state = options.state;
  if (state) {
    if (options.strictRules && !options.unsafeTestBypassDeckValidation) {
      if (options.originalDecks) {
        const pOrig = options.originalDecks.player || [];
        const oOrig = options.originalDecks.opponent || [];
        const pRes = validateDeck(pOrig);
        if (!pRes.valid) {
          const err = new Error(`INVALID_RESTORED_ORIGINAL_DECK (player): ${pRes.errors.join('; ')}`);
          err.code = 'INVALID_DECK';
          err.side = 'player';
          err.errors = pRes.errors;
          throw err;
        }
        const oRes = validateDeck(oOrig);
        if (!oRes.valid) {
          const err = new Error(`INVALID_RESTORED_ORIGINAL_DECK (opponent): ${oRes.errors.join('; ')}`);
          err.code = 'INVALID_DECK';
          err.side = 'opponent';
          err.errors = oRes.errors;
          throw err;
        }
        if (state.deckValidation) {
          const pDigest = computeDeckAttestationDigest(pOrig);
          const oDigest = computeDeckAttestationDigest(oOrig);
          if (
            state.deckValidation.bypassed === true ||
            state.deckValidation.player?.digest !== pDigest ||
            state.deckValidation.opponent?.digest !== oDigest
          ) {
            const err = new Error('INVALID_RESTORED_DECK_ATTESTATION: Original decks do not match state attestation');
            err.code = 'INVALID_RESTORED_DECK_ATTESTATION';
            throw err;
          }
        }
      } else {
        const dv = state.deckValidation;
        if (
          !dv ||
          typeof dv !== 'object' ||
          dv.strictRules !== true ||
          dv.bypassed !== false ||
          !isValidDeckAttestationEntry(dv.player) ||
          !isValidDeckAttestationEntry(dv.opponent)
        ) {
          const err = new Error('INVALID_RESTORED_DECK_ATTESTATION: Strict-rules restoration requires originalDecks or valid non-bypassed deckValidation attestation');
          err.code = 'INVALID_RESTORED_DECK_ATTESTATION';
          throw err;
        }
      }
    }

    // Phase 4C.3.2.4.2.1: Enforce restoration policy (Option B: Invalidate transient reservations)
    // Validates restriction state integrity and clears transient in-flight reservations
    const restoreRes = restoreRestrictionState(state);
    if (!restoreRes.success) {
      throw new Error(`INVALID_RESTRICTION_STATE: ${restoreRes.reason || restoreRes.error}`);
    }
  } else {
    state = createGameState(playerDeckCards, opponentDeckCards, firstPlayer, options);
    if (newGameDeckValidation) {
      state.deckValidation = newGameDeckValidation;
    }
  }
  if (options.strictRules !== undefined) {
    state.strictRules = Boolean(options.strictRules);
  }
  const events = new EventBus();
  if (!state.turnHistory) {
    state.turnHistory = createEmptyTurnHistory();
  }
  const ensureHist = (side) => {
    if (!state.turnHistory) state.turnHistory = createEmptyTurnHistory();
    if (!state.turnHistory[side]) state.turnHistory[side] = createEmptyTurnHistory().player;
    return state.turnHistory[side];
  };
  events.on('LIFE_REDUCED', (ev) => {
    const s = ev?.player || ev?.side;
    if (s === 'player' || s === 'opponent') ensureHist(s).lifeReduced += (ev.amount || 1);
  });
  events.on('ATTACK_DECLARED', (ev) => {
    const s = ev?.player || ev?.attackerSide;
    if (s === 'player' || s === 'opponent') ensureHist(s).attacksDeclared += 1;
  });
  events.on('ADVENTS', (ev) => {
    const s = ev?.player;
    if (s === 'player' || s === 'opponent') ensureHist(s).adventsPerformed += 1;
  });
  events.on('BURST_ACTIVATED', (ev) => {
    const s = ev?.player;
    if (s === 'player' || s === 'opponent') {
      ensureHist(s).burstsActivated.push(ev?.mechanic || ev?.cause || 'NORMAL');
    }
  });
  events.on('SUMMONED', (ev) => {
    const s = ev?.player;
    if ((s === 'player' || s === 'opponent') && ev?.cause) {
      ensureHist(s).summonedMechanics.push(String(ev.cause));
    }
  });
  events.on('CORE_MOVED', (ev) => {
    const s = ev?.from?.side || ev?.to?.side || ev?.by;
    if ((s === 'player' || s === 'opponent') && ev?.isSoulCore) {
      const h = ensureHist(s);
      h.soulCoreUsed += 1;
      if (ev?.to?.zone === 'removed' || ev?.to?.zone === 'void') {
        h.soulCoreBanished += 1;
      }
    }
  });
  const flow = new FlowController(state, events);
  const interactionController = options.interactionController || new InteractionController(state, events, {
    automatedProvider: options.automatedProvider || null,
    suspendOnRequest: Boolean(options.suspendOnInteraction)
  });
  if (interactionController && !interactionController.events) {
    interactionController.events = events;
    interactionController.state = state;
  }
  const promptManager = options.promptManager || new PromptManager(state, events, interactionController);
  if (promptManager) {
    promptManager.events = events;
    promptManager.state = state;
    if (!promptManager.controller) {
      promptManager.controller = interactionController;
    } else {
      promptManager.controller.state = state;
      promptManager.controller.events = events;
    }
  }
  const defaultFallback = new DefaultPromptResolver({
    allowSimulation: !state.matchContext || state.matchContext.mode === EXECUTION_MODES.HEADLESS_SIMULATION
  });

  // Route decisions strictly by MatchContext ownership (Human UI vs AI Decider vs Headless Simulation)
  const resolverDelegate = options.promptResolver || {
    getController: () => interactionController,
    choose: async (prompt) => {
      const chooser = prompt.decisionOwner || prompt.chooser || prompt.player || 'player';
      const matchCtx = state.matchContext;
      const enrichedPrompt = {
        ...prompt,
        decisionOwner: chooser,
        executionMode: matchCtx ? matchCtx.mode : (prompt.executionMode || null),
        controlType: matchCtx ? (matchCtx.players?.[chooser]?.controlType || null) : (prompt.controlType || null)
      };

      if (matchCtx && matchCtx.canAiDecide(chooser)) {
        if (options.ai && options.ai.side === chooser) {
          const aiDecision = await options.ai.decide(enrichedPrompt, state);
          if (aiDecision !== null && aiDecision !== undefined) return aiDecision;
        }
        if (options.aiProviders && options.aiProviders[chooser]) {
          const aiDecision = await options.aiProviders[chooser].decide(enrichedPrompt, state);
          if (aiDecision !== null && aiDecision !== undefined) return aiDecision;
        }
        if (!matchCtx.canSimulate(chooser)) {
          const err = new Error(`AI_DECISION_UNAVAILABLE: No AI decider available for "${chooser}" in mode "${matchCtx.mode}"`);
          err.code = 'AI_DECISION_UNAVAILABLE';
          throw err;
        }
      } else if (!matchCtx && options.ai && options.ai.side && chooser === options.ai.side) {
        const aiDecision = await options.ai.decide(enrichedPrompt, state);
        if (aiDecision !== null && aiDecision !== undefined) return aiDecision;
      }

      if (options.usePromptManager) {
        return await promptManager.request(enrichedPrompt);
      }

      const hasInteractionListener = Boolean(
        interactionController.events?.listeners?.get('INTERACTION_REQUESTED')?.length > 0
      );
      const isHumanRoutable = Boolean(
        options.interactive ||
        options.automatedProvider ||
        interactionController.suspendOnRequest ||
        hasInteractionListener
      );

      if (matchCtx && matchCtx.isHuman(chooser)) {
        if (!isHumanRoutable) {
          const err = new Error(`HUMAN_INTERACTION_UNROUTABLE: Human-owned decision for "${chooser}" cannot be routed without an interactive controller, listener, or suspend handler`);
          err.code = 'HUMAN_INTERACTION_UNROUTABLE';
          throw err;
        }
        return await interactionController.request(enrichedPrompt);
      }

      if (options.interactive || options.automatedProvider) {
        return await interactionController.request(enrichedPrompt);
      }

      if (!matchCtx || matchCtx.canSimulate(chooser)) {
        return await defaultFallback.choose(enrichedPrompt);
      }

      const err = new Error(`HUMAN_INTERACTION_UNROUTABLE: Unroutable decision for "${chooser}" in mode "${matchCtx.mode}"`);
      err.code = 'HUMAN_INTERACTION_UNROUTABLE';
      throw err;
    }
  };

  const resolver = new AsyncResolver(resolverDelegate);
  const keywords = options.keywordRegistry || createDefaultKeywordRegistry();

  // Initial draw: 4 cards each with Contract Partner guarantee (Rule 3.5 & R39)
  // Skipped when restoring a previously saved game state via options.state
  if (!options.state) {
    for (const s of ['player', 'opponent']) {
      const p = state.players[s];
      if (ETERNAL_RULES.setup.guaranteedContractPartner) {
        const partnerIdx = p.deck.findIndex(c => c.isContractPartner);
        if (partnerIdx !== -1) {
          p.hand.push(p.deck.splice(partnerIdx, 1)[0]);
        }
      }
      while (p.hand.length < ETERNAL_RULES.setup.initialHandSize && p.deck.length > 0) {
        p.hand.push(p.deck.shift());
      }
    }
  }

  const game = {
    get state() {
      return state;
    },
    set state(newState) {
      state = newState;
      if (flow) flow.state = newState;
      if (interactionController) interactionController.state = newState;
      if (promptManager) promptManager.state = newState;
    },
    events,
    flow,
    resolver,
    keywords,
    interactionController,
    promptManager: options.promptManager || promptManager,

    async submitInteractionResponse(interactionId, response) {
      if (options.usePromptManager) {
        const res = promptManager.resolve(interactionId, response);
        return { success: Boolean(res), interactionId };
      }
      return await interactionController.respond(interactionId, response);
    },

    getPendingInteractions(playerSide = null) {
      return interactionController.getPendingInteractions(playerSide);
    },

    getActiveInteraction(playerSide = null) {
      return interactionController.getActiveInteraction(playerSide);
    },

    async advanceStep() {
      return await flow.advanceStep();
    },

    async nextStep() {
      return await flow.advanceStep();
    },

    async playCard(cardId, payment = [], playerSide = 'player', options = {}) {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };
      let card = (p.hand || []).find(c => c.id === cardId || c.cardNumber === cardId);
      let fromZone = 'hand';
      if (!card) {
        const removedCard = (p.removed || []).find(c => c.id === cardId || c.cardNumber === cardId) ||
                            (p.openCards || []).find(c => c.id === cardId || c.cardNumber === cardId);
        if (removedCard) {
          const canSummonRemoved = Boolean(
            removedCard.fromAccel ||
            removedCard.isAccelRemoved ||
            removedCard.canSummonFromRemoved ||
            (removedCard.compiledIr?.abilities || []).some(a => /accel/i.test(String(a.header?.keyword || '')) || (a.header?.prefixes || []).some(pr => /accel/i.test(String(pr)))) ||
            /\[accel/i.test(removedCard.effect || '') ||
            options.fromZone === 'removed'
          );
          if (canSummonRemoved) {
            card = removedCard;
            fromZone = 'removed';
          }
        }
      }
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      const cardClass = classifyCardType(card);
      if (cardClass.category === 'UNKNOWN') {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Unknown card type "${card.type}"` };
      }
      if (options.pathway) {
        const pathwayCheck = validateCardPathway(card, options.pathway);
        if (!pathwayCheck.allowed) {
          return { success: false, reason: pathwayCheck.reason, code: pathwayCheck.code, details: pathwayCheck.details };
        }
      }
      if (options.braveTargetStackId && !cardClass.isBrave) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot Brave non-Brave card of type "${card.type}"` };
      }
      if (options.cores !== undefined && !cardClass.isUnit) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot summon/place cores on non-unit card of type "${card.type}"` };
      }

      const hasFlashCard = Boolean(
        (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
        (card.effect && /\[Flash\]|Flash/i.test(card.effect)) ||
        options.timing === 'FLASH'
      );
      const auth = authorizeAction(this, playerSide, 'PLAY_CARD', { card, isFlash: hasFlashCard, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      const strict = Boolean(state.strictRules || options.strictRules);
      if (strict) {
        if (state.step === 'MAIN') {
          if (playerSide !== state.activePlayer) {
            return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
          }
        } else if (state.step === 'ATTACK') {
          const hasFlash = Boolean(
            (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
            (card.effect && card.effect.includes('Flash'))
          );
          if (!hasFlash) {
            return { success: false, reason: 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP' };
          }
        } else {
          return { success: false, reason: 'INVALID_TIMING_FOR_CARD_PLAY' };
        }
      }

      if (fromZone === 'removed') {
        if (state.step === 'MAIN') {
          if (playerSide !== state.activePlayer) {
            return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
          }
        } else if (state.step === 'ATTACK') {
          const hasFlash = Boolean(
            (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
            (card.effect && card.effect.includes('Flash'))
          );
          if (!hasFlash) {
            return { success: false, reason: 'CANNOT_SUMMON_DURING_ATTACK_STEP' };
          }
        } else if (state.step) {
          if (!options.bypassTiming) {
            return { success: false, reason: 'INVALID_TIMING_FOR_CARD_PLAY' };
          }
        }
      }

      if (cardClass.isMagic) {
        const hasMain = Boolean(
          (card.compiledIr?.abilities || []).some(a => a.header?.isMain || ['MAIN', 'MAIN_STEP'].includes(String(a.header?.timing || '').toUpperCase())) ||
          /(?:^|\s|\b)Main(?:\s*-\s*|:|\s*\()/i.test(card.effect || '')
        );
        const hasFlash = Boolean(
          (card.compiledIr?.abilities || []).some(a => a.header?.isFlash || ['FLASH', 'ATTACK_STEP', 'FLASH_TIMING'].includes(String(a.header?.timing || '').toUpperCase())) ||
          /(?:^|\s|\b)Flash(?:\s*-\s*|:|\s*\()/i.test(card.effect || '') ||
          (card.effect && card.effect.includes('Flash'))
        );

        const isVanillaMagic = !hasMain && !hasFlash;

        if (state.step === 'ATTACK' || options.timing === 'FLASH' || (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive())) {
          if (!hasFlash && hasMain) {
            return { success: false, reason: 'CANNOT_PLAY_NON_FLASH_IN_ATTACK_STEP' };
          }
          if (hasFlash || isVanillaMagic) {
            const timingRes = validateFlashTiming(card, state, playerSide, options);
            if (!timingRes.allowed) {
              return { success: false, reason: timingRes.reason, code: timingRes.code };
            }
          }
        } else if (state.step === 'MAIN') {
          if (playerSide !== state.activePlayer) {
            return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
          }
          // In Main Step, controller can play Main effect or generic Flash effect (Phase M.3.1)
          const targetTiming = (options.timing || '').toUpperCase() || ((hasMain || isVanillaMagic) ? 'MAIN' : 'FLASH');
          if (targetTiming === 'FLASH') {
            if (!hasFlash && !isVanillaMagic) {
              return { success: false, reason: 'CARD_HAS_NO_FLASH_EFFECT' };
            }
            const timingRes = validateFlashTiming(card, state, playerSide, options);
            if (!timingRes.allowed) {
              return { success: false, reason: timingRes.reason, code: timingRes.code };
            }
          } else if (targetTiming === 'MAIN') {
            if (!hasMain && !isVanillaMagic) {
              return { success: false, reason: 'CARD_HAS_NO_MAIN_EFFECT' };
            }
          }
        } else if (state.step) {
          if (!options.bypassTiming) {
            return { success: false, reason: 'INVALID_TIMING_FOR_CARD_PLAY' };
          }
        }
      }

      if (isActionRestricted(state, 'RESTRICT_MAIN_STEP', playerSide, card, { cardType: card.type, timingWindow: state.step }) && state.step === 'MAIN') {
        return { success: false, reason: 'RESTRICTED_IN_MAIN_STEP' };
      }
      if (state.step === 'MAIN' && (card.compiledIr?.abilities || []).some(a => (a.clauses || []).some(c => c.op?.op === 'RESTRICT_MAIN_STEP'))) {
        return { success: false, reason: 'RESTRICTED_IN_MAIN_STEP' };
      }

      // Mirage set path (K.1.4 / K.1.5)
      if (options.setAsMirage) {
        return await setMirageFromHand(state, playerSide, card, { payment, ignoreOncePerTurn: options.ignoreOncePerTurn }, events);
      }

      // Check centralized SET_RESTRICTION / restriction modifiers
      if (cardClass.isUnit &&
          isActionRestricted(state, 'CANNOT_SUMMON', playerSide, card, { cardType: card.type, fromZone: 'hand', isCost: false })) {
        return { success: false, reason: 'SUMMON_RESTRICTED' };
      }
      if (cardClass.isUnit) {
        const summonCond = evaluateSummonCondition(state, card, playerSide);
        if (!summonCond.allowed) {
          return { success: false, reason: 'SUMMON_CONDITION_NOT_MET', details: summonCond.reason };
        }
        if (cardClass.isBrave && options.braveTargetStackId) {
          const preTargetStack = p.field.find(st => st.id === options.braveTargetStackId) ||
            ['player', 'opponent'].flatMap(s => state.players[s]?.field || []).find(st => st.id === options.braveTargetStackId);
          if (!preTargetStack) {
            return { success: false, reason: 'BRAVE_TARGET_NOT_FOUND' };
          }
          const braveCheck = evaluateBraveCondition(state, card, preTargetStack, playerSide, options);
          if (!braveCheck.allowed) {
            return { success: false, reason: 'BRAVE_CONDITION_NOT_MET', details: braveCheck.reason };
          }
        }
      }
      if (cardClass.isMagic && (
          isActionRestricted(state, 'CANNOT_USE_MAGIC', playerSide, card, { cardType: 'Magic', fromZone: 'hand', timingWindow: state.step }) ||
          (state.step === 'ATTACK' && isActionRestricted(state, 'PREVENT_FLASH_HAND', playerSide, card, { cardType: 'Magic', fromZone: 'hand', timingWindow: 'FLASH' }))
      )) {
        return { success: false, reason: 'MAGIC_RESTRICTED' };
      }
      if (cardClass.isNexus &&
          isActionRestricted(state, 'CANNOT_DEPLOY_NEXUS', playerSide, card, { cardType: card.type, fromZone: 'hand' })) {
        return { success: false, reason: 'NEXUS_RESTRICTED' };
      }

      // Timing check: During Attack Step, cannot summon spirits without Flash ability (R27)
      if (state.step === 'ATTACK' && cardClass.isUnit) {
        const hasFlash = card.compiledIr && card.compiledIr.abilities && card.compiledIr.abilities.some(a => a.header.isFlash);
        if (!hasFlash && (!card.effect || !card.effect.includes('Flash'))) {
          return { success: false, reason: 'CANNOT_SUMMON_DURING_ATTACK_STEP' };
        }
      }

      const cost = calculateEffectiveCost(state, card, playerSide);
      if (!canAffordCost(state, cost, playerSide)) {
        return { success: false, reason: 'INSUFFICIENT_CORES' };
      }

      // Auto-populate atomic payment plan if not explicitly provided
      const actualPayment = (Array.isArray(payment) && payment.length > 0)
        ? payment
        : buildPaymentPlan(state, cost, playerSide);

      if (!actualPayment) {
        return { success: false, reason: 'INSUFFICIENT_CORES' };
      }

      const payRes = await payCost(
        state,
        cost,
        actualPayment,
        playerSide,
        events,
        options.transactionId ? { transactionId: options.transactionId } : {}
      );
      if (!payRes.success) return { success: false, reason: payRes.reason || 'PAYMENT_FAILED' };

      const abilityResults = [];

      if (cardClass.isUnit) {
        // Check if Brave is being braved directly onto an existing Spirit
        if (cardClass.isBrave && options.braveTargetStackId) {
          const targetStack = p.field.find(st => st.id === options.braveTargetStackId);
          if (targetStack) {
            const braveCheck = evaluateBraveCondition(state, card, targetStack, playerSide, options);
            if (!braveCheck.allowed) {
              return { success: false, reason: 'BRAVE_CONDITION_NOT_MET', details: braveCheck.reason };
            }
            targetStack.braves.push(card);
            if (fromZone === 'hand') {
              p.hand = p.hand.filter(c => c.id !== card.id);
            } else if (fromZone === 'removed') {
              p.removed = (p.removed || []).filter(c => c.id !== card.id);
              if (p.openCards) p.openCards = p.openCards.filter(c => c.id !== card.id);
            }
            card.isAccelRemoved = false;
            await events.emit({
              type: 'SUMMONED',
              card,
              stack: targetStack,
              player: playerSide,
              cause: 'summon_brave',
              fromZone,
              skipCardTriggers: true
            });
          } else {
            // Fallback to Spirit Form if target stack not found
            options.braveTargetStackId = null;
          }
        }

        if (!cardClass.isBrave || !options.braveTargetStackId) {
          // Place on field with 1 core from reserve to satisfy LV1
          let lv1Normal = 1;
          let lv1Soul = 0;

          if (p.reserve.normal >= 1) {
            p.reserve.normal -= 1;
          } else if (p.reserve.soul >= 1) {
            p.reserve.soul -= 1;
            lv1Normal = 0;
            lv1Soul = 1;
          } else {
            // Cannot place LV1 core -> depletion check
            lv1Normal = 0;
            lv1Soul = 0;
          }

          let extraNormal = 0;
          let extraSoul = 0;
          if (typeof options.cores === 'number' && options.cores > 1) {
            const requestedExtra = options.cores - (lv1Normal + lv1Soul);
            if (requestedExtra > 0) {
              const totalAvailable = (p.reserve.normal || 0) + (p.reserve.soul || 0);
              if (totalAvailable < requestedExtra) {
                // Cannot afford requested cores! Rollback the lv1 core back to reserve
                if (lv1Normal > 0) p.reserve.normal += lv1Normal;
                if (lv1Soul > 0) p.reserve.soul += lv1Soul;
                return { success: false, reason: 'INSUFFICIENT_CORES', code: 'INSUFFICIENT_CORES' };
              }
              const normalToTake = Math.min(requestedExtra, p.reserve.normal || 0);
              p.reserve.normal -= normalToTake;
              extraNormal = normalToTake;
              const soulNeeded = requestedExtra - normalToTake;
              if (soulNeeded > 0) {
                p.reserve.soul -= soulNeeded;
                extraSoul = soulNeeded;
              }
            }
          }

          const stack = createFieldStack(card, { normal: lv1Normal + extraNormal, soul: lv1Soul + extraSoul });
          p.field.push(stack);
          if (fromZone === 'hand') {
            p.hand = p.hand.filter(c => c.id !== card.id);
          } else if (fromZone === 'removed') {
            p.removed = (p.removed || []).filter(c => c.id !== card.id);
            if (p.openCards) p.openCards = p.openCards.filter(c => c.id !== card.id);
          }
          card.isAccelRemoved = false;

          await events.emit({
            type: 'SUMMONED',
            card,
            stack,
            player: playerSide,
            cause: 'summon',
            fromZone,
            skipCardTriggers: true
          });

          // Trigger (When Summoned) abilities if compiled IR exists
          if (card.compiledIr && card.compiledIr.abilities) {
            const currentLevel = computeLevel(stack, state);
            for (const ab of card.compiledIr.abilities) {
              if (ab.header.timing === 'WHEN_SUMMONED' || ab.header.timing === 'WHEN_SUMMONED_OR_DESTROYED') {
                if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
                  const abRes = await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card, sourceStack: stack }, events);
                  abilityResults.push(abRes);
                }
              }
            }
          }
        }
      } else if (cardClass.isNexus) {
        const nexusStack = createFieldStack(card, { normal: 0, soul: 0 });
        p.field.push(nexusStack);
        if (fromZone === 'hand') {
          p.hand = p.hand.filter(c => c.id !== card.id);
        } else if (fromZone === 'removed') {
          p.removed = (p.removed || []).filter(c => c.id !== card.id);
          if (p.openCards) p.openCards = p.openCards.filter(c => c.id !== card.id);
        }
        card.isAccelRemoved = false;
        await events.emit({ type: 'DEPLOYED', card, stack: nexusStack, player: playerSide, cause: 'deploy', fromZone });
      } else if (cardClass.isMagic) {
        // Magic card resolution: move to resolvingCards during resolution so it cannot be double-cast
        if (fromZone === 'hand') {
          p.hand = p.hand.filter(c => c.id !== card.id);
        } else if (fromZone === 'removed') {
          p.removed = (p.removed || []).filter(c => c.id !== card.id);
          if (p.openCards) p.openCards = p.openCards.filter(c => c.id !== card.id);
        }
        card.isAccelRemoved = false;
        if (!Array.isArray(state.resolvingCards)) state.resolvingCards = [];
        state.resolvingCards.push(card);

        const finalizeMagicDestination = async () => {
          const rIdx = (state.resolvingCards || []).findIndex(c => c.id === card.id);
          if (rIdx === -1) return null; // Already moved by an effect (e.g. summon self / return to hand)
          state.resolvingCards.splice(rIdx, 1);

          const effText = String(card.effect || card.raw_effect || '');
          const shouldBanish = /banished from the game after (?:its|this) effect resolves|remove (?:this card )?from the game after (?:its|this) effect resolves|除外される/i.test(effText);
          if (shouldBanish) {
            p.removed.push(card);
            await events.emit({ type: 'CARD_MOVED', card, from: 'resolving', to: 'removed', player: playerSide, cause: 'magic_banished' });
            return 'removed';
          }
          p.grave.push(card);
          await events.emit({ type: 'CARD_MOVED', card, from: 'resolving', to: 'grave', player: playerSide, cause: 'magic_used' });
          return 'grave';
        };

        // Check NEGATE_EFFECT modifiers
        const cardColors = Array.isArray(card.colors) ? card.colors : [card.color || 'Red'];
        const isNegated = (state.modifiers || []).some(m => {
          if (m.type !== 'NEGATE_EFFECT') return false;
          if (m.side && m.side !== 'both' && m.side !== playerSide) return false;
          if (m.targetType && m.targetType !== 'ALL' && m.targetType !== card.type) return false;
          if (Array.isArray(m.colors) && m.colors.length > 0 && !cardColors.some(c => m.colors.includes(c))) return false;
          return true;
        });

        if (isNegated) {
          await finalizeMagicDestination();
          await events.emit({
            type: 'EFFECT_NEGATED',
            card,
            player: playerSide
          });
          await checkStateBasedActions(state, events);
          return { success: true, card, costPaid: cost, negated: true, effectResolved: false, hasUnsupported: false, hasFailure: false, abilityResults: [], finalDestination: 'grave' };
        }

        if (card.compiledIr && card.compiledIr.abilities) {
          const cardHasMain = (card.compiledIr.abilities || []).some(a =>
            a.header?.isMain || ['MAIN', 'MAIN_STEP'].includes(String(a.header?.timing || '').toUpperCase())
          );
          const selectedTiming = (options.timing || '').toUpperCase() || (state.step === 'ATTACK' ? 'FLASH' : (cardHasMain ? 'MAIN' : 'FLASH'));

          const matchingAbilities = card.compiledIr.abilities.filter(ab => {
            const t = String(ab.header?.timing || '').toUpperCase();
            const isMainAb = Boolean(ab.header?.isMain || t === 'MAIN' || t === 'MAIN_STEP');
            const isFlashAb = Boolean(ab.header?.isFlash || t === 'FLASH' || t === 'ATTACK_STEP' || t === 'FLASH_TIMING');
            if (selectedTiming === 'MAIN' && state.step === 'MAIN' && isMainAb) return true;
            if (selectedTiming === 'FLASH' && isFlashAb) return true;
            return false;
          });

          for (let ai = 0; ai < matchingAbilities.length; ai++) {
            const ab = matchingAbilities[ai];
            const remainingAbilities = matchingAbilities.slice(ai + 1);
            const abRes = await resolver.resolveAbility(state, ab, {
              controller: playerSide,
              sourceCard: card,
              soulCoreUsed: payRes.soulCoreUsed,
              _remainingAbilities: remainingAbilities,
              _magicResolution: { cardId: card.id, playerSide, costPaid: cost, soulCoreUsed: payRes.soulCoreUsed }
            }, events);
            abilityResults.push(abRes);
            if (abRes && abRes.suspended) {
              return {
                success: true,
                suspended: true,
                status: 'AWAITING_INTERACTION',
                interactionId: abRes.interactionId,
                interaction: abRes.interaction,
                card,
                costPaid: cost,
                abilityResults
              };
            }
          }
        }

        const finalDestination = await finalizeMagicDestination();
        await checkStateBasedActions(state, events);
        const hasUnsupported = abilityResults.some(r => r && r.hasUnsupported);
        const hasFailure = abilityResults.some(r => r && r.hasFailure);
        const effectResolved = abilityResults.length === 0 || abilityResults.every(r => r && r.success !== false);
        return { success: true, card, costPaid: cost, effectResolved, hasUnsupported, hasFailure, abilityResults, finalDestination };
      }

      await checkStateBasedActions(state, events);
      const hasUnsupported = abilityResults.some(r => r && r.hasUnsupported);
      const hasFailure = abilityResults.some(r => r && r.hasFailure);
      const effectResolved = abilityResults.length === 0 || abilityResults.every(r => r && r.success !== false);
      return { success: true, card, costPaid: cost, effectResolved, hasUnsupported, hasFailure, abilityResults };
    },

    async summonUnit(cardId, payment = [], playerSide = 'player', options = {}) {
      return await this.playCard(cardId, payment, playerSide, { ...options, pathway: ACTION_PATHWAYS.SUMMON });
    },

    async deployNexus(cardId, payment = [], playerSide = 'player', options = {}) {
      return await this.playCard(cardId, payment, playerSide, { ...options, pathway: ACTION_PATHWAYS.DEPLOY_NEXUS });
    },

    async activateMagic(cardId, payment = [], playerSide = 'player', options = {}) {
      return await this.playCard(cardId, payment, playerSide, { ...options, pathway: ACTION_PATHWAYS.ACTIVATE_MAGIC });
    },

    async resumeExecution(interactionId, validatedResponse) {
      const execList = state.pendingExecutions || [];
      const execIdx = execList.findIndex(e => e.interactionId === interactionId);
      if (execIdx === -1) {
        return { success: false, reason: 'NO_PENDING_EXECUTION', interactionId };
      }
      const exec = execList.splice(execIdx, 1)[0];
      const playerSide = exec.controller || 'player';
      const p = state.players[playerSide];

      const findCardById = (cid) => {
        if (!cid) return null;
        const fromResolving = (state.resolvingCards || []).find(c => c.id === cid);
        if (fromResolving) return fromResolving;
        for (const s of ['player', 'opponent']) {
          const sp = state.players[s];
          if (!sp) continue;
          for (const z of ['grave', 'hand', 'removed', 'deck']) {
            const found = (sp[z] || []).find(c => c.id === cid);
            if (found) return found;
          }
          for (const st of sp.field || []) {
            if (st.top?.id === cid) return st.top;
          }
          if (sp.burst?.id === cid) return sp.burst;
          if (sp.mirage?.id === cid) return sp.mirage;
        }
        return null;
      };

      const sourceCard = findCardById(exec.sourceCardId);
      const sourceStack = exec.sourceStackId
        ? (p?.field || []).find(st => st.id === exec.sourceStackId) || null
        : null;

      const abilityResults = [];
      const res = await resolver.resolveAbility(state, exec.ability, {
        controller: playerSide,
        sourceCard,
        sourceStack,
        soulCoreUsed: Boolean(exec.soulCoreUsed),
        _remainingAbilities: exec.remainingAbilities || [],
        _magicResolution: exec.magicResolution || null,
        _resume: {
          phase: exec.phase,
          clauseIndex: exec.clauseIndex,
          priorResponses: exec.priorResponses || [],
          latestResponse: validatedResponse,
          previousResult: exec.previousResult || null,
          chosenBranch: exec.chosenBranch || null,
          results: exec.results || [],
          selectedTargets: exec.selectedTargets || [],
          previousTargets: exec.previousTargets || [],
          previousTarget: exec.previousTarget || null,
          revealedCards: exec.revealedCards || [],
          isCommitted: Boolean(exec.isCommitted)
        }
      }, events);

      abilityResults.push(res);
      if (res && res.suspended) {
        return {
          success: true,
          suspended: true,
          status: 'AWAITING_INTERACTION',
          interactionId: res.interactionId,
          interaction: res.interaction,
          abilityResults
        };
      }

      const remaining = Array.isArray(exec.remainingAbilities) ? exec.remainingAbilities : [];
      for (let ai = 0; ai < remaining.length; ai++) {
        const nextAb = remaining[ai];
        const nextRemaining = remaining.slice(ai + 1);
        const nextRes = await resolver.resolveAbility(state, nextAb, {
          controller: playerSide,
          sourceCard,
          sourceStack,
          soulCoreUsed: Boolean(exec.soulCoreUsed),
          _remainingAbilities: nextRemaining,
          _magicResolution: exec.magicResolution || null
        }, events);
        abilityResults.push(nextRes);
        if (nextRes && nextRes.suspended) {
          return {
            success: true,
            suspended: true,
            status: 'AWAITING_INTERACTION',
            interactionId: nextRes.interactionId,
            interaction: nextRes.interaction,
            abilityResults
          };
        }
      }

      let finalDestination = null;
      if (exec.magicResolution && sourceCard) {
        const rIdx = (state.resolvingCards || []).findIndex(c => c.id === sourceCard.id);
        if (rIdx !== -1) {
          state.resolvingCards.splice(rIdx, 1);
          const effText = String(sourceCard.effect || sourceCard.raw_effect || '');
          const shouldBanish = /banished from the game after (?:its|this) effect resolves|remove (?:this card )?from the game after (?:its|this) effect resolves|除外される/i.test(effText);
          if (shouldBanish) {
            p.removed.push(sourceCard);
            finalDestination = 'removed';
            await events.emit({ type: 'CARD_MOVED', card: sourceCard, from: 'resolving', to: 'removed', player: playerSide, cause: 'magic_banished' });
          } else {
            p.grave.push(sourceCard);
            finalDestination = 'grave';
            await events.emit({ type: 'CARD_MOVED', card: sourceCard, from: 'resolving', to: 'grave', player: playerSide, cause: 'magic_used' });
          }
        }
      }

      await checkStateBasedActions(state, events);
      const hasUnsupported = abilityResults.some(r => r && r.hasUnsupported);
      const hasFailure = abilityResults.some(r => r && r.hasFailure);
      const effectResolved = abilityResults.every(r => r && r.success !== false);
      return {
        success: true,
        completed: true,
        resumed: true,
        effectResolved,
        hasUnsupported,
        hasFailure,
        finalDestination,
        abilityResults
      };
    },

    async activateAbility(cardId, abilityId, playerSide = 'player', options = {}) {
      const p = state.players[playerSide];
      const stack = p.field.find(st => st.top.id === cardId);
      if (!stack) return { success: false, activated: false, isCommitted: false, reason: 'CARD_NOT_ON_FIELD' };
      const abilities = stack.top.compiledIr?.abilities || [];

      // Contract: Semantic IDs cannot be used as physical activation references
      if (typeof abilityId === 'string' && abilityId.startsWith('SEM#')) {
        return { success: false, activated: false, isCommitted: false, reason: 'SEMANTIC_ID_NOT_PERMITTED_FOR_ACTIVATION' };
      }

      // Precedence 1: Physical identity lookup takes absolute precedence across all abilities
      let ability = abilities.find(ab => Boolean(ab.physicalId && ab.physicalId === abilityId));

      // Precedence 2: Documented legacyId fallback only when no physical ID matches
      if (!ability && typeof abilityId === 'string') {
        const legacyMatches = abilities.filter(ab => Boolean(ab.legacyId && ab.legacyId === abilityId));
        if (legacyMatches.length > 1) {
          return { success: false, activated: false, isCommitted: false, reason: 'AMBIGUOUS_LEGACY_IDENTITY' };
        }
        if (legacyMatches.length === 1) {
          ability = legacyMatches[0];
        }
      }

      // Precedence 3: Uncompiled legacy descriptor compatibility path
      // Strictly isolated to uncompiled descriptors that lack both physicalId and legacyId
      // (e.g. raw overrides or legacy test fixtures). Does not promote unverified ab.id when physicalId exists.
      if (!ability && typeof abilityId === 'string') {
        const uncompiledMatches = abilities.filter(ab => !ab.physicalId && !ab.legacyId && ab.id === abilityId);
        if (uncompiledMatches.length > 1) {
          return { success: false, activated: false, isCommitted: false, reason: 'AMBIGUOUS_LEGACY_IDENTITY' };
        }
        if (uncompiledMatches.length === 1) {
          ability = uncompiledMatches[0];
        }
      }

      if (!ability) return { success: false, activated: false, isCommitted: false, reason: 'ABILITY_NOT_FOUND' };

      const timing = String(ability.header?.timing || '').toUpperCase();
      const timingLabel = String(ability.header?.timingLabel || '').toLowerCase();
      const mainTiming = timing === 'MAIN' || timing === 'MAIN_STEP' || timing === 'MAIN_SKILL' || Boolean(ability.header?.isMain);
      const flashTiming = timing === 'FLASH' || timing === 'ATTACK_STEP' || timing === 'FLASH_TIMING' || Boolean(ability.header?.isFlash) || timingLabel.includes('flash');

      const isFlash = flashTiming;
      const auth = authorizeAction(this, playerSide, isFlash ? 'ACTIVATE_FLASH_ABILITY' : 'ACTIVATE_ABILITY', { cardId, ability, isFlash, options }, options);
      if (!auth.allowed) {
        return { success: false, activated: false, isCommitted: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }
      if (mainTiming && !flashTiming && state.step !== 'MAIN') return { success: false, activated: false, isCommitted: false, reason: 'ABILITY_TIMING_MISMATCH', code: 'MAIN_ONLY_DURING_MAIN_STEP', details: 'ABILITY_TIMING_MISMATCH' };
      if (flashTiming) {
        const timingRes = validateFlashTiming(ability, state, playerSide, options);
        if (!timingRes.allowed) {
          return { success: false, activated: false, isCommitted: false, reason: timingRes.reason, code: timingRes.code, details: timingRes.details || 'ABILITY_TIMING_MISMATCH' };
        }
      }
      if (state.step === 'MAIN' && ((ability.clauses || []).some(c => c.op?.op === 'RESTRICT_MAIN_STEP') ||
          isActionRestricted(state, 'RESTRICT_MAIN_STEP', playerSide, stack, { ability, timingWindow: state.step }))) {
        return { success: false, activated: false, isCommitted: false, reason: 'RESTRICTED_IN_MAIN_STEP' };
      }
      const level = computeLevel(stack, state);
      if (ability.header.levels?.length && !ability.header.levels.includes(level)) return { success: false, activated: false, isCommitted: false, reason: 'ABILITY_LEVEL_MISMATCH' };

      const activationContext = {
        controller: playerSide,
        sourceCard: stack.top,
        sourceStack: stack,
        placementId: stack.placementId || stack.top.placementId,
        isVoluntaryActivation: true
      };

      if (isActionRestricted(state, 'CANNOT_ACTIVATE_ABILITY', playerSide, stack, { ability, timingWindow: timing, sourceStack: stack, sourceCard: stack.top })) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: 'ABILITY_ACTIVATION_RESTRICTED'
        };
      }

      // Stage 4 Pre-flight Capacity Reservation: synchronously reserve capacity before any async costs or prompts
      const reservation = reserveRestriction(state, ability, activationContext);
      if (!reservation.success) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: reservation.status === RESTRICTION_STATUS.LIMIT_REACHED ? 'ABILITY_LIMIT_REACHED' : reservation.status,
          restrictionStatus: reservation.status
        };
      }
      activationContext.reservation = reservation;

      try {
        const result = await resolver.resolveAbility(state, ability, activationContext, events);
        await checkStateBasedActions(state, events);
        return {
          success: Boolean(result.success),
          activated: Boolean(result.activated !== false && (result.isCommitted || result.results?.length > 0)),
          isCommitted: Boolean(result.isCommitted),
          negated: Boolean(result.negated),
          restrictionStatus: result.restrictionStatus || (result.isCommitted ? 'COMMITTED' : reservation.status),
          hasUnsupported: Boolean(result.hasUnsupported),
          hasFailure: Boolean(result.hasFailure),
          ...(result.reason ? { reason: result.reason } : (result.hasUnsupported ? { reason: 'UNSUPPORTED_EFFECT' } : (result.hasFailure ? { reason: 'EFFECT_FAILED' } : {}))),
          result
        };
      } finally {
        if (!activationContext.isCommitted) {
          reservation.release();
        }
      }
    },

    async setBurst(cardId, playerSide = 'player') {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };
      if (state.strictRules && (state.step !== 'MAIN' || playerSide !== state.activePlayer)) {
        return { success: false, reason: 'SET_BURST_ONLY_IN_ACTIVE_MAIN_STEP' };
      }
      if (p.burstSetThisTurn) return { success: false, reason: 'BURST_ALREADY_SET_THIS_TURN' };

      const card = p.hand.find(c => c.id === cardId) || null;
      if (isActionRestricted(state, 'CANNOT_SET_BURST', playerSide, card, { actionType: 'SET_BURST', fromZone: 'hand' })) {
        return { success: false, reason: 'BURST_SET_RESTRICTED' };
      }
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      const cardClass = classifyCardType(card);
      if (cardClass.category === 'UNKNOWN') {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Unknown card type "${card.type}"` };
      }
      if (options.pathway) {
        const pathwayCheck = validateCardPathway(card, options.pathway);
        if (!pathwayCheck.allowed) {
          return { success: false, reason: pathwayCheck.reason, code: pathwayCheck.code, details: pathwayCheck.details };
        }
      }
      if (options.braveTargetStackId && !cardClass.isBrave) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot Brave non-Brave card of type "${card.type}"` };
      }
      if (options.cores !== undefined && !cardClass.isUnit) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot summon/place cores on non-unit card of type "${card.type}"` };
      }

      const hasFlashCard = Boolean(
        (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
        (card.effect && /\[Flash\]|Flash/i.test(card.effect))
      );
      const auth = authorizeAction(this, playerSide, 'SET_BURST', { card, isFlash: hasFlashCard });
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      await moveCard(state, card, 'burst', playerSide, { cause: 'set_burst' }, events);
      return { success: true, burstCard: card };
    },

    async transferCore(count, from, to, playerSide = 'player') {
      const auth = authorizeAction(this, playerSide, 'TRANSFER_CORE', { count, from, to });
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      if (state.step !== 'MAIN') return { success: false, reason: 'TRANSFER_ONLY_IN_MAIN_STEP' };
      if (playerSide !== state.activePlayer) return { success: false, reason: 'NOT_ACTIVE_PLAYER' };

      const fromZone = from?.zone;
      const toZone = to?.zone;
      const fromSide = from?.side || playerSide;
      const toSide = to?.side || playerSide;
      if (fromSide !== playerSide || toSide !== playerSide) {
        return { success: false, reason: 'CANNOT_TRANSFER_OPPONENT_CORES' };
      }
      if ((fromZone !== 'reserve' && fromZone !== 'field') || (toZone !== 'reserve' && toZone !== 'field')) {
        return { success: false, reason: 'INVALID_MANUAL_TRANSFER_ZONE' };
      }

      if (isActionRestricted(state, 'CANNOT_MOVE', playerSide, null, { actionType: 'CORE_TRANSFER', fromZone, toZone })) {
        return { success: false, reason: 'CORE_MOVE_RESTRICTED' };
      }

      const normFrom = { ...from, side: fromSide };
      const normTo = { ...to, side: toSide };
      const res = await moveCore(state, count, normFrom, normTo, { cause: 'manual_transfer', by: playerSide }, events);
      if (!res) return { success: false, reason: 'CORE_TRANSFER_FAILED' };
      await checkStateBasedActions(state, events);
      return { success: true };
    },

    async separateBrave(hostStackId, braveCardId = null, coresFromReserve = 1, playerSide = 'player', options = {}) {
      const auth = authorizeAction(this, playerSide, 'SEPARATE_BRAVE', { hostStackId, braveCardId, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };
      const hostStack = p.field.find(st => st.id === hostStackId);
      if (!hostStack) return { success: false, reason: 'HOST_STACK_NOT_FOUND' };
      if (!Array.isArray(hostStack.braves) || hostStack.braves.length === 0) {
        return { success: false, reason: 'NO_ATTACHED_BRAVES' };
      }
      const braveIndex = braveCardId
        ? hostStack.braves.findIndex(b => b.id === braveCardId)
        : 0;
      if (braveIndex < 0) return { success: false, reason: 'BRAVE_CARD_NOT_FOUND' };
      const [braveCard] = hostStack.braves.splice(braveIndex, 1);

      if ((p.reserve.normal || 0) < coresFromReserve || coresFromReserve < 1) {
        hostStack.braves.splice(braveIndex, 0, braveCard);
        return { success: false, reason: 'INSUFFICIENT_RESERVE_CORES', required: coresFromReserve, available: p.reserve.normal || 0 };
      }

      p.reserve.normal -= coresFromReserve;
      const braveStack = createFieldStack(braveCard, { normal: coresFromReserve, soul: 0 });
      braveStack.owner = playerSide;
      braveStack.state = hostStack.state;
      p.field.push(braveStack);

      if (events) {
        await events.emit({
          type: 'BRAVE_SEPARATED',
          braveCard,
          hostCard: hostStack.top,
          player: playerSide,
          braveStackId: braveStack.id,
          coresAllocated: coresFromReserve
        });
      }

      return {
        success: true,
        hostStack,
        braveStack,
        braveCard,
        coresAllocated: coresFromReserve
      };
    },

    async flipCard(stackId, options = {}, playerSide = 'player') {
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };
      const targetStack = p.field.find(st => st.id === stackId);
      if (!targetStack) return { success: false, reason: 'STACK_NOT_FOUND' };

      const currentFace = targetStack.currentFace || targetStack.top.face || 'A';
      const nextFace = currentFace === 'A' ? 'B' : 'A';
      targetStack.currentFace = nextFace;
      targetStack.isFlipped = nextFace === 'B';
      targetStack.top.face = nextFace;

      if (nextFace === 'B' && (targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.sideB)) {
        const back = targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.sideB;
        if (!targetStack.top.frontSide) {
          targetStack.top.frontSide = { ...targetStack.top, backSide: undefined };
        }
        Object.assign(targetStack.top, back, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: 'B'
        });
      } else if (nextFace === 'A' && targetStack.top.frontSide) {
        const front = targetStack.top.frontSide;
        Object.assign(targetStack.top, front, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: 'A'
        });
      }

      if (options.faceData) {
        Object.assign(targetStack.top, options.faceData, {
          id: targetStack.top.id,
          placementId: targetStack.top.placementId,
          owner: targetStack.top.owner,
          face: nextFace
        });
      }

      if (events) {
        await events.emit({
          type: 'CARD_FLIPPED',
          stackId: targetStack.id,
          card: targetStack.top,
          face: nextFace,
          isFlipped: targetStack.isFlipped,
          player: playerSide
        });
      }

      return {
        success: true,
        stackId: targetStack.id,
        currentFace: nextFace,
        isFlipped: targetStack.isFlipped,
        stack: targetStack
      };
    },

    async payGodCores(stackId, count = 1, playerSide = 'player') {
      return await payGodCores(state, stackId, count, playerSide, events);
    },

    async declareAttack(stackId, playerSide = 'player') {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };

      const auth = authorizeAction(this, playerSide, 'ATTACK', { stackId });
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      if (state.strictRules) {
        if (state.step !== 'ATTACK') return { success: false, reason: 'ATTACK_ONLY_IN_ATTACK_STEP' };
        if (playerSide !== state.activePlayer) return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
        if (state.combat) return { success: false, reason: 'COMBAT_ALREADY_IN_PROGRESS' };
      }

      const stack = p.field.find(st => st.id === stackId);
      if (!stack) return { success: false, reason: 'STACK_NOT_FOUND' };
      if (String(stack.top?.type || '').includes('Nexus')) {
        return { success: false, reason: 'CANNOT_ATTACK_WITH_NEXUS' };
      }
      if (!canAttack(state, stack)) return { success: false, reason: 'CANNOT_ATTACK' };

      const prevState = stack.state;
      stack.state = prevState === 'EXHAUSTED' ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
      await events.emit({
        type: 'CARD_EXHAUSTED',
        card: stack.top,
        stack,
        player: playerSide,
        previousState: prevState,
        newState: stack.state,
        cause: 'attack'
      });

      p.attacksThisTurn = (p.attacksThisTurn || 0) + 1;
      const flashPriorityMod = (state.modifiers || []).find(m => m && m.type === 'FLASH_PRIORITY');
      const defaultFlashPriority = playerSide === 'player' ? 'opponent' : 'player';
      state.combat = {
        attackerStackId: stackId,
        attackerSide: playerSide,
        blockerStackId: null,
        stage: 'FLASH_1',
        flashPriority: flashPriorityMod ? (flashPriorityMod.firstSide || flashPriorityMod.side || playerSide) : defaultFlashPriority
      };

      await events.emit({
        type: 'ATTACK_DECLARED',
        attacker: stack,
        player: playerSide
      });

      // Trigger (When Attacks) abilities (enforcing [Release] / [True Release] if attached)
      if (stack.top.compiledIr && stack.top.compiledIr.abilities) {
        const currentLevel = computeLevel(stack, state);
        for (const ab of stack.top.compiledIr.abilities) {
          if (ab.header?.keyword && /^(?:Holy Life|Ultra Holy Life|Curse|True-Curse)$/i.test(String(ab.header.keyword).trim())) {
            continue; // Deferred combat-damage / end-of-battle keywords handled by KeywordRegistry & battle resolution
          }
          if (ab.header.timing === 'WHEN_ATTACKS' || ab.header.timing === 'WHEN_ATTACKS_OR_BLOCKS' || ab.header.timing === 'WHEN_BATTLES') {
            if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
              const releaseSpec = parseReleaseDeclaration(ab);
              const abCtx = { controller: playerSide, sourceCard: stack.top, sourceStack: stack };
              if (releaseSpec) {
                const relRes = await executeReleaseRuntime(state, stack, releaseSpec, abCtx, events);
                abCtx.releaseSatisfied = relRes.released;
                if (!relRes.released) continue;
              }
              await resolver.resolveAbility(state, ab, abCtx, events);
            }
          }
        }
      }
      // Resolve active Mirage [During Set] abilities matching WHEN_ATTACKS / ATTACK_STEP
      for (const mAb of getActiveMirageAbilities(state, playerSide, 'WHEN_ATTACKS')) {
        await resolver.resolveAbility(state, mAb, { controller: playerSide, sourceCard: state.players[playerSide].mirage }, events);
      }

      if (!state.combat) {
        const attackRes = await endAttack(state, events);
        if (attackRes && !attackRes.success) return attackRes;
      } else if (windows && (state.step === 'ATTACK' || options.useResponseWindows)) {
        const defenderSide = playerSide === 'player' ? 'opponent' : 'player';
        const initialPriority = state.combat.flashPriority || defenderSide;
        await windows.openWindow({
          windowType: RESPONSE_WINDOW_TYPES.FLASH_1,
          timing: 'FIRST_FLASH_TIMING',
          attackerStackId: stackId,
          attackerSide: playerSide,
          defenderSide,
          priorityPlayer: initialPriority
        });
      }

      return { success: true, combat: state.combat, stage: state.combat?.stage, flashPriority: state.combat?.flashPriority };
    },

    async passPriority(playerSide) {
      if (windows && typeof windows.submitResponse === 'function') {
        const res = await windows.submitResponse({ action: 'PASS' }, { responder: playerSide });
        return {
          success: res.success,
          closed: res.closed,
          windowClosed: res.closed,
          nextPriority: res.nextPriority,
          consecutivePasses: res.consecutivePasses,
          reason: res.reason
        };
      }
      return { success: false, reason: 'NO_RESPONSE_WINDOW' };
    },

    async declareBlock(blockerStackId, blockerSide = 'opponent') {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      if (!state.combat) return { success: false, reason: 'NOT_IN_COMBAT' };
      const expectedAttackerSide = state.combat.attackerSide || (blockerSide === 'opponent' ? 'player' : 'opponent');
      if (blockerSide === expectedAttackerSide) {
        return { success: false, reason: 'CANNOT_BLOCK_OWN_ATTACK' };
      }

      if (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive()) {
        const curWin = windows.getCurrentWindow();
        if (curWin && curWin.windowType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
          return await windows.handleBlockDeclaration({ stackId: blockerStackId, blockerStackId }, blockerSide);
        }
        if (curWin && (curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH_1 || curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH_2 || curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH)) {
          return { success: false, reason: 'FLASH_TIMING_NOT_CLOSED', code: 'FLASH_TIMING_NOT_CLOSED' };
        }
      }

      const p = state.players[blockerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };
      const stack = p.field.find(st => st.id === blockerStackId);
      if (!stack) return { success: false, reason: 'BLOCKER_NOT_FOUND' };
      if (!canBlock(state, stack)) return { success: false, reason: 'CANNOT_BLOCK' };

      const prevBlockerState = stack.state;
      stack.state = prevBlockerState === 'EXHAUSTED' ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
      await events.emit({
        type: 'CARD_EXHAUSTED',
        card: stack.top,
        stack,
        player: blockerSide,
        previousState: prevBlockerState,
        newState: stack.state,
        cause: 'block'
      });

      state.combat.blockerStackId = blockerStackId;
      state.combat.stage = 'BP_COMPARE';

      await events.emit({
        type: 'BLOCK_DECLARED',
        blocker: stack,
        player: blockerSide
      });

      // Trigger (When Blocks) abilities
      if (stack.top.compiledIr && stack.top.compiledIr.abilities) {
        const blockerLevel = computeLevel(stack, state);
        for (const ab of stack.top.compiledIr.abilities) {
          if (ab.header.timing === 'WHEN_BLOCKS' || ab.header.timing === 'WHEN_ATTACKS_OR_BLOCKS' || ab.header.timing === 'WHEN_BATTLES') {
            if (!ab.header.levels || ab.header.levels.includes(blockerLevel)) {
              await resolver.resolveAbility(state, ab, { controller: blockerSide, sourceCard: stack.top, sourceStack: stack }, events);
            }
          }
        }
      }

      if (!state.combat) {
        const battleRes = await endBattle(state, events);
        if (battleRes && !battleRes.success) return battleRes;
        const attackRes = await endAttack(state, events);
        if (attackRes && !attackRes.success) return attackRes;
        await checkStateBasedActions(state, events);
        return { success: true };
      }

      // Resolve battle BP comparison
      const attackerSide = expectedAttackerSide;
      const attackerStack = state.players[attackerSide].field.find(st => st.id === state.combat.attackerStackId);
      const blockerStack = p.field.find(st => st.id === blockerStackId);
      if (!attackerStack || !blockerStack) {
        state.combat = null;
        const battleRes = await endBattle(state, events);
        if (battleRes && !battleRes.success) return battleRes;
        const attackRes = await endAttack(state, events);
        if (attackRes && !attackRes.success) return attackRes;
        await checkStateBasedActions(state, events);
        return { success: true };
      }

      await events.emit({
        type: 'BATTLE_STARTED',
        attacker: attackerStack,
        blocker: blockerStack,
        attackerSide,
        blockerSide
      });

      await events.emit({
        type: 'BP_COMPARE',
        attacker: attackerStack,
        blocker: blockerStack
      });

      const compareByLevel = (state.modifiers || []).some(m =>
        (m.type === 'COMPARE_LEVELS' || m.type === 'COMPARE_LV_INSTEAD_OF_BP') &&
        (!m.side || m.side === 'both' || m.side === attackerSide || m.side === blockerSide)
      );

      const attackerBp = computeEffectiveBP(state, attackerStack);
      const blockerBp = computeEffectiveBP(state, blockerStack);
      const attackerLv = computeLevel(attackerStack, state);
      const blockerLv = computeLevel(blockerStack, state);

      const battleRuleMods = (state.modifiers || []).filter(m =>
        m && (m.type === 'BATTLE_RULE_MODIFIER' || m.type === 'EXCHANGE_BP' || m.type === 'SWITCH_BP') &&
        (!m.side || m.side === 'both' || m.side === attackerSide || m.side === blockerSide)
      );
      const useLv1Bp = battleRuleMods.some(m => m.rule === 'USE_LV1_BP');
      const noBpDestruction = battleRuleMods.some(m => m.rule === 'NO_BP_DESTRUCTION');
      const invertComparison = battleRuleMods.some(m => m.rule === 'INVERT_BP_COMPARISON');
      const exchangeBp = battleRuleMods.some(m => m.type === 'EXCHANGE_BP' || m.type === 'SWITCH_BP' || m.rule === 'EXCHANGE_BP');

      const effectiveAttackerBp = useLv1Bp ? Number(attackerStack.top?.levels?.lv1 ?? attackerStack.top?.bp ?? 0) : attackerBp;
      const effectiveBlockerBp = useLv1Bp ? Number(blockerStack.top?.levels?.lv1 ?? blockerStack.top?.bp ?? 0) : blockerBp;
      const [cmpAttackerBp, cmpBlockerBp] = exchangeBp ? [effectiveBlockerBp, effectiveAttackerBp] : [effectiveAttackerBp, effectiveBlockerBp];

      const attackerScore = compareByLevel ? attackerLv : cmpAttackerBp;
      const blockerScore = compareByLevel ? blockerLv : cmpBlockerBp;
      const attackerSourceCard = attackerStack.top;
      const hasCurse = getActiveStackKeywords(attackerStack, state).some(k => (typeof k === 'string' ? k === 'Curse' : k?.name === 'Curse'));

      if (!noBpDestruction && ((invertComparison ? attackerScore < blockerScore : attackerScore > blockerScore))) {
        // Blocker destroyed by attacker
        await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'battle', by: attackerSide, sourceCard: attackerStack.top }, events);
      } else if (!noBpDestruction && (invertComparison ? (blockerScore < attackerScore) : (blockerScore > attackerScore))) {
        // Attacker destroyed by blocker
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner || attackerSide, { cause: 'battle', by: blockerSide, sourceCard: blockerStack.top }, events);
      } else if (!noBpDestruction) {
        // Mutual destruction (tie)
        await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'battle', by: attackerSide, sourceCard: attackerStack.top }, events);
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner || attackerSide, { cause: 'battle', by: blockerSide, sourceCard: blockerStack.top }, events);
      }

      // At End of Battle: Check Curse keyword on attacker
      // [Curse] (When Attacks) At the end of battle, destroy 1 opposing Spirit that blocked this Spirit.
      if (hasCurse && blockerStack && blockerStack.top) {
        const blockerInField = p.field.some(st => st.id === blockerStackId);
        if (blockerInField) {
          await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'curse', by: attackerSide, sourceCard: attackerSourceCard }, events);
        }
      }

      state.combat = null;
      const battleRes = await endBattle(state, events);
      if (battleRes && !battleRes.success) return battleRes;
      const attackRes = await endAttack(state, events);
      if (attackRes && !attackRes.success) return attackRes;
      await checkStateBasedActions(state, events);
      return { success: true, attackerBp, blockerBp };
    },

    async resolveDirectHit(attackerSide = 'player') {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      if (!state.combat) return { success: false, reason: 'NOT_IN_COMBAT' };
      if (state.combat.blockerStackId) return { success: false, reason: 'ALREADY_BLOCKED' };

      if (windows && typeof windows.isResponseWindowActive === 'function' && windows.isResponseWindowActive()) {
        const curWin = windows.getCurrentWindow();
        if (curWin && (curWin.windowType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION || curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH_1 || curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH_2 || curWin.windowType === RESPONSE_WINDOW_TYPES.FLASH)) {
          return { success: false, reason: 'BLOCK_DECISION_REQUIRED', code: 'BLOCK_DECISION_REQUIRED' };
        }
      }

      const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';
      const defPlayer = state.players[defenderSide];
      const attackerStack = state.players[attackerSide]?.field.find(st => st.id === state.combat.attackerStackId) || null;

      // Enforce mustBlockIfAble (Clash, True-Clash, Consecutive Blade)
      if (state.combat.mustBlockIfAble) {
        const eligibleBlockers = (defPlayer.field || []).filter(st =>
          st.state === 'REFRESHED' &&
          (st.top?.type === 'Spirit' || st.top?.type === 'Ultimate')
        );
        if (eligibleBlockers.length > 0) {
          return { success: false, reason: 'MUST_BLOCK_IF_ABLE' };
        }
      }

      // Check PREVENT_LIFE_LOSS / PREVENT_DAMAGE / CANNOT_LOSE_LIFE modifier
      const hasLifeLossPrevented = isActionRestricted(state, 'CANNOT_LOSE_LIFE', defenderSide, attackerStack, {
        cause: 'combat_damage',
        sourceCard: attackerStack?.top || null,
        isCost: false
      });
      if (hasLifeLossPrevented) {
        state.combat = null;
        const bRes = await endBattle(state, events);
        if (bRes && !bRes.success) return bRes;
        const aRes = await endAttack(state, events);
        if (aRes && !aRes.success) return aRes;
        return { success: true, defenderLife: defPlayer.life, prevented: true };
      }

      // Compute symbol damage (default 1 if stack has >= 1 symbols or missing)
      const symbols = attackerStack ? computeSymbols(state, attackerStack) : ['Red'];
      let damage = (state.combat && state.combat.fixedSymbolZero) ? 0 : (symbols.length > 0 ? symbols.length : 1);

      // Check DAMAGE_CAP modifier
      defPlayer.combatDamageTakenThisTurn = (defPlayer.combatDamageTakenThisTurn || 0);
      const matchingCaps = (state.modifiers || [])
        .filter(m => m.type === 'DAMAGE_CAP' && (m.side === defenderSide || m.side === 'both' || !m.side))
        .map(m => (typeof m.maxDamage === 'number' ? m.maxDamage : (typeof m.cap === 'number' ? m.cap : 1)));

      if (matchingCaps.length > 0) {
        const cap = Math.min(...matchingCaps);
        const remainingAllowed = Math.max(0, cap - defPlayer.combatDamageTakenThisTurn);
        damage = Math.min(damage, remainingAllowed);
      }

      if (damage === 0) {
        state.combat = null;
        const bRes = await endBattle(state, events);
        if (bRes && !bRes.success) return bRes;
        const aRes = await endAttack(state, events);
        if (aRes && !aRes.success) return aRes;
        return { success: true, defenderLife: defPlayer.life, prevented: true, capped: true };
      }

      // Remove damage Life core -> Reserve via authoritative moveCore (Standard Battle Spirits combat damage)
      let preventedByTrigger = false;
      if (defPlayer.life > 0) {
        const actualLifeLoss = Math.min(defPlayer.life, damage);
        const moved = await moveCore(
          state,
          actualLifeLoss,
          { zone: 'life', side: defenderSide },
          { zone: 'reserve', side: defenderSide },
          { cause: 'combat_damage', by: attackerSide, sourceCard: attackerStack?.top || null },
          events
        );
        if (moved) {
          defPlayer.combatDamageTakenThisTurn += actualLifeLoss;
        } else {
          preventedByTrigger = true;
        }
      }

      state.combat = null;
      const bRes = await endBattle(state, events);
      if (bRes && !bRes.success) return bRes;
      const aRes = await endAttack(state, events);
      if (aRes && !aRes.success) return aRes;
      await checkStateBasedActions(state, events);
      return { success: true, defenderLife: defPlayer.life, ...(preventedByTrigger ? { prevented: true } : {}) };
    },

    validateState() {
      return validateGameState(state);
    },

    async stabilize() {
      return await stabilizeGameState(state, events);
    },

    async endAttack() {
      return await endAttack(state, events);
    },

    async endBattle() {
      return await endBattle(state, events);
    },

    async setMirage(cardId, playerSide = 'player', options = {}) {
      const auth = authorizeAction(this, playerSide, 'SET_MIRAGE', { cardId, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }
      return await setMirageFromHand(state, playerSide, cardId, options, events);
    },

    async executeRelease(stackId, releaseSpec = null, playerSide = 'player') {
      const p = state.players[playerSide];
      const st = p?.field?.find(x => x.id === stackId || x.top?.id === stackId);
      return await executeReleaseRuntime(state, st, releaseSpec, { controller: playerSide }, events);
    },

    async performAdvent(playerSide = 'player', cardOrId, targetStackId, options = {}) {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };

      const cardId = typeof cardOrId === 'string' ? cardOrId : cardOrId?.id;
      const card = (p.hand || []).find(c => c.id === cardId || c.cardNumber === cardId) ||
        (options.allowDirectCard && typeof cardOrId === 'object' ? cardOrId : null);
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      const cardClass = classifyCardType(card);
      if (cardClass.category === 'UNKNOWN') {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Unknown card type "${card.type}"` };
      }
      if (options.pathway) {
        const pathwayCheck = validateCardPathway(card, options.pathway);
        if (!pathwayCheck.allowed) {
          return { success: false, reason: pathwayCheck.reason, code: pathwayCheck.code, details: pathwayCheck.details };
        }
      }
      if (options.braveTargetStackId && !cardClass.isBrave) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot Brave non-Brave card of type "${card.type}"` };
      }
      if (options.cores !== undefined && !cardClass.isUnit) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot summon/place cores on non-unit card of type "${card.type}"` };
      }

      const hasFlashCard = Boolean(
        (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
        (card.effect && /\[Flash\]|Flash/i.test(card.effect)) ||
        options.timing === 'FLASH'
      );
      const auth = authorizeAction(this, playerSide, 'PLAY_CARD', { card, isFlash: hasFlashCard, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      const targetStack = (p.field || []).find(st => st.id === targetStackId || st.top?.id === targetStackId);
      if (!targetStack) {
        const oppSide = playerSide === 'player' ? 'opponent' : 'player';
        const enemyStack = (state.players[oppSide]?.field || []).find(st => st.id === targetStackId || st.top?.id === targetStackId);
        return { success: false, reason: enemyStack ? 'ADVENT_TARGET_NOT_OWNED' : 'ADVENT_TARGET_NOT_FOUND' };
      }

      const advCheck = evaluateAdventCondition(state, card, playerSide, {
        targetStack,
        enforceTargetFilter: options.enforceTargetFilter !== false
      });
      if (!advCheck.allowed) {
        return { success: false, reason: advCheck.reason || 'ADVENT_CONDITION_NOT_MET' };
      }

      // Check & locate Soul Core payment before mutating stack
      const effStr = String(card.effect || '');
      const banishSoul = /banishing\s+(?:the\s+|your\s+)?\[?Soul Core\]?/i.test(effStr);
      const sendSoul = !banishSoul && (options.paySoulCore !== false) &&
        (/\[?Soul Core\]?\s+to\s+(?:the\s+)?Trash/i.test(effStr) || /sending\s+(?:your\s+)?\[?Soul Core\]?/i.test(effStr));

      let soulDonor = null;
      if ((banishSoul || sendSoul) && !options.skipSoulCorePayment) {
        if ((p.reserve?.soul || 0) > 0) {
          soulDonor = { zone: 'reserve' };
        } else {
          const stSoul = (p.field || []).find(st => (st.cores?.soul || 0) > 0);
          if (stSoul) soulDonor = { zone: 'field', stack: stSoul };
        }
        if (!soulDonor) {
          return { success: false, reason: 'NO_SOUL_CORE_AVAILABLE' };
        }
      }

      if (soulDonor) {
        if (soulDonor.zone === 'reserve') {
          p.reserve.soul -= 1;
        } else if (soulDonor.stack) {
          soulDonor.stack.cores.soul -= 1;
        }
        if (banishSoul) {
          p.voidCores = p.voidCores || { normal: 0, soul: 0 };
          p.voidCores.soul = (p.voidCores.soul || 0) + 1;
          if (state.turnHistory?.[playerSide]) state.turnHistory[playerSide].soulCoreBanished = (state.turnHistory[playerSide].soulCoreBanished || 0) + 1;
        } else {
          p.trash.soul = (p.trash.soul || 0) + 1;
          if (state.turnHistory?.[playerSide]) state.turnHistory[playerSide].soulCoreUsed = (state.turnHistory[playerSide].soulCoreUsed || 0) + 1;
        }
      }

      const prevTop = targetStack.top;
      targetStack.under = targetStack.under || [];
      targetStack.under.unshift(prevTop);
      targetStack.top = card;
      targetStack.isAdvented = true;
      targetStack.isSoulState = false;
      p.hand = (p.hand || []).filter(c => c.id !== card.id);
      if (state.turnHistory?.[playerSide]) {
        state.turnHistory[playerSide].adventsPerformed = (state.turnHistory[playerSide].adventsPerformed || 0) + 1;
      }

      await events.emit({
        type: 'CARD_ADVENTED',
        card,
        previousTop: prevTop,
        stack: targetStack,
        player: playerSide
      });
      await events.emit({
        type: 'ADVENTS',
        card,
        stack: targetStack,
        player: playerSide,
        sourceCard: card
      });

      const abilityResults = [];
      const currentLevel = computeLevel(targetStack, state);
      for (const ab of (card.compiledIr?.abilities || [])) {
        const t = String(ab.header?.timing || '').toUpperCase();
        const tLabel = String(ab.header?.timingLabel || '');
        if (t === 'WHEN_ADVENTS' || t === 'WHEN_SUMMONED_OR_ADVENTS' || /advents/i.test(tLabel)) {
          if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
            const res = await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card, sourceStack: targetStack, enforcePrefixPrerequisites: true }, events);
            abilityResults.push(res);
          }
        }
      }

      await checkStateBasedActions(state, events);
      return { success: true, stack: targetStack, card, previousTop: prevTop, abilityResults };
    },

    async executeAccel(playerSide = 'player', cardOrId, options = {}) {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };

      const cardId = typeof cardOrId === 'string' ? cardOrId : cardOrId?.id;

      // 1. Accel in the removed zone cannot be activated again
      const inRemoved = (p.removed || []).some(c => c.id === cardId || c.cardNumber === cardId) ||
                        (p.openCards || []).some(c => c.id === cardId || c.cardNumber === cardId);
      if (inRemoved) {
        return { success: false, reason: 'ACCEL_CANNOT_BE_USED_FROM_REMOVED' };
      }

      // 2. Accel can only be used from hand unless specified otherwise
      let card = (p.hand || []).find(c => c.id === cardId || c.cardNumber === cardId);
      let sourceZone = 'hand';
      if (!card) {
        const canUseFromTrash = options.fromZone === 'trash' || (state.modifiers || []).some(m =>
          (m.type === 'CAN_USE_ACCEL_FROM_TRASH' || m.type === 'USE_ACCEL_FROM_TRASH') &&
          (m.side === 'both' || m.side === playerSide)
        );
        if (canUseFromTrash) {
          const trashList = Array.isArray(p.grave) ? p.grave : (Array.isArray(p.trash) ? p.trash : []);
          card = trashList.find(c => c.id === cardId || c.cardNumber === cardId);
          if (card) sourceZone = 'trash';
        }
      }
      if (!card) return { success: false, reason: 'ACCEL_ONLY_FROM_HAND' };

      // 3. Timing validation: Flash Accel can only be activated during Attack Phase
      const allAbs = card.compiledIr?.abilities || card.abilities || [];
      let accelAbList = allAbs.filter(ab =>
        /accel/i.test(String(ab?.header?.keyword || '')) ||
        (ab?.header?.prefixes || []).some(pr => /accel/i.test(String(pr)))
      );
      if (accelAbList.length === 0) {
        accelAbList = allAbs.filter(ab => ab?.header?.isFlash || String(ab?.header?.timing || '').toUpperCase() === 'FLASH');
      }

      const effectText = String(card.effect || card.raw_effect || '');
      const hasFlash = Boolean(
        options.timing === 'FLASH' ||
        accelAbList.some(ab => ab?.header?.isFlash || String(ab?.header?.timing || '').toUpperCase() === 'FLASH') ||
        /(?:^|\s|\b)Flash\s*-\s*\[Accel/i.test(effectText) ||
        /\[Accel[^\]]*\(Flash[^)]*\)\]/i.test(effectText) ||
        /(?:^|\s|\b)Flash(?:\s*-\s*|:|\s*\()/i.test(effectText)
      );
      const hasMain = Boolean(
        options.timing === 'MAIN' ||
        accelAbList.some(ab => ab?.header?.isMain || String(ab?.header?.timing || '').toUpperCase() === 'MAIN') ||
        /(?:^|\s|\b)Main\s*-\s*\[Accel/i.test(effectText) ||
        /\[Accel[^\]]*\(Main[^)]*\)\]/i.test(effectText) ||
        /(?:^|\s|\b)Main(?:\s*-\s*|:|\s*\()/i.test(effectText)
      );

      const auth = authorizeAction(this, playerSide, hasFlash ? 'USE_ACCEL' : 'EXECUTE_ACCEL', { card, isFlash: hasFlash, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      if (!options.bypassTiming) {
        const targetTiming = (options.timing || '').toUpperCase() || (state.step === 'ATTACK' ? 'FLASH' : (hasMain ? 'MAIN' : 'FLASH'));

        if (targetTiming === 'FLASH') {
          if (!hasFlash && hasMain) {
            return { success: false, reason: 'MAIN_ONLY_DURING_MAIN_STEP' };
          }
          const timingRes = validateFlashTiming(card, state, playerSide, options);
          if (!timingRes.allowed) {
            return {
              success: false,
              reason: timingRes.reason || timingRes.code || 'TIMING_NOT_SATISFIED',
              code: timingRes.code,
              details: timingRes.reason,
              timingSpec: timingRes.specification || timingRes.spec
            };
          }
        } else if (targetTiming === 'MAIN') {
          if (state.step !== 'MAIN') {
            return { success: false, reason: 'MAIN_ONLY_DURING_MAIN_STEP' };
          }
          if (playerSide !== state.activePlayer) {
            return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
          }
          if (!hasMain && hasFlash) {
            return { success: false, reason: 'CARD_HAS_NO_MAIN_EFFECT' };
          }
        } else {
          if (state.step !== 'MAIN' && state.step !== 'ATTACK') {
            return { success: false, reason: 'INVALID_TIMING_FOR_ACCEL' };
          }
          if (state.step === 'MAIN' && playerSide !== state.activePlayer) {
            return { success: false, reason: 'NOT_ACTIVE_PLAYER' };
          }
        }
      }

      if (options.timing === 'FLASH') {
        const flashOnly = accelAbList.filter(ab => ab?.header?.isFlash || String(ab?.header?.timing || '').toUpperCase() === 'FLASH');
        if (flashOnly.length > 0) accelAbList = flashOnly;
      } else if (options.timing === 'MAIN') {
        const mainOnly = accelAbList.filter(ab => ab?.header?.isMain || String(ab?.header?.timing || '').toUpperCase() === 'MAIN');
        if (mainOnly.length > 0) accelAbList = mainOnly;
      }

      // 4. Centralized Restrictions
      if (isActionRestricted(state, 'CANNOT_USE_ACCEL', playerSide, card, { cardType: card.type, fromZone: sourceZone, timingWindow: state.step })) {
        return { success: false, reason: 'ACCEL_RESTRICTED' };
      }
      if (state.step === 'ATTACK' && isActionRestricted(state, 'PREVENT_FLASH_HAND', playerSide, card, { cardType: card.type, fromZone: sourceZone, timingWindow: 'FLASH' })) {
        return { success: false, reason: 'FLASH_RESTRICTED' };
      }

      let rawCost = options.cost;
      if (rawCost == null) {
        const m = effectText.match(/\[Accel:\s*Cost\s+(\d+)/i);
        rawCost = m ? parseInt(m[1], 10) : (card.accelCost ?? 0);
      }
      const accelShim = { ...card, cost: Number(rawCost) || 0 };
      const effectiveCost = options.free ? 0 : calculateEffectiveCost(state, accelShim, playerSide);
      if (effectiveCost > 0) {
        if (!canAffordCost(state, effectiveCost, playerSide)) {
          return { success: false, reason: 'INSUFFICIENT_CORES' };
        }
        const plan = (Array.isArray(options.payment) && options.payment.length > 0)
          ? options.payment
          : buildPaymentPlan(state, effectiveCost, playerSide);
        if (!plan) return { success: false, reason: 'INSUFFICIENT_CORES' };
        const payRes = await payCost(state, effectiveCost, plan, playerSide, events);
        if (!payRes.success) return { success: false, reason: payRes.reason || 'PAYMENT_FAILED' };
      }

      const abilityResults = [];
      for (const ab of accelAbList) {
        const res = await resolver.resolveAbility(state, ab, {
          controller: playerSide,
          sourceCard: card,
          activationOrigin: 'Accel',
          usedViaKeyword: 'Accel'
        }, events);
        abilityResults.push(res);
      }

      // 5. Send to removed zone
      if (sourceZone === 'hand') {
        p.hand = (p.hand || []).filter(c => c.id !== card.id);
      } else if (sourceZone === 'trash') {
        if (Array.isArray(p.grave)) p.grave = p.grave.filter(c => c.id !== card.id);
        if (Array.isArray(p.trash)) p.trash = p.trash.filter(c => c.id !== card.id);
      }

      if (!(p.removed || []).some(c => c.id === card.id)) {
        await moveCard(state, card, 'removed', playerSide, { cause: 'accel', by: playerSide }, events);
      }
      if (!Array.isArray(p.openCards)) p.openCards = [];
      if (!p.openCards.some(c => c.id === card.id)) p.openCards.push(card);

      card.faceUp = true;
      card.isAccelRemoved = true;
      card.fromAccel = true;
      card.canSummonFromRemoved = true;
      card.accelUsed = true;

      await events.emit({ type: 'ACCEL_EXECUTED', card, player: playerSide, costPaid: effectiveCost });
      await checkStateBasedActions(state, events);
      return { success: true, zone: 'removed', card, costPaid: effectiveCost, abilityResults };
    },

    async executeChange(playerSide = 'player', cardOrId, swapStackId = null, options = {}) {
      if (state.winner) return { success: false, reason: 'GAME_ALREADY_OVER' };
      const p = state.players[playerSide];
      if (!p) return { success: false, reason: 'INVALID_PLAYER' };

      const cardId = typeof cardOrId === 'string' ? cardOrId : cardOrId?.id;
      const card = (p.hand || []).find(c => c.id === cardId || c.cardNumber === cardId);
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      const cardClass = classifyCardType(card);
      if (cardClass.category === 'UNKNOWN') {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Unknown card type "${card.type}"` };
      }
      if (options.pathway) {
        const pathwayCheck = validateCardPathway(card, options.pathway);
        if (!pathwayCheck.allowed) {
          return { success: false, reason: pathwayCheck.reason, code: pathwayCheck.code, details: pathwayCheck.details };
        }
      }
      if (options.braveTargetStackId && !cardClass.isBrave) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot Brave non-Brave card of type "${card.type}"` };
      }
      if (options.cores !== undefined && !cardClass.isUnit) {
        return { success: false, reason: 'INVALID_CARD_TYPE', code: 'INVALID_CARD_TYPE', details: `Cannot summon/place cores on non-unit card of type "${card.type}"` };
      }

      const hasFlashCard = Boolean(
        (card.compiledIr?.abilities || []).some(a => a.header?.isFlash) ||
        (card.effect && /\[Flash\]|Flash/i.test(card.effect)) ||
        options.timing === 'FLASH'
      );
      const auth = authorizeAction(this, playerSide, 'PLAY_CARD', { card, isFlash: hasFlashCard, options }, options);
      if (!auth.allowed) {
        return { success: false, reason: auth.reason, code: auth.code || auth.reason, details: auth.details };
      }

      let swapStack = null;
      if (swapStackId) {
        swapStack = (p.field || []).find(st => st.id === swapStackId || st.top?.id === swapStackId);
        if (!swapStack) return { success: false, reason: 'CHANGE_TARGET_NOT_FOUND' };
      }

      let rawCost = options.cost;
      if (rawCost == null) {
        const m = String(card.effect || '').match(/\[Change:\s*Cost\s+(\d+)/i);
        rawCost = m ? parseInt(m[1], 10) : (card.changeCost ?? card.cost ?? 0);
      }
      const changeShim = { ...card, cost: Number(rawCost) || 0 };
      const effectiveCost = options.free ? 0 : calculateEffectiveCost(state, changeShim, playerSide);
      if (effectiveCost > 0) {
        if (!canAffordCost(state, effectiveCost, playerSide)) {
          return { success: false, reason: 'INSUFFICIENT_CORES' };
        }
        const plan = (Array.isArray(options.payment) && options.payment.length > 0)
          ? options.payment
          : buildPaymentPlan(state, effectiveCost, playerSide);
        if (!plan) return { success: false, reason: 'INSUFFICIENT_CORES' };
        const payRes = await payCost(state, effectiveCost, plan, playerSide, events);
        if (!payRes.success) return { success: false, reason: payRes.reason || 'PAYMENT_FAILED' };
      }

      const allChangeAbs = card.compiledIr?.abilities || card.abilities || [];
      let changeAbs = allChangeAbs.filter(ab =>
        /change/i.test(String(ab?.header?.keyword || '')) ||
        (ab?.header?.prefixes || []).some(pr => /change/i.test(String(pr)))
      );
      if (changeAbs.length === 0) {
        changeAbs = allChangeAbs.filter(ab => ab?.header?.isFlash || String(ab?.header?.timing || '').toUpperCase() === 'FLASH');
      }
      const abilityResults = [];
      for (const ab of changeAbs) {
        const res = await resolver.resolveAbility(state, ab, {
          controller: playerSide,
          sourceCard: card,
          activationOrigin: 'Change',
          usedViaKeyword: 'Change'
        }, events);
        abilityResults.push(res);
      }

      let returnedCard = null;
      if (swapStack) {
        returnedCard = swapStack.top;
        p.hand = (p.hand || []).filter(c => c.id !== card.id);
        p.hand.push(returnedCard);
        swapStack.top = card;
        if (options.preserveState !== true) swapStack.state = 'REFRESHED';
        await events.emit({
          type: 'CHANGE',
          card,
          returnedCard,
          stack: swapStack,
          player: playerSide
        });
      }
      await events.emit({
        type: 'CHANGE_EXECUTED',
        card,
        returnedCard,
        stack: swapStack,
        player: playerSide,
        costPaid: effectiveCost
      });
      await checkStateBasedActions(state, events);
      return { success: true, card, returnedCard, stack: swapStack, costPaid: effectiveCost, swapped: Boolean(swapStack), abilityResults };
    }
  };

  // Resolve card-owned destruction triggers through the same compiled IR
  // path as summon and attack triggers.
  events.on('DESTROYED', async event => {
    const card = event.card;
    if (!card?.compiledIr?.abilities) return;
    const controller = card.owner || event.fromSide || 'player';
    const wasDestroyedByOpponent = (event.by === 'self' ? (event.sourceCard?.owner || event.fromSide) : event.by) !== controller;
    for (const ability of card.compiledIr.abilities) {
      if (ability.header.timing !== 'WHEN_DESTROYED' && ability.header.timing !== 'WHEN_SUMMONED_OR_DESTROYED') continue;
      if ((ability.header.timingCause === 'OPPONENT' || ability.header.timingCause === 'OPPOSING_SPIRIT_EFFECT' || /by the opponent/i.test(ability.header.timingLabel || '')) && !wasDestroyedByOpponent) continue;
      if (event.level && ability.header.levels?.length && !ability.header.levels.includes(event.level)) continue;
      await resolver.resolveAbility(state, ability, {
        controller,
        sourceCard: card,
        wasDestroyedByOpponent,
        destroyEvent: event
      }, events);
    }
  });

  events.on('SUMMONED', async event => {
    if (event.skipCardTriggers) return;
    const card = event.card;
    if (!card?.compiledIr?.abilities) return;
    for (const ability of card.compiledIr.abilities) {
      if (ability.header.timing !== 'WHEN_SUMMONED' && ability.header.timing !== 'WHEN_SUMMONED_OR_DESTROYED') continue;
      if (ability.header.activationRestrictions?.includes('PAID_ORIGINAL_COST') && event.paidOriginalCost === false) continue;
      const level = event.stack ? computeLevel(event.stack, state) : 1;
      if (ability.header.levels?.length && !ability.header.levels.includes(level)) continue;
      await resolver.resolveAbility(state, ability, {
        controller: event.player || card.owner,
        sourceCard: card,
        sourceStack: event.stack || null,
        summonFromRemoved: event.fromZone === 'removed'
      }, events);
    }
  });

  events.on('ADVENTS', async event => {
    const card = event.card;
    if (!card || (card.type !== 'Spirit' && card.type !== 'Brave')) return;
    for (const stack of state.players[event.player]?.field || []) {
      for (const ability of stack.top?.compiledIr?.abilities || []) {
        if (ability.header?.timing !== 'WHEN_TARGET_SPIRIT_BRAVE_SUMMONED') continue;
        const level = computeLevel(stack, state);
        if (ability.header.levels?.length && !ability.header.levels.includes(level)) continue;
        const triggerOp = ability.clauses?.find(clause => clause.op)?.op;
        if (!triggerOp || !matchesCardFilter(card, triggerOp.filter)) continue;
        await resolver.resolveAbility(state, ability, { controller: event.player, sourceCard: stack.top, sourceStack: stack, summonedCard: card }, events);
      }
    }
  });

  events.on('SUMMONED', async event => {
    const summoned = event.card;
    const type = String(summoned?.type || '');
    if (type !== 'Spirit' && type !== 'Brave') return;
    for (const stack of state.players[event.player]?.field || []) {
      for (const ability of stack.top?.compiledIr?.abilities || []) {
        if (ability.header?.timing !== 'WHEN_TARGET_SPIRIT_BRAVE_SUMMONED') continue;
        const level = computeLevel(stack, state);
        if (ability.header.levels?.length && !ability.header.levels.includes(level)) continue;
        const triggerOp = ability.clauses?.find(clause => clause.op)?.op;
        if (!triggerOp || !matchesCardFilter(summoned, triggerOp.filter)) continue;
        await resolver.resolveAbility(state, ability, { controller: event.player, sourceCard: stack.top, sourceStack: stack, summonedCard: summoned }, events);
      }
    }
  });

  events.on('DEPLOYED', async event => {
    const card = event.card;
    if (!card?.compiledIr?.abilities) return;
    for (const ability of card.compiledIr.abilities) {
      if (ability.header.timing !== 'WHEN_DEPLOYED') continue;
      await resolver.resolveAbility(state, ability, { controller: event.player || card.owner, sourceCard: card, sourceStack: event.stack || null }, events);
    }
  });

  events.on('ATTACK_DECLARED', async event => {
    const attacker = event.attacker?.top || event.attacker?.card || event.card;
    if (!attacker || !String(attacker.type || '').includes('Spirit')) return;
    const families = Array.isArray(attacker.families) ? attacker.families : [attacker.family].filter(Boolean);
    if (!families.some(family => String(family).toLowerCase() === 'god-king')) return;
    const side = event.player || attacker.owner;
    const burstCard = state.players[side]?.burst;
    for (const ability of burstCard?.compiledIr?.abilities || []) {
      if (ability.header?.timing !== 'WHEN_GODKING_ATTACKS') continue;
      await resolver.resolveAbility(state, ability, { controller: side, sourceCard: burstCard }, events);
    }
  });

  events.on('CARDS_REVEALED', async event => {
    const isBombardment = (event.sourceCard?.compiledIr?.keywords || []).some(keyword => String(keyword.hook || '').toLowerCase() === 'bombardment');
    if (!isBombardment) return;
    for (const card of event.cards || []) {
      for (const ability of card.compiledIr?.abilities || []) {
        if (ability.header?.timing !== 'WHEN_REVEALED_BY_BOMBARDMENT') continue;
        await resolver.resolveAbility(state, ability, { controller: event.player, sourceCard: card, revealEvent: event }, events);
      }
    }
  });

  events.on('BEFORE_LIFE_REDUCED', async event => {
    const effectController = event?.by === 'self' ? event.sourceCard?.owner : event?.by;
    if (!event || event.cause === 'cost' || event.cause === 'rule' || effectController === event.player) return;
    const defender = state.players[event.player];
    const availableCards = [...(defender.hand || []), ...(defender.removed || [])];
    for (const card of availableCards) {
      for (const ability of card.compiledIr?.abilities || []) {
        if (ability.header?.timing !== 'WHEN_OPPONENT_WOULD_REDUCE_LIFE') continue;
        await resolver.resolveAbility(state, ability, { controller: event.player, sourceCard: card, pendingLifeLoss: event }, events);
        if (event.prevented) return;
      }
    }
  });

  keywords.attachToGame(game);

  const windows = new TimingWindowManager(game);
  const triggers = new TriggerQueueManager(game);
  game.windows = windows;
  game.triggers = triggers;
  game.promptManager = promptManager;

  events.on('CARD_MOVED', ev => {
    if (ev.fromZone === 'field' && ev.card?.id) {
      triggers.cancelTriggersForCard(ev.card.id, 'SOURCE_LEFT_FIELD');
    }
  });

  events.on('LIFE_REDUCED', async (ev) => {
    await windows.openBurstWindow(ev);
  });
  events.on('DESTROYED', async (ev) => {
    await windows.openBurstWindow(ev);
  });
  events.on('SUMMONED', async ev => {
    await windows.openBurstWindow(ev);
  });
  events.on('SUMMONED', async (ev) => {
    const controller = ev.player;
    const p = state.players[controller];
    if (!p) return;
    const allStacks = [...(p.field || []), ...(p.nexus || []).map(n => ({ top: n, cores: { normal: 1, soul: 0 } }))];
    for (const st of allStacks) {
      if (st.top && st.top.compiledIr) {
        const lv = computeLevel(st, state);
        for (const ab of st.top.compiledIr.abilities || []) {
          if (ab.header && ab.header.timing === 'PASSIVE') {
            if (!ab.header.levels || ab.header.levels.includes(lv)) {
              for (const cl of ab.clauses || []) {
                if (cl.op && cl.op.trigger === 'ON_SUMMON') {
                  state.modifiers.push({
                    id: `mod_${Date.now()}_summon_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'BP_BUFF',
                    targetStackId: ev.stack ? ev.stack.id : null,
                    amount: cl.op.amount || 1000,
                    duration: 'THIS_TURN',
                    sourceCardId: st.top.id
                  });
                }
              }
            }
          }
        }
      }
    }
  });

  return game;
}
