/**
 * tests/physical_ability_identity_final.test.js
 * 
 * Phase 4C.3.2.1 Final Corrective Pass Verification Suite:
 * - Section 1: Semantic Identity for Compiled Operations (TC-SEM-01 .. TC-SEM-10)
 * - Section 2: Strict RFC 8785 Validation & Test Vector Conformance (TC-RFCVAL-01 .. TC-RFCVAL-10)
 * - Section 3: Actual Engine activateAbility() Integration (TC-ACT-01 .. TC-ACT-07)
 * - Section 4: Documented Condition Normalization (TC-CONDNORM-01 .. TC-CONDNORM-10)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  canonicalizeRFC8785,
  createAbilityDescriptor,
  parseConditionBlock,
  derivePhysicalAbilityId,
  deriveSemanticAbilityId,
  sanitizeAstNode,
  globalCollisionRegistry
} from '../compiler/identity.js';
import { compileCard } from '../compiler/index.js';
import { createGame } from '../engine/index.js';

// ---------------------------------------------------------------------------
// Section 1: Semantic Identity for Compiled Operations
// ---------------------------------------------------------------------------

test('TC-SEM-01: Identical operation ASTs with different harmless wording produce identical semantic IDs', () => {
  const ab1 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [
      {
        op: { op: 'DRAW', count: 1 },
        cleanText: 'Draw 1 card from your deck.'
      }
    ]
  };
  const ab2 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [
      {
        op: { op: 'DRAW', count: 1 },
        cleanText: 'Draw 1 card.'
      }
    ]
  };

  const desc1 = createAbilityDescriptor(ab1);
  const desc2 = createAbilityDescriptor(ab2);

  // Authoritative structured op makes descriptors identical; cleanText is not included
  assert.deepEqual(desc1, desc2);
  const sem1 = deriveSemanticAbilityId(desc1);
  const sem2 = deriveSemanticAbilityId(desc2);
  assert.equal(sem1, sem2, 'Different cosmetic prose with identical operation AST must produce identical semantic ID');
});

test('TC-SEM-02: Different operation parameters produce different semantic IDs', () => {
  const ab1 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 }, cleanText: 'Draw 1 card.' }]
  };
  const ab2 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 2 }, cleanText: 'Draw 2 cards.' }]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Different count parameters must produce different semantic IDs');
});

test('TC-SEM-03: Different targets produce different semantic IDs', () => {
  const ab1 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DESTROY', target: { side: 'opp', types: ['Spirit'] } } }]
  };
  const ab2 = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DESTROY', target: { side: 'any', types: ['Spirit'] } } }]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Different target criteria must produce different semantic IDs');
});

test('TC-SEM-04: Different durations produce different semantic IDs', () => {
  const ab1 = {
    header: { timing: 'FLASH', levels: [1] },
    clauses: [{ duration: 'UNTIL_END_OF_TURN', op: { op: 'BP_BUFF', amount: 3000 } }]
  };
  const ab2 = {
    header: { timing: 'FLASH', levels: [1] },
    clauses: [{ duration: 'UNTIL_NEXT_REFRESH', op: { op: 'BP_BUFF', amount: 3000 } }]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Different durations must produce different semantic IDs');
});

test('TC-SEM-05: Different costs produce different semantic IDs', () => {
  const ab1 = {
    header: { timing: 'FLASH', levels: [1] },
    clauses: [{ isCost: true, op: { op: 'PAY_CORE', count: 1 } }]
  };
  const ab2 = {
    header: { timing: 'FLASH', levels: [1] },
    clauses: [{ isCost: false, op: { op: 'PAY_CORE', count: 1 } }]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Different isCost flag must produce different semantic IDs');
});

test('TC-SEM-06: Different conditions produce different semantic IDs', () => {
  const ab1 = {
    header: { timing: 'WHEN_ATTACKS', levels: [1] },
    clauses: [{ condition: { type: 'COUNT_GTE', count: 2 }, op: { op: 'DRAW', count: 1 } }]
  };
  const ab2 = {
    header: { timing: 'WHEN_ATTACKS', levels: [1] },
    clauses: [{ condition: { type: 'COUNT_GTE', count: 3 }, op: { op: 'DRAW', count: 1 } }]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Different clause conditions must produce different semantic IDs');
});

test('TC-SEM-07: Different clause ordering produces different semantic IDs', () => {
  const clauseDraw = { op: { op: 'DRAW', count: 1 } };
  const clauseBuff = { op: { op: 'BP_BUFF', amount: 2000 } };

  const ab1 = {
    header: { timing: 'WHEN_ATTACKS', levels: [1] },
    clauses: [clauseDraw, clauseBuff]
  };
  const ab2 = {
    header: { timing: 'WHEN_ATTACKS', levels: [1] },
    clauses: [clauseBuff, clauseDraw]
  };

  const sem1 = deriveSemanticAbilityId(createAbilityDescriptor(ab1));
  const sem2 = deriveSemanticAbilityId(createAbilityDescriptor(ab2));
  assert.notEqual(sem1, sem2, 'Sequential clause ordering must affect semantic ID');
});

test('TC-SEM-08: Unsupported text remains part of identity when no structured operation is available', () => {
  const ab1 = {
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'UNSUPPORTED' }, rawText: 'Special anime exclusive mechanic A.' }]
  };
  const ab2 = {
    header: { timing: 'MAIN', levels: [1] },
    clauses: [{ op: { op: 'UNSUPPORTED' }, rawText: 'Special anime exclusive mechanic B.' }]
  };

  const desc1 = createAbilityDescriptor(ab1);
  const desc2 = createAbilityDescriptor(ab2);

  assert.equal(desc1.clauses[0].textFallback, 'Special anime exclusive mechanic A.');
  assert.equal(desc2.clauses[0].textFallback, 'Special anime exclusive mechanic B.');

  const sem1 = deriveSemanticAbilityId(desc1);
  const sem2 = deriveSemanticAbilityId(desc2);
  assert.notEqual(sem1, sem2, 'Different unsupported clause texts must produce different semantic IDs');
});

test('TC-SEM-09: Partially compiled clauses preserve both structured representation and unparsed remainder', () => {
  const ab = {
    header: { timing: 'WHEN_ATTACKS', levels: [1] },
    clauses: [
      {
        op: { op: 'DRAW', count: 1 },
        unparsedRemainder: 'and also trigger special non-standard effect.'
      }
    ]
  };
  const desc = createAbilityDescriptor(ab);
  assert.equal(desc.clauses[0].op.op, 'DRAW');
  assert.equal(desc.clauses[0].textFallback, 'and also trigger special non-standard effect.');
});

test('TC-SEM-10: Physical IDs remain distinct across different canonical card numbers even when semantic IDs match', () => {
  const ab = {
    header: { timing: 'WHEN_ATTACKS', trigger: 'ON_ATTACK', levels: [1] },
    clauses: [{ op: { op: 'DRAW', count: 1 } }]
  };
  const desc = createAbilityDescriptor(ab);

  const physCard1 = derivePhysicalAbilityId('BS01-001', desc);
  const physCard2 = derivePhysicalAbilityId('SD01-001', desc);
  const semCard1 = deriveSemanticAbilityId(desc);
  const semCard2 = deriveSemanticAbilityId(desc);

  assert.notEqual(physCard1, physCard2, 'Physical IDs must differ across different canonical cards');
  assert.equal(semCard1, semCard2, 'Semantic IDs must be 100% identical for equivalent abilities');
  assert.ok(physCard1.startsWith('BS01-001#AB_'));
  assert.ok(physCard2.startsWith('SD01-001#AB_'));
});

// ---------------------------------------------------------------------------
// Section 2: Strict RFC 8785 Validation & Test Vector Conformance
// ---------------------------------------------------------------------------

test('TC-RFCVAL-01: Symbol-keyed properties rejected explicitly', () => {
  const obj = { a: 1 };
  obj[Symbol('test')] = 'symbolVal';
  assert.throws(() => canonicalizeRFC8785(obj), TypeError);
});

test('TC-RFCVAL-02: Date objects rejected explicitly', () => {
  assert.throws(() => canonicalizeRFC8785(new Date()), TypeError);
  assert.throws(() => canonicalizeRFC8785({ createdAt: new Date() }), TypeError);
});

test('TC-RFCVAL-03: Map and Set rejected explicitly', () => {
  assert.throws(() => canonicalizeRFC8785(new Map([['a', 1]])), TypeError);
  assert.throws(() => canonicalizeRFC8785(new Set([1, 2, 3])), TypeError);
  assert.throws(() => canonicalizeRFC8785({ data: new Set() }), TypeError);
});

test('TC-RFCVAL-04: Typed arrays and ArrayBuffer rejected explicitly', () => {
  assert.throws(() => canonicalizeRFC8785(new Uint8Array([1, 2, 3])), TypeError);
  assert.throws(() => canonicalizeRFC8785(new ArrayBuffer(8)), TypeError);
  assert.throws(() => canonicalizeRFC8785({ buffer: new Int32Array([42]) }), TypeError);
});

test('TC-RFCVAL-05: Class instances (non-plain objects) rejected explicitly', () => {
  class CustomModel {
    constructor() { this.name = 'test'; }
  }
  assert.throws(() => canonicalizeRFC8785(new CustomModel()), TypeError);
  assert.throws(() => canonicalizeRFC8785({ model: new CustomModel() }), TypeError);
});

test('TC-RFCVAL-06: Circular references in objects and arrays rejected explicitly', () => {
  const circularObj = { a: 1 };
  circularObj.self = circularObj;
  assert.throws(() => canonicalizeRFC8785(circularObj), TypeError);

  const circularArr = [1, 2];
  circularArr.push(circularArr);
  assert.throws(() => canonicalizeRFC8785(circularArr), TypeError);
});

test('TC-RFCVAL-07: Nested unsupported values inside operation ASTs rejected by sanitizeAstNode', () => {
  const opWithFunc = { op: 'DRAW', callback: () => {} };
  assert.throws(() => sanitizeAstNode(opWithFunc), TypeError);

  const opWithBigInt = { op: 'BP_BUFF', amount: 1000n };
  assert.throws(() => sanitizeAstNode(opWithBigInt), TypeError);
});

test('TC-RFCVAL-08: Nested unsupported values inside condition ASTs rejected by sanitizeAstNode', () => {
  const condWithSymbol = { type: 'COUNT', sym: Symbol('bad') };
  assert.throws(() => sanitizeAstNode(condWithSymbol), TypeError);
});

test('TC-RFCVAL-09: Valid plain objects and arrays properly serialized', () => {
  const valid = { b: 2, a: [1, 2, { d: true, c: null }] };
  assert.equal(canonicalizeRFC8785(valid), '{"a":[1,2,{"c":null,"d":true}],"b":2}');
});

test('TC-RFCVAL-10: Every vector loaded from RFC8785_TEST_VECTORS.json executed and verified', () => {
  const vectorFilePath = new URL('./RFC8785_TEST_VECTORS.json', import.meta.url);
  const rawData = fs.readFileSync(vectorFilePath, 'utf8');
  const vectors = JSON.parse(rawData);

  assert.ok(Array.isArray(vectors), 'Vectors file must contain an array of test vectors');
  assert.ok(vectors.length >= 10, `Expected at least 10 test vectors, found ${vectors.length}`);

  let passedCount = 0;
  let failedCount = 0;

  for (const v of vectors) {
    try {
      const actual = canonicalizeRFC8785(v.input);
      assert.equal(actual, v.expected, `Vector [${v.id}] ${v.description} failed`);
      passedCount++;
    } catch (err) {
      failedCount++;
      throw err;
    }
  }

  assert.equal(failedCount, 0, 'Zero test vectors should fail');
  assert.equal(passedCount, vectors.length, 'All loaded test vectors must pass');
});

// ---------------------------------------------------------------------------
// Section 3: Actual Engine activateAbility() Integration
// ---------------------------------------------------------------------------

function createTestDeck(cardDef, extraCount = 10) {
  const ir = compileCard(cardDef);
  const spirit = {
    cardNumber: cardDef.card_number || cardDef.cardNumber,
    type: 'Spirit',
    cost: 0,
    compiledIr: ir
  };
  const extraCards = Array.from({ length: extraCount }, (_, i) => ({
    cardNumber: `EXTRA-${i}`,
    type: 'Spirit',
    cost: 0
  }));
  return { spirit, deck: [spirit, ...extraCards], ir };
}

test('TC-ACT-01: Actual engine activateAbility() succeeds using new physical ID', async () => {
  const { deck, ir } = createTestDeck({
    card_number: 'TEST-ACT-01',
    name: 'Activation Tester Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.'
  });
  const physicalId = ir.abilities[0].physicalId;

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';

  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-01');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  const actRes = await game.activateAbility(fieldCard.id, physicalId, 'player');
  assert.equal(actRes.activated, true, 'Ability must report activated: true');
  assert.equal(actRes.success, true, 'Activation by physical ID must succeed');
});

test('TC-ACT-02: Actual engine activateAbility() succeeds using legacy ID (#a0)', async () => {
  const { deck, ir } = createTestDeck({
    card_number: 'TEST-ACT-02',
    name: 'Legacy Activation Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.'
  });
  const legacyId = ir.abilities[0].legacyId;
  assert.equal(legacyId, 'TEST-ACT-02#a0');

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';

  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-02');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  const actRes = await game.activateAbility(fieldCard.id, legacyId, 'player');
  assert.equal(actRes.activated, true, 'Ability must report activated: true');
  assert.equal(actRes.success, true, 'Activation by legacy ID (#a0) must succeed');
});

test('TC-ACT-03: Actual engine activateAbility() returns ABILITY_NOT_FOUND on unknown ID', async () => {
  const { deck } = createTestDeck({
    card_number: 'TEST-ACT-03',
    name: 'Unknown ID Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.'
  });

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';
  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-03');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  const actRes = await game.activateAbility(fieldCard.id, 'TOTALLY_UNKNOWN_ABILITY_ID', 'player');
  assert.equal(actRes.success, false);
  assert.equal(actRes.reason, 'ABILITY_NOT_FOUND');
});

test('TC-ACT-04: Actual engine activateAbility() targets specific requested ability (#a1 vs #a0)', async () => {
  const { deck, ir } = createTestDeck({
    card_number: 'TEST-ACT-04',
    name: 'Multi Ability Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.\n\n[LV1] (Main Step) Draw 1 card.'
  });
  assert.equal(ir.abilities.length, 2);

  const ab0 = ir.abilities[0];
  const ab1 = ir.abilities[1];

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';
  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-04');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  // Activate ability 1 using its physical ID
  const actRes1 = await game.activateAbility(fieldCard.id, ab1.physicalId, 'player');
  assert.equal(actRes1.activated, true);
  assert.equal(actRes1.success, true);

  // Activate ability 0 using its legacy ID
  const actRes0 = await game.activateAbility(fieldCard.id, ab0.legacyId, 'player');
  assert.equal(actRes0.activated, true);
  assert.equal(actRes0.success, true);
});

test('TC-ACT-05: Actual engine activateAbility() correctly dispatches when multiple abilities exist on same card', async () => {
  const { deck, ir } = createTestDeck({
    card_number: 'TEST-ACT-05',
    name: 'Dual Main Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.\n\n[LV1] (Flash) Refresh this spirit.'
  });

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';
  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-05');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  // Ability 0 has timing MAIN; step is MAIN -> success
  const act0 = await game.activateAbility(fieldCard.id, ir.abilities[0].id, 'player');
  assert.equal(act0.activated, true);
  assert.equal(act0.success, true);

  // Ability 1 has timing FLASH; step is MAIN (not flash) -> timing mismatch
  const act1 = await game.activateAbility(fieldCard.id, ir.abilities[1].id, 'player');
  assert.equal(act1.success, false);
  assert.equal(act1.reason, 'ABILITY_TIMING_MISMATCH');
});

test('TC-ACT-06: Actual engine activateAbility() functions with real card compiled via compileCard', async () => {
  const card = {
    card_number: 'BS01-094', // Gran-Dolbalkan
    name: 'Gran-Dolbalkan',
    raw_effect: '[LV1][LV2] (Main Step) Draw 1 card.'
  };
  const { deck, ir } = createTestDeck(card);

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';
  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'BS01-094');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  const res = await game.activateAbility(fieldCard.id, ir.abilities[0].physicalId, 'player');
  assert.equal(res.activated, true);
  assert.equal(res.success, true);
});

test('TC-ACT-07: Duplicate identical ability instances do not cause accidental activation of wrong instance', async () => {
  const { deck, ir } = createTestDeck({
    card_number: 'TEST-ACT-07',
    name: 'Double Instance Spirit',
    raw_effect: '[LV1] (Main Step) Draw 1 card.\n\n[LV1] (Main Step) Draw 1 card.'
  });
  assert.equal(ir.abilities.length, 2);

  const inst1Id = ir.abilities[0].id;
  const inst2Id = ir.abilities[1].id;
  assert.notEqual(inst1Id, inst2Id);
  assert.ok(inst2Id.endsWith('_inst2'));

  const game = createGame({ playerDeck: deck, opponentDeck: [] });
  game.state.step = 'MAIN';
  const handCard = game.state.players.player.hand.find(c => c.cardNumber === 'TEST-ACT-07');
  await game.playCard(handCard.id, [], 'player');
  const fieldCard = game.state.players.player.field[0].top;

  const res1 = await game.activateAbility(fieldCard.id, inst1Id, 'player');
  assert.equal(res1.activated, true);
  assert.equal(res1.success, true);

  const res2 = await game.activateAbility(fieldCard.id, inst2Id, 'player');
  assert.equal(res2.activated, true);
  assert.equal(res2.success, true);
});

// ---------------------------------------------------------------------------
// Section 4: Documented Condition Descriptor Normalization
// ---------------------------------------------------------------------------

test('TC-CONDNORM-01: Harmless whitespace variation normalizes to identical descriptor', () => {
  const text1 = '[Brave Condition: Cost 4 or more]';
  const text2 = '[Brave Condition:   Cost    4   or   more   ]';
  const p1 = parseConditionBlock(text1);
  const p2 = parseConditionBlock(text2);
  assert.deepEqual(p1, p2);
  assert.equal(p1.expression, 'Cost 4 or more');
});

test('TC-CONDNORM-02: Meaningful punctuation variation is preserved and produces different descriptors', () => {
  const p1 = parseConditionBlock('[Brave Condition: Cost 4 or more - Spirit]');
  const p2 = parseConditionBlock('[Brave Condition: Cost 4 or more, Spirit]');
  assert.notEqual(p1.expression, p2.expression);
});

test('TC-CONDNORM-03: Different numeric thresholds produce different descriptors', () => {
  const p1 = parseConditionBlock('[Brave Condition: Cost 4 or more]');
  const p2 = parseConditionBlock('[Brave Condition: Cost 5 or more]');
  assert.notEqual(p1.expression, p2.expression);
});

test('TC-CONDNORM-04: Different comparison operators produce different descriptors', () => {
  const p1 = parseConditionBlock('[Brave Condition: Cost 4 or more]');
  const p2 = parseConditionBlock('[Brave Condition: Cost 4 or less]');
  assert.notEqual(p1.expression, p2.expression);
});

test('TC-CONDNORM-05: Different card-type requirements produce different descriptors', () => {
  const p1 = parseConditionBlock('[Brave Condition: Cost 4 or more Spirit]');
  const p2 = parseConditionBlock('[Brave Condition: Cost 4 or more Ultimate]');
  assert.notEqual(p1.expression, p2.expression);
});

test('TC-CONDNORM-06: Different logical connectors produce different descriptors', () => {
  const p1 = parseConditionBlock('[Summon Condition: Spirit with 2 or more cores and exhausted]');
  const p2 = parseConditionBlock('[Summon Condition: Spirit with 2 or more cores or exhausted]');
  assert.notEqual(p1.expression, p2.expression);
});

test('TC-CONDNORM-07: Different condition types produce different conditionTypes and descriptors', () => {
  const p1 = parseConditionBlock('[Summon Condition: Cost 4 or more]');
  const p2 = parseConditionBlock('[Brave Condition: Cost 4 or more]');
  assert.equal(p1.conditionType, 'SUMMON_CONDITION');
  assert.equal(p2.conditionType, 'BRAVE_CONDITION');
  assert.notEqual(p1.conditionType, p2.conditionType);
});

test('TC-CONDNORM-08: Unsupported condition expressions preserved as normalized text fallback', () => {
  const p = parseConditionBlock('[Custom Condition: Non-standard anime rule applied.]');
  assert.equal(p.conditionType, 'CUSTOM_CONDITION');
  assert.equal(p.expression, 'Non-standard anime rule applied');
  assert.equal(p.type, 'CONDITION_TEXT_FALLBACK');
});

test('TC-CONDNORM-09: Explicit labeling of condition descriptor as CONDITION_TEXT_FALLBACK', () => {
  const p = parseConditionBlock('[Summon Condition: Life is 2 or less]');
  assert.equal(p.type, 'CONDITION_TEXT_FALLBACK');
  assert.equal(p.source, 'NORMALIZED_TEXT');
});

test('TC-CONDNORM-10: Actual compiled condition-block identity verified via compileCard()', () => {
  const card = {
    cardNumber: 'COND-COMP-01',
    name: 'Condition Compiler Card',
    raw_effect: '[Brave Condition: Cost 4 or more]\n\n[LV1] (When Attacks) Draw 1 card.'
  };
  const ir = compileCard(card);
  assert.equal(ir.abilities[0].type, 'CONDITION');
  assert.equal(ir.abilities[0].condition.conditionType, 'BRAVE_CONDITION');
  assert.equal(ir.abilities[0].condition.expression, 'Cost 4 or more');
  assert.ok(ir.abilities[0].physicalId.startsWith('COND-COMP-01#AB_'));
});
