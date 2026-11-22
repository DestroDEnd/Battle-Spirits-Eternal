/**
 * engine/zones.js
 * 
 * Strict zone movement mechanics for cards and cores.
 * Every movement validates rules, preserves stack integrity, and emits events with causes.
 */

import { ETERNAL_RULES } from './rules/eternal.js';
import { createFieldStack } from './state.js';
import { computeLevel, matchesTargetFilter, isActionRestricted, isTargetProtectedFrom, computeEffectiveBP } from './continuous.js';

function sideMatches(modSide, targetSide) {
  if (!modSide || modSide === 'both') return true;
  if (modSide === targetSide) return true;
  if ((modSide === 'opp' || modSide === 'opponent') && (targetSide === 'opp' || targetSide === 'opponent')) return true;
  if ((modSide === 'player' || modSide === 'self') && (targetSide === 'player' || targetSide === 'self')) return true;
  return false;
}

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
    destSide: options.destSide || stack.originalOwner || stack.top?.owner || stack.owner
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
  // 1. Cores return to reserve or replacement destination (e.g. TheEnd-Dragonis)
  const isDestruction = cause === 'destroy' || cause === 'battle' || standby.type === 'destruction';
  let coresRedirected = false;

  // K1-BATCH-05: Check REMAIN_ON_FIELD / PREVENT_DESTRUCTION replacement before stack leaves field
  if (isDestruction && !options._replacementApplied && !options.unpreventable) {
    const remainMod = (state.modifiers || []).find(m =>
      (m.type === 'REPLACEMENT_EFFECT' || m.type === 'PREVENT_DESTRUCTION') &&
      (m.replaces === 'DESTRUCTION' || m.replaces === 'LEAVE_FIELD') &&
      (m.replacementZone === 'field' || m.remainOnField) &&
      (!m.targetStackId || m.targetStackId === stack.id) &&
      (!m.side || sideMatches(m.side, side))
    );
    if (remainMod) {
      options._replacementApplied = true;
      stack.standby = null;
      if (remainMod.remainExhausted) stack.state = 'EXHAUSTED';
      else if (remainMod.remainRefreshed) stack.state = 'REFRESHED';
      if (events) {
        await events.emit({
          type: 'REPLACEMENT_EFFECT_APPLIED',
          target: 'CARD',
          card: stack.top,
          originalDestination: targetZone,
          replacedDestination: 'field',
          cause,
          player: side
        });
      }
      return false; // Stays on field!
    }
  }

  // K1-BATCH-05: capture BP at the moment of destruction (before cores leave the stack)
  // only when a zero-BP-gated replacement is active (keeps the modifier-free fast path).
  const needsBpAtExit = isDestruction && Array.isArray(state.modifiers) && state.modifiers.length > 0 &&
    state.modifiers.some(m => m && m.filter && m.filter.zeroBp);
  const bpAtExit = needsBpAtExit
    ? (typeof options.bpAtDestroy === 'number' ? options.bpAtDestroy
      : (typeof standby.previousBp === 'number' ? standby.previousBp : computeEffectiveBP(state, stack)))
    : null;

  if (isDestruction && !options._coreReplacementApplied) {
    const spiritCoreReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT') return false;
      if (m.replaces !== 'DESTROYED_SPIRIT_CORES') return false;
      if (m.side && !sideMatches(m.side, side)) return false;
      return true;
    });

    if (spiritCoreReplacements.length > 0) {
      const rep = spiritCoreReplacements[0];
      const destStack = p.field.find(st => st.id === rep.targetStackId || (rep.sourceCard && st.top.id === rep.sourceCard.id));
      if (destStack) {
        coresRedirected = true;
        options._coreReplacementApplied = true;
        destStack.cores.normal += stack.cores.normal;
        destStack.cores.soul += stack.cores.soul;
        stack.cores = { normal: 0, soul: 0 };

        if (events) {
          await events.emit({
            type: 'REPLACEMENT_EFFECT_APPLIED',
            target: 'CORE',
            originalDestination: 'reserve',
            replacedDestination: 'field',
            targetStackId: destStack.id,
            player: side,
            sourceCard: rep.sourceCard || null
          });
        }
      }
    }
  }

  if (!coresRedirected) {
    p.reserve.normal += stack.cores.normal;
    p.reserve.soul += stack.cores.soul;
    stack.cores = { normal: 0, soul: 0 };
  }

  // 2. Under cards go to grave
  for (const underCard of stack.under || []) {
    p.grave.push(underCard);
  }

  // 2.5 Brave handling (E1: De-braving & Brave separation):
  for (const braveCard of stack.braves || []) {
    const shouldRetain = options.retainBraves === true ||
      (Array.isArray(options.retainBraveIds) && options.retainBraveIds.includes(braveCard.id)) ||
      (options.debraveAllocations && typeof options.debraveAllocations[braveCard.id] === 'number');

    const allocatedCores = (options.debraveAllocations && typeof options.debraveAllocations[braveCard.id] === 'number')
      ? options.debraveAllocations[braveCard.id]
      : 1;

    if (shouldRetain && p.reserve.normal >= allocatedCores && allocatedCores >= 1) {
      p.reserve.normal -= allocatedCores;
      const braveStack = createFieldStack(braveCard, { normal: allocatedCores, soul: 0 });
      braveStack.owner = stack.owner;
      braveStack.state = stack.state;
      p.field.push(braveStack);
      if (events) {
        await events.emit({
          type: 'BRAVE_SEPARATED',
          braveCard,
          hostCard: stack.top,
          player: side,
          braveStackId: braveStack.id,
          coresAllocated: allocatedCores
        });
      }
    } else {
      p.grave.push(braveCard);
    }
  }

  // 3. Remove stack from field
  p.field = p.field.filter(st => st.id !== stack.id);

  // 3.5. Evaluate REPLACEMENT_EFFECT before placing top card
  let effectiveTargetZone = targetZone;
  const topCard = stack.top;
  topCard.currentOwner = targetSide;

  if (targetZone === 'grave' && (isDestruction || cause === 'deplete') && !options._replacementApplied && !options.unpreventable) {
    const applicableReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT' && m.type !== 'MODIFY_DESTINATION' && m.type !== 'BANISH_DESTINATION_RULE') return false;
      if (m.replaces) {
        if (m.replaces === 'NEXUS_DESTRUCTION') {
          if (!String(topCard.type || '').toLowerCase().includes('nexus')) return false;
        } else if (m.replaces === 'DEPLETED_CARD' || m.replaces === 'DEPLETED_OR_DESTROYED' || m.replaces === 'DESTROYED_OR_DEPLETED') {
          if (cause !== 'deplete' && !isDestruction) return false;
        } else if (m.replaces === 'DESTRUCTION') {
          if (!isDestruction) return false;
        } else {
          return false;
        }
      } else if (m.type === 'REPLACEMENT_EFFECT' && !isDestruction) {
        return false;
      }
      if (m.side && !sideMatches(m.side, side)) return false;
      if (m.filter) {
        if (m.filter.family) {
          const fams = Array.isArray(topCard.families) ? topCard.families : (topCard.family ? [topCard.family] : []);
          if (!fams.some(f => f && f.toLowerCase().includes(m.filter.family.toLowerCase()))) return false;
        }
        if (m.filter.type && String(topCard.type).toLowerCase() !== String(m.filter.type).toLowerCase()) return false;
        if (m.filter.name && !String(topCard.name || '').toLowerCase().includes(String(m.filter.name).toLowerCase())) return false;
        const maxCost = m.filter.maxCost ?? m.filter.costLte;
        if (typeof maxCost === 'number' && (typeof topCard.cost !== 'number' || topCard.cost > maxCost)) return false;
        if (m.filter.zeroBp && !(typeof bpAtExit === 'number' && bpAtExit <= 0)) return false;
      }
      return true;
    });

    if (applicableReplacements.length > 0) {
      const rep = applicableReplacements[0];
      effectiveTargetZone = rep.destination || rep.replacementZone || 'hand';
      options._replacementApplied = true;

      if (events) {
        await events.emit({
          type: 'REPLACEMENT_EFFECT_APPLIED',
          target: 'CARD',
          card: topCard,
          originalDestination: targetZone,
          replacedDestination: effectiveTargetZone,
          cause,
          sourceCard: rep.sourceCard || null,
          player: side
        });
      }
    }
  }

  // 4. Place top card into effective target zone
  if (effectiveTargetZone === 'grave') {
    targetPlayer.grave.push(topCard);
  } else if (effectiveTargetZone === 'hand') {
    targetPlayer.hand.push(topCard);
  } else if (effectiveTargetZone === 'removed' || effectiveTargetZone === 'banished') {
    targetPlayer.removed.push(topCard);
  } else if (effectiveTargetZone === 'deck_top') {
    targetPlayer.deck.unshift(topCard);
  } else if (effectiveTargetZone === 'deck' || effectiveTargetZone === 'deck_bottom') {
    targetPlayer.deck.push(topCard);
  } else if (effectiveTargetZone === 'field' || effectiveTargetZone === 'nexus') {
    if (!Array.isArray(targetPlayer.nexus)) targetPlayer.nexus = [];
    targetPlayer.nexus.push(topCard);
  }

  // 5. Emit movement and destruction events
  if (events) {
    await events.emit({
      type: 'CARD_MOVED',
      card: topCard,
      fromZone: 'field',
      fromSide: side,
      toZone: effectiveTargetZone,
      toSide: targetSide,
      cause,
      by,
      sourceCard: options.sourceCard || standby.sourceCard || null
    });

    if (effectiveTargetZone === 'grave' && isDestruction) {
      await events.emit({
        type: 'DESTROYED',
        card: topCard,
        level: standby.previousLevel || null,
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

  // 1. Locate card in current zones (fast-path when caller already resolved field stack)
  let fromZone = null;
  let fromSide = null;
  let fromStack = null;

  if (options.knownFromZone === 'field' && options.knownFromSide && options.knownFromStack && options.knownFromStack.top?.id === card.id) {
    fromZone = 'field';
    fromSide = options.knownFromSide;
    fromStack = options.knownFromStack;
  } else for (const s of ['player', 'opponent']) {
    const p = state.players[s];
    if (Array.isArray(p.hand) && p.hand.some(c => c.id === card.id)) { fromZone = 'hand'; fromSide = s; break; }
    if (Array.isArray(p.deck) && p.deck.some(c => c.id === card.id)) { fromZone = 'deck'; fromSide = s; break; }
    if (Array.isArray(p.grave) && p.grave.some(c => c.id === card.id)) { fromZone = 'grave'; fromSide = s; break; }
    if (Array.isArray(p.removed) && p.removed.some(c => c.id === card.id)) { fromZone = 'removed'; fromSide = s; break; }
    if (p.burst && p.burst.id === card.id) { fromZone = 'burst'; fromSide = s; break; }
    if (p.mirage && p.mirage.id === card.id) { fromZone = 'mirage'; fromSide = s; break; }
    if (Array.isArray(p.nexus) && p.nexus.some(c => c && c.id === card.id)) { fromZone = 'nexus'; fromSide = s; break; }
    
    // Check field stacks
    const stack = (p.field || []).find(st => st.top && (st.top.id === card.id || (st.under && st.under.some(c => c.id === card.id)) || (st.braves && st.braves.some(b => b.id === card.id))));
    if (stack) {
      fromZone = 'field';
      fromSide = s;
      fromStack = stack;
      break;
    }
  }

  const fromLevel = fromStack ? computeLevel(fromStack, state) : null;

  // 2. Remove card from its current zone
  if (fromZone && fromSide) {
    const p = state.players[fromSide];
    if (fromZone === 'hand') p.hand = p.hand.filter(c => c.id !== card.id);
    else if (fromZone === 'deck') p.deck = p.deck.filter(c => c.id !== card.id);
    else if (fromZone === 'grave') p.grave = p.grave.filter(c => c.id !== card.id);
    else if (fromZone === 'removed') {
      p.removed = p.removed.filter(c => c.id !== card.id);
      if (Array.isArray(p.openCards)) p.openCards = p.openCards.filter(c => c.id !== card.id);
    }
    else if (fromZone === 'burst') p.burst = null;
    else if (fromZone === 'mirage') p.mirage = null;
    else if (fromZone === 'field' && fromStack) {
      // If the top card leaves field, check PROTECTION / restriction modifiers before dismantling stack
      if (fromStack.top.id === card.id) {
        const cause = options.cause || 'rule';
        const isBounceMove = cause === 'bounce' || ((toZone === 'hand' || toZone === 'deck' || toZone === 'deck_bottom' || toZone === 'deck_top') && cause === 'effect');
        const isDestroyMove = cause === 'destroy' || (toZone === 'grave' && cause === 'effect');
        const moveEffType = isBounceMove ? 'bounce' : (isDestroyMove ? 'destroy' : 'move');
        const isCostMove = cause === 'cost' || cause === 'summon_cost' || cause === 'rule';
        const isCombatOrRuleRemoval = cause === 'destroy' || cause === 'bounce' || cause === 'battle' || cause === 'bp_comparison' || cause === 'depletion' || cause === 'deplete' || isCostMove;
        if (!options.forceMove && !isCombatOrRuleRemoval && isActionRestricted(state, 'CANNOT_BE_MOVED', fromSide, fromStack, {
          cause, by, toZone, isCost: isCostMove, sourceCard: options.sourceCard || null
        })) {
          return false;
        }
        if (!isCostMove && cause !== 'rule' && isTargetProtectedFrom(state, fromStack, moveEffType, options.sourceCard || null, {
          cause, by, fromSide, sourceSide: options.sourceSide || by,
          bypassArmor: cause === 'battle' || cause === 'bp_comparison' || cause === 'depletion' || Boolean(options.bypassArmor),
          skipEffectImmunity: cause === 'battle' || cause === 'bp_comparison' || cause === 'depletion'
        })) {
          return false;
        }
        const hasPiercingDestroy = isDestroyMove && (state.modifiers || []).some(m =>
          m && m.type === 'PIERCING_RULE' && (!m.side || m.side === 'both' || m.side === (options.sourceSide || by))
        );
        let isProtected = hasPiercingDestroy ? false : (state.modifiers || []).some(m => {
          if (m.type === 'PROTECTION') {
            if (m.targetStackId && m.targetStackId !== fromStack.id) return false;
            if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
            if ((cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) && m.cannotBeDestroyed !== false) return true;
            if ((cause === 'bounce' || ((toZone === 'hand' || toZone === 'deck' || toZone === 'deck_bottom' || toZone === 'deck_top') && cause === 'effect')) && m.cannotBeBounced) return true;
            if ((cause === 'depletion' || cause === 'deplete') && m.cannotBeDepleted) return true;
            return false;
          }
          if (m.type === 'INDESTRUCTIBLE') {
            if (m.targetStackId && m.targetStackId !== fromStack.id) return false;
            if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
            if (m.targetFilter && !matchesTargetFilter(m.targetFilter, fromStack, m.sourceStackId ? { id: m.sourceStackId } : null, m.side)) {
              return false;
            }
            const by = Array.isArray(m.by) ? m.by : [m.by || 'ALL'];
            if (cause === 'battle' || cause === 'bp_comparison') {
              return by.includes('BP_COMPARISON') || by.includes('BATTLE') || by.includes('ALL');
            }
            if (cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) {
              if (by.includes('BP_COMPARISON') && !by.includes('ALL') && !by.includes('EFFECTS') && !by.includes('OPPOSING_EFFECTS')) {
                return false;
              }
              if (by.includes('ALL') || by.includes('EFFECTS')) return true;
              const isOpposing = options.by && options.by !== fromSide;
              if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && isOpposing) return true;
            }
            return false;
          }
          return false;
        });

        if (!hasPiercingDestroy && !isProtected && state && state.players) {
          const ctrlPlayer = state.players[fromSide];
          if (ctrlPlayer) {
            const allSources = [
              ...(ctrlPlayer.field || []),
              ...(ctrlPlayer.nexus || []).map(n => ({ top: n, cores: { normal: 1, soul: 0 } }))
            ];
            for (const sourceSt of allSources) {
              if (isProtected) break;
              if (!sourceSt?.top?.compiledIr?.abilities) continue;
              const sLevel = computeLevel(sourceSt, state);
              for (const ab of sourceSt.top.compiledIr.abilities) {
                if (ab.header?.timing !== 'PASSIVE') continue;
                if (ab.header?.levels?.length && !ab.header.levels.includes(sLevel)) continue;
                for (const cl of ab.clauses || []) {
                  if (cl.op?.op !== 'INDESTRUCTIBLE') continue;
                  if (!matchesTargetFilter(cl.op.target, fromStack, sourceSt, fromSide)) continue;
                  const by = Array.isArray(cl.op.by) ? cl.op.by : [cl.op.by || 'ALL'];
                  if (cause === 'battle' || cause === 'bp_comparison') {
                    if (by.includes('BP_COMPARISON') || by.includes('BATTLE') || by.includes('ALL')) {
                      isProtected = true;
                      break;
                    }
                  }
                  if (cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) {
                    if (by.includes('BP_COMPARISON') && !by.includes('ALL') && !by.includes('EFFECTS') && !by.includes('OPPOSING_EFFECTS')) {
                      continue;
                    }
                    if (by.includes('ALL') || by.includes('EFFECTS')) {
                      isProtected = true;
                      break;
                    }
                    const isOpposing = options.by && options.by !== fromSide;
                    if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && isOpposing) {
                      isProtected = true;
                      break;
                    }
                  }
                }
              }
            }
          }
        } else if (!isProtected && fromStack.top?.compiledIr?.abilities) {
          const level = computeLevel(fromStack, state);
          const hasPassiveIndestructible = fromStack.top.compiledIr.abilities.some(ab => {
            if (ab.header?.timing !== 'PASSIVE') return false;
            if (ab.header?.levels?.length && !ab.header.levels.includes(level)) return false;
            return (ab.clauses || []).some(cl => {
              if (cl.op?.op !== 'INDESTRUCTIBLE') return false;
              if (!matchesTargetFilter(cl.op.target, fromStack, fromStack, fromSide)) return false;
              const by = Array.isArray(cl.op.by) ? cl.op.by : [cl.op.by || 'ALL'];
              if (cause === 'battle' || cause === 'bp_comparison') {
                return by.includes('BP_COMPARISON') || by.includes('BATTLE') || by.includes('ALL');
              }
              if (cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) {
                if (by.includes('BP_COMPARISON') && !by.includes('ALL') && !by.includes('EFFECTS') && !by.includes('OPPOSING_EFFECTS')) {
                  return false;
                }
                if (by.includes('ALL') || by.includes('EFFECTS')) return true;
                const isOpposing = options.by && options.by !== fromSide;
                if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && isOpposing) return true;
              }
              return false;
            });
          });
          if (hasPassiveIndestructible) {
            isProtected = true;
          }
        }

        if (isProtected) {
          return false;
        }

        // K1-BATCH-05: Check REMAIN_ON_FIELD / PREVENT_DESTRUCTION replacement before stack leaves field
        if (!options.unpreventable && isDestroyMove && !options._replacementApplied) {
          const remainMod = (state.modifiers || []).find(m =>
            (m.type === 'REPLACEMENT_EFFECT' || m.type === 'PREVENT_DESTRUCTION') &&
            (m.replaces === 'DESTRUCTION' || m.replaces === 'LEAVE_FIELD') &&
            (m.replacementZone === 'field' || m.remainOnField) &&
            (!m.targetStackId || m.targetStackId === fromStack.id) &&
            (!m.side || m.side === 'both' || m.side === fromSide)
          );
          if (remainMod) {
            options._replacementApplied = true;
            if (remainMod.remainExhausted) fromStack.state = 'EXHAUSTED';
            else if (remainMod.remainRefreshed) fromStack.state = 'REFRESHED';
            if (events) {
              await events.emit({
                type: 'REPLACEMENT_EFFECT_APPLIED',
                target: 'CARD',
                card: fromStack.top,
                originalDestination: toZone,
                replacedDestination: 'field',
                cause,
                player: fromSide
              });
            }
            return false;
          }
        }

        // K1-BATCH-05: capture BP at destruction only when a zero-BP-gated replacement is active
        if (isDestroyMove && typeof options.bpAtDestroy !== 'number' && Array.isArray(state.modifiers) &&
            state.modifiers.length > 0 && state.modifiers.some(m => m && m.filter && m.filter.zeroBp)) {
          options.bpAtDestroy = computeEffectiveBP(state, fromStack);
        }

        // Return cores on the stack to reserve
        const returnCores = { ...fromStack.cores };
        p.reserve.normal += returnCores.normal;
        p.reserve.soul += returnCores.soul;
        fromStack.cores = { normal: 0, soul: 0 };

        // Pre-advent cards and braves go to grave
        for (const underCard of (fromStack.under || [])) {
          p.grave.push(underCard);
        }
        for (const braveCard of (fromStack.braves || [])) {
          p.grave.push(braveCard);
        }

        // Remove stack from field
        const fIdx = p.field.indexOf(fromStack);
        if (fIdx !== -1) p.field.splice(fIdx, 1);
      } else {
        // Sub-card leaving stack (e.g. Discard pre-advent or unbrave)
        fromStack.under = fromStack.under.filter(c => c.id !== card.id);
        fromStack.braves = fromStack.braves.filter(b => b.id !== card.id);
      }
    } else if (fromZone === 'nexus') {
      const cause = options.cause || 'rule';
      const isCostMove = cause === 'cost' || cause === 'summon_cost' || cause === 'rule';
      const isCombatOrRuleRemoval = cause === 'destroy' || cause === 'bounce' || cause === 'battle' || cause === 'bp_comparison' || cause === 'depletion' || cause === 'deplete' || isCostMove;
      if (!options.forceMove && !isCombatOrRuleRemoval && isActionRestricted(state, 'CANNOT_BE_MOVED', fromSide, card, {
        cause, by, toZone, isCost: isCostMove, sourceCard: options.sourceCard || null
      })) {
        return false;
      }
      let isProtected = (state.modifiers || []).some(m => {
        if (m.type === 'PROTECTION') {
          if (m.targetCardId && m.targetCardId !== card.id) return false;
          if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
          if ((cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) && m.cannotBeDestroyed !== false) return true;
          if ((cause === 'bounce' || ((toZone === 'hand' || toZone === 'deck' || toZone === 'deck_bottom' || toZone === 'deck_top') && cause === 'effect')) && m.cannotBeBounced) return true;
          return false;
        }
        if (m.type === 'INDESTRUCTIBLE') {
          if (m.targetCardId && m.targetCardId !== card.id) return false;
          if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
          const by = Array.isArray(m.by) ? m.by : [m.by || 'ALL'];
          if (cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) {
            if (by.includes('BP_COMPARISON') && !by.includes('ALL') && !by.includes('EFFECTS') && !by.includes('OPPOSING_EFFECTS')) {
              return false;
            }
            if (by.includes('ALL') || by.includes('EFFECTS')) return true;
            const isOpposing = options.by && options.by !== fromSide;
            if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && isOpposing) return true;
          }
          return false;
        }
        return false;
      });

      if (!isProtected && card.compiledIr?.abilities) {
        const hasPassiveIndestructible = card.compiledIr.abilities.some(ab => {
          if (ab.header?.timing !== 'PASSIVE') return false;
          return (ab.clauses || []).some(cl => {
            if (cl.op?.op !== 'INDESTRUCTIBLE') return false;
            const by = Array.isArray(cl.op.by) ? cl.op.by : [cl.op.by || 'ALL'];
            if (cause === 'destroy' || (toZone === 'grave' && cause === 'effect')) {
              if (by.includes('BP_COMPARISON') && !by.includes('ALL') && !by.includes('EFFECTS') && !by.includes('OPPOSING_EFFECTS')) {
                return false;
              }
              if (by.includes('ALL') || by.includes('EFFECTS')) return true;
              const isOpposing = options.by && options.by !== fromSide;
              if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && isOpposing) return true;
            }
            return false;
          });
        });
        if (hasPassiveIndestructible) {
          isProtected = true;
        }
      }

      if (isProtected) {
        return false;
      }
      // Return any cores on the nexus to reserve
      if (card.cores) {
        if (typeof card.cores === 'number' && card.cores > 0) {
          p.reserve.normal += card.cores;
          card.cores = 0;
        } else if (typeof card.cores === 'object') {
          p.reserve.normal += (card.cores.normal || 0);
          p.reserve.soul += (card.cores.soul || 0);
          card.cores.normal = 0;
          card.cores.soul = 0;
        }
      }
      p.nexus = p.nexus.filter(c => c && c.id !== card.id);
    }
  }

  // 2.5. Check REPLACEMENT_EFFECT before placing card into target zone
  let effectiveToZone = toZone;
  if (toZone === 'grave' && (cause === 'destroy' || cause === 'battle' || cause === 'deplete') && !options._replacementApplied && !options.unpreventable) {
    const applicableReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT' && m.type !== 'MODIFY_DESTINATION' && m.type !== 'BANISH_DESTINATION_RULE') return false;
      if (m.replaces) {
        if (m.replaces === 'NEXUS_DESTRUCTION') {
          if (!String(card.type || '').toLowerCase().includes('nexus')) return false;
        } else if (m.replaces === 'DEPLETED_CARD' || m.replaces === 'DEPLETED_OR_DESTROYED' || m.replaces === 'DESTROYED_OR_DEPLETED') {
          if (cause !== 'deplete' && cause !== 'destroy' && cause !== 'battle') return false;
        } else if (m.replaces === 'DESTRUCTION') {
          if (cause !== 'destroy' && cause !== 'battle') return false;
        } else {
          return false;
        }
      } else if (m.type === 'REPLACEMENT_EFFECT' && cause !== 'destroy' && cause !== 'battle') {
        return false;
      }
      if (m.side && !sideMatches(m.side, side || card.owner || fromSide)) return false;
      if (m.filter) {
        if (m.filter.family) {
          const fams = Array.isArray(card.families) ? card.families : (card.family ? [card.family] : []);
          if (!fams.some(f => f && f.toLowerCase().includes(m.filter.family.toLowerCase()))) return false;
        }
        if (m.filter.type && String(card.type).toLowerCase() !== String(m.filter.type).toLowerCase()) return false;
        if (m.filter.name && !String(card.name || '').toLowerCase().includes(String(m.filter.name).toLowerCase())) return false;
        const mvMaxCost = m.filter.maxCost ?? m.filter.costLte;
        if (typeof mvMaxCost === 'number' && (typeof card.cost !== 'number' || card.cost > mvMaxCost)) return false;
        if (m.filter.zeroBp && !(typeof options.bpAtDestroy === 'number' && options.bpAtDestroy <= 0)) return false;
      }
      return true;
    });

    if (applicableReplacements.length > 0) {
      const rep = applicableReplacements[0];
      effectiveToZone = rep.destination || rep.replacementZone || 'hand';
      options._replacementApplied = true;

      if (events) {
        await events.emit({
          type: 'REPLACEMENT_EFFECT_APPLIED',
          target: 'CARD',
          card,
          originalDestination: toZone,
          replacedDestination: effectiveToZone,
          cause,
          sourceCard: rep.sourceCard || null,
          player: side || card.owner || fromSide
        });
      }
    }
  }

  // 3. Place card into target zone
  const targetSide = side || card.owner || fromSide || 'player';
  const targetPlayer = state.players[targetSide];
  card.currentOwner = targetSide;

  if (effectiveToZone === 'hand') {
    targetPlayer.hand.push(card);
  } else if (effectiveToZone === 'grave') {
    targetPlayer.grave.push(card);
  } else if (effectiveToZone === 'removed' || effectiveToZone === 'removed_zone' || effectiveToZone === 'banished') {
    targetPlayer.removed.push(card);
    if (Array.isArray(targetPlayer.openCards) && !targetPlayer.openCards.some(c => c.id === card.id)) {
      targetPlayer.openCards.push(card);
    }
  } else if (effectiveToZone === 'deck_top') {
    targetPlayer.deck.unshift(card);
  } else if (effectiveToZone === 'deck_bottom' || effectiveToZone === 'deck') {
    targetPlayer.deck.push(card);
  } else if (effectiveToZone === 'nexus') {
    if (!Array.isArray(targetPlayer.nexus)) targetPlayer.nexus = [];
    targetPlayer.nexus.push(card);
  } else if (effectiveToZone === 'burst') {
    // If a burst already exists, replace it to grave (Eternal Rule 3.5)
    if (targetPlayer.burst) {
      targetPlayer.grave.push(targetPlayer.burst);
    }
    targetPlayer.burst = card;
    targetPlayer.burstSetThisTurn = true;
  } else if (effectiveToZone === 'mirage') {
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
      toZone: effectiveToZone,
      toSide: side,
      cause,
      by,
      sourceCard: options.sourceCard || null
    });

    if (effectiveToZone === 'grave' && (cause === 'destroy' || cause === 'battle')) {
      await events.emit({
        type: 'DESTROYED',
        card,
        level: fromZone === 'field' ? fromLevel : null,
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

const VALID_CORE_ZONES = new Set(['reserve', 'trash', 'field', 'void', 'life']);

export async function moveCore(state, count, from, to, options = {}, events = null) {
  if (!Number.isInteger(count) || count < 0) return false;
  if (count === 0) return true;
  const isSoul = Boolean(options.isSoulCore);
  if (isSoul && count !== 1) return false;
  const cause = options.cause || 'rule';
  const by = options.by || 'self';

  const fromSide = from?.side || 'player';
  const toSide = to?.side || 'player';
  const fromZone = from?.zone; // 'reserve', 'trash', 'field', 'void', 'life'
  const toZone = to?.zone;

  if (!VALID_CORE_ZONES.has(fromZone) || !VALID_CORE_ZONES.has(toZone)) {
    return false;
  }

  const fromPlayer = state?.players?.[fromSide];
  const toPlayer = state?.players?.[toSide];
  if (!fromPlayer || !toPlayer) return false;

  // Enforce CANNOT_GAIN_CORES_FROM_VOID when gaining cores from Void via effects
  if (fromZone === 'void' && cause === 'effect' && !options.bypassCoreRestriction) {
    const gainBlocked = (state.modifiers || []).some(m =>
      m &&
      (m.type === 'GLOBAL_RESTRICTION' || m.type === 'SET_RESTRICTION') &&
      (m.restriction === 'CANNOT_GAIN_CORES_FROM_VOID' || m.action === 'CANNOT_GAIN_CORES_FROM_VOID') &&
      (!m.side || m.side === 'both' || m.side === toSide)
    );
    if (gainBlocked) return false;
  }

  // Enforce CORE_LOCK / CONTROL_RULE when removing cores from a field stack
  if (fromZone === 'field' && from?.stackId && !options.bypassCoreLock) {
    const lockedByMod = (state.modifiers || []).some(m =>
      m &&
      (m.type === 'CORE_LOCK' || m.type === 'CONTROL_RULE') &&
      (!m.targetStackId || m.targetStackId === from.stackId) &&
      (!m.side || m.side === 'both' || m.side === fromSide)
    );
    const srcSt = (fromPlayer.field || []).find(st => st.id === from.stackId);
    if (lockedByMod || srcSt?.coreLocked || srcSt?.coresLockedByControlRule) {
      return false;
    }
  }

  // 1. Resolve REPLACEMENT_EFFECT for core destinations BEFORE any deduction
  let effectiveToZone = toZone;
  let effectiveToSide = toSide;
  let effectiveToStackId = to.stackId;
  let appliedReplacement = null;

  if (fromZone === 'life' && !options._replacementApplied && !options._coreReplacementApplied && !options.unpreventable) {
    const applicableLifeReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT') return false;
      const rt = (m.rawText || '').toLowerCase();
      if (m.replaces !== 'LIFE_CORE' && m.replaces !== 'LIFE_TO_RESERVE' && m.replaces !== 'LIFE_DAMAGE' && !rt.includes('life')) return false;
      if (m.targetSide && m.targetSide !== 'both' && m.targetSide !== fromSide) return false;
      if (rt.includes('opposing life') || rt.includes('opposing')) {
        if (m.side && fromSide === m.side) return false;
      } else if (rt.includes('your life')) {
        if (m.side && fromSide !== m.side) return false;
      } else if (!m.targetSide) {
        if (m.side && m.side !== 'both' && m.side !== fromSide && m.side !== toSide) return false;
      }
      return true;
    });

    if (applicableLifeReplacements.length > 0) {
      appliedReplacement = applicableLifeReplacements[0];
      options._replacementApplied = true;
      options._coreReplacementApplied = true;
      effectiveToZone = appliedReplacement.replacementZone || (appliedReplacement.rawText?.includes('void') ? 'void' : 'trash');
    } else {
      const lifeRedirects = (state.modifiers || []).filter(m =>
        m && m.type === 'REDIRECT_CORE_DESTINATION' &&
        (!m.fromZone || m.fromZone === 'life') &&
        (!m.side || m.side === 'both' || m.side === fromSide)
      );
      if (lifeRedirects.length > 0) {
        appliedReplacement = lifeRedirects[0];
        options._replacementApplied = true;
        options._coreReplacementApplied = true;
        const rawDest = String(appliedReplacement.destination || 'trash').toLowerCase();
        effectiveToZone = rawDest === 'grave' ? 'trash' : rawDest;
      }
    }
  } else if (fromZone === 'void' && cause === 'effect' && !options._replacementApplied) {
    const applicableVoidReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT') return false;
      if (m.replaces !== 'CORE_DESTINATION' && m.replaces !== 'CORE_ADDITION' && !m.rawText?.includes('void')) return false;
      if (m.side && m.side === toSide) return false; // Opposing replacement effect
      return true;
    });

    if (applicableVoidReplacements.length > 0) {
      appliedReplacement = applicableVoidReplacements[0];
      if (appliedReplacement.replacementZone === 'life') {
        effectiveToZone = 'life';
        effectiveToSide = appliedReplacement.side || fromSide;
      } else if (appliedReplacement.replacementZone === 'void') {
        effectiveToZone = 'void';
      } else if (appliedReplacement.replacementZone === 'field' || appliedReplacement.targetStackId || appliedReplacement.replacementStackId) {
        effectiveToZone = 'field';
        effectiveToSide = appliedReplacement.side || fromSide;
        effectiveToStackId = appliedReplacement.targetStackId || appliedReplacement.replacementStackId || null;
      }
    }
  } else if (fromZone === 'field' && (cause === 'destroy' || cause === 'battle') && toZone === 'reserve' && !options._replacementApplied) {
    const applicableDestroyReplacements = (state.modifiers || []).filter(m => {
      if (m.type !== 'REPLACEMENT_EFFECT') return false;
      if (m.replaces !== 'DESTROYED_SPIRIT_CORES') return false;
      if (m.side && m.side !== 'both' && m.side !== fromSide) return false;
      return true;
    });

    if (applicableDestroyReplacements.length > 0) {
      appliedReplacement = applicableDestroyReplacements[0];
      options._replacementApplied = true;
      const targetStackId = appliedReplacement.targetStackId || appliedReplacement.replacementStackId;
      effectiveToZone = 'field';
      effectiveToSide = appliedReplacement.side || fromSide;
      effectiveToStackId = targetStackId || null;
    } else {
      const coreVoidRedirects = (state.modifiers || []).filter(m =>
        m && (m.type === 'REDIRECT_CORE_DESTINATION' || m.type === 'SEND_CORE_TO_VOID') &&
        (!m.fromZone || m.fromZone === 'field') &&
        (!m.side || m.side === 'both' || m.side === fromSide)
      );
      if (coreVoidRedirects.length > 0) {
        appliedReplacement = coreVoidRedirects[0];
        options._replacementApplied = true;
        effectiveToZone = appliedReplacement.destination || 'void';
      }
    }
  }

  // 2. Validate destination existence and validity BEFORE ANY DEDUCTION
  const targetPlayer = state.players[effectiveToSide] || toPlayer;
  if (!targetPlayer) return false;

  // Eternal Rule: Soul Core restrictions evaluated on effective destination
  const actor = options.controller || by;
  let isOpponentActor = false;
  if (fromSide === 'player') {
    isOpponentActor = (by === 'opp' || by === 'opponent' || actor === 'opponent');
  } else if (fromSide === 'opponent') {
    isOpponentActor = (by === 'opp' || by === 'player' || actor === 'player');
  } else {
    isOpponentActor = (by === 'opp' || by === 'opponent');
  }
  if (isSoul && effectiveToZone === 'void' && isOpponentActor) {
    console.warn('[Engine] Illegal action: Opponent cannot send Soul Core to Void.');
    return false;
  }
  if (isSoul && effectiveToZone === 'life' && !options.allowSeal) {
    console.warn('[Engine] Illegal action: Soul Core cannot enter Life except via Seal effect.');
    return false;
  }

  // If effective destination is field, verify target stack exists BEFORE mutating source
  let targetFieldStack = null;
  if (effectiveToZone === 'field') {
    const targetStackId = effectiveToStackId || to.stackId;
    if (!targetStackId) {
      return false;
    } else {
      targetFieldStack = (targetPlayer.field || []).find(st => st.id === targetStackId);
      if (!targetFieldStack) {
        // Target stack does not exist: abort immediately with zero source/destination mutation!
        return false;
      }
      if (hasGrandwalkerRule(targetFieldStack, 'GRANDWALKER_CORE_RULE') && !options.targetsGrandwalker && !options.coreCharge) {
        return false;
      }
    }
  }

  // Grandwalker rule on fromStack
  const fromStack = fromZone === 'field' ? (fromPlayer.field || []).find(stack => stack.id === from.stackId) : null;
  if (fromStack && hasGrandwalkerRule(fromStack, 'GRANDWALKER_CORE_RULE') && !options.targetsGrandwalker) return false;

  // 3. Validate source and destination zone containers & availability BEFORE ANY DEDUCTION
  if (effectiveToZone === 'reserve' && (!targetPlayer.reserve || typeof targetPlayer.reserve !== 'object')) return false;
  if (effectiveToZone === 'trash' && (!targetPlayer.trash || typeof targetPlayer.trash !== 'object')) return false;
  if (effectiveToZone === 'void' && (!targetPlayer.voidCores || typeof targetPlayer.voidCores !== 'object')) return false;

  if (fromZone === 'reserve') {
    if (!fromPlayer.reserve || typeof fromPlayer.reserve !== 'object') return false;
    if (isSoul) {
      if ((fromPlayer.reserve.soul || 0) < 1) return false;
    } else {
      if ((fromPlayer.reserve.normal || 0) < count) return false;
    }
  } else if (fromZone === 'trash') {
    if (!fromPlayer.trash || typeof fromPlayer.trash !== 'object') return false;
    if (isSoul) {
      if ((fromPlayer.trash.soul || 0) < 1) return false;
    } else {
      if ((fromPlayer.trash.normal || 0) < count) return false;
    }
  } else if (fromZone === 'void') {
    if (!fromPlayer.voidCores || typeof fromPlayer.voidCores !== 'object') return false;
    if (isSoul) {
      if ((fromPlayer.voidCores.soul || 0) < 1) return false;
    } else {
      if ((fromPlayer.voidCores.normal || 0) < count) return false;
    }
  } else if (fromZone === 'life') {
    if (!Number.isInteger(fromPlayer.life) || fromPlayer.life < count) return false;
    if (events && cause !== 'cost' && cause !== 'rule') {
      const replacement = await events.emit({ type: 'BEFORE_LIFE_REDUCED', player: fromSide, damage: count, by, cause, sourceCard: options.sourceCard || null, prevented: false });
      if (replacement && replacement.prevented) return false;
    }
    if (cause !== 'cost' && cause !== 'life_pay_cost' && cause !== 'rule' && !options.unpreventable &&
        isActionRestricted(state, 'CANNOT_LOSE_LIFE', fromSide, null, { cause, by, isCost: false, unpreventable: false })) {
      return false;
    }
  } else if (fromZone === 'field') {
    if (!fromStack || !fromStack.cores || typeof fromStack.cores !== 'object') return false;
    if (cause === 'effect' && isOpponentActor && (
      isActionRestricted(state, 'CANNOT_LOSE_CORES', fromSide, fromStack, { cause, by, sourceCard: options.sourceCard || null }) ||
      isTargetProtectedFrom(state, fromStack, 'deplete', options.sourceCard || null)
    )) {
      return false;
    }
    const currentTotalCores = (fromStack.cores.normal || 0) + (fromStack.cores.soul ? 1 : 0);
    if (typeof options.minCoresRemaining === 'number') {
      if (currentTotalCores - count < options.minCoresRemaining) {
        return false;
      }
    }
    if (isSoul) {
      if ((fromStack.cores.soul || 0) < 1) return false;
    } else {
      if ((fromStack.cores.normal || 0) < count) return false;
    }
  }

  // ALL PRE-CHECKS AND DESTINATION CHECKS PASSED -> NOW MUTATE SOURCE & DESTINATION

  // Emit REPLACEMENT_EFFECT_APPLIED if applicable
  if (appliedReplacement) {
    options._replacementApplied = true;
    if (events) {
      await events.emit({
        type: 'REPLACEMENT_EFFECT_APPLIED',
        target: 'CORE',
        originalDestination: toZone,
        replacedDestination: effectiveToZone,
        coreCount: count,
        fromZone,
        player: effectiveToSide || fromSide,
        sourceCard: appliedReplacement.sourceCard || null,
        targetStackId: targetFieldStack ? targetFieldStack.id : (effectiveToStackId || null)
      });
    }
  }

  // A. Deduct from source
  if (fromZone === 'reserve') {
    if (isSoul) fromPlayer.reserve.soul -= 1;
    else fromPlayer.reserve.normal -= count;
  } else if (fromZone === 'trash') {
    if (isSoul) fromPlayer.trash.soul -= 1;
    else fromPlayer.trash.normal -= count;
  } else if (fromZone === 'void') {
    if (isSoul) fromPlayer.voidCores.soul -= 1;
    else fromPlayer.voidCores.normal -= count;
  } else if (fromZone === 'life') {
    fromPlayer.life -= count;
  } else if (fromZone === 'field') {
    fromStack.lastActiveLevel = computeLevel(fromStack);
    if (isSoul) fromStack.cores.soul -= 1;
    else fromStack.cores.normal -= count;
  }

  // B. Add to effective destination
  if (effectiveToZone === 'reserve') {
    if (isSoul) targetPlayer.reserve.soul += 1;
    else targetPlayer.reserve.normal += count;
  } else if (effectiveToZone === 'trash') {
    if (isSoul) targetPlayer.trash.soul += 1;
    else targetPlayer.trash.normal += count;
  } else if (effectiveToZone === 'void') {
    if (isSoul) targetPlayer.voidCores.soul += 1;
    else targetPlayer.voidCores.normal += count;
  } else if (effectiveToZone === 'life') {
    targetPlayer.life += count;
  } else if (effectiveToZone === 'field') {
    if (targetFieldStack) {
      if (isSoul) targetFieldStack.cores.soul += 1;
      else targetFieldStack.cores.normal += count;
    }
  }

  // C. Emit core movement & life events
  if (events) {
    await events.emit({
      type: 'CORE_MOVED',
      count,
      isSoulCore: isSoul,
      fromZone,
      fromSide,
      toZone: effectiveToZone,
      toSide: effectiveToSide,
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

    if (effectiveToZone === 'life') {
      await events.emit({
        type: 'LIFE_RECOVERED',
        player: effectiveToSide,
        recovered: count,
        currentLife: targetPlayer.life,
        cause
      });
    }
  }

  return true;
}

function hasGrandwalkerRule(stack, opName) {
  return (stack?.top?.compiledIr?.abilities || []).some(ability => ability.header?.timing === 'PASSIVE' &&
    (ability.clauses || []).some(clause => clause.op?.op === opName));
}
