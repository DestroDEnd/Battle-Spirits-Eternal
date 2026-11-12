/**
 * tests/rebirth_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 11: '11 - Rebirth Saga (転醒編)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS52–BS55 and SD51–SD57/BSC36 so Rebirth Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS52_SAGA_CARDS } from '../engine/cards/sets/bs52_cards.js';
import { BS53_SAGA_CARDS } from '../engine/cards/sets/bs53_cards.js';
import { BS54_SAGA_CARDS } from '../engine/cards/sets/bs54_cards.js';
import { BS55_SAGA_CARDS } from '../engine/cards/sets/bs55_cards.js';
import { SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd51_sd57_bsc36_rebirth_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Rebirth Saga (転醒編) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS52–BS55 and SD51–SD57/BSC36', () => {
    assert.equal(BS52_SAGA_CARDS.length, 0);
    assert.equal(BS53_SAGA_CARDS.length, 0);
    assert.equal(BS54_SAGA_CARDS.length, 0);
    assert.equal(BS55_SAGA_CARDS.length, 0);
    assert.equal(SD51_SD57_BSC36_REBIRTH_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles Rebirth Saga hero cards (BS52-TX01, BS53-001, BS54-001, BS55-001, SD51-008) cleanly from printed text', () => {
    for (const id of ['BS52-TX01', 'BS53-001', 'BS54-001', 'BS55-001', 'SD51-008']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
