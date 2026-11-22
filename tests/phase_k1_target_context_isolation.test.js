import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeOp } from '../engine/ops/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';

function createMockState() {
  return {
    players: {
      player: {
        field: [],
        hand: [],
        grave: [],
        deck: [],
        removed: [],
        revealed: [],
        nexus: [],
        burst: null,
        reserve: { normal: 6, soul: 1 },
        trash: { normal: 0, soul: 0 }
      },
      opponent: {
        field: [],
        hand: [],
        grave: [],
        deck: [],
        removed: [],
        revealed: [],
        nexus: [],
        burst: null,
        reserve: { normal: 6, soul: 1 },
        trash: { normal: 0, soul: 0 }
      }
    },
    revealedCards: []
  };
}

describe('Phase K.1 Work Package H: Targeting Context Isolation Battery', () => {

  it('1. Explicit source zone is never contaminated by preceding reveal', async () => {
    const state = createMockState();
    const trashCard = { id: 'TRASH_RECOVER', name: 'Grave Fiend', type: 'Spirit', cost: 1, colors: ['Purple'], owner: 'player' };
    const revCard = { id: 'REVEALED_FOIL', name: 'Scryed Card', type: 'Spirit', cost: 1, colors: ['Purple'], owner: 'player' };

    state.players.player.grave.push(trashCard);
    state.players.player.revealed.push(revCard);

    // Sequential operations simulation:
    // Op 1: REVEAL
    const ctx = {
      controller: 'player',
      revealedCards: [revCard]
    };

    // Op 2: SALVAGE with explicit from: GRAVE
    const op = {
      op: 'SALVAGE',
      from: 'GRAVE',
      count: 1,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, ctx, new DefaultPromptResolver(), null);
    assert.equal(res.success, true);
    assert.equal(res.cards[0].id, 'TRASH_RECOVER', 'Must pull from GRAVE, not from revealedCards in context');
  });

  it('2. Unrelated operation does not accidentally inherit previous_target without PREVIOUS_TARGET opcode', async () => {
    const state = createMockState();
    const targetA = { id: 'TARGET_A', name: 'First Enemy', type: 'Spirit', cost: 2, colors: ['Red'], owner: 'opponent' };
    const targetB = { id: 'TARGET_B', name: 'Second Enemy', type: 'Spirit', cost: 2, colors: ['Red'], owner: 'opponent' };

    state.players.opponent.field.push({ id: 'st_A', top: targetA, cores: { normal: 1, soul: 0 }, owner: 'opponent' });
    state.players.opponent.field.push({ id: 'st_B', top: targetB, cores: { normal: 1, soul: 0 }, owner: 'opponent' });

    // Context has previousTarget set to targetA
    const ctx = {
      controller: 'player',
      previousTarget: targetA,
      selectedTargets: [{ stack: state.players.opponent.field[0], card: targetA, side: 'opponent', zone: 'field' }]
    };

    // New operation specifies fresh target filter without PREVIOUS_TARGET
    const op = {
      op: 'DESTROY',
      target: {
        side: 'opp',
        types: ['Spirit'],
        filter: { nameIncludes: 'Second' }
      }
    };

    const res = await executeOp(state, op, ctx, new DefaultPromptResolver(), null);
    assert.equal(res.success, true);
    assert.equal(res.cards[0].id, 'TARGET_B', 'Must destroy target matching new filter, ignoring unrelated previousTarget');
  });

  it('3. Optional targeting declined clears targeting context', async () => {
    // PromptResolver that declines optional clause
    const promptResolver = {
      async choose() {
        return { declined: true, selected: [] };
      }
    };
    const resolver = new AsyncResolver(promptResolver);
    const state = createMockState();

    const abilityContext = {
      controller: 'player',
      previousTarget: { id: 'OLD_TARGET' },
      previousTargets: [{ id: 'OLD_TARGET' }],
      selectedTargets: [{ id: 'OLD_TARGET' }]
    };

    const dummyAbility = {
      id: 'ab_optional',
      clauses: [
        {
          op: { op: 'DESTROY', optional: true, target: { side: 'opp', types: ['Spirit'] } }
        }
      ]
    };

    await resolver.resolveAbility(state, dummyAbility, abilityContext, null);

    assert.equal(abilityContext.previousTarget, null, 'Declined optional targeting must clear previousTarget');
    assert.deepEqual(abilityContext.previousTargets, [], 'Declined optional targeting must clear previousTargets');
    assert.deepEqual(abilityContext.selectedTargets, [], 'Declined optional targeting must clear selectedTargets');
  });

  it('4. Rechecks card physical location before mutation: prevents ghost mutations', async () => {
    const state = createMockState();
    const spirit = { id: 'GHOST_CAND', name: 'Phantom', type: 'Spirit', cost: 1, colors: ['White'], owner: 'opponent' };
    const stack = { id: 'st_phantom', top: spirit, cores: { normal: 1, soul: 0 }, owner: 'opponent' };
    state.players.opponent.field.push(stack);

    const ctx = { controller: 'player' };

    // PromptResolver that changes the card location right before answering
    const promptResolver = {
      async choose({ candidates }) {
        // Banish spirit from field to grave
        state.players.opponent.field = [];
        state.players.opponent.grave.push(spirit);
        return [candidates[0]];
      }
    };

    const op = {
      op: 'DESTROY',
      target: { side: 'opp', types: ['Spirit'] }
    };

    const res = await executeOp(state, op, ctx, promptResolver, null);
    assert.equal(res.success, false, 'Must fail when card left the field before mutation');
    assert.equal(res.destroyedCount, 0, 'No destroyed cards recorded');
  });
});
