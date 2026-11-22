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
    if (!event || typeof event !== 'object') {
      throw new Error('[EventBus] Invalid event object passed to emit()');
    }
    const enriched = {
      timestamp: Date.now(),
      cause: 'rule',
      by: 'self',
      ...event,
      type: event.type
    };

    this.history.push(enriched);

    const handlers = this.listeners.get(enriched.type) || [];
    const allHandlers = this.listeners.get('*') || [];
    
    // Execute registered handlers sequentially
    for (const handler of [...handlers, ...allHandlers]) {
      await handler(enriched);
    }

    return enriched;
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}
