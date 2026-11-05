/**
 * engine/keywords/wave4.js
 * 
 * Wave 4 Keywords: Advanced Color & Strategic Battle Mechanics.
 * Immortality, Tribute, Unsheathe, Bombardment, Pursuit, Showdown, Poison Blade,
 * Spellbind, Spell Blight, Soar, Bunshin, Ice Wall, Kagemusha, Silver Wheel,
 * Excite, Load, Fast Draw, Dispersion, Summon Bolt, AFO, Stampede.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';
import { computeLevel } from '../continuous.js';

export const PursuitKeyword = {
  id: 'Pursuit',
  name: 'Pursuit',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, stack, attackerStack }) {
      const target = attackerStack || stack;
      if (target) {
        target.state = 'HEAVY_EXHAUSTED';
      }
    }
  }
};

export const SoarKeyword = {
  id: 'Soar',
  name: 'Soar',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.soarActive = true;
      }
    },
    async onBattleEnd({ state, attackerStack }) {
      if (attackerStack) {
        attackerStack.state = 'REFRESHED';
      }
      if (state.combat) {
        state.combat.soarActive = false;
      }
    }
  }
};

export const BunshinKeyword = {
  id: 'Bunshin',
  name: 'Bunshin',
  wave: 4,
  async executeBunshin(game, playerSide = 'player', count = 1) {
    const { state, events } = game;
    const p = state.players[playerSide];

    if (!p.deck || p.deck.length < count) {
      return { success: false, reason: 'INSUFFICIENT_DECK' };
    }

    const createdStacks = [];
    for (let i = 0; i < count; i++) {
      if (p.deck.length === 0) break;
      const topCard = p.deck.shift();
      topCard.isBunshin = true;
      topCard.cost = 0;
      topCard.type = 'Spirit';
      topCard.levels = { 1: { cost: 1, bp: 3000 } };

      let corePaid = false;
      if (p.reserve.normal > 0) {
        p.reserve.normal -= 1;
        corePaid = true;
      } else if (p.reserve.soul > 0) {
        p.reserve.soul -= 1;
        corePaid = true;
      }

      const stack = createFieldStack(topCard, { normal: corePaid ? 1 : 0, soul: 0 });
      stack.state = 'REFRESHED';
      stack.owner = playerSide;
      p.field.push(stack);
      createdStacks.push(stack);

      if (events) {
        await events.emit({
          type: 'BUNSHIN_SUMMONED',
          player: playerSide,
          stack,
          card: topCard
        });
      }
    }

    return { success: true, stacks: createdStacks };
  }
};

export const IceWallKeyword = {
  id: 'Ice Wall',
  name: 'Ice Wall',
  wave: 4,
  hooks: {
    async onMagicUsed({ state, stack, event, keyword }) {
      if (!stack || stack.state !== 'REFRESHED') return;
      if (!event || !event.card) return;

      const param = (keyword && keyword.parameter) ? keyword.parameter : '';
      const allowedColors = param.split(/[\/,]/).map(s => s.trim().toLowerCase()).filter(Boolean);

      const magicColors = (event.card.colors || [event.card.color || 'White']).map(c => c.toLowerCase());
      const matches = allowedColors.length === 0 ||
                      allowedColors.includes('all') ||
                      magicColors.some(c => allowedColors.includes(c));

      if (matches) {
        event.negated = true;
        stack.state = 'EXHAUSTED';
      }
    }
  }
};

export const LoadKeyword = {
  id: 'Load',
  name: 'Load',
  wave: 4,
  async executeLoad(game, playerSide = 'player', count = 1) {
    const { state, events } = game;
    const p = state.players[playerSide];

    const partnerStack = (p.field || []).find(st => st.top && (st.top.isContractPartner || st.top.isContract));
    if (!partnerStack) {
      return { success: false, reason: 'NO_CONTRACT_PARTNER' };
    }

    if (!partnerStack.under) {
      partnerStack.under = [];
    }

    let loaded = 0;
    for (let i = 0; i < count; i++) {
      if (!p.deck || p.deck.length === 0) break;
      const topCard = p.deck.shift();
      partnerStack.under.push(topCard);
      p.counters = (p.counters || 0) + 1;
      loaded++;
    }

    if (events) {
      await events.emit({
        type: 'LOAD_RESOLVED',
        player: playerSide,
        partnerStack,
        count: loaded,
        newCounter: p.counters
      });
    }

    return { success: true, loadedCount: loaded, partnerStack };
  }
};

export const ImmortalityKeyword = {
  id: 'Immortality',
  name: 'Immortality',
  wave: 4,
  hooks: {
    async onBattleDestroyed({ state, card, keyword, game }) {
      // Allows revival or trigger from trash when target condition spirit is destroyed
    }
  }
};

export const TributeKeyword = {
  id: 'Tribute',
  name: 'Tribute',
  wave: 4,
  async executeTribute(game, targetStack, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    const idx = p.field.indexOf(targetStack);
    if (idx !== -1) {
      p.field.splice(idx, 1);
      p.grave.push(targetStack.top);
      p.trash.normal += (targetStack.cores.normal || 0);
      if (targetStack.cores.soul) p.reserve.soul += 1;
      return { success: true };
    }
    return { success: false };
  }
};

export const UnsheatheKeyword = {
  id: 'Unsheathe',
  name: 'Unsheathe',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, keyword }) {
      // Free Sword Brave summon trigger
    }
  }
};

export const BombardmentKeyword = {
  id: 'Bombardment',
  name: 'Bombardment',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, attackerStack, keyword, game }) {
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      const count = parseInt(keyword.parameter, 10) || 1;
      for (let i = 0; i < count; i++) {
        if (opp.deck.length === 0) break;
        const card = opp.deck.shift();
        opp.grave.push(card);
      }
    }
  }
};

export const ShowdownKeyword = {
  id: 'Showdown',
  name: 'Showdown',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
      }
    }
  }
};

export const PoisonBladeKeyword = {
  id: 'Poison Blade',
  name: 'Poison Blade',
  wave: 4,
  async executePoisonBlade(game, targetStack, count = 1) {
    const oppSide = targetStack.owner;
    const opp = game.state.players[oppSide];
    if (!targetStack.under) targetStack.under = [];
    for (let i = 0; i < count; i++) {
      if (opp.deck.length === 0) break;
      targetStack.under.push(opp.deck.shift());
    }
    return { success: true, count };
  }
};

export const SpellbindKeyword = {
  id: 'Spellbind',
  name: 'Spellbind',
  wave: 4,
  hooks: {}
};

export const SpellBlightKeyword = {
  id: 'Spell Blight',
  name: 'Spell Blight',
  wave: 4,
  hooks: {}
};

export const KagemushaKeyword = {
  id: 'Kagemusha',
  name: 'Kagemusha',
  wave: 4,
  hooks: {}
};

export const SilverWheelKeyword = {
  id: 'Silver Wheel',
  name: 'Silver Wheel',
  wave: 4,
  hooks: {}
};

export const ExciteKeyword = {
  id: 'Excite',
  name: 'Excite',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
      }
    }
  }
};

export const FastDrawKeyword = {
  id: 'Fast Draw',
  name: 'Fast Draw',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, attackerStack, game }) {
      const p = state.players[attackerStack.owner];
      if (p.deck.length > 0) {
        p.hand.push(p.deck.shift());
      }
    }
  }
};

export const DispersionKeyword = {
  id: 'Dispersion',
  name: 'Dispersion',
  wave: 4,
  hooks: {}
};

export const SummonBoltKeyword = {
  id: 'Summon Bolt',
  name: 'Summon Bolt',
  wave: 4,
  hooks: {}
};

export const AFOKeyword = {
  id: 'AFO',
  name: 'AFO',
  wave: 4,
  hooks: {}
};

export const StampedeKeyword = {
  id: 'Stampede',
  name: 'Stampede',
  wave: 4,
  hooks: {
    async onBattleDestroyed({ state, attackerStack, game }) {
      if (!attackerStack) return;
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      if (opp.life > 0) {
        await moveCore(state, 1, { zone: 'life', side: oppSide }, { zone: 'reserve', side: oppSide }, {
          cause: 'stampede',
          by: attackerStack.owner
        }, game.events);
      }
    }
  }
};

export function registerWave4Keywords(registry) {
  registry.register(PursuitKeyword);
  registry.register(SoarKeyword);
  registry.register(BunshinKeyword);
  registry.register(IceWallKeyword);
  registry.register(LoadKeyword);
  registry.register(ImmortalityKeyword);
  registry.register(TributeKeyword);
  registry.register(UnsheatheKeyword);
  registry.register(BombardmentKeyword);
  registry.register(ShowdownKeyword);
  registry.register(PoisonBladeKeyword);
  registry.register(SpellbindKeyword);
  registry.register(SpellBlightKeyword);
  registry.register(KagemushaKeyword);
  registry.register(SilverWheelKeyword);
  registry.register(ExciteKeyword);
  registry.register(FastDrawKeyword);
  registry.register(DispersionKeyword);
  registry.register(SummonBoltKeyword);
  registry.register(AFOKeyword);
  registry.register(StampedeKeyword);
}
