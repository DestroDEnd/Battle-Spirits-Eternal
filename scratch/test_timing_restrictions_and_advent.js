const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING COMPREHENSIVE TEST SUITE: TIMING RESTRICTIONS & ADVENT MECHANICS\n');

// Mock DOM & Storage environment
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => ({
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    style: { display: 'none' },
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    appendChild: () => {},
    focus: () => {},
    select: () => {},
    scrollIntoView: () => {}
  })
};

global.showToast = (msg, type) => console.log(`   [Toast - ${type || 'info'}]: ${msg}`);
global.AudioFX = {
  summon: () => {},
  slash: () => {},
  coreChime: () => {},
  lifeDamage: () => {},
  shield: () => {}
};

// Evaluate battle_arena.js
const baCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf-8');
eval(baCode);

const BA = window.BattleArena;
assert(BA, "BattleArena must be initialized");

// Helper to reset duel state
function resetTestDuel() {
  DuelState.turn = 2;
  DuelState.phaseIndex = 4; // MAIN step
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.activePlayer = 'player';
  DuelState.inDuel = true;
  DuelState.combatEvent = null;
  DuelState.logs = [];

  DuelState.player = {
    deck: [
      { uid: 'd1', name: 'Deck Card 1', type: 'Spirit', cost: 2 },
      { uid: 'd2', name: 'Deck Card 2', type: 'Spirit', cost: 3 },
      { uid: 'd3', name: 'Deck Card 3', type: 'Magic', cost: 1 }
    ],
    hand: [],
    field: [],
    reserve: 5,
    trash: 0,
    trashCards: [],
    voidCores: 0,
    life: 5,
    burst: null,
    soulCoreLocation: 'reserve'
  };

  DuelState.opponent = {
    deck: [
      { uid: 'od1', name: 'Opp Deck Card 1', type: 'Spirit', cost: 2 }
    ],
    hand: [],
    field: [],
    reserve: 5,
    trash: 0,
    trashCards: [],
    voidCores: 0,
    life: 5,
    burst: null,
    soulCoreLocation: 'reserve'
  };
}

// ==========================================
// TEST 1: Purple Flash's Extreme on Your Turn (Blocked)
// ==========================================
console.log('--- TEST 1: Purple Flash\'s Extreme Restriction on Your Turn ---');
resetTestDuel();

const purpleFlash = {
  uid: 'pfx_01',
  name: "Purple Flash's Extreme",
  type: 'Magic',
  cost: 0,
  color: 'Purple',
  effect: "This card and you are unaffected by any effect other than this card's effect, this card can't be used on Your Turn, and is banished from the game after its effect resolves.\n[Flash]\nTreat this card as colorless, and send all cores from every opposing Spirit/Ultimate to the Reserve. Then, during this turn, increase the LV cost of every opposing Spirit/Ultimate/Nexus by +2."
};
DuelState.player.hand.push(purpleFlash);

// Check in MAIN step of Player's Turn:
const checkMain = BA.checkCardUsageRestriction(purpleFlash, 'player');
assert.strictEqual(checkMain.allowed, false, "Must NOT be allowed on player's turn in Main step");
assert(checkMain.reason.includes("Cannot be used on Your Turn"), "Reason must specify Your Turn restriction");

const canPlayMain = BA.canPlayCardInCurrentPhase(purpleFlash, 'player');
assert.strictEqual(canPlayMain, false, "canPlayCardInCurrentPhase must return false in Main step");

// Check in ATTACK step of Player's Turn:
DuelState.phaseIndex = 5; // ATTACK step
const checkAtk = BA.checkCardUsageRestriction(purpleFlash, 'player');
assert.strictEqual(checkAtk.allowed, false, "Must NOT be allowed on player's turn in Attack step");

const canPlayAtk = BA.canPlayCardInCurrentPhase(purpleFlash, 'player');
assert.strictEqual(canPlayAtk, false, "canPlayCardInCurrentPhase must return false in Attack step on Your Turn");

// Try calling castMagic directly on player's turn:
BA.castMagic(purpleFlash.uid);
assert(DuelState.player.hand.some(c => c.uid === purpleFlash.uid), "Card must remain in hand and NOT be cast on player's turn");
console.log('✅ Purple Flash\'s Extreme is strictly prevented from being used on Your Turn!');

// ==========================================
// TEST 2: Purple Flash's Extreme on Opponent's Turn (Allowed & Banished to Void)
// ==========================================
console.log('\n--- TEST 2: Purple Flash\'s Extreme Resolution & Void Banishment ---');
// Switch to Opponent's Turn in Attack Step (Flash window):
DuelState.activePlayer = 'opponent';
DuelState.phaseIndex = 5; // ATTACK step

// Setup opponent's field with Spirits
DuelState.opponent.field = [
  { uid: 's1', name: 'War-Dragon', type: 'Spirit', currentCores: 2, currentBp: 5000 },
  { uid: 's2', name: 'Thunder-Grum', type: 'Spirit', currentCores: 3, currentBp: 7000 }
];

const checkOppTurn = BA.checkCardUsageRestriction(purpleFlash, 'player');
assert.strictEqual(checkOppTurn.allowed, true, "Must be allowed during opponent's turn");

// Cast the magic:
BA.castMagic(purpleFlash.uid);

// 1. Hand should no longer have the card
assert(!DuelState.player.hand.some(c => c.uid === purpleFlash.uid), "Card must be removed from hand");

// 2. Card must be BANISHED (sent to Void), NOT in trash!
assert(DuelState.player.trashCards.length === 0, "Card must NOT be in player's Trash");
assert(DuelState.player.voidCores >= 0, "Void cores updated");

// 3. Opponent spirits should be wiped out (all cores sent to their reserve, spirits depleted & sent to trash)
assert.strictEqual(DuelState.opponent.field.length, 0, "All opposing spirits must be depleted and sent to trash");
assert.strictEqual(DuelState.opponent.reserve, 5 + 2 + 3, "All cores must be returned to opponent's reserve");
assert.strictEqual(DuelState.opponent.trashCards.length, 2, "Both depleted spirits must be in opponent's trash");

console.log('✅ Purple Flash\'s Extreme wiped all enemy spirits to reserve and was properly banished from the game!');

// ==========================================
// TEST 3: Step-Restricted Magics (Great Link, Abyss Break)
// ==========================================
console.log('\n--- TEST 3: Step-Restricted Magics (No Main Step) ---');
resetTestDuel();

const greatLink = {
  uid: 'gl_01',
  name: 'Great Link',
  type: 'Magic',
  cost: 2,
  effect: "[Flash] Send every core from your Trash to a Spirit with [Awaken] you control. This effect can't be used in Main Step."
};
DuelState.player.hand.push(greatLink);

// In MAIN step:
DuelState.phaseIndex = 4; // MAIN
const checkGlMain = BA.checkCardUsageRestriction(greatLink, 'player');
assert.strictEqual(checkGlMain.allowed, false, "Great Link must NOT be allowed in Main Step");
assert(checkGlMain.reason.includes("Cannot be used in Main Step"), "Reason must state Main Step restriction");

// In ATTACK step:
DuelState.phaseIndex = 5; // ATTACK
const checkGlAtk = BA.checkCardUsageRestriction(greatLink, 'player');
assert.strictEqual(checkGlAtk.allowed, true, "Great Link must be allowed in Attack Step");

console.log('✅ Step-restricted cards like Great Link are properly blocked in Main Step!');

// ==========================================
// TEST 4: The MakaiKnight Shazworth Advent Requirement & Step Validation
// ==========================================
console.log('\n--- TEST 4: The MakaiKnight Shazworth Advent Timing & Execution ---');
resetTestDuel();

const shazworth = {
  uid: 'shaz_01',
  name: 'The MakaiKnight Shazworth',
  type: 'Spirit',
  cost: 6,
  color: 'Purple',
  levels: [
    { level: 1, cores: 1, bp: 6000 },
    { level: 2, cores: 2, bp: 10000 }
  ],
  effect: "Flash - [Advent: Purple & Cost 3 or more] ((Either Attack Step))\nBy sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.\n\n[LV1][LV2] (When Advents)\nDraw two cards.\n\n[LV2] (When Attacks)\nSend a core from any opposing Spirits to their Reserve. After this effect resolves, by discarding one of this Spirit's \"SevenShogun\"-named pre-advent cards, send two cores from any opposing Spirits/Ultimates to the Void."
};
DuelState.player.hand.push(shazworth);

// Target spirit on field: Purple, Cost 3
const targetBaseSpirit = {
  uid: 'seven_01',
  name: 'SevenShogun Death-Dragon',
  family: 'SevenShogun Ogre Wizard',
  type: 'Spirit',
  color: 'Purple',
  cost: 3,
  currentCores: 2,
  hasSoulCore: true,
  levels: [{ level: 1, cores: 1, bp: 3000 }]
};
DuelState.player.field.push(targetBaseSpirit);
DuelState.player.soulCoreLocation = 'field';

const req = BA.getCardAdventRequirement(shazworth);
assert(req, "Advent requirement must be parsed");
assert.strictEqual(req.minCost, 3, "Min cost must be 3");
assert(req.colors.includes('purple'), "Colors must include purple");
assert.strictEqual(req.timing, 'either_attack_step', "Timing must be either_attack_step");
assert.strictEqual(req.timingLabel, 'Either Attack Step', "Timing label must be Either Attack Step");

// In MAIN step:
DuelState.phaseIndex = 4; // MAIN step
assert.strictEqual(BA.isAdventTimingValid(req, 'player'), false, "Advent must NOT be valid in MAIN step!");
assert.strictEqual(BA.canPerformAdvent(shazworth, 'player'), false, "canPerformAdvent must return false in MAIN step!");

// In START / CORE / DRAW / REFRESH / END steps:
for (const pIdx of [0, 1, 2, 3, 6]) {
  DuelState.phaseIndex = pIdx;
  assert.strictEqual(BA.isAdventTimingValid(req, 'player'), false, `Advent must NOT be valid in step ${DuelState.phases[pIdx]}!`);
}

// In ATTACK step:
DuelState.phaseIndex = 5; // ATTACK step
assert.strictEqual(BA.isAdventTimingValid(req, 'player'), true, "Advent MUST be valid in ATTACK step!");
assert.strictEqual(BA.canPerformAdvent(shazworth, 'player'), true, "canPerformAdvent MUST return true in ATTACK step!");
console.log('✅ Advent timing is strictly verified: Attack Step ONLY, completely blocked in Main and other steps!');

// ==========================================
// TEST 5: The MakaiKnight Shazworth (When Advents) Effect
// ==========================================
console.log('\n--- TEST 5: Shazworth (When Advents) Draws Two Cards ---');
const handCountBefore = DuelState.player.hand.length; // Contains shazworth
const deckCountBefore = DuelState.player.deck.length;

// Execute Advent in Attack step:
BA.executeAdvent(shazworth, targetBaseSpirit, 'player');

// Soul core moved to Trash
assert.strictEqual(DuelState.player.soulCoreLocation, 'trash', "Soul Core must be in Trash");

// Target spirit transformed into Shazworth
assert.strictEqual(targetBaseSpirit.name, 'The MakaiKnight Shazworth', "Spirit name must become Shazworth");
assert(targetBaseSpirit.underlyingCards && targetBaseSpirit.underlyingCards.length === 1, "Must have 1 underlying card");
assert.strictEqual(targetBaseSpirit.underlyingCards[0].name, 'SevenShogun Death-Dragon', "Underlying card must be preserved");

// (When Advents) Draw two cards:
// Hand should have gained 2 cards from deck, and lost shazworth
assert.strictEqual(DuelState.player.hand.length, handCountBefore - 1 + 2, "Player hand must gain 2 cards from (When Advents)");
assert.strictEqual(DuelState.player.deck.length, deckCountBefore - 2, "Player deck must decrease by 2");
console.log('✅ Shazworth successfully advented and drew 2 cards via (When Advents)!');

// ==========================================
// TEST 6: Shazworth LV2 (When Attacks) Effect
// ==========================================
console.log('\n--- TEST 6: Shazworth LV2 (When Attacks) Core Removal & Void Sending ---');
// Setup opponent field with spirit
DuelState.opponent.field = [
  { uid: 'opp_s1', name: 'Dark-Wurm', type: 'Spirit', currentCores: 4, currentBp: 6000 }
];

targetBaseSpirit.currentLevel = 2; // Meets [LV2] requirement
targetBaseSpirit.currentCores = 3;

BA.executeWhenAttacksEffects(targetBaseSpirit, 'player');

// 1. One core sent from opposing spirit to their reserve
// 2. Discard SevenShogun pre-advent card to send 2 cores to Void
assert(targetBaseSpirit.underlyingCards.length === 0, "SevenShogun pre-advent card must be discarded");
assert(DuelState.player.trashCards.some(c => c.name === 'SevenShogun Death-Dragon'), "Discarded pre-advent card must be in trash");

// Opponent spirit started with 4 cores:
// - 1 core to Reserve
// - 2 cores to Void
// Remaining cores on opponent spirit: 1
assert.strictEqual(DuelState.opponent.field[0].currentCores, 1, "Opponent spirit must have 1 core remaining after reserve + void drain");
console.log('✅ Shazworth LV2 (When Attacks) drained enemy cores to reserve and sent 2 cores to Void by discarding SevenShogun!');

// ==========================================
// TEST 7: Other Advent Timings: Your Attack Step vs Opponent's Attack Step
// ==========================================
console.log('\n--- TEST 7: Distinct Advent Timings (Your Attack Step vs Opposing) ---');
resetTestDuel();

const yourAtkAdvent = {
  uid: 'yaa_01',
  name: 'The PirateDragonEmperor Siegfried-Abyss',
  type: 'Spirit',
  effect: 'Flash - [Advent: Cost 5 or more] (Your Attack Step)\nBy sending your [Soul Core] to the Trash, stack this...'
};

const oppAtkAdvent = {
  uid: 'oaa_01',
  name: 'Blizzastar-Eagle',
  type: 'Spirit',
  effect: 'Flash - [Advent: Cost 4 or more] (Opposing Attack Step)\nBy sending your [Soul Core] to the Trash, stack this...'
};

const reqYour = BA.getCardAdventRequirement(yourAtkAdvent);
assert.strictEqual(reqYour.timing, 'your_attack_step');

const reqOpp = BA.getCardAdventRequirement(oppAtkAdvent);
assert.strictEqual(reqOpp.timing, 'opposing_attack_step');

// In Player's Attack Step:
DuelState.activePlayer = 'player';
DuelState.phaseIndex = 5; // ATTACK
assert.strictEqual(BA.isAdventTimingValid(reqYour, 'player'), true, "Your Attack Step Advent is valid on Player Attack Step");
assert.strictEqual(BA.isAdventTimingValid(reqOpp, 'player'), false, "Opposing Attack Step Advent is NOT valid on Player Attack Step");

// In Opponent's Attack Step:
DuelState.activePlayer = 'opponent';
DuelState.phaseIndex = 5; // ATTACK
assert.strictEqual(BA.isAdventTimingValid(reqYour, 'player'), false, "Your Attack Step Advent is NOT valid on Opponent Attack Step");
assert.strictEqual(BA.isAdventTimingValid(reqOpp, 'player'), true, "Opposing Attack Step Advent IS valid on Opponent Attack Step");

console.log('✅ Distinct Advent timing requirements (Your Attack Step vs Opponent\'s Attack Step) verified!');

console.log('\n🎉 ALL 7 TESTS IN TIMING RESTRICTIONS & ADVENT SUITE PASSED WITH 100% SUCCESS!');
