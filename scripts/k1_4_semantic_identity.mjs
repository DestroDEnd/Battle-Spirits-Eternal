import crypto from 'node:crypto';
import { canonicalizeIrValue } from './discover_k1_1_mechanics.mjs';
import { extractSourceTimingSemantics } from './audit_k1_3_3_methodology.mjs';

/**
 * Work Package K.1.4 — Property-Complete Semantic Signature (V3).
 * Resolves all 34 opponent-only / timing-qualifier collisions by including
 * normalized timingCause, timingOwner, timingTriggers, activationRestrictions,
 * and embeddedExecutableTextFlag without adding opaque raw timingLabel text.
 */
export function buildExactSemanticSignatureV3(ability) {
  const header = ability?.header || {};
  const extracted = extractSourceTimingSemantics(ability);

  const timingCause = header.timingCause || extracted.triggerCause || null;
  const timingOwner = header.timingOwner || extracted.turnOwner || null;
  const timingTriggers = Array.isArray(header.timingTriggers) && header.timingTriggers.length > 0
    ? header.timingTriggers
    : (extracted.multipleTriggerEvents.length > 1 ? extracted.multipleTriggerEvents : []);
  const activationRestrictions = Array.isArray(header.activationRestrictions) && header.activationRestrictions.length > 0
    ? header.activationRestrictions
    : (extracted.originalCostRestriction ? ['PAID_ORIGINAL_COST'] : []);

  const semanticHeaderObj = {
    timing: String(header.timing || 'PASSIVE').toUpperCase(),
    timings: Array.isArray(header.timings) ? header.timings : [],
    timingStep: header.timingStep || 'ANY',
    levels: Array.isArray(header.levels) ? header.levels : [],
    levelExplicit: Boolean(header.levelExplicit),
    prefixes: Array.isArray(header.prefixes) ? header.prefixes : [],
    limit: header.limit || null,
    limitCount: header.limitCount ?? null,
    cantStack: Boolean(header.cantStack),
    isOptional: Boolean(header.isOptional),
    isFlash: Boolean(header.isFlash),
    isMain: Boolean(header.isMain),
    keyword: header.keyword || null,
    burstCondition: header.burstCondition || null,
    condition: header.condition ?? null,
  };

  if (timingCause) semanticHeaderObj.timingCause = timingCause;
  if (timingOwner) semanticHeaderObj.timingOwner = timingOwner;
  if (timingTriggers.length > 0) semanticHeaderObj.timingTriggers = timingTriggers;
  if (activationRestrictions.length > 0) semanticHeaderObj.activationRestrictions = activationRestrictions;
  if (extracted.embeddedExecutableText) semanticHeaderObj.hasEmbeddedTimingLabelText = true;

  const semanticHeader = canonicalizeIrValue(semanticHeaderObj);

  const clauses = (ability?.clauses || []).map(cl => ({
    condition: cl?.condition ?? null,
    isOptional: Boolean(cl?.isOptional),
    targetCount: cl?.targetCount ?? null,
    op: canonicalizeIrValue(cl?.op || {}),
  }));

  const signature = {
    type: ability?.type || 'ABILITY',
    header: semanticHeader,
    clauses,
  };
  const serialized = JSON.stringify(signature);
  const semanticPatternId = 'K14-SEM-' + crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  return { semanticPatternId, signature };
}
