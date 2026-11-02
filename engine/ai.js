/**
 * engine/ai.js
 * 
 * Heuristic AI Decider for Battle Spirits Eternal.
 * Evaluates candidate threat rankings, blocking tradeoffs, and priority windows.
 * Plugs directly into PromptManager / AsyncResolver.
 */

import { computeEffectiveBP, computeSymbols } from './continuous.js';

export class AIDecider {
  constructor(options = {}) {
    this.profileName = options.profile || 'red';
    this.side = options.side || 'opponent';
    this.weights = {
      w_life: 2.8,
      w_bp: 0.001,
      w_cost: 1.2,
      w_symbols: 2.0,
      w_advent: 3.0,
      ...options.weights
    };
  }

  async decide(prompt, state) {
    if (!prompt) return null;

    switch (prompt.type) {
      case 'CONFIRM_OPTIONAL':
        return { accepted: true };

      case 'CHOOSE_OR_BRANCH':
        return prompt.options && prompt.options.length > 0 ? prompt.options[0] : null;

      case 'SELECT_DESTROY':
      case 'SELECT_BOUNCE':
      case 'SELECT_EXHAUST': {
        const candidates = prompt.candidates || [];
        if (candidates.length === 0) return [];

        // Score each candidate by strategic threat
        const scored = candidates.map(cand => {
          const stack = cand.stack;
          const card = cand.card || (stack ? stack.top : null);
          const bp = stack ? computeEffectiveBP(state, stack) : (card ? card.bp || 1000 : 1000);
          const cost = card ? card.cost || 0 : 0;
          const syms = stack ? computeSymbols(state, stack).length : 1;
          const isAdvent = stack && stack.under.length > 0;

          const threat = (bp * this.weights.w_bp) +
                         (cost * this.weights.w_cost) +
                         (syms * this.weights.w_symbols) +
                         (isAdvent ? this.weights.w_advent : 0);

          return { candidate: cand, threat, bp, cost };
        });

        // Sort descending by threat (highest threat first)
        scored.sort((a, b) => b.threat - a.threat);

        // If TOTAL_BP_LTE mode (e.g. Evil Flame up to total 5000 BP)
        if (prompt.selector && prompt.selector.mode === 'TOTAL_BP_LTE' && prompt.selector.maxTotalBp) {
          const maxBp = prompt.selector.maxTotalBp;
          const selected = [];
          let currentTotal = 0;
          for (const s of scored) {
            if (currentTotal + s.bp <= maxBp) {
              selected.push(s.candidate);
              currentTotal += s.bp;
            }
          }
          return selected;
        }

        // If TOTAL_COST_LTE mode (e.g. Siegfrieden XV up to total cost 9)
        if (prompt.selector && prompt.selector.mode === 'TOTAL_COST_LTE' && prompt.selector.maxTotalCost) {
          const maxCost = prompt.selector.maxTotalCost;
          const selected = [];
          let currentTotal = 0;
          for (const s of scored) {
            if (currentTotal + s.cost <= maxCost) {
              selected.push(s.candidate);
              currentTotal += s.cost;
            }
          }
          return selected;
        }

        const count = prompt.count || 1;
        return scored.slice(0, count).map(s => s.candidate);
      }

      case 'SELECT_STACK':
      case 'SELECT_CARDS': {
        const count = prompt.count || 1;
        return (prompt.candidates || []).slice(0, count);
      }

      case 'BLOCK_CHOICE': {
        const combat = state.combat;
        if (!combat || !combat.attackerStackId) return { block: false };

        const attackerSide = this.side === 'opponent' ? 'player' : 'opponent';
        const attackerStack = state.players[attackerSide].field.find(st => st.id === combat.attackerStackId);
        if (!attackerStack) return { block: false };

        const attackerBp = computeEffectiveBP(state, attackerStack);
        const mySpirits = (state.players[this.side].field || []).filter(st => st.state === 'REFRESHED');
        if (mySpirits.length === 0) return { block: false };

        // 1. Look for a winning blocker (blockerBp > attackerBp)
        const winningBlockers = mySpirits
          .map(st => ({ stack: st, bp: computeEffectiveBP(state, st) }))
          .filter(b => b.bp > attackerBp)
          .sort((a, b) => a.bp - b.bp); // Pick the lowest BP winner

        if (winningBlockers.length > 0) {
          return { block: true, blockerStackId: winningBlockers[0].stack.id };
        }

        // 2. If Life is critical (<= 2) or mustBlockIfAble is true, must block even if destroyed!
        const myLife = state.players[this.side].life;
        const mustBlock = Boolean(combat.mustBlockIfAble) || myLife <= 2;

        if (mustBlock) {
          // Sacrifice the lowest value spirit
          const lowestValue = mySpirits
            .map(st => ({ stack: st, bp: computeEffectiveBP(state, st) }))
            .sort((a, b) => a.bp - b.bp)[0];
          return { block: true, blockerStackId: lowestValue.stack.id };
        }

        return { block: false };
      }

      case 'BURST_TRIGGER':
        return { activate: true };

      case 'FLASH_ACTION': {
        const actions = prompt.availableActions || [];
        const playable = actions.filter(a => a.action !== 'PASS');
        if (playable.length > 0) {
          // Play the first available flash action if in combat
          return playable[0];
        }
        return { action: 'PASS' };
      }

      case 'MULLIGAN_CHOICE': {
        const p = state.players[this.side];
        const hand = p.hand || [];
        // If all cards in hand are high cost (>= 5) and no contract partner, redraw
        const hasLowCost = hand.some(c => (c.cost || 0) <= 3 || c.isContractPartner);
        return { mulligan: !hasLowCost };
      }

      default:
        return null;
    }
  }
}
