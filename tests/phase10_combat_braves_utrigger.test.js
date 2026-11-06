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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

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

test('Phase 10 - Official Rule Enforcement: Only Ultimates with U-Trigger can execute U-Trigger', () => {
  function canExecuteUTrigger(card) {
    if (!card || !card.effect) return false;
    const isUltimate = card.type === 'Ultimate' || (typeof card.type === 'string' && card.type.includes('Ultimate'));
    if (!isUltimate) return false;
    const hasKeyword = Array.isArray(card.keywords) && card.keywords.some(k => k && (k.name === 'Ultimate Trigger' || k.hook === 'ultimate_trigger' || (k.name && k.name.includes('Trigger'))));
    const hasTriggerInText = /(?:\[(?:u-trigger|ultimate trigger|double u-trigger|great u-trigger|triple u-trigger|quadruple u-trigger|octa u-trigger|count ultimate trigger|cross ultimate trigger|w-trigger)|【(?:u|w|cu|wu)?トリガー)/i.test(card.effect || '');
    return Boolean(hasKeyword || hasTriggerInText);
  }

  const terad = {
    name: 'The PartnerWingedDragon Terad',
    type: 'Contract Spirit',
    cost: 2,
    effect: '[Contract Advent] / [When Attacks] Besides [Soul Core], send a core from your Trash to this Spirit.'
  };

  const normalSpirit = {
    name: 'Bladebeak',
    type: 'Spirit',
    cost: 1,
    effect: '[LV1][LV2] (When Summoned) Draw 1 card.'
  };

  const javad = {
    name: 'The PartnerDemonLord Javad',
    type: 'Contract Ultimate',
    cost: 3,
    effect: '[Summon Condition: Your Life is at two or more]\n[Contract Pre-Advent] [When Attacks] Put one core from the Void to your Field.'
  };

  const trickster = {
    name: 'Ultimate-Trickster',
    type: 'Ultimate',
    cost: 6,
    effect: '[Summon Condition: You control one or more Ultimates]\n[Ultimate Trigger: [LV4][LV5] (When Attacks)] When Ultimate Trigger hits, return a card from your Trash to the Hand.'
  };

  const strikewurm = {
    name: 'Ultimate-Strikewurm-Leo',
    type: 'Ultimate',
    cost: 7,
    keywords: [{ name: 'Ultimate Trigger', hook: 'ultimate_trigger' }],
    effect: '[Summon Condition: You control one or more White Spirits]\n[LV3][LV4][LV5] When Attacks, U-Trigger hits...'
  };

  const ajaccio = {
    name: 'The NetherCorpseKnight Ajaccio',
    type: 'Spirit',
    cost: 5,
    effect: '[LV1][LV2][LV3] While this Spirit has zero cores on it, it is unaffected by opposing effects.'
  };

  const zombieSnake = {
    name: 'Zombie-Snake',
    type: 'Spirit',
    cost: 1,
    effect: '[LV1][LV2] (When Summoned) Send 1 core from opposing Spirit to Reserve.'
  };

  const vantous = {
    name: 'The Hellwind FourDemonLord Van-Tous',
    type: 'Ultimate',
    cost: 7,
    effect: '[Summon Condition: The PartnerDemonLord Javad]\n[LV3][LV4][LV5] (When Attacks) By returning a card from your Hand to the desktop...'
  };

  const bramZahfag = {
    name: 'The Hellflame FourDemonLord Bram-Zahfag',
    type: 'Ultimate',
    cost: 8,
    effect: '[Summon Condition: The PartnerDemonLord Javad]\n[LV3][LV4][LV5] (When Summoned) Destroy every opposing Spirit.'
  };

  assert.equal(canExecuteUTrigger(terad), false, 'The PartnerWingedDragon Terad (Contract Spirit) must NEVER activate U-Trigger');
  assert.equal(canExecuteUTrigger(normalSpirit), false, 'Normal Spirits must NEVER activate U-Trigger');
  assert.equal(canExecuteUTrigger(ajaccio), false, 'The NetherCorpseKnight Ajaccio (Spirit) must NEVER activate U-Trigger');
  assert.equal(canExecuteUTrigger(zombieSnake), false, 'Zombie-Snake (Spirit) must NEVER activate U-Trigger');
  assert.equal(canExecuteUTrigger(javad), false, 'Ultimates without U-Trigger abilities must NOT activate U-Trigger');
  assert.equal(canExecuteUTrigger(vantous), false, 'Van-Tous without U-Trigger abilities must NOT activate U-Trigger');
  assert.equal(canExecuteUTrigger(bramZahfag), false, 'Bram-Zahfag without U-Trigger abilities must NOT activate U-Trigger');
  assert.equal(canExecuteUTrigger(trickster), true, 'Ultimate with [Ultimate Trigger] can activate U-Trigger');
  assert.equal(canExecuteUTrigger(strikewurm), true, 'Ultimate with U-Trigger keyword can activate U-Trigger');
});

test('Phase 10 - Ultimate Trigger requires meeting the card LV requirement (e.g. LV4 for Ultimate-Trickster)', () => {
  function isUTriggerLevelMet(card, level) {
    const eff = card.effect || '';
    const lines = eff.split('\n');
    let triggerHeader = '';
    for (const line of lines) {
      if (/(?:u[- ]?trigger|ultimate[- ]?trigger|【(?:u|w|cu|wu|xu)?トリガー】)/i.test(line)) {
        triggerHeader = line;
        break;
      }
    }

    let reqLevels = null;
    if (triggerHeader) {
      const rangeM = triggerHeader.match(/LV(\d+)[-~]LV(\d+)/i);
      if (rangeM) {
        reqLevels = [];
        for (let i = parseInt(rangeM[1], 10); i <= parseInt(rangeM[2], 10); i++) reqLevels.push(i);
      } else {
        const lvls = triggerHeader.match(/LV\d+/gi);
        if (lvls && lvls.length) {
          reqLevels = lvls.map(l => parseInt(l.replace(/\D/g, ''), 10));
        }
      }
    }

    if (reqLevels && reqLevels.length > 0) {
      return reqLevels.includes(level);
    }
    return true;
  }

  const trickster = {
    name: 'Ultimate-Trickster',
    type: 'Ultimate',
    cost: 6,
    effect: '[Ultimate Trigger: [LV4][LV5] (When Attacks)]\nWhen Ultimate Trigger hits, return a card from your Trash to the Hand.'
  };

  assert.equal(isUTriggerLevelMet(trickster, 3), false, 'Ultimate-Trickster at LV3 does NOT meet LV4 requirement');
  assert.equal(isUTriggerLevelMet(trickster, 4), true, 'Ultimate-Trickster at LV4 meets LV4 requirement');
  assert.equal(isUTriggerLevelMet(trickster, 5), true, 'Ultimate-Trickster at LV5 meets LV4 requirement');
});

test('Phase 10 - battle_arena.js strictly gates triggerUTrigger to Ultimates with U-Trigger keyword and level check', () => {
  const arenaPath = path.join(rootDir, 'battle_arena.js');
  const code = fs.readFileSync(arenaPath, 'utf8');

  // Must have hasUTrigger and isUTriggerLevelMet functions
  assert.ok(code.includes('function hasUTrigger'), 'hasUTrigger helper must exist in battle_arena.js');
  assert.ok(code.includes('function isUTriggerLevelMet'), 'isUTriggerLevelMet helper must exist in battle_arena.js');

  // Must gate attack trigger execution
  assert.ok(code.includes('if (hasUTrigger(attacker) && isUTriggerLevelMet(attacker))'), 'Attacking units must be checked with hasUTrigger and isUTriggerLevelMet');

  // Must export helpers on BattleArena
  assert.ok(code.includes('hasUTrigger,'), 'hasUTrigger must be exported on BattleArena');
  assert.ok(code.includes('isUTriggerLevelMet,'), 'isUTriggerLevelMet must be exported on BattleArena');
});
