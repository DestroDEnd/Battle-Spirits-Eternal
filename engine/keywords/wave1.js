/**
 * engine/keywords/wave1.js
 * 
 * Wave 1 Keywords: Core Battle Mechanics for Battle Spirits Eternal.
 * Clash, Curse, Crush, Holy Life, Assault, Windstorm, Awaken, Armor/Heavy Armor, Consecutive Blade.
 */

import { computeLevel } from '../continuous.js';
import { moveCard, moveCore, commitStackExit } from '../zones.js';

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
    async onAttackDeclared({ state, attackerStack, game }) {
      if (!state.combat || !attackerStack) return;
      // Bandai Official Ruling:
      // "By sending [Soul Core] from this Spirit to your Trash, the opponent must block
      // with two Spirits/Ultimates if possible, and they simultaneously battle this Spirit."
      if (attackerStack.cores.soul > 0) {
        attackerStack.cores.soul -= 1;
        const ownerSide = attackerStack.owner || 'player';
        state.players[ownerSide].trash.soul = (state.players[ownerSide].trash.soul || 0) + 1;
        state.combat.mustBlockIfAble = true;
        state.combat.requiredBlockerCount = 2;
        state.combat.simultaneousBattle = true;
        state.combat.multiTargetBattle = true;
        if (game?.events) {
          await game.events.emit({
            type: 'CONSECUTIVE_BLADE_ACTIVATED',
            stack: attackerStack,
            player: ownerSide
          });
        }
      }
    }
  }
};

export const TrueConsecutiveBladeKeyword = {
  id: 'True-Consecutive Blade',
  name: 'True-Consecutive Blade',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, game }) {
      if (!state.combat || !attackerStack) return;
      // Bandai Official Ruling:
      // "By sending [Soul Core] from this Spirit to your Trash, target up to two opposing Spirits/Ultimates
      // and battle them at once. For each battling opposing target destroyed by comparing BP, send 1 core from opposing Life to their Reserve."
      if (attackerStack.cores.soul > 0) {
        attackerStack.cores.soul -= 1;
        const ownerSide = attackerStack.owner || 'player';
        state.players[ownerSide].trash.soul = (state.players[ownerSide].trash.soul || 0) + 1;
        state.combat.simultaneousBattle = true;
        state.combat.multiTargetBattle = true;
        state.combat.maxTargetCount = 2;
        state.combat.destroyLifeBurn = 1;
        if (game?.events) {
          await game.events.emit({
            type: 'TRUE_CONSECUTIVE_BLADE_ACTIVATED',
            stack: attackerStack,
            player: ownerSide
          });
        }
      }
    }
  }
};

export const RekkaConsecutiveBladeKeyword = {
  id: 'Rekka Consecutive Blade',
  name: 'Rekka Consecutive Blade',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, game }) {
      if (!state.combat || !attackerStack) return;
      // Target any number of opposing Spirits/Ultimates and battle simultaneously
      state.combat.simultaneousBattle = true;
      state.combat.multiTargetBattle = true;
      state.combat.lockDefenderCores = true;
      if (game?.events) {
        await game.events.emit({
          type: 'REKKA_CONSECUTIVE_BLADE_ACTIVATED',
          stack: attackerStack,
          player: attackerStack.owner
        });
      }
    }
  }
};

export const WhirlwindKeyword = {
  id: 'Whirlwind',
  name: 'Whirlwind',
  wave: 1,
  async executeWhirlwind(game, userStack, targetStacks = [], count = 1) {
    const { events } = game;
    const targets = (Array.isArray(targetStacks) ? targetStacks : [targetStacks]).slice(0, count);
    for (const target of targets) {
      if (!target) continue;
      target.state = 'HEAVY_EXHAUSTED';
      target.heavyExhausted = true;
    }
    if (events) {
      await events.emit({
        type: 'WHIRLWIND_ACTIVATED',
        userStack,
        targets,
        count: targets.length
      });
    }
    return { success: true, targets };
  }
};

export const TrueAwakenKeyword = {
  id: 'True-Awaken',
  name: 'True-Awaken',
  wave: 1,
  async executeTrueAwaken(game, ultimateStack, donorStack, coreCount = 1) {
    const { events } = game;
    if (!ultimateStack || !donorStack || donorStack.cores.normal < coreCount) {
      return { success: false, reason: 'INSUFFICIENT_DONOR_CORES' };
    }
    donorStack.cores.normal -= coreCount;
    ultimateStack.cores.normal += coreCount;
    ultimateStack.tempBP = (ultimateStack.tempBP || 0) + 3000;
    if (events) {
      await events.emit({
        type: 'TRUE_AWAKEN_RESOLVED',
        ultimateStack,
        donorStack,
        count: coreCount,
        bpBonus: 3000
      });
    }
    return { success: true, ultimateStack, bpBonus: 3000 };
  }
};

export const ToppaAwakenKeyword = {
  id: 'Toppa Awaken',
  name: 'Toppa Awaken',
  wave: 1,
  async executeToppaAwaken(game, targetStack, sourceSide = 'player', coreCount = 1) {
    const { state, events } = game;
    const p = state.players[sourceSide];
    if (p.reserve.normal < coreCount) return { success: false, reason: 'INSUFFICIENT_RESERVE_CORES' };
    p.reserve.normal -= coreCount;
    targetStack.cores.normal += coreCount;
    p.counters = (p.counters || 0) + 1;
    if (game.flow?.state?.currentStep?.toUpperCase().includes('ATTACK') || state.combat) {
      p.counters += 1;
    }
    if (events) {
      await events.emit({
        type: 'TOPPA_AWAKEN_RESOLVED',
        targetStack,
        player: sourceSide,
        count: coreCount,
        newCounter: p.counters
      });
    }
    return { success: true, targetStack, newCounter: p.counters };
  }
};

export const TrueClashKeyword = {
  id: 'True-Clash',
  name: 'True-Clash',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, keyword }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
        // True-Clash forces either opposing Spirits OR Ultimates to block
        state.combat.blockerTypes = ['Spirit', 'Ultimate'];
      }
    }
  }
};

export const TrueCurseKeyword = {
  id: 'True-Curse',
  name: 'True-Curse',
  wave: 1,
  hooks: {
    async onBattleDestroyed({ state, attackerStack, destroyedCard, resolver, game }) {
      // True-Curse: When destroyed/leaving field due to opponent, destroy an opposing Spirit or Ultimate
      const card = destroyedCard || attackerStack?.top;
      const ownerSide = card?.currentOwner || card?.owner || attackerStack?.owner || 'player';
      const oppSide = ownerSide === 'player' ? 'opponent' : 'player';
      const oppField = (state.players[oppSide]?.field || []).filter(st => st.top && (st.top.type === 'Spirit' || st.top.type === 'Ultimate'));
      if (oppField.length > 0) {
        const chosen = await resolver?.promptResolver?.choose({
          type: 'SELECT_TRUE_CURSE_TARGET',
          title: '[True-Curse]: Destroy an opposing Spirit/Ultimate',
          candidates: oppField,
          chooser: ownerSide
        });
        const selected = Array.isArray(chosen) ? chosen[0] : chosen;
        const target = (selected && (selected.stack || selected)) || oppField[0];
        if (target) {
          await commitStackExit(state, target, 'grave', { cause: 'true_curse' }, game.events);
        }
      }
    }
  }
};

export const GreatCrushKeyword = {
  id: 'Great Crush',
  name: 'Great Crush',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, resolver, game }) {
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      const count = computeLevel(attackerStack) * 5; // Great Crush discards 5 cards per Level!
      let burstMilledCount = 0;

      for (let i = 0; i < count; i++) {
        if (opp.deck.length === 0) break;
        const topCard = opp.deck[0];
        const isBurst = Boolean(topCard.burst || topCard.isBurst || (topCard.effect && /\[burst/i.test(topCard.effect)));
        if (isBurst) burstMilledCount++;
        await moveCard(state, topCard, 'grave', oppSide, { cause: 'great_crush', by: attackerStack.owner }, game.events);
      }

      // When any card with Burst effects is discarded, destroy an opposing Spirit
      if (burstMilledCount > 0) {
        const oppSpirits = (opp.field || []).filter(st => st.top && st.top.type === 'Spirit');
        if (oppSpirits.length > 0) {
          const chosen = await resolver?.promptResolver?.choose({
            type: 'SELECT_GREAT_CRUSH_DESTROY',
            title: `[Great Crush]: Destroy an opposing Spirit (${burstMilledCount} Burst card(s) milled)`,
            candidates: oppSpirits,
            chooser: attackerStack.owner
          });
          const selected = Array.isArray(chosen) ? chosen[0] : chosen;
          const target = (selected && (selected.stack || selected)) || oppSpirits[0];
          if (target) {
            await commitStackExit(state, target, 'grave', { cause: 'great_crush_burst_destroy', by: attackerStack.owner }, game.events);
          }
        }
      }
    }
  }
};

export const UltraHolyLifeKeyword = {
  id: 'Ultra Holy Life',
  name: 'Ultra Holy Life',
  wave: 1,
  hooks: {
    async onBlockDeclared({ state, attackerStack, game }) {
      // When blocked: draw 1 card from deckbottom
      const ownerSide = attackerStack?.owner || 'player';
      const owner = state.players[ownerSide];
      if (owner && owner.deck && owner.deck.length > 0) {
        const bottomCard = owner.deck.pop();
        owner.hand.push(bottomCard);
        await game.events.emit({
          type: 'DRAW',
          card: bottomCard,
          player: ownerSide,
          from: 'deckbottom',
          cause: 'ultra_holy_life'
        });
      }
    },
    async onLifeDamage({ state, attackerStack, game }) {
      // When not blocked: put 1 core from Void to Life (can exceed 5!)
      const ownerSide = attackerStack?.owner || 'player';
      await moveCore(state, 1, { zone: 'void' }, { zone: 'life', side: ownerSide }, {
        cause: 'ultra_holy_life',
        by: ownerSide
      }, game.events);
    }
  }
};

export const FierceWindstormKeyword = {
  id: 'Fierce Windstorm',
  name: 'Fierce Windstorm',
  wave: 1,
  hooks: {
    async onBlockDeclared({ state, blockerStack, keyword, resolver, game }) {
      const blockerOwner = blockerStack.owner;
      const p = state.players[blockerOwner];
      const otherTargets = (p.field || []).filter(st => st.id !== blockerStack.id && st.state === 'REFRESHED' && (st.top?.type === 'Spirit' || st.top?.type === 'Ultimate'));
      if (otherTargets.length === 0) return;

      const count = parseInt(keyword?.parameter || '1', 10);
      const chosen = await resolver?.promptResolver?.choose({
        type: 'SELECT_FIERCE_WINDSTORM_EXHAUST',
        title: `[Fierce Windstorm]: Choose ${count} opposing Spirit(s)/Ultimate(s) to exhaust (cannot refresh next step)`,
        candidates: otherTargets,
        count,
        chooser: blockerOwner
      });

      const list = Array.isArray(chosen) ? chosen : (chosen ? [chosen] : otherTargets.slice(0, count));
      for (const item of list) {
        const st = item?.stack || item;
        if (st) {
          st.state = 'EXHAUSTED';
          st.cannotRefreshNextStep = true;
        }
      }
    }
  }
};

export const UltraArmorKeyword = {
  id: 'Ultra Armor',
  name: 'Ultra Armor',
  wave: 1,
  protectsUltimates: true,
  hooks: {} // Evaluated in engine/continuous.js with full Spirit + Ultimate + Brave + Nexus + Magic immunity
};

export const SupremeClashKeyword = {
  id: 'Supreme Clash',
  name: 'Supreme Clash',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, resolver, game }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
        state.combat.blockerTypes = ['Spirit', 'Ultimate'];
        const oppSide = attackerStack?.owner === 'player' ? 'opponent' : 'player';
        const oppField = (state.players[oppSide]?.field || []).filter(st => st.state === 'REFRESHED');
        if (oppField.length > 0) {
          const chosen = await resolver?.promptResolver?.choose({
            type: 'SELECT_SUPREME_CLASH_EXHAUST',
            title: '[Supreme Clash]: Exhaust 1 opposing Spirit or Ultimate',
            candidates: oppField,
            chooser: attackerStack?.owner || 'player'
          });
          const selected = Array.isArray(chosen) ? chosen[0] : chosen;
          const target = (selected && (selected.stack || selected)) || oppField[0];
          if (target) {
            target.state = 'EXHAUSTED';
          }
        }
      }
    }
  }
};

export const GrandAssaultKeyword = {
  id: 'Grand Assault',
  name: 'Grand Assault',
  wave: 1,
  hooks: {
    async onAttackDeclared({ state, attackerStack, resolver, game }) {
      const ownerSide = attackerStack?.owner || 'player';
      const oppSide = ownerSide === 'player' ? 'opponent' : 'player';
      const allNexuses = [
        ...(state.players[ownerSide]?.nexus || []).filter(n => n.state === 'REFRESHED'),
        ...(state.players[oppSide]?.nexus || []).filter(n => n.state === 'REFRESHED')
      ];
      if (allNexuses.length === 0) return;

      const choice = await resolver?.promptResolver?.choose({
        type: 'CONFIRM_GRAND_ASSAULT',
        title: 'Activate [Grand Assault]: Exhaust a Nexus to refresh this Spirit?',
        candidates: allNexuses,
        chooser: ownerSide
      });

      if (choice && choice.accepted !== false) {
        const selected = Array.isArray(choice) ? choice[0] : choice;
        const nexusToExhaust = selected?.nexus || selected || allNexuses[0];
        if (nexusToExhaust) {
          nexusToExhaust.state = 'EXHAUSTED';
          attackerStack.state = 'REFRESHED';
          if (state.combat) {
            state.combat.blockerMinSymbols = (attackerStack.top.symbols || [attackerStack.top.color || 'Red']).length;
          }
        }
      }
    }
  }
};

export const UltraAwakenKeyword = {
  id: 'Ultra Awaken',
  name: 'Ultra Awaken',
  wave: 1,
  hooks: {
    async onFlash({ state, stack, resolver, game }) {
      const ownerSide = stack.owner;
      const p = state.players[ownerSide];
      const otherSpirits = (p.field || []).filter(st => st.id !== stack.id && ((st.cores.normal > 0) || st.cores.soul > 0));
      if (otherSpirits.length === 0) return;

      const choice = await resolver?.promptResolver?.choose({
        type: 'ULTRA_AWAKEN_MOVE_CORES',
        title: '[Ultra Awaken]: Move cores from your other spirits to this Spirit',
        candidates: otherSpirits,
        chooser: ownerSide
      });

      if (choice && choice.sourceStackId && choice.cores > 0) {
        await moveCore(
          state,
          choice.cores,
          { zone: 'field', side: ownerSide, stackId: choice.sourceStackId },
          { zone: 'field', side: ownerSide, stackId: stack.id },
          { isSoulCore: Boolean(choice.isSoulCore), cause: 'ultra_awaken' },
          game.events
        );
      }
    },
    async onBPCompare({ state, attackerStack, blockerStack }) {
      for (const st of [attackerStack, blockerStack]) {
        if (!st || !st.top) continue;
        const hasUltraAwaken = (st.top.keywords || []).some(k => (typeof k === 'string' ? k : k?.name) === 'Ultra Awaken') ||
          (st.top.effect && /\[Ultra Awaken\]/i.test(st.top.effect));
        if (hasUltraAwaken) {
          const totalCores = (st.cores.normal || 0) + (st.cores.soul ? 1 : 0);
          if (totalCores >= 4) {
            st.state = 'REFRESHED';
          }
        }
      }
    }
  }
};

export function registerWave1Keywords(registry) {
  registry.register(ClashKeyword);
  registry.register(TrueClashKeyword);
  registry.register(SupremeClashKeyword);
  registry.register({ ...SupremeClashKeyword, id: 'Ultra Clash' });
  registry.register({ ...ClashKeyword, id: 'Clash X' });
  registry.register(CurseKeyword);
  registry.register(TrueCurseKeyword);
  registry.register(CrushKeyword);
  registry.register(GreatCrushKeyword);
  registry.register({ ...CrushKeyword, id: 'Wave Crush' });
  registry.register({ ...GreatCrushKeyword, id: 'XV Crush' });
  registry.register(HolyLifeKeyword);
  registry.register(UltraHolyLifeKeyword);
  registry.register({ ...UltraHolyLifeKeyword, id: 'Divine Holy Life' });
  registry.register({ ...HolyLifeKeyword, id: 'Chaotic Holy Life' });
  registry.register(AssaultKeyword);
  registry.register(GrandAssaultKeyword);
  registry.register({ ...GrandAssaultKeyword, id: 'Great Assault' });
  registry.register({ ...AssaultKeyword, id: 'Dark Assault' });
  registry.register(WindstormKeyword);
  registry.register(FierceWindstormKeyword);
  registry.register(AwakenKeyword);
  registry.register(UltraAwakenKeyword);
  registry.register(HeavyArmorKeyword);
  registry.register({ ...HeavyArmorKeyword, id: 'Armor' });
  registry.register(UltraArmorKeyword);
  registry.register({ ...UltraArmorKeyword, id: 'Ultra Heavy Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'Knight Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'Contract Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'Count Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'Aurora Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'PS Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'VPS Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'TP Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'MD Armor' });
  registry.register({ ...HeavyArmorKeyword, id: 'G.A.T. Field' });
  registry.register(ConsecutiveBladeKeyword);
  registry.register(TrueConsecutiveBladeKeyword);
  registry.register(RekkaConsecutiveBladeKeyword);
  registry.register(WhirlwindKeyword);
  registry.register({ ...WhirlwindKeyword, id: 'True-Whirlwind' });
  registry.register(TrueAwakenKeyword);
  registry.register(ToppaAwakenKeyword);
  registry.register({ ...TrueAwakenKeyword, id: 'Crimson Awaken' });
  registry.register({ ...TrueAwakenKeyword, id: 'Silver Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Dragon Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Sol Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Twinkle Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Contract Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Re Awaken' });
  registry.register({ ...AwakenKeyword, id: 'Soul Awaken' });
  registry.register({ ...CurseKeyword, id: 'Grudging Curse' });
  registry.register({ ...HolyLifeKeyword, id: 'Heaven Holy Life' });
}
