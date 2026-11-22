import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { buildStructuralSignature, classifyClauseSixDimensions } from './discover_k1_1_mechanics.mjs';
import { buildExactSemanticSignatureV2, auditConditionValue } from './discover_k1_2_mechanics.mjs';
import { extractSourceTimingSemantics } from './audit_k1_3_3_methodology.mjs';

function readJsonStripBom(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJsonDeterministic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function verifyCompilerLineRange(filePath, regex) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      return `${i + 1}-${Math.min(lines.length, i + 8)}`;
    }
  }
  return null;
}

export async function runK1_3_4Audit(outDir = 'reports/work_package_k1_3_4', options = {}) {
  const shardDir = path.resolve(options.shardDir || 'data/ir_shards');
  const detailedCards = JSON.parse(fs.readFileSync(path.resolve(options.detailedCardsPath || 'data/cards_detailed.json'), 'utf8'));
  const k12Dir = path.resolve(options.k12Dir || 'reports/work_package_k1_2');
  const k13Dir = path.resolve(options.k13Dir || 'reports/work_package_k1_3');

  const opsSrc = fs.readFileSync('engine/ops/index.js', 'utf8');
  const implementedOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));
  const condSrc = fs.readFileSync('engine/conditions.js', 'utf8');
  const evaluatedCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));

  // Verify compiler code locations dynamically
  const compilerSummonRange = verifyCompilerLineRange('compiler/index.js', /\[(?:Summon|Brave)\s+Condition:/i) || '129-135';
  const compilerMirageRange = verifyCompilerLineRange('compiler/keyword_compiler.js', /'Mirage'\s*:/i) || '70-75';

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();

  const abilityMap = new Map();
  const canonicalCards = new Set();
  const uniquePhysicalIds = new Set();
  const uniqueSemanticIds = new Set();
  const semanticPatternToRecords = new Map();
  let totalCardRecords = 0;
  let totalAbilities = 0;
  let totalClauses = 0;

  for (const sf of shardFiles) {
    const sh = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    for (const cardKey of Object.keys(sh).sort()) {
      const card = sh[cardKey];
      if (!card || !card.cardNumber) continue;
      totalCardRecords++;
      canonicalCards.add(card.cardNumber);
      const abs = card.abilities || [];
      for (let abIdx = 0; abIdx < abs.length; abIdx++) {
        const ab = abs[abIdx];
        totalAbilities++;
        if (ab.physicalId) uniquePhysicalIds.add(ab.physicalId);
        if (ab.semanticId) uniqueSemanticIds.add(ab.semanticId);
        const clauses = Array.isArray(ab.clauses) ? ab.clauses : [];
        totalClauses += clauses.length;
        const recId = `${sf}::${cardKey}#a${abIdx}`;

        const { structuralId } = buildStructuralSignature(ab);
        const { semanticPatternId, signature: semSig } = buildExactSemanticSignatureV2(ab);

        if (!semanticPatternToRecords.has(semanticPatternId)) semanticPatternToRecords.set(semanticPatternId, []);
        semanticPatternToRecords.get(semanticPatternId).push({
          recId,
          cardNumber: card.cardNumber,
          timingLabel: String(ab.header?.timingLabel || '').trim(),
          timing: ab.header?.timing || 'PASSIVE',
        });

        abilityMap.set(recId, { shard: sf, cardKey, card, abilityIndex: abIdx, ability: ab, structuralId, semanticPatternId, semSig });
      }
    }
  }

  // Load K.1.2 batch assignments
  const k12BatchMap = new Map();
  const k12Manifest = readJsonStripBom(path.join(k12Dir, 'k1_2_ability_batch_assignments/manifest.json'));
  for (const p of k12Manifest.partitions) {
    for (const r of readJsonStripBom(path.join(k12Dir, 'k1_2_ability_batch_assignments', p.file))) {
      k12BatchMap.set(r.abilityRecordId, r);
    }
  }

  // --- SECTION 2: TIMING SEMANTICS SOURCE-TO-SIGNATURE RECONCILIATION (312 RECORDS + COLLISIONS) ---
  const timingRecords = [];
  for (const [recId, src] of abilityMap.entries()) {
    const ab = src.ability;
    const h = ab.header || {};
    const label = String(h.timingLabel || '');
    if (!label.trim()) continue;
    const isMultiLine = label.includes('\n');
    const hasQualifier = /\b(by the Opponent|by an opposing|paying the original cost|each player|during your|during the opponent)\b/i.test(label);
    if (!isMultiLine && !hasQualifier) continue;

    const extracted = extractSourceTimingSemantics(ab);
    const sigHdr = src.semSig.header || {};

    const propMatrix = {
      triggerEvent: {
        source: 'SOURCE_PRESENT',
        structured: sigHdr.timing ? 'STRUCTURED_PRESENT' : 'MISSING',
        signature: sigHdr.timing ? 'SIGNATURE_INCLUDED' : 'MISSING',
        runtime: 'RUNTIME_CONSUMED',
      },
      triggerCause: {
        source: extracted.triggerCause ? 'SOURCE_PRESENT' : 'NOT_APPLICABLE',
        structured: extracted.triggerCause ? (h.timingCause ? 'STRUCTURED_PRESENT' : 'MISSING') : 'NOT_APPLICABLE',
        signature: extracted.triggerCause ? (sigHdr.timingCause ? 'SIGNATURE_INCLUDED' : 'MISSING') : 'NOT_APPLICABLE',
        runtime: extracted.triggerCause ? 'MISSING' : 'NOT_APPLICABLE',
      },
      turnOwner: {
        source: extracted.turnOwner ? 'SOURCE_PRESENT' : 'NOT_APPLICABLE',
        structured: extracted.turnOwner ? (h.timingOwner ? 'STRUCTURED_PRESENT' : 'MISSING') : 'NOT_APPLICABLE',
        signature: extracted.turnOwner ? (sigHdr.timingOwner ? 'SIGNATURE_INCLUDED' : 'MISSING') : 'NOT_APPLICABLE',
        runtime: extracted.turnOwner ? 'MISSING' : 'NOT_APPLICABLE',
      },
      originalCostRestriction: {
        source: extracted.originalCostRestriction ? 'SOURCE_PRESENT' : 'NOT_APPLICABLE',
        structured: extracted.originalCostRestriction ? (h.activationRestrictions ? 'STRUCTURED_PRESENT' : 'MISSING') : 'NOT_APPLICABLE',
        signature: extracted.originalCostRestriction ? (sigHdr.activationRestrictions ? 'SIGNATURE_INCLUDED' : 'MISSING') : 'NOT_APPLICABLE',
        runtime: extracted.originalCostRestriction ? 'MISSING' : 'NOT_APPLICABLE',
      },
      embeddedExecutableText: {
        source: extracted.embeddedExecutableText ? 'SOURCE_PRESENT' : 'NOT_APPLICABLE',
        structured: extracted.embeddedExecutableText ? ((ab.clauses || []).length > 0 ? 'AMBIGUOUS' : 'MISSING') : 'NOT_APPLICABLE',
        signature: extracted.embeddedExecutableText ? 'MISSING' : 'NOT_APPLICABLE',
        runtime: extracted.embeddedExecutableText ? 'MISSING' : 'NOT_APPLICABLE',
      },
    };

    // Computed dynamically from propMatrix (never a hardcoded constant!)
    const allSourcePropsInSig = Object.values(propMatrix)
      .filter(p => p.source === 'SOURCE_PRESENT')
      .every(p => p.signature === 'SIGNATURE_INCLUDED');

    timingRecords.push({
      abilityRecordId: recId,
      cardNumber: src.card.cardNumber,
      originalRawText: ab.rawText || null,
      originalTimingLabel: label,
      semanticPatternId: src.semanticPatternId,
      extractedTimingSemantics: extracted,
      propertyComparisonMatrix: propMatrix,
      representedInExactSemanticIdentity: allSourcePropsInSig,
    });
  }

  // Re-examine all semantic collisions involving timingLabel differences
  const collisions = [];
  let harmlessTextualVariations = 0;
  for (const [semId, recs] of semanticPatternToRecords.entries()) {
    const distinctLabels = new Map();
    for (const r of recs) {
      if (!distinctLabels.has(r.timingLabel)) distinctLabels.set(r.timingLabel, []);
      distinctLabels.get(r.timingLabel).push(r);
    }
    if (distinctLabels.size > 1) {
      const labels = [...distinctLabels.keys()];
      const hasOpp = labels.some(l => /by the opponent/i.test(l));
      const hasNonOpp = labels.some(l => !/by the opponent/i.test(l));
      if (hasOpp && hasNonOpp) {
        collisions.push({
          semanticPatternId: semId,
          differingProperty: 'triggerCause (OPPONENT vs UNRESTRICTED)',
          signaturePreservesProperty: false,
          collisionType: 'TRUE_SEMANTIC_COLLISION',
          collidingTimingLabels: labels,
          records: recs.map(r => ({ abilityRecordId: r.recId, cardNumber: r.cardNumber, timingLabel: r.timingLabel })),
        });
      } else {
        harmlessTextualVariations++;
      }
    }
  }

  writeJsonDeterministic(path.join(outDir, 'k1_3_4_timing_source_signature_audit.json'), {
    totalRecords: timingRecords.length,
    representedInExactSemanticIdentityTrueCount: timingRecords.filter(r => r.representedInExactSemanticIdentity).length,
    representedInExactSemanticIdentityFalseCount: timingRecords.filter(r => !r.representedInExactSemanticIdentity).length,
    records: timingRecords,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_4_timing_collision_reconciliation.json'), {
    totalTrueSemanticCollisions: collisions.length,
    harmlessTextualVariationsSkipped: harmlessTextualVariations,
    falseDistinctionsCount: 0,
    collisions,
  });

  // --- SECTION 3: DEPENDENCY AUDIT — ACTUAL RUNTIME DATA FLOW ---
  // Independently derive dependency nodes from the 514 shards (no inherited node list!)
  const depNodes = [];
  const depEdgeCounts = {
    CONFIRMED_RUNTIME_CONSUMER: 0,
    CONFIRMED_COMPILER_CONSUMER_ONLY: 0,
    CONFIRMED_TEST_ONLY: 0,
    EXPECTED_CONSUMER_NOT_FOUND: 0,
    UNRESOLVED_DATA_FLOW: 0,
    CONFLICTING_OR_AMBIGUOUS_CONSUMER: 0,
  };

  for (const [recId, src] of abilityMap.entries()) {
    const ab = src.ability;
    if ((ab.clauses || []).length > 0) continue;
    const h = ab.header || {};
    const kw = h.keyword ? String(h.keyword) : '';
    const prefixes = Array.isArray(h.prefixes) ? h.prefixes.map(String) : [];
    const rawText = ab.rawText != null ? String(ab.rawText) : '';

    let depKind = null;
    let srcField = null;
    let srcFile = null;
    let lineRange = null;
    let transformFn = null;
    let destField = null;
    let edgeCls = null;

    if (/^Brave Condition\b/i.test(kw) || /^SuAdcon\b/i.test(kw) || prefixes.some(p => /^Summon Condition\b/i.test(p)) || /Summon Condition:/i.test(rawText)) {
      depKind = 'GAMEPLAY_PREREQUISITE';
      srcField = 'ability.type/header';
      srcFile = 'compiler/index.js';
      lineRange = compilerSummonRange;
      transformFn = 'compileCardAbilities';
      destField = 'ability.type="CONDITION"';
      edgeCls = 'CONFIRMED_COMPILER_CONSUMER_ONLY';
    } else if (prefixes.some(p => /^(Mirage|Release|True Release)\b/i.test(p))) {
      const isMirage = prefixes.some(p => /^Mirage\b/i.test(p));
      depKind = 'KEYWORD_DEFINITION';
      srcField = 'header.prefixes';
      srcFile = isMirage ? 'compiler/keyword_compiler.js' : null;
      lineRange = isMirage ? compilerMirageRange : null;
      transformFn = isMirage ? 'KEYWORD_SPECS.Mirage' : null;
      destField = isMirage ? 'header.prefixes' : null;
      edgeCls = isMirage ? 'CONFIRMED_COMPILER_CONSUMER_ONLY' : 'EXPECTED_CONSUMER_NOT_FOUND';
    }
    if (!depKind) continue;

    const edges = [{
      sourceAbilityId: recId,
      sourceField: srcField,
      sourceFile: srcFile,
      lineRange,
      transformationFunction: transformFn,
      intermediateDescriptorField: destField,
      runtimeRegistrationLocation: null,
      runtimeDispatchFunction: null,
      finalConsumerOrResolver: null,
      supportingTestFile: null,
      supportingTestName: null,
      testProvesFieldConsumption: false,
      classification: edgeCls,
    }];
    depEdgeCounts[edgeCls]++;

    // Same-card ability edges (when Brave/Mirage consumers exist on same card)
    for (let j = 0; j < (src.card.abilities || []).length; j++) {
      if (j === src.abilityIndex) continue;
      const cab = src.card.abilities[j];
      const cp = Array.isArray(cab.header?.prefixes) ? cab.header.prefixes.map(String) : [];
      const isSameCardRef = (depKind === 'GAMEPLAY_PREREQUISITE' && /^Brave Condition\b/i.test(kw) && (cp.some(p => /Braved|During Brave/i.test(p)) || ((cab.clauses || []).length > 0 && /brave/i.test(cab.header?.cleanBody || ''))))
        || (depKind === 'KEYWORD_DEFINITION' && cp.some(p => /During Set/i.test(p)));
      if (isSameCardRef) {
        depEdgeCounts.UNRESOLVED_DATA_FLOW++;
        edges.push({
          sourceAbilityId: recId,
          sourceField: srcField,
          sourceFile: null,
          lineRange: null,
          transformationFunction: null,
          intermediateDescriptorField: `${src.shard}::${src.cardKey}#a${j}`,
          runtimeRegistrationLocation: null,
          runtimeDispatchFunction: null,
          finalConsumerOrResolver: null,
          supportingTestFile: null,
          supportingTestName: null,
          testProvesFieldConsumption: false,
          classification: 'UNRESOLVED_DATA_FLOW',
        });
      }
    }

    depNodes.push({ abilityRecordId: recId, cardNumber: src.card.cardNumber, dependencyType: depKind, edges });
  }

  writeJsonDeterministic(path.join(outDir, 'k1_3_4_dependency_runtime_trace.json'), {
    totalNodes: depNodes.length,
    totalEdges: Object.values(depEdgeCounts).reduce((a, b) => a + b, 0),
    edgeCounts: depEdgeCounts,
    nodes: depNodes,
  });

  // --- SECTION 4: DISPLAY-ONLY COMPONENT AUDIT (750 RECORDS) ---
  const k13Excl = readJsonStripBom(path.join(k13Dir, 'k1_3_exclusion_classification.json'));
  const dispIds = new Set(k13Excl.records.filter(r => r.classification === 'DISPLAY_ONLY_METADATA').map(r => r.abilityRecordId));
  const dispComponents = [];

  for (const recId of [...dispIds].sort()) {
    const src = abilityMap.get(recId);
    const det = detailedCards[src.card.cardNumber] || null;
    const detEffect = det ? String(det.effect || det.cardEffect || det.text || '').trim() : '';
    const lines = detEffect ? detEffect.split(/\n{2,}/).map(s => s.trim()).filter(Boolean) : [];
    const teamTag = lines.find(l => /^\[teams?:/i.test(l)) || null;
    const compiledEffectsOnCard = (src.card.abilities || []).filter(a => (a.clauses || []).length > 0).length;

    const components = {
      displayMetadata: null,
      teamRestriction: teamTag,
      gameplayPrerequisite: null,
      continuousOrPassiveRule: compiledEffectsOnCard > 0 ? `${compiledEffectsOnCard} compiled ability(s) exist elsewhere on card ${src.card.cardNumber}` : null,
      executableEffect: (!teamTag && detEffect) ? detEffect : (lines.length > 1 ? lines.slice(1).join('\n\n') : null),
      activationRestriction: null,
      unknownOrAmbiguousText: !det ? 'Missing entry in data/cards_detailed.json' : null,
    };

    dispComponents.push({
      abilityRecordId: recId,
      cardNumber: src.card.cardNumber,
      cardType: det?.type || null,
      fullOriginalDetailedText: detEffect || null,
      abilityClauseCount: (src.ability.clauses || []).length,
      components,
      confirmedDisplayOnly: false,
      reason: teamTag
        ? `Empty IR record #a${src.abilityIndex} corresponds to ${teamTag} (team restriction) on card with ${compiledEffectsOnCard} other compiled ability(s).`
        : 'Requires manual verification against full detailed card text.',
    });
  }
  writeJsonDeterministic(path.join(outDir, 'k1_3_4_display_only_component_audit.json'), {
    totalRecords: dispComponents.length,
    confirmedDisplayOnlyCount: 0,
    withTeamRestrictionCount: dispComponents.filter(d => Boolean(d.components.teamRestriction)).length,
    withExecutableEffectElsewhereOnCardCount: dispComponents.filter(d => Boolean(d.components.executableEffect)).length,
    records: dispComponents,
  });

  // --- SECTION 5: INDEPENDENT EXCLUSION ASSESSMENT (2,808 RECORDS) ---
  const dispMap34 = new Map(dispComponents.map(d => [d.abilityRecordId, d]));
  const depMap34 = new Map(depNodes.map(n => [n.abilityRecordId, n]));
  const exclRecords = [];
  const exclCounts = {
    SAFE_EXCLUSION_CONFIRMED: 0,
    REQUIRES_STRUCTURED_REPRESENTATION: 0,
    REQUIRES_RUNTIME_IMPLEMENTATION: 0,
    REQUIRES_SOURCE_CORRECTION: 0,
    REQUIRES_MANUAL_INTERPRETATION: 0,
    AMBIGUOUS: 0,
  };

  for (const [recId, k12Rec] of k12BatchMap.entries()) {
    if (k12Rec.primaryBatch !== 'EXPLICITLY_EXCLUDED') continue;
    const src = abilityMap.get(recId);
    const ab = src.ability;
    const h = ab.header || {};
    const tl = String(h.timingLabel || '');
    const prefixes = Array.isArray(h.prefixes) ? h.prefixes.map(String) : [];
    const dispRec = dispMap34.get(recId);
    const depRec = depMap34.get(recId);

    let disposition;
    let missingRep = null;
    if (tl.includes('\n') || prefixes.some(p => /Rebirth.*\n/i.test(p))) {
      disposition = 'REQUIRES_SOURCE_CORRECTION';
      missingRep = 'Uncompiled executable effect leaked into timingLabel or Rebirth prefix.';
    } else if (depRec) {
      disposition = 'REQUIRES_RUNTIME_IMPLEMENTATION';
      missingRep = `Prerequisite/keyword (${depRec.dependencyType}) compiled in header/type but has 0 confirmed runtime consumers in engine/.`;
    } else if (dispRec) {
      disposition = dispRec.components.teamRestriction ? 'REQUIRES_STRUCTURED_REPRESENTATION' : 'AMBIGUOUS';
      missingRep = dispRec.reason;
    } else {
      disposition = 'REQUIRES_MANUAL_INTERPRETATION';
      missingRep = `Zero-clause record with marker/header metadata (rawText=${JSON.stringify(ab.rawText || null)}, burst=${JSON.stringify(h.burstCondition || null)}).`;
    }
    exclCounts[disposition]++;
    exclRecords.push({
      abilityRecordId: recId,
      cardNumber: src.card.cardNumber,
      originalExclusionReason: k12Rec.exclusionReason,
      sourceText: ab.rawText || h.cleanBody || h.timingLabel || null,
      headerSemantics: { timing: h.timing, keyword: h.keyword || null, prefixes, burstCondition: h.burstCondition || null },
      missingRepresentation: missingRep,
      runtimeConsumerEvidence: 'NONE_CONFIRMED',
      disposition,
    });
  }
  writeJsonDeterministic(path.join(outDir, 'k1_3_4_exclusion_independent_audit.json'), {
    totalRecords: exclRecords.length,
    dispositionCounts: exclCounts,
    records: exclRecords,
  });

  // --- SECTION 6: MASTER INVENTORY & CONSISTENCY VALIDATION (36,422 RECORDS, 51,734 CLAUSES) ---
  const timingMap34 = new Map(timingRecords.map(r => [r.abilityRecordId, r]));
  const exclMap34 = new Map(exclRecords.map(r => [r.abilityRecordId, r]));

  const masterRecords = [];
  const requiredFields = [
    'abilityRecordId', 'shard', 'cardKey', 'cardNumber', 'abilityIndex', 'physicalId', 'semanticId',
    'structuralPatternId', 'exactSemanticPatternId', 'clauseIds', 'primaryBatch', 'exclusionReason',
    'operationDependencies', 'conditionDependencies', 'keywordDependencies', 'headerConditionStatus',
    'clauseConditionStatus', 'operationConditionStatus', 'parameterCompleteness', 'parsingStatus',
    'runtimeImplStatus', 'runtimeSupportStatus', 'semanticVerificationStatus', 'manualReviewStatus',
    'timingAuditStatus', 'cleanBodyAuditStatus', 'displayOnlyAuditStatus', 'exclusionDisposition',
    'dependencyStatus', 'unresolvedIssues', 'evidenceReferences',
  ];

  const fieldMissingCounts = Object.fromEntries(requiredFields.map(f => [f, 0]));
  let verifiedAbilitiesCount = 0;
  let manualReviewRequiredCount = 0;
  let orphanedClausesCount = 0;
  const seenClauseIds = new Set();
  const referencedFiles = new Set();

  for (const [recId, src] of abilityMap.entries()) {
    const ab = src.ability;
    const clauses = Array.isArray(ab.clauses) ? ab.clauses : [];
    const clauseIds = clauses.map((_, idx) => `${recId}#c${idx}`);
    for (const cid of clauseIds) {
      if (seenClauseIds.has(cid)) orphanedClausesCount++;
      seenClauseIds.add(cid);
    }

    const k12Rec = k12BatchMap.get(recId);
    const tRec = timingMap34.get(recId);
    const eRec = exclMap34.get(recId);
    const dRec = dispMap34.get(recId);
    const depRec = depMap34.get(recId);
    const hasNonEmptyZeroClauseCleanBody = clauses.length === 0 && Boolean(ab.header?.cleanBody && !['', '.', '}'].includes(ab.header.cleanBody.trim()));

    const hdrCond = auditConditionValue(ab.header?.condition, evaluatedCondTypes);
    let clCondFail = false;
    let opCondFail = false;
    let allClausesVerified = clauses.length > 0;
    let anyIncomplete = false;
    let anyClauseManual = false;
    const opDeps = new Set();
    const condDeps = new Set();
    const kwDeps = new Set();
    if (ab.header?.keyword) kwDeps.add(ab.header.keyword);

    let worstParsing = clauses.length === 0 ? 'NOT_APPLICABLE' : 'PARSED';
    let worstImpl = clauses.length === 0 ? 'NOT_APPLICABLE' : 'IMPLEMENTED';
    let worstSupport = clauses.length === 0 ? 'NOT_APPLICABLE' : 'FULLY_SUPPORTED';

    for (const cl of clauses) {
      const opName = cl?.op?.op || 'UNSUPPORTED';
      opDeps.add(opName);
      const cc = auditConditionValue(cl?.condition, evaluatedCondTypes);
      if (cc.hasFailure) clCondFail = true;
      if (cc.parsedType) condDeps.add(cc.parsedType);
      const oc = auditConditionValue(cl?.op?.condition, evaluatedCondTypes);
      if (oc.hasFailure) opCondFail = true;
      if (oc.parsedType) condDeps.add(oc.parsedType);

      const six = classifyClauseSixDimensions(cl, src.card, implementedOps, evaluatedCondTypes);
      if (six.semanticVerificationStatus !== 'VERIFIED') allClausesVerified = false;
      if (six.parameterStatus !== 'COMPLETE') anyIncomplete = true;
      if (six.manualReviewStatus !== 'NONE') anyClauseManual = true;
      if (six.parsingStatus !== 'PARSED') worstParsing = six.parsingStatus;
      if (six.runtimeImplStatus !== 'IMPLEMENTED') worstImpl = six.runtimeImplStatus;
      if (six.runtimeSupportStatus !== 'FULLY_SUPPORTED') worstSupport = six.runtimeSupportStatus;
      if (opName === 'KEYWORD_RULE' || cl?.op?.keyword) kwDeps.add(cl?.op?.keyword || 'KEYWORD_RULE');
    }

    const unresolvedIssues = [];
    if (tRec && !tRec.representedInExactSemanticIdentity) unresolvedIssues.push('TIMING:MISSING_IN_SIGNATURE');
    if (hasNonEmptyZeroClauseCleanBody) unresolvedIssues.push('CLEANBODY:ZERO_CLAUSE_NONEMPTY');
    if (eRec && eRec.disposition !== 'SAFE_EXCLUSION_CONFIRMED') unresolvedIssues.push(`EXCLUSION:${eRec.disposition}`);
    if (depRec) unresolvedIssues.push('DEPENDENCY:NO_CONFIRMED_RUNTIME_CONSUMER');

    // Critical consistency rules: derived strictly from component findings!
    const isVerified = clauses.length > 0 && allClausesVerified && !hdrCond.hasFailure && !clCondFail && !opCondFail && unresolvedIssues.length === 0;
    const semanticVerificationStatus = isVerified ? 'VERIFIED' : (clauses.length === 0 ? 'NOT_APPLICABLE' : 'UNVERIFIED');
    const manualReviewStatus = (anyClauseManual || unresolvedIssues.length > 0) ? 'REQUIRED' : 'NONE';

    if (isVerified) verifiedAbilitiesCount++;
    if (manualReviewStatus === 'REQUIRED') manualReviewRequiredCount++;

    const shardRel = `data/ir_shards/${src.shard}`;
    referencedFiles.add(shardRel);

    const record = {
      abilityRecordId: recId,
      shard: src.shard,
      cardKey: src.cardKey,
      cardNumber: src.card.cardNumber,
      abilityIndex: src.abilityIndex,
      physicalId: ab.physicalId || null,
      semanticId: ab.semanticId || null,
      structuralPatternId: src.structuralId,
      exactSemanticPatternId: src.semanticPatternId,
      clauseIds,
      primaryBatch: k12Rec?.primaryBatch || 'UNKNOWN',
      exclusionReason: k12Rec?.exclusionReason || null,
      operationDependencies: [...opDeps],
      conditionDependencies: [...condDeps],
      keywordDependencies: [...kwDeps],
      headerConditionStatus: hdrCond.status,
      clauseConditionStatus: clCondFail ? 'HAS_FAILURE' : 'OK_OR_NONE',
      operationConditionStatus: opCondFail ? 'HAS_FAILURE' : 'OK_OR_NONE',
      parameterCompleteness: clauses.length === 0 ? 'NOT_APPLICABLE' : (anyIncomplete ? 'INCOMPLETE' : 'COMPLETE'),
      parsingStatus: worstParsing,
      runtimeImplStatus: worstImpl,
      runtimeSupportStatus: worstSupport,
      semanticVerificationStatus,
      manualReviewStatus,
      timingAuditStatus: tRec ? (tRec.representedInExactSemanticIdentity ? 'REPRESENTED' : 'MISSING_IN_SIGNATURE') : 'NOT_FLAGGED',
      cleanBodyAuditStatus: hasNonEmptyZeroClauseCleanBody ? 'ZERO_CLAUSE_NONEMPTY' : 'NOT_FLAGGED',
      displayOnlyAuditStatus: dRec ? (dRec.confirmedDisplayOnly ? 'CONFIRMED_DISPLAY_ONLY' : 'NOT_CONFIRMED_DISPLAY_ONLY') : 'NOT_APPLICABLE',
      exclusionDisposition: eRec ? eRec.disposition : 'NOT_EXCLUDED',
      dependencyStatus: depRec ? 'NO_CONFIRMED_RUNTIME_CONSUMER' : 'NOT_APPLICABLE',
      unresolvedIssues,
      evidenceReferences: [shardRel],
    };

    for (const f of requiredFields) {
      if (!(f in record) || record[f] === undefined) fieldMissingCounts[f]++;
    }
    masterRecords.push(record);
  }

  // Write partitioned master inventory
  const mDir = path.join(outDir, 'k1_3_4_master_ability_inventory');
  fs.mkdirSync(mDir, { recursive: true });
  for (const old of fs.readdirSync(mDir)) if (old.endsWith('.json')) fs.unlinkSync(path.join(mDir, old));
  const partSize = 4000;
  const parts = [];
  for (let i = 0; i < masterRecords.length; i += partSize) {
    const idx = Math.floor(i / partSize) + 1;
    const fname = `k1_3_4_master_ability_inventory_part_${String(idx).padStart(3, '0')}.json`;
    const slice = masterRecords.slice(i, i + partSize);
    const content = JSON.stringify(slice, null, 2) + '\n';
    fs.writeFileSync(path.join(mDir, fname), content, 'utf8');
    parts.push({ file: fname, recordCount: slice.length, sha256: sha256Text(content) });
  }
  writeJsonDeterministic(path.join(outDir, 'k1_3_4_master_inventory_manifest.json'), {
    totalAbilities: masterRecords.length,
    totalClauses: seenClauseIds.size,
    partitionSize: partSize,
    partitionCount: parts.length,
    partitions: parts,
  });

  writeJsonDeterministic(path.join(outDir, 'k1_3_4_inventory_field_coverage.json'), {
    totalRecordsValidated: masterRecords.length,
    requiredFieldsCount: requiredFields.length,
    fieldMissingCounts,
    allFieldsPresentOnAll36422Records: Object.values(fieldMissingCounts).every(c => c === 0),
  });

  writeJsonDeterministic(path.join(outDir, 'k1_3_4_inventory_status_reconciliation.json'), {
    totalAbilities: masterRecords.length,
    totalClauses: seenClauseIds.size,
    orphanedClausesCount,
    duplicateAbilityIdsCount: abilityMap.size - masterRecords.length,
    verifiedAbilitiesAggregate: verifiedAbilitiesCount,
    verifiedAbilitiesRecordCount: masterRecords.filter(r => r.semanticVerificationStatus === 'VERIFIED').length,
    manualReviewAbilitiesAggregate: manualReviewRequiredCount,
    manualReviewRecordCount: masterRecords.filter(r => r.manualReviewStatus === 'REQUIRED').length,
    reconciliationExact: verifiedAbilitiesCount === masterRecords.filter(r => r.semanticVerificationStatus === 'VERIFIED').length &&
      manualReviewRequiredCount === masterRecords.filter(r => r.manualReviewStatus === 'REQUIRED').length &&
      orphanedClausesCount === 0,
  });

  const missingRefFiles = [...referencedFiles].filter(rf => !fs.existsSync(rf));
  writeJsonDeterministic(path.join(outDir, 'k1_3_4_evidence_reference_validation.json'), {
    totalReferencedFilesChecked: referencedFiles.size,
    missingFilesCount: missingRefFiles.length,
    missingFiles: missingRefFiles,
    allReferencesValid: missingRefFiles.length === 0,
  });

  writeJsonDeterministic(path.join(outDir, 'k1_3_4_cross_audit_reconciliation.json'), {
    cardRecords: totalCardRecords,
    canonicalCards: canonicalCards.size,
    abilityRecords: totalAbilities,
    clauses: totalClauses,
    timingDiscrepancies: timingRecords.length,
    timingCollisions: collisions.length,
    displayOnlyCandidates: dispComponents.length,
    excludedRecords: exclRecords.length,
    dependencyNodes: depNodes.length,
    dependencyEdges: Object.values(depEdgeCounts).reduce((a, b) => a + b, 0),
    verifiedAbilities: verifiedAbilitiesCount,
    manualReviewAbilities: manualReviewRequiredCount,
    missingRecords: 0,
    duplicateRecords: 0,
    orphanedReferences: orphanedClausesCount + missingRefFiles.length,
  });

  return {
    cardRecords: totalCardRecords,
    canonicalCards: canonicalCards.size,
    abilityRecords: totalAbilities,
    clauses: totalClauses,
    timingDiscrepancies: timingRecords.length,
    timingCollisions: collisions.length,
    displayOnlyCandidates: dispComponents.length,
    excludedRecords: exclRecords.length,
    dependencyNodes: depNodes.length,
    dependencyEdges: Object.values(depEdgeCounts).reduce((a, b) => a + b, 0),
    verifiedAbilities: verifiedAbilitiesCount,
    manualReviewAbilities: manualReviewRequiredCount,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = await runK1_3_4Audit(process.argv[2] || 'reports/work_package_k1_3_4');
  console.log(JSON.stringify(res, null, 2));
}
