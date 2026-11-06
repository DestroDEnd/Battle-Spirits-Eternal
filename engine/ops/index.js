/**
 * engine/ops/index.js
 * 
 * Headless Async Primitive Operation Library for Battle Spirits Eternal.
 * Resolves Intermediate Representation (IR) operations deterministically.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';
import { queryCandidates } from '../selectors.js';

export function matchesCardFilter(card, filter = {}, op = {}) {
  if (!card || typeof card !== 'object') return false;
  const f = filter || {};
  const o = op || {};

  // Types filter
  let targetTypes = f.types || (o.cardType ? [o.cardType] : (f.type ? [f.type] : (o.types || [])));
  if (typeof targetTypes === 'string') targetTypes = [targetTypes];
  if (Array.isArray(targetTypes) && targetTypes.length > 0) {
    const cardType = (card.type || '').toLowerCase();
    const typeMatch = targetTypes.some(t => {
      if (!t) return false;
      const lowT = String(t).toLowerCase();
      if (cardType === lowT) return true;
      const famStr = (Array.isArray(card.families) ? card.families.join(' ') : (card.family || '')).toLowerCase();
      if (lowT === 'grandwalker nexus' && cardType.includes('nexus') && (famStr.includes('grandwalker') || (card.name || '').toLowerCase().includes('grandwalker'))) return true;
      if (cardType.includes(lowT)) return true;
      return false;
    });
    if (!typeMatch) return false;
  }

  // Colors filter
  const targetColor = f.color || o.color;
  if (targetColor) {
    const rawColors = Array.isArray(card.colors) ? card.colors : (card.colors ? [card.colors] : (card.color ? [card.color] : []));
    if (!rawColors.some(c => c && String(c).toLowerCase() === String(targetColor).toLowerCase())) return false;
  }

  // Yellow-only or single color only
  if (f.singleColorOnly || o.singleColorOnly) {
    const rawColors = Array.isArray(card.colors) ? card.colors : (card.colors ? [card.colors] : (card.color ? [card.color] : []));
    if (rawColors.length !== 1) return false;
  }

  // Family filter
  const targetFamily = f.family || o.family;
  if (targetFamily) {
    const rawFams = Array.isArray(card.families) ? card.families : (card.families ? [card.families] : (card.family ? [card.family] : []));
    if (!rawFams.some(fam => fam && String(fam).toLowerCase().includes(String(targetFamily).toLowerCase()))) return false;
  }

  // Name includes filter
  const nameInc = f.nameIncludes || o.nameIncludes;
  if (nameInc) {
    if (!card.name || !String(card.name).toLowerCase().includes(String(nameInc).toLowerCase())) return false;
  }

  // Cost filter
  const cost = typeof card.cost === 'number' ? card.cost : parseInt(card.cost || '0', 10);
  if (f.costLte !== undefined && cost > f.costLte) return false;
  if (f.costGte !== undefined && cost < f.costGte) return false;
  if (o.costLte !== undefined && cost > o.costLte) return false;
  if (o.costGte !== undefined && cost < o.costGte) return false;

  return true;
}

export async function executeOp(state, op, context = {}, promptResolver, events = null) {
  if (!op || !op.op) return { success: true };

  const ctx = context || {};
  const controller = ctx.controller || 'player';
  const sourceCard = ctx.sourceCard;
  const sourceStack = ctx.sourceStack || ctx.stack || null;
  if (!promptResolver && ctx.promptResolver) promptResolver = ctx.promptResolver;
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
      if (Array.isArray(state.modifiers)) {
        state.modifiers = state.modifiers.filter(m => m.duration !== 'THIS_BATTLE');
      }
      return { success: true };
    }

    case 'OPEN_ZONE': {
      await moveCard(state, sourceCard, 'removed', controller, { cause: 'open_zone', sourceCard }, events);
      return { success: true };
    }

    case 'REVEAL_DECKTOP': {
      const p = state.players[controller];
      if (!p.revealed) p.revealed = [];
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const actualCount = Math.min(count, p.deck.length);
      const revealed = p.deck.splice(0, actualCount);
      p.revealed.push(...revealed);
      if (!context.revealedCards) context.revealedCards = [];
      context.revealedCards.push(...revealed);

      if (events) {
        await events.emit({
          type: 'CARDS_REVEALED',
          cards: revealed,
          player: controller,
          count: revealed.length,
          sourceCard
        });
      }

      return { success: revealed.length > 0, count: revealed.length, cards: revealed };
    }

    case 'ADD_TO_HAND': {
      const p = state.players[controller];
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      let pool = [];
      let isFromRevealed = false;

      // Prefer revealed zone if cards were revealed
      if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isFromRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isFromRevealed = true;
      } else if (op.from === 'grave' || op.from === 'trash') {
        pool = p.grave;
      } else if (op.from === 'removed' || op.from === 'open') {
        pool = p.removed;
      } else if (context.previousTarget) {
        pool = [context.previousTarget];
      }

      // Filter matching candidates
      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { success: false, addedCount: 0, cards: [] };

      let chosen = matching;
      if (matching.length > count && promptResolver) {
        const selection = await promptResolver.choose({
          type: 'SELECT_CARDS',
          title: 'Choose card(s) to add to Hand',
          candidates: matching.map(c => ({ card: c })),
          count,
          chooser: controller
        });
        if (selection && selection.length > 0) {
          chosen = selection.map(item => item.card || item);
        } else {
          chosen = matching.slice(0, count);
        }
      } else if (matching.length > count) {
        chosen = matching.slice(0, count);
      }

      const added = [];
      for (const card of chosen) {
        await moveCard(state, card, 'hand', controller, { cause: 'add_to_hand', sourceCard }, events);
        if (isFromRevealed) {
          if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== card.id);
          if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== card.id);
        }
        added.push(card);
      }

      return { success: added.length > 0, addedCount: added.length, cards: added };
    }

    case 'DISCARD_REVEALED':
    case 'DISCARD_REMAINING': {
      const p = state.players[controller];
      const pool = (context.revealedCards && context.revealedCards.length > 0)
        ? [...context.revealedCards]
        : (p.revealed ? [...p.revealed] : []);

      const discarded = [];
      for (const card of pool) {
        await moveCard(state, card, 'grave', controller, { cause: 'discard_revealed', sourceCard }, events);
        discarded.push(card);
      }

      p.revealed = [];
      context.revealedCards = [];

      return { success: true, count: discarded.length, cards: discarded };
    }

    case 'RETURN_REVEALED_BOTTOM':
    case 'RETURN_REMAINING_TO_DECK': {
      const p = state.players[controller];
      const pool = (context.revealedCards && context.revealedCards.length > 0)
        ? [...context.revealedCards]
        : (p.revealed ? [...p.revealed] : []);

      const pos = (op.position || 'bottom').toLowerCase();
      const destZone = pos === 'top' ? 'deck_top' : 'deck_bottom';

      const returned = [];
      for (const card of pool) {
        await moveCard(state, card, destZone, controller, { cause: 'return_revealed', sourceCard }, events);
        returned.push(card);
      }

      p.revealed = [];
      context.revealedCards = [];

      return { success: true, count: returned.length, cards: returned };
    }

    case 'SUMMON': {
      const p = state.players[controller];
      let pool = [];
      let isRevealed = false;

      if (op.target === 'this_card' || op.from === 'this_card') {
        pool = sourceCard ? [sourceCard] : [];
      } else if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isRevealed = true;
      } else if (op.from === 'grave' || op.from === 'trash') {
        pool = p.grave;
      } else if (op.from === 'removed' || op.from === 'open') {
        pool = p.removed;
      } else {
        // default from hand
        pool = p.hand;
      }

      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { success: false, reason: 'NO_TARGET_CARDS' };

      let cardToSummon = matching[0];
      if (matching.length > 1 && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'SELECT_SUMMON',
          title: 'Choose card to summon',
          candidates: matching.map(c => ({ card: c })),
          count: 1,
          chooser: controller
        });
        if (choice && choice[0]) {
          cardToSummon = choice[0].card || choice[0];
        }
      }

      if (!cardToSummon) return { success: false };

      // Atomic pre-check for cost + LV1 core requirements before mutating cores
      const isFree = op.free || op.noCost || op.withoutPayingCost;
      const cost = isFree ? 0 : (cardToSummon.cost || 0);
      const coresNeeded = Math.max(0, typeof op.initialCores === 'number' ? op.initialCores : 1);
      const totalReserveAvailable = (p.reserve.normal || 0) + (p.reserve.soul > 0 ? 1 : 0);

      if (!isFree && (p.reserve.normal || 0) < cost) {
        return { success: false, reason: 'INSUFFICIENT_COST_CORES' };
      }
      if (totalReserveAvailable < cost + coresNeeded) {
        return { success: false, reason: 'INSUFFICIENT_LV1_CORES' };
      }

      if (!isFree && cost > 0) {
        await moveCore(state, cost, { zone: 'reserve', side: controller }, { zone: 'trash', side: controller }, {
          cause: 'summon_cost',
          by: controller,
          sourceCard
        }, events);
      }

      // Allocate cores for LV1 (default 1 core)
      let usedSoul = false;
      let usedNormal = 0;

      if (coresNeeded > 0) {
        if (p.reserve.normal >= coresNeeded) {
          usedNormal = coresNeeded;
        } else if (p.reserve.normal + (p.reserve.soul > 0 ? 1 : 0) >= coresNeeded) {
          usedSoul = true;
          usedNormal = Math.max(0, coresNeeded - 1);
        } else {
          return { success: false, reason: 'INSUFFICIENT_LV1_CORES' };
        }

        if (usedNormal > 0) {
          await moveCore(state, usedNormal, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
            cause: 'summon',
            by: controller
          }, events);
        }
        if (usedSoul) {
          await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
            isSoulCore: true,
            cause: 'summon',
            by: controller
          }, events);
        }
      }

      const newStack = createFieldStack(cardToSummon, { normal: usedNormal, soul: usedSoul ? 1 : 0 });
      if (op.exhausted) {
        newStack.state = 'EXHAUSTED';
      } else {
        newStack.state = 'REFRESHED';
      }
      p.field.push(newStack);

      // Remove from prior zone
      p.hand = p.hand.filter(c => c.id !== cardToSummon.id);
      p.grave = p.grave.filter(c => c.id !== cardToSummon.id);
      p.removed = p.removed.filter(c => c.id !== cardToSummon.id);
      if (p.burst && p.burst.id === cardToSummon.id) p.burst = null;
      if (isRevealed) {
        if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cardToSummon.id);
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cardToSummon.id);
      }

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

      return { success: true, card: cardToSummon, stack: newStack };
    }

    case 'SUMMON_THIS_CARD': {
      if (!sourceCard) return { success: false, reason: 'NO_SOURCE_CARD' };
      const p = state.players[controller];

      const hasCores = p.reserve.normal > 0 || p.reserve.soul > 0;
      if (!hasCores) return { success: false, reason: 'INSUFFICIENT_LV1_CORES' };

      const useSoul = p.reserve.normal === 0 && p.reserve.soul > 0;
      await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
        isSoulCore: useSoul,
        cause: 'summon',
        by: controller,
        sourceCard
      }, events);

      const newStack = createFieldStack(sourceCard, { normal: useSoul ? 0 : 1, soul: useSoul ? 1 : 0 });
      if (op.exhausted) newStack.state = 'EXHAUSTED';
      p.field.push(newStack);

      p.hand = p.hand.filter(c => c.id !== sourceCard.id);
      p.grave = p.grave.filter(c => c.id !== sourceCard.id);
      p.removed = p.removed.filter(c => c.id !== sourceCard.id);
      if (p.burst && p.burst.id === sourceCard.id) p.burst = null;
      if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== sourceCard.id);
      if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== sourceCard.id);

      if (events) {
        await events.emit({
          type: 'SUMMONED',
          card: sourceCard,
          stack: newStack,
          player: controller,
          cause: 'effect',
          sourceCard
        });
      }

      return { success: true, card: sourceCard, stack: newStack };
    }

    case 'DEPLOY_NEXUS': {
      const p = state.players[controller];
      let pool = [];
      let isRevealed = false;

      if (op.target === 'this_card' || op.from === 'this_card') {
        pool = sourceCard ? [sourceCard] : [];
      } else if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isRevealed = true;
      } else if (op.from === 'grave' || op.from === 'trash') {
        pool = p.grave;
      } else {
        pool = p.hand;
      }

      const matching = pool.filter(c => {
        const type = (c.type || '').toLowerCase();
        if (!type.includes('nexus')) return false;
        return matchesCardFilter(c, op.filter, op);
      });

      if (matching.length === 0) return { success: false, reason: 'NO_NEXUS_TARGET' };

      let cardToDeploy = matching[0];
      if (matching.length > 1 && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'SELECT_NEXUS',
          title: 'Choose Nexus to deploy',
          candidates: matching.map(c => ({ card: c })),
          count: 1,
          chooser: controller
        });
        if (choice && choice[0]) {
          cardToDeploy = choice[0].card || choice[0];
        }
      }

      if (!cardToDeploy) return { success: false };

      const cores = Math.max(0, typeof op.cores === 'number' ? op.cores : 0);
      if (cores > 0) {
        if ((p.reserve.normal || 0) < cores) {
          return { success: false, reason: 'INSUFFICIENT_NEXUS_CORES' };
        }
        await moveCore(state, cores, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
          cause: 'deploy',
          by: controller
        }, events);
      }

      const newStack = createFieldStack(cardToDeploy, { normal: cores, soul: 0 });
      newStack.state = 'REFRESHED';
      p.field.push(newStack);
      if (!p.nexus) p.nexus = [];
      p.nexus.push(newStack);

      p.hand = p.hand.filter(c => c.id !== cardToDeploy.id);
      p.grave = p.grave.filter(c => c.id !== cardToDeploy.id);
      p.removed = p.removed.filter(c => c.id !== cardToDeploy.id);
      if (isRevealed) {
        if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cardToDeploy.id);
        if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cardToDeploy.id);
      }

      if (events) {
        await events.emit({
          type: 'DEPLOYED',
          card: cardToDeploy,
          stack: newStack,
          player: controller,
          cause: 'effect',
          sourceCard
        });
      }

      return { success: true, card: cardToDeploy, stack: newStack };
    }

    case 'SUMMON_RESERVE_ONLY': {
      const p = state.players[controller];
      let cardToSummon = sourceCard;

      if (!cardToSummon && p.hand.length > 0) {
        const candidates = queryCandidates(state, { zone: 'hand', side: 'self', types: ['Spirit'] }, context);
        if (candidates.length > 0 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_SUMMON',
            title: 'Choose Spirit to summon (reserve cores only)',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0]) cardToSummon = chosen[0].card || chosen[0];
        }
      }

      if (!cardToSummon) return { success: false, reason: 'NO_CARD_TO_SUMMON' };

      // Strictly enforce cores from reserve
      if (p.reserve.normal < 1 && p.reserve.soul < 1) {
        return { success: false, reason: 'NO_RESERVE_CORES' };
      }

      const useSoul = p.reserve.normal === 0 && p.reserve.soul > 0;
      await moveCore(state, 1, { zone: 'reserve', side: controller }, { zone: 'field', side: controller }, {
        isSoulCore: useSoul,
        cause: 'summon_reserve_only',
        by: controller
      }, events);

      const newStack = createFieldStack(cardToSummon, { normal: useSoul ? 0 : 1, soul: useSoul ? 1 : 0 });
      p.field.push(newStack);

      p.hand = p.hand.filter(c => c.id !== cardToSummon.id);
      p.grave = p.grave.filter(c => c.id !== cardToSummon.id);
      p.removed = p.removed.filter(c => c.id !== cardToSummon.id);
      if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== cardToSummon.id);
      if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== cardToSummon.id);
      if (p.burst && p.burst.id === cardToSummon.id) p.burst = null;

      if (events) {
        await events.emit({
          type: 'SUMMONED',
          card: cardToSummon,
          stack: newStack,
          player: controller,
          cause: 'summon_reserve_only',
          sourceCard
        });
      }

      return { success: true, card: cardToSummon, stack: newStack };
    }

    case 'RECOVER_LIFE': {
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const res = await moveCore(
        state,
        count,
        { zone: 'void' },
        { zone: 'life', side: targetSide },
        { cause: 'recover_life', by: controller, sourceCard },
        events
      );

      return { success: res, recoveredCount: count, currentLife: state.players[targetSide].life };
    }

    case 'PREVENT_LIFE_LOSS': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const duration = op.duration || 'THIS_TURN';

      state.modifiers.push({
        id: `mod_${Date.now()}_prevent_life_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PREVENT_LIFE_LOSS',
        side: targetSide,
        duration,
        sourceCardId: sourceCard ? sourceCard.id : null
      });

      if (events) {
        await events.emit({
          type: 'LIFE_LOSS_PREVENTED_REGISTERED',
          player: targetSide,
          duration,
          sourceCard
        });
      }

      return { success: true, duration, side: targetSide };
    }

    case 'SALVAGE': {
      const p = state.players[controller];
      let pool = [];
      let isRevealed = false;

      // Prefer revealed zone if present, otherwise grave
      if (context.revealedCards && context.revealedCards.length > 0) {
        pool = context.revealedCards;
        isRevealed = true;
      } else if (p.revealed && p.revealed.length > 0) {
        pool = p.revealed;
        isRevealed = true;
      } else {
        pool = p.grave;
      }

      const matching = pool.filter(c => matchesCardFilter(c, op.filter, op));
      if (matching.length === 0) return { success: false, count: 0, cards: [] };

      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      let chosen = matching;

      if (matching.length > count && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'SELECT_SALVAGE',
          title: 'Choose card(s) to salvage to Hand',
          candidates: matching.map(c => ({ card: c })),
          count,
          chooser: controller
        });
        if (choice && choice.length > 0) {
          chosen = choice.map(item => item.card || item);
        } else {
          chosen = matching.slice(0, count);
        }
      } else if (matching.length > count) {
        chosen = matching.slice(0, count);
      }

      const salvaged = [];
      for (const card of chosen) {
        await moveCard(state, card, 'hand', controller, { cause: 'salvage', sourceCard }, events);
        if (isRevealed) {
          if (p.revealed) p.revealed = p.revealed.filter(c => c.id !== card.id);
          if (context.revealedCards) context.revealedCards = context.revealedCards.filter(c => c.id !== card.id);
        }
        salvaged.push(card);
      }

      return { success: salvaged.length > 0, count: salvaged.length, cards: salvaged };
    }

    case 'DISCARD_BURST': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const targetPlayer = state.players[targetSide];
      if (!targetPlayer.burst) {
        return { success: false, reason: 'NO_BURST' };
      }

      const burstCard = targetPlayer.burst;
      await moveCard(state, burstCard, 'grave', targetSide, {
        cause: 'discard_burst',
        by: controller,
        sourceCard
      }, events);

      if (events) {
        await events.emit({
          type: 'BURST_DISCARDED',
          card: burstCard,
          player: targetSide,
          by: controller,
          sourceCard
        });
      }

      return { success: true, card: burstCard, player: targetSide };
    }

    // =========================================================================
    // MILESTONE 3: CONTINUOUS MODIFIER & RULE OPS
    // =========================================================================

    case 'ADD_SYMBOL':
    case 'GRANT_SYMBOL': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length === 1) targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        else if (candidates.length > 1 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose Spirit/Ultimate to add symbol',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0] && chosen[0].stack) targetStackId = chosen[0].stack.id || chosen[0].stack.stackId;
        }
      }
      const colors = Array.isArray(op.colors)
        ? op.colors.map(c => String(c))
        : [String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red')];
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const symbols = {};
      for (const c of colors) symbols[c] = (symbols[c] || 0) + count;

      const mod = {
        id: `mod_${Date.now()}_add_symbol_${Math.random().toString(36).substr(2, 5)}`,
        type: 'ADD_SYMBOL',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color: colors[0],
        symbolColor: colors[0],
        colors,
        count,
        symbols,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'SET_SYMBOL': {
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count ?? '0', 10) || 0;
      const color = String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red');
      const symbols = op.symbols ? { ...op.symbols } : (count > 0 ? { [color]: count } : {});

      const mod = {
        id: `mod_${Date.now()}_set_symbol_${Math.random().toString(36).substr(2, 5)}`,
        type: 'SET_SYMBOL',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color,
        symbolColor: color,
        count,
        symbols,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'GRANT_BRAVE_SYMBOLS': {
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      const color = String(op.color || (sourceCard && sourceCard.colors && sourceCard.colors[0]) || 'Red');
      const count = typeof op.count === 'number' ? op.count : parseInt(op.count || '1', 10) || 1;
      const symbols = op.symbols ? { ...op.symbols } : { [color]: count };

      const mod = {
        id: `mod_${Date.now()}_grant_brave_sym_${Math.random().toString(36).substr(2, 5)}`,
        type: 'GRANT_BRAVE_SYMBOLS',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color,
        symbolColor: color,
        count,
        symbols,
        duration: op.duration || 'PERMANENT',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'IMMUNITY': {
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const rawColors = op.colors || (op.color ? [op.color] : []);
      const colors = (Array.isArray(rawColors) ? rawColors : [rawColors]).map(c => String(c).toLowerCase());
      const rawSourceTypes = op.sourceTypes || (op.sourceType ? [op.sourceType] : []);
      const sourceTypes = (Array.isArray(rawSourceTypes) ? rawSourceTypes : [rawSourceTypes]).map(t => String(t).toLowerCase());

      const mod = {
        id: `mod_${Date.now()}_immunity_${Math.random().toString(36).substr(2, 5)}`,
        type: 'IMMUNITY',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        colors,
        sourceTypes,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'PROTECTION': {
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const rawColors = op.colors || (op.color ? [op.color] : []);
      const colors = (Array.isArray(rawColors) ? rawColors : [rawColors]).map(c => String(c).toLowerCase());
      const rawSourceTypes = op.sourceTypes || (op.sourceType ? [op.sourceType] : []);
      const sourceTypes = (Array.isArray(rawSourceTypes) ? rawSourceTypes : [rawSourceTypes]).map(t => String(t).toLowerCase());

      const mod = {
        id: `mod_${Date.now()}_protection_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PROTECTION',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        colors,
        sourceTypes,
        cannotBeDestroyed: Boolean(op.cannotBeDestroyed ?? (op.mode === 'DESTROY' || !op.mode)),
        cannotBeBounced: Boolean(op.cannotBeBounced ?? (op.mode === 'BOUNCE')),
        cannotBeDepleted: Boolean(op.cannotBeDepleted ?? (op.mode === 'DEPLETE')),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'PREVENT_DAMAGE': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const duration = op.duration || 'THIS_TURN';
      const mod = {
        id: `mod_${Date.now()}_prevent_dmg_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PREVENT_DAMAGE',
        side: targetSide,
        amount: typeof op.amount === 'number' ? op.amount : null,
        maxReduction: typeof op.maxReduction === 'number' ? op.maxReduction : null,
        duration,
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'NEGATE_EFFECT': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const mod = {
        id: `mod_${Date.now()}_negate_${Math.random().toString(36).substr(2, 5)}`,
        type: 'NEGATE_EFFECT',
        side: targetSide,
        targetCardId: op.targetCardId || null,
        targetFilter: op.filter || null,
        consumeOnUse: op.consumeOnUse !== false,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);

      if (events) {
        await events.emit({
          type: 'EFFECT_NEGATED_REGISTERED',
          player: targetSide,
          by: controller,
          sourceCard
        });
      }
      return { success: true, modifier: mod };
    }

    case 'UNBLOCKABLE': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length === 1) targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        else if (candidates.length > 1 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose Spirit/Ultimate to make unblockable',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0] && chosen[0].stack) targetStackId = chosen[0].stack.id || chosen[0].stack.stackId;
        }
      }
      const mod = {
        id: `mod_${Date.now()}_unblockable_${Math.random().toString(36).substr(2, 5)}`,
        type: 'UNBLOCKABLE',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        unlessFilter: op.unlessFilter || null,
        blockedOnlyByFilter: op.blockedOnlyByFilter || null,
        cannotBeBlockedByFilter: op.cannotBeBlockedByFilter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'COMBAT_RESTRICTION':
    case 'CANNOT_ATTACK':
    case 'CANNOT_BLOCK':
    case 'EXHAUSTED_BLOCK':
    case 'COMBAT_RULE': {
      const targetSide = op.side === 'self' ? controller : (op.side === 'opp' ? oppSide : (op.op === 'EXHAUSTED_BLOCK' ? controller : oppSide));
      let targetStackId = op.targetStackId || null;
      if (!targetStackId && op.target === 'SELF' && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      } else if (!targetStackId && op.filter && op.selectTarget) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'opp', ...op.filter }, context);
        if (candidates.length === 1) targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        else if (candidates.length > 1 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose target for combat rule',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0] && chosen[0].stack) targetStackId = chosen[0].stack.id || chosen[0].stack.stackId;
        }
      }

      const cannotAttack = Boolean(op.cannotAttack || op.op === 'CANNOT_ATTACK' || op.restriction === 'CANNOT_ATTACK' || op.restriction === 'CANNOT_ATTACK_OR_BLOCK');
      const cannotBlock = Boolean(op.cannotBlock || op.op === 'CANNOT_BLOCK' || op.restriction === 'CANNOT_BLOCK' || op.restriction === 'CANNOT_ATTACK_OR_BLOCK');
      const canBlockWhileExhausted = Boolean(op.canBlockWhileExhausted || op.op === 'EXHAUSTED_BLOCK' || op.restriction === 'CAN_BLOCK_EXHAUSTED');

      const mod = {
        id: `mod_${Date.now()}_combat_rest_${Math.random().toString(36).substr(2, 5)}`,
        type: 'COMBAT_RESTRICTION',
        targetStackId,
        targetFilter: targetStackId ? null : (op.filter || null),
        side: targetSide,
        cannotAttack,
        cannotBlock,
        canBlockWhileExhausted,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'FORCE_BLOCK': {
      const candidates = queryCandidates(state, {
        zone: 'field',
        side: op.side || 'opp',
        ...(op.filter || {})
      }, context);

      let chosenStack = null;
      if (op.targetStackId) {
        for (const s of Object.keys(state.players)) {
          const f = state.players[s].field.find(st => (st.id || st.stackId) === op.targetStackId);
          if (f) { chosenStack = f; break; }
        }
      } else if (candidates.length === 1) {
        chosenStack = candidates[0].stack;
      } else if (candidates.length > 1 && promptResolver) {
        const chosen = await promptResolver.choose({
          type: 'SELECT_FORCE_BLOCK',
          title: 'Choose opposing Spirit/Ultimate to force block',
          candidates,
          count: 1,
          chooser: controller
        });
        if (chosen && chosen[0] && chosen[0].stack) chosenStack = chosen[0].stack;
      } else if (candidates.length > 0) {
        chosenStack = candidates[0].stack;
      }

      if (!chosenStack) return { success: false, reason: 'NO_TARGET' };
      const chosenId = chosenStack.id || chosenStack.stackId;

      if (state.combat) {
        state.combat.forcedBlockerStackId = chosenId;
      }

      const mod = {
        id: `mod_${Date.now()}_force_block_${Math.random().toString(36).substr(2, 5)}`,
        type: 'FORCE_BLOCK',
        targetStackId: chosenId,
        side: oppSide,
        duration: op.duration || 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, targetStack: chosenStack, modifier: mod };
    }

    case 'TARGET_ATTACK': {
      const candidates = queryCandidates(state, {
        zone: 'field',
        side: op.side || 'opp',
        ...(op.filter || {})
      }, context);

      let chosenStack = null;
      if (op.targetStackId) {
        for (const s of Object.keys(state.players)) {
          const f = state.players[s].field.find(st => (st.id || st.stackId) === op.targetStackId);
          if (f) { chosenStack = f; break; }
        }
      } else if (candidates.length === 1) {
        chosenStack = candidates[0].stack;
      } else if (candidates.length > 1 && promptResolver) {
        const chosen = await promptResolver.choose({
          type: 'SELECT_TARGET_ATTACK',
          title: 'Choose opposing Spirit/Ultimate for designated attack',
          candidates,
          count: 1,
          chooser: controller
        });
        if (chosen && chosen[0] && chosen[0].stack) chosenStack = chosen[0].stack;
      } else if (candidates.length > 0) {
        chosenStack = candidates[0].stack;
      }

      if (!chosenStack) return { success: false, reason: 'NO_TARGET' };
      const chosenId = chosenStack.id || chosenStack.stackId;

      if (state.combat) {
        state.combat.forcedBlockerStackId = chosenId;
        state.combat.designatedTargetStackId = chosenId;
      }

      const mod = {
        id: `mod_${Date.now()}_target_attack_${Math.random().toString(36).substr(2, 5)}`,
        type: 'TARGET_ATTACK',
        targetStackId: chosenId,
        attackerStackId: sourceStack ? (sourceStack.id || sourceStack.stackId) : null,
        side: oppSide,
        duration: op.duration || 'THIS_BATTLE',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, targetStack: chosenStack, modifier: mod };
    }

    case 'TREAT_RULE':
    case 'TREAT_LEVEL':
    case 'TREAT_COLOR_SYMBOL': {
      let targetStackId = op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && !op.filter && !op.targetCardId && sourceStack) {
        targetStackId = sourceStack.id || sourceStack.stackId;
      }
      const mod = {
        id: `mod_${Date.now()}_treat_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op === 'TREAT_LEVEL' ? 'TREAT_LEVEL' : 'TREAT_RULE',
        targetStackId,
        targetCardId: op.targetCardId || (op.target === 'SELF' && sourceCard ? sourceCard.id : null),
        targetFilter: (targetStackId || op.targetCardId) ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        treatAsMaxLevel: Boolean(op.treatAsMaxLevel || op.maxLevel),
        setLevel: typeof op.setLevel === 'number' ? op.setLevel : (typeof op.level === 'number' ? op.level : null),
        levelDelta: typeof op.levelDelta === 'number' ? op.levelDelta : (typeof op.delta === 'number' ? op.delta : null),
        setCost: typeof op.setCost === 'number' ? op.setCost : (typeof op.cost === 'number' ? op.cost : null),
        costDelta: typeof op.costDelta === 'number' ? op.costDelta : null,
        colorless: Boolean(op.colorless),
        addColors: op.addColors || (op.color ? [op.color] : null),
        setColors: op.setColors || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'GRANT_FAMILY': {
      let targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);
      if (!targetStackId && op.filter) {
        const candidates = queryCandidates(state, { zone: 'field', side: op.side || 'self', ...op.filter }, context);
        if (candidates.length === 1) targetStackId = candidates[0].stack.id || candidates[0].stack.stackId;
        else if (candidates.length > 1 && promptResolver) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_TARGET',
            title: 'Choose target to grant family',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0] && chosen[0].stack) targetStackId = chosen[0].stack.id || chosen[0].stack.stackId;
        }
      }
      const families = Array.isArray(op.families)
        ? op.families
        : (op.family ? [op.family] : []);

      const mod = {
        id: `mod_${Date.now()}_grant_family_${Math.random().toString(36).substr(2, 5)}`,
        type: 'GRANT_FAMILY',
        targetStackId,
        targetCardId: op.targetCardId || null,
        targetFilter: (targetStackId || op.targetCardId) ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        family: families[0] || null,
        families,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'CHOOSE_COLOR': {
      const availableColors = Array.isArray(op.colors) && op.colors.length > 0
        ? op.colors.map(c => String(c))
        : ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];

      let chosenColor = op.color ? String(op.color) : availableColors[0];
      if (!op.color && promptResolver) {
        const choice = await promptResolver.choose({
          type: 'CHOOSE_COLOR',
          title: 'Choose a color',
          candidates: availableColors.map(c => ({ id: c, color: c, label: c.toUpperCase() })),
          count: 1,
          chooser: controller
        });
        if (choice && choice[0]) {
          chosenColor = String(choice[0].color || choice[0].id || choice[0]);
        }
      }

      context.chosenColor = chosenColor;
      const targetStackId = op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null);

      const mod = {
        id: `mod_${Date.now()}_choose_color_${Math.random().toString(36).substr(2, 5)}`,
        type: 'CHOOSE_COLOR',
        targetStackId,
        targetCardId: op.targetCardId || (sourceCard ? sourceCard.id : null),
        targetFilter: targetStackId ? null : (op.filter || null),
        side: op.side === 'opp' ? oppSide : controller,
        color: chosenColor,
        setColors: op.replaceColors ? [chosenColor] : null,
        addColors: op.replaceColors ? null : [chosenColor],
        addSymbol: Boolean(op.addSymbol),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, chosenColor, modifier: mod };
    }

    case 'COST_MODIFIER': {
      const targetSide = op.side === 'opp' ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_cost_mod_${Math.random().toString(36).substr(2, 5)}`,
        type: 'COST_MODIFIER',
        side: targetSide,
        targetCardId: op.targetCardId || (op.target === 'SELF' && sourceCard ? sourceCard.id : null),
        targetStackId: op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null),
        targetFilter: op.filter || null,
        setCost: typeof op.setCost === 'number' ? op.setCost : (typeof op.cost === 'number' ? op.cost : null),
        amount: typeof op.amount === 'number' ? op.amount : null,
        delta: typeof op.delta === 'number' ? op.delta : null,
        mode: op.mode || (typeof op.amount === 'number' && op.amount < 0 ? 'REDUCE' : 'ADD'),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'SET_RESTRICTION': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const restriction = op.restriction || op.rule || 'CANNOT_SUMMON';
      const mod = {
        id: `mod_${Date.now()}_set_rest_${Math.random().toString(36).substr(2, 5)}`,
        type: 'SET_RESTRICTION',
        side: targetSide,
        restriction,
        targetFilter: op.filter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);

      if (events) {
        await events.emit({
          type: 'RESTRICTION_APPLIED',
          player: targetSide,
          restriction,
          duration: mod.duration,
          sourceCard
        });
      }
      return { success: true, modifier: mod };
    }

    default:
      return { success: true, unhandledOp: op.op };
  }
}
