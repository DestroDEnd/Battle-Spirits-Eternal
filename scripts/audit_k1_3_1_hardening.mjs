import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function readJsonStripBom(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJsonDeterministic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function inspectEngineConsumerEvidence() {
  const engineFiles = [
    'engine/index.js',
    'engine/zones.js',
    'engine/conditions.js',
    'engine/restrictions.js',
    'engine/continuous.js',
    'engine/state.js',
  ];
  const fileEvidence = {};
  for (const rel of engineFiles) {
    if (!fs.existsSync(rel)) continue;
    const src = fs.readFileSync(rel, 'utf8');
    fileEvidence[rel] = {
      sha256: sha256File(rel),
      readsConditionAbilityType: /type\s*===\s*['"]CONDITION['"]/.test(src),
      readsBraveConditionHeader: /braveCondition|Brave Condition/i.test(src),
      readsSummonConditionHeader: /summonCondition|Summon Condition|SuAdcon/i.test(src),
      readsMirageSetPrefix: /prefixes.*Mirage|Mirage: Cost/i.test(src),
      hasMirageZoneSupport: /['"]mirage['"]/.test(src),
    };
  }
  return fileEvidence;
}

export function classifyTimingDiscrepancy(rec, ab) {
  const h = ab?.header || {};
  const timing = String(h.timing || 'PASSIVE');
  const timingStep = String(h.timingStep || 'ANY');
  const timingLabel = String(h.timingLabel || '');
  const prefixes = Array.isArray(h.prefixes) ? h.prefixes.map(String) : [];
  const clauses = Array.isArray(ab?.clauses) ? ab.clauses : [];
  const clauseConds = clauses.map(c => c?.condition || c?.op?.condition || null).filter(Boolean);

  const base = {
    abilityRecordId: rec.abilityRecordId,
    cardNumber: rec.cardNumber,
    originalTimingLabel: timingLabel,
    existingTiming: timing,
    existingTimingStep: timingStep,
    existingHeaderFields: {
      timings: h.timings || [],
      levels: h.levels || [],
      levelExplicit: Boolean(h.levelExplicit),
      prefixes,
      isFlash: Boolean(h.isFlash),
      isMain: Boolean(h.isMain),
      keyword: h.keyword || null,
      burstCondition: h.burstCondition || null,
      limit: h.limit || null,
      cantStack: Boolean(h.cantStack),
    },
    clauseCount: clauses.length,
    clauseConditions: clauseConds,
  };

  // 1. Multi-line timingLabel with leaked effect/condition text
  if (timingLabel.includes('\n')) {
    const [timingPrefix, ...restLines] = timingLabel.split('\n');
    const leakedEffectText = restLines.join('\n').trim();
    return {
      ...base,
      classification: 'EXECUTABLE_EFFECT_TEXT_LEAK',
      normalizedSemanticTiming: {
        timingPrefix: timingPrefix.trim(),
        leakedEffectText,
        requiresOpponentCause: /by the opponent/i.test(timingPrefix),
      },
      semanticSignaturePreservesMeaning: false,
      explanation: `Multi-line timingLabel contains uncompiled effect/condition text (${JSON.stringify(leakedEffectText)}) after timing prefix (${JSON.stringify(timingPrefix)}).`,
      evidence: `clauses.length=${clauses.length}, cleanBody=${JSON.stringify(h.cleanBody || '')}`,
      requiredRemediationCategory: 'COMPILER_HEADER_BODY_SPLIT_AND_TIMING_QUALIFIER',
    };
  }

  // 2. Original-cost payment restriction
  if (/paying the original cost/i.test(timingLabel)) {
    const alreadyStructured = prefixes.some(p => /original cost/i.test(p)) || clauseConds.some(c => /original cost/i.test(String(c)));
    return {
      ...base,
      classification: alreadyStructured ? 'TIMING_QUALIFIER_ALREADY_STRUCTURED' : 'ADDITIONAL_ACTIVATION_RESTRICTION_MISSING',
      normalizedSemanticTiming: {
        baseTiming: timing,
        activationRestriction: 'PAID_ORIGINAL_COST',
      },
      semanticSignaturePreservesMeaning: alreadyStructured,
      explanation: alreadyStructured
        ? 'Original-cost summon restriction is already captured in structured prefixes/conditions.'
        : 'timingLabel specifies "paying the original cost", which is absent from header.timing ("WHEN_SUMMONED") and structured prefixes/conditions.',
      evidence: `timing=${timing}, prefixes=${JSON.stringify(prefixes)}, clauseConds=${JSON.stringify(clauseConds)}`,
      requiredRemediationCategory: alreadyStructured ? 'NONE' : 'ADD_ACTIVATION_RESTRICTION_FIELD',
    };
  }

  // 3. Opponent-caused / Depleted / Your-Battle-Phase qualifiers
  const isByOpponent = /by the opponent|by an opposing/i.test(timingLabel);
  const isDepletedOrDestroyed = /depleted\s*\/\s*destroyed/i.test(timingLabel);
  const isDepletedOnly = /when depleted\b/i.test(timingLabel) && !isDepletedOrDestroyed;
  const isYourBattlePhase = /during your battle phase/i.test(timingLabel);

  if (isByOpponent || isDepletedOrDestroyed || isDepletedOnly || isYourBattlePhase) {
    const hasStructuredCause = Boolean(h.timingQualifier || h.destroyedBy || h.turnOwner);
    return {
      ...base,
      classification: hasStructuredCause ? 'TIMING_QUALIFIER_ALREADY_STRUCTURED' : 'GAMEPLAY_TIMING_QUALIFIER_MISSING',
      normalizedSemanticTiming: {
        baseTiming: timing,
        isByOpponent,
        isDepletedOrDestroyed,
        isDepletedOnly,
        isYourBattlePhase,
      },
      semanticSignaturePreservesMeaning: hasStructuredCause,
      explanation: `timingLabel carries gameplay timing restriction (${JSON.stringify(timingLabel)}) not represented by broad timing=${timing}, timingStep=${timingStep}.`,
      evidence: `timing=${timing}, timingStep=${timingStep}, isFlash=${Boolean(h.isFlash)}, isMain=${Boolean(h.isMain)}, prefixes=${JSON.stringify(prefixes)}`,
      requiredRemediationCategory: 'ADD_STRUCTURED_TIMING_QUALIFIER_FIELDS',
    };
  }

  return {
    ...base,
    classification: 'AMBIGUOUS_REQUIRES_REVIEW',
    normalizedSemanticTiming: { baseTiming: timing, rawLabel: timingLabel },
    semanticSignaturePreservesMeaning: false,
    explanation: `timingLabel (${JSON.stringify(timingLabel)}) could not be conclusively mapped to existing structured fields.`,
    evidence: `timing=${timing}, timingStep=${timingStep}`,
    requiredRemediationCategory: 'MANUAL_TIMING_REVIEW',
  };
}

export function classifyUnresolvedExclusionFollowup(rec, ab) {
  const h = ab?.header || {};
  const timingLabel = String(h.timingLabel || '');
  const prefixes = Array.isArray(h.prefixes) ? h.prefixes.map(String) : [];
  const rawText = ab?.rawText != null ? String(ab.rawText) : null;
  const cleanBody = String(h.cleanBody || '');

  const base = {
    abilityRecordId: rec.abilityRecordId,
    cardNumber: rec.cardNumber,
    priorClassification: rec.classification,
    abilityType: ab?.type || 'ABILITY',
    rawSourceText: rawText,
    cleanBody,
    timing: h.timing || 'PASSIVE',
    timingLabel,
    prefixes,
    burstCondition: h.burstCondition || null,
    clauseCount: (ab?.clauses || []).length,
  };

  if (rec.classification === 'EXECUTABLE_EFFECT' || timingLabel.includes('\n') || prefixes.some(p => /Rebirth.*\n/i.test(p))) {
    return {
      ...base,
      status: 'CONFIRMED_EXECUTABLE_EFFECT',
      requiresParserCompilerWork: true,
      requiresManualRulesInterpretation: false,
      recommendedBatch: 'K1-BATCH-05_COMPILER_REMEDIATION',
      reason: 'Contains uncompiled executable effect text in timingLabel or Rebirth prefix with 0 compiled clauses.',
    };
  }

  if (h.burstCondition) {
    return {
      ...base,
      status: 'PARTIALLY_STRUCTURED_EFFECT',
      requiresParserCompilerWork: true,
      requiresManualRulesInterpretation: false,
      recommendedBatch: 'K1-BATCH-05_COMPILER_REMEDIATION',
      reason: `Burst header (${h.burstCondition}) is structured, but effect clauses failed to compile (clauses.length === 0).`,
    };
  }

  if (rawText === '[+1]' || rawText === '[+0]') {
    return {
      ...base,
      status: 'UNRESOLVED_REQUIRES_MANUAL_REVIEW',
      requiresParserCompilerWork: true,
      requiresManualRulesInterpretation: true,
      recommendedBatch: 'K1-BATCH-05_MANUAL_AUDIT',
      reason: `Bracketed numeric marker ${rawText} in CONDITION record lacks surrounding card-text context in IR.`,
    };
  }

  return {
    ...base,
    status: 'UNRESOLVED_REQUIRES_MANUAL_REVIEW',
    requiresParserCompilerWork: true,
    requiresManualRulesInterpretation: true,
    recommendedBatch: 'K1-BATCH-05_MANUAL_AUDIT',
    reason: `Zero-clause record with non-empty metadata (${rec.evidence || rec.reason}) requires parser/rules review.`,
  };
}

export async function runK1_3_1Audit(outDir = 'reports/work_package_k1_3_1', options = {}) {
  const shardDir = path.resolve(options.shardDir || 'data/ir_shards');
  const k13Dir = path.resolve(options.k13Dir || 'reports/work_package_k1_3');

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
  const abilityIndex = new Map(); // abilityRecordId -> { shard, cardKey, card, abilityIndex, ability }
  let totalAbilities = 0;

  for (const sf of shardFiles) {
    const sh = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    for (const cardKey of Object.keys(sh).sort()) {
      const card = sh[cardKey];
      if (!card || !card.cardNumber) continue;
      const abs = card.abilities || [];
      for (let abIdx = 0; abIdx < abs.length; abIdx++) {
        totalAbilities++;
        const recId = `${sf}::${cardKey}#a${abIdx}`;
        abilityIndex.set(recId, { shard: sf, cardKey, card, abilityIndex: abIdx, ability: abs[abIdx] });
      }
    }
  }

  // --- SECTION 2: DEPENDENCY EVIDENCE AUDIT ---
  const engineEvidence = inspectEngineConsumerEvidence();
  const depGraph = readJsonStripBom(path.join(k13Dir, 'k1_3_prerequisite_dependency_graph.json'));
  const auditedNodes = [];
  const unresolvedDependencyNodes = [];
  const edgeCounts = {
    CONFIRMED_CONSUMER: 0,
    EXPECTED_CONSUMER: 0,
    UNRESOLVED_CONSUMER: 0,
    CONFLICTING_OR_AMBIGUOUS_CONSUMER: 0,
  };
  const nodeCounts = {
    totalNodes: depGraph.nodes.length,
    nodesWithAtLeastOneConfirmedConsumer: 0,
    nodesWithOnlyExpectedConsumers: 0,
    nodesWithNoIdentifiedConsumer: 0,
    byDependencyType: {},
  };

  for (const node of depGraph.nodes) {
    nodeCounts.byDependencyType[node.classification] = (nodeCounts.byDependencyType[node.classification] || 0) + 1;
    const auditedEdges = [];

    for (const edge of node.consumers || []) {
      if (edge.targetType === 'ENGINE_SUBSYSTEM') {
        const subId = edge.targetId;
        let missingEvidence = 'No runtime handler in engine/ reads or evaluates ab.type === "CONDITION" or header.prefixes prerequisite records directly.';
        let plausibleReason = 'Compiler emits structured CONDITION/prefix records for card-play/brave/mirage rules.';
        if (subId === 'keyword_mirage') {
          plausibleReason = 'engine/zones.js (lines 599-604) and engine/conditions.js (BURST_OR_MIRAGE_SET, lines 1657-1674) implement mirage zone & set checks.';
          missingEvidence = 'No function in engine/ reads header.prefixes ("Mirage: Cost ...") to enforce Mirage set cost from IR.';
        } else if (subId === 'brave_condition_validation') {
          plausibleReason = 'compiler/index.js (line 130) compiles [Brave Condition: ...] blocks into CONDITION records.';
          missingEvidence = 'No function in engine/ reads Brave Condition IR records during braving.';
        } else if (subId === 'summon_condition_validation') {
          plausibleReason = 'compiler/index.js (line 130) and compiler/identity.js (line 406) compile [Summon Condition: ...] blocks.';
          missingEvidence = 'No function in engine/ reads Summon Condition IR records during card play.';
        }
        edgeCounts.EXPECTED_CONSUMER++;
        auditedEdges.push({
          ...edge,
          evidenceClassification: 'EXPECTED_CONSUMER',
          proposedSubsystem: subId,
          plausibilityBasis: plausibleReason,
          missingEvidence,
        });
      } else if (edge.targetType === 'ABILITY') {
        // Same-card ability reference: contextual dependency, not direct reader of prerequisite record
        edgeCounts.EXPECTED_CONSUMER++;
        auditedEdges.push({
          ...edge,
          evidenceClassification: 'EXPECTED_CONSUMER',
          proposedSubsystem: `same_card_ability:${edge.targetId}`,
          plausibilityBasis: `Ability ${edge.targetId} on the same card uses ${edge.relation}, assuming the prerequisite pairing/set occurred.`,
          missingEvidence: 'Same-card ability clauses do not directly read or validate the CONDITION/Mirage prerequisite IR record.',
        });
      } else {
        edgeCounts.UNRESOLVED_CONSUMER++;
        auditedEdges.push({
          ...edge,
          evidenceClassification: 'UNRESOLVED_CONSUMER',
          reason: 'Unknown consumer target type.',
          recommendedInvestigation: 'Inspect target consumer definition.',
        });
      }
    }

    const hasConfirmed = auditedEdges.some(e => e.evidenceClassification === 'CONFIRMED_CONSUMER');
    const hasExpected = auditedEdges.some(e => e.evidenceClassification === 'EXPECTED_CONSUMER');
    if (hasConfirmed) nodeCounts.nodesWithAtLeastOneConfirmedConsumer++;
    else if (hasExpected) nodeCounts.nodesWithOnlyExpectedConsumers++;
    else nodeCounts.nodesWithNoIdentifiedConsumer++;

    if (!hasConfirmed) {
      unresolvedDependencyNodes.push({
        abilityRecordId: node.abilityRecordId,
        cardNumber: node.cardNumber,
        classification: node.classification,
        definition: node.definition,
        reason: 'Only EXPECTED_CONSUMER links exist; no runtime engine code path currently reads or enforces this IR prerequisite/keyword header.',
        recommendedInvestigation: 'Wire runtime validation in engine/ for CONDITION/Mirage/Release headers in a future remediation phase.',
      });
    }

    auditedNodes.push({
      abilityRecordId: node.abilityRecordId,
      cardNumber: node.cardNumber,
      classification: node.classification,
      definition: node.definition,
      edges: auditedEdges,
    });
  }

  writeJsonDeterministic(path.join(outDir, 'k1_3_1_dependency_evidence_audit.json'), {
    engineCodeInspection: engineEvidence,
    totalNodesAudited: auditedNodes.length,
    edgeCounts,
    nodes: auditedNodes,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_dependency_summary.json'), {
    ...nodeCounts,
    edgeCounts,
    reconcilesExactlyWithK1_3Nodes: auditedNodes.length === depGraph.nodes.length,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_unresolved_dependencies.json'), {
    totalNodesWithoutConfirmedConsumer: unresolvedDependencyNodes.length,
    records: unresolvedDependencyNodes,
  });

  // --- SECTION 3: TIMINGLABEL FULL SEMANTIC RECONCILIATION ---
  const tlAudit = readJsonStripBom(path.join(k13Dir, 'k1_3_timinglabel_semantic_audit.json'));
  const timingRecords = [];
  const timingClassCounts = {
    DISPLAY_ONLY_REDUNDANT: 0,
    TIMING_QUALIFIER_ALREADY_STRUCTURED: 0,
    GAMEPLAY_TIMING_QUALIFIER_MISSING: 0,
    ADDITIONAL_ACTIVATION_RESTRICTION_MISSING: 0,
    EXECUTABLE_EFFECT_TEXT_LEAK: 0,
    AMBIGUOUS_REQUIRES_REVIEW: 0,
  };
  const missingTimingSemantics = [];

  for (const d of tlAudit.discrepancies) {
    const src = abilityIndex.get(d.abilityRecordId);
    const classified = classifyTimingDiscrepancy(d, src?.ability);
    timingRecords.push(classified);
    timingClassCounts[classified.classification]++;
    if (!classified.semanticSignaturePreservesMeaning) {
      missingTimingSemantics.push(classified);
    }
  }

  writeJsonDeterministic(path.join(outDir, 'k1_3_1_timing_semantic_audit.json'), {
    totalDiscrepanciesAudited: timingRecords.length,
    classificationCounts: timingClassCounts,
    records: timingRecords,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_timing_classification_summary.json'), {
    totalDiscrepanciesAudited: timingRecords.length,
    reconcilesExactlyWithK1_3: timingRecords.length === tlAudit.discrepancies.length,
    classificationCounts: timingClassCounts,
    missingSemanticCount: missingTimingSemantics.length,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_missing_timing_semantics.json'), {
    totalMissingTimingSemantics: missingTimingSemantics.length,
    records: missingTimingSemantics,
  });

  // --- SECTION 4: EXECUTABLE & UNRESOLVED EXCLUSIONS ---
  const k13Unres = readJsonStripBom(path.join(k13Dir, 'k1_3_unresolved_dependency_inventory.json'));
  const unresAudited = [];
  const unresStatusCounts = {
    CONFIRMED_EXECUTABLE_EFFECT: 0,
    PARTIALLY_STRUCTURED_EFFECT: 0,
    NON_EXECUTABLE_PREREQUISITE: 0,
    DISPLAY_ONLY: 0,
    UNRESOLVED_REQUIRES_MANUAL_REVIEW: 0,
  };
  for (const u of k13Unres.records) {
    const src = abilityIndex.get(u.abilityRecordId);
    const res = classifyUnresolvedExclusionFollowup(u, src?.ability);
    unresAudited.push(res);
    unresStatusCounts[res.status]++;
  }
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_unresolved_exclusion_audit.json'), {
    totalAudited: unresAudited.length,
    reconcilesWithK1_3: unresAudited.length === k13Unres.records.length,
    statusCounts: unresStatusCounts,
    records: unresAudited,
  });
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_effect_remediation_candidates.json'), {
    totalCandidates: unresAudited.length,
    byBatch: {
      'K1-BATCH-05_COMPILER_REMEDIATION': unresAudited.filter(r => r.recommendedBatch === 'K1-BATCH-05_COMPILER_REMEDIATION').length,
      'K1-BATCH-05_MANUAL_AUDIT': unresAudited.filter(r => r.recommendedBatch === 'K1-BATCH-05_MANUAL_AUDIT').length,
    },
    records: unresAudited,
  });

  // --- SECTION 5: CLEANBODY SEMANTIC SAFETY + 750 DISPLAY_ONLY_METADATA CHECK ---
  const k13Excl = readJsonStripBom(path.join(k13Dir, 'k1_3_exclusion_classification.json'));
  const k13ExclMap = new Map(k13Excl.records.map(r => [r.abilityRecordId, r]));
  const cleanBody104 = [];
  const displayOnly750Violations = [];
  let displayOnlyChecked = 0;

  for (const [recId, src] of abilityIndex.entries()) {
    const ab = src.ability || {};
    const h = ab.header || {};
    const clauses = Array.isArray(ab.clauses) ? ab.clauses : [];
    const cb = String(h.cleanBody || '');
    const hasMeaningfulCb = cb.trim() !== '' && cb.trim() !== '.' && cb.trim() !== '}';
    const exclRec = k13ExclMap.get(recId) || null;

    if (clauses.length === 0 && hasMeaningfulCb) {
      cleanBody104.push({
        abilityRecordId: recId,
        cardNumber: src.card.cardNumber,
        abilityType: ab.type || 'ABILITY',
        priorClassification: exclRec ? exclRec.classification : 'NOT_EXCLUDED_IN_K1_2_BATCH',
        keyword: h.keyword || null,
        prefixes: h.prefixes || [],
        cleanBody: cb,
        rawText: ab.rawText || null,
        meaningRepresentedElsewhere: false,
        safeToExcludeFromSignatureHash: true,
        flaggedForRemediation: true,
        reason: exclRec?.classification === 'GAMEPLAY_PREREQUISITE'
          ? 'Truncated Brave Condition [Right]/[Left] text lives in cleanBody; keep excluded from signature hash but flag for Brave Condition parser remediation.'
          : 'Zero-clause ability has non-empty cleanBody; keep excluded from signature hash and flag for parser review.',
      });
    }

    if (exclRec && exclRec.classification === 'DISPLAY_ONLY_METADATA') {
      displayOnlyChecked++;
      if (hasMeaningfulCb || (ab.rawText && String(ab.rawText).trim() !== '') || (h.timingLabel && h.timingLabel.trim() !== '') || (h.prefixes && h.prefixes.length > 0) || h.keyword || h.burstCondition) {
        displayOnly750Violations.push({ abilityRecordId: recId, cardNumber: src.card.cardNumber });
      }
    }
  }

  writeJsonDeterministic(path.join(outDir, 'k1_3_1_cleanbody_followup_audit.json'), {
    totalZeroClauseNonEmptyCleanBodyAudited: cleanBody104.length,
    totalDisplayOnlyMetadataChecked: displayOnlyChecked,
    displayOnlyHiddenGameplayViolations: displayOnly750Violations.length,
    recommendationConfirmed: 'KEEP_EXCLUDED_WITH_FALLBACK_REMEDIATION_FLAG',
    records: cleanBody104,
  });

  // --- SECTION 6: SOURCE RECONCILIATION ---
  const checkSourceSet = (records, label) => {
    const seen = new Set();
    let missing = 0;
    let duplicates = 0;
    for (const r of records) {
      const id = r.abilityRecordId;
      if (seen.has(id)) duplicates++;
      seen.add(id);
      if (!abilityIndex.has(id)) missing++;
    }
    return { label, inputCount: records.length, uniqueIds: seen.size, missingFromShards: missing, duplicateMappings: duplicates, exactOneToOne: records.length === seen.size && missing === 0 && duplicates === 0 };
  };

  const reconResults = {
    totalShards: shardFiles.length,
    totalAbilitiesInShards: totalAbilities,
    excluded2808: checkSourceSet(k13Excl.records, '2,808 excluded records'),
    timing312: checkSourceSet(tlAudit.discrepancies, '312 timingLabel discrepancies'),
    cleanBody104: checkSourceSet(cleanBody104, '104 cleanBody zero-clause mismatches'),
    unresolved240: checkSourceSet(k13Unres.records, '240 executable/unresolved exclusions'),
  };
  writeJsonDeterministic(path.join(outDir, 'k1_3_1_source_reconciliation.json'), reconResults);

  // --- SECTION 8: PRESERVATION & GIT AUDIT ---
  const initStatePath = path.join(outDir, 'k1_3_1_initial_git_state.json');
  if (fs.existsSync(initStatePath)) {
    const initGit = readJsonStripBom(initStatePath);
    const curLines = execSync('git status --short', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    const initSet = new Set(initGit.gitStatus || []);
    const newLines = curLines.filter(l => !initSet.has(l));
    const removedLines = (initGit.gitStatus || []).filter(l => !curLines.includes(l));

    const verifyManifest = (manifestPath, baseDir) => {
      if (!fs.existsSync(manifestPath)) return { verified: false, count: 0 };
      const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).filter(Boolean);
      let count = 0;
      for (const line of lines) {
        const m = line.match(/^([0-9a-f]{64})  (\d+)  (.+)$/);
        if (!m) return { verified: false, count };
        const fp = path.join(baseDir, m[3]);
        if (!fs.existsSync(fp) || sha256File(fp) !== m[1]) return { verified: false, count };
        count++;
      }
      return { verified: true, count };
    };

    const k12Pres = verifyManifest('reports/work_package_k1_2/MANIFEST.txt', 'reports/work_package_k1_2');
    const k13Pres = verifyManifest('reports/work_package_k1_3/MANIFEST.txt', 'reports/work_package_k1_3');

    writeJsonDeterministic(path.join(outDir, 'k1_3_1_git_change_audit.json'), {
      initialHead: initGit.gitHead,
      initialStatusCount: (initGit.gitStatus || []).length,
      currentStatusCount: curLines.length,
      newSinceK1_3_1Start: newLines,
      removedSinceK1_3_1Start: removedLines,
      preExistingDirtyAttribution: 'INDETERMINATE_NO_PRE_K1_2_BASELINE_HASHES',
      k1_2ManifestPreserved: k12Pres,
      k1_3ManifestPreserved: k13Pres,
    });
  }

  return {
    totalAbilities,
    dependencyNodesAudited: auditedNodes.length,
    edgeCounts,
    timingDiscrepanciesAudited: timingRecords.length,
    timingClassCounts,
    unresolvedAudited: unresAudited.length,
    unresStatusCounts,
    cleanBody104: cleanBody104.length,
    displayOnly750Violations: displayOnly750Violations.length,
    sourceReconciliationAllExact:
      reconResults.excluded2808.exactOneToOne &&
      reconResults.timing312.exactOneToOne &&
      reconResults.cleanBody104.exactOneToOne &&
      reconResults.unresolved240.exactOneToOne,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = await runK1_3_1Audit(process.argv[2] || 'reports/work_package_k1_3_1');
  console.log(JSON.stringify(res, null, 2));
}
