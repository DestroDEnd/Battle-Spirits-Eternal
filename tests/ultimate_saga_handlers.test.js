/**
 * tests/ultimate_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 5: '05 - Ultimate Saga'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS24–BS29 and SD18–SD27 so Ultimate Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS24_SAGA_CARDS } from '../engine/cards/sets/bs24_cards.js';
import { BS25_SAGA_CARDS } from '../engine/cards/sets/bs25_cards.js';
import { BS26_SAGA_CARDS } from '../engine/cards/sets/bs26_cards.js';
import { BS27_SAGA_CARDS } from '../engine/cards/sets/bs27_cards.js';
import { BS28_SAGA_CARDS } from '../engine/cards/sets/bs28_cards.js';
import { BS29_SAGA_CARDS } from '../engine/cards/sets/bs29_cards.js';
import { SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd18_sd27_ultimate_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Ultimate Saga Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS24–BS29 and SD18–SD27', () => {
    assert.equal(BS24_SAGA_CARDS.length, 0);
    assert.equal(BS25_SAGA_CARDS.length, 0);
    assert.equal(BS26_SAGA_CARDS.length, 0);
    assert.equal(BS27_SAGA_CARDS.length, 0);
    assert.equal(BS28_SAGA_CARDS.length, 0);
    assert.equal(BS29_SAGA_CARDS.length, 0);
    assert.equal(SD18_SD27_ULTIMATE_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles Ultimate Saga hero cards (BS24-X03, BS24-X06, BS25-X04, BS25-X06, BS28-X05, BS29-X01) cleanly from printed text', () => {
    for (const id of ['BS24-X03', 'BS24-X06', 'BS25-X04', 'BS25-X06', 'BS28-X05', 'BS29-X01']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
