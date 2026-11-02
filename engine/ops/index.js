/**
 * engine/ops/index.js
 * 
 * Headless Async Primitive Operation Library for Battle Spirits Eternal.
 * Resolves Intermediate Representation (IR) operations deterministically.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';
import { queryCandidates } from '../selectors.js';

export async function executeOp(state, op, context, promptResolver, events = null) {
  if (!op || !op.op) return { success: true };

  const controller = context.controller || 'player';
  const sourceCard = context.sourceCard;
  const oppSide = controller === 'player' ? 'opponent' : 'player';

  switch (op.op) {
    case 'DRAW': {
      const count = op.count || 1;
      const p = state.players[controller];
      const drawnCards = [];

      for (let i = 0; i < count; i++) {
        if (p.deck.length === 0) break; // Do as much as possible
        const topCard = p.deck[0];
        await moveCard(state, topCard, 'hand', controller, { cause: 'draw', sourceCard }, events);
        drawnCards.push(topCard);
      }

      return { success: drawnCards.length > 0, drawnCount: drawnCards.length, cards: drawnCards };
    }

    case 'DISCARD_HAND': {
      const count = op.count || 1;
      const candidates = queryCandidates(state, { zone: 'hand', side: 'self', types: [], filters: op.filter || {} }, context);
      if (candidates.length === 0) return { success: false, discardedCount: 0 };

      // Request selection via promptResolver
      const chosen = await promptResolver.choose({
        type: 'SELECT_CARDS',
        title: 'Choose cards to discard from hand',
        candidates,
        count,
        upTo: op.upTo,
        chooser: op.chooser === 'opp' ? oppSide : controller
      });

      const discarded = [];
      for (const item of chosen || []) {
        const c = item.card || item;
        await moveCard(state, c, 'grave', controller, { cause: 'discard', sourceCard }, events);
        discarded.push(c);
      }

      return { success: discarded.length > 0, discardedCount: discarded.length, cards: discarded };
    }

    case 'DISCARD_PRE_ADVENT': {
      const p = state.players[controller];
      const stack = p.field.find(st => st.top.id === sourceCard.id);
      if (!stack || stack.under.length === 0) return { success: false };

      const preAdventCard = stack.under[0];
      await moveCard(state, preAdventCard, 'grave', controller, { cause: 'discard_pre_advent', sourceCard }, events);
      return { success: true, card: preAdventCard };
    }

    case 'MOVE_CORE': {
      const count = op.count || 1;
      const isSoul = Boolean(op.isSoulCore);
      const fromZone = op.from ? op.from.zone : 'reserve';
      const toZone = op.to ? op.to.zone : 'reserve';
      const fromSide = op.from && op.from.side === 'opp' ? oppSide : controller;
      const toSide = op.to && op.to.side === 'opp' ? oppSide : controller;

      let fromStackId = null;
      let toStackId = null;

      if (fromZone === 'field') {
        const p = state.players[fromSide];
        if (op.from.target === 'self' && sourceCard) {
          const selfStack = p.field.find(st => st.top.id === sourceCard.id);
          if (selfStack) fromStackId = selfStack.id;
        } else if (p.field.length > 0) {
          // If chooser is opp, prompt opponent to pick their spirit
          const chosenStack = await promptResolver.choose({
            type: 'SELECT_STACK',
            title: 'Choose a spirit to remove core from',
            candidates: p.field.map(st => ({ stack: st, card: st.top })),
            count: 1,
            chooser: op.chooser === 'opp' ? oppSide : controller
          });
          if (chosenStack && chosenStack[0]) {
            fromStackId = chosenStack[0].stack ? chosenStack[0].stack.id : chosenStack[0].id;
          }
        }
      }

      if (toZone === 'field') {
        const p = state.players[toSide];
        if (op.to.target === 'self' && sourceCard) {
          const selfStack = p.field.find(st => st.top.id === sourceCard.id);
          if (selfStack) toStackId = selfStack.id;
        } else if (p.field.length > 0) {
          toStackId = p.field[0].id;
        }
      }

      const res = await moveCore(
        state,
        count,
        { zone: fromZone, side: fromSide, stackId: fromStackId },
        { zone: toZone, side: toSide, stackId: toStackId },
        { isSoulCore: isSoul, cause: 'effect', by: controller, sourceCard },
        events
      );

      return { success: res, coresMoved: count };
    }

    case 'DESTROY': {
      const candidates = queryCandidates(state, op.target || { side: 'opp', types: ['Spirit'] }, context);
      if (candidates.length === 0) return { success: false, destroyedCount: 0 };

      let chosen = [];
      if (op.target && op.target.target === 'PREVIOUS_TARGET' && context.previousTarget) {
        chosen = [context.previousTarget];
      } else {
        chosen = await promptResolver.choose({
          type: 'SELECT_DESTROY',
          title: 'Select opposing targets to destroy',
          candidates,
          selector: op,
          chooser: controller
        });
      }

      const destroyed = [];
      for (const item of chosen || []) {
        const card = item.card || item;
        await moveCard(state, card, 'grave', card.owner, { cause: 'destroy', by: controller, sourceCard }, events);
        destroyed.push(card);
      }

      return { success: destroyed.length > 0, destroyedCount: destroyed.length, cards: destroyed };
    }

    case 'BOUNCE': {
      const candidates = queryCandidates(state, op.target || { side: 'opp', types: ['Spirit'] }, context);
      if (candidates.length === 0) return { success: false };

      const chosen = await promptResolver.choose({
        type: 'SELECT_BOUNCE',
        title: 'Select target to return',
        candidates,
        count: op.count || 1,
        chooser: controller
      });

      const dest = (op.destination || 'HAND').toLowerCase();
      const targetZone = dest === 'hand' ? 'hand' : (dest === 'deck_bottom' ? 'deck_bottom' : 'deck_top');

      for (const item of chosen || []) {
        const card = item.card || item;
        await moveCard(state, card, targetZone, card.owner, { cause: 'bounce', by: controller, sourceCard }, events);
      }

      return { success: true };
    }

    case 'EXHAUST': {
      if (op.target === 'self') {
        const p = state.players[controller];
        const selfStack = p.field.find(st => st.top.id === sourceCard.id);
        if (selfStack) selfStack.state = 'EXHAUSTED';
        return { success: true };
      }

      const candidates = queryCandidates(state, op.target || { side: 'opp', types: ['Spirit'] }, context);
      if (candidates.length === 0) return { success: false };

      const chosen = await promptResolver.choose({
        type: 'SELECT_EXHAUST',
        title: 'Select target to exhaust',
        candidates,
        count: op.count || 1,
        chooser: controller
      });

      for (const item of chosen || []) {
        const st = item.stack;
        if (st) {
          st.state = op.isHeavy ? 'HEAVY_EXHAUSTED' : 'EXHAUSTED';
        }
      }

      return { success: true };
    }

    case 'REFRESH': {
      if (op.target === 'self' || !op.target) {
        const p = state.players[controller];
        const selfStack = p.field.find(st => st.top.id === sourceCard.id);
        if (selfStack) {
          selfStack.state = selfStack.state === 'HEAVY_EXHAUSTED' ? 'EXHAUSTED' : 'REFRESHED';
        }
        return { success: true };
      }

      const candidates = queryCandidates(state, { side: 'self', types: ['Spirit'] }, context);
      const chosen = await promptResolver.choose({
        type: 'SELECT_REFRESH',
        title: 'Select spirit to refresh',
        candidates,
        count: op.count || 1,
        chooser: controller
      });

      for (const item of chosen || []) {
        const st = item.stack;
        if (st) {
          st.state = st.state === 'HEAVY_EXHAUSTED' ? 'EXHAUSTED' : 'REFRESHED';
        }
      }

      return { success: true };
    }

    case 'BP_BUFF': {
      let targetStackId = null;
      if (op.target === 'self') {
        const p = state.players[controller];
        const selfStack = p.field.find(st => st.top.id === sourceCard.id);
        if (selfStack) targetStackId = selfStack.id;
      } else {
        const candidates = queryCandidates(state, { side: 'self', types: ['Spirit', 'Ultimate'] }, context);
        const chosen = await promptResolver.choose({
          type: 'SELECT_BP_BUFF',
          title: 'Select Spirit/Ultimate to grant BP buff',
          candidates,
          count: 1,
          chooser: controller
        });
        if (chosen && chosen[0]) {
          targetStackId = chosen[0].stack ? chosen[0].stack.id : chosen[0].id;
        }
      }

      state.modifiers.push({
        id: `mod_${Date.now()}_${Math.random()}`,
        type: 'BP_BUFF',
        targetStackId,
        amount: op.amount || 1000,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      });

      return { success: true };
    }

    case 'BP_DEBUFF': {
      const candidates = queryCandidates(state, { side: 'opp', types: ['Spirit', 'Ultimate'] }, context);
      if (candidates.length === 0) return { success: false };

      const chosen = await promptResolver.choose({
        type: 'SELECT_BP_DEBUFF',
        title: 'Select opposing Spirit to reduce BP',
        candidates,
        count: 1,
        chooser: controller
      });

      if (chosen && chosen[0]) {
        const targetStackId = chosen[0].stack ? chosen[0].stack.id : chosen[0].id;
        state.modifiers.push({
          id: `mod_${Date.now()}_${Math.random()}`,
          type: 'BP_DEBUFF',
          targetStackId,
          amount: op.amount || 1000,
          duration: op.duration || 'THIS_TURN',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
      }

      return { success: true };
    }

    case 'SUMMON_FREE': {
      const p = state.players[controller];
      let cardToSummon = sourceCard;

      if (op.from === 'HAND' && op.target !== 'this_card') {
        const candidates = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Spirit'] }, context);
        const chosen = await promptResolver.choose({
          type: 'SELECT_SUMMON',
          title: 'Choose Spirit to summon without paying cost',
          candidates,
          count: 1,
          chooser: controller
        });
        if (chosen && chosen[0]) {
          cardToSummon = chosen[0].card || chosen[0];
        }
      }

      if (!cardToSummon) return { success: false };

      // Move card from hand/burst to field as new stack
      // Allocate 1 core from reserve to field so it satisfies LV1
      if (p.reserve.normal > 0 || p.reserve.soul > 0) {
        const useSoul = p.reserve.normal === 0 && p.reserve.soul > 0;
        await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
          isSoulCore: useSoul,
          cause: 'summon'
        }, events);

        const newStack = createFieldStack(cardToSummon, { normal: useSoul ? 0 : 1, soul: useSoul ? 1 : 0 });
        p.field.push(newStack);

        // Remove card from previous zone
        p.hand = p.hand.filter(c => c.id !== cardToSummon.id);
        if (p.burst && p.burst.id === cardToSummon.id) p.burst = null;

        if (events) {
          await events.emit({
            type: 'SUMMONED',
            card: cardToSummon,
            stack: newStack,
            player: controller,
            cause: 'effect',
            sourceCard
          });
        }
      }

      return { success: true, card: cardToSummon };
    }

    case 'ADVENT_STACK': {
      const p = state.players[controller];
      const candidates = queryCandidates(state, { side: 'self', types: ['Spirit'] }, context);
      if (candidates.length === 0) return { success: false };

      const chosen = await promptResolver.choose({
        type: 'SELECT_ADVENT_TARGET',
        title: 'Choose target Spirit to stack Advent onto',
        candidates,
        count: 1,
        chooser: controller
      });

      if (!chosen || !chosen[0]) return { success: false };
      const targetStack = chosen[0].stack;

      // Put previous top into under array
      targetStack.under.unshift(targetStack.top);
      targetStack.top = sourceCard;

      p.hand = p.hand.filter(c => c.id !== sourceCard.id);

      if (events) {
        await events.emit({
          type: 'ADVENTS',
          card: sourceCard,
          stack: targetStack,
          player: controller,
          sourceCard
        });
      }

      return { success: true, stack: targetStack };
    }

    case 'ADD_COUNTER': {
      const count = op.count || 1;
      state.players[controller].counters += count;
      return { success: true, currentCounters: state.players[controller].counters };
    }

    case 'MILL_DECK': {
      const count = op.count || 1;
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const p = state.players[targetSide];
      const milled = [];
      for (let i = 0; i < count; i++) {
        if (p.deck.length === 0) break;
        const topCard = p.deck[0];
        await moveCard(state, topCard, 'grave', targetSide, { cause: 'mill', sourceCard }, events);
        milled.push(topCard);
      }
      return { success: milled.length > 0, milledCount: milled.length, cards: milled };
    }

    case 'BURST_LOCK': {
      state.modifiers.push({
        id: `mod_${Date.now()}_burst_lock`,
        type: 'BURST_LOCK',
        side: oppSide,
        duration: 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      });
      return { success: true };
    }

    case 'END_BATTLE': {
      state.combat = null;
      return { success: true };
    }

    case 'OPEN_ZONE': {
      await moveCard(state, sourceCard, 'removed', controller, { cause: 'open_zone', sourceCard }, events);
      return { success: true };
    }

    default:
      return { success: true, unhandledOp: op.op };
  }
}
