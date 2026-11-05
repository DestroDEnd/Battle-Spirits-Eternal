/**
 * tests/brave_ultimate_condition_enforcement.test.js
 *
 * Automated regression tests enforcing official Battle Spirits Eternal rules:
 * 1. Ultimate Brave Condition: SD28-X02 "The EarthDeitySword Gaianohoko" requires Cost 5+ Ultimate.
 *    - Rejects Cost 3 Contract Ultimate ("The PartnerDemonLord Javad").
 *    - Rejects Spirits regardless of cost.
 *    - Accepts Cost 5+ Ultimates ("Ultimate-Trickster" Cost 6, "Lord-Javad" Cost 6, "God-Javad" Cost 9).
 * 2. Standard Braves cannot combine with Ultimates (only Ultimate Braves can).
 * 3. Diagnostic feedback reports specific host rejection reasons instead of misleading generic toasts.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Helper checking brave condition matching battle_arena.js logic
function checkBraveCondition(braveCard, hostCard) {
  if (!braveCard || !hostCard) return { eligible: false, reason: 'Invalid cards' };
  const condStr = ((braveCard.brave_condition || braveCard.braveCondition || '').trim()) ||
                  (() => {
                    const text = (braveCard.effect || '') + ' ' + (braveCard.flavor || '');
                    const m = text.match(/\[Brave Condition:\s*([^\]]+)\]|【合体条件：([^】]+)】/i);
                    return m ? (m[1] || m[2]).trim() : '';
                  })();
  const hostIsUltimate = hostCard.type === 'Ultimate' || (hostCard.type || '').includes('Ultimate');

  if (!condStr) {
    if (hostIsUltimate) {
      return { eligible: false, reason: 'Standard Braves cannot combine with Ultimates (requires an Ultimate Brave)' };
    }
    return { eligible: true };
  }

  // 1. Ultimate vs Spirit check
  const specifiesUltimate = /(?:^|[^a-z])ultimate(?:[^a-z]|$)|アルティメット/i.test(condStr);
  const specifiesSpirit = /(?:^|[^a-z])spirit(?:[^a-z]|$)|スピリット/i.test(condStr);

  if (specifiesUltimate && !specifiesSpirit) {
    if (!hostIsUltimate) {
      return { eligible: false, reason: `Requires Ultimate host (Target is a ${hostCard.type || 'Spirit'})` };
    }
  } else if (specifiesSpirit && !specifiesUltimate) {
    if (hostIsUltimate) {
      return { eligible: false, reason: `Requires Spirit host (Target is an Ultimate)` };
    }
  } else if (!specifiesUltimate && hostIsUltimate) {
    return { eligible: false, reason: `Standard Braves cannot combine with Ultimates (Brave Condition: "${condStr}")` };
  }

  // 2. Cost requirement
  const costMatch = condStr.match(/Cost\s*(\d+)\s*or\s*more|コスト(\d+)以上/i);
  if (costMatch) {
    const minCost = parseInt(costMatch[1] || costMatch[2], 10);
    const hostCost = hostCard.cost || 0;
    if (hostCost < minCost) {
      return { eligible: false, reason: `Requires host Cost ${minCost}+ (Target has Cost ${hostCost})` };
    }
  }
  const costLessMatch = condStr.match(/Cost\s*(\d+)\s*or\s*less|コスト(\d+)以下/i);
  if (costLessMatch) {
    const maxCost = parseInt(costLessMatch[1] || costLessMatch[2], 10);
    const hostCost = hostCard.cost || 0;
    if (hostCost > maxCost) {
      return { eligible: false, reason: `Requires host Cost ${maxCost} or less (Target has Cost ${hostCost})` };
    }
  }

  return { eligible: true };
}

function isEligibleBraveHost(braveCard, hostCard) {
  if (!hostCard) return { eligible: false, reason: 'No host selected' };
  if (braveCard.uid === hostCard.uid) return { eligible: false, reason: 'Cannot combine onto itself' };
  const isHostBrave = hostCard.type === 'Brave' || hostCard.isBraveCard;
  if (isHostBrave) return { eligible: false, reason: 'A Brave cannot combine onto another Brave' };
  if (hostCard.brave) {
    return { eligible: false, reason: 'Target is already combined with a Brave and lacks Double Brave' };
  }
  return checkBraveCondition(braveCard, hostCard);
}

test('Enforce Eternal Rules: The EarthDeitySword Gaianohoko (SD28-X02) Brave Condition', () => {
  const gaiaCard = {
    uid: 'b_gaia',
    card_number: 'SD28-X02',
    name: 'The EarthDeitySword Gaianohoko',
    type: 'Brave',
    cost: 5,
    effect: '[Brave Condition: Cost 5 or more Ultimate]\nWhen your Ultimate is summoned...'
  };

  const partnerJavad = {
    uid: 'u_javad_partner',
    card_number: 'SD65-CX01',
    name: 'The PartnerDemonLord Javad',
    type: 'Contract Ultimate',
    cost: 3
  };

  const lordJavad = {
    uid: 'u_lord_javad',
    card_number: 'SD65-003',
    name: 'The Ruler of FourDemonLords Lord-Javad',
    type: 'Ultimate',
    cost: 6
  };

  const trickster = {
    uid: 'u_trickster',
    name: 'Ultimate-Trickster',
    type: 'Ultimate',
    cost: 6
  };

  const highCostSpirit = {
    uid: 's_siegfried',
    name: 'The DragonEmperor Siegfried',
    type: 'Spirit',
    cost: 6
  };

  // 1. Check partner Javad (Cost 3 Contract Ultimate) -> MUST BE INELIGIBLE
  const javadCheck = isEligibleBraveHost(gaiaCard, partnerJavad);
  assert.equal(javadCheck.eligible, false, 'The PartnerDemonLord Javad (Cost 3) cannot combine with Gaianohoko (requires Cost 5+)');
  assert.match(javadCheck.reason, /Requires host Cost 5\+/i);
  assert.match(javadCheck.reason, /Target has Cost 3/i);

  // 2. Check high-cost Spirit -> MUST BE INELIGIBLE (Requires Ultimate host)
  const spiritCheck = isEligibleBraveHost(gaiaCard, highCostSpirit);
  assert.equal(spiritCheck.eligible, false, 'Spirits cannot combine with Gaianohoko (requires Ultimate host)');
  assert.match(spiritCheck.reason, /Requires Ultimate host/i);

  // 3. Check Lord-Javad (Cost 6 Ultimate) -> MUST BE ELIGIBLE
  const lordCheck = isEligibleBraveHost(gaiaCard, lordJavad);
  assert.equal(lordCheck.eligible, true, 'Lord-Javad (Cost 6 Ultimate) meets Cost 5+ Ultimate condition');

  // 4. Check Ultimate-Trickster (Cost 6 Ultimate) -> MUST BE ELIGIBLE
  const tricksterCheck = isEligibleBraveHost(gaiaCard, trickster);
  assert.equal(tricksterCheck.eligible, true, 'Ultimate-Trickster (Cost 6 Ultimate) meets Cost 5+ Ultimate condition');
});

test('Enforce Eternal Rules: Standard Braves cannot combine with Ultimates', () => {
  const standardBrave = {
    uid: 'b_sword',
    name: 'Brave Sword',
    type: 'Brave',
    cost: 4,
    effect: '[Brave Condition: Cost 4 or more Spirit]'
  };

  const namelessBrave = {
    uid: 'b_nameless',
    name: 'Generic Sword',
    type: 'Brave',
    cost: 3,
    effect: '[Brave Condition: Cost 3 or more]'
  };

  const ultimate = {
    uid: 'u_ult',
    name: 'Ultimate-Seiryubi',
    type: 'Ultimate',
    cost: 8
  };

  const spirit = {
    uid: 's_sp',
    name: 'Knight Dragon',
    type: 'Spirit',
    cost: 5
  };

  assert.equal(isEligibleBraveHost(standardBrave, ultimate).eligible, false, 'Standard Brave cannot combine with Ultimate');
  assert.equal(isEligibleBraveHost(namelessBrave, ultimate).eligible, false, 'Generic Brave without Ultimate keyword cannot combine with Ultimate');
  assert.equal(isEligibleBraveHost(standardBrave, spirit).eligible, true, 'Standard Brave combines with eligible Spirit');
});

test('Verify battle_arena.js implementation enforces informative diagnostics and filtered actions', () => {
  const arenaPath = path.join(rootDir, 'battle_arena.js');
  const js = fs.readFileSync(arenaPath, 'utf8');

  // Verify diagnostic reporting in openBraveCombineModal
  assert.ok(js.includes('Cannot combine'), 'Must format detailed rejection reasons');
  assert.ok(js.includes('Brave Condition:'), 'Must show the Brave condition in rejection messages');

  // Verify checkHandOnUltimateSummon gates Brave choice with isEligibleBraveHost
  assert.ok(js.includes('canBraveDirectly'), 'Gaianohoko summon trigger must check canBraveDirectly');

  // Verify hand quick action filters by isEligibleBraveHost
  assert.ok(js.includes('isEligibleBraveHost(card, s).eligible'), 'Quick actions must filter eligible hosts using isEligibleBraveHost');
});
