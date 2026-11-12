/**
 * tests/soul_saga_handlers.test.js
 *
 * Deterministic regression tests for VASSAL File 6: '06 - Soul Saga (Burning Legend)'
 * Verifies that mismatched auto-generated stub definitions have been purged from
 * BS30–BS34 and SD28–SD32 while preserving explicit Soul Drive handlers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PerCardRegistry } from '../engine/cards/index.js';
import { compileCard } from '../compiler/index.js';
import { BS30_SAGA_CARDS } from '../engine/cards/sets/bs30_cards.js';
import { BS31_SAGA_CARDS } from '../engine/cards/sets/bs31_cards.js';
import { BS32_SAGA_CARDS } from '../engine/cards/sets/bs32_cards.js';
import { BS33_SAGA_CARDS } from '../engine/cards/sets/bs33_cards.js';
import { BS34_SAGA_CARDS } from '../engine/cards/sets/bs34_cards.js';
import { SD28_SD32_SOUL_PROMOS_SAGA_CARDS } from '../engine/cards/sets/sd28_sd32_soul_promos_cards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cards_detailed.json'), 'utf8'));

describe('Soul Saga (Burning Legend) Semantic Fidelity & Compiled IR Suite', () => {
  it('1. Purges all mismatched auto-generated stubs from BS30–BS34 and SD28–SD32', () => {
    assert.equal(BS30_SAGA_CARDS.length, 0);
    assert.equal(BS31_SAGA_CARDS.length, 0);
    assert.equal(BS32_SAGA_CARDS.length, 0);
    assert.equal(BS33_SAGA_CARDS.length, 0);
    assert.equal(BS34_SAGA_CARDS.length, 0);
    assert.equal(SD28_SD32_SOUL_PROMOS_SAGA_CARDS.length, 0);
  });

  it('2. Preserves hand-crafted Soul Drive Ultimates (e.g. BS33-X02 Mudou) and compiles Soul Saga hero cards cleanly', () => {
    assert.ok(PerCardRegistry.has('BS33-X02', 'SOUL_DRIVE'), 'BS33-X02 Mudou must retain explicit SOUL_DRIVE handler');
    for (const id of ['BS31-X01', 'BS33-029', 'BS34-CP02', 'SD29-CP01']) {
      const card = detailed[id];
      assert.ok(card, `${id} must exist in cards_detailed.json`);
      const ir = compileCard(card);
      assert.ok(ir && Array.isArray(ir.abilities) && ir.abilities.length > 0, `${id} must compile into structured IR abilities`);
    }
  });
});
