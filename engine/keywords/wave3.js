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
    async onBattleEnd({ state, game, attackerStack }) {
      // Official Bandai ruling: At the end of battle, return all Magic cards you used during this battle to your Hand.
      const combat = state.combat;
      const ownerSide = attackerStack ? attackerStack.owner : (combat ? combat.attackerSide : 'player');
      const p = state.players[ownerSide];
      if (!p) return;

      const usedMagics = (combat && combat.usedMagicCards) || [];
      if (usedMagics.length > 0) {
        for (const mCard of usedMagics) {
          const gIdx = p.grave.findIndex(c => c.id === mCard.id || c.name === mCard.name);
          if (gIdx !== -1) {
            const cardToReturn = p.grave.splice(gIdx, 1)[0];
            p.hand.push(cardToReturn);
            await game.events.emit({
              type: 'SALVAGE',
              card: cardToReturn,
              player: ownerSide,
              cause: 'brilliance'
            });
          }
        }
      } else {
        // Fallback: If magics weren't individually tagged in combat, return all Magic cards from grave used this turn
        const magicInGrave = p.grave.filter(c => c.type === 'Magic');
        for (const mCard of magicInGrave) {
          await moveCard(state, mCard, 'hand', ownerSide, { cause: 'brilliance' }, game.events);
        }
      }
    },
    async onEndStep({ state, game, playerSide }) {
      const p = state.players[playerSide];
      const magicInGrave = p.grave.filter(c => c.type === 'Magic');
      for (const mCard of magicInGrave) {
        await moveCard(state, mCard, 'hand', playerSide, { cause: 'brilliance' }, game.events);
      }
    }
  }
};

export const SpiritSoulKeyword = {
  id: 'Spirit Soul',
  hooks: {}
};

export const CoreChargeKeyword = {
  id: 'Core Charge',
  hooks: {}
};

export const GrandSkillKeyword = {
  id: 'Grand Skill',
  hooks: {}
};

export const BraveKeyword = {
  id: 'Brave',
  hooks: {}
};

export function registerWave3Keywords(registry) {
  registry.register(UltimateTriggerKeyword);
  registry.register({ ...UltimateTriggerKeyword, id: 'U-Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Double Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Triple Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Quadruple Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Octa Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Count Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Double Count Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Cross Ultimate Trigger' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Critical Hit' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Double Hit' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Triple Hit' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Quadruple Hit' });
  registry.register({ ...UltimateTriggerKeyword, id: 'Trigger Counter' });
  registry.register(ATFieldKeyword);
  registry.register(BrillianceKeyword);
  registry.register(SpiritSoulKeyword);
  registry.register(CoreChargeKeyword);
  registry.register({ ...CoreChargeKeyword, id: 'Neo-Core Charge' });
  registry.register(GrandSkillKeyword);
  registry.register({ ...GrandSkillKeyword, id: 'Grand Field' });
  registry.register({ ...GrandSkillKeyword, id: 'Contract Skill' });
  registry.register({ ...GrandSkillKeyword, id: 'Contract Field' });
  registry.register({ ...GrandSkillKeyword, id: 'Release' });
  registry.register(BraveKeyword);
  registry.register({ ...BraveKeyword, id: 'Brave Engage' });
  registry.register({ ...BraveKeyword, id: 'Double Drive' });
  registry.register({ ...BraveKeyword, id: 'Reload' });
  registry.register({ ...BraveKeyword, id: 'Contract Reload' });
  registry.register({ ...BraveKeyword, id: 'Revive' });
}
