import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseConditionToStructured } from '../engine/conditions.js';
import {
  normalizeWhitespaceOnly,
  canonicalizeIrValue,
  buildStructuralSignature,
  classifyClauseSixDimensions,
} from './discover_k1_1_mechanics.mjs';

export const INCLUDED_HEADER_PROPERTIES = [
  'timing',
  'timings',
  'timingStep',
  'levels',
  'levelExplicit',
  'prefixes',
  'limit',
  'limitCount',
  'cantStack',
  'isOptional',
  'isFlash',
  'isMain',
  'keyword',
  'burstCondition',
  'condition',
];

export const EXCLUDED_HEADER_PROPERTIES = [
  {
    property: 'cleanBody',
    reason: 'Raw cleaned English card text (display/source metadata); structural IR clauses and behavioral header fields capture execution semantics without splitting on punctuation/wording.',
  },
  {
    property: 'timingLabel',
    reason: 'Human-readable display label for timing; behavioral timing semantics are captured by timing, timingStep, isFlash, isMain, and prefixes.',
  },
];

export function buildExactSemanticSignatureV2(ability) {
  const header = ability?.header || {};
  const semanticHeader = canonicalizeIrValue({
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
  });

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
  const semanticPatternId = 'K12-SEM-' + crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  return { semanticPatternId, signature };
}

export function auditConditionValue(rawCond, evaluatedCondTypes) {
  if (rawCond === undefined || rawCond === null || rawCond === '') {
    return { present: false, status: 'NONE', parsedType: null, hasFailure: false };
  }
  if (typeof rawCond === 'string') {
    const parsed = parseConditionToStructured(rawCond);
    if (!parsed || !parsed.type) {
      return { present: true, status: 'PARSE_FAILURE', parsedType: null, hasFailure: true, rawSample: rawCond };
    }
    if (!evaluatedCondTypes.has(parsed.type)) {
      return { present: true, status: 'PARSED_NO_EVALUATOR', parsedType: parsed.type, hasFailure: true, rawSample: rawCond };
    }
    return { present: true, status: 'PARSED_EVALUABLE', parsedType: parsed.type, hasFailure: false };
  }
  if (typeof rawCond === 'object') {
    if (rawCond.type && evaluatedCondTypes.has(rawCond.type)) {
      return { present: true, status: 'STRUCTURED_EVALUABLE', parsedType: rawCond.type, hasFailure: false };
    }
    if (rawCond.type && !evaluatedCondTypes.has(rawCond.type)) {
      return { present: true, status: 'STRUCTURED_NO_EVALUATOR', parsedType: rawCond.type, hasFailure: true, rawSample: JSON.stringify(rawCond) };
    }
    return { present: true, status: 'STRUCTURED_UNTYPED_OR_UNRESOLVED', parsedType: null, hasFailure: true, rawSample: JSON.stringify(rawCond) };
  }
  return { present: true, status: 'INVALID_TYPE', parsedType: null, hasFailure: true, rawSample: String(rawCond) };
}

function getReleaseFamily(shardFilename) {
  const base = shardFilename.replace(/\.json$/i, '');
  const m = base.match(/^([A-Za-z]+|\d+[A-Za-z]+)/);
  return m ? m[1].toUpperCase() : 'OTHER';
}

function writeJsonDeterministic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function writePartitionedDataset(dirPath, prefix, items, partitionSize = 2000) {
  fs.mkdirSync(dirPath, { recursive: true });
  for (const old of fs.readdirSync(dirPath)) {
    if (old.endsWith('.json')) fs.unlinkSync(path.join(dirPath, old));
  }
  const partitions = [];
  for (let i = 0; i < items.length; i += partitionSize) {
    const partIdx = Math.floor(i / partitionSize) + 1;
    const filename = `${prefix}_part_${String(partIdx).padStart(3, '0')}.json`;
    const slice = items.slice(i, i + partitionSize);
    const fullPath = path.join(dirPath, filename);
    const content = JSON.stringify(slice, null, 2) + '\n';
    fs.writeFileSync(fullPath, content, 'utf8');
    const sha256 = crypto.createHash('sha256').update(content).digest('hex');
    partitions.push({ file: filename, recordCount: slice.length, sha256 });
  }
  const manifest = {
    dataset: prefix,
    totalRecords: items.length,
    partitionSize,
    partitionCount: partitions.length,
    partitions,
  };
  writeJsonDeterministic(path.join(dirPath, 'manifest.json'), manifest);
  return manifest;
}

export async function runK1_2Discovery(outDir = 'reports/work_package_k1_2', options = {}) {
  const shardDir = path.resolve(options.shardDir || 'data/ir_shards');
  const opsSrc = fs.readFileSync('engine/ops/index.js', 'utf8');
  const implementedOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));
  const condSrc = fs.readFileSync('engine/conditions.js', 'utf8');
  const evaluatedCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));

  const coreBatchOps = new Set(['DRAW', 'BP_BUFF', 'BP_DEBUFF', 'DESTROY', 'BOUNCE', 'EXHAUST', 'REFRESH', 'MOVE_CORE']);
  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();

  const headerPropertyStats = new Map();
  const condAudit = {
    totalConditionInstances: 0,
    byLocation: {
      'header.condition': { total: 0, evaluable: 0, failures: 0, byStatus: {} },
      'clause.condition': { total: 0, evaluable: 0, failures: 0, byStatus: {} },
      'clause.op.condition': { total: 0, evaluable: 0, failures: 0, byStatus: {} },
    },
    byParsedType: {},
    failurePatterns: new Map(),
    abilitiesWithHeaderCondFail: 0,
    abilitiesWithClauseCondFail: 0,
    abilitiesWithOpCondFail: 0,
    abilitiesWithAnyCondFail: 0,
  };

  const batchNames = ['K1-BATCH-01', 'K1-BATCH-02', 'K1-BATCH-03', 'K1-BATCH-04', 'K1-BATCH-05', 'EXPLICITLY_EXCLUDED'];
  const batchMetrics = Object.fromEntries(batchNames.map(b => [b, {
    abilityRecordIds: new Set(),
    physicalIds: new Set(),
    canonicalCards: new Set(),
    structuralPatternIds: new Set(),
    semanticPatternIds: new Set(),
    clauseCount: 0,
  }]));

  const abilityAssignments = [];
  const explicitExclusions = [];
  const opCounts = new Map();
  const structuralPatterns = new Map();
  const semanticPatterns = new Map();
  const canonicalCards = new Set();
  const uniquePhysicalIds = new Set();
  let totalCardRecords = 0;
  let totalAbilities = 0;
  let totalClauses = 0;

  for (const sf of shardFiles) {
    const sh = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    const relFam = getReleaseFamily(sf);

    for (const cardKey of Object.keys(sh).sort()) {
      const card = sh[cardKey];
      if (!card || !card.cardNumber) continue;
      totalCardRecords++;
      const cid = card.cardNumber;
      canonicalCards.add(cid);

      for (let abIdx = 0; abIdx < (card.abilities || []).length; abIdx++) {
        const ab = card.abilities[abIdx];
        totalAbilities++;
        const abilityRecordId = `${sf}::${cardKey}#a${abIdx}`;
        const physicalId = ab.physicalId || null;
        if (physicalId) uniquePhysicalIds.add(physicalId);

        // Header property inventory
        if (ab.header && typeof ab.header === 'object') {
          for (const [k, v] of Object.entries(ab.header)) {
            if (!headerPropertyStats.has(k)) {
              headerPropertyStats.set(k, {
                property: k,
                presentCount: 0,
                nonNullCount: 0,
                valueTypes: new Set(),
                samples: [],
                includedInSemanticSignatureV2: INCLUDED_HEADER_PROPERTIES.includes(k),
              });
            }
            const hs = headerPropertyStats.get(k);
            hs.presentCount++;
            if (v !== null && v !== undefined) {
              hs.nonNullCount++;
              hs.valueTypes.add(Array.isArray(v) ? 'array' : typeof v);
              if (hs.samples.length < 3) hs.samples.push(v);
            } else {
              hs.valueTypes.add(v === null ? 'null' : 'undefined');
            }
          }
        }

        const { structuralId, signature: strSig } = buildStructuralSignature(ab);
        const { semanticPatternId, signature: semSig } = buildExactSemanticSignatureV2(ab);

        // Condition audit across all 3 locations
        let hasHeaderCondFail = false;
        let hasClauseCondFail = false;
        let hasOpCondFail = false;

        const recordCond = (loc, res) => {
          if (!res.present) return;
          condAudit.totalConditionInstances++;
          const bLoc = condAudit.byLocation[loc];
          bLoc.total++;
          bLoc.byStatus[res.status] = (bLoc.byStatus[res.status] || 0) + 1;
          if (res.parsedType) {
            condAudit.byParsedType[res.parsedType] = (condAudit.byParsedType[res.parsedType] || 0) + 1;
          }
          if (res.hasFailure) {
            bLoc.failures++;
            const rawStr = String(res.rawSample || '');
            const norm = rawStr.replace(/\d+/g, '<N>').replace(/"[^"]+"/g, '"<STR>"').trim();
            const key = `${loc}::${res.status}::${norm}`;
            if (!condAudit.failurePatterns.has(key)) {
              condAudit.failurePatterns.set(key, { location: loc, status: res.status, normalizedPattern: norm, count: 0, sampleRaw: rawStr, sampleCards: [] });
            }
            const fp = condAudit.failurePatterns.get(key);
            fp.count++;
            if (fp.sampleCards.length < 3 && !fp.sampleCards.includes(cid)) fp.sampleCards.push(cid);
          } else {
            bLoc.evaluable++;
          }
        };

        const hdrCondRes = auditConditionValue(ab.header?.condition, evaluatedCondTypes);
        recordCond('header.condition', hdrCondRes);
        if (hdrCondRes.hasFailure) hasHeaderCondFail = true;

        const clauses = Array.isArray(ab.clauses) ? ab.clauses : [];
        let abAllVerified = true;
        let abHasIncomplete = false;
        let needsManual = false;
        const abKeywords = [];
        if (ab.header?.keyword) abKeywords.push(ab.header.keyword);
        const abOps = new Set();

        for (let clIdx = 0; clIdx < clauses.length; clIdx++) {
          const cl = clauses[clIdx];
          totalClauses++;
          const opName = cl?.op?.op || 'UNSUPPORTED';
          abOps.add(opName);
          opCounts.set(opName, (opCounts.get(opName) || 0) + 1);

          const clCondRes = auditConditionValue(cl?.condition, evaluatedCondTypes);
          recordCond('clause.condition', clCondRes);
          if (clCondRes.hasFailure) hasClauseCondFail = true;

          const opCondRes = auditConditionValue(cl?.op?.condition, evaluatedCondTypes);
          recordCond('clause.op.condition', opCondRes);
          if (opCondRes.hasFailure) hasOpCondFail = true;

          const six = classifyClauseSixDimensions(cl, card, implementedOps, evaluatedCondTypes);
          if (six.semanticVerificationStatus !== 'VERIFIED') abAllVerified = false;
          if (six.parameterStatus !== 'COMPLETE') abHasIncomplete = true;
          if (six.manualReviewStatus !== 'NONE') needsManual = true;
          if (opName === 'KEYWORD_RULE' || cl?.op?.keyword) abKeywords.push(cl?.op?.keyword || 'KEYWORD_RULE');
        }

        const abHasCondFail = hasHeaderCondFail || hasClauseCondFail || hasOpCondFail;
        if (hasHeaderCondFail) condAudit.abilitiesWithHeaderCondFail++;
        if (hasClauseCondFail) condAudit.abilitiesWithClauseCondFail++;
        if (hasOpCondFail) condAudit.abilitiesWithOpCondFail++;
        if (abHasCondFail) condAudit.abilitiesWithAnyCondFail++;

        const usesCoreOnly = clauses.length > 0 && [...abOps].every(o => coreBatchOps.has(o));

        // Secondary dependencies
        const secondaryDependencies = [];
        if (abHasCondFail) secondaryDependencies.push('K1-BATCH-02');
        if (abKeywords.length > 0) secondaryDependencies.push('K1-BATCH-03');
        if (abHasIncomplete) secondaryDependencies.push('K1-BATCH-04');
        if (needsManual) secondaryDependencies.push('K1-BATCH-05');

        // Exact disjoint primary batch assignment
        let primaryBatch;
        let exclusionReason = null;
        if (clauses.length === 0) {
          if (abHasCondFail) {
            primaryBatch = 'K1-BATCH-02';
          } else if (ab.type === 'CONDITION') {
            primaryBatch = 'EXPLICITLY_EXCLUDED';
            exclusionReason = 'CONDITION_HEADER_ONLY_NO_CLAUSES';
          } else if (abKeywords.length > 0) {
            primaryBatch = 'K1-BATCH-03';
          } else {
            primaryBatch = 'EXPLICITLY_EXCLUDED';
            exclusionReason = 'ZERO_CLAUSE_ABILITY_NO_OP';
          }
        } else if (abAllVerified && usesCoreOnly && !abHasCondFail && !abHasIncomplete) {
          primaryBatch = 'K1-BATCH-01';
        } else if (abHasCondFail) {
          primaryBatch = 'K1-BATCH-02';
        } else if (abKeywords.length > 0) {
          primaryBatch = 'K1-BATCH-03';
        } else if (abHasIncomplete) {
          primaryBatch = 'K1-BATCH-04';
        } else if (needsManual) {
          primaryBatch = 'K1-BATCH-05';
        } else if (abAllVerified && !usesCoreOnly) {
          primaryBatch = 'EXPLICITLY_EXCLUDED';
          exclusionReason = 'VERIFIED_NON_CORE_OP_OUTSIDE_BATCH_SCOPE';
        } else {
          primaryBatch = 'K1-BATCH-05';
        }

        const bm = batchMetrics[primaryBatch];
        bm.abilityRecordIds.add(abilityRecordId);
        if (physicalId) bm.physicalIds.add(physicalId);
        bm.canonicalCards.add(cid);
        bm.structuralPatternIds.add(structuralId);
        bm.semanticPatternIds.add(semanticPatternId);
        bm.clauseCount += clauses.length;

        const assignmentRec = {
          abilityRecordId,
          shard: sf,
          cardKey,
          cardNumber: cid,
          abilityIndex: abIdx,
          physicalId,
          abilityType: ab.type || 'ABILITY',
          clauseCount: clauses.length,
          structuralId,
          semanticPatternId,
          primaryBatch,
          secondaryDependencies: secondaryDependencies.filter(b => b !== primaryBatch),
          exclusionReason,
          ops: [...abOps],
          hasCondFail: abHasCondFail,
        };
        abilityAssignments.push(assignmentRec);

        if (primaryBatch === 'EXPLICITLY_EXCLUDED') {
          explicitExclusions.push({
            abilityRecordId,
            cardNumber: cid,
            shard: sf,
            abilityType: ab.type || 'ABILITY',
            exclusionReason,
            keyword: ab.header?.keyword || null,
            timing: ab.header?.timing || 'PASSIVE',
            cleanBodyPreview: normalizeWhitespaceOnly(ab.header?.cleanBody || '').slice(0, 120),
          });
        }

        if (!structuralPatterns.has(structuralId)) {
          structuralPatterns.set(structuralId, { structuralId, signature: strSig, abilityCount: 0, canonicalCards: new Set() });
        }
        const sp = structuralPatterns.get(structuralId);
        sp.abilityCount++;
        sp.canonicalCards.add(cid);

        if (!semanticPatterns.has(semanticPatternId)) {
          semanticPatterns.set(semanticPatternId, { semanticPatternId, signature: semSig, abilityCount: 0, canonicalCards: new Set() });
        }
        const smp = semanticPatterns.get(semanticPatternId);
        smp.abilityCount++;
        smp.canonicalCards.add(cid);
      }
    }
  }

  fs.mkdirSync(outDir, { recursive: true });

  // 1. Header property inventory & semantic header completeness audit
  const headerInventoryList = [...headerPropertyStats.values()]
    .map(h => ({
      property: h.property,
      presentCount: h.presentCount,
      nonNullCount: h.nonNullCount,
      valueTypes: [...h.valueTypes].sort(),
      samples: h.samples,
      includedInSemanticSignatureV2: h.includedInSemanticSignatureV2,
    }))
    .sort((a, b) => a.property.localeCompare(b.property));

  writeJsonDeterministic(path.join(outDir, 'header_property_inventory.json'), {
    totalAbilitiesAudited: totalAbilities,
    distinctHeaderPropertyCount: headerInventoryList.length,
    properties: headerInventoryList,
  });

  writeJsonDeterministic(path.join(outDir, 'semantic_header_completeness_audit.json'), {
    totalAbilitiesAudited: totalAbilities,
    includedProperties: INCLUDED_HEADER_PROPERTIES,
    excludedMetadataProperties: EXCLUDED_HEADER_PROPERTIES,
    unaccountedHeaderProperties: headerInventoryList
      .map(h => h.property)
      .filter(p => !INCLUDED_HEADER_PROPERTIES.includes(p) && !EXCLUDED_HEADER_PROPERTIES.some(e => e.property === p)),
    k1_1SemanticPatternCount: 18395,
    k1_2SemanticPatternCount: semanticPatterns.size,
    newlyDifferentiatedPatternsDelta: semanticPatterns.size - 18395,
  });

  // 2. Condition location audit & updated condition classification
  const failurePatternsList = [...condAudit.failurePatterns.values()]
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location) || a.normalizedPattern.localeCompare(b.normalizedPattern));

  writeJsonDeterministic(path.join(outDir, 'condition_location_audit.json'), {
    totalConditionInstances: condAudit.totalConditionInstances,
    byLocation: condAudit.byLocation,
    abilitiesWithHeaderCondFail: condAudit.abilitiesWithHeaderCondFail,
    abilitiesWithClauseCondFail: condAudit.abilitiesWithClauseCondFail,
    abilitiesWithOpCondFail: condAudit.abilitiesWithOpCondFail,
    abilitiesWithAnyCondFail: condAudit.abilitiesWithAnyCondFail,
  });

  writeJsonDeterministic(path.join(outDir, 'updated_condition_classification.json'), {
    evaluatedConditionTypesCount: evaluatedCondTypes.size,
    byParsedType: condAudit.byParsedType,
    failurePatternCount: failurePatternsList.length,
    failurePatterns: failurePatternsList,
  });

  // 3. Batch reconciliation & coverage
  const batchBreakdown = {};
  let reconciledAbilitySum = 0;
  for (const b of batchNames) {
    const m = batchMetrics[b];
    reconciledAbilitySum += m.abilityRecordIds.size;
    batchBreakdown[b] = {
      uniqueAbilityRecords: m.abilityRecordIds.size,
      uniquePhysicalIds: m.physicalIds.size,
      uniqueCanonicalCards: m.canonicalCards.size,
      uniqueStructuralPatterns: m.structuralPatternIds.size,
      uniqueSemanticPatterns: m.semanticPatternIds.size,
      totalClauses: m.clauseCount,
      percentageOfTotalAbilities: Number(((m.abilityRecordIds.size / totalAbilities) * 100).toFixed(4)),
    };
  }

  const assignmentManifest = writePartitionedDataset(
    path.join(outDir, 'k1_2_ability_batch_assignments'),
    'k1_2_ability_batch_assignments',
    abilityAssignments,
    4000
  );

  writeJsonDeterministic(path.join(outDir, 'batch_reconciliation_report.json'), {
    totalShards: shardFiles.length,
    totalCardRecords,
    uniqueCanonicalCards: canonicalCards.size,
    totalAbilityRecords: totalAbilities,
    uniquePhysicalIds: uniquePhysicalIds.size,
    totalClauses,
    reconciledAbilitySum,
    missingAbilityCount: totalAbilities - reconciledAbilitySum,
    duplicateAssignmentsCount: abilityAssignments.length - reconciledAbilitySum,
    reconciliationExact: reconciledAbilitySum === totalAbilities && abilityAssignments.length === totalAbilities,
    assignmentDatasetManifest: assignmentManifest,
    batches: batchBreakdown,
  });

  const exclusionReasonsSummary = {};
  for (const ex of explicitExclusions) {
    exclusionReasonsSummary[ex.exclusionReason] = (exclusionReasonsSummary[ex.exclusionReason] || 0) + 1;
  }
  writeJsonDeterministic(path.join(outDir, 'explicit_exclusion_inventory.json'), {
    totalExplicitlyExcluded: explicitExclusions.length,
    byReason: exclusionReasonsSummary,
    records: explicitExclusions,
  });

  writeJsonDeterministic(path.join(outDir, 'updated_batch_coverage_calculations.json'), {
    totalAbilityRecords: totalAbilities,
    uniqueCanonicalCards: canonicalCards.size,
    totalClauses,
    totalStructuralPatterns: structuralPatterns.size,
    totalSemanticPatterns: semanticPatterns.size,
    batches: batchBreakdown,
  });

  writeJsonDeterministic(path.join(outDir, 'operation_and_dependency_summaries.json'), {
    distinctOpsCount: opCounts.size,
    ops: [...opCounts.entries()].map(([op, clauseCount]) => ({
      op,
      clauseCount,
      hasRuntimeHandler: implementedOps.has(op),
      inCoreBatch: coreBatchOps.has(op),
    })).sort((a, b) => b.clauseCount - a.clauseCount || a.op.localeCompare(b.op)),
  });

  // Partitioned pattern catalogues
  writePartitionedDataset(
    path.join(outDir, 'k1_2_structural_pattern_catalogue'),
    'k1_2_structural_pattern_catalogue',
    [...structuralPatterns.values()].map(p => ({ ...p, canonicalCardCount: p.canonicalCards.size, canonicalCards: [...p.canonicalCards].sort() })).sort((a, b) => b.abilityCount - a.abilityCount || a.structuralId.localeCompare(b.structuralId)),
    2000
  );
  writePartitionedDataset(
    path.join(outDir, 'k1_2_semantic_pattern_catalogue'),
    'k1_2_semantic_pattern_catalogue',
    [...semanticPatterns.values()].map(p => ({ ...p, canonicalCardCount: p.canonicalCards.size, canonicalCards: [...p.canonicalCards].sort() })).sort((a, b) => b.abilityCount - a.abilityCount || a.semanticPatternId.localeCompare(b.semanticPatternId)),
    2000
  );

  return {
    totalShards: shardFiles.length,
    totalCardRecords,
    uniqueCanonicalCards: canonicalCards.size,
    totalAbilityRecords: totalAbilities,
    uniquePhysicalIds: uniquePhysicalIds.size,
    reconciledAbilitySum,
    reconciliationExact: reconciledAbilitySum === totalAbilities,
    semanticPatternCount: semanticPatterns.size,
    structuralPatternCount: structuralPatterns.size,
    batchBreakdown,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = await runK1_2Discovery(process.argv[2] || 'reports/work_package_k1_2');
  console.log(JSON.stringify(res, null, 2));
}
