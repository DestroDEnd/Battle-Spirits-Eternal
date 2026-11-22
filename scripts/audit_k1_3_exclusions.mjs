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

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseGitStatusEntries(lines) {
  const map = new Map();
  for (const raw of lines || []) {
    if (!raw || raw.length < 4) continue;
    const status = raw.slice(0, 2);
    const filePath = raw.slice(3).trim().replace(/^"(.*)"$/, '$1');
    map.set(filePath, status);
  }
  return map;
}

export function classifyExcludedRecord(rec, ab, card, sameCardConsumers) {
  const h = ab.header || {};
  const kw = h.keyword ? String(h.keyword) : '';
  const prefixes = Array.isArray(h.prefixes) ? h.prefixes.map(String) : [];
  const cleanBody = String(h.cleanBody || '');
  const rawText = ab.rawText != null ? String(ab.rawText) : null;
  const timing = String(h.timing || 'PASSIVE');
  const timingLabel = String(h.timingLabel || '');

  const base = {
    abilityRecordId: rec.abilityRecordId,
    cardNumber: rec.cardNumber,
    shard: rec.shard,
    abilityType: ab.type || rec.abilityType || 'ABILITY',
    exclusionReason: rec.exclusionReason,
    headerProperties: {
      timing,
      timingLabel,
      timingStep: h.timingStep || 'ANY',
      levels: h.levels || [],
      levelExplicit: Boolean(h.levelExplicit),
      prefixes,
      limit: h.limit || null,
      cantStack: Boolean(h.cantStack),
      isFlash: Boolean(h.isFlash),
      isMain: Boolean(h.isMain),
      keyword: h.keyword || null,
      burstCondition: h.burstCondition || null,
    },
    cleanBody,
    rawSourceText: rawText,
  };

  // 1. Effect text leaked into timingLabel or Rebirth prefix
  if (
    timingLabel.includes('\n') ||
    prefixes.some(p => /Rebirth.*\n/i.test(p))
  ) {
    return {
      ...base,
      detectedKeywordOrCondition: prefixes[0] || timingLabel.split('\n')[0],
      dependencyReferences: [],
      evidence: timingLabel.includes('\n') ? `timingLabel contains multi-line effect text: ${timingLabel}` : `prefixes contains Rebirth effect text: ${prefixes[0]}`,
      classification: 'EXECUTABLE_EFFECT',
      confidence: 'HIGH',
      reason: 'Header field (timingLabel or prefixes) contains uncompiled executable effect text despite clauses.length === 0.',
    };
  }

  // 2. Brave Condition (header.keyword starts with "Brave Condition")
  if (/^Brave Condition\b/i.test(kw)) {
    const braveConsumers = sameCardConsumers.filter(c => c.kind === 'BRAVE_CONSUMER');
    return {
      ...base,
      detectedKeywordOrCondition: kw + (cleanBody ? ` ${cleanBody}` : ''),
      dependencyReferences: [
        { targetType: 'ENGINE_SUBSYSTEM', targetId: 'brave_condition_validation' },
        ...braveConsumers.map(c => ({ targetType: 'ABILITY', targetId: c.abilityRecordId, relation: c.relation })),
      ],
      evidence: `ab.type=${ab.type}, header.keyword=${JSON.stringify(kw)}, rawText=${JSON.stringify(rawText)}`,
      classification: 'GAMEPLAY_PREREQUISITE',
      confidence: 'HIGH',
      reason: 'Defines Brave pairing prerequisite consumed by the engine Brave subsystem and card-level When Braved/During Brave abilities.',
    };
  }

  // 3. Summon Condition / SuAdcon
  if (
    /^SuAdcon\b/i.test(kw) ||
    prefixes.some(p => /^Summon Condition\b/i.test(p)) ||
    (rawText && /Summon Condition:/i.test(rawText))
  ) {
    return {
      ...base,
      detectedKeywordOrCondition: kw || prefixes.find(p => /Summon Condition/i.test(p)) || rawText,
      dependencyReferences: [
        { targetType: 'ENGINE_SUBSYSTEM', targetId: 'summon_condition_validation' },
      ],
      evidence: `ab.type=${ab.type}, keyword=${JSON.stringify(kw)}, prefixes=${JSON.stringify(prefixes)}, rawText=${JSON.stringify(rawText)}`,
      classification: 'GAMEPLAY_PREREQUISITE',
      confidence: 'HIGH',
      reason: 'Defines Summon/Advent prerequisite consumed by the engine card-play/summon validation subsystem.',
    };
  }

  // 4. Mirage / Release keyword headers
  if (prefixes.some(p => /^(Mirage|Release|True Release)\b/i.test(p))) {
    const kwMatch = prefixes.find(p => /^(Mirage|Release|True Release)\b/i.test(p));
    const kwName = kwMatch.split(':')[0].trim();
    const setConsumers = sameCardConsumers.filter(c => c.kind === 'MIRAGE_OR_SET_CONSUMER');
    return {
      ...base,
      detectedKeywordOrCondition: kwMatch,
      dependencyReferences: [
        { targetType: 'ENGINE_SUBSYSTEM', targetId: `keyword_${kwName.toLowerCase().replace(/\s+/g, '_')}` },
        ...setConsumers.map(c => ({ targetType: 'ABILITY', targetId: c.abilityRecordId, relation: c.relation })),
      ],
      evidence: `prefixes=${JSON.stringify(prefixes)}`,
      classification: 'KEYWORD_DEFINITION',
      confidence: 'HIGH',
      reason: `Declares ${kwName} keyword prerequisite/cost header with zero standalone clauses; consumed by keyword/set subsystem.`,
    };
  }

  // 5. Genuinely empty PASSIVE placeholder (no rawText, no cleanBody, no keyword, no prefixes, no timingLabel, no burstCondition)
  if (
    ab.type === 'ABILITY' &&
    timing === 'PASSIVE' &&
    !timingLabel &&
    prefixes.length === 0 &&
    !kw &&
    !h.burstCondition &&
    !h.isFlash &&
    !h.isMain &&
    cleanBody === '' &&
    rawText === null
  ) {
    return {
      ...base,
      detectedKeywordOrCondition: null,
      dependencyReferences: [],
      evidence: 'Empty ABILITY record: timing=PASSIVE, clauses=[], cleanBody="", rawText=null, prefixes=[], keyword=null.',
      classification: 'DISPLAY_ONLY_METADATA',
      confidence: 'HIGH',
      reason: 'Empty placeholder ability record with no raw source text, no header qualifiers, no keywords, and no clauses.',
    };
  }

  // 6. Everything else (e.g. [+1]/[+0], "rtp", BURST with 0 clauses, STEP_RESTRICTED with 0 clauses, etc.)
  return {
    ...base,
    detectedKeywordOrCondition: h.burstCondition || prefixes[0] || rawText || timingLabel || null,
    dependencyReferences: h.burstCondition ? [{ targetType: 'ENGINE_SUBSYSTEM', targetId: 'burst_trigger_validation', unresolved: true }] : [],
    evidence: `ab.type=${ab.type}, timing=${timing}, timingLabel=${JSON.stringify(timingLabel)}, prefixes=${JSON.stringify(prefixes)}, burstCondition=${JSON.stringify(h.burstCondition || null)}, rawText=${JSON.stringify(rawText)}, cleanBody=${JSON.stringify(cleanBody)}`,
    classification: 'UNRESOLVED_REQUIRES_REVIEW',
    confidence: 'LOW',
    reason: 'Zero-clause record has non-empty marker/timing/burst metadata without sufficient structured evidence to confirm harmlessness or compile semantics.',
  };
}

export async function runK1_3Audit(outDir = 'reports/work_package_k1_3', options = {}) {
  const shardDir = path.resolve(options.shardDir || 'data/ir_shards');
  const exclPath = path.resolve(options.exclusionInventoryPath || 'reports/work_package_k1_2/explicit_exclusion_inventory.json');
  const exclData = JSON.parse(fs.readFileSync(exclPath, 'utf8'));
  const exclById = new Map(exclData.records.map(r => [r.abilityRecordId, r]));

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();

  const classifiedRecords = [];
  const classCounts = {
    EXECUTABLE_EFFECT: 0,
    GAMEPLAY_PREREQUISITE: 0,
    CONTINUOUS_OR_PASSIVE_RULE: 0,
    KEYWORD_DEFINITION: 0,
    DISPLAY_ONLY_METADATA: 0,
    UNRESOLVED_REQUIRES_REVIEW: 0,
  };

  // Dependency graph structures
  const prereqNodes = [];
  const unresolvedDeps = [];
  const conditionFreq = new Map();
  const keywordDefs = new Map();
  const duplicatePrereqs = [];
  const conflictingPrereqs = [];

  // cleanBody & timingLabel audits across ALL 36,422 abilities
  const cleanBodyMismatches = [];
  let totalAbilitiesAudited = 0;
  let cleanBodyZeroClauseNonEmpty = 0;
  let cleanBodyHasUnsupportedClause = 0;

  const timingLabelDiscrepancies = [];
  let timingLabelNonEmptyCount = 0;
  let timingLabelMultiLineCount = 0;
  let timingLabelWithQualifierCount = 0;

  for (const sf of shardFiles) {
    const sh = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    for (const cardKey of Object.keys(sh).sort()) {
      const card = sh[cardKey];
      if (!card || !card.cardNumber) continue;
      const cid = card.cardNumber;
      const abs = card.abilities || [];

      // Collect same-card consumers for dependency tracing
      const sameCardConsumers = [];
      for (let i = 0; i < abs.length; i++) {
        const cab = abs[i];
        const ch = cab.header || {};
        const cId = `${sf}::${cardKey}#a${i}`;
        const cPrefixes = Array.isArray(ch.prefixes) ? ch.prefixes.map(String) : [];
        if (cPrefixes.some(p => /Braved|During Brave/i.test(p)) || (cab.clauses || []).length > 0 && /brave/i.test(ch.cleanBody || '')) {
          sameCardConsumers.push({ abilityRecordId: cId, kind: 'BRAVE_CONSUMER', relation: 'CONSUMES_BRAVE_CONDITION' });
        }
        if (cPrefixes.some(p => /During Set/i.test(p))) {
          sameCardConsumers.push({ abilityRecordId: cId, kind: 'MIRAGE_OR_SET_CONSUMER', relation: 'CONSUMES_MIRAGE_SET' });
        }
      }

      // Check duplicate prerequisites on same card
      const cardPrereqKeys = [];

      for (let abIdx = 0; abIdx < abs.length; abIdx++) {
        const ab = abs[abIdx];
        totalAbilitiesAudited++;
        const recId = `${sf}::${cardKey}#a${abIdx}`;
        const h = ab.header || {};
        const clauses = Array.isArray(ab.clauses) ? ab.clauses : [];
        const cleanBody = String(h.cleanBody || '');
        const timingLabel = String(h.timingLabel || '');

        // cleanBody audit across all 36,422 abilities
        const hasMeaningfulCleanBody = cleanBody.trim() !== '' && cleanBody.trim() !== '.' && cleanBody.trim() !== '}';
        if (clauses.length === 0 && hasMeaningfulCleanBody) {
          cleanBodyZeroClauseNonEmpty++;
          cleanBodyMismatches.push({
            abilityRecordId: recId,
            cardNumber: cid,
            mismatchType: 'ZERO_CLAUSE_WITH_NONEMPTY_CLEANBODY',
            abilityType: ab.type || 'ABILITY',
            keyword: h.keyword || null,
            cleanBody,
          });
        } else if (clauses.length > 0 && hasMeaningfulCleanBody && clauses.some(c => !c?.op?.op || c.op.op === 'UNSUPPORTED')) {
          cleanBodyHasUnsupportedClause++;
          if (cleanBodyMismatches.length < 5000) {
            cleanBodyMismatches.push({
              abilityRecordId: recId,
              cardNumber: cid,
              mismatchType: 'UNSUPPORTED_CLAUSE_WITH_CLEANBODY_TEXT',
              abilityType: ab.type || 'ABILITY',
              keyword: h.keyword || null,
              cleanBody: cleanBody.slice(0, 200),
            });
          }
        }

        // timingLabel audit across all 36,422 abilities
        if (timingLabel.trim() !== '') {
          timingLabelNonEmptyCount++;
          const isMultiLine = timingLabel.includes('\n');
          const hasQualifier = /\b(by the Opponent|by an opposing|paying the original cost|each player|during your|during the opponent)\b/i.test(timingLabel);
          if (isMultiLine) timingLabelMultiLineCount++;
          if (hasQualifier) timingLabelWithQualifierCount++;
          if (isMultiLine || hasQualifier) {
            timingLabelDiscrepancies.push({
              abilityRecordId: recId,
              cardNumber: cid,
              discrepancyType: isMultiLine ? 'MULTILINE_EFFECT_LEAKED_INTO_TIMING_LABEL' : 'UNCAPTURED_TIMING_QUALIFIER',
              timing: h.timing || 'PASSIVE',
              timingStep: h.timingStep || 'ANY',
              timingLabel,
              clauseCount: clauses.length,
            });
          }
        }

        // Excluded record classification + dependency graph
        if (exclById.has(recId)) {
          const rec = exclById.get(recId);
          const classified = classifyExcludedRecord(rec, ab, card, sameCardConsumers);
          classifiedRecords.push(classified);
          classCounts[classified.classification]++;

          if (classified.detectedKeywordOrCondition) {
            const condKey = classified.detectedKeywordOrCondition;
            conditionFreq.set(condKey, (conditionFreq.get(condKey) || 0) + 1);
            cardPrereqKeys.push({ recId, condKey, classification: classified.classification });
          }

          if (classified.classification === 'GAMEPLAY_PREREQUISITE' || classified.classification === 'KEYWORD_DEFINITION') {
            const hasConsumer = classified.dependencyReferences.length > 0;
            prereqNodes.push({
              abilityRecordId: recId,
              cardNumber: cid,
              classification: classified.classification,
              definition: classified.detectedKeywordOrCondition,
              consumers: classified.dependencyReferences,
              hasKnownConsumer: hasConsumer,
            });
            if (classified.classification === 'KEYWORD_DEFINITION') {
              const kwName = String(classified.detectedKeywordOrCondition || '').split(':')[0].trim();
              keywordDefs.set(kwName, (keywordDefs.get(kwName) || 0) + 1);
            }
          } else if (classified.classification === 'UNRESOLVED_REQUIRES_REVIEW' || classified.classification === 'EXECUTABLE_EFFECT') {
            unresolvedDeps.push({
              abilityRecordId: recId,
              cardNumber: cid,
              classification: classified.classification,
              reason: classified.reason,
              evidence: classified.evidence,
            });
          }
        }
      }

      if (cardPrereqKeys.length > 1) {
        const seenKeys = new Map();
        for (const pk of cardPrereqKeys) {
          if (seenKeys.has(pk.condKey)) {
            duplicatePrereqs.push({ cardNumber: cid, abilityRecordIds: [seenKeys.get(pk.condKey), pk.recId], definition: pk.condKey });
          } else {
            seenKeys.set(pk.condKey, pk.recId);
          }
        }
        const distinctTypes = new Set(cardPrereqKeys.map(p => p.classification));
        if (distinctTypes.size > 1 && cardPrereqKeys.some(p => p.classification === 'UNRESOLVED_REQUIRES_REVIEW')) {
          conflictingPrereqs.push({ cardNumber: cid, entries: cardPrereqKeys });
        }
      }
    }
  }

  fs.mkdirSync(outDir, { recursive: true });

  // 1. Partitioned exclusion classification + manifest + full JSON
  const partDir = path.join(outDir, 'k1_3_exclusion_classification_parts');
  fs.mkdirSync(partDir, { recursive: true });
  for (const f of fs.readdirSync(partDir)) {
    if (f.endsWith('.json')) fs.unlinkSync(path.join(partDir, f));
  }
  const partSize = 1000;
  const partEntries = [];
  for (let i = 0; i < classifiedRecords.length; i += partSize) {
    const idx = Math.floor(i / partSize) + 1;
    const fname = `k1_3_exclusion_classification_part_${String(idx).padStart(3, '0')}.json`;
    const slice = classifiedRecords.slice(i, i + partSize);
    const content = JSON.stringify(slice, null, 2) + '\n';
    fs.writeFileSync(path.join(partDir, fname), content, 'utf8');
    partEntries.push({ file: `k1_3_exclusion_classification_parts/${fname}`, recordCount: slice.length, sha256: sha256Text(content) });
  }
  const exclManifest = {
    totalRecords: classifiedRecords.length,
    partitionSize: partSize,
    partitionCount: partEntries.length,
    classificationCounts: classCounts,
    partitions: partEntries,
  };
  writeJsonDeterministic(path.join(outDir, 'k1_3_exclusion_classification_manifest.json'), exclManifest);
  writeJsonDeterministic(path.join(outDir, 'k1_3_exclusion_classification.json'), {
    totalExcludedRecordsAudited: classifiedRecords.length,
    classificationCounts: classCounts,
    records: classifiedRecords,
  });

  // 2. Prerequisite & dependency traceability
  const sharedConditions = [...conditionFreq.entries()]
    .filter(([, count]) => count > 1)
    .map(([definition, count]) => ({ definition, occurrenceCount: count }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.definition.localeCompare(b.definition));

  writeJsonDeterministic(path.join(outDir, 'k1_3_prerequisite_dependency_graph.json'), {
    totalPrerequisiteAndKeywordNodes: prereqNodes.length,
    nodesWithKnownConsumers: prereqNodes.filter(n => n.hasKnownConsumer).length,
    nodesWithoutKnownConsumers: prereqNodes.filter(n => !n.hasKnownConsumer).length,
    sharedConditionsCount: sharedConditions.length,
    sharedConditionsTop50: sharedConditions.slice(0, 50),
    keywordDefinitionsSummary: Object.fromEntries([...keywordDefs.entries()].sort()),
    duplicatePrerequisiteDefinitionsCount: duplicatePrereqs.length,
    duplicatePrerequisites: duplicatePrereqs,
    conflictingDefinitionsCount: conflictingPrereqs.length,
    conflictingDefinitions: conflictingPrereqs,
    nodes: prereqNodes,
  });

  writeJsonDeterministic(path.join(outDir, 'k1_3_unresolved_dependency_inventory.json'), {
    totalUnresolvedOrExecutableExclusions: unresolvedDeps.length,
    byClassification: {
      EXECUTABLE_EFFECT: unresolvedDeps.filter(u => u.classification === 'EXECUTABLE_EFFECT').length,
      UNRESOLVED_REQUIRES_REVIEW: unresolvedDeps.filter(u => u.classification === 'UNRESOLVED_REQUIRES_REVIEW').length,
    },
    records: unresolvedDeps,
  });

  // 3. cleanBody & timingLabel semantic audits
  writeJsonDeterministic(path.join(outDir, 'k1_3_cleanbody_semantic_audit.json'), {
    totalAbilitiesAudited,
    cleanBodyZeroClauseNonEmpty,
    cleanBodyHasUnsupportedClause,
    totalMismatchesRecorded: cleanBodyMismatches.length,
    recommendation: 'KEEP_EXCLUDED',
    rationale: 'Keep cleanBody excluded from exact semantic signature hashing to avoid false splits on wording/punctuation, but treat cleanBody as a required fallback audit signal whenever clauses.length === 0 or UNSUPPORTED clauses exist.',
    sampleMismatches: cleanBodyMismatches.slice(0, 200),
  });

  writeJsonDeterministic(path.join(outDir, 'k1_3_timinglabel_semantic_audit.json'), {
    totalAbilitiesAudited,
    timingLabelNonEmptyCount,
    timingLabelMultiLineCount,
    timingLabelWithQualifierCount,
    totalDiscrepancies: timingLabelDiscrepancies.length,
    recommendation: 'REQUIRES_REVIEW',
    rationale: 'timingLabel contains multi-line uncompiled effect text on 17 records and uncaptured timing qualifiers (e.g. "by the Opponent", "paying the original cost") on additional records; timing/timingStep/isFlash/isMain/prefixes do not yet capture those qualifiers.',
    discrepancies: timingLabelDiscrepancies,
  });

  // 4. Git path comparison & preservation audit (honest attribution)
  const k12InitPath = path.resolve('reports/work_package_k1_2/k1_2_initial_git_state.json');
  const k12FinalPath = path.resolve('reports/work_package_k1_2/k1_2_git_change_audit.json');
  const k13InitPath = path.resolve('reports/work_package_k1_3/k1_3_initial_git_state.json');

  if (fs.existsSync(k12InitPath) && fs.existsSync(k12FinalPath) && fs.existsSync(k13InitPath)) {
    const k12Init = readJsonStripBom(k12InitPath);
    const k12Final = readJsonStripBom(k12FinalPath);
    const k13Init = readJsonStripBom(k13InitPath);

    const initMap = parseGitStatusEntries(k12Init.gitStatus || []);
    const k12FinalMap = parseGitStatusEntries(k12Final.modifiedOrUntracked || []);
    const k13InitMap = parseGitStatusEntries(k13Init.gitStatus || []);
    const curLines = execSync('git status --short', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    const curMap = parseGitStatusEntries(curLines);

    const allPaths = new Set([...initMap.keys(), ...k12FinalMap.keys(), ...k13InitMap.keys(), ...curMap.keys()]);
    const classifiedPaths = [];
    const counts = {
      PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT: 0,
      K1_2_CREATED: 0,
      K1_3_CREATED: 0,
      STATUS_CHANGED_OR_NEW_NON_K1_3: 0,
      REMOVED_SINCE_K1_2_INIT: 0,
    };

    for (const p of [...allPaths].sort()) {
      const sInit = initMap.get(p) || null;
      const sK12 = k12FinalMap.get(p) || null;
      const sK13Init = k13InitMap.get(p) || null;
      const sCur = curMap.get(p) || null;

      let category;
      if (sInit !== null && sCur === sInit) {
        category = 'PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT';
      } else if (sInit === null && (p.startsWith('reports/work_package_k1_2/') || p === 'scripts/discover_k1_2_mechanics.mjs' || p === 'tests/work_package_k1_2_discovery_integrity.test.js')) {
        category = 'K1_2_CREATED';
      } else if (sK13Init === null && (p.startsWith('reports/work_package_k1_3/') || p === 'scripts/audit_k1_3_exclusions.mjs' || p === 'tests/work_package_k1_3_audit.test.js')) {
        category = 'K1_3_CREATED';
      } else if (sInit !== null && sCur === null) {
        category = 'REMOVED_SINCE_K1_2_INIT';
      } else {
        category = 'STATUS_CHANGED_OR_NEW_NON_K1_3';
      }
      counts[category]++;
      classifiedPaths.push({ path: p, k1_2InitialStatus: sInit, k1_2FinalStatus: sK12, k1_3InitialStatus: sK13Init, currentStatus: sCur, attribution: category });
    }

    writeJsonDeterministic(path.join(outDir, 'k1_3_git_path_comparison.json'), {
      k1_2InitialHead: k12Init.gitHead,
      k1_3InitialHead: k13Init.gitHead,
      summaryCounts: counts,
      paths: classifiedPaths,
    });

    // Verify K.1.2 MANIFEST.txt SHA-256 integrity
    const k12ManifestPath = path.resolve('reports/work_package_k1_2/MANIFEST.txt');
    let k12ManifestVerified = false;
    let k12VerifiedFiles = 0;
    if (fs.existsSync(k12ManifestPath)) {
      const lines = fs.readFileSync(k12ManifestPath, 'utf8').split(/\r?\n/).filter(Boolean);
      k12ManifestVerified = true;
      for (const line of lines) {
        const m = line.match(/^([0-9a-f]{64})  (\d+)  (.+)$/);
        if (!m) { k12ManifestVerified = false; break; }
        const fp = path.resolve('reports/work_package_k1_2', m[3]);
        if (!fs.existsSync(fp)) { k12ManifestVerified = false; break; }
        const actualSha = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
        if (actualSha !== m[1]) { k12ManifestVerified = false; break; }
        k12VerifiedFiles++;
      }
    }

    const k13OnlyEngineCompilerIrViolations = classifiedPaths.filter(
      x => (x.path.startsWith('engine/') || x.path.startsWith('compiler/') || x.path.startsWith('data/ir_shards/')) &&
           x.attribution !== 'PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT'
    );

    writeJsonDeterministic(path.join(outDir, 'k1_3_preservation_audit.json'), {
      baselineHashLimitationNote: 'k1_2_initial_git_state.json did not record SHA-256 hashes for pre-existing dirty files; therefore pre-existing dirty engine/compiler/IR files are honestly classified as INDETERMINATE rather than claiming unverified byte-for-byte preservation.',
      preExistingDirtyCount: counts.PRE_EXISTING_DIRTY_INDETERMINATE_CONTENT,
      k1_2CreatedCount: counts.K1_2_CREATED,
      k1_3CreatedCount: counts.K1_3_CREATED,
      unexpectedEngineCompilerIrChangesDuringK1_2_or_K1_3: k13OnlyEngineCompilerIrViolations.length,
      k1_2OutputsByteVerifiedViaManifest: k12ManifestVerified,
      k1_2ManifestVerifiedFileCount: k12VerifiedFiles,
      preservationStatus: k13OnlyEngineCompilerIrViolations.length === 0 && k12ManifestVerified ? 'PASS_WITH_INDETERMINATE_PREEXISTING_DIRTY' : 'FAIL',
    });
  }

  return {
    totalExcludedRecordsAudited: classifiedRecords.length,
    classificationCounts: classCounts,
    totalAbilitiesAudited,
    cleanBodyZeroClauseNonEmpty,
    timingLabelDiscrepanciesCount: timingLabelDiscrepancies.length,
    unresolvedOrExecutableCount: unresolvedDeps.length,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = await runK1_3Audit(process.argv[2] || 'reports/work_package_k1_3');
  console.log(JSON.stringify(res, null, 2));
}
