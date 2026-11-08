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
  async executeFlagContractAdvent(game, handCard, flagNexusStack, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    p.hand = p.hand.filter(c => c.id !== handCard.id);
    if (!flagNexusStack.under) flagNexusStack.under = [];
    flagNexusStack.under.push(flagNexusStack.top);
    flagNexusStack.top = handCard;
    flagNexusStack.state = 'REFRESHED';

    await events.emit({
      type: 'CONTRACT_ADVENT',
      stack: flagNexusStack,
      card: handCard,
      player: playerSide,
      isFlagAdvent: true
    });
    return { success: true, stack: flagNexusStack };
  }
};

export const SoulMagicKeyword = {
  id: 'Soul Magic',
  name: 'Soul Magic',
  wave: 6,
  async executeSoulMagic(game, magicCard, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    if (p.reserve.soul < 1) return { success: false, reason: 'NO_SOUL_CORE' };
    p.reserve.soul -= 1;
    p.trash.soul = (p.trash.soul || 0) + 1;

    await events.emit({
      type: 'SOUL_MAGIC_CAST',
      card: magicCard,
      player: playerSide
    });
    return { success: true };
  }
};

export const AmplifyKeyword = {
  id: 'Amplify',
  name: 'Amplify',
  wave: 6,
  hooks: {
    async onMagicUsed({ state, game, playerSide }) {
      const p = state.players[playerSide];
      const hasAmplify = (p.field || []).some(st => st.top?.effect && /\[Amplify\]/i.test(st.top.effect));
      if (hasAmplify && p.deck.length > 0) {
        const bonusCard = p.deck.shift();
        p.hand.push(bonusCard);
        await game.events.emit({
          type: 'AMPLIFY_BONUS_DRAW',
          player: playerSide,
          card: bonusCard
        });
      }
    }
  }
};

export const CurrentKeyword = {
  id: 'Current',
  name: 'Current',
  wave: 6,
  hooks: {
    async onCardDrawn({ state, playerSide }) {
      const p = state.players[playerSide];
      const hasCurrent = (p.field || []).some(st => st.top?.effect && /\[Current\]/i.test(st.top.effect));
      if (hasCurrent) {
        p.reserve.normal += 1;
      }
    }
  }
};

export const ShamanismKeyword = {
  id: 'Shamanism',
  name: 'Shamanism',
  wave: 6,
  hooks: {
    async onCoreMovedToTrash({ state, playerSide }) {
      const p = state.players[playerSide];
      const hasShamanism = (p.field || []).some(st => st.top?.effect && /\[Shamanism\]/i.test(st.top.effect));
      if (hasShamanism) {
        state.voidCores = Math.max(0, (state.voidCores || 0) - 1);
        p.reserve.normal += 1;
      }
    }
  }
};

export const LevelUpKeyword = {
  id: 'Level Up',
  name: 'Level Up',
  wave: 6,
  async executeLevelUp(game, targetStack, bonusLevels = 1) {
    const { events } = game;
    if (!targetStack) return { success: false };
    targetStack.bonusLevel = (targetStack.bonusLevel || 0) + bonusLevels;
    await events.emit({
      type: 'LEVEL_UP',
      stack: targetStack,
      bonusLevel: targetStack.bonusLevel
    });
    return { success: true, bonusLevel: targetStack.bonusLevel };
  }
};

export function registerWave6Keywords(registry) {
  registry.register(RumbleKeyword);
  registry.register(FlagContractAdventKeyword);
  registry.register({ ...FlagContractAdventKeyword, id: 'Seal Flag Contract Advent' });
  registry.register(SoulMagicKeyword);
  registry.register(AmplifyKeyword);
  registry.register(CurrentKeyword);
  registry.register(ShamanismKeyword);
  registry.register(LevelUpKeyword);
  registry.register({ ...AmplifyKeyword, id: 'Blue Beat' });
  registry.register({ ...AmplifyKeyword, id: 'Green Wave' });
  registry.register({ ...AmplifyKeyword, id: 'Assemble' });
  registry.register({ ...AmplifyKeyword, id: 'Star Appeal' });
  registry.register({ ...AmplifyKeyword, id: 'Grand Siesta' });
  registry.register({ ...AmplifyKeyword, id: 'Grandphosis' });
  registry.register({ ...AmplifyKeyword, id: 'Grand Mystery' });
  registry.register({ ...AmplifyKeyword, id: 'Hyakka Ryouran' });
}
