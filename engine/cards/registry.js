/**
 * engine/cards/registry.js
 * 
 * Battle Spirits Eternal - Deterministic Per-Card Explicit Effect Registry
 * Non-negotiable Rule: All effects must be keyed strictly by canonical card_number
 * (e.g., 'SD65-X01', 'SD65-X03', 'BS14-096', 'SD65-CX01').
 * Handlers defined here take absolute precedence over ad-hoc RegExp and NLP guessing.
 */

export class CardRegistry {
  constructor() {
    this.registry = new Map();
  }

  /**
   * Registers an explicit card handler definition.
   * @param {string|string[]} cardNumber Canonical card number or array of aliases (e.g. 'SD65-X01' or ['SD65-014', 'BS38-067'])
   * @param {object} definition Handler definition with triggers: { WHEN_SUMMONED, WHEN_ATTACKS, BURST, FLASH, MAIN, etc. }
   */
  registerCard(cardNumber, definition) {
    if (!cardNumber) throw new Error('Card number is required for registration');
    if (!definition || typeof definition !== 'object') throw new Error('Card definition must be an object');

    const cardNumbers = Array.isArray(cardNumber) ? cardNumber : [cardNumber];

    for (const num of cardNumbers) {
      const canon = String(num).trim().toUpperCase();
      const existing = this.registry.get(canon) || {
        cardNumber: canon,
        name: definition.name || '',
        cardType: definition.cardType || definition.type || 'Spirit',
        triggers: {}
      };

      if (definition.triggers) {
        for (const [trig, handler] of Object.entries(definition.triggers)) {
          if (typeof handler === 'function') {
            existing.triggers[trig.toUpperCase()] = handler;
          }
        }
      }

      if (definition.name) existing.name = definition.name;
      if (definition.cardType || definition.type) existing.cardType = definition.cardType || definition.type;
      if (definition.rawEffect || definition.effect) {
        existing.effect = definition.rawEffect || definition.effect;
        existing.rawEffect = definition.rawEffect || definition.effect;
      }
      if (definition.isVanilla !== undefined) existing.isVanilla = definition.isVanilla;
      if (definition.sagaAbilities) existing.sagaAbilities = definition.sagaAbilities;

      this.registry.set(canon, existing);
    }
  }

  /**
   * Checks whether an explicit handler is registered for a given card_number and trigger.
   * @param {string} cardNumber 
   * @param {string} trigger 
   * @returns {boolean}
   */
  has(cardNumber, trigger) {
    if (!cardNumber || !trigger) return false;
    const canon = String(cardNumber).trim().toUpperCase();
    const entry = this.registry.get(canon);
    if (!entry || !entry.triggers) return false;
    return typeof entry.triggers[String(trigger).trim().toUpperCase()] === 'function';
  }

  /**
   * Returns the registered card entry.
   * @param {string} cardNumber 
   */
  get(cardNumber) {
    if (!cardNumber) return null;
    const canon = String(cardNumber).trim().toUpperCase();
    return this.registry.get(canon) || null;
  }

  /**
   * Alias for get(cardNumber).
   * @param {string} cardNumber
   */
  getCard(cardNumber) {
    return this.get(cardNumber);
  }

  /**
   * Executes the registered handler for the given card_number and trigger.
   * @param {string} cardNumber 
   * @param {string} trigger 
   * @param {object} context 
   * @returns {*}
   */
  execute(cardNumber, trigger, context = {}) {
    if (!cardNumber || !trigger) return null;
    const canon = String(cardNumber).trim().toUpperCase();
    const entry = this.registry.get(canon);
    if (!entry || !entry.triggers) return null;

    const trigKey = String(trigger).trim().toUpperCase();
    const handler = entry.triggers[trigKey];
    if (typeof handler !== 'function') return null;

    try {
      return handler(context);
    } catch (err) {
      console.error(`[PerCardRegistry] Error executing ${canon} [${trigKey}]:`, err);
      if (context.arenaApi && typeof context.arenaApi.addLog === 'function') {
        context.arenaApi.addLog(`⚠️ [Error in ${entry.name || canon}]: ${err.message}`, 'warning');
      }
      return null;
    }
  }

  /**
   * Computes continuous AURA_BP bonuses granted to `targetSpirit` by all active Spirits and Nexuses on `side`.
   */
  computeFieldAuraBp(targetSpirit, side, duelState, arenaApi = null) {
    if (!targetSpirit || !duelState || !duelState[side]) return 0;
    const st = duelState[side];
    const sources = [...(st.field || []), ...(st.nexus || [])];
    let totalBonus = 0;
    for (const src of sources) {
      if (!src) continue;
      const cNum = src.card_number || src.cardNumber || src.id;
      if (cNum && this.has(cNum, 'AURA_BP')) {
        const res = this.execute(cNum, 'AURA_BP', {
          card: src,
          sourceCard: src,
          targetSpirit,
          side,
          duelState,
          arenaApi
        });
        if (typeof res === 'number' && !isNaN(res)) {
          totalBonus += res;
        }
      }
    }
    return totalBonus;
  }

  /**
   * Dispatches a phase/step trigger (e.g. START_STEP, CORE_STEP, DRAW_STEP, REFRESH_STEP,
   * MAIN_STEP, ATTACK_STEP, END_STEP) across all active Spirits and Nexuses on both fields.
   */
  dispatchStepEffects(stepTrigger, duelState, arenaApi = null) {
    if (!stepTrigger || !duelState) return;
    const trig = String(stepTrigger).trim().toUpperCase();
    for (const side of ['player', 'opponent']) {
      const st = duelState[side];
      if (!st) continue;
      const units = [...(st.field || []), ...(st.nexus || [])];
      for (const u of units) {
        if (!u) continue;
        const cNum = u.card_number || u.cardNumber || u.id;
        if (cNum && this.has(cNum, trig)) {
          this.execute(cNum, trig, {
            card: u,
            sourceCard: u,
            side,
            duelState,
            arenaApi
          });
        }
      }
    }
  }

  /**
   * Returns all registered card definitions.
   * @returns {object[]}
   */
  getAll() {
    return Array.from(this.registry.values());
  }

  /**
   * Clears all registered cards (useful for unit testing isolation).
   */
  clear() {
    this.registry.clear();
  }
}

export const PerCardRegistry = new CardRegistry();

if (typeof window !== 'undefined') {
  window.CardRegistry = CardRegistry;
  window.PerCardRegistry = PerCardRegistry;
}
if (typeof globalThis !== 'undefined') {
  globalThis.CardRegistry = CardRegistry;
  globalThis.PerCardRegistry = PerCardRegistry;
}
