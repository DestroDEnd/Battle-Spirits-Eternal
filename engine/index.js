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
import { computeEffectiveBP, canAttack, canBlock } from './continuous.js';
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

  // Initial draw: 4 cards each
  for (let i = 0; i < ETERNAL_RULES.setup.initialHandSize; i++) {
    if (state.players.player.deck.length > 0) {
      state.players.player.hand.push(state.players.player.deck.shift());
    }
    if (state.players.opponent.deck.length > 0) {
      state.players.opponent.hand.push(state.players.opponent.deck.shift());
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
          for (const ab of card.compiledIr.abilities) {
            if (ab.header.timing === 'WHEN_SUMMONED' || ab.header.timing === 'WHEN_SUMMONED_OR_DESTROYED') {
              await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card }, events);
            }
          }
        }
      } else if (card.type === 'Magic') {
        // Magic card resolution
        p.hand = p.hand.filter(c => c.id !== card.id);
        p.grave.push(card);

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
        for (const ab of stack.top.compiledIr.abilities) {
          if (ab.header.timing === 'WHEN_ATTACKS' || ab.header.timing === 'WHEN_ATTACKS_OR_BLOCKS') {
            await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: stack.top }, events);
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

      // Resolve battle BP comparison
      const attackerSide = blockerSide === 'opponent' ? 'player' : 'opponent';
      const attackerStack = state.players[attackerSide].field.find(st => st.id === state.combat.attackerStackId);
      const attackerBp = computeEffectiveBP(state, attackerStack);
      const blockerBp = computeEffectiveBP(state, stack);

      if (attackerBp > blockerBp) {
        // Blocker destroyed
        await moveCard(state, stack.top, 'grave', blockerSide, { cause: 'battle' }, events);
      } else if (blockerBp > attackerBp) {
        // Attacker destroyed
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner, { cause: 'battle' }, events);
      } else {
        // Mutual destruction (tie)
        await moveCard(state, stack.top, 'grave', blockerSide, { cause: 'battle' }, events);
        await moveCard(state, attackerStack.top, 'grave', attackerStack.owner, { cause: 'battle' }, events);
      }

      state.combat = null;
      await checkStateBasedActions(state, events);
      return { success: true, attackerBp, blockerBp };
    },

    async resolveDirectHit(attackerSide = 'player') {
      if (!state.combat) return { success: false };
      const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';
      const defPlayer = state.players[defenderSide];

      // Remove 1 Life core -> Reserve (Standard Battle Spirits combat damage)
      if (defPlayer.life > 0) {
        defPlayer.life -= 1;
        defPlayer.reserve.normal += 1;

        await events.emit({
          type: 'LIFE_REDUCED',
          player: defenderSide,
          damage: 1,
          currentLife: defPlayer.life,
          cause: 'combat_damage'
        });
      }

      state.combat = null;
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

  return game;
}
