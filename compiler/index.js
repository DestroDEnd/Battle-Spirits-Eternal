/**
 * compiler/index.js
 * 
 * Main Effect Grammar Compiler for Battle Spirits Eternal.
 * Compiles raw card effect text into structured Intermediate Representation (IR).
 */

import { parseAbilityHeaders } from './header_parser.js';
import { splitClauses } from './clause_splitter.js';
import { compileClauseToOp } from './clause_patterns.js';
import { extractKeywords, bindKeywordsToAbilities } from './keyword_compiler.js';
import { getCardOverride } from './overrides/index.js';

export function compileCard(card) {
  if (!card) return null;

  const cardNumber = card.card_number || card.cardNumber || card.id || 'UNKNOWN';
  const name = card.name || 'Unknown';
  const rawEffect = card.effect || card.raw_effect || card.rawEffect || '';

  // Consult explicit deterministic IR overrides before regex fallback
  if (!card.skipOverride) {
    const override = getCardOverride(cardNumber, card);
    if (override) {
      const cloned = JSON.parse(JSON.stringify(override));
      if (cloned.abilities && cloned.abilities.length > 0) {
        cloned.keywords = bindKeywordsToAbilities(cloned, rawEffect, cloned.abilities);
      }
      return cloned;
    }
  }

  if (!rawEffect.trim()) {
    return {
      cardNumber,
      name,
      keywords: [],
      abilities: [],
      compiledClausesCount: 0,
      unsupportedClausesCount: 0,
      isFullySupported: true
    };
  }

  // Split effect text into distinct ability blocks.
  // Ability blocks in Battle Spirits are separated by double newlines or clear headers.
  const rawBlocks = splitAbilityBlocks(rawEffect);

  const abilities = [];
  let totalCompiled = 0;
  let totalUnsupported = 0;

  for (let idx = 0; idx < rawBlocks.length; idx++) {
    const blockText = rawBlocks[idx];
    const header = parseAbilityHeaders(blockText);
    const abilityId = `${cardNumber}#a${idx}`;

    // If block is solely a summon condition or reminder text without actions
    if (/^\[(?:Summon|Brave)\s+Condition:/i.test(blockText) || /^\[SuAdcon:/i.test(blockText) || /^\[\+\d+\]\s*$/i.test(blockText.trim())) {
      abilities.push({
        id: abilityId,
        type: 'CONDITION',
        header,
        rawText: blockText,
        clauses: [],
        unsupported: []
      });
      continue;
    }

    const clauses = splitClauses(header.cleanBody);
    const compiledClauses = [];
    const unsupported = [];

    for (const c of clauses) {
      const op = compileClauseToOp(c);
      const clauseEntry = {
        rawText: c.rawText,
        cleanText: c.cleanText,
        link: c.link,
        isOptional: c.isOptional,
        isCost: c.isCost,
        condition: c.condition,
        duration: c.duration,
        op
      };

      if (!op || op.op === 'UNSUPPORTED') {
        unsupported.push(c.rawText);
        totalUnsupported++;
      } else {
        totalCompiled++;
      }

      compiledClauses.push(clauseEntry);
    }

    abilities.push({
      id: abilityId,
      type: 'ABILITY',
      header,
      clauses: compiledClauses,
      unsupported
    });
  }

  const boundKeywords = bindKeywordsToAbilities(card, rawEffect, abilities);
  const isFullySupported = totalUnsupported === 0;

  return {
    cardNumber,
    name,
    type: card.type,
    color: card.color,
    colors: card.colors,
    cost: card.cost,
    symbols: card.symbols,
    reduction: card.reduction,
    levels: card.levels,
    face: card.face,
    keywords: boundKeywords,
    abilities,
    compiledClausesCount: totalCompiled,
    unsupportedClausesCount: totalUnsupported,
    isFullySupported
  };
}

function splitAbilityBlocks(effectText) {
  // Normalize line breaks
  let normalized = effectText.replace(/\r\n/g, '\n').trim();
  normalized = normalized.replace(/\{LV(\d+)\]/gi, '[LV$1]');

  // Split by double newlines OR single newlines preceding ability headers / parenthesized timing tags
  const headerSplitRegex = /\n{2,}|\n+(?=\d+\s+\[LV\d+\]|Striker\s+Pack\b|Silhouette\s+System\b|\[(?:LV\d+|During|When|Flash|Main|Burst|Soul\s+Burst|Contract|Soul State|Grand|Summon Condition|SuAdcon|Rebirth|Mirage|Supremacy|Show Up|Assemble)|\((?:When|During|Your|Opposing|Opponent's|Either|Flash|Main|Start|Core|Draw|Refresh|Attack|End|Permanent)\)|Flash\s*[-–]|Main\s*[-–]|Legacy\b|◆)/gi;
  const paragraphs = normalized.split(headerSplitRegex).map(p => p.trim()).filter(Boolean);

  const blocks = [];

  for (const para of paragraphs) {
    // If multiple abilities are within a single paragraph separated by sentence end before a header
    // e.g. "some effect text. [LV2] ..."
    const subMatches = para.split(/(?<=\.)\s+(?=\[(?:LV\d+|During|Flash|Main|Burst|Soul\s+Burst))/g);
    for (const sub of subMatches) {
      const trimmed = sub.trim();
      if (trimmed) {
        if (/^Legacy$/i.test(trimmed)) continue;
        blocks.push(trimmed);
      }
    }
  }

  return blocks.length > 0 ? blocks : [normalized];
}
