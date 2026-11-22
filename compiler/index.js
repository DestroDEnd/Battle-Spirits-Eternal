/**
 * compiler/index.js
 * 
 * Main Effect Grammar Compiler for Battle Spirits Eternal.
 * Compiles raw card effect text into structured Intermediate Representation (IR).
 * 
 * Pipeline guarantees:
 * 1. AST Construction (standard clauses or override clone)
 * 2. Keyword Binding (extracts and attaches keywords to abilities)
 * 3. Consistent Post-Binding Identity Derivation:
 *    - Unconditional dual digest derivation
 *    - Scoped instance index for duplicate abilities on the same canonical card
 *    - Structured condition expressions preserved
 *    - Atomic collision registry with snapshot and rollback on error
 */

import { parseAbilityHeaders } from './header_parser.js';
import { splitClauses } from './clause_splitter.js';
import { compileClauseToOp } from './clause_patterns.js';
import { extractKeywords, bindKeywordsToAbilities } from './keyword_compiler.js';
import { getCardOverride } from './overrides/index.js';
import {
  createAbilityDescriptor,
  createAbilityDescriptorV3,
  parseConditionBlock,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  deriveSemanticAbilityIdV3,
  canonicalizeRFC8785,
  globalCollisionRegistry
} from './identity.js';

/**
 * Assigns deterministic physical and semantic identities to a card's ability array.
 * 
 * Executes consistently AFTER all execution-relevant compilation and keyword binding.
 * Guarantees atomic registry rollback if any error occurs during derivation.
 * 
 * @param {string} cardNumber
 * @param {Array<object>} abilities
 */
export function assignDeterministicAbilityIdentities(cardNumber, abilities = []) {
  if (!Array.isArray(abilities) || abilities.length === 0) return;

  const registrySnapshot = globalCollisionRegistry.snapshot();
  const descriptorCounts = new Map();

  try {
    for (let idx = 0; idx < abilities.length; idx++) {
      const ab = abilities[idx];
      const descriptor = createAbilityDescriptor(ab);
      const canonicalJson = canonicalizeRFC8785(descriptor);

      // Track occurrence count of this exact descriptor on this canonical card
      const instanceIndex = (descriptorCounts.get(canonicalJson) || 0) + 1;
      descriptorCounts.set(canonicalJson, instanceIndex);

      const physicalId = derivePhysicalAbilityId(cardNumber, descriptor, instanceIndex);
      const semanticId = deriveSemanticAbilityId(descriptor);
      const descriptorV3 = createAbilityDescriptorV3(ab);
      const semanticIdV3 = deriveSemanticAbilityIdV3(descriptorV3);

      globalCollisionRegistry.register(physicalId, descriptor, cardNumber);

      const previousId = ab.id || ab.legacyId || `${cardNumber}#a${idx}`;
      ab.legacyId = previousId;
      ab.id = physicalId;
      ab.physicalId = physicalId;
      ab.semanticId = semanticId;
      ab.semanticIdV3 = semanticIdV3;
      ab.timingSemantics = {
        timingOwner: descriptorV3.timingOwner,
        timingCause: descriptorV3.timingCause,
        timingTriggers: descriptorV3.timingTriggers,
        activationRestrictions: descriptorV3.activationRestrictions,
        hasEmbeddedTimingLabelText: descriptorV3.hasEmbeddedTimingLabelText
      };

      // Sync bound keywords to match deterministic physical ID
      if (Array.isArray(ab.keywords)) {
        for (const kw of ab.keywords) {
          kw.abilityId = physicalId;
          kw.legacyAbilityId = previousId;
        }
      }
    }
  } catch (err) {
    // Atomic rollback to eliminate stale registry state upon compilation error
    globalCollisionRegistry.rollbackTo(registrySnapshot);
    throw err;
  }
}

export function compileCard(card) {
  if (!card) return null;

  const cardNumber = card.card_number || card.cardNumber || card.id || 'UNKNOWN';
  const name = card.name || 'Unknown';
  const rawEffect = card.effect || card.raw_effect || card.rawEffect || '';

  // Consult explicit deterministic IR overrides before regex fallback
  if (!card.skipOverride) {
    const override = getCardOverride(cardNumber, card);
    if (override) {
      const cleanBodies = (override.abilities || []).map(a => (a.header?.cleanBody || '').toLowerCase().trim()).filter(Boolean);
      const rawLower = rawEffect.toLowerCase();
      const matchesOverride = !rawEffect || cleanBodies.length === 0 || cleanBodies.some(cb => rawLower.includes(cb.slice(0, 15)) || cb.includes(rawLower.replace(/\[lv\d+\]|\([^)]+\)/gi, '').trim().slice(0, 15)));
      if (matchesOverride) {
        const cloned = JSON.parse(JSON.stringify(override));
        if (cloned.abilities && cloned.abilities.length > 0) {
          // Step 1: Bind keywords to abilities
          cloned.keywords = bindKeywordsToAbilities(cloned, rawEffect, cloned.abilities);
          // Step 2: Assign deterministic identities post-binding
          assignDeterministicAbilityIdentities(cardNumber, cloned.abilities);
        }
        return cloned;
      }
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
  const cardTeams = [];
  let totalCompiled = 0;
  let totalUnsupported = 0;

  for (let idx = 0; idx < rawBlocks.length; idx++) {
    const blockText = rawBlocks[idx];
    const teamOnlyMatch = blockText.trim().match(/^\[teams?:\s*([^\]]+)\]\s*$/i);
    if (teamOnlyMatch) {
      const teamName = teamOnlyMatch[1].trim();
      cardTeams.push(teamName);
      abilities.push({
        type: 'TEAM_RESTRICTION',
        teams: [teamName],
        header: parseAbilityHeaders(blockText),
        rawText: blockText,
        originalAbilityText: blockText,
        abilityIndex: idx,
        clauses: [],
        unsupported: [],
        legacyId: `${cardNumber}#a${idx}`
      });
      continue;
    }
    const header = parseAbilityHeaders(blockText);
    const abilityId = `${cardNumber}#a${idx}`;

    // If block is solely a summon condition, brave condition, or reminder text without actions
    const trimmedBlock = blockText.trim();
    if (/^\[(?:Summon|Brave)\s+Condition:/i.test(trimmedBlock) || /^\[SuAdcon:/i.test(trimmedBlock) || /^\[\+\d+\]\s*$/i.test(trimmedBlock)) {
      const normalizedCondText = header?.keyword && /^Brave\s+Condition:/i.test(header.keyword)
        ? `[${header.keyword}]`
        : trimmedBlock;
      const conditionObj = {
        type: 'CONDITION',
        header,
        rawText: blockText,
        originalAbilityText: blockText,
        abilityIndex: idx,
        condition: parseConditionBlock(normalizedCondText),
        clauses: [],
        unsupported: [],
        legacyId: abilityId
      };
      abilities.push(conditionObj);
      continue;
    }

    const clauses = splitClauses(header.cleanBody);
    const compiledClauses = [];
    const unsupported = [];

    for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
      const c = clauses[cIdx];
      const op = compileClauseToOp(c);
      const clauseEntry = {
        rawText: c.rawText,
        originalClauseText: c.rawText,
        cleanText: c.cleanText,
        clauseIndex: cIdx,
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

    const abilityObj = {
      type: 'ABILITY',
      header,
      originalAbilityText: blockText,
      abilityIndex: idx,
      clauses: compiledClauses,
      unsupported,
      legacyId: abilityId
    };

    abilities.push(abilityObj);
  }

  // Step 1: Bind keywords to all abilities
  const boundKeywords = bindKeywordsToAbilities(card, rawEffect, abilities);

  // Step 2: Assign deterministic identities post-binding across all abilities
  assignDeterministicAbilityIdentities(cardNumber, abilities);

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
    originalEffectText: rawEffect,
    teams: cardTeams,
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
