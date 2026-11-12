/**
 * tests/sword_blade_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 4: '04 - Sword Blade Saga'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS19–BS23 and SD12–SD17 so Sword Blade Saga cards resolve via compiled IR.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';
import { BS19_SAGA_CARDS } from '../engine/cards/sets/bs19_cards.js';
import { BS20_SAGA_CARDS } from '../engine/cards/sets/bs20_cards.js';
import { BS21_SAGA_CARDS } from '../engine/cards/sets/bs21_cards.js';
import { BS22_SAGA_CARDS } from '../engine/cards/sets/bs22_cards.js';
import { BS23_SAGA_CARDS } from '../engine/cards/sets/bs23_cards.js';
import { SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd12_sd17_swordblade_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Sword Blade Saga Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS19–BS23 and SD12–SD17', () => {
    assert.equal(BS19_SAGA_CARDS.length, 0);
    assert.equal(BS20_SAGA_CARDS.length, 0);
    assert.equal(BS21_SAGA_CARDS.length, 0);
    assert.equal(BS22_SAGA_CARDS.length, 0);
    assert.equal(BS23_SAGA_CARDS.length, 0);
    assert.equal(SD12_SD17_SWORDBLADE_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Compiles Sword Blade Saga hero cards (BS19-X01, BS19-X07, BS22-X01, BS23-X08) cleanly from printed text', () => {
    for (const id of ['BS19-X01', 'BS19-X07', 'BS20-X01', 'BS21-X01', 'BS22-X01', 'BS23-X01', 'BS23-X07', 'BS23-X08']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
