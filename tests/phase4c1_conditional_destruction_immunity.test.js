/**
 * tests/phase4c1_conditional_destruction_immunity.test.js
 * 
 * Comprehensive Regression & Semantic Fidelity Suite for Phase 4C.1:
 * Conditional Destruction Immunity Compiler Correction (DEF-IMMUNITY-ABS-01).
 * 
 * Verifies:
 * 1. BP-specific immunity blocks destruction by BP comparison.
 * 2. BP-specific immunity does NOT block destruction by opposing effects.
 * 3. Opposing-effect immunity blocks appropriate opposing-effect destruction.
 * 4. Opposing-effect immunity does NOT block BP destruction.
 * 5. Unconditional immunity continues to work against all destruction.
 * 6. Unrelated destruction mechanisms (core depletion, friendly effect) are not blocked.
 * 7. Duration, target, and scope parameters are preserved.
 * 8. Unsupported wording is not silently upgraded to unconditional immunity.
 * 9. Real representative cards from the audit (26RBS02-X13, 26RBS03-036, BS25-028, BS25-037, BS25-020).
 * 10. Complete verification of all 73 affected abilities from Phase 4B.4B.1 ledger.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compileCard } from '../compiler/index.js';
import { createGameState, createFieldStack } from '../engine/state.js';
import { EventBus } from '../engine/events.js';
import { moveCard } from '../engine/zones.js';
import { isImmune } from '../engine/continuous.js';
import { executeOp } from '../engine/ops/index.js';
import { createGame } from '../engine/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createMockCard(id, name, overrides = {}) {
  const bpVal = overrides.bp || 3000;
  return {
    id,
    name,
    card_number: id,
    cardNumber: id,
    type: overrides.type || 'Spirit',
    color: 'Red',
    colors: ['Red'],
    cost: overrides.cost || 3,
    level: 1,
    bp: bpVal,
    owner: overrides.owner || 'player',
    currentOwner: overrides.owner || 'player',
    levels: {
      1: { bp: bpVal, cost: 1 },
      2: { bp: bpVal + 2000, cost: 3 }
    },
    ap: {
      levels: [
        { level: 1, bp: bpVal, cost: 1 },
        { level: 2, bp: bpVal + 2000, cost: 3 }
      ]
    },
    ...overrides
  };
}

// =============================================================================
// SECTION 1: COMPILER SEMANTIC FIDELITY & SCOPE EXTRACTION
// =============================================================================

test('1.1 Compiler correctly parses BP comparison destruction immunity into by: ["BP_COMPARISON"]', () => {
  const card = compileCard({
    id: 'TEST-BP-01',
    name: 'BP Shield Spirit',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by BP comparison.'
  });

  assert.equal(card.abilities.length, 1);
  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['BP_COMPARISON']);
  assert.equal(clause.op.target, 'self');
});

test('1.2 Compiler preserves duration and target on Flash/Spell BP comparison immunity', () => {
  const card = compileCard({
    id: 'TEST-BP-02',
    name: 'BP Defense Flash',
    type: 'Magic',
    effect: 'During this turn, it can\'t be destroyed by BP comparison.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['BP_COMPARISON']);
  assert.equal(clause.op.target, 'target');
  assert.equal(clause.op.duration, 'THIS_TURN');
});

test('1.3 Compiler correctly parses opposing-effect destruction immunity into by: ["OPPOSING_EFFECTS"]', () => {
  const card = compileCard({
    id: 'TEST-OPP-01',
    name: 'Ward Spirit',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by opposing effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['OPPOSING_EFFECTS']);
  assert.equal(clause.op.target, 'self');
});

test('1.4 Compiler extracts specific card type destruction sources (Spirit/Nexus/Magic)', () => {
  const card = compileCard({
    id: 'TEST-SPECIFIC-01',
    name: 'Triple Ward Nexus',
    type: 'Nexus',
    effect: 'All your Nexuses can\'t be destroyed by opposing Spirit/Nexus/Magic effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['OPPOSING_SPIRITS', 'OPPOSING_NEXUSES', 'OPPOSING_MAGIC']);
  assert.deepEqual(clause.op.target, { side: 'self', types: ['Nexus'] });
});

test('1.5 Compiler distinguishes general effects immunity (by: ["EFFECTS"]) from opposing effects', () => {
  const card = compileCard({
    id: 'TEST-EFF-01',
    name: 'Total Effect Ward',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['EFFECTS']);
});

test('1.6 Compiler preserves genuinely unconditional destruction immunity as by: ["ALL"]', () => {
  const card = compileCard({
    id: 'TEST-UNCOND-01',
    name: 'Absolute Bastion',
    type: 'Nexus',
    effect: 'This Nexus can\'t be destroyed.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['ALL']);
});

test('1.7 Compiler emits UNSUPPORTED for unhandled/ambiguous destruction causes rather than broad immunity', () => {
  const card = compileCard({
    id: 'TEST-UNSUPPORTED-01',
    name: 'Weird Ward',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by cosmic anomalies.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'UNSUPPORTED');
  assert.match(clause.op.reason, /UNSUPPORTED_DESTRUCTION_CAUSE: cosmic anomalies/);
});

// =============================================================================
// SECTION 2: ENGINE RESOLUTION & DESTRUCTION DISCRIMINATION
// =============================================================================

test('2.1 BP-specific immunity blocks destruction in battle BP comparison', async () => {
  const game = createGame();
  const state = game.state;
  const events = game.events;

  // Attacker: BP 8000
  const attackerCard = createMockCard('ATK-01', 'Attacking Dragon', { bp: 8000, owner: 'opponent' });
  const attackerStack = createFieldStack(attackerCard, { normal: 2, soul: 0 });
  state.players.opponent.field = [attackerStack];

  // Blocker: BP 3000, but has passive INDESTRUCTIBLE by: ['BP_COMPARISON']
  const blockerCard = createMockCard('BLK-01', 'Defending Knight', {
    bp: 3000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1, 2] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['BP_COMPARISON'], target: 'self' }
        }]
      }]
    }
  });
  const blockerStack = createFieldStack(blockerCard, { normal: 1, soul: 0 });
  state.players.player.field = [blockerStack];

  // Set up combat
  state.combat = {
    attackerStackId: attackerStack.id,
    targetType: 'player'
  };

  // Declare block and resolve battle
  await game.declareBlock(blockerStack.id, 'player');

  // Blocker had lower BP (3000 vs 8000) but MUST NOT be destroyed
  assert.equal(state.players.player.field.length, 1, 'Blocker must remain on field due to BP_COMPARISON immunity');
  assert.equal(state.players.player.field[0].top.id, 'BLK-01');
  assert.equal(state.players.player.grave.length, 0, 'Blocker must not be in graveyard');

  // Also test direct moveCard with cause: 'battle'
  const movedBattle = await moveCard(state, blockerCard, 'grave', 'player', { cause: 'battle' }, events);
  assert.equal(movedBattle, false, 'Direct moveCard with cause: battle must be blocked');
});

test('2.2 BP-specific immunity does NOT block destruction by opposing card effects', async () => {
  const state = createGameState();
  const events = new EventBus();

  // Target spirit with BP_COMPARISON immunity
  const targetCard = createMockCard('TARGET-01', 'BP Shield Spirit', {
    bp: 3000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['BP_COMPARISON'], target: 'self' }
        }]
      }]
    }
  });
  const targetStack = createFieldStack(targetCard, { normal: 1, soul: 0 });
  state.players.player.field = [targetStack];

  // Opposing destroy effect
  const sourceCard = createMockCard('OPP-SPELL-01', 'Opposing Thunder', { owner: 'opponent' });
  const isImm = isImmune(state, targetStack, sourceCard, 'destroy');
  assert.equal(isImm, false, 'Target must NOT be immune to effect destruction');

  // Attempt moveCard with cause: 'destroy'
  const moved = await moveCard(state, targetCard, 'grave', 'player', { cause: 'destroy', by: 'opponent', sourceCard }, events);
  assert.equal(moved, true, 'Card must be successfully moved to grave');
  assert.equal(state.players.player.field.length, 0, 'Card must leave field');
  assert.equal(state.players.player.grave.length, 1, 'Card must enter graveyard');
});

test('2.3 Opposing-effect immunity blocks opposing destroy effect', async () => {
  const state = createGameState();
  const events = new EventBus();

  const targetCard = createMockCard('WARD-01', 'Ward Spirit', {
    bp: 3000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['OPPOSING_EFFECTS'], target: 'self' }
        }]
      }]
    }
  });
  const targetStack = createFieldStack(targetCard, { normal: 1, soul: 0 });
  state.players.player.field = [targetStack];

  const sourceCard = createMockCard('OPP-SPELL-02', 'Opposing Blast', { owner: 'opponent' });
  const isImm = isImmune(state, targetStack, sourceCard, 'destroy');
  assert.equal(isImm, true, 'Target must be immune to opposing destruction');

  const moved = await moveCard(state, targetCard, 'grave', 'player', { cause: 'destroy', by: 'opponent', sourceCard }, events);
  assert.equal(moved, false, 'Card movement must be blocked by OPPOSING_EFFECTS immunity');
  assert.equal(state.players.player.field.length, 1, 'Card must stay on field');
  assert.equal(state.players.player.grave.length, 0, 'Card must not enter grave');
});

test('2.4 Opposing-effect immunity does NOT block BP battle destruction', async () => {
  const game = createGame();
  const state = game.state;
  const events = game.events;

  // Attacker: BP 9000
  const attackerCard = createMockCard('ATK-02', 'Strong Attacker', { bp: 9000, owner: 'opponent' });
  const attackerStack = createFieldStack(attackerCard, { normal: 2, soul: 0 });
  state.players.opponent.field = [attackerStack];

  // Blocker: BP 2000, has OPPOSING_EFFECTS immunity
  const blockerCard = createMockCard('BLK-02', 'Ward Blocker', {
    bp: 2000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['OPPOSING_EFFECTS'], target: 'self' }
        }]
      }]
    }
  });
  const blockerStack = createFieldStack(blockerCard, { normal: 1, soul: 0 });
  state.players.player.field = [blockerStack];

  state.combat = {
    attackerStackId: attackerStack.id,
    targetType: 'player'
  };

  await game.declareBlock(blockerStack.id, 'player');

  // Blocker must be destroyed because battle destruction is NOT an opposing effect!
  assert.equal(state.players.player.field.length, 0, 'Blocker must be destroyed in battle despite opposing-effects immunity');
  assert.equal(state.players.player.grave.length, 1, 'Blocker must be in grave');
});

test('2.5 Opposing-effect immunity does NOT block friendly sacrifice/destruction', async () => {
  const state = createGameState();
  const events = new EventBus();

  const targetCard = createMockCard('WARD-02', 'Sacrifice Target', {
    bp: 3000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['OPPOSING_EFFECTS'], target: 'self' }
        }]
      }]
    }
  });
  const targetStack = createFieldStack(targetCard, { normal: 1, soul: 0 });
  state.players.player.field = [targetStack];

  const friendlyCard = createMockCard('SACRIFICE-SPELL', 'Friendly Tribute', { owner: 'player' });
  // Destroy by friendly player
  const moved = await moveCard(state, targetCard, 'grave', 'player', { cause: 'destroy', by: 'player', sourceCard: friendlyCard }, events);
  assert.equal(moved, true, 'Friendly destruction must NOT be blocked by OPPOSING_EFFECTS immunity');
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.grave.length, 1);
});

test('2.6 Unconditional immunity (by: ["ALL"]) blocks both battle and effect destruction', async () => {
  const state = createGameState();
  const events = new EventBus();

  const godCard = createMockCard('GOD-01', 'Invincible Bastion', {
    bp: 1000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['ALL'], target: 'self' }
        }]
      }]
    }
  });
  const godStack = createFieldStack(godCard, { normal: 1, soul: 0 });
  state.players.player.field = [godStack];

  // 1. Test effect destruction blocked
  const movedEffect = await moveCard(state, godCard, 'grave', 'player', { cause: 'destroy', by: 'opponent' }, events);
  assert.equal(movedEffect, false, 'Effect destruction must be blocked');

  // 2. Test battle destruction blocked
  const movedBattle = await moveCard(state, godCard, 'grave', 'player', { cause: 'battle', by: 'opponent' }, events);
  assert.equal(movedBattle, false, 'Battle destruction must be blocked');

  assert.equal(state.players.player.field.length, 1, 'Card must remain on field');
});

test('2.7 Indestructible cards are still depleted to grave when cores reach 0', async () => {
  const state = createGameState();
  const events = new EventBus();

  const godCard = createMockCard('GOD-02', 'Invincible Spirit', {
    bp: 5000,
    owner: 'player',
    compiledIr: {
      abilities: [{
        header: { timing: 'PASSIVE', levels: [1] },
        clauses: [{
          op: { op: 'INDESTRUCTIBLE', by: ['ALL'], target: 'self' }
        }]
      }]
    }
  });
  const godStack = createFieldStack(godCard, { normal: 0, soul: 0 }); // 0 cores = depletion
  state.players.player.field = [godStack];

  // Core depletion moveCard
  const moved = await moveCard(state, godCard, 'grave', 'player', { cause: 'depletion' }, events);
  assert.equal(moved, true, 'Core depletion must NOT be blocked by INDESTRUCTIBLE');
  assert.equal(state.players.player.field.length, 0);
  assert.equal(state.players.player.grave.length, 1);
});

test('2.8 Dynamic activated INDESTRUCTIBLE modifier in engine/ops/index.js works as expected', async () => {
  const state = createGameState();
  const events = new EventBus();

  const targetCard = createMockCard('BUFF-01', 'Knight', { bp: 3000, owner: 'player' });
  const targetStack = createFieldStack(targetCard, { normal: 1, soul: 0 });
  state.players.player.field = [targetStack];

  // Execute operation: INDESTRUCTIBLE with by: ['BP_COMPARISON']
  const opRes = await executeOp(state, {
    op: 'INDESTRUCTIBLE',
    target: 'self',
    targetStackId: targetStack.id,
    by: ['BP_COMPARISON'],
    duration: 'THIS_TURN'
  }, { controller: 'player', sourceStack: targetStack });

  assert.equal(opRes.success, true);
  assert.equal(state.modifiers.length, 1);
  assert.equal(state.modifiers[0].type, 'INDESTRUCTIBLE');
  assert.deepEqual(state.modifiers[0].by, ['BP_COMPARISON']);

  // Move via battle -> blocked
  const movedBattle = await moveCard(state, targetCard, 'grave', 'player', { cause: 'battle' }, events);
  assert.equal(movedBattle, false, 'Dynamic modifier must block battle destruction');

  // Move via opposing destroy -> NOT blocked
  const movedEffect = await moveCard(state, targetCard, 'grave', 'player', { cause: 'destroy', by: 'opponent' }, events);
  assert.equal(movedEffect, true, 'Dynamic BP modifier must NOT block effect destruction');
});

// =============================================================================
// SECTION 3: VALIDATION AGAINST REAL REPRESENTATIVE CARDS
// =============================================================================

test('3.1 26RBS02-X13 (The Puppeteer Marinel) compiles with BP_COMPARISON immunity', () => {
  const card = compileCard({
    id: '26RBS02-X13',
    name: 'The Puppeteer Marinel',
    type: 'Magic',
    effect: 'Target one of your Cost 6 or less Spirits. During this turn, it can\'t be destroyed by BP comparison.'
  });

  const clauses = card.abilities[0].clauses;
  const destructClause = clauses.find(c => c.op?.op === 'INDESTRUCTIBLE');
  assert.ok(destructClause, 'Must emit INDESTRUCTIBLE clause');
  assert.deepEqual(destructClause.op.by, ['BP_COMPARISON']);
  assert.equal(destructClause.op.duration, 'THIS_TURN');
});

test('3.2 26RBS03-036 (The ShieldBearer Lasslake) compiles with BP_COMPARISON in battle', () => {
  const card = compileCard({
    id: '26RBS03-036',
    name: 'The ShieldBearer Lasslake',
    type: 'Spirit',
    effect: 'During this battle, this Spirit can\'t be destroyed by BP comparison.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['BP_COMPARISON']);
  assert.equal(clause.op.duration, 'THIS_BATTLE');
});

test('3.3 BS25-028 (The Survivor Ullr-Defender) compiles with OPPOSING_EFFECTS immunity', () => {
  const card = compileCard({
    id: 'BS25-028',
    name: 'The Survivor Ullr-Defender',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by opposing effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['OPPOSING_EFFECTS']);
});

test('3.4 BS25-037 (The SurvivorAngelia Mael) compiles with OPPOSING_EFFECTS immunity', () => {
  const card = compileCard({
    id: 'BS25-037',
    name: 'The SurvivorAngelia Mael',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by opposing effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['OPPOSING_EFFECTS']);
});

test('3.5 BS25-020 (The Survivor Fugue) compiles with OPPOSING_EFFECTS immunity', () => {
  const card = compileCard({
    id: 'BS25-020',
    name: 'The Survivor Fugue',
    type: 'Spirit',
    effect: 'This Spirit can\'t be destroyed by opposing effects.'
  });

  const clause = card.abilities[0].clauses[0];
  assert.equal(clause.op.op, 'INDESTRUCTIBLE');
  assert.deepEqual(clause.op.by, ['OPPOSING_EFFECTS']);
});

// =============================================================================
// SECTION 4: FULL RE-EVALUATION OF ALL 73 DEFECTIVE ABILITIES
// =============================================================================

test('4.1 All 73 affected abilities from Phase 4B.4B.1 compile with precise conditional scope', () => {
  const abilitiesPath = path.join(__dirname, '..', 'scratch', 'def_immunity_73_abilities.json');
  const abilities = JSON.parse(fs.readFileSync(abilitiesPath, 'utf8'));

  assert.equal(abilities.length, 73, 'Must evaluate exactly 73 abilities');

  for (const item of abilities) {
    const compiled = compileCard({
      id: item.cardNumber,
      name: item.cardName,
      type: 'Spirit',
      effect: item.originalText,
      skipOverride: true
    });

    const ops = [];
    for (const ab of compiled.abilities || []) {
      for (const cl of ab.clauses || []) {
        if (cl.op?.op === 'INDESTRUCTIBLE') ops.push(cl.op);
      }
    }

    assert.ok(ops.length > 0, `Card ${item.cardNumber} must compile at least one INDESTRUCTIBLE op`);
    for (const op of ops) {
      assert.ok(Array.isArray(op.by), `Op on ${item.cardNumber} must have an array 'by' property`);
      assert.ok(op.by.length > 0, `Op on ${item.cardNumber} must specify at least one cause in 'by'`);
      // None of the 73 should be unconditionally ALL
      assert.ok(!op.by.includes('ALL'), `Card ${item.cardNumber} was conditional and must NOT be compiled as ALL`);
    }
  }
});
