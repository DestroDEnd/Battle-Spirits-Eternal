const fs = require('fs');
global.document = { getElementById: () => ({ addEventListener: () => {} }), addEventListener: () => {}, readyState: 'complete' };
global.window = { document: global.document, addEventListener: () => {}, location: { pathname: '' } };
global.localStorage = { getItem: () => null, setItem: () => {} };
eval(fs.readFileSync('battle_arena.js', 'utf-8'));

const eff = `[LV1][LV2] (When Summoned)
Send all cores on every other Spirit to each respective player's Reserve. Then, for each Spirit depleted by this effect, put one core from the Void to this Spirit.`;

const BA = window.BattleArena;
// Let's test getCardAbilityBlocks
console.log('Testing Desperado in battle...');
const duelState = BA.getState();
duelState.inDuel = true;
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
  effect: eff
};
const victimSpirit1 = { uid: 'v1', name: 'Goblin 1', currentCores: 1, levels: [{ level: 1, cores: 1, bp: 1000 }] };
const victimSpirit2 = { uid: 'v2', name: 'Goblin 2', currentCores: 2, levels: [{ level: 1, cores: 1, bp: 1000 }] };

duelState.player.field = [desperado];
duelState.opponent.field = [victimSpirit1, victimSpirit2];
duelState.opponent.reserve = 0;

console.log('Before summon - Desperado cores:', desperado.currentCores);
console.log('Before summon - Opponent field:', duelState.opponent.field.length);
BA.executeWhenSummonedEffects(desperado, 'player');
console.log('After summon - Desperado cores:', desperado.currentCores);
console.log('After summon - Opponent field:', duelState.opponent.field.length);
console.log('After summon - Opponent reserve:', duelState.opponent.reserve);
