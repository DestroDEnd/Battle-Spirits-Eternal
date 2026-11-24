/**
 * engine/response_window.js
 * 
 * Rules-Driven Priority & Response Window Engine for Battle Spirits Eternal (Phase M.3).
 * 
 * Implements centralized, authoritative response window lifecycles according to
 * Official Rule Manual [Eternal] Ver. 17.0:
 * - Attack Declaration & Trigger Resolution
 * - First Flash Timing (FLASH_1): Defender priority 1, alternating priority, 2 consecutive passes to close
 * - Block Declaration Step: Manual defender blocker selection or pass
 * - Second Flash Timing (FLASH_2): Opened only if block declared, defender priority 1
 * - Skip Second Flash Timing if unblocked -> Direct Hit resolution
 * - Action Progression Locking: Non-priority players cannot act or advance steps
 * - Integration with Interaction Protocol, Session Manager, and Persistence
 */

import { moveCard, moveCore } from './zones.js';
import { calculateEffectiveCost } from './payment.js';
import { computeLevel, computeEffectiveBP, computeSymbols, canAttack, canBlock, isActionRestricted, getActiveStackKeywords } from './continuous.js';
import { stabilizeGameState, checkStateBasedActions } from './sba.js';
import { createInteractionRequest, INTERACTION_TYPES, INTERACTION_STATUS } from './interaction.js';
import { generateSecureToken } from './session_mode.js';
import { evaluateStructuredCondition, CONDITION_RESULT } from './conditions.js';

export const RESPONSE_WINDOW_TYPES = Object.freeze({
  FLASH_1: 'FLASH_1',
  BLOCK_DECLARATION: 'BLOCK_DECLARATION',
  FLASH_2: 'FLASH_2',
  BURST: 'BURST',
  MAIN_ACTION: 'MAIN_ACTION',
  ATTACK_DECLARATION: 'ATTACK_DECLARATION',
  FLASH: 'FLASH',
  BATTLE_RESOLUTION: 'BATTLE_RESOLUTION',
  TRIGGER_RESOLUTION: 'TRIGGER_RESOLUTION',
  CARD_PLAY: 'CARD_PLAY',
  EFFECT_RESOLUTION: 'EFFECT_RESOLUTION',
  INTERRUPT: 'INTERRUPT',
  REPLACEMENT: 'REPLACEMENT',
  OPTIONAL_DECISION: 'OPTIONAL_DECISION',
  END_OF_STEP: 'END_OF_STEP',
  END_OF_TURN: 'END_OF_TURN',
  GENERAL_RESPONSE: 'GENERAL_RESPONSE'
});

export const WINDOW_TYPES = RESPONSE_WINDOW_TYPES;

export const RESPONSE_WINDOW_STATUS = Object.freeze({
  OPEN: 'OPEN',
  SUSPENDED: 'SUSPENDED',
  RESOLVING: 'RESOLVING',
  CLOSED: 'CLOSED'
});

export const WINDOW_STATUS = RESPONSE_WINDOW_STATUS;

let nextWindowSeq = 1;

export function resetWindowCounter() {
  nextWindowSeq = 1;
}

export class ResponseWindowManager {
  constructor(gameOrState, events = null) {
    if (gameOrState && gameOrState.state) {
      this.game = gameOrState;
    } else {
      this.game = { state: gameOrState, events };
    }
    this.windowStack = [];
    const initialStack = this.state?.responseWindowStack || (this.state?.responseWindow ? [this.state.responseWindow] : []);
    if (initialStack && initialStack.length > 0) {
      for (const w of initialStack) {
        this.windowStack.push(w);
      }
      const cur = this.getCurrentWindow();
      if (cur) {
        this.refreshWindowCandidates(cur);
      }
    }
  }

  get state() {
    return this.game.state;
  }

  get events() {
    return this.game.events;
  }

  get activeWindow() {
    return this.getCurrentWindow();
  }

  getCurrentWindow() {
    return this.windowStack.length > 0 ? this.windowStack[this.windowStack.length - 1] : null;
  }

  getPriorityPlayer() {
    const win = this.getCurrentWindow();
    return win ? win.priorityPlayer : null;
  }

  isResponseWindowActive() {
    const win = this.getCurrentWindow();
    return Boolean(win && (
      win.resolutionStatus === RESPONSE_WINDOW_STATUS.OPEN ||
      win.resolutionStatus === RESPONSE_WINDOW_STATUS.RESOLVING ||
      win.status === RESPONSE_WINDOW_STATUS.OPEN ||
      win.status === RESPONSE_WINDOW_STATUS.RESOLVING
    ));
  }

  /**
   * Opens a new authoritative response window, suspending any active parent window.
   */
  async openWindow({
    windowType,
    type,
    timing = null,
    originatingAction = null,
    activePlayer = null,
    opposingPlayer = null,
    attackerStackId = null,
    attackerSide = null,
    defenderSide = null,
    priorityPlayer = null,
    eligiblePlayers = null,
    eligibleActions = null,
    sourceEvent = null,
    sourceAbility = null,
    interruptible = true,
    resumable = true
  }) {
    const state = this.state;
    const parent = this.getCurrentWindow();
    if (parent && !parent.interruptible && parent.interruptible !== undefined) {
      throw new Error(`WINDOW_NOT_INTERRUPTIBLE: Cannot open ${windowType || type} inside ${parent.windowType || parent.type}`);
    }
    if (parent && parent.resolutionStatus === RESPONSE_WINDOW_STATUS.OPEN) {
      parent.resolutionStatus = RESPONSE_WINDOW_STATUS.SUSPENDED;
      parent.status = RESPONSE_WINDOW_STATUS.SUSPENDED;
    }

    const effectiveType = windowType || type || RESPONSE_WINDOW_TYPES.GENERAL_RESPONSE;
    const turnActive = activePlayer || state.activePlayer || 'player';
    const turnOpposing = opposingPlayer || (turnActive === 'player' ? 'opponent' : 'player');
    const atkSide = attackerSide || (state.combat ? state.combat.attackerSide : turnActive);
    const defSide = defenderSide || (atkSide === 'player' ? 'opponent' : 'player');

    // Default priority: Defender gets priority first in FLASH_1, BLOCK_DECLARATION, and FLASH_2
    let initialPriority = priorityPlayer;
    if (!initialPriority) {
      if (effectiveType === RESPONSE_WINDOW_TYPES.FLASH_1 ||
          effectiveType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION ||
          effectiveType === RESPONSE_WINDOW_TYPES.FLASH_2) {
        initialPriority = defSide;
      } else {
        initialPriority = turnActive;
      }
    }

    const windowId = `win_m3_${nextWindowSeq++}`;
    const timingName = timing || (
      effectiveType === RESPONSE_WINDOW_TYPES.FLASH_1 ? 'FIRST_FLASH_TIMING' :
      effectiveType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION ? 'BLOCK_TIMING' :
      effectiveType === RESPONSE_WINDOW_TYPES.FLASH_2 ? 'SECOND_FLASH_TIMING' :
      'GENERAL_TIMING'
    );

    const win = {
      windowId,
      id: windowId, // backward-compat alias
      windowType: effectiveType,
      type: effectiveType, // backward-compat alias
      timing: timingName,
      originatingAction,
      activePlayer: turnActive,
      opposingPlayer: turnOpposing,
      attackerStackId: attackerStackId || (state.combat ? state.combat.attackerStackId : null),
      attackerSide: atkSide,
      defenderSide: defSide,
      priorityPlayer: initialPriority,
      eligiblePlayers: eligiblePlayers || [defSide, atkSide],
      eligibleActions: eligibleActions ? [...eligibleActions] : null,
      legalActions: eligibleActions ? [...eligibleActions] : null,
      legalResponseCandidates: [],
      consecutivePasses: 0,
      responseHistory: [],
      resolutionStatus: RESPONSE_WINDOW_STATUS.OPEN,
      status: RESPONSE_WINDOW_STATUS.OPEN, // backward-compat alias
      originatingInteractionId: null,
      parentWindowId: parent ? (parent.windowId || parent.id) : null,
      sourceEvent,
      sourceAbility,
      interruptible: Boolean(interruptible),
      resumable: Boolean(resumable),
      createdAt: Date.now(),
      version: 1
    };

    // Calculate legal actions and response candidates for initial priority owner
    this.refreshWindowCandidates(win);

    this.windowStack.push(win);
    state.responseWindow = win;
    state.responseWindowStack = [...this.windowStack];

    // Create corresponding interaction on InteractionController unless caller manages prompt directly (e.g. openBurstWindow)
    if (!arguments[0]?.skipInteractionSync) {
      this._syncInteraction(win);
    }

    if (this.events) {
      await this.events.emit({
        type: 'RESPONSE_WINDOW_OPENED',
        windowId: win.windowId,
        windowType: win.windowType,
        timing: win.timing,
        priorityPlayer: win.priorityPlayer,
        attackerSide: win.attackerSide,
        defenderSide: win.defenderSide
      });
      await this.events.emit({
        type: 'TIMING_WINDOW_OPENED',
        windowId: win.id,
        windowType: win.type,
        parentWindowId: win.parentWindowId,
        priorityPlayer: win.priorityPlayer
      });
    }

    return win;
  }

  /**
   * Refreshes legal action candidates for current priority player.
   */
  refreshWindowCandidates(win) {
    if (!win) return;
    const currentPriority = win.priorityPlayer;

    if (win.windowType === RESPONSE_WINDOW_TYPES.FLASH_1 || win.windowType === RESPONSE_WINDOW_TYPES.FLASH_2 || win.windowType === 'FLASH') {
      const flashActions = ['PASS', 'CAST_FLASH_MAGIC', 'ACTIVATE_FLASH_ABILITY', 'HIGH_SPEED_SUMMON', 'USE_ACCEL'];
      win.legalActions = Array.from(new Set([...(win.eligibleActions || []), ...flashActions]));
      win.legalResponseCandidates = this.calculateFlashCandidates(currentPriority, win.attackerSide);
    } else if (win.windowType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      const blockActions = ['DECLARE_BLOCK', 'PASS_BLOCK'];
      win.legalActions = Array.from(new Set([...(win.eligibleActions || []), ...blockActions]));
      win.legalResponseCandidates = this.calculateBlockerCandidates(win.defenderSide);
    } else {
      win.legalActions = (win.eligibleActions && win.eligibleActions.length > 0)
        ? [...win.eligibleActions]
        : ['PASS'];
      win.legalResponseCandidates = [{ action: 'PASS', label: 'Pass Priority' }];
    }
  }

  /**
   * Synchronizes window state to InteractionController (`state.pendingInteractions`).
   */
  _syncInteraction(win) {
    if (!this.game?.interactionController) return;
    const state = this.state;

    // Cancel old interaction from this window if advancing priority
    if (win.originatingInteractionId) {
      const old = (state.pendingInteractions || []).find(i => i.id === win.originatingInteractionId || i.interactionId === win.originatingInteractionId);
      if (old && (old.status === INTERACTION_STATUS.WAITING_FOR_PLAYER || old.status === 'pending')) {
        old.status = INTERACTION_STATUS.COMPLETED;
      }
    }

    const interactionType = win.windowType === RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION
      ? INTERACTION_TYPES.SELECT_BLOCKER
      : INTERACTION_TYPES.FLASH_ACTION;

    const title = win.windowType === RESPONSE_WINDOW_TYPES.FLASH_1
      ? `First Flash Timing - ${win.priorityPlayer}'s Priority`
      : win.windowType === RESPONSE_WINDOW_TYPES.FLASH_2
      ? `Second Flash Timing - ${win.priorityPlayer}'s Priority`
      : `Block Declaration Step - ${win.priorityPlayer}`;

    const candidates = (win.legalResponseCandidates || []).map((cand, idx) => ({
      candidateId: cand.cardId || cand.stackId || `action_${idx}`,
      action: cand.action,
      cardId: cand.cardId || null,
      stackId: cand.stackId || null,
      cost: cand.cost !== undefined ? cand.cost : 0,
      label: cand.label || cand.action,
      raw: cand
    }));

    const interaction = createInteractionRequest({
      matchId: state.matchContext?.matchId || 'local_match',
      requestType: interactionType,
      type: interactionType,
      decisionOwner: win.priorityPlayer,
      player: win.priorityPlayer,
      timingWindow: win.timing,
      mandatory: false,
      optional: true,
      allowedActions: win.legalActions,
      candidates,
      title,
      description: `Authoritative response opportunity for ${win.priorityPlayer}`,
      context: {
        windowId: win.windowId,
        windowType: win.windowType,
        timing: win.timing,
        attackerStackId: win.attackerStackId,
        attackerSide: win.attackerSide,
        defenderSide: win.defenderSide
      }
    });

    win.originatingInteractionId = interaction.interactionId;
    if (!Array.isArray(state.pendingInteractions)) {
      state.pendingInteractions = [];
    }
    state.pendingInteractions.push(interaction);
  }

  /**
   * Closes the top or specified response window and resumes any suspended parent.
   */
  async closeWindow(windowId = null) {
    if (this.windowStack.length === 0) return null;
    const top = this.windowStack[this.windowStack.length - 1];
    if (windowId && top.windowId !== windowId && top.id !== windowId) {
      throw new Error(`WINDOW_STACK_ORDER_ERROR: Expected top window "${top.windowId}", got "${windowId}"`);
    }

    const closed = this.windowStack.pop();
    closed.resolutionStatus = RESPONSE_WINDOW_STATUS.CLOSED;
    closed.status = RESPONSE_WINDOW_STATUS.CLOSED;

    // Complete associated interaction
    if (closed.originatingInteractionId && this.game.interactionController) {
      const inter = (this.state.pendingInteractions || []).find(i => i.id === closed.originatingInteractionId);
      if (inter && inter.status === INTERACTION_STATUS.WAITING_FOR_PLAYER) {
        inter.status = INTERACTION_STATUS.RESOLVED;
      }
      this.state.pendingInteractions = this.game.interactionController.getPendingInteractions();
    }

    const parent = this.getCurrentWindow();
    if (parent && parent.resolutionStatus === RESPONSE_WINDOW_STATUS.SUSPENDED) {
      parent.resolutionStatus = RESPONSE_WINDOW_STATUS.OPEN;
      parent.status = RESPONSE_WINDOW_STATUS.OPEN;
      this.refreshWindowCandidates(parent);
      this._syncInteraction(parent);
    }

    this.state.responseWindow = parent || null;
    this.state.responseWindowStack = [...this.windowStack];

    if (this.events) {
      await this.events.emit({
        type: 'RESPONSE_WINDOW_CLOSED',
        windowId: closed.windowId,
        windowType: closed.windowType,
        timing: closed.timing,
        resumedParentWindowId: parent ? parent.windowId : null
      });
      await this.events.emit({
        type: 'TIMING_WINDOW_CLOSED',
        windowId: closed.id || closed.windowId,
        windowType: closed.type || closed.windowType,
        resumedParentWindowId: parent ? (parent.id || parent.windowId) : null
      });
    }

    return closed;
  }

  /**
   * Validates whether playerSide is permitted to perform actionType in the current window.
   */
  canPerformAction(actionType, playerSide) {
    const win = this.getCurrentWindow();
    if (!win) {
      return { allowed: true, window: null };
    }
    const status = win.resolutionStatus || win.status;
    if (status !== RESPONSE_WINDOW_STATUS.OPEN) {
      return { allowed: false, reason: 'WINDOW_NOT_OPEN', window: win };
    }
    if (win.priorityPlayer !== playerSide) {
      return {
        allowed: false,
        reason: 'NOT_PRIORITY_PLAYER',
        currentPriority: win.priorityPlayer,
        attemptedPlayer: playerSide,
        window: win
      };
    }
    const actions = win.legalActions || win.eligibleActions || [];
    if (!actions.includes(actionType)) {
      return {
        allowed: false,
        reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW',
        legalActions: actions,
        attemptedAction: actionType,
        window: win
      };
    }
    return { allowed: true, window: win };
  }

  /**
   * Backward-compatibility alias for calculateFlashCandidates.
   */
  getAvailableFlashActions(playerSide, turnAttackerSide) {
    return this.calculateFlashCandidates(playerSide, turnAttackerSide);
  }

  /**
   * Evaluates Burst triggers following an event.
   * In Eternal 17.0: Simultaneous declaration with hand triggers.
   * Declaration Priority: Non-turn player declares first, then Turn player.
   * Resolution: Declared Bursts resolve in FIFO order.
   */
  async openBurstWindow(triggerEvent) {
    const { state, resolver } = this.game;
    const activePlayer = state.activePlayer;
    const inactivePlayer = activePlayer === 'player' ? 'opponent' : 'player';

    const win = await this.openWindow({
      type: RESPONSE_WINDOW_TYPES.BURST,
      windowType: RESPONSE_WINDOW_TYPES.BURST,
      activePlayer,
      priorityPlayer: inactivePlayer,
      eligibleActions: ['ACTIVATE_BURST', 'PASS'],
      sourceEvent: triggerEvent,
      skipInteractionSync: true
    });

    try {
      const declarationOrder = [inactivePlayer, activePlayer];
      const declaredBursts = [];

      for (const side of declarationOrder) {
        const p = state.players[side];
        if (!p?.burst) continue;

        const burstCard = p.burst;
        if (!this.matchesBurstCondition(burstCard, triggerEvent, side)) {
          continue;
        }

        const isLocked = (state.modifiers || []).some(m =>
          (m.type === 'BURST_LOCK' && (!m.side || m.side === 'both' || m.side === side)) ||
          (m.type === 'SET_RESTRICTION' && (!m.side || m.side === 'both' || m.side === side) && String(m.restriction || '').toUpperCase() === 'CANNOT_ACTIVATE_BURST')
        );
        if (isLocked) continue;

        win.priorityPlayer = side;
        const decision = await resolver.promptResolver.choose({
          type: 'BURST_TRIGGER',
          title: `Activate Burst [${burstCard.name}]?`,
          burstCard,
          chooser: side,
          optional: true
        });

        if (decision && decision.activate) {
          p.burst = null;
          declaredBursts.push({ side, burstCard });

          await this.game.events.emit({
            type: 'BURST_DECLARED',
            card: burstCard,
            player: side,
            triggerEvent
          });
        }
      }

      win.status = RESPONSE_WINDOW_STATUS.RESOLVING;
      win.resolutionStatus = RESPONSE_WINDOW_STATUS.RESOLVING;
      for (const { side, burstCard } of declaredBursts) {
        const p = state.players[side];

        await this.game.events.emit({
          type: 'BURST_ACTIVATED',
          card: burstCard,
          player: side,
          triggerEvent
        });

        if (burstCard.compiledIr && burstCard.compiledIr.abilities) {
          for (const ab of burstCard.compiledIr.abilities) {
            if (ab.header.timing === 'BURST') {
              await resolver.resolveAbility(state, ab, { controller: side, sourceCard: burstCard, activeBurstCard: burstCard }, this.game.events);
            }
          }
        }

        const onField = (p.field || []).some(st => st.top.id === burstCard.id);
        if (!onField) {
          await moveCard(state, burstCard, 'grave', side, { cause: 'burst_resolved' }, this.game.events);
        }
      }
    } finally {
      if (this.getCurrentWindow()?.id === win.id || this.getCurrentWindow()?.windowId === win.windowId) {
        await this.closeWindow(win.windowId || win.id);
      }
    }
  }

  matchesBurstCondition(burstCard, event, side) {
    if (!burstCard.compiledIr || !burstCard.compiledIr.abilities) {
      // Explicit legacy compatibility fallback for uncompiled test cards without compiledIr
      const eff = (burstCard.effect || '').toLowerCase();
      if (event.type === 'LIFE_REDUCED' && eff.includes('life is reduced') && event.player === side) return true;
      if (event.type === 'DESTROYED' && eff.includes('destroyed by the opponent') && (!event.card || event.card.owner === side) && event.by !== side) return true;
      return false;
    }

    const burstAb = burstCard.compiledIr.abilities.find(a => a.header.timing === 'BURST');
    if (!burstAb || !burstAb.header.burstCondition) return false;

    // Evaluate structured condition AST on burst ability if present
    if (burstAb.condition) {
      const evalRes = evaluateStructuredCondition(this.game.state, burstAb.condition, {
        controller: side,
        sourceCard: burstCard,
        triggerEvent: event
      });
      if (evalRes.result !== CONDITION_RESULT.TRUE) {
        return false;
      }
    }

    const cond = burstAb.header.burstCondition;
    const oppSide = side === 'player' ? 'opponent' : 'player';

    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side) && event.by === oppSide;
    }

    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side);
    }

    if (cond === 'AFTER_YOUR_SPIRIT_DEPLETED') {
      return (event.type === 'DESTROYED' && event.cause === 'depletion' && (!event.card || event.card.owner === side)) ||
        (event.type === 'SPIRIT_DEPLETED' && (event.card ? event.card.owner === side : event.player === side));
    }

    if (cond === 'AFTER_YOUR_LIFE_REDUCED') {
      return event.type === 'LIFE_REDUCED' && event.player === side;
    }

    if (cond === 'AFTER_OPPONENT_SUMMON_EFFECT' || cond === 'AFTER_OPPONENT_SUMMON') {
      return event.type === 'SUMMONED' && event.player === oppSide && (!event.card || !event.card.isVanilla);
    }

    if (cond === 'AFTER_OPPONENT_ATTACK') {
      return event.type === 'ATTACK_DECLARED' && event.player === oppSide;
    }

    return false;
  }

  /**
   * Legacy runFlashWindow compatibility helper.
   */
  async runFlashWindow(flashTiming = 'FLASH_1') {
    const { state, resolver } = this.game;
    const attackerSide = state.activePlayer;
    const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';

    const win = await this.openWindow({
      type: RESPONSE_WINDOW_TYPES.FLASH,
      windowType: flashTiming === 'FLASH_2' ? RESPONSE_WINDOW_TYPES.FLASH_2 : RESPONSE_WINDOW_TYPES.FLASH_1,
      activePlayer: attackerSide,
      priorityPlayer: defenderSide,
      eligibleActions: ['PASS', 'CAST_FLASH_MAGIC', 'HIGH_SPEED_SUMMON', 'ACTIVATE_FLASH_ABILITY', 'USE_ACCEL'],
      sourceEvent: { type: 'FLASH_WINDOW', timing: flashTiming }
    });

    if (this.game.events) {
      await this.game.events.emit({
        type: 'FLASH_WINDOW_OPEN',
        timing: flashTiming,
        firstPriority: defenderSide,
        windowId: win.id
      });
    }

    try {
      while (win.consecutivePasses < 2 && !state.winner) {
        const currentPriority = win.priorityPlayer;
        const availableActions = this.getAvailableFlashActions(currentPriority, attackerSide);

        const decision = await resolver.promptResolver.choose({
          type: 'FLASH_ACTION',
          title: `Flash Window (${flashTiming}) - ${currentPriority}'s Turn`,
          availableActions,
          chooser: currentPriority,
          windowId: win.id
        });

        if (!decision || decision.action === 'PASS' || !decision.action) {
          win.consecutivePasses++;
          win.priorityPlayer = currentPriority === 'player' ? 'opponent' : 'player';
        } else {
          const check = this.canPerformAction(decision.action, currentPriority);
          if (!check.allowed) {
            throw new Error(`ILLEGAL_FLASH_ACTION: ${check.reason}`);
          }
          win.consecutivePasses = 0;
          await this.handleFlashAction(decision, currentPriority);
          win.priorityPlayer = currentPriority === 'player' ? 'opponent' : 'player';
        }
      }

      if (this.game.events) {
        await this.game.events.emit({
          type: 'FLASH_WINDOW_CLOSED',
          timing: flashTiming,
          windowId: win.id
        });
      }
    } finally {
      if (this.getCurrentWindow()?.id === win.id) {
        await this.closeWindow(win.id);
      }
    }
  }

  /**
   * Submits an authoritative response to the current response window.
   */
  async submitResponse(response, authContext = {}) {
    const win = this.getCurrentWindow();
    if (!win || win.resolutionStatus !== RESPONSE_WINDOW_STATUS.OPEN) {
      return { success: false, reason: 'NO_ACTIVE_RESPONSE_WINDOW' };
    }

    const playerSide = authContext.responder || response.player || response.responder || win.priorityPlayer;
    const check = this.canPerformAction(response.action, playerSide);
    if (!check.allowed) {
      return { success: false, reason: check.reason, details: check };
    }

    // 1. Handling PASS in Flash Timings
    if (response.action === 'PASS' || response.action === 'PASS_PRIORITY') {
      return await this.passPriority(playerSide);
    }

    // 2. Handling PASS_BLOCK / NO_BLOCK in Block Declaration Step
    if (response.action === 'PASS_BLOCK' || response.action === 'NO_BLOCK') {
      return await this.handlePassBlock(playerSide);
    }

    // 3. Handling Block Declaration
    if (response.action === 'DECLARE_BLOCK') {
      return await this.handleBlockDeclaration(response, playerSide);
    }

    // 4. Handling Flash Action (Magic, Ability, High Speed, Accel)
    return await this.handleFlashAction(response, playerSide);
  }

  /**
   * Passes priority in alternating Flash windows.
   * Closes window only after 2 consecutive passes.
   */
  async passPriority(playerSide) {
    const win = this.getCurrentWindow();
    if (!win) return { success: false, reason: 'NO_ACTIVE_WINDOW' };

    win.consecutivePasses++;
    win.responseHistory.push({
      action: 'PASS',
      player: playerSide,
      consecutivePasses: win.consecutivePasses,
      timestamp: Date.now()
    });

    if (this.events) {
      await this.events.emit({
        type: 'PRIORITY_PASSED',
        player: playerSide,
        windowId: win.windowId,
        consecutivePasses: win.consecutivePasses
      });
    }

    // Two consecutive passes -> Window closes!
    if (win.consecutivePasses >= 2) {
      const closed = await this.closeWindow(win.windowId);
      const postResult = await this.onWindowClosed(closed);
      return {
        success: true,
        closed: true,
        windowId: closed.windowId,
        windowType: closed.windowType,
        postResult
      };
    }

    // Priority alternates to opposing player
    win.priorityPlayer = (playerSide === 'player' ? 'opponent' : 'player');
    this.refreshWindowCandidates(win);
    this._syncInteraction(win);

    if (this.events) {
      await this.events.emit({
        type: 'PRIORITY_CHANGED',
        nextPriority: win.priorityPlayer,
        windowId: win.windowId
      });
    }

    return {
      success: true,
      closed: false,
      nextPriority: win.priorityPlayer,
      consecutivePasses: win.consecutivePasses
    };
  }

  /**
   * Handles Defender choosing not to block (Pass Block).
   * Skips Flash 2 and proceeds to Unblocked Direct Hit resolution.
   */
  async handlePassBlock(playerSide) {
    const win = this.getCurrentWindow();
    if (!win || win.windowType !== RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      return { success: false, reason: 'NOT_BLOCK_DECLARATION_WINDOW' };
    }

    // Enforce mustBlockIfAble rules (Clash, True-Clash)
    if (this.state.combat?.mustBlockIfAble) {
      const defPlayer = this.state.players[playerSide];
      const eligible = (defPlayer?.field || []).filter(st => st.state === 'REFRESHED' && canBlock(this.state, st));
      if (eligible.length > 0) {
        return { success: false, reason: 'MUST_BLOCK_IF_ABLE' };
      }
    }

    win.responseHistory.push({
      action: 'PASS_BLOCK',
      player: playerSide,
      timestamp: Date.now()
    });

    const closed = await this.closeWindow(win.windowId);

    // SKIPS FLASH 2! Proceeds directly to Direct Hit!
    const directHitResult = await this.game.resolveDirectHit(closed.attackerSide);

    return {
      success: true,
      blockDeclared: false,
      windowId: closed.windowId,
      skippedFlash2: true,
      battleResult: directHitResult
    };
  }

  /**
   * Handles Defender declaring a block with a specific blocker stack.
   * If valid: exhausts blocker, emits BLOCK_DECLARED, resolves WHEN_BLOCKS, and opens FLASH_2.
   */
  async handleBlockDeclaration(response, playerSide) {
    const win = this.getCurrentWindow();
    if (!win || win.windowType !== RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION) {
      return { success: false, reason: 'NOT_BLOCK_DECLARATION_WINDOW' };
    }

    const blockerStackId = response.stackId || response.blockerStackId;
    if (!blockerStackId) {
      return { success: false, reason: 'MISSING_BLOCKER_STACK_ID' };
    }

    const p = this.state.players[playerSide];
    const blockerStack = (p?.field || []).find(st => st.id === blockerStackId);
    if (!blockerStack) {
      return { success: false, reason: 'BLOCKER_NOT_FOUND' };
    }
    if (!canBlock(this.state, blockerStack)) {
      return { success: false, reason: 'CANNOT_BLOCK' };
    }

    // Exhaust blocker
    const prevState = blockerStack.state;
    blockerStack.state = prevState === 'EXHAUSTED' ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
    if (this.events) {
      await this.events.emit({
        type: 'CARD_EXHAUSTED',
        card: blockerStack.top,
        stack: blockerStack,
        player: playerSide,
        previousState: prevState,
        newState: blockerStack.state,
        cause: 'block'
      });
    }

    if (this.state.combat) {
      this.state.combat.blockerStackId = blockerStackId;
      this.state.combat.blockerSide = playerSide;
      this.state.combat.stage = 'FLASH_2';
    }

    if (this.events) {
      await this.events.emit({
        type: 'BLOCK_DECLARED',
        blocker: blockerStack,
        player: playerSide
      });
    }

    // Trigger (When Blocks) abilities
    if (blockerStack.top?.compiledIr?.abilities) {
      const blockerLevel = computeLevel(blockerStack, this.state);
      for (const ab of blockerStack.top.compiledIr.abilities) {
        if (ab.header?.timing === 'WHEN_BLOCKS' || ab.header?.timing === 'WHEN_ATTACKS_OR_BLOCKS' || ab.header?.timing === 'WHEN_BATTLES') {
          if (!ab.header.levels || ab.header.levels.includes(blockerLevel)) {
            await this.game.resolver.resolveAbility(this.state, ab, {
              controller: playerSide,
              sourceCard: blockerStack.top,
              sourceStack: blockerStack
            }, this.events || this.game.events);
          }
        }
      }
    }

    // Close block declaration window
    await this.closeWindow(win.windowId);

    // OPEN SECOND FLASH TIMING (FLASH_2)! Defender priority 1!
    const flash2Win = await this.openWindow({
      windowType: RESPONSE_WINDOW_TYPES.FLASH_2,
      timing: 'SECOND_FLASH_TIMING',
      attackerStackId: win.attackerStackId,
      attackerSide: win.attackerSide,
      defenderSide: win.defenderSide,
      priorityPlayer: win.defenderSide // Defender receives priority first in Flash 2!
    });

    return {
      success: true,
      blockDeclared: true,
      blockerStackId,
      openedFlash2: true,
      windowId: flash2Win.windowId
    };
  }

  /**
   * Executes a Flash action, resets consecutive passes, and alternates priority to opponent.
   */
  async handleFlashAction(response, playerSide) {
    const win = this.getCurrentWindow();
    if (!win) return { success: false, reason: 'NO_ACTIVE_WINDOW' };

    win.resolutionStatus = RESPONSE_WINDOW_STATUS.RESOLVING;

    try {
      // Execute the requested flash action
      let actionResult = null;
      if (response.action === 'CAST_FLASH_MAGIC' && response.cardId) {
        actionResult = typeof this.game.activateMagic === 'function'
          ? await this.game.activateMagic(response.cardId, response.paymentPlan || [], playerSide, { timing: 'FLASH' })
          : await this.game.playCard(response.cardId, response.paymentPlan || [], playerSide, { timing: 'FLASH' });
      } else if (response.action === 'ACTIVATE_FLASH_ABILITY' && response.cardId && response.abilityId) {
        actionResult = await this.game.activateAbility(response.cardId, response.abilityId, playerSide, { timing: 'FLASH' });
      } else if (response.action === 'HIGH_SPEED_SUMMON' && response.cardId) {
        const p = this.state.players[playerSide];
        const card = (p?.hand || []).find(c => c.id === response.cardId);
        if (card) {
          const { HighSpeedKeyword } = await import('./keywords/wave2.js');
          actionResult = await HighSpeedKeyword.executeHighSpeedSummon(this.game, card, playerSide);
        } else {
          actionResult = { success: false, reason: 'CARD_NOT_IN_HAND' };
        }
      } else if (response.action === 'USE_ACCEL' && response.cardId) {
        if (typeof this.game.executeAccel === 'function') {
          actionResult = await this.game.executeAccel(playerSide, response.cardId, { timing: 'FLASH' });
        } else {
          actionResult = { success: false, reason: 'ACCEL_NOT_SUPPORTED' };
        }
      } else {
        actionResult = { success: false, reason: 'UNKNOWN_FLASH_ACTION' };
      }

      // Phase M.3.2 Defect D: If action execution failed, do NOT reset consecutive passes or alternate priority!
      if (!actionResult || actionResult.success === false) {
        win.resolutionStatus = RESPONSE_WINDOW_STATUS.OPEN;
        return {
          success: false,
          reason: actionResult?.reason || actionResult?.code || 'FLASH_ACTION_FAILED',
          code: actionResult?.code || actionResult?.reason || 'FLASH_ACTION_FAILED',
          details: actionResult?.details || actionResult,
          actionExecuted: response.action,
          priorityPlayer: win.priorityPlayer,
          consecutivePasses: win.consecutivePasses
        };
      }

      if (actionResult.suspended) {
        win.pendingFlashResponse = {
          action: response.action,
          cardId: response.cardId || null,
          player: playerSide
        };
        return {
          success: true,
          suspended: true,
          status: 'AWAITING_INTERACTION',
          interactionId: actionResult.interactionId,
          interaction: actionResult.interaction,
          actionExecuted: response.action,
          priorityPlayer: win.priorityPlayer,
          result: actionResult
        };
      }

      // Stabilize state and resolve any resulting triggered effects completely
      await stabilizeGameState(this.state, this.events);

      // Successfully resolved Flash: RESET consecutive passes to 0!
      win.consecutivePasses = 0;
      win.responseHistory.push({
        action: response.action,
        cardId: response.cardId || null,
        player: playerSide,
        timestamp: Date.now()
      });

      // Priority alternates to opponent!
      win.priorityPlayer = (playerSide === 'player' ? 'opponent' : 'player');
      win.resolutionStatus = RESPONSE_WINDOW_STATUS.OPEN;

      this.refreshWindowCandidates(win);
      this._syncInteraction(win);

      if (this.events) {
        await this.events.emit({
          type: 'FLASH_ACTION_RESOLVED',
          action: response.action,
          player: playerSide,
          nextPriority: win.priorityPlayer,
          windowId: win.windowId
        });
      }

      return {
        success: true,
        actionExecuted: response.action,
        nextPriority: win.priorityPlayer,
        consecutivePasses: 0,
        result: actionResult
      };
    } catch (err) {
      win.resolutionStatus = RESPONSE_WINDOW_STATUS.OPEN;
      throw err;
    }
  }

  async finalizeSuspendedFlashAction() {
    const win = this.getCurrentWindow();
    if (!win || !win.pendingFlashResponse) return null;
    const pending = win.pendingFlashResponse;
    delete win.pendingFlashResponse;

    await stabilizeGameState(this.state, this.events);
    win.consecutivePasses = 0;
    win.responseHistory.push({
      action: pending.action,
      cardId: pending.cardId || null,
      player: pending.player,
      timestamp: Date.now()
    });
    win.priorityPlayer = (pending.player === 'player' ? 'opponent' : 'player');
    win.resolutionStatus = RESPONSE_WINDOW_STATUS.OPEN;
    this.refreshWindowCandidates(win);
    this._syncInteraction(win);

    if (this.events) {
      await this.events.emit({
        type: 'FLASH_ACTION_RESOLVED',
        action: pending.action,
        player: pending.player,
        nextPriority: win.priorityPlayer,
        windowId: win.windowId
      });
    }
    return { nextPriority: win.priorityPlayer, consecutivePasses: 0 };
  }

  /**
   * Action hook executed when a window closes normally.
   */
  async onWindowClosed(closedWindow) {
    if (closedWindow.windowType === RESPONSE_WINDOW_TYPES.FLASH_1) {
      // First Flash closed -> Open Block Declaration Window!
      return await this.openWindow({
        windowType: RESPONSE_WINDOW_TYPES.BLOCK_DECLARATION,
        timing: 'BLOCK_TIMING',
        attackerStackId: closedWindow.attackerStackId,
        attackerSide: closedWindow.attackerSide,
        defenderSide: closedWindow.defenderSide,
        priorityPlayer: closedWindow.defenderSide
      });
    }

    if (closedWindow.windowType === RESPONSE_WINDOW_TYPES.FLASH_2) {
      // Second Flash closed -> Proceed to BP Comparison Battle Resolution!
      closedWindow._closedViaTwoPasses = true;
      const resolutionToken = Symbol('BATTLE_RESOLUTION_TOKEN');
      this._trustedResolutionToken = resolutionToken;
      closedWindow._resolutionToken = resolutionToken;
      return await executeInternalBattleComparison(this, closedWindow, resolutionToken);
    }

    return null;
  }

  /**
   * Resolves BP comparison between attacker and blocker after Flash 2 closes.
   */
  async resolveBattleComparison(win) {
    if (!win) {
      return { success: false, reason: 'INVALID_WINDOW', code: 'INVALID_WINDOW' };
    }

    // Must NOT be invoked while response window is active!
    if (this.isResponseWindowActive()) {
      const currentWin = this.getCurrentWindow();
      if (currentWin && currentWin.status !== RESPONSE_WINDOW_STATUS.CLOSED && currentWin.resolutionStatus !== RESPONSE_WINDOW_STATUS.CLOSED) {
        return { success: false, reason: 'FLASH_TIMING_NOT_CLOSED', code: 'FLASH_TIMING_NOT_CLOSED' };
      }
    }

    if (!win._closedViaTwoPasses) {
      return { success: false, reason: 'FLASH_TIMING_NOT_CLOSED', code: 'FLASH_TIMING_NOT_CLOSED' };
    }

    if (!this.state.combat) {
      return { success: false, reason: 'NOT_IN_COMBAT', code: 'NOT_IN_COMBAT' };
    }

    if (this.state.combat._comparisonResolved) {
      return { success: false, reason: 'BATTLE_ALREADY_RESOLVED', code: 'BATTLE_ALREADY_RESOLVED' };
    }

    if (!this._trustedResolutionToken || win._resolutionToken !== this._trustedResolutionToken) {
      return { success: false, reason: 'UNAUTHORIZED_WINDOW_TOKEN', code: 'UNAUTHORIZED_WINDOW_TOKEN' };
    }

    if (win.attackerStackId !== this.state.combat.attackerStackId || win.blockerStackId !== this.state.combat.blockerStackId) {
      return { success: false, reason: 'BATTLE_ENTITY_MISMATCH', code: 'BATTLE_ENTITY_MISMATCH' };
    }

    return await executeInternalBattleComparison(this, win, this._trustedResolutionToken);
  }

  async _internalResolveBattleComparison(win) {
    return {
      success: false,
      reason: 'UNAUTHORIZED_INTERNAL_RESOLUTION',
      code: 'UNAUTHORIZED_INTERNAL_RESOLUTION',
      details: '_internalResolveBattleComparison is disabled. BP comparison must be resolved through the trusted response window lifecycle.'
    };
  }

    /**
   * Generates legal Flash candidates for playerSide from current game state.
   */
  calculateFlashCandidates(playerSide, turnAttackerSide) {
    const state = this.state;
    const p = state.players[playerSide];
    if (!p) return [{ action: 'PASS', label: 'Pass Priority' }];

    const actions = [{ action: 'PASS', label: 'Pass Priority' }];
    const isOwnerTurn = playerSide === turnAttackerSide;

    // 1. Hand Flash Magic Cards
    for (const card of p.hand || []) {
      if (card.type === 'Magic' && card.compiledIr?.abilities) {
        const flashAb = card.compiledIr.abilities.find(a => a.header?.isFlash || a.header?.timing === 'FLASH');
        if (flashAb) {
          const turnRest = String(flashAb.header?.turnRestriction || '').toUpperCase();
          const timingStep = String(flashAb.header?.timingStep || '').toUpperCase();
          if (turnRest === 'OPPOSING_ATTACK_STEP' || timingStep === 'OPPOSING_ATTACK_STEP') {
            if (isOwnerTurn) continue;
          } else if (turnRest === 'YOUR_ATTACK_STEP' || timingStep === 'YOUR_ATTACK_STEP') {
            if (!isOwnerTurn) continue;
          } else {
            const timingLabel = String(flashAb.header?.timingLabel || '').toLowerCase();
            if (isOwnerTurn && (timingLabel.includes('opposing') || timingLabel.includes('opponent'))) {
              continue;
            }
            if (!isOwnerTurn && timingLabel.includes('your attack step')) {
              continue;
            }
          }

          const cost = calculateEffectiveCost(state, card, playerSide);
          const totalCores = (p.reserve?.normal || p.reserve || 0) + (p.field || []).reduce((sum, st) => sum + (st.cores || 0), 0);
          if (totalCores >= cost) {
            actions.push({
              action: 'CAST_FLASH_MAGIC',
              cardId: card.id,
              card,
              cost,
              label: `[Flash] ${card.name} (Cost: ${cost})`
            });
          }
        }
      }
    }

    // 2. Field Flash Abilities
    for (const stack of p.field || []) {
      const card = stack.top;
      if (!card?.compiledIr?.abilities) continue;
      const lv = computeLevel(stack, state);
      for (const ab of card.compiledIr.abilities) {
        const timing = String(ab.header?.timing || '').toUpperCase();
        if (timing !== 'FLASH' && timing !== 'FLASH_TIMING') continue;
        if (ab.header?.levels?.length && !ab.header.levels.includes(lv)) continue;
        const turnRest = String(ab.header?.turnRestriction || '').toUpperCase();
        const timingStep = String(ab.header?.timingStep || '').toUpperCase();
        if ((turnRest === 'OPPOSING_ATTACK_STEP' || turnRest === 'OPPONENT_TURN' || timingStep === 'OPPOSING_ATTACK_STEP') && isOwnerTurn) continue;
        if ((turnRest === 'YOUR_ATTACK_STEP' || turnRest === 'YOUR_TURN' || timingStep === 'YOUR_ATTACK_STEP') && !isOwnerTurn) continue;

        actions.push({
          action: 'ACTIVATE_FLASH_ABILITY',
          cardId: card.id,
          card,
          stackId: stack.id,
          abilityId: ab.physicalId || ab.id,
          label: `[Flash] ${card.name} Ability`
        });
      }
    }

    // 3. Hand High Speed Spirits & Accel
    for (const card of p.hand || []) {
      if (card.effect && card.effect.includes('High Speed')) {
        const cost = card.cost || 1;
        const reserveCores = (p.reserve?.normal !== undefined ? p.reserve.normal : (typeof p.reserve === 'number' ? p.reserve : 0));
        if (reserveCores >= cost + 1) {
          actions.push({
            action: 'HIGH_SPEED_SUMMON',
            cardId: card.id,
            card,
            cost,
            label: `[High Speed] ${card.name} (Cost: ${cost})`
          });
        }
      } else if (card.type === 'Spirit' || card.type === 'Ultimate' || card.type === 'Brave') {
        const effectText = String(card.effect || card.raw_effect || '');
        const hasAccel = Boolean(
          (card.compiledIr?.abilities || []).some(a => /accel/i.test(String(a.header?.keyword || '')) || (a.header?.prefixes || []).some(pr => /accel/i.test(String(pr)))) ||
          /\[accel/i.test(effectText)
        );
        if (hasAccel) {
          const isFlash = Boolean(
            (card.compiledIr?.abilities || []).some(a => a.header?.isFlash || String(a.header?.timing || '').toUpperCase() === 'FLASH') ||
            /(?:^|\s|\b)Flash\s*-\s*\[Accel/i.test(effectText) ||
            /\[Accel[^\]]*\(Flash[^)]*\)\]/i.test(effectText) ||
            /(?:^|\s|\b)Flash(?:\s*-\s*|:|\s*\()/i.test(effectText)
          );
          if (isFlash) {
            const m = effectText.match(/\[Accel:\s*Cost\s+(\d+)/i);
            const rawCost = m ? parseInt(m[1], 10) : (card.accelCost ?? 0);
            const accelShim = { ...card, cost: Number(rawCost) || 0 };
            const cost = calculateEffectiveCost(state, accelShim, playerSide);
            actions.push({
              action: 'USE_ACCEL',
              cardId: card.id,
              card,
              cost,
              label: `[Accel] ${card.name} (Cost: ${cost})`
            });
          }
        }
      }
    }

    return actions;
  }

  /**
   * Generates legal blocker candidates for defenderSide from current game state.
   */
  calculateBlockerCandidates(defenderSide) {
    const state = this.state;
    const p = state.players[defenderSide];
    const actions = [{ action: 'PASS_BLOCK', label: 'Do Not Block (Direct Hit)' }];
    if (!p) return actions;

    for (const stack of p.field || []) {
      if (stack.state === 'REFRESHED' && canBlock(state, stack)) {
        const bp = computeEffectiveBP(state, stack);
        actions.push({
          action: 'DECLARE_BLOCK',
          stackId: stack.id,
          cardId: stack.top.id,
          card: stack.top,
          bp,
          label: `Block with ${stack.top.name} (${bp} BP)`
        });
      }
    }

    return actions;
  }
}


async function executeInternalBattleComparison(manager, win, resolutionToken) {
  if (!manager || !win || !resolutionToken || resolutionToken !== manager._trustedResolutionToken) {
    return { success: false, reason: 'UNAUTHORIZED_INTERNAL_RESOLUTION', code: 'UNAUTHORIZED_INTERNAL_RESOLUTION' };
  }
  manager._trustedResolutionToken = null;

    const state = manager.state;
    const events = manager.events;
    const attackerSide = win.attackerSide;
    const blockerSide = win.defenderSide;

    if (!state.combat) {
      return { success: false, reason: 'NOT_IN_COMBAT', code: 'NOT_IN_COMBAT' };
    }
    state.combat._comparisonResolved = true;

    const attackerStack = state.players[attackerSide]?.field.find(st => st.id === win.attackerStackId);
    const blockerStack = state.players[blockerSide]?.field.find(st => st.id === state.combat?.blockerStackId);

    if (!attackerStack || !blockerStack) {
      state.combat = null;
      await manager.game.endBattle();
      await manager.game.endAttack();
      await checkStateBasedActions(state, events);
      return { success: true, endedEarly: true };
    }

    if (events) {
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
    }

    const attackerBp = computeEffectiveBP(state, attackerStack);
    const blockerBp = computeEffectiveBP(state, blockerStack);
    const attackerLv = computeLevel(attackerStack, state);
    const blockerLv = computeLevel(blockerStack, state);

    const compareByLevel = (state.modifiers || []).some(m =>
      (m.type === 'COMPARE_LEVELS' || m.type === 'COMPARE_LV_INSTEAD_OF_BP') &&
      (!m.side || m.side === 'both' || m.side === attackerSide || m.side === blockerSide)
    );

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

    const p = state.players[blockerSide];
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
    if (hasCurse && blockerStack && blockerStack.top) {
      const blockerInField = p.field.some(st => st.id === blockerStack.id);
      if (blockerInField) {
        await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'curse', by: attackerSide, sourceCard: attackerSourceCard }, events);
      }
    }

    state.combat = null;
    await manager.game.endBattle();
    await manager.game.endAttack();
    await checkStateBasedActions(state, events);

    return {
      success: true,
      attackerBp,
      blockerBp,
      attackerScore,
      blockerScore
    };
  }

