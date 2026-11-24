import test from 'node:test';
import assert from 'node:assert/strict';
import { canBlock } from '../engine/continuous.js';
import { createGameState } from '../engine/state.js';
import { createGame } from '../engine/index.js';

function makeStack(id, owner, topCard, braves = []) {
  return {
    id,
    owner,
    top: topCard,
    braves,
    cores: { normal: 1, soul: false },
    state: 'REFRESHED',
    modifiers: []
  };
}

test('Standalone Brave blocking rules', async t => {
  await t.test('Un-braved Brave without exception cannot block', () => {
    const state = createGameState();
    const brave = makeStack('b1', 'opponent', {
      id: 'c_brave_1',
      name: 'Standard Brave',
      type: 'Brave',
      cost: 4,
      levels: { 1: { level: 1, cost: 1, bp: 3000 } },
      effect: '[Brave Condition: Cost 3 or more]\n[During Brave] +3000 BP.'
    });
    state.players.opponent.field.push(brave);

    assert.equal(canBlock(state, brave), false);
  });

  await t.test('Un-braved Brave with [During Brave] block text still cannot block while un-braved', () => {
    const state = createGameState();
    const brave = makeStack('b2', 'opponent', {
      id: 'c_brave_2',
      name: 'Gun-Horse',
      type: 'Brave',
      cost: 4,
      levels: { 1: { level: 1, cost: 1, bp: 4000 } },
      effect: '[Brave Condition: Cost 6 or more]\n[When Braved] (Opposing Attack Step) This Spirit can block opposing Spirits without [Tribute] while exhausted.'
    });
    state.players.opponent.field.push(brave);

    assert.equal(canBlock(state, brave), false);
  });

  await t.test('Un-braved Brave WITH explicit card text permission CAN block', () => {
    const state = createGameState();
    const brave = makeStack('b3', 'opponent', {
      id: 'c_brave_3',
      name: 'Shield Brave',
      type: 'Brave',
      cost: 3,
      levels: { 1: { level: 1, cost: 1, bp: 4000 } },
      effect: 'This Brave in Spirit condition can block.'
    });
    const brave2 = makeStack('b4', 'opponent', {
      id: 'c_brave_4',
      name: 'Guardian Brave',
      type: 'Brave',
      cost: 3,
      levels: { 1: { level: 1, cost: 1, bp: 4000 } },
      effect: 'This Brave can block even when not braved.'
    });
    state.players.opponent.field.push(brave, brave2);

    assert.equal(canBlock(state, brave), true);
    assert.equal(canBlock(state, brave2), true);
  });

  await t.test('Brave that IS braved with a Spirit CAN block', () => {
    const state = createGameState();
    const bravedSpirit = makeStack(
      's1',
      'opponent',
      {
        id: 'c_spirit_1',
        name: 'Knight Spirit',
        type: 'Spirit',
        cost: 4,
        levels: { 1: { level: 1, cost: 1, bp: 4000 } },
        effect: ''
      },
      [
        {
          id: 'c_brave_1',
          name: 'Standard Brave',
          type: 'Brave',
          cost: 4,
          levels: { 1: { level: 1, cost: 1, bp: 3000 } },
          effect: '[During Brave] +3000 BP.'
        }
      ]
    );
    state.players.opponent.field.push(bravedSpirit);

    assert.equal(canBlock(state, bravedSpirit), true);
  });

  await t.test('engine.declareBlock rejects un-braved Brave with CANNOT_BLOCK during combat', async () => {
    const game = createGame();
    const { state } = game;
    state.phase = 'ATTACK_STEP';
    state.activePlayer = 'player';
    state.combat = {
      attackerSide: 'player',
      defenderSide: 'opponent',
      attackerStackId: 'atk1',
      blockerStackId: null,
      step: 'BLOCK_DECLARATION'
    };
    const attacker = makeStack('atk1', 'player', {
      id: 'c_atk',
      name: 'Attacker Spirit',
      type: 'Spirit',
      cost: 3,
      levels: { 1: { level: 1, cost: 1, bp: 3000 } },
      effect: ''
    });
    attacker.state = 'EXHAUSTED';
    const unbravedBrave = makeStack('blk_brave', 'opponent', {
      id: 'c_brave',
      name: 'Unbraved Blade',
      type: 'Brave',
      cost: 4,
      levels: { 1: { level: 1, cost: 1, bp: 4000 } },
      effect: '[During Brave] +3000 BP.'
    });
    state.players.player.field.push(attacker);
    state.players.opponent.field.push(unbravedBrave);

    const res = await game.declareBlock('blk_brave', 'opponent', { _fromAuthority: true });
    assert.equal(res.success, false);
    assert.equal(res.reason, 'CANNOT_BLOCK');
  });
});
