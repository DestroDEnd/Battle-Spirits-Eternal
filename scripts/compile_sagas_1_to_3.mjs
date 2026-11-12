/**
 * scripts/compile_sagas_1_to_3.mjs
 *
 * Re-compiles all 21 set modules of Sagas 1–3 (Booster Set Saga, Constellation Saga, Heroes Saga)
 * directly from canonical card text in battle_spirits.db + compiler/index.js (compileCard) into
 * SagaConditionDSL two-tier handlers with:
 *   - 0 fake BP_BUFF_SELF: 1000 fallback stubs
 *   - 0 dummy AURA_KEYWORDS: "Passive" | "Tribute" stubs
 *   - Proper Magic MAIN vs FLASH vs BURST registration
 *   - Full sub-conditions, sub-costs, scaling, and interactive effect primitives
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { compileCard } from '../compiler/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const db = new DatabaseSync(path.join(rootDir, 'battle_spirits.db'), { readOnly: true });

const SAGA_SET_FILES = [
  'sd01_sd02_promos_cards.js',
  'sd03_bsc05_constellation_promos_cards.js',
  'sd06_sd11_heroes_promos_cards.js',
  'bs01_cards.js',
  'bs02_cards.js',
  'bs03_cards.js',
  'bs04_cards.js',
  'bs05_cards.js',
  'bs06_cards.js',
  'bs07_cards.js',
  'bs08_cards.js',
  'bs09_cards.js',
  'bs10_cards.js',
  'bs11_cards.js',
  'bs12_cards.js',
  'bs13_cards.js',
  'bs14_cards.js',
  'bs15_cards.js',
  'bs16_cards.js',
  'bs17_cards.js',
  'bs18_cards.js',
];

const REAL_KEYWORDS = [
  'Armor',
  'Heavy Armor',
  'Awaken',
  'Ultra Awaken',
  'Clash',
  'True-Clash',
  'Curse',
  'Crush',
  'Great Demolition',
  'High Speed',
  'Windstorm',
  'Holy Life',
  'Assault',
  'Brilliance',
  'Ice Wall',
  'Immortality',
  'Fragment',
  'Rage',
  'Shoot',
  'Shine',
  'Sprint',
  'Bind',
  'Magic Light',
  'Excite',
  'Rush',
  'Brave Condition',
];

function parseWordNum(str) {
  if (str === undefined || str === null) return 1;
  const s = String(str).trim().toLowerCase();
  const map = {
    a: 1, an: 1, one: 1,
    two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  };
  if (map[s] !== undefined) return map[s];
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 1 : n;
}

function parseLevelsFromBlock(block) {
  const lvMatches = [...block.matchAll(/\[LV(\d)\]/gi)].map(m => parseInt(m[1], 10));
  if (lvMatches.length > 0) {
    return [...new Set(lvMatches)].sort((a, b) => a - b);
  }
  const rangeMatch = block.match(/LV(\d)\s*[-~・]\s*LV(\d)/i);
  if (rangeMatch) {
    const s = parseInt(rangeMatch[1], 10);
    const e = parseInt(rangeMatch[2], 10);
    const res = [];
    for (let i = s; i <= e; i++) res.push(i);
    return res;
  }
  const singleMatch = block.match(/\bLV(\d)\b/i);
  if (singleMatch) return [parseInt(singleMatch[1], 10)];
  return null;
}

function extractRealKeyword(text) {
  for (const kw of REAL_KEYWORDS) {
    const re = new RegExp(`\\[(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?::[^\\]]+)?)\\]`, 'i');
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  const bCond = text.match(/Brave Condition\s*:\s*([^\n\r]+)/i);
  if (bCond) return `Brave Condition: ${bCond[1].trim()}`;
  return null;
}

function detectOverallAndTurn(block, cardType, hdr = {}) {
  const b = `${hdr.timingLabel || ''} ${hdr.keyword ? `[${hdr.keyword}]` : ''} ${block}`.trim();

  // Tribute target trigger (e.g., Dragron, Schwart, Jewelg, Sai-Drill, Kuyultha)
  if (/becomes?\s+the\s+target\s+of\s+(?:your\s+)?\[Tribute\]/i.test(b) ||
      /targeted\s+for\s+\[Tribute\]/i.test(b) ||
      /chosen\s+as\s+the\s+target\s+of\s+\[Tribute\]/i.test(b)) {
    return { overall: 'WHEN_TRIBUTED', turn: 'YOUR' };
  }

  // Magic card timing priority
  if (cardType === 'Magic') {
    if (/\[Burst:/i.test(b) || /^Burst\s*[-:]/i.test(b) || hdr.timing === 'BURST') {
      return { overall: 'BURST', turn: 'EITHER' };
    }
    if (/\[Main\]|^Main\s*[-:]/i.test(b) || hdr.isMain || hdr.timing === 'MAIN' || hdr.timing === 'MAIN_STEP') {
      return { overall: 'MAIN', turn: 'YOUR' };
    }
    if (/\[Flash\]|^Flash\s*[-:]/i.test(b) || hdr.isFlash || hdr.timing === 'FLASH') {
      return { overall: 'FLASH', turn: 'EITHER' };
    }
    return { overall: 'MAIN', turn: 'YOUR' };
  }

  if (/\[Burst:/i.test(b) || /^Burst\s*[-:]/i.test(b) || hdr.timing === 'BURST') {
    return { overall: 'BURST', turn: 'EITHER' };
  }
  if (/\[Main\]|^Main\s*[-:]/i.test(b) || hdr.isMain || hdr.timing === 'MAIN') {
    return { overall: 'MAIN', turn: 'YOUR' };
  }
  if (/\[Flash\]|^Flash\s*[-:]|\(Flash Step\)|Flash\s*-\s*\[(?:Awaken|Ultra Awaken|Change|High Speed)\]/i.test(b) || hdr.isFlash || hdr.timing === 'FLASH') {
    return { overall: 'FLASH', turn: 'EITHER' };
  }

  if (/\(When Summoned\)|when this (?:spirit|brave|nexus) is summoned/i.test(b) || hdr.timing === 'WHEN_SUMMONED') {
    return { overall: cardType === 'Nexus' ? 'WHEN_DEPLOYED' : 'WHEN_SUMMONED', turn: 'YOUR' };
  }
  if (/\(When Deployed\)/i.test(b) || hdr.timing === 'WHEN_DEPLOYED') {
    return { overall: 'WHEN_DEPLOYED', turn: 'YOUR' };
  }
  if (cardType !== 'Nexus' && (/\(When Attacks\/Blocks\)/i.test(b) || hdr.timing === 'WHEN_ATTACKS_OR_BLOCKS')) {
    return { overall: 'WHEN_ATTACKS', alsoTrigger: 'WHEN_BLOCKS', turn: 'EITHER' };
  }
  if (cardType !== 'Nexus' && (/\(When (?:Brave )?Attacks\)|\[Clash\]|\[True-Clash\]|\[Windstorm|\[Crush\]|\[Great Demolition\]|\[Holy Life\]|\[Assault|\[Shine\]|\[Shoot\]|\[Rage\]/i.test(b) || hdr.timing === 'WHEN_ATTACKS')) {
    return { overall: 'WHEN_ATTACKS', turn: 'YOUR' };
  }
  if (/\(When Blocks\)/i.test(b) || hdr.timing === 'WHEN_BLOCKS') {
    return { overall: 'WHEN_BLOCKS', turn: 'OPPONENT' };
  }
  if (/\(When Battles\)|\[Curse\]|when this spirit battles/i.test(b) || hdr.timing === 'WHEN_BATTLES') {
    return { overall: 'WHEN_BATTLES', turn: 'EITHER' };
  }
  if (/\(When Destroyed\)|when this spirit is destroyed/i.test(b) || hdr.timing === 'WHEN_DESTROYED') {
    return { overall: 'WHEN_DESTROYED', turn: 'EITHER' };
  }

  if (/\((Your|Opposing|Either)\s+Start\s+Step\)/i.test(b) || hdr.timingStep === 'START_STEP') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'START_STEP', turn: t };
  }
  if (/\((Your|Opposing|Either)\s+Core\s+Step\)/i.test(b) || hdr.timingStep === 'CORE_STEP') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'CORE_STEP', turn: t };
  }
  if (/\((Your|Opposing|Either)\s+Draw\s+Step\)/i.test(b) || hdr.timingStep === 'DRAW_STEP') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'DRAW_STEP', turn: t };
  }
  if (/\((Your|Opposing|Either)\s+Refresh\s+Step\)/i.test(b) || hdr.timingStep === 'REFRESH_STEP') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'REFRESH_STEP', turn: t };
  }
  if (/\((Your|Opposing|Either)\s+Main\s+(?:Step|Phase)\)/i.test(b) || hdr.timingStep === 'MAIN_STEP') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'MAIN_STEP', turn: t };
  }
  if (/\((Your|Opposing|Either)\s+End\s+Step\)|\(During End Step\)/i.test(b) || hdr.timingStep === 'END_STEP' || hdr.timing === 'END_OF_TURN') {
    const t = /Opposing/i.test(b) ? 'OPPONENT' : (/Either/i.test(b) ? 'EITHER' : 'YOUR');
    return { overall: 'END_STEP', turn: t };
  }

  if (/\((Your|Opposing|Either)\s+Attack\s+Step\)|\(During (Your|Opponent's|Either)\s+Battle\s+Phase\)/i.test(b) || hdr.timingStep === 'ATTACK_STEP') {
    let t = 'EITHER';
    if (/Your Attack Step|Your Battle Phase/i.test(b)) t = 'YOUR';
    else if (/Opposing Attack Step|Opponent's Battle Phase/i.test(b)) t = 'OPPONENT';
    if ((/(?:all|every|each)\s+.*?(?:spirits?|you\s+control).*?(?:\+\s*\d+\s*BP|gains?\s+\+\d+\s*BP)/i.test(b) ||
         /this\s+spirit\s+(?:gains?|gets?)\s+\+\d+\s*BP/i.test(b)) &&
        !/when\s+/i.test(b)) {
      return { overall: 'AURA_BP', turn: t };
    }
    return { overall: 'ATTACK_STEP', turn: t };
  }

  if (/\((Your|Opposing)\s+Turn\)/i.test(b)) {
    const t = /Your Turn/i.test(b) ? 'YOUR' : 'OPPONENT';
    if (/(?:\+\s*\d+\s*BP|BP\s*\+\s*\d+|\[Excite\])/i.test(b) && !/when\s+/i.test(b)) {
      return { overall: 'AURA_BP', turn: t };
    }
    return { overall: 'ATTACK_STEP', turn: t };
  }

  if ((/(?:\+\s*\d+\s*BP|BP\s*\+\s*\d+|\[Excite\])/i.test(b)) && !/when\s+/i.test(b)) {
    return { overall: 'AURA_BP', turn: 'EITHER' };
  }

  const realKw = extractRealKeyword(b);
  if (realKw) {
    return { overall: 'AURA_KEYWORDS', turn: 'EITHER', realKeyword: realKw };
  }

  return { overall: 'ATTACK_STEP', turn: 'EITHER' };
}

function parseSubConditions(block, defaultTurn, explicitLevels = null) {
  const sc = {};
  const levels = explicitLevels && explicitLevels.length > 0 ? explicitLevels : parseLevelsFromBlock(block);
  if (levels && levels.length > 0) sc.levels = levels;
  if (defaultTurn && defaultTurn !== 'EITHER') sc.turn = defaultTurn;

  if (/once per turn/i.test(block) && !/\[Assault:/i.test(block)) {
    sc.oncePerTurn = 'opt_1';
  }
  if (/\[During Brave\]|\[When Braved\]/i.test(block)) {
    sc.requireBraved = true;
  }
  if (/while your life is (\d+) or less/i.test(block)) {
    const m = block.match(/while your life is (\d+) or less/i);
    sc.requireLifeLte = parseInt(m[1], 10);
  }
  if (/while you (?:control|have) a[n]?\s+(Red|Purple|Green|White|Yellow|Blue)\s+Nexus/i.test(block)) {
    const m = block.match(/while you (?:control|have) a[n]?\s+(Red|Purple|Green|White|Yellow|Blue)\s+Nexus/i);
    sc.requireNexus = { color: m[1], min: 1 };
  } else if (/while you (?:control|have) a Nexus/i.test(block)) {
    sc.requireNexus = { min: 1 };
  }
  const famWhile = block.match(/(?:while|if) you (?:control|have).*?"([^"]+)"\s*family/i);
  if (famWhile) {
    sc.requireFamilyOnField = { family: famWhile[1], min: 1 };
  }
  const rushMatch = block.match(/\[Rush:\s*(Red|Purple|Green|White|Yellow|Blue)\]/i);
  if (rushMatch) {
    sc.requireSymbols = { color: rushMatch[1], min: 1 };
  }
  return sc;
}

function parseSubCost(block) {
  if (/\[Assault:\s*\d+\]/i.test(block)) {
    // Handled inside ASSAULT_REFRESH op so it asks player / checks once per turn
    return null;
  }
  if (/by exhausting (?:a|1|one of your) nexus/i.test(block)) {
    return { type: 'EXHAUST_NEXUS', count: 1 };
  }
  if (/by exhausting this (?:spirit|nexus)/i.test(block)) {
    return { type: 'EXHAUST_SELF' };
  }
  const payCoreM = block.match(/by (?:paying|moving|sending)\s+(\d+|a|one|two)\s+cores?\s+from\s+your\s+reserve\s+to\s+your\s+trash/i);
  if (payCoreM) {
    return { type: 'PAY_RESERVE_CORES', count: parseWordNum(payCoreM[1]) };
  }
  if (/by destroying (?:1|one|a) of your spirits/i.test(block)) {
    return { type: 'SACRIFICE_SPIRIT', count: 1 };
  }
  if (/by discarding (?:1|one|a) card from your hand/i.test(block)) {
    return { type: 'DISCARD_HAND', count: 1 };
  }
  return null;
}

function translateOverrideOpToSubEffect(clOp, rawText = '') {
  if (!clOp || !clOp.op) return null;
  const op = clOp.op.toUpperCase();

  if (op === 'BP_BUFF') {
    const amt = clOp.amount;
    if (typeof amt !== 'number' || (!rawText.includes(String(Math.abs(amt))) && !/\[Excite\]/i.test(rawText))) {
      return { op: 'PASSIVE_RULE', rule: op, text: rawText };
    }
    if (amt < 0) return { op: 'BP_DEBUFF', amount: amt, count: 1 };
    if (clOp.target === 'self') return { op: 'BP_BUFF_SELF', amount: amt };
    if (clOp.target === 'all' || /all\s+/i.test(rawText)) return { op: 'BP_BUFF_ALLIES', amount: amt, filter: {} };
    return { op: 'BP_BUFF_TARGET', amount: amt, count: 1 };
  }
  if (op === 'DRAW') {
    if (!/\bdraw\b/i.test(rawText)) return { op: 'PASSIVE_RULE', rule: op, text: rawText };
    return { op: 'DRAW_CARDS', count: clOp.count || 1 };
  }
  if (op === 'RECOVER_LIFE') {
    return { op: 'CORE_FROM_VOID', to: 'LIFE', count: clOp.count || 1 };
  }
  if (op === 'AWAKEN_CORE_MOVE') {
    return { op: 'AWAKEN', maxCores: 2 };
  }
  if (op === 'MOVE_CORE') {
    const fromZone = (clOp.from?.zone || '').toLowerCase();
    const toZone = (clOp.to?.zone || 'reserve').toUpperCase();
    const cnt = typeof clOp.count === 'number' ? clOp.count : 1;
    if (fromZone === 'void' && /\bvoid\b|\[charge|\bboost\b|\[holy life/i.test(rawText)) {
      const dest = toZone === 'FIELD' ? (clOp.to?.target === 'self' ? 'SELF' : 'TARGET_SPIRIT') : toZone;
      return { op: 'CORE_FROM_VOID', to: dest, count: cnt };
    }
    if (clOp.from?.side === 'opponent' || /opposing|opponent's|from a spirit to its owner's/i.test(rawText)) {
      return { op: 'CORE_DRAIN', count: cnt, to: toZone === 'FIELD' ? 'RESERVE' : toZone };
    }
    return { op: 'PASSIVE_RULE', rule: op, text: rawText };
  }
  if (op === 'DESTROY') {
    if (clOp.target?.types?.includes('Nexus') || /nexus/i.test(rawText)) {
      return { op: 'DESTROY_NEXUS', count: clOp.count || 1 };
    }
    if (clOp.target?.types?.includes('Brave') || /\bbrave\b/i.test(rawText)) {
      return { op: 'DESTROY_BRAVE', count: clOp.count || 1 };
    }
    if (clOp.target?.filters?.bpLte && rawText.includes(String(clOp.target.filters.bpLte))) {
      return { op: 'DESTROY_BY_BP', maxBp: clOp.target.filters.bpLte, count: clOp.count || 1 };
    }
    if (clOp.target?.filters?.costLte !== undefined && new RegExp(`cost\\s*${clOp.target.filters.costLte}\\b`, 'i').test(rawText)) {
      return { op: 'DESTROY_BY_COST', maxCost: clOp.target.filters.costLte, count: clOp.count || 1 };
    }
    if (clOp.target?.filters?.exhausted || /exhausted/i.test(rawText)) {
      return { op: 'DESTROY_EXHAUSTED', count: clOp.count || 1 };
    }
    const bpM = rawText.match(/(\d+)\s*BP(?:\s+or\s+less)?/i);
    if (bpM) {
      return { op: 'DESTROY_BY_BP', maxBp: parseInt(bpM[1], 10), count: clOp.count || 1, allMatching: /destroy\s+(?:all|every)/i.test(rawText) };
    }
    return { op: 'PASSIVE_RULE', rule: op, text: rawText };
  }
  if (op === 'BOUNCE' || op === 'BOUNCE_TO_DECKBOTTOM') {
    if (op === 'BOUNCE_TO_DECKBOTTOM' || /bottom\s+of.*?deck/i.test(rawText)) {
      return { op: 'BOUNCE_TO_DECK', position: 'BOTTOM', count: clOp.count || 1 };
    }
    if (/top\s+of.*?deck/i.test(rawText)) {
      return { op: 'BOUNCE_TO_DECK', position: 'TOP', count: clOp.count || 1 };
    }
    return { op: 'BOUNCE_TO_HAND', count: clOp.count || 1 };
  }
  if (op === 'EXHAUST') {
    return { op: 'EXHAUST_SPIRITS', count: typeof clOp.count === 'number' ? clOp.count : 1, allMatching: clOp.count === 'ALL' };
  }
  if (op === 'REFRESH' || op === 'REFRESH_BY_EXHAUSTING_NEXUS') {
    if (op === 'REFRESH_BY_EXHAUSTING_NEXUS') {
      return { op: 'ASSAULT_REFRESH', maxTimes: 1 };
    }
    const isSelf = clOp.target === 'self' || /this\s+spirit/i.test(rawText);
    return { op: 'REFRESH_SPIRITS', scope: isSelf ? 'SELF' : (clOp.count === 'ALL' ? 'ALL_MATCHING' : 'TARGET') };
  }
  if (op === 'SALVAGE') {
    return { op: 'SALVAGE_TRASH', count: clOp.count || 1 };
  }
  if (op === 'DEPLOY_NEXUS') {
    return { op: 'DEPLOY_NEXUS_FROM_TRASH', count: 1 };
  }
  if (op === 'RESURRECT' || op === 'SUMMON' || op === 'SUMMON_FREE') {
    return { op: 'REANIMATE_TRASH', count: 1 };
  }
  if (op === 'MILL_DECK') {
    return { op: 'MILL_DECK', side: 'OPPONENT', count: typeof clOp.count === 'number' ? clOp.count : 2 };
  }
  if (op === 'UNBLOCKABLE') {
    return { op: 'GRANT_UNBLOCKABLE', scope: 'SELF' };
  }
  if (op === 'FORCE_BLOCK') {
    return { op: 'GRANT_KEYWORD', scope: 'SELF', keyword: 'Clash' };
  }
  if (op === 'ADD_SYMBOL') {
    return { op: 'ADD_EXTRA_SYMBOL', scope: 'SELF', count: 1 };
  }
  if (op === 'DAMAGE_CAP' || op === 'PREVENT_LIFE_LOSS') {
    return { op: 'DAMAGE_WALL', maxLifeLoss: op === 'PREVENT_LIFE_LOSS' ? 0 : 1, preventAllLifeLoss: op === 'PREVENT_LIFE_LOSS' };
  }
  if (op === 'END_ATTACK_STEP' || op === 'END_BATTLE') {
    return { op: 'END_ATTACK_STEP', timing: 'END_OF_BATTLE' };
  }
  return { op: 'PASSIVE_RULE', rule: op, text: rawText };
}

function parseSubEffects(block, overall, overrideClauses = []) {
  const effects = [];
  const b = block;

  // 1. Special exact Sagas 1–3 mechanics
  // SD02-004 Haktak: Choose either (the) "Imaginary Beast" or (the) "Beast Head" family... draw a card
  const chooseFamDrawM = b.match(/choose\s+either\s+(?:the\s+)?"([^"]+)"\s+or\s+(?:the\s+)?"([^"]+)"\s+family\.\s*(?:draw\s+(?:a|1)\s+card\s+for\s+each\s+spirit\s+you\s+control\s+of\s+the\s+chosen\s+family|for\s+each\s+spirit\s+you\s+control\s+in\s+that\s+family,\s*draw\s+(?:a|1)\s+card)/i);
  if (chooseFamDrawM) {
    effects.push({
      op: 'CHOOSE_FAMILY_DRAW',
      families: [chooseFamDrawM[1], chooseFamDrawM[2]],
    });
    return effects;
  }

  // SD02-005 Cherubim: For each (Color) Symbol on your Field, reveal a card from your decktop. Add a (Type) card among them to the Hand.
  const revSymM = b.match(/(?:reveal\s+(?:a|1)\s+card\s+from\s+your\s+decktop\s+for\s+each\s+(Red|Purple|Green|White|Yellow|Blue)\s+symbol\s+on\s+your\s+field|for\s+each\s+(Red|Purple|Green|White|Yellow|Blue)\s+symbol\s+on\s+your\s+field,\s*reveal\s+(?:a|1)\s+card\s+from\s+your\s+decktop)\.\s*add\s+(?:a|1|an)\s+(Magic|Spirit|Brave|Nexus)\s+card\s+among\s+them\s+to\s+(?:your|the)\s+hand/i);
  if (revSymM) {
    effects.push({
      op: 'REVEAL_DECKTOP_ADD',
      scaleBySymbolColor: revSymM[1] || revSymM[2],
      filter: { type: revSymM[3] },
    });
    return effects;
  }

  // Generic Reveal X cards from decktop and add matching card to Hand
  const revFixedM = b.match(/reveal\s+(\d+|a|one|two|three|four|five)\s+cards?\s+from\s+your\s+decktop.*?\badd\s+(?:a|1|an|all)\s+(?:([^.\n]+?)\s+)?(Spirit|Magic|Brave|Nexus|card)s?\s+among\s+them\s+to\s+(?:your|the)\s+hand/i);
  if (revFixedM) {
    const cnt = parseWordNum(revFixedM[1]);
    const qualifier = (revFixedM[2] || '').trim();
    const cardType = revFixedM[3] && revFixedM[3].toLowerCase() !== 'card' ? revFixedM[3] : undefined;
    const famM = qualifier.match(/"([^"]+)"/);
    const colM = qualifier.match(/\b(Red|Purple|Green|White|Yellow|Blue)\b/i);
    effects.push({
      op: 'REVEAL_DECKTOP_ADD',
      count: cnt,
      filter: {
        ...(cardType ? { type: cardType } : {}),
        ...(famM ? { family: famM[1] } : {}),
        ...(colM ? { color: colM[1] } : {}),
      },
    });
    return effects;
  }

  // SD02-006 Weaseve: Deploy a Nexus card from your Trash, without paying the cost.
  if (/deploy\s+(?:a|1|up\s+to\s+\d+)\s+nexus\s+cards?\s+from\s+your\s+trash/i.test(b)) {
    effects.push({ op: 'DEPLOY_NEXUS_FROM_TRASH', count: 1 });
    return effects;
  }

  // SD02-010 Lowen: Destroy opposing Cost 0/1/2/3/4 Spirits, one of each.
  const oneOfEachCostM = b.match(/destroy\s+opposing\s+cost\s+([0-9/]+)\s+spirits?,\s*one\s+of\s+each/i);
  if (oneOfEachCostM) {
    const costs = oneOfEachCostM[1].split('/').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n));
    effects.push({ op: 'DESTROY_ONE_OF_EACH_COST', costs });
    return effects;
  }

  // SD02-011 Bahamunt: Look at the entire opposing Hand, and discard a Magic card among them.
  if (/look\s+at\s+(?:the\s+entire\s+)?opposing\s+hand,\s*and\s+discard\s+(?:a|1)\s+(Magic|Spirit|Brave|Nexus)?\s*card/i.test(b)) {
    const m = b.match(/discard\s+(?:a|1)\s+(Magic|Spirit|Brave|Nexus)?\s*card/i);
    effects.push({
      op: 'LOOK_OPPONENT_HAND_DISCARD',
      count: 1,
      filter: m && m[1] ? { type: m[1] } : {},
    });
    return effects;
  }

  // SD02-017 Swamp Notrader: When an opposing Spirit attacks, exhaust opposing Spirits with a higher cost than the attacking Spirit.
  if (/when\s+an\s+opposing\s+spirit\s+attacks,\s*exhaust\s+opposing\s+spirits?\s+with\s+a\s+higher\s+cost\s+than\s+the\s+attacking\s+spirit/i.test(b)) {
    effects.push({ op: 'EXHAUST_BY_ATTACKER_COST' });
    return effects;
  }

  // Return Draw: During this turn, each time a Spirit is returned to the Hand from the Field, draw a card.
  if (/during\s+this\s+turn,\s*(?:each\s+time\s+a\s+spirit\s+is\s+returned\s+to\s+the\s+hand|when\s+spirits?\s+you\s+control\s+would\s+return\s+to\s+your\s+hand).*?draw\s+(?:a|1)\s+card/i.test(b)) {
    effects.push({ op: 'SET_FLOATING_RETURN_DRAW' });
    return effects;
  }

  // SD02-009 Kuyultha: When this Spirit becomes the target of [Tribute], by returning this Spirit to the Hand...
  if (overall === 'WHEN_TRIBUTED' && /return(?:ing)?\s+this\s+spirit\s+to\s+(?:your|the)\s+hand/i.test(b)) {
    effects.push({ op: 'RETURN_SELF_FOR_TRIBUTE' });
    return effects;
  }

  // SD02-019 Schwart: Send two cores from any opposing Spirits without [Tribute] to their Trash / opponent must send two cores...
  if (/(?:opponent\s+must\s+)?send\s+(two|\d+|a|one)\s+cores?\s+from\s+(?:their|any\s+opposing)\s+spirits?(?:\s+without\s+\[Tribute\])?\s+to\s+their\s+trash/i.test(b)) {
    const m = b.match(/send\s+(two|\d+|a|one)\s+cores?/i);
    effects.push({
      op: 'OPPONENT_SEND_CORES_MIN_ONE',
      count: m ? parseWordNum(m[1]) : 2,
      to: 'TRASH',
    });
    return effects;
  }

  // SD02-021 Sai-Drill: Return an opposing 5000 BP or less Spirit without [Tribute] to the decktop/deckbottom
  const bounceDeckBpM = b.match(/return\s+an?\s+opposing\s+(\d+)\s*BP\s+or\s+less\s+spirit(?:\s+without\s+\[Tribute\])?\s+to\s+the\s+deck(top|bottom)/i);
  if (bounceDeckBpM) {
    effects.push({
      op: 'BOUNCE_TO_DECK',
      position: bounceDeckBpM[2].toUpperCase(),
      count: 1,
      filter: {
        maxBp: parseInt(bounceDeckBpM[1], 10),
        ...(/without\s+\[Tribute\]/i.test(b) ? { withoutKeyword: 'Tribute' } : {}),
      },
    });
    return effects;
  }

  // 2. Standard keywords & actions
  if (/\[Ultra Awaken\]/i.test(b)) {
    effects.push({ op: 'ULTRA_AWAKEN', maxCores: 2, bpBonus: 3000 });
  } else if (/\[Awaken\]/i.test(b)) {
    effects.push({ op: 'AWAKEN', maxCores: 2 });
  }
  if (/\[Clash\]|\[True-Clash\]/i.test(b)) {
    effects.push({ op: 'GRANT_KEYWORD', scope: 'SELF', keyword: 'Clash' });
  }
  if (/\[Curse\]/i.test(b)) {
    effects.push({ op: 'GRANT_KEYWORD', scope: 'SELF', keyword: 'Curse' });
  }
  if (/\[Holy Life\]/i.test(b)) {
    effects.push({ op: 'CORE_FROM_VOID', to: 'LIFE', count: 1 });
  }
  if (/\[Crush\]/i.test(b)) {
    effects.push({ op: 'MILL_DECK', side: 'OPPONENT', scaleByLevel: true, perLevel: 1 });
  }
  const windM = b.match(/\[Windstorm:\s*(\d+)\]/i);
  if (windM) {
    effects.push({ op: 'EXHAUST_SPIRITS', count: parseInt(windM[1], 10) });
  }
  const assaultM = b.match(/\[Assault:\s*(\d+)\]/i);
  if (assaultM) {
    effects.push({ op: 'ASSAULT_REFRESH', maxTimes: parseInt(assaultM[1], 10) || 1 });
  }
  if (/\[Great Demolition\]/i.test(b)) {
    effects.push({ op: 'MILL_DECK', side: 'OPPONENT', count: 5 });
  }

  // Draw cards (with optional scaling or discard)
  const drawM = b.match(/draw\s+(\d+|a|one|two|three|four)\s+cards?/i);
  if (drawM) {
    const cnt = parseWordNum(drawM[1]);
    const discM = b.match(/discard\s+(\d+|a|one|two|three)\s+cards?\s+from\s+your\s+hand/i);
    const famScaleM = b.match(/for\s+each\s+.*?"([^"]+)"/i);
    effects.push({
      op: 'DRAW_CARDS',
      count: cnt,
      ...(discM ? { thenDiscard: parseWordNum(discM[1]) } : {}),
      ...(famScaleM ? { scaleBy: { type: 'FAMILY', family: famScaleM[1] } } : {}),
    });
  }

  // Core from Void
  const voidM = b.match(/(?:put|place|add|take)\s+(\d+|a|one|two|three|four)\s+cores?\s+from\s+the\s+void\s+(?:to|into|onto|on)\s+(this\s+spirit|your\s+reserve|your\s+life|your\s+trash|a\s+spirit)/i);
  if (voidM && !/\[Holy Life\]/i.test(b)) {
    const cnt = parseWordNum(voidM[1]);
    const destRaw = voidM[2].toLowerCase();
    let to = 'RESERVE';
    if (destRaw.includes('this spirit')) to = 'SELF';
    else if (destRaw.includes('life')) to = 'LIFE';
    else if (destRaw.includes('trash')) to = 'TRASH';
    else if (destRaw.includes('a spirit')) to = 'TARGET_SPIRIT';
    effects.push({ op: 'CORE_FROM_VOID', to, count: cnt });
  }

  // Core drain
  const drainM = b.match(/(?:remove|send|move|place)\s+(?:all\s+but\s+one\s+of\s+the\s+|up\s+to\s+)?(\d+|a|one|two|three)?\s*cores?\s+(?:from|on)\s+(?:an?\s+|1\s+|one\s+of\s+your\s+|each\s+|every\s+)?(?:opposing|opponent's)\s+spirits?\s+to\s+(?:the\s+|their\s+|his\/her\s+|opponent's\s+)?(reserve|trash|void)/i);
  if (drainM) {
    const cnt = drainM[1] ? parseWordNum(drainM[1]) : 2;
    const to = drainM[2].toUpperCase();
    const allMatching = /each\s+opposing|every\s+opposing|all\s+opposing/i.test(b);
    effects.push({ op: 'CORE_DRAIN', count: cnt, to, allMatching });
  }

  // Destroy by BP
  const destBpM = b.match(/destroy\s+(?:all\s+|every\s+|any\s+number\s+of\s+|up\s+to\s+(\d+)\s+|(two|three|\d+|an?|one)\s+)?(?:opposing\s+)?(?:spirits?\s+(?:up\s+to\s+a\s+total\s+of|with)\s+)?(\d+)\s*BP(?:\s+or\s+less)?/i);
  if (destBpM) {
    const maxBp = parseInt(destBpM[3], 10);
    const allMatching = /destroy\s+(?:all|every)|any\s+number/i.test(b);
    const cnt = destBpM[1] ? parseInt(destBpM[1], 10) : (destBpM[2] ? parseWordNum(destBpM[2]) : 1);
    const filter = /without\s+\[Tribute\]/i.test(b) ? { withoutKeyword: 'Tribute' } : undefined;
    effects.push({
      op: 'DESTROY_BY_BP',
      maxBp,
      count: cnt,
      allMatching,
      ...(filter ? { filter } : {}),
    });
  }

  // Destroy by Cost
  const destCostM = b.match(/destroy\s+(?:all\s+|an?\s+|1\s+|two\s+|up\s+to\s+\d+\s+)?opposing\s+cost\s+(\d+)\s+or\s+less\s+spirits?/i) ||
                    b.match(/destroy\s+(?:all\s+|an?\s+|1\s+|two\s+)?opposing\s+spirits?\s+with\s+cost\s+(\d+)\s+or\s+less/i);
  if (destCostM) {
    const maxCost = parseInt(destCostM[1], 10);
    const allMatching = /destroy\s+all/i.test(b);
    const cnt = /destroy\s+two/i.test(b) ? 2 : 1;
    effects.push({ op: 'DESTROY_BY_COST', maxCost, count: cnt, allMatching });
  }

  // Destroy Exhausted
  if (/destroy\s+(?:all\s+|an?\s+|1\s+|two\s+|\d+\s+)?(?:opposing\s+)?exhausted\s+spirits?/i.test(b) ||
      /destroy\s+(?:all\s+|an?\s+|1\s+)?opposing\s+spirits?\s+that\s+are\s+exhausted/i.test(b)) {
    const allMatching = /destroy\s+all/i.test(b);
    effects.push({ op: 'DESTROY_EXHAUSTED', count: 1, allMatching });
  }

  // Destroy Nexus
  if (/destroy\s+(?:all\s+|an?\s+|1\s+|one\s+)?(?:opposing\s+)?nexus(?:es)?/i.test(b)) {
    const allMatching = /destroy\s+all/i.test(b);
    effects.push({ op: 'DESTROY_NEXUS', count: 1, allMatching });
  }

  //Bounce to Hand / Deck
  if (/return\s+.*?to\s+(?:the\s+|their\s+|owner's\s+)?hand/i.test(b) && !/from\s+your\s+trash/i.test(b) && !/each\s+time\s+a\s+spirit\s+is\s+returned/i.test(b)) {
    const allMatching = /return\s+all/i.test(b);
    effects.push({ op: 'BOUNCE_TO_HAND', count: 1, allMatching });
  } else if (/return\s+.*?to\s+the\s+(top|bottom)\s+of\s+(?:the\s+|their\s+|owner's\s+)?deck/i.test(b) && !/reveal/i.test(b)) {
    const posM = b.match(/to\s+the\s+(top|bottom)\s+of/i);
    effects.push({ op: 'BOUNCE_TO_DECK', position: (posM ? posM[1] : 'BOTTOM').toUpperCase(), count: 1 });
  }

  // Exhaust opposing
  if (!windM && /exhaust\s+(?:all\s+|up\s+to\s+)?(\d+|a|an|one|two|three)?\s*(?:opposing\s+)?spirits?/i.test(b) && !/by exhausting/i.test(b)) {
    const exM = b.match(/exhaust\s+(?:all\s+|up\s+to\s+)?(\d+|a|an|one|two|three)?\s*(?:opposing\s+)?spirits?/i);
    const allMatching = /exhaust\s+all/i.test(b);
    const cnt = exM && exM[1] ? parseWordNum(exM[1]) : 1;
    effects.push({ op: 'EXHAUST_SPIRITS', count: cnt, allMatching });
  }

  // Refresh Spirits
  if (!assaultM && /\brefresh\s+(this\s+spirit|all\s+.*?spirits?|(\d+|a|an|one|two)\s+.*?spirits?)/i.test(b)) {
    const refM = b.match(/\brefresh\s+(this\s+spirit|all\s+.*?spirits?|(\d+|a|an|one|two)\s+.*?spirits?)/i);
    const phrase = refM[1].toLowerCase();
    if (phrase.includes('this spirit')) {
      effects.push({ op: 'REFRESH_SPIRITS', scope: 'SELF' });
    } else if (phrase.includes('all')) {
      const famM = b.match(/refresh\s+all\s+.*?"([^"]+)"/i);
      effects.push({ op: 'REFRESH_SPIRITS', scope: 'ALL_MATCHING', filter: famM ? { family: famM[1] } : {} });
    } else {
      effects.push({ op: 'REFRESH_SPIRITS', scope: 'TARGET', count: 1 });
    }
  }

  // Salvage / Reanimate from Trash
  if (/return\s+.*?from\s+your\s+trash\s+to\s+your\s+hand/i.test(b)) {
    const colM = b.match(/return\s+.*?(Red|Purple|Green|White|Yellow|Blue)\s+.*?from\s+your\s+trash/i);
    const typeM = /magic\s+card/i.test(b) ? 'Magic' : (/brave\s+card/i.test(b) ? 'Brave' : (/nexus\s+card/i.test(b) ? 'Nexus' : 'Spirit'));
    effects.push({ op: 'SALVAGE_TRASH', count: 1, filter: { type: typeM, color: colM ? colM[1] : undefined } });
  } else if (/summon\s+.*?from\s+your\s+trash/i.test(b)) {
    effects.push({ op: 'REANIMATE_TRASH', count: 1 });
  }

  // Mill deck
  const millM = b.match(/discard\s+(\d+|a|one|two|three|four|five|six|seven|eight|ten)\s+cards?\s+from\s+the\s+top\s+of\s+(?:your\s+opponent's|opposing|their)\s+deck/i);
  if (millM && !/\[Crush\]/i.test(b) && !/\[Great Demolition\]/i.test(b)) {
    effects.push({ op: 'MILL_DECK', side: 'OPPONENT', count: parseWordNum(millM[1]) });
  }

  // Unblockable
  if (/can't\s+be\s+blocked|cannot\s+be\s+blocked/i.test(b)) {
    effects.push({ op: 'GRANT_UNBLOCKABLE', scope: 'SELF' });
  }

  // Extra symbol
  if (/adds?\s+(?:one|1|an\s+extra)\s+.*?symbol/i.test(b)) {
    effects.push({ op: 'ADD_EXTRA_SYMBOL', scope: 'SELF', count: 1 });
  }

  // End Attack Step / Damage Wall
  if (/end\s+the\s+attack\s+step/i.test(b)) {
    const isEndBattle = /when\s+this\s+battle\s+ends|at\s+the\s+end\s+of\s+(?:this\s+|the\s+)?battle/i.test(b);
    effects.push({ op: 'END_ATTACK_STEP', timing: isEndBattle ? 'END_OF_BATTLE' : 'IMMEDIATE' });
  }
  if (/only\s+lose\s+1\s+life|can\s+only\s+be\s+reduced\s+by\s+1|not\s+lose\s+life|life\s+is\s+not\s+reduced/i.test(b)) {
    const preventAll = /not\s+lose\s+life|life\s+is\s+not\s+reduced/i.test(b);
    effects.push({ op: 'DAMAGE_WALL', maxLifeLoss: preventAll ? 0 : 1, preventAllLifeLoss: preventAll });
  }

  // BP Debuff (-X000 BP)
  const bpDebuffM = b.match(/-\s*(\d{3,5})\s*BP/i);
  if (bpDebuffM) {
    const amt = -Math.abs(parseInt(bpDebuffM[1], 10));
    effects.push({ op: 'BP_DEBUFF', amount: amt, count: 1, allMatching: /all\s+opposing/i.test(b) });
  }

  // BP Buff (+X000 BP) — ONLY if text explicitly has +BP or BP+
  const bpM = b.match(/(?:\+|gains?\s+\+|gets?\s+\+|give\s+.*?\+)(\d{3,5})\s*BP/i) ||
              b.match(/BP\s*\+\s*(\d{3,5})/i);
  if (bpM && overall !== 'AURA_BP') {
    const amt = parseInt(bpM[1], 10);
    const famScaleM = b.match(/for\s+each\s+.*?"([^"]+)"/i);
    const scaleBy = famScaleM ? { type: 'FAMILY', family: famScaleM[1] } : undefined;
    if (/all\s+.*?spirits?/i.test(b)) {
      const famFilterM = b.match(/all\s+.*?"([^"]+)"/i);
      const colFilterM = b.match(/all\s+(?:your\s+)?(Red|Purple|Green|White|Yellow|Blue)\s+spirits?/i);
      effects.push({
        op: 'BP_BUFF_ALLIES',
        amount: amt,
        filter: {
          ...(famFilterM ? { family: famFilterM[1] } : {}),
          ...(colFilterM ? { color: colFilterM[1] } : {}),
        },
        ...(scaleBy ? { scaleBy } : {}),
      });
    } else if (/this\s+spirit/i.test(b)) {
      effects.push({ op: 'BP_BUFF_SELF', amount: amt, ...(scaleBy ? { scaleBy } : {}) });
    } else {
      effects.push({ op: 'BP_BUFF_TARGET', amount: amt, count: 1, ...(scaleBy ? { scaleBy } : {}) });
    }
  }

  // Translate structured compiler clauses if no regex pattern matched
  if (effects.length === 0 && Array.isArray(overrideClauses)) {
    for (const cl of overrideClauses) {
      const tr = translateOverrideOpToSubEffect(cl.op, cl.rawText || b);
      if (tr) {
        // Guard against emitting BP_BUFF_SELF when text doesn't mention BP or Excite
        if ((tr.op === 'BP_BUFF_SELF' || tr.op === 'BP_BUFF_ALLIES' || tr.op === 'BP_BUFF_TARGET') &&
            !/\bBP\b|\[Excite\]/i.test(b)) {
          effects.push({ op: 'PASSIVE_RULE', rule: 'CONTINUOUS_RULE', text: b });
        } else {
          effects.push(tr);
        }
      }
    }
  }

  // NEVER emit fake BP_BUFF_SELF: 1000 fallback! Emit PASSIVE_RULE instead.
  if (effects.length === 0 && overall !== 'AURA_BP' && overall !== 'AURA_KEYWORDS') {
    effects.push({ op: 'PASSIVE_RULE', rule: 'CONTINUOUS_RULE', text: b });
  }

  return effects;
}

function compileCardEntry(existingSpec) {
  const cn = existingSpec.cardNumber;
  const row = db.prepare('SELECT * FROM cards WHERE card_number = ?').get(cn);
  const rawEff = (row?.effect || existingSpec.effect || '').trim();
  const cardType = row?.type || existingSpec.cardType || 'Spirit';
  const name = row?.name || existingSpec.name || cn;

  if (!rawEff) {
    return {
      cardNumber: cn,
      ...(existingSpec.aliases ? { aliases: existingSpec.aliases } : {}),
      name,
      cardType,
      isVanilla: true,
      abilities: [],
    };
  }

  const ir = row ? compileCard(row) : { abilities: [] };
  const abilities = [];

  if (ir && Array.isArray(ir.abilities) && ir.abilities.length > 0) {
    for (const ab of ir.abilities) {
      const hdr = ab.header || {};
      const bodyText = `${hdr.timingLabel || ''} ${hdr.keyword ? `[${hdr.keyword}]` : ''} ${hdr.cleanBody || ''}`.trim() || rawEff;
      const { overall, alsoTrigger, turn, realKeyword } = detectOverallAndTurn(bodyText, cardType, hdr);
      const explicitLevels = hdr.levelExplicit ? hdr.levels : null;
      const subConditions = parseSubConditions(bodyText, turn, explicitLevels);
      const subCost = parseSubCost(bodyText);

      if (overall === 'AURA_BP') {
        const bpM = bodyText.match(/(?:\+|gains?\s+\+|gets?\s+\+)(\d{3,5})\s*BP/i) || bodyText.match(/BP\s*\+\s*(\d{3,5})/i);
        const rawClBp = (ab.clauses || []).find(c => c.op?.op === 'BP_BUFF')?.op?.amount;
        const clBp = (rawClBp && bodyText.includes(String(Math.abs(rawClBp)))) ? rawClBp : null;
        const amount = clBp || (bpM ? parseInt(bpM[1], 10) : (/\[Excite\]/i.test(bodyText) ? 1000 : null));
        if (!amount) {
          const subEffects = parseSubEffects(bodyText, 'ATTACK_STEP', ab.clauses || []);
          abilities.push({
            overall: 'ATTACK_STEP',
            subConditions,
            ...(subCost ? { subCost } : {}),
            subEffects,
          });
          continue;
        }
        const targetFilter = {};
        const colM = bodyText.match(/(?:all|each|every)\s+(?:of\s+)?(?:your\s+)?(Red|Purple|Green|White|Yellow|Blue)\s+spirits?/i);
        if (colM) targetFilter.color = colM[1];
        const famM = bodyText.match(/"([^"]+)"\s*family/i);
        if (famM) targetFilter.family = famM[1];
        const kwM = bodyText.match(/spirits?\s+with\s+\[([^\]:]+)\]/i);
        if (kwM) targetFilter.keyword = kwM[1];

        abilities.push({
          overall: 'AURA_BP',
          subConditions,
          ...(Object.keys(targetFilter).length > 0 ? { targetFilter } : {}),
          amount,
        });
      } else if (overall === 'AURA_KEYWORDS') {
        const kw = realKeyword || extractRealKeyword(bodyText);
        if (kw && kw !== 'Passive' && !/^Tribute/i.test(kw)) {
          abilities.push({
            overall: 'AURA_KEYWORDS',
            subConditions,
            keyword: kw,
          });
        } else {
          const subEffects = parseSubEffects(bodyText, 'ATTACK_STEP', ab.clauses || []);
          abilities.push({
            overall: 'ATTACK_STEP',
            subConditions,
            ...(subCost ? { subCost } : {}),
            subEffects,
          });
        }
      } else {
        const subEffects = parseSubEffects(bodyText, overall, ab.clauses || []);
        abilities.push({
          overall,
          subConditions,
          ...(subCost ? { subCost } : {}),
          subEffects,
        });
        if (alsoTrigger) {
          abilities.push({
            overall: alsoTrigger,
            subConditions,
            ...(subCost ? { subCost } : {}),
            subEffects,
          });
        }
      }
    }
  } else {
    const rawBlocks = rawEff
      .split(/\n+(?=\[LV\d|\[Main\]|Main\s*[-:]|\[Flash\]|Flash\s*[-:]|\[Burst|\(When|\(Your|\(Opposing|\(Either|\[Awaken\]|\[Clash\]|\[Curse\]|\[Crush\]|\[Armor|\[High Speed\])/i)
      .map(s => s.trim())
      .filter(Boolean);

    for (const blk of rawBlocks) {
      const { overall, alsoTrigger, turn, realKeyword } = detectOverallAndTurn(blk, cardType);
      const subConditions = parseSubConditions(blk, turn);
      const subCost = parseSubCost(blk);

      if (overall === 'AURA_BP') {
        const bpM = blk.match(/(?:\+|gains?\s+\+|gets?\s+\+)(\d{3,5})\s*BP/i) || blk.match(/BP\s*\+\s*(\d{3,5})/i);
        const amount = bpM ? parseInt(bpM[1], 10) : 1000;
        const targetFilter = {};
        const colM = blk.match(/(?:all|each|every)\s+(?:of\s+)?(?:your\s+)?(Red|Purple|Green|White|Yellow|Blue)\s+spirits?/i);
        if (colM) targetFilter.color = colM[1];
        const famM = blk.match(/"([^"]+)"\s*family/i);
        if (famM) targetFilter.family = famM[1];
        abilities.push({
          overall: 'AURA_BP',
          subConditions,
          ...(Object.keys(targetFilter).length > 0 ? { targetFilter } : {}),
          amount,
        });
      } else if (overall === 'AURA_KEYWORDS') {
        const kw = realKeyword || extractRealKeyword(blk);
        if (kw && kw !== 'Passive' && !/^Tribute/i.test(kw)) {
          abilities.push({
            overall: 'AURA_KEYWORDS',
            subConditions,
            keyword: kw,
          });
        } else {
          const subEffects = parseSubEffects(blk, 'ATTACK_STEP');
          abilities.push({
            overall: 'ATTACK_STEP',
            subConditions,
            ...(subCost ? { subCost } : {}),
            subEffects,
          });
        }
      } else {
        const subEffects = parseSubEffects(blk, overall);
        abilities.push({
          overall,
          subConditions,
          ...(subCost ? { subCost } : {}),
          subEffects,
        });
        if (alsoTrigger) {
          abilities.push({
            overall: alsoTrigger,
            subConditions,
            ...(subCost ? { subCost } : {}),
            subEffects,
          });
        }
      }
    }
  }

  return {
    cardNumber: cn,
    ...(existingSpec.aliases ? { aliases: existingSpec.aliases } : {}),
    name,
    cardType,
    effect: rawEff,
    isVanilla: false,
    abilities,
  };
}

let grandTotalCards = 0;
let grandTotalEffects = 0;

for (const fileName of SAGA_SET_FILES) {
  const filePath = path.join(rootDir, 'engine/cards/sets', fileName);
  const src = fs.readFileSync(filePath, 'utf8');
  const exportMatch = src.match(/export const ([A-Z0-9_]+)\s*=/);
  const exportConstName = exportMatch ? exportMatch[1] : `${fileName.replace('_cards.js', '').toUpperCase()}_SAGA_CARDS`;

  const mod = require(filePath);
  const existingSpecs = Object.values(mod).find(v => Array.isArray(v)) || [];

  const recompiled = existingSpecs.map(spec => compileCardEntry(spec));
  recompiled.sort((a, b) => a.cardNumber.localeCompare(b.cardNumber));

  const effCnt = recompiled.filter(s => !s.isVanilla).length;
  const vanCnt = recompiled.filter(s => s.isVanilla).length;
  grandTotalCards += recompiled.length;
  grandTotalEffects += effCnt;

  const outCode = `/**
 * engine/cards/sets/${fileName}
 *
 * Sagas 1–3 Deterministic Two-Tier Per-Card Handlers (${exportConstName})
 * Total Cards: ${recompiled.length} (${effCnt} Effect, ${vanCnt} Vanilla)
 */

import { SagaConditionDSL } from '../condition_dsl.js';

export const ${exportConstName} = ${JSON.stringify(recompiled, null, 2)};

for (const spec of ${exportConstName}) {
  SagaConditionDSL.registerSagaCard(spec);
}
`;

  fs.writeFileSync(filePath, outCode, 'utf8');
  console.log(`Re-compiled ${fileName}: ${recompiled.length} cards (${effCnt} effect, ${vanCnt} vanilla)`);
}

console.log(`TOTAL Sagas 1–3 Cards Re-compiled: ${grandTotalCards} (${grandTotalEffects} effect cards)`);
