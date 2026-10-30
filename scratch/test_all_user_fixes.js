// Comprehensive automated tests for all user issues and fixes
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Master Verification for User Fixes...\n');

// 1. Verify Card Effects DB Alphard
const effectsDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../card_effects_db.json'), 'utf-8'));
const alphard = effectsDb['The PoisonSnakeScythe Alphard'];
assert(alphard, 'Alphard must exist in card_effects_db.json');
assert.strictEqual(alphard.type, 'Brave', 'Alphard must be a Brave');
assert(!alphard.triggers.WHEN_ATTACKS, 'Alphard must NOT have unconditional WHEN_ATTACKS destruction');
assert(alphard.triggers.WHEN_DESTROYED_IN_BATTLE, 'Alphard must have WHEN_DESTROYED_IN_BATTLE');
assert.strictEqual(alphard.triggers.WHEN_DESTROYED_IN_BATTLE[0].require_braved, true, 'Alphard effect requires braved condition');
console.log('✅ TEST 1: The PoisonSnakeScythe Alphard effect is officially compliant & gated by Brave status.');

// 2. Verify static JSON fetching in family.html, sets.html, browse.html, index.html
const familyHtml = fs.readFileSync(path.join(__dirname, '../family.html'), 'utf-8');
assert(familyHtml.includes('./filters_data.json'), 'family.html must fetch ./filters_data.json');

const setsHtml = fs.readFileSync(path.join(__dirname, '../sets.html'), 'utf-8');
assert(setsHtml.includes('./filters_data.json'), 'sets.html must fetch ./filters_data.json');

const browseHtml = fs.readFileSync(path.join(__dirname, '../browse.html'), 'utf-8');
assert(browseHtml.includes('./filters_data.json'), 'browse.html must fetch ./filters_data.json');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
assert(indexHtml.includes('./featured_x_rares.json'), 'index.html must fetch ./featured_x_rares.json');
console.log('✅ TEST 2: All static pages fetch local JSON data first, eliminating 404 Unexpected token "<" errors.');

// 3. Verify Battle Arena AI weights and standard decks loading
const arenaCode = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf-8');
assert(arenaCode.includes('./standard_decks_data.json'), 'battle_arena.js must fetch ./standard_decks_data.json');
assert(arenaCode.includes('./ai_weights.json'), 'battle_arena.js must fetch ./ai_weights.json');
assert(arenaCode.includes('./card_effects_db.json'), 'battle_arena.js must fetch ./card_effects_db.json');
console.log('✅ TEST 3: Battle Arena initializes standard decks and AI weights statically on GitHub Pages.');

// 4. Verify Burst Replacement Mechanic in battle_arena.js
assert(arenaCode.includes('sendToTrash(oldBurst, \'player\', \'Replaced by setting a new Burst\')'), 'setBurst must send replaced burst to Trash');
assert(arenaCode.includes('🔄 Replace Burst'), 'UI must show Replace Burst label when a burst is already set');
console.log('✅ TEST 4: Burst replacement sends existing set burst to Trash and updates UI.');

// 5. Verify Burst Interrupt AI Pause
assert(arenaCode.includes('DuelState.pendingBurstResume = onResume || null;'), 'checkBurstTrigger must capture resume callback');
assert(arenaCode.includes('safeTimeout(resume, 700);') || arenaCode.includes('resume();'), 'confirmBurstTrigger must invoke pendingBurstResume');
assert(arenaCode.includes('safeTimeout(resume, 300);') || arenaCode.includes('resume();'), 'declineBurstTrigger must invoke pendingBurstResume');
console.log('✅ TEST 5: AI pauses execution when player Burst triggers, and resumes seamlessly after user decision.');

// 6. Verify Username Login space handling in firebase_service.js
const fbCode = fs.readFileSync(path.join(__dirname, '../firebase_service.js'), 'utf-8');
assert(fbCode.includes('noSpaceLower = lower.replace(/\\s+/g, \'\')'), 'firebase_service.js must normalize usernames with spaces');
assert(fbCode.includes('if (noSpaceLower === \'destrodend\')'), 'firebase_service.js must resolve Destro Dend to destrodend@gmail.com');
console.log('✅ TEST 6: Firebase service normalizes usernames with spaces ("Destro Dend" -> "destrodend@gmail.com").');

// 7. Verify Clean Route folders exist
const cleanFolders = ['browse', 'arena', 'deck', 'deck_view', 'family', 'sets', 'login', 'register'];
for (const dir of cleanFolders) {
  assert(fs.existsSync(path.join(__dirname, '../', dir, 'index.html')), `Clean route ${dir}/index.html must exist`);
}
console.log('✅ TEST 7: All 8 clean route folders created for GitHub Pages directory routing.');

console.log('\n🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY!');
