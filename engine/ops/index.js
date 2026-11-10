/**
 * engine/ops/index.js
 * 
 * Headless Async Primitive Operation Library for Battle Spirits Eternal.
 * Resolves Intermediate Representation (IR) operations deterministically.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';
import { queryCandidates } from '../selectors.js';
import { computeColors, computeLevel } from '../continuous.js';

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
      const minRemaining = typeof op.minCoresRemaining === 'number' ? op.minCoresRemaining : null;

      let totalMoved = 0;

      if (fromZone === 'field' && minRemaining !== null) {
        const p = state.players[fromSide];
        for (let i = 0; i < count; i++) {
          const eligibleStacks = p.field.filter(st => {
            const cores = (st.cores.normal || 0) + (st.cores.soul ? 1 : 0);
            return cores > minRemaining;
          });
          if (eligibleStacks.length === 0) break;

          let fromStackId = null;
          if (op.from.target === 'self' && sourceCard) {
            const selfStack = eligibleStacks.find(st => st.top.id === sourceCard.id);
            if (selfStack) fromStackId = selfStack.id;
          } else {
            const chosenStack = await promptResolver.choose({
              type: 'SELECT_STACK',
              title: 'Choose a spirit to remove core from',
              candidates: eligibleStacks.map(st => ({ stack: st, card: st.top })),
              count: 1,
              chooser: op.chooser === 'opp' ? oppSide : controller
            });
            if (chosenStack && chosenStack[0]) {
              fromStackId = chosenStack[0].stack ? chosenStack[0].stack.id : chosenStack[0].id;
            }
          }

          if (!fromStackId) break;

          let toStackId = null;
          if (toZone === 'field') {
            const toP = state.players[toSide];
            toStackId = (toP.field[0] && toP.field[0].id) || null;
          }

          const res = await moveCore(
            state,
            1,
            { zone: fromZone, side: fromSide, stackId: fromStackId },
            { zone: toZone, side: toSide, stackId: toStackId },
            { isSoulCore: isSoul, cause: 'effect', by: controller, sourceCard, minCoresRemaining },
            events
          );
          if (res) totalMoved++;
          else break;
        }
        return { success: totalMoved > 0, coresMoved: totalMoved };
      }

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
      const p = state.players[controller];
      const selfStack = (p.field || []).find(st => st.top && sourceCard && (st.top.id === sourceCard.id || st.top.cardNumber === sourceCard.cardNumber));

      if (op.target === 'self' || op.target === 'this_spirit' || op.target === 'this_unit' || (!op.target && selfStack)) {
        if (selfStack) targetStackId = selfStack.id;
      } else {
        const candidates = queryCandidates(state, { side: 'self', types: ['Spirit', 'Ultimate'] }, context);
        if (candidates.length > 0) {
          const chosen = await promptResolver.choose({
            type: 'SELECT_BP_BUFF',
            title: 'Select Spirit/Ultimate to grant BP buff',
            candidates,
            count: 1,
            chooser: controller
          });
          if (chosen && chosen[0]) {
            targetStackId = chosen[0].stack ? chosen[0].stack.id : chosen[0].id;
          } else if (selfStack) {
            targetStackId = selfStack.id;
          }
        } else if (selfStack) {
          targetStackId = selfStack.id;
        }
      }

      let multiplier = 1;
      if (op.forEach) {
        const forEachType = String(op.forEach).toUpperCase();
        if (forEachType === 'RESERVE_CORES' || forEachType === 'CORE_IN_RESERVE') {
          const p = state.players[controller];
          multiplier = (p.reserve.normal || 0) + (p.reserve.soul ? 1 : 0);
        } else if (forEachType === 'OPPOSING_REFRESHED_SPIRITS' || forEachType === 'REFRESHED_SPIRIT_COUNT') {
          const oppP = state.players[oppSide];
          multiplier = (oppP.field || []).filter(st => st.state === 'REFRESHED' && (st.top.type || '').includes('Spirit')).length;
        } else if (forEachType === 'DRAGON_FAMILY_SPIRITS' || forEachType === 'DRAGON_FAMILY_COUNT') {
          const p = state.players[controller];
          multiplier = (p.field || []).filter(st => {
            const fams = (Array.isArray(st.top.families) ? st.top.families : (st.top.family ? [st.top.family] : []));
            return fams.some(f => String(f).toLowerCase().includes('dragon'));
          }).length;
        } else if (forEachType === 'ALL_NEXUSES' || forEachType === 'NEXUS_COUNT') {
          let nexCount = 0;
          for (const s of ['player', 'opponent']) {
            const pl = state.players[s];
            if (pl) {
              nexCount += (pl.field || []).filter(st => (st.top.type || '').includes('Nexus')).length;
              nexCount += (pl.nexus || []).length;
            }
          }
          multiplier = nexCount;
        } else if (forEachType === 'EXHAUSTED_SPIRIT_COUNT' || forEachType === 'SELF_EXHAUSTED_SPIRITS') {
          const p = state.players[controller];
          multiplier = (p.field || []).filter(st => (st.state === 'EXHAUSTED' || st.state === 'HEAVY_EXHAUSTED') && (st.top.type || '').includes('Spirit')).length;
        }
      }

      const buffAmount = (op.amount || 1000) * multiplier;

      state.modifiers.push({
        id: `mod_${Date.now()}_${Math.random()}`,
        type: 'BP_BUFF',
        targetStackId: targetStackId || (selfStack ? selfStack.id : null),
        side: controller,
        amount: buffAmount,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      });

      return { success: true, amount: buffAmount };
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
      let availableColors = Array.isArray(op.colors) && op.colors.length > 0
        ? op.colors.map(c => String(c))
        : ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];

      if (op.colorsFromField) {
        const fieldColors = [];
        for (const side of ['player', 'opponent']) {
          for (const stack of state.players[side].field || []) {
            if (stack.top?.type !== 'Spirit') continue;
            for (const color of computeColors(state, stack)) {
              if (!fieldColors.some(c => c.toLowerCase() === String(color).toLowerCase())) fieldColors.push(color);
            }
          }
        }
        availableColors = fieldColors;
        if (availableColors.length === 0) return { success: false, reason: 'NO_ELIGIBLE_COLOR' };
      }

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

    case 'TREAT_AS_MAX_LEVEL': {
      const color = op.color || ctx.chosenColor;
      if (!color) return { success: false, reason: 'COLOR_NOT_CHOSEN' };
      const modifier = {
        id: `mod_${Date.now()}_max_level_${Math.random().toString(36).slice(2, 7)}`,
        type: 'TREAT_RULE',
        side: op.side || 'both',
        targetFilter: { ...(op.filter || {}), type: 'Spirit', color },
        treatAs: 'MAX_LEVEL',
        treatAsMaxLevel: true,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(modifier);
      return { success: true, modifier };
    }

    case 'ADD_COLOR': {
      if (op.color) {
        let targetStack = sourceStack;
        if (!targetStack && sourceCard) {
          for (const side of ['player', 'opponent']) {
            targetStack = (state.players[side].field || []).find(stack => stack.top?.id === sourceCard.id) || null;
            if (targetStack) break;
          }
        }
        if (!targetStack) return { success: false, reason: 'SOURCE_NOT_ON_FIELD' };

        const modifier = {
          id: `mod_${Date.now()}_add_color_${Math.random().toString(36).slice(2, 7)}`,
          type: 'TREAT_COLOR_SYMBOL',
          targetStackId: targetStack.id || targetStack.stackId,
          color: String(op.color),
          duration: op.duration || 'PERMANENT',
          sourceCardId: sourceCard ? sourceCard.id : null
        };
        state.modifiers.push(modifier);
        return { success: true, color: modifier.color, targetStackId: modifier.targetStackId, modifier };
      }

      const candidates = queryCandidates(
        state,
        { zone: 'field', side: 'self', types: op.types || ['Spirit'], filters: op.filter || {} },
        context
      );
      if (candidates.length === 0) return { success: false, reason: 'NO_ELIGIBLE_TARGET' };

      const chosenTargets = await promptResolver.choose({
        type: 'SELECT_STACK',
        title: 'Choose a Spirit to gain an additional color',
        candidates,
        count: 1,
        chooser: controller
      });
      const selected = chosenTargets && chosenTargets[0];
      const targetStack = selected && (selected.stack || candidates.find(c => c.stack?.id === selected.id)?.stack);
      if (!targetStack) return { success: false, reason: 'TARGET_NOT_SELECTED' };

      const originalColors = Array.isArray(targetStack.top.colors)
        ? targetStack.top.colors
        : [targetStack.top.color || 'Red'];
      const availableColors = (op.colors || ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'])
        .filter(color => !originalColors.some(original => String(original).toLowerCase() === String(color).toLowerCase()));
      if (availableColors.length === 0) return { success: false, reason: 'NO_ADDITIONAL_COLOR_AVAILABLE' };

      const colorChoice = await promptResolver.choose({
        type: 'CHOOSE_COLOR',
        title: 'Choose an additional color',
        candidates: availableColors.map(color => ({ id: color, color, label: String(color).toUpperCase() })),
        count: 1,
        chooser: controller
      });
      const choice = colorChoice && colorChoice[0];
      const color = choice && String(choice.color || choice.id || choice);
      if (!color || !availableColors.some(c => c.toLowerCase() === color.toLowerCase())) {
        return { success: false, reason: 'COLOR_NOT_SELECTED' };
      }

      const modifier = {
        id: `mod_${Date.now()}_add_color_${Math.random().toString(36).slice(2, 7)}`,
        type: 'TREAT_COLOR_SYMBOL',
        targetStackId: targetStack.id || targetStack.stackId,
        color,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(modifier);
      return { success: true, color, targetStackId: modifier.targetStackId, modifier };
    }

    case 'SET_HAND_COST':
    case 'COST_MODIFIER': {
      const targetSide = op.side === 'opp' || op.side === 'opponent' ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_cost_mod_${Math.random().toString(36).slice(2, 7)}`,
        type: 'COST_MODIFIER',
        side: targetSide,
        targetCardId: op.targetCardId || (op.target === 'SELF' && sourceCard ? sourceCard.id : null),
        targetStackId: op.targetStackId || (op.target === 'SELF' && sourceStack ? (sourceStack.id || sourceStack.stackId) : null),
        targetFilter: op.filter || (op.family ? { family: op.family } : null),
        setCost: typeof op.setCost === 'number' ? op.setCost : (typeof op.cost === 'number' ? op.cost : null),
        amount: typeof op.amount === 'number' ? op.amount : null,
        delta: typeof op.delta === 'number' ? op.delta : null,
        mode: op.mode || (typeof op.amount === 'number' && op.amount < 0 ? 'REDUCE' : 'ADD'),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      if (mod.setCost === null && mod.amount === null && mod.delta === null) {
        return { success: false, reason: 'COST_MODIFIER_VALUE_MISSING' };
      }
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

    // -------------------------------------------------------------
    // MILESTONE 4: Modern Mechanics (Grandwalker, Rebirth & Advanced Keywords)
    // -------------------------------------------------------------
    case 'CORE_CHARGE_TRIGGER':
    case 'CORE_CHARGE_ADD': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const gwStack = (sourceStack && ((sourceStack.top.type || '').toLowerCase().includes('grandwalker') || (sourceStack.top.family || []).some(f => f.toLowerCase().includes('grandwalker'))))
        ? sourceStack
        : p.field.find(s => (s.top.type || '').toLowerCase().includes('grandwalker') || (s.top.family || []).some(f => f.toLowerCase().includes('grandwalker'))) || sourceStack || p.field[0] || null;

      if (op.op === 'CORE_CHARGE_TRIGGER') {
        const millCount = typeof op.millCount === 'number' ? op.millCount : (typeof op.count === 'number' ? op.count : 3);
        const milled = [];
        for (let i = 0; i < millCount; i++) {
          if (p.deck.length === 0) break;
          const card = p.deck.shift();
          p.grave.push(card);
          milled.push(card);
        }
        context.coreChargeMilled = milled;
        const matched = op.filter ? milled.filter(c => matchesCardFilter(c, op.filter)) : milled;
        const addedCores = matched.length;
        if (gwStack && addedCores > 0) {
          gwStack.cores.normal = (gwStack.cores.normal || 0) + addedCores;
        }
        if (events) {
          await events.emit({
            type: 'CORE_CHARGE_ADDED',
            player: targetSide,
            milledCount: milled.length,
            addedCores,
            stackId: gwStack ? (gwStack.id || gwStack.stackId) : null,
            sourceCard
          });
        }
        return { success: true, milledCount: milled.length, addedCores, milled };
      }

      // CORE_CHARGE_ADD
      let count = typeof op.count === 'number' ? op.count : 1;
      if (Array.isArray(context.coreChargeMilled) && op.filter) {
        const matched = context.coreChargeMilled.filter(c => matchesCardFilter(c, op.filter));
        count = matched.length * (typeof op.perMatch === 'number' ? op.perMatch : 1);
      }
      if (gwStack && count > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + count;
      }
      if (events) {
        await events.emit({
          type: 'CORE_CHARGE_ADDED',
          player: targetSide,
          addedCores: count,
          stackId: gwStack ? (gwStack.id || gwStack.stackId) : null,
          sourceCard
        });
      }
      return { success: true, addedCores: count, stackId: gwStack ? (gwStack.id || gwStack.stackId) : null };
    }

    case 'GRANDWALKER_CORE_RULE':
    case 'GRANDWALKER_PROTECTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const gwStack = sourceStack || p.field.find(s => (s.top.type || '').toLowerCase().includes('grandwalker')) || null;
      const targetStackId = op.targetStackId || (gwStack ? (gwStack.id || gwStack.stackId) : null);
      const initialCores = typeof op.cores === 'number' ? op.cores : (typeof op.count === 'number' ? op.count : 0);
      if (gwStack && initialCores > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + initialCores;
      }
      const mod = {
        id: `mod_${Date.now()}_gw_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        targetStackId,
        onlyAffectedByGrandwalkerEffects: true,
        coreChargeOnly: op.op === 'GRANDWALKER_CORE_RULE',
        duration: op.duration || 'PERMANENT',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod, addedCores: initialCores };
    }

    case 'GRANDWALKER_ACTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const gwStack = (sourceStack && ((sourceStack.top.type || '').toLowerCase().includes('grandwalker') || (sourceStack.top.family || []).some(f => f.toLowerCase().includes('grandwalker'))))
        ? sourceStack
        : p.field.find(s => (s.top.type || '').toLowerCase().includes('grandwalker') || (s.top.family || []).some(f => f.toLowerCase().includes('grandwalker'))) || sourceStack || p.field[0] || null;

      if (!gwStack) {
        return { success: false, reason: 'NO_GRANDWALKER_FOUND' };
      }

      const costCores = typeof op.costCores === 'number' ? op.costCores : (typeof op.sendToVoid === 'number' ? op.sendToVoid : 0);
      if (costCores > 0) {
        const available = gwStack.cores.normal || 0;
        if (available < costCores) {
          return { success: false, reason: 'INSUFFICIENT_GRANDWALKER_CORES', required: costCores, available };
        }
        gwStack.cores.normal -= costCores;
        if (events) {
          await events.emit({
            type: 'GRANDWALKER_ACTION_RESOLVED',
            player: targetSide,
            action: op.action || 'GRANDWALKER_SKILL',
            costPaid: costCores,
            stackId: gwStack.id || gwStack.stackId,
            sourceCard
          });
        }
        return { success: true, costPaid: costCores, remainingCores: gwStack.cores.normal };
      }

      const addCores = typeof op.addCores === 'number' ? op.addCores : (typeof op.count === 'number' ? op.count : 0);
      if (addCores > 0) {
        gwStack.cores.normal = (gwStack.cores.normal || 0) + addCores;
      }
      if (events) {
        await events.emit({
          type: 'GRANDWALKER_ACTION_RESOLVED',
          player: targetSide,
          action: op.action || 'GRANDWALKER_ACTION',
          addedCores: addCores,
          stackId: gwStack.id || gwStack.stackId,
          sourceCard
        });
      }
      return { success: true, addedCores: addCores, stackId: gwStack.id || gwStack.stackId };
    }

    case 'REBIRTH_FLIP':
    case 'REBIRTH_ACTION': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : p.field[0]) || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_STACK_TO_REBIRTH' };
      }

      const bSide = op.bSideData || targetStack.top.backSide || targetStack.top.rebirthSide || targetStack.top.bSide || null;
      if (bSide && typeof bSide === 'object') {
        targetStack.aSideSnapshot = { ...targetStack.top };
        Object.assign(targetStack.top, bSide);
      }
      targetStack.isReborn = true;
      targetStack.top.isReborn = true;
      if (op.refresh !== false) {
        targetStack.exhausted = false;
      }
      if (op.placeSoulCore) {
        if (p.reserve.soul > 0) {
          p.reserve.soul = 0;
          targetStack.cores.soul = 1;
        } else if (p.trash.soul > 0) {
          p.trash.soul = 0;
          targetStack.cores.soul = 1;
        } else {
          targetStack.cores.soul = 1;
        }
      }
      if (typeof op.addCores === 'number' && op.addCores > 0) {
        targetStack.cores.normal = (targetStack.cores.normal || 0) + op.addCores;
      }
      p.count = (p.count || 0) + (typeof op.addCount === 'number' ? op.addCount : 1);

      if (events) {
        await events.emit({
          type: 'REBORN',
          player: targetSide,
          stackId: targetStack.id || targetStack.stackId,
          card: targetStack.top,
          count: p.count
        });
      }
      return { success: true, isReborn: true, stackId: targetStack.id || targetStack.stackId, count: p.count };
    }

    case 'REBIRTH_CORE_PLACEMENT': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const targetStack = sourceStack || p.field.find(s => s.isReborn || (s.top && s.top.isReborn)) || p.field[0] || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_REBORN_STACK' };
      }
      const count = typeof op.count === 'number' ? op.count : 1;
      const from = (op.from || 'void').toLowerCase();
      let moved = 0;
      if (from === 'reserve') {
        const take = Math.min(count, p.reserve.normal || 0);
        p.reserve.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved = take;
      } else if (from === 'trash') {
        const take = Math.min(count, p.trash.normal || 0);
        p.trash.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved = take;
      } else {
        targetStack.cores.normal = (targetStack.cores.normal || 0) + count;
        moved = count;
      }
      return { success: true, movedCores: moved, stackId: targetStack.id || targetStack.stackId };
    }

    case 'KEYWORD_RULE':
    case 'KEYWORD_ABILITY':
    case 'KEYWORD_ACTION':
    case 'GRANT_KEYWORD':
    case 'GRANT_ABILITY':
    case 'MODIFY_KEYWORD': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const opp = state.players[targetSide === 'player' ? 'opponent' : 'player'];
      const keyword = String(op.keyword || op.ability || op.rule || 'Keyword').trim();
      const kwLower = keyword.toLowerCase();
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : p.field[0]) || null;

      let actionResult = {};

      if (kwLower.includes('high speed')) {
        if (op.cardId || op.summonCardId) {
          const cid = op.cardId || op.summonCardId;
          const cIdx = p.hand.findIndex(c => c.id === cid || c.cardId === cid || c.cardNumber === cid);
          if (cIdx !== -1) {
            const costToPay = typeof op.cost === 'number' ? op.cost : 1;
            if ((p.reserve.normal + p.reserve.soul) >= costToPay) {
              const normalPaid = Math.min(p.reserve.normal, costToPay);
              p.reserve.normal -= normalPaid;
              p.trash.normal += normalPaid;
              if (costToPay - normalPaid > 0 && p.reserve.soul > 0) {
                p.reserve.soul = 0;
                p.trash.soul = 1;
              }
              const res = await moveCard(state, p.hand[cIdx], 'field', targetSide, { cause: 'effect' }, events);
              if (res && p.reserve.normal > 0) {
                const newStack = p.field.find(st => st.top.id === cid || st.top.cardId === cid || st.top.cardNumber === cid);
                if (newStack) {
                  p.reserve.normal -= 1;
                  newStack.cores.normal += 1;
                  actionResult.summonedStack = newStack;
                }
              }
            }
          }
        }
      } else if (kwLower.includes('clash') || kwLower.includes('showdown') || kwLower.includes('excite')) {
        state.modifiers.push({
          id: `mod_${Date.now()}_kw_clash_${Math.random().toString(36).substr(2, 5)}`,
          type: 'FORCE_BLOCK',
          side: targetSide === 'player' ? 'opponent' : 'player',
          keyword,
          duration: op.duration || 'THIS_BATTLE',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        actionResult.forcedBlock = true;
      } else if (kwLower.includes('crush')) {
        const lv = targetStack ? computeLevel(targetStack, state) : (op.level || 1);
        const millCount = typeof op.count === 'number' ? op.count : lv;
        const milled = [];
        for (let i = 0; i < millCount; i++) {
          if (opp.deck.length === 0) break;
          const c = opp.deck.shift();
          opp.grave.push(c);
          milled.push(c);
        }
        actionResult.milledCount = milled.length;
      } else if (kwLower.includes('windstorm')) {
        const exhaustCount = typeof op.count === 'number' ? op.count : 1;
        let exhausted = 0;
        for (const s of opp.field) {
          if (exhausted >= exhaustCount) break;
          if (!s.exhausted) {
            s.exhausted = true;
            exhausted++;
          }
        }
        actionResult.exhaustedCount = exhausted;
      } else if (kwLower.includes('holy life')) {
        p.life += 1;
        actionResult.lifeRecovered = 1;
      } else if (kwLower.includes('armor') || kwLower.includes('a.t. field')) {
        const colors = Array.isArray(op.colors) ? op.colors : (op.color ? [op.color] : ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']);
        state.modifiers.push({
          id: `mod_${Date.now()}_kw_armor_${Math.random().toString(36).substr(2, 5)}`,
          type: 'IMMUNITY',
          side: targetSide,
          targetStackId: targetStack ? (targetStack.id || targetStack.stackId) : null,
          colors,
          categories: ['SPIRIT', 'ULTIMATE', 'NEXUS', 'MAGIC'],
          duration: op.duration || 'THIS_TURN',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        actionResult.armorColors = colors;
      } else if (kwLower.includes('mirage')) {
        if (sourceCard) {
          p.mirage = sourceCard;
          actionResult.mirageSet = sourceCard.id;
        }
      } else if (kwLower.includes('accel')) {
        if (sourceCard) {
          if (!Array.isArray(p.removed)) p.removed = [];
          const hIdx = p.hand.findIndex(c => c.id === sourceCard.id);
          if (hIdx !== -1) p.hand.splice(hIdx, 1);
          p.removed.push(sourceCard);
          actionResult.accelMovedToRemoved = true;
        }
      }

      const mod = {
        id: `mod_${Date.now()}_kw_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        targetStackId: targetStack ? (targetStack.id || targetStack.stackId) : null,
        targetFilter: op.filter || null,
        keyword,
        value: op.value || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, keyword, modifier: mod, ...actionResult };
    }

    case 'TRIBUTE_COST': {
      const p = state.players[controller];
      const minCost = typeof op.minCost === 'number' ? op.minCost : 0;
      const candidates = p.field.filter(s => {
        if (sourceStack && (s.id || s.stackId) === (sourceStack.id || sourceStack.stackId)) return false;
        const typeStr = (s.top.type || 'Spirit').toLowerCase();
        if (typeStr.includes('nexus')) return false;
        if ((s.top.cost || 0) < minCost) return false;
        if (op.family && !(s.top.family || []).some(f => f.toLowerCase().includes(String(op.family).toLowerCase()))) return false;
        if (op.filter && !matchesCardFilter(s.top, op.filter)) return false;
        return true;
      });

      if (candidates.length === 0) {
        return { success: false, reason: 'NO_VALID_TRIBUTE_TARGET' };
      }

      let chosen = candidates[0];
      if (op.targetStackId) {
        const explicit = candidates.find(s => (s.id || s.stackId) === op.targetStackId || s.top.id === op.targetStackId);
        if (explicit) chosen = explicit;
      } else if (candidates.length > 1 && promptResolver && typeof promptResolver.choose === 'function') {
        const choice = await promptResolver.choose({
          type: 'SELECT_TRIBUTE',
          player: controller,
          options: candidates.map(s => s.id || s.stackId)
        });
        const found = candidates.find(s => (s.id || s.stackId) === choice || s.top.id === choice);
        if (found) chosen = found;
      }

      const dest = (op.destination || 'VOID').toUpperCase();
      const normalCores = chosen.cores.normal || 0;
      const soulCores = chosen.cores.soul || 0;
      chosen.cores.normal = 0;
      chosen.cores.soul = 0;

      if (dest === 'TRASH') {
        p.trash.normal += normalCores;
        p.trash.soul += soulCores;
      } else if (dest === 'RESERVE') {
        p.reserve.normal += normalCores;
        p.reserve.soul += soulCores;
      } else {
        // Default Tribute: cores go to Void (except Soul Core if rule protects it, or sent to trash/void per op)
        if (soulCores > 0 && op.keepSoulCoreInTrash) {
          p.trash.soul += soulCores;
        }
      }

      await moveCard(state, chosen.top, 'grave', controller, { cause: 'tribute', by: controller }, events);
      if (events) {
        await events.emit({
          type: 'TRIBUTE_PAID',
          player: controller,
          tributedCard: chosen.top,
          coresMoved: normalCores + soulCores,
          destination: dest
        });
      }
      return { success: true, tributedStackId: chosen.id || chosen.stackId, tributedCard: chosen.top, coresMoved: normalCores + soulCores };
    }

    case 'AWAKEN_CORE_MOVE': {
      const p = state.players[controller];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : p.field[0]) || null;
      if (!targetStack) {
        return { success: false, reason: 'NO_AWAKEN_TARGET' };
      }

      const requested = op.count === 'ANY' ? (typeof op.requestedCount === 'number' ? op.requestedCount : 1) : (typeof op.count === 'number' ? op.count : 1);
      let moved = 0;

      // Move from other friendly spirits first
      for (const s of p.field) {
        if ((s.id || s.stackId) === (targetStack.id || targetStack.stackId)) continue;
        while (moved < requested && (s.cores.normal || 0) > 0) {
          s.cores.normal -= 1;
          targetStack.cores.normal = (targetStack.cores.normal || 0) + 1;
          moved++;
        }
        if (moved >= requested) break;
      }

      // Also allow taking from reserve if fromReserve is allowed or no other spirits had enough cores
      if (moved < requested && op.allowReserve !== false && (p.reserve.normal || 0) > 0) {
        const take = Math.min(requested - moved, p.reserve.normal);
        p.reserve.normal -= take;
        targetStack.cores.normal = (targetStack.cores.normal || 0) + take;
        moved += take;
      }

      if (events) {
        await events.emit({
          type: 'AWAKEN_RESOLVED',
          player: controller,
          stackId: targetStack.id || targetStack.stackId,
          movedCores: moved
        });
      }
      return { success: moved > 0, movedCores: moved, stackId: targetStack.id || targetStack.stackId };
    }

    case 'SEAL_MOVE': {
      const p = state.players[controller];
      let movedSoulCore = false;
      if (sourceStack && (sourceStack.cores.soul || 0) > 0) {
        sourceStack.cores.soul = 0;
        movedSoulCore = true;
      } else if ((p.reserve.soul || 0) > 0) {
        p.reserve.soul = 0;
        movedSoulCore = true;
      } else {
        const stackWithSoul = p.field.find(s => (s.cores.soul || 0) > 0);
        if (stackWithSoul) {
          stackWithSoul.cores.soul = 0;
          movedSoulCore = true;
        }
      }

      if (!movedSoulCore) {
        return { success: false, reason: 'SOUL_CORE_NOT_AVAILABLE_FOR_SEAL' };
      }

      p.life += 1;
      p.isDuringSeal = true;
      p.soulCoreInLife = true;

      if (events) {
        await events.emit({
          type: 'SEAL_ACTIVATED',
          player: controller,
          life: p.life,
          sourceCard
        });
      }
      return { success: true, isDuringSeal: true, life: p.life };
    }

    case 'MOVE_SOUL_CORE':
    case 'ADVENT_SOUL_CORE_ACTION': {
      const p = state.players[controller];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : p.field[0]) || null;
      const toZone = (op.to || 'field').toLowerCase();

      // Remove soul core from current location
      if ((p.reserve.soul || 0) > 0) p.reserve.soul = 0;
      if ((p.trash.soul || 0) > 0) p.trash.soul = 0;
      for (const s of p.field) {
        if ((s.cores.soul || 0) > 0) s.cores.soul = 0;
      }

      if (toZone === 'life') {
        p.life += 1;
        p.soulCoreInLife = true;
      } else if (toZone === 'trash') {
        p.trash.soul = 1;
      } else if (toZone === 'reserve') {
        p.reserve.soul = 1;
      } else if (targetStack) {
        targetStack.cores.soul = 1;
      } else {
        p.reserve.soul = 1;
      }
      return { success: true, to: toZone, stackId: targetStack ? (targetStack.id || targetStack.stackId) : null };
    }

    case 'REFRESH_BY_EXHAUSTING_NEXUS': {
      const p = state.players[controller];
      const targetStack = sourceStack || p.field.find(s => s.exhausted && !(s.top.type || '').toLowerCase().includes('nexus')) || null;
      const readyNexus = p.field.find(s => !s.exhausted && (s.top.type || '').toLowerCase().includes('nexus'));
      if (!readyNexus || !targetStack) {
        return { success: false, reason: 'NO_READY_NEXUS_OR_TARGET' };
      }
      readyNexus.exhausted = true;
      targetStack.exhausted = false;
      return { success: true, exhaustedNexusId: readyNexus.id || readyNexus.stackId, refreshedStackId: targetStack.id || targetStack.stackId };
    }

    case 'REMAIN_ON_FIELD_EXHAUSTED':
    case 'REMAIN_ON_FIELD':
    case 'RESURRECT': {
      const p = state.players[controller];
      const targetStack = sourceStack || (op.targetStackId ? p.field.find(s => (s.id || s.stackId) === op.targetStackId) : p.field[0]) || null;
      if (targetStack) {
        if (op.op === 'REMAIN_ON_FIELD_EXHAUSTED' || op.state === 'EXHAUSTED' || op.exhaust !== false) {
          targetStack.exhausted = true;
        } else {
          targetStack.exhausted = false;
        }
        state.modifiers.push({
          id: `mod_${Date.now()}_remain_${Math.random().toString(36).substr(2, 5)}`,
          type: 'PROTECTION',
          side: controller,
          targetStackId: targetStack.id || targetStack.stackId,
          remainState: targetStack.exhausted ? 'EXHAUSTED' : 'READY',
          duration: op.duration || 'THIS_STEP',
          sourceCardId: sourceCard ? sourceCard.id : null
        });
        return { success: true, stackId: targetStack.id || targetStack.stackId, exhausted: targetStack.exhausted };
      }
      // If card is in grave and RESURRECT is called
      if (op.op === 'RESURRECT' && p.grave.length > 0) {
        const card = op.cardId ? p.grave.find(c => c.id === op.cardId) || p.grave[p.grave.length - 1] : p.grave[p.grave.length - 1];
        const res = await moveCard(state, card, 'field', controller, { cause: 'effect', by: controller }, events);
        if (res) {
          const newStack = p.field.find(st => st.top.id === card.id);
          if (newStack) {
            newStack.cores.normal = Math.max(1, newStack.cores.normal || 0);
            return { success: true, stack: newStack };
          }
        }
      }
      return { success: false, reason: 'NO_TARGET_FOR_REMAIN' };
    }

    case 'BANISH':
    case 'BANISH_TRASH':
    case 'BANISH_DECK':
    case 'BANISH_HAND':
    case 'REMOVE_FROM_GAME':
    case 'REMOVED_ZONE_ACTION':
    case 'DISCARD_REMOVED': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const p = state.players[targetSide];
      if (!Array.isArray(p.removed)) p.removed = [];
      const count = typeof op.count === 'number' ? op.count : 1;
      const banished = [];

      const zoneName = op.op === 'BANISH_TRASH' ? 'grave'
        : op.op === 'BANISH_DECK' ? 'deck'
        : op.op === 'BANISH_HAND' ? 'hand'
        : (op.from || 'grave').toLowerCase();

      const sourceArr = zoneName === 'deck' ? p.deck
        : zoneName === 'hand' ? p.hand
        : p.grave;

      for (let i = 0; i < count; i++) {
        const idx = op.filter ? sourceArr.findIndex(c => matchesCardFilter(c, op.filter)) : (sourceArr.length > 0 ? 0 : -1);
        if (idx === -1) break;
        const [removedCard] = sourceArr.splice(idx, 1);
        p.removed.push(removedCard);
        banished.push(removedCard);
      }
      return { success: true, banishedCount: banished.length, banished };
    }

    case 'DISCARD_REMAINING':
    case 'DISCARD':
    case 'DISCARD_CARD':
    case 'DISCARD_COST': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      if (op.op === 'DISCARD_REMAINING' && Array.isArray(context.revealedCards) && context.revealedCards.length > 0) {
        const remaining = [...context.revealedCards];
        for (const c of remaining) {
          const rIdx = p.open ? p.open.findIndex(x => x.id === c.id) : -1;
          if (rIdx !== -1) p.open.splice(rIdx, 1);
          p.grave.push(c);
        }
        context.revealedCards = [];
        return { success: true, discardedCount: remaining.length };
      }
      const count = typeof op.count === 'number' ? op.count : 1;
      const discarded = [];
      for (let i = 0; i < count; i++) {
        if (p.hand.length === 0) break;
        const idx = op.filter ? p.hand.findIndex(c => matchesCardFilter(c, op.filter)) : 0;
        if (idx === -1) break;
        const [c] = p.hand.splice(idx, 1);
        p.grave.push(c);
        discarded.push(c);
      }
      return { success: discarded.length > 0, discardedCount: discarded.length, discarded };
    }

    case 'EXTRA_TURN': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const count = typeof op.count === 'number' ? op.count : 1;
      p.extraTurns = (p.extraTurns || 0) + count;
      return { success: true, extraTurns: p.extraTurns };
    }

    case 'END_TURN':
    case 'END_ATTACK_STEP':
    case 'END_MAIN_STEP':
    case 'SKIP_STEP':
    case 'STEP_MODIFIER': {
      if (op.op === 'END_ATTACK_STEP') {
        const cantEnd = state.modifiers.some(m =>
          (m.type === 'SET_RESTRICTION' || m.type === 'COMBAT_RESTRICTION' || m.type === 'STEP_MODIFIER') &&
          (m.restriction === 'CANNOT_END_ATTACK_STEP' || m.rule === 'CANNOT_END_ATTACK_STEP')
        );
        if (cantEnd) {
          return { success: false, reason: 'CANNOT_END_ATTACK_STEP_RESTRICTED' };
        }
        state.combat = null;
        state.step = 'END';
        return { success: true, step: state.step };
      }
      if (op.op === 'END_MAIN_STEP') {
        state.step = 'ATTACK';
        return { success: true, step: state.step };
      }
      if (op.op === 'END_TURN') {
        state.combat = null;
        state.step = 'END';
        return { success: true, step: state.step };
      }
      const mod = {
        id: `mod_${Date.now()}_step_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: op.side === 'opponent' ? oppSide : controller,
        step: op.step || null,
        restriction: op.restriction || op.rule || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'COMPARE_BP':
    case 'COMPARE_LEVELS':
    case 'COMPARE_LV_INSTEAD_OF_BP':
    case 'BP_OR_LEVEL_MODIFIER':
    case 'SET_BP':
    case 'SET_LEVEL': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const opp = state.players[targetSide === 'player' ? 'opponent' : 'player'];
      if (op.op === 'COMPARE_BP' && sourceStack && opp.field.length > 0) {
        const targetOpp = op.targetStackId ? opp.field.find(s => (s.id || s.stackId) === op.targetStackId) : opp.field[0];
        if (targetOpp) {
          const myLv = computeLevel(sourceStack, state);
          const oppLv = computeLevel(targetOpp, state);
          const myBp = (sourceStack.top.levels && sourceStack.top.levels[myLv]) ? sourceStack.top.levels[myLv].bp : (sourceStack.top.bp || 5000);
          const oppBp = (targetOpp.top.levels && targetOpp.top.levels[oppLv]) ? targetOpp.top.levels[oppLv].bp : (targetOpp.top.bp || 3000);
          if (myBp >= oppBp) {
            const oppOwner = targetSide === 'player' ? 'opponent' : 'player';
            await moveCard(state, targetOpp.top, 'grave', oppOwner, { cause: 'destroy', by: controller }, events);
            return { success: true, winner: controller, destroyedStackId: targetOpp.id || targetOpp.stackId };
          }
          return { success: true, winner: oppSide, destroyedStackId: null };
        }
      }
      const mod = {
        id: `mod_${Date.now()}_bp_lv_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op === 'SET_LEVEL' ? 'MODIFY_LEVEL' : op.op,
        side: targetSide,
        targetStackId: op.targetStackId || (sourceStack ? (sourceStack.id || sourceStack.stackId) : null),
        value: typeof op.value === 'number' ? op.value : (typeof op.amount === 'number' ? op.amount : 1),
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'MODIFY_LIFE':
    case 'PAY_LIFE':
    case 'LIFE_PAY_COST':
    case 'REDUCE_LIFE':
    case 'BOOST_LIFE':
    case 'DAMAGE_CAP':
    case 'PREVENT_LOSS': {
      const targetSide = op.side === 'opponent' ? oppSide : controller;
      const p = state.players[targetSide];
      const count = typeof op.count === 'number' ? op.count : (typeof op.amount === 'number' ? Math.abs(op.amount) : 1);
      if (op.op === 'PAY_LIFE' || op.op === 'LIFE_PAY_COST') {
        if (p.life < count) return { success: false, reason: 'INSUFFICIENT_LIFE' };
        p.life -= count;
        if ((op.to || 'void').toLowerCase() === 'reserve') p.reserve.normal += count;
        return { success: true, life: p.life };
      }
      if (op.op === 'REDUCE_LIFE') {
        const res = moveCore(state, targetSide, 'life', op.to || 'reserve', count, 'normal', { cause: 'EFFECT_DAMAGE', sourceCard });
        return { success: res.success, life: p.life };
      }
      if (op.op === 'BOOST_LIFE' || (op.op === 'MODIFY_LIFE' && (op.amount || 1) > 0)) {
        p.life += count;
        return { success: true, life: p.life };
      }
      const mod = {
        id: `mod_${Date.now()}_life_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op,
        side: targetSide,
        maxDamage: op.maxDamage || op.cap || 1,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'CONTINUOUS_RULE':
    case 'CARD_RULE_MODIFIER':
    case 'RULE_OR_TEXT_MODIFIER':
    case 'RESTRICTION':
    case 'OPPONENT_RESTRICTION':
    case 'MAGIC_RESTRICTION':
    case 'PLAY_CONDITION': {
      const targetSide = (op.op === 'OPPONENT_RESTRICTION' || op.side === 'opponent') ? oppSide : controller;
      const mod = {
        id: `mod_${Date.now()}_rule_${Math.random().toString(36).substr(2, 5)}`,
        type: op.op === 'OPPONENT_RESTRICTION' || op.op === 'RESTRICTION' ? 'SET_RESTRICTION' : op.op,
        side: targetSide,
        restriction: op.restriction || op.rule || 'CUSTOM_RULE',
        targetFilter: op.filter || null,
        duration: op.duration || 'THIS_TURN',
        sourceCardId: sourceCard ? sourceCard.id : null
      };
      state.modifiers.push(mod);
      return { success: true, modifier: mod };
    }

    case 'TARGET_CARD':
    case 'TARGET':
    case 'TARGET_SELECT':
    case 'TARGET_CARDS':
    case 'CHOOSE_TARGETS': {
      const targetSide = op.side === 'self' ? controller : oppSide;
      const p = state.players[targetSide];
      const candidates = p.field.filter(s => op.filter ? matchesCardFilter(s.top, op.filter) : true);
      const count = typeof op.count === 'number' ? op.count : 1;
      const selected = candidates.slice(0, count);
      context.selectedTargets = selected;
      return { success: true, selectedTargets: selected };
    }

    default:
      return { success: false, reason: 'UNHANDLED_OPERATION', unhandledOp: op.op };
  }
}
