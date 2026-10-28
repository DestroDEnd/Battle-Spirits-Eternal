const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING TEST SUITE: NEXUS FLASH TIMING, GRAND SKILL & CORE CHARGE\n');

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
  shield: () => {},
  magic: () => {},
  destroy: () => {},
  burstIgnite: () => {}
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
    deck: [],
    hand: [],
    field: [],
    nexus: [],
    nexusCards: [],
    trash: 0,
    trashCards: [],
    reserve: 5,
    life: 5
  };

  DuelState.opponent = {
    deck: [],
    hand: [],
    field: [],
    nexus: [],
    nexusCards: [],
    trash: 0,
    trashCards: [],
    reserve: 5,
    life: 5
  };
}

const suirenCard = {
  uid: 'suiren-1',
  name: "Suiren (Card)",
  type: "Nexus",
  cost: 2,
  color: "Purple",
  levels: [
    { level: 1, cores: 0, bp: 0 },
    { level: 2, cores: 2, bp: 0 }
  ],
  effect: `[Grandwalker Nexus]
This Nexus can only be affected by effects that target Grandwalker Nexuses. Cores can only be placed on this Nexus via Core Charge or effects that target Grandwalker Nexuses, and cannot be moved from this Nexus except via effects that target Grandwalker Nexuses.

[Core Charge: ("Makai"/Ogre Wizard/Worldswalker/Avatar & Cost 3 or more)]
◆When you summon/advent a target Spirit, put one core from the Void onto this Nexus.
◆When this Nexus is deployed, if you do not control a Grandwalker Nexus with the same card name, you can send three cards from your decktop to the Trash. For each target card among them, put a core from the Void onto this Nexus.

[Grand Skill: 4] [LV1][LV2] Flash - (Your Turn)
(Send four cores from this Nexus to the Void) Destroy an opposing exhausted Spirit/Ultimate.

[Grand Field] [LV2] (Opposing Turn)
When an opposing Spirit/Ultimate is exhausted, you can draw a card.`
};

// TEST 1: hasFlashTiming for Nexus in hand
console.log("Test 1: Verify hasFlashTiming(Nexus) is strictly false even if text has 'Flash -'...");
const hasFlash = BA.hasFlashTiming(suirenCard);
assert.strictEqual(hasFlash, false, "Suiren in hand must NEVER return true for hasFlashTiming!");
console.log("  ✓ hasFlashTiming(suirenCard) === false passed.");

// TEST 2: canPlayCardInCurrentPhase during Attack Step
console.log("Test 2: Verify canPlayCardInCurrentPhase(suirenCard) during Attack Step is false...");
resetTestDuel();
DuelState.phaseIndex = 5; // ATTACK step
DuelState.activePlayer = 'player';
const canPlayInAttack = BA.canPlayCardInCurrentPhase(suirenCard);
assert.strictEqual(canPlayInAttack, false, "Suiren cannot be played from hand during Attack Step!");
console.log("  ✓ canPlayCardInCurrentPhase(suirenCard) === false in Attack Step passed.");

// TEST 3: deployNexus during Attack Step is blocked
console.log("Test 3: Verify deployNexus is blocked during non-Main steps...");
resetTestDuel();
DuelState.phaseIndex = 5; // ATTACK step
DuelState.player.hand = [JSON.parse(JSON.stringify(suirenCard))];
BA.deployNexus('suiren-1');
assert.strictEqual(DuelState.player.nexus.length, 0, "deployNexus must not deploy Nexus during Attack Step!");
assert.strictEqual(DuelState.player.hand.length, 1, "Card should still remain in hand!");
console.log("  ✓ deployNexus blocked during Attack Step passed.");

// TEST 4: deployNexus during Main Step succeeds & triggers Core Charge on deploy
console.log("Test 4: Deploying Nexus in Main Step triggers Core Charge from deck top...");
resetTestDuel();
DuelState.phaseIndex = 4; // MAIN step
DuelState.player.reserve = 5;
DuelState.player.hand = [JSON.parse(JSON.stringify(suirenCard))];
DuelState.player.deck = [
  { uid: 'm1', name: "Makai Soldier 1", family: "Makai", cost: 3, type: "Spirit" },
  { uid: 'm2', name: "Random Beast", family: "Beast", cost: 2, type: "Spirit" },
  { uid: 'm3', name: "Avatar Wizard", family: "Avatar", cost: 4, type: "Spirit" }
];

BA.deployNexus('suiren-1');
assert.strictEqual(DuelState.player.nexus.length, 1, "Suiren should now be in DuelState.player.nexus");
const deployedSuiren = DuelState.player.nexus[0];
console.log(`  Suiren deployed on field! Current cores: ${deployedSuiren.currentCores} (Milled 3 cards: 2 matches -> 2 cores from Void)`);
assert.strictEqual(deployedSuiren.currentCores, 2, "Suiren should have 2 cores charged from Void via Core Charge on deploy!");
assert.strictEqual(DuelState.player.trashCards.length, 3, "3 milled cards should be in player's trashCards");
console.log("  ✓ deployNexus and deploy Core Charge passed.");

// TEST 5: Summoning a matching Spirit triggers Core Charge on deployed Grandwalker
console.log("Test 5: Summoning target Spirit adds 1 core to Suiren via Core Charge...");
const matchingSpirit = { uid: 'sp-1', name: "Makai Lord", family: "Makai", cost: 4, type: "Spirit" };
BA.executeCoreCharge(deployedSuiren, 'player', 'SUMMON', { spirit: matchingSpirit });
assert.strictEqual(deployedSuiren.currentCores, 3, "Suiren cores should increase from 2 to 3 upon summoning Makai Lord");
console.log("  ✓ summon Core Charge passed.");

// TEST 6: parseGrandSkill extracts Grand Skill details correctly
console.log("Test 6: parseGrandSkill parses cost, timingLabel, and timingType...");
const gsInfo = BA.parseGrandSkill(deployedSuiren);
assert(gsInfo, "Grand Skill must be parsed");
assert.strictEqual(gsInfo.cost, 4, "Grand Skill cost must be 4");
assert.strictEqual(gsInfo.timingType, 'your_turn', "Grand Skill timingType must be 'your_turn'");
console.log("  ✓ parseGrandSkill passed:", gsInfo);

// TEST 7: canActivateGrandSkill checks cost & timing
console.log("Test 7: canActivateGrandSkill checks...");
// Currently has 3 cores, requires 4 -> cannot activate
let check = BA.canActivateGrandSkill(deployedSuiren, 'player');
assert.strictEqual(check.allowed, false, "Cannot activate with 3 cores (cost 4)");

// Add 1 more core -> now 4 cores
deployedSuiren.currentCores = 4;
// Opponent turn -> cannot activate because (Your Turn)
DuelState.activePlayer = 'opponent';
check = BA.canActivateGrandSkill(deployedSuiren, 'player');
assert.strictEqual(check.allowed, false, "Cannot activate on Opponent turn because (Your Turn)");

// Player turn -> can activate!
DuelState.activePlayer = 'player';
check = BA.canActivateGrandSkill(deployedSuiren, 'player');
assert.strictEqual(check.allowed, true, "Can activate on Player turn with 4 cores");
console.log("  ✓ canActivateGrandSkill passed.");

// TEST 8: activateGrandSkill executes effect: removes cores & destroys opposing exhausted spirit
console.log("Test 8: activateGrandSkill removes cores and executes destroy opposing exhausted spirit...");
DuelState.opponent.field = [
  { uid: 'opp-1', name: 'Opponent Active Spirit', isExhausted: false, currentBp: 5000, bp: 5000 },
  { uid: 'opp-2', name: 'Opponent Exhausted Spirit', isExhausted: true, currentBp: 6000, bp: 6000 }
];

BA.activateGrandSkill('suiren-1', 'player');
assert.strictEqual(deployedSuiren.currentCores, 0, "4 cores sent to Void, leaving 0 cores on Nexus");
assert.strictEqual(DuelState.opponent.field.length, 1, "Exhausted opposing spirit should be destroyed");
assert.strictEqual(DuelState.opponent.field[0].uid, 'opp-1', "Active spirit should remain on field");
assert.strictEqual(DuelState.opponent.trashCards.length, 1, "Destroyed spirit should be in opponent trash");
console.log("  ✓ activateGrandSkill effect execution passed.");

// TEST 9: Grand Field card draw on opposing spirit exhaust during Opponent Turn
console.log("Test 9: Grand Field triggers draw on opposing spirit exhaust during opponent turn...");
deployedSuiren.currentCores = 2;
deployedSuiren.currentLevel = 2; // Lv2 requirement met
DuelState.activePlayer = 'opponent';
DuelState.player.deck = [{ uid: 'b1', name: 'Bonus Card 1' }, { uid: 'b2', name: 'Bonus Card 2' }];
const initialHandCount = DuelState.player.hand.length;

BA.checkGrandFieldOnOpponentExhaust('opponent');
assert.strictEqual(DuelState.player.hand.length, initialHandCount + 1, "Player should have drawn 1 card from Grand Field");
assert.strictEqual(DuelState.player.hand[DuelState.player.hand.length - 1].uid, 'b1');
console.log("  ✓ Grand Field on opponent exhaust passed.");

console.log("\n🏆 ALL 9 NEXUS FLASH, GRAND SKILL & CORE CHARGE TESTS PASSED PERFECTLY!");
