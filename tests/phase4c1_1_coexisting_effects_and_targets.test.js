/**
 * tests/phase4c1_1_coexisting_effects_and_targets.test.js
 *
 * Phase 4C.1.1 Verification Test Suite:
 * 1. Preservation of coexisting operations across multi-operation abilities
 * 2. Preservation of exact target restrictions (Grandwalker Nexuses, named cards, families)
 * 3. Engine verification of target filter selectivity
 * 4. Engine verification of coexisting effect execution
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { compileCard } from '../compiler/index.js';
import { createGameState, createFieldStack } from '../engine/state.js';
import { isImmune, matchesTargetFilter } from '../engine/continuous.js';
import { moveCard } from '../engine/zones.js';
import { executeOp } from '../engine/ops/index.js';

const ability73List = JSON.parse(fs.readFileSync('scratch/def_immunity_73_abilities.json', 'utf8'));

function getCompiledAbility(abId) {
  const item = ability73List.find(x => x.abilityId === abId);
  assert(item, `Ability ${abId} not found in 73 abilities dataset`);
  const [cardId, aIdxStr] = abId.split('#');
  const aIdx = parseInt(aIdxStr.replace('a', ''), 10);
  const compiled = compileCard({
    id: item.cardNumber,
    name: item.cardName,
    type: 'Spirit',
    effect: item.originalText,
    skipOverride: true
  });
  const ab = compiled.abilities?.[0];
  assert(ab, `Compiled ability ${abId} not found`);
  return { item, ab, ops: ab.clauses.map(c => c.op).filter(Boolean) };
}

// ---------------------------------------------------------------------------
// 1. Mandatory Card-Level Compilation & Preservation Tests
// ---------------------------------------------------------------------------

test('1. BATTLE-SPIRITS-A12084#a2 preserves both destruction immunity and hand protection', () => {
  const { ops } = getCompiledAbility('BATTLE-SPIRITS-A12084#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const immOp = ops.find(o => o.op === 'IMMUNITY');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['OPPOSING_EFFECTS']);
  assert(immOp, 'Must contain IMMUNITY op for hand protection');
  assert.strictEqual(immOp.immuneTo, 'OPPOSING_EFFECTS');
});

test('2. BATTLE-SPIRITS-A319#a2 preserves both destruction immunity and symbol-addition effect', () => {
  const { ops } = getCompiledAbility('BATTLE-SPIRITS-A319#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const symOp = ops.find(o => o.op === 'ADD_SYMBOL');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['BP_COMPARISON']);
  assert(symOp, 'Must contain ADD_SYMBOL op');
  assert.strictEqual(symOp.side, 'self');
});

test('3. BS58-029#a3 preserves both destruction immunity and deck-discard protection', () => {
  const { ops } = getCompiledAbility('BS58-029#a3');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const restOp = ops.find(o => o.op === 'GLOBAL_RESTRICTION');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['OPPOSING_EFFECTS']);
  assert(restOp, 'Must contain GLOBAL_RESTRICTION op preventing deck discard');
});

test('4. BS61-X05#a2 preserves destruction immunity, core movement, and Grand Skill activation', () => {
  const { ops } = getCompiledAbility('BS61-X05#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const moveOp = ops.find(o => o.op === 'MOVE_CORE');
  const skillOp = ops.find(o => o.op === 'KEYWORD_RULE' || o.op === 'TREAT_RULE');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['BP_COMPARISON']);
  assert(moveOp, 'Must contain MOVE_CORE op');
  assert(skillOp, 'Must contain Grand Skill activation/rule op');
});

test('5. BS75-042#a1 preserves destruction immunity and Mirage summon effect', () => {
  const { ops } = getCompiledAbility('BS75-042#a1');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const sumOp = ops.find(o => o.op === 'SUMMON');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['OPPOSING_EFFECTS']);
  assert(sumOp, 'Must contain SUMMON op for Mirage summon');
});

test('6. BS76-064#a2 preserves destruction immunity and family-granting effect', () => {
  const { ops } = getCompiledAbility('BS76-064#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const famOp = ops.find(o => o.op === 'GRANT_FAMILY');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['OPPOSING_EFFECTS']);
  assert(famOp, 'Must contain GRANT_FAMILY op');
  assert.strictEqual(famOp.family, 'Hunter Beast');
});

test('7. CB21-X05#a3 preserves destruction immunity and effect immunity', () => {
  const { ops } = getCompiledAbility('CB21-X05#a3');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  const immOp = ops.find(o => o.op === 'IMMUNITY');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.deepStrictEqual(indOp.by, ['OPPOSING_EFFECTS']);
  assert(immOp, 'Must contain IMMUNITY op');
});

// ---------------------------------------------------------------------------
// 2. Exact Target Restrictions Tests
// ---------------------------------------------------------------------------

test('8. BS74-064#a2 targets Contractor Nuadha Grandwalker Nexuses, NOT self', () => {
  const { ops } = getCompiledAbility('BS74-064#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.notStrictEqual(indOp.target, 'self', 'Target must not default to self');
  assert.deepStrictEqual(indOp.target, {
    side: 'self',
    types: ['Grandwalker Nexus', 'Nexus'],
    name: 'Contractor Nuadha'
  });
});

test('9. BS75-042#a1 targets Contractor Indra Grandwalker Nexuses, NOT self', () => {
  const { ops } = getCompiledAbility('BS75-042#a1');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.notStrictEqual(indOp.target, 'self', 'Target must not default to self');
  assert.deepStrictEqual(indOp.target, {
    side: 'self',
    types: ['Grandwalker Nexus', 'Nexus'],
    name: 'Contractor Indra'
  });
});

test('10. BS76-063#a2 targets Contractor Brigit Grandwalker Nexuses, NOT self', () => {
  const { ops } = getCompiledAbility('BS76-063#a2');
  const indOp = ops.find(o => o.op === 'INDESTRUCTIBLE');
  assert(indOp, 'Must contain INDESTRUCTIBLE op');
  assert.notStrictEqual(indOp.target, 'self', 'Target must not default to self');
  assert.deepStrictEqual(indOp.target, {
    side: 'self',
    types: ['Grandwalker Nexus', 'Nexus'],
    name: 'Contractor Brigit'
  });
});

test('11. Additional target patterns: BS55-003, CB05-039, CB10-061, CB10-014', () => {
  const tZeus = getCompiledAbility('BS55-003#a1').ops.find(o => o.op === 'INDESTRUCTIBLE').target;
  assert.deepStrictEqual(tZeus, { side: 'self', types: ['Grandwalker Nexus', 'Nexus'], name: 'Zeus' });

  const tDigmon = getCompiledAbility('CB05-039#a2').ops.find(o => o.op === 'INDESTRUCTIBLE').target;
  assert.deepStrictEqual(tDigmon, { side: 'self', types: ['Spirit'], families: ['Ultimate', 'Mega', 'Armor'] });

  const tArms = getCompiledAbility('CB10-061#a1').ops.find(o => o.op === 'INDESTRUCTIBLE').target;
  assert.deepStrictEqual(tArms, { side: 'self', types: ['Spirit'], name: 'Arms' });

  const tZonjis = getCompiledAbility('CB10-014#a1').ops.find(o => o.op === 'INDESTRUCTIBLE').target;
  assert.deepStrictEqual(tZonjis, {
    side: 'self',
    types: ['Spirit'],
    names: ['Kamen Rider Zonjis', 'Kamen Rider Barlckxs'],
    includeSelf: true
  });
});

// ---------------------------------------------------------------------------
// 3. Engine Target Filter Selectivity Execution Tests
// ---------------------------------------------------------------------------

test('12. Engine execution: Passive Grandwalker protection selectively protects matching nexus only', async () => {
  const state = createGameState();

  // Friendly provider: Bilijvern (BS75-042) with passive INDESTRUCTIBLE targeting Contractor Indra
  const bilijvernStack = createFieldStack({
    id: 'BS75-042',
    name: 'The BabyElectricDragon Bilijvern',
    type: 'Spirit',
    cost: 3,
    level: 1,
    owner: 'player',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'PASSIVE', levels: [1, 2] },
          clauses: [
            {
              op: {
                op: 'INDESTRUCTIBLE',
                by: ['OPPOSING_EFFECTS'],
                target: {
                  side: 'self',
                  types: ['Grandwalker Nexus', 'Nexus'],
                  name: 'Contractor Indra'
                }
              }
            }
          ]
        }
      ]
    }
  }, { normal: 2, soul: 0 });

  // Friendly matching target: Contractor Indra Grandwalker Nexus
  const indraNexusStack = createFieldStack({
    id: 'BS75-X01',
    name: 'Contractor Indra',
    type: 'Grandwalker Nexus',
    cost: 2,
    level: 1,
    owner: 'player'
  }, { normal: 2, soul: 0 });

  // Friendly non-matching target: Contractor Nuadha Grandwalker Nexus
  const nuadhaNexusStack = createFieldStack({
    id: 'BS74-X01',
    name: 'Contractor Nuadha',
    type: 'Grandwalker Nexus',
    cost: 2,
    level: 1,
    owner: 'player'
  }, { normal: 2, soul: 0 });

  // Friendly Spirit (non-nexus)
  const regularSpiritStack = createFieldStack({
    id: 'BS01-001',
    name: 'Strikewurm-Leo',
    type: 'Spirit',
    cost: 5,
    level: 1,
    owner: 'player'
  }, { normal: 1, soul: 0 });

  state.players.player.field = [bilijvernStack, indraNexusStack, nuadhaNexusStack, regularSpiritStack];

  const opposingSource = { id: 'opp_magic_1', name: 'Volcanic Break', type: 'Magic', owner: 'opponent' };

  // 1. Contractor Indra MUST be immune to opposing destruction
  const indraImmune = isImmune(state, indraNexusStack, opposingSource, 'destroy');
  assert.strictEqual(indraImmune, true, 'Contractor Indra should be immune to opposing destruction');

  // Attempting to move Contractor Indra to grave via opposing effect must be blocked
  const indraMoved = await moveCard(state, indraNexusStack.top, 'grave', 'player', {
    cause: 'destroy',
    by: 'opponent',
    sourceCard: opposingSource
  });
  assert.strictEqual(indraMoved, false, 'Contractor Indra destruction moveCard should fail');
  assert(state.players.player.field.includes(indraNexusStack), 'Contractor Indra must remain on field');

  // 2. Contractor Nuadha MUST NOT be immune to opposing destruction
  const nuadhaImmune = isImmune(state, nuadhaNexusStack, opposingSource, 'destroy');
  assert.strictEqual(nuadhaImmune, false, 'Contractor Nuadha should NOT be immune');

  // Attempting to move Contractor Nuadha to grave via opposing effect must succeed
  const nuadhaMoved = await moveCard(state, nuadhaNexusStack.top, 'grave', 'player', {
    cause: 'destroy',
    by: 'opponent',
    sourceCard: opposingSource
  });
  assert.strictEqual(nuadhaMoved, true, 'Contractor Nuadha destruction moveCard should succeed');
  assert(!state.players.player.field.includes(nuadhaNexusStack), 'Contractor Nuadha must be moved off field');

  // 3. Bilijvern itself must NOT be immune from its own Indra-targeting ability
  const bilijvernImmune = isImmune(state, bilijvernStack, opposingSource, 'destroy');
  assert.strictEqual(bilijvernImmune, false, 'Bilijvern itself must not be immune');

  // 4. Regular Spirit must NOT be immune
  const regularImmune = isImmune(state, regularSpiritStack, opposingSource, 'destroy');
  assert.strictEqual(regularImmune, false, 'Regular spirit must not be immune');
});

test('13. Engine execution: Dynamic activated INDESTRUCTIBLE modifier respects target filter', async () => {
  const state = createGameState();

  const indraNexusStack = createFieldStack({
    id: 'BS75-X01',
    name: 'Contractor Indra',
    type: 'Grandwalker Nexus',
    cost: 2,
    level: 1,
    owner: 'player'
  }, { normal: 2, soul: 0 });

  const nuadhaNexusStack = createFieldStack({
    id: 'BS74-X01',
    name: 'Contractor Nuadha',
    type: 'Grandwalker Nexus',
    cost: 2,
    level: 1,
    owner: 'player'
  }, { normal: 2, soul: 0 });

  state.players.player.field = [indraNexusStack, nuadhaNexusStack];

  // Execute INDESTRUCTIBLE operation targeting Contractor Indra
  await executeOp(state, {
    op: 'INDESTRUCTIBLE',
    by: ['OPPOSING_EFFECTS'],
    duration: 'THIS_TURN',
    target: {
      side: 'self',
      types: ['Grandwalker Nexus', 'Nexus'],
      name: 'Contractor Indra'
    }
  }, {
    sourceCard: { id: 'source_spell', name: 'Divine Ward', type: 'Magic', owner: 'player' },
    controller: 'player'
  });

  const opposingSource = { id: 'opp_spell_2', name: 'Deadly Balance', type: 'Magic', owner: 'opponent' };

  // Indra is protected by the dynamic modifier
  assert.strictEqual(isImmune(state, indraNexusStack, opposingSource, 'destroy'), true);

  // Nuadha is NOT protected
  assert.strictEqual(isImmune(state, nuadhaNexusStack, opposingSource, 'destroy'), false);
});
