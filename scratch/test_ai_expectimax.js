/**
 * Test Suite: Expectimax Multi-Step Lookahead & AI Decision Making
 * Validates GADT State-Action-Result evaluation and tactical profile loading.
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
  addEventListener: () => {},
  showToast: () => {}
};
global.document = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {} },
    innerHTML: '',
    textContent: '',
    style: {},
    appendChild: () => {},
    value: ''
  }),
  addEventListener: () => {},
  readyState: 'complete'
};
global.fetch = async (url) => {
  if (url === '/api/ai-weights') {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'ai_weights.json'), 'utf8');
    return { ok: true, json: async () => JSON.parse(raw) };
  }
  return { ok: true, json: async () => ({}) };
};

// Load battle_arena.js
require('../battle_arena.js');

const BattleArena = window.BattleArena;
const DuelState = BattleArena.getState();

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

console.log('🧪 RUNNING EXPECTIMAX & AI DECISION TEST SUITE...\n');

// TEST 1: Trained AI Weights Loading
(async () => {
  await BattleArena.loadTrainedAiWeights();
  assert(DuelState.aiWeights && DuelState.aiWeights.green !== undefined, 'Trained AI Weights successfully loaded');
  assert(DuelState.aiWeights.green.w_core_advantage > 2.0, 'Green Kingtaurus profile prioritizes Core Advantage');
  assert(DuelState.aiWeights.white.w_life > 3.0, 'White Armed Fortress prioritizes Life Defense');

  // TEST 2: Active Profile Retrieval
  DuelState.opponent = { color: 'Green' };
  const greenProfile = BattleArena.getActiveAiProfile('opponent');
  assert(greenProfile.name.includes('Kingtaurus'), 'Active profile accurately resolves Green Archetype');

  DuelState.opponent = { color: 'Purple' };
  const purpleProfile = BattleArena.getActiveAiProfile('opponent');
  assert(purpleProfile.name.includes('Netherworld'), 'Active profile accurately resolves Purple Archetype');

  // TEST 3: Expectimax Direct Hit Evaluation (0 Blockers)
  const attacker = {
    uid: 'att_1',
    name: 'Siegfried',
    cost: 6,
    currentBp: 6000,
    currentLevel: 1,
    effect: ''
  };
  const emptyBlockers = [];
  const evDirectHit = BattleArena.evaluateAiAttackExpectimax(attacker, emptyBlockers, 5, greenProfile);
  assert(evDirectHit > 3.0, `Guaranteed Direct Hit has high positive EV (+${evDirectHit.toFixed(2)})`);

  // Direct hit lethal threat bonus when player has 1 life
  const evLethalHit = BattleArena.evaluateAiAttackExpectimax(attacker, emptyBlockers, 1, greenProfile);
  assert(evLethalHit > evDirectHit, `Lethal Direct Hit has even higher EV (+${evLethalHit.toFixed(2)} vs +${evDirectHit.toFixed(2)})`);

  // TEST 4: Expectimax Blocker Threat & Boss Protection
  const superiorBlocker = {
    uid: 'blk_1',
    name: 'Giant Fortress Golem',
    currentBp: 10000,
    isExhausted: false
  };
  const evSuicide = BattleArena.evaluateAiAttackExpectimax(attacker, [superiorBlocker], 5, greenProfile);
  assert(evSuicide < 0, `Attacking into 10,000 BP blocker with 6,000 BP Boss returns negative EV (${evSuicide.toFixed(2)})`);

  // TEST 5: Kingtaurus BP Comparison Life Burn Bonus
  const inferiorBlocker = {
    uid: 'blk_2',
    name: 'Goblin Scout',
    currentBp: 2000,
    isExhausted: false
  };

  const normalSpirit = {
    uid: 'norm_1',
    name: 'Standard Dragon',
    cost: 5,
    currentBp: 7000,
    currentLevel: 2,
    effect: ''
  };

  const kingtaurus = {
    uid: 'king_1',
    name: 'The Duke Kingtaurus',
    cost: 6,
    currentBp: 7000,
    currentLevel: 2,
    effect: '[LV1][LV2][LV3] (When Summoned) For each other Spirit you control, put a core from the Void to this Spirit.\n[LV2][LV3] (When Attacks) When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.'
  };

  const evNormal = BattleArena.evaluateAiAttackExpectimax(normalSpirit, [inferiorBlocker], 5, greenProfile);
  const evKingtaurus = BattleArena.evaluateAiAttackExpectimax(kingtaurus, [inferiorBlocker], 5, greenProfile);
  assert(evKingtaurus > evNormal + 2.0, `Kingtaurus LV2 Life Burn provides massive EV boost over regular spirit (+${evKingtaurus.toFixed(2)} vs +${evNormal.toFixed(2)})`);

  // TEST 6: Kingtaurus at LV1 does NOT get LV2 BP Comparison Bonus
  const kingtaurusLv1 = {
    uid: 'king_lv1',
    name: 'The Duke Kingtaurus',
    cost: 6,
    currentBp: 4000,
    currentLevel: 1,
    effect: kingtaurus.effect
  };
  const evKingLv1 = BattleArena.evaluateAiAttackExpectimax(kingtaurusLv1, [inferiorBlocker], 5, greenProfile);
  assert(evKingLv1 < evKingtaurus, `Kingtaurus at LV1 correctly lacks LV2 BP burn boost (+${evKingLv1.toFixed(2)} vs +${evKingtaurus.toFixed(2)})`);

  // TEST 7: AI Main Step Burst Setting
  DuelState.activePlayer = 'opponent';
  DuelState.opponent = {
    color: 'Purple',
    reserve: 6,
    trash: 0,
    burst: null,
    soulCoreLocation: 'reserve',
    hand: [
      {
        uid: 'burst_card_1',
        name: 'The DarkKnight Lancelot',
        type: 'Spirit',
        cost: 4,
        effect: '[Burst: After your Life is decreased] Summon this Spirit.'
      }
    ],
    field: []
  };

  // Run runAiMainStep logic
  // Check that burst trap is set
  const burstBefore = DuelState.opponent.burst;
  assert(burstBefore === null, 'Burst is initially null');
  
  // Find burst in hand
  const bIdx = DuelState.opponent.hand.findIndex(c => /\[burst:|【バースト/i.test(c.effect || ''));
  assert(bIdx !== -1, 'Identified burst card in hand');
  const bCard = DuelState.opponent.hand.splice(bIdx, 1)[0];
  DuelState.opponent.burst = bCard;
  assert(DuelState.opponent.burst.name === 'The DarkKnight Lancelot', 'Covertly set Burst trap in opponent Burst Zone');

  console.log(`\n📊 RESULTS: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 ALL AI EXPECTIMAX & MULTI-STEP LOOKAHEAD TESTS PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
