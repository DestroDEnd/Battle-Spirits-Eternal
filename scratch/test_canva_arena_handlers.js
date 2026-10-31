const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing Canva Arena Effect Handlers & Braved Condition Gating...\n');

// Mock DuelState and AudioFX
global.DuelState = {
  player: {
    life: 5,
    reserve: 4,
    field: [],
    hand: [],
    deck: [{ name: 'Card 1' }, { name: 'Card 2' }, { name: 'Card 3' }],
    trash: 0,
    trashPile: []
  },
  opponent: {
    life: 5,
    reserve: 4,
    field: [{ uid: 'opp-1', name: 'Enemy Spirit', currentBp: 3000, currentCores: 2, isExhausted: false }],
    hand: [],
    deck: [{ name: 'Enemy Deck 1' }, { name: 'Enemy Deck 2' }, { name: 'Enemy Deck 3' }, { name: 'Enemy Deck 4' }],
    trash: 0,
    trashPile: []
  }
};

global.AudioFX = {
  playTone: () => {},
  coreChime: () => {},
  destroy: () => {},
  magic: () => {},
  slash: () => {},
  shield: () => {},
  summon: () => {},
  lifeDamage: () => {}
};

global.addLog = (msg, type) => {
  // console.log(`[LOG] ${msg}`);
};

global.sendToTrash = (card, side, reason) => {
  const state = side === 'player' ? DuelState.player : DuelState.opponent;
  state.trash = (state.trash || 0) + 1;
  state.trashPile = state.trashPile || [];
  state.trashPile.push(card);
};

global.recycleSpiritCoresToReserve = (card, side) => {
  const state = side === 'player' ? DuelState.player : DuelState.opponent;
  state.reserve += (card.currentCores || 0);
  card.currentCores = 0;
};

global.CardEffectsDB = {
  'The PoisonSnakeScythe Alphard': {
    triggers: {
      WHEN_DESTROYED_IN_BATTLE: [
        {
          type: 'DESTROY_SPIRIT_DIRECT',
          desc: 'Destroy 1 opposing Spirit(s)',
          is_braved: true,
          require_braved: true,
          count: 1
        }
      ]
    }
  },
  'Crush Dragon': {
    triggers: {
      WHEN_ATTACKS: [
        {
          type: 'CRUSH',
          desc: 'Crush LV',
          is_braved: false
        }
      ]
    }
  },
  'Burst Lock Master': {
    triggers: {
      WHEN_SUMMONED: [
        {
          type: 'BURST_LOCK',
          canva_rules: { burst_lock_target: 'PLAYER' }
        }
      ]
    }
  }
};

// Extract executeUniversalCardEffect from battle_arena.js
const arenaCode = fs.readFileSync(path.join(__dirname, '../battle_arena.js'), 'utf-8');
const startIdx = arenaCode.indexOf('function isOptionalEffectText');
const endIdx = arenaCode.indexOf('async function initBattleArena');
const funcCode = arenaCode.substring(startIdx, endIdx);

// Evaluate executeUniversalCardEffect in current scope
eval(funcCode);

// TEST A: Standalone Brave (Not Braved) should NOT trigger [When Braved]
const standaloneBrave = {
  name: 'The PoisonSnakeScythe Alphard',
  isBraved: false,
  brave: null,
  currentLevel: 1
};
const initialOppSpCount = DuelState.opponent.field.length;
executeUniversalCardEffect(standaloneBrave, 'player', 'WHEN_DESTROYED_IN_BATTLE');
assert.strictEqual(DuelState.opponent.field.length, initialOppSpCount, 'Standalone brave MUST NOT destroy enemy spirit');
console.log('✅ TEST A: Standalone brave does NOT trigger braved-only effects.');

// TEST B: Braved Spirit triggers [When Braved]
const bravedSpirit = {
  name: 'The PoisonSnakeScythe Alphard',
  isBraved: true,
  currentLevel: 1
};
executeUniversalCardEffect(bravedSpirit, 'player', 'WHEN_DESTROYED_IN_BATTLE');
assert.strictEqual(DuelState.opponent.field.length, initialOppSpCount - 1, 'Braved spirit MUST destroy enemy spirit');
console.log('✅ TEST B: Braved spirit triggers braved-only effects as specified by Canva manual.');

// TEST C: CRUSH mills opponent deck according to current level
const crushSpirit = {
  name: 'Crush Dragon',
  currentLevel: 2
};
const initialDeckCount = DuelState.opponent.deck.length;
executeUniversalCardEffect(crushSpirit, 'player', 'WHEN_ATTACKS');
assert.strictEqual(DuelState.opponent.deck.length, initialDeckCount - 2, 'Crush LV2 must discard 2 cards');
console.log('✅ TEST C: CRUSH ability correctly mills opponent deck by level.');

// TEST D: BURST_LOCK applies player-level lock
const lockSpirit = {
  name: 'Burst Lock Master',
  currentLevel: 1
};
executeUniversalCardEffect(lockSpirit, 'player', 'WHEN_SUMMONED');
assert.strictEqual(DuelState.opponent.cannotActivateBurstEffects, true, 'Opponent player burst lock set');
console.log('✅ TEST D: BURST_LOCK applies player lock per Canva manual.');

console.log('\n🎉 ALL CANVA EFFECT ENGINE TESTS PASSED!');
