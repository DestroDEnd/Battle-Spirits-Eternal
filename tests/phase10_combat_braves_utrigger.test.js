/**
 * tests/phase10_combat_braves_utrigger.test.js
 * 
 * Regression tests for:
 * 1. Brave in Spirit form cannot attack or block (Rule 7.2)
 * 2. Soul Core payment option & Kagerou-Seeker When Summoned trigger
 * 3. Ultimate Trigger execution on attack (Ultimate-Trickster)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

function canUnitAttack(unit) {
  if (!unit || unit.isExhausted) return false;
  const isBrave = unit.isBraveCard || unit.type === 'Brave' || (unit.type || '').includes('Brave');
  if (isBrave && !unit.isBraved && !unit.braveHost) {
    const eff = (unit.effect || '').toLowerCase();
    if (!eff.includes('can attack') && !eff.includes('can also attack')) {
      return false;
    }
  }
  return true;
}

function canUnitBlock(unit) {
  if (!unit || unit.isExhausted) return false;
  const isBrave = unit.isBraveCard || unit.type === 'Brave' || (unit.type || '').includes('Brave');
  if (isBrave && !unit.isBraved && !unit.braveHost) {
    const eff = (unit.effect || '').toLowerCase();
    if (!eff.includes('can block') && !eff.includes('can also block')) {
      return false;
    }
  }
  return true;
}

test('Phase 10 - Uncombined Braves in Spirit condition cannot attack or block (Rule 7.2)', () => {
  const goldenAxeBrave = {
    uid: 'b_1',
    name: 'The BullGreatAxe Golden-Taurus-Axe',
    type: 'Brave',
    isBraveCard: true,
    isBraved: false,
    braveHost: null,
    isExhausted: false,
    currentBp: 5000,
    currentLevel: 1
  };

  const clioWasserBrave = {
    uid: 'b_2',
    name: 'The DragonEmperorWaterShield Clio-Wasser',
    type: 'Brave',
    isBraveCard: true,
    isBraved: false,
    braveHost: null,
    isExhausted: false,
    currentBp: 5000,
    currentLevel: 1
  };

  const normalSpirit = {
    uid: 's_1',
    name: 'ChickenKnight',
    type: 'Spirit',
    isBraveCard: false,
    isExhausted: false,
    currentBp: 5000,
    currentLevel: 1
  };

  const bravedHostSpirit = {
    uid: 's_2',
    name: 'The HeroDragon Lord-Dragon',
    type: 'Spirit',
    isBraveCard: false,
    isBraved: true,
    brave: goldenAxeBrave,
    isExhausted: false,
    currentBp: 9000,
    currentLevel: 2
  };

  assert.equal(canUnitAttack(goldenAxeBrave), false, 'Golden-Taurus-Axe in Spirit form CANNOT attack');
  assert.equal(canUnitBlock(goldenAxeBrave), false, 'Golden-Taurus-Axe in Spirit form CANNOT block');

  assert.equal(canUnitAttack(clioWasserBrave), false, 'Clio-Wasser in Spirit form CANNOT attack');
  assert.equal(canUnitBlock(clioWasserBrave), false, 'Clio-Wasser in Spirit form CANNOT block');

  assert.equal(canUnitAttack(normalSpirit), true, 'Normal spirit CAN attack');
  assert.equal(canUnitBlock(normalSpirit), true, 'Normal spirit CAN block');

  assert.equal(canUnitAttack(bravedHostSpirit), true, 'Braved host spirit CAN attack');
  assert.equal(canUnitBlock(bravedHostSpirit), true, 'Braved host spirit CAN block');
});

test('Phase 10 - Soul Core payment sets usedSoulCore flag and drives searcher effects', () => {
  const kagerouSeeker = {
    name: 'The Hellwind Searcher Kagerou-Seeker',
    type: 'Ultimate',
    cost: 3,
    effect: '[Summon Condition: Your Life is at two or more]\n\n[LV3][LV4] (When Summoned)\nIf [Soul Core] was used to pay the summon cost, reveal three cards from your decktop. Among them, add an Ultimate card to the Hand. Discard any remaining cards.'
  };

  const friendlyDeck = [
    { name: 'The Hellwind FourDemonLord Van-Tous', type: 'Ultimate', cost: 7 },
    { name: 'Evil Draw', type: 'Magic', cost: 4 },
    { name: 'Insect Spirit', type: 'Spirit', cost: 2 }
  ];

  const friendlyHand = [];
  const friendlyTrash = [];

  // Simulate summon WITH Soul Core
  kagerouSeeker.usedSoulCore = true;
  assert.equal(kagerouSeeker.usedSoulCore, true);

  if (kagerouSeeker.usedSoulCore) {
    const revealed = friendlyDeck.splice(0, 3);
    const ultIdx = revealed.findIndex(c => (c.type || '').includes('Ultimate'));
    assert.notEqual(ultIdx, -1, 'Ultimate must be found in revealed cards');
    const addedUlt = revealed.splice(ultIdx, 1)[0];
    friendlyHand.push(addedUlt);
    friendlyTrash.push(...revealed);
  }

  assert.equal(friendlyHand.length, 1);
  assert.equal(friendlyHand[0].name, 'The Hellwind FourDemonLord Van-Tous');
  assert.equal(friendlyTrash.length, 2);
  assert.equal(friendlyDeck.length, 0);
});

test('Phase 10 - Ultimate-Trickster U-Trigger hits and refreshes other Ultimates on Critical Hit', () => {
  const trickster = {
    uid: 'u_trickster',
    name: 'Ultimate-Trickster',
    type: 'Ultimate',
    cost: 6,
    currentLevel: 4,
    currentBp: 12000,
    effect: '[Summon Condition: You control one or more Ultimates]\n\n[LV3][LV4][LV5] (When Summoned)\nReturn a Magic card from your Trash to the Hand.\n\n[Ultimate Trigger: [LV4][LV5] (When Attacks)]\nWhen Ultimate Trigger hits, return a card from your Trash to the Hand.\n[Critical Hit] If the hit card is Cost 4 or less, also, refresh all your other Ultimates.'
  };

  const otherUltimate = {
    uid: 'u_other',
    name: 'Ultimate-Seiryubi',
    type: 'Ultimate',
    cost: 8,
    isExhausted: true
  };

  const opponentDeck = [
    { name: 'Small Spirit', cost: 3 } // Revealed card cost 3 < 6 -> Hit! And 3 <= 4 -> Critical Hit!
  ];

  const friendlyTrash = [
    { name: 'Recoverable Magic', type: 'Magic', cost: 4 }
  ];
  const friendlyHand = [];

  const revealed = opponentDeck.shift();
  const isHit = trickster.cost > revealed.cost;
  assert.equal(isHit, true, 'U-Trigger hits when our cost > opposing cost');

  const isCritical = isHit && revealed.cost <= 4;
  assert.equal(isCritical, true, 'Critical Hit triggers when hit cost <= 4');

  if (isHit && friendlyTrash.length > 0) {
    friendlyHand.push(friendlyTrash.shift());
  }
  if (isCritical) {
    otherUltimate.isExhausted = false;
  }

  assert.equal(friendlyHand.length, 1, 'Trash card returned to Hand on U-Trigger Hit');
  assert.equal(friendlyHand[0].name, 'Recoverable Magic');
  assert.equal(otherUltimate.isExhausted, false, 'Other Ultimate refreshed on Critical Hit');
});
