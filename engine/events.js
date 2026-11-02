/**
 * engine/events.js
 * 
 * Synchronous & Asynchronous Event Bus with cause tracking.
 * Every card destruction, core move, and phase transition emits structured events.
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.history = [];
  }

  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
    return () => this.off(eventType, handler);
  }

  once(eventType, handler) {
    const wrapper = async (event) => {
      this.off(eventType, wrapper);
      return await handler(event);
    };
    return this.on(eventType, wrapper);
  }

  off(eventType, handler) {
    const list = this.listeners.get(eventType);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  async emit(event) {
    const enriched = {
      timestamp: Date.now(),
      cause: 'rule',
      by: 'self',
      ...event
    };

    this.history.push(enriched);

    const handlers = this.listeners.get(event.type) || [];
    const allHandlers = this.listeners.get('*') || [];
    
    // Execute registered handlers sequentially
    for (const handler of [...handlers, ...allHandlers]) {
      try {
        await handler(enriched);
      } catch (err) {
        console.error(`[EventBus] Error in handler for ${event.type}:`, err);
      }
    }

    return enriched;
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}
