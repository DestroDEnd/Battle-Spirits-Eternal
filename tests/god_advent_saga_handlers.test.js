/**
 * tests/god_advent_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 9: '09 - God Advent / Dual Era Saga (神煌臨編)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS44–BS47 and SD41–SD44/BSC31–BSC33 so God Advent Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS44_SAGA_CARDS } from '../engine/cards/sets/bs44_cards.js';
import { BS45_SAGA_CARDS } from '../engine/cards/sets/bs45_cards.js';
import { BS46_SAGA_CARDS } from '../engine/cards/sets/bs46_cards.js';
import { BS47_SAGA_CARDS } from '../engine/cards/sets/bs47_cards.js';
import { SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd41_sd44_bsc31_bsc33_godadvent_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('God Advent / Dual Era Saga (神煌臨編) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS44–BS47 and SD41–SD44/BSC31–BSC33', () => {
    assert.equal(BS44_SAGA_CARDS.length, 0);
    assert.equal(BS45_SAGA_CARDS.length, 0);
    assert.equal(BS46_SAGA_CARDS.length, 0);
    assert.equal(BS47_SAGA_CARDS.length, 0);
    assert.equal(SD41_SD44_BSC31_BSC33_GODADVENT_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles God Advent Saga hero cards (BS44-X01, BS44-X06, BS46-X10, SD43-X02) cleanly from printed text', () => {
    for (const id of ['BS44-X01', 'BS44-X06', 'BS46-X10', 'SD43-X02']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
