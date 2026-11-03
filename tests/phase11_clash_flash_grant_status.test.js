import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load battle arena script in isolated sandbox context to test exact client functions
const arenaCode = readFileSync(resolve('./battle_arena.js'), 'utf8');

function setupTestEnvironment() {
  const mockDoc = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      innerHTML: '',
      querySelectorAll: () => [],
      querySelector: () => null
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild() {} }
  };

  const globalObj = {
    console,
    Math,
    parseInt,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    document: mockDoc,
    window: {
      location: { protocol: 'http:' },
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    AudioFX: {
      slash: () => {},
      summon: () => {},
      coreChime: () => {},
      destroy: () => {},
      kill: () => {}
    },
    showToast: () => {}
  };

  const fn = new Function('window', 'document', 'AudioFX', 'showToast', `
    ${arenaCode}
    return {
      BattleArena: window.BattleArena,
      DuelState: window.DuelState
    };
  `);

  return fn(globalObj.window, mockDoc, globalObj.AudioFX, globalObj.showToast);
}

test('Phase 11 - Aggressive Rage grants Clash to target Spirit and hasClash recognises it', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  // Create friendly spirit without native Clash (The DragonEmperorWaterShield Clio-Wasser)
  const clioWasser = {
    uid: 'spirit_clio_wasser_001',
    name: 'The DragonEmperorWaterShield Clio-Wasser',
    currentLevel: 2,
    currentBp: 5000,
    baseBp: 5000,
    currentCores: 4,
    hasSoulCore: true,
    isExhausted: false,
    effect: 'Cards can\'t be discarded from either deck.'
  };

  DuelState.player.field = [clioWasser];
  DuelState.opponent.field = [];
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5; // ATTACK step

  // Prior to spell, Clio-Wasser does not have Clash
  assert.equal(BattleArena.hasClash(clioWasser), false, 'Clio-Wasser initially has no Clash');

  // Aggressive Rage (BS16-073)
  const aggressiveRage = {
    uid: 'magic_aggressive_rage_001',
    name: 'Aggressive Rage',
    type: 'Magic',
    cost: 3,
    effect: '[FLASH] During this turn, give a Spirit you control: "[CLASH] (WHEN ATTACKS) The opponent must block if possible."'
  };

  // Cast Flash spell targeting Clio-Wasser
  const desc = BattleArena.applyMagicEffect(aggressiveRage, 'player', null, clioWasser.uid, 'flash');

  // Verify ability was granted
  assert.ok(desc.includes('[CLASH]'), 'Effect description confirms Clash was granted');
  assert.equal(BattleArena.hasClash(clioWasser), true, 'hasClash now returns true for Clio-Wasser');
  assert.ok(clioWasser.grantedKeywords.includes('Clash'), 'grantedKeywords contains Clash');
  assert.equal(clioWasser.hasClash, true, 'hasClash boolean flag set on unit');
});

test('Phase 11 - Attacking with granted Clash forces opponent Ready blocker to intercept', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const attacker = {
    uid: 'attacker_001',
    name: 'Clio-Wasser',
    currentLevel: 2,
    currentBp: 6000,
    baseBp: 5000,
    currentCores: 4,
    hasSoulCore: true,
    isExhausted: false,
    levels: [
      { level: 1, cores: 1, bp: 3000 },
      { level: 2, cores: 4, bp: 5000 }
    ],
    effect: 'Cards can\'t be discarded.'
  };

  // Grant Clash to attacker
  BattleArena.grantEffectToUnit(attacker, {
    keyword: 'Clash',
    text: '[CLASH] The opponent must block if possible.',
    expires: 'end_of_turn'
  }, 'Aggressive Rage');

  // Opponent has a ready blocker (Shadow Yatagarasu) with 3000 BP
  const yatagarasu = {
    uid: 'blocker_yatagarasu',
    name: 'Shadow Yatagarasu',
    currentLevel: 1,
    currentBp: 3000,
    currentCores: 1,
    isExhausted: false,
    effect: ''
  };

  DuelState.activePlayer = 'player';
  DuelState.player.field = [attacker];
  DuelState.opponent.field = [yatagarasu];
  DuelState.opponent.life = 4;
  DuelState.turn = 2;
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5;

  assert.equal(BattleArena.hasClash(attacker), true, 'Attacker has Clash');

  // Trigger attack resolution
  BattleArena.handleSpiritClick(attacker.uid, 'player');

  // Verify that combatEvent was created with blocker assigned due to Clash
  assert.ok(DuelState.combatEvent, 'Combat event initiated');
  assert.equal(DuelState.combatEvent.blocker.uid, yatagarasu.uid, 'Shadow Yatagarasu was forced to block due to Clash');
});

test('Phase 11 - Temporary granted Clash and BP boosts expire at end of turn', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const spirit = {
    uid: 'spirit_buff_target',
    name: 'Blade Dragon',
    currentLevel: 1,
    currentBp: 3000,
    baseBp: 3000,
    currentCores: 1,
    isExhausted: true,
    levels: [
      { level: 1, cores: 1, bp: 3000 },
      { level: 2, cores: 3, bp: 5000 }
    ],
    effect: ''
  };

  DuelState.player.field = [spirit];
  DuelState.opponent.field = [];
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5;

  // Grant Clash and +2000 BP
  BattleArena.grantEffectToUnit(spirit, {
    keyword: 'Clash',
    bp: 2000,
    text: '+2000 BP and [CLASH]',
    expires: 'end_of_turn'
  }, 'Test Magic');

  assert.equal(BattleArena.hasClash(spirit), true);
  assert.equal(spirit.currentBp, 5000);

  // End turn
  BattleArena.endTurn();

  // Temporary buffs expired
  assert.equal(BattleArena.hasClash(spirit), false, 'Clash expired after endTurn');
  assert.equal(spirit.currentBp, 3000, 'BP buff reset to base after endTurn');
});

test('Phase 11 - Brave BP Bonus calculation & Accel clause exclusion', () => {
  const { BattleArena } = setupTestEnvironment();

  // The SacredEmperorWeapon Siegfrieden-Cannon: Accel destroys 7000 BP or less, but printed brave bonus is 5000 BP
  const siegfriedenCannon = {
    name: 'The SacredEmperorWeapon Siegfrieden-Cannon',
    type: 'Brave',
    cost: 5,
    levels: { LV1: { level: 1, cost: 1, bp: 5000 } },
    effect: 'Flash- [Accel: Cost 4 ([Red Core][White Core])]\nDestroy two opposing 7000 BP or less Spirits. After this effect resolves, put this card face-up onto the Removed Zone.\n\n[LV1] [Reload]\nYou can [Advent] onto this Spirit-condition Brave.\n\n[During Brave] (When Attacks)\nDestroy any number of opposing Spirits up to a total of Cost 8.'
  };

  const cannonBonus = BattleArena.parseBraveBonus(siegfriedenCannon.levels, siegfriedenCannon.effect, siegfriedenCannon);
  assert.equal(cannonBonus, 5000, 'Siegfrieden-Cannon must calculate +5000 BP bonus (not +7000 BP from Accel)');

  // The BullGreatAxe Golden-Taurus-Axe: levels object with LV1 5000 BP
  const goldenAxe = {
    name: 'The BullGreatAxe Golden-Taurus-Axe',
    type: 'Brave',
    cost: 5,
    levels: { LV1: { level: 1, cost: 1, bp: 5000 } },
    effect: '[During Spirit Brave] (When Attacks)\nWhen only the opposing Spirit is destroyed by BP comparison, for each symbol on this Spirit, send an opposing Life to the Reserve.'
  };

  const axeBonus = BattleArena.parseBraveBonus(goldenAxe.levels, goldenAxe.effect, goldenAxe);
  assert.equal(axeBonus, 5000, 'Golden-Taurus-Axe must calculate +5000 BP bonus from levels object (not fallback 1000 BP)');
});

test('Phase 11 - Brave combining rules: cannot combine onto another Brave and obeys Double Brave', () => {
  const { BattleArena } = setupTestEnvironment();

  const brave1 = {
    uid: 'b_1',
    name: 'The BullGreatAxe Golden-Taurus-Axe',
    type: 'Brave',
    isBraveCard: true,
    cost: 5
  };

  const brave2 = {
    uid: 'b_2',
    name: 'The SacredEmperorWeapon Siegfrieden-Cannon',
    type: 'Brave',
    isBraveCard: true,
    cost: 5
  };

  const normalSpirit = {
    uid: 's_normal',
    name: 'Normal Knight',
    type: 'Spirit',
    isBraveCard: false,
    cost: 6,
    brave: null
  };

  const alreadyBravedSpirit = {
    uid: 's_braved',
    name: 'Already Braved Dragon',
    type: 'Spirit',
    isBraveCard: false,
    cost: 6,
    brave: brave1
  };

  const doubleBraveSpirit = {
    uid: 's_double_brave',
    name: 'The SuperEmperor Dragon',
    type: 'Spirit',
    isBraveCard: false,
    cost: 8,
    brave: brave1,
    effect: '[LV1][LV2] This Spirit can combine with up to two Braves.'
  };

  // Rule 1: A Brave cannot combine onto another Brave in Spirit form
  const braveOntoBraveCheck = BattleArena.isEligibleBraveHost(brave1, brave2);
  assert.equal(braveOntoBraveCheck.eligible, false, 'Cannot combine Brave onto another Brave');
  assert.ok(braveOntoBraveCheck.reason.includes('Brave cannot combine onto another Brave'));

  // Rule 2: Cannot combine onto itself
  const selfCheck = BattleArena.isEligibleBraveHost(brave1, brave1);
  assert.equal(selfCheck.eligible, false, 'Cannot combine onto itself');

  // Rule 3: Can combine onto normal spirit
  const normalCheck = BattleArena.isEligibleBraveHost(brave1, normalSpirit);
  assert.equal(normalCheck.eligible, true, 'Can combine onto normal eligible spirit');

  // Rule 4: Cannot combine onto already braved spirit lacking Double Brave
  const bravedCheck = BattleArena.isEligibleBraveHost(brave2, alreadyBravedSpirit);
  assert.equal(bravedCheck.eligible, false, 'Cannot combine onto spirit that already has a Brave');

  // Rule 5: CAN combine onto already braved spirit if it has Double Brave
  const doubleCheck = BattleArena.isEligibleBraveHost(brave2, doubleBraveSpirit);
  assert.equal(doubleCheck.eligible, true, 'Can combine onto spirit with Double Brave');
});

test('Phase 11 - Braved Spirit attack triggers Brave When Attacks destruction', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const cannonBrave = {
    uid: 'brave_cannon',
    name: 'The SacredEmperorWeapon Siegfrieden-Cannon',
    type: 'Brave',
    isBraveCard: true,
    effect: '[During Brave] (When Attacks)\nDestroy any number of opposing Spirits up to a total of Cost 8.'
  };

  const attacker = {
    uid: 'spirit_attacker',
    name: 'The DragonEmperorWaterShield Clio-Wasser',
    currentLevel: 2,
    currentBp: 10000,
    baseBp: 5000,
    isExhausted: false,
    isBraved: true,
    brave: cannonBrave,
    effect: 'Cards can\'t be discarded from either deck.'
  };

  const enemySpirit1 = {
    uid: 'enemy_sp_1',
    name: 'Shadow Yatagarasu',
    cost: 2,
    currentBp: 1000,
    currentCores: 1
  };

  const enemySpirit2 = {
    uid: 'enemy_sp_2',
    name: 'Puppet Soldier',
    cost: 4,
    currentBp: 3000,
    currentCores: 1
  };

  DuelState.player.field = [attacker];
  DuelState.opponent.field = [enemySpirit1, enemySpirit2];
  DuelState.opponent.trash = 0;
  DuelState.opponent.reserve = 0;

  // Execute attack effects for braved attacker
  BattleArena.executeWhenAttacksEffects(attacker, 'player');

  // Both enemy spirits (Cost 2 + Cost 4 = Cost 6 <= Cost 8 budget) should be destroyed
  assert.equal(DuelState.opponent.field.length, 0, 'Both enemy spirits destroyed by Siegfrieden-Cannon Cost 8 budget');
});

test('Phase 11 - Golden-Taurus-Axe braved spirit burns opposing Life on BP comparison victory', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const goldenAxeBrave = {
    uid: 'brave_axe',
    name: 'The BullGreatAxe Golden-Taurus-Axe',
    type: 'Brave',
    isBraveCard: true,
    symbols: ['Red'],
    symbol: 'Red',
    effect: '[During Spirit Brave] (When Attacks)\nWhen only the opposing Spirit is destroyed by BP comparison, for each symbol on this Spirit, send an opposing Life to the Reserve.'
  };

  const hostSpirit = {
    uid: 'host_spirit',
    name: 'Red Dragon',
    type: 'Spirit',
    currentLevel: 2,
    currentBp: 10000,
    symbols: ['Red'],
    symbol: 'Red',
    isBraved: true,
    brave: goldenAxeBrave,
    effect: ''
  };

  const defendingSpirit = {
    uid: 'def_spirit',
    name: 'Shadow Yatagarasu',
    cost: 2,
    currentBp: 1000,
    currentCores: 1
  };

  DuelState.player.field = [hostSpirit];
  DuelState.opponent.field = [defendingSpirit];
  DuelState.opponent.life = 5;
  DuelState.opponent.reserve = 0;

  // Execute BP comparison victory
  BattleArena.executeBpComparisonEffects(hostSpirit, defendingSpirit, 'player', 'opponent');

  // Golden-Taurus-Axe + Red Dragon has 2 symbols (1 base + 1 brave)
  // Opponent Life was 5, now burns 2 Life to Reserve -> Life = 3, Reserve = 2
  assert.equal(DuelState.opponent.life, 3, 'Opponent life reduced by 2 (1 per symbol)');
  assert.equal(DuelState.opponent.reserve, 2, 'Life sent to opponent Reserve');
});

test('Phase 11 - Soul Core paid for summon cost goes to Trash and is NOT on spirit', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const kagerou = {
    uid: 'kagerou_1',
    name: 'The Hellwind Searcher Kagerou-Seeker',
    type: 'Ultimate',
    cost: 3,
    levels: {
      LV3: { level: 3, cost: 1, bp: 5000 },
      LV4: { level: 4, cost: 3, bp: 7000 }
    },
    effect: '[Summon Condition: Your Life is at two or more]\n\n[LV3][LV4] (When Summoned)\nIf [Soul Core] was used to pay the summon cost, reveal three cards from your decktop. Among them, add an Ultimate card to the Hand. Discard any remaining cards.'
  };

  DuelState.activePlayer = 'player';
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 4; // MAIN
  DuelState.player.reserve = 5;
  DuelState.player.trash = 0;
  DuelState.player.soulCoreLocation = 'reserve';
  DuelState.player.soulCoreSpiritUid = null;
  DuelState.player.hand = [kagerou];
  DuelState.player.field = [];
  DuelState.player.life = 5; // Meets summon condition (Life >= 2)

  // Summon with useSoulCore = true (Paid summon cost with Soul Core)
  BattleArena.summonCard(kagerou.uid, 1, true);

  // Field spirit must exist
  assert.equal(DuelState.player.field.length, 1);
  const summoned = DuelState.player.field[0];
  assert.equal(summoned.name, 'The Hellwind Searcher Kagerou-Seeker');

  // CRITICAL RULE VERIFICATION:
  // Soul Core was used as COST PAYMENT -> it MUST be in Trash, NOT on the Spirit!
  assert.equal(summoned.hasSoulCore, false, 'Summoned spirit must NOT have Soul Core on it when Soul Core was used to pay summon cost');
  assert.equal(DuelState.player.soulCoreLocation, 'trash', 'Soul Core location must be in Trash');
  assert.equal(DuelState.player.soulCoreSpiritUid, null, 'No spirit uid associated with Soul Core in Trash');
  assert.equal(summoned.paidWithSoulCore, true, 'Card records paidWithSoulCore = true');
  assert.equal(summoned.usedSoulCore, true, 'Card records usedSoulCore = true');
});

test('Phase 11 - Kagerou-Seeker interactive decktop reveal modal adds Ultimate and discards remainder', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const kagerou = {
    uid: 'kagerou_scry_test',
    name: 'The Hellwind Searcher Kagerou-Seeker',
    type: 'Ultimate',
    cost: 3,
    usedSoulCore: true,
    paidWithSoulCore: true,
    effect: '[LV3][LV4] (When Summoned)\nIf [Soul Core] was used to pay the summon cost, reveal three cards from your decktop. Among them, add an Ultimate card to the Hand. Discard any remaining cards.'
  };

  const decktop1 = { uid: 'd1', name: 'The Four Towers of Limbo', type: 'Nexus', cost: 3 };
  const decktop2 = { uid: 'd2', name: 'Birgoyle', type: 'Ultimate', cost: 3 };
  const decktop3 = { uid: 'd3', name: 'The Hellwind FourDemonLord Van-Tous', type: 'Ultimate', cost: 7 };

  DuelState.player.deck = [decktop1, decktop2, decktop3];
  DuelState.player.hand = [];
  DuelState.player.trashCards = [];

  // Trigger when summoned effect
  BattleArena.executeWhenSummonedEffects(kagerou, 'player');

  // Verify modal scry picked Birgoyle (first Ultimate found by headless auto-selector)
  assert.equal(DuelState.player.hand.length, 1, 'Exactly 1 Ultimate added to hand');
  assert.equal(DuelState.player.hand[0].name, 'Birgoyle', 'Birgoyle added to hand');

  // The remaining 2 cards (The Four Towers of Limbo and Van-Tous) must be discarded to Trash
  assert.equal(DuelState.player.deck.length, 0, 'All 3 cards were scried from deck');
  assert.equal(DuelState.player.trashCards.length, 2, 'Remaining 2 cards sent to Trash');
  assert.ok(DuelState.player.trashCards.some(c => c.name === 'The Four Towers of Limbo'));
  assert.ok(DuelState.player.trashCards.some(c => c.name === 'The Hellwind FourDemonLord Van-Tous'));
});

test('Phase 11 - Hard Once Per Turn: Same Name (The Four Towers of Limbo)', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const limboNexus1 = {
    uid: 'nexus_limbo_1',
    name: 'The Four Towers of Limbo',
    type: 'Nexus',
    cost: 3,
    currentLevel: 1,
    currentCores: 0
  };

  const limboNexus2 = {
    uid: 'nexus_limbo_2',
    name: 'The Four Towers of Limbo',
    type: 'Nexus',
    cost: 3,
    currentLevel: 1,
    currentCores: 0
  };

  const evilGodUlt1 = {
    uid: 'ult_1',
    name: 'Evil God Ultimate A',
    type: 'Ultimate',
    family: 'Evil God',
    families: ['Evil God']
  };

  const evilGodUlt2 = {
    uid: 'ult_2',
    name: 'Evil God Ultimate B',
    type: 'Ultimate',
    family: 'Evil God',
    families: ['Evil God']
  };

  DuelState.player.nexus = [limboNexus1, limboNexus2];
  DuelState.player.counters = 0;
  DuelState.player.deck = [
    { name: 'Card 1', type: 'Spirit' },
    { name: 'Card 2', type: 'Spirit' }
  ];
  DuelState.player.hand = [];

  // Attack 1 with Evil God Ultimate 1
  BattleArena.executeWhenAttacksEffects(evilGodUlt1, 'player');

  // Count should be +1, and choice effect (draw card) executed once
  assert.equal(DuelState.player.counters, 1, 'Counter increased to 1');
  assert.equal(DuelState.player.hand.length, 1, 'Choice effect drew 1 card');

  // Attack 2 with Evil God Ultimate 2 in the same turn
  BattleArena.executeWhenAttacksEffects(evilGodUlt2, 'player');

  // Counter increases again (+1 -> 2), but (Once per Turn: Same Name) PREVENTS drawing another card!
  assert.equal(DuelState.player.counters, 2, 'Counter increased to 2 on second attack');
  assert.equal(DuelState.player.hand.length, 1, 'Choice effect DID NOT fire a second time due to (Once per Turn: Same Name)');

  // End turn resets Hard Once Per Turn
  BattleArena.endTurn();
  assert.equal(BattleArena.hasUsedSameNameOncePerTurn('The Four Towers of Limbo', 'AttackStepChoice'), false, 'HOPT reset on endTurn');
});

test('Phase 11 - Brave BP Bonus uses Braved condition BP (+5000 BP, not Spirit 3000 BP)', () => {
  const { BattleArena } = setupTestEnvironment();

  // The EarthDeitySword Gaianohoko: Spirit form has 3000 BP, Braved form has +5000 BP
  const gaianohoko = {
    name: 'The EarthDeitySword Gaianohoko',
    type: 'Brave',
    cost: 5,
    levels: [ { level: 1, cores: 1, bp: 3000 } ],
    raw_levels: 'Level 1: 1 core, 3000 BP\nBraved: 0 cores, +5000 BP',
    braved_bp: 5000,
    brave_condition: 'Cost 5 or more Ultimate',
    effect: '[Brave Condition: Cost 5 or more Ultimate]\n\nWhen your Ultimate is summoned, you can summon this card from the Hand without paying the cost.\n\n[During Brave]\nWhile braved to an Ultimate without Cross Ultimate Trigger, this Brave\'s Cost becomes 0.\n\n[During Brave] (When Attacks/Blocks)\nThe opposing Burst can\'t activate.'
  };

  const bpBonus = BattleArena.parseBraveBonus(gaianohoko.levels, gaianohoko.effect, gaianohoko);
  assert.equal(bpBonus, 5000, 'Gaianohoko must provide +5000 BP in Brave condition (NOT its Spirit form 3000 BP)');

  // Verify host Spirit/Ultimate BP calculation with combined Brave
  const hostUlt = {
    uid: 'host_ult_1',
    name: 'Ultimate-Seiryubi',
    type: 'Ultimate',
    cost: 8,
    currentLevel: 3,
    currentCores: 1,
    baseBp: 10000,
    currentBp: 10000,
    levels: [{ level: 3, cores: 1, bp: 10000 }, { level: 4, cores: 3, bp: 13000 }],
    brave: gaianohoko
  };
  gaianohoko.bpBonus = bpBonus;

  BattleArena.recalculateSpiritBp(hostUlt);
  assert.equal(hostUlt.currentBp, 15000, 'Host Ultimate BP must be 10000 + 5000 = 15000 BP');
});

test('Phase 11 - Brave Condition enforcement filters ineligible targets (Gaianohoko requires Cost 5+ Ultimate)', () => {
  const { BattleArena } = setupTestEnvironment();

  const gaianohoko = {
    name: 'The EarthDeitySword Gaianohoko',
    type: 'Brave',
    cost: 5,
    brave_condition: 'Cost 5 or more Ultimate',
    effect: '[Brave Condition: Cost 5 or more Ultimate]\n\n[During Brave] ...'
  };

  const kagerouSeeker = {
    uid: 'ks_1',
    name: 'The Hellwind Searcher Kagerou-Seeker',
    type: 'Ultimate',
    cost: 3
  };

  const javad = {
    uid: 'javad_1',
    name: 'The PartnerDemonLord Javad',
    type: 'Contract Ultimate',
    cost: 3
  };

  const bladeDragon = {
    uid: 'bd_1',
    name: 'Blade Dragon',
    type: 'Spirit',
    cost: 5
  };

  const seiryubi = {
    uid: 'seiryubi_1',
    name: 'Ultimate-Seiryubi',
    type: 'Ultimate',
    cost: 8
  };

  // 1. Kagerou-Seeker is Cost 3 Ultimate -> Ineligible (Cost < 5)
  const check1 = BattleArena.checkBraveCondition(gaianohoko, kagerouSeeker);
  assert.equal(check1.eligible, false, 'Cost 3 Ultimate must be rejected');
  assert.ok(check1.reason.includes('Cost 5+'));

  // 2. Javad is Cost 3 Contract Ultimate -> Ineligible (Cost < 5)
  const check2 = BattleArena.checkBraveCondition(gaianohoko, javad);
  assert.equal(check2.eligible, false, 'Cost 3 Contract Ultimate must be rejected');

  // 3. Blade Dragon is Cost 5 Spirit -> Ineligible (Not an Ultimate)
  const check3 = BattleArena.checkBraveCondition(gaianohoko, bladeDragon);
  assert.equal(check3.eligible, false, 'Spirit must be rejected when condition requires Ultimate');

  // 4. Seiryubi is Cost 8 Ultimate -> Eligible!
  const check4 = BattleArena.checkBraveCondition(gaianohoko, seiryubi);
  assert.equal(check4.eligible, true, 'Cost 8 Ultimate satisfies Cost 5+ Ultimate requirement');
});

test('Phase 11 - Contract Partner transitions to Soul State upon leaving field & returns cores to reserve', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const contractPartner = {
    uid: 'c_javad',
    name: 'The PartnerDemonLord Javad',
    type: 'Contract Ultimate',
    isContractPartner: true,
    currentCores: 2,
    hasSoulCore: true,
    currentBp: 5000
  };

  DuelState.player.contractCard = contractPartner;
  DuelState.player.field = [contractPartner];
  DuelState.player.reserve = 2;
  DuelState.player.soulCoreLocation = 'field';
  DuelState.player.soulCoreSpiritUid = contractPartner.uid;

  // Partner destroyed by opponent effect
  BattleArena.sendToTrash(contractPartner, 'player', 'Destroyed by opposing magic');

  // 1. Partner enters Soul State instead of Trash
  assert.equal(contractPartner.isSoulState, true, 'Partner marked in Soul State');
  assert.equal(DuelState.player.soulStateCards.length, 1, 'Partner added to soulStateCards');
  assert.equal(DuelState.player.field.length, 0, 'Partner removed from active field');
  assert.equal((DuelState.player.trashCards || []).length, 0, 'Partner NOT in trash');

  // 2. Cores returned to Reserve (1 normal core + Soul Core to reserve)
  assert.equal(DuelState.player.reserve, 3, 'Normal core returned to Reserve (2 + 1 = 3)');
  assert.equal(DuelState.player.soulCoreLocation, 'reserve', 'Soul Core returned to Reserve');
  assert.equal(contractPartner.currentCores, 0, 'Cores on Soul State card reset to 0');

  // 3. Card in Soul State cannot attack or block
  assert.equal(BattleArena.canUnitAttack(contractPartner), false, 'Unit in Soul State cannot attack');
  assert.equal(BattleArena.canUnitBlock(contractPartner), false, 'Unit in Soul State cannot block');
});

test('Phase 11 - Contract Advent onto Soul State restores card to field and Over Count (OC) scales BP', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const partnerInSoulState = {
    uid: 'c_partner_soul',
    name: 'The PartnerDemonLord Javad',
    type: 'Contract Ultimate',
    family: 'Evil God',
    isContractPartner: true,
    isSoulState: true,
    currentCores: 0,
    cost: 3,
    effect: '[Soul State] (Your Attack Step) Count +1.'
  };

  DuelState.player.contractCard = partnerInSoulState;
  DuelState.player.soulStateCards = [partnerInSoulState];
  DuelState.player.field = [];
  DuelState.player.reserve = 3;
  DuelState.player.count = 2;
  DuelState.player.soulCoreLocation = 'reserve';

  const contractAdventCard = {
    uid: 'c_advent_card',
    name: 'Demon Lord Advent Form',
    type: 'Ultimate',
    cost: 6,
    family: 'Evil God',
    levels: [{ level: 3, cores: 1, bp: 10000 }, { level: 4, cores: 3, bp: 14000 }],
    effect: 'Flash - [Contract Advent: "Evil God" & C1 or more, (Your Attack Step)]\n[During OC] [OC Condition: C2 or more] BP+5000\n[During OC] (When Attacks) Destroy 1 opposing Spirit.'
  };

  DuelState.player.hand = [contractAdventCard];

  // 1. Requirement parsing: recognizes Contract Advent, C1 or more count, and targets in Soul State
  const req = BattleArena.getCardAdventRequirement(contractAdventCard);
  assert.equal(req.isContractAdvent, true, 'Identified as Contract Advent');
  assert.equal(req.minCount, 1, 'Requires C1 or more');

  // 2. Targets: Soul State Partner satisfies "Evil God" and C1+ requirement!
  const eligible = BattleArena.getEligibleAdventTargets(req, DuelState.player.field, 'player');
  assert.equal(eligible.length, 1, 'Partner in Soul State is an eligible target');
  assert.equal(eligible[0].uid, partnerInSoulState.uid);

  // 3. Execute Contract Advent onto Soul State target
  BattleArena.executeAdvent(contractAdventCard, partnerInSoulState, 'player');

  // Target leaves Soul State, enters active field with 1 core allocated from Reserve
  assert.equal(partnerInSoulState.isSoulState, false, 'Target leaves Soul State');
  assert.equal(DuelState.player.soulStateCards.length, 0, 'soulStateCards empty');
  assert.equal(DuelState.player.field.length, 1, 'Placed on active field');
  assert.equal(DuelState.player.field[0].currentCores, 1, 'Allocated 1 core');
  assert.equal(DuelState.player.reserve, 1, 'Reserve decreased by 2 cores (1 Soul Core to Trash, 1 core to Advent spirit: 3 -> 1)');
  assert.equal(DuelState.player.soulCoreLocation, 'trash', 'Soul Core spent for Advent sent to Trash');

  // 4. Over Count BP+ bonus: Count is 2, satisfying C2 or more (+5000 BP)
  BattleArena.recalculateSpiritBp(DuelState.player.field[0]);
  assert.equal(DuelState.player.field[0].currentBp, 15000, 'Base 10000 BP + 5000 OC BP = 15000 BP');
});

test('Phase 11 - The Ruler of FourDemonLords Lord-Javad prompts hand discard before drawing 2 and drains 2 cores on Evil God discard', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const lordJavad = {
    uid: 'ult_lord_javad_01',
    name: 'The Ruler of FourDemonLords Lord-Javad',
    type: 'Ultimate',
    cost: 6,
    family: 'Hell Contract/Evil God',
    currentLevel: 3,
    currentCores: 1,
    currentBp: 10000,
    effect: '[LV3][LV4] (When Summoned/Advents)\nBy discarding a card from your Hand, draw two cards. When this effect discards any "Evil God" family card, send two cores from the opposing Field to the Reserve.'
  };

  const greyTude = {
    uid: 'card_grey_tude_01',
    name: 'The HellsoilCount Grey-Tude',
    type: 'Ultimate',
    cost: 1,
    family: 'Evil God',
    effect: ''
  };

  const deckCard1 = { uid: 'deck_1', name: 'Deck Card 1', type: 'Spirit', cost: 2 };
  const deckCard2 = { uid: 'deck_2', name: 'Deck Card 2', type: 'Magic', cost: 3 };

  const oppSpirit = {
    uid: 'opp_sp_01',
    name: 'Opposing Minion',
    type: 'Spirit',
    cost: 3,
    currentCores: 2,
    currentBp: 3000
  };

  DuelState.player.field = [lordJavad];
  DuelState.player.hand = [greyTude];
  DuelState.player.deck = [deckCard1, deckCard2];
  DuelState.player.trashCards = [];

  DuelState.opponent.field = [oppSpirit];
  DuelState.opponent.reserve = 0;
  DuelState.opponent.trashCards = [];

  // Execute When Summoned effect
  BattleArena.executeWhenSummonedEffects(lordJavad, 'player');

  // Verify hand discard: Grey-Tude was discarded from Hand to Trash
  assert.equal(DuelState.player.trashCards.some(c => c.uid === greyTude.uid), true, 'Grey-Tude is in Trash');
  assert.equal(DuelState.player.hand.some(c => c.uid === greyTude.uid), false, 'Grey-Tude removed from Hand');

  // Verify draw 2 cards: deckCard1 and deckCard2 added to hand
  assert.equal(DuelState.player.hand.length, 2, 'Player drew 2 cards');
  assert.equal(DuelState.player.hand[0].name, 'Deck Card 1');
  assert.equal(DuelState.player.hand[1].name, 'Deck Card 2');
  assert.equal(DuelState.player.deck.length, 0, 'Deck has 0 cards remaining');

  // Verify Evil God synergy: Opposing spirit had 2 cores drained to Reserve and was depleted to Trash!
  assert.equal(DuelState.opponent.reserve, 2, '2 cores sent to opponent Reserve');
  assert.equal(DuelState.opponent.field.length, 0, 'Opposing spirit depleted from field');
  assert.equal(DuelState.opponent.trashCards.some(c => c.uid === oppSpirit.uid), true, 'Opposing spirit sent to Trash');
});

test('Phase 11 - The Ruler of FourDemonLords Lord-Javad does not draw if hand is empty', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const lordJavad = {
    uid: 'ult_lord_javad_02',
    name: 'The Ruler of FourDemonLords Lord-Javad',
    type: 'Ultimate',
    cost: 6,
    family: 'Hell Contract/Evil God',
    currentLevel: 3,
    currentCores: 1,
    currentBp: 10000,
    effect: '[LV3][LV4] (When Summoned/Advents)\nBy discarding a card from your Hand, draw two cards. When this effect discards any "Evil God" family card, send two cores from the opposing Field to the Reserve.'
  };

  const deckCard1 = { uid: 'deck_1', name: 'Deck Card 1', type: 'Spirit', cost: 2 };
  const deckCard2 = { uid: 'deck_2', name: 'Deck Card 2', type: 'Magic', cost: 3 };

  DuelState.player.field = [lordJavad];
  DuelState.player.hand = []; // Empty hand!
  DuelState.player.deck = [deckCard1, deckCard2];
  DuelState.player.trash = [];

  // Execute When Summoned effect
  BattleArena.executeWhenSummonedEffects(lordJavad, 'player');

  // Verify no draw occurs because cost condition could not be fulfilled
  assert.equal(DuelState.player.hand.length, 0, 'Player hand remains empty');
  assert.equal(DuelState.player.deck.length, 2, 'Deck remains untouched at 2 cards');
});
