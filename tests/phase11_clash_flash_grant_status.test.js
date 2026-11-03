import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load battle arena script in isolated sandbox context to test exact client functions
const arenaCode = readFileSync(resolve('./battle_arena.js'), 'utf8');

function setupTestEnvironment() {
  const mockDoc = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, innerHTML: '' }),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild() {} }
  };

  const globalObj = {
    console,
    Math,
    parseInt,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    document: mockDoc,
    window: {
      location: { protocol: 'http:' },
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    AudioFX: {
      slash: () => {},
      summon: () => {},
      coreChime: () => {},
      destroy: () => {},
      kill: () => {}
    },
    showToast: () => {}
  };

  const fn = new Function('window', 'document', 'AudioFX', 'showToast', `
    ${arenaCode}
    return {
      BattleArena: window.BattleArena,
      DuelState: window.DuelState
    };
  `);

  return fn(globalObj.window, mockDoc, globalObj.AudioFX, globalObj.showToast);
}

test('Phase 11 - Aggressive Rage grants Clash to target Spirit and hasClash recognises it', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  // Create friendly spirit without native Clash (The DragonEmperorWaterShield Clio-Wasser)
  const clioWasser = {
    uid: 'spirit_clio_wasser_001',
    name: 'The DragonEmperorWaterShield Clio-Wasser',
    currentLevel: 2,
    currentBp: 5000,
    baseBp: 5000,
    currentCores: 4,
    hasSoulCore: true,
    isExhausted: false,
    effect: 'Cards can\'t be discarded from either deck.'
  };

  DuelState.player.field = [clioWasser];
  DuelState.opponent.field = [];
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5; // ATTACK step

  // Prior to spell, Clio-Wasser does not have Clash
  assert.equal(BattleArena.hasClash(clioWasser), false, 'Clio-Wasser initially has no Clash');

  // Aggressive Rage (BS16-073)
  const aggressiveRage = {
    uid: 'magic_aggressive_rage_001',
    name: 'Aggressive Rage',
    type: 'Magic',
    cost: 3,
    effect: '[FLASH] During this turn, give a Spirit you control: "[CLASH] (WHEN ATTACKS) The opponent must block if possible."'
  };

  // Cast Flash spell targeting Clio-Wasser
  const desc = BattleArena.applyMagicEffect(aggressiveRage, 'player', null, clioWasser.uid, 'flash');

  // Verify ability was granted
  assert.ok(desc.includes('[CLASH]'), 'Effect description confirms Clash was granted');
  assert.equal(BattleArena.hasClash(clioWasser), true, 'hasClash now returns true for Clio-Wasser');
  assert.ok(clioWasser.grantedKeywords.includes('Clash'), 'grantedKeywords contains Clash');
  assert.equal(clioWasser.hasClash, true, 'hasClash boolean flag set on unit');
});

test('Phase 11 - Attacking with granted Clash forces opponent Ready blocker to intercept', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const attacker = {
    uid: 'attacker_001',
    name: 'Clio-Wasser',
    currentLevel: 2,
    currentBp: 6000,
    baseBp: 5000,
    currentCores: 4,
    hasSoulCore: true,
    isExhausted: false,
    levels: [
      { level: 1, cores: 1, bp: 3000 },
      { level: 2, cores: 4, bp: 5000 }
    ],
    effect: 'Cards can\'t be discarded.'
  };

  // Grant Clash to attacker
  BattleArena.grantEffectToUnit(attacker, {
    keyword: 'Clash',
    text: '[CLASH] The opponent must block if possible.',
    expires: 'end_of_turn'
  }, 'Aggressive Rage');

  // Opponent has a ready blocker (Shadow Yatagarasu) with 3000 BP
  const yatagarasu = {
    uid: 'blocker_yatagarasu',
    name: 'Shadow Yatagarasu',
    currentLevel: 1,
    currentBp: 3000,
    currentCores: 1,
    isExhausted: false,
    effect: ''
  };

  DuelState.activePlayer = 'player';
  DuelState.player.field = [attacker];
  DuelState.opponent.field = [yatagarasu];
  DuelState.opponent.life = 4;
  DuelState.turn = 2;
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5;

  assert.equal(BattleArena.hasClash(attacker), true, 'Attacker has Clash');

  // Trigger attack resolution
  BattleArena.handleSpiritClick(attacker.uid, 'player');

  // Verify that combatEvent was created with blocker assigned due to Clash
  assert.ok(DuelState.combatEvent, 'Combat event initiated');
  assert.equal(DuelState.combatEvent.blocker.uid, yatagarasu.uid, 'Shadow Yatagarasu was forced to block due to Clash');
});

test('Phase 11 - Temporary granted Clash and BP boosts expire at end of turn', () => {
  const { BattleArena, DuelState } = setupTestEnvironment();

  const spirit = {
    uid: 'spirit_buff_target',
    name: 'Blade Dragon',
    currentLevel: 1,
    currentBp: 3000,
    baseBp: 3000,
    currentCores: 1,
    isExhausted: true,
    levels: [
      { level: 1, cores: 1, bp: 3000 },
      { level: 2, cores: 3, bp: 5000 }
    ],
    effect: ''
  };

  DuelState.player.field = [spirit];
  DuelState.opponent.field = [];
  DuelState.phases = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  DuelState.phaseIndex = 5;

  // Grant Clash and +2000 BP
  BattleArena.grantEffectToUnit(spirit, {
    keyword: 'Clash',
    bp: 2000,
    text: '+2000 BP and [CLASH]',
    expires: 'end_of_turn'
  }, 'Test Magic');

  assert.equal(BattleArena.hasClash(spirit), true);
  assert.equal(spirit.currentBp, 5000);

  // End turn
  BattleArena.endTurn();

  // Temporary buffs expired
  assert.equal(BattleArena.hasClash(spirit), false, 'Clash expired after endTurn');
  assert.equal(spirit.currentBp, 3000, 'BP buff reset to base after endTurn');
});
