const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 RUNNING COMPREHENSIVE TEST SUITE: LORD-DRAGON & OPPONENT LIFE');

// 1. Setup DOM Mock Environment
const elements = {};

function createMockElement(id, tagName = 'div') {
  return {
    id,
    tagName,
    innerHTML: '',
    textContent: '',
    className: '',
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) {
          this._classes.add(c);
        } else {
          this._classes.delete(c);
        }
      }
    },
    style: {},
    dataset: {},
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    children: [],
    querySelectorAll(sel) { return []; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  querySelectorAll(sel) {
    return [];
  },
  createElement(tag) {
    return createMockElement('', tag);
  },
  readyState: 'complete',
  addEventListener() {}
};

global.window = {
  document: global.document,
  addEventListener() {},
  location: { pathname: '/arena' },
  AudioContext: function() {
    return {
      createOscillator: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {} },
        type: 'sine'
      }),
      createGain: () => ({
        connect: () => {},
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
      }),
      destination: {},
      currentTime: 0
    };
  }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Load battle_arena.js into mock context
const arenaCode = fs.readFileSync(path.join(__dirname, '..', 'battle_arena.js'), 'utf-8');
eval(arenaCode);

const BA = window.BattleArena;
assert(BA, "window.BattleArena must be exported");

console.log('✅ battle_arena.js successfully evaluated!');

// ── TEST 1: OPPONENT LIFE DISPLAY IN DOM ──
console.log('\n--- TEST 1: Opponent Life Display in DOM ---');
BA.init();
const duelState = BA.getState();
duelState.inDuel = true;
duelState.opponent.life = 5;
duelState.player.life = 5;

// Render duel table
BA.renderDuelTable();

const oppLifeEl = document.getElementById('opponentLifeContainer');
assert(oppLifeEl, "#opponentLifeContainer must exist");
assert(oppLifeEl.innerHTML.length > 0, "#opponentLifeContainer innerHTML must not be empty!");
const oppActiveMatches = (oppLifeEl.innerHTML.match(/gem-active/g) || []).length;
assert.strictEqual(oppActiveMatches, 5, `Opponent must have 5 active life gems rendered, got ${oppActiveMatches}`);
console.log(`✅ Opponent Life Gems rendered with 5 active hex cores in #opponentLifeContainer!`);

// Reduce opponent life to 3
duelState.opponent.life = 3;
BA.renderDuelTable();
const oppActive3 = (oppLifeEl.innerHTML.match(/gem-active/g) || []).length;
const oppEmpty2 = (oppLifeEl.innerHTML.match(/gem-empty/g) || []).length;
assert.strictEqual(oppActive3, 3, `Opponent must have 3 active life gems, got ${oppActive3}`);
assert.strictEqual(oppEmpty2, 2, `Opponent must have 2 shattered/empty life gems, got ${oppEmpty2}`);
console.log(`✅ Dynamic opponent life correctly renders 3 active + 2 shattered cores on damage!`);

// ── TEST 2: KEYWORD FORMATTING FOR (When Battles) & (After Your Burst Activates) ──
console.log('\n--- TEST 2: Keyword Emboldening / Formatting ---');
const sampleEffect = `[Burst: After your Life is reduced]
Summon this Spirit card.

[LV1][LV2][LV3] (After Your Burst Activates)
If the card activated was Cost 5 or less, destroy an opposing 9000 BP or less Spirit.

[LV2][LV3] (When Battles)
At the end of battle, by discarding one of your Bursts, refresh this Spirit.`;

const formatted = BA.formatEffectKeywords(sampleEffect);
assert(formatted.includes('kw-timing'), "Must include kw-timing pills");
assert(formatted.includes('(After Your Burst Activates)'), "Must preserve (After Your Burst Activates)");
assert(formatted.includes('(When Battles)'), "Must preserve (When Battles)");
assert(formatted.includes('kw-level'), "Must highlight level pills");
assert(formatted.includes('kw-burst'), "Must highlight burst keyword");
console.log('✅ Card effect keywords properly formatted and highlighted with badge pills!');

// ── TEST 3: THE HERODRAGON LORD-DRAGON "(After Your Burst Activates)" ──
console.log('\n--- TEST 3: Lord-Dragon (After Your Burst Activates) Destruction ---');
const lordDragon = {
  uid: 'player-lord-dragon-1',
  name: 'The HeroDragon Lord-Dragon',
  card_number: 'SD06-007',
  color: 'Red',
  cost: 6,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 1,
  currentBp: 4000,
  levels: [
    { level: 1, cores: 1, bp: 4000 },
    { level: 2, cores: 3, bp: 6000 },
    { level: 3, cores: 5, bp: 9000 }
  ],
  effect: sampleEffect
};

const weakEnemySpirit = {
  uid: 'opp-demon-1',
  name: 'Demon Dragon of the Dark Abyss',
  color: 'Purple',
  cost: 5,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 2,
  currentBp: 7000, // <= 9000 BP!
  levels: [{ level: 1, cores: 2, bp: 7000 }],
  effect: 'Standard spirit'
};

const bossEnemySpirit = {
  uid: 'opp-boss-1',
  name: 'Colosseum Colossus',
  color: 'White',
  cost: 8,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 3,
  currentBp: 14000, // > 9000 BP!
  levels: [{ level: 1, cores: 3, bp: 14000 }],
  effect: 'Standard spirit'
};

duelState.player.field = [lordDragon];
duelState.opponent.field = [weakEnemySpirit, bossEnemySpirit];
duelState.opponent.reserve = 5;

// Activate a Cost 4 Burst Magic
const cost4BurstMagic = {
  uid: 'burst-magic-1',
  name: 'Flame Tempest',
  color: 'Red',
  cost: 4, // <= Cost 5!
  type: 'Magic',
  effect: '[Burst: After your Life is reduced] Draw 1 card.'
};

duelState.player.burst = cost4BurstMagic;
BA.activateBurst('player', true);

// Verify: weakEnemySpirit (7000 BP <= 9000 BP) was destroyed by Lord-Dragon's (After Your Burst Activates)!
const remainingOppSpirits = duelState.opponent.field.map(s => s.name);
assert(!remainingOppSpirits.includes('Demon Dragon of the Dark Abyss'), "Weak enemy spirit <= 9000 BP must have been destroyed!");
assert(remainingOppSpirits.includes('Colosseum Colossus'), "Boss spirit > 9000 BP must survive!");
console.log('✅ Lord-Dragon destroyed opposing 7000 BP spirit upon Cost 4 Burst activation!');

// ── TEST 4: LORD-DRAGON "(When Battles)" BURST DISCARD & REFRESH ──
console.log('\n--- TEST 4: Lord-Dragon (When Battles) Burst Discard & Refresh ---');
// Put Lord-Dragon to LV2 (3 cores, 6000 BP)
lordDragon.currentLevel = 2;
lordDragon.currentCores = 3;
lordDragon.currentBp = 6000;
lordDragon.isExhausted = true;
lordDragon.hasAttacked = true;

// Player has a burst card in hand
const handBurstCard = {
  uid: 'burst-in-hand-1',
  name: 'Burst Shield',
  color: 'White',
  cost: 4,
  type: 'Magic',
  effect: '[Burst: After your Spirit is destroyed] Refresh 1 spirit.'
};
duelState.player.hand = [handBurstCard];
duelState.player.burst = null;

// Call checkEndOfBattleEffects with autoPlay false
BA.checkEndOfBattleEffects([lordDragon], 'player', 'opponent', () => {});

// The modal should now be open with the burst option!
const modal = document.getElementById('battleBurstDiscardModal');
assert(modal.classList.contains('active'), "Burst Discard modal must open for player!");

const optsEl = document.getElementById('burstDiscardOptions');
assert(optsEl.innerHTML.includes('Hand Burst: Burst Shield'), "Modal must present Hand Burst choice!");

// Confirm discard choice (index 0)
BA.confirmBurstDiscard(0);

// Assert Lord-Dragon refreshed and hand burst sent to trash!
assert.strictEqual(lordDragon.isExhausted, false, "Lord-Dragon must be refreshed (isExhausted === false)!");
assert.strictEqual(lordDragon.hasAttacked, false, "Lord-Dragon attack flag reset!");
assert.strictEqual(duelState.player.hand.length, 0, "Hand burst was consumed from hand!");
assert(duelState.player.trashCards.some(c => c.name === 'Burst Shield'), "Burst Shield sent to Trash!");
console.log('✅ Discarding Burst card from hand successfully refreshed Lord-Dragon at end of battle!');

// ── TEST 5: DISCARD FROM SET BURST ZONE ──
console.log('\n--- TEST 5: Discard from Set Burst Zone ---');
lordDragon.isExhausted = true;
lordDragon.hasAttacked = true;

const setBurstCard = {
  uid: 'set-burst-2',
  name: 'Dragonic Burst',
  color: 'Red',
  cost: 5,
  type: 'Spirit',
  effect: '[Burst: After your Life is reduced] Summon this card.'
};
duelState.player.burst = setBurstCard;
duelState.player.hand = [];

BA.checkEndOfBattleEffects([lordDragon], 'player', 'opponent', () => {});
assert(modal.classList.contains('active'), "Modal must open for set burst!");
assert(document.getElementById('burstDiscardOptions').innerHTML.includes('Set Burst: Dragonic Burst'), "Modal presents Set Burst choice!");

BA.confirmBurstDiscard(0);
assert.strictEqual(lordDragon.isExhausted, false, "Lord-Dragon must be refreshed!");
assert.strictEqual(duelState.player.burst, null, "Set burst zone was consumed!");
assert(duelState.player.trashCards.some(c => c.name === 'Dragonic Burst'), "Set burst sent to Trash!");
console.log('✅ Discarding set Burst card successfully refreshed Lord-Dragon at end of battle!');

// ── TEST 6: OPPONENT AI LORD-DRAGON REFRESH ──
console.log('\n--- TEST 6: Opponent AI Lord-Dragon Refresh ---');
const aiLordDragon = {
  uid: 'ai-lord-dragon-1',
  name: 'The HeroDragon Lord-Dragon',
  card_number: 'SD06-007',
  color: 'Red',
  cost: 6,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 3,
  currentBp: 6000,
  isExhausted: true,
  hasAttacked: true,
  levels: [
    { level: 1, cores: 1, bp: 4000 },
    { level: 2, cores: 3, bp: 6000 }
  ],
  effect: sampleEffect
};

duelState.opponent.field = [aiLordDragon];
duelState.opponent.burst = {
  uid: 'ai-burst-1',
  name: 'AI Burst Trap',
  color: 'Red',
  cost: 4,
  type: 'Magic',
  effect: '[Burst: After your Life is reduced]'
};

BA.checkEndOfBattleEffects([aiLordDragon], 'opponent', 'player', () => {});
assert.strictEqual(aiLordDragon.isExhausted, false, "AI Lord-Dragon automatically refreshed!");
assert.strictEqual(duelState.opponent.burst, null, "AI burst was discarded to Trash!");
console.log('✅ Opponent AI automatically resolved Burst discard and refreshed Lord-Dragon!');

console.log('\n🎉 ALL TESTS IN SUITE PASSED WITH 100% SUCCESS!');
