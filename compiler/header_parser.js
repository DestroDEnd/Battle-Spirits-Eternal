/**
 * compiler/header_parser.js
 * 
 * Extracts level restrictions, prefixes, timing tags, limit constraints,
 * and Burst triggers from raw Battle Spirits card ability blocks.
 */

export function parseAbilityHeaders(blockText) {
  const result = {
    levels: [1, 2, 3], // default levels
    levelExplicit: false,
    prefixes: [],
    timing: 'PASSIVE',
    timingLabel: '',
    timingStep: 'ANY',
    limit: null,
    cantStack: false,
    keyword: null,
    burstCondition: null,
    isFlash: false,
    isMain: false,
    cleanBody: blockText.trim()
  };

  let body = blockText.trim();

  // Strip wiki cosmetic boxes & badges: [utb], [heb], [qutb], [cntb], [+1], [-3], [team: ...], (), (Max. ...)
  body = body
    .replace(/<sub\b[^>]*>.*?<\/sub>/gi, '')
    .replace(/<i\b[^>]*>.*?<\/i>/gi, '')
    .replace(/\[(?:utb|heb|qutb|cntb|tft|ftb|rbb|wutb|xutb|dutb|tutb|outb|cutb|dcutb)\]/gi, '')
    .replace(/\[(?:catl|deh|mflash|mdrain|msyn):[^\]]+\]/gi, '')
    .replace(/\[[+\-]\d+\]/g, '')
    .replace(/\[teams?:\s*[^\]]+\]/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\((?:Up to\s+)?(?:\d+\s+lives?\s+)?Max\.?[^)]*\)/gi, '')
    .replace(/\((?:All\s+)?cores\s+on\s+it\s+are\s+sent\s+to\s+the\s+(?:reserve|void)\.?\)/gi, '')
    .replace(/\(while\s+on\s+the\s+field,\s*(?:all\s+)?the\s+following\s+effects?\s+(?:are|remains?)\s+active\)/gi, '')
    .replace(/while\s+(?:placed\s+)?on\s+the\s+field,\s*(?:all\s+)?the\s+following\s+effects?\s+(?:is|are|remains?)\s+active:?/gi, '')
    .replace(/\[\s*\]/g, '')
    .replace(/(?:^|[\r\n]|\s+)(\d+(?:\/\d+)*)\s+Flash(?:\s*[-–])?\s*\(/gi, ' [Grand Skill: $1] Flash - (')
    .replace(/(?:^|[\r\n]|\s+)(\d+(?:\/\d+)*)\s+(\[LV\d+\])/gi, ' [Grand Skill: $1] $2')
    .replace(/^\/\s*/, '')
    .replace(/\/\s*(\[(?:Nexus|Spirit|LV\d+|Contract\s+Field)\]|\([A-Za-z0-9\s]+\))/gi, '$1')
    .replace(/(?:^|\s+)\d+\s+(?=\()/g, ' ')
    .replace(/(?:^|\s+)(\d+)\s+(?=\[LV\d+(?:-\d+)?\])/g, ' [Grand Skill: $1] ')
    .trim();

  // Strip (Permanent) / (Constant) indicator tags
  body = body.replace(/^\((?:Permanent|Constant)\)\s*/i, '');

  // Normalize typos in wiki headers
  body = body.replace(/\[LV!\]/gi, '[LV1]')
             .replace(/\[LV\]\]/gi, '[LV1]')
             .replace(/\[LV(\d+)\s*\(/gi, '[LV$1] (')
             .replace(/(?:^|[\r\n])\s*Clock Up\]/gi, '\n[Clock Up]')
             .replace(/\(Start of Your Attacks Step\)/gi, '(Start of Your Attack Step)')
             .replace(/\(When\s+Attacka\)/gi, '(When Attacks)')
             .replace(/\(When\s+Manifestes/gi, '(When Manifests')
             .replace(/\(When\s+Summoned\/\s*Attacks\)/gi, '(When Summoned/Attacks)')
             .replace(/\(Your Main Phrase\)/gi, '(Your Main Phase)')
             .replace(/\(Your Attacks Step\)/gi, '(Your Attack Step)')
             .replace(/\(Your Attack Steo\)/gi, '(Your Attack Step)')
             .replace(/\(Opposing Attacks Step\)/gi, '(Opposing Attack Step)')
             .replace(/\(Oppoding Attack Step\)/gi, '(Opposing Attack Step)')
             .replace(/\(Either Attack Steep\)/gi, '(Either Attack Step)')
             .replace(/\(Start of \(/gi, '(Start of ')
             .replace(/\]\s*LV(\d+)\]/gi, '][LV$1]')
             .replace(/\[LV(\d+)\[LV(\d+)\]/gi, '[LV$1][LV$2]')
             .replace(/\[LV(\d+)\s+\[/gi, '[LV$1] [')
             .replace(/\[V(\d+)\]/gi, '[LV$1]')
             .replace(/(?<!\[)LV(\d+)\]/gi, '[LV$1]')
             .replace(/^\[\s*(?=\()/gi, '')
             .replace(/\]\[\s*(?=\()/gi, '] ')
             .replace(/\[uhand(?:\s+all)?:\s*([A-Za-z0-9\/]+)?\s*((?:\[LV\d+\])+)\]\s*/gi, '$2 [U-Hand: $1] ')
             .replace(/(\]|[\r\n]|^)\s*(?:White|Red|Green|Purple|Blue|Yellow|Sea)(?:\/(?:White|Red|Green|Purple|Blue|Yellow|Sea))*\s*\(/gim, '$1 (')
             .replace(/(\[LV\d+\](?:\[LV\d+\])*)\s+[A-Za-z]+\s*\(/gi, '$1 (')
             .replace(/\[LV1-2-3\]/gi, '[LV1][LV2][LV3]')
             .replace(/\[LV1-2\]/gi, '[LV1][LV2]')
             .replace(/\[LV(\d+)-(\d+)\]/gi, '[LV$1][LV$2]')
             .replace(/\[LV(\d+)-(\d+)-(\d+)\]/gi, '[LV$1][LV$2][LV$3]')
             .replace(/(\[LV\d+\](?:\[LV\d+\])*)\s+(\[LV\d+\](?:\[LV\d+\])*)/gi, '$1')
             .replace(/(\]|[\r\n]|^)\s*(Your\s+(?:Start|Core|Draw|Refresh|Main|Attack|End)\s+(?:Step|Phase)\))/gi, '$1 ($2')
             .replace(/^(\s*(?:\[LV\d+\])+\s*\([^)]+\))\]+/gim, '$1')
             .replace(/\(Ultimate\s*\]\],?\s*/gi, '(During Ultimate, ')
             .replace(/∞/g, '')
             .replace(/^\s*\[\s*(?=\()/gm, '')
             .replace(/\(When\s+Summoned(?:\r?\n|$)/gim, '(When Summoned)\n')
             .replace(/\b(?:This\s+effect\s+doest\s+stack\.)/gi, "This effect doesn't stack.")
             .replace(/Atacks/gi, 'Attacks')
             .replace(/([a-z])Once\s+Per\s+(Turn|Game|Battle)\b/gi, '$1 (Once per $2)')
             .replace(/(?:^|[\r\n]|\s+)\d+(When\s+[A-Za-z]+)/gi, ' ($1)')
             .replace(/(?:^|[\r\n])\s*Trigger\s+Counter\b/gi, '\n[Trigger Counter]')
             .replace(/⚞Advent⚟:\s*([^\n]+(?:\([^\)]+\)))/gi, '[Advent: $1]')
             .replace(/⚞Advent⚟/gi, '[Advent]')
             .replace(/\[Advent\]:\s*([^\n]+(?:\([^\)]+\)))/gi, '[Advent: $1]')
             .replace(/(?:^|[\r\n])\s*Flash\s*[-–]\s*Advent:\s*([^\n]+(?:\([^\)]+\)))/gi, '\nFlash - [Advent: $1]')
             .replace(/Showdown\s*[-–]\s*/gi, '')
             .replace(/\{LV(\d+)\]/gi, '[LV$1]')
             .replace(/^\{\s*(?=\[LV)/i, '')
             .replace(/\]\s*'\s*/g, '] ')
             .replace(/^'\s*(?=\[)/i, '')
             .replace(/("[^"]+")\s+(During\s+Attacks?|When\s+Attacks?)/gi, '($2)')
             .replace(/(?<!\[)True\s+Release\s*([A-Za-z])/g, '[True Release] $1')
             .replace(/(?<!\[)True\s+Release\b/gi, '[True Release] ')
             .replace(/CSOPT/g, ' (Once per Turn) (Can\'t Stack) ')
             .replace(/(?<!\()Can't\s+Stack(?!\))/gi, ' (Can\'t Stack) ')
             .replace(/\[Invoke:\s*Flash\]/gi, ' Flash ')
             .replace(/\[Invoke:\s*Main\]/gi, ' Main ');

  // Check limit / stack phrases in body
  if (/This effect can only be used once per turn\./i.test(body)) {
    result.limit = 'ONCE_PER_TURN';
    body = body.replace(/This effect can only be used once per turn\.\s*/i, '');
  }
  if (/You can only use this effect of the same card name once per turn\./i.test(body)) {
    result.limit = 'ONCE_PER_TURN_SAME_NAME';
    body = body.replace(/You can only use this effect of the same card name once per turn\.\s*/i, '');
  }
  if (/You can only use this effect once per turn\./i.test(body)) {
    result.limit = 'ONCE_PER_TURN';
    body = body.replace(/You can only use this effect once per turn\.\s*/i, '');
  }
  if (/This effect doesn't stack\./i.test(body)) {
    result.cantStack = true;
    body = body.replace(/This effect doesn't stack\.\s*/i, '');
  }

  // 1. Check for Flash or Main standalone markers
  if (/^\[Flash\]/i.test(body) || /^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z]))/i.test(body) || /^\(Flash\)/i.test(body)) {
    result.isFlash = true;
    result.timing = 'FLASH';
    result.timingLabel = 'Flash';
    body = body.replace(/^\[Flash\]\s*/i, '')
               .replace(/^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z]))\s*/i, '')
               .replace(/^\(Flash\)\s*/i, '');
  } else if (/^\[Main\]/i.test(body) || /^Main(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z]))/i.test(body) || /^\(Main\)/i.test(body)) {
    result.isMain = true;
    result.timing = 'MAIN';
    result.timingLabel = 'Main';
    body = body.replace(/^\[Main\]\s*/i, '')
               .replace(/^Main(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z]))\s*/i, '')
               .replace(/^\(Main\)\s*/i, '');
  }

  // 2. Parse Burst block
  const burstMatch = body.match(/^\[Burst:\s*(.+?)\](?=\r?\n|$|\s*\()/i);
  if (burstMatch) {
    result.timing = 'BURST';
    result.timingLabel = 'Burst';
    let condRaw = burstMatch[1].trim();
    body = body.slice(burstMatch[0].length).trim();
    // If condition was in parentheses immediately following [Burst: ...] e.g. [Burst: s] (After your Life is reduced)
    const parenCondMatch = body.match(/^\((After\s+(?:(?:\([^)]*\)|[^)])+))\)\s*/i);
    if (parenCondMatch) {
      condRaw = parenCondMatch[1].trim();
      body = body.slice(parenCondMatch[0].length).trim();
    }
    result.burstCondition = normalizeBurstCondition(condRaw);
  }

  // 3. Extract Prefixes: [During Advent], [During Brave], [When Braved], [During Set], [During OC], [Soul State], etc.
  const prefixRegex = /^\[((?:Seal:\s*)?(?:During\s+Seal|When\s+Sealed|Super\s+Seal|Seal)|True\s+Release|During\s+Advent|During\s+Brave|When\s+Braved|During\s+Set|During\s+OC(?:\s*&\s*During\s+Advent)?|Soul\s+State|Contract\s+Pre-Advent|Grand\s+Field|Grandwalker\s+Nexus|rtp|Summon\s+Condition:[^\]]+|(?:Grand\s+Skill|Unleash|Super\s+Unleash|Release|Rebirth|Mirage|Change|Count\s+Ultimate\s+Trigger)(?::(?:\[[^\]]*\]|[^\]])+)?)\]\s*/i;
  let pMatch;
  while ((pMatch = body.match(prefixRegex))) {
    result.prefixes.push(pMatch[1].trim());
    body = body.slice(pMatch[0].length).trim();
  }

  // 3b. Check Ultimate Trigger header with nested levels: [Ultimate Trigger: [LV3][LV4][LV5] (When Attacks)]
  const utMatch = body.match(/^\[((?:[A-Za-z]+\s+)?Ultimate\s+Trigger):\s*((?:\[LV\d+\])+)?\s*(\([^\)]+\))?\]\s*/i);
  if (utMatch) {
    result.keyword = utMatch[1].trim();
    if (utMatch[2]) {
      result.levelExplicit = true;
      const lvNums = [...utMatch[2].matchAll(/LV(\d+)/gi)].map(m => parseInt(m[1], 10));
      if (lvNums.length > 0) {
        result.levels = Array.from(new Set(lvNums)).sort((a, b) => a - b);
      }
    }
    if (utMatch[3]) {
      const rawLabel = utMatch[3].replace(/[()]/g, '').trim();
      result.timingLabel = rawLabel;
      result.timing = mapTimingLabelToType(rawLabel, result.timing);
    }
    body = body.slice(utMatch[0].length).trim();
  }

  // 4. Extract Levels: [LV1][LV2][LV3], [LV2][LV3], [LV3][LV4], [LV1-2], [LV1 (When Attacks)], etc.
  const levelBlocksRegex = /^((?:\[LV\s*\d+(?:-\d+)?(?:\s*\([^\]]+\))?\]|\/?\[(?:Ultimate|Spirit|Nexus|Contract\s+Field)\])+)\s*/i;
  const lvMatch = body.match(levelBlocksRegex);
  if (lvMatch) {
    result.levelExplicit = true;
    const lvNums = [];
    const numRegex = /LV\s*(\d+)/gi;
    let nMatch;
    while ((nMatch = numRegex.exec(lvMatch[1]))) {
      lvNums.push(parseInt(nMatch[1], 10));
    }
    // Handle ranges like [LV1-2]
    const rangeMatch = lvMatch[1].match(/LV\s*(\d+)-(\d+)/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let r = start; r <= end; r++) {
        if (!lvNums.includes(r)) lvNums.push(r);
      }
    }
    // Check if timing label was inside the level bracket e.g. [LV1 (When Attacks)]
    const innerTimingMatch = lvMatch[1].match(/\(([^)]+)\)/);
    if (innerTimingMatch) {
      result.timingLabel = innerTimingMatch[1].trim();
      result.timing = mapTimingLabelToType(result.timingLabel, result.timing);
    }

    if (lvNums.length > 0) {
      result.levels = Array.from(new Set(lvNums)).sort((a, b) => a - b);
    }
    body = body.slice(lvMatch[0].length).trim();
  }

  // Strip stray leading/trailing bracket residues
  body = body.replace(/^[\]\)\s]+/, '').replace(/[\[\(\s]+$/, '').trim();

  // Check again for Flash / Main after levels e.g. [LV2][LV3] Flash - [Twinkle Awaken]
  if (/^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=(?!Timing\s+doesn't)[A-Z\[]))/i.test(body) || /^\[Flash\]/i.test(body)) {
    result.isFlash = true;
    result.timing = 'FLASH';
    result.timingLabel = 'Flash';
    body = body.replace(/^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=(?!Timing\s+doesn't)[A-Z\[]))\s*/i, '').replace(/^\[Flash\]\s*/i, '');
  }

  // 5-7. Extract Timing Labels, Limits, and Keywords iteratively
  let changed = true;
  while (changed) {
    changed = false;

    // Check level blocks
    const lvMatchIter = body.match(levelBlocksRegex);
    if (lvMatchIter) {
      result.levelExplicit = true;
      const lvNums = [];
      const numRegex = /LV\s*(\d+)/gi;
      let nMatch;
      while ((nMatch = numRegex.exec(lvMatchIter[1]))) {
        lvNums.push(parseInt(nMatch[1], 10));
      }
      const rangeMatch = lvMatchIter[1].match(/LV\s*(\d+)-(\d+)/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        for (let r = start; r <= end; r++) {
          if (!lvNums.includes(r)) lvNums.push(r);
        }
      }
      const innerTimingMatch = lvMatchIter[1].match(/\(([^)]+)\)/);
      if (innerTimingMatch) {
        result.timingLabel = innerTimingMatch[1].trim();
        result.timing = mapTimingLabelToType(result.timingLabel, result.timing);
      }
      if (lvNums.length > 0) {
        result.levels = Array.from(new Set(lvNums)).sort((a, b) => a - b);
      }
      body = body.slice(lvMatchIter[0].length).trim();
      changed = true;
    }

    // Check Prefixes
    let pMatchIter;
    if ((pMatchIter = body.match(prefixRegex))) {
      result.prefixes.push(pMatchIter[1].trim());
      body = body.slice(pMatchIter[0].length).trim();
      changed = true;
    }

    // Check Flash / Main marker
    if (/^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=(?!Timing\s+doesn't)[A-Z\[\(])|\s*$)/i.test(body) || /^\[Flash\]/i.test(body) || /^\(Flash\)/i.test(body)) {
      result.isFlash = true;
      result.timing = 'FLASH';
      result.timingLabel = 'Flash';
      body = body.replace(/^Flash(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=(?!Timing\s+doesn't)[A-Z\[\(])|\s*)\s*/i, '').replace(/^\[Flash\]\s*/i, '').replace(/^\(Flash\)\s*/i, '');
      changed = true;
    }
    if (/^Main(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z\[\(])|\s*$)/i.test(body) || /^\[Main\]/i.test(body) || /^\(Main\)/i.test(body)) {
      result.isMain = true;
      result.timing = 'MAIN';
      result.timingLabel = 'Main';
      body = body.replace(/^Main(?:\s*[-–]|\s*\d+\b|\s*\n|\s+(?=[A-Z\[\(])|\s*)\s*/i, '').replace(/^\[Main\]\s*/i, '').replace(/^\(Main\)\s*/i, '');
      changed = true;
    }

    // Check Timing Labels: (When Attacks), (When Advents), ((Either Attack Step)), (Your Attack Step), etc.
    const timingLabelRegex = /^\(+((?:When\s+(?:this\s+(?:Spirit|Ultimate|Spirit\/Ultimate)\s+)?(?:Summoned|Attacks?|Blocks|Advents?|Destroyed|Deployed|Reborn|Manifests?|Battles?)(?:\/(?:Summoned|Attacks?|Blocks|Advents?|Destroyed|Deployed|Reborn|Manifests?|Battles?))*|When\s+Destroyed(?:\s+by\s+(?:an?\s+opposing\s+[a-z]+\s+effect|(?:the\s+)?Opponent))?|When\s+Depleted(?:\s+by\s+(?:the\s+)?Opponent)?|When\s+Depleted\/Destroyed(?:\s+by\s+(?:the\s+)?Opponent)?|When\s+Brave\s+Attacks?|When\s+Set|During\s+Set|During\s+Attack|During\s+Ultimate,?\s*(?:\()?(?:Either|Your|Opposing)\s+Attack(?:s)?\s+Step(?:\))?|(?:Accel,?\s*)?(?:\()?(?:Either|Your|Opposing)\s+Attack(?:s)?\s+Step(?:\))?|When\s+Leaves\s+the\s+Field|When\s+Exhausted|At\s+the\s+End\s+of\s+Battle|(?:At\s+the\s+)?End\s+of\s+(?:the\s+Step|Your\s+Turn|Opposing\s+Turn|Your\s+Main\s+Step|(?:Either|Your|Opposing)\s+(?:Attack\s+)?Step)|After\s+Your\s+Burst\s+Activates|Start\s+of\s+(?:Your|Opposing|Opponent's|Either)\s+(?:Attack|Main)\s+Step|(?:Your|Opposing|Opponent's|Either)\s+(?:Attack|Attacks|Main|Draw|Refresh|Start|Core|End)\s+(?:Step|Phase)|Flash\s+Step|Flash\s+Timing|During\s+(?:Your\s+)?Battle\s+Phase|(?:Your|Opposing|Opponent's|Either|Every)\s+Turn))\)+\s*\]*\s*/i;
    const tMatch = body.match(timingLabelRegex);
    if (tMatch) {
      const rawLabel = tMatch[1].trim();
      result.timingLabel = rawLabel;
      result.timing = mapTimingLabelToType(rawLabel, result.timing);
      body = body.slice(tMatch[0].length).trim();
      changed = true;
    }

    // Check {Stage Style & ...} or {Grand Style & ...}
    const styleMatch = body.match(/^\{((?:Stage|Grand)\s+Style\s*&[^}]+)\}\s*/i);
    if (styleMatch) {
      result.prefixes.push(styleMatch[1].trim());
      body = body.slice(styleMatch[0].length).trim();
      changed = true;
    }

    // Check unparenthesized legacy timings e.g. "When Summoned", "When Attacks", "When Destroyed"
    const unparenMatch = body.match(/^(When\s+(?:Summoned(?:\s+by\s+[^,]+)?|Attacks?(?:\/(?:Summoned|Attacks?|Blocks?|Destroyed))?|Blocks?|Destroyed(?:\s+by\s+[^,]+)?|Deployed|Advents?(?:\/(?:Attacks?|Blocks?))?|Reborn|Manifests?)|During\s+(?:Attacks?(?:\/Blocks?)?|Blocks?)|(?:Start\s+of\s+)?(?:Your|Opposing|Opponent's|Either)\s+(?:Attack\s+Step|Main\s+Step|End\s+Step)|(?:Your|Opposing|Opponent's|Either)\s+(?:Attack|Main|End)\s+Step|(?:Your|Opposing|Opponent's|Either)\s+Turn)\b\s*,?\s*/i);
    if (unparenMatch) {
      const rawLabel = unparenMatch[1].trim();
      result.timingLabel = rawLabel;
      result.timing = mapTimingLabelToType(rawLabel, result.timing);
      body = body.slice(unparenMatch[0].length).trim();
      changed = true;
    }

    // Check Limit constraints: (Once per Turn: Same Name), (Once per Turn), (Can't Stack), Once per turn,
    const cantStackMatch = body.match(/^\(?Can't\s+Stack\)?\s*/i);
    if (cantStackMatch) {
      result.cantStack = true;
      body = body.slice(cantStackMatch[0].length).trim();
      changed = true;
    }
    const limitMatch = body.match(/^\((Once per (?:Turn|Game|Battle)(?::\s*Same Name)?)\)\s*/i) || body.match(/^(Once per (?:turn|game|battle)(?::\s*same name)?),?\s*/i);
    if (limitMatch) {
      result.limit = limitMatch[1].toUpperCase().replace(/\s+/g, '_').replace(':', '');
      body = body.slice(limitMatch[0].length).trim();
      changed = true;
    }

    // Check bracketed Named Keywords (e.g. [Twinkle Awaken], [Advent: Cost 6 or more], [High Speed], [Clash], [G.A.T. Field])
    const kwMatch = body.match(/^\[([A-Za-z0-9_\-\.\s]+(?::\s*[^\]]+)?)\]\s*/);
    if (kwMatch && !kwMatch[1].toUpperCase().startsWith('LV')) {
      result.keyword = kwMatch[1].trim();
      body = body.slice(kwMatch[0].length).trim();
      changed = true;
    }

    // Check unbracketed Rebirth prefix
    const rebMatch = body.match(/^((?:Six\s+Heaven\s+|Sortie\s+|Absolute\s+|Illusive\s+)?Rebirth(?::|\s+\d+\s+(?:Counters?\s+(?:or\s+less|or\s+more)|(?:or\s+less|or\s+more)\s+Counters?))\s*[^(\n\r]*(?:\([^)]+\))?)\s*/i);
    if (rebMatch) {
      result.prefixes.push(rebMatch[1].trim());
      body = body.slice(rebMatch[0].length).trim();
      changed = true;
    }

    // Check unbracketed keywords
    if (/^Variable\b/i.test(body)) {
      result.keyword = 'Variable';
      body = body.replace(/^Variable\b\s*/i, '');
      changed = true;
    }
    if (/^Striker\s+Pack\b/i.test(body)) {
      result.prefixes.push('Striker Pack');
      body = body.replace(/^Striker\s+Pack\b\s*/i, '');
      changed = true;
    }
    if (/^Silhouette\s+System\b/i.test(body)) {
      result.prefixes.push('Silhouette System');
      body = body.replace(/^Silhouette\s+System\b\s*/i, '');
      changed = true;
    }

    // Strip bracket residues at front
    if (/^[\]\)\s]+/.test(body)) {
      body = body.replace(/^[\]\)\s]+/, '').trim();
      changed = true;
    }
  }

  result.cleanBody = body.replace(/^[\]\)\s]+/, '').replace(/[\[\(\s]+$/, '').trim();
  return result;
}

function normalizeBurstCondition(condStr) {
  const s = condStr.toLowerCase();
  if (s.includes('life') && s.includes('reduced')) {
    return 'AFTER_YOUR_LIFE_REDUCED';
  }
  if (s.includes('depleted') || (s.includes('destroyed') && s.includes('opponent'))) {
    return 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT';
  }
  if (s.includes('spirit') && s.includes('destroyed')) {
    return 'AFTER_YOUR_SPIRIT_DESTROYED';
  }
  if (s.includes('summon') && s.includes('resolves')) {
    return 'AFTER_OPPONENT_SUMMON_EFFECT';
  }
  if (s.includes('attack') || s.includes('attacks')) {
    return 'AFTER_OPPONENT_ATTACK';
  }
  return 'AFTER_TRIGGER_CONDITION';
}

function mapTimingLabelToType(label, defaultTiming) {
  const l = label.toLowerCase();
  if (l.includes('when attacks') && l.includes('blocks')) return 'WHEN_ATTACKS_OR_BLOCKS';
  if (l.includes('when blocks') && l.includes('attacks')) return 'WHEN_ATTACKS_OR_BLOCKS';
  if (l.includes('when attacks') && l.includes('destroyed')) return 'WHEN_ATTACKS_OR_DESTROYED';
  if (l.includes('when blocks') && l.includes('destroyed')) return 'WHEN_BLOCKS_OR_DESTROYED';
  if (l.includes('when summoned') && l.includes('blocks')) return 'WHEN_SUMMONED_OR_BLOCKS';
  if (l.includes('when summoned') && l.includes('destroyed')) return 'WHEN_SUMMONED_OR_DESTROYED';
  if (l.includes('when attacks')) return 'WHEN_ATTACKS';
  if (l.includes('when summoned')) return 'WHEN_SUMMONED';
  if (l.includes('when blocks')) return 'WHEN_BLOCKS';
  if (l.includes('when destroyed')) return 'WHEN_DESTROYED';
  if (l.includes('when advents')) return 'WHEN_ADVENTS';
  if (l.includes('when deployed')) return 'WHEN_DEPLOYED';
  if (l.includes('when reborn')) return 'WHEN_REBORN';
  if (l.includes('battles')) return 'WHEN_BATTLES';
  if (l.includes('when brave attacks')) return 'WHEN_BRAVE_ATTACKS';
  if (l.includes('when set')) return 'WHEN_SET';
  if (l.includes('during set')) return 'DURING_SET';
  if (l.includes('when leaves the field')) return 'WHEN_LEAVES_FIELD';
  if (l.includes('when exhausted')) return 'WHEN_EXHAUSTED';
  if (l.includes('end of battle')) return 'END_OF_BATTLE';
  if (l.includes('battle phase')) return 'ATTACK_STEP';
  if (l.includes('flash step') || l.includes('flash timing')) return 'FLASH';
  if (l.includes('start of your attack step') || l.includes('start of attack step')) return 'START_OF_ATTACK_STEP';
  if (l.includes('start step')) return 'START_STEP';
  if (l.includes('core step')) return 'CORE_STEP';
  if (l.includes('draw step')) return 'DRAW_STEP';
  if (l.includes('refresh step')) return 'REFRESH_STEP';
  if (l.includes('main step') || l.includes('main phase')) return 'MAIN_STEP';
  if (l.includes('attack step') || l.includes('attacks step')) return 'ATTACK_STEP';
  if (l.includes('end step')) return 'END_OF_TURN';
  if (l.includes('turn')) return 'TURN_TRIGGER';
  return defaultTiming !== 'PASSIVE' ? defaultTiming : 'STEP_RESTRICTED';
}
