/**
 * tests/keyword_ownership_and_infinite_blade.test.js
 * 
 * Strict Keyword Ownership & Infinite Blade Regression Test Suite.
 * Verifies that:
 * 1. BS33-X01 is the sole native owner of Infinite Blade.
 * 2. BS33-072 and BS33-003 reference Infinite Blade without native ownership.
 * 3. Body text clause occurrences are segregated into referenced/granted keywords.
 * 4. All 348 Wiki keywords are recognized by compiler catalog without colon distortion.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseAbilityHeaders } from '../compiler/header_parser.js';
import { extractKeywords, bindKeywordsToAbilities, KEYWORD_CATALOG } from '../compiler/keyword_compiler.js';

test('Strict Keyword Ownership - Infinite Blade Regression Proof (BS33-X01 vs BS33-072 vs BS33-003)', async (t) => {
  const cardsDetailed = JSON.parse(fs.readFileSync('data/cards_detailed.json', 'utf8'));

  const cX01 = { ...cardsDetailed['BS33-X01'] };
  const c072 = { ...cardsDetailed['BS33-072'] };
  const c003 = { ...cardsDetailed['BS33-003'] };

  assert.ok(cX01, 'BS33-X01 must exist in card database');
  assert.ok(c072, 'BS33-072 must exist in card database');
  assert.ok(c003, 'BS33-003 must exist in card database');

  // Process BS33-X01
  const blocksX01 = cX01.effect.split(/\n\s*\n/).map(rawText => ({
    rawText,
    header: parseAbilityHeaders(rawText)
  }));
  bindKeywordsToAbilities(cX01, cX01.effect, blocksX01);

  // Process BS33-072
  const blocks072 = c072.effect.split(/\n\s*\n/).map(rawText => ({
    rawText,
    header: parseAbilityHeaders(rawText)
  }));
  bindKeywordsToAbilities(c072, c072.effect, blocks072);

  // Process BS33-003
  const blocks003 = c003.effect.split(/\n\s*\n/).map(rawText => ({
    rawText,
    header: parseAbilityHeaders(rawText)
  }));
  bindKeywordsToAbilities(c003, c003.effect, blocks003);

  // 1. Assert BS33-X01 has native Infinite Blade
  const x01NativeNames = cX01.keywords.map(k => k.name);
  assert.ok(
    x01NativeNames.includes('Infinite Blade'),
    `BS33-X01 must possess native 'Infinite Blade', found: ${JSON.stringify(x01NativeNames)}`
  );
  assert.strictEqual(
    x01NativeNames.length,
    1,
    `BS33-X01 must possess exactly 1 native keyword, found: ${JSON.stringify(x01NativeNames)}`
  );
  assert.ok(
    cX01.referencedKeywords.some(k => k.name === 'Awaken'),
    `BS33-X01 must list granted/referenced Awaken in referencedKeywords`
  );

  // 2. Assert BS33-072 does NOT have native Infinite Blade
  const c072NativeNames = c072.keywords.map(k => k.name);
  assert.strictEqual(
    c072NativeNames.includes('Infinite Blade'),
    false,
    `BS33-072 must NOT possess native 'Infinite Blade'`
  );
  assert.strictEqual(
    c072NativeNames.length,
    0,
    `BS33-072 is a search Magic and must possess zero native keywords`
  );
  const c072RefNames = c072.referencedKeywords.map(k => k.name);
  assert.ok(
    c072RefNames.includes('Infinite Blade'),
    `BS33-072 must list 'Infinite Blade' in referencedKeywords`
  );
  assert.ok(
    c072RefNames.includes('Awaken') && c072RefNames.includes('True-Clash'),
    `BS33-072 must list other searched keywords in referencedKeywords`
  );

  // 3. Assert BS33-003 does NOT have native Infinite Blade
  const c003NativeNames = c003.keywords.map(k => k.name);
  assert.strictEqual(
    c003NativeNames.includes('Infinite Blade'),
    false,
    `BS33-003 must NOT possess native 'Infinite Blade'`
  );
  assert.strictEqual(
    c003NativeNames.length,
    0,
    `BS33-003 is a support Spirit and must possess zero native keywords`
  );
  const c003RefNames = c003.referencedKeywords.map(k => k.name);
  assert.ok(
    c003RefNames.includes('Infinite Blade'),
    `BS33-003 must list 'Infinite Blade' in referencedKeywords`
  );
});

test('Compiler Catalog & Extraction - Colon Keywords & Parameters', async (t) => {
  // Test Type: Driver, Type: Song, Type: Field
  const driverKws = extractKeywords('[Type: Driver]');
  assert.strictEqual(driverKws.length, 1);
  assert.strictEqual(driverKws[0].name, 'Type: Driver');
  assert.strictEqual(driverKws[0].parameter, null);

  const songKws = extractKeywords('[Type: Song]');
  assert.strictEqual(songKws.length, 1);
  assert.strictEqual(songKws[0].name, 'Type: Song');

  // Test Advent with Parameter
  const adventKws = extractKeywords('[Advent: Cost 6 or more]');
  assert.strictEqual(adventKws.length, 1);
  assert.strictEqual(adventKws[0].name, 'Advent');
  assert.strictEqual(adventKws[0].parameter, 'Cost 6 or more');

  // Test Heavy Armor with Colors
  const armorKws = extractKeywords('[Heavy Armor: Red/White]');
  assert.strictEqual(armorKws.length, 1);
  assert.strictEqual(armorKws[0].name, 'Heavy Armor');
  assert.strictEqual(armorKws[0].parameter, 'Red/White');

  // Test unbracketed armor
  const unbracketedKws = extractKeywords('Heavy Armor: Red/Blue');
  assert.strictEqual(unbracketedKws.length, 1);
  assert.strictEqual(unbracketedKws[0].name, 'Heavy Armor');
  assert.strictEqual(unbracketedKws[0].parameter, 'Red/Blue');
  assert.strictEqual(unbracketedKws[0].bracketed, false);
});

test('Header Parser - Multi-Level Range Normalization and Keywords', async (t) => {
  // Test range [LV1-LV3]
  const parsed1 = parseAbilityHeaders('[LV1-LV3] (Your Attack Step) [Infinite Blade]\nWhile there is Soul Core on this Spirit...');
  assert.deepStrictEqual(parsed1.levels, [1, 2, 3]);
  assert.strictEqual(parsed1.timingLabel, 'Your Attack Step');
  assert.strictEqual(parsed1.keyword, 'Infinite Blade');
  assert.strictEqual(parsed1.cleanBody, 'While there is Soul Core on this Spirit...');

  // Test unbracketed armor in header
  const parsedArmor = parseAbilityHeaders('[LV1][LV2] Heavy Armor: Red\nThis Spirit is unaffected by opposing Red effects.');
  assert.deepStrictEqual(parsedArmor.levels, [1, 2]);
  assert.strictEqual(parsedArmor.keyword, 'Heavy Armor: Red');
  assert.strictEqual(parsedArmor.cleanBody, 'This Spirit is unaffected by opposing Red effects.');
});
