/**
 * engine_adapter.js
 * 
 * Battle Spirits Eternal - UI to Engine Adapter.
 * Connects browser UI (battle_arena.js, arena.html, etc.) to the headless
 * deterministic rules engine, PromptManager, AI Decider, and Eternal format rules.
 */

import { ETERNAL_RULES } from './engine/rules/eternal.js';
import { createGameState, createCardInstance, createFieldStack } from './engine/state.js';
import { EventBus } from './engine/events.js';
import { FlowController } from './engine/flow.js';
import { AsyncResolver, DefaultPromptResolver } from './engine/resolver.js';
import { moveCard, moveCore } from './engine/zones.js';
import { calculateEffectiveCost, canAffordCost, payCost } from './engine/payment.js';
import { computeEffectiveBP, canAttack, canBlock } from './engine/continuous.js';
import { checkStateBasedActions } from './engine/sba.js';
import { createDefaultKeywordRegistry } from './engine/keywords/index.js';
import { TimingWindowManager } from './engine/windows.js';
import { PromptManager } from './engine/prompt_manager.js';
import { AIDecider } from './engine/ai.js';
import { setupOpeningHands } from './engine/mulligan.js';
import { createGame } from './engine/index.js';

export const BSEngineAdapter = {
  ETERNAL_RULES,
  createGame,
  createGameState,
  createCardInstance,
  createFieldStack,
  EventBus,
  FlowController,
  AsyncResolver,
  DefaultPromptResolver,
  moveCard,
  moveCore,
  calculateEffectiveCost,
  canAffordCost,
  payCost,
  computeEffectiveBP,
  canAttack,
  canBlock,
  checkStateBasedActions,
  createDefaultKeywordRegistry,
  TimingWindowManager,
  PromptManager,
  AIDecider,
  setupOpeningHands,

  /**
   * Helper to initialize a duel session linking the engine and the UI
   */
  initDuelSession(options = {}) {
    const promptManager = options.promptManager || new PromptManager();
    const aiDecider = options.aiDecider || new AIDecider({ archetype: options.aiArchetype || 'red' });
    const game = createGame({
      playerDeck: options.playerDeck || [],
      opponentDeck: options.opponentDeck || [],
      firstPlayer: options.firstPlayer || 'player',
      promptManager,
      ai: aiDecider,
      usePromptManager: true
    });

    return {
      game,
      state: game.state,
      flow: game.flow,
      events: game.events,
      promptManager,
      aiDecider,
      windows: new TimingWindowManager(game.state, game.events, promptManager)
    };
  }
};

if (typeof window !== 'undefined') {
  window.BSEngineAdapter = BSEngineAdapter;
}

export default BSEngineAdapter;
