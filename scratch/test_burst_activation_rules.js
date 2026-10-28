const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function run() {
  console.log('🧪 Starting Battle Spirits Burst Activation & Condition Validation Test Suite...\n');

  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        innerHTML: '',
        textContent: '',
        style: {},
        disabled: false
      };
    }
    return elements[id];
  }

  global.document = {
    getElementById: (id) => getOrCreateElement(id),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  let toasts = [];
  global.window = {
    addEventListener: () => {},
    showToast: (m, type) => {
      toasts.push({ m, type });
    }
  };

  const baCode = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf8');
  const vm = require('vm');
  let currentTimers = [];
  const context = {
    document: global.document,
    window: global.window,
    showToast: (m, type) => toasts.push({ m, type }),
    console: console,
    setTimeout: (fn, delay) => {
      const id = currentTimers.length + 1;
      currentTimers.push({ id, fn, delay });
      return id;
    },
    clearTimeout: (id) => {
      currentTimers = currentTimers.filter(t => t.id !== id);
    },
    AudioContext: class {
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    }
  };

  vm.createContext(context);
  vm.runInContext(baCode, context);

  const BA = context.window.BattleArena;
  const DuelState = context.window.DuelState;

  // Enchante card exact text from screenshot
  const enchanteCard = {
    uid: 'card_enchante_1',
    name: 'The MakaiSwordDeityDoll †Enchante†',
    type: 'Spirit',
    color: 'Purple',
    cost: 7,
    levels: [
      { level: 1, cores: 1, bp: 6000 },
      { level: 2, cores: 3, bp: 10000 },
      { level: 3, cores: 5, bp: 15000 }
    ],
    effect: `(Once per Game: Same Name) When your Life is reduced to three or less, and you have four counters or more, you can immediately activate the following Burst of this card from your Trash.

[BURST: AFTER AN OPPOSING SPIRIT'S (WHEN SUMMONED/ADVENTS) EFFECT RESOLVES]
Summon this card without paying the cost. Then, during this turn, increase the LV cost of two opposing Spirits/Ultimates by +2.

[LV1][LV2][LV3] (When Summoned/Attacks)
You can send up to two cores from one opposing Spirit/Ultimate to the Reserve. When this effect depletes, draw two cards.`
  };

  // Flame Dance (Life Reduced Burst)
  const flameDanceCard = {
    uid: 'card_flame_dance_1',
    name: 'Flame Dance',
    type: 'Magic',
    color: 'Red',
    cost: 5,
    levels: [{ level: 1, cores: 1, bp: 0 }],
    effect: `[Burst: After your Life is reduced]
Destroy two opposing 3000 BP or less Spirits.`
  };

  // 1. Test parseBurstCondition classification
  console.log('--- Test 1: Condition classification for Enchante and Flame Dance ---');
  const enchanteCond = BA.parseBurstCondition(enchanteCard.effect);
  assert.strictEqual(enchanteCond.type, 'AFTER_OPPONENT_SUMMON_EFFECT');
  console.log(`  ✅ Enchante classified as: ${enchanteCond.type} ("${enchanteCond.label}")`);

  const flameCond = BA.parseBurstCondition(flameDanceCard.effect);
  assert.strictEqual(flameCond.type, 'AFTER_LIFE_DECREASED');
  console.log(`  ✅ Flame Dance classified as: ${flameCond.type} ("${flameCond.label}")`);

  // Setup DuelState
  DuelState.inDuel = true;
  DuelState.turn = 2;
  DuelState.activePlayer = 'player';
  DuelState.player = {
    life: 5,
    reserve: 4,
    trash: 0,
    burst: { ...enchanteCard },
    field: [],
    hand: [],
    deck: []
  };
  DuelState.opponent = {
    life: 5,
    reserve: 5,
    trash: 0,
    burst: null,
    field: [],
    hand: [],
    deck: []
  };

  // 2. Test: Manual activation when condition is NOT met is blocked
  console.log('\n--- Test 2: Unearned Manual Trigger is Blocked ---');
  toasts = [];
  BA.activateBurst('player');
  assert.strictEqual(DuelState.player.burst?.uid, enchanteCard.uid, 'Burst card was illegally consumed!');
  assert(toasts.some(t => t.m.includes('Condition not met')), 'No warning toast given to user!');
  console.log('  ✅ Manual activation rejected because condition has not occurred in battle.');

  // 3. Test: Life loss event does NOT trigger Enchante
  console.log('\n--- Test 3: Life Loss does NOT trigger Enchante ---');
  const lifeLossTriggered = BA.checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
  assert.strictEqual(lifeLossTriggered, false, 'Enchante improperly triggered on Life loss!');
  assert.strictEqual(DuelState.player.burst?.uid, enchanteCard.uid, 'Enchante was consumed on Life loss!');
  assert.strictEqual(DuelState.activeBurstTrigger, null, 'Active burst trigger set on invalid condition!');
  console.log('  ✅ Enchante safely remained set face-down when Life was reduced.');

  // 4. Test: Opposing Spirit When Summoned effect DOES trigger Enchante!
  console.log('\n--- Test 4: Opponent When Summoned effect triggers Enchante ---');
  const enemySpirit = { uid: 'opp_king_1', name: 'The Duke Kingtaurus', currentLevel: 1, currentBp: 5000 };
  const summonTriggered = BA.checkBurstTrigger('player', 'AFTER_OPPONENT_SUMMON_EFFECT', { triggerSpirit: enemySpirit });
  assert.strictEqual(summonTriggered, true, 'Enchante failed to trigger on Opposing Summon Effect!');
  assert(DuelState.activeBurstTrigger !== null, 'DuelState.activeBurstTrigger was not populated!');
  assert.strictEqual(DuelState.activeBurstTrigger.card.name, enchanteCard.name);
  assert(getOrCreateElement('battleBurstPromptModal').classList.contains('active'), 'Prompt modal was not opened!');
  console.log('  ✅ Enchante prompt modal opened successfully when opponent When Summoned effect resolved.');

  // 5. Test: Player chooses "Keep Set (Pass)"
  console.log('\n--- Test 5: Player can decline and keep card set ---');
  BA.declineBurstTrigger();
  assert.strictEqual(DuelState.activeBurstTrigger, null, 'activeBurstTrigger not cleared on decline!');
  assert.strictEqual(DuelState.player.burst?.uid, enchanteCard.uid, 'Card was removed despite declining!');
  assert(!getOrCreateElement('battleBurstPromptModal').classList.contains('active'), 'Modal stayed open!');
  console.log('  ✅ Player declined trigger; Enchante safely remained set in Burst Zone for future turns.');

  // 6. Test: Re-trigger and Confirm activation
  console.log('\n--- Test 6: Trigger and Confirm Activation ---');
  BA.checkBurstTrigger('player', 'AFTER_OPPONENT_SUMMON_EFFECT', { triggerSpirit: enemySpirit });
  BA.confirmBurstTrigger();
  assert.strictEqual(DuelState.player.burst, null, 'Burst was not consumed after confirmation!');
  assert.strictEqual(DuelState.player.field.length, 1, 'Enchante was not summoned to field!');
  assert.strictEqual(DuelState.player.field[0].name, enchanteCard.name);
  console.log('  ✅ Enchante successfully Burst Summoned to battlefield for 0 cost!');

  // 7. Test Flame Dance with Life Reduced event
  console.log('\n--- Test 7: Flame Dance triggers on Life Loss ---');
  DuelState.player.burst = { ...flameDanceCard };
  const fdLifeTriggered = BA.checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
  assert.strictEqual(fdLifeTriggered, true, 'Flame Dance failed to trigger on Life loss!');
  assert.strictEqual(DuelState.activeBurstTrigger?.card.name, flameDanceCard.name);
  BA.confirmBurstTrigger();
  assert.strictEqual(DuelState.player.burst, null);
  console.log('  ✅ Flame Dance properly triggered on Life loss.');

  console.log('\n🎉 ALL BURST ACTIVATION & CONDITION VALIDATION TESTS PASSED! (100% assertions satisfied)');
}

run();
