/**
 * engine/keywords/wave1.js
 * 
 * Wave 1 Keywords: Core Battle Mechanics for Battle Spirits Eternal.
 * Clash, Curse, Crush, Holy Life, Assault, Windstorm, Awaken, Armor/Heavy Armor, Consecutive Blade.
 */

import { computeLevel } from '../continuous.js';
import { moveCard, moveCore } from '../zones.js';

export const ClashKeyword = {
  id: 'Clash',
  name: 'Clash',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, keyword }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
      }
    }
  }
};

export const CurseKeyword = {
  id: 'Curse',
  name: 'Curse',
  wave: 1,
  hooks: {
    async onBlockDeclared({ state, blockerStack }) {
      if (state.combat) {
        // Tag blocker to be destroyed at end of battle by Curse
        state.combat.curseTargetStackId = blockerStack.id;
      }
    }
  }
};

export const CrushKeyword = {
  id: 'Crush',
  name: 'Crush',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, keyword, game }) {
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      const count = computeLevel(attackerStack); // Crush mills cards equal to spirit's LV

      for (let i = 0; i < count; i++) {
        if (opp.deck.length === 0) break;
        const topCard = opp.deck[0];
        await moveCard(state, topCard, 'grave', oppSide, { cause: 'crush', by: attackerStack.owner }, game.events);
      }
    }
  }
};

export const HolyLifeKeyword = {
  id: 'Holy Life',
  name: 'Holy Life',
  wave: 1,
  hooks: {
    async onLifeDamage({ state, attackerStack, game }) {
      const ownerSide = attackerStack.owner;
      const owner = state.players[ownerSide];
      if (owner.life < 5) {
        await moveCore(state, 1, { zone: 'void' }, { zone: 'life', side: ownerSide }, {
          cause: 'holy_life',
          by: ownerSide
        }, game.events);
      }
    }
  }
};

export const AssaultKeyword = {
  id: 'Assault',
  name: 'Assault',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, resolver, game }) {
      const ownerSide = attackerStack.owner;
      const owner = state.players[ownerSide];

      // Find ready Nexuses
      const readyNexuses = (owner.nexus || []).filter(n => n.state === 'REFRESHED');
      if (readyNexuses.length === 0) return;

      const choice = await resolver.promptResolver.choose({
        type: 'CONFIRM_ASSAULT',
        title: 'Activate [Assault]: Exhaust a Nexus to refresh this Spirit?',
        candidates: readyNexuses,
        chooser: ownerSide
      });

      if (choice && choice.accepted) {
        const nexusToExhaust = choice.nexus || readyNexuses[0];
        nexusToExhaust.state = 'EXHAUSTED';
        attackerStack.state = 'REFRESHED';
      }
    }
  }
};

export const WindstormKeyword = {
  id: 'Windstorm',
  name: 'Windstorm',
  wave: 1,
  hooks: {
    async onBlockDeclared({ state, blockerStack, keyword, resolver, game }) {
      const blockerOwner = blockerStack.owner;
      const p = state.players[blockerOwner];
      const otherSpirits = (p.field || []).filter(st => st.id !== blockerStack.id && st.state === 'REFRESHED');
      if (otherSpirits.length === 0) return;

      const count = parseInt(keyword.parameter || '1', 10);
      const chosen = await resolver.promptResolver.choose({
        type: 'SELECT_WINDSTORM_EXHAUST',
        title: `Windstorm: Choose ${count} other Spirit(s) to exhaust`,
        candidates: otherSpirits,
        count,
        chooser: blockerOwner
      });

      for (const item of chosen || otherSpirits.slice(0, count)) {
        const st = item.stack || item;
        if (st) st.state = 'EXHAUSTED';
      }
    }
  }
};

export const AwakenKeyword = {
  id: 'Awaken',
  name: 'Awaken',
  wave: 1,
  hooks: {
    async onFlash({ state, stack, resolver, game }) {
      const ownerSide = stack.owner;
      const p = state.players[ownerSide];
      const otherSpirits = (p.field || []).filter(st => st.id !== stack.id && ((st.cores.normal > 0) || st.cores.soul > 0));
      if (otherSpirits.length === 0) return;

      const choice = await resolver.promptResolver.choose({
        type: 'AWAKEN_MOVE_CORES',
        title: '[Awaken]: Move cores from your other spirits to this Spirit',
        candidates: otherSpirits,
        chooser: ownerSide
      });

      if (choice && choice.sourceStackId && choice.cores > 0) {
        await moveCore(
          state,
          choice.cores,
          { zone: 'field', side: ownerSide, stackId: choice.sourceStackId },
          { zone: 'field', side: ownerSide, stackId: stack.id },
          { isSoulCore: Boolean(choice.isSoulCore), cause: 'awaken' },
          game.events
        );
      }
    }
  }
};

export const HeavyArmorKeyword = {
  id: 'Heavy Armor',
  name: 'Heavy Armor',
  wave: 1,
  hooks: {} // Passive continuous protection handled via engine/continuous.js and selectors.js
};

export const ConsecutiveBladeKeyword = {
  id: 'Consecutive Blade',
  name: 'Consecutive Blade',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, keyword }) {
      if (state.combat) {
        state.combat.multiTargetBattle = true;
      }
    }
  }
};

export function registerWave1Keywords(registry) {
  registry.register(ClashKeyword);
  registry.register({ ...ClashKeyword, id: 'True-Clash' });
  registry.register(CurseKeyword);
  registry.register({ ...CurseKeyword, id: 'True-Curse' });
  registry.register(CrushKeyword);
  registry.register({ ...CrushKeyword, id: 'Great Crush' });
  registry.register(HolyLifeKeyword);
  registry.register({ ...HolyLifeKeyword, id: 'Ultra Holy Life' });
  registry.register(AssaultKeyword);
  registry.register(WindstormKeyword);
  registry.register(AwakenKeyword);
  registry.register(HeavyArmorKeyword);
  registry.register({ ...HeavyArmorKeyword, id: 'Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'Ultra Armor' });
  registry.register(ConsecutiveBladeKeyword);
}
