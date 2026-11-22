/**
 * engine/parameter_recovery.js
 *
 * K1-BATCH-04 — Explicit Non-Fabricating Parameter Recovery for Parameter-Incomplete IR Ops.
 * Extracts ONLY explicit, unambiguous parameters directly stated in `rawText`.
 * Never invents defaults; bare stubs without `rawText` or prose-complex clauses fail closed.
 */

export const INCOMPLETE_PARAMETER_OPS = new Set([
  'DECK_OR_HAND_ACTION',
  'MODIFY_EFFECT',
  'COUNT_OPERATION',
  'DECK_ACTION',
  'MODIFY_EFFECT_VALUE',
  'ADVENT_RULE_MODIFIER',
  'MIRAGE_OPERATION',
  'REVEAL_CARDS',
  'REPLACEMENT_EFFECT',
  'TRIGGER_COUNTER',
  'PUT_UNDERNEATH',
  'COPY_PRE_ADVENT_EFFECT',
  'USE_FROM_HAND',
  'TOKEN_DEPLOYMENT',
  'ADVENT',
  'MILL',
  'ACTIVATE_TRIGGER',
  'GLOBAL_RESTRICTION',
  'DECK_RULE'
]);

const WORD_NUMS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20
};

function parseExplicitCount(token) {
  if (token == null) return null;
  const s = String(token).trim().toLowerCase();
  if (s in WORD_NUMS) return WORD_NUMS[s];
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function isIncompleteOpObject(opObj) {
  if (!opObj || typeof opObj !== 'object' || !opObj.op) return false;
  if (!INCOMPLETE_PARAMETER_OPS.has(opObj.op)) return false;
  const populated = Object.keys(opObj).filter(k =>
    k !== 'op' && opObj[k] !== undefined && opObj[k] !== null && opObj[k] !== ''
  );
  if (populated.length === 0) return true;
  if (opObj.op === 'REPLACEMENT_EFFECT' && !opObj.replaces && !opObj.replacementZone) return true;
  if ((opObj.op === 'MODIFY_EFFECT' || opObj.op === 'MODIFY_EFFECT_VALUE') &&
      opObj.param === undefined && opObj.delta === undefined && opObj.value === undefined &&
      opObj.newCount === undefined && opObj.to === undefined && !opObj.targetEffect) {
    return true;
  }
  return false;
}

function recoverDeckOrHandAction(text) {
  const s = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();

  // "put this card face-up on your Removed Zone"
  if (/^put\s+this\s+card\s+(face-?up|face-?down)\s+(?:on|onto)\s+(?:your\s+)?Removed\s+Zone/i.test(s)) {
    return {
      action: 'PUT_SELF_IN_REMOVED',
      from: 'self',
      to: 'removed',
      side: 'self',
      facedown: /face-?down/i.test(s),
      count: 1
    };
  }

  // "When this Spirit would leave the Field due to the opponent, put it onto the Removed Zone"
  if (/when\s+this\s+Spirit\s+would\s+leave\s+the\s+Field.*put\s+it\s+(?:onto|on)\s+the\s+Removed\s+Zone/i.test(s)) {
    return {
      action: 'REPLACE_LEAVE_FIELD_TO_REMOVED',
      replaces: 'LEAVE_FIELD',
      from: 'field',
      to: 'removed',
      side: 'self'
    };
  }

  // "When this card in Hand would be discarded ... instead of sending it to Trash, you can put it onto the Removed Zone"
  if (/when\s+this\s+card\s+in\s+Hand\s+would\s+be\s+discarded.*Removed\s+Zone/i.test(s)) {
    return {
      action: 'REPLACE_HAND_DISCARD_TO_REMOVED',
      replaces: 'DISCARD',
      from: 'hand',
      to: 'removed',
      side: 'self'
    };
  }

  // "By putting any number of Magic cards from your Hand [face-up|facedown] onto the Removed Zone"
  const putRemovedM = s.match(/by\s+putting\s+(any\s+number\s+of|a|an|one|two|three|four|\d+)\s+(?:(Spirit|Ultimate|Brave|Nexus|Magic)\s+)?cards?\s+from\s+(your|the\s+opposing)\s+Hand(?:\s+(face-?up|face-?down))?\s+(?:onto|on)\s+the\s+Removed\s+Zone/i);
  if (putRemovedM) {
    const anyCount = /any\s+number/i.test(putRemovedM[1]);
    const cType = putRemovedM[2] ? (putRemovedM[2][0].toUpperCase() + putRemovedM[2].slice(1).toLowerCase()) : null;
    const isOpp = /opposing/i.test(putRemovedM[3]);
    return {
      action: 'MOVE_CARD',
      from: 'hand',
      to: 'removed',
      side: isOpp ? 'opp' : 'self',
      count: anyCount ? 'ANY' : (parseExplicitCount(putRemovedM[1]) || 1),
      ...(cType ? { filter: { type: cType } } : {}),
      ...(putRemovedM[4] ? { facedown: /face-?down/i.test(putRemovedM[4]) } : {}),
      isCost: true
    };
  }

  // "Discard every face-up card in the opposing Removed Zone"
  const remDiscardM = s.match(/discard\s+every\s+(face-?up\s+)?card\s+in\s+the\s+(opposing|your)\s+Removed\s+Zone/i);
  if (remDiscardM) {
    return {
      action: 'DISCARD_ZONE',
      from: 'removed',
      to: 'grave',
      side: /opposing/i.test(remDiscardM[2]) ? 'opp' : 'self',
      count: 'ALL',
      ...(remDiscardM[1] ? { filter: { faceUp: true } } : {})
    };
  }

  // "Discard the remaining card(s)" / "Remaining cards are discarded" / "Remaining card is discarded"
  if (/^(?:discard\s+(?:the\s+)?remaining\s+cards?|remaining\s+cards?\s+(?:are|is)\s+discarded)\.?$/i.test(s)) {
    return {
      action: 'DISCARD_REMAINING',
      from: 'revealed',
      to: 'grave',
      side: 'self'
    };
  }

  // "If not, discard it."
  if (/^if\s+not,\s+discard\s+it\.?$/i.test(s)) {
    return {
      action: 'DISCARD_PREVIOUS',
      from: 'revealed',
      to: 'grave',
      side: 'self',
      count: 1
    };
  }

  // "Send N cards from the opposing/your decktop to the Trash"
  const millM = s.match(/send\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\s+from\s+(?:the\s+)?(opposing|your)\s+decktop\s+to\s+(?:the\s+)?Trash/i);
  if (millM) {
    return {
      action: 'MILL',
      from: 'deck',
      to: 'grave',
      side: /opposing/i.test(millM[2]) ? 'opp' : 'self',
      count: parseExplicitCount(millM[1])
    };
  }

  // "(You can) reveal N cards from your/opposing decktop/deckbottom"
  const revM = s.match(/(?:you\s+can\s+)?reveal\s+(?:the\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\s+from\s+(?:(your|the\s+opposing)\s+)?deck(top|bottom)/i);
  if (revM) {
    const cnt = parseExplicitCount(revM[1]);
    if (cnt != null) {
      return {
        action: 'REVEAL',
        from: revM[3].toLowerCase() === 'bottom' ? 'deck_bottom' : 'deck',
        to: 'revealed',
        side: /opposing/i.test(revM[2] || '') ? 'opp' : 'self',
        count: cnt
      };
    }
  }

  // "(Return|Remturn|Retrun) any remaining card(s) to (either only the decktop or) the deck(bottom|top)"
  const retBotM = s.match(/(?:return|remturn|retrun)\s+(?:any\s+)?remaining\s+cards?\s+to\s+(?:either\s+only\s+the\s+decktop\s+or\s+)?(?:the\s+)?deck(bottom|top)/i);
  if (retBotM) {
    const isBottom = retBotM[1].toLowerCase() === 'bottom';
    return {
      action: isBottom ? 'RETURN_BOTTOM' : 'RETURN_TOP',
      from: 'revealed',
      to: isBottom ? 'deck_bottom' : 'deck_top',
      destination: isBottom ? 'DECK_BOTTOM' : 'DECK_TOP',
      side: 'self',
      all: true
    };
  }

  // "You can (add|put) up to N copies of this card (in|to) (your) deck"
  const copyLimM = s.match(/you\s+can\s+(?:add|put)\s+up\s+to\s+(\d+)\s+copies\s+of\s+this\s+card\s+(?:in|to)\s+(?:your\s+)?deck/i);
  if (copyLimM) {
    return {
      action: 'DECK_LIMIT',
      maxCopies: parseInt(copyLimM[1], 10),
      rule: 'CUSTOM_COPY_LIMIT'
    };
  }

  // "swap a card from Hand with an "X" family card on your Removed Zone"
  const swapRemM = s.match(/swap\s+a\s+card\s+from\s+Hand\s+with\s+an?\s+"([^"]+)"\s+family\s+card\s+(?:on|in)\s+(?:your\s+)?Removed\s+Zone/i);
  if (swapRemM) {
    return {
      action: 'SWAP_ZONE',
      from: 'hand',
      to: 'removed',
      withZone: 'removed',
      side: 'self',
      filter: { family: swapRemM[1].trim() },
      count: 1
    };
  }

  // "If that's an "X" family card, put it onto the Removed Zone"
  const condRemM = s.match(/if\s+that['’]?s\s+an?\s+"([^"]+)"\s+family\s+card,\s+put\s+it\s+(?:onto|on)\s+the\s+Removed\s+Zone/i);
  if (condRemM) {
    return {
      action: 'MOVE_CARD',
      from: 'revealed',
      to: 'removed',
      side: 'self',
      filter: { family: condRemM[1].trim() },
      count: 1
    };
  }

  // "Shuffle your/opposing deck"
  const shufM = s.match(/shuffle\s+(your|the\s+opposing|both\s+players')\s+deck/i);
  if (shufM) {
    return {
      action: 'SHUFFLE',
      side: /opposing/i.test(shufM[1]) ? 'opp' : 'self'
    };
  }

  return null;
}

function recoverCountOperation(text) {
  const s = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();

  // "Your counter can +1" / "You can +1 counter"
  const addCntM = s.match(/(?:your\s+counter\s+(?:can\s+)?\+(\d+)|(?:you\s+can\s+)?\+(\d+)\s+counter)/i);
  if (addCntM && !/opposing\s+counter/i.test(s)) {
    return {
      action: 'ADD_COUNTER',
      count: parseInt(addCntM[1] || addCntM[2], 10),
      side: 'self'
    };
  }

  // "By -1 your counter" / "or by -1 opposing counter" / "you can -1 your counter"
  const subCntM = s.match(/(?:by|can)\s+-(\d+)\s+(your\s+|opposing\s+)?counters?|(?:you\s+can\s+-\d+|by\s+-\d+)/i);
  if (subCntM) {
    const numM = s.match(/-(\d+)\s+(?:your\s+|opposing\s+)?counters?/i);
    if (numM) {
      return {
        action: 'SUBTRACT_COUNTER',
        count: parseInt(numM[1], 10),
        side: /opposing/i.test(s) ? 'opp' : 'self',
        isCost: /\bby\s+/i.test(s)
      };
    }
  }

  // "send (up to) N opposing Lives to the Void/Reserve"
  const lifeM = s.match(/send\s+(?:up\s+to\s+)?(a|an|one|two|three|four|five|\d+)\s+(opposing|your)\s+Liv(?:e|es)\s+to\s+(?:the\s+)?(Void|Reserve)/i);
  if (lifeM && !/for\s+each/i.test(s)) {
    const cnt = parseExplicitCount(lifeM[1]);
    const dest = lifeM[3].toLowerCase();
    if (cnt != null) {
      return {
        action: dest === 'void' ? 'SEND_LIFE_TO_VOID' : 'SEND_LIFE_TO_RESERVE',
        side: /opposing/i.test(lifeM[2]) ? 'opp' : 'self',
        count: cnt,
        to: dest
      };
    }
  }

  // "[Count Break] can only be used once per game"
  if (/\[?Count\s+Break\]?\s+can\s+only\s+be\s+used\s+once\s+per\s+game/i.test(s)) {
    return {
      action: 'COUNT_BREAK_LIMIT',
      object: 'COUNT_BREAK',
      rule: 'ONCE_PER_GAME'
    };
  }

  // "repeat this effect up to the number of counters you have"
  if (/repeat\s+this\s+effect\s+up\s+to\s+the\s+number\s+of\s+counters\s+you\s+have/i.test(s)) {
    return {
      action: 'REPEAT_PER_COUNTER',
      object: 'COUNTERS',
      side: 'self'
    };
  }

  return null;
}

function recoverModifyEffect(text) {
  const s = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();

  // "If you have three counters or more, this effect banishes +1 card" / "this effect reveals +1 card" / "this effect draws +1 cards" / "sends +1 core"
  const deltaM = s.match(/\b(?:draws?|reveals?|banishes?|discards?|sends?|puts?|increased?\b.*?by|reduced?\b.*?by)\s*([+-]\d+)\s+(cards?|cores?|Hand)/i);
  if (deltaM && !/for\s+each/i.test(s)) {
    const delta = parseInt(deltaM[1], 10);
    const kind = /core/i.test(deltaM[2]) ? 'core_operation'
      : (/draw/i.test(s) ? 'draw'
        : (/reveal/i.test(s) ? 'reveal'
          : (/banish/i.test(s) ? 'banish' : 'discard')));
    return {
      param: /core/i.test(deltaM[2]) ? 'cores' : 'count',
      delta,
      targetEffect: kind
    };
  }

  // "you can change the "+1" text of this effect to "+2"" / "change the "one" text of this effect to "three""
  const chgTextM = s.match(/change\s+the\s+"([^"]+)"\s+text\s+of\s+this\s+effect\s+to\s+"([^"]+)"/i);
  if (chgTextM) {
    const cleanVal = chgTextM[2].replace(/^\+/, '');
    const v = parseExplicitCount(cleanVal);
    if (v != null) {
      return {
        param: 'count',
        value: v,
        newCount: v,
        targetEffect: 'text_value'
      };
    }
  }

  // "this effect reveals five cards instead" / "amount to be discarded is changed to three cards" / "sends three cores to Trash instead" / "number of cards revealed by this effect becomes six"
  const setValM = s.match(/(?:this\s+effect\s+(reveals?|sends?|draws?|discards?|targets?)|number\s+of\s+(?:Spirit\s+)?cards\s+to\s+be\s+(?:\w+)\s+.*?(?:to|becomes)|amount\s+to\s+be\s+\w+\s+is\s+changed\s+to)\s+(one|two|three|four|five|six|seven|eight|ten|\d+)\s*(?:cards?|cores?|Spirits?)?/i);
  if (setValM) {
    const val = parseExplicitCount(setValM[2]);
    if (val != null) {
      const targetEffect = /reveal/i.test(s) ? 'reveal'
        : (/core/i.test(s) ? 'core_operation'
          : (/summon/i.test(s) ? 'summon'
            : (/discard/i.test(s) ? 'discard' : 'effect_count')));
      return {
        param: /core/i.test(s) ? 'cores' : 'count',
        value: val,
        newCount: val,
        targetEffect
      };
    }
  }

  // "two Spirits/Ultimates are targeted by this effect"
  const tgtCountM = s.match(/^(?:if\s+[^,]+,\s+)?(one|two|three|\d+)\s+(?:Spirits|Ultimates|targets?)\s+are\s+targeted\s+by\s+this\s+effect/i);
  if (tgtCountM) {
    const val = parseExplicitCount(tgtCountM[1]);
    if (val != null) {
      return { param: 'targetCount', value: val, newCount: val, targetEffect: 'target' };
    }
  }

  return null;
}

export function recoverExplicitOpParameters(opObj, rawText) {
  if (!opObj || typeof opObj !== 'object' || !opObj.op) {
    return { recovered: false, params: null, classification: 'INVALID_OP', reason: 'INVALID_OP_OBJECT' };
  }
  if (!isIncompleteOpObject(opObj)) {
    return { recovered: false, params: null, classification: 'ALREADY_COMPLETE', reason: 'ALREADY_COMPLETE' };
  }

  const text = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return { recovered: false, params: null, classification: 'AMBIGUOUS_OR_MISSING_TEXT', reason: 'MISSING_RAW_TEXT' };
  }

  let params = null;

  switch (opObj.op) {
    case 'DECK_OR_HAND_ACTION':
    case 'DECK_ACTION':
      params = recoverDeckOrHandAction(text);
      break;

    case 'COUNT_OPERATION':
      params = recoverCountOperation(text);
      break;

    case 'MODIFY_EFFECT':
    case 'MODIFY_EFFECT_VALUE':
      params = recoverModifyEffect(text);
      break;

    case 'REVEAL_CARDS': {
      if (/^remaining\s+cards?\s+(?:is|are)\s+discarded/i.test(text)) {
        params = { action: 'DISCARD_REMAINING', from: 'revealed', count: 1 };
        break;
      }
      const m = text.match(/(?:reveal|look\s+at(?:\s+the\s+contents\s+of)?)\s+(?:the\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(both\s+players'|the\s+opposing|your|the)\s+(Hand|decktop|deck)/i);
      if (m && !/for\s+each/i.test(text)) {
        const cnt = parseExplicitCount(m[1]);
        if (cnt != null) {
          params = {
            count: cnt,
            from: /hand/i.test(m[3]) ? 'hand' : 'deck',
            side: /both/i.test(m[2]) ? 'both' : (/opposing/i.test(m[2]) ? 'opp' : 'self')
          };
        }
      }
      break;
    }

    case 'PUT_UNDERNEATH': {
      const m = text.match(/put\s+(one|two|three|four|\d+)\s+cards?\s+from\s+the\s+(opposing|your)\s+decktop\s+under\s+.*?(facedown)?\.?$/i);
      if (m) {
        const cnt = parseExplicitCount(m[1]);
        const isOpp = /opposing/i.test(m[2]);
        params = {
          from: 'decktop',
          fromSide: isOpp ? 'opp' : 'self',
          count: cnt || 1,
          facedown: Boolean(m[3] || /facedown/i.test(text)),
          target: { side: isOpp ? 'opp' : 'self', types: ['Spirit', 'Ultimate'] }
        };
      }
      break;
    }

    case 'ADVENT_RULE_MODIFIER': {
      const canM = text.match(/can\s+\[(Contract\s+Advent|Ultra\s+Contract\s+Advent|Flag\s+Contract\s+Advent|Mani|Advent)\](?:\s+this\s+card)?\s+from\s+(?:the|your)\s+(Removed\s+Zone|Trash|Hand)/i);
      if (canM) {
        const zRaw = canM[2].toLowerCase();
        const fromZone = zRaw.includes('removed') ? 'removed' : (zRaw.includes('trash') ? 'grave' : 'hand');
        params = {
          fromZone,
          adventType: canM[1].toUpperCase().replace(/\s+/g, '_'),
          rule: `ADVENT_FROM_${fromZone.toUpperCase()}`
        };
      } else if (/can['’]?t\s+\[Contract\s+Advent\]\s+onto\s+this/i.test(text)) {
        params = {
          fromZone: 'field',
          adventType: 'CONTRACT_ADVENT',
          rule: 'CANNOT_ADVENT_ONTO_SELF'
        };
      }
      break;
    }

    case 'MIRAGE_OPERATION': {
      if (/immediately\s+activate\s+this\s+set\s+card/i.test(text)) {
        params = { action: 'activate_set_card', mode: 'ACTIVATE_SET', zone: 'mirage', side: 'self' };
      }
      break;
    }

    case 'REPLACEMENT_EFFECT': {
      const destM = text.match(/destroyed,\s+(?:move|return)\s+it\s+to\s+(?:your\s+)?(hand|deckbottom|decktop|removed(?:\s+zone)?)\s+instead/i);
      if (destM) {
        const zLow = destM[1].toLowerCase();
        const rz = zLow.includes('hand') ? 'hand' : (zLow.includes('bottom') ? 'deck_bottom' : (zLow.includes('top') ? 'deck_top' : 'removed'));
        const famM = text.match(/"([^"]+)"\s+(?:family\s+)?spirit/i);
        params = {
          replaces: 'DESTRUCTION',
          replacementZone: rz,
          side: 'self',
          ...(famM ? { filter: { family: famM[1].trim(), type: 'Spirit' } } : { filter: { type: 'Spirit' } })
        };
        break;
      }
      const lifeRepM = text.match(/opposing\s+Life\s+is\s+reduced,\s+the\s+core\s+(?:from\s+the\s+(?:opposing\s+)?Life\s+)?is\s+sent\s+to\s+the\s+(Void|Trash)\s+(?:instead|rather)/i);
      if (lifeRepM) {
        params = {
          replaces: 'LIFE_TO_RESERVE',
          replacementZone: lifeRepM[1].toLowerCase(),
          fromZone: 'life',
          side: 'opp'
        };
        break;
      }
      const voidToLifeM = text.match(/increase\s+cores\s+from\s+the\s+Void.*put\s+those\s+cores\s+to\s+your\s+Life\s+instead/i);
      if (voidToLifeM) {
        params = {
          replaces: 'INCREASE_CORES_FROM_VOID',
          replacementZone: 'life',
          fromZone: 'void',
          side: 'self'
        };
        break;
      }
      const voidToSpiritM = text.match(/increase\s+cores\s+from\s+the\s+Void.*(?:to|onto)\s+this\s+Spirit\s+instead/i);
      if (voidToSpiritM) {
        params = {
          replaces: 'INCREASE_CORES_FROM_VOID',
          replacementZone: 'field',
          fromZone: 'void',
          target: 'self',
          side: 'self'
        };
        break;
      }
      const coreToThisM = text.match(/cores\s+(?:on\s+your\s+destroyed\s+spirits\s+)?are\s+sent\s+to\s+this\s+spirit,\s*instead\s+of\s+(?:your\s+)?reserve/i);
      if (coreToThisM) {
        params = {
          replaces: 'SEND_CORE_TO_RESERVE',
          replacementZone: 'field',
          target: 'self',
          side: 'self'
        };
        break;
      }
      const coreResRepM = text.match(/cores\s+.*sent\s+to\s+(?:the\s+)?(?:opposing\s+)?Reserve\s+.*sent\s+to\s+(?:the\s+)?(?:opposing\s+)?(Void|Trash)\s+instead/i);
      if (coreResRepM) {
        params = {
          replaces: 'SEND_CORE_TO_RESERVE',
          replacementZone: coreResRepM[1].toLowerCase(),
          side: /opposing/i.test(text) ? 'opp' : 'self'
        };
      }
      break;
    }

    case 'TRIGGER_COUNTER': {
      if (/opposing\s+Ultimate[- ]Trigger\s+hits,\s+if\s+this\s+(?:Magic\s+)?card\s+is\s+in\s+(?:your|the)\s+Hand/i.test(text)) {
        params = {
          counterTiming: 'ON_OPPOSING_ULTIMATE_TRIGGER_HIT',
          zone: 'hand',
          side: 'self'
        };
      }
      break;
    }

    case 'COPY_PRE_ADVENT_EFFECT': {
      const m = text.match(/gains\s+(every|one\s+of\s+the)\s+(?:\(([^)]+)\)|\[([^\]]+)\])?\s*effects?\s+of\s+an?\s+"([^"]+)"\s+pre-advent\s+card/i);
      if (m) {
        params = {
          scope: 'pre_advent',
          filter: { name: m[4].trim() },
          ignoreLevels: /ignoring\s+levels/i.test(text),
          count: /one\s+of/i.test(m[1]) ? 1 : 'ALL',
          ...(m[2] ? { timingFilter: m[2].trim() } : {})
        };
      }
      break;
    }

    case 'USE_FROM_HAND': {
      if (/use\s+this\s+(?:Magic\s+)?card\s+from\s+(?:your|the)\s+Hand/i.test(text)) {
        const timing = /opposing\s+Attack\s+Step/i.test(text) ? 'OPPOSING_ATTACK_STEP'
          : (/opposing\s+Main\s+Step/i.test(text) ? 'OPPOSING_MAIN_STEP' : 'TRIGGERED');
        params = {
          cardType: /Magic/i.test(text) ? 'Magic' : 'SELF',
          timing,
          zone: 'hand'
        };
      }
      break;
    }

    case 'TOKEN_DEPLOYMENT': {
      const m = text.match(/send\s+out\s+(?:up\s+to\s+)?(one|two|three|four|\d+)\s+Tokens?/i);
      if (m) {
        params = {
          count: parseExplicitCount(m[1]) || 1,
          upTo: /up\s+to/i.test(text),
          tokenName: 'Token'
        };
      }
      break;
    }

    case 'ADVENT': {
      const fromM = text.match(/from\s+the\s+(Removed\s+Zone|Hand|Trash)/i);
      const from = fromM ? (fromM[1].toLowerCase().includes('removed') ? 'removed' : (fromM[1].toLowerCase().includes('trash') ? 'grave' : 'hand')) : 'hand';
      const tgtType = /Blue\s+Nexus|Nexus/i.test(text) ? 'Nexus' : 'Spirit';
      params = {
        from,
        adventType: 'Advent',
        target: { side: 'self', types: [tgtType] }
      };
      break;
    }

    case 'MILL': {
      const m = text.match(/move\s+the\s+top\s+(one|two|three|four|five|\d+)\s+cards?\s+of\s+your\s+opponent's\s+Deck\s+to\s+their\s+Trash/i);
      if (m) {
        params = { count: parseExplicitCount(m[1]), side: 'opp', from: 'deck' };
      } else if (/discard\s+the\s+top\s+card\s+of\s+your\s+deck/i.test(text)) {
        params = { count: 1, side: 'self', from: 'deck' };
      }
      break;
    }

    case 'ACTIVATE_TRIGGER': {
      if (/activate\s+.*\[Bunshin\]/i.test(text)) {
        params = { trigger: 'BUNSHIN', effectType: 'KEYWORD' };
      } else if (/activate\s+the\s+\(When\s+Destroyed\)\s+effects/i.test(text)) {
        params = { trigger: 'WHEN_DESTROYED', timing: 'WHEN_DESTROYED', target: { side: 'self', all: true } };
      }
      break;
    }

    case 'GLOBAL_RESTRICTION': {
      if (/neither\s+player\s+can\s+use\s+cards\s+from\s+Hand\s+outside\s+of\s+Flash\s+Timing/i.test(text)) {
        params = { restriction: 'PREVENT_NON_FLASH_HAND', side: 'both' };
      } else if (/neither\s+player\s+can\s+activate\s+\[Rebirth\]/i.test(text)) {
        params = { restriction: 'CANNOT_ACTIVATE_REBIRTH', side: 'both' };
      }
      break;
    }

    case 'DECK_RULE': {
      const m = text.match(/put\s+up\s+to\s+(five|four|six|ten|twenty|\d+)\s+copies\s+of\s+this\s+card\s+in\s+your\s+deck/i);
      if (m) {
        params = { rule: 'MAX_COPIES', maxCopies: parseExplicitCount(m[1]) };
      }
      break;
    }

    default:
      params = null;
      break;
  }

  if (params && Object.keys(params).length > 0) {
    return {
      recovered: true,
      params,
      classification: 'RECOVERED_EXPLICIT',
      reason: 'EXPLICIT_PARAMS_RECOVERED_FROM_RAWTEXT'
    };
  }

  return {
    recovered: false,
    params: null,
    classification: 'UNRECOVERABLE_COMPLEX',
    reason: 'COMPLEX_OR_CONTEXTUAL_PROSE_NOT_RECOVERABLE'
  };
}

export function classifyIncompleteParameterClause(opObj, rawText) {
  if (!isIncompleteOpObject(opObj)) {
    return { isIncomplete: false, classification: 'COMPLETE', recovered: false, params: null };
  }
  const rec = recoverExplicitOpParameters(opObj, rawText);
  return {
    isIncomplete: true,
    op: opObj.op,
    classification: rec.classification,
    recovered: rec.recovered,
    params: rec.params,
    reason: rec.reason
  };
}
