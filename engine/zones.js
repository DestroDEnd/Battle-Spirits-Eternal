/**
 * engine/zones.js
 * 
 * Strict zone movement mechanics for cards and cores.
 * Every movement validates rules, preserves stack integrity, and emits events with causes.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { computeLevel } from './continuous.js';

export async function stageStackStandby(state, stack, standbyType, options = {}, events = null) {
  if (!stack || !stack.top) return false;

  const currentLevel = computeLevel(stack);
  const by = options.by || 'self';
  const cause = options.cause || standbyType;

  stack.standby = {
    type: standbyType, // 'destruction' | 'depletion' | 'bounce' | 'banish' | 'removed'
    previousLevel: options.previousLevel || currentLevel,
    by,
    cause,
    sourceCard: options.sourceCard || null,
    destZone: options.destZone || (standbyType === 'bounce' ? 'hand' : standbyType === 'banish' ? 'removed' : 'grave'),
    destSide: options.destSide || stack.owner
  };

  if (events) {
    await events.emit({
      type: 'STACK_ENTERED_STANDBY',
      stack,
      card: stack.top,
      standby: stack.standby
    });
  }

  return true;
}

export async function commitStackExit(state, stack, toZone = null, options = {}, events = null) {
  if (!stack || !stack.top) return false;

  const side = stack.owner;
  const p = state.players[side];
  const standby = stack.standby || {};
  const by = options.by || standby.by || 'self';
  const cause = options.cause || standby.cause || 'rule';
  const targetZone = toZone || standby.destZone || 'grave';
  const targetSide = options.toSide || standby.destSide || side;
  const targetPlayer = state.players[targetSide];

  // Contract Card Soul State Check (Eternal Format rule):
  // When leaving the field due to opponent, and NOT depleted by self:
  const isContract = Boolean(stack.top.isContractPartner || stack.top.type === 'Contract Nexus');
  const oppSide = side === 'player' ? 'opponent' : 'player';
  const opponentRemoved = by === oppSide || by === 'opponent';
  const isDepletionBySelf = standby.type === 'depletion' && (by === side || by === 'self');

  if (isContract && opponentRemoved && !isDepletionBySelf && !options.forceGrave) {
    // Normal cores return to reserve; 1 Soul Core stays on the card in Soul State
    const hasSoul = stack.cores.soul > 0;
    p.reserve.normal += stack.cores.normal;
    stack.cores.normal = 0;

    if (!hasSoul && p.reserve.soul > 0) {
      p.reserve.soul -= 1;
      stack.cores.soul = 1;
    }

    stack.isSoulState = true;
    stack.standby = null;
    stack.state = 'EXHAUSTED';

    if (events) {
      await events.emit({
        type: 'CONTRACT_ENTERED_SOUL_STATE',
        card: stack.top,
        player: side,
        cause,
        by
      });
    }
    return true;
  }

  // Physical exit from field:
  // 1. Cores return to reserve
  p.reserve.normal += stack.cores.normal;
  p.reserve.soul += stack.cores.soul;
  stack.cores = { normal: 0, soul: 0 };

  // 2. Under cards and braves go to grave
  for (const underCard of stack.under || []) {
    p.grave.push(underCard);
  }
  for (const braveCard of stack.braves || []) {
    p.grave.push(braveCard);
  }

  // 3. Remove stack from field
  p.field = p.field.filter(st => st.id !== stack.id);

  // 4. Place top card into target zone
  const topCard = stack.top;
  topCard.currentOwner = targetSide;

  if (targetZone === 'grave') {
    targetPlayer.grave.push(topCard);
  } else if (targetZone === 'hand') {
    targetPlayer.hand.push(topCard);
  } else if (targetZone === 'removed') {
    targetPlayer.removed.push(topCard);
  } else if (targetZone === 'deck_top') {
    targetPlayer.deck.unshift(topCard);
  } else if (targetZone === 'deck' || targetZone === 'deck_bottom') {
    targetPlayer.deck.push(topCard);
  }

  // 5. Emit movement and destruction events
  if (events) {
    await events.emit({
      type: 'CARD_MOVED',
      card: topCard,
      fromZone: 'field',
      fromSide: side,
      toZone: targetZone,
      toSide: targetSide,
      cause,
      by,
      sourceCard: options.sourceCard || standby.sourceCard || null
    });

    if (targetZone === 'grave' && (cause === 'destroy' || cause === 'battle' || standby.type === 'destruction')) {
      await events.emit({
        type: 'DESTROYED',
        card: topCard,
        fromZone: 'field',
        fromSide: side,
        cause,
        by,
        sourceCard: options.sourceCard || standby.sourceCard || null
      });
    }
  }

  return true;
}

export async function flushStandbyStacks(state, events = null) {
  let flushedCount = 0;
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    const stacksWithStandby = (p.field || []).filter(st => st.standby !== null && st.standby !== undefined);
    for (const stack of stacksWithStandby) {
      await commitStackExit(state, stack, null, {}, events);
      flushedCount++;
    }
  }
  return flushedCount;
}

export async function moveCard(state, card, toZone, toSide = null, options = {}, events = null) {
  if (!card) return false;
  const side = toSide || card.owner;
  const cause = options.cause || 'rule';
  const by = options.by || 'self';

  // 1. Locate card in current zones
  let fromZone = null;
  let fromSide = null;
  let fromStack = null;

  for (const s of ['player', 'opponent']) {
    const p = state.players[s];
    if (p.hand.some(c => c.id === card.id)) { fromZone = 'hand'; fromSide = s; break; }
    if (p.deck.some(c => c.id === card.id)) { fromZone = 'deck'; fromSide = s; break; }
    if (p.grave.some(c => c.id === card.id)) { fromZone = 'grave'; fromSide = s; break; }
    if (p.removed.some(c => c.id === card.id)) { fromZone = 'removed'; fromSide = s; break; }
    if (p.burst && p.burst.id === card.id) { fromZone = 'burst'; fromSide = s; break; }
    if (p.mirage && p.mirage.id === card.id) { fromZone = 'mirage'; fromSide = s; break; }
    
    // Check field stacks
    const stack = p.field.find(st => st.top.id === card.id || st.under.some(c => c.id === card.id) || st.braves.some(b => b.id === card.id));
    if (stack) {
      fromZone = 'field';
      fromSide = s;
      fromStack = stack;
      break;
    }
  }

  // 2. Remove card from its current zone
  if (fromZone && fromSide) {
    const p = state.players[fromSide];
    if (fromZone === 'hand') p.hand = p.hand.filter(c => c.id !== card.id);
    else if (fromZone === 'deck') p.deck = p.deck.filter(c => c.id !== card.id);
    else if (fromZone === 'grave') p.grave = p.grave.filter(c => c.id !== card.id);
    else if (fromZone === 'removed') p.removed = p.removed.filter(c => c.id !== card.id);
    else if (fromZone === 'burst') p.burst = null;
    else if (fromZone === 'mirage') p.mirage = null;
    else if (fromZone === 'field' && fromStack) {
      // If the top card leaves field, check PROTECTION modifiers before dismantling stack
      if (fromStack.top.id === card.id) {
        const cause = options.cause || 'rule';
        const isProtected = (state.modifiers || []).some(m => {
          if (m.type !== 'PROTECTION') return false;
          if (m.targetStackId && m.targetStackId !== fromStack.id) return false;
          if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
          if ((cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) && m.cannotBeDestroyed !== false) return true;
          if ((cause === 'bounce' || ((toZone === 'hand' || toZone === 'deck' || toZone === 'deck_bottom' || toZone === 'deck_top') && cause === 'effect')) && m.cannotBeBounced) return true;
          if ((cause === 'depletion' || cause === 'deplete') && m.cannotBeDepleted) return true;
          return false;
        });
        if (isProtected) {
          return false;
        }

        // Return cores on the stack to reserve
        const returnCores = { ...fromStack.cores };
        p.reserve.normal += returnCores.normal;
        p.reserve.soul += returnCores.soul;
        fromStack.cores = { normal: 0, soul: 0 };

        // Pre-advent cards and braves go to grave
        for (const underCard of fromStack.under) {
          p.grave.push(underCard);
        }
        for (const braveCard of fromStack.braves) {
          p.grave.push(braveCard);
        }

        // Remove stack from field
        p.field = p.field.filter(st => st.id !== fromStack.id);
      } else {
        // Sub-card leaving stack (e.g. Discard pre-advent or unbrave)
        fromStack.under = fromStack.under.filter(c => c.id !== card.id);
        fromStack.braves = fromStack.braves.filter(b => b.id !== card.id);
      }
    }
  }

  // 3. Place card into target zone
  const targetPlayer = state.players[side];
  card.currentOwner = side;

  if (toZone === 'hand') {
    targetPlayer.hand.push(card);
  } else if (toZone === 'grave') {
    targetPlayer.grave.push(card);
  } else if (toZone === 'removed') {
    targetPlayer.removed.push(card);
  } else if (toZone === 'deck_top') {
    targetPlayer.deck.unshift(card);
  } else if (toZone === 'deck_bottom' || toZone === 'deck') {
    targetPlayer.deck.push(card);
  } else if (toZone === 'burst') {
    // If a burst already exists, replace it to grave (Eternal Rule 3.5)
    if (targetPlayer.burst) {
      targetPlayer.grave.push(targetPlayer.burst);
    }
    targetPlayer.burst = card;
    targetPlayer.burstSetThisTurn = true;
  } else if (toZone === 'mirage') {
    if (targetPlayer.mirage) {
      targetPlayer.grave.push(targetPlayer.mirage);
    }
    targetPlayer.mirage = card;
    targetPlayer.mirageSetThisTurn = true;
  }

  // 4. Emit movement and destruction events
  if (events) {
    await events.emit({
      type: 'CARD_MOVED',
      card,
      fromZone,
      fromSide,
      toZone,
      toSide: side,
      cause,
      by,
      sourceCard: options.sourceCard || null
    });

    if (toZone === 'grave' && (cause === 'destroy' || cause === 'battle')) {
      await events.emit({
        type: 'DESTROYED',
        card,
        fromZone,
        fromSide,
        cause,
        by,
        sourceCard: options.sourceCard || null
      });
    }
  }

  return true;
}

export async function moveCore(state, count, from, to, options = {}, events = null) {
  if (count <= 0) return true;
  const isSoul = Boolean(options.isSoulCore);
  const cause = options.cause || 'rule';
  const by = options.by || 'self';

  const fromSide = from.side || 'player';
  const toSide = to.side || 'player';
  const fromZone = from.zone; // 'reserve', 'trash', 'field', 'void', 'life'
  const toZone = to.zone;

  const fromPlayer = state.players[fromSide];
  const toPlayer = state.players[toSide];

  // Eternal Rule: Soul Core restrictions
  if (isSoul && toZone === 'void' && by === 'opp') {
    console.warn('[Engine] Illegal action: Opponent cannot send Soul Core to Void.');
    return false;
  }
  if (isSoul && toZone === 'life' && !options.allowSeal) {
    console.warn('[Engine] Illegal action: Soul Core cannot enter Life except via Seal effect.');
    return false;
  }

  // 1. Deduct cores from source zone
  if (fromZone === 'reserve') {
    if (isSoul) {
      if (fromPlayer.reserve.soul < 1) return false;
      fromPlayer.reserve.soul -= 1;
    } else {
      if (fromPlayer.reserve.normal < count) return false;
      fromPlayer.reserve.normal -= count;
    }
  } else if (fromZone === 'trash') {
    if (isSoul) {
      if (fromPlayer.trash.soul < 1) return false;
      fromPlayer.trash.soul -= 1;
    } else {
      if (fromPlayer.trash.normal < count) return false;
      fromPlayer.trash.normal -= count;
    }
  } else if (fromZone === 'life') {
    const hasLifeLossPrevented = (state.modifiers || []).some(m =>
      (m.type === 'PREVENT_LIFE_LOSS' || m.type === 'PREVENT_DAMAGE') && (m.side === fromSide || m.side === 'both' || !m.side)
    );
    if (hasLifeLossPrevented && cause !== 'cost' && cause !== 'rule') {
      return false;
    }
    const actual = Math.min(count, fromPlayer.life);
    fromPlayer.life -= actual;
  } else if (fromZone === 'field') {
    const stack = fromPlayer.field.find(st => st.id === from.stackId);
    if (!stack) return false;
    stack.lastActiveLevel = computeLevel(stack);
    if (isSoul) {
      if (stack.cores.soul < 1) return false;
      stack.cores.soul -= 1;
    } else {
      if (stack.cores.normal < count) return false;
      stack.cores.normal -= count;
    }
  }
  // 'void' requires no deduction

  // 2. Add cores to target zone
  if (toZone === 'reserve') {
    if (isSoul) toPlayer.reserve.soul += 1;
    else toPlayer.reserve.normal += count;
  } else if (toZone === 'trash') {
    if (isSoul) toPlayer.trash.soul += 1;
    else toPlayer.trash.normal += count;
  } else if (toZone === 'life') {
    toPlayer.life += count;
  } else if (toZone === 'field') {
    const stack = toPlayer.field.find(st => st.id === to.stackId);
    if (!stack) return false;
    if (isSoul) stack.cores.soul += 1;
    else stack.cores.normal += count;
  }
  // 'void' requires no addition

  // 3. Emit core movement events
  if (events) {
    await events.emit({
      type: 'CORE_MOVED',
      count,
      isSoulCore: isSoul,
      fromZone,
      fromSide,
      toZone,
      toSide,
      cause,
      by,
      sourceCard: options.sourceCard || null
    });

    if (fromZone === 'life') {
      await events.emit({
        type: 'LIFE_REDUCED',
        player: fromSide,
        damage: count,
        currentLife: fromPlayer.life,
        by,
        cause
      });
    }

    if (toZone === 'life') {
      await events.emit({
        type: 'LIFE_RECOVERED',
        player: toSide,
        recovered: count,
        currentLife: toPlayer.life,
        cause
      });
    }
  }

  return true;
}
