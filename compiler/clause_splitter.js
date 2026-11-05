/**
 * compiler/clause_splitter.js
 * 
 * Splits ability body text into connected clauses with link semantics,
 * optionality detection, and condition extraction.
 */

export function splitClauses(text) {
  if (!text || !text.trim()) return [];

  const raw = text.trim();

  // Normalize quotes and spaces
  let normalized = raw
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/(?:^|\n)\s*\d+\s*(?=\n|$)/g, '\n')
    .replace(/^\((?:Permanent|Constant)\)\s*/gim, '')
    .replace(/\s*\((?:Permanent|Constant)\)\s*/gi, ' ')
    .replace(/\([^)]*Max\.?\s*\d+\.?\)/gi, '')
    .replace(/\(You\s+can\s+(?:send|put)\s+[^)]+\)/gi, '')
    .replace(/\s*\((?:It\s+can\s+be\s+activated\s+while\s+on\s+(?:the\s+)?field|The\s+following\s+effects\s+are\s+all\s+active\s+while\s+on\s+field)\)/gi, '')
    .replace(/\s*\((?:This\s+Nexus\s+can\s+only\s+hold\s+up\s+to\s+\d+\s+cores)\)\]?/gi, '')
    .replace(/\s*\((?:The\s+face-down\s+cards\s+are\s+discarded\s+when\s+this\s+Spirit\s+has\s+left\s+the\s+Field\.?)\)/gi, '')
    .replace(/\s*\((?:While\s+on\s+the\s+Field,\s*the\s+following\s+effect\s+activates)\)/gi, '')
    .replace(/\s*\((?:Illusive\s+Ultra\s+Heavy)\)/gi, '')
    .replace(/\s*\((?:The\s+opponent\s+choo?ses\s+which\s+cores?\s+to\s+send\.?|Knight)\)/gi, '')
    .replace(/\s*\(Ultimate\s+Trigger:[^)]+\)/gi, '')
    .replace(/\s*\((?:This\s+effect\s+can't\s+bring\s+the\s+number\s+of\s+cores\s+on\s+the\s+opposing\s+Spirit\s+down\s+to\s+0\.?)\)/gi, '')
    .replace(/\bYou\s+can\s+only\s+use\s+this\s+effect\s+(?:of\s+the\s+same\s+card\s+name\s+)?once\s+per\s+turn\.?\s*/gi, '')
    .replace(/\s*\((?:Once\s+per\s+(?:Game|Turn)(?::\s*Same\s+Name)?)\)\s*/gi, ' ')
    .replace(/\[Soul Core\]\(Soul Core\)/gi, '[Soul Core]');

  // We want to segment the text by sentence and connector boundaries.
  // Recognized connector prefixes and their link types:
  // - "Then, " -> then
  // - "After this effect resolves, " -> afterResolves
  // - "Or, " -> or
  // - "Also, " -> also
  // - "instead, " -> instead
  // - "When you've done so, " / "When you do so, " / "If you do, " -> byDoing / ifYouDo
  // - "For each " -> forEach

  const segments = [];
  
  // Split on paragraph or bullet lines first
  const lines = normalized.split(/\n+/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const subSegments = splitLineIntoClauses(line);
    for (const seg of subSegments) {
      if (seg.cleanText && !/^[.\s{}]+$/.test(seg.cleanText)) {
        segments.push(seg);
      }
    }
  }

  return segments;
}

function splitLineIntoClauses(line) {
  const clauses = [];

  if (/^(?:\[LV\d+\]|LV\d+)\s*$/i.test(line.trim())) {
    return [];
  }

  // Strip Rush / Color core condition prefixes like [Purple Core]: or [Blue Core]:
  line = line.replace(/^\[[A-Za-z]+\s+Core\]:\s*/i, '');

  // Patterns that define a new connected clause
  // Tokenize by punctuation and keywords
  const connectorRegex = /(?:\.\s+|\s+)?(?:(Then,)|(After (?:this|that) effect resolves,)|(Or,)|(Also,)|(When you've done so,)|(When you do so,)|(If you do,)|(By doing so,)|(instead,))\s*/gi;

  let lastIndex = 0;
  let currentLink = null;
  let match;

  // Check if the entire line starts with "By [verb]ing ... ," which forms a cost/prerequisite clause
  const byMatch = line.match(/^By\s+([^,]+),\s*(.*)$/i);
  if (byMatch) {
    const costText = `By ${byMatch[1].trim()}`;
    const restText = byMatch[2].trim();
    clauses.push(buildClause(costText, null, false, null, true));
    
    // Now recurse on restText with link 'byDoing'
    const subClauses = splitLineIntoClauses(restText);
    if (subClauses.length > 0) {
      subClauses[0].link = 'byDoing';
      clauses.push(...subClauses);
    }
    return clauses;
  }
  const byStandalone = line.match(/^By\s+(.*)$/i);
  if (byStandalone) {
    clauses.push(buildClause(line.trim(), null, false, null, true));
    return clauses;
  }

  // General sentence / connector split
  // We can split by period followed by capital letter or connector
  const sentences = splitSentences(line);

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (!s || /^\s*\(\s*\)\s*$/.test(s)) continue;

    let link = null;
    let clean = s.replace(/^However,\s*/i, '');

    // Check connector at start of sentence
    if (/^Then,\s*/i.test(clean)) {
      link = 'then';
      clean = clean.replace(/^Then,\s*/i, '');
    } else if (/^After (?:this|that) effect resolves,\s*/i.test(clean)) {
      link = 'afterResolves';
      clean = clean.replace(/^After (?:this|that) effect resolves,\s*/i, '');
    } else if (/^Or,\s*/i.test(clean)) {
      link = 'or';
      clean = clean.replace(/^Or,\s*/i, '');
    } else if (/^Also,\s*/i.test(clean)) {
      link = 'also';
      clean = clean.replace(/^Also,\s*/i, '');
    } else if (/^(?:When you've done so|When you do so|If you do|By doing so),\s*/i.test(clean)) {
      link = 'byDoing';
      clean = clean.replace(/^(?:When you've done so|When you do so|If you do|By doing so),\s*/i, '');
    }

    // Check ", after (this|that|the) effect resolves, " within sentence
    const afterMatch = clean.match(/^(.*?),\s*after (?:this|that|the) effect resolves,\s*(.*)$/i);
    if (afterMatch) {
      clauses.push(buildClause(afterMatch[1], link));
      clauses.push(buildClause(afterMatch[2], 'afterResolves'));
      continue;
    }

    // Check "Or, " within sentence if not already split
    if (clean.includes('. Or, ') || clean.includes(' Or, ')) {
      const parts = clean.split(/\.?\s+Or,\s*/i);
      if (parts.length > 1) {
        clauses.push(buildClause(parts[0], link));
        for (let p = 1; p < parts.length; p++) {
          clauses.push(buildClause(parts[p], 'or'));
        }
        continue;
      }
    }

    // Check for "instead,"
    if (clean.includes('instead,')) {
      const insteadParts = clean.split(/\s*instead,\s*/i);
      if (insteadParts.length > 1) {
        // e.g. "If you control no Spirits, instead, destroy ..."
        clauses.push(buildClause(clean, link || 'instead'));
        continue;
      }
    }

    // Check for "and" connecting distinct actions: e.g. "..., and refresh this Spirit."
    const andMatch = clean.match(/^(.*),\s+and\s+([A-Za-z].*)$/i);
    if (andMatch && isDistinctAction(andMatch[2])) {
      clauses.push(buildClause(andMatch[1], link));
      clauses.push(buildClause(andMatch[2], 'also'));
      continue;
    }

    clauses.push(buildClause(clean, link));
  }

  return clauses;
}

function splitSentences(text) {
  // Protect "A.T. Field", "No.", "Mark.", "Mr.", "vs.", etc. from being split on period
  const protectedText = text
    .replace(/A\.T\.\s+Field/gi, 'AT__FIELD')
    .replace(/A\.T\./gi, 'AT__DOT')
    .replace(/No\.\s*(\d+)/gi, 'NO__$1')
    .replace(/Mark\.\s*(\d+)/gi, 'MARK__$1')
    .replace(/Mark\./gi, 'MARK__DOT')
    .replace(/Mr\.\s*/gi, 'MR__DOT ')
    .replace(/Kaburagi\s+T\./gi, 'KABURAGI__T__DOT');

  // Splits on period followed by space and capital letter or connector, avoiding abbreviations
  const result = [];
  const parts = protectedText.split(/(?<=\.)\s+(?=[A-Z0-9\[\(])/);
  for (const part of parts) {
    if (part.trim()) {
      const restored = part.trim()
        .replace(/AT__FIELD/g, 'A.T. Field')
        .replace(/AT__DOT/g, 'A.T.')
        .replace(/NO__(\d+)/g, 'No. $1')
        .replace(/MARK__(\d+)/g, 'Mark. $1')
        .replace(/MARK__DOT/g, 'Mark.')
        .replace(/MR__DOT\s*/g, 'Mr. ')
        .replace(/KABURAGI__T__DOT/g, 'Kaburagi T.');
      result.push(restored);
    }
  }
  return result.length > 0 ? result : [text];
}

function isDistinctAction(text) {
  const t = text.toLowerCase().trim();
  return (
    t.startsWith('refresh') ||
    t.startsWith('draw') ||
    t.startsWith('destroy') ||
    t.startsWith('target and attacks') ||
    t.startsWith('send ') ||
    t.startsWith('put ') ||
    t.startsWith('exhaust') ||
    t.startsWith('look at') ||
    t.startsWith('discard') ||
    t.startsWith('summon') ||
    t.startsWith('give ') ||
    t.startsWith('return ') ||
    t.startsWith('this spirit gains') ||
    t.startsWith('choose ') ||
    t.startsWith('target ') ||
    t.startsWith('add ') ||
    t.startsWith('immediately end ') ||
    t.startsWith('end the ')
  );
}

function buildClause(rawText, link = null, forceOptional = false, forceCondition = null, isCost = false) {
  let text = rawText.trim();
  if (text.endsWith('.')) text = text.slice(0, -1).trim();

  // Strip leading cosmetic "However, "
  if (/^However,\s*/i.test(text)) {
    text = text.replace(/^However,\s*/i, '').trim();
  }

  // Strip bullets, cosmetic badges and normalize typos
  text = text
    .replace(/^[█■◆•\s]+/, '')
    .replace(/\breemaining\b/gi, 'remaining')
    .replace(/\bdectop\b/gi, 'decktop')
    .replace(/\bform\s+the\s+Void\b/gi, 'from the Void')
    .trim();

  let isOptional = forceOptional || /\byou can\b|\byou may\b|\bchoose to\b/i.test(text);
  let duration = null;
  let condition = forceCondition;

  // Extract duration: "During this turn", "During this battle", "Until the End Step", "until end of turn"
  const durMatch = text.match(/(?:During this turn|During this battle|Until the End Step|until end of turn)/i);
  if (durMatch) {
    duration = durMatch[0].toUpperCase().replace(/\s+/g, '_');
    const durPrefixMatch = text.match(/^(?:During this turn|During this battle|Until end of turn|Until the End Step),?\s*(.+)$/i);
    if (durPrefixMatch && durPrefixMatch[1]) {
      text = durPrefixMatch[1].trim();
    }
  }

  // Extract condition prefix: "If you control no Spirits, ", "When your Ultimate is summoned, "
  const ifMatch = text.match(/^(If\s+[^,]+),\s*(.*)$/i) || text.match(/^(While\s+[^,]+),\s*(.*)$/i);
  if (ifMatch && !isCost) {
    // Special case: "If this Spirit can attack, it must attack." -> keep full sentence or note must attack
    if (/must attack/i.test(ifMatch[2])) {
      text = ifMatch[2].trim();
      condition = ifMatch[1].trim();
    } else {
      condition = ifMatch[1].trim();
      text = ifMatch[2].trim();
    }
    if (text.startsWith('instead,')) {
      link = 'instead';
      text = text.replace(/^instead,\s*/i, '').trim();
    }
  }

  return {
    rawText: rawText.trim(),
    cleanText: text,
    link,
    isOptional,
    isCost,
    condition,
    duration
  };
}
