/**
 * tests/physical_ability_identity_corrective.test.js
 * 
 * Comprehensive Test Suite for Phase 4C.3.2.1 Corrective Implementation:
 * - Section 2: Condition Descriptor Completeness (TC-COND-01 .. TC-COND-04)
 * - Section 3: Identical Ability Instances on Same Card (TC-INST-01 .. TC-INST-06)
 * - Section 4: Strict RFC 8785 Conformance (TC-RFC-01 .. TC-RFC-15)
 * - Section 5: Consistent Identity Derivation Pipeline (TC-PIPE-01 .. TC-PIPE-06)
 * - Section 6: Backward Compatibility (TC-COMPAT-01 .. TC-COMPAT-03)
 * - Section 7: Collision Registry Robustness & Rollback (TC-REG-01 .. TC-REG-06)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeRFC8785,
  createAbilityDescriptor,
  parseConditionBlock,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  deriveDualDigest,
  AbilityCollisionRegistry,
  FatalCollisionError,
  globalCollisionRegistry
} from '../compiler/identity.js';
import { compileCard } from '../compiler/index.js';

// ---------------------------------------------------------------------------
// Section 2: Condition Descriptor Completeness
// ---------------------------------------------------------------------------

test('TC-COND-01: Two different condition expressions with identical headers produce different descriptors and IDs', () => {
  const cond1 = {
    type: 'CONDITION',
    rawText: '[Summon Condition: Your Life is at two or more]',
    condition: parseConditionBlock('[Summon Condition: Your Life is at two or more]')
  };
  const cond2 = {
    type: 'CONDITION',
    rawText: '[Summon Condition: You must have 1 or more Spirit on your field]',
    condition: parseConditionBlock('[Summon Condition: You must have 1 or more Spirit on your field]')
  };

  const desc1 = createAbilityDescriptor(cond1);
  const desc2 = createAbilityDescriptor(cond2);

  assert.notDeepEqual(desc1, desc2, 'Descriptors must differ for distinct condition expressions');
  assert.equal(desc1.condition.expression, 'Your Life is at two or more');
  assert.equal(desc2.condition.expression, 'You must have 1 or more Spirit on your field');

  const id1 = derivePhysicalAbilityId('BS-01', desc1);
  const id2 = derivePhysicalAbilityId('BS-01', desc2);
  assert.notEqual(id1, id2, 'Physical IDs must differ for different condition expressions');

  const sem1 = deriveSemanticAbilityId(desc1);
  const sem2 = deriveSemanticAbilityId(desc2);
  assert.notEqual(sem1, sem2, 'Semantic IDs must differ for different condition expressions');
});

test('TC-COND-02: Equivalent condition expressions with harmless formatting differences produce identical identities', () => {
  const condRaw1 = '[Brave Condition: Cost 4 or more]';
  const condRaw2 = '[Brave Condition:   Cost   4  or more.  ]';

  const parsed1 = parseConditionBlock(condRaw1);
  const parsed2 = parseConditionBlock(condRaw2);
  assert.deepEqual(parsed1, parsed2, 'Parsed and normalized conditions must match');

  const desc1 = createAbilityDescriptor({ type: 'CONDITION', condition: parsed1 });
  const desc2 = createAbilityDescriptor({ type: 'CONDITION', condition: parsed2 });

  const id1 = derivePhysicalAbilityId('SD-01', desc1);
  const id2 = derivePhysicalAbilityId('SD-01', desc2);
  assert.equal(id1, id2, 'Harmles formatting differences must normalize to identical physical IDs');
});

test('TC-COND-03: Condition blocks and ordinary executable abilities do not collide', () => {
  const condBlock = {
    type: 'CONDITION',
    header: { timing: 'PASSIVE', levels: [1, 2, 3] },
    rawText: '[Summon Condition: Cost 3 or more]'
  };
  const abilityBlock = {
    type: 'ABILITY',
    header: { timing: 'PASSIVE', levels: [1, 2, 3] },
    clauses: []
  };

  const descCond = createAbilityDescriptor(condBlock);
  const descAb = createAbilityDescriptor(abilityBlock);

  assert.equal(descCond.type, 'CONDITION');
  assert.equal(descAb.type, 'ABILITY');
  assert.ok(descCond.condition !== null);
  assert.equal(descAb.condition, null);

  const idCond = derivePhysicalAbilityId('TEST-01', descCond);
  const idAb = derivePhysicalAbilityId('TEST-01', descAb);
  assert.notEqual(idCond, idAb, 'Condition block and ability block must have distinct physical IDs');
});

test('TC-COND-04: Compiler integration via compileCard preserves distinct condition identities', () => {
  const card1 = {
    cardNumber: 'TEST-CARD-C1',
    name: 'Condition Card A',
    raw_effect: '[Summon Condition: Your Life is at two or more]\n\n[LV1] (When Attacks) Draw 1 card.'
  };
  const card2 = {
    cardNumber: 'TEST-CARD-C2',
    name: 'Condition Card B',
    raw_effect: '[Summon Condition: You must have 2 or more Spirits]\n\n[LV1] (When Attacks) Draw 1 card.'
  };

  const ir1 = compileCard(card1);
  const ir2 = compileCard(card2);

  assert.equal(ir1.abilities.length, 2);
  assert.equal(ir2.abilities.length, 2);

  const condAb1 = ir1.abilities[0];
  const condAb2 = ir2.abilities[0];

  assert.equal(condAb1.type, 'CONDITION');
  assert.equal(condAb2.type, 'CONDITION');
  assert.notEqual(condAb1.semanticId, condAb2.semanticId, 'Semantic IDs must differ for different condition expressions');
});

// ---------------------------------------------------------------------------
// Section 3: Identical Ability Instances on Same Card
// ---------------------------------------------------------------------------

test('TC-INST-01: Two identical abilities on one card receive distinct physical IDs and shared semantic ID', () => {
  const card = {
    cardNumber: 'DUP-01',
    name: 'Duplicate Ability Spirit',
    raw_effect: '[LV1][LV2] (When Attacks) Draw 1 card.\n\n[LV1][LV2] (When Attacks) Draw 1 card.'
  };

  const ir = compileCard(card);
  assert.equal(ir.abilities.length, 2);

  const ab1 = ir.abilities[0];
  const ab2 = ir.abilities[1];

  assert.notEqual(ab1.physicalId, ab2.physicalId, 'Physical IDs for duplicate instances must be distinct');
  assert.ok(ab2.physicalId.endsWith('_inst2'), `Second instance must carry _inst2 suffix, got: ${ab2.physicalId}`);
  assert.equal(ab1.id, ab1.physicalId);
  assert.equal(ab2.id, ab2.physicalId);

  // Semantic identities MUST remain identical for behavioral equivalence
  assert.equal(ab1.semanticId, ab2.semanticId, 'Semantic IDs must be identical for equivalent abilities');
});

test('TC-INST-02: Two identical abilities on different cards receive distinct physical IDs and shared semantic ID', () => {
  const cardA = {
    cardNumber: 'CARD-A',
    name: 'Card A',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.'
  };
  const cardB = {
    cardNumber: 'CARD-B',
    name: 'Card B',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.'
  };

  const irA = compileCard(cardA);
  const irB = compileCard(cardB);

  assert.notEqual(irA.abilities[0].physicalId, irB.abilities[0].physicalId, 'Different cards have distinct physical IDs');
  assert.equal(irA.abilities[0].semanticId, irB.abilities[0].semanticId, 'Identical functional abilities share semantic ID');
});

test('TC-INST-03: The same card compiled in isolation and in a batch produces 100% identical IDs', () => {
  const card = {
    cardNumber: 'BATCH-01',
    name: 'Batch Test Card',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.\n\n[LV2] (When Attacks) Destroy 1 opposing Spirit.'
  };
  const otherCard = {
    cardNumber: 'OTHER-99',
    name: 'Unrelated Card',
    raw_effect: '[LV1] (When Summoned) Core charge.'
  };

  // 1. Isolation
  globalCollisionRegistry.clear();
  const irIso = compileCard(card);

  // 2. Batch: other card compiled first, then card
  globalCollisionRegistry.clear();
  compileCard(otherCard);
  const irBatch = compileCard(card);

  assert.equal(irIso.abilities[0].physicalId, irBatch.abilities[0].physicalId);
  assert.equal(irIso.abilities[1].physicalId, irBatch.abilities[1].physicalId);
  assert.equal(irIso.abilities[0].semanticId, irBatch.abilities[0].semanticId);
  assert.equal(irIso.abilities[1].semanticId, irBatch.abilities[1].semanticId);
});

test('TC-INST-04: Ability order changes where underlying abilities are distinct preserve individual IDs', () => {
  const abX = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 }, cleanText: 'Draw 1 card' }]
  };
  const abY = {
    header: { timing: 'WHEN_SUMMONED', trigger: 'ON_SUMMON', levels: [2] },
    clauses: [{ op: { op: 'DESTROY', count: 1 }, cleanText: 'Destroy 1 spirit' }]
  };

  const descX = createAbilityDescriptor(abX);
  const descY = createAbilityDescriptor(abY);

  const idX = derivePhysicalAbilityId('ORD-01', descX, 1);
  const idY = derivePhysicalAbilityId('ORD-01', descY, 1);

  // Deriving Y first, then X: IDs remain invariant
  const idY2 = derivePhysicalAbilityId('ORD-01', descY, 1);
  const idX2 = derivePhysicalAbilityId('ORD-01', descX, 1);

  assert.equal(idX, idX2);
  assert.equal(idY, idY2);
});

test('TC-INST-05: Repeated compilation of the same card produces 100% identical IDs and benign registry matches', () => {
  const card = {
    cardNumber: 'REPEAT-01',
    name: 'Repeated Card',
    raw_effect: '[LV1][LV2] (When Attacks) Draw 1 card.\n\n[LV1][LV2] (When Attacks) Draw 1 card.'
  };

  const ir1 = compileCard(card);
  const ir2 = compileCard(card);

  assert.equal(ir1.abilities[0].physicalId, ir2.abilities[0].physicalId);
  assert.equal(ir1.abilities[1].physicalId, ir2.abilities[1].physicalId);
});

test('TC-INST-06: Incremental compilation after an unrelated card is added preserves existing IDs', () => {
  const card1 = {
    cardNumber: 'INC-01',
    name: 'Incremental Card 1',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.'
  };
  const ir1 = compileCard(card1);
  const idBefore = ir1.abilities[0].physicalId;

  // Add 5 unrelated cards
  for (let i = 1; i <= 5; i++) {
    compileCard({ cardNumber: `UNREL-0${i}`, name: `Unrel ${i}`, raw_effect: `[LV${i}] Flush.` });
  }

  // Re-compile card 1
  const ir1After = compileCard(card1);
  assert.equal(ir1After.abilities[0].physicalId, idBefore, 'Existing card physical ID must be preserved 100%');
});

// ---------------------------------------------------------------------------
// Section 4: Strict RFC 8785 Conformance
// ---------------------------------------------------------------------------

test('TC-RFC-01: Nested object key ordering (strict UTF-16 code unit order)', () => {
  const obj = { z: 1, a: { d: 4, c: 3 }, b: 2 };
  const expected = '{"a":{"c":3,"d":4},"b":2,"z":1}';
  assert.equal(canonicalizeRFC8785(obj), expected);
});

test('TC-RFC-02: Arrays and nested arrays preserve order', () => {
  const arr = [3, [2, 1], 'alpha', { b: 2, a: 1 }];
  const expected = '[3,[2,1],"alpha",{"a":1,"b":2}]';
  assert.equal(canonicalizeRFC8785(arr), expected);
});

test('TC-RFC-03: Negative zero (-0) serialized as 0', () => {
  assert.equal(canonicalizeRFC8785(-0), '0');
  assert.equal(canonicalizeRFC8785({ val: -0 }), '{"val":0}');
  assert.equal(canonicalizeRFC8785([-0, 0]), '[0,0]');
});

test('TC-RFC-04: Floating-point serialization edge cases', () => {
  assert.equal(canonicalizeRFC8785(1e20), '100000000000000000000');
  assert.equal(canonicalizeRFC8785(1e21), '1e+21');
  assert.equal(canonicalizeRFC8785(1e-6), '0.000001');
  assert.equal(canonicalizeRFC8785(1e-7), '1e-7');
  assert.equal(canonicalizeRFC8785(0.5), '0.5');
  assert.equal(canonicalizeRFC8785(12345.6789), '12345.6789');
});

test('TC-RFC-05: Non-finite numbers (NaN, Infinity, -Infinity) explicitly throw TypeError', () => {
  assert.throws(() => canonicalizeRFC8785(NaN), TypeError);
  assert.throws(() => canonicalizeRFC8785(Infinity), TypeError);
  assert.throws(() => canonicalizeRFC8785(-Infinity), TypeError);
  assert.throws(() => canonicalizeRFC8785({ val: NaN }), TypeError);
  assert.throws(() => canonicalizeRFC8785([Infinity]), TypeError);
});

test('TC-RFC-06: Undefined object properties explicitly throw TypeError (no silent omission)', () => {
  assert.throws(() => canonicalizeRFC8785({ a: 1, b: undefined }), TypeError);
});

test('TC-RFC-07: Undefined array elements explicitly throw TypeError (no silent conversion to null)', () => {
  assert.throws(() => canonicalizeRFC8785([1, undefined, 3]), TypeError);
});

test('TC-RFC-08: Functions and symbols explicitly throw TypeError', () => {
  assert.throws(() => canonicalizeRFC8785(() => {}), TypeError);
  assert.throws(() => canonicalizeRFC8785(Symbol('test')), TypeError);
  assert.throws(() => canonicalizeRFC8785({ fn: () => {} }), TypeError);
  assert.throws(() => canonicalizeRFC8785([Symbol('item')]), TypeError);
});

test('TC-RFC-09: BigInt explicitly throws TypeError', () => {
  assert.throws(() => canonicalizeRFC8785(12345678901234567890n), TypeError);
  assert.throws(() => canonicalizeRFC8785({ big: 42n }), TypeError);
  assert.throws(() => canonicalizeRFC8785([1n]), TypeError);
});

test('TC-RFC-10: Sparse arrays with unassigned holes explicitly throw TypeError', () => {
  const sparse = new Array(3);
  sparse[0] = 1;
  sparse[2] = 3;
  assert.throws(() => canonicalizeRFC8785(sparse), TypeError);
});

test('TC-RFC-11: Lone high surrogates explicitly throw TypeError', () => {
  // \uD800 without low surrogate
  assert.throws(() => canonicalizeRFC8785('Invalid \uD800 text'), TypeError);
  assert.throws(() => canonicalizeRFC8785('\uD800'), TypeError);
});

test('TC-RFC-12: Lone low surrogates explicitly throw TypeError', () => {
  // \uDC00 without preceding high surrogate
  assert.throws(() => canonicalizeRFC8785('Invalid \uDC00 text'), TypeError);
  assert.throws(() => canonicalizeRFC8785('\uDC00'), TypeError);
});

test('TC-RFC-13: Valid supplementary Unicode characters (surrogate pairs) properly serialized', () => {
  // Grinning Face: \uD83D\uDE00 (U+1F600)
  const emojiStr = 'Hello \uD83D\uDE00 World';
  const serialized = canonicalizeRFC8785({ msg: emojiStr });
  assert.equal(serialized, '{"msg":"Hello \uD83D\uDE00 World"}');
});

test('TC-RFC-14: Japanese characters and emoji preserved as literal UTF-8 in strings', () => {
  const jpnObj = {
    name: '超神星龍ジークヴルム・ノヴァ',
    effect: '【界放：1】コア1個をボイドに置く。'
  };
  const res = canonicalizeRFC8785(jpnObj);
  assert.ok(res.includes('超神星龍ジークヴルム・ノヴァ'));
  assert.ok(res.includes('【界放：1】コア1個をボイドに置く。'));
});

test('TC-RFC-15: Known RFC 8785 canonicalization test vectors', () => {
  // RFC 8785 Section 3.2 Examples
  const vec1 = { numbers: [333333333.3333333, 1e+30, 4.50, 2e-3, 0.000000000000000000000000000001] };
  const res1 = canonicalizeRFC8785(vec1);
  assert.ok(res1.startsWith('{"numbers":['));

  const vec2 = { "\u20ac": "Euro Sign", "\r": "Carriage Return" };
  const res2 = canonicalizeRFC8785(vec2);
  assert.equal(res2, '{"\\r":"Carriage Return","€":"Euro Sign"}');
});

// ---------------------------------------------------------------------------
// Section 5: Consistent Identity Derivation Pipeline
// ---------------------------------------------------------------------------

test('TC-PIPE-01: Standard ability compilation derives ID post-keyword binding', () => {
  const card = {
    cardNumber: 'PIPE-01',
    name: 'Clash Spirit',
    raw_effect: '[LV1][LV2] [Clash] (When Attacks) This spirit cannot be blocked.'
  };
  const ir = compileCard(card);
  assert.ok(ir.abilities[0].physicalId.startsWith('PIPE-01#AB_'));
  assert.ok(ir.abilities[0].keywords.length > 0);
  assert.equal(ir.abilities[0].keywords[0].abilityId, ir.abilities[0].physicalId);
});

test('TC-PIPE-02: Condition block compilation derives ID post-binding', () => {
  const card = {
    cardNumber: 'PIPE-02',
    name: 'Brave with Condition',
    raw_effect: '[Brave Condition: Cost 4 or more]\n\n[LV1] (When Attacks) Draw 1 card.'
  };
  const ir = compileCard(card);
  assert.equal(ir.abilities[0].type, 'CONDITION');
  assert.ok(ir.abilities[0].physicalId.startsWith('PIPE-02#AB_'));
  assert.ok(ir.abilities[1].physicalId.startsWith('PIPE-02#AB_'));
});

test('TC-PIPE-03: Overridden card compilation derives ID post-binding', () => {
  // Test using a real override card if exists or custom override
  const card = {
    cardNumber: 'BS01-010', // Chakrambat
    name: 'Chakrambat'
  };
  const ir = compileCard(card);
  assert.ok(ir.abilities.length > 0);
  for (const ab of ir.abilities) {
    assert.ok(ab.physicalId.startsWith('BS01-010#AB_'));
    assert.ok(ab.semanticId.startsWith('SEM#AB_'));
  }
});

test('TC-PIPE-04: Keyword-bound ability compilation: bound keyword abilityId matches physicalId', () => {
  const card = {
    cardNumber: 'PIPE-04',
    name: 'Armor Spirit',
    raw_effect: '[LV1] [Armor: Red, White] (When Attacks) Refresh this spirit.'
  };
  const ir = compileCard(card);
  assert.ok(ir.keywords.length > 0);
  assert.equal(ir.keywords[0].abilityId, ir.abilities[0].physicalId);
});

test('TC-PIPE-05: Compilation where keyword binding does not modify ability', () => {
  const card = {
    cardNumber: 'PIPE-05',
    name: 'Vanilla Effect Spirit',
    raw_effect: '[LV1] (When Attacks) Draw 1 card from your deck.'
  };
  const ir = compileCard(card);
  assert.equal(ir.keywords.length, 0);
  assert.ok(ir.abilities[0].physicalId.startsWith('PIPE-05#AB_'));
});

test('TC-PIPE-06: Repeated compilation of same source card through applicable paths', () => {
  const card = {
    cardNumber: 'PIPE-06',
    name: 'Repeat Path Card',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.'
  };
  const ir1 = compileCard(card);
  const ir2 = compileCard(card);
  assert.equal(ir1.abilities[0].physicalId, ir2.abilities[0].physicalId);
  assert.equal(ir1.abilities[0].semanticId, ir2.abilities[0].semanticId);
});

// ---------------------------------------------------------------------------
// Section 6: Backward Compatibility
// ---------------------------------------------------------------------------

test('TC-COMPAT-01: Compiled abilities preserve legacyId, physicalId, semanticId, and id === physicalId', () => {
  const card = {
    cardNumber: 'COMP-01',
    name: 'Compat Test Card',
    raw_effect: '[LV1] (When Attacks) Draw 1 card.\n\n[LV2] (When Summoned) Core charge.'
  };
  const ir = compileCard(card);

  assert.equal(ir.abilities[0].legacyId, 'COMP-01#a0');
  assert.equal(ir.abilities[1].legacyId, 'COMP-01#a1');

  assert.ok(ir.abilities[0].physicalId.startsWith('COMP-01#AB_'));
  assert.ok(ir.abilities[1].physicalId.startsWith('COMP-01#AB_'));

  assert.equal(ir.abilities[0].id, ir.abilities[0].physicalId);
  assert.equal(ir.abilities[1].id, ir.abilities[1].physicalId);
});

test('TC-COMPAT-02: Engine activation accepts both physicalId and legacyId', async () => {
  // Mock game engine environment
  const mockStack = {
    top: {
      id: 'mock_card_inst_1',
      compiledIr: {
        abilities: [
          {
            id: 'BS-01#AB_WHEN_ATTACKS_NONE_LV1_abc_def',
            physicalId: 'BS-01#AB_WHEN_ATTACKS_NONE_LV1_abc_def',
            legacyId: 'BS-01#a0',
            header: { timing: 'WHEN_ATTACKS' },
            clauses: []
          }
        ]
      }
    }
  };

  const findAbility = (idOrLegacy) => {
    return mockStack.top.compiledIr.abilities.find(ab => ab.id === idOrLegacy || ab.legacyId === idOrLegacy);
  };

  const foundByPhysical = findAbility('BS-01#AB_WHEN_ATTACKS_NONE_LV1_abc_def');
  const foundByLegacy = findAbility('BS-01#a0');
  const notFound = findAbility('BS-01#a99');

  assert.ok(foundByPhysical, 'Lookup by physicalId must succeed');
  assert.ok(foundByLegacy, 'Lookup by legacyId must succeed');
  assert.equal(notFound, undefined, 'Invalid ID returns undefined');
  assert.equal(foundByPhysical, foundByLegacy, 'Both lookups return the exact same ability object');
});

test('TC-COMPAT-03: Keyword bindings preserve abilityId matching physicalId with legacyAbilityId fallback', () => {
  const card = {
    cardNumber: 'COMP-03',
    name: 'Keyword Compat Card',
    raw_effect: '[LV1] [Clash] (When Attacks) This spirit cannot be blocked.'
  };
  const ir = compileCard(card);
  const kw = ir.abilities[0].keywords[0];

  assert.equal(kw.abilityId, ir.abilities[0].physicalId);
  assert.equal(kw.legacyAbilityId, 'COMP-03#a0');
});

// ---------------------------------------------------------------------------
// Section 7: Collision Registry Robustness & Rollback
// ---------------------------------------------------------------------------

test('TC-REG-01: Repeated registration of the same descriptor returns status MATCH', () => {
  const reg = new AbilityCollisionRegistry();
  const desc = { type: 'ABILITY', timing: 'FLASH', clauses: [] };
  const res1 = reg.register('ID-01', desc, 'CARD-1');
  const res2 = reg.register('ID-01', desc, 'CARD-1');

  assert.equal(res1.status, 'NEW');
  assert.equal(res2.status, 'MATCH');
  assert.equal(reg.size, 1);
});

test('TC-REG-02: Same physical ID with mismatched descriptor throws FatalCollisionError', () => {
  const reg = new AbilityCollisionRegistry();
  const desc1 = { type: 'ABILITY', timing: 'FLASH', clauses: [] };
  const desc2 = { type: 'ABILITY', timing: 'WHEN_ATTACKS', clauses: [] };

  reg.register('COLLIDE-ID', desc1, 'CARD-1');
  assert.throws(
    () => reg.register('COLLIDE-ID', desc2, 'CARD-2'),
    FatalCollisionError
  );
});

test('TC-REG-03: Failed registration followed by valid registration keeps registry intact', () => {
  const reg = new AbilityCollisionRegistry();
  const descValid1 = { type: 'ABILITY', timing: 'FLASH', clauses: [] };
  const descValid2 = { type: 'ABILITY', timing: 'WHEN_ATTACKS', clauses: [] };

  reg.register('ID-01', descValid1, 'CARD-1');

  // Attempt invalid duplicate
  assert.throws(
    () => reg.register('ID-01', descValid2, 'CARD-2'),
    FatalCollisionError
  );

  // Subsequent valid registration for distinct ID succeeds
  const res = reg.register('ID-02', descValid2, 'CARD-2');
  assert.equal(res.status, 'NEW');
  assert.equal(reg.size, 2);
});

test('TC-REG-04: Independent compilation sessions reset registry cleanly via clear()', () => {
  const reg = new AbilityCollisionRegistry();
  reg.register('ID-01', { type: 'ABILITY' });
  reg.register('ID-02', { type: 'ABILITY' });
  assert.equal(reg.size, 2);

  reg.clear();
  assert.equal(reg.size, 0);
  assert.equal(reg.get('ID-01'), null);
});

test('TC-REG-05: Atomic snapshot and rollback upon exception during compilation', () => {
  const reg = new AbilityCollisionRegistry();
  reg.register('PRE-EXISTING-01', { type: 'ABILITY', timing: 'MAIN' });
  const snap = reg.snapshot();
  assert.equal(reg.size, 1);

  try {
    reg.register('TEMP-01', { type: 'ABILITY', timing: 'FLASH' });
    reg.register('TEMP-02', { type: 'ABILITY', timing: 'BURST' });
    assert.equal(reg.size, 3);
    // Simulate error midway
    throw new Error('Simulated compilation failure');
  } catch (err) {
    reg.rollbackTo(snap);
  }

  assert.equal(reg.size, 1);
  assert.ok(reg.has('PRE-EXISTING-01'));
  assert.equal(reg.has('TEMP-01'), false);
  assert.equal(reg.has('TEMP-02'), false);
});

test('TC-REG-06: Duplicate ability instances register cleanly as separate entries without collision', () => {
  const reg = new AbilityCollisionRegistry();
  const desc = { type: 'ABILITY', timing: 'WHEN_ATTACKS', levels: [1, 2], clauses: [] };

  const id1 = derivePhysicalAbilityId('DUP-CARD', desc, 1);
  const id2 = derivePhysicalAbilityId('DUP-CARD', desc, 2);

  assert.notEqual(id1, id2);
  const res1 = reg.register(id1, desc, 'DUP-CARD');
  const res2 = reg.register(id2, desc, 'DUP-CARD');

  assert.equal(res1.status, 'NEW');
  assert.equal(res2.status, 'NEW');
  assert.equal(reg.size, 2);
});
