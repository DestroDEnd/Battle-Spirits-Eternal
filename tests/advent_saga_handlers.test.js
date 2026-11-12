/**
 * tests/advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 8: '08 - Advent Saga (煌臨編)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS40–BS43 and SD37–SD40/BSC28–BSC30 so Advent Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS40_SAGA_CARDS } from '../engine/cards/sets/bs40_cards.js';
import { BS41_SAGA_CARDS } from '../engine/cards/sets/bs41_cards.js';
import { BS42_SAGA_CARDS } from '../engine/cards/sets/bs42_cards.js';
import { BS43_SAGA_CARDS } from '../engine/cards/sets/bs43_cards.js';
import { SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd37_sd40_bsc28_bsc30_advent_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Advent Saga (煌臨編) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS40–BS43 and SD37–SD40/BSC28–BSC30', () => {
    assert.equal(BS40_SAGA_CARDS.length, 0);
    assert.equal(BS41_SAGA_CARDS.length, 0);
    assert.equal(BS42_SAGA_CARDS.length, 0);
    assert.equal(BS43_SAGA_CARDS.length, 0);
    assert.equal(SD37_SD40_BSC28_BSC30_ADVENT_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles Advent Saga hero cards (BS40-X01, BS40-078, BS43-X01, BS41-X06) cleanly from printed text', () => {
    for (const id of ['BS40-X01', 'BS40-078', 'BS43-X01', 'BS41-X06']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
