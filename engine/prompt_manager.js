/**
 * engine/prompt_manager.js
 * 
 * Unified Promise-driven Prompt Manager for Battle Spirits Eternal.
 * Manages decision queues, human interactions, and AI decider integration.
 * The game flow pauses until the pending prompt's Promise resolves.
 * Upgraded to conform to the formal Interaction Protocol with full backward compatibility.
 */

import {
  InteractionController,
  createInteractionRequest,
  validateInteractionResponse,
  INTERACTION_STATUS,
  INTERACTION_TYPES
} from './interaction.js';

let nextPromptId = 1;

export class PromptManager {
  constructor(state = null, events = null, controller = null) {
    this.state = state;
    this.events = events;
    this.controller = controller || new InteractionController(state, events);
    this.history = this.controller.history;
  }

  get pendingQueue() {
    return this.controller.getPendingInteractions();
  }

  get activePrompt() {
    return this.controller.getActiveInteraction();
  }

  /**
   * Request a player decision. Returns a Promise that resolves when answered.
   * Marked with isLegacyPrompt: true so legacy callers receive their expected response shape.
   */
  request(promptData) {
    const promptId = promptData.id || `prompt_${nextPromptId++}`;
    const chooser = promptData.chooser || promptData.player || 'player';

    return this.controller.request({
      ...promptData,
      id: promptId,
      chooser,
      player: chooser,
      isLegacyPrompt: true
    });
  }

  /**
   * Resolves the active prompt with user or AI input.
   * Returns true if successfully resolved, false if validation failed or prompt not found/stale.
   */
  resolve(promptId, response) {
    const result = this.controller.respond(promptId, response);
    if (!result || !result.success) {
      if (result && result.reason) {
        console.warn(`[PromptManager] Response failed validation or stale: ${result.reason}`);
      }
      return false;
    }
    return true;
  }

  getActivePrompt(playerSide = null) {
    return this.controller.getActiveInteraction(playerSide);
  }

  hasPendingPrompt(playerSide = null) {
    const pending = this.controller.getPendingInteractions(playerSide);
    return pending.length > 0;
  }

  clear() {
    this.controller.clear();
  }

  choose(prompt) {
    return this.request(prompt);
  }
}
