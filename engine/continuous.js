/**
 * engine/continuous.js
 * 
 * Continuous layer computing derived properties: levels, effective BP,
 * active symbols, cost reduction symbols, and immunities.
 * Cards and stacks are never mutated directly for continuous stat modifications.
 */

export function computeLevel(stack, state = null) {
  if (!stack || !stack.top) return 1;
  // Eternal 17.0: If stack is in depletion standby, resolve using pre-depletion level
  if (stack.standby && stack.standby.type === 'depletion' && stack.standby.previousLevel) {
    return stack.standby.previousLevel;
  }
  const totalCores = (stack.cores.normal || 0) + (stack.cores.soul ? 1 : 0);
  const levels = stack.top.levels || { 1: { cost: 1, bp: 1000 } };

  let currentLevel = 1;
  const sortedLevels = Object.keys(levels)
    .map(Number)
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const maxLevel = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1] : 1;

  for (const lv of sortedLevels) {
    const reqCores = levels[lv].cost;
    if (totalCores >= reqCores) {
      currentLevel = lv;
    }
  }

  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if ((mod.type === 'TREAT_RULE' || mod.type === 'TREAT_LEVEL') && isModifierApplicable(mod, stack)) {
        const rule = String(mod.treatAs || mod.rule || '').toUpperCase();
        if (mod.treatAsMaxLevel || rule === 'MAX_LEVEL' || rule === 'HIGHEST_LEVEL' || rule === 'LEVEL_MAX') {
          currentLevel = maxLevel;
        } else if (rule === 'NEXT_LEVEL' || rule === 'LEVEL_PLUS') {
          currentLevel = Math.min(maxLevel, currentLevel + (mod.amount || mod.levelBonus || mod.levelDelta || 1));
        } else if (typeof mod.setLevel === 'number') {
          currentLevel = Math.min(maxLevel, Math.max(1, mod.setLevel));
        } else if (typeof mod.levelBonus === 'number' || typeof mod.levelDelta === 'number') {
          const delta = typeof mod.levelBonus === 'number' ? mod.levelBonus : mod.levelDelta;
          currentLevel = Math.min(maxLevel, Math.max(1, currentLevel + delta));
        }
      }
    }
  }

  stack.lastActiveLevel = currentLevel;
  return currentLevel;
}

export function computeBaseBP(stack, state = null) {
  if (!stack || !stack.top) return 0;
  const lv = computeLevel(stack, state);
  const levels = stack.top.levels || {};
  return (levels[lv] && levels[lv].bp) ? levels[lv].bp : 1000;
}

export function computeEffectiveBP(state, stack) {
  if (!stack || !stack.top) return 0;
  let bp = computeBaseBP(stack, state);

  // Add BP from braved Braves
  for (const brave of stack.braves || []) {
    const lv = computeLevel({ top: brave, cores: { normal: 1, soul: 0 } }, state);
    const bLevels = brave.levels || {};
    const braveBp = (bLevels[lv] && bLevels[lv].bp) ? bLevels[lv].bp : (brave.bp || 0);
    bp += braveBp;
  }

  // Apply active continuous modifiers in game state
  for (const mod of state.modifiers || []) {
    if (mod.type === 'BP_BUFF' && isModifierApplicable(mod, stack)) {
      bp += mod.amount || 0;
    } else if (mod.type === 'BP_DEBUFF' && isModifierApplicable(mod, stack)) {
      bp = Math.max(0, bp - (mod.amount || 0));
    }
  }

  return Math.max(0, bp);
}

export function computeColors(state, stackOrCard) {
  if (!stackOrCard) return [];
  const card = stackOrCard.top || stackOrCard;
  const stack = stackOrCard.top ? stackOrCard : null;
  let colors = Array.isArray(card.colors)
    ? [...card.colors]
    : (card.colors ? [card.colors] : (card.color ? [card.color] : ['Red']));

  if (stack && Array.isArray(stack.braves)) {
    for (const brave of stack.braves) {
      const bCols = Array.isArray(brave.colors) ? brave.colors : (brave.color ? [brave.color] : []);
      for (const c of bCols) {
        if (c && !colors.includes(c)) colors.push(c);
      }
    }
  }

  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      const matches = stack ? isModifierApplicable(mod, stack) : (mod.sourceCardId === card.id || mod.side === card.owner || !mod.targetStackId);
      if (!matches) continue;

      if (mod.type === 'TREAT_RULE' || mod.type === 'TREAT_COLOR_SYMBOL') {
        const rule = String(mod.treatAs || mod.rule || '').toUpperCase();
        if (mod.colorless || rule === 'COLORLESS') {
          return [];
        }
        if (rule === 'ALL_COLORS') {
          return ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        }
        if (Array.isArray(mod.setColors) && mod.setColors.length > 0) {
          colors = [...mod.setColors];
        }
        if (mod.color && !colors.includes(mod.color)) {
          colors.push(mod.color);
        }
        const addCols = mod.colors || mod.addColors;
        if (Array.isArray(addCols)) {
          for (const c of addCols) {
            if (c && !colors.includes(c)) colors.push(c);
          }
        }
      } else if (mod.type === 'CHOOSE_COLOR') {
        if (Array.isArray(mod.setColors) && mod.setColors.length > 0) {
          colors = [...mod.setColors];
        } else if (mod.color && !colors.includes(mod.color)) {
          colors.push(mod.color);
        }
      }
    }
  }

  return colors;
}

export function computeFamilies(state, stackOrCard) {
  if (!stackOrCard) return [];
  const card = stackOrCard.top || stackOrCard;
  const stack = stackOrCard.top ? stackOrCard : null;
  const families = Array.isArray(card.families)
    ? [...card.families]
    : (card.families ? [card.families] : (card.family ? [card.family] : []));

  if (stack && Array.isArray(stack.braves)) {
    for (const brave of stack.braves) {
      const bFams = Array.isArray(brave.families) ? brave.families : (brave.family ? [brave.family] : []);
      for (const f of bFams) {
        if (f && !families.includes(f)) families.push(f);
      }
    }
  }

  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if (mod.type === 'GRANT_FAMILY') {
        const matches = stack ? isModifierApplicable(mod, stack) : (mod.targetCardId === card.id || mod.side === card.owner);
        if (matches) {
          if (mod.family && !families.includes(mod.family)) {
            families.push(mod.family);
          }
          if (Array.isArray(mod.families)) {
            for (const f of mod.families) {
              if (f && !families.includes(f)) families.push(f);
            }
          }
        }
      }
    }
  }

  return families;
}

export function computeSymbols(state, stack) {
  if (!stack || !stack.top) return [];
  const symbols = [...(stack.top.symbols || [stack.top.color || 'Red'])];

  // Add symbols from braved Braves
  for (const brave of stack.braves || []) {
    if (brave.symbols && brave.symbols.length > 0) {
      symbols.push(...brave.symbols);
    }
  }

  // Check SET_SYMBOL modifiers
  const setSymbolMod = (state.modifiers || []).find(m => m.type === 'SET_SYMBOL' && isModifierApplicable(m, stack));
  if (setSymbolMod) {
    const symArr = [];
    const count = typeof setSymbolMod.count === 'number' ? setSymbolMod.count : 1;
    for (let i = 0; i < count; i++) {
      symArr.push(setSymbolMod.symbolColor || setSymbolMod.symbol || setSymbolMod.color || 'Red');
    }
    return symArr;
  }

  // Check GRANT_SYMBOL, ADD_SYMBOL, GRANT_BRAVE_SYMBOLS, and CHOOSE_COLOR modifiers
  for (const mod of state.modifiers || []) {
    if ((mod.type === 'GRANT_SYMBOL' || mod.type === 'ADD_SYMBOL') && isModifierApplicable(mod, stack)) {
      const count = typeof mod.count === 'number' ? mod.count : 1;
      const col = mod.symbolColor || mod.symbol || mod.color || stack.top.color || 'Red';
      for (let i = 0; i < count; i++) {
        symbols.push(col);
      }
    } else if (mod.type === 'GRANT_BRAVE_SYMBOLS' && isModifierApplicable(mod, stack)) {
      const braves = stack.braves || [];
      if (braves.length > 0) {
        for (const b of braves) {
          const bCol = mod.symbolColor || mod.symbol || mod.color || (b.symbols && b.symbols[0]) || b.color || stack.top.color || 'Red';
          const count = typeof mod.count === 'number' ? mod.count : 1;
          for (let i = 0; i < count; i++) {
            symbols.push(bCol);
          }
        }
      } else if (mod.symbolColor || mod.symbol || mod.color) {
        symbols.push(mod.symbolColor || mod.symbol || mod.color);
      }
    } else if (mod.type === 'CHOOSE_COLOR' && mod.addSymbol && mod.color && isModifierApplicable(mod, stack)) {
      symbols.push(mod.color);
    }
  }

  return symbols;
}

export function computeFieldSymbols(state, playerSide) {
  const p = state.players[playerSide];
  const symbolTally = { Red: 0, Purple: 0, Green: 0, White: 0, Yellow: 0, Blue: 0, Ultimate: 0 };

  for (const stack of p.field || []) {
    const syms = computeSymbols(state, stack);
    for (const s of syms) {
      if (symbolTally[s] !== undefined) {
        symbolTally[s]++;
      }
    }
  }

  return symbolTally;
}

export function isImmune(state, stack, sourceCard, effectType = 'effect') {
  if (!stack || !sourceCard) return false;

  const sourceColors = computeColors(state, sourceCard).map(c => String(c).toLowerCase());
  const sourceType = String(sourceCard.type || 'Spirit').toLowerCase();

  for (const mod of state.modifiers || []) {
    if (mod.type === 'IMMUNITY' && isModifierApplicable(mod, stack)) {
      const modColors = Array.isArray(mod.colors) ? mod.colors.map(c => String(c).toLowerCase()) : [];
      const modTypes = Array.isArray(mod.sourceTypes) ? mod.sourceTypes.map(t => String(t).toLowerCase()) : [];
      const typeMatches = modTypes.length === 0 || modTypes.includes(sourceType);
      const colorMatches = modColors.length === 0 || sourceColors.some(c => modColors.includes(c));

      if (mod.immuneTo === 'ALL' || mod.immuneTo === 'OPPOSING_EFFECTS') {
        if (typeMatches && colorMatches) return true;
      }
      if (modColors.length > 0 && colorMatches && typeMatches) {
        return true;
      }
      if (modTypes.length > 0 && modColors.length === 0 && typeMatches) {
        return true;
      }
    } else if (mod.type === 'PROTECTION' && isModifierApplicable(mod, stack)) {
      if (effectType === 'destroy' && mod.cannotBeDestroyed !== false) return true;
      if (effectType === 'bounce' && mod.cannotBeBounced) return true;
      if (effectType === 'deplete' && mod.cannotBeDepleted) return true;
      if (mod.protectAll) return true;
    }
  }

  // Check card text keywords (Armor, Heavy Armor, Ultra Armor, Silver Wheel, Barrage)
  const effectText = stack.top?.effect || '';
  if (effectText.toLowerCase().includes('armor: all') || effectText.toLowerCase().includes('ultra armor: all')) {
    return true;
  }
  for (const c of sourceColors) {
    const low = c.toLowerCase();
    if (
      effectText.toLowerCase().includes(`heavy armor: ${low}`) ||
      effectText.toLowerCase().includes(`ultra armor: ${low}`) ||
      effectText.toLowerCase().includes(`armor: ${low}`) ||
      effectText.toLowerCase().includes(`silver wheel: ${low}`) ||
      effectText.toLowerCase().includes(`barrage: ${low}`)
    ) {
      return true;
    }
  }

  return false;
}

export function canAttack(state, stack) {
  if (!stack) return false;

  // Normal rule: must be REFRESHED to attack.
  // Pursuit: an EXHAUSTED spirit with Pursuit can attack (by heavy exhausting).
  // A HEAVY_EXHAUSTED spirit cannot attack.
  if (stack.state !== 'REFRESHED') {
    const hasPursuit = (stack.top?.effect && stack.top.effect.toLowerCase().includes('pursuit')) ||
      (stack.top?.compiledIr?.keywords?.some(k => k.name.toLowerCase() === 'pursuit'));
    if (!hasPursuit || stack.state === 'HEAVY_EXHAUSTED') {
      return false;
    }
  }

  for (const mod of state.modifiers || []) {
    if (mod.type === 'CANNOT_ATTACK' && isModifierApplicable(mod, stack)) {
      return false;
    }
    if (mod.type === 'COMBAT_RESTRICTION' && isModifierApplicable(mod, stack)) {
      const r = String(mod.restriction || mod.restrictionType || '').toUpperCase();
      if (r === 'CANNOT_ATTACK' || mod.cannotAttack) {
        return false;
      }
    }
  }

  return true;
}

export function canBlock(state, stack) {
  if (!stack) return false;
  const sId = stack.id || stack.stackId;

  // Forced blocker / Target Attack restriction: if a specific opposing stack is forced to block, other stacks cannot block instead
  if (state.combat && state.combat.forcedBlockerStackId && state.combat.forcedBlockerStackId !== sId) {
    return false;
  }

  // Combat restriction: only blockable by specific keyword (e.g. Clock Up)
  if (state.combat && state.combat.onlyBlockableByKeyword) {
    const reqKeyword = state.combat.onlyBlockableByKeyword.toLowerCase();
    const hasKeyword = (stack.top?.effect && stack.top.effect.toLowerCase().includes(reqKeyword)) ||
      (stack.top?.compiledIr?.keywords?.some(k => k.name.toLowerCase() === reqKeyword));
    if (!hasKeyword) {
      return false;
    }
  }

  // Spirits can only block while Refreshed unless granted EXHAUSTED_BLOCK, or Soar is active on attacker
  const soarActive = Boolean(state.combat && state.combat.soarActive);
  const canBlockExhausted = soarActive ||
    (state.modifiers || []).some(m => (m.type === 'EXHAUSTED_BLOCK' || (m.type === 'COMBAT_RESTRICTION' && m.canBlockWhileExhausted)) && isModifierApplicable(m, stack)) ||
    (stack.top?.effect && stack.top.effect.toLowerCase().includes('can block while exhausted'));

  if (stack.state !== 'REFRESHED' && !canBlockExhausted) {
    return false;
  }

  for (const mod of state.modifiers || []) {
    if (mod.type === 'CANNOT_BLOCK' && isModifierApplicable(mod, stack)) {
      return false;
    }
    if (mod.type === 'COMBAT_RESTRICTION' && isModifierApplicable(mod, stack)) {
      const r = String(mod.restriction || mod.restrictionType || '').toUpperCase();
      if (r === 'CANNOT_BLOCK' || mod.cannotBlock) {
        return false;
      }
    }
    if (mod.type === 'UNBLOCKABLE') {
      // Check if this UNBLOCKABLE modifier applies to the current attacker (or attacking side)
      const attackerId = state.combat ? state.combat.attackerStackId : null;
      const appliesToAttacker = !mod.targetStackId || !attackerId || mod.targetStackId === attackerId;
      const isOpposingBlocker = !mod.side || !stack.owner || mod.side !== stack.owner;

      if (appliesToAttacker && isOpposingBlocker) {
        const ob = mod.onlyBlockableBy || mod.blockedOnlyByFilter;
        const f = mod.filter || mod.cannotBeBlockedByFilter || mod.unlessFilter || (typeof mod.blockedByCannot === 'object' ? mod.blockedByCannot : null);

        if (mod.blockedByCannot === 'ALL' || (!f && !ob && !mod.blockedByCannot)) {
          return false;
        }
        if (ob) {
          if (ob.type && stack.top.type !== ob.type) return false;
          if (Array.isArray(ob.types) && !ob.types.includes(stack.top.type)) return false;
          const minCost = ob.costGte !== undefined ? ob.costGte : ob.minCost;
          const maxCost = ob.costLte !== undefined ? ob.costLte : ob.maxCost;
          const minLevel = ob.levelGte !== undefined ? ob.levelGte : ob.minLevel;
          if (minCost !== undefined && (stack.top.cost || 0) < minCost) return false;
          if (maxCost !== undefined && (stack.top.cost || 0) > maxCost) return false;
          if (minLevel !== undefined && computeLevel(stack, state) < minLevel) return false;
        }
        if (f) {
          let matchesDisqualified = true;
          if (f.type && stack.top.type !== f.type) matchesDisqualified = false;
          if (Array.isArray(f.types) && f.types.length > 0 && !f.types.includes(stack.top.type)) matchesDisqualified = false;
          const maxCost = f.costLte !== undefined ? f.costLte : f.maxCost;
          const minCost = f.costGte !== undefined ? f.costGte : f.minCost;
          if (maxCost !== undefined && (stack.top.cost || 0) > maxCost) matchesDisqualified = false;
          if (minCost !== undefined && (stack.top.cost || 0) < minCost) matchesDisqualified = false;
          if (f.bpLte !== undefined && computeEffectiveBP(state, stack) > f.bpLte) matchesDisqualified = false;
          if (f.levelLte !== undefined && computeLevel(stack, state) > f.levelLte) matchesDisqualified = false;
          if (f.color) {
            const cols = computeColors(state, stack);
            if (!cols.some(c => c.toLowerCase() === f.color.toLowerCase())) matchesDisqualified = false;
          }
          if (matchesDisqualified) return false;
        }
      }
    }
  }

  return true;
}

function isModifierApplicable(mod, stack) {
  if (!mod || !stack) return false;
  const sId = stack.id || stack.stackId;
  if (mod.targetStackId) {
    return mod.targetStackId === sId;
  }
  if (mod.side && mod.side !== 'both' && stack.owner && mod.side !== stack.owner) {
    return false;
  }
  if (mod.targetFilter) {
    const tf = mod.targetFilter;
    if (tf.type && stack.top.type !== tf.type) {
      return false;
    }
    if (Array.isArray(tf.types) && tf.types.length > 0 && !tf.types.includes(stack.top.type)) {
      return false;
    }
    if (tf.color) {
      const cols = Array.isArray(stack.top.colors) ? stack.top.colors : [stack.top.color || 'Red'];
      if (!cols.some(c => c && c.toLowerCase() === tf.color.toLowerCase())) return false;
    }
    if (tf.family) {
      const fams = Array.isArray(stack.top.families) ? stack.top.families : (stack.top.family ? [stack.top.family] : []);
      if (!fams.some(f => f && f.toLowerCase().includes(tf.family.toLowerCase()))) return false;
    }
    if (tf.costLte !== undefined && (stack.top.cost || 0) > tf.costLte) return false;
    if (tf.costGte !== undefined && (stack.top.cost || 0) < tf.costGte) return false;
  }
  return true;
}
