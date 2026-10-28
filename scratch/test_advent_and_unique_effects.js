const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Battle Spirits Advent, Summon & Block Effects Test Suite...\n');

// 1. Mock Browser Environment
const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    offsetWidth: 100,
    offsetHeight: 100,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  createElement: (tag) => createMockElement('', tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: createMockElement('body'),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDoc,
  location: { reload: () => {} },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  BattleArena: {},
  esc: (s) => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
};

const toastLog = [];
const mockToast = (msg, type) => {
  toastLog.push({ msg, type });
};

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  console: console,
  setTimeout: mockWindow.setTimeout,
  clearTimeout: mockWindow.clearTimeout,
  showToast: mockToast,
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Date: Date,
  String: String,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  JSON: JSON,
  AudioContext: class {
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
  }
});

// Load battle_arena.js
const code = fs.readFileSync('battle_arena.js', 'utf-8');
vm.runInContext(code, context);

const BA = mockWindow.BattleArena;
assert(BA, 'window.BattleArena failed to initialize');

// --- Test 1: Advent Requirement Parser ---
console.log('--- Test 1: Advent Requirement Parser ---');
const siegfried = {
  name: 'The MakaiPhantomDragon Siegfried-Necro',
  cost: 9,
  color: 'Purple',
  family: 'Ancient Dragon',
  levels: 'Level 1: 1 core, 10000 BP\nLevel 2: 2 cores, 13000 BP\nLevel 3: 4 cores, 17000 BP',
  effect: 'Flash - [Advent: Cost 6 or more] ((Either Attack Step))\nBy sending your [Soul Core] to the Trash, stack this from your Hand onto your target Spirit.\n\n[LV1][LV2][LV3] [Twinkle Necromancy] (When Advents)\nYou can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost.\n\n[LV2][LV3] (Your Attack Step)\nWhen your "Ancient Dragon"/"Astral Dragon"/"Ogre Wizard" family Spirit attacks, the opponent can\'t block unless they destroy one of their Spirits.'
};

const req1 = BA.getCardAdventRequirement(siegfried);
assert(req1, 'Failed to parse Siegfried-Necro Advent requirement');
assert.strictEqual(req1.minCost, 6, 'Min cost should be 6');
console.log('  ✅ Siegfried-Necro Advent parsed: Min Cost 6+');

const complexAdvent = {
  name: 'Supreme Dragon',
  effect: '[Advent: Purple & Ancient Dragon & Cost 5 or more]'
};
const req2 = BA.getCardAdventRequirement(complexAdvent);
assert(req2, 'Failed to parse complex Advent requirement');
assert.strictEqual(req2.minCost, 5);
assert(req2.colors.includes('purple'), 'Should require Purple color');
assert(req2.families.some(f => f.toLowerCase().includes('ancient dragon')), 'Should require Ancient Dragon family');
console.log('  ✅ Complex Advent parsed: Purple & Ancient Dragon & Cost 5+');

// --- Test 2: Target Eligibility Filtering ---
console.log('\n--- Test 2: Target Eligibility Filtering ---');
const testField = [
  { uid: 's1', name: 'Dark Snake Minion', cost: 3, color: 'Purple', family: 'Dark Snake' },
  { uid: 's2', name: 'Gorgon Knight', cost: 6, color: 'Purple', family: 'Dark Snake' },
  { uid: 's3', name: 'White Knight', cost: 7, color: 'White', family: 'Armed Machine' }
];

const eligibleForSiegfried = BA.getEligibleAdventTargets(req1, testField);
assert.strictEqual(eligibleForSiegfried.length, 2, 'Should find 2 spirits with cost >= 6 (s2 and s3)');
assert(eligibleForSiegfried.some(s => s.uid === 's2'));
assert(eligibleForSiegfried.some(s => s.uid === 's3'));
console.log('  ✅ Eligible targets for Siegfried-Necro correctly identified (2 spirits with Cost >= 6)');

// --- Test 3: Execute Advent & Twinkle Necromancy ---
console.log('\n--- Test 3: Execute Advent & Twinkle Necromancy Reanimation ---');
const duelState = mockWindow.DuelState;
duelState.inDuel = true;
duelState.turn = 2;
duelState.activePlayer = 'player';
duelState.phaseIndex = 3; // ATTACK
duelState.player.field = [
  {
    uid: 'target_spirit_1',
    name: 'Gorgon Knight',
    cost: 6,
    color: 'Purple',
    family: 'Dark Snake',
    currentCores: 3,
    hasSoulCore: true,
    levels: 'Level 1: 1 core, 4000 BP\nLevel 2: 3 cores, 6000 BP',
    currentLevel: 2,
    currentBp: 6000,
    isExhausted: false
  }
];
duelState.player.soulCoreLocation = 'field';
duelState.player.hand = [{ ...siegfried, uid: 'siegfried_hand' }];
const trashList = [
  { uid: 'trash_0', name: 'Bone Skeleton', cost: 0, type: 'Spirit', levels: 'Level 1: 1 core, 1000 BP' },
  { uid: 'trash_1', name: 'Purple Pupa', cost: 1, type: 'Spirit', levels: 'Level 1: 1 core, 2000 BP' },
  { uid: 'trash_3', name: 'Skeleton Warrior', cost: 3, type: 'Spirit', levels: 'Level 1: 1 core, 3000 BP' },
  { uid: 'trash_6', name: 'Dark General', cost: 6, type: 'Spirit', levels: 'Level 1: 1 core, 6000 BP' },
  { uid: 'trash_9', name: 'Abyss Dragon', cost: 9, type: 'Spirit', levels: 'Level 1: 1 core, 9000 BP' }
];
duelState.player.trash = trashList;
duelState.player.trashCards = trashList;
duelState.player.reserve = 5;

const targetSpirit = duelState.player.field[0];
BA.executeAdvent(duelState.player.hand[0], targetSpirit, 'player');

// Assert Soul Core is in Trash
assert.strictEqual(duelState.player.soulCoreLocation, 'trash', 'Soul Core must be sent to Trash as Advent cost');
console.log('  ✅ Soul Core successfully sent to Trash');

// Assert targetSpirit became Siegfried-Necro
assert.strictEqual(targetSpirit.name, 'The MakaiPhantomDragon Siegfried-Necro');
assert.strictEqual(targetSpirit.cost, 9);
assert(targetSpirit.underlyingCards && targetSpirit.underlyingCards.length === 1);
assert.strictEqual(targetSpirit.underlyingCards[0].name, 'Gorgon Knight');
console.log('  ✅ Siegfried-Necro successfully stacked on Gorgon Knight (previous card preserved)');

// Assert Twinkle Necromancy reanimated spirits from Trash (Cost 0, 1, 3, 6, 9)
assert.strictEqual(duelState.player.field.length, 6, 'Field should now have Siegfried-Necro + 5 reanimated spirits!');
console.log(`  ✅ Twinkle Necromancy reanimated 5 spirits from Trash (Total field spirits: ${duelState.player.field.length})`);

// --- Test 4: The MakaiKnight Pandegaiz When Summoned Opponent Sacrificial Destruction ---
console.log('\n--- Test 4: Pandegaiz When Summoned Opponent Sacrificial Destruction ---');
duelState.opponent.field = [
  { uid: 'opp_low', name: 'Low Goblin', currentBp: 2000, currentCores: 2, cost: 2, levels: 'Level 1: 1 core, 2000 BP' },
  { uid: 'opp_high', name: 'High Behemoth', currentBp: 8000, currentCores: 4, cost: 7, levels: 'Level 1: 1 core, 8000 BP' }
];
duelState.opponent.reserve = 0;
duelState.opponent.trash = [];

const pandegaiz = {
  uid: 'pandegaiz_1',
  name: 'The MakaiKnight Pandegaiz',
  cost: 7,
  color: 'Purple',
  levels: 'Level 1: 1 core, 5000 BP\nLevel 2: 3 cores, 7000 BP\nLevel 3: 5 cores, 11000 BP',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 5000,
  effect: '[LV1][LV2][LV3] (When Summoned)\nThe opponent destroys a Spirit/Ultimate they control.\n[LV2][LV3] (When Attacks)\nYou can summon an "Evil Deity" family Spirit card from your Trash by paying four costs. When you\'ve done so, this Spirit can\'t be blocked.'
};

BA.executeWhenSummonedEffects(pandegaiz, 'player');

assert.strictEqual(duelState.opponent.field.length, 1, 'Opponent should have 1 spirit remaining after sacrificing 1');
assert.strictEqual(duelState.opponent.field[0].name, 'High Behemoth', 'Opponent should retain the stronger spirit');
const oppTrash = duelState.opponent.trashCards || duelState.opponent.trash;
assert.strictEqual(oppTrash.length, 1, 'Sacrificed spirit must be in Opponent Trash');
assert.strictEqual(oppTrash[0].name, 'Low Goblin');
assert.strictEqual(duelState.opponent.reserve, 2, 'Cores on sacrificed spirit must return to opponent reserve');
console.log('  ✅ Opponent successfully forced to sacrifice Low Goblin; cores returned to reserve');

// --- Test 5: The MakaiSwordDeityDoll †Enchante† Core Removal & Depletion ---
console.log('\n--- Test 5: Enchante Core Removal & Depletion ---');
duelState.opponent.field = [
  { uid: 'opp_target', name: 'Target Spirit', currentBp: 4000, currentCores: 2, cost: 3, levels: 'Level 1: 1 core, 4000 BP' }
];
duelState.opponent.reserve = 0;
duelState.opponent.trash = [];
duelState.opponent.trashCards = [];
duelState.player.deck = [{ name: 'Bonus Card 1' }, { name: 'Bonus Card 2' }];
duelState.player.hand = [];

const enchante = {
  uid: 'enchante_1',
  name: 'The MakaiSwordDeityDoll †Enchante†',
  cost: 7,
  color: 'Purple',
  levels: 'Level 1: 1 core, 6000 BP',
  currentCores: 1,
  currentLevel: 1,
  currentBp: 6000,
  effect: '[LV1][LV2][LV3] (When Summoned/Attacks)\nYou can send up to two cores from one opposing Spirit/Ultimate to the Reserve. When this effect depletes, draw two cards.'
};

console.log('Before Enchante - opponent field:', duelState.opponent.field.length);
BA.executeWhenSummonedEffects(enchante, 'player');
console.log('After Enchante - opponent field:', duelState.opponent.field.length);
console.log('After Enchante - target cores:', duelState.opponent.field[0]?.currentCores);

assert.strictEqual(duelState.opponent.field.length, 0, 'Target spirit should be depleted and removed from field');
const oppTrash5 = duelState.opponent.trashCards || duelState.opponent.trash;
assert.strictEqual(oppTrash5.length, 1, 'Depleted spirit must be sent to Trash');
assert.strictEqual(duelState.opponent.reserve, 2, 'Removed cores sent to opponent reserve');
assert.strictEqual(duelState.player.hand.length, 2, 'Player should draw 2 cards from depletion bonus');
console.log('  ✅ Enchante removed 2 cores, depleted opposing spirit, and drew 2 cards on depletion!');

// --- Test 6: Siegfried-Necro Block Sacrifice Restriction ---
console.log('\n--- Test 6: Siegfried-Necro Block Sacrifice Restriction ---');
// Attacker: Siegfried-Necro (Ancient Dragon, LV2)
const attackerSiegfried = {
  uid: 'siegfried_att',
  name: 'The MakaiPhantomDragon Siegfried-Necro',
  cost: 9,
  family: 'Ancient Dragon',
  currentLevel: 2,
  currentBp: 13000,
  levels: 'Level 1: 1 core, 10000 BP\nLevel 2: 2 cores, 13000 BP\nLevel 3: 4 cores, 17000 BP',
  effect: '[LV2][LV3] (Your Attack Step)\nWhen your "Ancient Dragon"/"Astral Dragon"/"Ogre Wizard" family Spirit attacks, the opponent can\'t block unless they destroy one of their Spirits.'
};

duelState.player.field = [attackerSiegfried];

// Case A: Opponent only controls 1 spirit -> CANNOT block!
duelState.opponent.field = [
  { uid: 'opp_single', name: 'Lone Defender', currentBp: 15000, cost: 5, isExhausted: false, levels: 'Level 1: 1 core, 15000 BP' }
];
duelState.opponent.life = 5;

BA.executePlayerAttack(attackerSiegfried);
assert.strictEqual(duelState.opponent.life, 4, 'Life damage must pierce through because Lone Defender cannot sacrifice another spirit to block!');
console.log('  ✅ Opponent with only 1 spirit was unable to block due to Siegfried-Necro sacrifice restriction');

// Case B: Opponent controls 2 spirits -> Must sacrifice one to block with the other!
duelState.opponent.field = [
  { uid: 'opp_blocker', name: 'Giant Golem', currentBp: 18000, cost: 6, isExhausted: false, currentCores: 2, levels: 'Level 1: 1 core, 18000 BP' },
  { uid: 'opp_sacrifice', name: 'Fodder Bat', currentBp: 1000, cost: 1, isExhausted: false, currentCores: 1, levels: 'Level 1: 1 core, 1000 BP' }
];
duelState.opponent.life = 4;
attackerSiegfried.isExhausted = false;
attackerSiegfried.hasAttacked = false;

BA.executePlayerAttack(attackerSiegfried);
assert((duelState.opponent.trashCards || duelState.opponent.trash).some(c => c.name === 'Fodder Bat'), 'Fodder Bat must be sacrificed and sent to Trash');
console.log('  ✅ Opponent was forced to destroy Fodder Bat as sacrifice in order to declare block with Giant Golem!');

// --- Test 7: Unblockable Attack (Pandegaiz) ---
console.log('\n--- Test 7: Unblockable Attack ---');
const unblockableSpirit = {
  uid: 'pandegaiz_att',
  name: 'The MakaiKnight Pandegaiz',
  currentBp: 7000,
  cantBeBlocked: true,
  effect: 'this Spirit can\'t be blocked.'
};
duelState.player.field = [unblockableSpirit];
duelState.opponent.field = [
  { uid: 'opp_ready', name: 'Fortress Wall', currentBp: 20000, cost: 8, isExhausted: false }
];
duelState.opponent.life = 4;

BA.executePlayerAttack(unblockableSpirit);
assert.strictEqual(duelState.opponent.life, 3, 'Unblockable attack must pierce directly to Life damage despite Fortress Wall');
console.log('  ✅ Unblockable attack pierced directly to Life damage!');

// --- Test 8: Comprehensive Keyword Formatter ---
console.log('\n--- Test 8: Comprehensive Keyword Formatter ---');
const testEffectText = 'Flash - [Advent: Cost 6 or more] ((Either Attack Step))\n[LV1][LV2][LV3] [Twinkle Necromancy] (When Advents)\n[LV2][LV3] [Burst: After an opposing Spirit attacks]\n[Clash] [Curse] [Crush] [Holy Life] [Windstorm: 2] [Assault: 1] [High Speed] [Awaken] [Soul Core] [Soul Drive]';

const formatted = BA.formatEffectKeywords(testEffectText);
assert(formatted.includes('kw-advent'), 'Must include kw-advent for [Advent] and [Twinkle]');
assert(formatted.includes('kw-timing'), 'Must include kw-timing for (When Advents) and Step triggers');
assert(formatted.includes('kw-level'), 'Must include kw-level for [LV1][LV2]');
assert(formatted.includes('kw-clash'), 'Must include kw-clash');
assert(formatted.includes('kw-curse'), 'Must include kw-curse');
assert(formatted.includes('kw-crush'), 'Must include kw-crush');
assert(formatted.includes('kw-holylife'), 'Must include kw-holylife');
assert(formatted.includes('kw-windstorm'), 'Must include kw-windstorm');
assert(formatted.includes('kw-assault'), 'Must include kw-assault');
assert(formatted.includes('kw-soul-core'), 'Must include kw-soul-core');
assert(formatted.includes('kw-souldrive'), 'Must include kw-souldrive');
console.log('  ✅ Keyword formatter cleanly highlighted Advent, Timings, Levels, and Wiki Keywords into styled pills!');

console.log('\n🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS! Advent, Sacrificial Destruction, Depletion, Block Restriction, and Keywords are fully validated!');
