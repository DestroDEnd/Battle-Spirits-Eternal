/**
 * engine/flow.js
 * 
 * Game Flow Controller & Step State Machine.
 * Enforces Eternal format turn sequence, Turn 1 step skips, and SBA integration.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { moveCard, moveCore } from './zones.js';
import { checkStateBasedActions } from './sba.js';

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

    if (this.events) {
      await this.events.emit({
        type: 'STEP_END',
        step: currentStep,
        player: activePlayer,
        turnNumber: this.state.turnNumber
      });
    }

    // Determine next step
    let nextStep = this.getNextStepName(currentStep, isFirstTurn);

    if (currentStep === 'END') {
      // Transition to next turn
      this.state.turnNumber++;
      this.state.activePlayer = activePlayer === 'player' ? 'opponent' : 'player';
      nextStep = 'START';

      // Clear THIS_TURN modifiers
      this.state.modifiers = this.state.modifiers.filter(m => m.duration !== 'THIS_TURN' && m.duration !== 'THIS_BATTLE');
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

    // Run State-Based Actions
    await checkStateBasedActions(this.state, this.events);

    return this.state.step;
  }

  getNextStepName(currentStep, isFirstTurn) {
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

  async executeStepActions(step) {
    const p = this.state.players[this.state.activePlayer];

    switch (step) {
      case 'START': {
        // Deck-out check at Start Step (Eternal Rule 3.5)
        if (p.deck.length === 0) {
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
        break;
      }

      case 'CORE': {
        // Core Step: Put 1 core from Void to Reserve
        await moveCore(
          this.state,
          1,
          { zone: 'void' },
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
          await moveCard(
            this.state,
            topCard,
            'hand',
            this.state.activePlayer,
            { cause: 'draw_step', by: 'rule' },
            this.events
          );
        }
        break;
      }

      case 'REFRESH': {
        // 1. Refresh cards (Heavy Exhausted -> Exhausted; Exhausted -> Refreshed)
        for (const stack of p.field || []) {
          if (stack.state === 'HEAVY_EXHAUSTED') {
            stack.state = 'EXHAUSTED';
          } else if (stack.state === 'EXHAUSTED') {
            stack.state = 'REFRESHED';
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
