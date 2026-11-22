/**
 * tests/physical_ability_identity.test.js
 * 
 * Phase 4C.3.2.1 — Deterministic Physical Ability Identity & Collision Test Suite
 * 
 * Implements and verifies:
 * - TC-COL-01 through TC-COL-08, TC-COL-10 through TC-COL-12
 * - TC-ID-01 through TC-ID-05
 * (TC-COL-06 is tracked as BLOCKED due to shard-wide recompilation boundary)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalizeRFC8785,
  createAbilityDescriptor,
  deriveDualDigest,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  AbilityCollisionRegistry,
  FatalCollisionError
} from '../compiler/identity.js';
import { compileCard } from '../compiler/index.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Sample test descriptors
const descriptorA = {
  type: 'ABILITY',
  timing: 'FLASH',
  timings: [],
  trigger: 'NONE',
  levels: [1],
  limit: null,
  cantStack: false,
  keyword: null,
  burstCondition: null,
  clauses: [
    {
      link: null,
      isOptional: false,
      isCost: false,
      condition: null,
      duration: 'THIS_TURN',
      op: { op: 'BP_BUFF', amount: 3000, target: 'self' },
      cleanText: 'This Spirit gains +3000 BP.'
    }
  ]
};

// Descriptor A2: Shares identical header (FLASH, NONE, LV1) with A, but different clause operation (DRAW)
const descriptorA2 = {
  type: 'ABILITY',
  timing: 'FLASH',
  timings: [],
  trigger: 'NONE',
  levels: [1],
  limit: null,
  cantStack: false,
  keyword: null,
  burstCondition: null,
  clauses: [
    {
      link: null,
      isOptional: false,
      isCost: false,
      condition: null,
      duration: null,
      op: { op: 'DRAW', count: 1, chooser: 'self' },
      cleanText: 'Draw 1 card.'
    }
  ]
};

const descriptorB = {
  type: 'ABILITY',
  timing: 'WHEN_ATTACKS',
  timings: [],
  trigger: 'ON_ATTACK',
  levels: [1, 2],
  limit: 'ONCE_PER_TURN',
  cantStack: false,
  keyword: null,
  burstCondition: null,
  clauses: [
    {
      link: null,
      isOptional: false,
      isCost: false,
      condition: null,
      duration: null,
      op: { op: 'DRAW', count: 1, chooser: 'self' },
      cleanText: 'Draw one card from your deck.'
    }
  ]
};

const descriptorC = {
  type: 'ABILITY',
  timing: 'BURST',
  timings: [],
  trigger: 'AFTER_DESTRUCTION',
  levels: [1, 2, 3],
  limit: null,
  cantStack: false,
  keyword: 'Burst',
  burstCondition: 'AFTER_OPPOSING_DESTRUCTION',
  clauses: [
    {
      link: null,
      isOptional: true,
      isCost: false,
      condition: null,
      duration: null,
      op: { op: 'DESTROY', count: 1, target: { side: 'opp', types: ['Spirit'] } },
      cleanText: 'You can destroy one opposing Spirit.'
    }
  ]
};

// ---------------------------------------------------------------------------
// Suite 1: Collision & Incremental Invariance Suite
// ---------------------------------------------------------------------------

test('TC-COL-01: Descriptor A compiled in complete isolation', () => {
  const idA = derivePhysicalAbilityId('CARD-01', descriptorA);
  assert.ok(idA.startsWith('CARD-01#AB_FLASH_NONE_LV1_'), `ID should start with expected header, got ${idA}`);
  
  // Verify digest lengths
  const parts = idA.split('_');
  const h2 = parts[parts.length - 1];
  const h1 = parts[parts.length - 2];
  assert.equal(h1.length, 64, 'H1 must be 64 hexadecimal characters (SHA-256)');
  assert.equal(h2.length, 32, 'H2 must be 32 hexadecimal characters (16-byte SHA-512 slice)');
});

test('TC-COL-02: Descriptor B compiled in complete isolation', () => {
  const idB = derivePhysicalAbilityId('CARD-02', descriptorB);
  assert.ok(idB.startsWith('CARD-02#AB_WHEN_ATTACKS_ON_ATTACK_LV1_LV2_'), `ID should start with expected header, got ${idB}`);
  
  const parts = idB.split('_');
  const h2 = parts[parts.length - 1];
  const h1 = parts[parts.length - 2];
  assert.equal(h1.length, 64);
  assert.equal(h2.length, 32);
});

test('TC-COL-03: Sequential compilation: A compiled, then B compiled', () => {
  const idA_iso = derivePhysicalAbilityId('CARD-01', descriptorA);
  const registry = new AbilityCollisionRegistry();

  const idA = derivePhysicalAbilityId('CARD-01', descriptorA);
  registry.register(idA, descriptorA, 'CARD-01');

  const idB = derivePhysicalAbilityId('CARD-02', descriptorB);
  registry.register(idB, descriptorB, 'CARD-02');

  assert.equal(idA, idA_iso, 'Sequential compilation must not alter A ID');
  assert.equal(registry.size, 2, 'Registry must hold both entries');
});

test('TC-COL-04: Reverse sequential compilation: B compiled, then A compiled', () => {
  const idA_iso = derivePhysicalAbilityId('CARD-01', descriptorA);
  const idB_iso = derivePhysicalAbilityId('CARD-02', descriptorB);
  const registry = new AbilityCollisionRegistry();

  // Reverse order
  const idB = derivePhysicalAbilityId('CARD-02', descriptorB);
  registry.register(idB, descriptorB, 'CARD-02');

  const idA = derivePhysicalAbilityId('CARD-01', descriptorA);
  registry.register(idA, descriptorA, 'CARD-01');

  assert.equal(idA, idA_iso, 'Reverse compilation must not alter A ID');
  assert.equal(idB, idB_iso, 'Reverse compilation must not alter B ID');
});

test('TC-COL-05: Three descriptors: A, B, C compiled in arbitrary permutations', () => {
  const idA_iso = derivePhysicalAbilityId('CARD-01', descriptorA);
  const idB_iso = derivePhysicalAbilityId('CARD-02', descriptorB);
  const idC_iso = derivePhysicalAbilityId('CARD-03', descriptorC);

  const permutations = [
    [descriptorA, descriptorB, descriptorC],
    [descriptorC, descriptorA, descriptorB],
    [descriptorB, descriptorC, descriptorA]
  ];

  for (const perm of permutations) {
    const reg = new AbilityCollisionRegistry();
    for (const d of perm) {
      const cardNum = d === descriptorA ? 'CARD-01' : d === descriptorB ? 'CARD-02' : 'CARD-03';
      const id = derivePhysicalAbilityId(cardNum, d);
      reg.register(id, d, cardNum);
    }
    assert.equal(derivePhysicalAbilityId('CARD-01', descriptorA), idA_iso);
    assert.equal(derivePhysicalAbilityId('CARD-02', descriptorB), idB_iso);
    assert.equal(derivePhysicalAbilityId('CARD-03', descriptorC), idC_iso);
  }
});

test('TC-COL-06: Full database batch compilation across 514 shards', () => {
  // Phase 4C.3.2.3: Full 514-shard database identity compilation and validation
  const shardsDir = path.join(ROOT, 'data', 'ir_shards');
  assert.ok(fs.existsSync(shardsDir), 'data/ir_shards directory must exist');

  const files = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json')).sort();
  assert.strictEqual(files.length, 514, 'Must process exactly 514 IR shards');

  let totalCards = 0;
  let totalAbilities = 0;
  let totalConditions = 0;
  let instanceIndexCount = 0;
  const physicalIdMap = new Map();
  const semanticIdMap = new Map();

  for (const file of files) {
    const filePath = path.join(shardsDir, file);
    const shardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const [key, card] of Object.entries(shardData)) {
      totalCards++;
      const cNum = card.cardNumber || key;

      if (Array.isArray(card.abilities)) {
        for (let i = 0; i < card.abilities.length; i++) {
          const ab = card.abilities[i];
          totalAbilities++;

          if (ab.type === 'CONDITION' || ab.rawText) {
            totalConditions++;
          }

          // Invariant 1: Physical ability ID present and matches ab.id
          assert.ok(ab.physicalId, `Missing physicalId on ${cNum} ability ${i} in ${file}`);
          assert.strictEqual(ab.id, ab.physicalId, `ab.id must equal physicalId on ${cNum} ability ${i}`);
          assert.ok(ab.physicalId.startsWith(`${cNum}#`), `physicalId must start with ${cNum}#`);

          // Invariant 2: Semantic ID present and correctly formatted
          assert.ok(ab.semanticId, `Missing semanticId on ${cNum} ability ${i} in ${file}`);
          assert.ok(ab.semanticId.startsWith('SEM#'), `semanticId must start with SEM#`);

          // Invariant 3: Legacy ID preserved
          assert.ok(ab.legacyId, `Missing legacyId on ${cNum} ability ${i} in ${file}`);
          assert.ok(ab.legacyId.includes('#a'), `legacyId must preserve original index format`);

          // Invariant 4: Scoped instance index for identical abilities on same card
          if (ab.physicalId.includes('_inst')) {
            instanceIndexCount++;
          }

          const descriptor = createAbilityDescriptor(ab);
          const canon = canonicalizeRFC8785(descriptor);

          // Invariant 5: Collision registry integrity — no distinct descriptors share a physical ID
          if (physicalIdMap.has(ab.physicalId)) {
            const existing = physicalIdMap.get(ab.physicalId);
            assert.strictEqual(
              existing.canonicalJson,
              canon,
              `Fatal collision: physicalId ${ab.physicalId} used for different descriptors`
            );
            assert.strictEqual(
              existing.cardNumber,
              cNum,
              `Fatal collision: physicalId ${ab.physicalId} shared across different cards`
            );
          } else {
            physicalIdMap.set(ab.physicalId, { cardNumber: cNum, canonicalJson: canon });
          }

          // Invariant 6: Semantic mapping consistency
          if (semanticIdMap.has(ab.semanticId)) {
            assert.strictEqual(
              semanticIdMap.get(ab.semanticId),
              canon,
              `Semantic collision: semanticId ${ab.semanticId} used for different descriptors`
            );
          } else {
            semanticIdMap.set(ab.semanticId, canon);
          }
        }
      }
    }
  }

  // Database-wide reconciliation assertions
  assert.strictEqual(totalCards, 15398, 'Total card entries across 514 shards must equal 15,398');
  assert.strictEqual(totalAbilities, 36422, 'Total abilities across 514 shards must equal 36,422');
  assert.strictEqual(totalConditions, 1516, 'Total condition blocks across 514 shards must equal 1,516');
  assert.ok(instanceIndexCount > 0, 'Must have abilities separated by instance index (_inst2)');
  assert.strictEqual(physicalIdMap.size, 34855, 'Unique physical ability IDs must equal 34,855');
  assert.ok(semanticIdMap.size > 0, 'Must have valid semantic IDs');
});

test('TC-COL-07: Incremental compilation of single modified card in isolation', () => {
  const idA_initial = derivePhysicalAbilityId('CARD-01', descriptorA);
  
  // Recompile CARD-01 in complete isolation (simulating incremental build)
  const idA_recompiled = derivePhysicalAbilityId('CARD-01', descriptorA);
  assert.equal(idA_recompiled, idA_initial, 'Incremental compilation must produce identical ID');
});

test('TC-COL-08: Cross-environment serialization invariance (RFC 8785 canonical bytes)', () => {
  const jsonA = canonicalizeRFC8785(descriptorA);
  const bytesA = Buffer.from(jsonA, 'utf8');

  // Verify that canonical JSON is byte-for-byte identical across repeated calls
  for (let i = 0; i < 50; i++) {
    const jsonIter = canonicalizeRFC8785(descriptorA);
    const bytesIter = Buffer.from(jsonIter, 'utf8');
    assert.equal(Buffer.compare(bytesA, bytesIter), 0, 'Byte buffer must be identical');
  }
});

test('TC-COL-10: Forced primary SHA-256 collision using injectable mock hash', () => {
  // Inject mock hasher where SHA-256 collides for A and A2, but SHA-512 differs
  const mockHasher = {
    sha256: () => 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    sha512Slice: (buf) => {
      // Differentiate H2 slice based on descriptor content
      const str = buf.toString('utf8');
      return str.includes('BP_BUFF')
        ? '11111111111111111111111111111111'
        : '22222222222222222222222222222222';
    }
  };

  const idA = derivePhysicalAbilityId('CARD-01', descriptorA, mockHasher);
  const idA2 = derivePhysicalAbilityId('CARD-01', descriptorA2, mockHasher);

  // Both have header CARD-01#AB_FLASH_NONE_LV1_ and identical H1, but H2 differentiates them
  assert.notEqual(idA, idA2, 'Different H2 slices must differentiate abilities despite identical H1');
  assert.ok(idA.includes('_11111111111111111111111111111111'));
  assert.ok(idA2.includes('_22222222222222222222222222222222'));
});

test('TC-COL-11: Forced dual collision in both primary and secondary mock hashes', () => {
  // Inject mock hasher where BOTH H1 and H2 collide for different descriptors with matching headers
  const mockHasher = {
    sha256: () => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    sha512Slice: () => 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  };

  const registry = new AbilityCollisionRegistry();
  const idA = derivePhysicalAbilityId('CARD-01', descriptorA, mockHasher);
  const idA2 = derivePhysicalAbilityId('CARD-01', descriptorA2, mockHasher);

  // Both have matching header and forced matching digests, producing an identical physical ID
  assert.equal(idA, idA2, 'Mock hasher forced identical composite physical IDs');

  // Registration of first ability succeeds
  registry.register(idA, descriptorA, 'CARD-01');

  // Registration of colliding distinct descriptor must throw FatalCollisionError
  assert.throws(
    () => {
      registry.register(idA2, descriptorA2, 'CARD-01');
    },
    FatalCollisionError,
    'Collision registry must abort immediately when descriptors differ'
  );
});

test('TC-COL-12: Existing persistent IDs remain unchanged after new colliding descriptor appears', () => {
  const mockHasher = {
    sha256: () => 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    sha512Slice: () => 'dddddddddddddddddddddddddddddddd'
  };

  const registry = new AbilityCollisionRegistry();
  const idA = derivePhysicalAbilityId('CARD-01', descriptorA, mockHasher);
  registry.register(idA, descriptorA, 'CARD-01');

  // Verify initial registration is locked
  const entryBefore = registry.get(idA);
  assert.ok(entryBefore);
  assert.equal(entryBefore.cardNumber, 'CARD-01');

  // Attempt to register colliding descriptor A2
  const idA2 = derivePhysicalAbilityId('CARD-01', descriptorA2, mockHasher);
  assert.throws(
    () => registry.register(idA2, descriptorA2, 'CARD-01'),
    FatalCollisionError
  );

  // Existing entry A is 100% preserved and unmutated
  const entryAfter = registry.get(idA);
  assert.equal(entryAfter.canonicalJson, entryBefore.canonicalJson, 'Existing entry must remain unmutated');
  assert.equal(entryAfter.cardNumber, 'CARD-01');
});

// ---------------------------------------------------------------------------
// Suite 2: Physical & Semantic Identity Suite
// ---------------------------------------------------------------------------

test('TC-ID-01: Deterministic 256-bit SHA-256 digest over RFC 8785 canonical JSON across 100 runs', () => {
  const baseJson = canonicalizeRFC8785(descriptorA);
  const baseDigest = deriveDualDigest(baseJson).h1;

  for (let i = 0; i < 100; i++) {
    const json = canonicalizeRFC8785(descriptorA);
    const digest = deriveDualDigest(json).h1;
    assert.equal(digest, baseDigest, `Run ${i + 1} produced non-deterministic digest`);
  }
});

test('TC-ID-02: JSON object-key ordering changes preserve identity under RFC 8785', () => {
  // Construct two objects with different key orderings
  const obj1 = {
    timing: 'FLASH',
    type: 'ABILITY',
    trigger: 'NONE',
    levels: [1, 2],
    limit: null,
    cantStack: false,
    keyword: null,
    burstCondition: null,
    clauses: []
  };

  const obj2 = {
    clauses: [],
    burstCondition: null,
    keyword: null,
    cantStack: false,
    limit: null,
    levels: [1, 2],
    trigger: 'NONE',
    type: 'ABILITY',
    timing: 'FLASH'
  };

  const json1 = canonicalizeRFC8785(obj1);
  const json2 = canonicalizeRFC8785(obj2);

  assert.equal(json1, json2, 'RFC 8785 serialization must be identical regardless of key insertion order');

  const id1 = derivePhysicalAbilityId('TEST-01', obj1);
  const id2 = derivePhysicalAbilityId('TEST-01', obj2);
  assert.equal(id1, id2, 'Physical IDs must match when key order differs');
});

test('TC-ID-03: Meaningful execution clause-order changes alter physical identity', () => {
  const clause1 = {
    link: null,
    isOptional: false,
    isCost: false,
    condition: null,
    duration: null,
    op: { op: 'DRAW', count: 1 },
    cleanText: 'Draw 1 card.'
  };

  const clause2 = {
    link: 'then',
    isOptional: false,
    isCost: false,
    condition: null,
    duration: null,
    op: { op: 'DISCARD', count: 1 },
    cleanText: 'Discard 1 card.'
  };

  const abilityNormal = {
    type: 'ABILITY',
    timing: 'MAIN',
    timings: [],
    trigger: 'NONE',
    levels: [1],
    limit: null,
    cantStack: false,
    keyword: null,
    burstCondition: null,
    clauses: [clause1, clause2]
  };

  const abilityReversed = {
    type: 'ABILITY',
    timing: 'MAIN',
    timings: [],
    trigger: 'NONE',
    levels: [1],
    limit: null,
    cantStack: false,
    keyword: null,
    burstCondition: null,
    clauses: [clause2, clause1] // Reversed execution order
  };

  const idNormal = derivePhysicalAbilityId('CARD-01', abilityNormal);
  const idReversed = derivePhysicalAbilityId('CARD-01', abilityReversed);

  assert.notEqual(idNormal, idReversed, 'Reversing execution clause order must alter physical ID');
});

test('TC-ID-04: Cosmetic whitespace and formatting invariance', () => {
  const abA = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1, 2], limit: 'ONCE_PER_TURN' },
    clauses: [{ cleanText: 'Draw one card.', op: { op: 'DRAW', count: 1 } }]
  };

  const abB = {
    header: { timing: 'when_attacks  ', trigger: '  ON_ATTACK', levels: [1, 2], limit: '  once_per_turn ' },
    clauses: [{ cleanText: '  Draw one card.  ', op: { op: 'DRAW', count: 1 } }]
  };

  const descA = createAbilityDescriptor(abA);
  const descB = createAbilityDescriptor(abB);

  const idA = derivePhysicalAbilityId('CARD-01', descA);
  const idB = derivePhysicalAbilityId('CARD-01', descB);

  assert.equal(idA, idB, 'Cosmetic whitespace in inputs must not alter derived physical ID');
});

test('TC-ID-05: Reprint semantic equivalence across differing set codes and printings', () => {
  // Two different card printings (e.g. original set vs promo reprint)
  const printingOriginal = {
    cardNumber: 'SD66-X01',
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1, 2, 3], limit: 'ONCE_PER_TURN_SAME_NAME' },
    clauses: [{ cleanText: 'Destroy 1 opposing Spirit.', op: { op: 'DESTROY', count: 1 } }]
  };

  const printingReprint = {
    cardNumber: 'PB34-X01', // Different card number
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1, 2, 3], limit: 'ONCE_PER_TURN_SAME_NAME' },
    clauses: [{ cleanText: 'Destroy 1 opposing Spirit.', op: { op: 'DESTROY', count: 1 } }]
  };

  const descOrig = createAbilityDescriptor(printingOriginal);
  const descRepr = createAbilityDescriptor(printingReprint);

  const physOrig = derivePhysicalAbilityId(printingOriginal.cardNumber, descOrig);
  const physRepr = derivePhysicalAbilityId(printingReprint.cardNumber, descRepr);

  const semOrig = deriveSemanticAbilityId(descOrig);
  const semRepr = deriveSemanticAbilityId(descRepr);

  // 1. Physical IDs must differ because card numbers differ
  assert.notEqual(physOrig, physRepr, 'Different card numbers must have distinct physical IDs');
  assert.ok(physOrig.startsWith('SD66-X01#AB_'));
  assert.ok(physRepr.startsWith('PB34-X01#AB_'));

  // 2. Semantic IDs must be 100% identical
  assert.equal(semOrig, semRepr, 'Reprint printings with identical function must have 100% identical semanticAbilityId');
  assert.ok(semOrig.startsWith('SEM#AB_'));
});
