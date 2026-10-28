const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🧪 RUNNING COMPREHENSIVE TEST SUITE: ALL DECK & STARTER EFFECTS");

// Mock browser environment
global.window = {
  location: { search: '' },
  addEventListener: () => {},
  Audio: class { play() {} pause() {} },
  BattleArena: null
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => {
    return {
      id,
      innerHTML: '',
      textContent: '',
      style: { display: 'none' },
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      appendChild: () => {},
      children: [],
      querySelectorAll: () => [],
      querySelector: () => null,
      setAttribute: () => {},
      getAttribute: () => null
    };
  }
};

global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Evaluate battle_arena.js
const arenaCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf-8');
eval(arenaCode);

const BA = window.BattleArena;
assert(BA, "BattleArena must be exported");

BA.init();
const duelState = BA.getState();
duelState.inDuel = true;
duelState.turn = 2; // Allow attacks
duelState.activePlayer = 'player';
duelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
duelState.phaseIndex = 5; // ATTACK

// ── TEST 1: Anaguma-Kosuke Dynamic Scaling BP Boost (+1000 BP per Imp) ──
console.log('\n--- TEST 1: Anaguma-Kosuke Imp Scaling BP Boost ---');
const anaguma = {
  uid: 'player-anaguma',
  name: 'Anaguma-Kosuke',
  color: 'Green',
  cost: 0,
  type: 'Spirit',
  family: 'Imp',
  currentLevel: 2,
  currentCores: 2,
  currentBp: 2000,
  levels: [
    { level: 1, cores: 1, bp: 1000 },
    { level: 2, cores: 2, bp: 2000 }
  ],
  effect: '[LV2] (When Attacks) For each "Imp" family Spirit you control, this Spirit gains +1000 BP.'
};

const impAlly1 = { uid: 'imp-1', name: 'Imp Scout', family: 'Imp', currentBp: 1000, isExhausted: false };
const impAlly2 = { uid: 'imp-2', name: 'Imp Runner', family: 'Imp', currentBp: 1000, isExhausted: false };

duelState.player.field = [anaguma, impAlly1, impAlly2];
duelState.opponent.field = [];
duelState.opponent.life = 5;

BA.recalculateSpiritBp(anaguma);
assert.strictEqual(anaguma.currentBp, 2000, "Initial BP must be 2000 BP");

// Declare attack: 3 Imp spirits on field -> +3000 BP!
BA.executePlayerAttack(anaguma);
assert.strictEqual(anaguma.battleBpBoost, 3000, `Anaguma should get +3000 BP (+1000 x 3 Imps), got ${anaguma.battleBpBoost}`);
assert.strictEqual(anaguma.battleBp, 5000, `Anaguma battle BP should be 5000 BP, got ${anaguma.battleBp}`);

// Reset battle BP:
BA.endOfBattleBpReset(anaguma);
assert.strictEqual(anaguma.currentBp, 2000, "Anaguma must revert to base 2000 BP post-battle");
console.log('✅ Anaguma-Kosuke scaled dynamically to +3000 BP and cleanly reverted to 2000 BP!');

// ── TEST 2: Caprihorn Opponent Unexhausted Scaling BP Boost ──
console.log('\n--- TEST 2: Caprihorn Unexhausted Scaling BP Boost ---');
const caprihorn = {
  uid: 'player-caprihorn',
  name: 'Caprihorn',
  color: 'White',
  cost: 4,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 2,
  currentBp: 4000,
  levels: [{ level: 1, cores: 1, bp: 2000 }, { level: 2, cores: 2, bp: 4000 }],
  effect: '[LV2] (When Attacks) This spirit gets +1000 BP for each unexhausted spirit your opponent controls.'
};

duelState.player.field = [caprihorn];
duelState.opponent.field = [
  { uid: 'opp-1', name: 'Opp1', isExhausted: false, currentBp: 1000 },
  { uid: 'opp-2', name: 'Opp2', isExhausted: false, currentBp: 1000 },
  { uid: 'opp-3', name: 'Opp3', isExhausted: true, currentBp: 1000 }
];
duelState.opponent.life = 5;

BA.recalculateSpiritBp(caprihorn);
BA.executePlayerAttack(caprihorn);
// 2 unexhausted opposing spirits -> +2000 BP!
assert.strictEqual(caprihorn.battleBpBoost, 2000, `Caprihorn must get +2000 BP, got ${caprihorn.battleBpBoost}`);
assert.strictEqual(caprihorn.battleBp, 6000, `Caprihorn battle BP must be 6000 BP, got ${caprihorn.battleBp}`);

BA.endOfBattleBpReset(caprihorn);
assert.strictEqual(caprihorn.currentBp, 4000, "Caprihorn must revert to 4000 BP post-attack");
console.log('✅ Caprihorn scaled dynamically (+2000 BP for 2 unexhausted enemies) and reverted post-attack!');

// ── TEST 3: Strike-Siegwurm Auto-Refresh on Opposing Attack ──
console.log('\n--- TEST 3: Strike-Siegwurm Auto-Refresh on Opposing Attack ---');
const strikeSiegwurm = {
  uid: 'player-strike-siegwurm',
  name: 'The MoonlightDragon Strike-Siegwurm',
  color: 'White',
  cost: 6,
  isExhausted: true, // Currently exhausted!
  currentBp: 6000,
  effect: '[LV1][LV2][LV3] (Opposing Attack Step) When an opposing Spirit attacks, refresh this Spirit.'
};

duelState.player.field = [strikeSiegwurm];
duelState.opponent.field = [
  { uid: 'opp-att-1', name: 'Attacking Wyrm', isExhausted: false, currentBp: 5000, currentLevel: 1, levels: [{ level: 1, cores: 1, bp: 5000 }] }
];
duelState.activePlayer = 'opponent';
duelState.turn = 2;

// Opponent AI attacks!
BA.runAiAttackStep();
assert.strictEqual(strikeSiegwurm.isExhausted, false, "Strike-Siegwurm must auto-refresh when opponent attacks!");
console.log('✅ Strike-Siegwurm successfully auto-refreshed to ready defensive stance upon enemy attack!');

// ── TEST 4: The ArmoredBeast Oozuchi White Spirit Refresh on Life Damage ──
console.log('\n--- TEST 4: The ArmoredBeast Oozuchi Life Damage Refresh ---');
const oozuchi = {
  uid: 'player-oozuchi',
  name: 'The ArmoredBeast Oozuchi',
  color: 'White',
  cost: 2,
  isExhausted: false,
  currentBp: 2000,
  effect: '[LV1][LV2] (Opposing Attack Step) When your Life is reduced by opposing Spirits, refresh a White Spirit you control.'
};

const exhaustedWhiteAlly = {
  uid: 'player-white-ally',
  name: 'Diamond Betta',
  color: 'White',
  cost: 2,
  isExhausted: true, // Exhausted
  currentBp: 3000
};

duelState.player.field = [oozuchi, exhaustedWhiteAlly];
duelState.player.life = 5;
duelState.player.reserve = 0;

// Player takes direct life damage:
BA.takeLifeDamage('opp-att-1');
assert.strictEqual(duelState.player.life, 4, "Player life should be reduced to 4");
assert.strictEqual(exhaustedWhiteAlly.isExhausted, false, "Diamond Betta (White Spirit) must be refreshed by Oozuchi!");
console.log('✅ Oozuchi successfully triggered on Life reduction and refreshed allied White Spirit!');

// ── TEST 5: The MakaiPriest Shugraus Void Core Harvest on Makai Summon ──
console.log('\n--- TEST 5: The MakaiPriest Shugraus Void Core Harvest ---');
const shugraus = {
  uid: 'player-shugraus',
  name: 'The MakaiPriest Shugraus',
  family: 'Makai',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 3000,
  levels: [{ level: 1, cores: 1, bp: 3000 }, { level: 2, cores: 3, bp: 5000 }],
  effect: '[LV1][LV2] When your "Makai"-named Spirits, other than this Spirit, are summoned, send one core from the Void to this Spirit.'
};

duelState.player.field = [shugraus];
const newMakaiSummon = {
  uid: 'player-renegada',
  name: 'The MakaiChanceller Renegada',
  family: 'Makai',
  currentCores: 2,
  currentLevel: 1,
  currentBp: 4000,
  effect: '[LV1] (When Summoned) Draw a card.'
};

// Summon new Makai spirit
duelState.player.field.push(newMakaiSummon);
BA.executeWhenSummonedEffects(newMakaiSummon, 'player');

assert.strictEqual(shugraus.currentCores, 2, "Shugraus must receive +1 Core from Void (1 -> 2)");
console.log('✅ Shugraus harvested +1 Core from Void when allied Makai spirit was summoned!');

// ── TEST 6: Axemoth Destruction Recovery to Hand ──
console.log('\n--- TEST 6: Axemoth Destruction Recovery to Hand ---');
const axemoth = {
  uid: 'player-axemoth',
  name: 'Axemoth',
  color: 'Green',
  cost: 0,
  currentBp: 1000,
  effect: '[LV1][LV2] When this Spirit is destroyed by an opposing effect, return it to your Hand.'
};

duelState.player.hand = [];
duelState.player.trashCards = [];

// Destroy Axemoth by opposing effect:
BA.sendToTrash(axemoth, 'player', 'Destroyed by opposing effect');
assert.strictEqual(duelState.player.hand.length, 1, "Axemoth must return to Hand instead of Trash");
assert.strictEqual(duelState.player.hand[0].name, 'Axemoth', "Returned card must be Axemoth");
assert.strictEqual(duelState.player.trashCards.length, 0, "Trash must remain empty");
console.log('✅ Axemoth successfully returned to Hand upon destruction by opposing effect!');

// ── TEST 7: Shadow Yatagarasu Depletion Return from Trash to Hand ──
console.log('\n--- TEST 7: Shadow Yatagarasu Depletion Return ---');
const yatagarasu = {
  uid: 'player-yatagarasu',
  name: 'Shadow Yatagarasu',
  color: 'Purple',
  cost: 2,
  effect: 'When an opposing Spirit is depleted, this card in your Trash can return to your Hand.'
};

duelState.player.hand = [];
duelState.player.trashCards = [yatagarasu];

const depletedEnemy = {
  uid: 'opp-depleted',
  name: 'Low Goblin',
  currentCores: 0,
  currentBp: 1000
};

// Enemy spirit is depleted and sent to opponent trash:
BA.sendToTrash(depletedEnemy, 'opponent', 'Depleted by core removal');
assert.strictEqual(duelState.player.hand.length, 1, "Shadow Yatagarasu must return from Trash to Player Hand");
assert.strictEqual(duelState.player.hand[0].name, 'Shadow Yatagarasu', "Returned card must be Shadow Yatagarasu");
assert.strictEqual(duelState.player.trashCards.length, 0, "Player Trash must now be empty");
console.log('✅ Shadow Yatagarasu successfully recovered to Hand upon opposing Spirit depletion!');

console.log('\n🎉 ALL 7 ADVANCED DECK & STARTER EFFECTS TESTS PASSED WITH 100% SUCCESS!');
