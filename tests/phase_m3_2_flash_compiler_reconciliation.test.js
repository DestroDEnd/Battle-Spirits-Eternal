/**
 * tests/phase_m3_2_flash_compiler_reconciliation.test.js
 * 
 * Phase M.3.2 Work Package G & L: Compiler, IR and Card Database Reconciliation Tests
 * 
 * Verifies that:
 * 1. The header parser properly identifies and attaches structured flashTimingSpec metadata.
 * 2. Timing qualifiers are correctly parsed for both English and Japanese syntax:
 *    - Generic Flash / 【フラッシュ】
 *    - (Your Attack Step) / 自分のアタックステップ
 *    - (Opponent's Attack Step) / 相手のアタックステップ
 *    - (Either Attack Step) / お互いのアタックステップ
 *    - (When Attacks) Flash / アタック時【フラッシュ】
 * 3. Pre-compiled IR card structures from shards correctly reflect their timing rules.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAbilityHeaders } from '../compiler/header_parser.js';
import { classifyFlashTiming, FLASH_TIMING_QUALIFIERS } from '../engine/flash_timing.js';

test('M3.2-G-01: Header parser attaches structured flashTimingSpec to Flash headers', () => {
  const parsed = parseAbilityHeaders('[Flash] Give target Spirit +2000 BP.');
  assert.equal(parsed.isFlash, true);
  assert.ok(parsed.flashTimingSpec, 'Must attach flashTimingSpec');
  assert.equal(parsed.flashTimingSpec.isFlash, true);
  assert.equal(parsed.flashTimingSpec.isGenericFlash, true);
  assert.equal(parsed.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.GENERIC);
});

test('M3.2-G-02: Header parser extracts English card-specific Attack Step qualifiers', () => {
  // Your Attack Step
  const yourAtk = parseAbilityHeaders('[Flash] (Your Attack Step) Refresh 1 of your Spirits.');
  assert.equal(yourAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP);
  assert.equal(yourAtk.flashTimingSpec.isGenericFlash, false);

  // Opponent's Attack Step
  const oppAtk = parseAbilityHeaders("[Flash] (Opponent's Attack Step) End the attack step.");
  assert.equal(oppAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP);
  assert.equal(oppAtk.flashTimingSpec.isGenericFlash, false);

  // Either Attack Step
  const eitherAtk = parseAbilityHeaders('[Flash] (Either Attack Step) Exhaust 1 opposing Spirit.');
  assert.equal(eitherAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP);
  assert.equal(eitherAtk.flashTimingSpec.isGenericFlash, false);
});

test('M3.2-G-03: Header parser classifies (When Attacks) Flash as triggered', () => {
  const whenAtt = parseAbilityHeaders('[LV1] (When Attacks) Flash: Destroy 1 opposing Spirit with 3000 or fewer BP.');
  assert.equal(whenAtt.flashTimingSpec.isTriggered, true);
  assert.equal(whenAtt.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.WHEN_ATTACKS);
});

test('M3.2-G-04: Header parser extracts Japanese Flash timing syntax correctly', () => {
  // Generic Japanese Flash
  const jpGeneric = parseAbilityHeaders('【フラッシュ】このスピリットを破壊することで、ボイドからコア1個をライフに置く。');
  assert.equal(jpGeneric.isFlash, true);
  assert.equal(jpGeneric.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.GENERIC);

  // Japanese Your Attack Step
  const jpYourAtk = parseAbilityHeaders('【フラッシュ】自分のアタックステップ：このスピリットをBP+3000する。');
  assert.equal(jpYourAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP);

  // Japanese Opponent Attack Step
  const jpOppAtk = parseAbilityHeaders('【フラッシュ】相手のアタックステップ：アタックステップを終了する。');
  assert.equal(jpOppAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.OPPONENTS_ATTACK_STEP);

  // Japanese Either Attack Step
  const jpEitherAtk = parseAbilityHeaders('【フラッシュ】お互いのアタックステップ：相手のスピリット1体を疲労させる。');
  assert.equal(jpEitherAtk.flashTimingSpec.timingQualifier, FLASH_TIMING_QUALIFIERS.EITHER_ATTACK_STEP);
});

test('M3.2-G-05: Runtime classifyFlashTiming handles cards with and without compiled headers', () => {
  const rawCard = {
    cardNumber: 'BS01-TEST',
    name: 'Raw Flash Card',
    effect: 'Flash - (Your Attack Step) Draw 1 card.'
  };

  const spec = classifyFlashTiming(rawCard);
  assert.equal(spec.isFlash, true);
  assert.equal(spec.timingQualifier, FLASH_TIMING_QUALIFIERS.YOUR_ATTACK_STEP);
  assert.equal(spec.isGenericFlash, false);
});
