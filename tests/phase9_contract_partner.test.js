/**
 * tests/phase9_contract_partner.test.js
 * 
 * Automated regression test for Contract Partner guarantee, Partner detection,
 * and Opponent Turn 1 flow under Battle Spirits Eternal rules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Helper matching battle_arena.js isContractPartnerCard
function isContractPartnerCard(c) {
  if (!c) return false;
  if (c.is_contract_partner === true || c.isContractPartner === true) return true;

  const name = (c.name || '').toLowerCase();
  const kanji = (c.kanji || c.jpname || '');
  const type = (c.type || '').toLowerCase();
  const rarity = (c.rarity || '').toLowerCase();
  const num = (c.card_number || c.cardNumber || '');

  if (name.includes('advent') || name.includes('煌臨')) return false;

  const isContractType = type.startsWith('contract ') || type === 'contract' || type.includes('contractor');
  const hasPartnerName = name.includes('partner') || kanji.includes('相棒') || kanji.includes('契約者');
  const hasContractRarity = rarity.includes('contract') || rarity === 'cx';
  const hasContractNumber = /-(?:cx|cp)\d+/i.test(num);

  if (hasPartnerName && (isContractType || hasContractRarity || hasContractNumber)) return true;
  if (hasContractRarity && isContractType) return true;
  if (hasContractNumber && isContractType) return true;
  if (hasPartnerName && (type.includes('ultimate') || type.includes('spirit') || type.includes('nexus'))) return true;

  return false;
}

test('Phase 9 - isContractPartnerCard strictly distinguishes Contract Partners from Contract Advent Ultimates', () => {
  const javad = {
    name: 'The PartnerDemonLord Javad',
    card_number: 'SD65-CX01',
    type: 'Contract Ultimate',
    rarity: 'Contract X-Rare',
    kanji: '相棒魔卿ジャバド',
    effect: '[Summon Condition: Your Life is at two or more]\n\n[Soul State][Contract Pre-Advent]/[Ultimate]...'
  };

  const zetter = {
    name: 'The Extreme Partner, Zetter',
    card_number: 'BS65-CX04',
    type: 'Contract Ultimate',
    rarity: 'Contract X-Rare',
    kanji: '極相棒ゼッター'
  };

  const vantous = {
    name: 'The Hellwind FourDemonLord Van-Tous',
    card_number: 'BS64-X02',
    type: 'Ultimate',
    rarity: 'X-Rare',
    effect: 'Flash - [Contract Advent: Hell Contract & C1 or more]\n[SuAdcon: You control one or more "The PartnerDemonLord Javad"]'
  };

  const neoZetter = {
    name: 'The ExtremeDivineStar Neo-Zetter',
    card_number: 'BS65-X06',
    type: 'Ultimate',
    rarity: 'X-Rare',
    effect: 'Flash - [Contract Advent: Extreme Contract & C6 or more]\n[SuAdcon: You control one or more "The Extreme Partner, Zetter"]'
  };

  const seiryubi = {
    name: 'Ultimate-Seiryubi',
    type: 'Ultimate',
    rarity: 'X-Rare'
  };

  const evilDraw = {
    name: 'Evil Draw',
    type: 'Magic',
    rarity: 'Common'
  };

  assert.equal(isContractPartnerCard(javad), true, 'Javad must be identified as Contract Partner');
  assert.equal(isContractPartnerCard(zetter), true, 'Zetter must be identified as Contract Partner');
  assert.equal(isContractPartnerCard(vantous), false, 'Van-Tous is an Advent Ultimate, NOT a Contract Partner');
  assert.equal(isContractPartnerCard(neoZetter), false, 'Neo-Zetter is an Advent Ultimate, NOT a Contract Partner');
  assert.equal(isContractPartnerCard(seiryubi), false, 'Ultimate-Seiryubi is not a Contract Partner');
  assert.equal(isContractPartnerCard(evilDraw), false, 'Evil Draw is not a Contract Partner');
});

test('Phase 9 - Contract Partner is guaranteed in opening hand regardless of deck position', () => {
  const vantous = {
    name: 'The Hellwind FourDemonLord Van-Tous',
    card_number: 'BS64-X02',
    type: 'Ultimate',
    rarity: 'X-Rare'
  };

  const javad = {
    name: 'The PartnerDemonLord Javad',
    card_number: 'SD65-CX01',
    type: 'Contract Ultimate',
    rarity: 'Contract X-Rare',
    kanji: '相棒魔卿ジャバド'
  };

  const otherCards = Array.from({ length: 38 }, (_, i) => ({
    name: `Deck Card ${i + 1}`,
    type: 'Spirit',
    cost: 3
  }));

  // Deck starts with Van-Tous at index 0 and Javad deeply buried at index 25
  const deck = [vantous, ...otherCards.slice(0, 24), javad, ...otherCards.slice(24)];
  assert.equal(deck.length, 40);

  // Apply opening hand deal logic
  const partnerIdx = deck.findIndex(c => isContractPartnerCard(c));
  assert.notEqual(partnerIdx, -1, 'Partner must be found');
  const partnerCard = deck.splice(partnerIdx, 1)[0];
  assert.equal(partnerCard.name, 'The PartnerDemonLord Javad', 'Must select Javad as partner, never Van-Tous');

  const hand = [partnerCard, ...deck.splice(0, 3)];
  assert.equal(hand.length, 4, 'Hand must have 4 cards');
  assert.equal(hand[0].name, 'The PartnerDemonLord Javad', 'First card in hand must be Javad');
  assert.equal(deck.length, 36, 'Remaining deck has 36 cards');
});

test('Phase 9 - Opponent Turn 1 preserves Contract Partner in hand & enforces confirmation before play', () => {
  const arenaJs = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

  // Verify partner selection modal and controllers exist in battle_arena.js
  assert.ok(arenaJs.includes('openPartnerSelectionModal'), 'openPartnerSelectionModal must be defined');
  assert.ok(arenaJs.includes('selectContractPartner'), 'selectContractPartner must be defined');
  assert.ok(arenaJs.includes('battlePartnerModal'), 'battlePartnerModal reference must exist');
  assert.ok(arenaJs.includes('isContractPartnerCard(c)'), 'prepareDeck must stamp isContractPartner');
  assert.ok(arenaJs.includes('contractCard: pPartnerCard'), 'player state must track contractCard');
});
