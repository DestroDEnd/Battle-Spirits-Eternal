/**
 * compiler/clause_patterns.js
 * 
 * Pattern recognizer translating normalized clause text into typed IR operations.
 */

import { isIncompleteOpObject, recoverExplicitOpParameters } from '../engine/parameter_recovery.js';

const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

export function parseNumber(val) {
  if (!val) return 1;
  const lower = String(val).toLowerCase().replace(/^up\s+to\s+/i, '').trim();
  if (NUMBER_WORDS[lower] !== undefined) return NUMBER_WORDS[lower];
  const num = parseInt(lower, 10);
  return isNaN(num) ? 1 : num;
}

function extractRevealCardParams(text) {
  const countMatch = text.match(/(?:reveal|look\s+at)\s+(?:the\s+top\s+)?(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+cards?/i) ||
    text.match(/(?:you\s+can\s+)(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+cards?\s+from/i);
  const count = countMatch ? parseNumber(countMatch[1]) : 1;
  const from = /\bhand\b/i.test(text) ? 'HAND' : 'DECK';
  const side = /(?:each|both)\s+players?/i.test(text)
    ? 'both'
    : (/\bopposing\b/i.test(text) ? 'opp' : 'self');
  const op = { op: 'REVEAL_CARDS', count, from, side };
  if (/^\s*you\s+can\b/i.test(text)) op.isOptional = true;
  return op;
}

export function parseRelativeComparison(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  const hasComp = /equal or inferior|inferior or equal|equal to or inferior|inferior to or equal|equal or less|less than or equal|equal to or less|equal to inferior|inferior to|fewer cores than|lv inferior|equal or more|more than or equal|superior to|greater than/i.test(t);
  if (!hasComp) return null;

  let property = null;
  if (/\b(?:bp|battle points?)\b/i.test(t)) {
    property = 'BP';
  } else if (/\bcost\b/i.test(t)) {
    property = 'COST';
  } else if (/\b(?:cores?|number of cores?)\b/i.test(t)) {
    property = 'CORES';
  } else if (/\b(?:lv|level)\b/i.test(t)) {
    property = 'LEVEL';
  } else if (/\bsymbols?\b/i.test(t)) {
    property = 'SYMBOLS';
  }

  if (!property) return null;

  let operator = null;
  if (/equal or inferior|inferior or equal|equal to or inferior|inferior to or equal|equal or less|less than or equal|equal to or less|equal to inferior/i.test(t)) {
    operator = 'LTE';
  } else if (/inferior to|less than|fewer cores than|lv inferior/i.test(t)) {
    operator = 'LT';
  } else if (/equal or more|more than or equal|equal to or more|greater than or equal/i.test(t)) {
    operator = 'GTE';
  } else if (/superior to|greater than|more than/i.test(t)) {
    operator = 'GT';
  } else if (/equal/i.test(t)) {
    operator = 'EQ';
  }

  if (!operator) return null;

  let reference = 'self';
  if (/that of your battling spirit|your battling spirit/i.test(t)) {
    reference = 'battling';
  } else if (/that spirit's|that target's|that brave's/i.test(t)) {
    reference = 'target';
  } else if (/card discarded|card you returned|spirit summoned|cards added|card on the opposing removed zone|revealed card|contents of an opposing burst|that burst|that card's/i.test(t)) {
    reference = 'effect_card';
  } else if (/one of your ".*?" family spirits/i.test(t)) {
    reference = 'allied_spirit';
  } else if (/this spirit's|this spirit|this nexus's|this nexus|this ultimate's|this ultimate|this card's/i.test(t)) {
    reference = 'self';
  } else if (/that spirit/i.test(t)) {
    reference = 'target';
  }

  return { property, operator, reference };
}

export function parseCoreMovement(text) {
  const isSoul = /\[soul\s+core\]/i.test(text) && !/besides\s+\[soul\s+core\]|other\s+than\s+\[soul\s+core\]|except\s+\[soul\s+core\]/i.test(text);
  
  let count = 1;
  if (/all\s+(?:the\s+)?cores|every\s+core/i.test(text)) {
    count = 'ALL';
  } else {
    const cMatch = text.match(/(?:send|put|move|gain|take|\+)\s*(?:up\s+to\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cores?/i)
      || text.match(/(\d+|[a-z]+)\s+cores?\s+(?:from|to|each)/i);
    if (cMatch) {
      count = parseNumber(cMatch[1]);
    }
  }

  let from = null;
  if (/from\s+(?:the\s+)?void/i.test(text)) {
    from = { zone: 'void' };
  } else if (/from\s+(?:the\s+|their\s+)?opposing\s+trash/i.test(text)) {
    from = { zone: 'trash', side: 'opp' };
  } else if (/from\s+(?:your\s+|the\s+)?trash/i.test(text)) {
    from = { zone: 'trash', side: 'self' };
  } else if (/from\s+(?:their|the\s+opposing)\s+reserve/i.test(text)) {
    from = { zone: 'reserve', side: 'opp' };
  } else if (/from\s+(?:your\s+)?reserve/i.test(text)) {
    from = { zone: 'reserve', side: 'self' };
  } else if (/from\s+(?:your\s+)?life/i.test(text)) {
    from = { zone: 'life', side: 'self' };
  } else if (/from\s+(?:their|the\s+opposing)\s+life/i.test(text)) {
    from = { zone: 'life', side: 'opp' };
  } else if (/from\s+(?:this\s+(?:spirit|ultimate|nexus)|it\b)/i.test(text)) {
    from = { zone: 'field', side: 'self', target: 'self' };
  } else if (/from\s+(?:an?\s+|any\s+|each\s+|every\s+|\d+\s+|[a-z]+\s+)?opposing\s+(?:spirits?|ultimates?|nexuses?|field)/i.test(text)) {
    from = { zone: 'field', side: 'opp' };
  } else if (/from\s+(?:a\s+|any\s+|each\s+|every\s+)?(?:spirit|ultimate|nexus)\s+you\s+control/i.test(text)) {
    from = { zone: 'field', side: 'self' };
  } else if (/from\s+(?:each\s+of\s+them|them|those\s+targets)/i.test(text)) {
    from = { zone: 'field', side: 'self' };
  } else if (/\+\s*\d+\s*cores?\s+to/i.test(text)) {
    from = { zone: 'void' };
  }

  let to = null;
  if (/to\s+(?:the\s+)?void/i.test(text)) {
    to = { zone: 'void' };
  } else if (/to\s+(?:their\s+|the\s+opposing\s+)?trash/i.test(text)) {
    to = { zone: 'trash', side: 'opp' };
  } else if (/to\s+(?:your\s+|the\s+)?trash/i.test(text)) {
    to = { zone: 'trash', side: 'self' };
  } else if (/to\s+(?:their\s+|the\s+opposing\s+)?reserve/i.test(text)) {
    to = { zone: 'reserve', side: 'opp' };
  } else if (/to\s+(?:your\s+)?reserve/i.test(text)) {
    to = { zone: 'reserve', side: 'self' };
  } else if (/to\s+(?:your\s+)?life/i.test(text)) {
    to = { zone: 'life', side: 'self' };
  } else if (/to\s+(?:this\s+(?:spirit|ultimate|nexus)|it\b|that\s+target|one\s+of\s+the\s+targets)/i.test(text)) {
    to = { zone: 'field', side: 'self', target: 'self' };
  } else if (/to\s+(?:a\s+|any\s+|each\s+|every\s+)?(?:nexus|grandwalker\s+nexus|spirits?|ultimates?)\s+you\s+control/i.test(text)) {
    to = { zone: 'field', side: 'self' };
  } else if (/to\s+(?:an?\s+|any\s+|each\s+|every\s+)?opposing\s+(?:spirits?|ultimates?|nexuses?)/i.test(text)) {
    to = { zone: 'field', side: 'opp' };
  }

  if (to && to.zone === 'life' && from && from.zone === 'void') {
    return { op: 'RECOVER_LIFE', count: typeof count === 'number' ? count : 1 };
  }

  if (!from && !to && !isSoul) {
    if (/sending|send|put/i.test(text)) {
      from = { zone: 'field', side: 'self' };
      to = { zone: 'reserve', side: 'self' };
    } else {
      return { op: 'UNSUPPORTED', rawText: text };
    }
  }

  const res = { op: isSoul ? 'MOVE_SOUL_CORE' : 'MOVE_CORE', count };
  if (isSoul) res.isSoulCore = true;
  if (from) res.from = from;
  if (to) res.to = to;
  return res;
}

function stripUnbalanced(str) {
  let ob = (str.match(/\[/g) || []).length;
  let cb = (str.match(/\]/g) || []).length;
  while (cb > ob && str.endsWith(']')) { str = str.slice(0, -1).trim(); cb--; }
  let op = (str.match(/\(/g) || []).length;
  let cp = (str.match(/\)/g) || []).length;
  while (cp > op && str.endsWith(')')) { str = str.slice(0, -1).trim(); cp--; }
  return str;
}

export function parseSummonOp(text, rawClauseText) {
  const full = (text + ' ' + (rawClauseText || '')).trim();

  // 1. Check if it's self-summon
  if (/summon\s+(?:this\s+(?:spirit|brave|ultimate|nexus)?\s*card|it)\b/i.test(text)) {
    let from = 'HAND_OR_BURST';
    if (/trash/i.test(full)) from = 'TRASH';
    else if (/removed\s+zone/i.test(full)) from = 'REMOVED';
    else if (/hand/i.test(full) && !/burst/i.test(full)) from = 'HAND';
    const isFree = /without\s+paying\s+(?:the\s+)?cost/i.test(full);
    const costM = full.match(/pay\s+(one|two|three|\d+)\s+cost/i);
    const costCores = costM ? parseNumber(costM[1]) : 0;
    return {
      op: 'SUMMON_THIS_CARD',
      from,
      ...(isFree ? { free: true } : {}),
      ...(costCores ? { costCores } : {})
    };
  }

  // 2. From zone
  let from = 'hand';
  if (/from\s+(?:the\s+|your\s+)?(?:hand\/trash|hand\s+or\s+trash|trash\/hand)/i.test(full)) {
    from = 'hand_or_trash';
  } else if (/from\s+(?:the\s+|their\s+)?opposing\s+trash/i.test(full)) {
    from = 'trash';
  } else if (/from\s+(?:(?:the|your|their)\s+)?(?:opposing\s+|either\s+(?:player['’]s\s+)?)?trash\b/i.test(full) || /in\s+(?:your\s+|the\s+)?trash/i.test(full)) {
    from = 'trash';
  } else if (/from\s+(?:the\s+|your\s+)?removed\s+zone/i.test(full)) {
    from = 'removed';
  } else if (/among\s+(?:the\s+)?revealed\s+cards|from\s+(?:the\s+)?revealed\s+cards|one\s+of\s+them/i.test(full)) {
    from = 'revealed';
  } else if (/from\s+(?:the\s+|your\s+)?hand/i.test(full)) {
    from = 'hand';
  }

  // 3. Side
  let side = 'self';
  if (/opposing\s+trash|opponent['’]s\s+trash/i.test(full)) {
    side = 'opp';
  } else if (/either\s+(?:player['’]s\s+)?trash|both\s+trashes/i.test(full)) {
    side = 'both';
  }

  // 4. Count & UpTo
  let count = 1;
  let upTo = false;
  if (/any\s+number|as\s+many/i.test(full)) {
    count = 'ALL';
    upTo = true;
  } else {
    const upToM = full.match(/up\s+to\s+(a|an|one|two|three|four|five|six|\d+)/i);
    if (upToM) {
      count = parseNumber(upToM[1]);
      upTo = true;
    } else {
      const cntM = full.match(/summon\s+(a|an|one|two|three|four|five|six|\d+)\b/i);
      if (cntM) {
        count = parseNumber(cntM[1]);
      }
    }
  }

  // 5. Free vs Paid
  const isFree = /without\s+paying\s+(?:the\s+|any\s+|their\s+)?costs?/i.test(full) || /for\s+free/i.test(full);
  const costM = full.match(/pay\s+(one|two|three|\d+)\s+costs?/i) || full.match(/paying\s+(one|two|three|\d+)\s+cost/i);
  const costCores = costM ? parseNumber(costM[1]) : 0;

  // 6. Exhausted
  const exhausted = /in\s+exhausted\s+state|exhausted/i.test(full);

  // 7. Types
  const types = [];
  if (/\bspirit\b/i.test(full)) types.push('Spirit');
  if (/\bultimate\b/i.test(full)) types.push('Ultimate');
  if (/\bbrave\b/i.test(full)) types.push('Brave');
  if (/\bnexus\b/i.test(full)) types.push('Nexus');
  if (types.length === 0) types.push('Spirit');

  // 8. Filters
  const filter = { types };

  const costLteM = full.match(/cost\s+(\d+)\s+or\s+(?:less|inferior)/i);
  if (costLteM) filter.costLte = parseInt(costLteM[1], 10);

  const costGteM = full.match(/cost\s+(\d+)\s+or\s+(?:more|superior)/i);
  if (costGteM) filter.costGte = parseInt(costGteM[1], 10);

  const costExactM = full.match(/cost\s+(\d+)\b(?!\s*or)/i);
  if (costExactM && !costLteM && !costGteM) filter.costExact = parseInt(costExactM[1], 10);

  // Quotes (names & families)
  const quotes = [...new Set(extractQuotedTerms(full))];
  for (const q of quotes) {
    if (new RegExp(`["“]${q}["”]\\s+family`, 'i').test(full)) {
      if (!filter.family) filter.family = q;
      else {
        if (!filter.familiesAny) filter.familiesAny = [filter.family];
        filter.familiesAny.push(q);
      }
    } else {
      if (!filter.nameIncludes) filter.nameIncludes = q;
      else {
        if (!filter.nameIncludesAny) filter.nameIncludesAny = [filter.nameIncludes];
        filter.nameIncludesAny.push(q);
      }
    }
  }

  // Colors
  const colors = parseColors(full);
  if (colors.length === 1) {
    filter.color = colors[0];
  } else if (colors.length > 1) {
    filter.colorsAny = colors;
  }

  // Keywords
  const kwMatch = full.match(/with\s+\[([^\]]+)\]/i);
  if (kwMatch) {
    filter.keyword = kwMatch[1].trim();
  }

  return {
    op: 'SUMMON',
    from,
    side,
    count,
    upTo,
    filter,
    ...(isFree ? { free: true } : { free: false }),
    ...(costCores ? { costCores } : {}),
    ...(exhausted ? { exhausted: true } : {}),
    isOptional: /^(?:you\s+can\b|can\b)/i.test(text)
  };
}

export function parseTrashSalvageOp(text, rawClauseText) {
  const full = (text + ' ' + (rawClauseText || '')).trim();

  if (/return\s+(?:this\s+(?:spirit|brave|ultimate|nexus)?\s*card|it)\s+from\s+(?:the\s+|your\s+)?trash\s+to\s+(?:the\s+|your\s+)?hand/i.test(full)) {
    return {
      op: 'SALVAGE',
      target: 'this_card',
      from: 'trash',
      destination: 'HAND',
      count: 1,
      isOptional: /^(?:you\s+can\b|can\b)/i.test(text)
    };
  }

  const isTrashSalvage = /(?:choose\s+and\s+)?(?:return|add)\s+.*from\s+(?:(?:the|your|their)\s+)?(?:opposing\s+|either\s+(?:player['’]s\s+)?)?trash\s+to\s+(?:the\s+|your\s+|their\s+|opposing\s+)?(hand|decktop|deckbottom|bottom\s+of\s+(?:your|the|opposing|their)\s+deck|top\s+of\s+(?:your|the|opposing|their)\s+deck)/i.test(full);
  if (!isTrashSalvage) return null;

  const destM = full.match(/to\s+(?:the\s+|your\s+|their\s+|opposing\s+)?(hand|decktop|deckbottom|bottom\s+of\s+(?:your|the|opposing|their)\s+deck|top\s+of\s+(?:your|the|opposing|their)\s+deck)/i);
  let destination = 'HAND';
  if (destM) {
    const rawDest = destM[1].toLowerCase();
    if (rawDest.includes('bottom')) destination = 'DECK_BOTTOM';
    else if (rawDest.includes('top')) destination = 'DECK_TOP';
    else destination = 'HAND';
  }

  let side = 'self';
  if (/opposing\s+trash|opponent['’]s\s+trash/i.test(full)) side = 'opp';
  else if (/either\s+trash|both\s+trashes/i.test(full)) side = 'both';

  let count = 1;
  let upTo = false;
  if (/any\s+number|as\s+many/i.test(full)) {
    count = 'ALL';
    upTo = true;
  } else {
    const upM = full.match(/up\s+to\s+(a|an|one|two|three|four|five|six|\d+)/i);
    if (upM) {
      count = parseNumber(upM[1]);
      upTo = true;
    } else {
      const cntM = full.match(/(?:return|add)\s+(a|an|one|two|three|four|five|six|\d+)\b/i);
      if (cntM) count = parseNumber(cntM[1]);
    }
  }

  const types = [];
  if (/\bspirit\b/i.test(full)) types.push('Spirit');
  if (/\bultimate\b/i.test(full)) types.push('Ultimate');
  if (/\bbrave\b/i.test(full)) types.push('Brave');
  if (/\bmagic\b/i.test(full)) types.push('Magic');
  if (/\bnexus\b/i.test(full)) types.push('Nexus');

  const filter = {};
  if (types.length > 0) filter.types = types;

  const costLteM = full.match(/cost\s+(\d+)\s+or\s+(?:less|inferior)/i);
  if (costLteM) filter.costLte = parseInt(costLteM[1], 10);

  const costGteM = full.match(/cost\s+(\d+)\s+or\s+(?:more|superior)/i);
  if (costGteM) filter.costGte = parseInt(costGteM[1], 10);

  const quotes = [...new Set(extractQuotedTerms(full))];
  for (const q of quotes) {
    if (new RegExp(`["“]${q}["”]\\s+family`, 'i').test(full)) {
      if (!filter.family) filter.family = q;
      else {
        if (!filter.familiesAny) filter.familiesAny = [filter.family];
        filter.familiesAny.push(q);
      }
    } else {
      if (!filter.nameIncludes) filter.nameIncludes = q;
      else {
        if (!filter.nameIncludesAny) filter.nameIncludesAny = [filter.nameIncludes];
        filter.nameIncludesAny.push(q);
      }
    }
  }

  const colors = parseColors(full);
  if (colors.length === 1) filter.color = colors[0];
  else if (colors.length > 1) filter.colorsAny = colors;

  if (/\bwith\s+\[?mirage(?::[^\]]+)?\]?\s+effects?/i.test(full)) {
    filter.hasMirage = true;
  }
  if (/\bwith\s+\[?burst(?::[^\]]+)?\]?\s+effects?/i.test(full)) {
    filter.hasBurst = true;
  }
  if (/\bwith\s+\[?accel(?::[^\]]+)?\]?\b/i.test(full)) {
    filter.hasAccel = true;
  }

  return {
    op: 'SALVAGE',
    from: 'trash',
    destination,
    side,
    count,
    upTo,
    filter,
    isOptional: /^(?:you\s+can\b|can\b)/i.test(text)
  };
}

export function compileClauseToOp(clause) {
  const rawClauseText = (typeof clause === 'string' ? clause : (clause?.cleanText || clause?.rawText || '')).trim();
  const res = compileClauseToOpInner(clause);
  return enrichHijClauseOp(res, rawClauseText);
}

function compileClauseToOpInner(clause) {
  const rawClauseText = (typeof clause === 'string' ? clause : (clause?.cleanText || clause?.rawText || '')).trim();
  let text = rawClauseText;
  if (!text || /^[.\s█◆■●▲]+$/.test(text)) return null;
  text = stripUnbalanced(text);
  text = text.replace(/^However,\s*/i, '')
             .replace(/^By\s+/i, '')
             .replace(/^\[[A-Za-z]+\s+Core\]:\s*/i, '')
             .replace(/^[,.\s█◆■●▲]+/, '')
             .replace(/[,.]+[\]\)]+$/, '')
             .trim();
  text = stripUnbalanced(text);
  if (!text || /^[.\s]+$/.test(text)) return null;

  const relComp = parseRelativeComparison(rawClauseText);

  if (/placing\s+(?:up\s+to\s+)?(?:one|two|three|\d+)\s+cards?\s+from\s+your\s+decktop\s+onto\s+the\s+Field\s+facedown\s+and\s+putting/i.test(text)) {
    return { op: 'BUNSHIN_SUMMON', upTo: /up\s+to/i.test(text), facedown: true };
  }

  // Early Relative Comparison Special Clauses
  if (relComp) {
    // Relative comparison BLOCKED condition (e.g. BS19-011, BS26-008)
    if (/when\s+blocked\s+by/i.test(rawClauseText) || /if\s+that\s+spirit\s+is\s+blocked\s+by/i.test(rawClauseText)) {
      return {
        op: 'CONDITION',
        condition: 'BLOCKED_BY_COMPARISON',
        filter: {
          side: 'opp',
          types: parseTypes(rawClauseText),
          filters: {
            comparison: relComp
          }
        }
      };
    }

    // Relative comparison EXHAUSTED_BLOCK (e.g. BATTLE-SPIRITS-A8040)
    if (/can\s+block\s+opposing\s+spirits/i.test(rawClauseText)) {
      return {
        op: 'EXHAUSTED_BLOCK',
        target: 'self',
        filter: {
          side: 'opp',
          types: ['Spirit'],
          filters: {
            comparison: relComp
          }
        }
      };
    }

    // Relative comparison OPPOSING_ATTACKS trigger (e.g. PC11-X03)
    if (/when\s+an\s+opposing\s+spirit\/ultimate\s+with.*attacks/i.test(rawClauseText)) {
      return {
        op: 'TRIGGER_CONDITION',
        trigger: 'OPPOSING_ATTACKS',
        filter: {
          side: 'opp',
          types: ['Spirit', 'Ultimate'],
          filters: {
            comparison: relComp
          }
        }
      };
    }

    // Relative comparison GRANT_ABILITY (e.g. BS10-X06)
    if (/give\s+all\s+your.*the\s+effect/i.test(rawClauseText)) {
      return {
        op: 'GRANT_ABILITY',
        target: { side: 'self', types: ['Spirit'] },
        grantedOp: {
          op: 'DESTROY',
          count: 1,
          target: {
            side: 'opp',
            types: ['Spirit'],
            filters: {
              comparison: relComp
            }
          }
        }
      };
    }
  }

  // 1. DRAW
  // "draw a card", "draw two cards", "draw 3 cards", "For each card discarded by this effect, draw a card"
  let m = text.match(/\bdraw(?:ing)?\s+(a|an|one|two|three|four|five|\d+)\s+cards?\b/i);
  if (m) {
    const isForEach = /for each/i.test(text);
    return {
      op: 'DRAW',
      count: parseNumber(m[1]),
      chooser: 'self',
      forEach: isForEach ? 'DISCARDED_COUNT' : null
    };
  }
  if (/\bdraw\s+a\s+card\b/i.test(text)) {
    return { op: 'DRAW', count: 1, chooser: 'self' };
  }

  // 2. DISCARD_HAND
  // "discard a pre-Advent card beneath this Spirit"
  if (/discard(?:ing)?\s+a\s+pre-advent\s+card\s+beneath\s+this\s+spirit/i.test(text)) {
    return {
      op: 'DISCARD_PRE_ADVENT',
      count: 1,
      target: 'SELF_STACK'
    };
  }
  // "The opponent discards a card from their Hand"
  m = text.match(/(?:the\s+)?opponent\s+discards?\s+(a|an|one|two|\d+)?\s*cards?\s+from\s+their\s+hand/i);
  if (m) {
    return {
      op: 'DISCARD_HAND',
      count: parseNumber(m[1]),
      chooser: 'opp',
      target: { side: 'opp' }
    };
  }
  // "discard up to two "Makai"-named cards from your Hand"
  m = text.match(/discard(?:ing)?\s+(up\s+to\s+)?(a|an|one|two|three|\d+)?\s*(?:“([^”]+)”|"([^"]+)")?-?named\s+cards?\s+from\s+your\s+hand/i);
  if (m) {
    const familyOrName = m[3] || m[4] || null;
    return {
      op: 'DISCARD_HAND',
      count: parseNumber(m[2]),
      upTo: Boolean(m[1]),
      filter: familyOrName ? { nameIncludes: familyOrName } : null,
      chooser: 'self'
    };
  }
  // "discard a card from your Hand", "discard two cards from your Hand"
  m = text.match(/discard(?:ing)?\s+(a|an|one|two|three|\d+)?\s+cards?\s+from\s+(?:your\s+)?hand/i);
  if (m) {
    return {
      op: 'DISCARD_HAND',
      count: parseNumber(m[1]),
      upTo: /up to/i.test(text),
      filter: null,
      chooser: 'self'
    };
  }

  // 3. MOVE_CORE (Void to Life / Spirit / Ultimate / Trash / Reserve)
  // "You can send any number of cores from your Spirits to this Spirit" (Awaken)
  if (/send\s+(?:any\s+number\s+of|all)\s+cores?\s+from\s+(?:your\s+)?spirits?\s+to\s+this\s+spirit/i.test(text)) {
    return {
      op: 'AWAKEN_CORE_MOVE',
      count: 'ANY',
      from: { zone: 'field', side: 'self', types: ['Spirit'] },
      to: { zone: 'field', target: 'self' }
    };
  }
  // "Send up to three cores from your Reserve to a Spirit you control"
  m = text.match(/send\s+(up\s+to\s+)?(a|an|one|two|three|four|five|\d+)\s+cores?\s+from\s+(?:your\s+)?reserve\s+to\s+(?:a\s+spirit\s+you\s+control|this\s+spirit|a\s+friendly\s+spirit)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[2]),
      upTo: Boolean(m[1]),
      from: { zone: 'reserve', side: 'self' },
      to: { zone: 'field', side: 'self', types: ['Spirit'] }
    };
  }
  // "Send a core from this Spirit to the Reserve"
  if (/send\s+(a|an|one|\d+)?\s*cores?\s+from\s+this\s+spirit\s+to\s+(?:the\s+)?reserve/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      from: { zone: 'field', target: 'self' },
      to: { zone: 'reserve', side: 'self' }
    };
  }
  // "Send a core from any opposing Spirits to their Reserve"
  if (/send\s+(a|an|one|\d+)?\s*cores?\s+from\s+any\s+opposing\s+spirits?\s+to\s+(?:their\s+)?reserve/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      from: { zone: 'field', side: 'opp', types: ['Spirit'] },
      to: { zone: 'reserve', side: 'opp' },
      chooser: 'self'
    };
  }
  // "After paying for the summoning cost, you must send all cores from ... to the Void/Trash" (Tribute)
  m = text.match(/after\s+paying\s+(?:for\s+)?(?:the\s+)?summoning\s+cost,\s*you\s+must\s+send\s+all\s+cores\s+from\s+(?:a|one\s+of\s+your|an?)\s*(?:cost\s+(\d+)\s+or\s+more|“([^”]+)”\s*family)?[^to]*to\s+(?:the\s+)?(void|trash)/i);
  if (m) {
    return {
      op: 'TRIBUTE_COST',
      minCost: m[1] ? parseInt(m[1], 10) : 0,
      family: m[2] || null,
      destination: m[3].toUpperCase()
    };
  }
  // "put a core from the Void to your Life"
  if (/put\s+(?:a|an|one|\d+)?\s*core[s]?\s+from\s+(?:the\s+)?void\s+to\s+your\s+life/i.test(text)) {
    return { op: 'RECOVER_LIFE', count: 1 };
  }
  // "put a core from the Void to your Trash"
  if (/put\s+(?:a|an|one|\d+)?\s*core[s]?\s+from\s+(?:the\s+)?void\s+to\s+your\s+trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'void' }, to: { zone: 'trash', side: 'self' } };
  }
  // "put a core from the Void to this (Spirit|Ultimate|Nexus)"
  m = text.match(/put\s+(a|an|one|two|three|\d+)?\s*cores?\s+from\s+(?:the\s+)?void\s+to\s+this\s+(spirit|ultimate|nexus)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: 'void' },
      to: { zone: 'field', target: 'self' }
    };
  }
  // "send two cores from an opposing Spirit/Ultimate to the Reserve"
  m = text.match(/send\s+(a|an|one|two|three|four|\d+)\s+cores?\s+from\s+an\s+opposing\s+(spirit|ultimate|spirit\/ultimate)\s+to\s+(?:the\s+)?(reserve|trash)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: 'field', side: 'opp', types: parseTypes(m[2]) },
      to: { zone: m[3].toLowerCase(), side: 'opp' },
      chooser: 'self'
    };
  }
  // "sending a core from any opposing Spirit that the opponent chooses to their Reserve"
  m = text.match(/send(?:ing)?\s+(a|an|one|two|\d+)\s+cores?\s+from\s+any\s+opposing\s+spirit\s+that\s+the\s+opponent\s+chooses\s+to\s+their\s+(reserve|trash)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: 'field', side: 'opp', types: ['Spirit'] },
      to: { zone: m[2].toLowerCase(), side: 'opp' },
      chooser: 'opp'
    };
  }
  // "send two cores from the opposing Field to the (Trash|Reserve)"
  m = text.match(/send\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:the\s+)?opposing\s+field\s+to\s+(?:the\s+)?(trash|reserve)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: 'field', side: 'opp' },
      to: { zone: m[2].toLowerCase(), side: 'opp' },
      chooser: 'self'
    };
  }
  // "send a core from your Field/Reserve to the Trash"
  m = text.match(/send(?:ing)?\s+(a|an|one|two|\d+)\s+cores?\s+from\s+your\s+(field\/reserve|reserve|field)\s+to\s+(?:the\s+)?(trash|reserve|void)/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: m[2].toLowerCase(), side: 'self' },
      to: { zone: m[3].toLowerCase(), side: 'self' },
      chooser: 'self'
    };
  }
  // "sending your [Soul Core] to the Trash" / "banishing the [Soul Core]"
  if (/send(?:ing)?\s+(?:your\s+)?\[?soul core\]?(?:\(soul core\))?\s+(?:from\s+[^,]+?\s+)?to\s+(?:the\s+|your\s+)?trash/i.test(text) || /banishing\s+the\s+\[?soul core\]?/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      isSoulCore: true,
      from: { zone: 'field_or_reserve', side: 'self' },
      to: { zone: 'trash', side: 'self' }
    };
  }
  if (/^send(?:ing)?\s+(an?|one|two|three|\d+)\s+cores?$/i.test(text)) {
    const cMatch = text.match(/^send(?:ing)?\s+(an?|one|two|three|\d+)\s+cores?$/i);
    return {
      op: 'MOVE_CORE',
      count: cMatch ? parseNumber(cMatch[1]) : 1,
      isCost: true,
      from: { zone: 'field_or_reserve', side: 'self' },
      to: { zone: 'trash', side: 'self' }
    };
  }
  // "send the [Soul Core] from your Trash to this Spirit"
  if (/send\s+(?:the\s+)?\[?soul core\]?\s+from\s+(?:your\s+)?trash\s+to\s+this\s+(?:spirit|ultimate)/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      isSoulCore: true,
      from: { zone: 'trash', side: 'self' },
      to: { zone: 'field', target: 'self' }
    };
  }

  // 4. DESTROY
  // "destroy all Nexuses"
  if (/destroy\s+all\s+nexuses/i.test(text)) {
    return {
      op: 'DESTROY',
      count: 'ALL',
      target: { side: 'either', types: ['Nexus'] }
    };
  }
  // "by destroying a Nexus you control"
  if (/by\s+destroying\s+a\s+nexus\s+you\s+control/i.test(text)) {
    return {
      op: 'DESTROY',
      count: 1,
      isCost: true,
      target: { side: 'self', types: ['Nexus'] }
    };
  }
  // "destroy a Nexus" / "destroy an opposing Nexus"
  if (/destroy\s+(?:an?\s+opposing|a)\s+nexus/i.test(text)) {
    return {
      op: 'DESTROY',
      count: 1,
      target: { side: text.toLowerCase().includes('opposing') ? 'opp' : 'either', types: ['Nexus'] }
    };
  }
  // "destroy an opposing exhausted Cost N or less Spirit"
  m = text.match(/destroy\s+(an?|one|two|\d+)?\s*opposing\s+exhausted\s+cost\s+(\d+)\s+or\s+less\s+spirit/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: 'opp',
        types: ['Spirit'],
        filters: { costLte: parseInt(m[2], 10), state: 'EXHAUSTED' }
      }
    };
  }
  // "destroy an opposing exhausted Spirit"
  if (/destroy\s+(an?|one|two|\d+)?\s*opposing\s+exhausted\s+spirit/i.test(text)) {
    return {
      op: 'DESTROY',
      count: 1,
      target: {
        side: 'opp',
        types: ['Spirit'],
        filters: { state: 'EXHAUSTED' }
      }
    };
  }
  // "destroy a 4000 BP or less Spirit"
  m = text.match(/destroy\s+(an?|one|two|\d+)?\s*(\d+)\s*bp\s+or\s+less\s+(spirit|ultimate|spirit\/ultimate)/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: text.toLowerCase().includes('opposing') ? 'opp' : 'either',
        types: parseTypes(m[3]),
        filters: { bpLte: parseInt(m[2], 10) }
      }
    };
  }
  // "destroy a Brave on an opposing Brave Spirit"
  if (/destroy\s+a\s+brave\s+on\s+an\s+opposing\s+brave\s+spirit/i.test(text)) {
    return {
      op: 'DESTROY',
      count: 1,
      target: { side: 'opp', types: ['Brave'] }
    };
  }
  // "destroy an opposing Cost N or less Spirit"
  m = text.match(/destroy\s+(an?|one|two|three|\d+)?\s*opposing\s+cost\s+(\d+)\s+or\s+less\s+(spirit|ultimate|nexus|spirit\/ultimate)/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: 'opp',
        types: parseTypes(m[3]),
        filters: { costLte: parseInt(m[2], 10) }
      }
    };
  }
  // "destroy it"
  if (/^destroy\s+it$/i.test(text.trim())) {
    return {
      op: 'DESTROY',
      target: 'PREVIOUS_TARGET'
    };
  }
  // "destroy an opposing 5000 BP or less Spirit" / "destroy an opposing 20000 BP or less Spirit/Ultimate"
  m = text.match(/destroy\s+(an?|one|two|three|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(spirit|ultimate|spirit\/ultimate)/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: 'opp',
        types: parseTypes(m[3]),
        filters: { bpLte: parseInt(m[2], 10) }
      }
    };
  }
  // "destroy any number of opposing Spirits up to a total of 5000 BP"
  m = text.match(/destroy\s+any\s+number\s+of\s+opposing\s+(spirits|ultimates|spirits\/ultimates)\s+up\s+to\s+a\s+total\s+of\s+(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'DESTROY',
      mode: 'TOTAL_BP_LTE',
      maxTotalBp: parseInt(m[2], 10),
      target: {
        side: 'opp',
        types: parseTypes(m[1])
      }
    };
  }
  // "destroy any number of opposing Spirits/Ultimates/Nexuses up to a total cost of 9"
  m = text.match(/destroy\s+any\s+number\s+of\s+opposing\s+([A-Za-z\/]+)\s+up\s+to\s+a\s+total\s+cost\s+of\s+(\d+)/i);
  if (m) {
    return {
      op: 'DESTROY',
      mode: 'TOTAL_COST_LTE',
      maxTotalCost: parseInt(m[2], 10),
      target: {
        side: 'opp',
        types: parseTypes(m[1])
      }
    };
  }
  // "destroy two opposing one-symbol Spirits/Ultimates"
  m = text.match(/destroy\s+(a|an|one|two|three|\d+)\s+opposing\s+(one|two|single)-symbol\s+(spirits?|ultimates?|spirits?\/ultimates?)/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: 'opp',
        types: parseTypes(m[3]),
        filters: { symbolCount: parseNumber(m[2]) }
      }
    };
  }
  // Relative comparison DESTROY / BANISH (DEF-REL-TARGET-01)
  if (relComp && /(?:by\s+)?(?:destroying|destroy|banish)\s+/i.test(rawClauseText)) {
    m = rawClauseText.match(/(?:by\s+)?(?:destroying|destroy|banish)\s+(all|every|any\s+number\s+of|up\s+to\s+\w+|an?|one|two|three|four|\d+)?\s*(opposing\s+)?(?:exhausted\s+)?(spirits?\/ultimates?|spirits?\/nexuses?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?|braves?)/i);
    if (m) {
      const isCost = /^by\s+destroy/i.test(rawClauseText);
      const isAll = /all|every/i.test(m[1]);
      const isUpTo = /up\s+to/i.test(m[1]);
      const isOpp = Boolean(m[2]) || !rawClauseText.toLowerCase().includes('you control');
      const types = parseTypes(m[3]);
      const count = isAll ? 'ALL' : parseNumber(m[1]);

      const filters = { comparison: relComp };
      if (rawClauseText.toLowerCase().includes('exhausted')) {
        filters.state = 'EXHAUSTED';
      }

      return {
        op: 'DESTROY',
        count,
        ...(isUpTo ? { upTo: true } : {}),
        ...(isCost ? { isCost: true } : {}),
        target: {
          side: isOpp ? 'opp' : 'either',
          types,
          filters
        }
      };
    }
  }

  // "destroy an opposing Spirit/Nexus"
  m = text.match(/destroy\s+(an?|one|two|three|\d+)?\s*opposing\s+(spirit|nexus|brave|ultimate)/i);
  if (m) {
    return {
      op: 'DESTROY',
      count: parseNumber(m[1]),
      target: {
        side: 'opp',
        types: [capitalize(m[2])]
      }
    };
  }

  // 5. BOUNCE
  // Relative comparison BOUNCE (DEF-REL-TARGET-01)
  if (relComp && /return\s+/i.test(rawClauseText)) {
    m = rawClauseText.match(/return\s+(all|every|any\s+number\s+of|up\s+to\s+\w+|an?|one|two|three|four|\d+)?\s*(opposing\s+)?(?:exhausted\s+)?(spirits?\/ultimates?|spirits?\/nexuses?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?|braves?)\s+.*to\s+(?:the\s+)?(hand|bottom\s+of\s+the\s+deck|top\s+of\s+the\s+deck|deckbottom|decktop|deck)/i) ||
        rawClauseText.match(/return\s+to\s+(?:the\s+)?(hand|bottom\s+of\s+the\s+deck|top\s+of\s+the\s+deck|deckbottom|decktop|deck)\s+(all|every|any\s+number\s+of|up\s+to\s+\w+|an?|one|two|\d+)?\s*(opposing\s+)?(?:exhausted\s+)?(spirits?\/ultimates?|spirits?\/nexuses?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?|braves?)/i);
    if (m) {
      const destStr = (m[4] && ['hand','bottom','top','deck'].some(d => m[4].toLowerCase().includes(d)) ? m[4] : m[1] || 'hand').toLowerCase();
      const countStr = m[4] && ['hand','bottom','top','deck'].some(d => m[4].toLowerCase().includes(d)) ? m[1] : m[2];
      const oppStr = m[4] && ['hand','bottom','top','deck'].some(d => m[4].toLowerCase().includes(d)) ? m[2] : m[3];
      const typeStr = m[4] && ['hand','bottom','top','deck'].some(d => m[4].toLowerCase().includes(d)) ? m[3] : m[4];

      const isAll = /all|every/i.test(countStr);
      const isOpp = Boolean(oppStr) || !rawClauseText.toLowerCase().includes('you control');
      const types = parseTypes(typeStr);
      const count = isAll ? 'ALL' : parseNumber(countStr);
      const dest = destStr.includes('bottom') ? 'DECK_BOTTOM' :
                   destStr.includes('top') ? 'DECK_TOP' :
                   destStr.includes('deck') ? 'DECK' : 'HAND';

      return {
        op: 'BOUNCE',
        count,
        target: {
          side: isOpp ? 'opp' : 'either',
          types,
          filters: {
            comparison: relComp
          }
        },
        destination: dest
      };
    }
  }

  // "return an opposing Spirit to the hand / deck"
  m = text.match(/return\s+(an?|one|two|\d+)?\s*opposing\s+(spirit|ultimate)\s+to\s+(?:the\s+)?(hand|bottom of the deck|top of the deck|deck)/i);
  if (m) {
    const dest = m[3].toLowerCase().includes('bottom') ? 'DECK_BOTTOM' :
                 m[3].toLowerCase().includes('top') ? 'DECK_TOP' :
                 m[3].toLowerCase().includes('hand') ? 'HAND' : 'DECK';
    return {
      op: 'BOUNCE',
      count: parseNumber(m[1]),
      target: { side: 'opp', types: [capitalize(m[2])] },
      destination: dest
    };
  }

  // 6. EXHAUST
  // Relative comparison EXHAUST / HEAVY EXHAUST (DEF-REL-TARGET-01)
  if (relComp && /(?:heavy\s+exhaust|exhaust)\s+/i.test(rawClauseText)) {
    m = rawClauseText.match(/(heavy\s+exhaust|exhaust)\s+(all|every|any\s+number\s+of|an?|one|two|\d+)?\s*(opposing\s+)?(?:exhausted\s+)?(spirits?\/nexuses?|spirits?\/ultimates?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?)/i);
    if (m) {
      const isHeavy = m[1].toLowerCase().includes('heavy');
      const isAll = /all|every/i.test(m[2]);
      const isOpp = Boolean(m[3]) || !rawClauseText.toLowerCase().includes('you control');
      const types = parseTypes(m[4]);
      const count = isAll ? 'ALL' : parseNumber(m[2]);
      return {
        op: 'EXHAUST',
        count,
        ...(isHeavy ? { isHeavy: true } : {}),
        target: {
          side: isOpp ? 'opp' : 'either',
          types,
          filters: {
            comparison: relComp
          }
        }
      };
    }
  }
  if (/^exhaust\s+it$/i.test(text.trim())) {
    return { op: 'EXHAUST', target: 'PREVIOUS_TARGET' };
  }
  if (/^(?:you\s+can\s+)?exhaust\s+this\s+(?:nexus|spirit|ultimate)/i.test(text.trim()) ||
      /by\s+exhausting\s+this\s+(?:nexus|spirit|ultimate)/i.test(text.trim())) {
    return { op: 'EXHAUST', target: 'self' };
  }
  // "Select 1 color. Then, exhaust all unexhausted spirits with the selected color"
  if (/select\s+(?:1|one)\s+color.*exhaust\s+all\s+unexhausted\s+spirits/i.test(text)) {
    return {
      op: 'EXHAUST_BY_COLOR',
      target: { types: ['Spirit'], state: 'REFRESHED' }
    };
  }
  // "When this Spirit is blocked, the opponent exhausts two Spirits they control"
  m = text.match(/the\s+opponent\s+exhausts\s+(a|an|one|two|three|\d+)\s+spirits?\s+they\s+control/i);
  if (m) {
    return {
      op: 'EXHAUST',
      count: parseNumber(m[1]),
      chooser: 'opp',
      target: { side: 'opp', types: ['Spirit'] }
    };
  }
  m = text.match(/(heavy\s+)?exhaust\s+(an?|one|two|three|\d+)?\s*opposing\s+(spirit|ultimate)/i);
  if (m) {
    return {
      op: 'EXHAUST',
      isHeavy: Boolean(m[1]),
      count: parseNumber(m[2]),
      target: { side: 'opp', types: [capitalize(m[3])] }
    };
  }

  // 7. REFRESH
  if (/^refresh\s+it$/i.test(text.trim())) {
    return { op: 'REFRESH', target: 'PREVIOUS_TARGET' };
  }
  // "This Spirit can, up to once per turn, be refreshed by exhausting one of your Nexuses."
  if (/be\s+refreshed\s+by\s+exhausting\s+(?:one\s+of\s+your|a)\s+nexuses?/i.test(text)) {
    return {
      op: 'REFRESH_BY_EXHAUSTING_NEXUS',
      target: 'self'
    };
  }
  if (/\b(?:this\s+(?:spirit|ultimate)\s+(?:refreshes|can\s+refresh)|refresh\s+this\s+(?:spirit|ultimate))\b/i.test(text)) {
    return {
      op: 'REFRESH',
      target: 'self'
    };
  }
  m = text.match(/refresh\s+(a|an|one|two|\d+)?\s*(?:of\s+your\s+)?(spirits?|ultimates?)/i);
  if (m) {
    return {
      op: 'REFRESH',
      count: parseNumber(m[1]),
      target: { side: 'self', types: parseTypes(m[2]) }
    };
  }

  // 8. BP_BUFF
  // "During this turn, give all your blocking Spirits +3000 BP" / "all your attacking Spirits gain +2000 BP"
  m = text.match(/(?:give\s+)?all\s+(?:your\s+)?(blocking|attacking)?\s*(?:“([^”]+)”|"([^"]+)")?\s*(?:family\s+)?spirits?\s*(?:gain|\+)?\s*\+(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'BP_BUFF',
      amount: parseInt(m[4], 10),
      targetGroup: m[1] ? m[1].toUpperCase() : 'ALL_FRIENDLY',
      family: m[2] || m[3] || null,
      target: 'all_friendly',
      duration: clause.duration || 'THIS_TURN'
    };
  }
  // "Target spirit gets +5000BP until end of turn"
  m = text.match(/target\s+spirit\s+gets?\s*\+(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'BP_BUFF',
      amount: parseInt(m[1], 10),
      target: 'target',
      duration: clause.duration || 'THIS_TURN'
    };
  }
  // "this Spirit gains +10000 BP", "This Spirit gains +4000 BP", "give a Spirit/Ultimate +2000 BP", "give it +N BP"
  m = text.match(/(?:this\s+spirit\s+gains?|give\s+(?:a\s+(?:spirit|ultimate|spirit\/ultimate)|it))\s*\+(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'BP_BUFF',
      amount: parseInt(m[1], 10),
      target: text.includes('this spirit') ? 'self' : 'target',
      duration: clause.duration || 'THIS_TURN'
    };
  }

  // 9. BP_DEBUFF
  // "give an opposing Spirit -N BP", "give it -N BP", "opposing Spirit gets -N BP", "give all opposing Spirits/Ultimates -N BP"
  m = text.match(/(?:give\s+(?:(all|an?|one|two|three|\d+)\s+(?:battling\s+)?opposing\s+(?:battling\s+)?(spirits?(?:\/ultimates?)?|ultimates?)|it)|(all\s+)?(?:battling\s+)?opposing\s+(?:battling\s+)?(spirits?(?:\/ultimates?)?|ultimates?)\s+gets?)\s*-(\d+)\s*bp/i);
  if (m) {
    const isIt = /\bit\b/i.test(text);
    const qtyWord = m[1] || (m[3] ? 'all' : null);
    const typeStr = m[2] || m[4] || 'Spirit';
    const isAll = Boolean(qtyWord && /^(all|every)$/i.test(qtyWord));
    const count = (!isAll && qtyWord) ? parseNumber(qtyWord) : undefined;
    const isBattling = /\bbattling\b/i.test(text);
    const targetObj = isIt ? 'PREVIOUS_TARGET' : {
      side: 'opp',
      types: parseTypes(typeStr),
      ...(isBattling ? { state: 'BATTLING' } : {})
    };
    return {
      op: 'BP_DEBUFF',
      amount: parseInt(m[5], 10),
      ...(isAll ? { all: true } : (count && count > 1 ? { count } : {})),
      target: targetObj,
      duration: clause.duration || (/during\s+this\s+battle/i.test(text) ? 'DURING_THIS_BATTLE' : 'THIS_TURN')
    };
  }

  // 10. SUMMON_FREE
  // "summon this card without paying the cost", "you can summon this card from the Hand without paying the cost"
  if (/summon\s+(?:this\s+card|this\s+brave)\s+(?:from\s+(?:the\s+)?hand\s+)?without\s+paying\s+(?:the\s+)?cost/i.test(text)) {
    return {
      op: 'SUMMON_FREE',
      target: 'this_card',
      from: /from\s+the\s+hand/i.test(text) ? 'HAND' : 'BURST'
    };
  }

  // 11. ADD_COUNTER
  m = text.match(/(?:your\s+)?counters?\s*\+(\d+)/i);
  if (m) {
    return {
      op: 'ADD_COUNTER',
      count: parseInt(m[1], 10)
    };
  }

  // 12. ACTIVATE_FLASH
  if (/activate\s+this\s+card's\s+flash\s+effect/i.test(text)) {
    return { op: 'ACTIVATE_FLASH' };
  }

  // 13. BURST_LOCK
  if (/opposing\s+burst\s+can't\s+activate|opponent\s+cannot\s+activate\s+burst/i.test(text)) {
    return { op: 'BURST_LOCK', side: 'opp' };
  }

  // 14. TARGET_ATTACK
  if (/target\s+and\s+attacks?\s+an\s+opposing\s+(spirit|ultimate)/i.test(text)) {
    return {
      op: 'TARGET_ATTACK',
      target: { side: 'opp', types: ['Spirit'] }
    };
  }

  // 15. ADVENT (Stacking)
  if (/stack\s+this\s+(?:card\s+)?from\s+(?:the\s+)?hand\s+onto\s+your\s+target\s+(spirit|ultimate)/i.test(text)) {
    return {
      op: 'ADVENT_STACK',
      from: 'HAND',
      target: { side: 'self', types: parseTypes(m ? m[1] : 'spirit') }
    };
  }

  // 16. END_BATTLE
  if (/immediately\s+end\s+the\s+battle|end\s+the\s+battle/i.test(text)) {
    return { op: 'END_BATTLE' };
  }

  // 17. SYMBOL FIX / GRANT
  // "this Nexus' symbol becomes two Purple symbols"
  m = text.match(/symbol\s+(?:becomes|is\s+fixed\s+as)\s+(one|two|three|four|\d+)\s+([A-Za-z]+)\s+symbols/i);
  if (m) {
    return {
      op: 'SET_SYMBOL',
      count: parseNumber(m[1]),
      symbolColor: m[2],
      target: 'self'
    };
  }

  // 18. MILL_DECKTOP
  m = text.match(/send\s+(?:the\s+)?top\s+(\d+|one|two|three)\s+cards?\s+of\s+(?:the\s+)?(opposing\s+deck|your\s+deck)\s+to\s+(?:the\s+)?trash/i);
  if (m) {
    return {
      op: 'MILL_DECKTOP',
      count: parseNumber(m[1]),
      side: m[2].includes('opposing') ? 'opp' : 'self'
    };
  }

  // 19. REVEAL / OPEN DECKTOP
  // "You can reveal three cards from your decktop" / "reveal the top 3 cards"
  m = text.match(/(?:reveal|open|you\s+can)\s+(a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:your\s+)?decktop/i) ||
      text.match(/(?:reveal|open)\s+(?:the\s+)?top\s+(\d+|one|two|three|four|five)\s+cards?\s+of\s+your\s+deck/i);
  if (m) {
    return {
      op: 'REVEAL_DECKTOP',
      count: parseNumber(m[1])
    };
  }

  // 19b. CLEANUP REVEALED CARDS
  if (/discard\s+(?:any\s+)?remaining\s+cards/i.test(text)) {
    return { op: 'DISCARD_REVEALED' };
  }
  if (/return\s+(?:any\s+)?remaining\s+cards\s+to\s+(?:the\s+)?deckbottom/i.test(text)) {
    return { op: 'RETURN_REVEALED_BOTTOM' };
  }

  // 19c. GRANDWALKER PROTECTION & CORE CHARGE
  if (/This Nexus can only be affected by effects that (?:target|specify)\s+"?Grandwalker Nexuse?s?"?/i.test(text)) {
    return { op: 'GRANDWALKER_PROTECTION' };
  }
  if (/Cores can only be placed on this Nexus via Core Charge/i.test(text)) {
    return { op: 'GRANDWALKER_CORE_RULE' };
  }
  m = text.match(/(?:◆\s*)?When this Nexus is deployed,\s*if you do not control a Grandwalker Nexus with the same card name,\s*you can send (\d+|three|two|one)\s+cards?\s+from\s+your\s+decktop\s+to\s+the\s+Trash/i);
  if (m) {
    return { op: 'CORE_CHARGE_TRIGGER', millCount: parseNumber(m[1]) };
  }
  m = text.match(/For each target card among them,\s*(?:\+?(\d+)\s*cores?|put a core from the Void)\s+to(?:nto)?\s+this\s+Nexus/i);
  if (m) {
    return { op: 'CORE_CHARGE_ADD', count: parseNumber(m[1]) };
  }

  // 19d. ACCEL / REMOVED ZONE
  if (/put\s+this\s+card\s+(?:face-up\s+)?onto\s+(?:the\s+)?removed\s+zone/i.test(text)) {
    return { op: 'OPEN_ZONE' };
  }

  // 19e. CHANGE / SWAP
  m = text.match(/either\s+discard\s+this\s+card\s+or\s+replace\s+one\s+of\s+your\s+cost\s+(\d+)\s+or\s+less/i);
  if (m) {
    return { op: 'CHANGE', maxCost: parseInt(m[1], 10) };
  }

  // 19f. TARGET
  if (relComp && /target\s+/i.test(rawClauseText)) {
    m = rawClauseText.match(/target\s+(an?|one|two|\d+)?\s*(opposing\s+)?(?:exhausted\s+)?(spirits?\/ultimates?|spirits?\/nexuses?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?|braves?)/i);
    if (m) {
      const isOpp = Boolean(m[2]) || !rawClauseText.toLowerCase().includes('you control');
      const types = parseTypes(m[3]);
      const count = parseNumber(m[1]);
      return {
        op: 'TARGET',
        count,
        target: {
          side: isOpp ? 'opp' : 'either',
          types,
          filters: {
            comparison: relComp
          }
        }
      };
    }
  }
  m = text.match(/target\s+an\s+opposing\s+(spirit|ultimate|nexus)/i);
  if (m) {
    return { op: 'TARGET', target: { side: 'opp', types: parseTypes(m[1]) } };
  }

  // 19g. ADD SEARCHED TO HAND
  m = text.match(/add\s+(a|an|one|two|three|\d+)?\s*(?:of\s+them|target\s+cards?|cards?)\s+to\s+(?:your\s+)?hand/i);
  if (m) {
    return { op: 'ADD_TO_HAND', count: parseNumber(m[1]) };
  }

  // 19h. RETURN TO HAND COST
  if (/by\s+(?:not\s+attacking\s+with\s+this\s+spirit\s+and\s+)?returning\s+(?:this\s+spirit|it)\s+to\s+the\s+hand/i.test(text)) {
    return { op: 'BOUNCE', target: 'self', destination: 'HAND' };
  }
  if (/return\s+it\s+to\s+the\s+hand/i.test(text)) {
    return { op: 'BOUNCE', target: 'PREVIOUS_TARGET', destination: 'HAND' };
  }

  // 19i. BRAVE RESTRICTIONS
  if (/This Brave (?:in Spirit condition )?can't attack\s*(?:\/|or)\s*block/i.test(text) || /can't attack or block/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_ATTACK_OR_BLOCK' };
  }

  // 19j. UNPREVENTABLE
  if (/(?:can'?t|cannot)\s+be\s+prevented/i.test(text)) {
    return {
      op: 'UNSUPPORTED',
      unhandledClause: text,
      reason: 'UNSUPPORTED_EFFECT_PROTECTION: effect cannot be prevented by opposing effects'
    };
  }

  // 19k. ADVENT COST & STACKING
  if (/pay\s+(?:one|\d+)?\s*cost\s+from\s+the\s+target\s+to\s+summon\s+this\s+card\s+from\s+(?:the\s+)?hand/i.test(text)) {
    return { op: 'ADVENT_PAY', from: 'HAND' };
  }
  if (/stack\s+this\s+from\s+(?:your\s+)?hand\s+onto\s+your\s+target\s+spirit/i.test(text)) {
    return { op: 'ADVENT_STACK', from: 'HAND', target: { side: 'self', types: ['Spirit'] } };
  }

  // 19l. RESERVE CORE RULES
  if (/cores\s+to\s+be\s+put\s+on\s+this\s+spirit\s+must\s+also\s+be\s+from\s+the\s+reserve/i.test(text) ||
      /can\s+be\s+summoned\s+by\s+paying\s+the\s+cost\s+with\s+cores\s+in\s+the\s+reserve/i.test(text)) {
    return { op: 'SUMMON_RESERVE_ONLY' };
  }

  // 19m. CONTINUE BATTLE
  if (/continue\s+the\s+battle/i.test(text)) {
    return { op: 'CONTINUE_BATTLE' };
  }

  // 19n. FREE SUMMON FROM HAND
  if (/summon\s+(?:this\s+spirit\s+card|a\s+target\s+card\s+from\s+your\s+hand)\s*(?:,\s*)?without\s+paying\s+the\s+cost/i.test(text)) {
    return { op: 'SUMMON_FREE', from: 'HAND' };
  }

  // 19o. PUT CORE VOID TO RESERVE
  if (/put\s+(?:a|an|one|\d+)?\s*core[s]?\s+from\s+(?:the\s+)?void\s+to\s+your\s+reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }

  // 19p. EXHAUSTED BLOCK & FORCE BLOCK
  if (/can\s+block\s+while\s+exhausted/i.test(text)) {
    return { op: 'EXHAUSTED_BLOCK' };
  }
  if (/must\s+block\s+if\s+possible/i.test(text)) {
    return { op: 'FORCE_BLOCK', side: 'opp' };
  }

  // 19q. EXHAUST SELF COST & DESTROY EXHAUSTED
  if (/by\s+exhausting\s+this\s+spirit/i.test(text)) {
    return { op: 'EXHAUST', target: 'self' };
  }
  if (/destroy\s+an\s+opposing\s+exhausted\s+spirit/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'], filters: { state: 'EXHAUSTED' } } };
  }

  // 19r. DISCARD BURST
  if (/discard\s+an\s+opposing\s+burst/i.test(text)) {
    return { op: 'DISCARD_BURST', side: 'opp' };
  }

  // 19s. SOUL STATE CONTRACT ADVENT RULE
  if (/While this card is in Soul State,\s*you can \[Contract Advent\] onto it/i.test(text)) {
    return { op: 'CONTRACT_ADVENT_TARGET_RULE' };
  }

  // 20. IMMUNITY
  if (/unaffected\s+by\s+opposing\s+(?:spirit|effects|magic|nexus)/i.test(text)) {
    return {
      op: 'IMMUNITY',
      immuneTo: 'OPPOSING_EFFECTS'
    };
  }

  // 21. CANNOT ATTACK / BLOCK / UNBLOCKABLE
  // Relative comparison UNBLOCKABLE (DEF-REL-TARGET-01)
  if (relComp && /can'?t\s+be\s+blocked/i.test(rawClauseText)) {
    m = rawClauseText.match(/can'?t\s+be\s+blocked\s+by\s+(opposing\s+)?(?:exhausted\s+)?(spirits?\/ultimates?|spirits?\/nexuses?|spirit\/nexus|spirit\/ultimate|spirits?|ultimates?|nexuses?)/i);
    const types = m ? parseTypes(m[2]) : ['Spirit'];
    return {
      op: 'UNBLOCKABLE',
      target: 'self',
      filter: {
        side: 'opp',
        types,
        filters: {
          comparison: relComp
        }
      }
    };
  }
  // "This Spirit can't be blocked by Green Spirits"
  m = text.match(/this\s+spirit\s+can't\s+be\s+blocked\s+by\s+(Red|Purple|Green|White|Yellow|Blue)\s+spirits/i);
  if (m) {
    return {
      op: 'UNBLOCKABLE',
      target: 'self',
      blockedByColor: capitalize(m[1])
    };
  }
  // "This Spirit can't be blocked by opposing LV2 Spirits"
  m = text.match(/this\s+spirit\s+can't\s+be\s+blocked\s+by\s+opposing\s+lv\s*(\d+)\s+spirits/i);
  if (m) {
    return {
      op: 'UNBLOCKABLE',
      target: 'self',
      blockedByLevel: parseInt(m[1], 10)
    };
  }
  // "This Spirit can't be blocked" / "can't be blocked by opposing"
  if (/this\s+spirit\s+can'?t\s+be\s+blocked/i.test(text)) {
    return {
      op: 'UNBLOCKABLE',
      target: 'self'
    };
  }
  // "This Spirit can't block opposing Spirits"
  if (/this\s+spirit\s+can't\s+block/i.test(text)) {
    return {
      op: 'SET_RESTRICTION',
      target: 'self',
      restriction: 'CANNOT_BLOCK'
    };
  }
  // "This Spirit can't attack"
  if (/this\s+spirit\s+can't\s+attack/i.test(text)) {
    return {
      op: 'SET_RESTRICTION',
      target: 'self',
      restriction: 'CANNOT_ATTACK'
    };
  }
  // "Neither player's Life can be reduced by the attacks of Cost N or less Spirits"
  m = text.match(/neither\s+player's\s+life\s+can\s+be\s+reduced\s+by\s+the\s+attacks\s+of\s+cost\s+(\d+)\s+or\s+less\s+spirits/i);
  if (m) {
    return {
      op: 'DAMAGE_CAP',
      rule: 'NO_LIFE_DAMAGE_BY_COST_LTE',
      maxCost: parseInt(m[1], 10)
    };
  }
  if (/cannot\s+attack/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_ATTACK' };
  }
  if (/cannot\s+block/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_BLOCK' };
  }

  // 21b. SALVAGE & TRASH RECOVERY
  // "Choose and return a Spirit card from the Trash to your Hand", "return a Cost 3 or less Spirit card from your Trash to your Hand",
  // "add a Magic card from your Trash to your Hand", "return this card from the Trash to the Hand"
  if (/(?:choose\s+and\s+)?(?:return|add)\s+.*from\s+(?:(?:the|your|their)\s+)?(?:opposing\s+|either\s+(?:player['’]s\s+)?)?trash\s+to\s+(?:the\s+|your\s+|their\s+|opposing\s+)?(?:hand|decktop|deckbottom|bottom\s+of\s+(?:your|the|opposing|their)\s+deck|top\s+of\s+(?:your|the|opposing|their)\s+deck)/i.test(text) ||
      /(?:choose\s+and\s+)?(?:return|add)\s+(?:this\s+(?:spirit|brave|ultimate|nexus)?\s*card|it)\s+from\s+(?:the\s+|your\s+)?trash\s+to\s+(?:the\s+|your\s+)?hand/i.test(text) ||
      /return\s+all\s+magic\s+cards\s+you\s+used\s+during\s+this\s+battle\s+to\s+the\s+hand/i.test(text)) {
    const sal = parseTrashSalvageOp(text, rawClauseText);
    if (sal) return sal;
  }

  // 21c. DECK DISCARD RULES & MILL BY LEVEL
  // "Discard a number of cards from the opposing decktop equal to this Spirit's LV"
  if (/discard\s+(?:a\s+number\s+of\s+)?cards?\s+from\s+(?:the\s+)?opposing\s+decktop\s+equal\s+to\s+this\s+spirit's\s+lv/i.test(text)) {
    return {
      op: 'MILL_DECK',
      count: 'LEVEL',
      side: 'opp'
    };
  }
  // "Cards can't be discarded from either deck"
  if (/cards?\s+can't\s+be\s+discarded\s+from\s+either\s+(?:player's\s+)?deck/i.test(text)) {
    return {
      op: 'CONTINUOUS_RULE',
      rule: 'NO_DECK_DISCARD'
    };
  }

  // 22. CORE TO NEXUS FOR EACH
  m = text.match(/for each (?:target )?card among them,\s+put (?:a|an|one|\d+)?\s*cores? from (?:the )?void onto this nexus/i);
  if (m) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      source: 'VOID',
      destination: 'THIS_NEXUS',
      forEach: 'TARGET_CARDS_COUNT'
    };
  }

  // 23. SEND CARDS FROM DECKTOP TO TRASH (MILL)
  m = text.match(/(?:(?:when this nexus is deployed|once per turn[^:]*),?\s*)?(?:you can\s+)?send (a|an|one|two|three|four|five|\d+)\s+cards? from (?:your\s+)?decktop to the trash/i);
  if (m) {
    return {
      op: 'MILL_DECK',
      count: parseNumber(m[1]),
      source: 'DECK_TOP',
      destination: 'TRASH'
    };
  }

  // 24. RUSH & BRAVE SYMBOL KEYWORD PATTERNS
  m = text.match(/\(While\s+you\s+have\s+a\s+([A-Za-z]+)\s+symbol,\s*the\s+following\s+effect\s+activates\s+next\.?\)/i) ||
      text.match(/^\[?Rush:\s*([^\]]+)\]?/i);
  if (m) {
    const col = capitalize(m[1].trim());
    return {
      op: 'KEYWORD_ABILITY',
      keyword: 'Rush',
      condition: {
        kind: 'STRUCTURED_CONDITION',
        type: 'COLOR_SYMBOL',
        side: 'self',
        color: col.toLowerCase(),
        colorSymbol: col
      }
    };
  }
  m = text.match(/^\[?Brave Symbol\s*\+\s*(\d+)\]?/i);
  if (m) {
    return { op: 'GRANT_BRAVE_SYMBOLS', count: parseInt(m[1], 10) };
  }

  // 24b. CONTINUOUS RULES & MODIFIERS
  // "Your BP- effect decreases N further"
  m = text.match(/your\s+["“]?bp-?\s*effect["”]?\s+decreases\s+(\d+)\s+further/i);
  if (m) {
    return { op: 'DECREASE_BP_EFFECT', amount: parseInt(m[1], 10) };
  }
  // "The cost of all 'Vanity Deity' family Spirit cards in your Hand becomes N"
  m = text.match(/the\s+cost\s+of\s+all\s+["“]([^"”]+)["”]\s+family\s+spirit\s+cards\s+in\s+your\s+hand\s+becomes\s+(\d+)/i);
  if (m) {
    return { op: 'SET_HAND_COST', family: m[1], cost: parseInt(m[2], 10) };
  }
  // "When your Cost N or less Spirits are destroyed by opposing effects, they can remain on the Field, exhausted"
  m = text.match(/when\s+your\s+cost\s+(\d+)\s+or\s+less\s+spirits\s+are\s+destroyed.*remain\s+on\s+the\s+field,\s+exhausted/i);
  if (m) {
    return { op: 'REMAIN_ON_FIELD_EXHAUSTED', maxCost: parseInt(m[1], 10) };
  }
  // "This Spirit's color and symbol are also treated as [Color]"
  m = text.match(/color\s+and\s+symbol\s+are\s+also\s+treated\s+as\s+([A-Za-z\/]+)/i);
  if (m) {
    return { op: 'TREAT_COLOR_SYMBOL', color: m[1] };
  }
  // "However, any (When Summoned) effects of the Spirit can't activate"
  if (/any\s+\(when\s+summoned\)\s+effects\s+of\s+the\s+spirit\s+can't\s+activate/i.test(text)) {
    return { op: 'PREVENT_WHEN_SUMMONED' };
  }
  // "Your non-Ultimate opposing-deck-discarding effects discard +N card"
  m = text.match(/opposing-deck-discarding\s+effects\s+discard\s*\+(\d+)\s*cards?/i);
  if (m) {
    return { op: 'ENHANCE_MILL_COUNT', amount: parseInt(m[1], 10) };
  }
  // "Target a family"
  if (/target\s+a\s+family/i.test(text)) {
    return { op: 'TARGET_FAMILY' };
  }
  // "This effect can't be used during the Main Step"
  if (/this\s+effect\s+can't\s+be\s+used\s+during\s+the\s+main\s+step/i.test(text)) {
    return { op: 'RESTRICT_MAIN_STEP' };
  }

  // 25. PUT CORES ONTO ADVENT CARD
  if (/put (?:any number of|all) cores from your field(?:\/reserve)? to the (?:advent|contract) card/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ANY', source: 'FIELD_RESERVE', destination: 'ADVENT_CARD' };
  }

  // 26. A.T. FIELD
  if (/^\[?A\.T\.\s*Field\]?/i.test(text)) {
    return { op: 'KEYWORD_ABILITY', keyword: 'A.T. Field' };
  }

  // 27. LEGACY FORMAT MARKER
  if (/^Legacy$/i.test(text)) {
    return { op: 'FORMAT_MARKER', marker: 'LEGACY' };
  }

  // 28. KEYWORD ACTIONS & REMINDER PATTERNS
  // High Speed
  if (/This Spirit card can be summoned from the Hand during Flash Timing/i.test(text) ||
      /When you do, cores to be put on this Spirit and its cost must be paid from the Reserve/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'High Speed' };
  }
  // Tribute
  if (/After paying for the summoning cost, you must send all cores from (?:one of your|a) (?:Cost \d+ or more|\"[^\"]+\" family) Spirit/i.test(text) ||
      /After paying for the summoning cost, you must send all cores from/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Tribute' };
  }
  // Clash
  if (/opponent must block if able/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Clash' };
  }
  // Crush
  if (/discard cards? from the (?:top of (?:your )?opponent's deck|opposing decktop) equal to this Spirit's LV/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Crush' };
  }
  // Curse
  if (/destroy the (?:opposing )?spirit that blocked/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Curse' };
  }
  // Windstorm
  if (/exhaust \d+ opposing Spirit/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Windstorm' };
  }
  // Holy Life
  if (/deals damage to (?:the )?opponent's life/i.test(text) && /Void to (?:your )?Life/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Holy Life' };
  }
  // Armor / Heavy Armor / Immunity
  if (/unaffected by (?:the )?effects of opposing/i.test(text) || /unaffected by opposing cards?'? effects/i.test(text) || /unaffected by opposing (?:Red|Purple|Green|White|Yellow|Blue)/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'IMMUNITY' };
  }
  // Rush reminder / condition
  if (/While you have a \w+ symbol, the following effect activates next/i.test(text)) {
    return { op: 'RUSH_CONDITION' };
  }
  // Charge
  if (/While this Spirit is attacking/i.test(text) && /gains? \+\d+ BP/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'Charge' };
  }

  // 29. SUMMON THIS CARD (Burst / Flash / Self)
  if (/summon\s+(?:this\s+(?:spirit|brave|ultimate|nexus)?\s*card|it)\b/i.test(text)) {
    let from = 'HAND_OR_BURST';
    if (/trash/i.test(text)) from = 'TRASH';
    else if (/removed\s+zone/i.test(text)) from = 'REMOVED';
    else if (/hand/i.test(text) && !/burst/i.test(text)) from = 'HAND';
    const isFree = /without\s+paying\s+(?:the\s+)?cost/i.test(text);
    const costM = text.match(/pay\s+(one|two|three|\d+)\s+cost/i);
    const costCores = costM ? parseNumber(costM[1]) : 0;
    return {
      op: 'SUMMON_THIS_CARD',
      from,
      ...(isFree ? { free: true } : {}),
      ...(costCores ? { costCores } : {})
    };
  }

  // 30. TARGET SELECTION & CHOOSER CLAUSES
  if (/^Target a Spirit(?: you or the opponent controls| you control)?$/i.test(text)) {
    const side = /you control/i.test(text) && !/or the opponent/i.test(text) ? 'self' : 'either';
    return { op: 'TARGET_SELECT', target: { side, types: ['Spirit'] } };
  }
  if (/^Choose a color among the colors of either player/i.test(text)) {
    return { op: 'CHOOSE_COLOR', chooser: 'both', colorsFromField: true };
  }
  if (/^Select \d+ color\b/i.test(text) || /^Choose a color\b/i.test(text)) {
    return { op: 'CHOOSE_COLOR', chooser: 'self' };
  }

  // 31. EXPANDED CORE MOVEMENTS
  // "Put four cores from the Void to a Spirit" / "Put a core from the Void to your Life/Reserve/one of your Spirits"
  m = text.match(/put\s+(a|an|one|two|three|four|five|\d+)?\s*cores?\s+from\s+the\s+void\s+to\s+(your\s+life|your\s+reserve|a\s+spirit(?:\s+you\s+control)?|one\s+of\s+your\s+spirits|another\s+spirit)/i);
  if (m) {
    const dest = m[2].toLowerCase();
    let toZone = 'field';
    if (dest.includes('life')) toZone = 'life';
    else if (dest.includes('reserve')) toZone = 'reserve';
    return {
      op: 'MOVE_CORE',
      count: parseNumber(m[1]),
      from: { zone: 'void' },
      to: { zone: toZone, side: 'self', types: ['Spirit'] },
      chooser: 'self'
    };
  }
  // "Gain 1 core in your reserve"
  if (/gain\s+(\d+)\s+cores?\s+in\s+your\s+reserve/i.test(text)) {
    const c = parseInt(text.match(/gain\s+(\d+)/i)[1], 10);
    return { op: 'MOVE_CORE', count: c, from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }
  // "Send a core from your Reserve to your Life"
  if (/send\s+(?:a|1)\s+core\s+from\s+your\s+reserve\s+to\s+your\s+life/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'reserve', side: 'self' }, to: { zone: 'life', side: 'self' } };
  }
  // "Send a core from your Field or your Trash to the Void"
  if (/send\s+(?:a|1)\s+core\s+from\s+your\s+field\s+or\s+your\s+trash\s+to\s+the\s+void/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'field_or_trash', side: 'self' }, to: { zone: 'void' } };
  }
  // "Move 1 core from target spirit your opponent controls to its owner's Reserve"
  if (/move\s+(\d+)\s+cores?\s+from\s+target\s+spirit.*to.*reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'field', side: 'opp', types: ['Spirit'] }, to: { zone: 'reserve', side: 'opp' } };
  }
  // "Each player moves 1 core from a spirit they control to the trash"
  if (/each player moves\s+(\d+)\s+core\s+from\s+a\s+spirit\s+they\s+control\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'field', side: 'both', types: ['Spirit'] }, to: { zone: 'trash' } };
  }
  // "Move all but 1 core from target spirit to other spirits that have the same controller as it"
  if (/move all but 1 core from target spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL_BUT_ONE', from: { zone: 'field', side: 'either', types: ['Spirit'] }, to: { zone: 'field' } };
  }
  // "Leaving only one core on a Spirit, send every other core from it to its owner's Reserve"
  if (/leaving only one core on a spirit|send every other core from it to its owner's reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL_BUT_ONE', from: { zone: 'field' }, to: { zone: 'reserve' } };
  }
  // "When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve"
  if (/send an opposing life to their reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'life', side: 'opp' }, to: { zone: 'reserve', side: 'opp' } };
  }
  // "Put a number of cores from the Void to your Reserve equal to the cost of the destroyed Spirit"
  if (/equal to the cost of the destroyed spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'DESTROYED_COST', from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }

  // 32. EXPANDED BOUNCE & RETURN
  // "Return this Spirit to your Hand"
  if (/return this spirit to your hand/i.test(text)) {
    return { op: 'BOUNCE', target: 'SELF' };
  }
  // "Return a Spirit to its owner's Hand"
  if (/return a spirit to its owner's hand/i.test(text)) {
    return { op: 'BOUNCE', count: 1, target: { side: 'either', types: ['Spirit'] } };
  }
  // "Return an opposing Nexus to the Hand"
  if (/return an opposing nexus to the hand/i.test(text)) {
    return { op: 'BOUNCE', count: 1, target: { side: 'opp', types: ['Nexus'] } };
  }
  // "Return every ... Spirit to the Hand"
  m = text.match(/return\s+every\s+(?:opposing\s+)?(?:cost\s+(\d+)\s+or\s+less\s+)?(?:(\d+)\s+bp\s+or\s+less\s+)?spirits?\s+to\s+the\s+hand/i);
  if (m) {
    return {
      op: 'BOUNCE',
      all: true,
      target: {
        side: /opposing/i.test(text) ? 'opp' : 'either',
        types: ['Spirit'],
        maxCost: m[1] ? parseInt(m[1], 10) : null,
        maxBp: m[2] ? parseInt(m[2], 10) : null
      }
    };
  }
  // "return this Nexus to the deckbottom"
  if (/return this nexus to the deckbottom/i.test(text)) {
    return { op: 'BOUNCE_TO_DECKBOTTOM', target: 'SELF' };
  }
  // "Return any remaining card to the decktop/deckbottom"
  if (/return any remaining card to the deck(top|bottom)/i.test(text)) {
    return { op: 'RETURN_REMAINING_TO_DECK', position: /bottom/i.test(text) ? 'bottom' : 'top' };
  }
  // "At the end of battle, return every Magic card you used during this battle to your Hand"
  if (/return (?:all|every) magic cards? you used during this battle to (?:the|your) hand/i.test(text)) {
    return { op: 'SALVAGE', cardType: 'Magic', filter: { usedThisBattle: true } };
  }
  // "Add any remaining card to the Hand"
  if (/add any remaining card to the hand/i.test(text)) {
    return { op: 'ADD_TO_HAND', count: 'REMAINING' };
  }

  // 33. EXPANDED DESTROY
  // "Destroy an exhausted Spirit you or the opponent controls" / "Destroy target exhausted spirit"
  if (/destroy (?:an|target) exhausted spirit/i.test(text)) {
    const side = /you control/i.test(text) && !/or the opponent/i.test(text) ? 'self' : (/opposing|opponent controls/i.test(text) && !/you or/i.test(text) ? 'opp' : 'either');
    return { op: 'DESTROY', count: 1, target: { side, types: ['Spirit'], state: 'exhausted' } };
  }
  // "Both players destroy a Spirit they control"
  if (/both players destroy a spirit they control/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'both', types: ['Spirit'] } };
  }
  // "the opponent destroys a Spirit they control"
  if (/opponent destroys? a spirit they control/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'] }, chooser: 'opp' };
  }
  // "Destroy all/every 3000 BP or less Spirits"
  m = text.match(/destroy\s+(?:all|every)\s+(\d+)\s+bp\s+or\s+less\s+spirits?/i);
  if (m) {
    return { op: 'DESTROY', all: true, target: { side: 'either', types: ['Spirit'], maxBp: parseInt(m[1], 10) } };
  }
  // "destroy the Spirit with a lower Level"
  if (/destroy the spirit with a lower level/i.test(text)) {
    return { op: 'DESTROY', target: { lowestLevel: true, types: ['Spirit'] } };
  }
  // "If their Levels are the same, destroy both players' Spirits"
  if (/destroy both players'? spirits/i.test(text)) {
    return { op: 'DESTROY', target: { side: 'both', types: ['Spirit'] } };
  }
  // "You can destroy a Spirit with [High Speed]"
  if (/destroy a spirit with \[high speed\]/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { types: ['Spirit'], hasKeyword: 'High Speed' } };
  }
  // "Destroy target '...' spirit you control"
  m = text.match(/destroy target\s+["“]([^"”]+)["”]\s+spirit\s+you\s+control/i);
  if (m) {
    return { op: 'DESTROY', count: 1, target: { side: 'self', types: ['Spirit'], family: m[1] } };
  }

  // 34. EXPANDED BP BUFFS
  // "All your White Spirits gain +1000 BP" / "All green spirits you control get +1000BP"
  m = text.match(/all\s+(?:your\s+)?(red|purple|green|white|yellow|blue)\s+spirits(?:\s+you\s+control)?\s+(?:gain|get)\s+\+(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'BP_BUFF',
      amount: parseInt(m[2], 10),
      target: { side: 'self', types: ['Spirit'], color: capitalize(m[1]) },
      all: true
    };
  }
  // "This spirit gets +2000BP until end of turn"
  m = text.match(/this\s+spirit\s+(?:gets|gains)\s+\+(\d+)\s*bp\s+until\s+end\s+of\s+turn/i);
  if (m) {
    return { op: 'BP_BUFF', amount: parseInt(m[1], 10), target: 'SELF', duration: 'UNTIL_END_OF_TURN' };
  }
  // "Additionally, all spirits you control get +1000BP until end of turn"
  m = text.match(/all\s+spirits\s+you\s+control\s+(?:get|gain)\s+\+(\d+)\s*bp\s+until\s+end\s+of\s+turn/i);
  if (m) {
    return { op: 'BP_BUFF', amount: parseInt(m[1], 10), target: { side: 'self', types: ['Spirit'] }, all: true, duration: 'UNTIL_END_OF_TURN' };
  }
  // "This spirit gets +1000BP for each nexus you control"
  m = text.match(/this\s+spirit\s+(?:gets|gains)\s+\+(\d+)\s*bp\s+for\s+each\s+nexus/i);
  if (m) {
    return { op: 'BP_BUFF', amount: parseInt(m[1], 10), target: 'SELF', forEach: 'NEXUS_COUNT' };
  }
  // "This spirit gets +1000 BP for each unexhausted spirit your opponent controls until end of turn"
  m = text.match(/this\s+spirit\s+(?:gets|gains)\s+\+(\d+)\s*bp\s+for\s+each\s+unexhausted\s+spirit/i);
  if (m) {
    return { op: 'BP_BUFF', amount: parseInt(m[1], 10), target: 'SELF', forEach: 'OPP_UNEXHAUSTED_SPIRIT_COUNT' };
  }
  // "give a Spirit gets +4000 BP" / "give a Spirit +4000 BP"
  m = text.match(/give\s+a\s+spirit\s+(?:gets\s+)?\+(\d+)\s*bp/i);
  if (m) {
    return { op: 'BP_BUFF', amount: parseInt(m[1], 10), target: { types: ['Spirit'] } };
  }

  // 35. EXPANDED EXHAUST / REFRESH
  // "Exhaust up to two Spirits"
  m = text.match(/exhaust\s+up\s+to\s+(a|an|one|two|three|\d+)\s+spirits/i);
  if (m) {
    return { op: 'EXHAUST', count: parseNumber(m[1]), upTo: true, target: { side: 'either', types: ['Spirit'] } };
  }
  // "Refresh all exhausted Spirits you control" / "Refresh all Spirits you control"
  if (/refresh\s+all\s+(?:exhausted\s+)?spirits\s+you\s+control/i.test(text)) {
    return { op: 'REFRESH', all: true, target: { side: 'self', types: ['Spirit'] } };
  }
  // "Refresh all Cost 2 Spirits"
  m = text.match(/refresh\s+all\s+cost\s+(\d+)\s+spirits/i);
  if (m) {
    return { op: 'REFRESH', all: true, target: { types: ['Spirit'], cost: parseInt(m[1], 10) } };
  }
  // "Refresh target exhausted spirit you control with High Speed"
  if (/refresh target exhausted spirit you control with high speed/i.test(text)) {
    return { op: 'REFRESH', count: 1, target: { side: 'self', types: ['Spirit'], state: 'exhausted', hasKeyword: 'High Speed' } };
  }
  // "Refresh a Yellow Spirit you control"
  m = text.match(/refresh\s+a\s+(red|purple|green|white|yellow|blue)\s+spirit\s+you\s+control/i);
  if (m) {
    return { op: 'REFRESH', count: 1, target: { side: 'self', types: ['Spirit'], color: capitalize(m[1]) } };
  }
  // "This spirit cannot be refreshed"
  if (/this\s+spirit\s+cannot\s+be\s+refreshed/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_REFRESH', target: 'SELF' };
  }
  // "When the opponent declares block, exhaust a Spirit except the one blocking this Spirit"
  if (/exhaust a spirit except the one blocking this spirit/i.test(text)) {
    return { op: 'EXHAUST', count: 1, target: { side: 'opp', types: ['Spirit'], excludeBlocking: true } };
  }

  // 36. EXPANDED COMBAT RULES & RESTRICTIONS
  // "If this Spirit can attack, it must attack" / "That Spirit must attack this turn"
  if (/if this spirit can attack, it must attack|that spirit must attack this turn/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'MUST_ATTACK', target: 'SELF' };
  }
  // "The opponents must block your first attack this turn"
  if (/the opponents? must block your first attack this turn/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'MUST_BLOCK_FIRST_ATTACK', side: 'opp' };
  }
  // "You can target an opposing exhausted Spirit and attack it" / "spirits you control may attack exhausted spirits"
  if (/target an opposing exhausted spirit and attack it|attack exhausted spirits your opponent/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CAN_ATTACK_EXHAUSTED' };
  }
  // "This Spirit can target and attack an opposing refreshed Spirit"
  if (/target and attack an opposing refreshed spirit/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CAN_ATTACK_REFRESHED' };
  }
  // "During this turn, the targeted Spirit can't be blocked"
  if (/the targeted spirit can't be blocked/i.test(text)) {
    return { op: 'UNBLOCKABLE', target: 'TARGETED' };
  }
  // "all Cost 1 or less Spirits can't attack nor block"
  m = text.match(/all\s+cost\s+(\d+)\s+or\s+less\s+spirits\s+can't\s+attack\s+nor\s+block/i);
  if (m) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_ATTACK_NOR_BLOCK', maxCost: parseInt(m[1], 10) };
  }
  // "your Life can only be reduced by one by the attacks of opposing unblocked Spirits"
  if (/your life can only be reduced by one/i.test(text)) {
    return { op: 'DAMAGE_CAP', maxDamage: 1 };
  }
  // "If it is the opposing turn, skip the Attack Step" / "Or end it"
  if (/skip the attack step/i.test(text) || /^or end it$/i.test(text)) {
    return { op: 'END_ATTACK_STEP' };
  }
  // "refresh the blocking Spirit you control" / "refresh the attacking Spirit you control"
  if (/refresh the blocking spirit you control/i.test(text)) {
    return { op: 'REFRESH', target: 'BLOCKING_SPIRIT' };
  }
  if (/refresh the attacking spirit you control/i.test(text)) {
    return { op: 'REFRESH', target: 'ATTACKING_SPIRIT' };
  }

  // 37. EXPANDED SUMMON / DEPLOY / FREE CASTING
  // "summon a spirit card from your hand with a cost of five without paying the cost"
  m = text.match(/summon\s+a\s+spirit\s+card\s+from\s+your\s+hand\s+with\s+a\s+cost\s+of\s+(\d+|[a-z]+)\s+without\s+paying\s+the\s+cost/i);
  if (m) {
    return { op: 'SUMMON_FREE', from: 'hand', cost: parseNumber(m[1]) };
  }
  // "summon a Spirit card with the same family as this Spirit from your Hand, without paying the cost"
  if (/summon a spirit card with the same family as this spirit from your hand, without paying the cost/i.test(text)) {
    return { op: 'SUMMON_FREE', from: 'hand', matchFamily: true };
  }
  // "deploy a Purple Nexus card from your Hand, without paying the cost"
  m = text.match(/deploy\s+a\s+(red|purple|green|white|yellow|blue)\s+nexus\s+card\s+from\s+your\s+hand,\s+without\s+paying\s+the\s+cost/i);
  if (m) {
    return { op: 'DEPLOY_NEXUS', from: 'hand', color: capitalize(m[1]), free: true };
  }
  // "You can use Magic cards from your Hand/Removed Zone, without paying the cost"
  if (/use magic cards from your hand(?:\/removed zone)?, without paying the cost/i.test(text)) {
    return { op: 'CAST_MAGIC_FREE' };
  }
  // "Until the end of this battle, the opponent can't use any cards from the Hand during Flash Timing"
  if (/the opponent can't use any cards from the hand during flash timing/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'PREVENT_FLASH_HAND', side: 'opp', duration: 'THIS_BATTLE' };
  }
  // "Discard your entire Hand"
  if (/discard your entire hand/i.test(text)) {
    return { op: 'DISCARD_HAND', count: 'ALL', chooser: 'self' };
  }
  // "You draw +1 card"
  m = text.match(/you draw\s*\+(\d+)\s*cards?/i);
  if (m) {
    return { op: 'DRAW', count: parseInt(m[1], 10), chooser: 'self' };
  }

  // 38. EXPANDED PREREQUISITE COSTS
  // "By discarding one of your Bursts"
  if (/by discarding (?:one of your bursts|a burst)/i.test(text)) {
    return { op: 'DISCARD_BURST', count: 1, side: 'self', isCost: true };
  }
  // "By destroying a Spirit you control"
  if (/by destroying a spirit you control/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'self', types: ['Spirit'] }, isCost: true };
  }
  // "By returning a Spirit with [High Speed] you control to the Hand"
  if (/by returning a spirit with \[high speed\] you control to the hand/i.test(text)) {
    return { op: 'BOUNCE', count: 1, target: { side: 'self', types: ['Spirit'], hasKeyword: 'High Speed' }, isCost: true };
  }
  // "by paying the cost, activate this card's Main/Flash effect"
  if (/by paying the cost, activate this card's (main|flash) effect/i.test(text)) {
    const timing = /flash/i.test(text) ? 'FLASH' : 'MAIN';
    return { op: 'ACTIVATE_CARD_EFFECT', timing, payCost: true };
  }

  // 39. EXPANDED CONTINUOUS FIELD RULES & MODIFIERS
  // "All your Cost 2 Spirits are treated as "Arcana"-named"
  m = text.match(/all\s+your\s+cost\s+(\d+)\s+spirits\s+are\s+treated\s+as\s+["“]([^"”]+)["”]-named/i);
  if (m) {
    return { op: 'TREAT_NAME', cost: parseInt(m[1], 10), treatedAsName: m[2] };
  }
  // "all "..." you control are unaffected by ..."
  if (/unaffected by the effects of spells your opponent controls/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'SPELL_IMMUNITY' };
  }
  // "every Spirit of the chosen color is treated as being at its highest Level"
  if (/treated as being at its highest level/i.test(text)) {
    return { op: 'TREAT_AS_MAX_LEVEL' };
  }
  // "While you control two or less Spirits, this Spirit is treated as being at LV3"
  m = text.match(/treated as being at lv(\d+)/i);
  if (m) {
    return { op: 'TREAT_LEVEL', level: parseInt(m[1], 10) };
  }
  // "When you draw via Spirit/Magic effects, double the total number of the cards you would draw"
  if (/double the total number of the cards you would draw/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'DOUBLE_DRAW' };
  }
  // "When a Spirit is destroyed, send the cores on that Spirit to its owner's Trash, instead of the Reserve"
  if (/send the cores on that spirit to its owner's trash, instead of the reserve/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'DESTROYED_CORES_TO_TRASH' };
  }
  // "This Spirit is also treated as a White Spirit"
  m = text.match(/this\s+spirit\s+is\s+also\s+treated\s+as\s+a\s+(red|purple|green|white|yellow|blue)\s+spirit/i);
  if (m) {
    return { op: 'ADD_COLOR', color: capitalize(m[1]) };
  }
  // "Treat this Spirit as a Spirit with no printed effects"
  if (/treat this spirit as a spirit with no printed effects/i.test(text)) {
    return { op: 'TREAT_AS_VANILLA' };
  }
  // "While you have a Burst set, this Spirit card in (your )?Hand becomes Cost 7"
  m = text.match(/this spirit card in (?:your )?hand becomes cost\s+(\d+)/i);
  if (m) {
    return { op: 'SET_HAND_COST', cost: parseInt(m[1], 10) };
  }
  // "The opponent can't use Magic cards"
  if (/the opponent can't use magic cards/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'PREVENT_MAGIC', side: 'opp' };
  }
  // "If there is any Nexus card among them, choose one and add it to the Hand"
  if (/if there is any nexus card among them, choose one and add it to the hand/i.test(text)) {
    return { op: 'ADD_TO_HAND', count: 1, filter: { type: 'Nexus' } };
  }

  // 40. EXPANDED CONTINUOUS RULES & RESTRICTIONS (Phase 1-5 Foundations)
  if (/all \(when blocks\) effects of spirits activate as \(when attacks\) effects/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'BLOCK_EFFECTS_ACTIVATE_ON_ATTACK' };
  }
  if (/besides via spirit\/nexus\/magic effects, when cores are put onto this spirit/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CORE_STEP_ATTACK_RESTRICTION' };
  }
  if (/when cores would be put onto this spirit.*puts \+1 core/i.test(text) || /each time 1 or more cores are put on this spirit.*increase the number by 1/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'EXTRA_CORE_ON_PUT' };
  }
  if (/each time 1 or more cores are moved from a spirit to its owner's reserve.*increase that number by 1/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'EXTRA_CORE_ON_REMOVE' };
  }
  if (/all nexuses can't be destroyed/i.test(text) || /your \w+ nexuses can't be destroyed/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'NEXUS_INDESTRUCTIBLE' };
  }
  if (/^a\s+spirit\s+you\s+control\s+can['’]?t\s+be\s+destroyed$/i.test(text)) {
    return { op: 'INDESTRUCTIBLE', target: { side: 'self', types: ['Spirit'] } };
  }
  if (/spirits with only one core on them can't attack\/block/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'ONE_CORE_CANNOT_ATTACK_BLOCK' };
  }
  if (/after attack declaration, a core must be sent from the spirit that attacks to the trash/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'ATTACK_COST_CORE_TO_TRASH' };
  }
  if (/this spirit can't be returned to the hand/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CANNOT_BE_BOUNCED', target: 'SELF' };
  }
  if (/when this spirit blocks.*it doesn't exhaust/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'DOESNT_EXHAUST_ON_BLOCK', target: 'SELF' };
  }
  if (/this spirit can block.*while exhausted/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CAN_BLOCK_WHILE_EXHAUSTED', target: 'SELF' };
  }
  if (/the \(when summoned\) and \(when destroyed\) effects of opposing.*can't activate/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'PREVENT_WHEN_SUMMONED_AND_DESTROYED' };
  }
  if (/unless via spirit\/nexus\/magic effects, when the number of cores on spirits is increased, exhaust them/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CORE_INCREASE_EXHAUST' };
  }
  if (/when this spirit's attack reduces the opposing life, send the core.*to the void/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'LIFE_DAMAGE_TO_VOID' };
  }
  if (/when the opponent would use a magic effect, they must pay/i.test(text)) {
    return { op: 'COST_MODIFIER', target: 'OPP_MAGIC' };
  }
  if (/the opponent can't use magic effects of the same color as the magic cards in their trash/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'PREVENT_MAGIC_MATCHING_TRASH_COLOR', side: 'opp' };
  }

  // 41. EXPANDED MASS CORE & BOARD MANIPULATION
  if (/send all cores from the opposing reserve to their trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { zone: 'reserve', side: 'opp' }, to: { zone: 'trash', side: 'opp' } };
  }
  if (/send every core from your trash to a spirit you control/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { zone: 'trash', side: 'self' }, to: { zone: 'field', side: 'self', types: ['Spirit'] } };
  }
  if (/send every core from all opposing nexuses to their trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { zone: 'field', side: 'opp', types: ['Nexus'] }, to: { zone: 'trash', side: 'opp' } };
  }
  if (/at the start of the step, send all cores from the trash to your reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { zone: 'trash', side: 'self' }, to: { zone: 'reserve', side: 'self' } };
  }
  if (/leaving only one core each on every spirit|send all other cores from them to their owner's reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL_BUT_ONE', from: { zone: 'field', types: ['Spirit'] }, to: { zone: 'reserve' } };
  }
  if (/besides this spirit, send a core each from every spirit to the owner's reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'field', types: ['Spirit'], excludeSelf: true }, to: { zone: 'reserve' } };
  }
  if (/send cores from a spirit to its owner's reserve until only one core left/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL_BUT_ONE', from: { zone: 'field', types: ['Spirit'] }, to: { zone: 'reserve' } };
  }
  if (/gain 1 core on this spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'void' }, to: { zone: 'field', target: 'SELF' } };
  }
  if (/you gain \+1 core/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }
  if (/send a core from a spirit to its owner's reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'field', types: ['Spirit'] }, to: { zone: 'reserve' } };
  }
  if (/if this spirit is blocked, you may move 1 core from the blocking spirit to its owner's reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { target: 'BLOCKING_SPIRIT' }, to: { zone: 'reserve' }, isOptional: true };
  }
  if (/send two cores among them to the void/i.test(text) || /send six cores among them to the void/i.test(text)) {
    const num = /six/i.test(text) ? 6 : 2;
    return { op: 'MOVE_CORE', count: num, from: { side: 'opp' }, to: { zone: 'void' }, chooser: 'opp' };
  }
  if (/send a core from any opposing nexus\/the opposing reserve to their trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { side: 'opp', zone: 'nexus_or_reserve' }, to: { zone: 'trash', side: 'opp' } };
  }
  if (/both players send a total of four cores from spirits they control to the owner's trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 4, from: { side: 'both', zone: 'field', types: ['Spirit'] }, to: { zone: 'trash' } };
  }
  if (/when this spirit would refresh, send (?:a|one|two|\d+) cores? from/i.test(text)) {
    const num = /two/i.test(text) ? 2 : 1;
    return { op: 'MOVE_CORE', count: num, from: { side: 'opp', zone: 'field_or_nexus' }, to: { zone: 'trash', side: 'opp' } };
  }
  if (/when the opponent declares to block this spirit, you can send up to two cores from the blocking spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 2, upTo: true, from: { target: 'BLOCKING_SPIRIT' }, to: { zone: 'reserve', side: 'opp' } };
  }
  if (/gain cores in your reserve equal to the number of cores that were on this spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'CORES_ON_DESTROYED_SPIRIT', from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }
  if (/the opponent sends (?:a|an|one|two|three|four|\d+)\s+cores? from (?:any|a)?\s*spirits? they control to their reserve/i.test(text)) {
    const oppCores = text.match(/sends (a|an|one|two|three|four|\d+)\s+cores?/i);
    return { op: 'MOVE_CORE', count: oppCores ? parseNumber(oppCores[1]) : 1, from: { side: 'opp', zone: 'field', types: ['Spirit'] }, to: { zone: 'reserve', side: 'opp' }, chooser: 'opp' };
  }
  if (/(?:also,?\s*)?send\s+cores?\s+equal\s+to\s+the\s+level\s+of\s+the\s+destroyed\s+opposing\s+spirit\s+from\s+it\s+to\s+the\s+void/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'LEVEL_OF_DESTROYED_SPIRIT', from: { zone: 'field' }, to: { zone: 'void' } };
  }

  // 42. EXPANDED BOARD DESTROY & SALVAGE
  if (/each player chooses and destroys a nexus they control/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'both', types: ['Nexus'] } };
  }
  if (/this effect can't be used unless each player controls at least one nexus/i.test(text)) {
    return { op: 'PLAY_CONDITION', condition: 'BOTH_PLAYERS_CONTROL_NEXUS' };
  }
  if (/at the end of battle, destroy this spirit/i.test(text)) {
    return { op: 'DESTROY', target: 'SELF', timing: 'END_OF_BATTLE' };
  }
  if (/destroy a spirit you control/i.test(text) || /destroy a cost \d+ or less you control/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'self', types: ['Spirit'] } };
  }
  if (/destroy all the other spirits/i.test(text) || /each player destroys all of their spirits except the ones with the selected color/i.test(text)) {
    return { op: 'DESTROY', all: true, target: { types: ['Spirit'], excludeMatches: true } };
  }
  if (/destroy every nexus without that color/i.test(text)) {
    return { op: 'DESTROY', all: true, target: { types: ['Nexus'], excludeMatches: true } };
  }
  if (/destroy opposing cost 0\/1\/2\/3\/4 spirits, one of each/i.test(text)) {
    return { op: 'DESTROY', target: { side: 'opp', types: ['Spirit'], costRange: [0, 1, 2, 3, 4] } };
  }
  if (/return a spirit card from your trash to the hand/i.test(text)) {
    return { op: 'SALVAGE', cardType: 'Spirit', count: 1 };
  }
  if (/return a magic card from your trash to the hand/i.test(text)) {
    return { op: 'SALVAGE', cardType: 'Magic', count: 1 };
  }

  // 43. EXPANDED BP BUFFS & SCALING
  if (/all attacking spirits you control gain \+\d+ bp/i.test(text) || /every attacking spirit you control gains \+\d+ bp/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'BP_BUFF', amount: bp, target: { side: 'self', state: 'attacking' }, all: true };
  }
  if (/for each exhausted spirit you control, (?:all )?(?:attacking(?:\/| and )blocking|your attacking and blocking) spirits gain \+\d+ bp/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'BP_BUFF', amount: bp, target: { side: 'self', state: 'attacking_or_blocking' }, forEach: 'EXHAUSTED_SPIRIT_COUNT' };
  }
  if (/each time you summon a spirit it gets \+\d+bp until end of turn/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'TRIGGERED_BUFF', trigger: 'ON_SUMMON', amount: bp, duration: 'UNTIL_END_OF_TURN' };
  }
  if (/all your spirits with three or more cores on them get \+\d+ bp/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'BP_BUFF', amount: bp, target: { side: 'self', minCores: 3 }, all: true };
  }
  if (/all your spirits with \[(?:awaken|assault)\] gain \+\d+ bp/i.test(text)) {
    const kw = /assault/i.test(text) ? 'Assault' : 'Awaken';
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'BP_BUFF', amount: bp, target: { side: 'self', hasKeyword: kw }, all: true };
  }
  if (/give this spirit \+ \(exhausted spirit's bp\) bp/i.test(text)) {
    return { op: 'BP_BUFF', amount: 'EXHAUSTED_SPIRIT_BP', target: 'SELF' };
  }
  if (/each time this spirit gets an addition to its bp.*gets an addition(?:al)? \+\d+bp/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'TRIGGERED_BUFF', trigger: 'ON_BP_ADDITION', amount: bp };
  }

  // 44. EXPANDED EXHAUST & BATTLE RESOLUTION
  if (/exhaust all unexhausted spirits with the selected color/i.test(text)) {
    return { op: 'EXHAUST', all: true, target: { types: ['Spirit'], selectedColor: true, state: 'unexhausted' } };
  }
  if (/when only the opposing spirit is destroyed by comparing bp, exhaust every spirit with the same lv/i.test(text)) {
    return { op: 'EXHAUST', target: { matchDestroyedLevel: true, types: ['Spirit'] } };
  }
  if (/exhaust every cost \d+ or less spirit/i.test(text)) {
    const c = parseInt(text.match(/cost\s+(\d+)/i)[1], 10);
    return { op: 'EXHAUST', all: true, target: { types: ['Spirit'], maxCost: c } };
  }
  if (/exhaust every spirit with the same cost as the opposing attacking spirit/i.test(text)) {
    return { op: 'EXHAUST', all: true, target: { types: ['Spirit'], matchAttackingCost: true } };
  }
  if (/when the battle resolves, instead of comparing bp, compare the levels of the spirits/i.test(text)) {
    return { op: 'COMPARE_LV_INSTEAD_OF_BP' };
  }
  if (/treat the attack as not having been blocked/i.test(text)) {
    return { op: 'UNBLOCKABLE', target: 'ATTACKING_SPIRIT' };
  }
  if (/the attack of your spirit with \[tribute\] can't be blocked by opposing spirits with a level equal or inferior/i.test(text)) {
    return { op: 'UNBLOCKABLE', condition: 'LEVEL_LTE' };
  }

  // 45. EXPANDED SUMMON, DEPLOY & MAGIC RULES
  if (/summon a spirit card from your hand with a cost equal or inferior to the number of cores in your trash/i.test(text)) {
    return { op: 'SUMMON_FREE', from: 'hand', maxCost: 'TRASH_CORES_COUNT' };
  }
  if (/you can summon any number of \"[^\"]+\" family spirit cards from your hand/i.test(text)) {
    return { op: 'SUMMON_MULTI', from: 'hand' };
  }
  if (/you may deploy target (?:white or green|\w+) nexus card from your trash without paying its cost/i.test(text) || /you can deploy a nexus card from your trash, without paying the cost/i.test(text)) {
    return { op: 'DEPLOY_NEXUS', from: 'trash', free: true };
  }
  if (/during this turn, give a spirit you control: \"\[awaken\]/i.test(text) || /give all your \"[^\"]+\" family spirits: \"\[awaken\]/i.test(text) || /give every spirit with \[awaken\] you control: \[clash\]/i.test(text) || /during this turn, give a spirit you control the effect: \"\[curse\]/i.test(text)) {
    return { op: 'GRANT_ABILITY' };
  }
  if (/give all your cost \d+ \w+ spirits the \"[^\"]+\" family/i.test(text) || /give \"song bird\" family spirits.*a family you like/i.test(text)) {
    return { op: 'GRANT_FAMILY' };
  }
  if (/activate a \(when summoned\) effect of a spirit you control/i.test(text)) {
    return { op: 'ACTIVATE_TRIGGER', trigger: 'WHEN_SUMMONED' };
  }
  if (/look at the entire opposing hand/i.test(text)) {
    return { op: 'LOOK_HAND', side: 'opp' };
  }
  if (/randomly discard \d+ card from your opponent's hand/i.test(text)) {
    return { op: 'DISCARD_HAND', count: 1, side: 'opp', random: true, chooser: 'self' };
  }
  if (/by putting any number of magic cards from your hand onto the removed zone/i.test(text)) {
    return { op: 'MOVE_CARD', from: 'hand', to: 'removed_zone', count: 'ANY', cardType: 'Magic', isCost: true };
  }
  if (/by exhausting one of your \"[^\"]+\" family spirits/i.test(text)) {
    return { op: 'EXHAUST', count: 1, target: { side: 'self', types: ['Spirit'] }, isCost: true };
  }
  if (/when your nexuses are destroyed, by sending a core from your field\/reserve to your trash/i.test(text)) {
    return {
      op: 'REPLACEMENT_EFFECT',
      trigger: 'NEXUS_DESTROYED',
      replaces: 'NEXUS_DESTRUCTION',
      replacementZone: 'field',
      side: 'self',
      cost: { op: 'MOVE_CORE', count: 1, from: 'field_or_reserve', to: 'trash', side: 'self' }
    };
  }
  if (/when the opponents? uses? a magic effect, you can negate that effect/i.test(text) || /each time your opponent plays a spell, negate that effect/i.test(text)) {
    return { op: 'NEGATE_MAGIC' };
  }
  if (/choose either the \"[^\"]+\" or the \"[^\"]+\" family/i.test(text)) {
    return { op: 'CHOOSE_FAMILY' };
  }
  if (/during this turn, all your spirits are also treated as cost \d+ spirits/i.test(text)) {
    return { op: 'TREAT_COST' };
  }
  if (/give all your magic cards \[\w+ core\] reduction symbol/i.test(text) || /give every nexus card in your hand reduction symbols/i.test(text)) {
    return { op: 'SYMBOL_MODIFIER' };
  }
  if (/you can treat every nexus you control as lv\d+/i.test(text)) {
    return { op: 'TREAT_LEVEL', types: ['Nexus'] };
  }
  if (/move an opposing cost \d+ spirit to your field in the same state it is in/i.test(text)) {
    return { op: 'TAKE_CONTROL' };
  }
  if (/when this spirit blocks an opposing cost \d+ or less spirit.*end the attack step/i.test(text)) {
    return { op: 'END_ATTACK_STEP' };
  }
  if (/when this spirit becomes the target of \[tribute\]/i.test(text)) {
    return { op: 'TRIGGERED_ACTION', trigger: 'ON_TRIBUTE_TARGET' };
  }

  // 46. FINAL PHASE 1 FOUNDATIONAL GRAMMAR RECOGNIZERS
  // "it must attack", "that spirit must attack"
  if (/^(?:it|that spirit|this spirit) must attack/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'MUST_ATTACK', target: 'SELF' };
  }
  // "By sending one/a/two cores from your Reserve/Nexus to your Trash/Void"
  if (/by sending\s+(?:a|an|one|two|three|\d+|all)\s+cores?\s+from/i.test(text)) {
    return { op: 'MOVE_CORE', isCost: true };
  }
  // "choose one and add it to the Hand" / "choose a card and add it to the Hand"
  if (/choose (?:one|a card) and add it to the hand/i.test(text)) {
    return { op: 'ADD_TO_HAND', count: 1 };
  }
  // "send any number of cores from this Spirit to other Spirits/Nexuses you control"
  if (/send (?:any number of|\d+) cores from this spirit to (?:other )?spirits/i.test(text)) {
    return { op: 'MOVE_CORE', target: 'OTHER_SPIRITS' };
  }
  // "all attacking/blocking Spirits you control gain +1000 BP"
  if (/(?:all|your) attacking(?:\/| and )blocking spirits.*gain \+\d+ bp/i.test(text)) {
    const bp = parseInt(text.match(/\+(\d+)\s*bp/i)[1], 10);
    return { op: 'BP_BUFF', amount: bp, target: { side: 'self', state: 'attacking_or_blocking' } };
  }
  // "give a Spirit an additional color"
  if (/give a spirit an additional color/i.test(text)) {
    return { op: 'ADD_COLOR' };
  }
  // "move 1 core from the blocking spirit to its owner's reserve"
  if (/move\s+(\d+|[a-z]+)\s+cores? from the blocking spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { target: 'BLOCKING_SPIRIT' }, to: { zone: 'reserve' } };
  }
  // "the opponent sends two cores among them to the Void"
  if (/opponent sends\s+(two|\d+)\s+cores among them to the void/i.test(text)) {
    return { op: 'MOVE_CORE', count: 2, from: { side: 'opp' }, to: { zone: 'void' }, chooser: 'opp' };
  }
  // "it returns to the field, refreshed" / "it can return to your Field, refreshed"
  if (/returns? to (?:the|your) field, refreshed/i.test(text)) {
    return { op: 'RESURRECT', state: 'refreshed' };
  }
  // "any (When Summoned) effects of the Spirit summoned by this effect can't activate" / "do not activate"
  if (/any \(when summoned\) effects.*(?:can't|do not) activate/i.test(text)) {
    return { op: 'PREVENT_WHEN_SUMMONED' };
  }
  // "If the opponent controls two or more Spirits with the same name, leaving off one Spirit for each different name"
  if (/leaving off one spirit for each different name/i.test(text)) {
    return { op: 'TARGET_SELECT', filter: { duplicateNames: true } };
  }
  // "give all your Magic cards [Yellow Core][Yellow Core] reduction symbols"
  if (/give all your magic cards.*reduction symbols?/i.test(text)) {
    return { op: 'SYMBOL_MODIFIER', target: 'MAGIC_HAND' };
  }
  // "send seven cores from any opposing Spirits to their Reserve"
  if (/send (seven|\d+) cores from any opposing spirits to their reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 7, from: { side: 'opp', types: ['Spirit'] }, to: { zone: 'reserve', side: 'opp' } };
  }
  // "Select an exhausted spirit your opponent controls"
  if (/select an exhausted spirit/i.test(text)) {
    return { op: 'TARGET_SELECT', target: { side: 'opp', types: ['Spirit'], state: 'exhausted' } };
  }
  // "In that case, while this spirit is exhausted, that spirit cannot be refreshed"
  if (/that spirit cannot be refreshed/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_REFRESH', target: 'TARGETED' };
  }
  // "add every Magic card among them to your Hand" / "Add a Magic card among them to the Hand"
  if (/add (?:every|a|all) magic cards? among them to (?:the|your) hand/i.test(text)) {
    return { op: 'SALVAGE', cardType: 'Magic' };
  }
  // "Send all cores from this Spirit to the targeted Spirit you control instead of the Reserve"
  if (/send all cores from this spirit to the targeted spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { target: 'SELF' }, to: { target: 'TARGETED' } };
  }
  // "Give every 'Parasite' family Spirit card in your Hand the effect: '[High Speed] ...'"
  if (/give every.*spirit card in your hand the effect/i.test(text)) {
    return { op: 'GRANT_ABILITY', target: 'HAND_SPIRITS' };
  }
  // "Both the cost and the cores to be put onto this Spirit must be from the Reserve"
  if (/both the cost and the cores to be put onto this spirit must be from the reserve/i.test(text)) {
    return { op: 'KEYWORD_ACTION', keyword: 'High Speed' };
  }
  // "Each player selects 1 color among the spirits they control"
  if (/each player selects 1 color/i.test(text)) {
    return { op: 'CHOOSE_COLOR', chooser: 'both' };
  }
  // "that spirit may remain on your Field exhausted instead"
  if (/remain on your field exhausted instead/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD_EXHAUSTED' };
  }
  // "remove 2 cores from this nexus"
  if (/remove\s+(\d+)\s+cores from this nexus/i.test(text)) {
    return { op: 'MOVE_CORE', count: 2, from: { target: 'SELF' }, to: { zone: 'reserve', side: 'self' }, isCost: true };
  }
  // "This effect can be applied only once per turn" / "This effect can only be used once per turn"
  if (/this effect can (?:only )?be (?:used|applied) only once per turn/i.test(text)) {
    return { op: 'LIMIT_ONCE_PER_TURN' };
  }
  // "Every LV3 Spirit you control can target and attack an opposing exhausted Spirit"
  if (/can target and attack an opposing exhausted spirit/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CAN_ATTACK_EXHAUSTED' };
  }
  // "you may move 2 cores from your Trash to this spirit"
  if (/move\s+(\d+)\s+cores from your trash to this spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 2, from: { zone: 'trash', side: 'self' }, to: { target: 'SELF' } };
  }
  // "send a core from the opposing Life to the Reserve" / "send an extra core from the opposing Life to the Reserve"
  if (/send (?:a|an extra|\d+) cores? from the opposing life to the reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'life', side: 'opp' }, to: { zone: 'reserve', side: 'opp' } };
  }
  // "You can use the Spirit you moved during this turn as your Spirit"
  if (/use the spirit you moved during this turn as your spirit/i.test(text)) {
    return { op: 'TAKE_CONTROL', duration: 'THIS_TURN' };
  }
  // "When you do, the cores on the moved Spirit are treated as that owned by its owner..."
  if (/cores on the moved spirit are treated as that owned by its owner/i.test(text)) {
    return { op: 'CONTROL_RULE' };
  }
  // "When the turn ends, return that Spirit to the opposing Field in exhausted state"
  if (/return that spirit to the opposing field in exhausted state/i.test(text)) {
    return { op: 'RETURN_CONTROL', state: 'exhausted' };
  }
  // "each player targets a color of Nexuses on their Field"
  if (/each player targets a color of nexuses/i.test(text)) {
    return { op: 'CHOOSE_COLOR', chooser: 'both', targetType: 'Nexus' };
  }
  // "summon a Green Spirit card from your Hand, without paying the cost"
  if (/summon a (red|purple|green|white|yellow|blue) spirit card from your hand, without paying the cost/i.test(text)) {
    return { op: 'SUMMON_FREE', from: 'hand', color: capitalize(text.match(/(red|purple|green|white|yellow|blue)/i)[1]) };
  }
  // "Refresh every Spirit with [Awaken] you control"
  if (/refresh every spirit with \[\w+\] you control/i.test(text)) {
    return { op: 'REFRESH', all: true, target: { side: 'self' } };
  }
  // "You can change the target of Magic effects that target both players..."
  if (/change the target of magic effects/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'CHANGE_MAGIC_TARGET' };
  }
  // "Exhaust every LV2 Spirit"
  if (/exhaust every lv(\d+) spirit/i.test(text)) {
    return { op: 'EXHAUST', all: true, target: { level: parseInt(text.match(/lv(\d+)/i)[1], 10) } };
  }
  // "put a number of cores from the Void to your Reserve equals to the number of cores on that destroyed opposing Spirit"
  if (/equals to the number of cores on that destroyed opposing spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'DESTROYED_SPIRIT_CORES', from: { zone: 'void' }, to: { zone: 'reserve', side: 'self' } };
  }
  // "The number of cores on target nexus you control is treated as the same as the number of cores on this spirit"
  if (/treated as the same as the number of cores on this spirit/i.test(text)) {
    return { op: 'TREAT_CORE_COUNT' };
  }
  // "Spirits you control lose and cannot gain Immunity: X until end of turn"
  if (/lose and cannot gain immunity/i.test(text)) {
    return { op: 'LOSE_IMMUNITY' };
  }
  // "If that card is a Red Spirit card, add it to your Hand" / "if it has [Tribute], add it to the Hand"
  if (/if (?:that card|it) (?:is a \w+ spirit card|has \[tribute\]), add it to (?:the|your) hand/i.test(text)) {
    return { op: 'ADD_TO_HAND' };
  }
  // "You can send any number of cores from Spirits you control to this Spirit"
  if (/send any number of cores from spirits you control to this spirit/i.test(text)) {
    return { op: 'AWAKEN_CORE_MOVE' };
  }
  // "This effect can't bring the number of cores on opposing Spirits to 0"
  if (/can't bring the number of cores on opposing spirits to 0/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'MIN_CORES_ONE', minCoresRemaining: 1 };
  }
  // "the opponent sends a core from Spirits they control to the Void"
  if (/opponent sends a core from spirits they control to the void/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { side: 'opp', types: ['Spirit'] }, to: { zone: 'void' }, chooser: 'opp' };
  }
  // "give one of your Spirits +1000 BP for each of your Spirits in the same family as the targeted Spirit"
  if (/give one of your spirits \+\d+ bp for each/i.test(text)) {
    return { op: 'BP_BUFF', forEach: 'SAME_FAMILY_COUNT' };
  }
  // "Every opposing Spirit that is blocking your Spirits with [Brilliance] is treated as LV1"
  if (/treated as lv1/i.test(text)) {
    return { op: 'TREAT_LEVEL', level: 1 };
  }
  // "discard a Magic card among them"
  if (/discard a magic card among them/i.test(text)) {
    return { op: 'DISCARD_HAND', cardType: 'Magic' };
  }
  // "When the opponent would summon a Cost 3 or less Spirit card without [Tribute], they must pay one extra cost"
  if (/they must pay one extra cost/i.test(text)) {
    return { op: 'COST_MODIFIER', amount: 1, side: 'opp' };
  }
  // "the cost of all your Spirits with the same family as that Spirit card increases by +3"
  if (/increases by \+\d+/i.test(text)) {
    return { op: 'COST_MODIFIER', amount: 3 };
  }
  // "discard a card from your decktop"
  if (/discard a card from your decktop/i.test(text)) {
    return { op: 'MILL_DECK', count: 1, side: 'self' };
  }
  // "If that card is a Spirit card, your Life won't be reduced"
  if (/your life won't be reduced/i.test(text)) {
    return { op: 'PREVENT_LIFE_LOSS' };
  }

  // "At the End Step, send four of your cores to the Void."
  if (/send (?:four|\d+) of your cores to the void/i.test(text)) {
    return { op: 'MOVE_CORE', count: 4, from: { zone: 'field_or_reserve', side: 'self' }, to: { zone: 'void' } };
  }
  // "give a Spirit you control: [Awaken]" / "give a Spirit you control the effect: [Curse]"
  if (/give a spirit you control(?:\s+the\s+effect)?:\s*["“]?\[(?:awaken|curse)\]/i.test(text)) {
    return { op: 'GRANT_ABILITY' };
  }
  // "Each time another green spirit you control gets an addition to its BP..."
  if (/each time another.*spirit.*gets an addition to its bp/i.test(text)) {
    return { op: 'TRIGGERED_BUFF', trigger: 'ON_BP_ADDITION' };
  }
  // "add it to the Hand" / "add it to your Hand"
  if (/^add it to (?:the|your) hand$/i.test(text) || /add it to (?:the|your) hand/i.test(text)) {
    return { op: 'ADD_TO_HAND' };
  }

  // 47. COMPREHENSIVE PHASES 2-5 (2009-2012) GRAMMAR EXPANSION
  // A. BP Buff / Debuff
  if (/\+\d+(?:000)?\s*bp\b/i.test(text) || /(?:gain|get)s?\s+\+\d+/i.test(text) || /gains?\s+\+\s*\(/i.test(text) || /bp.*is treated as/i.test(text) || /increase.*bp/i.test(text) || /decrease.*bp/i.test(text) || /bp-\s*effect/i.test(text)) {
    const bpMatch = text.match(/\+(\d+)(?:000)?\s*bp/i) || text.match(/\+(\d+)/);
    const amount = bpMatch ? (parseInt(bpMatch[1], 10) >= 1000 ? parseInt(bpMatch[1], 10) : parseInt(bpMatch[1], 10) * 1000) : 1000;
    return { op: 'BP_BUFF', amount, target: { side: 'either' } };
  }
  if (/\-\d+(?:000)?\s*bp\b/i.test(text) || /(?:lose|lower)s?\s+\d+000\s*bp/i.test(text)) {
    const bpMatch = text.match(/\-(\d+)(?:000)?\s*bp/i);
    const amount = bpMatch ? (parseInt(bpMatch[1], 10) >= 1000 ? parseInt(bpMatch[1], 10) : parseInt(bpMatch[1], 10) * 1000) : 1000;
    return { op: 'BP_DEBUFF', amount };
  }

  // B. Core Movement & Core Placement
  if (/put(?:ting)?\s+.*cores?\s+from/i.test(text) ||
      /send(?:ing)?\s+.*cores?\s+from/i.test(text) ||
      /move(?:ing)?\s+.*cores?\s+from/i.test(text) ||
      /cores?\s+to\s+your\s+trash/i.test(text) ||
      /send(?:ing)?\s+.*cores?\s+to/i.test(text) ||
      /move(?:ing)?\s+.*cores?\s+to/i.test(text) ||
      /send\s+(?:a|an|one|two|\d+)?\s*cores?\s+each/i.test(text) ||
      /gain\s+\d+\s+cores?\s+on/i.test(text) ||
      /put\s+\+1\s+core/i.test(text) ||
      /exchange all cores/i.test(text) ||
      /move all cores from/i.test(text) ||
      /cores cannot be moved/i.test(text) ||
      /cores to be put on this (?:spirit|brave) and the cost must be paid from the reserve/i.test(text) ||
      /each player sends\s+.*cores?/i.test(text) ||
      /put a number of cores equal to/i.test(text) ||
      /put.*cores?.*from (?:the )?void/i.test(text) ||
      /send cores until/i.test(text) ||
      /sends? cores from.*to the void/i.test(text) ||
      /put (?:four|\d+) cores instead/i.test(text) ||
      /send all cores on the destroyed spirit to the void/i.test(text) ||
      /cores of all opposing destroyed spirits are sent to the void/i.test(text) ||
      /send(?:ing)?\s+(?:an?|two|\d+)\s+opposing\s+li(?:fe|ves)\s+to/i.test(text) ||
      /send\s+as\s+many\s+cores\s+as\s+you\s+like/i.test(text) ||
      /put any number of cores from/i.test(text) ||
      /opponent sends a core/i.test(text)) {
    const isCost = /^by\s+/i.test(text);
    const res = parseCoreMovement(text);
    if (res && res.op !== 'UNSUPPORTED') {
      if (isCost) res.isCost = true;
      return res;
    }
    return { op: 'MOVE_CORE', count: 1, isCost };
  }

  // C. Destruction & Bouncing
  const zeroBpRepM = text.match(/opposing\s+cost\s+(\d+)\s+or\s+less\s+spirits?\s+that\s+are\s+destroyed\s+at\s+0\s*bp\s+are\s+returned\s+to\s+(?:the\s+)?(deckbottom|decktop|hand).*instead\s+of\s+being\s+sent\s+to\s+(?:the\s+)?trash/i);
  if (zeroBpRepM) {
    const zRaw = zeroBpRepM[2].toLowerCase();
    const repZone = zRaw.includes('bottom') ? 'deck_bottom' : (zRaw.includes('top') ? 'deck_top' : 'hand');
    return {
      op: 'REPLACEMENT_EFFECT',
      replaces: 'DESTRUCTION',
      replacementZone: repZone,
      side: 'opp',
      filter: { type: 'Spirit', maxCost: parseInt(zeroBpRepM[1], 10), zeroBp: true }
    };
  }
  const oppHandBounceM = text.match(/(?:the\s+)?opponent\s+returns?\s+(an?|one|two|three|\d+)\s+cards?\s+from\s+(?:their|the)\s+hand\s+to\s+(?:the\s+)?(deckbottom|decktop|bottom\s+of\s+(?:their|the)\s+deck|top\s+of\s+(?:their|the)\s+deck)/i);
  if (oppHandBounceM) {
    const isBottom = oppHandBounceM[2].toLowerCase().includes('bottom');
    return {
      op: 'BOUNCE',
      count: parseNumber(oppHandBounceM[1]),
      target: { side: 'opp', zone: 'hand' },
      destination: isBottom ? 'DECK_BOTTOM' : 'DECK_TOP'
    };
  }
  if (/^return\s+this\s+(?:spirit|ultimate|brave|card)\s+to\s+(?:the\s+)?(deckbottom|decktop|bottom\s+of\s+(?:your|the)\s+deck|top\s+of\s+(?:your|the)\s+deck)$/i.test(text)) {
    const isBottom = /bottom/i.test(text);
    return {
      op: 'BOUNCE',
      target: 'self',
      destination: isBottom ? 'DECK_BOTTOM' : 'DECK_TOP'
    };
  }
  if (/destroy(?:ing|s)?\b/i.test(text)) {
    return { op: 'DESTROY', count: 1, target: { side: 'either' }, isCost: /^by\s+/i.test(text) };
  }
  if (/return a nexus to its owner's hand/i.test(text) ||
      /return.*to (?:its owner's|the|your) hand/i.test(text) ||
      /move target spirit.*to its owner's hand/i.test(text) ||
      /move.*spirit.*to (?:the|its owner's) hand/i.test(text) ||
      /move all nexuses to/i.test(text) ||
      /return.*to the bottom of (?:your|their) deck/i.test(text) ||
      /return.*to your deckbottom/i.test(text) ||
      /return.*to the (?:decktop|deckbottom|bottom of (?:your|the) deck)/i.test(text) ||
      /bounce/i.test(text) ||
      /return/i.test(text)) {
    return { op: 'BOUNCE', count: 1, target: { side: 'either' } };
  }

  // D. Hand / Deck Manipulation & Salvage
  if (/(?:discard|put|send)\s+.*(?:nexus|magic|spirit|burst|card)?\s*cards?\s+from\s+(?:your\s+)?hand/i.test(text) ||
      /discard.*from.*hand/i.test(text) ||
      /opponent discards\s+\d+\s+card/i.test(text) ||
      /discard a nexus card/i.test(text) ||
      /both players discard (?:their entire )?hand/i.test(text) ||
      /discard\s+(?:a|an)?\s*(?:spirit|magic|nexus)\s+card\s+among\s+them/i.test(text)) {
    return { op: 'DISCARD_HAND', chooser: 'self', isCost: /^by\s+/i.test(text) };
  }
  if (/draw until you have/i.test(text) || /draw\s+.*cards?/i.test(text) || /draw\b/i.test(text) || /by not drawing a card/i.test(text)) {
    return { op: 'DRAW', count: 1, chooser: 'self' };
  }
  if (/increase the (?:amount|number) of cards you draw/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'EXTRA_DRAW', amount: 1 };
  }
  if (/return.*from (?:the|your) trash to (?:the|your) hand/i.test(text) ||
      /move that spell card from your trash to your hand/i.test(text) ||
      /defeated spirit is moved to your hand/i.test(text) ||
      /move target.*from your trash to your hand/i.test(text) ||
      /move \d+.*from your trash to your hand/i.test(text) ||
      /use a \w+ magic card in your trash as if it were in your hand/i.test(text)) {
    return { op: 'SALVAGE', from: 'trash', to: 'hand' };
  }
  if (/move the top card of (?:your )?opponent's deck to (?:their )?trash/i.test(text) ||
      /discard.*from.*decktop/i.test(text) ||
      /discard \+\d+ cards?/i.test(text) ||
      /discard.*opposing deck/i.test(text) ||
      /cards can't be discarded from your deck/i.test(text) ||
      /move cards from the top of your opponent's deck to their trash/i.test(text) ||
      /limit increased by \d+/i.test(text)) {
    return { op: 'MILL_DECK', side: 'opp' };
  }
  if (/discard every face-up card (?:in|on) the opposing removed zone/i.test(text) ||
      /onto the remove(?:d)? zone/i.test(text) ||
      /on your remove(?:d)? zone/i.test(text) ||
      /if not, discard it/i.test(text) ||
      /^discard it$/i.test(text) ||
      /discard the (?:other one|remaining cards?)/i.test(text) ||
      /reveal\s+(?:\d+|[a-z]+)\s+cards from (?:the opposing|your) decktop/i.test(text) ||
      /look at its content/i.test(text) ||
      /choose a random card from the opposing hand/i.test(text)) {
    return { op: 'DECK_OR_HAND_ACTION' };
  }

  // E. Deploy, Summon & Magic
  if (/deploy.*nexus/i.test(text) || /deploy\b/i.test(text)) {
    return { op: 'DEPLOY_NEXUS', free: true };
  }
  if (/summon.*from.*(?:hand|trash)/i.test(text) ||
      /summon.*spirit card/i.test(text) ||
      /you can summon one of them/i.test(text) ||
      /this spirit card.*summoned/i.test(text) ||
      /summon\b/i.test(text)) {
    return parseSummonOp(text, rawClauseText);
  }
  if (/play.*spell.*without paying/i.test(text) ||
      /use.*magic.*without paying/i.test(text) ||
      /activate this effect immediately, without paying/i.test(text) ||
      /activate this card's (?:main|flash) effect/i.test(text)) {
    return { op: 'CAST_MAGIC_FREE' };
  }

  // F. Exhaust & Refresh
  if (/remains? on (?:your|the) field,?\s*exhausted/i.test(text) || /returns? to (?:your|the) field,?\s*exhausted/i.test(text)) {
    return { op: 'RESURRECT' };
  }
  if (/cannot be exhausted/i.test(text) || /can't be exhausted/i.test(text)) {
    return { op: 'CANNOT_BE_EXHAUSTED' };
  }
  if (/cannot refresh/i.test(text) || /can't refresh/i.test(text) || /doesn't refresh/i.test(text)) {
    const opp = /opposing|opponent/i.test(text);
    return { op: 'CANNOT_REFRESH', target: { side: opp ? 'opp' : 'self' } };
  }
  if (/exhaust/i.test(text)) {
    if (/^(?:you\s+can\s+)?exhaust\s+this\s+(?:nexus|spirit|ultimate)/i.test(text.trim()) ||
        /by\s+exhausting\s+this\s+(?:nexus|spirit|ultimate)/i.test(text.trim())) {
      return { op: 'EXHAUST', target: 'self' };
    }
    let side = 'opp';
    if (/your\s+(?:spirits?|ultimates?|nexuses?)|this\s+(?:spirit|nexus|ultimate)|friendly\s+spirit/i.test(text)) side = 'self';
    else if (/both\s+players'?\s+(?:spirits?|ultimates?)|all\s+spirits/i.test(text)) side = 'both';
    let count = 1;
    if (/all\s+opposing|all\s+your|all\s+spirits|every\s+opposing/i.test(text)) count = 'ALL';
    else {
      const cMatch = text.match(/exhaust\s+(?:up\s+to\s+)?(a|an|one|two|three|four|five|\d+)/i);
      if (cMatch) count = parseNumber(cMatch[1]);
    }
    const target = { side, types: /ultimate/i.test(text) ? ['Spirit', 'Ultimate'] : (/nexus/i.test(text) ? ['Nexus'] : ['Spirit']) };
    if (/this\s+(?:spirit|nexus|ultimate)/i.test(text)) target.card = 'SELF';
    return { op: 'EXHAUST', count, target };
  }
  if (/refresh/i.test(text)) {
    let side = 'self';
    if (/opposing\s+(?:spirits?|ultimates?|nexuses?)|opponent's\s+spirits?/i.test(text)) side = 'opp';
    else if (/both\s+players'?\s+(?:spirits?|ultimates?)|all\s+spirits/i.test(text)) side = 'both';
    let count = 1;
    if (/all\s+opposing|all\s+your|all\s+spirits|every\s+friendly/i.test(text)) count = 'ALL';
    else {
      const cMatch = text.match(/refresh\s+(?:up\s+to\s+)?(a|an|one|two|three|four|five|\d+)/i);
      if (cMatch) count = parseNumber(cMatch[1]);
    }
    const target = { side, types: /ultimate/i.test(text) ? ['Spirit', 'Ultimate'] : (/nexus/i.test(text) ? ['Nexus'] : ['Spirit']) };
    if (/this\s+spirit/i.test(text) || /^refresh$/i.test(text.trim())) target.card = 'SELF';
    return { op: 'REFRESH', count, target };
  }

  // F.5 High-precision rules that mention bracketed keywords (must precede generic [Keyword] fallback)
  if (/can\s+only\s+be\s+prevented\s+by|cannot\s+be\s+prevented\s+except\s+by/i.test(text)) {
    return { op: 'PIERCING_RULE' };
  }
  if (/can\s+\[(?:Ultra\s+)?Contract\s+Advent\]\s+from\s+(?:the\s+)?(?:Removed\s+Zone|Trash)/i.test(text)) {
    return { op: 'ADVENT_RULE_MODIFIER' };
  }
  if (/placing\s+(?:up\s+to\s+)?(?:one|two|three|\d+)\s+cards?\s+from\s+your\s+decktop\s+onto\s+the\s+Field\s+facedown\s+and\s+putting/i.test(text)) {
    return { op: 'BUNSHIN_SUMMON', upTo: /up\s+to/i.test(text), facedown: true };
  }
  if (/Main\s+Step\s+doesn['’]t\s+occur\s+for/i.test(text)) {
    const rSide = /opponent|opposing/i.test(text) ? 'opp' : (/either|both/i.test(text) ? 'both' : 'self');
    return { op: 'RESTRICT_MAIN_STEP', side: rSide, duration: /next\s+turn/i.test(text) ? 'NEXT_TURN' : 'THIS_TURN' };
  }
  if (/^Reveal\s+(?:all\s+cards\s+in\s+)?(?:the\s+opposing|the\s+opponent['’]s|your)\s+Hand\.?$/i.test(text.trim())) {
    const hSide = /opposing|opponent/i.test(text) ? 'opp' : 'self';
    return { op: 'REVEAL_HAND', side: hSide, target: 'HAND' };
  }

  // F.6 High-precision rules that mention bracketed keywords/names (must precede generic [Keyword] fallback)
  const actEffMatch = text.match(/(?:you\s+can\s+)?(?:immediately\s+)?activate\s+(?:this\s+(?:spirit|ultimate|nexus|brave|card)'s|its|your)\s+\[([^\]]+)\]/i);
  if (actEffMatch) {
    return { op: 'ACTIVATE_EFFECT_ACTION', keyword: actEffMatch[1].trim(), side: 'self' };
  }
  if (/when\s+(?:the\s+opponent|either\s+player|you)\s+uses?\s+(?:a\s+)?magic/i.test(text)) {
    const wSide = /opponent|opposing/i.test(text) ? 'opp' : (/either/i.test(text) ? 'both' : 'self');
    return { op: 'TRIGGERED_WATCHER', watchEvent: 'USE_MAGIC', side: wSide };
  }
  if (/you\s+can\s+put\s+any\s+(?:number|amount)\s+(?:of\s+copies\s+)?of\s+.*in\s+(?:your\s+)?deck/i.test(text)) {
    return { op: 'DECK_BUILDING_RULE', maxCopies: 'UNLIMITED', rule: 'UNLIMITED_COPIES' };
  }
  if (/both\s+players\s+can\s+only\s+\[advent\]/i.test(text) ||
      /you\s+can\s+(?:also\s+)?\[advent\]\s+.*(?:onto\s+this|from\s+(?:the\s+)?trash)/i.test(text) ||
      /this\s+card\s+can\s+(?:also\s+)?\[advent\]/i.test(text)) {
    return { op: 'ADVENT_RULE' };
  }
  if (/give\s+this\s+spirit\s+\[shiny\s+hearts\]\s+and\s+\[absolutes\]/i.test(text)) {
    return { op: 'ADD_FAMILY', families: ['Shiny Hearts', 'Absolutes'] };
  }
  if (/\[grand\s+skill\].*gets?\s+[+-]\d+/i.test(text)) {
    return { op: 'GRANDWALKER_ACTION' };
  }

  // G. Keywords & Reminders
  const kwBracketMatch = text.match(/\[([A-Za-z0-9\s:_-]+)\]/);
  if (kwBracketMatch && !/^soul\s+core$/i.test(kwBracketMatch[1].trim()) && !/all\s+\[.*?\]\s+spirits/i.test(text)) {
    return { op: 'KEYWORD_RULE', keyword: kwBracketMatch[1].trim() };
  }
  const namedKeywords = [
    'Curse', 'Clash', 'Crush', 'Brilliance', 'High Speed', 'Burst',
    'Brave', 'Tribute', 'Immortality', 'Consecutive Blade', 'Charge',
    'Rush', 'Unsheathe', 'Whirlwind', 'Spellbind', 'Bombardment', 'Pursuit'
  ];
  for (const nkw of namedKeywords) {
    const re = new RegExp(`\\b${nkw}\\b`, 'i');
    if (re.test(text)) {
      return { op: 'KEYWORD_RULE', keyword: nkw };
    }
  }

  // H. Continuous Rules, Modifiers, Combat Rules
  if (/(?:without paying (?:the )?cost|for free)/i.test(text)) {
    return { op: 'COST_MODIFIER', free: true };
  }
  let mCost = text.match(/cost (?:of [^,]+ )?becomes? (\d+)/i)
    || text.match(/(?:this card.*?is|becomes?)\s+cost\s*(\d+)/i)
    || text.match(/treat (?:this card|it) as cost (\d+)/i);
  if (mCost) {
    return { op: 'COST_MODIFIER', setCost: parseInt(mCost[1], 10) };
  }
  mCost = text.match(/(?:decrease|reduce) (?:the )?cost (?:of [^,]+ )?by (\d+)/i)
    || text.match(/reduce(?:s)?\s+(?:its\s+)?cost\s+by\s+(\w+|\d+)/i)
    || text.match(/(?:cost.*?gets?\s+-(\d+)|gets?\s+-(\d+)\s+cost)/i);
  if (mCost) {
    return { op: 'COST_MODIFIER', delta: -parseNumber(mCost[1] || mCost[2]) };
  }
  mCost = text.match(/(?:increase) (?:the )?cost (?:of [^,]+ )?by \+?(\d+)/i)
    || text.match(/(?:cost\s*\+(\d+)|increase(?:s)?\s+(?:its|this\s+\w+'s)?\s*cost\s+by\s+\+?(\w+|\d+)|cost\s+increases?\s+by\s+\+?(\w+|\d+))/i);
  if (mCost) {
    return { op: 'COST_MODIFIER', delta: parseNumber(mCost[1] || mCost[2] || mCost[3]) };
  }
  if (/treat\s+(?:all\s+)?(?:the\s+)?reduction(?:\s+symbols)?.*?(?:as\s+(?:being\s+)?|being\s+)(?:fulfilled|filled)/i.test(text)) {
    return { op: 'COST_MODIFIER', fulfillReduction: 'ALL' };
  }
  if (/must pay (?:the )?cost from (?:the )?reserve/i.test(text)) {
    return { op: 'COST_MODIFIER', payFrom: 'reserve' };
  }
  if (/additional.*cost/i.test(text) || /cost reduction/i.test(text) || /reduction cost/i.test(text)) {
    return { op: 'COST_MODIFIER', delta: 1 };
  }

  // PAY_COST
  let mPay = text.match(/(?:by\s+)?paying\s+(?:up\s+to\s+)?(\w+|\d+)\s+costs?/i) || text.match(/unless (?:they|the opponent) pay (?:the |an? )?(\w+|\d+)?\s*cost/i);
  if (mPay) {
    return { op: 'PAY_COST', count: mPay[1] ? parseNumber(mPay[1]) : 1, isCost: true };
  }

  // RUSH_CONDITION
  if (/\(?while you have [^)]+ symbols?, the following effects?\s+activate[s]?\s+next\)?/i.test(text)) {
    return { op: 'RUSH_CONDITION' };
  }

  // ACTIVATE_BURST
  let mBurst = text.match(/immediately activate one of your (?:[a-zA-Z\/]+\s+)?soul bursts?/i);
  if (mBurst) {
    return { op: 'ACTIVATE_BURST', burstType: 'SOUL_BURST', color: mBurst[1] ? capitalize(mBurst[1]) : null };
  }

  // TREAT_RULE
  let mTreat = text.match(/(?:during this turn,\s*)?treat(?:ed)?\s+.*?as\s+(?:being\s+)?(?:at\s+|on\s+)?(?:lv\.?\s*(\d+)|level\s*(\d+))/i);
  if (mTreat) {
    const lvl = parseInt(mTreat[1] || mTreat[2], 10);
    return { op: 'TREAT_RULE', treatAs: 'LEVEL', level: lvl };
  }
  if (/cores?\s*=\s*(?:lv\d+|the highest)/i.test(text) || /treat(?:ed)?\s+.*?as\s+(?:being\s+)?(?:on|at)\s+(?:their|its)?\s*highest\s+(?:lvs?|levels?)/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'LEVEL', level: 'HIGHEST' };
  }
  if (/treat(?:ed)?\s+.*?as\s+(?:being\s+)?(?:on|at)\s+(?:their|its)?\s*lowest\s+(?:lvs?|levels?)/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'LEVEL', level: 'LOWEST' };
  }
  let mTreatLvHigher = text.match(/treat(?:ed)?\s+.*as\s+(?:being\s+)?(\w+|\d+)\s+(?:lv|level)\s+higher/i);
  if (mTreatLvHigher) {
    return { op: 'TREAT_RULE', treatAs: 'LEVEL_BOOST', amount: parseNumber(mTreatLvHigher[1]) || 1 };
  }
  if (/treat(?:ed)?\s+.*as\s+(?:being\s+)?colorless/i.test(text) || /color\s+is\s+treated\s+as\s+colorless/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'COLORLESS' };
  }
  mTreat = text.match(/treat(?:ed)?\s+(?:this\s+\w+\s+)?as\s+(?:being\s+)?(red|purple|green|white|yellow|blue)/i);
  if (mTreat) {
    return { op: 'TREAT_RULE', treatAs: 'COLOR', color: capitalize(mTreat[1]) };
  }
  mTreat = text.match(/treat(?:ed)?\s+(?:this\s+\w+\s+)?as\s+(?:being\s+)?(?:a\s+)?(nexus|spirit|ultimate|magic)/i);
  if (mTreat) {
    return { op: 'TREAT_RULE', treatAs: 'TYPE', cardType: capitalize(mTreat[1]) };
  }
  mTreat = text.match(/(?:count it|treat(?:ed)?\s+.*?)\s+as\s+(\w+)\s+spirits/i);
  if (mTreat) {
    return { op: 'TREAT_RULE', treatAs: 'COUNT', count: parseNumber(mTreat[1]) };
  }
  let mTreatCost = text.match(/treat(?:ed)?\s+.*?as\s+(?:cost\s*(\d+)|being\s+cost\s*(\d+))/i);
  if (mTreatCost) {
    return { op: 'TREAT_RULE', treatAs: 'COST', cost: parseInt(mTreatCost[1] || mTreatCost[2], 10) };
  }
  let mTreatName = text.match(/(?:is\s+also\s+treated\s+as|treat(?:ed)?\s+as\s+(?:being\s+)?(?:exactly[-\s]named\s+)?(?:named\s+)?)[“"]([^"”]+)[”"](?:-named)?/i);
  if (mTreatName) {
    return { op: 'TREAT_RULE', treatAs: 'NAME', name: mTreatName[1].trim() };
  }
  if (/treat(?:ed)?\s+.*as\s+having\s+\[?soul\s+core\]?/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'SOUL_CORE' };
  }
  if (/treat\s+.*as\s+(?:not being blocked|if it weren't blocked|not having been blocked)/i.test(text) || /treat this spirit as not being blocked/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'UNBLOCKED' };
  }
  if (/treating\s+(?:your\s+)?\[?soul\s+core\]?\s+as\s+being\s+sent\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'SOUL_CORE_SPENT' };
  }
  let mTreatLife = text.match(/treat(?:ing)?\s+(?:your\s+)?life\s+as\s+(\w+|\d+)/i);
  if (mTreatLife) {
    return { op: 'TREAT_RULE', treatAs: 'LIFE', count: parseNumber(mTreatLife[1]) };
  }
  if (/treat\s+.*?cost.*?as\s+(?:zero|0)/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'COST', cost: 0 };
  }
  if (/treat the cost.*the same as your life/i.test(text) || /cost.*(?:is|becomes?)\s+(?:the\s+)?same\s+(?:number\s+as|as)\s+your\s+(?:life|lives)/i.test(text)) {
    return { op: 'COST_MODIFIER', dynamic: 'LIFE' };
  }
  let mCostIncBy = text.match(/cost.*?is increased by \+?(\d+)/i);
  if (mCostIncBy) {
    return { op: 'COST_MODIFIER', delta: parseInt(mCostIncBy[1], 10) };
  }
  if (/reduce the cost with symbols of cards in your trash/i.test(text)) {
    return { op: 'COST_MODIFIER', useTrashSymbols: true };
  }
  if (/must be paid or moved from your reserve/i.test(text)) {
    return { op: 'COST_MODIFIER', payFrom: 'reserve' };
  }
  if (/treat (?:it|the hit) as (?:a )?guard/i.test(text)) {
    return { op: 'TRIGGER_GUARD_MODIFIER' };
  }
  let mLvCost = text.match(/increase the lv cost.*by \+?(\d+)/i);
  if (mLvCost) {
    return { op: 'LEVEL_COST_MODIFIER', delta: parseInt(mLvCost[1], 10) };
  }
  let mLvCostMinus = text.match(/lv\d+\s+cost.*?get\s+-(\d+)/i);
  if (mLvCostMinus) {
    return { op: 'LEVEL_COST_MODIFIER', delta: -parseInt(mLvCostMinus[1], 10) };
  }
  let mTreatBp = text.match(/treat\s+.*bp\s+.*?as\s+(\d+)\s*(?:bp)?/i);
  if (mTreatBp) {
    return { op: 'BP_OR_LEVEL_MODIFIER', setBp: parseInt(mTreatBp[1], 10) };
  }

  if (/it discards? -?(\d+) card/i.test(text) || /discards? -?(\d+) card from (?:their|opposing)?\s*deck/i.test(text)) {
    return { op: 'MILL_DECK', count: 1, side: 'opp' };
  }
  if (/become the same as this spirit/i.test(text)) {
    return { op: 'COPY_STATS', target: 'SELF' };
  }
  if (/opposing (?:ultimates|spirits) don't have to block/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION', restriction: 'NO_MANDATORY_BLOCK' };
  }
  if (/braves can't remain on the field with this effect/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'PREVENT_BRAVE_REMAIN' };
  }
  if (/also activates its.*mirage effects/i.test(text)) {
    return { op: 'ACTIVATE_MIRAGE' };
  }
  if (/choose a family/i.test(text)) {
    return { op: 'CHOOSE_FAMILY' };
  }
  if (/can't use reduction symbols to reduce costs/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'PREVENT_REDUCTION_SYMBOLS', side: 'opp' };
  }
  if (/change the "one symbol" of this effect to "two symbols"/i.test(text)) {
    return { op: 'MODIFY_EFFECT_SYMBOLS', count: 2 };
  }
  if (/switch this spirit (?:with|and) .* in (?:the|your) hand/i.test(text)) {
    return { op: 'SWITCH_SPIRIT_WITH_HAND' };
  }
  if (/are banished, instead of being sent to the trash/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', to: 'banished' };
  }
  if (/separate any amount of braved braves/i.test(text)) {
    return { op: 'SEPARATE_BRAVE' };
  }
  if (/treat (?:it|this card) as a "cost: \d+.*?spirit/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'TEMPORARY_SPIRIT' };
  }
  if (/if you don't control any .*? family spirit, discard this card/i.test(text)) {
    return { op: 'DISCARD_CARD' };
  }
  if (/swap any number of cards in your hand with/i.test(text)) {
    return { op: 'SWAP_HAND_CARDS' };
  }
  if (/can exchange with/i.test(text) || /change places with/i.test(text)) {
    return { op: 'EXCHANGE_CARD', target: 'HAND_OR_TRASH' };
  }
  if (/target a cost/i.test(text)) {
    return { op: 'TARGET_CONSTRAINT', target: 'COST' };
  }
  let mLimitInc = text.match(/increase the limit of this.*by \+?(\d+)/i);
  if (mLimitInc) {
    return { op: 'MODIFY_EFFECT_LIMIT', delta: parseInt(mLimitInc[1], 10) };
  }
  let mLifeDmgInc = text.match(/increase the amount of life to be reduced by \+?(\d+)/i);
  if (mLifeDmgInc) {
    return { op: 'MODIFY_DAMAGE', delta: parseInt(mLifeDmgInc[1], 10) };
  }
  if (/stack this (?:card|spirit).*from (?:the|your) hand onto/i.test(text)) {
    return { op: 'ADVENT_STACK' };
  }
  if (/opponent can't set bursts/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'PREVENT_BURST_SET', side: 'opp' };
  }
  if (/are sent to the opposing trash instead/i.test(text)) {
    return { op: 'REDIRECT_CORE_DESTINATION', to: { zone: 'trash', side: 'opp' } };
  }
  if (/as pre-advent cards under this spirit/i.test(text)) {
    return { op: 'MOVE_CARD', to: 'underneath', target: 'self' };
  }
  if (/targets an opposing.*for each/i.test(text)) {
    return { op: 'TARGET_SELECT', forEach: true };
  }
  if (/can only (?:activate bursts or )?use magic cards? (?:that shares?|with|of) the same color as the symbols/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'SAME_COLOR_MAGIC', side: 'opp' };
  }
  if (/putting.*cards from your hand.*to (?:your )?removed zone/i.test(text) || /revealing.*spirit cards.*putting them onto.*removed zone/i.test(text)) {
    return { op: 'MOVE_CARD', from: 'hand', to: 'removed_zone', isCost: true };
  }
  if (/can't control any braves in spirit condition/i.test(text)) {
    return { op: 'RESTRICTION', restriction: 'PREVENT_SPIRIT_BRAVE_CONTROL' };
  }
  if (/opponent decides how the cores are moved in the separation/i.test(text)) {
    return { op: 'COMBAT_RULE', rule: 'OPPONENT_DECIDES_BRAVE_SEPARATION_CORES' };
  }
  if (/ultimate trigger activates for a number of additional times/i.test(text)) {
    return { op: 'MODIFY_TRIGGER_COUNT' };
  }
  let mHvy = text.match(/give\s+.*:?\s*\[(heavy armor:[^\]]+)\]?/i);
  if (mHvy) {
    return { op: 'GRANT_KEYWORD', keyword: mHvy[1] };
  }
  if (/put a card from your decktop face-down underneath this spirit/i.test(text)) {
    return { op: 'MOVE_CARD', from: 'decktop', to: 'underneath', target: 'self' };
  }

  if (/return them to your hand/i.test(text) || /move it to your hand instead/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT' };
  }

  // SYMBOL MODIFIERS
  if (/symbol.*(?:fixed (?:as|at) (?:zero|0)|(?:zero|0) symbols?|becomes? (?:zero|0))/i.test(text) || /every grandwalker nexus has zero symbols/i.test(text)) {
    return { op: 'SET_SYMBOL', count: 0, side: 'opp' };
  }
  let mSetSym = text.match(/symbols?.*?(?:become|becomes?)\s+(one|two|three|\d+)\s+(?:symbols?|(red|purple|green|white|yellow|blue)\s*symbols?)/i);
  if (mSetSym) {
    return { op: 'SET_SYMBOL', count: parseNumber(mSetSym[1]), color: mSetSym[2] ? capitalize(mSetSym[2]) : 'Same' };
  }
  let mSym = text.match(/(?:give|grant|gain[s]?)\s+.*?(a|an|one|two|three|four|\d+)?\s*(?:extra|additional)?\s*(red|purple|green|white|yellow|blue)?\s*symbols?/i);
  if (mSym) {
    const color = mSym[2] ? capitalize(mSym[2]) : 'Same';
    const count = mSym[1] ? parseNumber(mSym[1]) : 1;
    return { op: 'ADD_SYMBOL', color, count, side: 'self' };
  }
  if (/give it an extra symbol/i.test(text)) {
    return { op: 'ADD_SYMBOL', color: 'Same', count: 1, side: 'self' };
  }

  if (/(?:by\s+)?discarding\s+(?:one\s+of\s+your\s+)?bursts?/i.test(text)) {
    return { op: 'DISCARD_BURST', count: 1, side: 'self', isCost: true };
  }
  if (/reveal\s+(?:one\s+of\s+your\s+)?bursts?/i.test(text)) {
    return { op: 'REVEAL_BURST', count: 1, side: 'self' };
  }

  if (/when you pay the cost to use a magic card/i.test(text)) {
    return { op: 'TRIGGER_CONDITION', condition: 'WHEN_PAY_COST_FOR_MAGIC' };
  }
  if (/target either cost \d+ or \d+/i.test(text) || /^cost \d+ or (?:less|more)$/i.test(text.trim())) {
    return { op: 'TARGET_CONSTRAINT' };
  }
  if (/can'?t\s+be\s+destroyed/i.test(text) || /cannot\s+be\s+destroyed/i.test(text)) {
    // 1. Target determination
    let target = null;
    if (/\bit\s+can'?t\s+be\s+destroyed/i.test(text) || /\bit\s+cannot\s+be\s+destroyed/i.test(text)) {
      target = 'target';
    } else if (/this\s+spirit\s+and\s+(?:all\s+)?your\s+(?:exactly-named\s+)?((?:"[^"]+"\s*[/,]\s*)*"[^"]+")/i.test(text)) {
      const m = text.match(/this\s+spirit\s+and\s+(?:all\s+)?your\s+(?:exactly-named\s+)?((?:"[^"]+"\s*[/,]\s*)*"[^"]+")/i);
      const names = m[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      target = { side: 'self', types: ['Spirit'], names, includeSelf: true };
    } else if (/this\s+spirit\s+and\s+(?:every|all)\s+"([^"]+)"\s+family\s+nexus(?:es)?\s+you\s+control/i.test(text)) {
      const m = text.match(/this\s+spirit\s+and\s+(?:every|all)\s+"([^"]+)"\s+family\s+nexus(?:es)?\s+you\s+control/i);
      target = { side: 'self', types: ['Nexus'], family: m[1], includeSelf: true };
    } else if (/(?:all\s+)?your\s+"([^"]+)"(?:-named)?\s+grandwalker\s+nexuses/i.test(text)) {
      const m = text.match(/(?:all\s+)?your\s+"([^"]+)"(?:-named)?\s+grandwalker\s+nexuses/i);
      target = { side: 'self', types: ['Grandwalker Nexus', 'Nexus'], name: m[1] };
    } else if (/your\s+((?:"[^"]+"\s*[/,]\s*)+"[^"]+")\s+family\s+spirits(?:\/ultimates)?/i.test(text)) {
      const m = text.match(/your\s+((?:"[^"]+"\s*[/,]\s*)+"[^"]+")\s+family\s+spirits(\/ultimates)?/i);
      const families = m[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      const types = m[2] ? ['Spirit', 'Ultimate'] : ['Spirit'];
      target = { side: 'self', types, families };
    } else if (/your\s+([A-Za-z]+)\s+"([^"]+)"\s+family\s+spirits(?:\/ultimates)?/i.test(text)) {
      const m = text.match(/your\s+([A-Za-z]+)\s+"([^"]+)"\s+family\s+spirits(\/ultimates)?/i);
      const types = m[3] ? ['Spirit', 'Ultimate'] : ['Spirit'];
      target = { side: 'self', types, color: m[1], family: m[2] };
    } else if (/your\s+"([^"]+)"\s+family\s+spirits\/ultimates/i.test(text)) {
      const m = text.match(/your\s+"([^"]+)"\s+family\s+spirits\/ultimates/i);
      target = { side: 'self', types: ['Spirit', 'Ultimate'], family: m[1] };
    } else if (/your\s+"([^"]+)"\s+family\s+spirits/i.test(text)) {
      const m = text.match(/your\s+"([^"]+)"\s+family\s+spirits/i);
      target = { side: 'self', types: ['Spirit'], family: m[1] };
    } else if (/your\s+"([^"]+)"-named\s+spirits/i.test(text)) {
      const m = text.match(/your\s+"([^"]+)"-named\s+spirits/i);
      target = { side: 'self', types: ['Spirit'], name: m[1] };
    } else if (/all\s+\[([a-zA-Z]+)\]\s+spirits\s+you\s+control/i.test(text)) {
      const m = text.match(/all\s+\[([a-zA-Z]+)\]\s+spirits\s+you\s+control/i);
      target = { side: 'self', types: ['Spirit'], family: m[1] };
    } else if (/all\s+your\s+nexuses/i.test(text)) {
      target = { side: 'self', types: ['Nexus'] };
    } else if (/all\s+your\s+spirits/i.test(text)) {
      target = { side: 'self', types: ['Spirit'] };
    } else if (/besides\s+your\s+(?:exactly-named\s+)?"([^"]+)",\s*all\s+"([^"]+)"-named\s+nexuses\s+and\s+(?:exactly-named\s+)?"([^"]+)"\s+you\s+control/i.test(text)) {
      const m = text.match(/besides\s+your\s+(?:exactly-named\s+)?"([^"]+)",\s*all\s+"([^"]+)"-named\s+nexuses\s+and\s+(?:exactly-named\s+)?"([^"]+)"\s+you\s+control/i);
      target = {
        side: 'self',
        names: [m[2], m[3]],
        excludeNames: [m[1]]
      };
    } else if (/besides\s+your/i.test(text)) {
      return {
        op: 'UNSUPPORTED',
        unhandledClause: text,
        reason: 'UNSUPPORTED_TARGET_PATTERN: complex exception targeting'
      };
    } else if (/this\s+(?:spirit|nexus|ultimate|magic|card)/i.test(text) ||
               /^(?:also,\s*)?(?:during\s+this\s+(?:battle|turn),\s*)?(?:this\s+)?(?:spirit|nexus|ultimate)?\s*can'?t\s+be\s+destroyed/i.test(text) ||
               /^(?:also,\s*)?(?:during\s+this\s+(?:battle|turn),\s*)?(?:this\s+)?(?:spirit|nexus|ultimate)?\s*cannot\s+be\s+destroyed/i.test(text)) {
      target = 'self';
    } else {
      const targetMatch = text.match(/^(?:.*,\s*)?(.*?)can'?t\s+be\s+destroyed/i) || text.match(/^(?:.*,\s*)?(.*?)cannot\s+be\s+destroyed/i);
      return {
        op: 'UNSUPPORTED',
        unhandledClause: text,
        reason: `UNSUPPORTED_TARGET_PATTERN: ${targetMatch ? targetMatch[1].trim() : text}`
      };
    }

    // 2. Duration determination
    let duration = null;
    if (/during\s+this\s+turn/i.test(text) || clause?.duration === 'DURING_THIS_TURN') {
      duration = 'THIS_TURN';
    } else if (/during\s+this\s+battle/i.test(text) || clause?.duration === 'DURING_THIS_BATTLE') {
      duration = 'THIS_BATTLE';
    } else if (/until\s+your\s+next\s+start\s+step/i.test(text) || clause?.duration === 'UNTIL_NEXT_START_STEP') {
      duration = 'UNTIL_NEXT_START_STEP';
    } else if (clause?.duration) {
      duration = clause.duration.replace(/^DURING_/, '');
    }

    // 3. Cause determination (by)
    let by = null;
    if (/can'?t\s+be\s+destroyed\s+(?:by|via)\s+(?:bp\s+comparison|comparing\s+bp)/i.test(text) ||
        /cannot\s+be\s+destroyed\s+(?:by|via)\s+(?:bp\s+comparison|comparing\s+bp)/i.test(text)) {
      by = ['BP_COMPARISON'];
    } else if (/can'?t\s+be\s+destroyed\s+by\s+battle/i.test(text) ||
               /cannot\s+be\s+destroyed\s+by\s+battle/i.test(text)) {
      by = ['BATTLE'];
    } else {
      const mSpecific = text.match(/can'?t\s+be\s+destroyed\s+by\s+opposing\s+((?:[a-zA-Z/]+\s+)+)effects?/i) ||
                        text.match(/cannot\s+be\s+destroyed\s+by\s+opposing\s+((?:[a-zA-Z/]+\s+)+)effects?/i);
      if (mSpecific && !/^(?:all\s+)?$/i.test(mSpecific[1].trim())) {
        const rawTypes = mSpecific[1].split(/[\s/]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
        const validTypes = rawTypes.map(t => {
          if (t === 'SPIRIT' || t === 'SPIRITS') return 'OPPOSING_SPIRITS';
          if (t === 'NEXUS' || t === 'NEXUSES') return 'OPPOSING_NEXUSES';
          if (t === 'MAGIC') return 'OPPOSING_MAGIC';
          if (t === 'BRAVE' || t === 'BRAVES') return 'OPPOSING_BRAVES';
          if (t === 'ULTIMATE' || t === 'ULTIMATES') return 'OPPOSING_ULTIMATES';
          return null;
        }).filter(Boolean);
        if (validTypes.length > 0) {
          by = validTypes;
        }
      }

      if (!by) {
        if (/can'?t\s+be\s+destroyed\s+by\s+opposing\s+effects?/i.test(text) ||
            /cannot\s+be\s+destroyed\s+by\s+opposing\s+effects?/i.test(text)) {
          by = ['OPPOSING_EFFECTS'];
        } else if (/can'?t\s+be\s+destroyed\s+by\s+the\s+opponent/i.test(text) ||
                   /cannot\s+be\s+destroyed\s+by\s+the\s+opponent/i.test(text)) {
          by = ['OPPONENT'];
        } else if (/can'?t\s+be\s+destroyed\s+by\s+effects?/i.test(text) ||
                   /cannot\s+be\s+destroyed\s+by\s+effects?/i.test(text) ||
                   /due\s+to\s+opposing\s+effects/i.test(text)) {
          by = ['EFFECTS'];
        }
      }
    }

    if (!by) {
      const unhandledBy = text.match(/can'?t\s+be\s+destroyed\s+(?:by|due\s+to)\s+([^,.]+)/i) ||
                          text.match(/cannot\s+be\s+destroyed\s+(?:by|due\s+to)\s+([^,.]+)/i);
      if (unhandledBy) {
        return {
          op: 'UNSUPPORTED',
          unhandledClause: text,
          reason: `UNSUPPORTED_DESTRUCTION_CAUSE: ${unhandledBy[1].trim()}`
        };
      }
      by = ['ALL'];
    }

    const res = { op: 'INDESTRUCTIBLE', by, target };
    if (duration) res.duration = duration;
    return res;
  }

  if (/ignore the (?:summoning|advent) conditions?/i.test(text) || /ignore the conditions?/i.test(text)) {
    return { op: 'IGNORE_CONDITIONS' };
  }
  if (/can't attack/i.test(text) || /can't block/i.test(text) || /can't be/i.test(text) || /must attack if possible/i.test(text) || /can only attack once per turn/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION' };
  }
  if (/can target and attack/i.test(text) || /must block with/i.test(text) || /instead of comparing bp, compare the number of core/i.test(text) || /both spirits are destroyed/i.test(text) || /target and attack/i.test(text) || /end the attack step/i.test(text) || /compare lv instead of bp/i.test(text) || /instead of comparing bp, compare lv/i.test(text) || /compare the total amount of cores/i.test(text)) {
    return { op: 'COMBAT_RULE' };
  }
  if (/end (?:the|opposing)?\s*main step/i.test(text) || /main step ends/i.test(text)) {
    return { op: 'END_MAIN_STEP' };
  }
  if (/unaffected/i.test(text)) {
    return { op: 'IMMUNITY' };
  }
  if (/change the target/i.test(text)) {
    return { op: 'REDIRECT_TARGET' };
  }

  // GRANT_FAMILY
  let mFam = text.match(/(?:this\s+card|this\s+spirit)\s+has\s+(?:the\s+)?(?:famil(?:y|ies)(?:\s*:\s*)?)?["']?([^"']+)["']?\s+famil(?:y|ies)/i)
    || text.match(/(?:give|grant|gain[s]?)\s+.*?(?:the\s+)?famil(?:y|ies)\s*:\s*(.+)/i)
    || text.match(/(?:give|grant|gain[s]?)\s+.*?(?:the\s+)?["']?([^"']+)["']?\s+famil(?:y|ies)/i)
    || text.match(/(?:also\s+)?treated\s+as\s+(?:a\s+)?["']?([^"']+)["']?\s+famil(?:y|ies)/i);
  if (mFam) {
    return { op: 'GRANT_FAMILY', family: mFam[1].replace(/["']/g, '').trim(), side: 'self' };
  }
  if (/give.*characteristic/i.test(text)) {
    return { op: 'GRANT_CHARACTERISTIC' };
  }
  if (/negated/i.test(text) || /negate/i.test(text) || /can't activates?/i.test(text)) {
    return { op: 'NEGATE_EFFECT' };
  }
  if (/this effect (?:can't|cannot|can only) be used/i.test(text) || /you can't use this effect/i.test(text) || /can't be used/i.test(text) || /by an opposing spirit effect/i.test(text)) {
    return { op: 'PLAY_CONDITION' };
  }
  if (/can only use magic effects/i.test(text) || /unless the opponent pay the cost, they can't use magic/i.test(text) || /use flash effects/i.test(text) || /can't use flash effects/i.test(text) || /magic effects can only be used once per turn/i.test(text)) {
    return { op: 'MAGIC_RESTRICTION' };
  }
  if (/neither player can return cards from the trash/i.test(text) || /spirits can't be summoned/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/effects of all \".*\" family spirits activate as/i.test(text) || /effects of a spirit you control activate as/i.test(text) || /also activates at/i.test(text) || /prevent_when_summoned/i.test(text) || /effect of the spirit can't activate/i.test(text) || /when destroyed.*effects.*can't activate/i.test(text)) {
    return { op: 'CONTINUOUS_RULE' };
  }
  if (/only up to \w+ cards can be discarded from your deck/i.test(text)) {
    return { op: 'LIMIT_DECK_DISCARD' };
  }
  if (/target a color/i.test(text) || /choose a color/i.test(text)) {
    return { op: 'CHOOSE_COLOR' };
  }
  if (/target (?:any number of|\w+ )?opposing spirits/i.test(text) || /target one of their spirits/i.test(text) || /target a \w+ spirit/i.test(text)) {
    return { op: 'TARGET_SELECT' };
  }
  if (/loses all its effects, and can't gain any new ones/i.test(text)) {
    return { op: 'LOSE_EFFECTS' };
  }
  if (/reveals their entire hand/i.test(text)) {
    return { op: 'REVEAL_HAND' };
  }
  if (/activate the \(when (?:summoned|destroyed)\) effect/i.test(text)) {
    return { op: 'ACTIVATE_TRIGGER' };
  }
  if (/can only reduce.*life by (?:a total of )?one/i.test(text) || /life.*can only be reduced by (?:a total of |up to )?one/i.test(text)) {
    return { op: 'DAMAGE_CAP' };
  }
  if (/life won't become zero/i.test(text) || /attack can't reduce your life/i.test(text) || /neither player's life would be reduced/i.test(text)) {
    return { op: 'PREVENT_LIFE_LOSS' };
  }
  if (/increase the number of targets specified by/i.test(text)) {
    return { op: 'ENHANCE_KEYWORD' };
  }
  if (/can't use effects of cards from (?:their )?hand during flash timing/i.test(text) ||
      /can't use (?:flash )?effects of cards from/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'PREVENT_FLASH_HAND', side: 'opp' };
  }
  if (/both players'? spirits are destroyed/i.test(text)) {
    return { op: 'DESTROY', target: { side: 'both', types: ['Spirit'] } };
  }
  if (/activate as \(when attacks\)/i.test(text) || /now activate as/i.test(text)) {
    return { op: 'CONTINUOUS_RULE', rule: 'BLOCK_EFFECTS_ACTIVATE_ON_ATTACK' };
  }
  if (/choose one of the two to battle against/i.test(text)) {
    return { op: 'COMBAT_RULE', rule: 'CHOOSE_BLOCKER' };
  }
  if (/this effect can't target/i.test(text) || /this effect don't activate/i.test(text) || /this effect doesn't activate/i.test(text)) {
    return { op: 'PLAY_CONDITION' };
  }

  if (/cards underneath are discarded when this Spirit would leave the Field/i.test(text)) {
    return { op: 'FORMAT_MARKER' };
  }
  if (/target\s+(?:any number of|one of their|one|a)\s+(?:opposing\s+)?spirits/i.test(text) ||
      /each\s+player\s+targets\s+one\s+of\s+their\s+spirits/i.test(text) ||
      /target\s+a\s+spirit\s+with\s+\[ice\s+wall\]/i.test(text)) {
    return { op: 'TARGET_SELECT' };
  }
  if (/^target\s+a\s+lv\.?$/i.test(text)) {
    return { op: 'CHOOSE_LEVEL' };
  }
  if (/lose\s+(?:all|their)\s+effects,?\s*and\s*can't\s+gain\s+(?:any\s+)?new\s+ones/i.test(text) ||
      /spirits\s+of\s+the\s+targeted\s+lv\s+lose\s+all\s+effects/i.test(text)) {
    return { op: 'LOSE_EFFECTS' };
  }
  if (/not\s+drawing\s+a\s+card/i.test(text)) {
    return { op: 'SKIP_DRAW' };
  }
  if (/(?:\(when\s+summoned\)|when\s+summoned)?\s*effects?\s+of\s+(?:that|the)\s+spirit\s+(?:do\s*not|don't)\s+activate/i.test(text)) {
    return { op: 'PREVENT_WHEN_SUMMONED' };
  }
  if (/when\s+(?:the\s+opponent|either\s+player|you)\s+uses?\s+(?:a\s+)?magic/i.test(text)) {
    return { op: 'TRIGGERED_WATCHER' };
  }
  if (/end\s+(?:the\s+)?opposing\s+main\s+step/i.test(text)) {
    return { op: 'END_MAIN_STEP' };
  }
  if (/\(opposing main step\)\s+on\s+the\s+next\s+turn\s+doesn't\s+occur/i.test(text)) {
    return { op: 'RESTRICT_MAIN_STEP' };
  }
  if (/compare\s+the\s+levels\s+instead\s+of\s+bp/i.test(text) ||
      /spirit\s+with\s+the\s+lower\s+level\s+is\s+destroyed/i.test(text) ||
      /if\s+both\s+spirits\s+have\s+the\s+same\s+level/i.test(text) ||
      /both\s+are\s+destroyed/i.test(text)) {
    return { op: 'COMPARE_LV_INSTEAD_OF_BP' };
  }
  if (/switch\s+the\s+bp\s+of\s+your\s+battling\s+spirit/i.test(text)) {
    return { op: 'SWITCH_BP' };
  }
  if (/opponent\s+must\s+attack\s+at\s+least\s+once/i.test(text)) {
    return { op: 'FORCE_ATTACK' };
  }
  if (/when\s+those\s+spirits\s+block,\s*choose\s+one\s+of\s+them\s+to\s+battle\s+against/i.test(text)) {
    return { op: 'CHOOSE_BLOCKER' };
  }
  if (/activate\s+it\b/i.test(text)) {
    return { op: 'ACTIVATE_BURST' };
  }
  if (/activate\s+the\s+same\s+effect\s+once\s+again/i.test(text)) {
    return { op: 'ACTIVATE_CARD_EFFECT' };
  }
  if (/if\s+you\s+don't\s+summon\s+it,\s*or\s+it's\s+a\s+different\s+card,\s*discard\s+it/i.test(text) ||
      /discard\s+it\b/i.test(text)) {
    return { op: 'DISCARD_REVEALED' };
  }
  if (/discard(?:ing)?\s+(?:a\s+)?card\s+underneath/i.test(text)) {
    return { op: 'DISCARD_PRE_ADVENT' };
  }
  if (/discard(?:ing)?\s+your\s+entire\s+hand/i.test(text)) {
    return { op: 'DISCARD_HAND', count: 'ALL' };
  }
  if (/cannot\s+bring\s+the\s+opposing\s+life\s+to\s+zero/i.test(text) ||
      /neither\s+player's\s+life\s+can\s+be\s+reduced/i.test(text)) {
    return { op: 'DAMAGE_CAP' };
  }
  if (/neither\s+player\s+can\s+use.*magic\s+cards/i.test(text) ||
      /opponent\s+can't\s+use.*magic\s+cards/i.test(text)) {
    return { op: 'MAGIC_RESTRICTION' };
  }
  if (/neither\s+player\s+can\s+remove\s+the\s+cores\s+on\s+this\s+spirit/i.test(text)) {
    return { op: 'CORE_LOCK' };
  }
  if (/cores\s+on\s+your\s+destroyed\s+spirits\s+are\s+sent\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', replaces: 'DESTROYED_SPIRIT_CORES', replacementZone: 'field', target: 'SELF', side: 'self' };
  }
  if (/put\s+this\s+card\s+onto\s+your\s+field/i.test(text)) {
    return { op: 'OPEN_ZONE' };
  }
  if (/when\s+any\s+of\s+your\s+spirits\s+is\s+destroyed\s+by\s+opposing\s+effects,\s*discard\s+this\s+card/i.test(text)) {
    return { op: 'DISCARD_CARD' };
  }
  if (/sending\s+one\s+of\s+your\s+lives\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'life', side: 'self' }, to: { zone: 'field', target: 'self' } };
  }
  if (/(?:opponent\s+sends?|send)\s+(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cores?\s+from\s+(?:their|opposing)\s+spirits?\s+to\s+(?:their\s+)?trash/i.test(text)) {
    const mCore = text.match(/(?:opponent\s+sends?|send)\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cores?/i);
    return { op: 'MOVE_CORE', count: parseNumber(mCore ? mCore[1] : 1), from: { zone: 'field', side: 'opp', types: ['Spirit'] }, to: { zone: 'trash', side: 'opp' } };
  }

  // Soul Core movements
  if (/(?:move|send|put)\s+(?:the\s+)?\[?soul\s+core\]?(?:\(soul\s+core\))?\s+from\s+a\s+spirit\s+you\s+control\s+to\s+another\s+spirit\s+you\s+control/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }
  if (/(?:send(?:ing)?|put(?:ting)?)\s+(?:the\s+)?(?:your\s+)?\[?soul core\]?(?:\(soul core\))?\s+(?:from\s+this\s+spirit\s+)?to\s+(?:the|your)\s+trash/i.test(text) ||
      /(?:send(?:ing)?|put(?:ting)?)\s+(?:the\s+)?(?:your\s+)?\[?soul core\]?(?:\(soul core\))?\s+to\s+(?:the|your)\s+trash/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, isSoulCore: true, to: { zone: 'trash', side: 'self' } };
  }
  if (/(?:send(?:ing)?|put(?:ting)?)\s+(?:the\s+)?(?:your\s+)?\[?soul core\]?(?:\(soul core\))?\s+from\s+(?:your\s+)?reserve\s+to\s+(?:your\s+)?life/i.test(text)) {
    return { op: 'SEAL_MOVE', count: 1, isSoulCore: true };
  }
  if (/(?:send(?:ing)?|put(?:ting)?)\s+(?:the\s+)?(?:your\s+)?\[?soul core\]?(?:\(soul core\))?\s+from\s+(?:your\s+)?trash\s+to\s+(?:your\s+)?reserve/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, isSoulCore: true, from: { zone: 'trash', side: 'self' }, to: { zone: 'reserve', side: 'self' } };
  }

  // Bunshin
  if (/placing\s+(?:up\s+to\s+)?(?:one|two|\d+)\s+cards?\s+from\s+your\s+decktop\s+onto\s+the\s+field\s+facedown/i.test(text)) {
    return { op: 'BUNSHIN_SUMMON' };
  }
  if (/activate\s+(?:all\s+your|one\s+of\s+your|this|that)?\s*spirits?'?\s*\[?bunshin(?::\s*\d+)?\]?/i.test(text)) {
    return { op: 'ACTIVATE_TRIGGER' };
  }

  // Discard remaining / unsummoned
  if (/discard\s+any\s+(?:unsummoned\s+or\s+remaining|re?maining)\s+cards?/i.test(text)) {
    return { op: 'DISCARD_REMAINING' };
  }

  // Underneath cards (Poison Blade / Kourin / Nexus)
  if (/put\s+(?:a|an|one|two|three|\d+)\s+cards?\s+from\s+(?:the\s+opposing|your)\s+decktop\s+under\s+.*facedown/i.test(text)) {
    return { op: 'PUT_UNDERNEATH' };
  }
  if (/\(?the\s+cards\s+under\s+this\s+(?:spirit|ultimate|nexus)\s+are\s+discarded/i.test(text) ||
      /when\s+those\s+spirits\/ultimates\s+would\s+leave\s+the\s+field,\s*the\s+cards\s+under\s+them\s+are\s+discarded/i.test(text)) {
    return { op: 'FORMAT_MARKER' };
  }

  // Removed zone (Accel / Open)
  if (/put\s+this\s+card\s+face-up\s+(?:on|in|into)\s+the\s+removed\s+zone/i.test(text) ||
      /put\s+this\s+magic\s+card\s+onto\s+your\s+field/i.test(text)) {
    return { op: 'OPEN_ZONE' };
  }
  if (/activate\s+the\s+following\s+effect\s+after\s+being\s+summoned/i.test(text)) {
    return { op: 'TRIGGERED_WATCHER' };
  }

  // Pre-Advent
  if (/discarding\s+(?:one\s+of\s+this\s+spirit's\s+)?pre-advent\s+cards?/i.test(text)) {
    return { op: 'DISCARD_PRE_ADVENT' };
  }
  if (/unless\s+that\s+spirit\s+has\s+activated\s+its\s+\(when\s+advents\)\s+effect\s+this\s+turn,\s*activate\s+that\s+spirit's\s+\(when\s+advents\)\s+effect/i.test(text)) {
    return { op: 'ACTIVATE_TRIGGER' };
  }

  // Ultimate Triggers & Counters
  if (/when\s+an\s+opposing\s+ultimate\s+trigger\s+hits/i.test(text)) {
    return { op: 'TRIGGER_COUNTER' };
  }
  if (/after\s+ultimate\s+trigger.*proceed\s+to\s+cross\s+ultimate\s+trigger/i.test(text)) {
    return { op: 'CROSS_TRIGGER' };
  }
  if (/in\s+this\s+case,\s*cores\s+to\s+be\s+put\s+on\s+this\s+ultimate\s+must\s+also\s+be\s+from\s+the\s+reserve/i.test(text) ||
      /the\s+owner\s+moves\s+the\s+core\s+during\s+the\s+separation/i.test(text)) {
    return { op: 'FORMAT_MARKER' };
  }

  // Color symbols standalone
  if (/^(?:red|purple|green|white|yellow|blue)(?:\/(?:red|purple|green|white|yellow|blue))*$/i.test(text)) {
    return { op: 'CHOOSE_COLOR' };
  }
  if (/target\s+a\s+nexus\s+color/i.test(text)) {
    return { op: 'CHOOSE_COLOR' };
  }

  // Choices & Activations
  if (/opponent\s+chooses\s+one\s+of\s+the\s+following\s+effects/i.test(text)) {
    return { op: 'OPPONENT_CHOICE' };
  }
  if (/activate\s+the\s+chosen\s+effect/i.test(text) || /activate\s+the\s+same\s+effect\s+once\s+more/i.test(text)) {
    return { op: 'ACTIVATE_CARD_EFFECT' };
  }
  if (/activate\s+(?:the\s+)?\[?bunshin(?::\s*\d+)?\]?(?:\s+of\s+.*)?/i.test(text) || /activate\s+.*\[?bunshin(?::\s*\d+)?\]?/i.test(text)) {
    return { op: 'ACTIVATE_TRIGGER' };
  }

  // Effect modifiers & replacements
  if (/this\s+effect\s+reveals\s+.*cards\s+instead/i.test(text) || /change\s+the\s+number\s+of\s+spirit\s+cards\s+to\s+be\s+summoned.*to\s+\w+/i.test(text)) {
    return { op: 'MODIFY_EFFECT' };
  }
  if (/cores\s+that\s+this\s+effect\s+would\s+send\s+to\s+the\s+reserve\s+are\s+sent\s+to\s+the\s+void\s+instead/i.test(text) ||
      /core\s+from\s+the\s+opposing\s+life\s+is\s+sent\s+to\s+the\s+void\s+instead/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: 'void', side: 'opp' };
  }
  if (/discard\s+a\s+card\s+from\s+the\s+opposing\s+removed\s+zone/i.test(text)) {
    return { op: 'DISCARD_REMOVED' };
  }
  if (/after\s+this\s+turn\s+ends,?\s*\(?your\s+turn\)?\s*occurs\s+once\s+more/i.test(text)) {
    return { op: 'EXTRA_TURN' };
  }
  if (/when\s+ultimate\s+trigger\s+hits,.*can\s+only\s+block\s+(?:if\s+they\s+block\s+with|with)/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION' };
  }
  if (/this\s+magic\s+card\s+can\s+only\s+be\s+used\s+while/i.test(text)) {
    return { op: 'PLAY_CONDITION' };
  }
  if (/when\s+ultimate\s+trigger\s+hits,.*bp\s+doubles/i.test(text)) {
    return { op: 'BP_BUFF' };
  }
  if (/look\s+at\s+the\s+contents\s+of\s+.*card\s+in\s+the\s+opposing\s+hand/i.test(text)) {
    return { op: 'LOOK_HAND' };
  }
  if (/put\s+up\s+to\s+.*cards?\s+from\s+your\s+decktop\s+under\s+this\s+nexus\s+face-down/i.test(text)) {
    return { op: 'PUT_UNDERNEATH' };
  }
  if (/increase\s+the\s+number\s+of\s+cores\s+you\s+gain\s+by\s+\+\d+/i.test(text)) {
    return { op: 'CORE_CHARGE_ADD' };
  }
  if (/life\s+can\s+only\s+be\s+reduced\s+by\s+opposing\s+ultimate\s+effects\s+by\s+one\s+per\s+turn/i.test(text) ||
      /attacks\s+of\s+\d+\s*bp\s+or\s+less\s+spirits\s+can't\s+reduce/i.test(text)) {
    return { op: 'DAMAGE_CAP' };
  }
  if (/send\s+(?:a|an|one|\d+)?\s*cores?,\s*besides\s+\[?soul\s+core\]?.*to\s+your\s+life/i.test(text)) {
    return { op: 'RECOVER_LIFE' };
  }
  if (/the\s+opponent\s+sends\s+all\s+cores\s+from\s+.*spirits\s+they\s+control\s+to\s+their\s+reserve/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 'ALL',
      from: { zone: 'field', side: 'opp', types: ['Spirit'] },
      to: { zone: 'reserve', side: 'opp' },
      chooser: 'opp'
    };
  }

  // Void cores restriction / replacement
  if (/neither\s+player\s+can\s+add\s+cores\s+from\s+the\s+void/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/when\s+either\s+player\s+add\s+cores\s+from\s+the\s+void.*send\s+all\s+those\s+added\s+cores\s+back\s+to\s+the\s+void/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', replaces: 'CORE_ADDITION', replacementZone: 'void', side: 'both' };
  }
  if (/when\s+the\s+opponent\s+would\s+increase\s+cores\s+from\s+the\s+void/i.test(text)) {
    if (/to\s+your\s+life\s+instead/i.test(text)) {
      return { op: 'REPLACEMENT_EFFECT', replaces: 'CORE_ADDITION', replacementZone: 'life', side: 'self' };
    }
    if (/to\s+this\s+spirit\s+instead/i.test(text)) {
      return { op: 'REPLACEMENT_EFFECT', replaces: 'CORE_ADDITION', replacementZone: 'field', target: 'SELF', side: 'self' };
    }
    return { op: 'REPLACEMENT_EFFECT' };
  }

  // Combat blocker choices & restrictions
  if (/when\s+this\s+ultimate\s+is\s+blocked,\s*choose\s+one\s+of\s+them\s+to\s+battle\s+against/i.test(text) ||
      /when\s+that\s+spirit\s+you\s+control\s+is\s+blocked,\s*choose\s+one\s+opposing\s+blocking\s+spirit\s+to\s+battle\s+against/i.test(text)) {
    return { op: 'CHOOSE_BLOCKER' };
  }
  if (/(?:their\s+)?ultimates\s+doesn't\s+need\s+to\s+block/i.test(text) ||
      /they\s+can\s+only\s+block\s+if\s+they\s+block\s+with\s+(?:two|three)\s+(?:of\s+their\s+)?spirits/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION' };
  }

  // Phases 7-10 extensions (2014-2017)
  // Blocker choices & Combat rules
  if (/when\s+(?:this\s+(?:spirit|ultimate)\s+is|those\s+spirits)\s+blocked,\s*choose\s+one\s+(?:of\s+them\s+)?to\s+battle\s+against/i.test(text) ||
      /choose\s+one\s+(?:of\s+them\s+)?to\s+battle\s+against/i.test(text)) {
    return { op: 'CHOOSE_BLOCKER' };
  }
  if (/can\s+only\s+block\s+with\s+a\s+spirit\s+with\s+soul\s+core\s+on\s+it/i.test(text) ||
      /can\s+only\s+block\s+if\s+they\s+block\s+with\s+(?:two|three)\s+(?:of\s+their\s+)?(?:spirits|ultimates)/i.test(text) ||
      /can\s+only\s+block\s+with\s+their\s+spirit\s+with\s+the\s+highest\s+bp/i.test(text) ||
      /can't\s+block\s+unless\s+they\s+send\s+a\s+core\s+from\s+their\s+life/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION' };
  }
  if (/when\s+this\s+spirit\s+is\s+aligned\s+via\s+\[?my\s+unit\]?.*opponent\s+must\s+block/i.test(text)) {
    return { op: 'FORCE_BLOCK' };
  }
  if (/every\s+opposing\s+.*spirit\s+must\s+attack\s+this\s+spirit\s+if\s+possible/i.test(text)) {
    return { op: 'FORCE_ATTACK' };
  }
  if (/you\s+can\s+attack\s+that\s+spirit/i.test(text)) {
    return { op: 'CAN_ATTACK' };
  }
  if (/target\s+up\s+to\s+two\s+opposing\s+spirits\/ultimates\s+and\s+battle\s+them\s+at\s+once/i.test(text)) {
    return { op: 'BATTLE_MULTIPLE' };
  }
  if (/if\s+it\s+was\s+in\s+battle,\s*the\s+battle\s+continues/i.test(text)) {
    return { op: 'CONTINUE_BATTLE' };
  }
  if (/instead\s+of\s+comparing\s+bp,\s*compare\s+levels\s+instead/i.test(text)) {
    return { op: 'COMPARE_LEVELS' };
  }
  if (/the\s+opponent\s+chooses\s+a\s+spirit\s+they\s+control\s+and\s+compares\s+bp\s+with\s+this\s+spirit/i.test(text)) {
    return { op: 'COMPARE_BP' };
  }
  if (/when\s+only\s+the\s+opposing\s+spirit\s+is\s+destroyed,\s*activate\s+the\s+following\s+effect/i.test(text)) {
    return { op: 'ON_BP_DESTROY' };
  }

  // Trigger Counters & Guard & Modifications
  if (/when\s+(?:an?|the)\s+opposing\s+ultimate(?:-|\s+)trigger\s+hits.*before\s+(?:that|the\s+hit|the\s+"?when\s+hits"?)\s+effect/i.test(text) ||
      /activate\s+(?:the\s+following|this\s+magic).*before\s+the\s+"?when\s+hits"?\s+effect\s+activates/i.test(text)) {
    return { op: 'TRIGGER_COUNTER' };
  }
  if (/guard\s+that\s+ultimate\s+trigger/i.test(text)) {
    return { op: 'GUARD_TRIGGER' };
  }
  if (/change\s+the\s+hit\s+of\s+this\s+ultimate's\s+ultimate(?:-|\s+)trigger\s+to\s+critical\s+hit/i.test(text)) {
    return { op: 'MODIFY_EFFECT', to: 'CRITICAL_HIT' };
  }
  if (/if\s+the\s+burst\s+effect\s+activated\s+by\s+this\s+effect\s+only\s+targets\s+one\s+body,\s*change\s+it\s+to\s+all/i.test(text) ||
      /change\s+it\s+to\s+all\b/i.test(text)) {
    return { op: 'EXPAND_TARGETS' };
  }
  if (/activate\s+an\s+ultimate\s+trigger\s+that\s+activates\s+when\s+attacks.*as\s+this\s+ultimate's\s+ultimate\s+trigger/i.test(text)) {
    return { op: 'COPY_TRIGGER' };
  }
  if (/activate\s+one\s+of\s+the\s+\(when\s+attacks\)\s+effects\s+of\s+the\s+discarded\s+card/i.test(text) ||
      /when\s+this\s+spirit\s+is\s+depleted\/destroyed\s+by\s+an\s+opposing\s+magic\s+effect,\s*you\s+can\s+activate\s+the\s+same\s+effect/i.test(text)) {
    return { op: 'ACTIVATE_CARD_EFFECT' };
  }
  if (/activate\s+the\s+\[?soul\s+drive\]?\s+of/i.test(text) ||
      /activate\s+one\s+of\s+the\s+\[?soul\s+drive\]?\s+of/i.test(text)) {
    return { op: 'ACTIVATE_SOUL_DRIVE' };
  }

  // Effect nullification & Life Protection
  if (/(?:an?|the|every|that)?\s*(?:opposing|targeted)?\s*(?:spirit\/ultimate|spirit\/nexus|spirit|ultimate).*loses\s+(?:all\s+(?:of\s+)?)?(?:its|their)?\s*effects/i.test(text) ||
      /nexuses\s+without\s+"no\."\s+in\s+their\s+names\s+lose\s+all\s+their\s+effects/i.test(text)) {
    return { op: 'LOSE_EFFECTS' };
  }
  if (/(?:opposing\s+effects\s+can\s+only\s+gain|can\s+only\s+gain)\s+up\s+to\s+(\d+|one|two)\s+cores?\s+from\s+the\s+void\s+per\s+turn/i.test(text)) {
    return { op: 'RESTRICTION', kind: 'CORE_GAIN_LIMIT', limit: 1 };
  }
  if (/(?:that|the\s+targeted)\s+(?:spirit|spirit\/ultimate|ultimate)\s+can't\s+reduce\s+your\s+life/i.test(text) ||
      /the\s+attacks\s+of\s+opposing\s+spirits.*can't\s+reduce\s+your\s+life/i.test(text) ||
      /when\s+your\s+life\s+would\s+be\s+reduced.*your\s+life\s+is\s+not\s+reduced/i.test(text) ||
      /when\s+your\s+life\s+would\s+be\s+reduced.*your\s+life\s+isn't\s+decreased/i.test(text) ||
      /when\s+your\s+life\s+would\s+be\s+reduced.*your\s+life\s+would\s+only\s+be\s+reduced\s+by\s+one/i.test(text)) {
    return { op: 'PREVENT_LIFE_LOSS' };
  }
  if (/you\s+do\s+not\s+lose\s+the\s+game\s+even\s+if\s+your\s+life\s+becomes\s+zero/i.test(text)) {
    return { op: 'PREVENT_LOSS' };
  }
  if (/you\s+win\s+the\s+game/i.test(text)) {
    return { op: 'SPECIAL_WIN' };
  }
  if (/the\s+\(?opposing\s+main\s+step\)?\s+of\s+next\s+turn\s+doesn't\s+occur/i.test(text)) {
    return { op: 'SKIP_STEP', step: 'MAIN_STEP' };
  }

  // Soul Core Movements & Costs
  if (/(?:by\s+)?sending\s+(?:the\s+)?(?:either\s+two\s+cores\s+or\s+a\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*(?:on|from)\s+this\s+(?:spirit|ultimate|nexus)\s+to\s+your\s+(?:trash|reserve|life)/i.test(text) ||
      /(?:by\s+)?sending\s+(?:your\s+)?\[?soul\s+core\]?\s*to\s+(?:the\s+)?trash/i.test(text) ||
      /(?:by\s+)?banishing\s+(?:your\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?/i.test(text) ||
      /you\s+can\s+send\s+(?:the\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*from\s+this\s+(?:spirit|ultimate)\s+to\s+your\s+life/i.test(text) ||
      /send\s+(?:the\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*from\s+the\s+opposing\s+life\s+to\s+their\s+trash/i.test(text) ||
      /send\s+(?:the\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*from\s+your\s+trash\s+to\s+(?:this|any\s+of\s+your)\s+spirits?/i.test(text) ||
      /(?:by\s+)?sending\s+(?:the\s+)?\[?soul\s+core\]?.*from\s+this\s+nexus\s+to\s+(?:one\s+of\s+your|your)\s+spirits?/i.test(text) ||
      /you\s+can\s+send\s+(?:the\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*from\s+any\s+of\s+your\s+spirits\s+to\s+your\s+life/i.test(text) ||
      /send\s+(?:the\s+)?\[?soul\s+core\]?(?:\s*\(soul\s+core\))?\s*from\s+your\s+\[?shiny\s+hearts\]?\s+spirit\s+to\s+another\s+spirit/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }
  if (/(?:by\s+)?exchanging\s+the\s+\[?soul\s+core\]?.*on\s+your\s+life\s+with\s+one\s+of\s+the\s+cores\s+on\s+this\s+spirit/i.test(text)) {
    return { op: 'EXCHANGE_CORE' };
  }
  if (/(?:by\s+)?sending\s+(?:two\s+cores\s+or\s+the\s+\[?soul\s+core\]?|either\s+two\s+cores\s+or\s+a\s+\[?soul\s+core\]?)\s+(?:on|from)\s+this\s+spirit\s+to\s+your\s+(?:reserve|trash)/i.test(text)) {
    const toTrash = /trash/i.test(text);
    return {
      op: 'MOVE_CORE',
      count: 2,
      from: { zone: 'field', side: 'self', target: 'self' },
      to: { zone: toTrash ? 'trash' : 'reserve', side: 'self' },
      allowSoulCore: true,
      isCost: true
    };
  }
  if (/(?:by\s+)?sending\s+(?:one\s+of\s+your\s+lives|two\s+cores)\s+to\s+(?:the\s+)?trash/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 2,
      from: { zone: 'field', side: 'self' },
      to: { zone: 'trash', side: 'self' },
      isCost: true
    };
  }
  if (/(?:by\s+)?drawing\s+\d+\s+cards?/i.test(text)) {
    return { op: 'DRAW' };
  }

  // General Core Movements & Stats
  if (/send\s+any\s+amount\s+of\s+your\s+life\s+to\s+your\s+trash/i.test(text)) {
    return { op: 'MOVE_CORE', from: 'life', to: 'trash', amount: 'ANY' };
  }
  if (/send\s+up\s+to\s+(\d+|[a-z]+)\s+opposing\s+lives\s+to\s+their\s+trash/i.test(text)) {
    return { op: 'MOVE_CORE', from: 'opposing_life', to: 'trash' };
  }
  if (/send\s+an\s+opposing\s+life.*to\s+their\s+reserve/i.test(text)) {
    return { op: 'MOVE_CORE', from: 'opposing_life', to: 'reserve' };
  }
  if (/put\s+(?:a|an|one|\d+)?\s*cores?\s+from\s+(?:your\s+)?trash\s+to\s+(?:your\s+)?life/i.test(text) ||
      /put\s+(?:a|an|one|\d+)?\s*cores?\s+from\s+your\s+reserve\s+to\s+your\s+life/i.test(text) ||
      /send\s+a\s+core,\s*other\s+than\s+soul\s+core,\s*from\s+your\s+trash\s+to\s+your\s+life/i.test(text)) {
    return { op: 'BOOST_LIFE', count: 1 };
  }
  if (/send\s+every\s+core,\s*besides\s+soul\s+core,\s*from\s+your\s+trash\s+to\s+your\s+spirits/i.test(text)) {
    return { op: 'MOVE_CORE', freely: true };
  }
  if (/the\s+opponent\s+sends\s+(\d+|[a-z]+)\s+cores\s+from\s+(?:any\s+of\s+)?their\s+(?:spirits\/ultimates|spirits?|one\s+of\s+their\s+spirits\/ultimates)\s+to\s+(?:the\s+|their\s+)?(?:trash|reserve)/i.test(text)) {
    const mCount = text.match(/the\s+opponent\s+sends\s+(\d+|[a-z]+)\s+cores/i);
    const count = mCount ? parseNumber(mCount[1]) : 1;
    const toTrash = /trash/i.test(text);
    return {
      op: 'MOVE_CORE',
      count,
      from: { zone: 'field', side: 'opp' },
      to: { zone: toTrash ? 'trash' : 'reserve', side: 'opp' },
      chooser: 'opp'
    };
  }
  if (/the\s+opponent\s+sends\s+all\s+cores\s+from\s+one\s+of\s+their\s+spirits\/ultimates\s+to\s+their\s+reserve/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 'ALL',
      from: { zone: 'field', side: 'opp' },
      to: { zone: 'reserve', side: 'opp' },
      chooser: 'opp'
    };
  }
  if (/send\s+three\s+cores\s+each\s+from\s+every\s+opposing\s+spirit\s+to\s+the\s+reserve/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 3,
      forEachTarget: true,
      from: { zone: 'field', side: 'opp', types: ['Spirit'] },
      to: { zone: 'reserve', side: 'opp' }
    };
  }
  if (/move\s+cores\s+among\s+the\s+targeted\s+spirits\/ultimates\s+in\s+any\s+way\s+you\s+like/i.test(text)) {
    return { op: 'MOVE_CORE', freely: true };
  }
  if (/the\s+cores\s+on\s+the\s+opposing\s+spirits.*are\s+sent\s+to\s+void/i.test(text)) {
    return { op: 'SEND_CORE_TO_VOID' };
  }
  const lifeRepMatch = text.match(/when\s+the\s+opposing\s+life\s+is\s+reduced,\s*the\s+core\s+.*is\s+sent\s+to\s+the\s+(trash|void)\s+(?:instead\s+of|rather\s+than)\s+the\s+reserve/i);
  if (lifeRepMatch) {
    return { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: lifeRepMatch[1].toLowerCase(), side: 'opp' };
  }
  if (/cores\s+sent\s+to\s+the\s+opposing\s+reserve.*are\s+sent\s+to\s+opposing\s+trash\s+instead/i.test(text) ||
      /cores\s+are\s+sent\s+to\s+the\s+opposing\s+trash\s+instead/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', replaces: 'LIFE_CORE', replacementZone: 'trash', side: 'opp' };
  }
  if (/when\s+a\s+player\s+would\s+increase\s+core\s+from\s+the\s+void.*instead\s+of\s+the\s+void/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT' };
  }
  if (/the\s+bp\s+of\s+every\s+opposing\s+spirit\/ultimate\s+becomes\s+0/i.test(text) ||
      /the\s+bp\s+of\s+all\s+opposing\s+spirits\s+become\s+0/i.test(text) ||
      /an?\s+opposing\s+spirit's\/ultimate's\s+bp\s+becomes\s+\d+\s*bp/i.test(text) ||
      /the\s+lv\d+\s+bp\s+of\s+every\s+opposing\s+spirit\s+becomes\s+\d+/i.test(text)) {
    return { op: 'SET_BP' };
  }
  if (/all\s+opposing\s+spirits\s+become\s+lv\d+/i.test(text)) {
    return { op: 'SET_LEVEL' };
  }
  if (/count\s+this\s+nexus\s+as\s+being\s+(\d+|[a-z]+)\s+nexuses/i.test(text)) {
    return { op: 'COUNT_AS_MULTIPLE' };
  }

  // Modify Effects & Card Rules
  if (/this\s+effect\s+(?:draws|sends|discards|reveals|destroys)\s+[+\-]?\d+\s+(?:cards?|hand)/i.test(text) ||
      /this\s+effect\s+sends\s+\+\d+\s+core/i.test(text) ||
      /this\s+effect\s+sends\s+three\s+cores\s+to\s+trash\s+instead/i.test(text) ||
      /two\s+spirits\/ultimates\s+are\s+targeted\s+by\s+this\s+effect/i.test(text) ||
      /the\s+number\s+of\s+cards\s+revealed\s+by\s+this\s+effect\s+becomes\s+(\d+|[a-z]+)/i.test(text) ||
      /the\s+number\s+of\s+cores\s+put\s+to\s+your\s+life.*becomes\s+(\d+|[a-z]+)/i.test(text) ||
      /reveal\s+three\s+cards\s+instead/i.test(text) ||
      /your\s+"opposing-deck-discarding"\s+effect\s+discards\s+\+\d+\s+card/i.test(text) ||
      /your\s+\[mealtiply\]\s+reveals\s+\+\d+\s+card/i.test(text) ||
      /this\s+effect's\s+"bp\s+decrease\s+effect"\s+-\d+\s+further/i.test(text) ||
      /when\s+(\d+|[a-z]+)\s+or\s+more\s+cards\s+would\s+be\s+discarded.*amount\s+to\s+be\s+discarded\s+is\s+changed\s+to/i.test(text)) {
    return { op: 'MODIFY_EFFECT' };
  }
  if (/activate\s+this\s+effect\s+(\d+|[a-z]+)\s+times/i.test(text) ||
      /you\s+can\s+activate\s+(?:that|this)\s+effect\s+once\s+and\s+only\s+once\s+(?:more|again)/i.test(text) ||
      /activate\s+(?:that\s+spirit's|this\s+spirit's|the\s+same)\s+\[?(?:mealtiply|friend)\]?\s+once\s+and\s+only\s+once\s+more/i.test(text) ||
      /activate\s+(?:the\s+|this\s+spirit's\s+)?\[?(?:mealtiply|friend)\]?/i.test(text) ||
      /activate\s+(?:one\s+of\s+your\s+spirits'\s+)?\(when\s+depleted\/destroyed\s+by\s+the\s+opponent\)\s+effects\s+without\s+it\s+being/i.test(text) ||
      /activate\s+(?:the\s+|this\s+spirit's\s+)?\(when\s+advents\)\s+effect/i.test(text) ||
      /activate\s+a\s+\(when\s+attacks\)\s+effect\s+of\s+an\s+opposing\s+spirit\s+as\s+this\s+spirit's\s+effect/i.test(text)) {
    return { op: 'ACTIVATE_CARD_EFFECT' };
  }

  // Turn & Steps
  if (/your\s+core\s+step\s+occurs\s+twice\s+in\s+a\s+row/i.test(text) ||
      /when\s+this\s+turn\s+ends,\s*\(your\s+turn\)\s+occurs\s+one\s+more\s+time/i.test(text) ||
      /if\s+it\s+is\s+the\s+\(?opposing\s+turn\)?,?\s*end\s+that\s+turn/i.test(text) ||
      /^(?:immediately\s+)?end\s+that\s+turn$/i.test(text)) {
    return { op: 'EXTRA_TURN' };
  }
  if (/your\s+flash\s+timing\s+occurs\s+first/i.test(text)) {
    return { op: 'FLASH_PRIORITY' };
  }

  // Deck Building Rules & Deck Ops
  if (/you\s+can\s+put\s+any\s+(?:number|amount)\s+(?:of\s+copies\s+)?of\s+.*in\s+(?:your\s+)?deck/i.test(text)) {
    return { op: 'DECK_BUILDING_RULE' };
  }
  if (/reveal\s+cards\s+from\s+(?:the\s+)?(?:your\s+)?decktop\s+until\s+/i.test(text)) {
    return { op: 'REVEAL_DECKTOP', until: true };
  }
  if (/reveal\s+up\s+to\s+(\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop/i.test(text) ||
      /you\s+can\s+reveal\s+(\d+|[a-z]+)\s+cards\s+from\s+(?:the\s+)?(?:your\s+)?decktop/i.test(text)) {
    const rMatch = text.match(/reveal\s+(?:up\s+to\s+)?(\d+|[a-z]+)\s+cards/i);
    return { op: 'REVEAL_DECKTOP', count: rMatch ? parseNumber(rMatch[1]) : 5, upTo: true };
  }
  if (/discard\s+a\s+card\s+from\s+among\s+them/i.test(text) ||
      /discard\s+a\s+magic\s+card\s+or\s+a\s+spirit\s+card\s+with\s+\[?accel\]?\s+among\s+them/i.test(text)) {
    return { op: 'DISCARD_REVEALED', count: 1 };
  }
  if (/discard\s+any\s+(?:unsummoned\s+and\s+)?remaining\s+cards/i.test(text)) {
    return { op: 'DISCARD_REMAINING' };
  }
  if (/flip\s+open\s+the\s+top\s+card\s+of\s+your\s+deck\s+or\s+the\s+opposing\s+deck/i.test(text)) {
    return { op: 'REVEAL_DECKTOP', count: 1 };
  }
  if (/you\s+can\s+look\s+at\s+the\s+(?:top\s+(\d+|[a-z]+)\s+cards|contents\s+of\s+(\d+|[a-z]+)\s+cards)\s+(?:from|of)\s+(?:the\s+)?(?:your\s+)?(?:deck|decktop)/i.test(text) ||
      /instead\s+of\s+drawing,\s*you\s+can\s+look\s+at\s+the\s+contents\s+of\s+(\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop/i.test(text)) {
    return { op: 'LOOK_DECKTOP' };
  }
  if (/you\s+can\s+send\s+any\s+number\s+of\s+them\s+to\s+your\s+deckbottom/i.test(text)) {
    return { op: 'RETURN_DECK_BOTTOM' };
  }
  if (/each\s+player\s+reveals\s+a\s+card\s+from\s+their\s+decktop/i.test(text)) {
    return { op: 'REVEAL_DECKTOP', count: 1 };
  }
  if (/send\s+(\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop\s+to\s+(?:the\s+)?trash/i.test(text)) {
    const sMatch = text.match(/send\s+(\d+|[a-z]+)\s+cards/i);
    return { op: 'MILL', count: sMatch ? parseNumber(sMatch[1]) : 1, side: 'self' };
  }

  // Hand & Discard Ops
  if (/(?:by\s+)?discarding\s+(?:all\s+cards\s+in\s+your\s+hand|the\s+entire\s+opposing\s+hand)/i.test(text) ||
      /(?:you\s+can\s+)?discard\s+(?:their|the)\s+entire\s+opposing\s+hand/i.test(text)) {
    return { op: 'DISCARD_HAND', all: true };
  }
  if (/the\s+opponent\s+draws\s+(\d+|[a-z]+)\s+cards/i.test(text)) {
    return { op: 'DRAW', target: 'opponent' };
  }
  if (/when\s+either\s+player's\s+hand\s+becomes\s+(\d+|[a-z]+)\s+or\s+more,\s*the\s+player\s+must\s+discard/i.test(text)) {
    return { op: 'DISCARD_HAND_MAX' };
  }
  if (/(?:you\s+can\s+)?discard\s+their\s+entire\s+hand/i.test(text)) {
    return { op: 'DISCARD_HAND', target: 'opp', count: 'ALL' };
  }
  if (/look\s+at\s+the\s+(?:contents\s+of\s+the\s+)?(?:entire\s+opposing\s+hand|opposing\s+entire\s+hand)/i.test(text)) {
    return { op: 'LOOK_HAND', target: 'opponent' };
  }
  if (/you\s+can\s+show\s+(?:to\s+)?the\s+opponent,?\s*.*from\s+your\s+hand/i.test(text)) {
    return { op: 'REVEAL_HAND' };
  }

  // Field Magic & Placements
  if (/(?:by\s+)?discard(?:ing)?\s+(?:one|a)\s+\[song\]\s+magic\s+card\s+(?:on|from)\s+(?:your|the\s+opposing)\s+field/i.test(text)) {
    return { op: 'DISCARD_FIELD_MAGIC', family: 'Song' };
  }
  if (/you\s+can\s+put\s+this\s+(?:magic\s+)?card\s+on\s+your\s+field/i.test(text)) {
    return { op: 'OPEN_ZONE', zone: 'FIELD' };
  }
  if (/(?:by\s+)?putting\s+(?:a\s+\[song\]\s+magic\s+card|one\s+card\s+from\s+your\s+decktop\s+facedown)\s+.*(?:onto|to)\s+the\s+field/i.test(text)) {
    return { op: 'PUT_FACEDOWN_FIELD' };
  }
  if (/(?:by\s+)?putting\s+an\s+ultimate\s+card\s+from\s+your\s+hand\s+face-up\s+onto\s+your\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVE_FROM_GAME' };
  }
  if (/(?:by\s+)?discard(?:ing)?\s+a\s+(?:spirit\s+)?card\s+from\s+(?:your\s+removed\s+zone|the\s+opposing\s+removed\s+zone)/i.test(text)) {
    return { op: 'DISCARD_CARD', from: 'removed_zone' };
  }

  // Advent & Underneath Ops
  if (/stack\s+this\s+card\s+from\s+(?:your\s+)?hand\s+onto\s+your\s+target\s+(?:spirit|ultimate)/i.test(text) ||
      /stack\s+it\s+via\s+\[?advent\]?/i.test(text) ||
      /you\s+can\s+\[?advent\]?\s+a\s+[A-Za-z]+\s+spirit\s+card\s+from\s+your\s+hand\s+onto\s+(?:a|any\s+of\s+your)\s+[A-Za-z\s]+\s+spirit/i.test(text) ||
      /you\s+can\s+stack\s+a\s+[A-Za-z]+\s+card\s+from\s+your\s+hand\s+onto\s+this\s+spirit\s+via\s+\[?advent\]?/i.test(text) ||
      /you\s+can\s+also\s+stack\s+this\s+spirit\s+card.*via\s+\[?advent\]?/i.test(text) ||
      /this\s+card\s+can\s+\[?advent\]?\s+from\s+the\s+removed\s+zone/i.test(text) ||
      /during\s+the\s+\(?opposing\s+end\s+step\)?,?\s*you\s+can\s+stack\s+this\s+spirit\s+card.*via\s+\[?advent\]?/i.test(text)) {
    return { op: 'ADVENT' };
  }
  if (/you\s+can\s+add\s+this\s+spirit\s+as\s+a\s+pre-advent\s+card\s+(?:to|beneath)\s+/i.test(text) ||
      /you\s+can\s+add\s+any\s+number\s+of\s+.*(?:as\s+pre-advent\s+cards\s+(?:beneath|underneath|to)|to\s+beneath\s+.*as\s+pre-advent\s+cards)/i.test(text) ||
      /you\s+can\s+add\s+this\s+card\s+as\s+a\s+pre-advent\s+card\s+to\s+one\s+of\s+your\s+spirits\s+with\s+\[?advent\]?/i.test(text)) {
    return { op: 'PUT_UNDERNEATH' };
  }
  if (/(?:by\s+)?discard(?:ing)?\s+(?:one|two|three|\d+|any\s+number\s+of|a)\s+(?:of\s+this\s+spirit's\s+[A-Za-z]+\s+|"[^"]+"\s*-named\s+)?pre-advent\s+cards?(?:\s+(?:beneath|under(?:neath)?|under)\s+this\s+spirit)?/i.test(text) ||
      /you\s+can\s+discard\s+up\s+to\s+(\d+|[a-z]+)\s+pre-advent\s+cards\s+beneath\s+this\s+spirit/i.test(text)) {
    return { op: 'DISCARD_PRE_ADVENT' };
  }
  if (/when\s+your\s+.*spirit\s+would\s+activate\s+its\s+\(when\s+advents\)\s+effect/i.test(text)) {
    return { op: 'BEFORE_ADVENT_TRIGGER' };
  }
  if (/(?:if\s+it\s+was\s+in\s+battle,\s*)?the\s+battle\s+continues/i.test(text)) {
    return { op: 'CONTINUE_BATTLE' };
  }
  if (/exchange\s+the\s+battling\s+spirit's\/ultimate's\s+bps/i.test(text)) {
    return { op: 'EXCHANGE_BP' };
  }
  if (/can\s+only\s+block\s+with\s+spirits\/ultimates\s+whose\s+levels\s+add\s+to\s+a\s+total/i.test(text)) {
    return { op: 'COMBAT_RESTRICTION' };
  }
  if (/(?:when.*blocked,?\s*)?choose\s+(?:an?|one|\d+)\s+(?:opposing\s+)?(?:spirit|ultimate|spirit\/ultimate)\s+to\s+battle\s+against/i.test(text)) {
    return { op: 'CHOOSE_BATTLE_TARGET' };
  }

  // Bunshin & Poison Blade
  if (/(?:by\s+)?placing\s+up\s+to\s+four\s+cards\s+from\s+your\s+decktop\s+onto\s+the\s+field\s+facedown/i.test(text)) {
    return { op: 'CREATE_BUNSHIN', count: 4 };
  }
  if (/flip\s+one\s+of\s+your\s+bunshin\s+spirits\s+face-up/i.test(text)) {
    return { op: 'FLIP_BUNSHIN' };
  }
  if (/this\s+spirit's\s+\[?poison\s+blade\]?\s+puts\s+\+\d+\s+card/i.test(text)) {
    return { op: 'MODIFY_KEYWORD', keyword: 'Poison Blade' };
  }
  if (/activate\s+(?:three\s+of\s+your\s+spirits'|the)\s+\[?poison\s+blade\]?/i.test(text)) {
    return { op: 'ACTIVATE_KEYWORD', keyword: 'Poison Blade' };
  }
  if (/this\s+spirit's\s+\[?on\s+stage\]?\s+draws\s+\+\d+\s+cards?/i.test(text)) {
    return { op: 'MODIFY_KEYWORD', keyword: 'On Stage' };
  }

  // Family, Color & Ability Grants
  if (/give\s+this\s+spirit\s+\[shiny\s+hearts\]\s+and\s+\[absolutes\]/i.test(text)) {
    return { op: 'ADD_FAMILY', families: ['Shiny Hearts', 'Absolutes'] };
  }
  if (/give\s+all\s+of\s+your\s+spirits\s+with\s+\[?spirit\s+soul\]?:\s*\[?([^\]\.]+)\]?/i.test(text)) {
    return { op: 'GRANT_ABILITY' };
  }
  if (/give\s+this\s+spirit\s+the\s+\[?ultra\s+armor\]?\s+of\s+all\s+your/i.test(text) ||
      /give\s+all\s+your\s+spirits\s+with\s+\[?friend\]?\s+the\s+effect/i.test(text) ||
      /give\s+all\s+your\s+purple\s+spirit\s+cards.*this\s+spirit's\s+\[?accel\]?/i.test(text) ||
      /this\s+spirit\s+gains\s+the\s+\(when\s+attacks\)\s+effects\s+of\s+all\s+.*cards\s+in\s+your\s+trash/i.test(text) ||
      /the\s+\(when\s+summoned\)\s+effects\s+of\s+.*spirits\s+you\s+control\s+become\s+\(when\s+attacks\)\s+effects/i.test(text)) {
    return { op: 'COPY_ABILITY' };
  }
  if (/this\s+spirit\s+gains\s+\[heavy\s+armor:\s*blue\]/i.test(text)) {
    return { op: 'GRANT_ABILITY', ability: 'Heavy Armor: Blue' };
  }
  if (/give\s+(?:every|all)\s+.*spirits?\s*(?:you\s+control\s*)?:\s*([A-Za-z\/]+)/i.test(text) ||
      /this\s+spirit\s+gains\s+(?:purple|red|blue|white|green|yellow)/i.test(text)) {
    return { op: 'ADD_COLOR' };
  }

  // Restrictions & Swaps & Banishes
  if (/neither\s+player\s+can\s+use\s+\[?accel\]?\s+from\s+(?:their\s+)?hand/i.test(text) ||
      /opponent\s+can't\s+use\s+\[?accel\]?\s+from\s+(?:their\s+)?hand/i.test(text) ||
      /either\s+player\s+can\s+only\s+use\s+\[?accel\]?\s+from\s+(?:the\s+)?hand\s+once\s+per\s+turn/i.test(text) ||
      /magic\s+card\/\[?accel\]?\s+can\s+only\s+be\s+used\s+once\s+per\s+turn/i.test(text) ||
      /only\s+"[A-Za-z0-9\s]+"-named\s+cards\s+can\s+be\s+\[?advented\]?\s+onto\s+this\s+spirit/i.test(text) ||
      /opponent\s+can't\s+\[?seal:\s*seal\]?\s+for\s+the\s+rest\s+of\s+the\s+game/i.test(text) ||
      /only\s+up\s+to\s+(\d+|[a-z]+)\s+cards\s+can\s+be\s+discarded\s+(?:from\s+either\s+player's\s+deck|each\s+turn)/i.test(text) ||
      /opposing\s+"deck-discarding"\s+effects\s+can't\s+discard\s+cards/i.test(text) ||
      /that\s+card\s+(?:doesn't|can't)\s+(?:move|leave)\s+(?:from\s+)?the\s+trash/i.test(text) ||
      /this\s+effect\s+can't\s+bring\s+the\s+number\s+of\s+cores.*to\s+zero/i.test(text) ||
      /any\s+\(when\s+summoned\)\s+effects\s+of\s+the\s+spirits\s+don't\s+activate/i.test(text) ||
      /neither\s+player's\s+deck\s+can\s+be\s+discarded\s+from/i.test(text) ||
      /neither\s+player\s+can\s+increase\s+their\s+hand\s+from\s+the\s+deck/i.test(text) ||
      /(?:the\s+)?opponent\s+can't\s+use\s+cards\s+from\s+their\s+hand/i.test(text) ||
      /the\s+moving\s+of\s+core\s+upon\s+separation\s+is\s+decided\s+by\s+the\s+opponent/i.test(text) ||
      /while\s+this\s+card\s+is\s+in\s+your\s+removed\s+zone,\s*opposing\s+effects\s+can\s+only\s+gain\s+up\s+to\s+one\s+core/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/you\s+can\s+(?:swap|switch)\s+this\s+(?:card|spirit)\s+(?:from\s+hand\s+)?with\s+(?:an?\s+)?(?:exactly-named\s+)?"[A-Za-z0-9\s\-]+"\s+(?:spirit\s+)?/i.test(text)) {
    return { op: 'SWAP_CARD' };
  }
  if (/banish\s+(?:every\s+card\s+of\s+that\s+type|two\s+cards|\d+\s+cards)\s+(?:on|from|in)\s+.*trash/i.test(text)) {
    return { op: 'BANISH_TRASH' };
  }
  if (/the\s+cores\s+next\s+to\s+your\s+deck\s+can\s+only\s+be\s+used\s+by\s+this\s+spirit's\s+effect/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/send\s+one\s+of\s+the\s+cores\s+besides\s+your\s+deck\s+to\s+the\s+void\s+or\s+a\s+nexus\s+you\s+control/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, from: { zone: 'deck_side' }, to: { zone: 'choice_void_or_nexus' } };
  }
  if (/target(?:ed)?\s+(?:an?|one)\s+.*(?:spirit|ultimate|brave|nexus)/i.test(text) ||
      /target\s+a\s+type\s+of\s+card/i.test(text) ||
      /you\s+can\s+target\s+the\s+opposing\s+spirit\s+for\s+your\s+\[?showdown\]?/i.test(text) ||
      /you\s+can\s+target\s+up\s+to\s+two\s+opposing\s+spirits\s+and\s+simultaneously\s+battle/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }
  if (/this\s+spirit\s+can\s+remain\s+on\s+the\s+field\s+in\s+the\s+same\s+condition/i.test(text) ||
      /it\s+remains\s+on\s+field\s+in\s+the\s+same\s+state/i.test(text) ||
      /spirits\s+that\s+have\s+cores\s+sent\s+to\s+them.*remain\s+on\s+the\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/you\s+can\s+use\s+this\s+magic\s+card\s+from\s+the\s+hand/i.test(text) ||
      /you\s+can\s+also\s+use\s+this\s+card's\s+\[?accel\]?\s+from\s+the\s+trash/i.test(text)) {
    return { op: 'CARD_PLAY_PERMISSION' };
  }
  if (/when\s+the\s+opposing\s+\[?soul\s+core\]?\s+is\s+sent\s+to\s+the\s+opposing\s+trash/i.test(text) ||
      /when\s+cores\s+are\s+added\s+from\s+the\s+void\s+via\s+your\s+green\s+effect/i.test(text) ||
      /by\s+opposing\s+spirits\s+via\s+bp\s+comparison/i.test(text)) {
    return { op: 'TRIGGER_CONDITION' };
  }
  if (/you\s+can\s+also\s+choose\s+opposing\s+spirit\s+cards\s+via\s+\[?plunder\]?/i.test(text)) {
    return { op: 'MODIFY_KEYWORD', keyword: 'Plunder' };
  }

  // Typo header fallback
  if (/^\(?your attacks step\)?$/i.test(text) || /\(opposing turn\)$/i.test(text)) {
    return { op: 'HEADER' };
  }

  // --- Phase 11 Patterns ---
  // Pre-Advent underneath & card attaching
  if (/(?:you\s+can\s+)?add\s+.*as\s+pre-advent\s+cards?\s+(?:underneath|beneath)\s+(?:this|that)\s+spirit/i.test(text) ||
      /(?:you\s+can\s+)?add\s+.*(?:to\s+)?(?:underneath|beneath)\s+(?:this|that|that\s+now-reborn)\s+(?:spirit|card)\s+as\s+a\s+pre-advent\s+card/i.test(text) ||
      /add\s+.*to\s+(?:underneath|beneath)\s+that\s+spirit\s+as\s+a\s+pre-advent\s+card/i.test(text) ||
      /(?:by\s+)?discarding\s+(?:one|\d+)\s+pre-advent\s+magic\s+card\s+underneath\s+this\s+spirit/i.test(text) ||
      /underneath\s+(?:this|that)\s+spirit\s+as\s+a\s+pre-advent\s+card/i.test(text)) {
    return { op: 'ATTACH_PRE_ADVENT_CARD' };
  }

  // Target cards in Hand/Removed Zone/Field
  if (/target\s+(?:\d+|[a-z]+)\s+cards\s+in\s+their\s+hand\/removed\s+zone\/field/i.test(text)) {
    return { op: 'TARGET_CARDS' };
  }

  // Advent condition modification
  if (/change\s+the\s+condition\s+to:?\s*\[?(?:adcon|advent condition):?[^\]]+\]?/i.test(text)) {
    return { op: 'MODIFY_ADVENT_CONDITION' };
  }

  // Removed zone operations & Discards
  if (/discard\s+every\s+card\s+on\s+the\s+opposing\s+removed\s+zone/i.test(text) ||
      /banish\s+all\s+cards\s+in\s+your\s+hand\/removed\s+zone/i.test(text) ||
      /put\s+this\s+(?:card|spirit)\s+(?:face-up\s+on|onto)\s+(?:the|your)\s+remove[d]?\s+zone/i.test(text) ||
      /send\s+(?:\d+|two|three|[a-z]+)\s+opposing\s+spirits\/ultimates\s+to\s+the\s+removed\s+zone/i.test(text) ||
      /(?:by\s+)?discarding\s+this\s+card\s+from\s+your\s+removed\s+zone/i.test(text) ||
      /this\s+card\s+can\s+also\s+\[?advent\]?\s+from\s+the\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVED_ZONE_ACTION' };
  }

  // Trash banishing
  if (/banish\s+(?:all|up\s+to\s+(?:\d+|[a-z]+)\s+cards?|a\s+card|all\s+.*cards?)\s+(?:from|on|in)\s+the\s+opposing\s+trash/i.test(text) ||
      /banish\s+all\s+cards\s+on\s+the\s+opposing\s+trash/i.test(text)) {
    return { op: 'BANISH_TRASH' };
  }

  // Grandwalker Nexus core moves & modifications
  if (/\+\d+\s+cores?(?:\s+each)?\s+to\s+(?:every|one|any)\s+.*grandwalker\s+nexus(?:es)?/i.test(text) ||
      /for\s+each\s+"[^"]+"\/"[^"]+"\s+among\s+them,\s*\+\d+\s+core\s+to\s+any\s+.*grandwalker\s+nexus(?:es)?/i.test(text) ||
      /(?:by\s+)?putting\s+(?:\d+|[a-z]+)\s+cores?\s+from\s+any\s+(?:of\s+your\s+)?.*grandwalker\s+nexus(?:es)?(?:\s+you\s+control)?\s+to\s+this\s+(?:spirit|ultimate)/i.test(text) ||
      /the\s+\[grand\s+skill:\s*\d+\]\s+of\s+all\s+your\s+exactly-named\s+"[^"]+"\s+becomes\s+\[grand\s+skill:\s*\d+\]/i.test(text) ||
      /the\s+\[grand\s+field\]\s+of\s+one\s+of\s+your\s+exactly-named\s+"[^"]+"\s+can\s+target\s+(?:\d+|[a-z]+)\s+spirits/i.test(text) ||
      /the\s+number\s+of\s+cores\s+sent\s+to\s+the\s+void\s+by\s+the\s+\[grand\s+skill\]\s+of\s+all\s+your\s+exactly-named\s+"[^"]+"\s+gets\s+-\d+/i.test(text)) {
    return { op: 'GRANDWALKER_ACTION' };
  }

  // Assault text substitution
  if (/change\s+the\s+"nexus"\s+(?:text\s+of\s+this\s+spirit's\s+\[assault\]|written\s+on\s+your\s+"assault"-named\s+effects)\s+to\s+"nexus\/grandwalker\s+nexus\.?"/i.test(text)) {
    return { op: 'MODIFY_KEYWORD', keyword: 'Assault' };
  }

  // Core / Card destination modifications
  if (/cores?(?:\s+on\s+the\s+spirit\/ultimate\s+destroyed\s+by\s+this\s+effect)?\s+are\s+sent\s+to\s+the\s+(?:trash|void),\s*not\s+the\s+reserve/i.test(text) ||
      /when\s+(?:summoned\s+via\s+\[dna\s+digivolution\],\s*)?the\s+cores\s+of\s+the\s+spirit\s+destroyed\s+by\s+this\s+effect\s+are\s+sent\s+to\s+the\s+(?:trash|void),\s*not\s+the\s+reserve/i.test(text) ||
      /when\s+the\s+opposing\s+life\s+is\s+reduced,\s*the\s+cores?\s+(?:are|is)\s+sent\s+to\s+the\s+(?:trash|void),\s*not\s+the\s+reserve/i.test(text) ||
      /when\s+this\s+spirit's\s+attack\s+reduces\s+the\s+opposing\s+life,\s*besides\s+\[soul\s+core\],\s*the\s+core\s+from\s+life\s+is\s+sent\s+to\s+the\s+void,\s*not\s+the\s+reserve/i.test(text) ||
      /the\s+spirit\/ultimate\s+depleted\s+by\s+this\s+effect\s+is\s+banished,\s*not\s+sent\s+to\s+the\s+trash/i.test(text) ||
      /cores\s+to\s+be\s+sent\s+to\s+the\s+trash\s+via\s+this\s+effect\s+are\s+sent\s+to\s+the\s+void\s+instead/i.test(text)) {
    return { op: 'MODIFY_DESTINATION' };
  }

  // Life operations and modifications
  if (/(?:by\s+)?sending\s+(?:one|\d+|[a-z]+)\s+of\s+your\s+lives\s+to\s+(?:your\s+trash|any\s+of\s+your\s+spirits)/i.test(text) ||
      /send\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+opposing\s+lives?\s+to\s+(?:their\s+)?reserve/i.test(text) ||
      /send\s+(?:one|\d+|[a-z]+)\s+of\s+your\s+lives\s+to\s+your\s+trash/i.test(text) ||
      /when\s+your\s+life\s+would\s+be\s+reduced\s+by\s+two\s+or\s+more\s+at\s+once\s+by\s+the\s+opponent,\s*only\s+one\s+would\s+be\s+reduced/i.test(text) ||
      /if\s+that\s+card\s+is\s+a\s+yellow\s+magic\s+card,\s*your\s+life\s+isn't\s+reduced/i.test(text) ||
      /your\s+life\s+isn't\s+reduced/i.test(text) ||
      /you\s+can\s+send\s+this\s+spirit's\s+\[soul\s+core\]\s+to\s+the\s+life/i.test(text) ||
      /you\s+can\s+exchange\s+one\s+of\s+your\s+life\s+cores\s+for\s+\[soul\s+core\]\s+on\s+your\s+reserve/i.test(text) ||
      /the\s+opponent\s+can't\s+put\s+cores,\s*besides\s+\[soul\s+core\],\s*to\s+the\s+life\s+via\s+effects/i.test(text) ||
      /when\s+your\s+life\s+is\s+reduced\s+by\s+the\s+attack\s+of\s+opposing\s+spirits\/ultimates,\s*discard\s+this\s+card/i.test(text)) {
    return { op: 'MODIFY_LIFE' };
  }

  // Deck operations & rules
  if (/you\s+can\s+reveal\s+.*(?:cards?|top\s+card)\s+from\s+(?:either\s+)?(?:your|the\s+opposing)\s+deck/i.test(text) ||
      /you\s+can\s+reveal\s+the\s+top\s+card\s+of\s+your\s+deck/i.test(text) ||
      /send\s+(?:\d+|[a-z]+)\s+cards\s+from\s+the\s+opposing\s+decktop\s+to\s+the\s+trash/i.test(text) ||
      /remturn\s+any\s+remaining\s+card\s+to\s+the\s+deckbottom\s+in\s+any\s+order/i.test(text) ||
      /remaining\s+cards\s+are\s+discarded/i.test(text) ||
      /that\s+card\s+can't\s+move\s+from\s+your\s+deck/i.test(text) ||
      /you\s+can\s+(?:add|put)\s+up\s+to\s+\d+\s+copies\s+of\s+this\s+card\s+(?:to|in)\s+(?:your\s+)?deck/i.test(text) ||
      /the\s+effect\s+of\s+your\s+exactly-named\s+"[^"]+"\s+sends\s+\+\d+\s+cards\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'DECK_ACTION' };
  }

  // Advent rules & conditions
  if (/after\s+your\s+\[accel\]\s+effect\s+resolves,\s*you\s+can\s+stack\s+this\s+spirit\s+card\s+from\s+the\s+hand\s+onto\s+your\s+spirits\s+via\s+\[advent\]/i.test(text) ||
      /both\s+players\s+can\s+only\s+\[advent\]\s+onto\s+spirits\s+with\s+exactly\s+the\s+same\s+colors/i.test(text) ||
      /you\s+can\s+\[advent\]\s+yellow\s+spirit\s+cards\s+onto\s+this\s+ultimate/i.test(text) ||
      /(?:during\s+this\s+turn,\s*)?the\s+opponent\s+can't\s+use\s+\[soul\s+core\]\s+to\s+\[advent\]/i.test(text) ||
      /you\s+can\s+also\s+stack\s+this\s+card\s+from\s+the\s+trash\s+via\s+\[advent\]/i.test(text)) {
    return { op: 'ADVENT_RULE' };
  }

  // Steps / Battles / Turns
  if (/immediately\s+end\s+this\s+battle/i.test(text)) {
    return { op: 'END_BATTLE' };
  }
  if (/this\s+extra\s+turn\s+has\s+no\s+main\s+step/i.test(text)) {
    return { op: 'SKIP_STEP', step: 'MAIN_STEP' };
  }
  if (/\(opposing\s+attack\s+step\)\s+doesn't\s+occur\s+for\s+the\s+opponent\s+the\s+next\s+turn/i.test(text)) {
    return { op: 'SKIP_STEP', step: 'ATTACK_STEP' };
  }
  if (/(?:if\s+it's\s+\(?opposing\s+turn\)?,?\s*)?end\s+the\s+turn/i.test(text)) {
    return { op: 'END_TURN' };
  }

  // Gain family
  if (/this\s+card\/spirit\s+gains\s+the\s+(?:following\s+families|"[^"]+"(?:\/"[^"]+")*\s+families)/i.test(text)) {
    return { op: 'GAIN_FAMILY' };
  }

  // Miscellaneous Phase 11
  if (/every\s+spirit\s+summoned\s+by\s+this\s+effect\s+is\s+destroyed\s+during\s+this\s+turn's\s+end\s+step/i.test(text)) {
    return { op: 'SCHEDULED_DESTROY', timing: 'END_STEP' };
  }
  if (/your\s+spirits'\s+.*activate\s+ignoring\s+their\s+conditions/i.test(text)) {
    return { op: 'IGNORE_CONDITIONS' };
  }
  if (/(?:during\s+this\s+turn,\s*)?(?:the\s+)?(?:lv1\/lv2|\[?lv\d+\]?)\s+bp\s+of\s+all\s+opposing\s+spirits\s+becomes\s+\d+\s+bp/i.test(text)) {
    return { op: 'SET_BP' };
  }
  if (/activate\s+this\s+spirit's\s+\[dragonshot\]/i.test(text)) {
    return { op: 'ACTIVATE_KEYWORD', keyword: 'Dragonshot' };
  }
  if (/the\s+number\s+of\s+cores\s+on\s+this\s+spirit\s+cannot\s+become\s+less\s+than\s+one/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/(?:if\s+you\s+banish\s+the\s+\[soul\s+core\]\s+on\s+this\s+ultimate\s+from\s+the\s+game,\s*)?send\s+(?:\d+|[a-z]+)\s+cores?\s+each\s+from\s+every\s+opposing\s+spirit\s+to\s+the\s+void/i.test(text)) {
    return { op: 'BANISH_SOUL_CORE_VOID' };
  }
  if (/when\s+this\s+spirit\s+is\s+blocked,\s*choose\s+one\s+to\s+battle\s+with/i.test(text)) {
    return { op: 'CHOOSE_BLOCKER' };
  }
  if (/send\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores,\s*other\s+than\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text) ||
      /send\s+every\s+core,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'RETRIEVE_CORES' };
  }
  if (/you\s+can\s+send\s+the\s+\[soul\s+core\]\s+from\s+this\s+spirit\s+to\s+your\s+attacking\s+spirit/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE', count: 1, from: { zone: 'field', side: 'self', target: 'self' }, to: { zone: 'field', side: 'self', target: 'attacking' } };
  }
  if (/when\s+this\s+card\s+is\s+revealed\s+from\s+the\s+deck,\s*you\s+can\s+use\s+its\s+\[accel\]/i.test(text)) {
    return { op: 'USE_ACCEL' };
  }
  if (/when\s+counting\s+the\s+number\s+of\s+spirits\s+for\s+your\s+spirit\s+effects,\s*count\s+this\s+spirit\s+as\s+(?:\d+|[a-z]+)\s+spirits/i.test(text)) {
    return { op: 'COUNT_MODIFIER' };
  }
  if (/when\s+this\s+card\s+is\s+revealed\s+by\s+your\s+\[friend\],\s*you\s+can\s+(?:add\s+)?it\s+to\s+the\s+hand/i.test(text)) {
    return { op: 'ADD_TO_HAND' };
  }
  if (/this\s+spirit's\s+\[friend\]\s+becomes\s+\[friend:\s*[^\]]+\]/i.test(text)) {
    return { op: 'MODIFY_KEYWORD', keyword: 'Friend' };
  }
  if (/choose\s+one\s+color/i.test(text)) {
    return { op: 'CHOOSE_COLOR' };
  }
  if (/(?:these|this)\s+effects?\s+(?:don't|doesn't)\s+stack/i.test(text)) {
    return { op: 'NON_STACKABLE' };
  }
  if (/(?:if\s+you\s+control\s+no\s+spirits,\s*)?(?:you\s+can\s+)?set\s+this\s+card/i.test(text)) {
    return { op: 'SET_BURST' };
  }
  if (/(?:if\s+possible,\s*)?that\s+spirit\/ultimate\s+must\s+block/i.test(text)) {
    return { op: 'FORCE_BLOCK' };
  }
  if (/put\s+this\s+card\s+on\s+your\s+field,\s*and\s+its\s+effect\s+remains\s+active\s+while\s+on\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }

  // --- Phase 12 Patterns ---
  // Field Magic & cards on Field
  if (/(?:put|place)\s+(?:this|this\s+magic|any\s+amount\s+of\s+.*magic)\s+cards?(?:\s+among\s+them)?\s+(?:on|onto)\s+(?:the|your)\s+field/i.test(text) ||
      /put\s+this\s+card\s+on\s+your\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/(?:by\s+)?discarding\s+(?:any\s+amount\s+of|\d+|[a-z]+|an?)\s+(?:face-up\s+cards?|exactly-named\s+"[^"]+")\s+from\s+your\s+field/i.test(text) ||
      /discard\s+any\s+amount\s+of\s+exactly-named\s+"[^"]+"\s+from\s+your\s+field/i.test(text)) {
    return { op: 'DISCARD_FIELD' };
  }
  if (/both\s+players'\s+spirits\/nexuses\s+can\s+also\s+be\s+included\s+when\s+counting\s+the\s+number\s+of\s+exactly-named\s+"[^"]+"\s+on\s+your\s+field/i.test(text)) {
    return { op: 'COUNT_MODIFIER' };
  }

  // Prevention & Immunity restrictions
  if (/(?:this|these)\s+effects?\s+can\s+only\s+be\s+prevented\s+by\s+.*effects?/i.test(text) ||
      /(?:this|these)\s+effects?\s+can\s+only\s+be\s+prevented\s+by\s+\[heavy\s+armor\]\/\[ultra\s+armor\]/i.test(text) ||
      /neither\s+player's\s+effects\s+can\s+prevent\s+this\s+effect/i.test(text) ||
      /this\s+spirit\s+can\s+only\s+be\s+blocked\s+by\s+opposing\s+spirits\s+with\s+"[^"]+"-named\s+effects/i.test(text) ||
      /the\s+effects\s+of\s+the\s+spirit\/ultimate\s+destroyed\s+by\s+this\s+effect\s+do\s+not\s+activate/i.test(text) ||
      /unless\s+the\s+opponent\s+send\s+their\s+\[soul\s+core\]\s+to\s+the\s+trash,\s*they\s+can't\s+use\s+cards\s+from\s+their\s+hand\/removed\s+zone/i.test(text)) {
    return { op: 'RESTRICTION' };
  }

  // Deck discard / hand limit restrictions
  if (/(?:no\s+more\s+than|neither\s+deck\s+can\s+have\s+more\s+than|only\s+up\s+to\s+a\s+total\s+of)\s+(?:\d+|[a-z]+)\s+cards\s+can\s+be\s+discarded\s+from\s+either\s+(?:player's\s+)?deck\s+per\s+turn/i.test(text) ||
      /neither\s+deck\s+can\s+have\s+more\s+than\s+(?:\d+|[a-z]+)\s+cards\s+discarded\s+from\s+it\s+per\s+turn/i.test(text) ||
      /when\s+the\s+opponent\s+would\s+increase\s+their\s+hand\s+size\s+from\s+the\s+deck\s+or\s+revealed\s+cards\s+with\s+a\s+spirit\s+effect,\s*they\s+can\s+only\s+increase\s+by\s+one\s+card/i.test(text) ||
      /the\s+opponent\s+can't\s+add\s+cores\s+from\s+the\s+void\s+via\s+their\s+effects/i.test(text)) {
    return { op: 'RESTRICTION' };
  }

  // Desktop / Decktop discard / banish
  if (/(?:discard|banish)\s+(?:\d+|[a-z]+)\s+cards\s+from\s+the\s+opposing\s+(?:decktop|desktop)/i.test(text) ||
      /(?:by\s+)?banishing\s+(?:three|\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop/i.test(text) ||
      /when\s+your\s+"[^"]+"-named\s+spirit\s+attacks,\s*banish\s+(?:\d+|[a-z]+)\s+cards\s+from\s+the\s+opposing\s+decktop/i.test(text) ||
      /when\s+your\s+life\s+would\s+be\s+reduced\s+by\s+the\s+opponent,\s*you\s+can\s+banish\s+(?:\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop/i.test(text)) {
    return { op: 'BANISH_DECK' };
  }

  // Removed Zone actions
  if (/put\s+a\s+random\s+card\s+from\s+the\s+opposing\s+hand\s+onto\s+their\s+removed\s+zone/i.test(text) ||
      /you\s+can\s+put\s+"[^"]+"\s+among\s+them\s+to\s+your\s+removed\s+zone\s+until\s+it\s+has\s+(?:\d+|[a-z]+)\s+cards/i.test(text) ||
      /when\s+this\s+card\s+is\s+revealed\s+from\s+the\s+deck.*you\s+can\s+put\s+it\s+face-up\s+onto\s+your\s+removed\s+zone/i.test(text) ||
      /(?:by\s+putting|putting|put)\s+(?:\d+|[a-z]+|a)\s+cards?\s+from\s+your\s+(?:hand|decktop)\s+facedown\s+(?:on|onto)\s+(?:the|your)\s+removed\s+zone/i.test(text) ||
      /(?:by\s+discarding|discarding|discard)\s+(?:\d+|[a-z]+|every|every\s+[A-Za-z/]+)\s+(?:face-up\s+)?cards?\s+(?:on|in|from)\s+the\s+opposing\s+removed\s+zone/i.test(text) ||
      /(?:by\s+banishing|banishing|you\s+can\s+banish|banish)\s+.*from\s+(?:the\s+opposing|your)\s+(?:trash\s*\+\s*)?removed\s+zone/i.test(text) ||
      /target\s+a\s+card\s+in\s+the\s+opposing\s+hand\/removed\s+zone/i.test(text) ||
      /both\s+players\s+discard\s+all\s+cards\s+in\s+their\s+hand\/removed\s+zone/i.test(text) ||
      /(?:if\s+there\s+is\s+a\s+total\s+of\s+six\s+or\s+more\s+cards\s+on\s+the\s+opposing\s+hand\/removed\s+zone,\s*)?(?:you\s+can\s+)?discard\s+every\s+card\s+on\s+the\s+opposing\s+hand\/removed\s+zone/i.test(text) ||
      /you\s+can\s+use\s+an\s+\[accel\]\s+from\s+your\s+removed\s+zone/i.test(text) ||
      /either\s+discard\s+\d+\s+cards\s+from\s+the\s+opposing\s+removed\s+zone,\s*or\s+\d+\s+magic\s+cards\s+on\s+the\s+opposing\s+field/i.test(text) ||
      /(?:by\s+)?banishing\s+(?:\d+|[a-z]+)\s+cards\s+from\s+your\s+hand\/removed\s+zone/i.test(text)) {
    return { op: 'REMOVED_ZONE_ACTION' };
  }

  // Grandwalker core moves & Grand Skills
  if (/this\s+nexus'\s+\[grand\s+skill:\s*\d+\]\s+becomes\s+\[grand\s+skill:\s*\d+\]/i.test(text) ||
      /(?:by\s+)?putting\s+(?:\d+|[a-z]+)\s+cores\s+from\s+any\s+of\s+your\s+six-colored\s+grandwalker\s+nexuses\s+to\s+any\s+(?:of\s+)?(?:your\s+)?spirits/i.test(text) ||
      /by\s+putting\s+(?:\d+|[a-z]+)\s+cores\s+from\s+your\s+six-colored\s+grandwalker\s+nexuses\s+to\s+any\s+spirits/i.test(text) ||
      /\(when\s+this\s+nexus\s+has\s+at\s+least\s+(?:\d+|[a-z]+)\s+core\)\s+once\s+per\s+turn,\s*when\s+using\s+this\s+nexus'\s+\[grand\s+skill\]\/\[grandphosis\],/i.test(text) ||
      /up\s+to\s+(?:\d+|[a-z]+)\s+of\s+the\s+cores\s+which\s+would\s+be\s+sent\s+to\s+the\s+void\s+can\s+be\s+sent\s+to\s+your\s+trash/i.test(text) ||
      /increase\s+the\s+number\s+of\s+cores\s+specified\s+by\s+the\s+\[grand\s+skill\]\/\[grandphosis\]\s+effects\s+of\s+opposing\s+.*grandwalker\s+nexuses\s+by\s+\+\d+/i.test(text) ||
      /send\s+(?:\d+|[a-z]+)\s+cores\s+each\s+from\s+every\s+opposing\s+grandwalker\s+nexus\s+to\s+the\s+void/i.test(text) ||
      /target\s+(?:\d+|two|[a-z]+)\s+opposing\s+grandwalker\s+nexuses/i.test(text) ||
      /take\s+(?:\d+|[a-z]+)\s+cores\s+from\s+the\s+void,\s*and\s+in\s+anyway\s+you\s+like/i.test(text) ||
      /change\s+the\s+number\s+of\s+cores\s+you\s+send\s+to\s+the\s+void\s+via\s+the\s+\[celestial\s+unleash\]\s+of\s+your\s+exactly-named\s+"[^"]+"\s+to\s+(?:\d+|[a-z]+)/i.test(text) ||
      /you\s+can\s+attack\s+with\s+(?:\d+|[a-z]+)\s+spirits\s+simultaneously\s+via\s+the\s+lv\d+\s+\[grand\s+field\]\s+of\s+your\s+exactly-named\s+"[^"]+"/i.test(text) ||
      /you\s+can\s+put\s+a\s+core\s+from\s+any\s+of\s+your\s+.*grandwalker\s+nexus(?:es)?\s+to\s+this\s+spirit/i.test(text) ||
      /once\s+per\s+game,\s*you\s+can\s+put\s+(?:\d+|[a-z]+)\s+cores\s+from\s+your\s+.*grandwalker\s+nexuses\s+to\s+this\s+spirit/i.test(text) ||
      /you\s+can\s+put\s+(?:\d+|[a-z]+)\s+cores,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+a\s+.*grandwalker\s+nexus/i.test(text) ||
      /for\s+each\s+spirit\s+summoned\s+by\s+this\s+effect,\s*put\s+one\s+core\s+from\s+your\s+"producer"-named\s+grandwalker\s+nexuses\s+to\s+this\s+spirit/i.test(text) ||
      /\+1\s+core\s+to\s+any\s+of\s+your\s+exactly-named\s+"[^"]+"/i.test(text) ||
      /opposing\s+effects\s+can't\s+reduce\s+the\s+number\s+of\s+cores\s+of\s+your\s+exactly-named\s+"[^"]+"\s+to\s+(?:\d+|[a-z]+)\s+or\s+less/i.test(text) ||
      /neither\s+player\s+can\s+put\s+cores\s+onto\s+grandwalker\s+nexuses/i.test(text)) {
    return { op: 'GRANDWALKER_ACTION' };
  }

  // Soul Core moves
  if (/put\s+every\s+core,\s*(?:other\s+than|besides)\s+\[soul\s+core\],\s*from\s+your\s+trash\s+onto\s+this\s+spirit/i.test(text) ||
      /put\s+every\s+core\s+from\s+the\s+trash\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'MOVE_CORE', count: 'ALL', from: { zone: 'trash', side: 'self' }, to: { zone: 'field', side: 'self', target: 'self' } };
  }
  if (/the\s+opponent\s+can't\s+send\s+\[soul\s+core\]\s+to\s+their\s+trash/i.test(text)) {
    return { op: 'RESTRICTION', kind: 'PREVENT_SOUL_CORE_TRASH', side: 'opp' };
  }
  if (/send\s+\[soul\s+core\]\s+from\s+the\s+opposing\s+field\/reserve\s+to\s+their\s+trash/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE', count: 1, from: { zone: 'field_or_reserve', side: 'opp' }, to: { zone: 'trash', side: 'opp' } };
  }
  if (/send\s+the\s+\[soul\s+core\]\s+from\s+your\s+trash\s+to\s+a\s+"([^"]+)"\s+you\s+control/i.test(text)) {
    const mName = text.match(/"([^"]+)"/);
    return { op: 'MOVE_SOUL_CORE', count: 1, from: { zone: 'trash', side: 'self' }, to: { zone: 'field', side: 'self', name: mName ? mName[1] : null } };
  }
  if (/send\s+the\s+\[soul\s+core\]\s+from\s+your\s+reserve\s+to\s+your\s+"([^"]+)"(?:\/"([^"]+)")*-named\s+spirit/i.test(text) ||
      /(?:you\s+can\s+)?send\s+the\s+\[soul\s+core\]\s+from\s+your\s+reserve\s+to\s+your\s+"([^"]+)"(?:\/"([^"]+)")*-named\s+spirit/i.test(text)) {
    const mName = text.match(/"([^"]+)"/);
    return { op: 'MOVE_SOUL_CORE', count: 1, from: { zone: 'reserve', side: 'self' }, to: { zone: 'field', side: 'self', name: mName ? mName[1] : null } };
  }
  if (/(?:you\s+can\s+)?either\s+send\s+the\s+\[soul\s+core\]\s+from\s+your\s+reserve\s+to\s+any\s+spirit\s+you\s+control,\s*or\s+send\s+(?:\d+|[a-z]+)\s+cores,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+any\s+spirits\s+you\s+control/i.test(text)) {
    return { op: 'MOVE_CORE', count: 1, choice: 'SOUL_FROM_RESERVE_OR_CORES_FROM_TRASH' };
  }
  if (/(?:by\s+)?sending\s+\[soul\s+core\]\s+from\s+a\s+"([^"]+)"-named\s+spirit\s+you\s+control\s+to\s+this\s+spirit/i.test(text)) {
    const mName = text.match(/"([^"]+)"/);
    return { op: 'MOVE_SOUL_CORE', count: 1, from: { zone: 'field', side: 'self', name: mName ? mName[1] : null }, to: { zone: 'field', side: 'self', target: 'self' }, isCost: true };
  }

  // Destinations
  if (/cores\s+to\s+be\s+sent\s+to\s+(?:the\s+)?trash,\s*other\s+than\s+\[soul\s+core\],\s*are\s+sent\s+to\s+the\s+void\s+instead/i.test(text) ||
      /cores\s+which\s+this\s+effect\s+would\s+send\s+to\s+the\s+reserve\s+and\s+opposing\s+lives\s+which\s+would\s+be\s+sent\s+to\s+the\s+reserve\s+are\s+sent\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /when\s+the\s+opposing\s+life\s+is\s+reduced,\s*the\s+life\s+core\s+is\s+sent\s+to\s+the\s+trash,\s*not\s+the\s+reserve/i.test(text) ||
      /besides\s+\[soul\s+core\],\s*an\s+amount\s+of\s+cores\s+on\s+the\s+spirit\s+destroyed\s+by\s+this\s+effect\s+equal\s+to\s+its\s+level\s+are\s+sent\s+to\s+the\s+void\s+instead\s+of\s+the\s+reserve/i.test(text) ||
      /the\s+cores\s+on\s+a\s+spirit\s+destroyed\s+by\s+this\s+effect\s+are\s+sent\s+to\s+the\s+trash,\s*not\s+the\s+reserve/i.test(text) ||
      /send\s+one\s+core,\s*other\s+than\s+\[soul\s+core\],\s*from\s+the\s+opposing\s+spirit\s+destroyed\s+by\s+this\s+effect\s+to\s+the\s+void/i.test(text) ||
      /the\s+spirit\s+depleted\s+by\s+this\s+effect\s+is\s+banished\s+instead\s+of\s+sent\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'MODIFY_DESTINATION' };
  }

  // Remain on Field / Prevent leaving field
  if (/spirits\s+(?:that|which)\s+had\s+cores\s+(?:put|sent)\s+(?:on|to)\s+them\s+by\s+this\s+effect\s+remain\s+on\s+the\s+field(?:,\s*in|\s+in)\s+the\s+same\s+(?:state|condition)/i.test(text) ||
      /when\s+your\s+"[^"]+"(?:-named)?\s+spirits(?:\/ultimates)?\s+(?:are\s+depleted\/destroyed|would\s+leave\s+the\s+field)\s+due\s+to\s+opposing\s+effects,\s*you\s+can\s+put\s+(?:a|any\s+amount\s+of)\s+cores?\s+from\s+(?:your\s+reserve|this\s+nexus)\s+to\s+(?:those|each\s+of\s+those)\s+spirits/i.test(text) ||
      /(?:you\s+can\s+)?put\s+any\s+amount\s+of\s+cores\s+from\s+your\s+reserve\s+to\s+those\s+spirits(?:\/ultimates)?/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }

  // Extra Turn / Step manipulations
  if (/when\s+the\s+opponent\s+would\s+activate\s+an\s+extra\s+turn\s+effect,\s*that\s+extra\s+turn\s+becomes\s+your\s+extra\s+turn\s+instead/i.test(text) ||
      /when\s+the\s+opponent\s+would\s+activate\s+an\s+effect\s+that\s+makes\s+an\s+extra\s+turn\s+occur,\s*change\s+the\s+"your\s+turn"\s+written\s+in\s+that\s+effect\s+to\s+"opposing\s+turn"/i.test(text) ||
      /after\s+this\s+turn\s+ends,\s*your\s+turn\s+occurs/i.test(text) ||
      /core\s+step\s+and\s+main\s+step\s+don't\s+occur\s+in\s+the\s+extra\s+turn/i.test(text) ||
      /extra\s+turns\/steps\s+don't\s+occur\s+for\s+the\s+opponent/i.test(text) ||
      /immediately\s+end\s+the\s+opposing\s+attack\s+step/i.test(text) ||
      /when\s+blocked,\s*except\s+via\s+targeting\s+effects,\s*flash\s+timing\s+doesn't\s+occur/i.test(text)) {
    return { op: 'EXTRA_TURN' };
  }

  // Exchange / Switch / Change / Copying effects
  if (/\[exchange\]\s+can\s+only\s+be\s+used\s+once\s+per\s+turn/i.test(text) ||
      /during\s+this\s+turn,\s*you\s+can\s+ignore\s+the\s+"\[exchange\]\s+can\s+only\s+be\s+used\s+once\s+per\s+turn"\s+clause\s+of\s+your\s+striker\s+pack\s+and\s+use\s+it\s+once\s+and\s+only\s+once\s+more/i.test(text) ||
      /(?:you\s+can\s+)?switch\s+places\s+with\s+this\s+nexus\s+that\s+has\s+one\s+or\s+more\s+core\s+on\s+it\s+via\s+the\s+\[change\]\s+of\s+your\s+"[^"]+"(?:\/"[^"]+")*-named\s+cards/i.test(text) ||
      /this\s+effect\s+also\s+activates\s+when\s+this\s+spirit\s+is\s+switched\s+into\s+(?:the\s+)?field\s+from\s+your\s+hand\/trash/i.test(text) ||
      /(?:ignoring\s+levels,?\s*)?(?:you\s+can\s+)?activate\s+one\s+of\s+(?:the|its)\s+\(when\s+attacks\)\s+effects\s+(?:of\s+the\s+(?:destroyed\s+)?spirit(?:\s+destroyed\s+by\s+this\s+effect)?\s*)?(?:,\s*ignoring\s+(?:the\s+)?levels,?\s*)?as\s+this\s+spirit's\s+effect(?:,\s*ignoring\s+the\s+levels)?/i.test(text) ||
      /after\s+its\s+effect\s+resolves,\s*you\s+can\s+activate\s+the\s+same\s+effect\s+once\s+and\s+only\s+once\s+more/i.test(text) ||
      /instead\s+of\s+drawing,\s*you\s+can\s+activate\s+this\s+spirit's\s+\(when\s+summoned\)\s+effect/i.test(text)) {
    return { op: 'COPY_EFFECT' };
  }

  // Advent rules
  if (/stack\s+this\s+from\s+your\s+hand\s+onto\s+your\s+target\s+ultimate/i.test(text) ||
      /this\s+card\s+can\s+\[advent\]\s+on\s+your\s+"[^"]+"-named\s+spirits\s+ignoring\s+the\s+condition/i.test(text) ||
      /you\s+can\s+\[advent\]\s+a\s+"[^"]+"\s+from\s+your\s+hand\s+onto\s+this\s+spirit/i.test(text) ||
      /this\s+card\s+can\s+advent\s+on\s+it/i.test(text) ||
      /when\s+you\s+would\s+\[advent\]\s+this\s+card,\s*unless\s+you\s+stack\s+"[^"]+"-named\s+cards\s+and\s+"[^"]+"-named\s+cards/i.test(text) ||
      /you\s+can\s+\[advent\]\s+an\s+exactly-named\s+"[^"]+"\s+onto\s+this\s+spirit/i.test(text) ||
      /you\s+can\s+also\s+\[advent\]\s+this\s+card\s+from\s+the\s+trash/i.test(text)) {
    return { op: 'ADVENT_RULE' };
  }

  // Miscellaneous Phase 12
  if (/this\s+card\/spirit\s+has\s+every\s+team/i.test(text)) {
    return { op: 'GAIN_TEAM' };
  }
  if (/this\s+spirit\s+gains:?\s*\[heavy\s+armor:\s*[^\]]+\]/i.test(text) ||
      /while\s+braved\s+to\s+four\s+braves,\s*this\s+spirit\s+gains:?\s*\[heavy\s+armor:\s*white\]/i.test(text)) {
    return { op: 'GRANT_KEYWORD' };
  }
  if (/you\s+choose\s+the\s+targets\s+for\s+that\s+"[^"]+"\s+from\s+among\s+either\s+player's\s+spirits\/ultimates/i.test(text)) {
    return { op: 'CHOOSE_TARGETS' };
  }
  if (/(?:by\s+)?banishing\s+(?:one|\d+|[a-z]+)\s+card\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'BANISH_HAND' };
  }
  if (/this\s+ultimate\s+can't\s+have\s+its\s+number\s+of\s+cores\s+brought\s+to\s+(?:\d+|[a-z]+)\s+or\s+less\s+by\s+opposing\s+effects/i.test(text)) {
    return { op: 'PROTECTION' };
  }
  if (/(?:if\s+the\s+opposing\s+hand\s+is\s+(?:\d+|[a-z]+)\s+or\s+more,\s*)?the\s+opponent\s+discards\s+their\s+hand\s+until\s+(?:\d+|[a-z]+)\s+cards\s+left/i.test(text)) {
    return { op: 'DISCARD_HAND' };
  }
  if (/discard\s+every\s+other\s+card/i.test(text) || /discard\s+the\s+revealed\s+card/i.test(text)) {
    return { op: 'DISCARD' };
  }
  if (/reveal\s+one\s+card\s+from\s+the\s+opposing\s+decktop/i.test(text) ||
      /look\s+at\s+the\s+top\s+(?:\d+|[a-z]+)\s+cards\s+of\s+your\s+deck/i.test(text)) {
    return extractRevealCardParams(text);
  }
  if (/give\s+all\s+your\s+spirits:\s*"\(when\s+attacks\)\s+opposing\s+spirits\/ultimates\s+must\s+block,\s*if\s+possible/i.test(text)) {
    return { op: 'GRANT_EFFECT' };
  }
  if (/(?:(?:you\s+can\s+)?send|(?:by\s+)?sending)\s+(?:one|\d+|[a-z]+)\s+of\s+your\s+(?:life|lives)\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'PAY_LIFE' };
  }
  if (/if\s+that\s+card\s+is\s+cost\s+\d+\s+or\s+more,\s*send\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text) ||
      /send\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'RETRIEVE_CORES' };
  }
  if (/the\s+opponent\s+can\s+only\s+block\s+one\s+of\s+the\s+spirits/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/you\s+can't\s+bring\s+the\s+number\s+of\s+cores\s+on\s+this\s+spirit\s+to\s+0/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/retrun\s+the\s+remaining\s+cards\s+to\s+either\s+only\s+the\s+decktop\s+or\s+the\s+deckbottom/i.test(text)) {
    return { op: 'DECK_ACTION' };
  }
  if (/banish\s+(?:the|any)\s+remaining\s+cards/i.test(text) || /banish\s+(?:this\s+spirit|this\s+card|it)\b/i.test(text)) {
    return { op: 'BANISH' };
  }
  if (/(?:while\s+this\s+card\s+is\s+in\s+the\s+trash,\s*)?when\s+you're\s+banishing.*you\s+can\s+count\s+each\s+of\s+those\s+cards\s+as\s+(?:\d+|[a-z]+)\s+cards/i.test(text)) {
    return { op: 'COUNT_MODIFIER' };
  }
  if (/spirits\/ultimates\s+whose\s+bp\s+are\s+brought\s+to\s+0\s+by\s+these\s+effects\s+are\s+destroyed/i.test(text)) {
    return { op: 'DESTROY_ON_BP_ZERO' };
  }
  if (/the\s+opponent\s+sends\s+their\s+own\s+cores\s+to\s+the\s+void\s+until\s+they\s+have\s+a\s+total\s+of\s+four\s+cores\s+left\s+on\s+their\s+grandwalker\s+nexuses\/field\/reserve\/trash/i.test(text)) {
    return { op: 'SEND_CORES_TO_VOID' };
  }
  if (/banish\s+every\s+card\s+in\s+the\s+opposing\s+trash/i.test(text)) {
    return { op: 'BANISH_TRASH' };
  }
  if (/at\s+the\s+end\s+of\s+battle,\s*if\s+you\s+control\s+any\s+"godzilla"-named\s+spirit\/grandwalker\s+nexus,\s*once\s+per\s+turn,\s*this\s+spirit\s+refeshes/i.test(text)) {
    return { op: 'REFRESH' };
  }
  if (/you\s+can\s+put\s+any\s+amount\s+of\s+copies\s+of\s+this\s+card\s+into\s+your\s+deck/i.test(text)) {
    return { op: 'DECK_RULE' };
  }

  // --- Phase 13 Patterns (Rebirth / Tensei Era) ---
  // Rebirth flip operations & triggers
  if (/(?:when\s+.*,\s*)?(?:(?:this\s+(?:spirit|nexus|card)|it)\s+can\s+(?:be\s+)?flip(?:ped)?|you\s+can\s+flip\s+(?:it|this\s+(?:spirit|nexus|card))|flip\s+(?:it|this\s+(?:spirit|nexus|card)|a\s+pre-rebirth\s+nexus\s+you\s+control))(?:\s*,?\s*putting\s+your\s+\[soul\s+core\]\s+onto\s+it)?/i.test(text) ||
      /(?:at\s+the\s+end\s+of\s+battle,\s*)?(?:by\s+banishing\s+a\s+card\s+from\s+the\s+opposing\s+trash,\s*)?(?:this\s+spirit\s+can\s+)?flip\s+(?:this\s+spirit\s+)?back\s+into\s+a\s+pre-rebirth\s+spirit/i.test(text) ||
      /(?:when\s+it\s+is,?\s*)?(?:you\s+can\s+)?put\s+(?:a|one|\d+|[a-z]+)\s+cores?\s+from\s+your\s+(?:field\/reserve|field|reserve)\s+to\s+this\s+now-reborn\s+spirit/i.test(text) ||
      /flip\s+this\s+spirit/i.test(text)) {
    return { op: 'REBIRTH_FLIP' };
  }

  // Count / Counter operations & Life burn
  if (/(?:if\s+.*,\s*)?(?:you\s+can\s+)?send\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+opposing\s+(?:life|lives)\s+to\s+the\s+void\s+for\s+each\s+(?:\d+|[a-z]+)\s+counters?\s+you\s+have/i.test(text) ||
      /(?:you\s+can\s+)?send\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+opposing\s+(?:life|lives)\s+to\s+(?:the\s+void|the\s+reserve)/i.test(text) ||
      /send\s+(?:one|\d+|[a-z]+)\s+of\s+your\s+(?:life|lives)\s+to\s+your\s+reserve/i.test(text) ||
      /(?:you\s+can\s+)?\+\d+\s+counters?/i.test(text) ||
      /(?:you\s+can\s+)?give\s+[+-]\d+\s+to\s+either\s+your\s+or\s+the\s+opposing\s+counters/i.test(text) ||
      /repeat\s+this\s+effect\s+up\s+to\s+the\s+number\s+of\s+counters\s+you\s+have/i.test(text) ||
      /(?:this\s+effect\s+can\s+)?repeat\s+for\s+a\s+number\s+of\s+times\s+equal\s+to\s+the\s+number\s+of\s+counters\s+you\s+have/i.test(text) ||
      /activate\s+this\s+effect\s+for\s+a\s+number\s+of\s+times\s+equal\s+to\s+the\s+number\s+of\s+counters\s+you\s+have/i.test(text) ||
      /this\s+spirit's\s+"core\s+removal\s+effect"\s+sends\s+\+\d+\s+core\s+to\s+the\s+reserve/i.test(text) ||
      /\[count\s+break\]\s+can\s+only\s+be\s+used\s+once\s+per\s+game/i.test(text)) {
    return { op: 'COUNT_OPERATION' };
  }

  // Multiply activations by number of spirits
  if (/this\s+effect\s+activates\s+for\s+a\s+number\s+of\s+times\s+equal\s+to\s+the\s+number\s+of\s+.*you\s+control/i.test(text)) {
    return { op: 'MULTIPLY_EFFECT' };
  }

  // BP Comparison
  if (/(?:you\s+can\s+)?compare\s+the\s+bp\s+of\s+this\s+spirit\s+and\s+an\s+opposing\s+spirit/i.test(text)) {
    return { op: 'COMPARE_BP' };
  }

  // Card attachment & underneath
  if (/put\s+a\s+"[^"]+"-named\s+card\s+from\s+your\s+trash\s+facedown\s+underneath\s+an\s+exactly-named\s+"[^"]+"\s+you\s+control/i.test(text) ||
      /underneath\s+an\s+exactly-named\s+"[^"]+"\s+you\s+control/i.test(text) ||
      /(?:by\s+)?putting\s+up\s+to\s+(?:\d+|[a-z]+)\s+cards\s+from\s+your\s+decktop\s+face-down\s+onto\s+the\s+field/i.test(text)) {
    return { op: 'ATTACH_CARD' };
  }

  // Hand / Field swap
  if (/this\s+card\s+in\s+hand\s+changes\s+places\s+with\s+that\s+spirit\s+in\s+the\s+same\s+condition/i.test(text) ||
      /switch\s+a\s+card\s+in\s+your\s+hand\s+with\s+a\s+spirit\s+card\s+with\s+\[star\s+appeal\]\s+in\s+your\s+trash/i.test(text) ||
      /this\s+card\s+in\s+your\s+hand\s+can\s+switch\s+places\s+with\s+an\s+exactly-named\s+"[^"]+"\s+you\s+control/i.test(text) ||
      /this\s+effect\s+also\s+activates\s+when\s+this\s+card\s+changes\s+places\s+from\s+the\s+hand/i.test(text) ||
      /this\s+effect\s+can\s+also\s+be\s+activated\s+when\s+it's\s+replaced\s+with\s+\[exchange\]/i.test(text) ||
      /when\s+replacing\s+this\s+spirit\s+via\s+\[exchange\],/i.test(text)) {
    return { op: 'SWAP_CARD' };
  }

  // Restrictions & Rules
  if (/extra\s+turns?\s+won't\s+occur\s+via\s+opposing\s+spirit\/grandwalker\s+nexus\s+effects/i.test(text) ||
      /any\s+\(when\s+summoned\)\s+effects\s+of\s+spirits\s+don't\s+activate/i.test(text) ||
      /neither\s+player\s+can\s+use\s+non-blue\s+cards\s+from\s+their\s+hand\/removed\s+zone/i.test(text) ||
      /this\s+"life\s+decreasal"\s+effect\s+can\s+only\s+be\s+used\s+once\s+per\s+game/i.test(text) ||
      /the\s+opponent\s+can't\s+move\s+their\s+\[soul\s+core\]\s+from\s+their\s+trash\s+to\s+the\s+field\/reserve/i.test(text) ||
      /neither\s+player\s+can\s+put\s+more\s+than\s+one\s+core\s+on\s+each\s+grandwalker\s+nexus\s+per\s+turn/i.test(text) ||
      /unless\s+the\s+opponent\s+sends\s+one\s+of\s+their\s+lives\s+to\s+the\s+trash,\s*they\s+can't\s+use\s+cards\s+from\s+their\s+hand\/removed\s+zone/i.test(text) ||
      /this\s+effect\s+can\s+only\s+be\s+prevented\s+by\s+\[ps\s+armor\]\/\[vps\s+armor\]/i.test(text) ||
      /that\s+card\s+does\s+not\s+leave\s+the\s+trash/i.test(text) ||
      /during\s+this\s+battle,\s*flash\s+timing\s+doesn't\s+occur\s+for\s+either\s+player/i.test(text) ||
      /timing\s+doesn't\s+occur\s+for\s+either\s+player/i.test(text) ||
      /an\s+extra\s+pair\s+of\s+attack\s+step\s+and\s+end\s+step\s+occurs\s+once\s+and\s+only\s+once/i.test(text)) {
    return { op: 'RESTRICTION' };
  }

  // Life modifications
  if (/the\s+effect\s+reduces\s+-\d+\s+life/i.test(text) ||
      /one\s+less\s+life\s+is\s+reduced/i.test(text) ||
      /switch\s+places\s+between\s+the\s+cores\s+in\s+the\s+opposing\s+trash,\s*except\s+\[soul\s+core\],\s*and\s+the\s+cores\s+in\s+the\s+opposing\s+life/i.test(text) ||
      /(?:you\s+can\s+)?put\s+a\s+core,\s*besides\s+\[soul\s+core\],\s*from\s+(?:your\s+)?trash\s+to\s+the\s+life/i.test(text) ||
      /send\s+a\s+core,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+the\s+life/i.test(text) ||
      /put\s+a\s+core\s+from\s+any\s+of\s+your\s+"producer"\s+grandwalker\s+nexuses\s+to\s+the\s+life/i.test(text)) {
    return { op: 'MODIFY_LIFE' };
  }

  // Soul Core Moves & Retrieval
  if (/send\s+(?:the\s+)?(?:opposing\s+)?\[soul\s+core\]\s+from\s+(?:their|the\s+opposing|the)?\s*field\/reserve\s+to\s+the\s+trash/i.test(text) ||
      /send\s+(?:the\s+)?\[soul\s+core\]\s+from\s+(?:your\s+)?trash\s+to\s+(?:any\s+|your\s+|any\s+of\s+your\s+)?"[^"]+"/i.test(text) ||
      /send\s+\[soul\s+core\]\s+from\s+the\s+trash\s+to\s+your\s+"[^"]+"/i.test(text) ||
      /(?:you\s+can\s+)?send\s+\[soul\s+core\]\s+from\s+your\s+reserve\s+to\s+this\s+spirit/i.test(text) ||
      /send\s+a\s+core,\s*besides\s+\[soul\s+core\],\s*from\s+the\s+opposing\s+trash\s+to\s+the\s+void/i.test(text) ||
      /put\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+any\s+spirits\s+you\s+control/i.test(text) ||
      /put\s+(?:\d+|[a-z]+)\s+cores,\s*except\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+this\s+spirit\/any\s+nexuses\s+you\s+control/i.test(text) ||
      /besides\s+\[soul\s+core\],\s*put\s+any\s+amount\s+of\s+cores\s+from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text) ||
      /(?:you\s+can\s+)?put\s+a\s+core\s+from\s+the\s+trash\s+to\s+this\s+spirit/i.test(text) ||
      /send\s+(?:\d+|[a-z]+)\s+cores\s+each\s+from\s+(?:\d+|[a-z]+)\s+opposing\s+spirits\s+to\s+the\s+reserve/i.test(text) ||
      /(?:by\s+)?sending\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores/i.test(text)) {
    return parseCoreMovement(text);
  }

  // Trash & Destinations
  if (/send\s+this\s+spirit\s+to\s+your\s+trash/i.test(text)) {
    return { op: 'SEND_TO_TRASH', target: 'SELF' };
  }
  if (/cores\s+on\s+the\s+(?:opposing\s+)?spirits(?:\/ultimates)?\s+destroyed\s+by\s+this\s+effects?\s+are\s+sent\s+to\s+the\s+trash\s+instead\s+of\s+(?:the\s+)?reserve/i.test(text) ||
      /besides\s+\[soul\s+core\],\s*all\s+cores\s+on\s+the\s+spirits\s+destroyed\s+by\s+this\s+spirit's\s+effect\s+are\s+sent\s+to\s+the\s+trash\s+instead\s+of\s+the\s+reserve/i.test(text) ||
      /cores\s+sent\s+to\s+the\s+opposing\s+reserve\s+by\s+the\s+effects\s+of\s+your\s+exactly-named\s+"[^"]+"\s+are\s+sent\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /cores\s+on\s+opposing\s+destroyed\s+spirits\/nexuses\s+are\s+sent\s+to\s+the\s+trash\s+instead\s+of\s+the\s+reserve/i.test(text)) {
    return { op: 'MODIFY_DESTINATION' };
  }
  if (/(?:by\s+)?banish(?:ing)?\s+(?:one|\d+|[a-z]+)\s+cards?\s+from\s+the\s+opposing\s+trash/i.test(text) ||
      /(?:by\s+)?banish(?:ing)?\s+(?:one|\d+|[a-z]+)\s+(?:spirit\s+)?cards?\s+from\s+your\s+trash/i.test(text)) {
    return { op: 'BANISH_TRASH' };
  }

  // Removed zone additions
  if (/put\s+the\s+entire\s+opposing\s+hand\s+face-up\s+on\s+the\s+removed\s+zone/i.test(text) ||
      /put\s+a\s+random\s+card\s+from\s+the\s+opposing\s+hand\s+face-up\s+onto\s+their\s+removed\s+zone/i.test(text) ||
      /target\s+a\s+card\s+on\s+the\s+opposing\s+removed\s+zone/i.test(text) ||
      /send\s+an\s+opposing\s+spirit\s+to\s+the\s+removed\s+zone/i.test(text) ||
      /put\s+a\s+card\s+facedown\s+from\s+your\s+decktop\s+on\s+the\s+removed\s+zone/i.test(text) ||
      /(?:you\s+can\s+)?put\s+it\s+on\s+the\s+removed\s+zone/i.test(text) ||
      /(?:by\s+)?discarding\s+this\s+card\s+from\s+the\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVED_ZONE_ACTION' };
  }

  // Deck look / reveal
  if (/(?:you\s+can\s+)?look\s+at\s+(?:the\s+contents\s+of\s+a\s+card|one\s+card)\s+from\s+your\s+decktop/i.test(text) ||
      /(?:you\s+can\s+)?reveal\s+a\s+card\s+from\s+the\s+decktop/i.test(text)) {
    return extractRevealCardParams(text);
  }
  if (/remaining\s+cards?\s+is\s+discarded/i.test(text)) {
    return { op: 'REVEAL_CARDS' };
  }

  // Retargeting
  if (/the\s+target\s+of\s+that\s+effect\s+becomes\s+a\s+single\s+spirit\s+you\s+control,\s*other\s+than\s+this\s+one/i.test(text)) {
    return { op: 'CHANGE_TARGET' };
  }

  // Copy effects
  if (/(?:you\s+can\s+)?activate\s+(?:this\s+spirit's|this\s+nexus's)?\s*\(when\s+(?:summoned|deployed)\)\s+effect/i.test(text) ||
      /(?:you\s+can\s+)?activate\s+a\s+\(when\s+attacks\)\s+effect\s+written\s+on\s+a\s+spirit\s+card\s+in\s+the\s+opposing\s+trash\s+as\s+this\s+spirit's\s+effect/i.test(text) ||
      /(?:after\s+.*effect\s+resolves,?\s*)?(?:you\s+can\s+)?activate\s+the\s+same\s+effect\s+once\s+and\s+only\s+once\s+more/i.test(text)) {
    return { op: 'COPY_EFFECT' };
  }

  // Target a card type / target a spirit
  if (/target\s+a\s+card\s+type/i.test(text) ||
      /the\s+opponent\s+targets\s+a\s+spirit\s+they\s+control/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }

  // Miscellaneous Phase 13
  if (/this\s+card\s+has\s+.*families/i.test(text)) {
    return { op: 'GAIN_FAMILY' };
  }
  if (/the\s+opponent\s+discard\s+a\s+magic\s+card\s+on\s+their\s+field/i.test(text)) {
    return { op: 'DISCARD_FIELD' };
  }
  if (/for\s+each\s+target\s+card\s+among\s+them,\s*place\s+one\s+core\s+from\s+the\s+void\s+onto\s+this\s+nexus/i.test(text)) {
    return { op: 'CORE_CHARGE' };
  }
  if (/when\s+this\s+card\s+is\s+revealed\s+from\s+the\s+deck\s+by\s+your\s+effect,\s*you\s+can\s+put\s+it\s+onto\s+your\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/give\s+all\s+your\s+.*:\s*"\(when\s+attacks\)/i.test(text)) {
    return { op: 'GRANT_EFFECT' };
  }
  if (/\(both\s+battles\s+conclude\s+at\s+the\s+same\s+time\.?\)/i.test(text)) {
    return { op: 'SIMULTANEOUS_BATTLE' };
  }
  if (/activate\s+the\s+following\s+effects\s+according\s+to\s+how\s+much\s+you\s+paid/i.test(text)) {
    return { op: 'VARIABLE_PAYMENT_EFFECT' };
  }
  if (/every\s+exactly-named\s+"[^"]+"\s+you\s+control\s+can\s+activate\s+\[grandphosis\]/i.test(text) ||
      /the\s+\[dark\s+unleash\]\s+of\s+your\s+exactly-named\s+"[^"]+"\s+now\s+sends\s+up\s+to\s+(?:\d+|[a-z]+)\s+cores\s+to\s+the\s+void/i.test(text) ||
      /(?:by\s+)?putting\s+(?:\d+|[a-z]+)\s+cores\s+from\s+any\s+six-colored\s+grandwalker\s+nexuses\s+you\s+control\s+to\s+any\s+spirits/i.test(text) ||
      /(?:you\s+can\s+)?put\s+(?:\d+|[a-z]+)\s+cores\s+from\s+any\s+.*grandwalker\s+nexuses\s+you\s+control\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'GRANDWALKER_ACTION' };
  }
  if (/this\s+card\s+can\s+also\s+\[advent\]\s+from\s+the\s+trash/i.test(text)) {
    return { op: 'ADVENT_RULE' };
  }
  if (/end\s+this\s+turn/i.test(text)) {
    return { op: 'END_TURN' };
  }
  if (/it\s+can\s+remain\s+on\s+the\s+field(?:,\s*in|\s+in)\s+the\s+same\s+condition/i.test(text) ||
      /they\s+can\s+remain\s+on\s+(?:the\s+)?field\s+in\s+the\s+same\s+condition/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/when\s+the\s+opponent\s+uses\s+any\s+magic\s+card/i.test(text)) {
    return { op: 'TRIGGER_CONDITION' };
  }
  if (/this\s+effect\s+can\s+also\s+activate\s+at\s+the\s+end\s+of\s+the\s+attack/i.test(text)) {
    return { op: 'TIMING_MODIFIER' };
  }
  if (/put\s+up\s+to\s+(?:\d+|[a-z]+)\s+copies\s+of\s+this\s+card\s+in\s+your\s+deck/i.test(text)) {
    return { op: 'DECK_RULE' };
  }
  if (/banish\s+this\s+card/i.test(text)) {
    return { op: 'BANISH' };
  }

  // Phase 14 (Mirage & True Rebirth) patterns
  if (/(?:you\s+can\s+)?activate\s+this\s+card's\s+\[rebirth\]/i.test(text)) {
    return { op: 'ACTIVATE_REBIRTH' };
  }
  if (/\[(?:assemble|supremacy)\]\s+can\s+only\s+be\s+used\s+once\s+per\s+turn/i.test(text) ||
      /this\s+effect\s+does\s+not\s+stack/i.test(text)) {
    return { op: 'KEYWORD_RULE' };
  }
  if (/(?:when\s+you\s+do,?\s*)?(?:you\s+can\s+)?put\s+(?:one|\d+|[a-z]+)\s+cores?\s+from\s+your\s+field\/reserve\s+to\s+this\s+(?:now[- ])?reborn\s+spirit/i.test(text)) {
    return { op: 'REBIRTH_CORE_PLACEMENT' };
  }
  if (/(?:by\s+)?discarding\s+(?:one\s+of\s+your|this)\s+(?:mirage|set\s+cards?)/i.test(text)) {
    return { op: 'DISCARD_MIRAGE_COST' };
  }
  if (/(?:when\s+the\s+opposing\s+life\s+is\s+reduced,\s*or\s+this\s+ultimate\s+would\s+leave\s+the\s+field\s+due\s+to\s+the\s+opponent,\s*)?(?:you\s+can\s+)?flip\s+this\s+ultimate/i.test(text) ||
      /\(?send\s+all\s+cores\s+on\s+it\s+to\s+the\s+reserve\.?\)?/i.test(text)) {
    return { op: 'REBIRTH_FLIP' };
  }
  if (/neither\s+deck\s+can\s+be\s+discarded/i.test(text) ||
      /neither\s+player's\s+life\s+can\s+be\s+increased/i.test(text) ||
      /neither\s+player\s+can\s+use\s+cards\s+from\s+hand\s+outside\s+of\s+flash\s+timing/i.test(text) ||
      /neither\s+player\s+can\s+activate\s+\[rebirth\]/i.test(text) ||
      /neither\s+player\s+can\s+gain\s+cores\s+from\s+the\s+void\s+(?:though|through)\s+effects/i.test(text) ||
      /all\s+.*pre-rebirth\s+nexuses\s+can't\s+flip/i.test(text) ||
      /main\s+step\s+doesn't\s+occur\s+for\s+the\s+opponent\s+next\s+turn/i.test(text)) {
    return { op: 'GLOBAL_RESTRICTION' };
  }
  if (/this\s+effect\s+can\s+only\s+be\s+prevented\s+by\s+\[(?:heavy|ultra)\s+armor\]/i.test(text)) {
    return { op: 'PIERCING_RULE' };
  }
  if (/(?:by\s+|you\s+can\s+)?send(?:ing)?\s+(?:the\s+)?\[soul\s+core\]\s+from\s+.*to\s+(?:the|your)\s+(?:trash|reserve)/i.test(text) ||
      /(?:by\s+|you\s+can\s+)?send(?:ing)?\s+(?:the\s+opposing\s+)?\[soul\s+core\]\s+to\s+(?:the|your)\s+(?:trash|reserve)/i.test(text) ||
      /send\s+(?:the\s+)?\[soul\s+core\]\s+from\s+.*to\s+the\s+(?:trash|reserve)/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }
  if (/when\s+you\s+use\s+a\s+.*magic\s+card\s+with\s+mirage\s+effects/i.test(text)) {
    return { op: 'TRIGGER_CONDITION' };
  }
  if (/(?:by\s+)?banish(?:ing)?\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+.*cards?\s+from\s+(?:your\s+trash\s+or\s+the\s+opposing\s+trash|.*trash)/i.test(text)) {
    return { op: 'BANISH_TRASH' };
  }
  if (/this\s+(?:card|spirit|card\/spirit)\s+has\s+all\s+teams/i.test(text)) {
    return { op: 'TEAM_RULE' };
  }
  if (/(?:you\s+can\s+)?increase\s+the\s+number\s+of\s+(?:cards|cores).*\s+by\s+[+-]\d+/i.test(text) ||
      /(?:the\s+amount\s+of\s+cards\s+for\s+.*is\s+increased|this\s+effect\s+banishes\s+\+\d+\s+card|this\s+effect\s+puts\s+\+\d+\s+core)/i.test(text) ||
      /change\s+the\s+"[^"]+"\s+text\s+of\s+this\s+effect\s+to\s+"[^"]+"/i.test(text) ||
      /written\s+on\s+this\s+effect\s+is\s+changed\s+to\s+"[^"]+"/i.test(text) ||
      /reduce\s+the\s+number\s+of\s+(?:cards|cores).*\s+by\s+-\d+/i.test(text)) {
    return { op: 'MODIFY_EFFECT_VALUE' };
  }
  if (/(?:you\s+can\s+)?immediately\s+use\s+(?:the\s+flash\s+effect\s+of\s+a\s+magic\s+card|the\s+\[change\]\s+of\s+.*)\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'USE_FROM_HAND' };
  }
  if (/(?:send|put)\s+(?:up\s+to\s+)?(?:\d+|[a-z]+|all)\s+cores?.*to\s+the\s+void/i.test(text) ||
      /send\s+(?:an?\s+)?opposing\s+(?:life|lives).*to\s+the\s+void/i.test(text)) {
    return { op: 'SEND_TO_VOID' };
  }
  if (/this\s+spirit's\s+bp\s+is\s+equal\s+to\s+.*x\d+/i.test(text) ||
      /activate\s+this\s+"bp\s+-"\s+effect\s+a\s+number\s+of\s+times\s+equal\s+to/i.test(text) ||
      /give\s+an\s+opposing\s+spirit\s+-\(this\s+spirit's\s+bp\)\s+bp/i.test(text)) {
    return { op: 'BP_FORMULA' };
  }
  if (/(?:put|send)\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+cores?,\s*(?:besides|except|other\s+than)\s+\[soul\s+core\].*to\s+(?:this\s+spirit|your\s+life|the\s+life|any\s+.*spirits?)/i.test(text) ||
      /(?:you\s+can\s+)?put\s+a\s+core\s+from\s+your\s+life\s+to\s+this\s+spirit/i.test(text) ||
      /(?:put|send)\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+cores?,\s*(?:besides|other\s+than|except)\s+\[soul\s+core\].*from\s+the\s+trash.*to/i.test(text) ||
      /(?:besides|other\s+than|except)\s+\[soul\s+core\],\s*(?:you\s+can\s+)?put\s+.*from\s+the\s+trash.*to/i.test(text) ||
      /(?:you\s+can\s+)?put,\s*from\s+your\s+reserve\/trash,\s*one\s+core\s+to\s+each\s+of\s+those\s+spirits/i.test(text) ||
      /(?:when\s+not\s+blocked,\s*)?(?:you\s+can\s+)?put\s+(?:a|\d+|[a-z]+)\s+cores?\s+from\s+this\s+spirit,\s*other\s+than\s+\[soul\s+core\],\s*to\s+your\s+life/i.test(text) ||
      /put\s+a\s+core\s+(?:from|form)\s+the\s+void\s+to\s+(?:this\s+spirit|your\s+life)/i.test(text) ||
      /(?:you\s+can\s+)?\+\d+\s+core\s+to\s+this\s+nexus/i.test(text)) {
    return parseCoreMovement(text);
  }
  if (/the\s+opponent\s+can't\s+move\s+cores/i.test(text) ||
      /unless\s+they\s+send\s+.*to\s+the\s+trash,\s*they\s+can't\s+use\s+it/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+cards\s+in\s+their\s+hand/i.test(text) ||
      /the\s+opponent\s+can't\s+declare\s+block/i.test(text)) {
    return { op: 'OPPONENT_RESTRICTION' };
  }
  if (/activate\s+their\s+effects\s+ignoring\s+the\s+levels/i.test(text)) {
    return { op: 'IGNORE_LEVELS' };
  }
  if (/(?:instead\s+of\s+sending\s+it\s+to\s+trash,\s*)?(?:you\s+can\s+)?set\s+(?:it|this\s+non-battling\s+spirit|a\s+.*mirage\s+card.*from\s+your\s+hand|a\s+card\s+with\s+mirage\s+effects\s+from\s+your\s+hand)/i.test(text)) {
    return { op: 'SET_MIRAGE' };
  }
  if (/put\s+.*facedown\s+under\s+this\s+spirit/i.test(text) ||
      /put\s+a\s+card\s+face-down\s+from\s+your\s+hand\s+under\s+this\s+spirit/i.test(text) ||
      /\(?(?:when\s+this\s+spirit\s+(?:is\s+depleted|leaves\s+the\s+field),?\s*)?(?:the\s+)?cards\s+(?:under(?:neath)?|beneath)(?:\s+this\s+spirit)?\s+are\s+(?:discarded|banished)\.?\)?/i.test(text) ||
      /\(?cards\s+(?:under(?:neath)?|beneath)(?:\s+this\s+spirit)?\s+are\s+(?:discarded|banished)/i.test(text) ||
      /discard\s+a\s+card\s+under\s+this\s+spirit/i.test(text)) {
    return { op: 'CARD_UNDERNEATH' };
  }
  if (/(?:you\s+can\s+)?-\d+\s+counters?/i.test(text) ||
      /reduce\s+your\s+counters\s+to\s+zero/i.test(text) ||
      /your\s+.*can\s+flip\s+when\s+it\s+attacks/i.test(text)) {
    return { op: 'COUNT_OPERATION' };
  }
  if (/immediately\s+end\s+this\s+step/i.test(text)) {
    return { op: 'END_STEP' };
  }
  if (/this\s+spirit\s+can\s+battle\s+up\s+to\s+(?:\d+|[a-z]+)\s+times\s+in\s+a\s+row/i.test(text) ||
      /you\s+can\s+carry\s+out\s+another\s+battle/i.test(text) ||
      /this\s+spirit\s+must\s+attack\s+that\s+spirit\s+if\s+possible/i.test(text)) {
    return { op: 'BATTLE_MODIFIER' };
  }
  if (/discard\s+a\s+magic\s+card\s+on\s+the\s+opposing\s+field/i.test(text) ||
      /discard\s+your\s+whole\s+hand/i.test(text) ||
      /discard\s+your\s+entire\s+deck/i.test(text) ||
      /put\s+a\s+card\s+from\s+your\s+decktop\s+to\s+the\s+removed\s+zone/i.test(text)) {
    return { op: 'DISCARD_ZONE' };
  }
  if (/it\s+can\s+remain\s+on\s+the\s+field\s+in\s+the\s+same\s+state/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/target\s+another\s+spirit\s+you\s+control/i.test(text)) {
    return { op: 'SELECT_TARGET' };
  }
  if (/reduce\s+the\s+number\s+of\s+cores\s+to\s+be\s+decreased\s+by\s+-\d+/i.test(text)) {
    return { op: 'PREVENT_LIFE_REDUCTION' };
  }
  if (/when\s+this\s+card\s+is\s+revealed\s+from\s+the\s+deck\s+by\s+.*you\s+can\s+put\s+it\s+onto\s+your\s+field/i.test(text) ||
      /discard\s+any\s+revealed\s+cards/i.test(text)) {
    return { op: 'REVEAL_INTERACTION' };
  }
  if (/this\s+card\s+in\s+hand\s+can\s+be\s+summoned/i.test(text) ||
      /you\s+can\s+put\s+as\s+many\s+copies\s+of\s+this\s+card\s+as\s+you\s+like\s+in\s+your\s+deck/i.test(text) ||
      /can\s+also\s+be\s+the\s+target\s+of\s+this\s+spirit's\s+\[show\s+up\]/i.test(text) ||
      /can\s+activate\s+at\s+the\s+same\s+time/i.test(text) ||
      /flip\s+a\s+pre-rebirth\s+.*spirit\s+you\s+control/i.test(text)) {
    return { op: 'CARD_RULE_MODIFIER' };
  }

  // Phase 15 (Contract Spirit Era) patterns
  if (/(?:put|send)\s+this\s+card\s+(?:face-up\s+)?(?:onto|on)\s+your\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVED_ZONE_ACTION', target: 'SELF' };
  }
  if (/stack\s+this\s+(?:from\s+(?:the|th)\s+hand\s+)?onto\s+your\s+target\s+spirit/i.test(text)) {
    return { op: 'STACK_CARD' };
  }
  if (/(?:while\s+this\s+card\s+is\s+in\s+soul\s+state,?\s*)?(?:you\s+can\s+)?\[contract\s+advent\]\s+onto\s+it/i.test(text)) {
    return { op: 'CONTRACT_ADVENT_RULE' };
  }
  if (/(?:you\s+can\s+)?send\s+(?:the\s+)?\[soul\s+core\]\s+from\s+your\s+reserve\/trash\s+to\s+the\s+counter\s+area/i.test(text) ||
      /send\s+(?:the\s+)?\[soul\s+core\]\s+from\s+your\s+trash\s+to\s+(?:this\s+nexus|any\s+spirit\s+you\s+control)/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }
  if (/(?:your\s+counter\s+can\s+\+[0-9]+|\+?[0-9]+\s+(?:opposing|your)\s+counters?)/i.test(text) ||
      /(?:you\s+can\s+)?-[0-9]+\s+opposing\s+counters?/i.test(text) ||
      /put\s+a\s+core\s+from\s+your\s+counter\s+area\s+to\s+your\s+life/i.test(text) ||
      /this\s+counter\s+-\d+\s+can\s+only\s+be\s+used\s+once\s+per\s+game/i.test(text) ||
      /reduce\s+up\s+to\s+(?:\d+|[a-z]+)\s+counters\s+you\s+have/i.test(text) ||
      /when\s+the\s+opposing\s+counter\s+increases\s+to/i.test(text)) {
    return { op: 'COUNT_OPERATION' };
  }
  if (/this\s+effect\s+activates\s+once\s+(?:and\s+only\s+once\s+)?more/i.test(text) ||
      /activate\s+this\s+effect\s+once\s+(?:and\s+only\s+once\s+)?more/i.test(text) ||
      /activate\s+this\s+effect,\s*ignoring\s+the\s+"once\s+per\s+turn"/i.test(text) ||
      /ignoring\s+the\s+\(once\s+per\s+turn:\s*same\s+name\)/i.test(text) ||
      /activate\s+the\s+mirage\s+effect\s+written\s+on\s+this\s+spirit/i.test(text) ||
      /(?:you\s+can\s+)?activate\s+(?:the|this\s+spirit's|one\s+of\s+the)\s*\([^)]+\)\s+effects?(?:\s+of\s+this\s+spirit)?/i.test(text) ||
      /ignoring\s+the\s+lv,?\s*activate\s+an\s+effect/i.test(text) ||
      /activate\s+a\s+\[during\s+advent\]\s+effect\s+of\s+this\s+spirit/i.test(text) ||
      /according\s+to\s+the\s+number\s+of\s+pre-advent\s+cards.*activate\s+the\s+following/i.test(text)) {
    return { op: 'ACTIVATE_EFFECT_SPECIAL' };
  }
  if (/(?:at\s+the\s+end\s+of\s+battle,?\s*)?(?:you\s+can\s+)?set\s+this\s+spirit/i.test(text) ||
      /you\s+can\s+discard\s+this\s+mirage/i.test(text) ||
      /you\s+can\s+immediately\s+activate\s+this\s+set\s+card/i.test(text) ||
      /flip\s+this\s+mirage\s+onto\s+the\s+field/i.test(text)) {
    return { op: 'MIRAGE_OPERATION' };
  }
  if (/(?:put|send)\s+.*to\s+(?:the|your)\s+remo(?:v|z)ed\s+zone/i.test(text)) {
    return { op: 'REMOVED_ZONE_ACTION' };
  }
  if (/cores\s+that\s+would\s+send\s+to\s+the\s+trash\s+to\s+your\s+reserve/i.test(text) ||
      /the\s+cores\s+to\s+be\s+sent\s+to\s+reserve.*are\s+sent\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /cores\s+on\s+(?:the\s+|opposing\s+)?spirits?.*are\s+sent\s+to\s+the\s+trash\s+instead\s+of\s+(?:the\s+)?reserve/i.test(text)) {
    return { op: 'REPLACEMENT_EFFECT', replacement: 'CORE_DESTINATION_TRASH', side: 'opp' };
  }
  if (/put\s+1~3\s+cores/i.test(text) ||
      /(?:you\s+can\s+)?put\s+(?:\d+|[a-z]+)\s+cores\s+from\s+your\s+.*grandwalker\s+nexuses\s+to\s+this\s+spirit/i.test(text) ||
      /(?:you\s+can\s+)?\+[123]\s+cores?\s+to\s+/i.test(text) ||
      /by\s+sending\s+either\s+two\s+cores/i.test(text) ||
      /sending\s+either\s+two\s+cores/i.test(text)) {
    return parseCoreMovement(text);
  }
  if (/the\s+opponent\s+sends\s+cores.*until\s+only\s+one\s+core\s+remains/i.test(text) ||
      /this\s+effect\s+can't\s+bring\s+the\s+cores\s+on\s+opposing\s+spirits\s+to\s+less\s+than\s+one/i.test(text) ||
      /this\s+effect\s+can't\s+bring\s+the\s+opposing\s+life\s+to\s+zero/i.test(text) ||
      /your\s+life\s+would\s+only\s+be\s+reduced\s+by\s+one\s+per\s+attack/i.test(text) ||
      /send\s+up\s+to\s+(?:\d+|[a-z]+)\s+opposing\s+lives\s+to\s+the\s+trash/i.test(text) ||
      /this\s+spirit\s+reduces\s+\+\d+\s+opposing\s+life/i.test(text) ||
      /every\s+opposing\s+spirit's\s+bp\s+becomes\s+0/i.test(text)) {
    return { op: 'LIFE_OR_CORE_MODIFICATION' };
  }
  if (/discards\s+\+\d+\s+card/i.test(text) ||
      /(?:by\s+|you\s+can\s+)?banish(?:ing)?\s+(?:up\s+to\s+)?(?:\d+|[a-z]+)\s+cards\s+from\s+you(?:r)?\s+decktop/i.test(text) ||
      /(?:by\s+|you\s+can\s+)?banish(?:ing)?\s+an?\s+.*from\s+your\s+hand/i.test(text) ||
      /reveal\s+a\s+card\s+from\s+the\s+opposing\s+decktop/i.test(text) ||
      /discard\s+that\s+magic\s+card/i.test(text)) {
    return { op: 'DECK_ACTION' };
  }
  if (/(?:it|they)\s+can\s+remain\s+on\s+the\s+field\s+in\s+the\s+same\s+state/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/(?:you\s+can\s+)?immediately\s+use\s+the\s+flash\s+effect\s+of\s+a\s+.*magic\s+card\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'USE_FROM_HAND' };
  }
  if (/effect\s+draws\s+\+\d+\s+card/i.test(text) ||
      /this\s+effect\s+can\s+reveal\s+\+\d+\s+cards/i.test(text) ||
      /give\s+all\s+your\s+.*spirits:\s*\[[^\]]+\]/i.test(text) ||
      /this\s+\[grand\s+field\]\s+doesn't\s+stack/i.test(text) ||
      /when\s+the\s+opponent\s+rebirths/i.test(text) ||
      /can\s+also\s+be\s+the\s+target\s+of\s+your\s+.*\[show\s+up\]/i.test(text) ||
      /under\s+the\s+"[^"]+"\s+to\s+be\s+summoned/i.test(text) ||
      /banished\s+instead\s+of\s+moving\s+to\s+hand\/removed\s+zone\/deck\/trash/i.test(text) ||
      /must\s+target\s+attack\s+this\s+spirit/i.test(text) ||
      /declare\s+either\s+spirit\s+card\s+or\s+magic\s+card/i.test(text) ||
      /target\s+up\s+to\s+(?:\d+|[a-z]+)\s+opposing\s+spirits/i.test(text) ||
      /change\s+the\s+"[^"]+"(?:\s+text)?\s+written\s+on\s+(?:this|the)\s+effect\s+to\s+"[^"]+"/i.test(text) ||
      /\[contract\s+advent\]\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'RULE_OR_TEXT_MODIFIER' };
  }

  // --- ERA 16-20 MECHANICS (Contract, Grandwalker, Mani, Tokens, Underneath) ---

  // Brave Effect Activation
  if (/when\s+braving\s+with\s+(?:the\s+)?target,?\s*(?:you\s+can\s+)?activate\s+the\s+following\s+effect/i.test(text)) {
    return { op: 'BRAVE_EFFECT_ACTIVATION' };
  }

  // Advent Cost & Soul Core Stack
  if (/^(?:by\s+)?stacking\s+this\s+card\s+from\s+your\s+hand\s+onto\s+its\s+target/i.test(text)) {
    return { op: 'ADVENT_COST', from: 'hand', target: 'TARGET' };
  }
  if (/including\s+those\s+that\s+are\s+in\s+soul\s+state\/pre-advent\s+condition,\s*send\s+your\s+\[soul\s+core\]\s+to\s+this\s+spirit/i.test(text)) {
    return { op: 'ADVENT_SOUL_CORE_ACTION' };
  }

  // Underneath & Pre-Advent Attach/Discard
  if (/(?:by\s+)?discarding\s+(?:a|an|one|two|three|four|five|\d+)\s+(?:of\s+your\s+.*)?(?:facedown\s+cards?|pre-advent\s+cards?)\s+under\s+/i.test(text) ||
      /(?:by\s+)?discarding\s+(?:a|an|one|two|three|four|five|\d+)\s+of\s+your\s+"[^"]+"\s+pre-advent\s+cards/i.test(text)) {
    return { op: 'DISCARD_UNDERNEATH_COST' };
  }
  if (/(?:put|place)\s+(?:up\s+to\s+)?(?:a|an|one|two|three|four|\d+)?\s*cards?\s+from\s+your\s+decktop\s+facedown\s+under\s+/i.test(text)) {
    return { op: 'ATTACH_CARD_UNDERNEATH' };
  }
  if (/(?:by\s+)?adding\s+a\s+.*card\s+from\s+your\s+hand\s+to\s+underneath\s+this\s+spirit\s+as\s+pre-advent\s+card/i.test(text)) {
    return { op: 'ATTACH_PRE_ADVENT_CARD' };
  }

  // Soul Core Actions & Soul State Transitions
  if (/(?:by\s+)?sending\s+your\s+\[soul\s+core\]\s+or\s+the\s+opposing\s+\[soul\s+core\]\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE', to: 'trash' };
  }
  if (/(?:by\s+|you\s+can\s+)?sending?\s+(?:your\s+)?(?:the\s+)?\[soul\s+core\]\s+(?:from\s+(?:your\s+)?field\/reserve\s+)?to\s+(?:your\s+)?life/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE', to: 'life' };
  }
  if (/(?:by\s+)?putting\s+your\s+\[soul\s+core\]\s+on\s+top/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE', to: 'top' };
  }
  if (/(?:can\s+enter|let\s+.*enter)\s+soul\s+state/i.test(text)) {
    return { op: 'ENTER_SOUL_STATE' };
  }
  if (/send\s+(?:your\s+)?\[soul\s+core\]\s+(?:\(soul core\)\s+)?from\s+(?:the\s+trash|your\s+reserve|a\s+spirit\s+you\s+control)\s+to\s+(?:your\s+reserve|another\s+spirit|any\s+of\s+your\s+spirit)/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }
  if (/send\s+(?:a|one|\d+)?\s*cores?,\s*besides\s+\[soul\s+core\],\s*from\s+your\s+trash\s+to\s+the\s+counter\s+area/i.test(text)) {
    return { op: 'MOVE_CORE', from: { zone: 'trash' }, to: { zone: 'counter_area' } };
  }
  if (/(?:by\s+|you\s+can\s+)?send(?:ing)?\s+(?:your\s+)?(?:the\s+)?\[soul\s+core\]/i.test(text) ||
      /(?:by\s+)?putting\s+your\s+\[soul\s+core\]\s+from\s+.*to\s+/i.test(text)) {
    return { op: 'MOVE_SOUL_CORE' };
  }

  // Pre-Advent Effect Inheritance
  if (/(?:gains?\s+(?:every|one|two|\d+)(?:\s+of\s+the)?(?:\s+(?:\([^)]+\)|\[[^\]]+\]))?\s+effects?\s+of\s+a\s+.*pre-advent\s+card\s+beneath\s+this\s+spirit,\s*ignoring\s+levels|all\s+the\s+\[during\s+oc\]-named\s+effects\s+written\s+on\s+this\s+spirit's\s+.*pre-advent\s+cards\s+activate\s+as\s+this\s+spirit's\s+effect)/i.test(text)) {
    return { op: 'COPY_PRE_ADVENT_EFFECT' };
  }

  // Banish Operations
  if (/banish\s+(?:up\s+to\s+)?(?:a|an|one|two|three|\d+)?\s*cards?\s+from\s+the\s+opposing\s+decktop/i.test(text)) {
    return { op: 'BANISH_DECK', target: 'opposing_decktop' };
  }
  if (/depleted\/destroyed\s+.*are\s+banished\s+instead\s+of\s+being\s+sent\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'BANISH_DESTINATION_RULE' };
  }
  if (/put\s+a\s+card\s+from\s+the\s+opposing\s+decktop\s+to\s+their\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVE_FROM_GAME', target: 'opposing_decktop' };
  }
  if (/^(?:by\s+)?banishing\s+a\s+card\s+.*from\s+your\s+trash/i.test(text)) {
    return { op: 'BANISH_COST' };
  }
  if (/banish\s+(?:an?\s+opposing|all\s+targets)/i.test(text)) {
    return { op: 'BANISH' };
  }

  // Switch & Swap Cards
  if (/(?:you\s+can\s+)?switch\s+this\s+card\s+from\s+(?:the\s+)?hand\s+with\s+a\s+.*in\s+the\s+same\s+condition/i.test(text)) {
    return { op: 'SWITCH_CARD' };
  }
  if (/(?:you\s+can\s+)?swap\s+(?:any\s+number\s+of|[a-z0-9\s\-]+)\s+cards?\s+among\s+them\s+with\s+your\s+hand/i.test(text)) {
    return { op: 'SWAP_CARDS' };
  }
  if (/swap\s+this\s+card\s+with\s+a\s+card\s+from\s+your\s+decktop/i.test(text) ||
      /swap\s+any\s+number\s+of\s+.*with\s+cards\s+in\s+your\s+hand/i.test(text)) {
    return { op: 'SWAP_CARDS' };
  }

  // Advent & Manifestation Rule Modifiers
  if (/this\s+card\s+can\s+\[(?:ultra\s+contract\s+advent|contract\s+advent|flag\s+contract\s+advent|mani)\]\s+from\s+the\s+(?:removed\s+zone|trash)/i.test(text) ||
      /you\s+can\s+\[(?:flag\s+contract\s+advent|contract\s+advent|ultra\s+contract\s+advent|mani)\]\s+this\s+card\s+from\s+the\s+(?:trash|removed\s+zone)/i.test(text) ||
      /(?:at\s+the\s+start\s+of\s+.*|when\s+your\s+.*would\s+end\s+.*)?you\s+can\s+\[(?:contract\s+advent|mani)\]\s+this\s+card\s+from\s+(?:your\s+)?(?:the\s+)?hand/i.test(text) ||
      /you\s+can\s+\[(?:mani|contract\s+advent)\]\s+.*ignoring/i.test(text) ||
      /you\s+can\s+\[contract\s+advent\]\s+a\s+card\s+from\s+your\s+hand\s+onto\s+this\s+spirit/i.test(text) ||
      /you\s+can't\s+\[contract\s+advent\]\s+onto\s+this/i.test(text) ||
      /the\s+opponent\s+can't\s+\[advent\]/i.test(text) ||
      /you\s+can\s+\[advent\]\s+.*ignoring\s+conditions/i.test(text)) {
    return { op: 'ADVENT_RULE_MODIFIER' };
  }

  // Token Deployment
  if (/(?:send(?:ing)?\s+out|deploy)\s+(?:up\s+to\s+)?(?:\d+|[a-z]+|any\s+number\s+of)?\s*.*tokens?/i.test(text)) {
    return { op: 'TOKEN_DEPLOYMENT' };
  }

  // Opponent Restriction & Game Loss Prevention
  if (/the\s+opponent\s+can't\s+increase\s+cores\s+from\s+the\s+void\s+via\s+effects/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+cards\s+from\s+(?:the\s+)?hand\s+outside\s+flash\s+timing/i.test(text) ||
      /unless\s+the\s+opponent\s+sends\s+one\s+of\s+their\s+lives\s+to\s+the\s+trash,\s*they\s+can't\s+use\s+cards\s+from\s+the\s+hand/i.test(text) ||
      /unless\s+the\s+opponent\s+sends\s+(?:one|two|\d+)\s+of\s+their\s+lives\s+to\s+the\s+reserve,\s*they\s+can't\s+use/i.test(text) ||
      /the\s+opponent\s+can\s+only\s+use\s+magic\s+cards\s+once\s+per\s+turn/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+cards\s+with\s+the\s+same\s+card\s+name\s+as\s+the\s+targeted\s+card/i.test(text) ||
      /(?:the\s+opponent\s+can't|can't)\s+end\s+(?:the\s+)?(?:attack\s+step|turn|turn\/attack\s+step)\s+via\s+effects/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+cards\s+from\s+the\s+hand\/removed\s+zone/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+\[trigger\s+counter\]/i.test(text) ||
      /the\s+opponent\s+can't\s+add\s+cores\s+from\s+the\s+void\s+to\s+their\s+nexuses\/reserve/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+(?:any\s+)?cards\s+.*(?:during|outside(?:\s+of)?)\s+flash\s+timing/i.test(text) ||
      /the\s+opponent\s+can't\s+use\s+non-[A-Za-z]+\s+cards/i.test(text) ||
      /neither\s+player\s+can\s+increase\s+cores\s+from\s+the\s+void\s+to\s+their\s+life/i.test(text) ||
      /until\s+the\s+end\s+of\s+(?:the\s+)?next\s+opposing\s+main\s+step,\s*the\s+opponent\s+can't\s+use\s+that\s+card/i.test(text) ||
      /flash\s+timing\s+doesn't\s+occur\s+for\s+the\s+opponent/i.test(text)) {
    return { op: 'OPPONENT_RESTRICTION' };
  }
  if (/(?:you\s+don't|won't)\s+lose(?:\s+the\s+game)?/i.test(text) ||
      /life\s+won't\s+be\s+brought\s+to\s+less\s+than/i.test(text) ||
      /when\s+your\s+life\s+would\s+become\s+zero,\s*your\s+life\s+would\s+become\s+one/i.test(text)) {
    return { op: 'PREVENT_LOSS' };
  }

  // Cast / Use Cards from Alternate Zones
  if (/you\s+can\s+use\s+this\s+face-up\s+card\s+from\s+your\s+deck/i.test(text)) {
    return { op: 'CAST_FROM_DECK' };
  }
  if (/you\s+can\s+use\s+this\s+card(?:\'s\s+\[[^\]]+\])?\s+from\s+the\s+trash/i.test(text) ||
      /this\s+card\s+can\s+be\s+used\s+from\s+the\s+trash/i.test(text)) {
    return { op: 'CAST_FROM_TRASH' };
  }
  if (/you\s+can\s+use\s+this\s+card\s+from\s+(?:the\s+)?hand/i.test(text)) {
    return { op: 'USE_FROM_HAND' };
  }
  if (/you\s+can\s+use\s+this\s+card\s+from\s+soul\s+state/i.test(text)) {
    return { op: 'USE_FROM_SOUL_STATE' };
  }

  // Force Attack & Attack Requirements
  if (/must\s+attack\s+(?:next\s+if\s+possible|at\s+the\s+beginning\s+of\s+this\s+step|at\s+the\s+start\s+of\s+this\s+step\s+if\s+possible)/i.test(text)) {
    return { op: 'FORCE_ATTACK' };
  }

  // Compare BP
  if (/(?:you\s+can\s+)?compare\s+the\s+bp\s+of\s+this\s+spirit\s+with\s+/i.test(text)) {
    return { op: 'COMPARE_BP' };
  }

  // Draw
  if (/the\s+opponent\s+draws\s+\d+~\d+\s+cards?\s+from\s+their\s+deck/i.test(text)) {
    return { op: 'DRAW' };
  }

  // Trigger & Activation Invocation
  if (/(?:activate|carry\s+out|proceed\s+to)\s+(?:the\s+following\s+)?(?:double\s+|cross\s+)?ultimate[\s-]trigger/i.test(text) ||
      /activate\s+(?:one\s+of\s+)?(?:the\s+|this\s+|that\s+card's\s+|your\s+)?(?:spirit's\s+|ultimate's\s+)?(?:\([^)]+\)\s+|\[contract\s+pre-advent\]\s+\([^)]+\)\s+|"when\s+blocked"\s+|\[[^\]]+\],\s*ignoring\s+.*|(?:main\/flash|flash)\s+)?(?:effects?|ultimate\s+trigger)/i.test(text) ||
      /(?:can\s+)?(?:immediately\s+)?activate\s+(?:one\s+of\s+|any\s+number\s+of\s+|a\s+|an\s+|its\s+|this\s+spirit's\s+)?.*(?:effects?|\[[^\]]+\]|ultimate\s+trigger)/i.test(text) ||
      /activate\s+(?:one\s+of\s+)?your\s+\[[^\]]+\],\s*ignoring/i.test(text) ||
      /activate\s+.*(?:flash|main\/flash)\s+effects?\s+of\s+.*ignoring/i.test(text) ||
      /you\s+can\s+activate\s+the\s+same\s+effect\s+.*again/i.test(text) ||
      /activates?\s+for\s+(?:\d+|[a-z]+)\s+(?:more|extra)\s+times?/i.test(text) ||
      /activate\s+this\s+effect\s+(?:a\s+number\s+of\s+times|once)/i.test(text) ||
      /\[extreme\s+drive\]\s+can\s+only\s+be\s+used\s+once\s+per\s+game/i.test(text)) {
    return { op: 'ACTIVATE_EFFECT_ACTION' };
  }

  // Piercing Protection Rules
  if (/can\s+only\s+be\s+prevented\s+by\s+(?:\[heavy\s+armor\]\/\[ultra\s+heavy\s+armor\]|"armor"-named\s+effects)/i.test(text)) {
    return { op: 'PIERCING_RULE' };
  }

  // Redirect Core Destination
  if (/cores?\s+.*sent\s+to\s+the\s+(?:opposing\s+)?(?:trash|void)(?:,\s*not|\s+(?:instead\s+of|not))\s+(?:the\s+)?(?:opposing\s+)?reserve/i.test(text) ||
      /sent\s+to\s+the\s+(?:opposing\s+)?trash\s+instead\s+of\s+the\s+reserve/i.test(text) ||
      /sends\s+(?:the\s+)?cores\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /cores\s+to\s+be\s+sent\s+to\s+the\s+opposing\s+reserve\s+via\s+your\s+effects\s+are\s+sent\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /cores?\s+(?:to\s+be\s+sent\s+)?(?:from\s+)?(?:the\s+)?(?:opposing\s+)?life\s+.*sent\s+to\s+(?:the\s+)?(?:opposing\s+)?trash/i.test(text) ||
      /cores?\s+to\s+be\s+sent\s+to\s+the\s+reserve\s+from\s+opposing\s+life.*sent\s+to\s+the\s+trash\s+instead/i.test(text) ||
      /all\s+cores\s+on\s+opposing\s+destroyed\s+spirits\s+are\s+sent\s+to\s+the\s+void/i.test(text)) {
    return { op: 'REDIRECT_CORE_DESTINATION' };
  }

  // Step & Battle Modifiers
  if (/the\s+chosen\s+step\s+doesn't\s+occur\s+for\s+the\s+opponent/i.test(text) ||
      /each\s+step\s+of\s+your\s+\[enchain\]\s+can\s+only\s+be\s+chosen\s+once\s+per\s+game/i.test(text) ||
      /you\s+choose\s+the\s+steps\s+of\s+your\s+\[enchain\]/i.test(text) ||
      /end\s+(?:this|that)\s+step/i.test(text) ||
      /immediately\s+end\s+the\s+current\s+battle/i.test(text)) {
    return { op: 'STEP_MODIFIER' };
  }

  // Deck Construction Rules
  if (/(?:only\s+one\s+copy|up\s+to\s+(?:\d+|[a-z]+)\s+copies)\s+of\s+this\s+card\s+can\s+be\s+put\s+in(?:to)?\s+(?:the\s+)?deck/i.test(text) ||
      /put\s+up\s+to\s+(?:\d+|[a-z]+)\s+copies\s+of\s+this\s+card\s+in\s+deck/i.test(text)) {
    return { op: 'DECK_CONSTRUCTION_RULE' };
  }

  // Rule Modifiers & Special Constraints
  if (/increase\s+the\s+limit\s+of\s+your\s+.*by\s+\+\d+/i.test(text) ||
      /only\s+(?:one|\d+)\s+cards?\s+can\s+be\s+drawn/i.test(text) ||
      /your\s+counter\s+can't\s+increase/i.test(text) ||
      /is\s+counted\s+as\s+(?:two|\d+)\s+spirits/i.test(text) ||
      /this\s+card\s+can\s+only\s+be\s+summoned\s+via\s+its\s+own\s+effect/i.test(text) ||
      /those\s+cores\s+can\s+only\s+be\s+used\s+by\s+this\s+card's\s+effect/i.test(text) ||
      /this\s+effect\s+cannot\s+bring\s+the\s+cores\s+on\s+the\s+opposing\s+spirit\s+to\s+0/i.test(text) ||
      /the\s+effects\s+of\s+spirits\s+destroyed\s+by\s+this\s+effect\s+do\s+not\s+activate/i.test(text) ||
      /effects?\s+.*draws?\s+\+\d+\s+card/i.test(text) ||
      /change\s+the\s+"[^"]+"(?:\s+text)?\s+written\s+(?:on|in)\s+.*to\s+"[^"]+"/i.test(text) ||
      /(?:the\s+)?"[^"]+"\s+text\s+of\s+this\s+effect\s+is\s+changed\s+to\s+"[^"]+"/i.test(text) ||
      /the\s+"[^"]+"\s+written\s+in\s+this\s+effect\s+changes\s+to\s+"[^"]+"/i.test(text) ||
      /change\s+its\s+target\s+to\s+all/i.test(text) ||
      /increase\s+the\s+number\s+of\s+targets\s+by\s+\+\d+/i.test(text) ||
      /decreases?\s+\d+\s+further/i.test(text) ||
      /discard\s+-\d+\s+card/i.test(text) ||
      /this\s+spirit\s+gains\s+all\s+teams/i.test(text) ||
      /can\s+only\s+be\s+blocked\s+by\s+.*spirits/i.test(text) ||
      /ignores?\s+"bp\+"\s+and\s+"give\s+\+\s*bp"\s+effects/i.test(text) ||
      /unless\s+you\s+put\s+a\s+.*underneath\s+this\s+card,\s*you\s+can't\s+\[advent\]/i.test(text) ||
      /this\s+effect\s+can\s+reveal\s+\+\d+\s+cards?/i.test(text) ||
      /this\s+effect\s+can\s+also\s+target\s+opposing\s+nexuses/i.test(text) ||
      /spirits\s+can't\s+remain\s+on\s+the\s+field\s+due\s+to\s+this\s+effect/i.test(text) ||
      /spirits\/ultimates\s+whose\s+bp\s+are\s+brought\s+to\s+\d+\s+by\s+this\s+effect\s+are\s+destroyed/i.test(text) ||
      /number\s+of\s+cores\s+designated\s+by\s+.*get\s+-\d+/i.test(text) ||
      /all\s+the\s+\([^)]+\)\s+effects\s+of\s+your\s+spirits\s+activate\s+at\s+\([^)]+\)/i.test(text) ||
      /change\s+to\s+target\s+.*instead/i.test(text) ||
      /these\s+happen\s+(?:\d+|one|two|three|four|five)\s+times/i.test(text) ||
      /the\s+targeting\s+bp\s+becomes\s+.*instead/i.test(text) ||
      /the\s+targeting\s+number\s+of\s+cores\s+becomes?\s+(?:two|\d+)\s+or\s+less\s+instead/i.test(text) ||
      /reduces?\s+\+\d+\s+(?:core\s+from\s+the\s+opposing\s+life|(?:opposing\s+)?life|core)/i.test(text) ||
      /counter\s+gets\s+-\d+/i.test(text) ||
      /\([^)]+\)\s+effects\s+don't\s+activate/i.test(text)) {
    return { op: 'CARD_RULE_MODIFIER' };
  }

  // Cost Actions
  if (/^(?:show|reveal)\s+(?:all\s+(?:of\s+)?your\s+hand|(?:all\s+|two\s+|\d+\s+)?(?:of\s+)?.*cards?\s+(?:in|from)\s+your\s+hand)\s+to\s+the\s+opponent/i.test(text)) {
    return { op: 'REVEAL_HAND' };
  }
  if (/(?:by\s+)?(?:revealing|showing)\s+this\s+card\s+from\s+the\s+hand(?:\s+to\s+the\s+opponent)?/i.test(text)) {
    return { op: 'REVEAL_FROM_HAND_COST' };
  }
  if (/^(?:by\s+)?discarding\s+a\s+"[^"]+"/i.test(text)) {
    return { op: 'DISCARD_COST' };
  }
  if (/(?:by\s+)?discarding\s+.*from\s+your\s+field/i.test(text)) {
    return { op: 'DISCARD_FROM_FIELD_COST' };
  }

  // Burst & Set Card Activations
  if (/immediately\s+activate\s+this\s+set\s+card/i.test(text) ||
      /this\s+set\s+card\s+can\s+immediately\s+activate/i.test(text)) {
    return { op: 'ACTIVATE_BURST' };
  }

  // Rebirth / Flip Actions
  if (/flip\s+(?:a|an|one|\d+)?\s*.*(?:spirit|grandstone|nexus)/i.test(text)) {
    return { op: 'REBIRTH_ACTION' };
  }

  // Attack & Battle Rules
  if (/attack\s+.*simultaneously/i.test(text) ||
      /attacking\s+simultaneously/i.test(text)) {
    return { op: 'ATTACK_RULE_MODIFIER' };
  }

  // Separate Brave
  if (/separating\s+an?\s+.*from\s+this\s+spirit/i.test(text)) {
    return { op: 'SEPARATE_BRAVE' };
  }

  // Discard Mirage / Remaining
  if (/discard\s+this\s+mirage/i.test(text) ||
      /discard\s+any\s+remain(?:i)?ng\s+cards/i.test(text) ||
      /discard\s+all\s+your\s+hand/i.test(text) ||
      /the\s+opponent\s+discards\s+cards\s+from\s+their\s+removed\s+zone/i.test(text)) {
    return { op: 'DISCARD' };
  }

  // Field / Deck / Hand Placements & Reveals
  if (/reveal\s+.*cards?\s+from\s+(?:each|both)\s+players?\'?s?\s+decktop/i.test(text)) {
    return extractRevealCardParams(text);
  }
  if (/reveal\s+.*cards?\s+from\s+(?:your\s+)?(?:hand|decktop|the\s+decktop)/i.test(text) ||
      /you\s+can\s+\d+\s+cards\s+from\s+your\s+decktop/i.test(text)) {
    return extractRevealCardParams(text);
  }
  if (/reveal\s+.*cards?\s+(?:with|by)\s+the\s+\[contract\s+field\]/i.test(text)) {
    return { op: 'REVEAL_CARDS' };
  }
  if (/put\s+a\s+magic\s+card\s+.*from\s+your\s+hand\s+onto\s+the\s+field/i.test(text)) {
    return { op: 'PUT_CARD_ON_FIELD' };
  }
  if (/put\s+up\s+to\s+.*magic\s+cards\s+from\s+your\s+trash\s+to\s+your\s+field/i.test(text) ||
      /put\s+a\s+.*magic\s+card\s+from\s+your\s+trash\s+to\s+the\s+field/i.test(text)) {
    return { op: 'PUT_CARD_ON_FIELD' };
  }
  if (/putting\s+up\s+to\s+.*cards?\s+from\s+your\s+decktop\s+facedown\s+onto\s+the\s+field/i.test(text)) {
    return { op: 'PUT_CARD_ON_FIELD' };
  }
  if (/discard\s+(?:a|an|one|two|three|four|\d+)\s+.*cards?\s+among\s+them/i.test(text) ||
      /discard\s+.*among\s+them/i.test(text)) {
    return { op: 'DISCARD_AMONG' };
  }
  if (/target\s+a\s+card\s+among\s+them/i.test(text) ||
      /target\s+a\s+card\s+in\s+the\s+opposing\s+removed\s+zone/i.test(text) ||
      /(?:^|,\s*|you\s+can\s+)target\s+(?:an?\s+|one|two|three|four|\d+|all|your|every)?\s*.*(?:spirit|ultimate|brave|nexus|card|opposing|of\s+your|"[^"]+")/i.test(text) ||
      /target\s+.*instead/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }
  if (/look\s+at\s+.*cards?\s+from\s+your\s+decktop/i.test(text)) {
    return { op: 'LOOK_AT_DECK' };
  }
  if (/^(?:by\s+)?sending\s+(?:one|\d+)\s+of\s+your\s+lives\s+to\s+/i.test(text)) {
    return { op: 'LIFE_PAY_COST' };
  }
  if (/besides\s+\[soul\s+core\],\s*you\s+can\s+put\s+up\s+to\s+.*cores?\s+from\s+your\s+trash\s+to\s+/i.test(text) ||
      /besides\s+\[soul\s+core\],\s*send\s+up\s+to\s+one\s+core/i.test(text) ||
      /put\s+up\s+to\s+.*cores,\s*besides\s+\[soul\s+core\].*from\s+your\s+trash\s+to\s+/i.test(text) ||
      /send\s+(?:up\s+to\s+)?(?:\d+|\d+~\d+|a|an|one|two|three|\d+)?\s*cores?,\s*besides\s+\[soul\s+core\].*to\s+(?:the\s+)?(?:reserve|trash|field|it|that\s+target|any|your\s+"[^"]+"|"[^"]+")/i.test(text) ||
      /send\s+any\s+number\s+of\s+cores,\s*up\s+to\s+one\s+core\s+for\s+every\s+.*from\s+an\s+opposing\s+spirit\s+to\s+the\s+reserve/i.test(text) ||
      /put\s+up\s+to\s+.*cores\s+from\s+your\s+trash\s+to\s+this\s+spirit/i.test(text) ||
      /send\s+up\s+to\s+one\s+core\s+per\s+number\s+of\s+counters\s+you\s+have/i.test(text)) {
    return parseCoreMovement(text);
  }
  if (/send\s+(?:\d+|[a-z]+)\s+opposing\s+live\s+to\s+the\s+reserve/i.test(text)) {
    return { op: 'REDUCE_LIFE' };
  }
  if (/puts?\s+.*from\s+.*to\s+(?:their|the)\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVE_FROM_GAME' };
  }
  if (/add\s+a\s+.*from\s+your\s+hand\s+to\s+underneath\s+this\s+spirit\s+as\s+pre-advent\s+card/i.test(text) ||
      /add\s+.*to\s+(?:beneath|underneath)\s+.*as\s+(?:a\s+)?pre-advent\s+cards?/i.test(text) ||
      /face-down\s+under\s+this\s+spirit/i.test(text)) {
    return { op: 'ATTACH_CARD_UNDERNEATH' };
  }
  if (/switch\s+any\s+number\s+of\s+.*with\s+cards\s+in\s+your\s+hand/i.test(text) ||
      /swap\s+(?:any\s+number\s+of\s+.*|.*)\s*with\s+cards\s+(?:in|from)\s+your\s+hand/i.test(text)) {
    return { op: 'SWAP_CARDS' };
  }
  if (/if\s+this\s+card\s+was\s+used\s+from\s+the\s+trash,\s*banish\s+it/i.test(text)) {
    return { op: 'BANISH' };
  }
  if (/remain\s+on\s+the\s+field,?\s*in\s+the\s+same\s+condition/i.test(text) ||
      /it\s+doesn't\s+leave\s+the\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/^when\s+(?:summoned\s+via\s+this\s+effect|your\s+ultimate\s+trigger\s+hits|your\s+hand\s+is\s+discarded\s+via\s+.*|the\s+number\s+of\s+cores\s+on\s+this\s+nexus\s+increases|this\s+card\s+is\s+revealed\s+by\s+the\s+\[contract\s+field\]|\[(?:manis?|manifest)\],|cards\s+are\s+put\s+onto\s+the\s+opposing\s+removed\s+zone|your\s+.*are\s+destroyed\s+by\s+opposing\s+effects|your\s+counter\s+increases\s+via\s+)/i.test(text)) {
    return { op: 'TRIGGER_CONDITION' };
  }

  // Step & Battle Modifiers
  if (/the\s+chosen\s+step\s+doesn't\s+occur\s+for\s+the\s+opponent/i.test(text) ||
      /extra\s+main\s+step\s+occurs/i.test(text) ||
      /each\s+step\s+of\s+your\s+\[enchain\]\s+can\s+only\s+be\s+chosen\s+once\s+per\s+game/i.test(text) ||
      /you\s+choose\s+the\s+steps\s+of\s+your\s+\[enchain\]/i.test(text) ||
      /end\s+(?:this|that)\s+step/i.test(text) ||
      /attack\s+step\s+doesn't\s+occur\s+for\s+the\s+opponent(?:\s+next\s+turn)?/i.test(text) ||
      /immediately\s+end\s+the\s+current\s+battle/i.test(text)) {
    return { op: 'STEP_MODIFIER' };
  }

  // Deck Construction Rules
  if (/(?:only\s+one\s+copy|up\s+to\s+\d+\s+copies)\s+of\s+this\s+card\s+can\s+be\s+put\s+into\s+the\s+deck/i.test(text)) {
    return { op: 'DECK_CONSTRUCTION_RULE' };
  }

  // Recipe joke promo text
  if (/(?:cut\s+the\s+beef|the\s+broth\s+is\s+bonito|boil\s+the\s+ingredients|upon\s+this\s+moment|very\s+strong)/i.test(text)) {
    return { op: 'CARD_RULE_MODIFIER' };
  }

  // Bandai English & Promo rules
  if (/move\s+target\s+spirit\s+to\s+the\s+top\s+of\s+its\s+owner's\s+deck/i.test(text)) {
    return { op: 'BOUNCE', destination: 'DECKTOP' };
  }
  if (/move\s+(?:the\s+top\s+)?(?:\d+|[a-z]+)\s+cards?\s+(?:of|from)\s+.*to\s+.*trash/i.test(text)) {
    return { op: 'MILL' };
  }
  if (/send\s+all\s+(?:but\s+one\s+of\s+the\s+cores|the\s+cores)/i.test(text)) {
    const leaveOne = /but\s+one/i.test(text);
    return { op: 'MOVE_CORE', count: 'ALL', minCoresRemaining: leaveOne ? 1 : 0 };
  }
  if (/you\s+can\s+put\s+(?:as\s+many|any\s+amount\s+of)\s+cores\s+from/i.test(text)) {
    return parseCoreMovement(text);
  }
  if (/(?:cards\s+cannot\s+be\s+discarded\s+from|neither\s+player's\s+decks\s+can\s+be\s+discarded)/i.test(text)) {
    return { op: 'DECK_IMMUNITY' };
  }
  if (/you\s+can't\s+use\s+this\s+card\s+during\s+main\s+step/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/this\s+card\s+(?:can\s+only|may\s+only|cannot)\s+be\s+used\s+by\s+/i.test(text)) {
    return { op: 'CARD_RULE_MODIFIER' };
  }
  if (/discard\s+(?:the\s+top\s+card|(?:\d+|[a-z]+)\s+cards?\s+from\s+the\s+top)\s+of\s+your\s+deck/i.test(text)) {
    return { op: 'MILL' };
  }
  if (/when\s+your\s+spirit\s+with\s+"holy\s+life"\s+is\s+blocked/i.test(text)) {
    return { op: 'RECOVER_LIFE', count: 1, condition: 'HOLY_LIFE_BLOCKED' };
  }
  if (/target\s+1\s+color/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }
  if (/instead\s+of\s+the\s+spirit\s+with\s+the\s+lower\s+bp,\s*the\s+spirit\s+with\s+the\s+higher\s+bp\s+is\s+destroyed/i.test(text) ||
      /will\s+battle\s+instead/i.test(text) ||
      /reverse\s+the\s+attacking\s+order/i.test(text) ||
      /use\s+their\s+level\s+\d+\s+bp\s+to\s+compare/i.test(text) ||
      /neither\s+player's\s+spirits\s+would\s+be\s+destroyed\s+by\s+bp\s+comparison/i.test(text)) {
    return { op: 'BATTLE_RULE_MODIFIER' };
  }
  if (/(?:send|put)\s+(?:two|\d+)\s+cores?\s+instead/i.test(text) ||
      /send\s+\+\d+\s+core/i.test(text) ||
      /add\s+cores\s+from\s+the\s+void\s+to\s+make\s+it\s+\d+/i.test(text) ||
      /put\s+a\s+core\s+from\s+the\s+destroyed\s+spirit\s+to\s+your\s+life/i.test(text) ||
      /put\s+the\s+core\s+to\s+this\s+spirit\s+instead/i.test(text) ||
      /send\s+(?:up\s+to\s+)?a\s+total\s+of\s+.*cores?,\s*besides\s+\[soul\s+core\]/i.test(text) ||
      /put\s+.*cores?\s+other\s+than\s+\[soul\s+core\].*from\s+your\s+trash\s+to/i.test(text) ||
      /take\s+.*cores?\s+from\s+the\s+void\s+and\s+put\s+beside\s+your\s+deck/i.test(text)) {
    return parseCoreMovement(text);
  }
  if (/change\s+the\s+text\s+of\s+curse/i.test(text) ||
      /ice\s+wall\s+effect\s+activate/i.test(text) ||
      /choose\s+a\s+spirit\s+on\s+your\s+field/i.test(text) ||
      /now\s+activates\s+when\s+this\s+spirit\s+attacks/i.test(text) ||
      /ultra\s+awaken\s+effect/i.test(text) ||
      /can\s+only\s+be\s+prevented\s+by/i.test(text) ||
      /you\s+can\s+only\s+use\s+\[[^\]]+\]\s+once\s+per\s+turn/i.test(text) ||
      /banish\s+\+\d+\s+card/i.test(text)) {
    return { op: 'CARD_RULE_MODIFIER' };
  }
  if (/neither\s+player\s+can\s+put\s+cores\s+to\s+their\s+life/i.test(text) ||
      /the\s+opponent\s+can\s+only\s+use\s+up\s+to\s+one\s+magic\s+card\s+per\s+turn/i.test(text)) {
    return { op: 'OPPONENT_RESTRICTION' };
  }
  if (/any\s+\(when\s+summoned\)\s+effects?\s+cannot\s+(?:be\s+activated|activate)/i.test(text) ||
      /(?:you\s+can't|neither\s+player\s+can)\s+make\s+cores\s+on\s+this\s+spirit\s+become\s+0/i.test(text) ||
      /cores\s+on\s+the\s+spirit\s+blocking\s+this\s+spirit\s+cannot\s+be\s+removed/i.test(text) ||
      /the\s+opponent\s+can\s+only\s+block\s+with/i.test(text) ||
      /no\s+cores\s+can\s+be\s+put\s+onto\s+this\s+nexus/i.test(text)) {
    return { op: 'RESTRICTION' };
  }
  if (/send\s+one\s+opposing\s+life\s+to\s+the\s+trash/i.test(text)) {
    return { op: 'REDUCE_LIFE' };
  }
  if (/your\s+opponent\s+loses/i.test(text)) {
    return { op: 'WIN_GAME' };
  }
  if (/shuffle\s+(?:the|your)\s+deck/i.test(text)) {
    return { op: 'SHUFFLE_DECK' };
  }
  if (/reveal\s+(?:five|\d+)\s+cards\s+instead/i.test(text) ||
      /(?:either|each)\s+player\s+reveal\s+a\s+card\s+from\s+their\s+decktop/i.test(text) ||
      /reveal\s+\d+\s+cards\s+from\s+the\s+top\s+of\s+your\s+deck/i.test(text)) {
    return { op: 'REVEAL_DECKTOP' };
  }
  if (/both\s+players\s+discard\s+their\s+hands/i.test(text) ||
      /when\s+your\s+opponent\s+has\s+\d+\s+or\s+more\s+cards\s+in\s+.*hand,\s*.*must\s+discard\s+(?:those\s+cards\s+)?until/i.test(text) ||
      /(?:discard\s+two\s+cards|discard\s+the\s+other|randomly\s+discards?\s+\d+\s+cards?)/i.test(text)) {
    return { op: 'DISCARD_HAND' };
  }
  if (/each\s+player\s+draws?\s+(\d+|one|two)\s+cards?/i.test(text)) {
    return { op: 'DRAW' };
  }
  if (/this\s+spirit\s+gets\s+bp\+\d+/i.test(text)) {
    return { op: 'BP_BUFF' };
  }
  if (/select\s+\d+\s+spirit/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }
  if (/(?:life\s+cannot\s+receive\s+any\s+damage|attacks?\s+.*can't\s+reduce\s+your\s+life|neither\s+player\s+loses\s+life\s+cores)/i.test(text)) {
    return { op: 'PREVENT_DAMAGE' };
  }
  if (/put\s+a\s+random\s+card\s+from\s+the\s+opposing\s+hand\s+on\s+the\s+removed\s+zone/i.test(text)) {
    return { op: 'REMOVE_FROM_GAME' };
  }
  if (/add\s+.*as\s+a\s+pre-advent/i.test(text)) {
    return { op: 'ATTACH_CARD_UNDERNEATH' };
  }
  if (/you\s+can\s+use\s+this\s+magic\s+card\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'USE_FROM_HAND' };
  }
  if (/^(?:by\s+)?discarding\s+an?\s+ultimate\s+card/i.test(text)) {
    return { op: 'DISCARD_COST' };
  }
  if (/look\s+through\s+your\s+(?:whole|entire)\s+deck/i.test(text)) {
    return { op: 'SEARCH_DECK' };
  }
  if (/this\s+card\/spirit\s+gains\s+the\s+.*famil/i.test(text)) {
    return { op: 'ADD_FAMILY' };
  }
  if (/your\s+opponent\s+cannot\s+use\s+magic\s+cards/i.test(text)) {
    return { op: 'SET_RESTRICTION' };
  }
  if (/look\s+at\s+the\s+(?:contents\s+of\s+the\s+top\s+card|first\s+card\s+on\s+top)\s+of\s+(?:the\s+opposing|your\s+opponent's)\s+deck/i.test(text)) {
    return { op: 'LOOK_AT_DECK' };
  }
  if (/you\s+can\s+\[?umani\]?\s+a\s+card/i.test(text)) {
    return { op: 'ACTIVATE_EFFECT_ACTION' };
  }
  if (/a\s+spirit\s+whose\s+bp\s+is\s+brought\s+to\s+0\s+by\s+this\s+effect\s+is\s+destroyed/i.test(text)) {
    return { op: 'DESTROY_ON_BP_ZERO' };
  }
  if (/you\s+can\s+use\s+a\s+.*magic\s+card\s+from\s+your\s+trash\s+as\s+if\s+it\s+was\s+from\s+your\s+hand/i.test(text)) {
    return { op: 'CAST_FROM_TRASH' };
  }
  if (/(?:by\s+)?using\s+the\s+cores\s+on\s+your\s+field/i.test(text)) {
    return { op: 'PAY_COST' };
  }
  if (/is\s+defeated,\s*it\s+is\s+moved\s+to\s+your\s+hand\s+instead\s+of\s+.*trash/i.test(text)) {
    return { op: 'BOUNCE' };
  }
  if (/this\s+card\s+can\s+also\s+advent\s+on\s+nexuses/i.test(text)) {
    return { op: 'ADVENT_RULE_MODIFIER' };
  }
  if (/the\s+opponent\s+must\s+.*a\s+spirit\s+they\s+control/i.test(text)) {
    return { op: 'DESTROY' };
  }
  if (/the\s+target\s+doesn't\s+move\s+from\s+the\s+field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/attack\s+step\s+and\s+end\s+step\s+occur\s+once\s+more/i.test(text)) {
    return { op: 'STEP_MODIFIER' };
  }
  if (/you\s+can\s+discard\s+up\s+to\s+.*of\s+this\s+spirit's\s+pre-advent\s+cards/i.test(text)) {
    return { op: 'DISCARD_PRE_ADVENT' };
  }
  if (/swap\s+all\s+the\s+cores\s+between\s+the\s+targeted/i.test(text)) {
    return { op: 'SWAP_CORES' };
  }
  if (/when\s+the\s+number\s+of\s+cards\s+in\s+your\s+deck\s+becomes\s+zero/i.test(text)) {
    return { op: 'TRIGGER_CONDITION' };
  }
  if (/(?:by\s+)?sending\s+this\s+spirit's\s+\[soul\s+core\]\s+to\s+your\s+trash/i.test(text)) {
    return { op: 'ADVENT_SOUL_CORE_ACTION' };
  }
  if (/look\s+at\s+the\s+contents\s+of\s+the\s+opposing\s+hand/i.test(text)) {
    return { op: 'LOOK_AT_HAND' };
  }
  if (/this\s+card\s+is\s+limited\s+to\s+one\s+copy\s+per\s+deck/i.test(text)) {
    return { op: 'DECK_CONSTRUCTION_RULE' };
  }
  if (/cores\s+that\s+this\s+effect\s+would\s+send\s+to\s+reserve\s+are\s+sent\s+to\s+the\s+trash\s+instead/i.test(text)) {
    return { op: 'REDIRECT_CORE_DESTINATION' };
  }
  if (/your\s+opponent\s+selects\s+a\s+spirit\s+they\s+control\s+and\s+compares\s+bp/i.test(text)) {
    return { op: 'COMPARE_BP' };
  }
  if (/(?:at\s+start\s+of\s+phase,\s*)?select\s+(?:a|\d+)\s+spirit/i.test(text)) {
    return { op: 'TARGET_CARD' };
  }

  // BP / Level Alterations
  if (/give\s+.*-\(?this\s+spirit's\s+bp\)?\s+bp/i.test(text) ||
      /give\s+an?\s+opposing\s+spirit\s+-\d+/i.test(text) ||
      /(?:make|change)\s+an?\s+opposing\s+spirit(?:\/ultimate)?\s+(?:to\s+)?\d+\s+bp/i.test(text) ||
      /an?\s+opposing\s+spirit(?:\/ultimate)?\s+becomes\s+\d+\s+bp/i.test(text) ||
      /bp\s+.*becomes\s+(?:the\s+same\s+as\s+that\s+spirit\/ultimate|1000|\d+\s+bp)/i.test(text) ||
      /the\s+target\s+becomes\s+\d+\s+bp/i.test(text) ||
      /compare\s+levels\s+instead\s+of\s+bp/i.test(text) ||
      /spirit\s+with\s+the\s+lower\s+lv\s+is\s+destroyed/i.test(text)) {
    return { op: 'BP_OR_LEVEL_MODIFIER' };
  }

  // Header / Timing block leftovers
  if (/^\(?\[?(?:when braved|cost \d+(?:\/\d+)*).*\(when (?:attacks|battles|blocks)\)?\]?$/i.test(text) ||
      /^\[when braved on the (?:left|right|left\/right)\]/i.test(text) ||
      /^\(?\(?when braved attacks\)?\)?$/i.test(text) ||
      /^\(?\(when your "[^"]+" family spirit attacks\)\)?$/i.test(text)) {
    return { op: 'HEADER' };
  }

  // 1. SYMBOLS
  if (/(?:fixed (?:as|at)|has|have|becomes?|beceom)\s+(?:having\s+)?(?:zero|0)\s+symbols?/i.test(text) ||
      /(?:zero|0)\s+symbols?/i.test(text) ||
      /beceom\s+(?:zero|0)/i.test(text)) {
    return { op: 'SET_SYMBOL', count: 0, side: /opposing|opponent/i.test(text) ? 'opp' : 'self' };
  }
  let mSymSet = text.match(/(?:symbols?.*?(?:become|becomes?|beceom|fixed (?:as|at)(?: being| having)?)\s+(one|two|three|four|five|\d+)\s*(?:(red|purple|green|white|yellow|blue|god|ultimate)\s*symbols?|symbols?)|\b(one|two|three|four|five|\d+)\s*(red|purple|green|white|yellow|blue|god|ultimate)\s*symbols?\b)/i);
  if (mSymSet) {
    const cnt = parseNumber(mSymSet[1] || mSymSet[3]);
    const col = mSymSet[2] || mSymSet[4];
    return { op: 'SET_SYMBOL', count: cnt, color: col ? capitalize(col) : 'Same', side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  if (/(?:symbols?.*?(?:treated|treated as)|treat.*symbols? as)\s*(both players' symbols|god symbols|your symbols|being on the field)/i.test(text)) {
    return { op: 'TREAT_SYMBOL', symbolType: /god/i.test(text) ? 'God' : /both players/i.test(text) ? 'BOTH_PLAYERS' : /being on the field/i.test(text) ? 'FIELD' : 'SELF' };
  }
  if (/(?:loses?|lose)\s+.*?(?:symbols?|symbol)/i.test(text)) {
    return { op: 'LOSE_SYMBOL', count: 1, side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  let mSymExt = text.match(/(?:gets?|add)\s+(?:an?\s+)?extra\s+(?:(red|purple|green|white|yellow|blue)\s+)?(?:reduction\s+)?symbols?/i);
  if (mSymExt) {
    return { op: 'ADD_SYMBOL', color: mSymExt[1] ? capitalize(mSymExt[1]) : 'Same', count: 1, side: 'self' };
  }
  if (/\(?while you have\s+.*?(?:symbols?|symbol).*?following effect/i.test(text)) {
    return { op: 'CHAIN_CONDITION', symbols: parseColors(text) };
  }
  if (/fulfill.*reduction symbols?|reduction symbols?.*(?:fulfilled|can't reduce|fixed at zero|to reduce)|can't use reduction symbols|no reduction symbols|target a symbol|symbols can't increase|use (?:the\s+)?symbols (?:of|from|in).*?(?:trash|soul state|reductions?)|ex symbol banished|purple ex symbol|add this spirit's symbols|add all of that spirit's bp and symbols|magic cards with the same color as symbols|if you control any purple symbol|make symbols zero|you choose the symbol|originally is fixed as having two symbols|make the ultimate symbols.*become|fill one of its reduction symbols|symbol\s*-[1-9]|adds?\s*\+[1-9]\s*symbols?|treat.*having no symbols/i.test(text)) {
    return { op: 'SYMBOL_RULE', side: /opposing/i.test(text) ? 'opp' : 'self' };
  }

  // 2. COSTS & LEVEL COSTS
  let mCostMod = text.match(/(?:this card in hand|the cost of this card in hand|this card's cost in hand|this card|this spirit card in your hand|this card in (?:your )?hand\/removed zone|this card in removed zone|this face-up card in your deck)\s+(?:gets|is decreased by|is increased by|is changed to|is|becomes?|at cost)\s*(?:cost\s+)?([+-]?\d+)/i)
    || text.match(/(?:this card in your hand|this card in your hand\/removed zone)\s+is\s+cost\s*(\d+)/i)
    || text.match(/the cost of .*? is changed to\s*(\d+)/i)
    || text.match(/during.*this card is cost\s*(\d+)/i);
  if (mCostMod) {
    const val = parseInt(mCostMod[1], 10);
    return { op: 'COST_MODIFIER', setCost: isNaN(val) ? undefined : val, side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  let mCostDec = text.match(/(?:decrease|decreases|decrease its cost by|reduce.*cost.*by|gets?)\s*([+-]?\d+)(?:\s*cost)?/i)
    || text.match(/reduce\s+the\s+cost.*?(?:by|-)\s*([+-]?\d+)/i);
  if (mCostDec) {
    const val = parseInt(mCostDec[1], 10);
    return { op: 'COST_MODIFIER', delta: isNaN(val) ? -1 : val, side: 'self' };
  }
  let mCostInc = text.match(/(?:increase|increases|increase the cost of.*?by|is increased by|cost\s*\+[1-9]|\+[1-9]\s*cost)\s*\+?(\d+)?/i);
  if (mCostInc) {
    const val = parseInt(mCostInc[1] || '1', 10);
    return { op: 'COST_MODIFIER', delta: isNaN(val) ? 1 : val, side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  if (/(?:increase|give).*?(?:l(?:evel|v)\s*costs?|\+[1-9]\s*lv\s*cost)|level\s+costs?.*increase/i.test(text)) {
    return { op: 'LEVEL_COST_MODIFIER', delta: 1, side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  let mLvCostSet = text.match(/lv\s*(\d+)\s*cost.*?becomes?\s*(\d+|one|two|zero|0)/i);
  if (mLvCostSet) {
    return { op: 'LEVEL_COST_MODIFIER', level: parseInt(mLvCostSet[1], 10), cost: parseNumber(mLvCostSet[2]) };
  }
  if (/the cost to be paid.*?becomes?\s*(\d+|one|two)|cost is 0/i.test(text)) {
    return { op: 'COST_MODIFIER', setCost: /0|zero/i.test(text) ? 0 : 1 };
  }
  let mPayCost = text.match(/(?:can\s+)?pay\s+(one|two|three|\d+)\s*(?:extra\s+)?costs?/i);
  if (mPayCost || /pay -1 cost/i.test(text)) {
    return { op: 'PAY_COST', amount: mPayCost ? parseNumber(mPayCost[1]) : 1 };
  }
  if (/(?:you|the opponent)\s+(?:can\s+)?chooses?\s+(?:a\s+)?cost|target a cost/i.test(text)) {
    return { op: 'CHOOSE_COST', side: /opponent/i.test(text) ? 'opp' : 'self' };
  }
  let mLim = text.match(/increase\s+(?:the\s+)?(?:cost\s+limit|upper limit|limit).*?(?:by|\+)\s*\+?(\d+)/i);
  if (mLim) {
    return { op: 'EFFECT_PARAMETER_MODIFIER', parameter: 'COST_LIMIT', delta: parseNumber(mLim[1]) };
  }
  if (/ignore\s+the\s+cost\s+of\s+braves?/i.test(text)) {
    return { op: 'IGNORE_BRAVE_COST' };
  }
  if (/accel:\s*cost|for each cost of the spirit card|cost \d+ or (?:more|less) spirits\/ultimates|costs of cards in the opposing|at the start of either attack step, you can pay|can pay one cost to use this card|cost of this card in hand gets|this card's cost in hand gets|the cost of cards in opposing hand is increased|neither player can use cards with a cost|hand can only be increased by one per turn via cost|the attacks of cost \d+ or less spirits can't reduce|attacks? from opposing cost \d+ or less spirits can't decrease|this card in trash can be summoned when your cost|discard (?:a|an opposing) cost \d+ or less|cost \d+ or more|cost 9 pre-advent cards|cost 6 or less spirit card in the opposing trash|the opponent can't pay costs|can't pay the cost from the reserve|the cost of this spirit and (?:the )?cores.*must be paid|this card's cost becomes the same as|its cost becomes the same as|treat.*costs? as being paid|use cores from the opposing reserve\/nexuses.*to pay|pay the entire cost by using|reduce\s+the\s+cost\s+with\s+symbols/i.test(text)) {
    return { op: 'COST_RULE', side: /opposing/i.test(text) ? 'opp' : 'self' };
  }

  // 3. BURSTS & KEYWORDS
  let mActBurst = text.match(/(?:you can\s+)?(?:immediately\s+)?activate\s+(?:one\s+of\s+)?(?:your\s+)?(?:set\s+)?(?:(".*?"|[\w\s/-]+?)\s+family\s+)?bursts?/i);
  if (mActBurst || /(?:you can\s+)?immediately activate one of.*bursts/i.test(text)) {
    return { op: 'ACTIVATE_BURST', family: mActBurst && mActBurst[1] ? mActBurst[1].replace(/"/g, '').trim() : null, side: 'self' };
  }
  if (/(?:doesn't|don't)\s+trigger\s+opposing\s+bursts/i.test(text)) {
    return { op: 'CANNOT_TRIGGER_BURST', side: 'opp' };
  }
  let mActKw = text.match(/(?:you can\s+)?(?:immediately\s+)?activate\s+(?:this|its|this card's|this spirit's|one of this.*?)?\s*\[(contract skill|accel|reborn|rebirth|shamanism|enchain|war catalyze|grandphosis|exchange)/i);
  if (mActKw) {
    return { op: 'ACTIVATE_KEYWORD', keyword: capitalize(mActKw[1]), side: 'self' };
  }
  if (/activaet\s+a\s+\(when\s+summoned\)\s+effect|also activates its.*mirage effects|all the (?:when blocks|\(when blocks\)) effects.*activate at (?:when attacks|\(when attacks\)?)|neither player can activate \[rebirth|can also be the target of this spirit's \[show up|you choose the steps of your \[enchain|opponent can't \[(?:advent|trigger counter)|the opponent can't use \[trigger counter|when summoned from the deck, you can activate|replaced with \[exchange|effect of opposing ".*?" family braves can only be activated once per turn|you can flip the target/i.test(text)) {
    return { op: 'KEYWORD_RULE', side: /opposing|opponent/i.test(text) ? 'opp' : 'self' };
  }

  // 4. TREAT RULES
  let mTrLv = text.match(/(?:treated|treat).*?(?:at|as being on|as being at|in)\s*(?:its|their)?\s*(highest|lowest)\s*l(?:evel|v)s?/i);
  if (mTrLv) {
    return { op: 'TREAT_RULE', treatAs: 'LEVEL', value: mTrLv[1].toUpperCase(), side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  let mTrLvNum = text.match(/(?:treated|treat).*?(?:as being on|as being at|as)\s*(?:being\s+)?(?:\[\s*)?lv\s*(\d+)/i);
  if (mTrLvNum) {
    return { op: 'TREAT_RULE', treatAs: 'LEVEL', value: parseInt(mTrLvNum[1], 10), side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  if (/treat.*?(?:as if you were never blocked|as not (?:being )?blocked)/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'UNBLOCKED' };
  }
  if (/treat(?:ing)?.*?(?:as having no color|colorless)/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'COLORLESS' };
  }
  if (/treat(?:ed)?\s+this\s+spirit\s+as\s+a\s*.*?\s*spirit\s+as\s+well\s+as|treated as a?\s*(?:green\/white|red\/purple|blue|green|white|yellow|purple)\s*spirit|is also treated as a\s*(?:green\/white|red\/purple|blue|green|white|yellow|purple)\s*spirit/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'COLOR', colors: parseColors(text) };
  }
  let mTrName = text.match(/treated as (?:being named|having)?\s*"([^"]+)"(?:\s*in name)?/i)
    || text.match(/treat this spirit as having "([^"]+)" in name/i)
    || text.match(/treat one of the spirits.*as having the same name/i);
  if (mTrName) {
    return { op: 'TREAT_RULE', treatAs: 'NAME', name: mTrName[1] || 'SAME_AS_TRASH' };
  }
  if (/treat(?:ing)?\s*(?:this spirit as having the|your)?\s*\[soul core\]/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'SOUL_CORE' };
  }
  let mTrCnt = text.match(/(?:treat your number of counters as|opposing counter is treated as)\s*(\d+|six)/i);
  if (mTrCnt) {
    return { op: 'TREAT_RULE', treatAs: 'COUNTER', count: parseNumber(mTrCnt[1]) };
  }
  if (/treated as (two|\d+)\s*spirits/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'COUNT', count: 2 };
  }
  if (/treat all of this card's reduction as filled/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'REDUCTION_FILLED' };
  }
  if (/treat this spirit as being summoned twice|is also treated as an? ".*?" effect/i.test(text)) {
    return { op: 'TREAT_RULE', treatAs: 'GENERIC' };
  }

  // 5. CORE / ZONE / CARDS
  if (/(?:braves?|spirits?|ultimates?|nexuses?)\s+can't\s+remain\s+on\s+the\s+field/i.test(text)) {
    return { op: 'CANNOT_REMAIN_ON_FIELD', types: parseTypes(text) };
  }
  if (/they can remain on (?:the\s+)?field/i.test(text)) {
    return { op: 'REMAIN_ON_FIELD' };
  }
  if (/cores?.*cannot be removed/i.test(text) || /number of cores.*cannot become less than/i.test(text)) {
    return { op: 'PROTECT_CORES', side: 'self' };
  }
  if (/cores?.*(?:sent|would be sent).*to the (?:reserve|trash|void).*instead|sent to the (?:trash|void),?\s*(?:not|instead of)\s*(?:the\s+)?(?:reserve|trash)/i.test(text)) {
    return { op: 'REDIRECT_CORE', destination: /void/i.test(text) ? 'void' : 'trash' };
  }
  if (/the opponent decides how to move the cores/i.test(text)) {
    return { op: 'CORE_SEPARATION_RULE', side: 'opp' };
  }
  if (/these cores can only be used for this effect/i.test(text)) {
    return { op: 'CORE_USAGE_RESTRICTION', target: 'self' };
  }
  if (/this effect sends (two|\d+) cores each to reserve instead|send\s+(?:up\s+to\s+)?(a|one|two|three|\d+)\s+cores?(?:,\s*besides\s*\[soul core\],)?\s*from\s+your\s+(?:trash|field|reserve)\s+to|send\s+(three|\d+)\s+cores\s+each\s+from\s+(?:three|\d+)\s+opposing\s+spirits\s+to\s+the\s+reserve|add (one|\d+) core from the void to this spirit for every|send(?:ing)?\s+(?:either\s+|up to\s+)?(two|three|\d+)\s+cores?|sending your \[soul core|put two cores instead|the core put by this effect can be|send a number of cores equal to the cost|send a core.*to any "Contractor Ra-Harakhti"/i.test(text)) {
    return parseCoreMovement(text);
  }

  // 6. SWITCH / DISCARD / SHOW / COPY
  if (/(?:switch|swap|replace)\s+(?:a|any|one|two|\d+)?\s*.*?(?:with|from)/i.test(text) ||
      /either discard this card,? or (?:replace|switch)/i.test(text) ||
      /cannot be switched from the field/i.test(text)) {
    return { op: 'SWITCH_CARD', side: 'self' };
  }
  if (/discard\s+(?:a|one|\d+)?\s*.*from the opposing removed zone|discard\s+(?:this card|one of your set mirage)\s+from the (?:removed zone|set mirage)|discard one of your set mirage|among them, discard|discarding either a|discard cards from your deck until|for each ".*?" family card in your removed zone, this "opposing deck banishing effect"|deck can be discarded|moves \d+ cards from the top of their deck into their trash|increase the "opposing deck discarding\/banishing effects"/i.test(text)) {
    return { op: 'DISCARD_ZONE', side: /opposing/i.test(text) ? 'opp' : 'self' };
  }
  let mBanish = text.match(/(?:you can\s+)?banish\s+(one|two|three|four|\d+)\s+.*cards? in (?:your )?trash/i)
    || text.match(/banishing\s+(one|two|three|four|\d+)\s+.*card from your hand/i);
  if (mBanish) {
    return { op: 'BANISH_CARD', count: parseNumber(mBanish[1]), zone: /hand/i.test(text) ? 'HAND' : 'TRASH', isCost: true };
  }
  if (/(?:you can\s+)?show\s+(?:up to\s+)?(a|one|two|\d+)?\s*.*cards?.*to the opponent|showing to the opponent|flipping two of your|send (?:a|up to two)\s*".*?" family cards? to the trash|revealing one cost \d+.*putting it on your field/i.test(text)) {
    return { op: 'REVEAL_AND_SHOW', side: 'self' };
  }
  if (/this spirit gains every effect of a cost/i.test(text)) {
    return { op: 'COPY_EFFECT', side: 'self' };
  }

  // 7. FAMILY / NAMES
  if (/(?:this cards?|this spirit)\s+has\s+(?:the\s+)?".*?" family|this card\/spirit has ".*?" family|this card in trash has the ".*?" family|all of your ".*?" attribute spirits gain the following effect/i.test(text)) {
    const famM = text.match(/"([^"]+)"\s*(?:family|attribute)/i);
    return { op: 'GRANT_FAMILY', family: famM ? famM[1] : null, side: 'self' };
  }
  if (/the ".*?" family text written on this spirit's effect is changed to/i.test(text)) {
    return { op: 'CHANGE_FAMILY_TEXT', side: 'self' };
  }

  // 8. COMBAT / BP / STEP / RESTRICTION
  if (/after the step ends.*extra attack step occurs/i.test(text)) {
    return { op: 'EXTRA_STEP', step: 'ATTACK_STEP' };
  }
  if (/attack step doesn't occur on the next opposing turn/i.test(text)) {
    return { op: 'SKIP_STEP', step: 'ATTACK_STEP', side: 'opp' };
  }
  let mBpBf = text.match(/every red ".*?" family spirit you control gains \+\s*(\d+)\s*bp/i);
  if (mBpBf) {
    return { op: 'BP_BUFF', amount: parseNumber(mBpBf[1]), target: { side: 'self' } };
  }
  if (/ultimates don't have to block|opposing ultimates don't have to block/i.test(text)) {
    return { op: 'COMBAT_RULE', rule: 'OPTIONAL_BLOCK' };
  }
  if (/when comparing bp.*instead of comparing bp|when your ".*?"-named spirit compares bp|you can compare the bp of|both battles conclude at the same time|separate them if they are already braved/i.test(text)) {
    return { op: 'COMBAT_RULE', rule: 'COMPARE_BP' };
  }
  if (/when three cards are put, immediately attack/i.test(text)) {
    return { op: 'ATTACK_DECLARATION', side: 'self' };
  }
  if (/unless the opponent (?:pays|sends).*they can't use|when the opponent would use.*unless.*can't use|can't use.*unless they pay|(?:can't use|neither player can use)\s+cards with an? (?:even|odd) number cost|neither player can use cost \d+ or less magic effects|this card can only be used if there are|this card can only be used if you control|when you use a ".*?" family magic card|when your ".*?" family spirit has left the field|the opponent can't use non-".*?" family spirit cards|your ".*?" family "deck-revealing effects" reveal \+\d+ card|your life can only be decreased by \d+ per turn|you can set up to two mirages|add a ".*?" family card from your trash to underneath this spirit/i.test(text)) {
    return { op: 'PLAY_RESTRICTION', side: /opposing|opponent/i.test(text) ? 'opp' : 'self' };
  }

  // 9. HEADERS
  if (/^\(?\[?(?:cost \d+.*|diva & cost|armed machine|evil shadow|purple &|purple\/white|when braved|\[when braved|\{cost).*$/i.test(text)) {
    return { op: 'HEADER' };
  }

  // If unrecognized, return generic unsupported clause for compiler tracking
  return {
    op: 'UNSUPPORTED',
    rawText: text
  };
}

function extractFirstNumber(text, fallback = 1) {
  const m = String(text || '').match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i);
  return m ? parseNumber(m[1]) : fallback;
}

function extractQuotedTerms(text) {
  return [...String(text || '').matchAll(/"([^"]+)"/g)].map(m => m[1]);
}

function extractBracketTerm(text) {
  const m = String(text || '').match(/\[([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

export function enrichHijClauseOp(res, rawText) {
  const enriched = enrichHijClauseOpInner(res, rawText);
  if (!enriched || typeof enriched !== 'object' || !enriched.op) return enriched;
  if (isIncompleteOpObject(enriched)) {
    const rec = recoverExplicitOpParameters(enriched, rawText);
    if (rec.recovered && rec.params) {
      return { ...enriched, ...rec.params };
    }
  }
  return enriched;
}

function enrichHijClauseOpInner(res, rawText) {
  if (!res || typeof res !== 'object' || !res.op) return res;
  const text = String(rawText || '').trim();
  const op = String(res.op);
  const side = /both\s+players|neither\s+player/i.test(text) ? 'both' : (/opposing|opponent/i.test(text) ? 'opp' : 'self');
  const cols = parseColors(text);
  const quotes = extractQuotedTerms(text);
  const bracket = extractBracketTerm(text);

  switch (op) {
    case 'ACTIVATE_EFFECT_ACTION': {
      const timingM = text.match(/\((When[^)]+|During[^)]+)\)/i);
      const out = { ...res };
      if (!out.keyword && bracket) out.keyword = bracket;
      if (!out.timing && timingM) out.timing = timingM[1].toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      if (!out.action && !out.keyword && !out.timing) out.action = /ultimate\s+trigger/i.test(text) ? 'ULTIMATE_TRIGGER' : 'ACTIVATE_EFFECT';
      if (out.side === undefined) out.side = side;
      return out;
    }
    case 'ACTIVATE_EFFECT_SPECIAL':
      return { per: /counter/i.test(text) ? 'counters' : (/pre-advent/i.test(text) ? 'pre_advent' : 'condition'), threshold: extractFirstNumber(text, 1), mode: /more/i.test(text) ? 'repeat' : 'special', ...res };
    case 'ACTIVATE_TRIGGER': {
      const tm = text.match(/\((When\s+Summoned|When\s+Attacks|When\s+Blocked|When\s+Destroyed|When\s+Advents)\)/i);
      return { trigger: tm ? tm[1].toUpperCase().replace(/\s+/g, '_') : (/bunshin/i.test(text) ? 'BUNSHIN' : 'WHEN_SUMMONED'), side, ...res };
    }
    case 'TRIGGERED_WATCHER':
      return { watchEvent: /magic/i.test(text) ? 'USE_MAGIC' : (/summon/i.test(text) ? 'ON_SUMMON' : (/attack/i.test(text) ? 'WHEN_ATTACKS' : 'ON_EVENT')), side, ...res };
    case 'TRIGGER_CONDITION':
      return { event: /soul\s+core/i.test(text) ? 'SOUL_CORE_MOVED' : (/attacks/i.test(text) ? 'OPPOSING_ATTACKS' : 'CUSTOM_TRIGGER'), side, ...res };
    case 'TRIGGER_COUNTER':
      return { counterTiming: 'BEFORE_WHEN_ATTACKS', when: /ultimate\s+trigger/i.test(text) ? 'ULTIMATE_TRIGGER_HIT' : 'TRIGGER_HIT', zone: 'hand', ...res };
    case 'CROSS_TRIGGER':
      return { lifeThreshold: /three|3/i.test(text) ? 3 : extractFirstNumber(text, 3), triggerMode: 'CROSS_ULTIMATE_TRIGGER', ...res };
    case 'BRAVE_EFFECT_ACTIVATION':
      return { when: 'WHEN_BRAVED', timing: 'WHEN_BRAVED', ...res };
    case 'ACTIVATE_KEYWORD':
      return { keyword: res.keyword || bracket || 'Dragonshot', ...res };
    case 'ON_BP_DESTROY':
      return { whoseDestroyed: /only\s+the\s+opposing/i.test(text) ? 'opp_only' : 'opp', when: 'BP_COMPARISON_DESTROY', ...res };
    case 'CONTRACT_ADVENT_RULE':
      return { zone: /soul\s+state/i.test(text) ? 'soul' : 'hand', adventType: 'CONTRACT_ADVENT', rule: 'ALLOW_CONTRACT_ADVENT', ...res };
    case 'ADVENT_RULE_MODIFIER':
      return {
        fromZone: /removed/i.test(text) ? 'removed' : (/trash/i.test(text) ? 'grave' : 'hand'),
        adventType: /ultra\s+contract/i.test(text) ? 'ULTRA_CONTRACT_ADVENT' : (/contract/i.test(text) ? 'CONTRACT_ADVENT' : (/mani/i.test(text) ? 'MANI' : 'ADVENT')),
        ignoreCondition: /ignoring/i.test(text),
        ...res
      };
    case 'ADVENT_RULE':
      return { when: /accel/i.test(text) ? 'AFTER_ACCEL' : 'WHEN_ELIGIBLE', fromZone: /trash/i.test(text) ? 'grave' : 'hand', adventType: 'ADVENT', ...res };
    case 'ADVENT':
    case 'ADVENT_COST':
    case 'STACK_CARD':
      return { from: /removed/i.test(text) ? 'removed' : (/trash/i.test(text) ? 'grave' : 'hand'), target: 'TARGET', ...res };
    case 'PUT_UNDERNEATH':
    case 'ATTACH_CARD_UNDERNEATH':
    case 'ATTACH_CARD': {
      const fromSide = /opposing\s+decktop|opponent['’]s\s+(?:deck|hand|trash)/i.test(text) ? 'opp' : 'self';
      let underTarget = quotes[0] ? { name: quotes[0] } : 'SELF';
      if (/under\s+(?:any|one\s+of)\s+(?:the\s+)?opposing\s+Spirits?(?:\/Ultimates?)?/i.test(text)) {
        underTarget = { side: 'opp', types: /ultimate/i.test(text) ? ['Spirit', 'Ultimate'] : ['Spirit'] };
      } else if (/under\s+(?:any|one\s+of)\s+(?:the\s+)?opposing\s+Ultimates?/i.test(text)) {
        underTarget = { side: 'opp', types: ['Ultimate'] };
      }
      return {
        from: /decktop/i.test(text) ? 'decktop' : (/trash/i.test(text) ? 'grave' : (/hand/i.test(text) ? 'hand' : 'field')),
        fromSide,
        count: extractFirstNumber(text, 1),
        target: underTarget,
        facedown: /face-?down/i.test(text),
        ...res
      };
    }
    case 'ATTACH_PRE_ADVENT_CARD':
      return { from: /hand/i.test(text) ? 'hand' : 'field', target: 'SELF', count: extractFirstNumber(text, 1), upTo: /any\s+number|as\s+many/i.test(text), ...res };
    case 'CARD_UNDERNEATH':
      return { action: /discard/i.test(text) ? 'discard' : 'put', from: /hand/i.test(text) ? 'hand' : (/decktop/i.test(text) ? 'decktop' : 'underneath'), target: 'SELF', count: extractFirstNumber(text, 1), facedown: /face-?down/i.test(text), ...res };
    case 'DISCARD_UNDERNEATH_COST':
      return { count: extractFirstNumber(text, 1), facedownOnly: /face-?down/i.test(text), target: quotes[0] ? { name: quotes[0] } : 'SELF', ...res };
    case 'SWAP_CARD':
    case 'SWITCH_CARD':
      return { from: 'hand', target: quotes[0] ? { side: 'self', name: quotes[0] } : 'TARGET', ...res };
    case 'SWAP_CARDS':
      return { from: 'revealed', to: 'hand', count: /any\s+number/i.test(text) ? 99 : extractFirstNumber(text, 1), filter: cols[0] ? { color: cols[0] } : { any: true }, ...res };
    case 'MIRAGE_OPERATION':
      return { action: /discard/i.test(text) ? 'discard' : (/flip/i.test(text) ? 'flip' : 'set'), side, ...res };
    case 'DISCARD_MIRAGE_COST':
      return { count: 1, zone: 'mirage', side: 'self', ...res };
    case 'COPY_EFFECT': {
      const tm = text.match(/\((When\s+Summoned|When\s+Attacks|When\s+Blocked|When\s+Destroyed|When\s+Advents)\)/i);
      return { source: 'self', timing: tm ? tm[1].toUpperCase().replace(/\s+/g, '_') : 'ANY', target: 'SELF', ...res };
    }
    case 'COPY_PRE_ADVENT_EFFECT':
      return { filter: quotes[0] ? { name: quotes[0] } : {}, ignoreLevels: /ignoring\s+levels/i.test(text), scope: /every|all/i.test(text) ? 'all' : 'one', ...res };
    case 'COPY_ABILITY':
      return { abilityType: /armor/i.test(text) ? 'keyword' : 'effect', keyword: bracket || (/ultra\s+armor/i.test(text) ? 'Ultra Armor' : 'Armor'), filter: quotes[0] ? { name: quotes[0] } : {}, ...res };
    case 'MULTIPLY_EFFECT':
      return { per: 'controlled_spirits', multiplier: 1, filter: cols[0] ? { color: cols[0], type: 'Spirit' } : { type: 'Spirit' }, ...res };
    case 'MODIFY_DESTINATION':
    case 'BANISH_DESTINATION_RULE':
      return { destination: /banish|removed/i.test(text) ? 'removed' : (/bottom/i.test(text) ? 'deck_bottom' : 'hand'), replaces: /deplete/i.test(text) ? 'DESTROYED_OR_DEPLETED' : 'DESTRUCTION', ...res };
    case 'REDIRECT_TARGET':
    case 'CHANGE_TARGET': {
      const bpM = text.match(/(\d+)\s*(?:BP\s+)?or\s+less/i);
      return { bpMax: bpM ? parseInt(bpM[1], 10) : 5000, mode: /other\s+than\s+this/i.test(text) ? 'change_target' : 'modify_bp_limit', newTarget: /single\s+spirit\s+you\s+control/i.test(text) ? { side: 'self', types: ['Spirit'] } : null, excludeSelf: /other\s+than\s+this/i.test(text), ...res };
    }
    case 'REDIRECT_CORE_DESTINATION':
      return { fromZone: /life/i.test(text) ? 'life' : 'field', destination: /void/i.test(text) ? 'void' : 'grave', cause: 'effect', side, ...res };
    case 'LIFE_OR_CORE_MODIFICATION':
      return { count: extractFirstNumber(text, 1), fromZone: /life|lives/i.test(text) ? 'life' : 'field', destination: /void/i.test(text) ? 'void' : 'grave', side, upTo: /up\s+to/i.test(text), ...res };
    case 'LOOK_HAND':
    case 'LOOK_AT_HAND':
      return { side: /opposing|opponent/i.test(text) ? 'opp' : 'self', target: 'HAND', ...res };
    case 'LOOK_AT_DECK':
    case 'LOOK_DECKTOP':
      return { count: extractFirstNumber(text, 1), position: 'top', ...res };
    case 'REVEAL_INTERACTION':
      return { onRevealBy: 'self', destination: /field/i.test(text) ? 'field' : 'hand', action: /discard/i.test(text) ? 'discard' : 'put', ...res };
    case 'DISCARD_ZONE':
    case 'DISCARD_FIELD':
      return { zone: /mirage/i.test(text) ? 'mirage' : (/removed/i.test(text) ? 'removed' : (/hand/i.test(text) ? 'hand' : 'field')), cardType: /magic/i.test(text) ? 'Magic' : (/nexus/i.test(text) ? 'Nexus' : 'Spirit'), side, count: extractFirstNumber(text, 1), ...res };
    case 'DISCARD_AMONG':
      return { color: cols[0] || null, count: extractFirstNumber(text, 1), filter: cols[0] ? { color: cols[0] } : { any: true }, ...res };
    case 'DISCARD_FIELD_MAGIC':
    case 'DISCARD_FROM_FIELD_COST':
      return { family: bracket || 'Song', count: extractFirstNumber(text, 1), cardType: 'Magic', side, ...res };
    case 'SEND_TO_TRASH':
      return { target: 'SELF', from: 'field', count: extractFirstNumber(text, 1), ...res };
    case 'PUT_CARD_ON_FIELD':
    case 'PUT_FACEDOWN_FIELD':
      return { from: /decktop/i.test(text) ? 'decktop' : 'hand', cardType: /magic/i.test(text) ? 'Magic' : 'Spirit', family: bracket || null, filter: bracket ? { family: bracket } : { any: true }, count: extractFirstNumber(text, 1), facedown: /facedown|face-?down/i.test(text) || op === 'PUT_FACEDOWN_FIELD', ...res };
    case 'USE_FROM_HAND':
      return { cardType: /magic/i.test(text) ? 'Magic' : 'Any', timing: /flash/i.test(text) ? 'FLASH' : 'MAIN', filter: cols[0] ? { color: cols[0] } : { any: true }, ...res };
    case 'CAST_FROM_TRASH':
    case 'CAST_FROM_DECK':
      return { requiredCard: quotes[0] || null, zone: op === 'CAST_FROM_DECK' ? 'deck' : 'grave', scope: 'self', ...res };
    case 'LIMIT_DECK_DISCARD':
      return { maxPerTurn: extractFirstNumber(text, 5), targetSide: 'self', ...res };
    case 'CHOOSE_BLOCKER':
    case 'CHOOSE_BATTLE_TARGET':
      return { when: 'WHEN_BLOCKED', mode: 'choose_battle_target', target: { side: 'opp', types: ['Spirit', 'Ultimate'] }, ...res };
    case 'FORCE_ATTACK':
      return { side: /opponent|opposing/i.test(text) ? 'opp' : 'self', minAttacks: 1, ...res };
    case 'PIERCING_RULE':
      return { allowedPrevention: /heavy\s+armor/i.test(text) ? ['Heavy Armor', 'Ultra Armor'] : ['Armor', 'Heavy Armor', 'Ultra Armor'], effectType: 'destroy', ...res };
    case 'BATTLE_RULE_MODIFIER':
      return { rule: /neither.*destroyed|would\s+be\s+destroyed/i.test(text) ? 'NO_BP_DESTRUCTION' : (/lv1/i.test(text) ? 'USE_LV1_BP' : 'INVERT_BP_COMPARISON'), mode: 'battle_rule', ...res };
    case 'BATTLE_MODIFIER':
    case 'ATTACK_RULE_MODIFIER':
    case 'BATTLE_MULTIPLE':
      return { maxBattles: extractFirstNumber(text, 2), maxTargets: extractFirstNumber(text, 2), rule: /simultaneous/i.test(text) ? 'SIMULTANEOUS_ATTACK' : 'CONSECUTIVE_BATTLES', ...res };
    case 'GLOBAL_RESTRICTION':
      return { restriction: /gain\s+cores\s+from\s+the\s+void/i.test(text) ? 'CANNOT_GAIN_CORES_FROM_VOID' : 'GLOBAL_RESTRICTION', side: 'both', ...res };
    case 'DECK_BUILDING_RULE':
    case 'DECK_CONSTRUCTION_RULE':
    case 'DECK_RULE':
      return { maxCopies: /any\s+number|any\s+amount|as\s+many/i.test(text) ? 'UNLIMITED' : extractFirstNumber(text, 1), rule: /any\s+number|any\s+amount/i.test(text) ? 'UNLIMITED_COPIES' : 'COPY_LIMIT', ...res };
    case 'GAIN_TEAM':
    case 'TEAM_RULE':
      return { allTeams: /every\s+team|all\s+teams/i.test(text), scope: 'all', ...res };
    case 'BUNSHIN_SUMMON':
    case 'CREATE_BUNSHIN':
      return { count: extractFirstNumber(text, 1), from: 'decktop', coresMin: 1, ...res };
    case 'TARGET_FAMILY':
    case 'CHOOSE_FAMILY':
      return { families: quotes.length > 0 ? quotes : ['Target Family'], mode: 'choose_family', count: 1, ...res };
    case 'ACTIVATE_SOUL_DRIVE':
      return { target: { side: 'self', types: ['Ultimate'] }, scope: 'self_ultimate', ...res };
    case 'RETRIEVE_CORES':
      return { count: extractFirstNumber(text, 1), from: 'grave', to: /reserve/i.test(text) ? 'reserve' : 'field', excludeSoulCore: /besides|other\s+than/i.test(text), upTo: /up\s+to/i.test(text), ...res };
    case 'SYMBOL_MODIFIER':
      return { cardType: 'Magic', color: cols[0] || 'Yellow', symbols: { [cols[0] || 'Yellow']: 1 }, ...res };
    case 'COUNT_MODIFIER':
    case 'COUNT_AS_MULTIPLE':
      return { multiplier: extractFirstNumber(text, 2), countAs: extractFirstNumber(text, 2), cardType: /nexus/i.test(text) ? 'Nexus' : 'Spirit', ...res };
    case 'BP_FORMULA': {
      const multM = text.match(/x\s*(\d+)/i);
      return { per: 'cores_on_spirit', multiplier: multM ? parseInt(multM[1], 10) : 10000, ...res };
    }
    case 'SPECIAL_WIN':
      return { winner: 'self', reason: 'SPECIAL_WIN_CONDITION', ...res };
    case 'LOSE_EFFECTS':
      return { target: { side: 'opp', types: ['Spirit'] }, cannotGainNew: /can't\s+gain|cannot\s+gain/i.test(text), scope: 'target', ...res };
    case 'ADD_FAMILY':
      return { families: quotes.length > 0 ? quotes : (bracket ? [bracket] : ['Custom Family']), ...res };
    case 'SELECT_TARGET':
      return { target: { side: /opposing|opp/i.test(text) ? 'opp' : 'self', types: ['Spirit'], excludeSelf: /another/i.test(text) }, ...res };
    case 'SUMMON_MULTI':
      return { from: /hand/i.test(text) ? 'hand' : 'grave', filter: quotes[0] ? { family: quotes[0] } : { types: ['Spirit'] }, count: 99, ...res };
    case 'SWAP_CORES':
      return { target: { side: 'both', types: ['Spirit', 'Ultimate'], count: 2 }, ...res };
    case 'TREAT_NAME':
      return { treatedAsName: quotes[0] || 'Arcana', cost: extractFirstNumber(text, 2), ...res };
    case 'TREAT_COST':
      return { treatedCost: extractFirstNumber(text, 2), cost: extractFirstNumber(text, 2), ...res };
    case 'TREAT_CORE_COUNT':
      return { target: { side: 'self', types: ['Nexus'] }, from: 'self', mode: 'match_source_cores', ...res };
    case 'TRIGGERED_BUFF':
    case 'TRIGGERED_ACTION':
      return { trigger: 'CUSTOM_EVENT', amount: extractFirstNumber(text, 2000), action: 'triggered_effect', ...res };
    case 'NEGATE_MAGIC':
      return { scope: 'battle', timing: 'BATTLE_PHASE', ...res };
    case 'TAKE_CONTROL':
      return { target: { side: 'opp', types: ['Spirit'] }, filter: { cost: extractFirstNumber(text, 6) }, duration: 'THIS_TURN', ...res };
    case 'RETURN_CONTROL':
      return { state: /exhausted/i.test(text) ? 'exhausted' : 'refreshed', timing: 'END_OF_TURN', ...res };
    case 'CONTROL_RULE':
    case 'CORE_LOCK':
      return { target: 'SELF', coreOwner: 'original', coresLocked: true, ...res };
    case 'REVEAL_FROM_HAND_COST':
      return { handTrigger: 'OPPONENT_HAND_USE', count: 1, side: 'opp', ...res };
    case 'SEARCH_DECK':
      return { filter: { any: true }, destination: 'hand', count: extractFirstNumber(text, 1), ...res };
    case 'CHOOSE_LEVEL':
      return { levels: [1, 2, 3], minLevel: 1, ...res };
    case 'OPPONENT_CHOICE':
      return { options: ['OPTION_A', 'OPTION_B'], ...res };
    case 'RETURN_DECK_BOTTOM':
    case 'BOUNCE_TO_DECKBOTTOM':
      return { from: 'revealed', target: 'SELF', count: extractFirstNumber(text, 1), ...res };
    case 'DISCARD_HAND_MAX':
      return { triggerCount: extractFirstNumber(text, 4), targetCount: 3, side: 'both', ...res };
    case 'EXCHANGE_CORE':
      return { from: 'life', to: 'self', ...res };
    case 'SCHEDULED_DESTROY':
      return { timing: 'END_STEP', target: 'SUMMONED_BY_EFFECT', ...res };
    case 'SEPARATE_BRAVE':
      return { filter: quotes[0] ? { name: quotes[0] } : {}, target: 'SELF', ...res };
    case 'PAY_COST':
      return { source: 'field', cost: 1, ...res };
    case 'LOSE_IMMUNITY':
      return { colors: cols, loseAll: cols.length === 0, target: { side: 'self', types: ['Spirit'] }, ...res };
    case 'USE_ACCEL':
      return { onReveal: 'DECK', cardType: 'Spirit', ...res };
    case 'TIMING_MODIFIER':
      return { timing: 'END_OF_ATTACK', when: 'END_OF_ATTACK', ...res };
    case 'HEADER':
      return { timing: 'OPPOSING_TURN', keyword: bracket || 'Custom', ...res };
    case 'CARD_PLAY_PERMISSION':
      return { timing: 'START_OPPOSING_ATTACK_STEP', cardType: 'Magic', from: 'hand', ...res };
    case 'MODIFY_ADVENT_CONDITION':
      return { modifiedAdcon: bracket || 'Custom', targetFilter: quotes[0] ? { name: quotes[0] } : {}, ...res };
    case 'BEFORE_ADVENT_TRIGGER':
      return { targetFilter: quotes[0] ? { name: quotes[0] } : {}, timing: 'WHEN_ADVENTS', ...res };
    case 'COPY_TRIGGER':
      return { timing: 'WHEN_ATTACKS', maxPerAttack: 1, scope: 'other_ultimate', ...res };
    case 'EXPAND_TARGETS':
      return { fromScope: 'one', toScope: 'all', ...res };
    case 'ENHANCE_KEYWORD':
      return { keyword: bracket || 'Windstorm', targetDelta: 1, ...res };
    case 'GRANT_EFFECT':
      return { target: { side: 'self', types: ['Spirit'] }, effect: quotes[0] || text, ...res };
    case 'SEND_CORES_TO_VOID':
      return { side: 'opp', zone: /nexus/i.test(text) ? 'field' : 'reserve', leaveCount: 4, count: extractFirstNumber(text, 1), ...res };
    case 'VARIABLE_PAYMENT_EFFECT':
      return { tiers: { 1: 'TIER_1' }, amount: extractFirstNumber(text, 1), ...res };
    case 'TOKEN_DEPLOYMENT': {
      const out = { ...res };
      if (!out.tokenName && (quotes[0] || bracket)) out.tokenName = quotes[0] || bracket;
      const cnt = extractFirstNumber(text, null);
      if (out.count === undefined && cnt !== null) out.count = cnt;
      if (out.side === undefined) out.side = side;
      if (out.optional === undefined && /you\s+can/i.test(text)) out.optional = true;
      return out;
    }
    case 'DECK_OR_HAND_ACTION':
    case 'DECK_ACTION': {
      const out = { ...res };
      if (!out.action) {
        if (/\breveal\b/i.test(text)) out.action = 'reveal';
        else if (/\blook\s+at\b/i.test(text)) out.action = 'look';
        else if (/\bdiscard\b/i.test(text)) out.action = 'discard';
        else if (/\bsend\b.*\bto\s+(?:the\s+)?trash\b/i.test(text)) out.action = 'send_to_trash';
        else if (/\b(?:return|remturn)\b.*\bdeckbottom\b/i.test(text)) out.action = 'return_deckbottom';
        else if (/\bput(?:ting)?\b.*\bremoved\s+zone\b/i.test(text)) out.action = 'banish';
        else if (/\bdraw\b/i.test(text)) out.action = 'draw';
      }
      if (!out.from) {
        if (/decktop|top\s+card|\bdeck\b/i.test(text)) out.from = /decktop|top\s+card/i.test(text) ? 'decktop' : 'deck';
        else if (/\bhand\b/i.test(text)) out.from = 'hand';
        else if (/removed\s+zone/i.test(text)) out.from = 'removed';
        else if (/\btrash\b/i.test(text) && !/to\s+(?:the\s+)?trash/i.test(text)) out.from = 'grave';
      }
      if (!out.to) {
        if (/to\s+(?:the\s+)?trash/i.test(text)) out.to = 'grave';
        else if (/deckbottom|bottom\s+of\s+the\s+deck/i.test(text)) out.to = 'deck_bottom';
        else if (/removed\s+zone/i.test(text) && !/in\s+the\s+(?:opposing\s+)?removed\s+zone/i.test(text)) out.to = 'removed';
        else if (/to\s+(?:your\s+)?hand/i.test(text)) out.to = 'hand';
      }
      if (out.side === undefined) out.side = side;
      if (/\bany\s+number\b|\bevery\b|\ball\b/i.test(text)) {
        if (out.all === undefined && /\bevery\b|\ball\b/i.test(text)) out.all = true;
        if (out.upTo === undefined && /\bany\s+number\b/i.test(text)) out.upTo = true;
      } else {
        const cnt = extractFirstNumber(text, null);
        if (out.count === undefined && cnt !== null) out.count = cnt;
      }
      if (!out.filter) {
        const f = {};
        if (/\bmagic\b/i.test(text)) f.type = 'Magic';
        else if (/\bspirit\b/i.test(text)) f.type = 'Spirit';
        else if (/\bnexus\b/i.test(text)) f.type = 'Nexus';
        else if (/\bbrave\b/i.test(text)) f.type = 'Brave';
        if (cols.length > 0) f.color = cols[0];
        if (quotes[0]) f.family = quotes[0];
        if (/face-?up/i.test(text)) f.faceUp = true;
        if (Object.keys(f).length > 0) out.filter = f;
      }
      if (/\bdiscard\s+it\b/i.test(text) && !out.target) out.target = 'PREVIOUS_TARGET';
      if (out.isCost === undefined && /^by\s+/i.test(text)) out.isCost = true;
      return out;
    }
    case 'COUNT_OPERATION': {
      const out = { ...res };
      if (!out.action) {
        if (/lives?\s+to\s+the\s+void/i.test(text)) out.action = 'SEND_LIFE_TO_VOID';
        else if (/lives?\s+to\s+the\s+reserve/i.test(text)) out.action = 'SEND_LIFE_TO_RESERVE';
        else if (/cores?\s+to\s+the\s+void/i.test(text)) out.action = 'SEND_CORE_TO_VOID';
        else if (/cores?\s+to\s+the\s+reserve/i.test(text)) out.action = 'SEND_CORE_TO_RESERVE';
      }
      if (!out.to) {
        if (/\bvoid\b/i.test(text)) out.to = 'void';
        else if (/\breserve\b/i.test(text)) out.to = 'reserve';
      }
      if (out.side === undefined) out.side = side;
      const cnt = extractFirstNumber(text, null);
      if (out.count === undefined && cnt !== null) out.count = cnt;
      if (out.upTo === undefined && /up\s+to/i.test(text)) out.upTo = true;
      return out;
    }
    case 'MODIFY_EFFECT': {
      const out = { ...res };
      if (!out.to && /critical\s+hit/i.test(text)) out.to = 'CRITICAL_HIT';
      const revM = text.match(/reveals?\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\s+instead/i);
      if (revM && out.newCount === undefined) {
        out.targetEffect = 'reveal';
        out.newCount = extractFirstNumber(revM[1], null);
      }
      const sumM = text.match(/to\s+be\s+summoned.*\bto\s+(one|two|three|four|five|\d+)\b/i);
      if (sumM && out.newCount === undefined) {
        out.targetEffect = 'summon';
        out.newCount = extractFirstNumber(sumM[1], null);
      }
      if (out.side === undefined) out.side = side;
      return out;
    }
    case 'MODIFY_EFFECT_VALUE': {
      const out = { ...res };
      const deltaM = text.match(/([+-]\d+)|by\s+([+-]?\d+)/i);
      if (deltaM && out.delta === undefined) out.delta = parseInt(deltaM[1] || deltaM[2], 10);
      if (!out.targetEffect) {
        if (/core/i.test(text)) out.targetEffect = 'core_removal';
        else if (/deck\s+discard|discard/i.test(text)) out.targetEffect = 'deck_discard';
        else if (/banish/i.test(text)) out.targetEffect = 'banish';
        else if (/bp/i.test(text)) out.targetEffect = 'bp_burn';
      }
      if (/for\s+each\s+counter/i.test(text) && !out.per) out.per = 'counters';
      return out;
    }
    case 'REVEAL_CARDS': {
      const out = { ...res };
      if (!out.from) out.from = /decktop|top\s+.*\s+deck/i.test(text) ? 'decktop' : (/hand/i.test(text) ? 'hand' : 'deck');
      if (out.side === undefined) out.side = side;
      const cnt = extractFirstNumber(text, null);
      if (out.count === undefined && cnt !== null) out.count = cnt;
      if (out.reveal === undefined) out.reveal = !/^look\s+at/i.test(text);
      if (/for\s+each/i.test(text) && !out.per) out.per = 'matching_cards';
      return out;
    }
    case 'REPLACEMENT_EFFECT': {
      const out = { ...res };
      if (!out.replaces) {
        if (/destroy/i.test(text)) out.replaces = 'DESTROY';
        else if (/leave\s+the\s+field/i.test(text)) out.replaces = 'LEAVE_FIELD';
        else if (/life/i.test(text)) out.replaces = 'LIFE_LOSS';
      }
      if (out.side === undefined) out.side = side;
      if (out.optional === undefined && /you\s+can/i.test(text)) out.optional = true;
      return out;
    }
    default:
      return res;
  }
}

export function parseColors(text) {
  if (!text) return [];
  const colors = [];
  for (const c of ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']) {
    if (new RegExp('\\b' + c + '\\b', 'i').test(text)) {
      colors.push(c);
    }
  }
  return colors;
}

function parseTypes(typeStr) {
  if (!typeStr) return ['Spirit'];
  const t = typeStr.toLowerCase();
  const res = [];
  if (t.includes('spirit')) res.push('Spirit');
  if (t.includes('ultimate')) res.push('Ultimate');
  if (t.includes('nexus')) res.push('Nexus');
  if (t.includes('brave')) res.push('Brave');
  return res.length > 0 ? res : [capitalize(typeStr)];
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
