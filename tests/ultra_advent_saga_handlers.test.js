/**
 * tests/ultra_advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 10: '10 - Ultra Advent Saga (超煌臨編)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS48–BS51 and SD45–SD50/BSC34–BSC35 so Ultra Advent Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS48_SAGA_CARDS } from '../engine/cards/sets/bs48_cards.js';
import { BS49_SAGA_CARDS } from '../engine/cards/sets/bs49_cards.js';
import { BS50_SAGA_CARDS } from '../engine/cards/sets/bs50_cards.js';
import { BS51_SAGA_CARDS } from '../engine/cards/sets/bs51_cards.js';
import { SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd45_sd50_bsc34_bsc35_ultraadvent_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Ultra Advent Saga (超煌臨編) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS48–BS51 and SD45–SD50/BSC34–BSC35', () => {
    assert.equal(BS48_SAGA_CARDS.length, 0);
    assert.equal(BS49_SAGA_CARDS.length, 0);
    assert.equal(BS50_SAGA_CARDS.length, 0);
    assert.equal(BS51_SAGA_CARDS.length, 0);
    assert.equal(SD45_SD50_BSC34_BSC35_ULTRAADVENT_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles Ultra Advent Saga hero cards (BS51-X01, BS51-X08, SD48-X03, BS49-X01) cleanly from printed text', () => {
    for (const id of ['BS51-X01', 'BS51-X08', 'SD48-X03', 'BS49-X01']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
