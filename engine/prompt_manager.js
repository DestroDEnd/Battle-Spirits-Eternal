/**
 * engine/prompt_manager.js
 * 
 * Unified Promise-driven Prompt Manager for Battle Spirits Eternal.
 * Manages decision queues, human interactions, and AI decider integration.
 * The game flow pauses until the pending prompt's Promise resolves.
 */

let nextPromptId = 1;

export class PromptManager {
  constructor() {
    this.pendingQueue = [];
    this.activePrompt = null;
    this.history = [];
  }

  /**
   * Request a player decision. Returns a Promise that resolves when answered.
   */
  request(promptData) {
    const promptId = `prompt_${nextPromptId++}`;
    let resolvePromise;
    let rejectPromise;

    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    const promptEntry = {
      id: promptId,
      timestamp: Date.now(),
      chooser: promptData.chooser || 'player',
      type: promptData.type,
      title: promptData.title || '',
      candidates: promptData.candidates || [],
      options: promptData.options || [],
      count: promptData.count || 1,
      upTo: Boolean(promptData.upTo),
      selector: promptData.selector || null,
      context: promptData.context || {},
      promise,
      resolve: resolvePromise,
      reject: rejectPromise
    };

    this.pendingQueue.push(promptEntry);
    if (!this.activePrompt) {
      this.activePrompt = promptEntry;
    }

    return promise;
  }

  /**
   * Resolves the active prompt with user or AI input.
   */
  resolve(promptId, response) {
    const index = this.pendingQueue.findIndex(p => p.id === promptId);
    if (index === -1) {
      console.warn(`[PromptManager] Attempted to resolve non-existent prompt: ${promptId}`);
      return false;
    }

    const prompt = this.pendingQueue.splice(index, 1)[0];
    this.history.push({ promptId, type: prompt.type, response, timestamp: Date.now() });

    // Update active prompt to next in queue
    this.activePrompt = this.pendingQueue.length > 0 ? this.pendingQueue[0] : null;

    prompt.resolve(response);
    return true;
  }

  getActivePrompt() {
    return this.activePrompt;
  }

  hasPendingPrompt(playerSide = null) {
    if (!playerSide) return this.pendingQueue.length > 0;
    return this.pendingQueue.some(p => p.chooser === playerSide);
  }

  clear() {
    while (this.pendingQueue.length > 0) {
      const p = this.pendingQueue.pop();
      p.reject(new Error('Prompt cancelled due to reset'));
    }
    this.activePrompt = null;
    this.history = [];
  }
}
