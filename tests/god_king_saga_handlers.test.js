/**
 * tests/god_king_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 7: '07 - God King Saga (十二神皇編)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS35–BS39 and SD33–SD36/BSC23–BSC27 so God King Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS35_SAGA_CARDS } from '../engine/cards/sets/bs35_cards.js';
import { BS36_SAGA_CARDS } from '../engine/cards/sets/bs36_cards.js';
import { BS37_SAGA_CARDS } from '../engine/cards/sets/bs37_cards.js';
import { BS38_SAGA_CARDS } from '../engine/cards/sets/bs38_cards.js';
import { BS39_SAGA_CARDS } from '../engine/cards/sets/bs39_cards.js';
import { SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd33_sd36_bsc23_bsc27_godking_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('God King Saga (十二神皇編) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS35–BS39 and SD33–SD36/BSC23–BSC27', () => {
    assert.equal(BS35_SAGA_CARDS.length, 0);
    assert.equal(BS36_SAGA_CARDS.length, 0);
    assert.equal(BS37_SAGA_CARDS.length, 0);
    assert.equal(BS38_SAGA_CARDS.length, 0);
    assert.equal(BS39_SAGA_CARDS.length, 0);
    assert.equal(SD33_SD36_BSC23_BSC27_GODKING_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles God King Saga hero cards (BS35-XX02, BSC24-005, BS36-XX02, BS38-CP03) cleanly from printed text', () => {
    for (const id of ['BS35-XX02', 'BSC24-005', 'BS36-XX02', 'BS38-CP03']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
