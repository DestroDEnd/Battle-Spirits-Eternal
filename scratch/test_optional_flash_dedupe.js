const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Optional-effect popup / duplicate draw / flash window tests\n');

// ---- DB checks ----
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../card_effects_db.json'), 'utf-8'));
const ange = db['Angedoll'];
const anyBlocked = Object.values(ange.triggers).flat().filter(a => a.type === 'CANNOT_BE_BLOCKED');
assert(anyBlocked.length && anyBlocked.every(a => !a.canva_rules.is_optional), "\"cannot be blocked\" must NOT be optional");
const dt = db['The MakaiKnight Destroythem'].triggers.WHEN_SUMMONED.find(a => a.type === 'DRAW_CARDS');
assert(dt.canva_rules.is_optional === true, 'Destroythem "you can draw" must be optional');
console.log('✅ DB: "can" => optional, "cannot/can\'t" => mandatory restriction.');

// ---- engine mocks ----
global.DuelState = {
  player: { life: 5, reserve: 4, field: [], hand: [], deck: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }], trash: 0, trashPile: [] },
  opponent: { life: 5, reserve: 4, field: [], hand: [], deck: [{ name: 'X' }, { name: 'Y' }], trash: 0, trashPile: [] }
};
global.AudioFX = new Proxy({}, { get: () => () => {} });
global.addLog = () => {};
global.sendToTrash = () => {};
global.recycleSpiritCoresToReserve = () => {};
global.recalculateSpiritBp = () => {};
global.CardEffectsDB = {
  'Drawer': { triggers: { WHEN_SUMMONED: [{ type: 'DRAW_CARDS', count: 2, raw_text: 'You can draw two cards', canva_rules: { is_optional: true } }] } }
};

const code = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf-8');
const s = code.indexOf('function isOptionalEffectText');
const e = code.indexOf('async function initBattleArena');
eval(code.substring(s, e));

const mk = () => ({ name: 'Drawer', currentLevel: 1 });

// 1. Headless (no document): runs once, draws exactly 2
DuelState.player.hand = [];
executeUniversalCardEffect(mk(), 'player', 'WHEN_SUMMONED');
assert.strictEqual(DuelState.player.hand.length, 2, 'draws exactly 2');
console.log('✅ Draw effect resolves exactly once (2 cards).');

// 2. Legacy already drew -> universal must skip (no double draw)
DuelState.player.hand = [];
DuelState.player.deck = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
const c2 = mk();
c2.__legacyHandled = { types: new Set(['DRAW_CARDS']), ts: Date.now() };
executeUniversalCardEffect(c2, 'player', 'WHEN_SUMMONED');
assert.strictEqual(DuelState.player.hand.length, 0, 'universal must skip draw already handled by legacy engine');
console.log('✅ No duplicate draw when legacy engine already resolved it.');

// 3. markLegacyHandled
const c3 = mk();
markLegacyHandled(c3, 'you can draw two cards.');
assert(c3.__legacyHandled.types.has('DRAW_CARDS'));
console.log('✅ markLegacyHandled flags draw effects.');

// 4. Popup: Yes / No
function makeDom() {
  const buttons = {};
  const box = {
    style: {}, className: '', parentNode: null,
    set innerHTML(v) { this._h = v; },
    querySelector(sel) { const k = sel.includes('yes') ? 'yes' : 'no'; return buttons[k] || (buttons[k] = {}); }
  };
  global.document = {
    body: { appendChild(el) { el.parentNode = { removeChild() {} }; global.__popup = { el, buttons }; } },
    createElement() { return box; }
  };
  return buttons;
}
makeDom();
DuelState.player.hand = [];
DuelState.player.deck = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
executeUniversalCardEffect(mk(), 'player', 'WHEN_SUMMONED');
assert.strictEqual(DuelState.player.hand.length, 0, 'nothing happens before the player answers');
assert(global.__popup && global.__popup.el._h.includes('Activate this effect?'), 'popup shown');
global.__popup.buttons.yes.onclick();
assert.strictEqual(DuelState.player.hand.length, 2, 'Yes -> effect resolves');
console.log('✅ Popup asks first; "Yes" resolves the effect.');

makeDom();
DuelState.player.hand = [];
DuelState.player.deck = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
executeUniversalCardEffect(mk(), 'player', 'WHEN_SUMMONED');
global.__popup.buttons.no.onclick();
assert.strictEqual(DuelState.player.hand.length, 0, 'No -> effect skipped');
console.log('✅ "No" skips the effect.');

// 5. AI (opponent) never gets a popup
global.__popup = null;
makeDom();
DuelState.opponent.hand = [];
DuelState.opponent.deck = [{ name: 'X' }, { name: 'Y' }, { name: 'Z' }];
executeUniversalCardEffect(mk(), 'opponent', 'WHEN_SUMMONED');
assert.strictEqual(global.__popup, null, 'AI must not see a popup');
assert.strictEqual(DuelState.opponent.hand.length, 2);
console.log('✅ AI resolves optional effects automatically (no popup).');

// 6. Flash window wired into AI attack
assert(/playerHasFlashOptions\(\)\)\s*\{\s*showBlockPrompt\(attacker, playerBlockers\)/.test(code), 'AI attack must open Flash window');
console.log('✅ Opponent attacks now open the Flash window even with no blockers.');

console.log('\n🎉 ALL TESTS PASSED');
