/**
 * engine/flow.js
 * 
 * Game Flow Controller & Step State Machine.
 * Enforces Eternal format turn sequence, Turn 1 step skips, and SBA integration.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { resetTurnHistory } from './state.js';
import { moveCard, moveCore } from './zones.js';
import { stabilizeGameState } from './sba.js';
import { pruneExpiredModifiers } from './continuous.js';
import { resetRestrictions, preflightGenerations, validateRestrictionState, RESTRICTION_STATUS } from './restrictions.js';

export class FlowController {
  constructor(state, events = null) {
    this.state = state;
    this.events = events;
  }

  async advanceStep() {
    if (this.state.winner) return this.state.step;

    const currentStep = this.state.step;
    const activePlayer = this.state.activePlayer;
    const isFirstTurn = this.state.turnNumber === 1 && activePlayer === this.state.firstPlayer;

    // 1. Determine lifecycle target scope:
    // If transitioning from END, the boundary is a TURN transition which subsumes STEP, BATTLE, and ATTACK.
    // Otherwise, it is an ordinary STEP transition.
    const isEndTransition = currentStep === 'END';
    const affectedScopes = isEndTransition
      ? ['TURN', 'STEP', 'BATTLE', 'ATTACK']
      : ['STEP'];

    // 2. Preflight all affected generations BEFORE ANY MUTATION
    const preflight = preflightGenerations(this.state.restrictions?.generations, affectedScopes);
    if (!preflight.valid) {
      const err = new Error(`INVALID_RESTRICTION_STATE: ${preflight.reason || preflight.status}`);
      err.success = false;
      err.status = preflight.status || RESTRICTION_STATUS.INVALID_RESTRICTION_STATE;
      err.reason = preflight.reason;
      throw err;
    }

    // 3. Pre-validate restriction state integrity before any mutation
    if (this.state.restrictions) {
      const validation = validateRestrictionState(this.state);
      if (!validation.valid) {
        const err = new Error(`INVALID_RESTRICTION_STATE: ${validation.reason || validation.error}`);
        err.success = false;
        err.status = validation.error || RESTRICTION_STATUS.INVALID_RESTRICTION_STATE;
        err.reason = validation.reason;
        throw err;
      }
    }

    // 4. Emit STEP_END event only after all preflights succeed
    if (this.events) {
      await this.events.emit({
        type: 'STEP_END',
        step: currentStep,
        player: activePlayer,
        turnNumber: this.state.turnNumber
      });
    }

    let nextStep;

    if (isEndTransition) {
      if (this.events) {
        await this.events.emit({
          type: 'TURN_END',
          player: activePlayer,
          turnNumber: this.state.turnNumber
        });
      }

      // 5A. Atomic END transition:
      // Apply the TURN reset exactly once. This resets all turn-, step-, battle-, and attack-scoped
      // counters/reservations and advances each affected generation (TURN, STEP, BATTLE, ATTACK) exactly once.
      const turnReset = resetRestrictions(this.state, 'TURN');
      if (turnReset && !turnReset.success) {
        const err = new Error(`INVALID_RESTRICTION_STATE: ${turnReset.reason || turnReset.status}`);
        err.success = false;
        err.status = turnReset.status || RESTRICTION_STATUS.INVALID_RESTRICTION_STATE;
        err.reason = turnReset.reason;
        throw err;
      }

      // Transition to next turn (or Extra Turn if granted)
      this.state.turnNumber++;
      const activeP = this.state.players[activePlayer];
      if (activeP && activeP.extraTurns && activeP.extraTurns > 0) {
        activeP.extraTurns -= 1;
        this.state.activePlayer = activePlayer;
      } else {
        this.state.activePlayer = activePlayer === 'player' ? 'opponent' : 'player';
      }
      this.state.combat = null;
      nextStep = 'START';

      // Clear THIS_TURN, THIS_BATTLE, THIS_ATTACK, THIS_STEP, and matching UNTIL_START_OF_NEXT_TURN modifiers
      pruneExpiredModifiers(this.state, 'TURN', {
        nextTurnNumber: this.state.turnNumber,
        nextActivePlayer: this.state.activePlayer
      });

      for (const s of ['player', 'opponent']) {
        if (this.state.players[s]) {
          this.state.players[s].combatDamageTakenThisTurn = 0;
        }
      }
      resetTurnHistory(this.state);

      if (this.events) {
        await this.events.emit({
          type: 'TURN_START',
          player: this.state.activePlayer,
          turnNumber: this.state.turnNumber
        });
      }
    } else {
      // 5B. Ordinary STEP transition:
      // Clear any lingering combat state when leaving ATTACK step
      if (currentStep === 'ATTACK' && this.state.combat) {
        this.state.combat = null;
        if (Array.isArray(this.state.modifiers)) {
          this.state.modifiers = this.state.modifiers.filter(
            m => m.duration !== 'THIS_BATTLE' && m.duration !== 'UNTIL_END_OF_BATTLE'
          );
        }
        resetRestrictions(this.state, 'BATTLE');
        resetRestrictions(this.state, 'ATTACK');
        if (this.events) {
          await this.events.emit({ type: 'BATTLE_ENDED' });
          await this.events.emit({ type: 'ATTACK_ENDED' });
        }
      }

      // Reset step-scoped restrictions and advance STEP generation exactly once
      const stepReset = resetRestrictions(this.state, 'STEP');
      if (stepReset && !stepReset.success) {
        const err = new Error(`INVALID_RESTRICTION_STATE: ${stepReset.reason || stepReset.status}`);
        err.success = false;
        err.status = stepReset.status || RESTRICTION_STATUS.INVALID_RESTRICTION_STATE;
        err.reason = stepReset.reason;
        throw err;
      }

      // Prune step-scoped modifiers when a step ends
      pruneExpiredModifiers(this.state, 'STEP');

      // Determine next step
      nextStep = this.getNextStepName(currentStep, isFirstTurn);
    }

    this.state.step = nextStep;

    if (this.events) {
      await this.events.emit({
        type: 'STEP_START',
        step: nextStep,
        player: this.state.activePlayer,
        turnNumber: this.state.turnNumber
      });
    }

    // Execute automatic step actions
    await this.executeStepActions(nextStep);

    // Run deterministic state stabilization (source-departure pruning, standby flush, repeated SBA)
    await stabilizeGameState(this.state, this.events);

    return this.state.step;
  }

  async nextStep() {
    return await this.advanceStep();
  }

  getBaseNextStepName(currentStep, isFirstTurn) {
    switch (currentStep) {
      case 'START':
        return (isFirstTurn && ETERNAL_RULES.turn.firstPlayerSkipsCoreStep) ? 'DRAW' : 'CORE';
      case 'CORE':
        return 'DRAW';
      case 'DRAW':
        return 'REFRESH';
      case 'REFRESH':
        return 'MAIN';
      case 'MAIN':
        return (isFirstTurn && ETERNAL_RULES.turn.firstPlayerSkipsAttackStep) ? 'END' : 'ATTACK';
      case 'ATTACK':
        return 'END';
      case 'END':
        return 'START';
      default:
        return 'START';
    }
  }

  isStepSkipped(stepName) {
    const targetSide = this.state.activePlayer;
    const normalizedStep = String(stepName || '').toUpperCase().replace(/_STEP$/, '');
    return (this.state.modifiers || []).some(m => {
      if (m.side && m.side !== 'both' && m.side !== targetSide) return false;
      const modStep = m.step ? String(m.step).toUpperCase().replace(/_STEP$/, '') : null;
      if (m.type === 'SKIP_STEP') {
        return !modStep || modStep === normalizedStep;
      }
      if (m.type === 'STEP_MODIFIER') {
        const rest = String(m.restriction || '').toUpperCase();
        if (rest === `SKIP_${normalizedStep}` || rest === `SKIP_${normalizedStep}_STEP`) return true;
        if ((rest === 'SKIP' || rest === 'SKIP_STEP') && modStep === normalizedStep) return true;
      }
      return false;
    });
  }

  getNextStepName(currentStep, isFirstTurn) {
    let candidate = this.getBaseNextStepName(currentStep, isFirstTurn);
    if (currentStep === 'END') return candidate;
    for (let i = 0; i < 6; i++) {
      if (candidate === 'END' || !this.isStepSkipped(candidate)) {
        return candidate;
      }
      candidate = this.getBaseNextStepName(candidate, isFirstTurn);
    }
    return candidate;
  }

  async executeStepActions(step) {
    const p = this.state.players[this.state.activePlayer];

    switch (step) {
      case 'START': {
        // Deck-out check at Start Step (Eternal Rule 3.5)
        const deckOutPrevented = (this.state.modifiers || []).some(
          m => m.type === 'PREVENT_LOSS' && (!m.side || m.side === 'both' || m.side === this.state.activePlayer)
        );
        if (p.deck.length === 0 && !deckOutPrevented) {
          const opp = this.state.activePlayer === 'player' ? 'opponent' : 'player';
          this.state.winner = opp;
          this.state.winReason = 'DECK_OUT';
          if (this.events) {
            await this.events.emit({
              type: 'GAME_OVER',
              winner: opp,
              reason: 'DECK_OUT',
              player: this.state.activePlayer
            });
          }
          return;
        }

        // Reset per-turn flags
        p.burstSetThisTurn = false;
        p.mirageSetThisTurn = false;
        for (const s of ['player', 'opponent']) {
          if (this.state.players[s]) {
            this.state.players[s].combatDamageTakenThisTurn = 0;
          }
        }
        break;
      }

      case 'CORE': {
        // Core Step: Put 1 core from Void to Reserve
        await moveCore(
          this.state,
          1,
          { zone: 'void', side: this.state.activePlayer },
          { zone: 'reserve', side: this.state.activePlayer },
          { cause: 'core_step', by: 'rule' },
          this.events
        );
        break;
      }

      case 'DRAW': {
        // Draw Step: Draw 1 card from deck
        if (p.deck.length > 0) {
          const topCard = p.deck[0];
          const moved = await moveCard(
            this.state,
            topCard,
            'hand',
            this.state.activePlayer,
            { cause: 'draw_step', by: 'rule' },
            this.events
          );
          if (moved && this.events) {
            await this.events.emit({
              type: 'CARD_DRAWN',
              card: topCard,
              player: this.state.activePlayer,
              cause: 'draw_step'
            });
          }
        }
        break;
      }

      case 'REFRESH': {
        // 1. Refresh cards (Heavy Exhausted -> Exhausted; Exhausted -> Refreshed)
        for (const stack of p.field || []) {
          const blockedByMod = (this.state.modifiers || []).some(m =>
            (m.type === 'CANNOT_REFRESH' || (m.type === 'SET_RESTRICTION' && String(m.restriction || '').toUpperCase() === 'CANNOT_REFRESH')) &&
            (!m.side || m.side === 'both' || m.side === this.state.activePlayer) &&
            (!m.targetStackId || m.targetStackId === (stack.id || stack.stackId))
          );
          if (stack.cannotRefreshNextStep || stack.spellbound || blockedByMod) {
            stack.cannotRefreshNextStep = false;
            continue;
          }
          const prevState = stack.state;
          if (stack.state === 'HEAVY_EXHAUSTED') {
            stack.state = 'EXHAUSTED';
          } else if (stack.state === 'EXHAUSTED') {
            stack.state = 'REFRESHED';
          }
          if (stack.state !== prevState && this.events) {
            await this.events.emit({
              type: 'CARD_REFRESHED',
              card: stack.top,
              stack,
              player: this.state.activePlayer,
              previousState: prevState,
              newState: stack.state
            });
          }
        }

        // 2. Move all cores from Core Trash to Reserve
        const normalCores = p.trash.normal;
        const soulCores = p.trash.soul;

        if (normalCores > 0) {
          await moveCore(
            this.state,
            normalCores,
            { zone: 'trash', side: this.state.activePlayer },
            { zone: 'reserve', side: this.state.activePlayer },
            { isSoulCore: false, cause: 'refresh_step', by: 'rule' },
            this.events
          );
        }

        if (soulCores > 0) {
          await moveCore(
            this.state,
            soulCores,
            { zone: 'trash', side: this.state.activePlayer },
            { zone: 'reserve', side: this.state.activePlayer },
            { isSoulCore: true, cause: 'refresh_step', by: 'rule' },
            this.events
          );
        }
        break;
      }

      case 'MAIN':
      case 'ATTACK':
      case 'END':
      default:
        break;
    }
  }
}
