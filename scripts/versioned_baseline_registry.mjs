/**
 * scripts/versioned_baseline_registry.mjs
 *
 * Package K.1.5 — Versioned Baseline & Chain-of-Custody Preservation Registry.
 * Preserves immutable historical K.1.3.x initial baseline hashes and explicitly
 * records only authorized K.1.4 / K.1.5 implementation evolutions so regression
 * guards detect any unapproved file tampering without weakening integrity checks.
 */

import assert from 'node:assert/strict';

export const AUTHORIZED_EVOLVED_FILES = {
  'engine/index.js': {
    reason: 'Workstreams A, B, F & Batches 02-05: runtime Brave/Summon Condition, Mirage set/replacement/During Set, Release/True Release execution, OPPONENT destroy guard, executeAccel, executeChange, performAdvent',
    approvedHashes: [
      'c05a54ed1fb2d0a0846aca7a53fa966dfdddd804b5743240edba8e7741a21bb4',
      '635cb05046841b81ad757e41d15bbac491a8415ab3076d4a6a780a54f3e5d8d5',
      '7edaa378002e43cfa715b803093320884624a4768577616aa463d7bc85734f83',
      'a238a58e6541f1685291ce445180895f72ab675036be1c5fd7cf8fb854316318'
    ]
  },
  'engine/zones.js': {
    reason: 'Workstream F & Batches 02-05: fast-path field removal optimization, REMAIN_ON_FIELD, LIFE_TO_RESERVE, zero-BP destruction replacement',
    approvedHashes: [
      'ebd89d4c59cbe68c4ed0f09f2ab9624c1bfccd7657812c2eaecd3ed19a2cfd73',
      'de64484607189a8e8da1a15751da58a6fdd7220b6716f10a6f2fb4b125994a1a',
      'e67d6b9a95bf7729736d4a952f3a68a27855550daff1900c3fc8dd1530e6552c'
    ]
  },
  'engine/conditions.js': {
    reason: 'Workstreams C & D & Batch 02: TEAM_PRESENCE condition, filter.team, top unparsed condition failure remediation, compound and/or fix, INVALID_CONTEXT',
    approvedHashes: [
      '817c8f87e0f2ea1069365e7d5fc3922d6ff23e6429182a206f9007d6ab8df7de',
      'ef1687b90375889ed2e81b365b22e2427cd96bb99df4273a1b82658760b466c4',
      '1e3eb7d7f718e1513eefba8c31dfcb100f3992d734980e5c92ecc5b34bd7b08c',
      'b4dbb6960315f6878aeea571c97f8bbfceb95f8b60ec3df38bb0780b48bda6c1'
    ]
  },
  'engine/selectors.js': {
    reason: 'Workstreams C & F & Batch 05: filters.team enforcement across zones and fieldSymbols caching for WPDE-PERF-01, target.side: either narrowing',
    approvedHashes: [
      'b94f9d921e8da326e2d030859894b053993bf4111db993b587234c6d82fe7885',
      'e885498044dde135dca57f7b5f7230ab3282c7f6443c2e0f57d2220aa605eb50',
      'f43f02d39302b9901ca9ff2355336ebc5314a0cb8b307d48865aadeebbbd3c48'
    ]
  },
  'engine/payment.js': {
    reason: 'Workstream F: fast-path zero-reduction skip & precomputedFieldSymbols reuse',
    approvedHashes: [
      '5fe4005a92df645d39ea76c952c0f5ec22d825ecd93874aa19f05c62d929fd2d',
      '3b497dcbedbc6663f80bfaea686b1197c6ba1bc6ed0f7804a27b47f0fa556de8'
    ]
  },
  'engine/prerequisites.js': {
    reason: 'Workstreams B & C & Batch 03: Brave Condition, Summon Condition, Mirage, Release/True Release, Team helpers, SuAdcon condition parsing & prefix prerequisites',
    approvedHashes: [
      '006d65b6cf211b6b16c24f78dbb722b5effbbecfd459c8e27e04cc460bbf973a',
      '6a4d6719f710c6ea0eb0532bf2042282ed94b919bd634997e8f3afce3ddc1d3a',
      'c6d9bf35f4832f44b71baa1888c5a1d58b0b815bbe8917919b072723f0e03da4'
    ]
  },
  'engine/ops/index.js': {
    reason: 'Workstreams D & F & Batches 03-05: SET_LEVEL group, TREAT_RULE opponent, DEPLOY_NEXUS burst card, BOUNCE self/hand, EXHAUST previous target, parameter recovery, narrowEitherSideFromClause',
    approvedHashes: [
      '5e6cc37b705b76cba3b181a56bf40b48d25d2f51e2ec519752861f24bb0faede',
      '484150e4f5565bccb2fd888c2e4fbabeed9d03f52a0027f80a3f074a44e5f235',
      'f63df273993abf6fdd33f79f8b7dff17f3ac0e242f4dcfcd53bca94d6305247d',
      '04e3ee69a31d214eeff422abc01095227d2f38530ada2e0a3c5eb4b93b1de66e'
    ]
  },
  'engine/continuous.js': {
    reason: 'Batch 03 & 05: SJ13-12 level gating, BP_DEBUFF modifier application',
    approvedHashes: [
      'd6c293b592d8d355299531a6ae2b4db716b523877bb6e3525ad550483a677331'
    ]
  },
  'engine/resolver.js': {
    reason: 'Batch 03: ability prefix prerequisites gating (During Brave, When Braved, During Advent, During OC, During Set, Soul State, During Seal)',
    approvedHashes: [
      'a2c16ee6a7ce393e33985ad965cf7ae819adb6b49f8cc284e68a3bd6ff04f421',
      '8b1b1de8d600633e836025150cc891a54dfc0c49fb604b4f0edc2041637e4c5c'
    ]
  },
  'engine/parameter_recovery.js': {
    reason: 'Batch 04: Incomplete parameter explicit recovery & fail-closed contracts',
    approvedHashes: [
      '3aef2a0111ffa62be1473ebb81b944801d943e356c1b5de4828e333c4ee3a9cb'
    ]
  },
  'compiler/clause_patterns.js': {
    reason: 'Workstream D & Batches 02-05: INDESTRUCTIBLE clause support, COLOR_SYMBOL AST, 0-BP destruction replacement, hand bounce, BP_DEBUFF widening',
    approvedHashes: [
      'beacaf11d590b207bad57ef5822075498298621a4f7362ab262b888b100ee03d',
      'ad88fb67e471a58cbfd9f099e3dd91fbf53d67750e524dc8a84b146f482560bf',
      '41bbbcdbc4882b7b575c2f829ba02498df28f95934be2ee74cf6328a5af96ae5'
    ]
  },
  'compiler/clause_splitter.js': {
    reason: 'Batch 05: strip unicode block prefixes',
    approvedHashes: [
      '2e9ae4343aa2fd463860580cc4315d1771b437e747c07597e7ced619b29d1b72',
      '620f10bc3eae215bf132cb55b3349ca1620a5c89f962e58b9ebfd245e3c91b80'
    ]
  },
  'compiler/index.js': {
    reason: 'Workstreams A & C: V3 semanticIdV3 + timingSemantics assignment and TEAM_RESTRICTION / nested Brave/Summon Condition handling',
    approvedHashes: [
      'cabce7bdf87b8711296e43e9026f3bfad578a48bd14802c297e103627d64a493',
      'fbc40a18ab7f21a3725eebde6561f5039c23acdc49383e774839ec9db2dcf030',
      '1ca4c9ff6659a4bd3ff2b80d94e5858a0e624484ddd9cf4c834cf920ea71e393'
    ]
  },
  'compiler/identity.js': {
    reason: 'Workstream A: V3 descriptor & semanticIdV3 integrated while keeping V2 physicalId/semanticId unchanged',
    approvedHashes: [
      'cf42220d308db22ca7719d61946cb97d9342c72d963845b4508b7031c0e85b5b',
      '9a9833947331ff9bac38480b0bf102af51ad5138296031bd868ff73dd00ad0c4',
      'd069ebc1b9d7213d207024a1be37d62b980aa51e372f166b5f0bac184b96f3d8'
    ]
  },
  'compiler/header_parser.js': {
    reason: 'Workstreams A & C: V3 timing qualifier extraction, newline split, nested Mirage/Brave/Summon Condition parsing',
    approvedHashes: [
      '7bef1adce8bc47d42460181eb70d45a35f40bb1ab555fe3d3af9caae19e3ee2e',
      'c7d4e1d9269e1abccfed143410e00b386eb78a45727dc11d171fe56057b30fed',
      'bc7ddad35d130190c6dbc00ed7f227046b0a080b1a7e46439ec4e91454d9ff98'
    ]
  },
  'compiler/clause_patterns.js': {
    reason: 'Workstream D: INDESTRUCTIBLE clause support for "a Spirit you control can\'t be destroyed"',
    approvedHashes: [
      'beacaf11d590b207bad57ef5822075498298621a4f7362ab262b888b100ee03d',
      'ad88fb67e471a58cbfd9f099e3dd91fbf53d67750e524dc8a84b146f482560bf'
    ]
  },
  'scripts/evidence_registry.mjs': {
    reason: 'Workstream E: Batch 1 contracts & verified top-level test IDs for BP_BUFF, BP_DEBUFF, EXHAUST, REFRESH',
    approvedHashes: [
      '977c49c45f9f0f55cf426a75a7932b4c6a15a50054922ad42d1227c9154aa42e',
      '809209b855021002e2c89946ef2818b8e41eec24ae2bbd053d20eafe84997533'
    ]
  },
  'tests/work_package_k1_2_discovery_integrity.test.js': {
    reason: 'Workstream G: versioned baseline determinism comparison without mutating historical K.1.2 reports',
    approvedHashes: [
      'd1089cffd1d7283675367be1c69b980953ca8a09e267d88545b360a8fb4f00a1'
    ]
  },
  'tests/work_package_k1_3_1_semantic_audit.test.js': {
    reason: 'Workstream G: versioned baseline preservation check without mutating historical K.1.3.1 reports',
    approvedHashes: [
      '2627d6df09289a3581d0563bac47a6fa81bcc3e94bde840c7b5d9801ac322495'
    ]
  },
  'tests/work_package_k1_3_2_semantic_hardening.test.js': {
    reason: 'Workstream G: versioned baseline preservation check without mutating historical K.1.3.2 reports',
    approvedHashes: [
      'c0a4847945e72e7167f658b4b6e7cae3bb8b8e1d5bd97e21f4bc85ff95d3c05e'
    ]
  },
  'tests/work_package_k1_3_3_audit_integrity.test.js': {
    reason: 'Workstream G: versioned baseline preservation & live determinism comparison without mutating historical K.1.3.3 reports',
    approvedHashes: [
      'aeede4ab2bae5812cf280a752bd3b8f7fb9966bec42c77000166c7c8a459b6c4'
    ]
  },
  'tests/work_package_k1_3_4_semantic_evidence.test.js': {
    reason: 'Workstream G: versioned baseline preservation & live determinism comparison without mutating historical K.1.3.4 reports',
    approvedHashes: [
      '311fcc4e79030f3b9036dc5f8204e6aec2145d43b499686a60fc2cb0e94f9aa3'
    ]
  }
};

export function isApprovedFileHash(relPath, actualSha, historicalExpectedSha = null) {
  const norm = String(relPath).replace(/\\/g, '/');
  if (historicalExpectedSha && actualSha === historicalExpectedSha) {
    return { approved: true, mode: 'HISTORICAL_EXACT' };
  }
  const entry = AUTHORIZED_EVOLVED_FILES[norm];
  if (entry && entry.approvedHashes.includes(actualSha)) {
    return { approved: true, mode: 'VERSIONED_AUTHORIZED', reason: entry.reason };
  }
  return { approved: false, mode: 'UNAPPROVED_CHANGE' };
}

export function assertApprovedFileHash(relPath, actualSha, historicalExpectedSha = null) {
  const res = isApprovedFileHash(relPath, actualSha, historicalExpectedSha);
  assert.equal(
    res.approved,
    true,
    `Unapproved file modification on ${relPath}: got ${actualSha}, expected ${historicalExpectedSha || 'authorized versioned hash'}`
  );
  return res;
}
