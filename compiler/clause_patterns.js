/**
 * compiler/clause_patterns.js
 * 
 * Pattern recognizer translating normalized clause text into typed IR operations.
 */

const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

export function parseNumber(val) {
  if (!val) return 1;
  const lower = String(val).toLowerCase().trim();
  if (NUMBER_WORDS[lower] !== undefined) return NUMBER_WORDS[lower];
  const num = parseInt(lower, 10);
  return isNaN(num) ? 1 : num;
}

export function compileClauseToOp(clause) {
  const text = (clause.cleanText || clause.rawText || '').trim();
  if (!text) return null;

  // 1. DRAW
  // "draw a card", "draw two cards", "draw 3 cards", "For each card discarded by this effect, draw a card"
  let m = text.match(/\bdraw\s+(a|an|one|two|three|four|five|\d+)\s+cards?\b/i);
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
  if (/send(?:ing)?\s+(?:your\s+)?\[?soul core\]?\s+to\s+(?:the\s+)?trash/i.test(text) || /banishing\s+the\s+\[?soul core\]?/i.test(text)) {
    return {
      op: 'MOVE_CORE',
      count: 1,
      isSoulCore: true,
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
  if (/^exhaust\s+it$/i.test(text.trim())) {
    return { op: 'EXHAUST', target: 'PREVIOUS_TARGET' };
  }
  if (/by\s+exhausting\s+this\s+nexus/i.test(text)) {
    return { op: 'EXHAUST', target: 'self' };
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
  // "give an opposing Spirit -N BP", "give it -N BP", "opposing Spirit gets -N BP"
  m = text.match(/(?:give\s+(?:an?\s+opposing\s+(?:spirit|ultimate)|it)|opposing\s+(?:spirit|ultimate)\s+gets?)\s*-(\d+)\s*bp/i);
  if (m) {
    return {
      op: 'BP_DEBUFF',
      amount: parseInt(m[1], 10),
      target: text.includes('it') ? 'PREVIOUS_TARGET' : { side: 'opp' },
      duration: clause.duration || 'THIS_TURN'
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
  m = text.match(/(?:reveal|open)\s+(a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:your\s+)?decktop/i) ||
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
  if (/This Nexus can only be affected by effects that target Grandwalker Nexuses/i.test(text)) {
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
  if (/This effect can't be prevented by opposing effects/i.test(text)) {
    return { op: 'UNPREVENTABLE' };
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

  // 21. CANNOT ATTACK / BLOCK
  if (/cannot\s+attack/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_ATTACK' };
  }
  if (/cannot\s+block/i.test(text)) {
    return { op: 'SET_RESTRICTION', restriction: 'CANNOT_BLOCK' };
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
  m = text.match(/^\[?Rush:\s*([^\]]+)\]?/i);
  if (m) {
    return { op: 'KEYWORD_ABILITY', keyword: 'Rush', condition: { colorSymbol: m[1].trim() } };
  }
  m = text.match(/^\[?Brave Symbol\s*\+\s*(\d+)\]?/i);
  if (m) {
    return { op: 'GRANT_BRAVE_SYMBOLS', count: parseInt(m[1], 10) };
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

  // If unrecognized, return generic unsupported clause for compiler tracking
  return {
    op: 'UNSUPPORTED',
    rawText: text
  };
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
