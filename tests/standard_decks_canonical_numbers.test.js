/**
 * tests/standard_decks_canonical_numbers.test.js
 * 
 * Verifies that all cards in standard starter decks (standard_decks_data.json)
 * have valid, non-empty canonical card numbers matching the database, and that
 * deck import line sanitization handles parenthetical card codes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Standard Decks Integrity - 100% Non-Empty Canonical Card Numbers', () => {
  const stdData = JSON.parse(fs.readFileSync(path.join(rootDir, 'standard_decks_data.json'), 'utf8'));
  const cardsIndex = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'cards_index.json'), 'utf8'));
  
  assert.ok(Array.isArray(stdData.decks), 'standard_decks_data.json must contain decks array');
  assert.equal(stdData.decks.length, 6, 'Must contain 6 standard decks (Red, Purple, Green, White, Yellow, Blue)');

  const missingCardNumbers = [];
  const missingIndexMatches = [];

  for (const deck of stdData.decks) {
    assert.ok(deck.name, `Deck must have a name`);
    assert.ok(deck.color, `Deck ${deck.name} must have a color`);
    assert.ok(Array.isArray(deck.validated_cards), `Deck ${deck.name} must have validated_cards`);

    for (const card of deck.validated_cards) {
      if (!card.card_number || card.card_number.trim() === '') {
        missingCardNumbers.push(`${deck.color} - ${card.name}`);
      } else {
        const cNum = card.card_number.trim();
        const inIndex = cardsIndex[cNum] || Object.values(cardsIndex).some(entry => entry.card_number === cNum || entry.name.toLowerCase() === card.name.toLowerCase());
        if (!inIndex) {
          missingIndexMatches.push(`${deck.color} - ${card.name} (${cNum})`);
        }
      }
    }
  }

  assert.deepEqual(missingCardNumbers, [], `All standard deck cards must have non-empty canonical card numbers. Found empty: ${missingCardNumbers.join(', ')}`);
  assert.deepEqual(missingIndexMatches, [], `All standard deck cards must exist in cards_index.json. Found unindexed: ${missingIndexMatches.join(', ')}`);
});

test('Deck Import Sanitization - cleanCardLine removes parenthetical card codes and brackets', () => {
  function cleanCardLine(str) {
    let cleaned = (str || '').trim().replace(/^\[[A-Za-z0-9-]+\]\s*/i, '');
    cleaned = cleaned.replace(/\s*\([A-Za-z0-9-]+\)$/i, '');
    return cleaned.trim();
  }

  assert.equal(cleanCardLine('The DragonEmperor Siegfried (26RBS03-X02)'), 'The DragonEmperor Siegfried');
  assert.equal(cleanCardLine('[BS01-001] Goradon'), 'Goradon');
  assert.equal(cleanCardLine('Top Buddy, Aibou (SD66-CX01)'), 'Top Buddy, Aibou');
  assert.equal(cleanCardLine('   [SD06-007] The HeroDragon Lord-Dragon (SD06-007)   '), 'The HeroDragon Lord-Dragon');
});

test('Arena Card Metadata Resolution - buildCardInstance enriches raw card entries', () => {
  const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');
  const vm = require('node:vm');
  const doc = {
    readyState: 'complete',
    getElementById: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } } }),
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const sandbox = {
    window: {},
    document: doc,
    localStorage: { getItem() {}, setItem() {} },
    sessionStorage: { getItem() {}, setItem() {} },
    AudioFX: { init() {}, playTone() {}, click() {}, lifeDamage() {}, coreMove() {}, coreChime() {}, spiritSummon() {}, soulCoreIgnite() {} },
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    require
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(battleArenaSource, sandbox);

  const BA = sandbox.window.BattleArena;
  assert.ok(typeof BA.findCardMetadata === 'function', 'findCardMetadata must be exposed on BattleArena');
  assert.ok(typeof BA.buildCardInstance === 'function', 'buildCardInstance must be exposed on BattleArena');

  const goradon = BA.buildCardInstance('Goradon', 'Red');
  assert.equal(goradon.name, 'Goradon');
  assert.equal(goradon.cost, 0, 'Goradon must have cost 0');
  assert.ok(goradon.card_number, 'Goradon must have a canonical card_number');
  assert.equal(goradon.color, 'Red');

  const lordDragon = BA.buildCardInstance('The HeroDragon Lord-Dragon', 'Red');
  assert.equal(lordDragon.name, 'The HeroDragon Lord-Dragon');
  assert.equal(lordDragon.cost, 6, 'Lord-Dragon must have cost 6');
  assert.ok(lordDragon.card_number, 'Lord-Dragon must have a canonical card_number');
  assert.ok(lordDragon.effect.includes('Burst'), 'Lord-Dragon must have its official Burst effect text');
});
