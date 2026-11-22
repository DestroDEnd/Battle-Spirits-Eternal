/**
 * tests/physical_ability_identity_integrity.test.js
 * 
 * Phase 4C.3.2.1 Final Integrity Fix Test Suite:
 * 1. Strict RFC 8785 Array Own-Property Validation (TC-ARR-01 .. TC-ARR-11)
 * 2. Deterministic, Locale-Independent UTF-16 Code-Unit Sorting (TC-SORT-01 .. TC-SORT-10)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeRFC8785,
  sanitizeAstNode,
  compareUtf16CodeUnits,
  isValidArrayIndexKey,
  validateArrayOwnProperties,
  createAbilityDescriptor,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId
} from '../compiler/identity.js';

// ===========================================================================
// SECTION 1: Array Validation Tests (TC-ARR-01 .. TC-ARR-11)
// ===========================================================================

test('TC-ARR-01: Array with a symbol-keyed property explicitly throws TypeError', () => {
  const sym = Symbol('custom_meta');
  const arr = [1, 2, 3];
  arr[sym] = 'symbol_value';

  assert.throws(
    () => canonicalizeRFC8785(arr),
    {
      name: 'TypeError',
      message: /unexpected symbol-keyed own property/i
    }
  );

  assert.throws(
    () => sanitizeAstNode(arr),
    {
      name: 'TypeError',
      message: /unexpected symbol-keyed own property/i
    }
  );
});

test('TC-ARR-02: Array with a named metadata property explicitly throws TypeError', () => {
  const arr = ['a', 'b'];
  arr.metadata = { source: 'test' };

  assert.throws(
    () => canonicalizeRFC8785(arr),
    {
      name: 'TypeError',
      message: /unexpected own property 'metadata'/i
    }
  );

  assert.throws(
    () => sanitizeAstNode(arr),
    {
      name: 'TypeError',
      message: /unexpected own property 'metadata'/i
    }
  );
});

test('TC-ARR-03: Array with unexpected numeric-looking property explicitly throws TypeError', () => {
  // Test leading zero ('01')
  const arrLeadingZero = [10, 20];
  arrLeadingZero['01'] = 'bad_index';

  assert.throws(
    () => canonicalizeRFC8785(arrLeadingZero),
    {
      name: 'TypeError',
      message: /unexpected own property '01'/i
    }
  );

  // Test float index ('1.5')
  const arrFloat = [10, 20];
  arrFloat['1.5'] = 'float_index';

  assert.throws(
    () => canonicalizeRFC8785(arrFloat),
    {
      name: 'TypeError',
      message: /unexpected own property '1.5'/i
    }
  );

  // Test negative index ('-1')
  const arrNeg = [10, 20];
  arrNeg['-1'] = 'negative_index';

  assert.throws(
    () => canonicalizeRFC8785(arrNeg),
    {
      name: 'TypeError',
      message: /unexpected own property '-1'/i
    }
  );
});

test('TC-ARR-04: Array with an accessor property (getter/setter) throws TypeError without invoking getter', () => {
  let getterInvoked = false;
  const arr = [1, 2];
  Object.defineProperty(arr, '0', {
    get() {
      getterInvoked = true;
      return 100;
    },
    enumerable: true,
    configurable: true
  });

  assert.throws(
    () => canonicalizeRFC8785(arr),
    {
      name: 'TypeError',
      message: /cannot be an accessor/i
    }
  );

  // Verifies getter was NOT invoked during validation
  assert.equal(getterInvoked, false, 'Accessor getter must not be invoked during validation');

  assert.throws(
    () => sanitizeAstNode(arr),
    {
      name: 'TypeError',
      message: /cannot be an accessor/i
    }
  );
  assert.equal(getterInvoked, false, 'Accessor getter must not be invoked during AST sanitization');
});

test('TC-ARR-05: Array with a non-enumerable unexpected property explicitly throws TypeError', () => {
  const arr = [1, 2, 3];
  Object.defineProperty(arr, 'hidden_prop', {
    value: 'secret',
    enumerable: false,
    configurable: true,
    writable: true
  });

  assert.throws(
    () => canonicalizeRFC8785(arr),
    {
      name: 'TypeError',
      message: /unexpected own property 'hidden_prop'/i
    }
  );

  assert.throws(
    () => sanitizeAstNode(arr),
    {
      name: 'TypeError',
      message: /unexpected own property 'hidden_prop'/i
    }
  );
});

test('TC-ARR-06: Valid dense arrays serialize and sanitize correctly', () => {
  const arr = [1, 'two', true, null, 42.5];
  const canonical = canonicalizeRFC8785(arr);
  assert.equal(canonical, '[1,"two",true,null,42.5]');

  const sanitized = sanitizeAstNode(arr);
  assert.deepEqual(sanitized, [1, 'two', true, null, 42.5]);
});

test('TC-ARR-07: Valid nested arrays preserve hierarchy and element order', () => {
  const nested = [[1, 2], [3, [4, 5]], []];
  const canonical = canonicalizeRFC8785(nested);
  assert.equal(canonical, '[[1,2],[3,[4,5]],[]]');

  const sanitized = sanitizeAstNode(nested);
  assert.deepEqual(sanitized, [[1, 2], [3, [4, 5]], []]);
});

test('TC-ARR-08: Sparse arrays with holes explicitly throw TypeError', () => {
  // eslint-disable-next-line no-sparse-arrays
  const sparseArr = [1, , 3];

  assert.throws(
    () => canonicalizeRFC8785(sparseArr),
    {
      name: 'TypeError',
      message: /sparse array contains unassigned element at index 1/i
    }
  );

  assert.throws(
    () => sanitizeAstNode(sparseArr),
    {
      name: 'TypeError',
      message: /sparse array contains unassigned element at index 1/i
    }
  );
});

test('TC-ARR-09: Arrays containing unsupported nested values explicitly throw TypeError', () => {
  const arrUndefined = [1, undefined, 3];
  assert.throws(
    () => canonicalizeRFC8785(arrUndefined),
    {
      name: 'TypeError',
      message: /unsupported data type 'undefined'/i
    }
  );

  const arrFunction = [1, () => {}, 3];
  assert.throws(
    () => canonicalizeRFC8785(arrFunction),
    {
      name: 'TypeError',
      message: /unsupported data type 'function'/i
    }
  );

  const arrBigInt = [1, 999999999999999999n, 3];
  assert.throws(
    () => canonicalizeRFC8785(arrBigInt),
    {
      name: 'TypeError',
      message: /unsupported data type 'bigint'/i
    }
  );
});

test('TC-ARR-10: Arrays with valid supplementary Unicode strings properly serialize and sanitize', () => {
  const arr = ['ドラゴン', '⚡ Spark', '𠮷野家', '🔥 Fire'];
  const canonical = canonicalizeRFC8785(arr);
  assert.equal(canonical, '["ドラゴン","⚡ Spark","𠮷野家","🔥 Fire"]');

  const sanitized = sanitizeAstNode(arr);
  assert.deepEqual(sanitized, ['ドラゴン', '⚡ Spark', '𠮷野家', '🔥 Fire']);
});

test('TC-ARR-11: sanitizeAstNode rejects arrays with unexpected own properties in nested ASTs', () => {
  const badArray = [{ op: 'DRAW', count: 1 }];
  badArray.extraFlag = true;

  const astWithBadArray = {
    op: 'SEQUENCE',
    steps: badArray
  };

  assert.throws(
    () => sanitizeAstNode(astWithBadArray),
    {
      name: 'TypeError',
      message: /unexpected own property 'extraFlag'/i
    }
  );
});

// ===========================================================================
// SECTION 2: Deterministic Sorting Tests (TC-SORT-01 .. TC-SORT-10)
// ===========================================================================

test('TC-SORT-01: Mixed-case keyword names sort deterministically by UTF-16 code units', () => {
  const kwList = [
    { name: 'flash' },
    { name: 'Flash' },
    { name: 'FLASH' }
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // In UTF-16 code units: 'F' (0x46) < 'f' (0x66), 'L' (0x4C) < 'l' (0x6C)
  // Expected code unit order: 'FLASH', 'Flash', 'flash'
  assert.deepEqual(sortedNames, ['FLASH', 'Flash', 'flash']);
});

test('TC-SORT-02: Uppercase and lowercase combinations sort strictly by code unit order', () => {
  const kwList = [
    { name: 'burst' },
    { name: 'BURST' },
    { name: 'Burst' },
    { name: 'bURST' }
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // 'BURST' ('B'=0x42) < 'Burst' ('B'=0x42, 'u'=0x75) < 'bURST' ('b'=0x62) < 'burst' ('b'=0x62)
  assert.deepEqual(sortedNames, ['BURST', 'Burst', 'bURST', 'burst']);
});

test('TC-SORT-03: Punctuation in keyword names sorts deterministically', () => {
  const kwList = [
    { name: 'Heavy Armor' },
    { name: 'Heavy-Armor' },
    { name: 'Heavy_Armor' }
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // Code units: ' ' = 0x20, '-' = 0x2D, '_' = 0x5F
  assert.deepEqual(sortedNames, ['Heavy Armor', 'Heavy-Armor', 'Heavy_Armor']);
});

test('TC-SORT-04: Non-ASCII accented keyword names sort deterministically', () => {
  const kwList = [
    { name: 'épée' },
    { name: 'Épée' },
    { name: 'Epee' },
    { name: 'epee' }
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // Code units:
  // 'E' = 0x45
  // 'e' = 0x65
  // 'É' = 0xC9
  // 'é' = 0xE9
  assert.deepEqual(sortedNames, ['Epee', 'epee', 'Épée', 'épée']);
});

test('TC-SORT-05: Japanese characters in keyword names sort deterministically', () => {
  const kwList = [
    { name: 'ネクサス' },      // ネ=0x30CD
    { name: 'スピリット' },    // ス=0x30B9
    { name: 'アルティメット' }, // ア=0x30A2
    { name: 'マジック' }       // マ=0x30DE
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // Code units:
  // ア = 0x30A2
  // ス = 0x30B9
  // ネ = 0x30CD
  // マ = 0x30DE
  assert.deepEqual(sortedNames, ['アルティメット', 'スピリット', 'ネクサス', 'マジック']);
});

test('TC-SORT-06: Supplementary Unicode characters in keywords sort deterministically', () => {
  const kwList = [
    { name: '⭐ Star' },    // ⭐ = U+2B50 (0x2B50)
    { name: '⚡ Bolt' },    // ⚡ = U+26A1 (0x26A1)
    { name: '✨ Spark' },   // ✨ = U+2728 (0x2728)
    { name: '🔥 Flame' }    // 🔥 = U+1F525 (surrogates 0xD83D 0xDD25)
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedNames = desc.keywords.map(k => k.name);

  // Code units:
  // ⚡ = 0x26A1
  // ✨ = 0x2728
  // ⭐ = 0x2B50
  // 🔥 = 0xD83D (high surrogate)
  assert.deepEqual(sortedNames, ['⚡ Bolt', '✨ Spark', '⭐ Star', '🔥 Flame']);
});

test('TC-SORT-07: Keyword parameter ordering when keyword names are identical', () => {
  const kwList = [
    { name: 'Tribute', parameter: 'Cost 5' },
    { name: 'Tribute', parameter: 'Cost 3' },
    { name: 'Tribute', parameter: 'Cost 10' },
    { name: 'Tribute', parameter: null }
  ];

  const ability = {
    type: 'ABILITY',
    keywords: kwList,
    clauses: []
  };

  const desc = createAbilityDescriptor(ability);
  const sortedParams = desc.keywords.map(k => k.parameter);

  // Parameter string code units:
  // null -> '' (length 0)
  // 'Cost 10' ('1' = 0x31)
  // 'Cost 3' ('3' = 0x33)
  // 'Cost 5' ('5' = 0x35)
  assert.deepEqual(sortedParams, [null, 'Cost 10', 'Cost 3', 'Cost 5']);
});

test('TC-SORT-08: UTF-16 code-unit comparator verification across known ordering vectors', () => {
  // Test compareUtf16CodeUnits directly
  assert.equal(compareUtf16CodeUnits('A', 'B') < 0, true);
  assert.equal(compareUtf16CodeUnits('B', 'A') > 0, true);
  assert.equal(compareUtf16CodeUnits('A', 'A'), 0);
  assert.equal(compareUtf16CodeUnits('a', 'A') > 0, true); // 'a' (0x61) > 'A' (0x41)
  assert.equal(compareUtf16CodeUnits('abc', 'abcd') < 0, true);
  assert.equal(compareUtf16CodeUnits('', 'a') < 0, true);
  assert.equal(compareUtf16CodeUnits(null, 'a') < 0, true);
  assert.equal(compareUtf16CodeUnits(undefined, '') === 0, true);
});

test('TC-SORT-09: Stable identities across repeated compilation regardless of initial keyword order', () => {
  const ability1 = {
    type: 'ABILITY',
    keywords: [
      { name: 'Flash', parameter: 'Cost 2' },
      { name: 'Heavy Armor', parameter: 'Red' },
      { name: 'Burst', parameter: null }
    ],
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const ability2 = {
    type: 'ABILITY',
    keywords: [
      { name: 'Burst', parameter: null },
      { name: 'Heavy Armor', parameter: 'Red' },
      { name: 'Flash', parameter: 'Cost 2' }
    ],
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };

  const id1 = derivePhysicalAbilityId('BS01-001', createAbilityDescriptor(ability1));
  const id2 = derivePhysicalAbilityId('BS01-001', createAbilityDescriptor(ability2));

  assert.equal(id1, id2, 'Physical IDs must be 100% identical regardless of keyword entry order');

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ability1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ability2));

  assert.equal(sem1, sem2, 'Semantic IDs must be 100% identical regardless of keyword entry order');
});

test('TC-SORT-10: Meaningful clause execution order is preserved (clauses are NOT sorted)', () => {
  const abilityOrder1 = {
    type: 'ABILITY',
    clauses: [
      { op: { op: 'DESTROY', target: 'SPIRIT' } },
      { op: { op: 'DRAW', count: 1 } }
    ]
  };

  const abilityOrder2 = {
    type: 'ABILITY',
    clauses: [
      { op: { op: 'DRAW', count: 1 } },
      { op: { op: 'DESTROY', target: 'SPIRIT' } }
    ]
  };

  const desc1 = createAbilityDescriptor(abilityOrder1);
  const desc2 = createAbilityDescriptor(abilityOrder2);

  assert.equal(desc1.clauses[0].op.op, 'DESTROY');
  assert.equal(desc1.clauses[1].op.op, 'DRAW');

  assert.equal(desc2.clauses[0].op.op, 'DRAW');
  assert.equal(desc2.clauses[1].op.op, 'DESTROY');

  const id1 = derivePhysicalAbilityId('BS01-001', desc1);
  const id2 = derivePhysicalAbilityId('BS01-001', desc2);

  assert.notEqual(id1, id2, 'Different clause execution orders MUST produce different physical IDs');
});
