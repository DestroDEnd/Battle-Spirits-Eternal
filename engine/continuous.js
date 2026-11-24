/**
 * engine/continuous.js
 * 
 * Continuous layer computing derived properties: levels, effective BP,
 * active symbols, cost reduction symbols, and immunities.
 * Cards and stacks are never mutated directly for continuous stat modifications.
 */

import { classifyCardType } from './card_types.js';

/**
 * Normalizes both numeric-keyed level maps ({ 1: { cost, bp } })
 * and database-keyed level maps ({ LV1: { level: 1, cost, bp } }).
 */
export function parseLevelMap(levels) {
  const map = new Map();
  if (!levels || typeof levels !== 'object') return map;
  for (const [k, val] of Object.entries(levels)) {
    if (!val || typeof val !== 'object') continue;
    let lv = Number(val.level ?? k);
    if (Number.isNaN(lv)) {
      const m = /^LV(\d+)$/i.exec(String(k).trim());
      if (m) lv = Number(m[1]);
    }
    if (Number.isInteger(lv) && lv >= 1) {
      map.set(lv, val);
    }
  }
  return map;
}

export function computeLevel(stack, state = null) {
  if (!stack) return 1;
  if (typeof stack.level === 'number') return stack.level;
  if (typeof stack.currentLevel === 'number') return stack.currentLevel;
  const top = stack.top || stack.card || (stack.levels ? stack : null);
  if (!top) return 1;
  // Eternal 17.0: If stack is in depletion standby, resolve using pre-depletion level
  if (stack.standby && stack.standby.type === 'depletion' && stack.standby.previousLevel) {
    return stack.standby.previousLevel;
  }
  const totalCores = typeof stack.currentCores === 'number'
    ? stack.currentCores
    : (typeof stack.cores === 'number'
        ? stack.cores
        : ((stack.cores?.normal || 0) + (stack.cores?.soul ? 1 : 0)));
  const levelMap = parseLevelMap(top.levels || { 1: { cost: 1, bp: 1000 } });

  let currentLevel = 1;
  const sortedLevels = [...levelMap.keys()].sort((a, b) => a - b);

  const maxLevel = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1] : 1;

  for (const lv of sortedLevels) {
    const reqCores = levelMap.get(lv).cost ?? 1;
    if (totalCores >= reqCores) {
      currentLevel = lv;
    }
  }

  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if ((mod.type === 'TREAT_RULE' || mod.type === 'TREAT_LEVEL') && isModifierApplicable(mod, stack, state)) {
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
      } else if ((mod.type === 'SET_LEVEL' || mod.type === 'MODIFY_LEVEL') && isModifierApplicable(mod, stack, state)) {
        if (mod.type === 'SET_LEVEL' || mod.mode === 'SET' || typeof mod.setLevel === 'number') {
          const targetLv = typeof mod.setLevel === 'number'
            ? mod.setLevel
            : (typeof mod.level === 'number' ? mod.level : (typeof mod.value === 'number' ? mod.value : 1));
          currentLevel = Math.min(maxLevel, Math.max(1, targetLv));
        } else {
          const delta = typeof mod.levelDelta === 'number'
            ? mod.levelDelta
            : (typeof mod.value === 'number' ? mod.value : (typeof mod.amount === 'number' ? mod.amount : 0));
          currentLevel = Math.min(maxLevel, Math.max(1, currentLevel + delta));
        }
      } else if (mod.type === 'BP_OR_LEVEL_MODIFIER' && isModifierApplicable(mod, stack, state)) {
        const isLevelStat = mod.stat === 'level' || typeof mod.levelDelta === 'number';
        if (isLevelStat) {
          const val = typeof mod.levelDelta === 'number'
            ? mod.levelDelta
            : (typeof mod.value === 'number' ? mod.value : (typeof mod.amount === 'number' ? mod.amount : 0));
          if (String(mod.mode || '').toUpperCase() === 'SET') {
            currentLevel = Math.min(maxLevel, Math.max(1, val));
          } else {
            currentLevel = Math.min(maxLevel, Math.max(1, currentLevel + val));
          }
        }
      }
    }
  }

  if (stack.bonusLevel) {
    currentLevel = Math.min(maxLevel, currentLevel + stack.bonusLevel);
  }

  stack.lastActiveLevel = currentLevel;
  return currentLevel;
}

export function computeBaseBP(stack, state = null) {
  if (!stack) return 0;
  if (typeof stack.currentBp === 'number') return stack.currentBp;
  const top = stack.top || stack.card || (typeof stack.bp === 'number' ? stack : null);
  if (!top) return 0;
  const stackWithTop = stack.top ? stack : { ...stack, top };
  const lv = computeLevel(stackWithTop, state);
  const levelMap = parseLevelMap(top.levels);
  const entry = levelMap.get(lv);
  return (entry && typeof entry.bp === 'number') ? entry.bp : (typeof top.bp === 'number' ? top.bp : 1000);
}

export function computeEffectiveBP(state, stack) {
  if (state && !state.players && (state.top || state.card) && stack && stack.players) {
    const tmp = state;
    state = stack;
    stack = tmp;
  }
  if (!stack) return 0;
  if (typeof stack.currentBp === 'number') return stack.currentBp;
  const top = stack.top || stack.card || (typeof stack.bp === 'number' ? stack : null);
  if (!top) return 0;
  const stackWithTop = stack.top ? stack : { ...stack, top };
  let bp = computeBaseBP(stackWithTop, state);

  // Add BP from braved Braves
  for (const brave of stack.braves || []) {
    const lv = computeLevel({ top: brave, cores: { normal: 1, soul: 0 } }, state);
    const bLevels = brave.levels || {};
    const braveBp = (bLevels[lv] && bLevels[lv].bp) ? bLevels[lv].bp : (brave.bp || 0);
    bp += braveBp;
  }

  // Dynamic passive abilities on this stack (e.g. BS01-072, BS01-021, BS01-X04)
  if (state && stackWithTop.top?.compiledIr && Array.isArray(stackWithTop.top.compiledIr.abilities)) {
    const currentLevel = computeLevel(stackWithTop, state);
    for (const ab of stackWithTop.top.compiledIr.abilities) {
      if (ab.header && ab.header.timing === 'PASSIVE') {
        if (!ab.header.levels || ab.header.levels.includes(currentLevel)) {
          for (const cl of ab.clauses || []) {
            if (cl.op && cl.op.op === 'BP_BUFF') {
              let mult = 1;
              const fe = String(cl.op.forEach || '').toUpperCase();
              if (fe === 'ALL_NEXUSES' || fe === 'NEXUS_COUNT') {
                let nexCount = 0;
                for (const s of ['player', 'opponent']) {
                  const pl = (state.players && state.players[s]) ? state.players[s] : null;
                  if (pl) {
                    nexCount += (pl.field || []).filter(st => (st.top.type || '').includes('Nexus')).length;
                    nexCount += (pl.nexus || []).length;
                  }
                }
                mult = nexCount;
              } else if (fe === 'CORE_IN_RESERVE' || fe === 'RESERVE_CORES') {
                const owner = stack.owner || 'player';
                const pl = (state.players && state.players[owner]) ? state.players[owner] : null;
                mult = pl ? (pl.reserve.normal || 0) + (pl.reserve.soul ? 1 : 0) : 0;
              } else if (fe === 'DRAGON_FAMILY_SPIRITS' || fe === 'DRAGON_FAMILY_COUNT') {
                const owner = stack.owner || 'player';
                const pl = (state.players && state.players[owner]) ? state.players[owner] : null;
                mult = pl ? (pl.field || []).filter(st => {
                  const fams = (Array.isArray(st.top.families) ? st.top.families : (st.top.family ? [st.top.family] : []));
                  return fams.some(f => String(f).toLowerCase().includes('dragon'));
                }).length : 0;
              }
              bp += (cl.op.amount || 1000) * mult;
            }
          }
        }
      }
    }
  }

  // Dynamic field continuous abilities from controller (e.g. SD01-030)
  if (state && state.players) {
    const controller = stack.owner || 'player';
    const ctrlPlayer = state.players[controller];
    const attackingStack = state.combat && Object.values(state.players).flatMap(player => player.field || []).find(st => st.id === state.combat.attackerStackId);
    const isOpposingAttack = Boolean(attackingStack && attackingStack.owner !== controller);
    if (ctrlPlayer && isOpposingAttack) {
      const allSources = [...(ctrlPlayer.field || []), ...(ctrlPlayer.nexus || []).map(n => ({ top: n, cores: { normal: 1, soul: 0 } }))];
      for (const sourceSt of allSources) {
        if (sourceSt && sourceSt.top && sourceSt.top.compiledIr) {
          const lv = computeLevel(sourceSt, state);
          for (const ab of sourceSt.top.compiledIr.abilities || []) {
            if (ab.header && (ab.header.timing === 'ATTACK_STEP' || ab.header.timing === 'PASSIVE')) {
              if (!ab.header.levels || ab.header.levels.includes(lv)) {
                for (const cl of ab.clauses || []) {
                  if (cl.op && cl.op.op === 'BP_BUFF' && cl.op.target && cl.op.target.state === 'attacking_or_blocking') {
                    if (state.combat && sourceSt.id === stack.id && (state.combat.attackerStackId === stack.id || !state.combat.blockerStackId || state.combat.blockerStackId === stack.id)) {
                      if (cl.op.forEach === 'EXHAUSTED_SPIRIT_COUNT') {
                        const count = (ctrlPlayer.field || []).filter(st =>
                          (st.state === 'EXHAUSTED' || st.state === 'HEAVY_EXHAUSTED') && (st.top.type || '').includes('Spirit')
                        ).length;
                        bp += (cl.op.amount || 1000) * count;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Apply active continuous modifiers in deterministic timestamp/insertion order
  const orderedMods = [...(state.modifiers || [])]
    .map((mod, idx) => ({ mod, idx }))
    .sort((a, b) => {
      const tsA = typeof a.mod?.timestamp === 'number' ? a.mod.timestamp : a.idx;
      const tsB = typeof b.mod?.timestamp === 'number' ? b.mod.timestamp : b.idx;
      return tsA !== tsB ? tsA - tsB : a.idx - b.idx;
    })
    .map(e => e.mod);
  for (const mod of orderedMods) {
    if (!isModifierApplicable(mod, stack, state)) continue;
    if (mod.type === 'BP_BUFF') {
      bp += mod.amount || 0;
    } else if (mod.type === 'BP_DEBUFF') {
      bp = Math.max(0, bp - (mod.amount || 0));
    } else if (mod.type === 'SET_BP') {
      bp = typeof mod.value === 'number' ? mod.value : (typeof mod.bp === 'number' ? mod.bp : (typeof mod.amount === 'number' ? mod.amount : 0));
    } else if (mod.type === 'BP_OR_LEVEL_MODIFIER') {
      const isBpStat = mod.stat === 'bp' || typeof mod.bpDelta === 'number';
      if (isBpStat) {
        const val = typeof mod.bpDelta === 'number'
          ? mod.bpDelta
          : (typeof mod.value === 'number' ? mod.value : (typeof mod.amount === 'number' ? mod.amount : 0));
        if (String(mod.mode || '').toUpperCase() === 'SET') {
          bp = val;
        } else {
          bp += val;
        }
      }
    } else if (mod.type === 'BP_FORMULA') {
      const totalCores = typeof stack.cores === 'number'
        ? stack.cores
        : ((stack.cores?.normal || 0) + (stack.cores?.soul || 0));
      const multiplier = Number(mod.multiplier ?? mod.amountPerCore ?? 1000);
      const val = Math.max(0, totalCores * multiplier);
      if (String(mod.mode || 'SET').toUpperCase() === 'ADD') {
        bp += val;
      } else {
        bp = val;
      }
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

  for (const ability of card.compiledIr?.abilities || []) {
    if (ability.header?.timing !== 'PASSIVE' || (ability.header.levels?.length && stack && !ability.header.levels.includes(computeLevel(stack, state)))) continue;
    for (const clause of ability.clauses || []) {
      const op = clause.op || {};
      if (op.op === 'TREAT_COLOR_SYMBOL' && op.color && !colors.includes(op.color)) colors.push(op.color);
    }
  }

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
      const matches = stack ? isModifierApplicable(mod, stack, state) : (mod.sourceCardId === card.id || mod.side === card.owner || !mod.targetStackId);
      if (!matches) continue;

      if (mod.type === 'TREAT_RULE' || mod.type === 'TREAT_COLOR_SYMBOL' || mod.type === 'ADD_COLOR') {
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
      if (mod.type === 'GRANT_FAMILY' || mod.type === 'ADD_FAMILY' || mod.type === 'GRANT_TEAM' || mod.type === 'GAIN_TEAM' || mod.type === 'TEAM_RULE') {
        const matches = stack ? isModifierApplicable(mod, stack, state) : (mod.targetCardId === card.id || mod.side === card.owner);
        if (matches) {
          if (mod.family && !families.includes(mod.family)) {
            families.push(mod.family);
          }
          if (mod.team && !families.includes(mod.team)) {
            families.push(mod.team);
          }
          if (Array.isArray(mod.families)) {
            for (const f of mod.families) {
              if (f && !families.includes(f)) families.push(f);
            }
          }
          if (Array.isArray(mod.teams)) {
            for (const t of mod.teams) {
              if (t && !families.includes(t)) families.push(t);
            }
          }
          if (mod.allTeams && !families.includes('*ALL_TEAMS*')) {
            families.push('*ALL_TEAMS*');
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

  const activeLevel = computeLevel(stack, state);
  for (const ability of stack.top.compiledIr?.abilities || []) {
    if (ability.header?.timing !== 'PASSIVE' || (ability.header.levels?.length && !ability.header.levels.includes(activeLevel))) continue;
    for (const clause of ability.clauses || []) {
      const op = clause.op || {};
      if (op.op === 'TREAT_COLOR_SYMBOL' && op.color && !symbols.includes(op.color)) symbols.push(op.color);
    }
  }

  // Add symbols from braved Braves
  for (const brave of stack.braves || []) {
    if (brave.symbols && brave.symbols.length > 0) {
      symbols.push(...brave.symbols);
    }
  }

  // Check SET_SYMBOL modifiers
  const setSymbolMod = (state.modifiers || []).find(m => m.type === 'SET_SYMBOL' && isModifierApplicable(m, stack, state));
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
    if ((mod.type === 'GRANT_SYMBOL' || mod.type === 'ADD_SYMBOL') && isModifierApplicable(mod, stack, state)) {
      const count = typeof mod.count === 'number' ? mod.count : 1;
      const col = mod.symbolColor || mod.symbol || mod.color || stack.top.color || 'Red';
      for (let i = 0; i < count; i++) {
        symbols.push(col);
      }
    } else if (mod.type === 'GRANT_BRAVE_SYMBOLS' && isModifierApplicable(mod, stack, state)) {
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
    } else if (mod.type === 'CHOOSE_COLOR' && mod.addSymbol && mod.color && isModifierApplicable(mod, stack, state)) {
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

export function getActiveStackKeywords(stack, state = null) {
  if (!stack || !stack.top) return [];
  const top = stack.top;
  const keywords = Array.isArray(top.keywords) ? top.keywords : (top.compiledIr?.keywords || []);
  if (!keywords || keywords.length === 0) return [];

  const currentLevel = computeLevel(stack, state);
  const isFlipped = Boolean(stack.isFlipped || stack.isReborn || stack.currentFace === 'B');
  const irAbs = top.compiledIr?.abilities || top.abilities || [];

  return keywords.filter(kw => {
    // 1. Level check: If keyword has explicit levels (or frozen shard ability header has explicit levels), current level must match
    if (kw.levelExplicit && Array.isArray(kw.levels) && kw.levels.length > 0) {
      if (!kw.levels.includes(currentLevel)) {
        return false;
      }
    } else if (kw?.name && irAbs.length > 0) {
      const kwLow = String(kw.name).toLowerCase();
      const matchingAbs = irAbs.filter(ab => {
        const hk = String(ab?.header?.keyword || '').toLowerCase();
        return hk === kwLow || hk.startsWith(`${kwLow}:`) || hk.startsWith(`${kwLow} `);
      });
      if (matchingAbs.length > 0 && matchingAbs.every(ab => ab.header?.levelExplicit && Array.isArray(ab.header?.levels) && ab.header.levels.length > 0)) {
        if (!matchingAbs.some(ab => ab.header.levels.includes(currentLevel))) {
          return false;
        }
      }
    }
    // 2. Face check: If keyword is bound to Face B and stack is on Face A, or vice versa
    if (kw.face) {
      if (kw.face === 'B' && !isFlipped) return false;
      if (kw.face === 'A' && isFlipped) return false;
    }
    return true;
  });
}

export function isImmune(state, stack, sourceCard, effectType = 'effect', options = {}) {
  if (!stack || !sourceCard) return false;

  // A card can never be immune to its own effect
  if (stack.top && sourceCard && stack.top.id === sourceCard.id) {
    return false;
  }

  // Determine controller/side of target stack and source card
  let stackSide = stack.owner;
  let sourceSide = sourceCard.owner;

  if (state && state.players) {
    if (state.players.player?.field?.some(st => st.id === stack.id) ||
        state.players.player?.nexus?.some(n => n.id === stack.id || n.id === stack.top?.id)) {
      stackSide = 'player';
    } else if (state.players.opponent?.field?.some(st => st.id === stack.id) ||
               state.players.opponent?.nexus?.some(n => n.id === stack.id || n.id === stack.top?.id)) {
      stackSide = 'opponent';
    }

    if (state.players.player?.field?.some(st => st.top?.id === sourceCard.id) ||
        state.players.player?.nexus?.some(n => n.id === sourceCard.id) ||
        state.players.player?.hand?.some(c => c.id === sourceCard.id) ||
        state.players.player?.grave?.some(c => c.id === sourceCard.id)) {
      sourceSide = 'player';
    } else if (state.players.opponent?.field?.some(st => st.top?.id === sourceCard.id) ||
               state.players.opponent?.nexus?.some(n => n.id === sourceCard.id) ||
               state.players.opponent?.hand?.some(c => c.id === sourceCard.id) ||
               state.players.opponent?.grave?.some(c => c.id === sourceCard.id)) {
      sourceSide = 'opponent';
    }
  }

  // Immunity only protects against OPPOSING effects (Rule 8.3.1)
  if (stackSide && sourceSide && stackSide === sourceSide) {
    return false;
  }

  const activeKeywords = getActiveStackKeywords(stack, state);
  const sourceType = String(sourceCard.type || 'Spirit').toLowerCase();

  // Declarative PASSIVE immunity is continuous and must not depend on a
  // previously resolved trigger. Read it from the compiled IR by source type.
  const level = computeLevel(stack, state);
  for (const ability of stack.top?.compiledIr?.abilities || []) {
    if (ability.header?.timing !== 'PASSIVE' || (ability.header.levels?.length && !ability.header.levels.includes(level))) continue;
    if ((ability.clauses || []).some(cl => cl.op?.op === 'GRANDWALKER_PROTECTION') && !options.targetedGrandwalker) return true;
  }
  // Dynamic passive INDESTRUCTIBLE abilities from controller's field (including this stack)
  if (state && state.players && effectType === 'destroy') {
    const controller = stack.owner || 'player';
    const ctrlPlayer = state.players[controller];
    if (ctrlPlayer) {
      const allSources = [
        ...(ctrlPlayer.field || []),
        ...(ctrlPlayer.nexus || []).map(n => ({ top: n, cores: { normal: 1, soul: 0 } }))
      ];
      for (const sourceSt of allSources) {
        if (!sourceSt?.top?.compiledIr?.abilities) continue;
        const sLevel = computeLevel(sourceSt, state);
        for (const ab of sourceSt.top.compiledIr.abilities) {
          if (ab.header?.timing !== 'PASSIVE' || (ab.header.levels?.length && !ab.header.levels.includes(sLevel))) continue;
          for (const cl of ab.clauses || []) {
            const op = cl.op || {};
            if (op.op === 'INDESTRUCTIBLE') {
              if (matchesTargetFilter(op.target, stack, sourceSt, controller)) {
                const by = Array.isArray(op.by) ? op.by : [op.by || 'ALL'];
                if (by.includes('OPPOSING_EFFECTS') || by.includes('EFFECTS') || by.includes('ALL') || by.includes('OPPONENT')) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }

  for (const ability of stack.top?.compiledIr?.abilities || []) {
    if (ability.header?.timing !== 'PASSIVE' || (ability.header.levels && !ability.header.levels.includes(level))) continue;
    for (const clause of ability.clauses || []) {
      const op = clause.op || {};
      if (op.op === 'INDESTRUCTIBLE' && effectType === 'destroy' && (!state || !state.players)) {
        if (matchesTargetFilter(op.target, stack, stack, stack.owner)) {
          const by = Array.isArray(op.by) ? op.by : [op.by || 'ALL'];
          if (by.includes('OPPOSING_EFFECTS') || by.includes('EFFECTS') || by.includes('ALL') || by.includes('OPPONENT')) {
            return true;
          }
        }
      }
      if (op.op !== 'IMMUNITY' && op.op !== 'PROTECT') continue;
      const allowed = op.sourceTypes || op.filter?.types || [];
      if (op.immuneTo === 'OPPOSING_EFFECTS' || op.immuneTo === 'ALL') {
        if (!allowed.length || allowed.some(t => sourceTypeMatches(t, sourceCard.type))) return true;
      }
    }
  }

  // Official Bandai Fortress / True Fortress check:
  // Refreshed Spirits are unaffected by opposing effects
  if (stack.state === 'REFRESHED') {
    const top = stack.top || {};
    const eff = top.effect || '';
    const hasActiveFortress = activeKeywords.length > 0
      ? activeKeywords.some(k => k.name === 'True Fortress' || k.name === 'Fortress')
      : (Boolean(top.keywords?.some(k => k.name === 'True Fortress' || k.name === 'Fortress')) || /\[True Fortress\]|\[Fortress\]/i.test(eff));

    if (hasActiveFortress || stack.fortress || stack.trueFortress) {
      return true;
    }
  }

  const sourceColors = computeColors(state, sourceCard).map(c => String(c).toLowerCase());

  // LOSE_IMMUNITY revokes Armor/effect immunity on affected stacks unless unpreventable bypass explicitly skipped
  const lostImmunity = (state.modifiers || []).some(mod => {
    if (mod.type !== 'LOSE_IMMUNITY' || !isModifierApplicable(mod, stack, state)) return false;
    const lostCols = Array.isArray(mod.colors) ? mod.colors.map(c => String(c).toLowerCase()) : [];
    if (lostCols.length === 0 || mod.loseAll) return true;
    return sourceColors.some(c => lostCols.includes(c));
  });
  if (lostImmunity) {
    return false;
  }

  const piercingRule = options.piercingRule || (effectType === 'destroy' && (state.modifiers || []).find(mod =>
    mod && mod.type === 'PIERCING_RULE' && (!mod.side || mod.side === 'both' || mod.side === sourceCard?.owner)
  ));

  for (const mod of state.modifiers || []) {
    if (piercingRule && effectType === 'destroy' && (mod.type === 'PROTECTION' || mod.type === 'INDESTRUCTIBLE')) {
      continue; // Non-Armor modifier protections bypassed under PIERCING_RULE
    }
    if (mod.type === 'IMMUNITY' && isModifierApplicable(mod, stack, state)) {
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
    } else if (mod.type === 'PROTECTION' && isModifierApplicable(mod, stack, state)) {
      if (effectType === 'destroy' && mod.cannotBeDestroyed !== false) return true;
      if (effectType === 'bounce' && mod.cannotBeBounced) return true;
      if (effectType === 'deplete' && mod.cannotBeDepleted) return true;
      if (mod.protectAll) return true;
    } else if (mod.type === 'INDESTRUCTIBLE' && isModifierApplicable(mod, stack, state)) {
      if (effectType === 'destroy') {
        const by = Array.isArray(mod.by) ? mod.by : [mod.by || 'ALL'];
        if (by.includes('OPPOSING_EFFECTS') || by.includes('EFFECTS') || by.includes('ALL') || by.includes('OPPONENT')) {
          return true;
        }
      }
    }
  }

  // Check Armor, Heavy Armor, Ultra Armor, Ultra Heavy Armor, and related family mechanics
  if (!options.bypassArmor && activeKeywords.length > 0) {
    if (activeKeywords.some(k => (k.name === 'Armor' || k.name === 'Ultra Armor' || k.name === 'Ultra Heavy Armor') && String(k.parameter || '').toLowerCase() === 'all')) {
      return true;
    }
    for (const c of sourceColors) {
      const low = c.toLowerCase();
      const hasArmor = activeKeywords.some(k => {
        const isArmorFamily = [
          'Armor', 'Heavy Armor', 'Ultra Armor', 'Ultra Heavy Armor',
          'Knight Armor', 'Contract Armor', 'Count Armor', 'Aurora Armor',
          'PS Armor', 'VPS Armor', 'TP Armor', 'MD Armor', 'G.A.T. Field',
          'Illusive Armor', 'Illusive Ultra Heavy Armor', 'Silver Wheel', 'Barrage'
        ].includes(k.name);
        if (!isArmorFamily) return false;
        const p = String(k.parameter || '').toLowerCase();
        return p.includes(low) || p === 'all';
      });
      if (hasArmor) return true;
    }
    return false;
  }

  // Fallback to raw card text ONLY if Armor-family keyword was not already explicitly compiled/gated
  if (options.bypassArmor) return false;
  const allCompiledKws = Array.isArray(stack.top?.keywords) ? stack.top.keywords : (stack.top?.compiledIr?.keywords || []);
  const hasCompiledArmorKw = allCompiledKws.some(k => [
    'Armor', 'Heavy Armor', 'Ultra Armor', 'Ultra Heavy Armor',
    'Knight Armor', 'Contract Armor', 'Count Armor', 'Aurora Armor',
    'PS Armor', 'VPS Armor', 'TP Armor', 'MD Armor', 'G.A.T. Field',
    'Illusive Armor', 'Illusive Ultra Heavy Armor', 'Silver Wheel', 'Barrage'
  ].includes(k?.name));
  if (hasCompiledArmorKw) return false;
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

function sourceTypeMatches(expected, actual = '') {
  return String(actual).toLowerCase().includes(String(expected).toLowerCase());
}

export function canAttack(state, stack) {
  if (!stack) return false;

  // Normal rule: must be REFRESHED to attack.
  // Pursuit: an EXHAUSTED spirit with Pursuit can attack (by heavy exhausting).
  // A HEAVY_EXHAUSTED spirit cannot attack.
  if (stack.state !== 'REFRESHED') {
    const activeKeywords = getActiveStackKeywords(stack, state);
    const hasActivePursuit = activeKeywords.some(k => (typeof k === 'string' ? k : k?.name || '').toLowerCase() === 'pursuit');
    const hasLegacyPursuit = (stack.top?.effect && stack.top.effect.toLowerCase().includes('pursuit') && activeKeywords.length === 0);
    if ((!hasActivePursuit && !hasLegacyPursuit) || stack.state === 'HEAVY_EXHAUSTED') {
      return false;
    }
  }

  for (const mod of state.modifiers || []) {
    if (mod.type === 'CANNOT_ATTACK' && isModifierApplicable(mod, stack, state)) {
      return false;
    }
    if (mod.type === 'COMBAT_RESTRICTION' && isModifierApplicable(mod, stack, state)) {
      const r = String(mod.restriction || mod.restrictionType || '').toUpperCase();
      if (r === 'CANNOT_ATTACK' || mod.cannotAttack) {
        return false;
      }
    }
  }

  if (isActionRestricted(state, 'CANNOT_ATTACK', stack.owner, stack, { actionType: 'ATTACK' })) {
    return false;
  }

  return true;
}

function canStandaloneBraveBlock(state, stack) {
  const top = stack?.top;
  if (!top) return false;
  if (top.canBlockWhileUnbraved === true || top.canBlockAsBrave === true) return true;

  if ((state?.modifiers || []).some(m => (m.type === 'BRAVE_CAN_BLOCK' || m.canBlockWhileUnbraved) && isModifierApplicable(m, stack, state))) {
    return true;
  }

  if ((top.compiledIr?.abilities || []).some(ab =>
    (!ab.header?.levels?.length || ab.header.levels.includes(computeLevel(stack, state))) &&
    (ab.clauses || []).some(cl => cl.op?.canBlockWhileUnbraved || cl.op?.rule === 'BRAVE_CAN_BLOCK')
  )) {
    return true;
  }

  const eff = String(top.effect || '');
  if (!eff) return false;
  return (
    /\bthis brave (?:in spirit condition )?can block\b/i.test(eff) ||
    /\bcan block (?:even )?(?:when|while|if) (?:it is )?not braved\b/i.test(eff) ||
    /\b(?:when|while) not braved[^.\n]*\bcan block\b/i.test(eff) ||
    /\bcan block (?:even )?in spirit condition\b/i.test(eff) ||
    /このブレイヴは(?:合体していなくても|スピリット状態のとき)ブロックできる/.test(eff)
  );
}

export function canBlock(state, stack) {
  if (!stack) return false;
  const sId = stack.id || stack.stackId;

  // Battle Spirits rule: A Brave in Spirit condition (not braved with a Spirit/Ultimate)
  // cannot block unless explicitly permitted on the card itself.
  const topClass = classifyCardType(stack.top);
  const isUnbravedBrave = topClass.isBrave && (!Array.isArray(stack.braves) || stack.braves.length === 0);
  if (isUnbravedBrave && !canStandaloneBraveBlock(state, stack)) {
    return false;
  }

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

  // Combat restriction: blocker must have at least N symbols (e.g. Grand Assault)
  if (state.combat && state.combat.blockerMinSymbols) {
    const symbols = computeSymbols(state, stack);
    if (symbols.length < state.combat.blockerMinSymbols) {
      return false;
    }
  }

  // Spirits can only block while Refreshed unless granted EXHAUSTED_BLOCK, or Soar is active on attacker
  const soarActive = Boolean(state.combat && state.combat.soarActive);
  const canBlockExhausted = soarActive ||
    (state.modifiers || []).some(m => (m.type === 'EXHAUSTED_BLOCK' || (m.type === 'COMBAT_RESTRICTION' && m.canBlockWhileExhausted)) && isModifierApplicable(m, stack, state)) ||
    (stack.top?.effect && stack.top.effect.toLowerCase().includes('can block while exhausted')) ||
    Boolean(state.combat && (stack.top?.compiledIr?.abilities || []).some(ab =>
      ab.header?.timing === 'ATTACK_STEP' &&
      (!ab.header.levels?.length || ab.header.levels.includes(computeLevel(stack, state))) &&
      (ab.clauses || []).some(cl => cl.op?.canBlockWhileExhausted)
    ));

  if (stack.state !== 'REFRESHED' && !canBlockExhausted) {
    return false;
  }

  for (const mod of state.modifiers || []) {
    if (mod.type === 'CANNOT_BLOCK' && isModifierApplicable(mod, stack, state)) {
      return false;
    }
    if (mod.type === 'COMBAT_RESTRICTION' && isModifierApplicable(mod, stack, state)) {
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
          const comp = f.filters?.comparison || f.comparison;
          if (comp) {
            let refVal = null;
            const attackerStack = attackerId ? (state.players[state.combat?.attackerSide || 'player']?.field || []).find(st => st.id === attackerId) || (state.players['opponent']?.field || []).find(st => st.id === attackerId) : null;
            if (attackerStack) {
              if (comp.property === 'BP') refVal = computeEffectiveBP(state, attackerStack);
              else if (comp.property === 'COST') refVal = attackerStack.top?.cost || 0;
              else if (comp.property === 'CORES') refVal = typeof attackerStack.cores === 'number' ? attackerStack.cores : ((attackerStack.cores?.normal || 0) + (attackerStack.cores?.soul ? 1 : 0));
              else if (comp.property === 'LEVEL') refVal = computeLevel(attackerStack, state);
            }
            if (refVal !== null) {
              let blockerVal = null;
              if (comp.property === 'BP') blockerVal = computeEffectiveBP(state, stack);
              else if (comp.property === 'COST') blockerVal = stack.top?.cost || 0;
              else if (comp.property === 'CORES') blockerVal = typeof stack.cores === 'number' ? stack.cores : ((stack.cores?.normal || 0) + (stack.cores?.soul ? 1 : 0));
              else if (comp.property === 'LEVEL') blockerVal = computeLevel(stack, state);

              if (blockerVal !== null) {
                if (comp.operator === 'LTE' && blockerVal > refVal) matchesDisqualified = false;
                if (comp.operator === 'LT' && blockerVal >= refVal) matchesDisqualified = false;
                if (comp.operator === 'GTE' && blockerVal < refVal) matchesDisqualified = false;
                if (comp.operator === 'GT' && blockerVal <= refVal) matchesDisqualified = false;
                if (comp.operator === 'EQ' && blockerVal !== refVal) matchesDisqualified = false;
              } else {
                matchesDisqualified = false;
              }
            } else {
              matchesDisqualified = false;
            }
          }
          if (matchesDisqualified) return false;
        }
      }
    }
  }

  if (isActionRestricted(state, 'CANNOT_BLOCK', stack.owner, stack, { actionType: 'BLOCK' })) {
    return false;
  }

  return true;
}

export function matchesTargetFilter(tf, stack, sourceSt = null, controller = null, context = null) {
  if (!stack) return false;
  if (tf === undefined || tf === null) return true;

  const top = stack.top || stack.card || stack;
  const sId = stack.id || stack.stackId;
  const cId = top?.id || stack.id;

  if (typeof tf === 'string') {
    const key = tf.trim();
    if (key === 'self') {
      if (!sourceSt) return false;
      const srcId = sourceSt.id || sourceSt.stackId;
      const srcCardId = sourceSt.top?.id || sourceSt.card?.id;
      return Boolean((sId && srcId && sId === srcId) || (cId && srcCardId && cId === srcCardId));
    }
    if (key === 'target' || key === 'PREVIOUS_TARGET' || key === 'previous_target') {
      const ref = context?.previousTarget || context?.target;
      if (!ref) return false;
      const refStackId = ref.id || ref.stackId;
      const refCardId = ref.top?.id || ref.card?.id || ref.id;
      return Boolean((sId && refStackId && sId === refStackId) || (cId && refCardId && cId === refCardId));
    }
    if (key === 'all' || key === 'ALL') return true;
    return false;
  }

  if (typeof tf !== 'object') return false;

  const srcId = sourceSt?.id || sourceSt?.stackId;
  const srcCardId = sourceSt?.top?.id || sourceSt?.card?.id;
  const isSelf = Boolean(sourceSt && ((sId && srcId && sId === srcId) || (cId && srcCardId && cId === srcCardId)));

  if (tf.excludeSelf && isSelf) return false;

  if (tf.target && typeof tf.target === 'string') {
    if (!matchesTargetFilter(tf.target, stack, sourceSt, controller, context)) return false;
  }

  if (tf.side && tf.side !== 'both' && stack.owner && controller) {
    if (!(tf.includeSelf && isSelf)) {
      if (tf.side === 'self' && stack.owner !== controller) return false;
      if (tf.side === 'opp' && stack.owner === controller) return false;
    }
  }

  if (tf.type && top.type !== tf.type) return false;
  if (Array.isArray(tf.types) && tf.types.length > 0) {
    const topType = top.type || '';
    if (!tf.types.some(t => topType.includes(t) || t.includes(topType))) return false;
  }
  if (tf.color) {
    const cols = Array.isArray(top.colors) ? top.colors : [top.color || 'Red'];
    if (!cols.some(c => c && c.toLowerCase() === tf.color.toLowerCase())) return false;
  }
  const effectiveFamilies = context?.state
    ? computeFamilies(context.state, stack)
    : (Array.isArray(top.families) ? top.families : (top.family ? [top.family] : []));
  const hasAllTeams = effectiveFamilies.includes('*ALL_TEAMS*');

  if (tf.team) {
    if (!hasAllTeams && !effectiveFamilies.some(f => f && f.toLowerCase().includes(tf.team.toLowerCase()))) return false;
  }
  if (tf.family) {
    if (!hasAllTeams && !effectiveFamilies.some(f => f && f.toLowerCase().includes(tf.family.toLowerCase()))) return false;
  }
  if (Array.isArray(tf.families) && tf.families.length > 0) {
    if (!hasAllTeams && !tf.families.some(reqFam => effectiveFamilies.some(f => f && f.toLowerCase().includes(reqFam.toLowerCase())))) return false;
  }
  const candidateNames = [top.name || ''];
  if (context?.state && Array.isArray(context.state.modifiers)) {
    for (const mod of context.state.modifiers) {
      if (mod.type === 'TREAT_NAME' && mod.treatedAsName && isModifierApplicable(mod, stack, context.state)) {
        candidateNames.push(mod.treatedAsName);
      }
    }
  }
  if (tf.name) {
    if (!candidateNames.some(n => n.toLowerCase().includes(tf.name.toLowerCase()))) return false;
  }
  if (Array.isArray(tf.names) && tf.names.length > 0) {
    if (!tf.names.some(reqN => candidateNames.some(n => n.toLowerCase().includes(reqN.toLowerCase())))) return false;
  }
  if (Array.isArray(tf.excludeNames) && tf.excludeNames.length > 0) {
    if (tf.excludeNames.some(exN => candidateNames.some(n => n.toLowerCase().includes(exN.toLowerCase())))) return false;
  }
  const effectiveCosts = [top.cost || 0];
  if (context?.state && Array.isArray(context.state.modifiers)) {
    for (const mod of context.state.modifiers) {
      if (mod.type === 'TREAT_COST' && typeof mod.treatedCost === 'number' && isModifierApplicable(mod, stack, context.state)) {
        effectiveCosts.push(mod.treatedCost);
      }
    }
  }
  if (tf.costLte !== undefined && !effectiveCosts.some(c => c <= tf.costLte)) return false;
  if (tf.costGte !== undefined && !effectiveCosts.some(c => c >= tf.costGte)) return false;

  if (tf.bpLte !== undefined || tf.bpGte !== undefined) {
    const bp = context?.state ? computeEffectiveBP(context.state, stack) : (stack.effectiveBp ?? top.bp ?? 0);
    if (tf.bpLte !== undefined && bp > tf.bpLte) return false;
    if (tf.bpGte !== undefined && bp < tf.bpGte) return false;
  }
  if (tf.levelLte !== undefined || tf.levelGte !== undefined) {
    const level = context?.state ? computeLevel(stack, context.state) : (stack.level ?? 1);
    if (tf.levelLte !== undefined && level > tf.levelLte) return false;
    if (tf.levelGte !== undefined && level < tf.levelGte) return false;
  }
  if (tf.exhausted !== undefined && Boolean(stack.exhausted) !== Boolean(tf.exhausted)) return false;
  if (tf.hasSoulCore !== undefined && ((stack.cores?.soul || 0) > 0) !== Boolean(tf.hasSoulCore)) return false;

  return true;
}

function isSourceInOtherZone(state, mod) {
  if (!mod?.sourceCardId || !state?.players) return false;
  const reqZone = mod.sourceZone || 'field';
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    if (!p) continue;
    if (reqZone !== 'field' && (p.field || []).some(st => st?.top?.id === mod.sourceCardId)) return true;
    for (const z of ['grave', 'hand', 'removed', 'deck']) {
      if (z !== reqZone && Array.isArray(p[z]) && p[z].some(c => c && c.id === mod.sourceCardId)) return true;
    }
    if (reqZone !== 'burst' && p.burst?.id === mod.sourceCardId) return true;
    if (reqZone !== 'mirage' && p.mirage?.id === mod.sourceCardId) return true;
  }
  return false;
}

export function isModifierApplicable(mod, stack, state = null) {
  if (!mod || !stack) return false;
  if (state) {
    const isWhileInZone = String(mod.duration || '').toUpperCase() === 'WHILE_SOURCE_IN_ZONE';
    if ((mod.requireSourceOnField || (isWhileInZone && isSourceInOtherZone(state, mod))) && !isSourceInRequiredZone(state, mod)) {
      return false;
    }
  }
  const sId = stack.id || stack.stackId;
  const cId = stack.top?.id || stack.card?.id || stack.id;
  if (mod.targetStackId && mod.targetStackId !== sId && mod.targetStackId !== cId) {
    return false;
  }
  if (mod.targetCardId && mod.targetCardId !== cId && mod.targetCardId !== sId) {
    return false;
  }
  if (mod.side && mod.side !== 'both' && stack.owner && mod.side !== stack.owner) {
    return false;
  }
  if (mod.targetFilter) {
    if (!matchesTargetFilter(mod.targetFilter, stack, mod.sourceStackId ? { id: mod.sourceStackId } : null, mod.side, state ? { state } : null)) {
      return false;
    }
  }
  return true;
}

export class CircularContinuousDependencyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CircularContinuousDependencyError';
    this.code = 'CIRCULAR_CONTINUOUS_DEPENDENCY';
    this.cycle = details.cycle || [];
  }
}

function getModifierLayerRank(mod) {
  const t = String(mod?.type || '').toUpperCase();
  if (t === 'SET_LEVEL' || t === 'SET_BP' || t === 'SET_SYMBOL' || t === 'TREAT_RULE' || t === 'TREAT_LEVEL') {
    return 1; // Layer 1: Set / Treat overrides
  }
  if (mod?.multiplier !== undefined && mod?.multiplier !== null) {
    return 3; // Layer 3: Multiplicative modifiers
  }
  return 2; // Layer 2: Additive / Subtractive / Keyword grants
}

/**
 * Deterministically orders modifiers by (layerRank, timestamp/seq, id)
 * so evaluation does not depend on arbitrary object insertion order.
 */
export function sortModifiersByLayer(modifiers = []) {
  return [...modifiers]
    .map((mod, idx) => ({ mod, idx }))
    .sort((a, b) => {
      const rankDiff = getModifierLayerRank(a.mod) - getModifierLayerRank(b.mod);
      if (rankDiff !== 0) return rankDiff;
      const tsA = typeof a.mod?.timestamp === 'number' ? a.mod.timestamp : a.idx;
      const tsB = typeof b.mod?.timestamp === 'number' ? b.mod.timestamp : b.idx;
      if (tsA !== tsB) return tsA - tsB;
      return String(a.mod?.id || '').localeCompare(String(b.mod?.id || ''));
    })
    .map(entry => entry.mod);
}

function isSourceInRequiredZone(state, mod) {
  if (!mod.sourceCardId || !state?.players) return true;
  const zone = mod.sourceZone || 'field';
  for (const side of ['player', 'opponent']) {
    const p = state.players[side];
    if (!p) continue;
    if (zone === 'field' && (p.field || []).some(st => st.top?.id === mod.sourceCardId)) return true;
    if (zone !== 'field' && Array.isArray(p[zone]) && p[zone].some(c => c.id === mod.sourceCardId)) return true;
  }
  return false;
}

/**
 * Prunes expired modifiers at explicit lifecycle boundaries:
 * 'EFFECT' | 'BATTLE' | 'ATTACK' | 'STEP' | 'TURN' | 'SOURCE_DEPARTURE'
 */
export function pruneExpiredModifiers(state, boundary, context = {}) {
  if (!state || !Array.isArray(state.modifiers)) return 0;
  const before = state.modifiers.length;

  state.modifiers = state.modifiers.filter(mod => {
    if (!mod) return false;
    const dur = String(mod.duration || '').toUpperCase();
    if (dur === 'PERMANENT') return true;

    if (boundary === 'EFFECT') {
      return dur !== 'INSTANT' && dur !== 'UNTIL_END_OF_EFFECT';
    }
    if (boundary === 'BATTLE') {
      return dur !== 'THIS_BATTLE' && dur !== 'UNTIL_END_OF_BATTLE';
    }
    if (boundary === 'ATTACK') {
      return dur !== 'THIS_ATTACK' && dur !== 'UNTIL_END_OF_ATTACK' && dur !== 'THIS_BATTLE' && dur !== 'UNTIL_END_OF_BATTLE';
    }
    if (boundary === 'STEP') {
      return dur !== 'THIS_STEP' && dur !== 'UNTIL_END_OF_STEP';
    }
    if (boundary === 'TURN') {
      if (
        dur === 'THIS_TURN' || dur === 'UNTIL_END_OF_TURN' ||
        dur === 'THIS_BATTLE' || dur === 'UNTIL_END_OF_BATTLE' ||
        dur === 'THIS_ATTACK' || dur === 'UNTIL_END_OF_ATTACK' ||
        dur === 'THIS_STEP' || dur === 'UNTIL_END_OF_STEP'
      ) {
        return false;
      }
      if (dur === 'UNTIL_START_OF_NEXT_TURN') {
        const nextTurn = context.nextTurnNumber ?? state.turnNumber;
        const nextActive = context.nextActivePlayer ?? state.activePlayer;
        if (typeof mod.expiresOnTurn === 'number' && nextTurn >= mod.expiresOnTurn) return false;
        if (mod.expiresForPlayer && nextActive === mod.expiresForPlayer) return false;
      }
    }
    if (boundary === 'SOURCE_DEPARTURE' || dur === 'WHILE_SOURCE_IN_ZONE') {
      if (dur === 'WHILE_SOURCE_IN_ZONE' && !isSourceInRequiredZone(state, mod)) {
        return false;
      }
    }
    return true;
  });

  return before - state.modifiers.length;
}

/**
 * Central effective characteristics calculation with cycle protection and deterministic
 * state-fingerprint caching.
 */
export function computeEffectiveCharacteristics(state, stack, evalContext = null) {
  if (!stack || !stack.top) {
    return null;
  }

  const ctx = evalContext || { activeIds: new Set() };
  const stackKey = stack.id || stack.top.id;
  if (ctx.activeIds.has(stackKey)) {
    throw new CircularContinuousDependencyError(
      `Circular continuous effect dependency detected on ${stackKey}`,
      { cycle: [...ctx.activeIds, stackKey] }
    );
  }

  // Deterministic state fingerprint for safe caching (includes source-in-zone active status & stack attachments)
  const modSig = (state?.modifiers || [])
    .map(m => `${m.id || ''}:${m.type}:${m.amount ?? m.bp ?? m.setLevel ?? ''}:${m.duration || ''}:${isSourceInRequiredZone(state, m) ? 1 : 0}`)
    .join('|');
  const braveSig = (stack.braves || []).map(b => b?.id || '').join(',');
  const underSig = (stack.under || []).map(u => u?.id || '').join(',');
  const pCounters = `${state?.players?.player?.counters || 0}/${state?.players?.opponent?.counters || 0}:${state?.players?.player?.hand?.length || 0}/${state?.players?.opponent?.hand?.length || 0}`;
  const fingerprint = `${state?.turnNumber || 0}:${state?.step || ''}:${state?.activePlayer || ''}:${stack.cores?.normal || 0}:${stack.cores?.soul || 0}:${stack.state || ''}:${braveSig}:${underSig}:${pCounters}:${state?.combat?.attackerStackId || ''}:${state?.combat?.blockerStackId || ''}:${modSig}`;

  if (state && !state._continuousCache) {
    Object.defineProperty(state, '_continuousCache', {
      value: new Map(),
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  const cached = state?._continuousCache?.get(stackKey);
  if (cached && cached.fingerprint === fingerprint) {
    return cached.value;
  }

  ctx.activeIds.add(stackKey);
  try {
    // Check circular modifier dependencies explicitly declared on modifiers
    for (const mod of state?.modifiers || []) {
      if (mod.dependsOn && mod.dependsOn === mod.id) {
        throw new CircularContinuousDependencyError(`Self-referential modifier dependency: ${mod.id}`, { cycle: [mod.id] });
      }
    }

    const level = computeLevel(stack, state);
    const baseBP = computeBaseBP(stack, state);
    const effectiveBP = computeEffectiveBP(state, stack);
    const symbols = computeSymbols(state, stack);
    const colors = computeColors(state, stack);
    const families = computeFamilies(state, stack);
    const keywords = getActiveStackKeywords(stack, state);

    const result = {
      printedCost: typeof stack.top.cost === 'number' ? stack.top.cost : parseInt(stack.top.cost || '0', 10),
      effectiveLevel: level,
      baseBP,
      effectiveBP,
      symbols,
      colors,
      families,
      keywords,
      canAttack: canAttack(state, stack),
      canBlock: canBlock(state, stack)
    };

    if (state?._continuousCache) {
      state._continuousCache.set(stackKey, { fingerprint, value: result });
    }
    return result;
  } finally {
    ctx.activeIds.delete(stackKey);
  }
}

export const RESTRICTION_SPECIFICATIONS = Object.freeze({
  CANNOT_ATTACK: { category: 'CANNOT_ATTACK', prohibitedAction: 'Declare attack with affected Spirit/Ultimate', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ATTACK'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_BLOCK: { category: 'CANNOT_BLOCK', prohibitedAction: 'Declare block with affected Spirit/Ultimate', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ATTACK'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_ATTACK_OR_BLOCK: { category: 'CANNOT_ATTACK_OR_BLOCK', prohibitedAction: 'Declare attack or block with affected Spirit/Ultimate', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ATTACK'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_EXHAUST: { category: 'CANNOT_EXHAUST', prohibitedAction: 'Exhaust affected stack (effect or cost per modifier config)', scope: 'STACK', appliesToCosts: true, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_REFRESH: { category: 'CANNOT_REFRESH', prohibitedAction: 'Refresh affected exhausted stack (step or effect)', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['REFRESH', 'ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_SUMMON: { category: 'CANNOT_SUMMON', prohibitedAction: 'Summon Spirit/Brave/Ultimate matching filter/zone', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['MAIN', 'ATTACK', 'FLASH'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_DEPLOY_NEXUS: { category: 'CANNOT_DEPLOY_NEXUS', prohibitedAction: 'Deploy Nexus card to the field', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['MAIN', 'ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_USE_MAGIC: { category: 'CANNOT_USE_MAGIC', prohibitedAction: 'Use/play Magic cards (all or color-filtered)', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'VOLUNTARY_ONLY', affectedSide: 'BOTH', timingWindows: ['MAIN', 'FLASH', 'ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  PREVENT_FLASH_HAND: { category: 'PREVENT_FLASH_HAND', prohibitedAction: 'Use/activate Magic or Flash abilities from hand during Flash timing', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'VOLUNTARY_ONLY', affectedSide: 'BOTH', timingWindows: ['FLASH'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_ACTIVATE_ABILITY: { category: 'CANNOT_ACTIVATE_ABILITY', prohibitedAction: 'Initiate/declare a voluntary activated ability on the field/hand', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'VOLUNTARY_ONLY', affectedSide: 'BOTH', timingWindows: ['MAIN', 'FLASH', 'ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_USE_ABILITY: { category: 'CANNOT_USE_ABILITY', prohibitedAction: 'Resolve or execute an ability effect (including triggered abilities)', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_ACTIVATE_BURST: { category: 'CANNOT_ACTIVATE_BURST', prohibitedAction: 'Activate a set Burst card upon condition trigger', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_SET_BURST: { category: 'CANNOT_SET_BURST', prohibitedAction: 'Set a Burst card face-down into the Burst Zone', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'VOLUNTARY_ONLY', affectedSide: 'BOTH', timingWindows: ['MAIN', 'ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_MOVE: { category: 'CANNOT_MOVE', prohibitedAction: 'Controller/actor initiates core transfer or card zone relocation', scope: 'PLAYER', appliesToCosts: true, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_BE_MOVED: { category: 'CANNOT_BE_MOVED', prohibitedAction: 'Target field stack or Nexus is prevented from leaving via non-destroy/non-bounce move', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'FORCED_ONLY', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_BE_TARGETED: { category: 'CANNOT_BE_TARGETED', prohibitedAction: 'Select target stack or card for opposing/effect targeting', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_BE_DESTROYED: { category: 'CANNOT_BE_DESTROYED', prohibitedAction: 'Destroy target field stack or Nexus via battle/effects', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'FORCED_ONLY', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_BE_RETURNED: { category: 'CANNOT_BE_RETURNED', prohibitedAction: 'Return target stack or Nexus to hand/deck (bounce)', scope: 'STACK', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'FORCED_ONLY', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_DRAW: { category: 'CANNOT_DRAW', prohibitedAction: 'Draw cards into hand via effects (excluding forced Draw Step unless specified)', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_DISCARD: { category: 'CANNOT_DISCARD', prohibitedAction: 'Discard cards from hand (respecting applyTo EFFECT_ONLY vs COST_ONLY)', scope: 'PLAYER', appliesToCosts: true, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_MILL: { category: 'CANNOT_MILL', prohibitedAction: 'Discard cards directly from deck via mill/deck destruction effects', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'BOTH', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: false },
  CANNOT_LOSE_LIFE: { category: 'CANNOT_LOSE_LIFE', prohibitedAction: 'Reduce player life points via damage or life-loss effects (unless unpreventable)', scope: 'PLAYER', appliesToCosts: false, appliesToEffects: true, voluntaryVsForced: 'FORCED_ONLY', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: true },
  CANNOT_LOSE_CORES: { category: 'CANNOT_LOSE_CORES', prohibitedAction: 'Deplete/remove cores from protected Spirit/player (respecting applyToCosts/unpreventable)', scope: 'STACK', appliesToCosts: true, appliesToEffects: true, voluntaryVsForced: 'FORCED_ONLY', affectedSide: 'BOTH', timingWindows: ['ALL'], requiresSourceInZone: true, bypassableByUnpreventable: true }
});

function matchesRestrictionAction(mod, want, state, side, stackOrCard, actionContext = {}) {
  const mType = String(mod.type || '').toUpperCase();
  const mRestr = String(mod.restriction || mod.restrictionType || mod.rule || '').toUpperCase();

  const effectiveRestr = mType === 'SET_RESTRICTION' || mType === 'OPPONENT_RESTRICTION' || mType === 'RESTRICTION' || mType === 'MAGIC_RESTRICTION' || mType === 'COMBAT_RESTRICTION' || mType === 'GLOBAL_RESTRICTION'
    ? (mRestr || mType)
    : mType;

  if (want === 'CANNOT_ATTACK') {
    return effectiveRestr === 'CANNOT_ATTACK' || effectiveRestr === 'CANNOT_ATTACK_OR_BLOCK' || effectiveRestr === 'CANNOT_ATTACK_NOR_BLOCK' || Boolean(mod.cannotAttack);
  }
  if (want === 'CANNOT_BLOCK') {
    return effectiveRestr === 'CANNOT_BLOCK' || effectiveRestr === 'CANNOT_ATTACK_OR_BLOCK' || effectiveRestr === 'CANNOT_ATTACK_NOR_BLOCK' || Boolean(mod.cannotBlock);
  }
  if (want === 'CANNOT_EXHAUST') return effectiveRestr === 'CANNOT_EXHAUST' || mType === 'EXHAUST_LOCK';
  if (want === 'CANNOT_REFRESH') return effectiveRestr === 'CANNOT_REFRESH' || mType === 'CANNOT_REFRESH' || mType === 'REFRESH_LOCK';
  if (want === 'CANNOT_DRAW') return effectiveRestr === 'CANNOT_DRAW' || mType === 'DRAW_LOCK';
  if (want === 'CANNOT_ACTIVATE_BURST') return effectiveRestr === 'CANNOT_ACTIVATE_BURST' || mType === 'BURST_LOCK';
  if (want === 'CANNOT_SET_BURST') return effectiveRestr === 'CANNOT_SET_BURST';
  if (want === 'CANNOT_SUMMON') {
    if (effectiveRestr !== 'CANNOT_SUMMON') return false;
    const cType = stackOrCard?.top?.type || stackOrCard?.type || actionContext?.cardType;
    if (mod.cardType && cType && String(mod.cardType).toLowerCase() !== String(cType).toLowerCase()) return false;
    if (mod.fromZone && actionContext?.fromZone && String(mod.fromZone).toLowerCase() !== String(actionContext.fromZone).toLowerCase()) return false;
    return true;
  }
  if (want === 'CANNOT_DEPLOY_NEXUS') return effectiveRestr === 'CANNOT_DEPLOY_NEXUS';
  if (want === 'CANNOT_USE_MAGIC' || want === 'PREVENT_MAGIC') {
    if (effectiveRestr === 'CANNOT_USE_MAGIC' || effectiveRestr === 'PREVENT_MAGIC') return true;
    if (effectiveRestr === 'PREVENT_MAGIC_MATCHING_TRASH_COLOR' && stackOrCard && state?.players) {
      const oppSide = side === 'player' ? 'opponent' : 'player';
      const oppGrave = state.players[oppSide]?.grave || [];
      const cardCols = computeColors(state, stackOrCard).map(c => String(c).toLowerCase());
      return oppGrave.some(g => {
        const gCols = Array.isArray(g.colors) ? g.colors : (g.color ? [g.color] : []);
        return gCols.some(gc => cardCols.includes(String(gc).toLowerCase()));
      });
    }
    return false;
  }
  if (want === 'PREVENT_FLASH_HAND') {
    return effectiveRestr === 'PREVENT_FLASH_HAND';
  }
  if (want === 'CANNOT_USE_ACCEL') {
    return effectiveRestr === 'CANNOT_USE_ACCEL' || effectiveRestr === 'PREVENT_ACCEL';
  }
  if (want === 'CANNOT_ACTIVATE_ABILITY') {
    if (effectiveRestr === 'CANNOT_ACTIVATE_ABILITY') return true;
    if (effectiveRestr === 'CANNOT_USE_ABILITY' && mod.alsoBlocksActivation === true) return true;
    if (effectiveRestr === 'PREVENT_FLASH_HAND' && String(actionContext?.fromZone || '').toLowerCase() === 'hand' && String(actionContext?.timingWindow || '').toUpperCase().includes('FLASH')) return true;
    return false;
  }
  if (want === 'CANNOT_USE_ABILITY') {
    if (effectiveRestr === 'CANNOT_USE_ABILITY') return true;
    if (effectiveRestr === 'CANNOT_ACTIVATE_ABILITY' && (actionContext?.isVoluntaryActivation === true || mod.blockResolution === true)) return true;
    return false;
  }
  if (want === 'CANNOT_MOVE') {
    return effectiveRestr === 'CANNOT_MOVE';
  }
  if (want === 'CANNOT_BE_MOVED') {
    return effectiveRestr === 'CANNOT_BE_MOVED';
  }
  if (want === 'CANNOT_BE_TARGETED') return effectiveRestr === 'CANNOT_BE_TARGETED';
  if (want === 'CANNOT_BE_DESTROYED') return effectiveRestr === 'CANNOT_BE_DESTROYED';
  if (want === 'CANNOT_BE_RETURNED') return effectiveRestr === 'CANNOT_BE_RETURNED';
  if (want === 'CANNOT_LOSE_LIFE') return effectiveRestr === 'CANNOT_LOSE_LIFE' || mType === 'PREVENT_LIFE_LOSS' || mType === 'PREVENT_DAMAGE';
  if (want === 'CANNOT_LOSE_CORES') return effectiveRestr === 'CANNOT_LOSE_CORES';
  if (want === 'CANNOT_DISCARD') return effectiveRestr === 'CANNOT_DISCARD';
  if (want === 'CANNOT_MILL') return effectiveRestr === 'CANNOT_MILL' || effectiveRestr === 'DECK_DESTRUCTION_IMMUNITY' || effectiveRestr === 'PREVENT_MILL';
  if (want === 'CANNOT_GAIN_CORES_FROM_VOID') return effectiveRestr === 'CANNOT_GAIN_CORES_FROM_VOID';
  if (want === 'RESTRICT_MAIN_STEP') return effectiveRestr === 'RESTRICT_MAIN_STEP' || mType === 'RESTRICT_MAIN_STEP';
  return effectiveRestr === want;
}

/**
 * Authoritative restriction check across all engine subsystems.
 */
export function isActionRestricted(state, actionType, side, stackOrCard = null, actionContext = {}) {
  if (!state || !Array.isArray(state.modifiers)) return false;
  const want = String(actionType || '').toUpperCase();
  const sId = stackOrCard?.id || stackOrCard?.stackId || null;
  const cId = stackOrCard?.top?.id || stackOrCard?.card?.id || stackOrCard?.id || null;

  if (want === 'CANNOT_BE_TARGETED' && stackOrCard && isTargetProtectedFrom(state, stackOrCard, 'target', actionContext?.sourceCard || null, actionContext)) {
    return true;
  }
  if (want === 'CANNOT_BE_DESTROYED' && stackOrCard && isTargetProtectedFrom(state, stackOrCard, 'destroy', actionContext?.sourceCard || null, actionContext)) {
    return true;
  }
  if (want === 'CANNOT_BE_RETURNED' && stackOrCard && isTargetProtectedFrom(state, stackOrCard, 'bounce', actionContext?.sourceCard || null, actionContext)) {
    return true;
  }
  if (want === 'CANNOT_BE_MOVED' && stackOrCard && isTargetProtectedFrom(state, stackOrCard, 'move', actionContext?.sourceCard || null, actionContext)) {
    return true;
  }
  if (want === 'CANNOT_LOSE_CORES' && stackOrCard && isTargetProtectedFrom(state, stackOrCard, 'deplete', actionContext?.sourceCard || null, actionContext)) {
    return true;
  }

  return state.modifiers.some(mod => {
    if (!mod) return false;
    if ((String(mod.duration || '').toUpperCase() === 'WHILE_SOURCE_IN_ZONE' || mod.requireSourceOnField) && !isSourceInRequiredZone(state, mod)) {
      return false;
    }
    if (mod.applyTo === 'EFFECT_ONLY' && actionContext?.isCost) return false;
    if (mod.applyTo === 'COST_ONLY' && !actionContext?.isCost) return false;
    if (mod.applyToCosts === false && actionContext?.isCost) return false;
    if (actionContext?.unpreventable && (want === 'CANNOT_LOSE_LIFE' || mod.preventable !== false)) {
      if (want === 'CANNOT_LOSE_LIFE') return false;
    }

    if (!matchesRestrictionAction(mod, want, state, side, stackOrCard, actionContext)) return false;
    if (mod.side && mod.side !== 'both' && side && mod.side !== side) return false;
    if (mod.targetStackId && sId && mod.targetStackId !== sId && mod.targetStackId !== cId) return false;
    if (mod.targetCardId && cId && mod.targetCardId !== cId && mod.targetCardId !== sId) return false;
    if (typeof mod.maxCost === 'number' && stackOrCard) {
      const cardCost = Number(stackOrCard.top?.cost ?? stackOrCard.cost ?? 0);
      if (cardCost > mod.maxCost) return false;
    }
    if (mod.timingWindow && actionContext?.timingWindow && String(mod.timingWindow).toUpperCase() !== String(actionContext.timingWindow).toUpperCase()) {
      return false;
    }
    if (mod.targetFilter && stackOrCard) {
      return matchesTargetFilter(mod.targetFilter, stackOrCard, null, mod.side, { state });
    }
    return true;
  });
}

/**
 * Authoritative immunity / protection check distinguishing destruction, bounce,
 * targeting, movement, core depletion, and general opposing effect immunity.
 */
export function isTargetProtectedFrom(state, stackOrCard, effectType = 'effect', sourceCard = null, options = {}) {
  if (!state || !stackOrCard) return false;
  const rawEff = String(effectType || 'effect').toLowerCase();
  const eff = rawEff === 'cannot_be_destroyed' ? 'destroy'
    : (rawEff === 'cannot_be_returned' || rawEff === 'return') ? 'bounce'
    : (rawEff === 'cannot_be_targeted') ? 'target'
    : (rawEff === 'cannot_be_moved') ? 'move'
    : (rawEff === 'cannot_lose_cores' || rawEff === 'lose_cores') ? 'deplete'
    : rawEff;

  const stack = stackOrCard.top ? stackOrCard : { top: stackOrCard, id: stackOrCard.id, owner: stackOrCard.owner };
  const sId = stack.id || stack.stackId;
  const cId = stack.top?.id || stack.id;

  if (options.unpreventable && !options.respectImmunity && eff !== 'target' && eff !== 'move') {
    return false;
  }

  // LOSE_IMMUNITY cancels protection for affected stacks
  const lostAllImmunity = (state.modifiers || []).some(mod =>
    mod && mod.type === 'LOSE_IMMUNITY' && isModifierApplicable(mod, stack, state) &&
    (!mod.colors || mod.colors.length === 0 || mod.loseAll)
  );
  if (lostAllImmunity) {
    return false;
  }

  // PIERCING_RULE: destruction can ONLY be prevented by "Armor"-named effects (Armor / Heavy Armor / Ultra Armor)
  const piercingRule = options.piercingRule || (eff === 'destroy' && (state.modifiers || []).find(mod =>
    mod && mod.type === 'PIERCING_RULE' &&
    (!mod.side || mod.side === 'both' || mod.side === (sourceCard?.owner || options.sourceSide))
  ));

  for (const mod of state.modifiers || []) {
    if (!mod) continue;
    if ((String(mod.duration || '').toUpperCase() === 'WHILE_SOURCE_IN_ZONE' || mod.requireSourceOnField) && !isSourceInRequiredZone(state, mod)) {
      continue;
    }
    if (mod.targetStackId && mod.targetStackId !== sId && mod.targetStackId !== cId) continue;
    if (mod.targetCardId && mod.targetCardId !== cId && mod.targetCardId !== sId) continue;
    if (mod.side && mod.side !== 'both' && stack.owner && mod.side !== stack.owner) continue;
    if (mod.targetFilter && !matchesTargetFilter(mod.targetFilter, stack, null, mod.side, { state })) continue;

    if (piercingRule && eff === 'destroy') {
      continue; // Non-Armor modifier protections cannot prevent destruction under PIERCING_RULE
    }

    if (mod.type === 'INDESTRUCTIBLE' && eff === 'destroy') {
      const by = Array.isArray(mod.by) ? mod.by : [mod.by || 'ALL'];
      if (by.includes('ALL') || by.includes('EFFECTS')) return true;
      const isOpposing = sourceCard && stack.owner && (sourceCard.owner || sourceCard.controller) !== stack.owner;
      if ((by.includes('OPPOSING_EFFECTS') || by.includes('OPPONENT')) && (isOpposing || !sourceCard)) return true;
      if (options.cause === 'battle' && (by.includes('BATTLE') || by.includes('BP_COMPARISON'))) return true;
    }
    if (mod.type === 'PROTECTION') {
      if (mod.protectAll) return true;
      if (eff === 'destroy' && mod.cannotBeDestroyed) return true;
      if (eff === 'bounce' && (mod.cannotBeBounced || mod.cannotBeReturned)) return true;
      if (eff === 'target' && mod.cannotBeTargeted) return true;
      if (eff === 'move' && mod.cannotBeMoved) return true;
      if (eff === 'deplete' && mod.cannotBeDepleted) return true;
    }
    if (mod.type === 'SET_RESTRICTION') {
      const r = String(mod.restriction || '').toUpperCase();
      if (eff === 'destroy' && r === 'CANNOT_BE_DESTROYED') return true;
      if (eff === 'bounce' && r === 'CANNOT_BE_RETURNED') return true;
      if (eff === 'target' && r === 'CANNOT_BE_TARGETED') return true;
      if (eff === 'move' && r === 'CANNOT_BE_MOVED') return true;
      if (eff === 'deplete' && r === 'CANNOT_LOSE_CORES') return true;
    }
    if (mod.type === 'IMMUNITY' && !options.skipEffectImmunity) {
      const scope = String(mod.immuneTo || 'OPPOSING_EFFECTS').toUpperCase();
      if (scope === 'ALL' || scope === 'OPPOSING_EFFECTS' || scope === eff.toUpperCase()) {
        if (!sourceCard || !stack.owner || (sourceCard.owner || sourceCard.controller) !== stack.owner) {
          return true;
        }
      }
    }
  }

  if (sourceCard && !options.skipEffectImmunity && isImmune(state, stack, sourceCard, eff, options)) {
    return true;
  }
  return false;
}
