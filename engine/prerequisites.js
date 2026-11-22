/**
 * engine/prerequisites.js
 *
 * Structured Prerequisite, Keyword Declaration, and Team Restriction Evaluators
 * and Runtime Consumers for Brave Condition, Summon Condition, Mirage, Release /
 * True Release, and Team Metadata.
 */

import { moveCard, moveCore } from './zones.js';
import { calculateEffectiveCost, canAffordCost, buildPaymentPlan, payCost } from './payment.js';

const COLOR_LIST = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];

function parseSingleBraveRequirement(rawSegment) {
  const seg = String(rawSegment || '').trim();
  const req = {
    raw: seg,
    slot: null,
    minCost: null,
    maxCost: null,
    exactCost: null,
    allowedTypes: [],
    requiredColors: [],
    requiredFamilies: [],
    requiredTeams: [],
    noPrintedEffects: false,
    cantBrave: false
  };
  if (/^\[Right\]/i.test(seg)) req.slot = 'Right';
  else if (/^\[Left\]/i.test(seg)) req.slot = 'Left';

  if (/can['’]?t\s+brave|cannot\s+brave/i.test(seg)) {
    req.cantBrave = true;
  }
  const minM = seg.match(/cost\s+(\d+)\s+or\s+(?:more|higher)/i);
  if (minM) req.minCost = parseInt(minM[1], 10);
  const maxM = seg.match(/cost\s+(\d+)\s+or\s+(?:less|lower)/i);
  if (maxM) req.maxCost = parseInt(maxM[1], 10);
  const eqM = seg.match(/\bcost\s+(\d+)\b(?!\s+or\s+(?:more|higher|less|lower))/i);
  if (eqM && req.minCost === null && req.maxCost === null) req.exactCost = parseInt(eqM[1], 10);

  if (/\bSpirit\b/i.test(seg)) req.allowedTypes.push('Spirit');
  if (/\bUltimate\b/i.test(seg)) req.allowedTypes.push('Ultimate');
  for (const col of COLOR_LIST) {
    if (new RegExp(`\\b${col}\\b`, 'i').test(seg)) req.requiredColors.push(col);
  }
  for (const m of seg.matchAll(/"([^"]+)"\s+family/gi)) {
    req.requiredFamilies.push(m[1].trim());
  }
  for (const m of seg.matchAll(/\[([A-Za-z][^\]]+)\]/g)) {
    const tag = m[1].trim();
    if (!/^(?:Right|Left|Soul Core)$/i.test(tag)) {
      req.requiredTeams.push(tag);
    }
  }
  if (/no\s+(?:printed\s+)?effects?/i.test(seg)) req.noPrintedEffects = true;
  return req;
}

export function parseBraveCondition(keywordOrRaw) {
  const text = String(keywordOrRaw || '').replace(/<br\s*\/?>/gi, ' / ').trim();
  if (!/brave\s*condition/i.test(text) && !/can['’]?t\s+brave/i.test(text)) return null;

  const body = text.replace(/^\[?Brave\s*Condition:\s*/i, '').replace(/\]$/, '').trim();
  const hasDualSlots = /\[Right\]/i.test(body) && /\[Left\]/i.test(body);
  const slotParts = hasDualSlots
    ? body.split(/(?=\[(?:Right|Left)\])/i).map(s => s.trim()).filter(Boolean)
    : [body];

  const requirements = slotParts.map(parseSingleBraveRequirement);
  const primary = requirements[0] || parseSingleBraveRequirement(body);

  return {
    raw: text,
    multiSlot: requirements.length > 1,
    requirements,
    minCost: primary.minCost,
    maxCost: primary.maxCost,
    exactCost: primary.exactCost,
    allowedTypes: [...new Set(requirements.flatMap(r => r.allowedTypes))],
    requiredColors: [...new Set(requirements.flatMap(r => r.requiredColors))],
    requiredFamilies: [...new Set(requirements.flatMap(r => r.requiredFamilies))],
    requiredTeams: [...new Set(requirements.flatMap(r => r.requiredTeams))],
    noPrintedEffects: requirements.some(r => r.noPrintedEffects),
    cantBrave: requirements.some(r => r.cantBrave)
  };
}

function stackSatisfiesBraveRequirement(state, targetStack, req) {
  const target = targetStack.top;
  const targetCost = Number(target.cost ?? 0);
  if (req.cantBrave) {
    return { allowed: false, reason: 'BRAVE_CONDITION_CANNOT_BRAVE' };
  }
  if (req.minCost !== null && targetCost < req.minCost) {
    return { allowed: false, reason: `BRAVE_COST_TOO_LOW: required >= ${req.minCost}, got ${targetCost}` };
  }
  if (req.maxCost !== null && targetCost > req.maxCost) {
    return { allowed: false, reason: `BRAVE_COST_TOO_HIGH: required <= ${req.maxCost}, got ${targetCost}` };
  }
  if (req.exactCost !== null && targetCost !== req.exactCost) {
    return { allowed: false, reason: `BRAVE_COST_MISMATCH: required ${req.exactCost}, got ${targetCost}` };
  }
  if (req.allowedTypes.length > 0 && !req.allowedTypes.includes(target.type)) {
    return { allowed: false, reason: `BRAVE_TYPE_MISMATCH: required ${req.allowedTypes.join('/')}, got ${target.type}` };
  }
  if (req.requiredColors.length > 0) {
    const targetColors = Array.isArray(target.colors) ? target.colors : [target.color].filter(Boolean);
    if (!req.requiredColors.some(c => targetColors.some(tc => String(tc).toLowerCase() === c.toLowerCase()))) {
      return { allowed: false, reason: `BRAVE_COLOR_MISMATCH: required ${req.requiredColors.join('/')}` };
    }
  }
  if (req.requiredFamilies.length > 0) {
    const fams = Array.isArray(target.families) ? target.families : (target.family ? [target.family] : []);
    if (!req.requiredFamilies.some(rf => fams.some(f => String(f || '').toLowerCase().includes(rf.toLowerCase())))) {
      return { allowed: false, reason: `BRAVE_FAMILY_MISMATCH: required ${req.requiredFamilies.join('/')}` };
    }
  }
  if (req.requiredTeams.length > 0) {
    if (!req.requiredTeams.some(tm => hasTeam(target, tm, state, targetStack))) {
      return { allowed: false, reason: `BRAVE_TEAM_MISMATCH: required ${req.requiredTeams.join('/')}` };
    }
  }
  if (req.noPrintedEffects && ((target.effect && target.effect.trim() !== '') || (target.abilities && target.abilities.length > 0))) {
    return { allowed: false, reason: 'BRAVE_REQUIRES_VANILLA_TARGET' };
  }
  return { allowed: true, reason: null };
}

export function evaluateBraveCondition(state, braveCard, targetStack, playerSide = null, options = {}) {
  if (!targetStack || !targetStack.top) return { allowed: false, reason: 'NO_TARGET_STACK' };
  const ownerSide = targetStack.owner || targetStack.top.currentOwner || targetStack.top.owner;
  if (playerSide && ownerSide && ownerSide !== playerSide) {
    return { allowed: false, reason: 'BRAVE_TARGET_NOT_OWNED' };
  }
  if (playerSide && state?.players?.[playerSide]?.field && !state.players[playerSide].field.some(st => st.id === targetStack.id || st === targetStack)) {
    return { allowed: false, reason: 'BRAVE_TARGET_NOT_ON_FIELD' };
  }

  const abs = braveCard?.compiledIr?.abilities || braveCard?.abilities || [];
  const condAbs = abs.filter(a => a?.type === 'CONDITION' && /brave\s*condition/i.test(a?.header?.keyword || a?.rawText || ''));
  const condSources = condAbs.map(ab => [ab.header?.keyword, ab.header?.cleanBody, ab.rawText].filter(Boolean).join(' '));
  if (condSources.length === 0 && typeof braveCard?.effect === 'string' && /\[Brave\s+Condition:/i.test(braveCard.effect)) {
    const m = braveCard.effect.match(/\[Brave\s+Condition:\s*((?:\[[^\]]*\]|[^\]])+)\]?/i);
    if (m) condSources.push(m[0]);
  }
  if (condSources.length === 0) return { allowed: true, reason: null };

  for (const raw of condSources) {
    const spec = parseBraveCondition(raw);
    if (!spec) continue;
    if (spec.multiSlot) {
      const slot = options.slot || options.braveSlot || null;
      const candidateReqs = slot
        ? spec.requirements.filter(r => !r.slot || r.slot.toLowerCase() === String(slot).toLowerCase())
        : spec.requirements;
      const results = candidateReqs.map(r => stackSatisfiesBraveRequirement(state, targetStack, r));
      if (!results.some(res => res.allowed)) {
        return results[0] || { allowed: false, reason: 'BRAVE_MULTI_SLOT_CONDITION_NOT_MET' };
      }
    } else {
      for (const req of spec.requirements) {
        const res = stackSatisfiesBraveRequirement(state, targetStack, req);
        if (!res.allowed) return res;
      }
    }
  }
  return { allowed: true, reason: null };
}

export function parseSummonCondition(text) {
  const s = String(text || '').trim();
  if (!/summon\s*condition/i.test(s)) return null;

  const lifeMaxM = s.match(/your\s+life\s+is\s+(?:at\s+)?(\d+)\s+or\s+less/i);
  if (lifeMaxM) return { kind: 'LIFE_AT_MOST', maxLife: parseInt(lifeMaxM[1], 10), raw: s };

  const lifeMinM = s.match(/your\s+life\s+is\s+(?:at\s+)?(\d+)\s+or\s+more/i);
  if (lifeMinM) return { kind: 'LIFE_AT_LEAST', minLife: parseInt(lifeMinM[1], 10), raw: s };

  const ctrlCostM = s.match(/you\s+control\s+(?:one|\d+)\s+or\s+more\s+cost\s+(\d+)\s+or\s+(?:higher|more)\s+spirit/i);
  if (ctrlCostM) return { kind: 'CONTROL_MIN_COST_SPIRIT', minCost: parseInt(ctrlCostM[1], 10), raw: s };

  const mustHaveColorM = s.match(/you\s+(?:must\s+have|control)\s+(one|two|three|\d+)\s+or\s+more\s+(Red|Purple|Green|White|Yellow|Blue)\s+(?:\[([^\]]+)\]\s+)?spirit/i);
  if (mustHaveColorM) {
    const wordMap = { one: 1, two: 2, three: 3 };
    const count = wordMap[mustHaveColorM[1].toLowerCase()] || parseInt(mustHaveColorM[1], 10) || 1;
    return { kind: 'CONTROL_COLOR_SPIRIT', minCount: count, color: mustHaveColorM[2], team: mustHaveColorM[3] || null, raw: s };
  }

  const ctrlTeamM = s.match(/you\s+(?:must\s+have|control)\s+(?:a|an|one|\d+)(?:\s+or\s+more)?\s+\[([^\]]+)\]\s+spirit/i);
  if (ctrlTeamM) return { kind: 'CONTROL_TEAM_SPIRIT', team: ctrlTeamM[1].trim(), raw: s };

  const ctrlFamM = s.match(/you\s+(?:must\s+have|control)\s+(?:a|an|one|\d+)(?:\s+or\s+more)?\s+"([^"]+)"\s+family\s+spirit/i);
  if (ctrlFamM) return { kind: 'CONTROL_FAMILY_SPIRIT', family: ctrlFamM[1].trim(), raw: s };

  if (/including\s+being\s+in\s+soul\s+state/i.test(s) && /your\s+counter\s+is\s+(\d+)\s+or\s+more/i.test(s)) {
    const cm = s.match(/your\s+counter\s+is\s+(\d+)\s+or\s+more/i);
    return { kind: 'COUNTER_AT_LEAST', minCounter: parseInt(cm[1], 10), raw: s };
  }

  return { kind: 'UNSUPPORTED_SUMMON_CONDITION', raw: s };
}

export function evaluateSummonCondition(state, card, playerSide = 'player') {
  const abs = card?.compiledIr?.abilities || card?.abilities || [];
  const condTexts = [];
  for (const ab of abs) {
    if (ab?.type === 'CONDITION') {
      for (const p of (ab.header?.prefixes || [])) {
        if (/summon\s*condition/i.test(p)) condTexts.push(p);
      }
      if (ab.header?.keyword && /summon\s*condition/i.test(ab.header.keyword)) {
        condTexts.push(ab.header.keyword);
      }
      if (ab.rawText && /summon\s*condition/i.test(ab.rawText)) condTexts.push(ab.rawText);
    }
  }
  if (condTexts.length === 0 && typeof card?.effect === 'string' && /\[Summon\s+Condition:/i.test(card.effect)) {
    const m = card.effect.match(/\[Summon\s+Condition:\s*[^\]]+\]?/i);
    if (m) condTexts.push(m[0]);
  }
  const suAdconTexts = extractSuAdconTexts(card);
  if (condTexts.length === 0 && suAdconTexts.length === 0) return { allowed: true, reason: null };

  const player = state.players?.[playerSide];
  if (!player) return { allowed: false, reason: 'INVALID_PLAYER' };

  for (const txt of new Set(condTexts)) {
    const spec = parseSummonCondition(txt);
    if (!spec) continue;
    if (spec.kind === 'LIFE_AT_MOST') {
      if ((player.life ?? 0) > spec.maxLife) {
        return { allowed: false, reason: `SUMMON_CONDITION_LIFE_TOO_HIGH: required <= ${spec.maxLife}, got ${player.life}` };
      }
    } else if (spec.kind === 'LIFE_AT_LEAST') {
      if ((player.life ?? 0) < spec.minLife) {
        return { allowed: false, reason: `SUMMON_CONDITION_LIFE_TOO_LOW: required >= ${spec.minLife}, got ${player.life}` };
      }
    } else if (spec.kind === 'CONTROL_MIN_COST_SPIRIT') {
      const ok = (player.field || []).some(st => st?.top?.type === 'Spirit' && Number(st.top.cost ?? 0) >= spec.minCost);
      if (!ok) return { allowed: false, reason: `SUMMON_CONDITION_MISSING_COST_${spec.minCost}_SPIRIT` };
    } else if (spec.kind === 'CONTROL_COLOR_SPIRIT') {
      const matches = (player.field || []).filter(st => {
        if (st?.top?.type !== 'Spirit') return false;
        const cols = Array.isArray(st.top.colors) ? st.top.colors : [st.top.color].filter(Boolean);
        const colOk = cols.some(c => String(c).toLowerCase() === spec.color.toLowerCase());
        const teamOk = !spec.team || hasTeam(st.top, spec.team, state, st);
        return colOk && teamOk;
      });
      if (matches.length < (spec.minCount || 1)) {
        return { allowed: false, reason: `SUMMON_CONDITION_MISSING_${spec.color.toUpperCase()}_SPIRIT` };
      }
    } else if (spec.kind === 'CONTROL_TEAM_SPIRIT') {
      const ok = (player.field || []).some(st => st?.top?.type === 'Spirit' && hasTeam(st.top, spec.team, state, st));
      if (!ok) return { allowed: false, reason: `SUMMON_CONDITION_MISSING_TEAM_${spec.team}` };
    } else if (spec.kind === 'CONTROL_FAMILY_SPIRIT') {
      const ok = (player.field || []).some(st => {
        if (st?.top?.type !== 'Spirit') return false;
        const fams = Array.isArray(st.top.families) ? st.top.families : [st.top.family].filter(Boolean);
        return fams.some(f => String(f || '').toLowerCase().includes(spec.family.toLowerCase()));
      });
      if (!ok) return { allowed: false, reason: `SUMMON_CONDITION_MISSING_FAMILY_${spec.family}` };
    } else if (spec.kind === 'COUNTER_AT_LEAST') {
      if ((player.counter ?? 0) < spec.minCounter) {
        return { allowed: false, reason: `SUMMON_CONDITION_COUNTER_TOO_LOW: required >= ${spec.minCounter}` };
      }
    } else {
      return { allowed: false, reason: 'UNSUPPORTED_SUMMON_CONDITION' };
    }
  }
  if (suAdconTexts.length > 0) {
    const advCheck = evaluateAdventCondition(state, card, playerSide);
    if (!advCheck.allowed) return advCheck;
  }
  return { allowed: true, reason: null };
}

const SUADCON_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

function parseSuAdconNumber(token) {
  if (token == null) return null;
  const s = String(token).trim().toLowerCase();
  if (s in SUADCON_WORDS) return SUADCON_WORDS[s];
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function extractSuAdconTexts(card) {
  const texts = [];
  const abs = card?.compiledIr?.abilities || card?.abilities || [];
  for (const ab of abs) {
    const candidates = [
      ...(ab?.header?.prefixes || []),
      ...(ab?.header?.keyword ? [ab.header.keyword] : []),
      ...(ab?.rawText ? [ab.rawText] : [])
    ];
    for (const txt of candidates) {
      if (/suadcon/i.test(String(txt))) texts.push(String(txt).trim());
    }
  }
  if (typeof card?.effect === 'string' && /\[SuAdcon:/i.test(card.effect)) {
    for (const m of card.effect.matchAll(/\[SuAdcon:\s*[^\]]+\]/gi)) {
      texts.push(m[0].trim());
    }
  }
  return [...new Set(texts)];
}

export function parseSuAdconCondition(rawText) {
  const s = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!/suadcon/i.test(s)) return null;
  const body = s.replace(/^\[?SuAdcon:\s*/i, '').replace(/\]$/, '').trim();

  const namedSoulM = body.match(/you\s+control\s+one\s+or\s+more\s+[“"”]([^"“”]+)[”"”]\s*,?\s*including\s+being\s+in\s+Soul\s+State\/pre-advent\s+condition/i);
  if (namedSoulM) {
    return {
      kind: 'CONTROL_NAMED_INCLUDING_SOUL_STATE',
      targetName: namedSoulM[1].trim(),
      includeSoulStateAndPreAdvent: true,
      raw: s
    };
  }

  if (/you\s+control\s+no\s+Spirits\s*(?:&|and)\s*have\s+0\s+Spirit\s+cards\s+in\s+your\s+Trash/i.test(body)) {
    return {
      kind: 'NO_SPIRITS_FIELD_AND_TRASH',
      raw: s
    };
  }

  const lifeMaxM = body.match(/your\s+life\s+is\s+at\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+or\s+less/i);
  if (lifeMaxM) {
    return {
      kind: 'LIFE_AT_MOST',
      maxLife: parseSuAdconNumber(lifeMaxM[1]),
      raw: s
    };
  }

  return { kind: 'UNSUPPORTED_SUADCON', raw: s };
}

export function parseAdventDeclaration(cardOrText) {
  const sources = [];
  if (typeof cardOrText === 'string') {
    sources.push(cardOrText);
  } else if (cardOrText && typeof cardOrText === 'object') {
    const abs = cardOrText.compiledIr?.abilities || cardOrText.abilities || [];
    for (const ab of abs) {
      if (ab?.header?.keyword) sources.push(String(ab.header.keyword));
      for (const p of (ab?.header?.prefixes || [])) sources.push(String(p));
      if (ab?.rawText) sources.push(String(ab.rawText));
    }
    for (const kw of (cardOrText.compiledIr?.keywords || cardOrText.keywords || [])) {
      const n = typeof kw === 'string' ? kw : kw?.name;
      const p = typeof kw === 'string' ? '' : (kw?.parameter || '');
      if (/advent/i.test(String(n || ''))) sources.push(`${n}${p ? `: ${p}` : ''}`);
    }
    if (typeof cardOrText.effect === 'string') sources.push(cardOrText.effect);
  }

  const combined = sources.join('\n');
  let adventMatch = combined.match(/(?:\[|【)?((?:Flag\s+|Reverse\s+|Ultra\s+|Final\s+)?Contract\s+Advent|(?:Super|Grand\s+)?Advent|Twinkle|煌臨)\s*[：:]\s*([^\]】\n]+)(?:\]|】)?/i);
  const suAdconSpecs = extractSuAdconTexts(typeof cardOrText === 'object' ? cardOrText : { effect: combined })
    .map(parseSuAdconCondition)
    .filter(Boolean);

  if (!adventMatch && suAdconSpecs.length === 0) return null;

  const adventType = adventMatch ? adventMatch[1].trim() : 'Advent';
  let body = adventMatch ? adventMatch[2].trim() : '';

  const isContractAdvent = /(?:flag\s+|reverse\s+|ultra\s+|final\s+)?contract\s+advent|(?:旗|裏|超|最終)?契約煌臨/i.test(adventType);
  const isFlagContractAdvent = /flag\s+contract\s+advent|旗契約煌臨/i.test(adventType);

  const timeMatch = body.match(/\(?\s*\(([^)]+)\)\)?|『([^』]+)』/i);
  let timingWindow = null;
  if (timeMatch) {
    timingWindow = (timeMatch[1] || timeMatch[2] || '').trim();
    body = body.replace(timeMatch[0], '').replace(/,\s*$/, '').trim();
  }

  // Quote-safe tokenization
  const parts = [];
  let buffer = '';
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '"' || ch === '“' || ch === '”') {
      inQuotes = !inQuotes;
      buffer += ch;
    } else if (!inQuotes && (ch === '&' || ch === ',')) {
      if (buffer.trim()) parts.push(buffer.trim());
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  if (buffer.trim()) parts.push(buffer.trim());

  const normalizedParts = [];
  for (const p of parts) {
    for (const s of p.split(/\s+and\s+/i)) {
      if (s.trim()) normalizedParts.push(s.trim());
    }
  }

  let minCost = null;
  let maxCost = null;
  let minCounter = null;
  let duringAdvent = false;
  const colorOptions = [];
  const criteria = [];

  for (const part of normalizedParts) {
    const p = part.trim();
    if (!p) continue;
    const moreM = p.match(/cost\s*(\d+)\s*or\s*(?:more|higher)|コスト(\d+)以上/i);
    const lessM = p.match(/cost\s*(\d+)\s*or\s*(?:less|lower)|コスト(\d+)以下/i);
    const countM = p.match(/C(\d+)\s*or\s*more|count\s*(\d+)\s*or\s*more|カウント(\d+)以上/i);

    if (moreM) {
      minCost = parseInt(moreM[1] || moreM[2], 10);
      continue;
    }
    if (lessM) {
      maxCost = parseInt(lessM[1] || lessM[2], 10);
      continue;
    }
    if (countM) {
      minCounter = parseInt(countM[1] || countM[2] || countM[3], 10);
      continue;
    }
    if (/during\s+advent|煌臨中/i.test(p)) {
      duringAdvent = true;
      continue;
    }

    const orOptions = p.split('/').map(opt => opt.replace(/^[“"\[]+|[”"\]]+$/g, '').trim()).filter(Boolean);
    const isAllColors = orOptions.every(opt => COLOR_LIST.some(col => col.toLowerCase() === opt.toLowerCase()));
    if (isAllColors) {
      colorOptions.push(orOptions.map(c => c.toLowerCase()));
      continue;
    }

    criteria.push({
      raw: p,
      options: orOptions.map(opt => ({
        text: opt.toLowerCase(),
        isColor: COLOR_LIST.some(col => col.toLowerCase() === opt.toLowerCase()),
        isContractSpirit: /contract spirit/i.test(opt)
      }))
    });
  }

  const requiredColors = colorOptions.flat();
  const requiredFamilies = criteria.flatMap(c => c.options.map(o => o.text));

  return {
    adventType,
    raw: body,
    isContractAdvent,
    isFlagContractAdvent,
    minCost,
    maxCost,
    minCounter,
    duringAdvent,
    colorOptions,
    criteria,
    requiredColors,
    requiredFamilies,
    timingWindow,
    suAdconSpecs
  };
}

function stackContainsCardName(stack, targetNameLower) {
  if (!stack) return false;
  const eq = n => String(n || '').trim().toLowerCase() === targetNameLower;
  if (eq(stack.top?.name)) return true;
  if (Array.isArray(stack.braves) && stack.braves.some(b => eq(b?.name))) return true;
  if (Array.isArray(stack.under) && stack.under.some(u => eq(u?.name))) return true;
  return false;
}

export function evaluateAdventCondition(state, card, playerSide = 'player', options = {}) {
  const player = state?.players?.[playerSide];
  if (!player) return { allowed: false, reason: 'INVALID_PLAYER', evaluatedSpecs: [] };

  if (options.targetStack) {
    const st = options.targetStack;
    const owner = st.owner || st.top?.currentOwner || st.top?.owner;
    if (owner && owner !== playerSide) {
      return { allowed: false, reason: 'ADVENT_TARGET_NOT_OWNED', evaluatedSpecs: [] };
    }
    if (Array.isArray(player.field) && !player.field.some(f => f.id === st.id || f === st)) {
      return { allowed: false, reason: 'ADVENT_TARGET_NOT_ON_FIELD', evaluatedSpecs: [] };
    }
  }

  const suTexts = extractSuAdconTexts(card);
  const evaluatedSpecs = [];

  for (const txt of suTexts) {
    const spec = parseSuAdconCondition(txt);
    if (!spec) continue;
    evaluatedSpecs.push(spec);

    if (spec.kind === 'CONTROL_NAMED_INCLUDING_SOUL_STATE') {
      const targetLower = spec.targetName.toLowerCase();
      const onField = (player.field || []).some(st => stackContainsCardName(st, targetLower));
      const inNexus = (player.nexus || []).some(nx =>
        nx?.top ? stackContainsCardName(nx, targetLower) : String(nx?.name || '').trim().toLowerCase() === targetLower
      );
      const inSoulZone = (player.soulState || player.soul || []).some(s =>
        s?.top ? stackContainsCardName(s, targetLower) : String(s?.name || '').trim().toLowerCase() === targetLower
      );
      if (!onField && !inNexus && !inSoulZone) {
        return {
          allowed: false,
          reason: `SUADCON_MISSING_CONTROLLED_CARD:${spec.targetName}`,
          evaluatedSpecs
        };
      }
    } else if (spec.kind === 'NO_SPIRITS_FIELD_AND_TRASH') {
      const hasFieldSpirit = (player.field || []).some(st =>
        st?.top && String(st.top.type || '').trim() === 'Spirit' && !st.isSoulState
      );
      if (hasFieldSpirit) {
        return { allowed: false, reason: 'SUADCON_SPIRIT_CONTROLLED_ON_FIELD', evaluatedSpecs };
      }
      const hasTrashSpirit = (player.grave || []).some(c => c && String(c.type || '').trim() === 'Spirit') ||
        (player.trashCards || []).some(c => c && String(c.type || '').trim() === 'Spirit');
      if (hasTrashSpirit) {
        return { allowed: false, reason: 'SUADCON_SPIRIT_CARD_IN_TRASH', evaluatedSpecs };
      }
    } else if (spec.kind === 'LIFE_AT_MOST') {
      const life = Number(player.life ?? 0);
      if (life > spec.maxLife) {
        return {
          allowed: false,
          reason: `SUADCON_LIFE_TOO_HIGH: required <= ${spec.maxLife}, got ${life}`,
          evaluatedSpecs
        };
      }
    } else {
      return { allowed: false, reason: 'UNSUPPORTED_SUADCON_CONDITION', evaluatedSpecs };
    }
  }

  if (options.enforceTargetFilter && options.targetStack) {
    const decl = parseAdventDeclaration(card);
    if (decl) {
      if (decl.minCounter !== null && Number(player.counters ?? player.counter ?? 0) < decl.minCounter) {
        return { allowed: false, reason: `ADVENT_COUNTER_TOO_LOW: required >= ${decl.minCounter}`, evaluatedSpecs };
      }
      if (decl.minCost !== null && Number(options.targetStack.top?.cost ?? 0) < decl.minCost) {
        return { allowed: false, reason: `ADVENT_TARGET_COST_TOO_LOW: required >= ${decl.minCost}`, evaluatedSpecs };
      }
      if (decl.maxCost !== null && Number(options.targetStack.top?.cost ?? 0) > decl.maxCost) {
        return { allowed: false, reason: `ADVENT_TARGET_COST_TOO_HIGH: required <= ${decl.maxCost}`, evaluatedSpecs };
      }
      if (decl.duringAdvent) {
        const isAdv = options.targetStack.isAdvent || (Array.isArray(options.targetStack.under) && options.targetStack.under.length > 0) || (Array.isArray(options.targetStack.braves) && options.targetStack.braves.length > 0);
        if (!isAdv) {
          return { allowed: false, reason: 'ADVENT_TARGET_NOT_DURING_ADVENT', evaluatedSpecs };
        }
      }
      if (decl.colorOptions && decl.colorOptions.length > 0) {
        const cols = (Array.isArray(options.targetStack.top?.colors) ? options.targetStack.top.colors : [options.targetStack.top?.color].filter(Boolean)).map(c => String(c).toLowerCase());
        for (const allowedSet of decl.colorOptions) {
          if (!allowedSet.some(c => cols.includes(c))) {
            return { allowed: false, reason: 'ADVENT_TARGET_COLOR_MISMATCH', evaluatedSpecs };
          }
        }
      } else if (decl.requiredColors && decl.requiredColors.length > 0) {
        const cols = Array.isArray(options.targetStack.top?.colors) ? options.targetStack.top.colors : [options.targetStack.top?.color].filter(Boolean);
        if (!decl.requiredColors.some(c => cols.some(tc => String(tc).toLowerCase() === c.toLowerCase()))) {
          return { allowed: false, reason: 'ADVENT_TARGET_COLOR_MISMATCH', evaluatedSpecs };
        }
      }
      if (decl.criteria && decl.criteria.length > 0) {
        const stackCards = [
          options.targetStack.top,
          ...(Array.isArray(options.targetStack.under) ? options.targetStack.under : []),
          ...(Array.isArray(options.targetStack.braves) ? options.targetStack.braves : [])
        ].filter(Boolean);

        for (const crit of decl.criteria) {
          const matches = crit.options.some(opt => {
            return stackCards.some(cardInStack => {
              const typeLower = String(cardInStack.type || '').toLowerCase();
              if (opt.isContractSpirit) {
                return typeLower.includes('contract') || cardInStack.isContract || cardInStack.isContractCard || (cardInStack.card_number && cardInStack.card_number.includes('-C'));
              }
              if (opt.isColor) {
                const cols = (Array.isArray(cardInStack.colors) ? cardInStack.colors : [cardInStack.color].filter(Boolean)).map(c => String(c).toLowerCase());
                return cols.includes(opt.text);
              }
              const nameLower = String(cardInStack.name || '').toLowerCase();
              if (nameLower.includes(opt.text)) return true;
              if (opt.text.includes('contract') && (typeLower.includes('contract') || cardInStack.isContract || cardInStack.isContractCard || nameLower.includes('partner') || (cardInStack.card_number && cardInStack.card_number.includes('-C')))) return true;
              if (nameLower.includes('javad') && opt.text.includes('hell contract')) return true;
              if (nameLower.includes('zetter') && opt.text.includes('extreme contract')) return true;
              if (nameLower.includes('protagonist') && opt.text.includes('wild')) return true;
              const famList = [
                ...(Array.isArray(cardInStack.families) ? cardInStack.families : []),
                ...(cardInStack.family ? [cardInStack.family] : [])
              ].flatMap(f => String(f).toLowerCase().split(/[\/,\s]+/)).filter(Boolean);
              return famList.some(f => f.includes(opt.text) || opt.text.includes(f));
            });
          });
          if (!matches) {
            return { allowed: false, reason: 'ADVENT_TARGET_FAMILY_OR_NAME_MISMATCH', evaluatedSpecs };
          }
        }
      }
    }
  }

  return { allowed: true, reason: null, evaluatedSpecs };
}

export function evaluateAbilityPrefixPrerequisites(state, ability, context = {}) {
  const header = ability?.header || {};
  const prefixes = [
    ...(Array.isArray(header.prefixes) ? header.prefixes : []),
    ...(header.keyword ? [header.keyword] : [])
  ].map(p => String(p).trim()).filter(Boolean);

  const checkedPrefixes = [];
  const controller = context.controller || context.sourceStack?.owner || context.sourceCard?.owner || 'player';
  const player = state?.players?.[controller];
  const stack = context.sourceStack || null;
  const card = context.sourceCard || stack?.top || null;

  for (const rawPref of prefixes) {
    const lower = rawPref.toLowerCase();

    if (/\bduring\s+brave\b|\bwhen\s+braved\b/.test(lower)) {
      checkedPrefixes.push('During Brave');
      const isBraved = Boolean(context.isBraved) ||
        Boolean(stack && ((Array.isArray(stack.braves) && stack.braves.length > 0) || (card && stack.top?.id !== card.id && (stack.braves || []).some(b => b?.id === card.id))));
      if (!isBraved) {
        return { allowed: false, reason: 'PREFIX_REQUIRES_DURING_BRAVE', checkedPrefixes };
      }
    }

    if (/\bduring\s+advent\b/.test(lower) || header.duringAdvent) {
      checkedPrefixes.push('During Advent');
      const isAdvented = Boolean(context.isAdvented || stack?.isAdvented || (stack?.under && stack.under.length > 0));
      if (!isAdvented) {
        return { allowed: false, reason: 'PREFIX_REQUIRES_DURING_ADVENT', checkedPrefixes };
      }
    }

    if (/\bduring\s+oc\b/.test(lower)) {
      checkedPrefixes.push('During OC');
      const cardEff = String(card?.effect || ability?.rawText || '');
      const ocM = cardEff.match(/(?:OC(?:\s+Condition)?\s*:?\s*C?|Overcount\s*)(\d+)/i);
      const minOc = context.ocThreshold ?? header.ocThreshold ?? (ocM ? parseInt(ocM[1], 10) : 1);
      const currentCounters = Number(player?.counters ?? player?.counter ?? 0);
      const isOCActive = Boolean(context.isOCActive) || currentCounters >= minOc;
      if (!isOCActive) {
        return { allowed: false, reason: `PREFIX_REQUIRES_DURING_OC: required >= ${minOc}, got ${currentCounters}`, checkedPrefixes };
      }
    }

    if (/\bduring\s+set\b/.test(lower)) {
      checkedPrefixes.push('During Set');
      const matchCard = c => Boolean(c && card && ((c.id && card.id && c.id === card.id) || (c.cardNumber && card.cardNumber && c.cardNumber === card.cardNumber)));
      const isSet = Boolean(context.isSet) || matchCard(player?.mirage) || matchCard(player?.burst);
      if (!isSet) {
        return { allowed: false, reason: 'PREFIX_REQUIRES_DURING_SET', checkedPrefixes };
      }
    }

    if (/\bsoul\s+state\b/.test(lower) || header.isSoulState) {
      checkedPrefixes.push('Soul State');
      const inUnder = (player?.field || []).some(st =>
        (st.under || []).some(u => card && ((u.id && card.id && u.id === card.id) || (u.cardNumber && card.cardNumber && u.cardNumber === card.cardNumber)))
      );
      const inSoulArr = (player?.soulState || player?.soul || []).some(s =>
        card && ((s?.top?.id === card.id) || (s?.id === card.id) || (s?.cardNumber && s.cardNumber === card.cardNumber))
      );
      const isSoulState = Boolean(context.inSoulState || stack?.isSoulState || inUnder || inSoulArr);
      if (!isSoulState) {
        return { allowed: false, reason: 'PREFIX_REQUIRES_SOUL_STATE', checkedPrefixes };
      }
    }

    if (/\bduring\s+seal\b|\bwhen\s+sealed\b/.test(lower) || header.duringSeal) {
      checkedPrefixes.push('During Seal');
      if (!Boolean(context.isSealed || player?.isSealed)) {
        return { allowed: false, reason: 'PREFIX_REQUIRES_DURING_SEAL', checkedPrefixes };
      }
    }
  }

  if (header.duringAdvent && !checkedPrefixes.includes('During Advent')) {
    checkedPrefixes.push('During Advent');
    if (!(context.isAdvented || stack?.isAdvented || (stack?.under && stack.under.length > 0))) {
      return { allowed: false, reason: 'PREFIX_REQUIRES_DURING_ADVENT', checkedPrefixes };
    }
  }

  return { allowed: true, reason: null, checkedPrefixes };
}

export function parseMirageDeclaration(card) {
  const abs = card?.compiledIr?.abilities || card?.abilities || [];
  for (const ab of abs) {
    for (const p of [...(ab?.header?.prefixes || []), ...(ab?.header?.keyword ? [ab.header.keyword] : [])]) {
      const m = String(p).match(/^Mirage:\s*Cost\s+(\d+)/i);
      if (m) {
        return { hasMirage: true, cost: parseInt(m[1], 10), raw: String(p) };
      }
    }
  }
  const kws = card?.compiledIr?.keywords || card?.keywords || [];
  for (const kw of kws) {
    const name = typeof kw === 'string' ? kw : kw?.name;
    const param = typeof kw === 'string' ? '' : (kw?.parameter || '');
    if (/^Mirage$/i.test(String(name || '').trim())) {
      const cm = String(param).match(/Cost\s+(\d+)/i);
      if (cm) return { hasMirage: true, cost: parseInt(cm[1], 10), raw: `${name}: ${param}` };
    }
  }
  if (typeof card?.effect === 'string') {
    const em = card.effect.match(/\[Mirage:\s*Cost\s+(\d+)/i);
    if (em) return { hasMirage: true, cost: parseInt(em[1], 10), raw: em[0] };
  }
  return null;
}

export async function setMirageFromHand(state, playerSide = 'player', cardOrId, options = {}, events = null) {
  if (!state?.players?.[playerSide]) return { success: false, reason: 'INVALID_PLAYER' };
  const p = state.players[playerSide];
  const card = typeof cardOrId === 'string'
    ? (p.hand || []).find(c => c.id === cardOrId)
    : cardOrId;
  if (!card || !(p.hand || []).some(c => c.id === card.id)) {
    return { success: false, reason: 'CARD_NOT_IN_HAND' };
  }

  const mirageSpec = parseMirageDeclaration(card);
  if (!mirageSpec) {
    return { success: false, reason: 'NO_MIRAGE_DECLARATION' };
  }
  if (p.mirageSetThisTurn && !options.ignoreOncePerTurn) {
    return { success: false, reason: 'MIRAGE_ALREADY_SET_THIS_TURN' };
  }

  const mirageCardShim = { ...card, cost: mirageSpec.cost };
  const effectiveCost = calculateEffectiveCost(state, mirageCardShim, playerSide);
  if (effectiveCost > 0) {
    if (!canAffordCost(state, effectiveCost, playerSide)) {
      return { success: false, reason: 'INSUFFICIENT_CORES' };
    }
    const plan = (Array.isArray(options.payment) && options.payment.length > 0)
      ? options.payment
      : buildPaymentPlan(state, effectiveCost, playerSide);
    if (!plan) return { success: false, reason: 'INSUFFICIENT_CORES' };
    const payRes = await payCost(state, effectiveCost, plan, playerSide, events);
    if (!payRes.success) return { success: false, reason: payRes.reason || 'PAYMENT_FAILED' };
  }

  let replacedMirage = null;
  if (p.mirage) {
    replacedMirage = p.mirage;
    await moveCard(state, replacedMirage, 'grave', playerSide, { cause: 'mirage_replace', by: playerSide }, events);
  }

  const moved = await moveCard(state, card, 'mirage', playerSide, { cause: 'mirage_set', by: playerSide }, events);
  if (!moved) return { success: false, reason: 'MIRAGE_PLACEMENT_FAILED' };

  p.mirageSetThisTurn = true;
  if (events) {
    await events.emit({
      type: 'MIRAGE_SET',
      card,
      replacedMirage,
      player: playerSide,
      costPaid: effectiveCost
    });
  }

  return {
    success: true,
    zone: 'mirage',
    mirageCard: card,
    replacedMirage,
    mirageCostPaid: effectiveCost
  };
}

export function getActiveMirageAbilities(state, playerSide = 'player', timingFilter = null) {
  const mirageCard = state?.players?.[playerSide]?.mirage;
  if (!mirageCard) return [];
  const abs = mirageCard?.compiledIr?.abilities || mirageCard?.abilities || [];
  return abs.filter(ab => {
    const isDuringSet = (ab?.header?.prefixes || []).some(p => /during\s+set/i.test(String(p))) ||
      ab?.header?.timing === 'DURING_SET';
    if (!isDuringSet) return false;
    if (!timingFilter) return true;
    return ab?.header?.timing === timingFilter ||
      (ab?.header?.timings || []).includes(timingFilter) ||
      ab?.header?.timing === 'PASSIVE';
  });
}

export function parseReleaseDeclaration(cardOrAbility) {
  const abs = cardOrAbility?.clauses
    ? [cardOrAbility]
    : (cardOrAbility?.compiledIr?.abilities || cardOrAbility?.abilities || []);
  for (const ab of abs) {
    const tokens = [
      ...(ab?.header?.prefixes || []),
      ...(ab?.header?.keyword ? [ab.header.keyword] : [])
    ];
    for (const p of tokens) {
      const s = String(p).trim();
      if (/^True\s+Release\b/i.test(s)) {
        return { keyword: 'True Release', isTrueRelease: true, coreCount: 1, requireSoulCore: true, raw: s };
      }
      const relM = s.match(/^Release(?::\s*(\d+)(?:\s+Cores?)?)?/i);
      if (relM) {
        return {
          keyword: 'Release',
          isTrueRelease: false,
          coreCount: relM[1] ? parseInt(relM[1], 10) : 1,
          requireSoulCore: false,
          raw: s
        };
      }
    }
  }
  const kws = cardOrAbility?.compiledIr?.keywords || cardOrAbility?.keywords || [];
  for (const kw of kws) {
    const name = typeof kw === 'string' ? kw : kw?.name;
    const param = typeof kw === 'string' ? '' : (kw?.parameter || '');
    if (/^True\s+Release$/i.test(String(name || '').trim())) {
      return { keyword: 'True Release', isTrueRelease: true, coreCount: 1, requireSoulCore: true, raw: `${name}` };
    }
    if (/^Release$/i.test(String(name || '').trim())) {
      const cm = String(param).match(/(\d+)/);
      return { keyword: 'Release', isTrueRelease: false, coreCount: cm ? parseInt(cm[1], 10) : 1, requireSoulCore: false, raw: `${name}${param ? `: ${param}` : ''}` };
    }
  }
  return null;
}

export async function executeReleaseRuntime(state, sourceStack, releaseSpecOrCard, context = {}, events = null) {
  const controller = context.controller || sourceStack?.owner || 'player';
  const p = state?.players?.[controller];
  if (!p || !sourceStack) return { released: false, coresMoved: 0, reason: 'INVALID_RELEASE_CONTEXT' };

  const spec = releaseSpecOrCard?.keyword
    ? releaseSpecOrCard
    : (parseReleaseDeclaration(releaseSpecOrCard) || parseReleaseDeclaration(sourceStack.top));
  if (!spec) return { released: false, coresMoved: 0, reason: 'NO_RELEASE_DECLARATION' };

  // Friendly Nexuses can be stored in p.field (with type including 'Nexus') or p.nexus
  const fieldNexuses = (p.field || []).filter(st => st?.top && String(st.top.type || '').toLowerCase().includes('nexus'));
  const needed = spec.coreCount || 1;

  if (spec.isTrueRelease) {
    // True Release: check Soul Core on a friendly Nexus or friendly field/reserve and move it onto sourceStack
    const soulNexus = fieldNexuses.find(st => (st.cores?.soul || 0) > 0);
    if (soulNexus) {
      const moved = await moveCore(
        state,
        1,
        { zone: 'field', side: controller, stackId: soulNexus.id },
        { zone: 'field', side: controller, stackId: sourceStack.id },
        { isSoulCore: true, cause: 'true_release', by: controller, sourceCard: sourceStack.top },
        events
      );
      if (moved) {
        context.releaseSatisfied = true;
        if (events) await events.emit({ type: 'RELEASE_ACTIVATED', keyword: 'True Release', player: controller, sourceStack, coresMoved: 1 });
        return { released: true, keyword: 'True Release', coresMoved: 1, soulCoreMoved: true };
      }
    }
    if ((p.reserve?.soul || 0) > 0) {
      const moved = await moveCore(
        state,
        1,
        { zone: 'reserve', side: controller },
        { zone: 'field', side: controller, stackId: sourceStack.id },
        { isSoulCore: true, cause: 'true_release', by: controller, sourceCard: sourceStack.top },
        events
      );
      if (moved) {
        context.releaseSatisfied = true;
        if (events) await events.emit({ type: 'RELEASE_ACTIVATED', keyword: 'True Release', player: controller, sourceStack, coresMoved: 1 });
        return { released: true, keyword: 'True Release', coresMoved: 1, soulCoreMoved: true };
      }
    }
    return { released: false, keyword: 'True Release', coresMoved: 0, reason: 'INSUFFICIENT_SOUL_CORE_FOR_TRUE_RELEASE' };
  }

  // Standard [Release]: move `needed` cores from friendly Nexus(es) to sourceStack atomically
  const eligibleNexuses = fieldNexuses.filter(st => ((st.cores?.normal || 0) + (st.cores?.soul ? 1 : 0)) > 0);
  const totalAvailable = eligibleNexuses.reduce((sum, st) => sum + (st.cores?.normal || 0) + (st.cores?.soul ? 1 : 0), 0);
  if (totalAvailable < needed) {
    return { released: false, keyword: 'Release', coresMoved: 0, reason: 'INSUFFICIENT_NEXUS_CORES' };
  }

  let remaining = needed;
  let movedTotal = 0;
  for (const nex of eligibleNexuses) {
    if (remaining <= 0) break;
    const availNormal = nex.cores?.normal || 0;
    if (availNormal > 0) {
      const take = Math.min(availNormal, remaining);
      const ok = await moveCore(
        state,
        take,
        { zone: 'field', side: controller, stackId: nex.id },
        { zone: 'field', side: controller, stackId: sourceStack.id },
        { isSoulCore: false, cause: 'release', by: controller, sourceCard: sourceStack.top },
        events
      );
      if (ok) {
        remaining -= take;
        movedTotal += take;
      }
    }
    if (remaining > 0 && (nex.cores?.soul || 0) > 0) {
      const ok = await moveCore(
        state,
        1,
        { zone: 'field', side: controller, stackId: nex.id },
        { zone: 'field', side: controller, stackId: sourceStack.id },
        { isSoulCore: true, cause: 'release', by: controller, sourceCard: sourceStack.top },
        events
      );
      if (ok) {
        remaining -= 1;
        movedTotal += 1;
      }
    }
  }

  context.releaseSatisfied = movedTotal > 0;
  if (events && movedTotal > 0) {
    await events.emit({ type: 'RELEASE_ACTIVATED', keyword: 'Release', player: controller, sourceStack, coresMoved: movedTotal });
  }
  return { released: movedTotal > 0, keyword: 'Release', coresMoved: movedTotal };
}

export function parseTeamTags(text) {
  const s = String(text || '');
  const teams = [];
  for (const m of s.matchAll(/\[teams?:\s*([^\]]+)\]/gi)) {
    const raw = m[1].trim();
    if (raw) teams.push(raw);
  }
  return teams;
}

export function extractCardTeams(card, state = null, stack = null) {
  if (!card) return [];
  const teams = [];
  if (Array.isArray(card.teams)) teams.push(...card.teams);
  for (const kw of [...(card.keywords || []), ...(card.compiledIr?.keywords || [])]) {
    const name = typeof kw === 'string' ? kw : kw?.name;
    const param = typeof kw === 'string' ? null : kw?.parameter;
    if (/^Team$/i.test(String(name || '').trim()) && param) {
      teams.push(String(param).trim());
    }
  }
  for (const ab of (card.compiledIr?.abilities || card.abilities || [])) {
    if (ab?.type === 'TEAM_RESTRICTION' && Array.isArray(ab.teams)) {
      teams.push(...ab.teams);
    }
  }
  teams.push(...parseTeamTags(card.effect || card.detailedEffect || card.cardEffect || ''));

  if (state && Array.isArray(state.modifiers)) {
    for (const mod of state.modifiers) {
      if (!mod || (mod.type !== 'GAIN_TEAM' && mod.type !== 'TEAM_RULE')) continue;
      if (mod.targetStackId && stack && mod.targetStackId !== stack.id) continue;
      if (mod.targetCardId && mod.targetCardId !== card.id) continue;
      const modTeams = Array.isArray(mod.teams) ? mod.teams : (mod.team ? [mod.team] : []);
      teams.push(...modTeams);
    }
  }

  return [...new Set(teams.map(t => String(t).trim()).filter(Boolean))];
}

export function hasTeam(card, teamName, state = null, stack = null) {
  if (!card || !teamName) return false;
  const target = String(teamName).trim().toLowerCase();
  const cardTeams = extractCardTeams(card, state, stack);
  return cardTeams.some(t => String(t).toLowerCase().includes(target));
}
