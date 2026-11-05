/**
 * engine/keywords/wave6.js
 * 
 * Wave 6 Keywords: 2026 Cross-Format Modern Mechanics.
 * Flag Contract Advent, Soul Magic, Amplify, Rumble, Current, Shamanism, Level Up.
 */

import { moveCard } from '../zones.js';

export const RumbleKeyword = {
  id: 'Rumble',
  name: 'Rumble',
  wave: 6,
  hooks: {
    async onBattleEnd({ state, attackerStack, blockerCard, keyword, game }) {
      if (!attackerStack) return;
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      const paramVal = parseInt(keyword && keyword.parameter, 10) || 0;
      const blockerCost = (blockerCard && blockerCard.cost) ? blockerCard.cost : 0;
      const count = Math.max(0, paramVal - blockerCost);

      for (let i = 0; i < count; i++) {
        if (!opp.deck || opp.deck.length === 0) break;
        const card = opp.deck.shift();
        opp.grave.push(card);
      }
    }
  }
};

export const FlagContractAdventKeyword = {
  id: 'Flag Contract Advent',
  name: 'Flag Contract Advent',
  wave: 6,
  hooks: {}
};

export const SoulMagicKeyword = {
  id: 'Soul Magic',
  name: 'Soul Magic',
  wave: 6,
  hooks: {}
};

export const AmplifyKeyword = {
  id: 'Amplify',
  name: 'Amplify',
  wave: 6,
  hooks: {}
};

export const CurrentKeyword = {
  id: 'Current',
  name: 'Current',
  wave: 6,
  hooks: {}
};

export const ShamanismKeyword = {
  id: 'Shamanism',
  name: 'Shamanism',
  wave: 6,
  hooks: {}
};

export const LevelUpKeyword = {
  id: 'Level Up',
  name: 'Level Up',
  wave: 6,
  hooks: {}
};

export function registerWave6Keywords(registry) {
  registry.register(RumbleKeyword);
  registry.register(FlagContractAdventKeyword);
  registry.register(SoulMagicKeyword);
  registry.register(AmplifyKeyword);
  registry.register(CurrentKeyword);
  registry.register(ShamanismKeyword);
  registry.register(LevelUpKeyword);
}
