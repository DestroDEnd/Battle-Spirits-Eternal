// Test script for Battle Spirits Brave and Nexus Mechanics
const assert = require('assert');

console.log('Testing Brave parsing & logic...');

function parseBraveBonus(levelsStr, effectStr) {
  if (levelsStr && typeof levelsStr === 'string') {
    const m = levelsStr.match(/(?:Brave|Braved)\s*:\s*\d+\s*cores?,\s*\+?(\d+)\s*BP/i);
    if (m) return parseInt(m[1], 10);
  }
  if (effectStr && typeof effectStr === 'string') {
    const mEff = effectStr.match(/(?:give|gains?|\+)\s*(\d{3,5})\s*BP/i) || effectStr.match(/(\d{3,5})\s*BP/i);
    if (mEff) return parseInt(mEff[1], 10);
  }
  return 1000;
}

// Test Alphard levels
const alphardLevels = "Level 1: 1 core, 1000 BP\nBrave: 0 core, +1000 BP";
const alphardBonus = parseBraveBonus(alphardLevels, "");
assert.strictEqual(alphardBonus, 1000, "Alphard should have +1000 BP bonus");

// Test another brave
const angedollLevels = "Level 1: 1 core, 2000 BP\nBraved: 0 cores, +2000 BP";
const angedollBonus = parseBraveBonus(angedollLevels, "");
assert.strictEqual(angedollBonus, 2000, "Angedoll should have +2000 BP bonus");

console.log('parseBraveBonus tests passed!');
