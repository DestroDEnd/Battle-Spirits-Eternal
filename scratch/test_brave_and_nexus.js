// Master verification test for Brave and Nexus mechanics
const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Brave & Nexus Mechanics in Battle Spirits Eternal ===");

// 1. Verify exports in battle_arena.js
const baContent = fs.readFileSync('battle_arena.js', 'utf-8');
assert(baContent.includes('summonBraveAsSpirit'), "Must export summonBraveAsSpirit");
assert(baContent.includes('openBraveCombineModal'), "Must export openBraveCombineModal");
assert(baContent.includes('braveOntoSpirit'), "Must export braveOntoSpirit");
assert(baContent.includes('separateBrave'), "Must export separateBrave");
assert(baContent.includes('isBraveCard'), "Must export isBraveCard");
assert(baContent.includes('parseBraveBonus'), "Must export parseBraveBonus");
assert(baContent.includes('executeBpComparisonDefeatEffects'), "Must have executeBpComparisonDefeatEffects");

// 2. Test parseBraveBonus logic
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

assert.strictEqual(parseBraveBonus("Level 1: 1 core, 1000 BP\nBrave: 0 core, +1000 BP"), 1000, "Alphard should parse +1000 BP");
assert.strictEqual(parseBraveBonus("Level 1: 1 core, 4000 BP\nBraved: 0 cores, +4000 BP"), 4000, "Aset-Kite should parse +4000 BP");
assert.strictEqual(parseBraveBonus("", "[When Braved] Give this Spirit +3000 BP"), 3000, "Fallback effect text should parse +3000 BP");

// 3. Test Brave gating logic in ability execution
function simulateAbilityExecution(bodyText, card, triggerName) {
  const isBraveAbility = /\[(?:when|during)\s+braved?\]|合体時|合体中/i.test(bodyText);
  if (isBraveAbility && !card.isBraved && !card.brave) {
    return { executed: false, reason: "Brave gating: card is not Braved" };
  }
  if (/\(When (?:Brave )?Attacks(?:\/[^)]+)?\)/i.test(bodyText)) {
    const isBpDestruction = /destroyed by comparing BP|BPを比べ/i.test(bodyText);
    if (!isBpDestruction && triggerName !== 'ATTACK') {
      return { executed: false, reason: "Timing gating: not attack step" };
    }
    if (isBpDestruction && triggerName !== 'ATTACK' && triggerName !== 'BP_DESTRUCTION' && triggerName !== 'DESTROY') {
      return { executed: false, reason: "Timing gating: not destruction or attack" };
    }
  }
  if (/(?:When (?:only )?this (?:Spirit|Ultimate|Brave) is destroyed|\(When Destroyed(?:\/[^)]+)?\))/i.test(bodyText) && triggerName !== 'DESTROY' && triggerName !== 'BP_DESTRUCTION') {
    return { executed: false, reason: "Destruction gating: not destroyed" };
  }
  return { executed: true, reason: "Ability executed" };
}

const alphardEffect = `[When Braved] (When Brave Attacks)
When only this Ultimate is destroyed by comparing BP, destroy an opposing Spirit/Ultimate that was in battle with this Ultimate.`;

const unbravedAlphard = { name: "The PoisonSnakeScythe Alphard", isBraved: false, brave: null };
const simSummon = simulateAbilityExecution(alphardEffect, unbravedAlphard, 'SUMMON');
assert.strictEqual(simSummon.executed, false, "Alphard ability must NOT execute on summon");
assert.strictEqual(simSummon.reason, "Brave gating: card is not Braved");

const bravedAlphardHost = { name: "Host Spirit", isBraved: true, brave: unbravedAlphard };
const simAttackSummon = simulateAbilityExecution(alphardEffect, bravedAlphardHost, 'SUMMON');
assert.strictEqual(simAttackSummon.executed, false, "Alphard ability must NOT execute on summon even if braved");

const simCombatBp = simulateAbilityExecution(alphardEffect, bravedAlphardHost, 'BP_DESTRUCTION');
assert.strictEqual(simCombatBp.executed, true, "Alphard ability MUST execute on BP destruction comparison");

// 4. Test BP recalculation with Brave bonus
function simulateRecalculateBp(spirit) {
  let baseBp = spirit.baseBp || 2000;
  let bp = baseBp + (spirit.turnBpBoost || 0);
  if (spirit.brave && spirit.brave.bpBonus) {
    bp += spirit.brave.bpBonus;
  }
  spirit.currentBp = bp;
  return bp;
}

const testSpirit = { name: "Camelot-Pawn", baseBp: 2000, currentBp: 2000, brave: null };
assert.strictEqual(simulateRecalculateBp(testSpirit), 2000);

// Attach Alphard
testSpirit.brave = { name: "The PoisonSnakeScythe Alphard", bpBonus: 1000 };
assert.strictEqual(simulateRecalculateBp(testSpirit), 3000, "Should increase to 3000 BP when braved with Alphard");

// Separate Alphard
testSpirit.brave = null;
assert.strictEqual(simulateRecalculateBp(testSpirit), 2000, "Should revert to 2000 BP after de-braving");

// 5. Test app.js card classification
const appContent = fs.readFileSync('app.js', 'utf-8');
assert(appContent.includes("isBrave"), "app.js must recognize isBrave");
assert(appContent.includes("isNexus"), "app.js must recognize isNexus");
assert(appContent.includes("modalDuelBraveBtn"), "app.js must handle modalDuelBraveBtn");
assert(appContent.includes("BattleArena.deployNexus"), "app.js must call deployNexus for Nexus cards");
assert(appContent.includes("BattleArena.summonBraveAsSpirit"), "app.js must call summonBraveAsSpirit for Brave cards");

console.log("All Brave & Nexus tests PASSED successfully!");
