const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 RUNNING TEST SUITE: CHAKRAMBAT BP REVERSION & ALL DECK CARDS VALIDATION');

// Mock DOM
const elements = {};
function createMockElement(id, tagName = 'div') {
  return {
    id, tagName, innerHTML: '', textContent: '', className: '',
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) { this._classes.add(c); }
        else { this._classes.delete(c); }
      }
    },
    style: {}, dataset: {}, setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k]; },
    children: [], querySelectorAll(sel) { return []; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  },
  querySelectorAll() { return []; },
  createElement(tag) { return createMockElement('', tag); },
  readyState: 'complete',
  addEventListener() {}
};

global.window = {
  document: global.document,
  addEventListener() {},
  location: { pathname: '/arena' },
  AudioContext: function() {
    return {
      createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} }, type: 'sine' }),
      createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
      destination: {}, currentTime: 0
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

// ── TEST 1: CHAKRAMBAT (BS01-010) BP BOOST & POST-BATTLE REVERSION ──
console.log('\n--- TEST 1: Chakrambat BP Boost During Attack & Reversion ---');
const chakrambat = {
  uid: 'player-chakrambat-1',
  name: 'Chakrambat',
  card_number: 'BS01-010',
  color: 'Red',
  cost: 3,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 1,
  currentBp: 1000,
  levels: [
    { level: 1, cores: 1, bp: 1000 },
    { level: 2, cores: 2, bp: 2000 }
  ],
  effect: `[LV1][LV2] (When Attacks)\nThis Spirit gains +4000 BP.`
};

duelState.player.field = [chakrambat];
duelState.opponent.field = [];
duelState.opponent.life = 5;
duelState.opponent.reserve = 5;

// Recalculate initially
BA.recalculateSpiritBp(chakrambat);
assert.strictEqual(chakrambat.currentBp, 1000, "Chakrambat base BP at Lv1 must be 1000 BP");
assert.strictEqual(chakrambat.battleBp, undefined, "Chakrambat battleBp must be undefined before attack");
console.log(`Initial Chakrambat BP: ${chakrambat.currentBp} BP (Normal)`);

// Declare Attack!
BA.executePlayerAttack(chakrambat);

// Assert: During battle, battleBp is 5000 BP (1000 + 4000)
assert.strictEqual(chakrambat.battleBp, 5000, `Chakrambat fighting BP during attack must be 5000 BP, got ${chakrambat.battleBp}`);
assert.strictEqual(chakrambat.battleBpBoost, 4000, `Chakrambat battleBpBoost must be 4000`);
console.log(`Attacking Chakrambat BP: ${chakrambat.battleBp} BP (Active +4000 BP boost during attack)`);

// Now conclude the attack via endOfBattleBpReset!
BA.endOfBattleBpReset(chakrambat);

// Assert: After attack concludes, BP MUST BE EXACTLY 1000 BP (Normal)!
assert.strictEqual(chakrambat.currentBp, 1000, `Chakrambat currentBp after attack must revert to 1000 BP, got ${chakrambat.currentBp}`);
assert.strictEqual(chakrambat.battleBp, undefined, `Chakrambat battleBp must be deleted after attack`);
assert.strictEqual(chakrambat.battleBpBoost, 0, `Chakrambat battleBpBoost must be 0 after attack`);
console.log(`Post-Attack Chakrambat BP: ${chakrambat.currentBp} BP (Successfully reverted to normal base BP!)`);

// ── TEST 2: JURASSICKLE (Cost 5) BP BOOST & POST-BATTLE REVERSION ──
console.log('\n--- TEST 2: Jurassickle BP Boost During Attack & Reversion ---');
const jurassickle = {
  uid: 'player-jurassickle-1',
  name: 'Jurassickle',
  card_number: 'BS01-018',
  color: 'Red',
  cost: 5,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 3,
  currentBp: 6000,
  levels: [
    { level: 1, cores: 1, bp: 4000 },
    { level: 2, cores: 3, bp: 6000 },
    { level: 3, cores: 5, bp: 8000 }
  ],
  effect: `[LV1][LV2] (When Attacks)\nThis Spirit gains +4000 BP.`
};

duelState.player.field = [jurassickle];
BA.recalculateSpiritBp(jurassickle);
assert.strictEqual(jurassickle.currentBp, 6000, "Jurassickle Lv2 base BP must be 6000 BP");

BA.executePlayerAttack(jurassickle);
assert.strictEqual(jurassickle.battleBp, 10000, "Jurassickle fighting BP during attack must be 10000 BP (6000 + 4000)");

BA.endOfBattleBpReset(jurassickle);
assert.strictEqual(jurassickle.currentBp, 6000, "Jurassickle must revert to base 6000 BP after attack concludes");
assert.strictEqual(jurassickle.battleBp, undefined);
console.log(`✅ Jurassickle fought with 10,000 BP and cleanly reverted to 6,000 BP post-attack!`);

// ── TEST 3: THE SEVENSHOGUN DESPERADO (When Summoned) CORE SWEEP ──
console.log('\n--- TEST 3: The SevenShogun Desperado Core Sweep ---');
const desperado = {
  uid: 'player-desperado-1',
  name: 'The SevenShogun Desperado',
  color: 'Purple',
  cost: 8,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 3,
  currentBp: 6000,
  levels: [{ level: 1, cores: 3, bp: 6000 }],
  effect: `[LV1][LV2] (When Summoned)\nSend all cores on every other Spirit to each respective player's Reserve. Then, for each Spirit depleted by this effect, put one core from the Void to this Spirit.`
};

const victimSpirit1 = { uid: 'v1', name: 'Goblin 1', currentCores: 1, levels: [{ level: 1, cores: 1, bp: 1000 }] };
const victimSpirit2 = { uid: 'v2', name: 'Goblin 2', currentCores: 2, levels: [{ level: 1, cores: 1, bp: 1000 }] };

duelState.player.field = [desperado];
duelState.opponent.field = [victimSpirit1, victimSpirit2];
duelState.opponent.reserve = 0;

BA.executeWhenSummonedEffects(desperado, 'player');

// Assert: both enemy goblins were depleted to 0 cores and sent to trash; cores sent to opponent reserve (1 + 2 = 3)
assert.strictEqual(duelState.opponent.field.length, 0, "All victim spirits depleted and removed from field");
assert.strictEqual(duelState.opponent.reserve, 3, "Victim cores returned to opponent reserve");
// Desperado gained +2 cores from Void for the 2 depleted spirits
assert.strictEqual(desperado.currentCores, 5, `Desperado must have 5 cores (3 initial + 2 void), got ${desperado.currentCores}`);
console.log(`✅ Desperado stripped cores, depleted 2 spirits, and gained +2 Void cores!`);

// ── TEST 4: THE GIANTHERO TITUS (When Summoned) 10-CARD DECK MILL ──
console.log('\n--- TEST 4: The GiantHero Titus 10-Card Deck Mill ---');
const titus = {
  uid: 'player-titus-1',
  name: 'The GiantHero Titus',
  color: 'Blue',
  cost: 8,
  type: 'Spirit',
  currentLevel: 1,
  currentCores: 3,
  currentBp: 8000,
  levels: [{ level: 1, cores: 3, bp: 8000 }],
  effect: `[LV1][LV2] (When Summoned)\nDiscard ten cards from the opposing decktop.`
};

// Fill opponent deck with 25 dummy cards
duelState.opponent.deck = Array.from({ length: 25 }, (_, i) => ({ uid: `opp-card-${i}`, name: `Card ${i}` }));
duelState.opponent.trashCards = [];

BA.executeWhenSummonedEffects(titus, 'player');

// Assert: 10 cards milled from deck to trash
assert.strictEqual(duelState.opponent.deck.length, 15, `Opponent deck must have 15 cards remaining, got ${duelState.opponent.deck.length}`);
assert.strictEqual(duelState.opponent.trashCards.length, 10, `Opponent trash must contain 10 milled cards, got ${duelState.opponent.trashCards.length}`);
console.log(`✅ Titus successfully milled 10 cards from opposing decktop to Trash!`);

// ── TEST 5: THE GIANTEMPEROR ALEXANDER (When Attacks) DESTROY & MILL ──
console.log('\n--- TEST 5: The GiantEmperor Alexander Destroy & Cost-Based Mill ---');
const alexander = {
  uid: 'player-alexander-1',
  name: 'The GiantEmperor Alexander',
  color: 'Blue',
  cost: 6,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 3,
  currentBp: 7000,
  levels: [{ level: 1, cores: 1, bp: 4000 }, { level: 2, cores: 3, bp: 7000 }],
  effect: `[LV1][LV2] [Assault: 2] (When Attacks)\n[LV2] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit, and discard a number of cards from the opposing decktop equal to the cost of the destroyed opposing Spirit.`
};

const enemyCost3Spirit = {
  uid: 'enemy-cost3',
  name: 'Cost 3 Machine',
  cost: 3,
  currentCores: 1,
  currentBp: 3000,
  levels: [{ level: 1, cores: 1, bp: 3000 }]
};

duelState.player.field = [alexander];
duelState.opponent.field = [enemyCost3Spirit];
duelState.opponent.deck = Array.from({ length: 15 }, (_, i) => ({ uid: `c-${i}`, name: `Deck Card ${i}` }));
duelState.opponent.trashCards = [];

BA.executeWhenAttacksEffects(alexander, 'player');

// Assert: enemyCost3Spirit destroyed, and 3 cards milled from opponent deck
assert.strictEqual(duelState.opponent.field.length, 0, "Enemy Cost 3 spirit destroyed");
assert.strictEqual(duelState.opponent.trashCards.some(c => c.name === 'Cost 3 Machine'), true, "Cost 3 machine in Trash");
assert.strictEqual(duelState.opponent.deck.length, 12, "Opponent milled 3 cards equal to destroyed spirit's cost (15 - 3 = 12)");
console.log(`✅ Alexander destroyed opposing Cost 3 spirit and milled 3 cards from opponent deck!`);

// ── TEST 6: THE EXPLOSIONHERO LORD-DRAGON-BAZZEL BURST REVEAL & TRIGGER ──
console.log('\n--- TEST 6: Lord-Dragon-Bazzel Burst Trigger & Refresh ---');
const bazzel = {
  uid: 'player-bazzel-1',
  name: 'The ExplosionHero Lord-Dragon-Bazzel',
  color: 'Red',
  cost: 7,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 3,
  currentBp: 6000,
  levels: [{ level: 1, cores: 1, bp: 4000 }, { level: 2, cores: 3, bp: 6000 }, { level: 3, cores: 5, bp: 9000 }],
  effect: `[Burst: After your Life is reduced]\nSummon this card without paying the cost.\n\n[LV2][LV3] (When Attacks)\nYou can reveal one of your Bursts. If that card's Burst condition is [Burst: con] (After an opposing Spirit/Brave's (When Summoned) effect resolves), activate it.\n\n[LV3] (After Your Burst Activates)\nRefresh this Spirit.`
};

// Set Burst Draw in Burst Zone
const setBurstDraw = {
  uid: 'burst-draw-set',
  name: 'Burst Draw',
  color: 'Red',
  cost: 4,
  type: 'Magic',
  effect: `[Burst: After an opposing Spirit/Brave's (When Summoned) effect resolves]\nDraw two cards.`
};

duelState.player.field = [bazzel];
duelState.player.burst = setBurstDraw;
duelState.player.deck = [{ uid: 'd1', name: 'Card 1' }, { uid: 'd2', name: 'Card 2' }];
duelState.player.hand = [];

BA.executeWhenAttacksEffects(bazzel, 'player');

// Assert: Bazzel revealed and immediately activated Burst Draw, drawing 2 cards
assert.strictEqual(duelState.player.hand.length, 2, "Burst Draw activated by Bazzel drew 2 cards!");
assert.strictEqual(duelState.player.burst, null, "Burst Draw was consumed from Burst Zone!");
console.log(`✅ Bazzel (When Attacks) revealed and activated set When-Summoned Burst!`);

// ── TEST 7: THE SENGOKUDRAGONEMPEROR BURNING-SOULDRAGON ──
console.log('\n--- TEST 7: Burning-Souldragon True-Consecutive Blade ---');
const burningDragon = {
  uid: 'player-burning-1',
  name: 'The SengokuDragonEmperor Burning-Souldragon',
  color: 'Red',
  cost: 9,
  type: 'Spirit',
  currentLevel: 2,
  currentCores: 3,
  hasSoulCore: true,
  currentBp: 10000,
  levels: [{ level: 1, cores: 1, bp: 7000 }, { level: 2, cores: 3, bp: 10000 }],
  effect: `[LV2][LV3][LV4] [True-Consecutive Blade] (When Attacks)\nBy sending [Soul Core] from this Spirit to your Trash, target up to two opposing Spirits/Ultimates and battle them at once.`
};

duelState.player.field = [burningDragon];
duelState.player.soulCoreLocation = 'field';

BA.executeWhenAttacksEffects(burningDragon, 'player');

assert.strictEqual(burningDragon.hasSoulCore, false, "Soul Core sent from Spirit to Trash for True-Consecutive Blade!");
assert.strictEqual(duelState.player.soulCoreLocation, 'trash', "Soul core location updated to trash!");
assert.strictEqual(burningDragon._trueConsecutiveActive, true, "True-Consecutive Blade active on spirit!");
console.log(`✅ Burning-Souldragon sent Soul Core to Trash and unleashed True-Consecutive Blade!`);

console.log('\n🎉 ALL 7 CARDS & BP REVERSION TESTS PASSED WITH 100% SUCCESS!');
