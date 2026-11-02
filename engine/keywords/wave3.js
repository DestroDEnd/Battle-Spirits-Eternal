/**
 * engine/keywords/wave3.js
 * 
 * Wave 3 Keywords: Ultimate Triggers & Collab Mechanics for Battle Spirits Eternal.
 * Ultimate Trigger (Hit, Critical, Double, Triple, Quadruple), A.T. Field, Brilliance.
 */

import { moveCard } from '../zones.js';

export const UltimateTriggerKeyword = {
  id: 'Ultimate Trigger',
  name: 'Ultimate Trigger',
  wave: 3,
  async executeUTrigger(game, ultimateStack, triggerCount = 1) {
    const { state, events, resolver } = game;
    const oppSide = ultimateStack.owner === 'player' ? 'opponent' : 'player';
    const opp = state.players[oppSide];
    const uCost = ultimateStack.top.cost || 6;

    let hitCount = 0;
    const revealedCards = [];

    for (let i = 0; i < triggerCount; i++) {
      if (opp.deck.length === 0) break;
      const topCard = opp.deck[0];
      const cardCost = topCard.cost || 0;
      const isHit = cardCost < uCost;

      if (isHit) hitCount++;
      revealedCards.push({ card: topCard, cost: cardCost, isHit });

      // Move revealed card to opposing trash
      await moveCard(state, topCard, 'grave', oppSide, { cause: 'u_trigger' }, events);
    }

    await events.emit({
      type: 'U_TRIGGER_RESOLVED',
      ultimate: ultimateStack,
      revealedCards,
      hitCount,
      isHit: hitCount > 0
    });

    return {
      hitCount,
      isHit: hitCount > 0,
      revealedCards
    };
  }
};

export const ATFieldKeyword = {
  id: 'A.T. Field',
  name: 'A.T. Field',
  wave: 3,
  hooks: {} // Continuous immunity handled in continuous.js
};

export const BrillianceKeyword = {
  id: 'Brilliance',
  name: 'Brilliance',
  wave: 3,
  hooks: {
    async onEndStep({ state, game, playerSide }) {
      const p = state.players[playerSide];
      // Returns 1 Magic card used this turn from grave to hand
      const magicInGrave = p.grave.filter(c => c.type === 'Magic');
      if (magicInGrave.length > 0) {
        const lastMagic = magicInGrave[magicInGrave.length - 1];
        await moveCard(state, lastMagic, 'hand', playerSide, { cause: 'brilliance' }, game.events);
      }
    }
  }
};

export function registerWave3Keywords(registry) {
  registry.register(UltimateTriggerKeyword);
  registry.register({ ...UltimateTriggerKeyword, id: 'U-Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Double Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Triple Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Quadruple Ultimate Trigger' });
  registry.register(ATFieldKeyword);
  registry.register(BrillianceKeyword);
}
