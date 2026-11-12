/**
 * engine/cards/condition_dsl.js
 *
 * Battle Spirits Eternal — Two-Tier Per-Card Handler Engine (DSL)
 *
 * Tier 1: Overall Conditions (Outer Event Triggers & Phase/Step Windows)
 *   Routes execution by macro game event or turn phase:
 *   WHEN_SUMMONED, WHEN_DEPLOYED, WHEN_ATTACKS, WHEN_BLOCKS, WHEN_BATTLES,
 *   WHEN_DESTROYED, START_STEP, CORE_STEP, DRAW_STEP, REFRESH_STEP,
 *   MAIN_STEP, ATTACK_STEP, END_STEP, MAIN, FLASH, BURST, AURA_BP, AURA_KEYWORDS
 *
 * Tier 2A: Sub-Internal-Conditions (`cond` & `cost`)
 *   Evaluates level gates ([LV1]/[LV2]/[LV3]), turn ownership (YOUR/OPPONENT/EITHER),
 *   board presence (Family, Color, Symbol counts, Nexus counts), unit state (Soul Core,
 *   Braved, Exhausted, Blocked), Life thresholds, Once-Per-Turn locks, and sub-costs.
 *
 * Tier 2B: Sub-Internal-Effects (`fx`)
 *   Executes deterministic atomic mutations (BP buff/scaling, Void core ramp, core drain
 *   with 0-core depletion checks, BP/Cost/State destruction, Hand/Deck bounce, Refresh,
 *   Exhaust, Draw, Mill/Crush, Trash Salvage/Reanimate, Keyword/Unblockable grants,
 *   Damage Walls, and Attack Step termination) with chained "ifYouDo" support.
 */

import { PerCardRegistry } from './registry.js';

export const SagaConditionDSL = (() => {
  function getFriendlyState(ctx) {
    if (!ctx || !ctx.duelState) return null;
    return ctx.side === 'player' ? ctx.duelState.player : ctx.duelState.opponent;
  }

  function getEnemyState(ctx) {
    if (!ctx || !ctx.duelState) return null;
    return ctx.side === 'player' ? ctx.duelState.opponent : ctx.duelState.player;
  }

  function getEnemySide(ctx) {
    return ctx.side === 'player' ? 'opponent' : 'player';
  }

  function log(ctx, msg, type = 'magic') {
    if (ctx && ctx.arenaApi && typeof ctx.arenaApi.addLog === 'function') {
      ctx.arenaApi.addLog(msg, type);
    }
  }

  function audio(ctx, soundName) {
    if (ctx && ctx.arenaApi && ctx.arenaApi.AudioFX && typeof ctx.arenaApi.AudioFX[soundName] === 'function') {
      ctx.arenaApi.AudioFX[soundName]();
    }
  }

  function render(ctx) {
    if (ctx && ctx.arenaApi) {
      if (typeof ctx.arenaApi.renderDuelTable === 'function') ctx.arenaApi.renderDuelTable();
      if (ctx.side === 'player' && typeof ctx.arenaApi.renderPlayerHand === 'function') {
        ctx.arenaApi.renderPlayerHand();
      }
    }
  }

  function recalcBp(ctx, spirit) {
    if (!spirit) return;
    if (ctx && ctx.arenaApi && typeof ctx.arenaApi.recalculateSpiritBp === 'function') {
      ctx.arenaApi.recalculateSpiritBp(spirit);
    } else {
      const base = spirit.baseBp || spirit.currentBp || 2000;
      spirit.currentBp = base + (spirit.turnBpBoost || 0) + (spirit.temporaryBpBuff || 0) + (spirit.auraBpBoost || 0);
      if (spirit.battleBpBoost) {
        spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
      }
    }
  }

  function sendToTrash(ctx, card, side, reason) {
    if (!card) return;
    if (ctx && ctx.arenaApi && typeof ctx.arenaApi.sendToTrash === 'function') {
      ctx.arenaApi.sendToTrash(card, side, reason);
    } else if (ctx && ctx.duelState) {
      const st = side === 'player' ? ctx.duelState.player : ctx.duelState.opponent;
      if (st.field) {
        const i = st.field.indexOf(card);
        if (i !== -1) st.field.splice(i, 1);
      }
      if (st.nexus) {
        const ni = st.nexus.indexOf(card);
        if (ni !== -1) st.nexus.splice(ni, 1);
      }
      if (!st.trashCards) st.trashCards = [];
      st.trashCards.push(card);
    }
  }

  function recycleSpiritCores(ctx, spirit, side) {
    if (!spirit || !ctx || !ctx.duelState) return;
    if (ctx.arenaApi && typeof ctx.arenaApi.handleDestroyedSpiritCores === 'function') {
      ctx.arenaApi.handleDestroyedSpiritCores(spirit, side);
    } else {
      const st = side === 'player' ? ctx.duelState.player : ctx.duelState.opponent;
      const cores = spirit.currentCores || 0;
      st.reserve = (st.reserve || 0) + cores;
      spirit.currentCores = 0;
      if (spirit.hasSoulCore) {
        spirit.hasSoulCore = false;
        st.soulCoreLocation = 'reserve';
        st.soulCoreSpiritUid = null;
      }
    }
  }

  // ── UNIT & CARD MATCHING HELPERS ──
  function matchesFamily(card, familyQuery) {
    if (!card || !familyQuery) return false;
    const queries = Array.isArray(familyQuery) ? familyQuery : [familyQuery];
    const famStr = ((card.family || '') + ' ' + (Array.isArray(card.families) ? card.families.join(' ') : '')).toLowerCase();
    return queries.some(q => famStr.includes(String(q).toLowerCase()));
  }

  function matchesColor(card, colorQuery) {
    if (!card || !colorQuery) return false;
    const queries = Array.isArray(colorQuery) ? colorQuery : [colorQuery];
    const colStr = ((card.color || '') + ' ' + (Array.isArray(card.colors) ? card.colors.join(' ') : '')).toLowerCase();
    return queries.some(q => colStr.includes(String(q).toLowerCase()));
  }

  function matchesKeyword(card, kwQuery) {
    if (!card || !kwQuery) return false;
    const queries = Array.isArray(kwQuery) ? kwQuery : [kwQuery];
    const effStr = (card.effect || card.raw_effect || '').toLowerCase();
    const grantedStr = Array.isArray(card.grantedKeywords)
      ? card.grantedKeywords.map(k => (typeof k === 'string' ? k : k.name || '')).join(' ').toLowerCase()
      : '';
    return queries.some(q => {
      const ql = String(q).toLowerCase();
      return effStr.includes(`[${ql}`) || effStr.includes(ql) || grantedStr.includes(ql);
    });
  }

  function hasArmorAgainst(targetUnit, sourceColor) {
    if (!targetUnit || !sourceColor) return false;
    const eff = (targetUnit.effect || '') + ' ' + (Array.isArray(targetUnit.grantedKeywords) ? targetUnit.grantedKeywords.map(k => typeof k === 'string' ? k : (k.name || '')).join(' ') : '');
    const m = eff.match(/\[(?:Heavy\s+)?Armor\s*:\s*([^\]]+)\]/i);
    if (!m) return false;
    const armorColors = m[1].toLowerCase();
    return armorColors.includes(String(sourceColor).toLowerCase()) || armorColors.includes('all');
  }

  function matchesUnitFilter(unit, filter, sourceCard = null) {
    if (!unit) return false;
    if (!filter) return true;
    if (filter.excludeSelf && sourceCard && unit.uid && unit.uid === sourceCard.uid) return false;
    if (filter.type) {
      const t = (unit.type || 'Spirit').toLowerCase();
      if (!t.includes(String(filter.type).toLowerCase())) return false;
    }
    if (filter.color && !matchesColor(unit, filter.color)) return false;
    if (filter.notColor && matchesColor(unit, filter.notColor)) return false;
    if (filter.family && !matchesFamily(unit, filter.family)) return false;
    if (filter.nameContains) {
      const n = (unit.name || '').toLowerCase();
      const queries = Array.isArray(filter.nameContains) ? filter.nameContains : [filter.nameContains];
      if (!queries.some(q => n.includes(String(q).toLowerCase()))) return false;
    }
    if (filter.keyword && !matchesKeyword(unit, filter.keyword)) return false;
    if (filter.withoutKeyword && matchesKeyword(unit, filter.withoutKeyword)) return false;
    if (filter.minCost !== undefined && (unit.cost || 0) < filter.minCost) return false;
    if (filter.maxCost !== undefined && (unit.cost || 0) > filter.maxCost) return false;
    if (filter.exactCost !== undefined && (unit.cost || 0) !== filter.exactCost) return false;
    if (Array.isArray(filter.costIn) && !filter.costIn.includes(unit.cost || 0)) return false;
    const bp = unit.battleBp || unit.currentBp || unit.baseBp || 0;
    if (filter.minBp !== undefined && bp < filter.minBp) return false;
    if (filter.maxBp !== undefined && bp > filter.maxBp) return false;
    if (filter.minLevel !== undefined && (unit.currentLevel || 1) < filter.minLevel) return false;
    if (filter.maxLevel !== undefined && (unit.currentLevel || 1) > filter.maxLevel) return false;
    if (filter.isExhausted !== undefined && Boolean(unit.isExhausted) !== Boolean(filter.isExhausted)) return false;
    return true;
  }

  // ────────────────────────────────────────────────────────────
  // TIER 2A: SUB-INTERNAL-CONDITIONS (`cond`)
  // ────────────────────────────────────────────────────────────
  const cond = {
    level(ctx, levelsOrMin) {
      const card = ctx.card || ctx.sourceCard;
      if (!card) return true;
      if ((card.type || '').toLowerCase() === 'magic') return true;
      const curLv = card.currentLevel !== undefined ? card.currentLevel : 1;
      if (Array.isArray(levelsOrMin)) {
        return levelsOrMin.includes(curLv) || curLv >= Math.min(...levelsOrMin);
      }
      if (typeof levelsOrMin === 'number') {
        return curLv >= levelsOrMin;
      }
      return true;
    },

    turn(ctx, expectedTurn) {
      if (!expectedTurn || expectedTurn === 'EITHER' || expectedTurn === 'ANY') return true;
      const active = (ctx.duelState && ctx.duelState.activePlayer) || ctx.side;
      if (expectedTurn === 'YOUR') return active === ctx.side;
      if (expectedTurn === 'OPPONENT' || expectedTurn === 'OPPOSING') return active !== ctx.side;
      return true;
    },

    hasSoulCore(ctx) {
      const card = ctx.card || ctx.sourceCard;
      return Boolean(card && (card.hasSoulCore || card.usedSoulCore || card.paidWithSoulCore));
    },

    minCores(ctx, min) {
      const card = ctx.card || ctx.sourceCard;
      return Boolean(card && (card.currentCores || 0) >= min);
    },

    isBraved(ctx) {
      const card = ctx.card || ctx.sourceCard;
      return Boolean(ctx.isBraved || (card && (card.brave || card.isBraved || card.braveCard)));
    },

    countUnits(ctx, sideScope, filter) {
      const st = sideScope === 'OPPONENT' ? getEnemyState(ctx) : getFriendlyState(ctx);
      if (!st) return 0;
      const list = filter && filter.type === 'Nexus' ? (st.nexus || []) : (st.field || []);
      return list.filter(u => matchesUnitFilter(u, filter, ctx.card)).length;
    },

    countSymbols(ctx, sideScope, color) {
      const st = sideScope === 'OPPONENT' ? getEnemyState(ctx) : getFriendlyState(ctx);
      if (!st) return 0;
      let total = 0;
      for (const u of [...(st.field || []), ...(st.nexus || [])]) {
        if (!color || matchesColor(u, color)) {
          total += (u.extraSymbols || 0) + 1;
        }
      }
      return total;
    },

    lifeLte(ctx, maxLife) {
      const st = getFriendlyState(ctx);
      return Boolean(st && (st.life !== undefined ? st.life : 5) <= maxLife);
    },

    oncePerTurn(ctx, key = 'default') {
      const card = ctx.card || ctx.sourceCard;
      if (!card) return true;
      if (!card.__sagaOncePerTurn) card.__sagaOncePerTurn = {};
      const turnNum = (ctx.duelState && ctx.duelState.turn) || 1;
      if (card.__sagaOncePerTurn[key] === turnNum) return false;
      card.__sagaOncePerTurn[key] = turnNum;
      return true;
    },

    evaluateAll(ctx, subConditions = {}) {
      if (!subConditions) return true;
      if (subConditions.levels && !cond.level(ctx, subConditions.levels)) return false;
      if (subConditions.minLevel && !cond.level(ctx, subConditions.minLevel)) return false;
      if (subConditions.turn && !cond.turn(ctx, subConditions.turn)) return false;
      if (subConditions.requireSoulCore && !cond.hasSoulCore(ctx)) return false;
      if (subConditions.minCores && !cond.minCores(ctx, subConditions.minCores)) return false;
      if (subConditions.requireBraved && !cond.isBraved(ctx)) return false;
      if (subConditions.requireNotBraved && cond.isBraved(ctx)) return false;
      if (subConditions.requireLifeLte !== undefined && !cond.lifeLte(ctx, subConditions.requireLifeLte)) return false;
      if (subConditions.requireFamilyOnField) {
        const req = subConditions.requireFamilyOnField;
        const cnt = cond.countUnits(ctx, 'SELF', {
          family: req.family,
          color: req.color,
          excludeSelf: Boolean(req.excludeSelf)
        });
        if (cnt < (req.min || 1)) return false;
      }
      if (subConditions.requireColorOnField) {
        const req = subConditions.requireColorOnField;
        const cnt = cond.countUnits(ctx, 'SELF', {
          color: req.color,
          excludeSelf: Boolean(req.excludeSelf)
        });
        if (cnt < (req.min || 1)) return false;
      }
      if (subConditions.requireSymbols) {
        const req = subConditions.requireSymbols;
        if (cond.countSymbols(ctx, 'SELF', req.color) < (req.min || 1)) return false;
      }
      if (subConditions.requireNexus) {
        const req = subConditions.requireNexus;
        const st = getFriendlyState(ctx);
        const nexList = (st && st.nexus) || [];
        const matching = nexList.filter(n => !req.color || matchesColor(n, req.color));
        if (matching.length < (req.min || 1)) return false;
      }
      if (subConditions.oncePerTurn) {
        if (!cond.oncePerTurn(ctx, String(subConditions.oncePerTurn))) return false;
      }
      if (typeof subConditions.customGuard === 'function') {
        if (!subConditions.customGuard(ctx)) return false;
      }
      return true;
    }
  };

  // ────────────────────────────────────────────────────────────
  // TIER 2A: SUB-COST PAYMENT (`cost`)
  // ────────────────────────────────────────────────────────────
  const cost = {
    paySubCost(ctx, subCost) {
      if (!subCost) return true;
      const st = getFriendlyState(ctx);
      if (!st) return false;
      const card = ctx.card || ctx.sourceCard;

      if (subCost.type === 'PAY_RESERVE_CORES') {
        const n = subCost.count || 1;
        if ((st.reserve || 0) < n) return false;
        st.reserve -= n;
        st.trash = (st.trash || 0) + n;
        log(ctx, `💎 **[${card?.name || 'Effect'} Sub-Cost]**: Paid ${n} core(s) from Reserve to Trash.`, 'step');
        return true;
      }

      if (subCost.type === 'EXHAUST_SELF') {
        if (!card || card.isExhausted) return false;
        card.isExhausted = true;
        log(ctx, `🌀 **[${card.name} Sub-Cost]**: Exhausted "${card.name}".`, 'step');
        return true;
      }

      if (subCost.type === 'EXHAUST_NEXUS') {
        const nexuses = (st.nexus || []).filter(n => !n.isExhausted && (!subCost.color || matchesColor(n, subCost.color)));
        if (nexuses.length < (subCost.count || 1)) return false;
        for (let i = 0; i < (subCost.count || 1); i++) {
          nexuses[i].isExhausted = true;
        }
        log(ctx, `🏛️ **[${card?.name || 'Assault'} Sub-Cost]**: Exhausted ${subCost.count || 1} Nexus(es).`, 'step');
        return true;
      }

      if (subCost.type === 'SACRIFICE_SPIRIT') {
        const candidates = (st.field || []).filter(s => matchesUnitFilter(s, subCost.filter, card));
        if (candidates.length < (subCost.count || 1)) return false;
        // Pick lowest BP candidate automatically (or self if required)
        candidates.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
        for (let i = 0; i < (subCost.count || 1); i++) {
          const victim = candidates[i];
          recycleSpiritCores(ctx, victim, ctx.side);
          sendToTrash(ctx, victim, ctx.side, `Sacrificed for ${card?.name || 'effect'}`);
          log(ctx, `💀 **[${card?.name || 'Effect'} Sub-Cost]**: Sacrificed "${victim.name}"!`, 'destroy');
        }
        return true;
      }

      if (subCost.type === 'DISCARD_HAND') {
        const n = subCost.count || 1;
        const hand = st.hand || [];
        if (hand.length < n) return false;
        for (let i = 0; i < n; i++) {
          const disc = hand.pop();
          if (disc) sendToTrash(ctx, disc, ctx.side, `Discarded for ${card?.name || 'effect'}`);
        }
        log(ctx, `🗑️ **[${card?.name || 'Effect'} Sub-Cost]**: Discarded ${n} card(s) from Hand.`, 'step');
        return true;
      }

      return true;
    }
  };

  // ────────────────────────────────────────────────────────────
  // TIER 2B: SUB-INTERNAL-EFFECT EXECUTORS (`fx`)
  // ────────────────────────────────────────────────────────────
  function computeScaleFactor(ctx, scaleBy) {
    if (!scaleBy) return 1;
    if (scaleBy.type === 'FAMILY') {
      return cond.countUnits(ctx, scaleBy.side || 'SELF', { family: scaleBy.family, color: scaleBy.color });
    }
    if (scaleBy.type === 'COLOR') {
      return cond.countUnits(ctx, scaleBy.side || 'SELF', { color: scaleBy.color });
    }
    if (scaleBy.type === 'SYMBOL' || scaleBy.type === 'SYMBOLS') {
      return cond.countSymbols(ctx, scaleBy.side || 'SELF', scaleBy.color);
    }
    if (scaleBy.type === 'NEXUS') {
      const st = scaleBy.side === 'OPPONENT' ? getEnemyState(ctx) : getFriendlyState(ctx);
      return ((st && st.nexus) || []).length;
    }
    if (scaleBy.type === 'EXHAUSTED') {
      return cond.countUnits(ctx, scaleBy.side || 'OPPONENT', { isExhausted: true });
    }
    return 1;
  }

  const fx = {
    buffBpSelf(ctx, params = {}) {
      const card = ctx.card || ctx.sourceCard;
      if (!card) return { applied: false, count: 0 };
      const mult = computeScaleFactor(ctx, params.scaleBy);
      const totalBoost = (params.amount || 0) * mult;
      if (totalBoost === 0) return { applied: false, count: 0 };

      if (params.duration === 'BATTLE') {
        card.battleBpBoost = (card.battleBpBoost || 0) + totalBoost;
      } else {
        card.turnBpBoost = (card.turnBpBoost || 0) + totalBoost;
      }
      recalcBp(ctx, card);
      log(ctx, `⚔️ **[${card.name}]**: Gained +${totalBoost} BP (Now ${card.battleBp || card.currentBp} BP)!`, 'magic');
      render(ctx);
      return { applied: true, count: 1, amount: totalBoost, targets: [card] };
    },

    buffBpAllies(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0 };
      const mult = computeScaleFactor(ctx, params.scaleBy);
      const totalBoost = (params.amount || 0) * mult;
      if (totalBoost === 0) return { applied: false, count: 0 };

      const targets = st.field.filter(u => matchesUnitFilter(u, params.filter, card));
      for (const t of targets) {
        t.turnBpBoost = (t.turnBpBoost || 0) + totalBoost;
        recalcBp(ctx, t);
      }
      if (targets.length > 0) {
        log(ctx, `🔥 **[${card?.name || 'BP Boost'}]**: Boosted ${targets.length} Spirit(s) by +${totalBoost} BP!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, amount: totalBoost, targets };
    },

    buffBpTarget(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field || st.field.length === 0) return { applied: false, count: 0 };
      const mult = computeScaleFactor(ctx, params.scaleBy);
      const totalBoost = (params.amount || 0) * mult;
      const count = params.count || 1;
      const eligible = st.field.filter(u => matchesUnitFilter(u, params.filter, card));
      if (eligible.length === 0) return { applied: false, count: 0 };

      // Prefer explicit targetSpiritUid or combat attacker/blocker or highest BP
      let chosen = [];
      if (ctx.targetSpiritUid) {
        const explicit = eligible.find(u => u.uid === ctx.targetSpiritUid);
        if (explicit) chosen.push(explicit);
      }
      if (chosen.length < count) {
        const sorted = [...eligible].sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        for (const s of sorted) {
          if (chosen.length >= count) break;
          if (!chosen.includes(s)) chosen.push(s);
        }
      }
      for (const t of chosen) {
        t.turnBpBoost = (t.turnBpBoost || 0) + totalBoost;
        recalcBp(ctx, t);
      }
      log(ctx, `⚔️ **[${card?.name || 'BP Boost'}]**: Granted +${totalBoost} BP to ${chosen.map(c => `"${c.name}"`).join(', ')}!`, 'magic');
      render(ctx);
      return { applied: chosen.length > 0, count: chosen.length, amount: totalBoost, targets: chosen };
    },

    coreFromVoid(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st) return { applied: false, count: 0 };
      const mult = computeScaleFactor(ctx, params.scaleBy);
      const count = (params.count !== undefined ? params.count : 1) * mult;
      if (count <= 0) return { applied: false, count: 0 };

      const dest = (params.to || 'RESERVE').toUpperCase();
      if (dest === 'SELF' && card && (card.type === 'Spirit' || card.type === 'Nexus' || card.type === 'Ultimate')) {
        card.currentCores = (card.currentCores || 0) + count;
        recalcBp(ctx, card);
        audio(ctx, 'coreChime');
        log(ctx, `💎 **[${card.name}]**: Placed +${count} Core(s) from Void onto "${card.name}"!`, 'magic');
      } else if (dest === 'TARGET_SPIRIT' && st.field && st.field.length > 0) {
        const eligible = st.field.filter(u => matchesUnitFilter(u, params.filter, card));
        const target = eligible[0] || st.field[0];
        target.currentCores = (target.currentCores || 0) + count;
        recalcBp(ctx, target);
        audio(ctx, 'coreChime');
        log(ctx, `💎 **[${card?.name || 'Core Boost'}]**: Placed +${count} Core(s) from Void onto "${target.name}"!`, 'magic');
      } else if (dest === 'LIFE') {
        st.life = (st.life || 0) + count;
        audio(ctx, 'shield');
        log(ctx, `💛 **[${card?.name || 'Holy Life'}]**: Placed +${count} Core(s) from Void into your Life (Life: ${st.life})!`, 'magic');
      } else if (dest === 'TRASH') {
        st.trash = (st.trash || 0) + count;
        audio(ctx, 'coreChime');
        log(ctx, `💎 **[${card?.name || 'Core Boost'}]**: Placed +${count} Core(s) from Void into your Trash!`, 'magic');
      } else {
        st.reserve = (st.reserve || 0) + count;
        audio(ctx, 'coreChime');
        log(ctx, `💎 **[${card?.name || 'Core Boost'}]**: Placed +${count} Core(s) from Void into your Reserve (Reserve: ${st.reserve})!`, 'magic');
      }
      render(ctx);
      return { applied: true, count };
    },

    drainCores(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState) return { applied: false, count: 0 };

      const coresPerTarget = params.count || 1;
      const targetCount = params.targetCount || 1;
      const toZone = (params.to || 'RESERVE').toUpperCase();
      const eligible = (enemyState.field || []).filter(u =>
        (u.currentCores || 0) > 0 &&
        !hasArmorAgainst(u, card?.color) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0 };

      // Prefer targets that can be depleted to 0 cores
      eligible.sort((a, b) => (a.currentCores || 1) - (b.currentCores || 1));
      const targets = params.allMatching ? eligible : eligible.slice(0, targetCount);
      let totalDrained = 0;
      const destroyedUnits = [];

      for (const t of targets) {
        const drain = Math.min(coresPerTarget, t.currentCores || 0);
        if (drain <= 0) continue;
        t.currentCores -= drain;
        totalDrained += drain;
        if (toZone === 'TRASH') {
          enemyState.trash = (enemyState.trash || 0) + drain;
        } else if (toZone === 'RESERVE') {
          enemyState.reserve = (enemyState.reserve || 0) + drain;
        }
        recalcBp(ctx, t);
        if (t.currentCores <= 0) {
          destroyedUnits.push(t);
          sendToTrash(ctx, t, enemySide, `Depleted to 0 cores by ${card?.name || 'effect'}`);
          log(ctx, `💀 **[CORE DEPLETION: ${card?.name || 'Effect'}]**: "${t.name}" was reduced to 0 cores and destroyed!`, 'kill');
        }
      }

      if (totalDrained > 0) {
        audio(ctx, 'coreChime');
        log(ctx, `🔮 **[${card?.name || 'Core Drain'}]**: Removed ${totalDrained} core(s) from opposing Spirit(s) to ${toZone}!`, 'magic');
        render(ctx);
      }
      return { applied: totalDrained > 0, count: totalDrained, targets, destroyedUnits };
    },

    awaken(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !card) return { applied: false, count: 0 };
      const maxMove = params.maxCores || 2;
      let moved = 0;

      // Move cores from other friendly Spirits or Reserve onto this Spirit
      for (const ally of (st.field || [])) {
        if (ally.uid === card.uid) continue;
        while ((ally.currentCores || 0) > 1 && moved < maxMove) {
          ally.currentCores -= 1;
          card.currentCores = (card.currentCores || 0) + 1;
          moved++;
          recalcBp(ctx, ally);
        }
      }
      if (moved === 0 && (st.reserve || 0) > 0) {
        const fromRes = Math.min(maxMove, st.reserve);
        st.reserve -= fromRes;
        card.currentCores = (card.currentCores || 0) + fromRes;
        moved += fromRes;
      }
      card.isExhausted = false;
      recalcBp(ctx, card);
      audio(ctx, 'coreChime');
      log(ctx, `🔥 **[AWAKEN: ${card.name}]**: Transferred ${moved} core(s) to "${card.name}" (Now Lv${card.currentLevel}, ${card.currentBp} BP)!`, 'magic');
      render(ctx);
      return { applied: moved > 0, count: moved, targets: [card] };
    },

    ultraAwaken(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !card) return { applied: false, count: 0 };
      const maxMove = params.maxCores || 3;
      let moved = 0;

      for (const ally of (st.field || [])) {
        if (ally.uid === card.uid) continue;
        while ((ally.currentCores || 0) > 1 && moved < maxMove) {
          ally.currentCores -= 1;
          card.currentCores = (card.currentCores || 0) + 1;
          moved++;
          recalcBp(ctx, ally);
        }
      }
      if (moved === 0 && (st.reserve || 0) > 0) {
        const fromRes = Math.min(maxMove, st.reserve);
        st.reserve -= fromRes;
        card.currentCores = (card.currentCores || 0) + fromRes;
        moved += fromRes;
      }
      card.isExhausted = false;
      recalcBp(ctx, card);
      audio(ctx, 'coreChime');
      log(ctx, `🔥✨ **[ULTRA AWAKEN: ${card.name}]**: Transferred ${moved} core(s) and refreshed "${card.name}" (Now Lv${card.currentLevel}, ${card.currentBp} BP)!`, 'magic');
      render(ctx);
      return { applied: true, count: moved, targets: [card] };
    },

    grantHeavyArmor(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0 };
      const colors = params.colors || ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
      const targets = params.scope === 'ALL_MATCHING'
        ? st.field.filter(u => matchesUnitFilter(u, params.filter, card))
        : (card ? [card] : []);

      for (const t of targets) {
        if (!Array.isArray(t.heavyArmorColors)) t.heavyArmorColors = [];
        for (const col of colors) {
          if (!t.heavyArmorColors.includes(col)) t.heavyArmorColors.push(col);
        }
        if (!Array.isArray(t.grantedKeywords)) t.grantedKeywords = [];
        t.grantedKeywords.push({ name: `Heavy Armor: ${colors.join('/')}`, expires: params.expires || 'permanent' });
      }
      if (targets.length > 0) {
        log(ctx, `🛡️ **[Heavy Armor]**: Granted [Heavy Armor: ${colors.join('/')}] to ${targets.map(t => `"${t.name}"`).join(', ')}!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    destroyOpposingBrave(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState) return { applied: false, count: 0 };
      let destroyed = 0;

      for (const sp of (enemyState.field || [])) {
        if (sp && sp.brave) {
          const br = sp.brave;
          sp.brave = null;
          sp.isBraved = false;
          sendToTrash(ctx, br, enemySide, `Brave destroyed by ${card?.name || 'effect'}`);
          recalcBp(ctx, sp);
          destroyed++;
          log(ctx, `⚔️💥 **[Brave Destruction]**: Destroyed opposing Brave "${br.name}" on "${sp.name}"!`, 'kill');
          if (destroyed >= (params.count || 1)) break;
        }
      }
      if (destroyed > 0) {
        audio(ctx, 'destroy');
        render(ctx);
      }
      return { applied: destroyed > 0, count: destroyed };
    },

    destroyByBp(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, destroyedUnits: [] };

      const maxBp = params.maxBp !== undefined ? params.maxBp : 3000;
      const count = params.count || 1;
      const eligible = enemyState.field.filter(u => {
        const bp = u.battleBp || u.currentBp || u.baseBp || 0;
        return bp <= maxBp && !hasArmorAgainst(u, card?.color) && matchesUnitFilter(u, params.filter, card);
      });
      if (eligible.length === 0) return { applied: false, count: 0, destroyedUnits: [] };

      eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
      const doDestroy = (victims) => {
        for (const v of victims) {
          recycleSpiritCores(ctx, v, enemySide);
          sendToTrash(ctx, v, enemySide, `Destroyed by ${card?.name || 'BP destruction'}`);
          audio(ctx, 'destroy');
          log(ctx, `💀 **[${card?.name || 'Destroy'}]**: Destroyed opposing "${v.name}" (${v.currentBp || 0} BP ≤ ${maxBp} BP)!`, 'kill');
        }
        render(ctx);
        return { applied: victims.length > 0, count: victims.length, destroyedUnits: victims };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Destroy by BP'}`,
          subtitle: `Choose ${count} opposing Spirit(s) with ${maxBp} BP or less to destroy:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doDestroy(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const victims = params.allMatching ? eligible : eligible.slice(0, count);
      return doDestroy(victims);
    },

    destroyByCost(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, destroyedUnits: [] };

      const maxCost = params.maxCost !== undefined ? params.maxCost : 3;
      const count = params.count || 1;
      const eligible = enemyState.field.filter(u =>
        (u.cost || 0) <= maxCost &&
        (!params.minCost || (u.cost || 0) >= params.minCost) &&
        !hasArmorAgainst(u, card?.color) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, destroyedUnits: [] };

      eligible.sort((a, b) => (b.cost || 0) - (a.cost || 0));
      const doDestroy = (victims) => {
        for (const v of victims) {
          recycleSpiritCores(ctx, v, enemySide);
          sendToTrash(ctx, v, enemySide, `Destroyed by ${card?.name || 'Cost destruction'}`);
          audio(ctx, 'destroy');
          log(ctx, `💀 **[${card?.name || 'Demolition'}]**: Destroyed opposing "${v.name}" (Cost ${v.cost || 0} ≤ ${maxCost})!`, 'kill');
        }
        render(ctx);
        return { applied: victims.length > 0, count: victims.length, destroyedUnits: victims };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Destroy by Cost'}`,
          subtitle: `Choose ${count} opposing Spirit(s) of Cost ${maxCost} or less to destroy:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doDestroy(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const victims = params.allMatching ? eligible : eligible.slice(0, count);
      return doDestroy(victims);
    },

    destroyExhausted(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, destroyedUnits: [] };

      const count = params.count || 1;
      const eligible = enemyState.field.filter(u =>
        u.isExhausted &&
        !hasArmorAgainst(u, card?.color) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, destroyedUnits: [] };

      eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
      const doDestroy = (victims) => {
        for (const v of victims) {
          recycleSpiritCores(ctx, v, enemySide);
          sendToTrash(ctx, v, enemySide, `Destroyed exhausted by ${card?.name || 'effect'}`);
          audio(ctx, 'destroy');
          log(ctx, `💀 **[${card?.name || 'Destroy Exhausted'}]**: Destroyed opposing exhausted "${v.name}"!`, 'kill');
        }
        render(ctx);
        return { applied: victims.length > 0, count: victims.length, destroyedUnits: victims };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Destroy Exhausted'}`,
          subtitle: `Choose ${count} exhausted opposing Spirit(s) to destroy:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doDestroy(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const victims = params.allMatching ? eligible : eligible.slice(0, count);
      return doDestroy(victims);
    },

    destroyNexus(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.nexus || enemyState.nexus.length === 0) {
        return { applied: false, count: 0, destroyedUnits: [] };
      }
      const count = params.count || 1;
      const eligible = [...enemyState.nexus];
      const doDestroy = (victims) => {
        for (const nx of victims) {
          recycleSpiritCores(ctx, nx, enemySide);
          sendToTrash(ctx, nx, enemySide, `Nexus destroyed by ${card?.name || 'effect'}`);
          audio(ctx, 'destroy');
          log(ctx, `🏛️💥 **[${card?.name || 'Nexus Destruction'}]**: Destroyed opposing Nexus "${nx.name}"!`, 'kill');
        }
        render(ctx);
        return { applied: victims.length > 0, count: victims.length, destroyedUnits: victims };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Destroy Nexus'}`,
          subtitle: `Choose ${count} opposing Nexus(es) to destroy:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doDestroy(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const victims = params.allMatching ? eligible : eligible.slice(0, count);
      return doDestroy(victims);
    },

    bounceToHand(ctx, params = {}) {
      const targetSide = params.targetSide === 'SELF' ? ctx.side : getEnemySide(ctx);
      const st = targetSide === ctx.side ? getFriendlyState(ctx) : getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0, targets: [] };

      const count = params.count || 1;
      const eligible = st.field.filter(u =>
        (targetSide === ctx.side || !hasArmorAgainst(u, card?.color)) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, targets: [] };

      eligible.sort((a, b) => (b.cost || 0) - (a.cost || 0));
      const doBounce = (bounced) => {
        for (const b of bounced) {
          recycleSpiritCores(ctx, b, targetSide);
          const idx = st.field.indexOf(b);
          if (idx !== -1) st.field.splice(idx, 1);
          if (!st.hand) st.hand = [];
          st.hand.push(b);
          log(ctx, `🌪️ **[${card?.name || 'Bounce'}]**: Returned "${b.name}" to ${targetSide === 'player' ? 'Player' : 'Opponent'}'s Hand!`, 'magic');
          if (st.returnDrawActiveThisTurn && st.deck && st.deck.length > 0) {
            const drawn = st.deck.shift();
            if (drawn) {
              st.hand.push(drawn);
              log(ctx, `🎴 **[Return Draw]**: Spirit returned to Hand — drew 1 card!`, 'step');
            }
          }
        }
        render(ctx);
        return { applied: bounced.length > 0, count: bounced.length, targets: bounced };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Return to Hand'}`,
          subtitle: `Choose ${count} Spirit(s) to return to Hand:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doBounce(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const bounced = params.allMatching ? eligible : eligible.slice(0, count);
      return doBounce(bounced);
    },

    bounceToDeck(ctx, params = {}) {
      const enemySide = getEnemySide(ctx);
      const enemyState = getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, targets: [] };

      const count = params.count || 1;
      const pos = (params.position || 'BOTTOM').toUpperCase();
      const eligible = enemyState.field.filter(u =>
        !hasArmorAgainst(u, card?.color) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, targets: [] };

      eligible.sort((a, b) => (b.cost || 0) - (a.cost || 0));
      const doBounce = (bounced) => {
        for (const b of bounced) {
          recycleSpiritCores(ctx, b, enemySide);
          const idx = enemyState.field.indexOf(b);
          if (idx !== -1) enemyState.field.splice(idx, 1);
          if (!enemyState.deck) enemyState.deck = [];
          if (pos === 'TOP') enemyState.deck.unshift(b);
          else enemyState.deck.push(b);
          log(ctx, `🌪️ **[${card?.name || 'Deck Bounce'}]**: Returned opposing "${b.name}" to the ${pos.toLowerCase()} of their Deck!`, 'magic');
        }
        render(ctx);
        return { applied: bounced.length > 0, count: bounced.length, targets: bounced };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Return to Deck'}`,
          subtitle: `Choose ${count} opposing Spirit(s) to return to the ${pos.toLowerCase()} of their Deck:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doBounce(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const bounced = eligible.slice(0, count);
      return doBounce(bounced);
    },

    refreshSpirits(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0, targets: [] };

      const scope = (params.scope || 'SELF').toUpperCase();
      let targets = [];
      if (scope === 'SELF' && card) {
        targets = [card];
      } else if (scope === 'ALL_MATCHING') {
        targets = st.field.filter(u => matchesUnitFilter(u, params.filter, card));
      } else {
        const eligible = st.field.filter(u => u.isExhausted && matchesUnitFilter(u, params.filter, card));
        targets = eligible.slice(0, params.count || 1);
      }

      for (const t of targets) {
        t.isExhausted = false;
      }
      if (targets.length > 0) {
        audio(ctx, 'shield');
        log(ctx, `🔄 **[${card?.name || 'Refresh'}]**: Refreshed ${targets.map(t => `"${t.name}"`).join(', ')}!`, 'step');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    exhaustOpposing(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, targets: [] };

      const count = params.count || 1;
      const eligible = enemyState.field.filter(u =>
        !u.isExhausted &&
        !hasArmorAgainst(u, card?.color) &&
        matchesUnitFilter(u, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, targets: [] };

      eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
      const doExhaust = (targets) => {
        for (const t of targets) {
          t.isExhausted = true;
        }
        log(ctx, `🍃 **[${card?.name || 'Exhaust'}]**: Exhausted opposing ${targets.map(t => `"${t.name}"`).join(', ')}!`, 'magic');
        render(ctx);
        return { applied: targets.length > 0, count: targets.length, targets };
      };
      if (ctx.side === 'player' && !params.allMatching && eligible.length > count && ctx.arenaApi && typeof ctx.arenaApi.promptUniversalTargetModal === 'function' && typeof document !== 'undefined' && document.body) {
        return ctx.arenaApi.promptUniversalTargetModal({
          title: `${card?.name || 'Exhaust Spirit'}`,
          subtitle: `Choose ${count} opposing Spirit(s) to exhaust:`,
          candidates: eligible,
          minPick: Math.min(count, eligible.length),
          maxPick: Math.min(count, eligible.length),
        }).then(picked => doExhaust(Array.isArray(picked) && picked.length > 0 ? picked : eligible.slice(0, count)));
      }
      const targets = params.allMatching ? eligible : eligible.slice(0, count);
      return doExhaust(targets);
    },

    drawCards(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.deck) return { applied: false, count: 0 };

      const mult = computeScaleFactor(ctx, params.scaleBy);
      const count = (params.count || 1) * mult;
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        if (st.deck.length === 0) break;
        const c = st.deck.shift();
        if (c) {
          if (!st.hand) st.hand = [];
          st.hand.push(c);
          drawn++;
        }
      }
      if (drawn > 0) {
        log(ctx, `🎴 **[${card?.name || 'Draw'}]**: Drew ${drawn} card(s) from Deck!`, 'step');
      }
      if (params.thenDiscard && params.thenDiscard > 0 && st.hand && st.hand.length > 0) {
        const discCount = Math.min(params.thenDiscard, st.hand.length);
        if (ctx.side === 'player' && ctx.arenaApi && typeof ctx.arenaApi.promptHandDiscardModal === 'function' && typeof document !== 'undefined' && document.body) {
          ctx.arenaApi.promptHandDiscardModal(card || { name: 'Draw & Discard' }, ctx.side, discCount, null, false, (chosen) => {
            const discarded = (chosen && chosen.length > 0) ? chosen : st.hand.slice(-discCount);
            discarded.forEach(disc => {
              const idx = st.hand.findIndex(h => (h.uid && disc.uid && h.uid === disc.uid) || h === disc);
              if (idx !== -1) st.hand.splice(idx, 1);
              sendToTrash(ctx, disc, ctx.side, `Discarded after draw by ${card?.name || 'effect'}`);
            });
            log(ctx, `🗑️ **[${card?.name || 'Draw & Discard'}]**: Discarded ${discarded.length} card(s) from Hand.`, 'step');
            render(ctx);
          });
        } else {
          for (let j = 0; j < discCount; j++) {
            const disc = st.hand.pop();
            if (disc) sendToTrash(ctx, disc, ctx.side, `Discarded after draw by ${card?.name || 'effect'}`);
          }
          log(ctx, `🗑️ **[${card?.name || 'Draw & Discard'}]**: Discarded ${discCount} card(s) from Hand.`, 'step');
        }
      }
      render(ctx);
      return { applied: drawn > 0, count: drawn };
    },

    millDeck(ctx, params = {}) {
      const targetSide = params.side === 'SELF' ? ctx.side : getEnemySide(ctx);
      const st = targetSide === ctx.side ? getFriendlyState(ctx) : getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.deck) return { applied: false, count: 0, discardedCards: [] };

      const curLv = (card && card.currentLevel) || 1;
      const count = params.scaleByLevel ? curLv * (params.perLevel || 1) : (params.count || 1);
      const discardedCards = [];
      for (let i = 0; i < count; i++) {
        if (st.deck.length === 0) break;
        const c = st.deck.shift();
        if (c) {
          discardedCards.push(c);
          sendToTrash(ctx, c, targetSide, `Discarded from deck by ${card?.name || 'Crush'}`);
        }
      }
      if (discardedCards.length > 0) {
        log(ctx, `🌊 **[${card?.name || 'Crush / Mill'}]**: Discarded ${discardedCards.length} card(s) from ${targetSide === 'player' ? 'Player' : 'Opponent'}'s Decktop!`, 'magic');
        render(ctx);
      }
      return { applied: discardedCards.length > 0, count: discardedCards.length, discardedCards };
    },

    salvageTrash(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.trashCards || st.trashCards.length === 0) return { applied: false, count: 0, targets: [] };

      const count = params.count || 1;
      const eligible = st.trashCards.filter(c => c.uid !== card?.uid && matchesUnitFilter(c, params.filter, card));
      if (eligible.length === 0) return { applied: false, count: 0, targets: [] };

      const salvaged = eligible.slice(0, count);
      for (const s of salvaged) {
        const idx = st.trashCards.indexOf(s);
        if (idx !== -1) st.trashCards.splice(idx, 1);
        if (!st.hand) st.hand = [];
        st.hand.push(s);
      }
      log(ctx, `♻️ **[${card?.name || 'Salvage'}]**: Returned ${salvaged.map(c => `"${c.name}"`).join(', ')} from Trash to Hand!`, 'magic');
      render(ctx);
      return { applied: salvaged.length > 0, count: salvaged.length, targets: salvaged };
    },

    reanimateTrash(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.trashCards || st.trashCards.length === 0) return { applied: false, count: 0, targets: [] };

      const count = params.count || 1;
      const eligible = st.trashCards.filter(c =>
        (c.type === 'Spirit' || !c.type) &&
        matchesUnitFilter(c, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0, targets: [] };

      const summoned = [];
      for (const spCard of eligible.slice(0, count)) {
        if ((st.reserve || 0) < 1) break;
        const idx = st.trashCards.indexOf(spCard);
        if (idx !== -1) st.trashCards.splice(idx, 1);
        st.reserve -= 1;
        const instance = {
          ...spCard,
          uid: spCard.uid || ('reanim_' + Math.random().toString(36).slice(2, 8)),
          currentCores: 1,
          currentLevel: 1,
          currentBp: (spCard.levels && spCard.levels[0] && spCard.levels[0].bp) || spCard.currentBp || 3000,
          isExhausted: false,
          hasAttacked: false
        };
        if (!st.field) st.field = [];
        st.field.push(instance);
        summoned.push(instance);
      }
      if (summoned.length > 0) {
        audio(ctx, 'summon');
        log(ctx, `✨ **[${card?.name || 'Reanimate'}]**: Summoned ${summoned.map(s => `"${s.name}"`).join(', ')} from Trash!`, 'step');
        render(ctx);
      }
      return { applied: summoned.length > 0, count: summoned.length, targets: summoned };
    },

    grantKeyword(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0 };

      const kw = params.keyword || 'Clash';
      const scope = (params.scope || 'SELF').toUpperCase();
      let targets = [];
      if (scope === 'SELF' && card) targets = [card];
      else if (scope === 'ALL_MATCHING') targets = st.field.filter(u => matchesUnitFilter(u, params.filter, card));
      else targets = st.field.filter(u => matchesUnitFilter(u, params.filter, card)).slice(0, params.count || 1);

      for (const t of targets) {
        if (!Array.isArray(t.grantedKeywords)) t.grantedKeywords = [];
        t.grantedKeywords.push({ name: kw, expires: 'end_of_turn' });
        const kl = kw.toLowerCase();
        if (kl.includes('clash')) t.hasClash = true;
        if (kl.includes('curse')) t.hasCurse = true;
        if (kl.includes('crush')) t.hasCrush = true;
      }
      if (targets.length > 0) {
        log(ctx, `✨ **[${card?.name || 'Keyword Grant'}]**: Granted [${kw}] to ${targets.map(t => `"${t.name}"`).join(', ')}!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    grantUnblockable(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0 };

      const scope = (params.scope || 'SELF').toUpperCase();
      const targets = scope === 'SELF' && card
        ? [card]
        : st.field.filter(u => matchesUnitFilter(u, params.filter, card));

      for (const t of targets) {
        t.cantBeBlocked = true;
        if (params.condition) {
          t.unblockableCondition = params.condition;
        }
      }
      if (targets.length > 0) {
        log(ctx, `👻 **[${card?.name || 'Unblockable'}]**: ${targets.map(t => `"${t.name}"`).join(', ')} gained unblockable evasion!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    addExtraSymbol(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.field) return { applied: false, count: 0 };

      const scope = (params.scope || 'SELF').toUpperCase();
      const targets = scope === 'SELF' && card
        ? [card]
        : st.field.filter(u => matchesUnitFilter(u, params.filter, card));

      for (const t of targets) {
        t.extraSymbols = (t.extraSymbols || 0) + (params.count || 1);
      }
      if (targets.length > 0) {
        log(ctx, `💠 **[${card?.name || 'Extra Symbol'}]**: Added +${params.count || 1} Symbol(s) to ${targets.map(t => `"${t.name}"`).join(', ')}!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    damageWall(ctx, params = {}) {
      if (!ctx || !ctx.duelState) return { applied: false, count: 0 };
      const card = ctx.card || ctx.sourceCard;
      if (!Array.isArray(ctx.duelState.modifiers)) ctx.duelState.modifiers = [];
      ctx.duelState.modifiers.push({
        type: 'DAMAGE_WALL',
        side: ctx.side,
        maxLifeLoss: params.maxLifeLoss !== undefined ? params.maxLifeLoss : 1,
        preventAllLifeLoss: Boolean(params.preventAllLifeLoss),
        minAttackerLv: params.minAttackerLv || 0,
        sourceCard: card?.name || 'Wall'
      });
      if (ctx.side === 'player') {
        ctx.duelState.playerDamageWallActive = true;
      } else {
        ctx.duelState.opponentDamageWallActive = true;
      }
      audio(ctx, 'shield');
      log(ctx, `🛡️ **[${card?.name || 'Damage Wall'}]**: Activated Life protection shield!`, 'magic');
      render(ctx);
      return { applied: true, count: 1 };
    },

    endAttackStep(ctx, params = {}) {
      if (!ctx || !ctx.duelState) return { applied: false, count: 0 };
      const card = ctx.card || ctx.sourceCard;
      const timing = (params.timing || 'END_OF_BATTLE').toUpperCase();
      if (!Array.isArray(ctx.duelState.modifiers)) ctx.duelState.modifiers = [];

      if (timing === 'IMMEDIATE' || !ctx.duelState.combatEvent) {
        ctx.duelState.modifiers.push({ type: 'END_ATTACK_STEP', side: ctx.side, source: card?.name });
        ctx.duelState.endAttackStepAfterBattle = true;
        ctx.duelState.phaseIndex = 6; // Advance to END STEP
        log(ctx, `🛑 **[${card?.name || 'Wall'}]**: Ended the Attack Step!`, 'warning');
      } else {
        ctx.duelState.endAttackStepAfterBattle = true;
        ctx.duelState.modifiers.push({ type: 'END_ATTACK_STEP_AFTER_BATTLE', side: ctx.side, source: card?.name });
        log(ctx, `🛡️ **[${card?.name || 'Wall'}]**: The Attack Step will end immediately after this battle!`, 'magic');
      }
      render(ctx);
      return { applied: true, count: 1 };
    },

    lifeDamage(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState) return { applied: false, count: 0 };
      const count = params.count || 1;
      const actual = Math.min(count, enemyState.life !== undefined ? enemyState.life : 5);
      if (actual <= 0) return { applied: false, count: 0 };
      enemyState.life -= actual;
      if ((params.toZone || 'RESERVE').toUpperCase() === 'TRASH') {
        enemyState.trash = (enemyState.trash || 0) + actual;
      } else if ((params.toZone || 'RESERVE').toUpperCase() === 'RESERVE') {
        enemyState.reserve = (enemyState.reserve || 0) + actual;
      }
      audio(ctx, 'destroy');
      log(ctx, `💥 **[${card?.name || 'Life Burn'}]**: Reduced opposing Life by ${actual} (Opposing Life: ${enemyState.life})!`, 'damage');
      render(ctx);
      return { applied: true, count: actual };
    },

    chooseFamilyDraw(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.deck) return { applied: false, count: 0 };
      const families = Array.isArray(params.families) && params.families.length > 0
        ? params.families
        : ['Imaginary Beast', 'Beast Head'];

      const countForFam = (fam) => (st.field || []).filter(u => matchesFamily(u, fam)).length;

      const doDrawForFamily = (chosenFam) => {
        const cnt = countForFam(chosenFam);
        let drawn = 0;
        for (let i = 0; i < cnt; i++) {
          if (st.deck.length === 0) break;
          const c = st.deck.shift();
          if (c) {
            if (!st.hand) st.hand = [];
            st.hand.push(c);
            drawn++;
          }
        }
        log(ctx, `🎴 **[${card?.name || 'Family Draw'}]**: Chose "${chosenFam}" (${cnt} Spirit(s)) — drew ${drawn} card(s)!`, 'step');
        render(ctx);
        return { applied: drawn > 0, count: drawn };
      };

      if (ctx.side === 'player' && ctx.arenaApi && typeof ctx.arenaApi.promptChoiceModal === 'function' && typeof document !== 'undefined' && document.body) {
        ctx.arenaApi.promptChoiceModal({
          card,
          side: 'player',
          title: `${card?.name || 'Effect'}: Choose Family`,
          description: 'Select a family to draw 1 card for each Spirit you control in that family:',
          choices: families.map(f => ({
            icon: '🐾',
            label: `"${f}" Family (${countForFam(f)} on Field)`,
            desc: `Draw ${countForFam(f)} card(s)`
          }))
        }, (choiceIdx) => {
          const picked = families[choiceIdx] || families[0];
          doDrawForFamily(picked);
        });
        return { applied: true, count: 1 };
      }

      // Deterministic AI / headless choice: pick family with most controlled units
      let bestFam = families[0];
      let bestCnt = -1;
      for (const f of families) {
        const c = countForFam(f);
        if (c > bestCnt) {
          bestCnt = c;
          bestFam = f;
        }
      }
      return doDrawForFamily(bestFam);
    },

    revealDecktopAdd(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.deck || st.deck.length === 0) return { applied: false, count: 0 };

      const scaleSpec = params.scaleBy || (params.scaleBySymbolColor ? { type: 'SYMBOLS', color: params.scaleBySymbolColor } : null);
      const mult = scaleSpec ? computeScaleFactor(ctx, scaleSpec) : 1;
      const revealCount = Math.min(st.deck.length, (params.count || 1) * mult);
      if (revealCount <= 0) return { applied: false, count: 0 };

      const revealed = st.deck.splice(0, revealCount);
      const filter = params.filter || { type: 'Magic' };
      const remDest = (params.remainingTo || 'BOTTOM').toUpperCase();
      const maxAdd = params.maxAdd || 1;

      const returnRemaining = (remCards) => {
        for (const rem of remCards) {
          if (remDest === 'TRASH') {
            sendToTrash(ctx, rem, ctx.side, `Discarded after reveal by ${card?.name || 'effect'}`);
          } else if (remDest === 'TOP') {
            st.deck.unshift(rem);
          } else {
            st.deck.push(rem);
          }
        }
      };

      if (ctx.side === 'player' && ctx.arenaApi && typeof ctx.arenaApi.promptScryRevealModal === 'function' && typeof document !== 'undefined' && document.body && maxAdd === 1) {
        ctx.arenaApi.promptScryRevealModal({
          sourceCard: card,
          side: 'player',
          title: `${card?.name || 'Reveal'}: Revealed ${revealed.length} Card(s)`,
          description: `Select a matching card to add to your Hand. Remaining cards go to ${remDest.toLowerCase()}:`,
          cards: revealed,
          filterFn: (c) => matchesUnitFilter(c, filter, card)
        }, (chosen) => {
          if (chosen) {
            const idx = revealed.findIndex(c => (c.uid && chosen.uid && c.uid === chosen.uid) || c === chosen);
            if (idx !== -1) revealed.splice(idx, 1);
            if (!st.hand) st.hand = [];
            st.hand.push(chosen);
            log(ctx, `✨ **[${card?.name || 'Reveal'}]**: Added "${chosen.name}" to Hand!`, 'step');
          }
          returnRemaining(revealed);
          render(ctx);
        });
        return { applied: true, count: 1 };
      }

      const added = [];
      const leftovers = [];
      for (const c of revealed) {
        if ((maxAdd === 'ALL' || added.length < maxAdd) && matchesUnitFilter(c, filter, card)) {
          if (!st.hand) st.hand = [];
          st.hand.push(c);
          added.push(c);
        } else {
          leftovers.push(c);
        }
      }
      returnRemaining(leftovers);
      log(ctx, `🎴 **[${card?.name || 'Reveal'}]**: Revealed ${revealed.length} card(s), added ${added.length} to Hand!`, 'step');
      render(ctx);
      return { applied: added.length > 0, count: added.length, targets: added };
    },

    deployNexusFromTrash(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !st.trashCards || st.trashCards.length === 0) return { applied: false, count: 0 };

      const eligible = st.trashCards.filter(c =>
        ((c.type || '').toLowerCase().includes('nexus')) &&
        matchesUnitFilter(c, params.filter, card)
      );
      if (eligible.length === 0) return { applied: false, count: 0 };

      const chosen = eligible[0];
      const idx = st.trashCards.indexOf(chosen);
      if (idx !== -1) st.trashCards.splice(idx, 1);
      chosen.currentCores = chosen.currentCores || 0;
      chosen.currentLevel = 1;
      chosen.isExhausted = false;
      if (!st.nexus) st.nexus = [];
      st.nexus.push(chosen);
      audio(ctx, 'summon');
      log(ctx, `🏛️ **[${card?.name || 'Deploy Nexus'}]**: Deployed Nexus "${chosen.name}" from Trash without paying cost!`, 'step');
      render(ctx);
      return { applied: true, count: 1, targets: [chosen] };
    },

    destroyOneOfEachCost(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0, destroyedUnits: [] };

      const costs = Array.isArray(params.costs) ? params.costs : [0, 1, 2, 3, 4];
      const destroyedUnits = [];
      for (const targetCost of costs) {
        const candidates = enemyState.field.filter(u =>
          (u.cost !== undefined ? u.cost : 0) === targetCost &&
          !hasArmorAgainst(u, card?.color) &&
          matchesUnitFilter(u, params.filter, card)
        );
        if (candidates.length > 0) {
          candidates.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
          const victim = candidates[0];
          recycleSpiritCores(ctx, victim, enemySide);
          sendToTrash(ctx, victim, enemySide, `Destroyed (Cost ${targetCost}) by ${card?.name || 'effect'}`);
          destroyedUnits.push(victim);
        }
      }
      if (destroyedUnits.length > 0) {
        audio(ctx, 'destroy');
        log(ctx, `💀 **[${card?.name || 'Multi-Cost Destroy'}]**: Destroyed ${destroyedUnits.map(u => `"${u.name}" (Cost ${u.cost || 0})`).join(', ')}!`, 'kill');
        render(ctx);
      }
      return { applied: destroyedUnits.length > 0, count: destroyedUnits.length, destroyedUnits };
    },

    lookOpponentHandDiscard(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.hand || enemyState.hand.length === 0) return { applied: false, count: 0 };

      const filter = params.filter || { type: 'Magic' };
      const count = params.count || 1;
      const matching = enemyState.hand.filter(c => matchesUnitFilter(c, filter, card));

      if (ctx.side === 'player' && ctx.arenaApi && typeof ctx.arenaApi.promptScryRevealModal === 'function' && typeof document !== 'undefined' && document.body) {
        ctx.arenaApi.promptScryRevealModal({
          sourceCard: card,
          side: 'player',
          title: `${card?.name || 'Hand Inspection'}: Opposing Hand (${enemyState.hand.length} Cards)`,
          description: matching.length > 0 ? 'Select an opposing card to discard to their Trash:' : 'No matching cards in opposing Hand.',
          cards: enemyState.hand,
          filterFn: (c) => matchesUnitFilter(c, filter, card)
        }, (chosen) => {
          if (chosen) {
            const idx = enemyState.hand.indexOf(chosen);
            if (idx !== -1) enemyState.hand.splice(idx, 1);
            sendToTrash(ctx, chosen, enemySide, `Discarded from Hand by ${card?.name || 'effect'}`);
            log(ctx, `🗑️ **[${card?.name || 'Hand Discard'}]**: Discarded opposing "${chosen.name}"!`, 'kill');
            render(ctx);
          }
        });
        return { applied: true, count: 1 };
      }

      const discarded = matching.slice(0, count);
      for (const d of discarded) {
        const idx = enemyState.hand.indexOf(d);
        if (idx !== -1) enemyState.hand.splice(idx, 1);
        sendToTrash(ctx, d, enemySide, `Discarded from Hand by ${card?.name || 'effect'}`);
      }
      if (discarded.length > 0) {
        log(ctx, `🗑️ **[${card?.name || 'Hand Discard'}]**: Looked at opposing Hand and discarded ${discarded.map(c => `"${c.name}"`).join(', ')}!`, 'kill');
        render(ctx);
      }
      return { applied: discarded.length > 0, count: discarded.length, targets: discarded };
    },

    exhaustByAttackerCost(ctx) {
      const st = getFriendlyState(ctx);
      const enemyState = getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      const attacker = ctx.attacker || (ctx.duelState && ctx.duelState.combatEvent && ctx.duelState.combatEvent.attacker);
      if (!attacker) return { applied: false, count: 0 };
      const targetCost = attacker.cost || 0;
      const allUnits = [...((st && st.field) || []), ...((enemyState && enemyState.field) || [])];
      const targets = allUnits.filter(u => !u.isExhausted && (u.cost || 0) === targetCost);
      for (const t of targets) {
        t.isExhausted = true;
      }
      if (targets.length > 0) {
        log(ctx, `🍃 **[${card?.name || 'Exhaust'}]**: Exhausted ${targets.length} Spirit(s) with Cost ${targetCost}!`, 'magic');
        render(ctx);
      }
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    setFloatingReturnDraw(ctx) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st) return { applied: false, count: 0 };
      st.returnDrawActiveThisTurn = true;
      if (ctx.duelState) {
        if (!Array.isArray(ctx.duelState.modifiers)) ctx.duelState.modifiers = [];
        ctx.duelState.modifiers.push({
          type: 'RETURN_DRAW_THIS_TURN',
          side: ctx.side,
          sourceCard: card?.name || 'Return Draw'
        });
      }
      log(ctx, `✨ **[${card?.name || 'Return Draw'}]**: During this turn, whenever a Spirit you control returns to your Hand, draw 1 card!`, 'magic');
      render(ctx);
      return { applied: true, count: 1 };
    },

    returnSelfForTribute(ctx) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !card) return { applied: false, count: 0 };
      card._returnedToHandForTribute = true;
      if (st.trashCards) {
        const tIdx = st.trashCards.indexOf(card);
        if (tIdx !== -1) st.trashCards.splice(tIdx, 1);
      }
      if (!st.hand) st.hand = [];
      if (!st.hand.includes(card)) st.hand.push(card);
      log(ctx, `🌪️ **[${card.name}]**: Returned to Hand as Tribute substitute!`, 'magic');
      render(ctx);
      return { applied: true, count: 1 };
    },

    opponentSendCoresMinOne(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field) return { applied: false, count: 0 };
      const needed = params.count || 3;
      const toZone = (params.to || 'RESERVE').toUpperCase();
      let moved = 0;
      const eligible = enemyState.field.filter(u => (u.currentCores || 0) > 1 && !hasArmorAgainst(u, card?.color));
      for (const sp of eligible) {
        while ((sp.currentCores || 0) > 1 && moved < needed) {
          sp.currentCores -= 1;
          moved++;
          if (toZone === 'TRASH') enemyState.trash = (enemyState.trash || 0) + 1;
          else enemyState.reserve = (enemyState.reserve || 0) + 1;
          recalcBp(ctx, sp);
        }
      }
      if (moved > 0) {
        audio(ctx, 'coreChime');
        log(ctx, `🔮 **[${card?.name || 'Core Drain'}]**: Opponent sent ${moved} core(s) from their Spirits to ${toZone} (minimum 1 core remaining)!`, 'magic');
        render(ctx);
      }
      return { applied: moved > 0, count: moved };
    },

    assaultRefresh(ctx, params = {}) {
      const st = getFriendlyState(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!st || !card) return { applied: false, count: 0 };
      const maxPerTurn = params.maxPerTurn || 1;
      const turnNum = (ctx.duelState && ctx.duelState.turn) || 1;
      if (card._assaultTurn !== turnNum) {
        card._assaultTurn = turnNum;
        card._assaultUsedCount = 0;
      }
      if (card._assaultUsedCount >= maxPerTurn) return { applied: false, count: 0 };
      const activeNexuses = (st.nexus || []).filter(n => !n.isExhausted);
      if (activeNexuses.length === 0) return { applied: false, count: 0 };

      const doRefresh = (nx) => {
        nx.isExhausted = true;
        card.isExhausted = false;
        card._assaultUsedCount = (card._assaultUsedCount || 0) + 1;
        audio(ctx, 'shield');
        log(ctx, `🌀 **[Assault: ${maxPerTurn}]**: Exhausted Nexus "${nx.name}" to refresh "${card.name}"!`, 'step');
        render(ctx);
      };

      if (ctx.side === 'player' && ctx.arenaApi && typeof ctx.arenaApi.askOptionalEffect === 'function' && typeof document !== 'undefined' && document.body) {
        ctx.arenaApi.askOptionalEffect(
          card,
          `Activate [Assault: ${maxPerTurn}]? Exhaust your Nexus "${activeNexuses[0].name}" to refresh "${card.name}"?`,
          () => doRefresh(activeNexuses[0]),
          () => {}
        );
        return { applied: true, count: 1 };
      }

      doRefresh(activeNexuses[0]);
      return { applied: true, count: 1 };
    },

    bpDebuff(ctx, params = {}) {
      const enemyState = getEnemyState(ctx);
      const enemySide = getEnemySide(ctx);
      const card = ctx.card || ctx.sourceCard;
      if (!enemyState || !enemyState.field || enemyState.field.length === 0) return { applied: false, count: 0 };

      const amount = params.amount || 2000;
      const count = params.count || 1;
      const eligible = enemyState.field.filter(u => !hasArmorAgainst(u, card?.color) && matchesUnitFilter(u, params.filter, card));
      if (eligible.length === 0) return { applied: false, count: 0 };

      const targets = params.allMatching ? eligible : eligible.slice(0, count);
      for (const t of targets) {
        t.turnBpBoost = (t.turnBpBoost || 0) - amount;
        recalcBp(ctx, t);
        if ((t.currentBp || 0) <= 0) {
          recycleSpiritCores(ctx, t, enemySide);
          sendToTrash(ctx, t, enemySide, `Reduced to 0 BP by ${card?.name || 'effect'}`);
          log(ctx, `💀 **[0 BP Destruction]**: "${t.name}" was reduced to 0 BP and destroyed!`, 'kill');
        }
      }
      render(ctx);
      return { applied: targets.length > 0, count: targets.length, targets };
    },

    passiveRule(ctx, params = {}) {
      const card = ctx.card || ctx.sourceCard;
      if (!card) return { applied: false, count: 0 };
      if (!Array.isArray(card.activePassiveRules)) card.activePassiveRules = [];
      card.activePassiveRules.push(params.rule || params);
      if (params.rule === 'CAN_BLOCK_WHILE_EXHAUSTED') {
        card.canBlockWhileExhausted = true;
        if (params.maxAttackerCost !== undefined) card.exhaustedBlockMaxCost = params.maxAttackerCost;
        return { applied: true, count: 1 };
      }
      if (params.rule === 'TREAT_AS_COLOR' && params.color) {
        if (!Array.isArray(card.colors)) card.colors = card.color ? [card.color] : [];
        if (!card.colors.includes(params.color)) card.colors.push(params.color);
        return { applied: true, count: 1 };
      }
      if (params.rule === 'BRILLIANCE') {
        card.hasBrilliance = true;
        return { applied: true, count: 1 };
      }
      if (params.rule === 'DISCARD_HAND') {
        const raw = String(params.text || card.effect || '');
        const isOpponent = /opponent\s+discards/i.test(raw);
        const targetState = isOpponent ? getEnemyState(ctx) : getFriendlyState(ctx);
        const targetSide = isOpponent ? getEnemySide(ctx) : ctx.side;
        if (targetState && Array.isArray(targetState.hand) && targetState.hand.length > 0) {
          const discarded = targetState.hand.pop();
          sendToTrash(ctx, discarded, targetSide, `Discarded by ${card.name || 'effect'}`);
          render(ctx);
          return { applied: true, count: 1 };
        }
        return { applied: false, count: 0 };
      }
      if (params.rule === 'STEP_MODIFIER') {
        return fx.endAttackStep(ctx, { timing: 'IMMEDIATE' });
      }
      return { applied: true, count: 1, passivePlaceholder: true };
    },

    executeSubEffect(ctx, stepDef, prevResult = null) {
      if (!stepDef) return { applied: false, count: 0 };
      if (stepDef.ifPreviousApplied && (!prevResult || !prevResult.applied)) {
        return { applied: false, count: 0 };
      }
      if (stepDef.subConditions && !cond.evaluateAll(ctx, stepDef.subConditions)) {
        return { applied: false, count: 0 };
      }
      if (stepDef.subCost && !cost.paySubCost(ctx, stepDef.subCost)) {
        return { applied: false, count: 0 };
      }

      const op = String(stepDef.op || '').toUpperCase();
      switch (op) {
        case 'BP_BUFF_SELF': return fx.buffBpSelf(ctx, stepDef);
        case 'BP_BUFF_ALLIES': return fx.buffBpAllies(ctx, stepDef);
        case 'BP_BUFF_TARGET': return fx.buffBpTarget(ctx, stepDef);
        case 'BP_DEBUFF': return fx.bpDebuff(ctx, stepDef);
        case 'CORE_FROM_VOID': return fx.coreFromVoid(ctx, stepDef);
        case 'CHARGE_CORE_VOID_TO_RESERVE': return fx.coreFromVoid(ctx, { target: 'RESERVE', count: stepDef.amount || stepDef.count || 1, ...stepDef });
        case 'CORE_DRAIN': return fx.drainCores(ctx, stepDef);
        case 'OPPONENT_SEND_CORES_MIN_ONE': return fx.opponentSendCoresMinOne(ctx, stepDef);
        case 'AWAKEN': return fx.awaken(ctx, stepDef);
        case 'ULTRA_AWAKEN': return fx.ultraAwaken(ctx, stepDef);
        case 'GRANT_HEAVY_ARMOR': return fx.grantHeavyArmor(ctx, stepDef);
        case 'DESTROY_BRAVE': return fx.destroyOpposingBrave(ctx, stepDef);
        case 'DESTROY_BY_BP': return fx.destroyByBp(ctx, stepDef);
        case 'DESTROY_BY_COST': return fx.destroyByCost(ctx, stepDef);
        case 'DESTROY_ONE_OF_EACH_COST': return fx.destroyOneOfEachCost(ctx, stepDef);
        case 'DESTROY_OPPOSING_SPIRIT':
          if (stepDef.filter && stepDef.filter.maxBp !== undefined) {
            return fx.destroyByBp(ctx, { maxBp: stepDef.filter.maxBp, ...stepDef });
          }
          return fx.destroyByCost(ctx, { maxCost: (stepDef.filter && stepDef.filter.maxCost !== undefined) ? stepDef.filter.maxCost : 6, ...stepDef });
        case 'DESTROY_EXHAUSTED': return fx.destroyExhausted(ctx, stepDef);
        case 'DESTROY_NEXUS': return fx.destroyNexus(ctx, stepDef);
        case 'BOUNCE_TO_HAND': return fx.bounceToHand(ctx, stepDef);
        case 'BOUNCE_TO_DECK': return fx.bounceToDeck(ctx, stepDef);
        case 'REFRESH_SPIRITS': return fx.refreshSpirits(ctx, stepDef);
        case 'REFRESH_SELF': return fx.refreshSpirits(ctx, { scope: 'SELF', ...stepDef });
        case 'ASSAULT_REFRESH': return fx.assaultRefresh(ctx, stepDef);
        case 'EXHAUST_SPIRITS': return fx.exhaustOpposing(ctx, stepDef);
        case 'EXHAUST_BY_ATTACKER_COST': return fx.exhaustByAttackerCost(ctx, stepDef);
        case 'DRAW':
        case 'DRAW_CARDS': return fx.drawCards(ctx, { count: stepDef.amount || stepDef.count || 1, ...stepDef });
        case 'CHOOSE_FAMILY_DRAW': return fx.chooseFamilyDraw(ctx, stepDef);
        case 'REVEAL_DECKTOP_ADD': return fx.revealDecktopAdd(ctx, stepDef);
        case 'DEPLOY_NEXUS_FROM_TRASH': return fx.deployNexusFromTrash(ctx, stepDef);
        case 'LOOK_OPPONENT_HAND_DISCARD': return fx.lookOpponentHandDiscard(ctx, stepDef);
        case 'SET_FLOATING_RETURN_DRAW': return fx.setFloatingReturnDraw(ctx, stepDef);
        case 'RETURN_SELF_FOR_TRIBUTE': return fx.returnSelfForTribute(ctx, stepDef);
        case 'PASSIVE_RULE': return fx.passiveRule(ctx, stepDef);
        case 'MILL_DECK': return fx.millDeck(ctx, stepDef);
        case 'SALVAGE_TRASH': return fx.salvageTrash(ctx, stepDef);
        case 'REANIMATE_TRASH': return fx.reanimateTrash(ctx, stepDef);
        case 'GRANT_KEYWORD': return fx.grantKeyword(ctx, stepDef);
        case 'GRANT_UNBLOCKABLE': return fx.grantUnblockable(ctx, stepDef);
        case 'ADD_EXTRA_SYMBOL': return fx.addExtraSymbol(ctx, stepDef);
        case 'DAMAGE_WALL': return fx.damageWall(ctx, stepDef);
        case 'END_ATTACK_STEP': return fx.endAttackStep(ctx, stepDef);
        case 'LIFE_DAMAGE': return fx.lifeDamage(ctx, stepDef);
        case 'CUSTOM_FN':
          if (typeof stepDef.fn === 'function') {
            return stepDef.fn(ctx, prevResult) || { applied: true, count: 1 };
          }
          return { applied: false, count: 0 };
        default:
          return { applied: false, count: 0 };
      }
    }
  };

  /**
   * Registers a Booster Set Saga card using the Two-Tier Handler schema:
   * - Tier 1: `overall` trigger key (e.g. 'WHEN_ATTACKS', 'WHEN_SUMMONED', 'FLASH', 'AURA_BP', etc.)
   * - Tier 2A: `subConditions` & `subCost`
   * - Tier 2B: `subEffects` array (or `auraBp` / `auraKeywords` descriptors)
   */
  function registerSagaCard(cardSpec) {
    if (!cardSpec || !cardSpec.cardNumber) return;
    const triggers = {};

    // Group ability definitions by Tier 1 Overall Condition
    const grouped = {};
    for (const ab of (cardSpec.abilities || [])) {
      let overallKey = String(ab.overall || ab.trigger || 'PASSIVE').toUpperCase();
      if (cardSpec.cardType === 'Magic' && overallKey === 'MAIN_STEP') {
        overallKey = 'MAIN';
      }
      if (!grouped[overallKey]) grouped[overallKey] = [];
      grouped[overallKey].push(ab);
    }

    for (const [overallKey, abList] of Object.entries(grouped)) {
      if (overallKey === 'AURA_BP') {
        triggers.AURA_BP = function(ctx) {
          let bonus = 0;
          for (const ab of abList) {
            if (!cond.evaluateAll(ctx, ab.subConditions)) continue;
            const target = ctx.targetSpirit || ctx.card;
            if (ab.targetFilter && !matchesUnitFilter(target, ab.targetFilter, ctx.sourceCard || ctx.card)) {
              continue;
            }
            const mult = computeScaleFactor(ctx, ab.scaleBy);
            bonus += (ab.amount || 0) * mult;
          }
          return bonus;
        };
      } else if (overallKey === 'AURA_KEYWORDS') {
        triggers.AURA_KEYWORDS = function(ctx) {
          const granted = [];
          for (const ab of abList) {
            if (!cond.evaluateAll(ctx, ab.subConditions)) continue;
            const target = ctx.targetSpirit || ctx.card;
            if (ab.targetFilter && !matchesUnitFilter(target, ab.targetFilter, ctx.sourceCard || ctx.card)) {
              continue;
            }
            if (ab.keyword) granted.push(ab.keyword);
          }
          return granted;
        };
      } else {
        triggers[overallKey] = function(ctx) {
          let anyApplied = false;
          for (const ab of abList) {
            // Tier 2A: Evaluate Sub-Internal-Conditions & Sub-Cost
            if (!cond.evaluateAll(ctx, ab.subConditions)) continue;
            if (ab.subCost && !cost.paySubCost(ctx, ab.subCost)) continue;

            // Tier 2B: Execute Sub-Internal-Effects in sequence
            let lastRes = null;
            for (const effStep of (ab.subEffects || [])) {
              lastRes = fx.executeSubEffect(ctx, effStep, lastRes);
              if (lastRes && lastRes.applied) anyApplied = true;
            }
          }
          return anyApplied;
        };
      }
    }

    // Also allow explicit custom trigger functions if provided
    if (cardSpec.customTriggers) {
      for (const [k, fn] of Object.entries(cardSpec.customTriggers)) {
        triggers[k.toUpperCase()] = fn;
      }
    }

    const existing = PerCardRegistry.get(cardSpec.cardNumber);
    if (existing && existing.triggers && Object.keys(existing.triggers).length > 0) {
      // Preserve explicit hand-crafted deck/arena handlers, and backfill any missing triggers or metadata
      for (const [k, fn] of Object.entries(triggers)) {
        if (!existing.triggers[k]) {
          existing.triggers[k] = fn;
        }
      }
      if (!existing.sagaAbilities) {
        existing.sagaAbilities = cardSpec.abilities || [];
      }
      const rawEff = cardSpec.effect || cardSpec.rawEffect || '';
      if (!existing.effect && rawEff) {
        existing.effect = rawEff;
        existing.rawEffect = rawEff;
      }
      return;
    }

    const rawEff = cardSpec.effect || cardSpec.rawEffect || '';
    PerCardRegistry.registerCard(cardSpec.aliases ? [cardSpec.cardNumber, ...cardSpec.aliases] : cardSpec.cardNumber, {
      name: cardSpec.name || cardSpec.cardNumber,
      cardType: cardSpec.cardType || 'Spirit',
      effect: rawEff,
      rawEffect: rawEff,
      isVanilla: Boolean(cardSpec.isVanilla),
      sagaAbilities: cardSpec.abilities || [],
      triggers
    });
  }

  return {
    cond,
    cost,
    fx,
    matchesFamily,
    matchesColor,
    matchesKeyword,
    matchesUnitFilter,
    hasArmorAgainst,
    registerSagaCard
  };
})();

if (typeof window !== 'undefined') {
  window.SagaConditionDSL = SagaConditionDSL;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SagaConditionDSL = SagaConditionDSL;
}
