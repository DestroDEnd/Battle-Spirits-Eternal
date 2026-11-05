/**
 * engine/continuous.js
 * 
 * Continuous layer computing derived properties: levels, effective BP,
 * active symbols, cost reduction symbols, and immunities.
 * Cards and stacks are never mutated directly for continuous stat modifications.
 */

export function computeLevel(stack) {
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
    .sort((a, b) => a - b);

  for (const lv of sortedLevels) {
    const reqCores = levels[lv].cost;
    if (totalCores >= reqCores) {
      currentLevel = lv;
    }
  }

  stack.lastActiveLevel = currentLevel;
  return currentLevel;
}

export function computeBaseBP(stack) {
  if (!stack || !stack.top) return 0;
  const lv = computeLevel(stack);
  const levels = stack.top.levels || {};
  return (levels[lv] && levels[lv].bp) ? levels[lv].bp : 1000;
}

export function computeEffectiveBP(state, stack) {
  if (!stack || !stack.top) return 0;
  let bp = computeBaseBP(stack);

  // Add BP from braved Braves
  for (const brave of stack.braves || []) {
    const lv = computeLevel({ top: brave, cores: { normal: 1, soul: 0 } });
    const bLevels = brave.levels || {};
    const braveBp = (bLevels[lv] && bLevels[lv].bp) ? bLevels[lv].bp : 0;
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
    for (let i = 0; i < (setSymbolMod.count || 1); i++) {
      symArr.push(setSymbolMod.symbolColor || 'Red');
    }
    return symArr;
  }

  // Check GRANT_SYMBOL modifiers
  for (const mod of state.modifiers || []) {
    if (mod.type === 'GRANT_SYMBOL' && isModifierApplicable(mod, stack)) {
      symbols.push(mod.symbolColor || 'Red');
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

  const sourceColors = sourceCard.colors || [sourceCard.color || 'Red'];

  for (const mod of state.modifiers || []) {
    if (mod.type === 'IMMUNITY' && isModifierApplicable(mod, stack)) {
      if (mod.immuneTo === 'ALL' || mod.immuneTo === 'OPPOSING_EFFECTS') {
        return true;
      }
      if (Array.isArray(mod.colors)) {
        if (sourceColors.some(c => mod.colors.includes(c))) {
          return true;
        }
      }
    }
  }

  // Check card text keywords (Armor, Heavy Armor, Ultra Armor, Silver Wheel, Barrage)
  const effectText = stack.top?.effect || '';
  for (const c of sourceColors) {
    const low = c.toLowerCase();
    if (
      effectText.toLowerCase().includes(`heavy armor: ${low}`) ||
      effectText.toLowerCase().includes(`ultra armor: ${low}`) ||
      effectText.toLowerCase().includes(`armor: ${low}`) ||
      effectText.toLowerCase().includes(`silver wheel: ${low}`) ||
      effectText.toLowerCase().includes(`barrage: ${low}`) ||
      effectText.toLowerCase().includes('armor: all') ||
      effectText.toLowerCase().includes('ultra armor: all')
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
  }

  return true;
}

export function canBlock(state, stack) {
  if (!stack) return false;

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
    (state.modifiers || []).some(m => m.type === 'EXHAUSTED_BLOCK' && isModifierApplicable(m, stack)) ||
    (stack.top?.effect && stack.top.effect.toLowerCase().includes('can block while exhausted'));

  if (stack.state !== 'REFRESHED' && !canBlockExhausted) {
    return false;
  }

  for (const mod of state.modifiers || []) {
    if (mod.type === 'CANNOT_BLOCK' && isModifierApplicable(mod, stack)) {
      return false;
    }
  }

  return true;
}

function isModifierApplicable(mod, stack) {
  if (mod.targetStackId) {
    return mod.targetStackId === stack.id;
  }
  if (mod.side && mod.side !== stack.owner) {
    return false;
  }
  if (mod.targetFilter) {
    if (mod.targetFilter.type && stack.top.type !== mod.targetFilter.type) {
      return false;
    }
  }
  return true;
}
