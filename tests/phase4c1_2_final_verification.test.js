/**
 * tests/phase4c1_2_final_verification.test.js
 *
 * Phase 4C.1.2 Final Semantic Verification Suite:
 * 1. BS76-063#a2 EXHAUST target is strictly 'self' (source card), not opponent Nexus
 * 2. Engine test: BS76-063#a2 exhausts controller's nexus and NEVER exhausts opponent's nexus
 * 3. BS74-064#a2 clause 2 is classified as UNSUPPORTED unpreventable effect, not bogus COMBAT_RESTRICTION
 * 4. Target categories reconcile to exactly 73 mutually exclusive entries
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileCard } from '../compiler/index.js';
import { createGameState, createFieldStack } from '../engine/state.js';
import { executeOp } from '../engine/ops/index.js';
import { isImmune } from '../engine/continuous.js';

const ability73List = JSON.parse(fs.readFileSync('scratch/def_immunity_73_abilities.json', 'utf8'));

// ---------------------------------------------------------------------------
// 1. BS76-063#a2 — EXHAUST Target Verification
// ---------------------------------------------------------------------------

test('1. BS76-063#a2 compiles EXHAUST clause with target: self, NOT opp Nexus', () => {
  const item = ability73List.find(x => x.abilityId === 'BS76-063#a2');
  assert.ok(item, 'BS76-063#a2 exists in dataset');

  const compiled = compileCard({
    id: item.cardNumber,
    name: item.cardName,
    type: 'Nexus',
    effect: item.originalText,
    skipOverride: true
  });

  const ab = compiled.abilities?.[0];
  assert.ok(ab, 'Compiled ability exists');

  const exhaustClause = ab.clauses.find(c => c.op?.op === 'EXHAUST');
  assert.ok(exhaustClause, 'Must contain EXHAUST clause');
  assert.strictEqual(exhaustClause.op.target, 'self', 'Target must be strictly "self"');
  assert.notStrictEqual(exhaustClause.op.target?.side, 'opp', 'Target must NOT be opponent');

  const indClause = ab.clauses.find(c => c.op?.op === 'INDESTRUCTIBLE');
  assert.ok(indClause, 'Must contain INDESTRUCTIBLE clause');
  assert.deepStrictEqual(indClause.op.target, {
    side: 'self',
    types: ['Grandwalker Nexus', 'Nexus'],
    name: 'Contractor Brigit'
  });
});

test('2. Engine execution: BS76-063#a2 exhausts controller nexus and leaves opponent nexus untouched', async () => {
  const state = createGameState();

  // Controller's SilverRingBlade Twinwheel Nexus (refreshed)
  const friendlyTwinwheelStack = createFieldStack({
    id: 'BS76-063',
    name: 'The SilverRingBlade Twinwheel',
    type: 'Nexus',
    cost: 3,
    level: 1,
    owner: 'player'
  }, { normal: 1, soul: 0 });

  // Opponent's Nexus (refreshed)
  const oppNexusStack = createFieldStack({
    id: 'opp_nexus_1',
    name: 'Temple of the Sun',
    type: 'Nexus',
    cost: 3,
    level: 1,
    owner: 'opponent'
  }, { normal: 1, soul: 0 });

  state.players.player.field = [friendlyTwinwheelStack];
  state.players.opponent.field = [oppNexusStack];

  assert.strictEqual(friendlyTwinwheelStack.state, 'REFRESHED');
  assert.strictEqual(oppNexusStack.state, 'REFRESHED');

  // Execute the EXHAUST cost of BS76-063#a2
  const result = await executeOp(state, {
    op: 'EXHAUST',
    target: 'self'
  }, {
    sourceCard: friendlyTwinwheelStack.top,
    sourceStack: friendlyTwinwheelStack,
    controller: 'player'
  });

  assert.strictEqual(result.success, true, 'EXHAUST op execution succeeded');

  // Assert: Friendly Twinwheel is now EXHAUSTED
  assert.strictEqual(friendlyTwinwheelStack.state, 'EXHAUSTED', 'Friendly Twinwheel must be exhausted by cost');

  // Assert: Opponent Nexus MUST REMAIN REFRESHED
  assert.strictEqual(oppNexusStack.state, 'REFRESHED', 'Opponent Nexus must NOT be exhausted by friendly cost');
});

// ---------------------------------------------------------------------------
// 2. BS74-064#a2 — COMBAT_RESTRICTION vs UNSUPPORTED Unpreventable Effect
// ---------------------------------------------------------------------------

test('3. BS74-064#a2 clause 2 compiles as UNSUPPORTED unpreventable effect, not COMBAT_RESTRICTION', () => {
  const item = ability73List.find(x => x.abilityId === 'BS74-064#a2');
  assert.ok(item, 'BS74-064#a2 exists in dataset');

  const compiled = compileCard({
    id: item.cardNumber,
    name: item.cardName,
    type: 'Spirit',
    effect: item.originalText,
    skipOverride: true
  });

  const ab = compiled.abilities?.[0];
  assert.ok(ab, 'Compiled ability exists');

  // Clause 1: INDESTRUCTIBLE targeting Contractor Nuadha
  const indClause = ab.clauses.find(c => c.op?.op === 'INDESTRUCTIBLE');
  assert.ok(indClause, 'Must contain INDESTRUCTIBLE clause');
  assert.deepStrictEqual(indClause.op.target, {
    side: 'self',
    types: ['Grandwalker Nexus', 'Nexus'],
    name: 'Contractor Nuadha'
  });
  assert.deepStrictEqual(indClause.op.by, ['OPPOSING_EFFECTS']);

  // Clause 2: Unpreventable effect must NOT be bogus COMBAT_RESTRICTION
  const combatRest = ab.clauses.find(c => c.op?.op === 'COMBAT_RESTRICTION');
  assert.strictEqual(combatRest, undefined, 'Must NOT compile to bogus COMBAT_RESTRICTION');

  const unsuppClause = ab.clauses.find(c => c.op?.op === 'UNSUPPORTED');
  assert.ok(unsuppClause, 'Must compile unpreventable effect as UNSUPPORTED');
  assert.ok(unsuppClause.op.reason.includes('UNSUPPORTED_EFFECT_PROTECTION'), 'Reason must document unpreventable effects');
});

// ---------------------------------------------------------------------------
// 3. Mutually Exclusive Target Categories Reconcile to Exactly 73
// ---------------------------------------------------------------------------

test('4. All 73 abilities partition into mutually exclusive categories summing to exactly 73', () => {
  const counts = {
    source_self: 0,
    named_grandwalker: 0,
    family_spirits: 0,
    named_spirits_allied: 0,
    targeted_individual: 0,
    complex_exclusion: 0
  };

  for (const item of ability73List) {
    const compiled = compileCard({
      id: item.cardNumber,
      name: item.cardName,
      type: 'Spirit',
      effect: item.originalText,
      skipOverride: true
    });
    const ab = compiled.abilities?.[0];
    const indOp = ab?.clauses?.find(c => c.op?.op === 'INDESTRUCTIBLE')?.op;
    const tgt = indOp?.target;

    if (tgt === 'self') {
      counts.source_self++;
    } else if (tgt === 'target') {
      counts.targeted_individual++;
    } else if (tgt && typeof tgt === 'object') {
      if (tgt.excludeNames) {
        counts.complex_exclusion++;
      } else if (tgt.types?.includes('Grandwalker Nexus') && tgt.name) {
        counts.named_grandwalker++;
      } else if (tgt.includeSelf || tgt.names || (tgt.name && tgt.types?.includes('Spirit'))) {
        counts.named_spirits_allied++;
      } else if (tgt.family || tgt.families) {
        counts.family_spirits++;
      } else {
        assert.fail(`Unclassified object target in ${item.abilityId}: ${JSON.stringify(tgt)}`);
      }
    } else {
      assert.fail(`Unclassified non-object target in ${item.abilityId}: ${tgt}`);
    }
  }

  assert.strictEqual(counts.source_self, 57, 'Source Self count must be exactly 57');
  assert.strictEqual(counts.named_grandwalker, 4, 'Named Grandwalker count must be exactly 4');
  assert.strictEqual(counts.family_spirits, 7, 'Family spirits count must be exactly 7');
  assert.strictEqual(counts.named_spirits_allied, 3, 'Named spirits / allied groups count must be exactly 3');
  assert.strictEqual(counts.targeted_individual, 1, 'Targeted individual count must be exactly 1');
  assert.strictEqual(counts.complex_exclusion, 1, 'Complex exclusion count must be exactly 1');

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 73, 'Sum of categories must equal exactly 73');
});
