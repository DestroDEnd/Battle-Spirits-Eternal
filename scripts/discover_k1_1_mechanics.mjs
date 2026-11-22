/**
 * scripts/discover_k1_1_mechanics.mjs
 *
 * Package K.1.1 — Corrected Full-Database Discovery, Exact Semantic Canonicalization,
 * 6-Dimensional Support/Verification Classification, Complete Partitioned Catalogues,
 * Card->Ability->Clause->Pattern Traceability, and Reproducible Batch Recalculation.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createDefaultKeywordRegistry } from '../engine/keywords/index.js';
import { parseConditionToStructured } from '../engine/conditions.js';
import { classifyOperation } from './audit_514_cards_exhaustive.mjs';
import { OPERATION_EVIDENCE_REGISTRY, OPERATION_CONTRACTS, MANUAL_REVIEW_REASONS } from './evidence_registry.mjs';

export function normalizeWhitespaceOnly(val) {
  return typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;
}

export function canonicalizeIrValue(val) {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === 'string') return normalizeWhitespaceOnly(val);
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(canonicalizeIrValue);
  const out = {};
  for (const k of Object.keys(val).sort()) {
    const cv = canonicalizeIrValue(val[k]);
    if (cv !== undefined) out[k] = cv;
  }
  return out;
}

export function buildStructuralSignature(ability) {
  const header = ability?.header || {};
  const clauses = (ability?.clauses || []).map(cl => ({
    op: cl?.op?.op || 'UNSUPPORTED',
    link: cl?.link || null,
    isCost: Boolean(cl?.isCost),
    isOptional: Boolean(cl?.isOptional),
    hasCondition: Boolean(cl?.condition || cl?.op?.condition),
    targetSide: cl?.op?.target?.side || cl?.op?.side || (typeof cl?.op?.target === 'string' ? cl.op.target : null),
  }));
  const signature = {
    timing: String(header.timing || 'PASSIVE').toUpperCase(),
    clauses,
  };
  const hash = crypto.createHash('sha256').update(JSON.stringify(signature)).digest('hex').slice(0, 16);
  return { structuralId: `STR-${hash}`, signature };
}

export function buildExactSemanticSignature(ability) {
  const header = ability?.header || {};
  const semanticHeader = canonicalizeIrValue({
    timing: String(header.timing || 'PASSIVE').toUpperCase(),
    timings: Array.isArray(header.timings) ? header.timings : [],
    timingStep: header.timingStep || 'ANY',
    levels: Array.isArray(header.levels) ? header.levels : [],
    limit: header.limit || null,
    limitCount: header.limitCount ?? null,
    cantStack: Boolean(header.cantStack),
    isOptional: Boolean(header.isOptional),
    burstCondition: header.burstCondition || null,
    condition: header.condition || null,
    keyword: header.keyword || null,
  });

  const semanticClauses = (ability?.clauses || []).map(cl => canonicalizeIrValue({
    link: cl?.link || null,
    isOptional: Boolean(cl?.isOptional),
    isCost: Boolean(cl?.isCost),
    condition: cl?.condition || null,
    duration: cl?.duration || null,
    op: cl?.op || { op: 'UNSUPPORTED' },
  }));

  const signature = {
    header: semanticHeader,
    clauses: semanticClauses,
  };
  const canonicalJson = JSON.stringify(signature);
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex').slice(0, 16);
  return { semanticPatternId: `SEM-${hash}`, signature, canonicalJson };
}

export function classifyClauseSixDimensions(cl, card, implementedOps, evaluatedCondTypes) {
  const opObj = cl?.op || null;
  const opName = opObj?.op || 'UNSUPPORTED';

  // A. Parsing Status
  let parsingStatus = 'PARSED';
  if (!opObj || opName === 'UNSUPPORTED') parsingStatus = 'PARSE_FAILED';
  else if (cl.condition && (!parseConditionToStructured(cl.condition)?.type || !evaluatedCondTypes.has(parseConditionToStructured(cl.condition).type))) {
    parsingStatus = 'PARTIALLY_PARSED';
  }

  // Classify via strict audit_514_cards_exhaustive
  const auditCls = classifyOperation(opObj, { rawText: cl?.rawText, clause: cl, card });

  // B. Parameter Status
  let parameterStatus = 'COMPLETE';
  if (opName === 'UNSUPPORTED') parameterStatus = 'NOT_APPLICABLE';
  else if (auditCls.status === 'PARAMETERS_INCOMPLETE') parameterStatus = 'INCOMPLETE';
  else if (auditCls.reviewReason === MANUAL_REVIEW_REASONS.UNVERIFIED_TARGET_SEMANTICS) parameterStatus = 'AMBIGUOUS';

  // C. Runtime Implementation Status
  let runtimeImplStatus = 'HANDLER_MISSING';
  if (opName === 'UNSUPPORTED') runtimeImplStatus = 'NOT_APPLICABLE';
  else if (implementedOps.has(opName)) runtimeImplStatus = 'HANDLER_PRESENT';

  // D. Runtime Support Status
  let runtimeSupportStatus = 'UNSUPPORTED';
  if (opName === 'UNSUPPORTED' || !implementedOps.has(opName)) runtimeSupportStatus = 'UNSUPPORTED';
  else if (auditCls.status === 'PARAMETERS_INCOMPLETE') runtimeSupportStatus = 'BLOCKED';
  else if (auditCls.status === 'PARTIALLY_SUPPORTED') runtimeSupportStatus = 'PARTIALLY_SUPPORTED';
  else if (parsingStatus === 'PARTIALLY_PARSED') runtimeSupportStatus = 'CONTEXT_DEPENDENT';
  else runtimeSupportStatus = 'SUPPORTED';

  // E. Semantic Verification Status (strict variant verification; NEVER infer from handler presence)
  let semanticVerificationStatus = 'UNVERIFIED';
  if (opName === 'UNSUPPORTED') semanticVerificationStatus = 'NOT_APPLICABLE';
  else if (auditCls.status === 'SEMANTICALLY_VERIFIED') semanticVerificationStatus = 'VERIFIED';
  else if (auditCls.status === 'PARTIALLY_SUPPORTED') semanticVerificationStatus = 'PARTIALLY_VERIFIED';

  // F. Manual Review Status
  let manualReviewStatus = 'NOT_REQUIRED';
  if (
    parsingStatus !== 'PARSED' ||
    parameterStatus !== 'COMPLETE' ||
    semanticVerificationStatus !== 'VERIFIED' ||
    auditCls.status === 'NEEDS_MANUAL_REVIEW'
  ) {
    manualReviewStatus = 'REQUIRED';
  }

  return {
    parsingStatus,
    parameterStatus,
    runtimeImplStatus,
    runtimeSupportStatus,
    semanticVerificationStatus,
    manualReviewStatus,
    auditClassification: auditCls.status,
    variant: auditCls.variant,
    reviewReason: auditCls.reviewReason || null,
  };
}

function writePartitionedDataset(baseDir, datasetName, records, chunkSize = 2000) {
  fs.mkdirSync(baseDir, { recursive: true });
  // Clear old partition files cleanly
  for (const f of fs.readdirSync(baseDir)) {
    if (f.endsWith('.json')) fs.unlinkSync(path.join(baseDir, f));
  }
  const parts = [];
  let totalRecords = 0;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const partIdx = Math.floor(i / chunkSize) + 1;
    const fileName = `part_${String(partIdx).padStart(4, '0')}.json`;
    const filePath = path.join(baseDir, fileName);
    const payload = JSON.stringify(chunk, null, 2);
    fs.writeFileSync(filePath, payload, 'utf8');
    const buf = fs.readFileSync(filePath);
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    parts.push({
      file: fileName,
      count: chunk.length,
      sizeBytes: buf.length,
      sha256,
    });
    totalRecords += chunk.length;
  }
  const manifest = {
    datasetName,
    generatedAt: new Date().toISOString(),
    totalRecords,
    partCount: parts.length,
    chunkSize,
    parts,
  };
  fs.writeFileSync(path.join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

function getReleaseFamily(shardFile) {
  const s = String(shardFile).replace(/\.json$/i, '');
  if (/^BS\d+|^26RBS/i.test(s)) return 'Main Booster';
  if (/^SD\d+|^26RSD|^DB\d+|^26RDB/i.test(s)) return 'Starter / Build Deck';
  if (/^CB\d+|^26RCB/i.test(s)) return 'Collaboration Booster';
  if (/^BSC\d+|^CP\d+|^EX/i.test(s)) return 'Extra / Theme Booster';
  if (/^PB|^PC|^PX|^LM/i.test(s)) return 'Premium Bandai / Box Set';
  return 'Promotional / Special Release';
}

export function runK1_1Discovery(outDir = path.resolve('reports/work_package_k1_1')) {
  fs.mkdirSync(outDir, { recursive: true });
  const shardDir = path.resolve('data/ir_shards');
  const detailedMap = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));
  const kwRegistryEngine = createDefaultKeywordRegistry();
  const engineKwNames = new Set(
    [...(kwRegistryEngine.keywords?.keys ? kwRegistryEngine.keywords.keys() : Object.keys(kwRegistryEngine.keywords || {}))].map(k => String(k).toLowerCase())
  );
  const opsSrc = fs.readFileSync('engine/ops/index.js', 'utf8');
  const implementedOps = new Set([...opsSrc.matchAll(/case\s+'([A-Z0-9_]+)'\s*:/g)].map(m => m[1]));
  const condSrc = fs.readFileSync('engine/conditions.js', 'utf8');
  const evaluatedCondTypes = new Set([...condSrc.matchAll(/case\s+CONDITION_TYPES\.([A-Z0-9_]+)\s*:/g)].map(m => m[1]));

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith('.json')).sort();

  let totalCardRecords = 0;
  let totalAbilities = 0;
  let totalClauses = 0;
  const canonicalCards = new Set();
  const releaseCards = {};
  const releaseAbilities = {};

  const structuralPatterns = new Map();
  const semanticPatterns = new Map();
  const cardAbilityMappings = [];
  const manualReviewRecords = [];

  const dimStats = {
    parsingStatus: {},
    parameterStatus: {},
    runtimeImplStatus: {},
    runtimeSupportStatus: {},
    semanticVerificationStatus: {},
    manualReviewStatus: {},
  };

  const opSummary = new Map();
  const kwSummary = new Map();
  const condSummary = {
    totalInstances: 0,
    byLocation: { 'header.condition': 0, 'clause.condition': 0, 'clause.op.condition': 0 },
    byStatus: { PARSED_EVALUABLE: 0, PARSE_FAILURE: 0 },
    byType: {},
    failurePatterns: new Map(),
  };

  // Unique ability ID sets for accurate batch recalculation
  const batchAbilitySets = {
    B1_VERIFIED_CORE_OPS: new Set(),
    B2_CONDITION_EXPANSION: new Set(),
    B3_KEYWORDS: new Set(),
    B4_INCOMPLETE_PARAMS: new Set(),
    B5_COMPLEX_AND_UNVERIFIED: new Set(),
  };
  const batchCardSets = {
    B1_VERIFIED_CORE_OPS: new Set(),
    B2_CONDITION_EXPANSION: new Set(),
    B3_KEYWORDS: new Set(),
    B4_INCOMPLETE_PARAMS: new Set(),
    B5_COMPLEX_AND_UNVERIFIED: new Set(),
  };
  const coreBatchOps = new Set(['DRAW', 'BP_BUFF', 'BP_DEBUFF', 'DESTROY', 'BOUNCE', 'EXHAUST', 'REFRESH', 'MOVE_CORE']);

  for (const sf of shardFiles) {
    const sh = JSON.parse(fs.readFileSync(path.join(shardDir, sf), 'utf8'));
    const relFam = getReleaseFamily(sf);

    for (const cardKey of Object.keys(sh).sort()) {
      const card = sh[cardKey];
      if (!card || !card.cardNumber) continue;
      totalCardRecords++;
      const cid = card.cardNumber;
      canonicalCards.add(cid);
      releaseCards[relFam] = (releaseCards[relFam] || 0) + 1;

      const det = detailedMap[cid] || {};
      const mappedAbilities = [];

      for (let abIdx = 0; abIdx < (card.abilities || []).length; abIdx++) {
        const ab = card.abilities[abIdx];
        totalAbilities++;
        releaseAbilities[relFam] = (releaseAbilities[relFam] || 0) + 1;
        const abId = ab.physicalId || ab.id || `${cid}#a${abIdx}`;
        const timing = String(ab.header?.timing || 'PASSIVE').toUpperCase();

        const { structuralId, signature: strSig } = buildStructuralSignature(ab);
        const { semanticPatternId, signature: semSig } = buildExactSemanticSignature(ab);

        // Header condition audit
        if (ab.header?.condition && typeof ab.header.condition === 'string') {
          condSummary.totalInstances++;
          condSummary.byLocation['header.condition']++;
          const p = parseConditionToStructured(ab.header.condition);
          if (p && p.type && evaluatedCondTypes.has(p.type)) {
            condSummary.byStatus.PARSED_EVALUABLE++;
            condSummary.byType[p.type] = (condSummary.byType[p.type] || 0) + 1;
          } else {
            condSummary.byStatus.PARSE_FAILURE++;
          }
        }

        const mappedClauses = [];
        const abOpDeps = new Set();
        const abCondDeps = new Set();
        const abMissingParams = [];
        const abReviewReasons = new Set();
        let abAllVerified = true;
        let abHasIncomplete = false;
        let abHasCondFail = false;

        for (let clIdx = 0; clIdx < (ab.clauses || []).length; clIdx++) {
          const cl = ab.clauses[clIdx];
          totalClauses++;
          const clId = `${abId}#c${clIdx}`;
          const opName = cl.op?.op || 'UNSUPPORTED';
          abOpDeps.add(opName);

          const six = classifyClauseSixDimensions(cl, card, implementedOps, evaluatedCondTypes);
          for (const k of Object.keys(dimStats)) {
            dimStats[k][six[k]] = (dimStats[k][six[k]] || 0) + 1;
          }

          if (six.semanticVerificationStatus !== 'VERIFIED') abAllVerified = false;
          if (six.parameterStatus === 'INCOMPLETE') {
            abHasIncomplete = true;
            abMissingParams.push({ clauseId: clId, op: opName, variant: six.variant });
          }
          if (six.manualReviewStatus === 'REQUIRED') {
            abReviewReasons.add(six.reviewReason || `${six.parsingStatus}/${six.parameterStatus}/${six.semanticVerificationStatus}`);
          }

          // Op summary
          if (!opSummary.has(opName)) {
            opSummary.set(opName, {
              op: opName,
              handlerPresent: implementedOps.has(opName),
              registeredInEvidence: Boolean(OPERATION_EVIDENCE_REGISTRY[opName]),
              hasContract: Boolean(OPERATION_CONTRACTS[opName]),
              clauseCount: 0,
              verifiedClauses: 0,
              unverifiedClauses: 0,
              incompleteClauses: 0,
              partialClauses: 0,
            });
          }
          const os = opSummary.get(opName);
          os.clauseCount++;
          if (six.semanticVerificationStatus === 'VERIFIED') os.verifiedClauses++;
          else os.unverifiedClauses++;
          if (six.parameterStatus === 'INCOMPLETE') os.incompleteClauses++;
          if (six.runtimeSupportStatus === 'PARTIALLY_SUPPORTED') os.partialClauses++;

          // Condition audit
          for (const [loc, rawCond] of [['clause.condition', cl.condition], ['clause.op.condition', cl.op?.condition]]) {
            if (!rawCond || typeof rawCond !== 'string') continue;
            condSummary.totalInstances++;
            condSummary.byLocation[loc]++;
            const p = parseConditionToStructured(rawCond);
            if (p && p.type && evaluatedCondTypes.has(p.type)) {
              condSummary.byStatus.PARSED_EVALUABLE++;
              condSummary.byType[p.type] = (condSummary.byType[p.type] || 0) + 1;
              abCondDeps.add(p.type);
            } else {
              condSummary.byStatus.PARSE_FAILURE++;
              abHasCondFail = true;
              abCondDeps.add('PARSE_FAILURE');
              const norm = rawCond.replace(/\d+/g, '<N>').replace(/"[^"]+"/g, '"<STR>"').trim();
              if (!condSummary.failurePatterns.has(norm)) {
                condSummary.failurePatterns.set(norm, { normalizedPattern: norm, count: 0, sampleRaw: rawCond, sampleCards: [] });
              }
              const fp = condSummary.failurePatterns.get(norm);
              fp.count++;
              if (fp.sampleCards.length < 3 && !fp.sampleCards.includes(cid)) fp.sampleCards.push(cid);
            }
          }

          mappedClauses.push({
            clauseId: clId,
            clauseIndex: clIdx,
            op: opName,
            classifications: six,
          });
        }

        // Keywords (from ab.keywords AND KEYWORD_RULE)
        const abKeywords = [];
        for (const kw of (ab.keywords || [])) {
          const kwName = String(kw.name || kw.keyword || kw.hook || '').trim();
          if (kwName) abKeywords.push(kwName);
        }
        for (const cl of (ab.clauses || [])) {
          if (cl.op?.op === 'KEYWORD_RULE' && cl.op.keyword) abKeywords.push(String(cl.op.keyword).trim());
        }
        for (const kwName of new Set(abKeywords)) {
          if (!kwSummary.has(kwName)) {
            kwSummary.set(kwName, { name: kwName, frequency: 0, canonicalCards: new Set(), abilities: new Set(), runtimeSupported: engineKwNames.has(kwName.toLowerCase()) });
          }
          const ks = kwSummary.get(kwName);
          ks.frequency++;
          ks.canonicalCards.add(cid);
          ks.abilities.add(abId);
        }

        // Record Structural Pattern
        if (!structuralPatterns.has(structuralId)) {
          structuralPatterns.set(structuralId, {
            structuralId,
            signature: strSig,
            abilityCount: 0,
            canonicalCards: new Set(),
            shards: new Set(),
            abilityRefs: [],
          });
        }
        const sp = structuralPatterns.get(structuralId);
        sp.abilityCount++;
        sp.canonicalCards.add(cid);
        sp.shards.add(sf);
        sp.abilityRefs.push({ cardNumber: cid, abilityId: abId, shard: sf });

        // Record Exact Semantic Pattern
        if (!semanticPatterns.has(semanticPatternId)) {
          semanticPatterns.set(semanticPatternId, {
            semanticPatternId,
            structuralId,
            signature: semSig,
            abilityCount: 0,
            canonicalCards: new Set(),
            shards: new Set(),
            allClausesVerified: abAllVerified && (ab.clauses || []).length > 0,
            abilityRefs: [],
          });
        }
        const emp = semanticPatterns.get(semanticPatternId);
        emp.abilityCount++;
        emp.canonicalCards.add(cid);
        emp.shards.add(sf);
        emp.abilityRefs.push({ cardNumber: cid, abilityId: abId, shard: sf });

        // Manual review entry (100% complete, zero truncation)
        const needsManual = (ab.clauses || []).length > 0 && (!abAllVerified || abHasIncomplete || abHasCondFail || abReviewReasons.size > 0);
        if (needsManual) {
          manualReviewRecords.push({
            cardNumber: cid,
            cardName: card.name || det.name || null,
            shard: sf,
            abilityId: abId,
            semanticId: ab.semanticId || null,
            clauseIds: mappedClauses.map(mc => mc.clauseId),
            rawText: ab.originalAbilityText || ab.clauses?.map(c => c.rawText).join(' '),
            parsedIR: ab.clauses?.map(c => c.op),
            operationDependencies: [...abOpDeps],
            conditionDependencies: [...abCondDeps],
            missingOrAmbiguousParameters: abMissingParams,
            reasons: [...abReviewReasons],
            priority: abHasIncomplete ? 'HIGH' : (abHasCondFail ? 'MEDIUM' : 'STANDARD'),
          });
        }

        // Disjoint/Accurate Batch Classification
        const usesCoreOnly = (ab.clauses || []).length > 0 && [...abOpDeps].every(o => coreBatchOps.has(o));
        if (abAllVerified && usesCoreOnly && !abHasCondFail && !abHasIncomplete) {
          batchAbilitySets.B1_VERIFIED_CORE_OPS.add(abId);
          batchCardSets.B1_VERIFIED_CORE_OPS.add(cid);
        } else if (abHasCondFail) {
          batchAbilitySets.B2_CONDITION_EXPANSION.add(abId);
          batchCardSets.B2_CONDITION_EXPANSION.add(cid);
        } else if (abKeywords.length > 0) {
          batchAbilitySets.B3_KEYWORDS.add(abId);
          batchCardSets.B3_KEYWORDS.add(cid);
        } else if (abHasIncomplete) {
          batchAbilitySets.B4_INCOMPLETE_PARAMS.add(abId);
          batchCardSets.B4_INCOMPLETE_PARAMS.add(cid);
        } else if (needsManual) {
          batchAbilitySets.B5_COMPLEX_AND_UNVERIFIED.add(abId);
          batchCardSets.B5_COMPLEX_AND_UNVERIFIED.add(cid);
        }

        mappedAbilities.push({
          abilityIndex: abIdx,
          abilityId: abId,
          physicalId: ab.physicalId || null,
          semanticId: ab.semanticId || null,
          timing,
          structuralId,
          semanticPatternId,
          keywords: [...new Set(abKeywords)],
          clauses: mappedClauses,
        });
      }

      cardAbilityMappings.push({
        shard: sf,
        cardKey,
        cardNumber: cid,
        name: card.name || det.name || null,
        releaseFamily: relFam,
        abilities: mappedAbilities,
      });
    }
  }

  // Export Partitioned Datasets with Manifests
  const strList = [...structuralPatterns.values()]
    .map(p => ({ ...p, canonicalCardCount: p.canonicalCards.size, canonicalCards: [...p.canonicalCards], shards: [...p.shards] }))
    .sort((a, b) => b.abilityCount - a.abilityCount || a.structuralId.localeCompare(b.structuralId));
  const strManifest = writePartitionedDataset(path.join(outDir, 'k1_1_structural_pattern_catalogue'), 'k1_1_structural_pattern_catalogue', strList, 2000);

  const semList = [...semanticPatterns.values()]
    .map(p => ({ ...p, canonicalCardCount: p.canonicalCards.size, canonicalCards: [...p.canonicalCards], shards: [...p.shards] }))
    .sort((a, b) => b.abilityCount - a.abilityCount || a.semanticPatternId.localeCompare(b.semanticPatternId));
  const semManifest = writePartitionedDataset(path.join(outDir, 'k1_1_semantic_pattern_catalogue'), 'k1_1_semantic_pattern_catalogue', semList, 2000);

  const mapManifest = writePartitionedDataset(path.join(outDir, 'k1_1_card_ability_clause_mapping'), 'k1_1_card_ability_clause_mapping', cardAbilityMappings, 2000);
  const mrManifest = writePartitionedDataset(path.join(outDir, 'k1_1_complete_manual_review_inventory'), 'k1_1_complete_manual_review_inventory', manualReviewRecords, 2000);

  // Write summary & classification JSONs
  fs.writeFileSync(path.join(outDir, 'k1_1_full_database_inventory.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    shards: shardFiles.length,
    totalCardRecords,
    uniqueCanonicalCards: canonicalCards.size,
    totalAbilities,
    totalClauses,
    cardRecordsByReleaseFamily: releaseCards,
    abilitiesByReleaseFamily: releaseAbilities,
  }, null, 2));

  fs.writeFileSync(path.join(outDir, 'k1_1_runtime_support_classification.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalClauses,
    dimensionTotals: dimStats,
  }, null, 2));

  const condFailArr = [...condSummary.failurePatterns.values()].sort((a, b) => b.count - a.count);
  fs.writeFileSync(path.join(outDir, 'k1_1_condition_classification.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalInstances: condSummary.totalInstances,
    byLocation: condSummary.byLocation,
    byStatus: condSummary.byStatus,
    byType: condSummary.byType,
    uniqueFailurePatterns: condFailArr.length,
    failurePatterns: condFailArr,
  }, null, 2));

  fs.writeFileSync(path.join(outDir, 'k1_1_operation_classification.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    uniqueOps: opSummary.size,
    operations: [...opSummary.values()].sort((a, b) => b.clauseCount - a.clauseCount),
  }, null, 2));

  fs.writeFileSync(path.join(outDir, 'k1_1_keyword_classification.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    uniqueKeywords: kwSummary.size,
    keywords: [...kwSummary.values()].map(k => ({
      name: k.name,
      frequency: k.frequency,
      canonicalCardCount: k.canonicalCards.size,
      abilityCount: k.abilities.size,
      runtimeSupportedInRegistry: k.runtimeSupported,
    })).sort((a, b) => b.frequency - a.frequency),
  }, null, 2));

  const batchRecalc = {
    generatedAt: new Date().toISOString(),
    methodologyNote: 'Unique deduplicated abilityId and canonical card sets; handler presence alone is never counted as verified.',
    k1OldOverstatedBatch1Estimate: 30509,
    batches: [
      {
        batchId: 'K1-BATCH-01',
        title: 'Verified Core Single/Dual-Op Abilities (DRAW, BP_BUFF, BP_DEBUFF, DESTROY, BOUNCE, EXHAUST, REFRESH, MOVE_CORE)',
        uniqueAbilities: batchAbilitySets.B1_VERIFIED_CORE_OPS.size,
        uniqueCanonicalCards: batchCardSets.B1_VERIFIED_CORE_OPS.size,
        risk: 'LOW',
      },
      {
        batchId: 'K1-BATCH-02',
        title: 'Condition Evaluator Expansion (Abilities with PARSE_FAILURE conditions)',
        uniqueAbilities: batchAbilitySets.B2_CONDITION_EXPANSION.size,
        uniqueCanonicalCards: batchCardSets.B2_CONDITION_EXPANSION.size,
        risk: 'LOW_MEDIUM',
      },
      {
        batchId: 'K1-BATCH-03',
        title: 'Keyword-Bearing Abilities (compiled keywords & KEYWORD_RULE)',
        uniqueAbilities: batchAbilitySets.B3_KEYWORDS.size,
        uniqueCanonicalCards: batchCardSets.B3_KEYWORDS.size,
        risk: 'MEDIUM',
      },
      {
        batchId: 'K1-BATCH-04',
        title: 'Incomplete-Parameter Closure (PARAMETERS_INCOMPLETE clauses)',
        uniqueAbilities: batchAbilitySets.B4_INCOMPLETE_PARAMS.size,
        uniqueCanonicalCards: batchCardSets.B4_INCOMPLETE_PARAMS.size,
        risk: 'MEDIUM',
      },
      {
        batchId: 'K1-BATCH-05',
        title: 'Remaining Unverified / Complex Multi-Clause / Replacement / Prevention Abilities',
        uniqueAbilities: batchAbilitySets.B5_COMPLEX_AND_UNVERIFIED.size,
        uniqueCanonicalCards: batchCardSets.B5_COMPLEX_AND_UNVERIFIED.size,
        risk: 'HIGH',
      },
    ],
  };
  fs.writeFileSync(path.join(outDir, 'k1_1_batch_coverage_recalculation.json'), JSON.stringify(batchRecalc, null, 2));

  const reconciliation = {
    generatedAt: new Date().toISOString(),
    shardsExpected: 514,
    shardsObserved: shardFiles.length,
    cardRecordsExpected: 15398,
    cardRecordsObserved: totalCardRecords,
    canonicalCardsExpected: 14609,
    canonicalCardsObserved: canonicalCards.size,
    abilitiesExpected: 36422,
    abilitiesObserved: totalAbilities,
    clausesExpected: 51734,
    clausesObserved: totalClauses,
    structuralPatternAbilitySum: strList.reduce((s, p) => s + p.abilityCount, 0),
    semanticPatternAbilitySum: semList.reduce((s, p) => s + p.abilityCount, 0),
    mappingCardCount: mapManifest.totalRecords,
    manualReviewAbilityCount: mrManifest.totalRecords,
    allReconciled:
      shardFiles.length === 514 &&
      totalCardRecords === 15398 &&
      canonicalCards.size === 14609 &&
      totalAbilities === 36422 &&
      totalClauses === 51734 &&
      strList.reduce((s, p) => s + p.abilityCount, 0) === 36422 &&
      semList.reduce((s, p) => s + p.abilityCount, 0) === 36422 &&
      mapManifest.totalRecords === 15398,
  };
  fs.writeFileSync(path.join(outDir, 'k1_1_reconciliation_report.json'), JSON.stringify(reconciliation, null, 2));

  fs.writeFileSync(path.join(outDir, 'k1_1_discovery_defect_audit.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    defects: [
      { id: 'K1-DEF-01', title: 'Incomplete semantic signatures merged distinct parameter values', rootCause: 'K.1 only hashed timing+op+link+targetSide', affectedRecords: totalAbilities, correction: 'Implemented separate STR- (structural) and SEM- (full RFC8785-style canonical AST) hashes.' },
      { id: 'K1-DEF-02', title: 'Truncated pattern catalogue (slice(0, 100))', rootCause: 'k1_semantic_pattern_catalog.json only exported top 100', affectedRecords: semList.length, correction: 'Exported 100% of structural & semantic patterns in partitioned files with SHA-256 manifests.' },
      { id: 'K1-DEF-03', title: 'Missing complete Card->Ability->Clause->Pattern traceability', rootCause: 'No full mapping exported in K.1', affectedRecords: totalCardRecords, correction: 'Exported complete partitioned k1_1_card_ability_clause_mapping/ dataset.' },
      { id: 'K1-DEF-04', title: 'Conflated handler presence with semantic verification', rootCause: 'K.1 used implementedOps && OPERATION_EVIDENCE_REGISTRY[op] as fullyVerifiedOps', affectedRecords: totalClauses, correction: 'Separated 6 independent dimensions using strict variant-level classifyOperation().' },
      { id: 'K1-DEF-05', title: 'Truncated manual-review queue (500 sample cap)', rootCause: 'manualReviewAbilities.length < 500 cap in discover_k1_mechanics.mjs', affectedRecords: mrManifest.totalRecords, correction: 'Exported complete partitioned manual-review inventory with zero truncation.' },
      { id: 'K1-DEF-06', title: 'Overstated K1-BATCH-01 coverage (30,509)', rootCause: 'Counted handler presence as verified without variant/condition checks', affectedRecords: batchAbilitySets.B1_VERIFIED_CORE_OPS.size, correction: 'Recalculated disjoint unique ability/card sets strictly from verified records.' },
      { id: 'K1-DEF-07', title: 'Keyword extraction ignored KEYWORD_RULE op clauses', rootCause: 'Only iterated ab.keywords', affectedRecords: kwSummary.size, correction: 'Extracted both ab.keywords and KEYWORD_RULE clause keywords.' },
      { id: 'K1-DEF-08', title: 'Release family breakdown counted shard files instead of cards/abilities', rootCause: 'Incremented byReleaseFamily per shard', affectedRecords: totalCardRecords, correction: 'Counted both cards and abilities per release family.' },
    ],
  }, null, 2));

  return {
    totalShards: shardFiles.length,
    totalCardRecords,
    uniqueCanonicalCards: canonicalCards.size,
    totalAbilities,
    totalClauses,
    structuralPatternsCount: strList.length,
    exactSemanticPatternsCount: semList.length,
    manualReviewCount: mrManifest.totalRecords,
    reconciled: reconciliation.allReconciled,
    manifests: { strManifest, semManifest, mapManifest, mrManifest },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const summary = runK1_1Discovery();
  console.log(JSON.stringify({
    totalShards: summary.totalShards,
    totalCardRecords: summary.totalCardRecords,
    uniqueCanonicalCards: summary.uniqueCanonicalCards,
    totalAbilities: summary.totalAbilities,
    totalClauses: summary.totalClauses,
    structuralPatternsCount: summary.structuralPatternsCount,
    exactSemanticPatternsCount: summary.exactSemanticPatternsCount,
    manualReviewCount: summary.manualReviewCount,
    reconciled: summary.reconciled,
  }, null, 2));
}
