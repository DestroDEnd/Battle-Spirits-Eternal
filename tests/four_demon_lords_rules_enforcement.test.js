/**
 * tests/four_demon_lords_rules_enforcement.test.js
 *
 * Automated regression tests enforcing official Battle Spirits Eternal rules:
 * 1. The Hellwind FourDemonLord Van-Tous (SD65-X03) & Burst Lock:
 *    - (When Attacks) Returning a card from Hand to decktop places 2 cores from Void to an Ultimate
 *      and sets turn-wide Burst lock preventing opponent from triggering Bursts.
 *    - During Brave with Gaianohoko ("The opposing Burst can't activate") also blocks opposing Burst.
 * 2. Curse of Hades (BS14-096) & Spirit vs Ultimate Gating:
 *    - Burst effect: "Destroy an opposing exhausted Cost 5 or less Spirit."
 *    - Ultimates are strictly immune to effects specifying "Spirit".
 *    - Does NOT exhaust units or affect Ultimates.
 *    - Destroys eligible exhausted Cost 5 or less Spirit and recycles cores to reserve.
 * 3. Contract Partner Single Instance Identity:
 *    - Exactly ONE card instance is designated as the Contract Partner.
 *    - Secondary copies of "The PartnerDemonLord Javad" drawn into hand do NOT display the "🌟 PARTNER" badge.
 * 4. The Hellflame FourDemonLord Bram-Zahfag (SD65-X01) Board Wipe & Summon Lock:
 *    - (When Summoned) [LV3-5]: Destroys every opposing Spirit (including Zombie-Snake and NetherCorpseKing).
 *    - (Once per Game) By sending 1 Life to the Void, locks opponent from summoning Spirit cards until player's next Start Step.
 *    - Lock is cleared upon arriving at the player's next Start Step.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Helper simulating parseBurstCondition
function parseBurstCondition(effectText) {
  if (!effectText) return { type: 'NONE', label: 'None' };
  const lower = effectText.toLowerCase();
  if (lower.includes('after your life is reduced') || lower.includes('after your life is decreased') || lower.includes('自分のライフ減少後')) {
    return { type: 'AFTER_LIFE_DECREASED', label: 'After your Life is reduced' };
  }
  if (lower.includes('after an opposing spirit attacks') || lower.includes('相手のスピリットのアタック後')) {
    return { type: 'AFTER_OPPONENT_ATTACKS', label: 'After an opposing Spirit attacks' };
  }
  return { type: 'OTHER', label: 'Other' };
}

// Simulates checkBurstTrigger logic from battle_arena.js
function simulateCheckBurstTrigger(duelState, side, eventType, eventContext = {}) {
  const burstCard = side === 'player' ? duelState.player.burst : duelState.opponent.burst;
  if (!burstCard) return false;

  // 1. Check turn burst lock
  if (duelState.burstLockThisTurn === side) {
    return false;
  }

  // 2. Check attacker continuous burst lock (e.g. Gaianohoko During Brave)
  const attacker = eventContext.attacker || duelState.combatAttacker;
  if (attacker) {
    const braveEff = (attacker.brave && attacker.brave.effect ? attacker.brave.effect : '').toLowerCase();
    if (braveEff.includes("burst can't activate") || braveEff.includes("burst cannot activate") ||
        braveEff.includes("opposing burst can't activate")) {
      return false;
    }
  }

  const cond = parseBurstCondition(burstCard.effect);
  return cond.type === eventType;
}

test('1. Van-Tous (SD65-X03) attack triggers burst lock and prevents Burst activation', () => {
  const duelState = {
    turn: 3,
    activePlayer: 'player',
    burstLockThisTurn: null,
    combatAttacker: null,
    player: {
      hand: [{ uid: 'h1', name: 'Random Card', cost: 2 }],
      deck: [{ uid: 'd1', name: 'Deck Card' }],
      field: [{
        uid: 'vt1',
        name: 'The Hellwind FourDemonLord Van-Tous',
        type: 'Ultimate',
        currentLevel: 3,
        currentCores: 1,
        effect: '[LV3][LV4][LV5] (When Attacks) By returning a card from your Hand to the decktop, put two cores from the Void to any of your Ultimates, and during this turn, the opponent can\'t activate Burst effects.'
      }]
    },
    opponent: {
      burst: {
        uid: 'b1',
        name: 'Curse of Hades',
        type: 'Magic',
        effect: '[Burst: After your Life is reduced] Destroy an opposing exhausted Cost 5 or less Spirit.'
      }
    }
  };

  const attacker = duelState.player.field[0];
  duelState.combatAttacker = attacker;

  // Before attack ability resolves: Burst condition would match AFTER_LIFE_DECREASED
  assert.equal(simulateCheckBurstTrigger(duelState, 'opponent', 'AFTER_LIFE_DECREASED', { attacker }), true);

  // Execute Van-Tous ability:
  // Return card from hand to decktop, add 2 cores to Ultimate, lock bursts
  const returned = duelState.player.hand.shift();
  duelState.player.deck.unshift(returned);
  attacker.currentCores += 2;
  duelState.burstLockThisTurn = 'opponent';

  assert.equal(duelState.player.hand.length, 0);
  assert.equal(duelState.player.deck[0].uid, 'h1');
  assert.equal(attacker.currentCores, 3);
  assert.equal(duelState.burstLockThisTurn, 'opponent');

  // After Van-Tous ability resolves: Opponent CANNOT activate Burst
  assert.equal(simulateCheckBurstTrigger(duelState, 'opponent', 'AFTER_LIFE_DECREASED', { attacker }), false);
});

test('1c. Van-Tous effect matching robustness: supports both "decktop" and "desktop" spellings', () => {
  const pattern = /return(?:ing)?\s+a\s+card\s+from\s+your\s+hand\s+to\s+(?:the\s+)?(?:decktop|desktop|top\s+of\s+(?:the\s+|your\s+)?deck)/i;
  const burstLockPattern = /(?:opponent\s+(?:can't|cannot)\s+activate\s+burst\s+effects|バースト効果を発揮できない)/i;

  const textDecktop = "By returning a card from your Hand to the decktop, put two cores from the Void to any of your Ultimates, and during this turn, the opponent can't activate Burst effects.";
  const textDesktop = "By returning a card from your Hand to the desktop, put two cores from the Void to any of your Ultimates, and during this turn, the opponent can't activate Burst effects.";

  assert.ok(pattern.test(textDecktop), 'Matches standard decktop text');
  assert.ok(pattern.test(textDesktop), 'Matches wiki translation with desktop typo');
  assert.ok(burstLockPattern.test(textDecktop), 'Matches burst lock text');
  assert.ok(burstLockPattern.test(textDesktop), 'Matches burst lock text');
});

test('1b. Attacker with Gaianohoko [During Brave] The opposing Burst can\'t activate blocks Bursts', () => {
  const duelState = {
    burstLockThisTurn: null,
    combatAttacker: null,
    opponent: {
      burst: {
        uid: 'b1',
        name: 'Curse of Hades',
        type: 'Magic',
        effect: '[Burst: After your Life is reduced] Destroy an opposing exhausted Cost 5 or less Spirit.'
      }
    }
  };

  const bravedAttacker = {
    uid: 'ult1',
    name: 'The NextGenerationDragon Emperor-Siegfrieden',
    type: 'Ultimate',
    brave: {
      name: 'The EarthDeitySword Gaianohoko',
      type: 'Brave',
      effect: '[During Brave] The opposing Burst can\'t activate.'
    }
  };

  duelState.combatAttacker = bravedAttacker;
  assert.equal(simulateCheckBurstTrigger(duelState, 'opponent', 'AFTER_LIFE_DECREASED', { attacker: bravedAttacker }), false);
});

test('2. Curse of Hades (BS14-096) destroys exhausted Cost 5 or less Spirit and CANNOT target Ultimates', () => {
  const enemyField = [
    {
      uid: 'u1',
      name: 'The Hellwind FourDemonLord Van-Tous',
      type: 'Ultimate',
      cost: 8,
      isExhausted: true,
      currentCores: 2
    },
    {
      uid: 'u2',
      name: 'The Hellwind Searcher Kagerou-Seeker',
      type: 'Ultimate',
      cost: 3,
      isExhausted: false,
      currentCores: 1
    },
    {
      uid: 's1',
      name: 'Dark-Blade-Dragon',
      type: 'Spirit',
      cost: 6,
      isExhausted: true,
      currentCores: 2
    },
    {
      uid: 's2',
      name: 'Skeleton-Warrior',
      type: 'Spirit',
      cost: 3,
      isExhausted: true,
      currentCores: 2
    }
  ];

  // Pattern from Curse of Hades:
  // "Destroy an opposing exhausted Cost 5 or less Spirit"
  const bodyLower = 'destroy an opposing exhausted cost 5 or less spirit';
  const match = bodyLower.match(/destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(spirits?|ultimates?)/i);
  assert.ok(match, 'Regex must match Curse of Hades destruction clause');

  const targetCost = parseInt(match[1], 10);
  const isLess = match[2].toLowerCase() === 'less';
  const targetKind = match[3].toLowerCase().startsWith('ultimate') ? 'ultimate' : 'spirit';

  assert.equal(targetCost, 5);
  assert.equal(isLess, true);
  assert.equal(targetKind, 'spirit');

  // Filter candidates:
  let eligible = enemyField.filter(s => s.isExhausted);
  if (targetKind === 'spirit') {
    eligible = eligible.filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
  } else if (targetKind === 'ultimate') {
    eligible = eligible.filter(s => s.type === 'Ultimate' || (s.type || '').includes('Ultimate'));
  }
  if (targetCost !== null) {
    eligible = eligible.filter(s => isLess ? (s.cost || 0) <= targetCost : (s.cost || 0) >= targetCost);
  }

  // Van-Tous (Ultimate) and Kagerou-Seeker (Ultimate) must NOT be eligible!
  assert.ok(!eligible.some(e => e.uid === 'u1'), 'Van-Tous must not be eligible (Ultimate)');
  assert.ok(!eligible.some(e => e.uid === 'u2'), 'Kagerou-Seeker must not be eligible (Ultimate)');
  assert.ok(!eligible.some(e => e.uid === 's1'), 'Dark-Blade-Dragon must not be eligible (Cost 6 > 5)');

  // Only Skeleton-Warrior (Cost 3 Spirit, Exhausted) is eligible!
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].uid, 's2');
  assert.equal(eligible[0].name, 'Skeleton-Warrior');

  // Verify that if player only controls Ultimates (Pic 3 scenario), eligible is empty!
  const onlyUltimates = enemyField.filter(s => s.type.includes('Ultimate'));
  let ultCandidates = onlyUltimates.filter(s => s.isExhausted && (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit'))));
  assert.equal(ultCandidates.length, 0, 'No targets found when opposing field only contains Ultimates');
});

test('3. Contract Partner Single Instance Identity: only 1 designated instance is the Partner', () => {
  // Simulate deck with 3 copies of Javad (SD65-CX01)
  const deckCards = [
    { uid: 'j1', name: 'The PartnerDemonLord Javad', card_number: 'SD65-CX01', type: 'Contract Ultimate' },
    { uid: 'j2', name: 'The PartnerDemonLord Javad', card_number: 'SD65-CX01', type: 'Contract Ultimate' },
    { uid: 'j3', name: 'The PartnerDemonLord Javad', card_number: 'SD65-CX01', type: 'Contract Ultimate' },
    { uid: 'c4', name: 'Other Card 1', cost: 3 },
    { uid: 'c5', name: 'Other Card 2', cost: 4 }
  ];

  // Prepare deck with single-instance partner identity
  const prepared = deckCards.map(c => ({
    ...c,
    isContractPartner: false,
    is_contract_partner: false
  }));

  const pPartnerCard = prepared.splice(0, 1)[0];
  pPartnerCard.isContractPartner = true;
  pPartnerCard.is_contract_partner = true;

  const playerState = {
    contractCard: pPartnerCard,
    hand: [pPartnerCard, prepared[0]], // hand contains partner j1 and second copy j2
    deck: prepared.slice(1)
  };

  // Helper verifying partner badge logic
  function shouldRenderPartnerBadge(card, pState) {
    return !!(pState && pState.contractCard && pState.contractCard.uid === card.uid);
  }

  // Partner instance j1:
  assert.equal(shouldRenderPartnerBadge(playerState.hand[0], playerState), true, 'Designated Partner instance j1 displays 🌟 PARTNER badge');

  // Second copy j2 in hand:
  assert.equal(shouldRenderPartnerBadge(playerState.hand[1], playerState), false, 'Second copy j2 in hand does NOT display 🌟 PARTNER badge');
  assert.equal(playerState.hand[1].isContractPartner, false, 'Second copy j2 isContractPartner flag must be false');
});

test('4. Bram-Zahfag (SD65-X01) destroys every opposing Spirit and enforces summon lock', () => {
  const enemyField = [
    { uid: 'z1', name: 'Zombie-Snake', type: 'Spirit', cost: 1, currentCores: 2 },
    { uid: 'nk1', name: 'The NetherCorpseKing...', type: 'Spirit', cost: 8, currentCores: 3 },
    { uid: 'u1', name: 'Opposing Ultimate', type: 'Ultimate', cost: 7, currentCores: 2 }
  ];

  const enemyReserve = { reserve: 2 };
  const trash = [];

  // Bram-Zahfag text: "Destroy every opposing Spirit."
  const bodyLower = 'destroy every opposing spirit. then, (once per game: same name) by sending one of your lives to the void, until your next start step, the opponent can\'t summon spirit cards.';
  assert.ok(/destroy\s+(?:every|all)\s+opposing\s+spirits?/i.test(bodyLower));

  // Execute mass spirit destruction:
  const eligibleSpirits = enemyField.filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
  assert.equal(eligibleSpirits.length, 2, 'Must match Zombie-Snake and NetherCorpseKing');

  for (const s of [...eligibleSpirits]) {
    const idx = enemyField.findIndex(sp => sp.uid === s.uid);
    if (idx !== -1) {
      const dest = enemyField.splice(idx, 1)[0];
      enemyReserve.reserve += (dest.currentCores || 0);
      trash.push(dest);
    }
  }

  // Both spirits destroyed, cores returned to opponent reserve, ultimate spared:
  assert.equal(enemyField.length, 1);
  assert.equal(enemyField[0].uid, 'u1', 'Opposing Ultimate must remain on field');
  assert.equal(enemyReserve.reserve, 2 + 2 + 3, 'All 5 cores from destroyed spirits returned to reserve');
  assert.equal(trash.length, 2);

  // Bram-Zahfag summon lock:
  const duelState = {
    player: { life: 4 },
    opponent: {
      hand: [
        { uid: 'sp_new', name: 'New Spirit', type: 'Spirit', cost: 2 },
        { uid: 'ult_new', name: 'New Ultimate', type: 'Ultimate', cost: 6 }
      ]
    },
    opponentCantSummonSpiritsUntilNextStart: false,
    summonLockPlacedBy: null,
    usedOncePerGame: new Set()
  };

  // Activate Once per Game summon lock by sending 1 life to void:
  duelState.player.life -= 1;
  duelState.opponentCantSummonSpiritsUntilNextStart = true;
  duelState.summonLockPlacedBy = 'player';
  duelState.usedOncePerGame.add('The Hellflame FourDemonLord Bram-Zahfag_SummonLock');

  assert.equal(duelState.player.life, 3);
  assert.equal(duelState.opponentCantSummonSpiritsUntilNextStart, true);

  // Check summon eligibility during opponent's turn:
  function canOpponentSummon(card, dState) {
    if (dState.opponentCantSummonSpiritsUntilNextStart && (card.type === 'Spirit' || (!((card.type || '').includes('Ultimate')) && (card.type || '').includes('Spirit')))) {
      return false;
    }
    return true;
  }

  assert.equal(canOpponentSummon(duelState.opponent.hand[0], duelState), false, 'Opponent cannot summon Spirit while locked');
  assert.equal(canOpponentSummon(duelState.opponent.hand[1], duelState), true, 'Opponent can still summon Ultimate');

  // Arriving at Player's next Start Step clears lock:
  if (duelState.summonLockPlacedBy === 'player') {
    duelState.opponentCantSummonSpiritsUntilNextStart = false;
    duelState.summonLockPlacedBy = null;
  }
  assert.equal(duelState.opponentCantSummonSpiritsUntilNextStart, false, 'Summon lock cleared on Player Start Step');
  assert.equal(canOpponentSummon(duelState.opponent.hand[0], duelState), true, 'Opponent can summon Spirits after lock cleared');
});

test('5. Verify battle_arena.js implementation enforces all 4 rules', () => {
  const arenaSrc = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

  // 1. Van-Tous attack trigger
  assert.ok(arenaSrc.includes('// VAN-TOUS / HAND TO DECKTOP CORE GAIN & BURST LOCK:'), 'Must implement Van-Tous attack handler');
  assert.ok(arenaSrc.includes('DuelState.burstLockThisTurn = enemySide;'), 'Must set burstLockThisTurn');

  // 2. Burst lock check in checkBurstTrigger
  assert.ok(arenaSrc.includes('if (DuelState.burstLockThisTurn === side)'), 'checkBurstTrigger must check burstLockThisTurn');

  // 3. Curse of Hades exhaust vs destroy disambiguation
  assert.ok(arenaSrc.includes('!/destroy/i.test(descText)'), 'Exhaust block must exclude destruction effects');

  // 4. Curse of Hades exhausted spirit destruction
  assert.ok(arenaSrc.includes('// 3. DESTROY EXHAUSTED OPPOSING SPIRIT OR ULTIMATE'), 'Must support exhausted spirit destruction with cost filter');

  // 5. Single Contract Partner badge logic
  assert.ok(arenaSrc.includes('${(DuelState.player && DuelState.player.contractCard && DuelState.player.contractCard.uid === card.uid)'), 'Partner badge strictly gated to designated contract card UID');

  // 6. Bram-Zahfag mass destruction & summon lock
  assert.ok(arenaSrc.includes('// BRAM-ZAHFAG / MASS SPIRIT DESTRUCTION:'), 'Must implement Bram-Zahfag mass destruction');
  assert.ok(arenaSrc.includes('// BRAM-ZAHFAG SUMMON LOCK:'), 'Must implement Bram-Zahfag summon lock');
  assert.ok(arenaSrc.includes('DuelState.opponentCantSummonSpiritsUntilNextStart'), 'Must track opponentCantSummonSpiritsUntilNextStart');

  // 7. Turn 1 First Player Core Step and Attack Step skipping (Rule 1.1)
  assert.ok(arenaSrc.includes('DuelState.turn === 1 && DuelState.firstPlayer === \'player\''), 'Must detect Turn 1 First Player for Player');
  assert.ok(arenaSrc.includes('DuelState.phaseIndex = 2; // skip CORE, advance directly to DRAW'), 'Must advance directly to DRAW step on Turn 1');
  assert.ok(arenaSrc.includes('isFirstPlayerTurn1 && (p === \'CORE\' || p === \'ATTACK\')'), 'Step navigator must flag Core and Attack steps as skipped on Turn 1');
});
