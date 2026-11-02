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

  // Strip wiki cosmetic boxes & badges: [utb], [heb], [qutb], [cntb], [+1], [-3], [team: ...]
  body = body
    .replace(/\[(?:utb|heb|qutb|cntb|tft|ftb|rbb)\]/gi, '')
    .replace(/\[[+\-]\d+\]/g, '')
    .replace(/\[team:\s*[^\]]+\]/gi, '')
    .trim();

  // Check limit / stack phrases in body
  if (/This effect can only be used once per turn\./i.test(body)) {
    result.limit = 'ONCE_PER_TURN';
    body = body.replace(/This effect can only be used once per turn\.\s*/i, '');
  }
  if (/This effect doesn't stack\./i.test(body)) {
    result.cantStack = true;
    body = body.replace(/This effect doesn't stack\.\s*/i, '');
  }

  // 1. Check for Flash or Main standalone markers
  if (/^\[Flash\]/i.test(body) || /^Flash\s*[-–]/i.test(body) || /^\(Flash\)/i.test(body)) {
    result.isFlash = true;
    result.timing = 'FLASH';
    result.timingLabel = 'Flash';
    body = body.replace(/^\[Flash\]\s*/i, '')
               .replace(/^Flash\s*[-–]\s*/i, '')
               .replace(/^\(Flash\)\s*/i, '');
  } else if (/^\[Main\]/i.test(body) || /^Main\s*[-–]/i.test(body) || /^\(Main\)/i.test(body)) {
    result.isMain = true;
    result.timing = 'MAIN';
    result.timingLabel = 'Main';
    body = body.replace(/^\[Main\]\s*/i, '')
               .replace(/^Main\s*[-–]\s*/i, '')
               .replace(/^\(Main\)\s*/i, '');
  }

  // 2. Parse Burst block
  const burstMatch = body.match(/^\[Burst:\s*([^\]]+)\]/i);
  if (burstMatch) {
    result.timing = 'BURST';
    result.timingLabel = 'Burst';
    let condRaw = burstMatch[1].trim();
    body = body.slice(burstMatch[0].length).trim();
    // If condition was in parentheses immediately following [Burst: ...] e.g. [Burst: s] (After your Life is reduced)
    const parenCondMatch = body.match(/^\((After\s+[^)]+)\)\s*/i);
    if (parenCondMatch) {
      condRaw = parenCondMatch[1].trim();
      body = body.slice(parenCondMatch[0].length).trim();
    }
    result.burstCondition = normalizeBurstCondition(condRaw);
  }

  // 3. Extract Prefixes: [During Advent], [During Brave], [When Braved], [During Set], [During OC], [Soul State], etc.
  const prefixRegex = /^\[(During\s+Advent|During\s+Brave|When\s+Braved|During\s+Set|During\s+OC(?:\s*&\s*During\s+Advent)?|Soul\s+State|Contract\s+Pre-Advent|During\s+Seal|Grand\s+Field|Grandwalker\s+Nexus|Summon\s+Condition:[^\]]+)\]\s*/i;
  let pMatch;
  while ((pMatch = body.match(prefixRegex))) {
    result.prefixes.push(pMatch[1].trim());
    body = body.slice(pMatch[0].length).trim();
  }

  // 4. Extract Levels: [LV1][LV2][LV3], [LV2][LV3], [LV3][LV4], [LV1-2], [LV1 (When Attacks)], etc.
  const levelBlocksRegex = /^((?:\[LV\s*\d+(?:-\d+)?(?:\s*\([^\]]+\))?\]|\/\[Ultimate\]|\/\[Spirit\])+)\s*/i;
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
  if (/^Flash\s*[-–]/i.test(body) || /^\[Flash\]/i.test(body)) {
    result.isFlash = true;
    result.timing = 'FLASH';
    body = body.replace(/^Flash\s*[-–]\s*/i, '').replace(/^\[Flash\]\s*/i, '');
  }

  // 5-7. Extract Timing Labels, Limits, and Keywords iteratively
  let changed = true;
  while (changed) {
    changed = false;

    // Check Flash / Main marker
    if (/^Flash\s*[-–]/i.test(body) || /^\[Flash\]/i.test(body)) {
      result.isFlash = true;
      result.timing = 'FLASH';
      body = body.replace(/^Flash\s*[-–]\s*/i, '').replace(/^\[Flash\]\s*/i, '');
      changed = true;
    }

    // Check Timing Labels: (When Attacks), (When Advents), ((Either Attack Step)), (Your Attack Step), etc.
    const timingLabelRegex = /^\(+((?:When\s+Attacks(?:\/Blocks)?|When\s+Summoned(?:\/Attacks)?(?:\/Advents)?(?:\/Destroyed)?|When\s+Blocks(?:\/Attacks)?|When\s+Destroyed(?:\s+by\s+the\s+Opponent)?|When\s+Depleted\/Destroyed\s+by\s+the\s+Opponent|When\s+Advents(?:\/Attacks)?|When\s+Deployed|When\s+Reborn(?:\/Attacks)?|When\s+Manifests(?:\/Attacks)?|When\s+Battles|When\s+Brave\s+Attacks|When\s+Set|During\s+Set|When\s+Leaves\s+the\s+Field|At\s+the\s+End\s+of\s+Battle|After\s+Your\s+Burst\s+Activates|Start\s+of\s+Your\s+Attack\s+Step|Start\s+of\s+Opposing\s+Attack\s+Step|Opposing\s+Attack\s+Step|Your\s+Attack\s+Step|Either\s+Attack\s+Step|Your\s+Main\s+Step|Opposing\s+Main\s+Step|Either\s+Main\s+Step|Your\s+Draw\s+Step|Your\s+End\s+Step|Opposing\s+End\s+Step|Your\s+Turn|Opposing\s+Turn))\)+\s*/i;
    const tMatch = body.match(timingLabelRegex);
    if (tMatch) {
      const rawLabel = tMatch[1].trim();
      result.timingLabel = rawLabel;
      result.timing = mapTimingLabelToType(rawLabel, result.timing);
      body = body.slice(tMatch[0].length).trim();
      changed = true;
    }

    // Check unparenthesized legacy timings e.g. "When Summoned", "When Attacks", "When Destroyed"
    const unparenMatch = body.match(/^(When\s+Summoned|When\s+Attacks|When\s+Destroyed|When\s+Blocks)\b\s*/i);
    if (unparenMatch) {
      const rawLabel = unparenMatch[1].trim();
      result.timingLabel = rawLabel;
      result.timing = mapTimingLabelToType(rawLabel, result.timing);
      body = body.slice(unparenMatch[0].length).trim();
      changed = true;
    }

    // Check Limit constraints: (Once per Turn: Same Name), (Once per Turn), (Can't Stack), Once per turn,
    if (/^\(Can't Stack\)\s*/i.test(body)) {
      result.cantStack = true;
      body = body.replace(/^\(Can't Stack\)\s*/i, '');
      changed = true;
    }
    const limitMatch = body.match(/^\((Once per (?:Turn|Game)(?::\s*Same Name)?)\)\s*/i) || body.match(/^(Once per (?:turn|game)(?::\s*same name)?),\s*/i);
    if (limitMatch) {
      result.limit = limitMatch[1].toUpperCase().replace(/\s+/g, '_').replace(':', '');
      body = body.slice(limitMatch[0].length).trim();
      changed = true;
    }

    // Check bracketed Named Keywords (e.g. [Twinkle Awaken], [Advent: Cost 6 or more], [High Speed], [Clash])
    const kwMatch = body.match(/^\[([A-Z][A-Za-z0-9_\-\s]+(?::\s*[^\]]+)?)\]\s*/);
    if (kwMatch && !kwMatch[1].startsWith('LV')) {
      result.keyword = kwMatch[1].trim();
      body = body.slice(kwMatch[0].length).trim();
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
  if (l.includes('when attacks')) return 'WHEN_ATTACKS';
  if (l.includes('when summoned') && l.includes('destroyed')) return 'WHEN_SUMMONED_OR_DESTROYED';
  if (l.includes('when summoned')) return 'WHEN_SUMMONED';
  if (l.includes('when blocks')) return 'WHEN_BLOCKS';
  if (l.includes('when destroyed')) return 'WHEN_DESTROYED';
  if (l.includes('when advents')) return 'WHEN_ADVENTS';
  if (l.includes('when deployed')) return 'WHEN_DEPLOYED';
  if (l.includes('when reborn')) return 'WHEN_REBORN';
  if (l.includes('when battles')) return 'WHEN_BATTLES';
  if (l.includes('when brave attacks')) return 'WHEN_BRAVE_ATTACKS';
  if (l.includes('when set')) return 'WHEN_SET';
  if (l.includes('during set')) return 'DURING_SET';
  if (l.includes('when leaves the field')) return 'WHEN_LEAVES_FIELD';
  if (l.includes('end of battle')) return 'END_OF_BATTLE';
  if (l.includes('start of your attack step') || l.includes('start of attack step')) return 'START_OF_ATTACK_STEP';
  if (l.includes('end step')) return 'END_OF_TURN';
  return defaultTiming !== 'PASSIVE' ? defaultTiming : 'STEP_RESTRICTED';
}
