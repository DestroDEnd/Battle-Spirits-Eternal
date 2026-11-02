const assert = require('assert');
const fs = require('fs');

// Mock browser globals
global.window = global;
global.window.location = { pathname: '/battle_arena' };
global.window.FALLBACK_CARD_ART = './assets/card_back.png';
global.window.esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
global.document = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    style: {},
    innerHTML: '',
    textContent: '',
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.AudioContext = function() {};

// Load app.js and battle_arena.js
eval(fs.readFileSync('app.js', 'utf-8') + '\nglobal.formatEffectKeywordsInModal = formatEffectKeywordsInModal;');
eval(fs.readFileSync('battle_arena.js', 'utf-8'));

console.log('--- STARTING VERIFICATION FOR USER REQUEST 3 ---');

// ============================================================
// TEST 1: Database & Hell Contract Family count (4 cards)
// ============================================================
console.log('\n[Test 1] Database & Hell Contract verification');
const sqlite3 = require('child_process').execSync('py -c "import database; res=database.search_cards_db(family=\'Hell Contract\'); print(res[\'total\']); print([c[\'name\'] for c in res[\'cards\']])"').toString();
console.log('Database query output:', sqlite3.trim());
assert.ok(sqlite3.includes('4'), 'Must return total of 4 Hell Contract cards');
assert.ok(sqlite3.includes('The PartnerDemonLord Javad'), 'Must include The PartnerDemonLord Javad');
console.log('✓ Hell Contract family now has all 4 cards including The PartnerDemonLord Javad!');

// ============================================================
// TEST 2: Clickable Card Name Reference in Card Effects
// ============================================================
console.log('\n[Test 2] Clickable Card Name Reference in Modal & Inspector');
const magnazappahEffect = '[Summon Condition: You control one or more "The PartnerDemonLord Javad", including being in Soul State/pre-advent condition]';
const formattedModal = formatEffectKeywordsInModal(magnazappahEffect);
console.log('Formatted HTML:', formattedModal);
assert.ok(formattedModal.includes('class="card-ref-link"'), 'Must contain card-ref-link class');
assert.ok(formattedModal.includes("openCardDetail('The PartnerDemonLord Javad')"), 'Must call openCardDetail with referenced card name');
console.log('✓ "The PartnerDemonLord Javad" in effect is correctly rendered as a clickable link to open card modal!');

// ============================================================
// TEST 3: Twinkle Necromancy - At most ONE of each cost tier
// ============================================================
console.log('\n[Test 3] Twinkle Necromancy - One of each cost tier (No duplicate cost 0 summon)');
const DuelState = BattleArena.getState();
DuelState.player.field = [];
DuelState.player.reserve = 5;

// Player Trash has TWO Cost 0 spirits, ONE Cost 1 spirit, and ONE Cost 3 spirit
DuelState.player.trashCards = [
  { name: 'The MakaiBrave Shine Deathdoll', type: 'Spirit', cost: 0, uid: 'c0_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 },
  { name: 'The MakaiBeast Beelzeworth', type: 'Spirit', cost: 0, uid: 'c0_2', levels: 'Level 1: 1 core, 2000 BP', lv1Bp: 2000 },
  { name: 'Puppet Soldier', type: 'Spirit', cost: 1, uid: 'c1_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 },
  { name: 'The MakaiSoldier Curse Swordsman', type: 'Spirit', cost: 3, uid: 'c3_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 }
];

const siegfried = {
  name: 'The MakaiPhantomDragon Siegfried-Necro',
  type: 'Spirit',
  uid: 'sieg_1',
  currentLevel: 1,
  levels: 'Level 1: 1 core, 10000 BP',
  effect: '[LV1][LV2][LV3] [Twinkle Necromancy] (When Advents)\nYou can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost.'
};

// Test AI auto-selection path (guarantees one per cost tier):
DuelState.opponent.field = [];
DuelState.opponent.reserve = 5;
DuelState.opponent.trashCards = [
  { name: 'The MakaiBrave Shine Deathdoll', type: 'Spirit', cost: 0, uid: 'c0_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 },
  { name: 'The MakaiBeast Beelzeworth', type: 'Spirit', cost: 0, uid: 'c0_2', levels: 'Level 1: 1 core, 2000 BP', lv1Bp: 2000 },
  { name: 'Puppet Soldier', type: 'Spirit', cost: 1, uid: 'c1_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 },
  { name: 'The MakaiSoldier Curse Swordsman', type: 'Spirit', cost: 3, uid: 'c3_1', levels: 'Level 1: 1 core, 1000 BP', lv1Bp: 1000 }
];

BattleArena.executeWhenAdventsEffects(siegfried, 'opponent');

// Check that ONLY ONE Cost 0 spirit was summoned onto field
const fieldCost0 = DuelState.opponent.field.filter(s => s.cost === 0);
assert.strictEqual(fieldCost0.length, 1, 'MUST ONLY summon at most ONE Cost 0 spirit, NOT both!');

// Check that exactly 3 spirits total were summoned (one of Cost 0, one of Cost 1, one of Cost 3)
assert.strictEqual(DuelState.opponent.field.length, 3, 'Should summon exactly 3 spirits (one for cost 0, one for cost 1, one for cost 3)');
console.log('✓ Field spirits summoned by Twinkle Necromancy:', DuelState.opponent.field.map(s => `${s.name} (Cost ${s.cost})`));
console.log('✓ Successfully summoned ONE of each cost tier without duplicate summoning!');

console.log('\n========================================');
console.log('ALL VERIFICATION TESTS FOR ROUND 3 PASSED 100%!');
console.log('========================================');
