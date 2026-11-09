/**
 * tests/saga_catalog.test.js
 *
 * Test suite for the 17 Battle Spirits Sagas / Generations catalog and card mapping.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAGA_DEFINITIONS, getSagaById, resolveCardSaga } from '../engine/rules/saga_catalog.js';

describe('Saga / Generation Catalog & Resolver Suite', () => {
  it('1. Schema: Defines exactly 17 canonical sagas with complete metadata', () => {
    assert.equal(SAGA_DEFINITIONS.length, 17, 'Must have exactly 17 sagas');
    for (const saga of SAGA_DEFINITIONS) {
      assert.ok(saga.id.startsWith('saga_'), `Saga id should start with saga_: ${saga.id}`);
      assert.ok(saga.name, `Saga must have a name: ${saga.id}`);
      assert.ok(saga.shortName, `Saga must have a shortName: ${saga.id}`);
      assert.ok(saga.prefixes && saga.prefixes.length > 0, `Saga must specify set prefixes: ${saga.id}`);
    }
  });

  it('2. Identification: Resolves sagas by ID, name, or substring', () => {
    const s1 = getSagaById('saga_01');
    assert.equal(s1?.name, '01 - Booster Set Saga');

    const s3 = getSagaById('Heroes');
    assert.equal(s3?.id, 'saga_03');

    const s5 = getSagaById('Ultimate');
    assert.equal(s5?.id, 'saga_05');

    const s13 = getSagaById('Contract');
    assert.equal(s13?.id, 'saga_13');
  });

  it('3. Card Resolution: Accurately maps card numbers to their canonical Saga', () => {
    // 01 - Booster Set Saga
    const bs01 = resolveCardSaga('BS01-001');
    assert.equal(bs01?.id, 'saga_01');

    // 02 - Constellation Saga
    const bs12 = resolveCardSaga('BS12-X01');
    assert.equal(bs12?.id, 'saga_02');

    // 03 - Heroes Saga
    const bs14 = resolveCardSaga('BS14-001');
    assert.equal(bs14?.id, 'saga_03');
    const sd06 = resolveCardSaga('SD06-001');
    assert.equal(sd06?.id, 'saga_03');

    // 04 - Sword Blade Saga
    const bs19 = resolveCardSaga('BS19-X01');
    assert.equal(bs19?.id, 'saga_04');

    // 05 - Ultimate Saga
    const bs28 = resolveCardSaga('BS28-X05');
    assert.equal(bs28?.id, 'saga_05');

    // 06 - Soul Saga
    const bs33 = resolveCardSaga('BS33-029');
    assert.equal(bs33?.id, 'saga_06');

    // 13 - Contract Saga
    const bs60 = resolveCardSaga('BS60-CX04');
    assert.equal(bs60?.id, 'saga_13');

    // 16 - Collaboration
    const cb01 = resolveCardSaga('CB01-001');
    assert.equal(cb01?.id, 'saga_16');
  });

  it('4. Object Resolution: Resolves card object with sets_json fallback', () => {
    const cardObj = {
      name: 'Custom Promo Spirit',
      card_number: 'P14-001',
      sets_json: '["BS14", "SD06"]'
    };
    const saga = resolveCardSaga(cardObj);
    assert.equal(saga?.id, 'saga_03', 'Should detect BS14 from sets_json');
  });
});
