/**
 * engine/index.js
 * 
 * Battle Spirits Eternal Game Engine Core Facade.
 * Connects state, zones, events, continuous layer, payment, ops, and flow.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { createGameState, createCardInstance, createFieldStack } from './state.js';
import { EventBus } from './events.js';
import { FlowController } from './flow.js';
import { AsyncResolver, DefaultPromptResolver } from './resolver.js';
import { moveCard, moveCore } from './zones.js';
import { calculateEffectiveCost, canAffordCost, payCost } from './payment.js';
import { computeLevel, computeEffectiveBP, canAttack, canBlock } from './continuous.js';
import { checkStateBasedActions } from './sba.js';
import { createDefaultKeywordRegistry } from './keywords/index.js';
import { TimingWindowManager } from './windows.js';
import { PromptManager } from './prompt_manager.js';

export function createGame(options = {}) {
  const playerDeckCards = (options.playerDeck || []).map(c => createCardInstance(c, 'player'));
  const opponentDeckCards = (options.opponentDeck || []).map(c => createCardInstance(c, 'opponent'));
  const firstPlayer = options.firstPlayer || 'player';

  const state = createGameState(playerDeckCards, opponentDeckCards, firstPlayer);
  const events = new EventBus();
  const flow = new FlowController(state, events);
  const promptManager = options.promptManager || new PromptManager();
  const defaultFallback = new DefaultPromptResolver();

  // If a custom promptResolver is passed (like AIDecider), use it; otherwise use promptManager or DefaultPromptResolver
  const resolverDelegate = options.promptResolver || {
    choose: async (prompt) => {
      // If AI is the chooser and an AI decider exists, route to AI decider
      if (options.ai && prompt.chooser === 'opponent') {
        return await options.ai.decide(prompt, state);
      }
      if (options.usePromptManager) {
        return await promptManager.request(prompt);
      }
      return await defaultFallback.choose(prompt);
    }
  };

  const resolver = new AsyncResolver(resolverDelegate);
  const keywords = options.keywordRegistry || createDefaultKeywordRegistry();

  // Initial draw: 4 cards each with Contract Partner guarantee (Rule 3.5 & R39)
  for (const s of ['player', 'opponent']) {
    const p = state.players[s];
    if (ETERNAL_RULES.setup.guaranteedContractPartner) {
      const partnerIdx = p.deck.findIndex(c => c.isContractPartner);
      if (partnerIdx !== -1) {
        p.hand.push(p.deck.splice(partnerIdx, 1)[0]);
      }
    }
    while (p.hand.length < ETERNAL_RULES.setup.initialHandSize && p.deck.length > 0) {
      p.hand.push(p.deck.shift());
    }
  }

  const game = {
    state,
    events,
    flow,
    resolver,
    keywords,

    async advanceStep() {
      return await flow.advanceStep();
    },

    async playCard(cardId, payment = [], playerSide = 'player') {
      const p = state.players[playerSide];
      const card = p.hand.find(c => c.id === cardId);
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      // Check SET_RESTRICTION modifiers
      for (const mod of state.modifiers || []) {
        if (mod.type === 'SET_RESTRICTION' && (!mod.side || mod.side === 'both' || mod.side === playerSide)) {
          const r = String(mod.restriction || '').toUpperCase();
          if (r === 'CANNOT_SUMMON' && (card.type === 'Spirit' || card.type === 'Ultimate' || card.type === 'Brave')) {
            if (!mod.cardType || mod.cardType === card.type) {
              return { success: false, reason: 'SUMMON_RESTRICTED' };
            }
          }
          if (r === 'CANNOT_USE_MAGIC' && card.type === 'Magic') {
            return { success: false, reason: 'MAGIC_RESTRICTED' };
          }
          if (r === 'CANNOT_DEPLOY_NEXUS' && card.type && card.type.includes('Nexus')) {
            return { success: false, reason: 'NEXUS_RESTRICTED' };
          }
        }
      }

      // Timing check: During Attack Step, cannot summon spirits without Flash ability (R27)
      if (state.step === 'ATTACK' && (card.type === 'Spirit' || card.type === 'Ultimate' || card.type === 'Brave')) {
        const hasFlash = card.compiledIr && card.compiledIr.abilities && card.compiledIr.abilities.some(a => a.header.isFlash);
        if (!hasFlash && (!card.effect || !card.effect.includes('Flash'))) {
          return { success: false, reason: 'CANNOT_SUMMON_DURING_ATTACK_STEP' };
        }
      }

      const cost = calculateEffectiveCost(state, card, playerSide);
      if (!canAffordCost(state, cost, playerSide)) {
        return { success: false, reason: 'INSUFFICIENT_CORES' };
      }

      // Auto-populate default payment from reserve if not provided
      const actualPayment = payment.length > 0 ? payment : [
        { zone: 'reserve', isSoulCore: false, count: Math.min(cost, p.reserve.normal) },
        ...(cost > p.reserve.normal && p.reserve.soul > 0 ? [{ zone: 'reserve', isSoulCore: true, count: 1 }] : [])
      ];

      const payRes = await payCost(state, cost, actualPayment, playerSide, events);
      if (!payRes.success) return { success: false, reason: 'PAYMENT_FAILED' };

      if (card.type === 'Spirit' || card.type === 'Ultimate') {
        // Place on field with 1 core from reserve to satisfy LV1
        let lv1Normal = 1;
        let lv1Soul = 0;

        if (p.reserve.normal >= 1) {
          p.reserve.normal -= 1;
        } else if (p.reserve.soul >= 1) {
          p.reserve.soul -= 1;
          lv1Normal = 0;
          lv1Soul = 1;
        } else {
          // Cannot place LV1 core -> depletion check
          lv1Normal = 0;
          lv1Soul = 0;
        }

        const stack = createFieldStack(card, { normal: lv1Normal, soul: lv1Soul });
        p.field.push(stack);
        p.hand = p.hand.filter(c => c.id !== card.id);

        await events.emit({
          type: 'SUMMONED',
          card,
          stack,
          player: playerSide,
          cause: 'summon'
        });

        // Trigger (When Summoned) abilities if compiled IR exists
        if (card.compiledIr && card.compiledIr.abilities) {
          const currentLevel = computeLevel(stack, state);
          for (const ab of card.compiledIr.abilities) {
            if (ab.header.timing === 'WHEN_SUMMONED' || ab.header.timing === 'WHEN_SUMMONED_OR_DESTROYED') {
              if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
                await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card }, events);
              }
            }
          }
        }
      } else if (card.type === 'Magic') {
        // Magic card resolution
        p.hand = p.hand.filter(c => c.id !== card.id);
        p.grave.push(card);

        // Check NEGATE_EFFECT modifiers
        const cardColors = Array.isArray(card.colors) ? card.colors : [card.color || 'Red'];
        const isNegated = (state.modifiers || []).some(m => {
          if (m.type !== 'NEGATE_EFFECT') return false;
          if (m.side && m.side !== 'both' && m.side !== playerSide) return false;
          if (m.targetType && m.targetType !== 'ALL' && m.targetType !== card.type) return false;
          if (Array.isArray(m.colors) && m.colors.length > 0 && !cardColors.some(c => m.colors.includes(c))) return false;
          return true;
        });

        if (isNegated) {
          await events.emit({
            type: 'EFFECT_NEGATED',
            card,
            player: playerSide
          });
          await checkStateBasedActions(state, events);
          return { success: true, card, costPaid: cost, negated: true };
        }

        if (card.compiledIr && card.compiledIr.abilities) {
          for (const ab of card.compiledIr.abilities) {
            if (ab.header.isMain && state.step === 'MAIN') {
              await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card, soulCoreUsed: payRes.soulCoreUsed }, events);
            } else if (ab.header.isFlash && state.step === 'ATTACK') {
              await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card }, events);
            }
          }
        }
      }

      await checkStateBasedActions(state, events);
      return { success: true, card, costPaid: cost };
    },

    async setBurst(cardId, playerSide = 'player') {
      const p = state.players[playerSide];
      if (p.burstSetThisTurn) return { success: false, reason: 'BURST_ALREADY_SET_THIS_TURN' };

      const burstSetRestricted = (state.modifiers || []).some(m =>
        m.type === 'SET_RESTRICTION' &&
        (!m.side || m.side === 'both' || m.side === playerSide) &&
        String(m.restriction || '').toUpperCase() === 'CANNOT_SET_BURST'
      );
      if (burstSetRestricted) return { success: false, reason: 'BURST_SET_RESTRICTED' };

      const card = p.hand.find(c => c.id === cardId);
      if (!card) return { success: false, reason: 'CARD_NOT_IN_HAND' };

      await moveCard(state, card, 'burst', playerSide, { cause: 'set_burst' }, events);
      return { success: true, burstCard: card };
    },

    async transferCore(count, from, to, playerSide = 'player') {
      if (state.step !== 'MAIN') return { success: false, reason: 'TRANSFER_ONLY_IN_MAIN_STEP' };
      const res = await moveCore(state, count, from, to, { cause: 'manual_transfer', by: playerSide }, events);
      await checkStateBasedActions(state, events);
      return { success: res };
    },

    async declareAttack(stackId, playerSide = 'player') {
      const p = state.players[playerSide];
      const stack = p.field.find(st => st.id === stackId);
      if (!stack) return { success: false, reason: 'STACK_NOT_FOUND' };
      if (!canAttack(state, stack)) return { success: false, reason: 'CANNOT_ATTACK' };

      stack.state = 'EXHAUSTED';
      state.combat = {
        attackerStackId: stackId,
        blockerStackId: null,
        stage: 'FLASH_1',
        flashPriority: playerSide === 'player' ? 'opponent' : 'player' // Blocker acts first in Flash 1 (Eternal format)
      };

      await events.emit({
        type: 'ATTACK_DECLARED',
        attacker: stack,
        player: playerSide
      });

      // Trigger (When Attacks) abilities
      if (stack.top.compiledIr && stack.top.compiledIr.abilities) {
        const currentLevel = computeLevel(stack, state);
        for (const ab of stack.top.compiledIr.abilities) {
          if (ab.header.timing === 'WHEN_ATTACKS' || ab.header.timing === 'WHEN_ATTACKS_OR_BLOCKS' || ab.header.timing === 'WHEN_BATTLES') {
            if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
              await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: stack.top }, events);
            }
          }
        }
      }

      return { success: true, combat: state.combat };
    },

    async declareBlock(blockerStackId, blockerSide = 'opponent') {
      if (!state.combat) return { success: false, reason: 'NOT_IN_COMBAT' };
      const p = state.players[blockerSide];
      const stack = p.field.find(st => st.id === blockerStackId);
      if (!stack) return { success: false, reason: 'BLOCKER_NOT_FOUND' };
      if (!canBlock(state, stack)) return { success: false, reason: 'CANNOT_BLOCK' };

      stack.state = 'EXHAUSTED';
      state.combat.blockerStackId = blockerStackId;
      state.combat.stage = 'BP_COMPARE';

      await events.emit({
        type: 'BLOCK_DECLARED',
        blocker: stack,
        player: blockerSide
      });

      // Trigger (When Blocks) abilities
      if (stack.top.compiledIr && stack.top.compiledIr.abilities) {
        const blockerLevel = computeLevel(stack, state);
        for (const ab of stack.top.compiledIr.abilities) {
          if (ab.header.timing === 'WHEN_BLOCKS' || ab.header.timing === 'WHEN_ATTACKS_OR_BLOCKS' || ab.header.timing === 'WHEN_BATTLES') {
            if (!ab.header.levels || ab.header.levels.includes(blockerLevel)) {
              await resolver.resolveAbility(state, ab, { controller: blockerSide, sourceCard: stack.top }, events);
            }
          }
        }
      }

      if (!state.combat) {
        if (Array.isArray(state.modifiers)) {
          state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
        }
        await checkStateBasedActions(state, events);
        return { success: true };
      }

      // Resolve battle BP comparison
      const attackerSide = blockerSide === 'opponent' ? 'player' : 'opponent';
      const attackerStack = state.players[attackerSide].field.find(st => st.id === state.combat.attackerStackId);
      const blockerStack = p.field.find(st => st.id === blockerStackId);
      if (!attackerStack || !blockerStack) {
        state.combat = null;
        if (Array.isArray(state.modifiers)) {
          state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
        }
        await checkStateBasedActions(state, events);
        return { success: true };
      }

      await events.emit({
        type: 'BP_COMPARE',
        attacker: attackerStack,
        blocker: blockerStack
      });

      const attackerBp = computeEffectiveBP(state, attackerStack);
      const blockerBp = computeEffectiveBP(state, blockerStack);

      if (attackerBp > blockerBp) {
        // Blocker destroyed
        await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'battle' }, events);
      } else if (blockerBp > attackerBp) {
        // Attacker destroyed
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner || attackerSide, { cause: 'battle' }, events);
      } else {
        // Mutual destruction (tie)
        await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'battle' }, events);
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner || attackerSide, { cause: 'battle' }, events);
      }

      // At End of Battle: Check Curse keyword on attacker
      // [Curse] (When Attacks) At the end of battle, destroy 1 opposing Spirit that blocked this Spirit.
      const attackerKeywords = attackerStack.top?.keywords || [];
      const hasCurse = attackerKeywords.some(k => (typeof k === 'string' ? k === 'Curse' : k?.name === 'Curse'));
      if (hasCurse && blockerStack && blockerStack.top) {
        const blockerInField = p.field.some(st => st.id === blockerStackId);
        if (blockerInField) {
          await moveCard(state, blockerStack.top, 'grave', blockerStack.owner || blockerSide, { cause: 'curse' }, events);
        }
      }

      state.combat = null;
      if (Array.isArray(state.modifiers)) {
        state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
      }
      await checkStateBasedActions(state, events);
      return { success: true, attackerBp, blockerBp };
    },

    async resolveDirectHit(attackerSide = 'player') {
      if (!state.combat) return { success: false };
      const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';
      const defPlayer = state.players[defenderSide];

      // Check PREVENT_LIFE_LOSS / PREVENT_DAMAGE modifier
      const hasLifeLossPrevented = (state.modifiers || []).some(m =>
        (m.type === 'PREVENT_LIFE_LOSS' || m.type === 'PREVENT_DAMAGE') && (m.side === defenderSide || m.side === 'both' || !m.side)
      );
      if (hasLifeLossPrevented) {
        state.combat = null;
        if (Array.isArray(state.modifiers)) {
          state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
        }
        return { success: true, defenderLife: defPlayer.life, prevented: true };
      }

      // Check DAMAGE_CAP modifier
      defPlayer.combatDamageTakenThisTurn = (defPlayer.combatDamageTakenThisTurn || 0);
      const matchingCaps = (state.modifiers || [])
        .filter(m => m.type === 'DAMAGE_CAP' && (m.side === defenderSide || m.side === 'both' || !m.side))
        .map(m => (typeof m.maxDamage === 'number' ? m.maxDamage : (typeof m.cap === 'number' ? m.cap : 1)));

      let damage = 1;
      if (matchingCaps.length > 0) {
        const cap = Math.min(...matchingCaps);
        const remainingAllowed = Math.max(0, cap - defPlayer.combatDamageTakenThisTurn);
        damage = Math.min(damage, remainingAllowed);
      }

      if (damage === 0) {
        state.combat = null;
        if (Array.isArray(state.modifiers)) {
          state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
        }
        return { success: true, defenderLife: defPlayer.life, prevented: true, capped: true };
      }

      // Remove damage Life core -> Reserve (Standard Battle Spirits combat damage)
      if (defPlayer.life > 0) {
        const actualLifeLoss = Math.min(defPlayer.life, damage);
        defPlayer.life -= actualLifeLoss;
        defPlayer.reserve.normal += actualLifeLoss;
        defPlayer.combatDamageTakenThisTurn += actualLifeLoss;

        await events.emit({
          type: 'LIFE_REDUCED',
          player: defenderSide,
          damage: actualLifeLoss,
          currentLife: defPlayer.life,
          cause: 'combat_damage'
        });
      }

      state.combat = null;
      if (Array.isArray(state.modifiers)) {
        state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
      }
      await checkStateBasedActions(state, events);
      return { success: true, defenderLife: defPlayer.life };
    }
  };

  keywords.attachToGame(game);

  const windows = new TimingWindowManager(game);
  game.windows = windows;
  game.promptManager = promptManager;

  events.on('LIFE_REDUCED', async (ev) => {
    await windows.openBurstWindow(ev);
  });
  events.on('DESTROYED', async (ev) => {
    await windows.openBurstWindow(ev);
  });
  events.on('SUMMONED', async (ev) => {
    const controller = ev.player;
    const p = state.players[controller];
    if (!p) return;
    const allStacks = [...(p.field || []), ...(p.nexus || []).map(n => ({ top: n, cores: { normal: 1, soul: 0 } }))];
    for (const st of allStacks) {
      if (st.top && st.top.compiledIr) {
        const lv = computeLevel(st, state);
        for (const ab of st.top.compiledIr.abilities || []) {
          if (ab.header && ab.header.timing === 'PASSIVE') {
            if (!ab.header.levels || ab.header.levels.includes(lv)) {
              for (const cl of ab.clauses || []) {
                if (cl.op && cl.op.trigger === 'ON_SUMMON') {
                  state.modifiers.push({
                    id: `mod_${Date.now()}_summon_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'BP_BUFF',
                    targetStackId: ev.stack ? ev.stack.id : null,
                    amount: cl.op.amount || 1000,
                    duration: 'THIS_TURN',
                    sourceCardId: st.top.id
                  });
                }
              }
            }
          }
        }
      }
    }
  });

  return game;
}
