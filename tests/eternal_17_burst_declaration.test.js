import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { TimingWindowManager } from '../engine/windows.js';
import { createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';

test('Eternal 17.0 Burst Declaration - Non-turn player declares first, resolves FIFO', async () => {
  resetInstanceIdCounter();
  const declarationOrder = [];
  const resolutionOrder = [];

  const game = createGame({
    firstPlayer: 'player',
    promptResolver: {
      choose: async (prompt) => {
        if (prompt.type === 'BURST_TRIGGER') {
          declarationOrder.push(prompt.chooser);
          return { activate: true };
        }
        return null;
      }
    }
  });

  game.state.activePlayer = 'player'; // Turn player is 'player', Non-turn player is 'opponent'

  // Player sets Burst A
  const burstPlayer = createCardInstance({
    name: 'Player Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_SPIRIT_DESTROYED' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');
  game.state.players.player.burst = burstPlayer;

  // Opponent sets Burst B
  const burstOpponent = createCardInstance({
    name: 'Opponent Burst',
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_SPIRIT_DESTROYED' },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'opponent');
  game.state.players.opponent.burst = burstOpponent;

  // Track resolution events
  game.events.on('BURST_ACTIVATED', (e) => {
    resolutionOrder.push(e.player);
  });

  const windows = new TimingWindowManager(game);

  // Trigger event: both spirits destroyed simultaneously in battle
  const triggerEvent = {
    type: 'DESTROYED',
    cause: 'battle'
  };

  await windows.openBurstWindow(triggerEvent);

  // 17.0 Rule: Non-turn player ('opponent') MUST declare first, followed by turn player ('player')
  assert.deepEqual(declarationOrder, ['opponent', 'player']);

  // Resolution is FIFO based on declaration order: Non-turn player resolves first!
  assert.deepEqual(resolutionOrder, ['opponent', 'player']);
});

test('Eternal 17.0 Flash Window - Defending player always gets first priority in both Flash 1 and Flash 2', async () => {
  resetInstanceIdCounter();
  const game = createGame();
  game.state.activePlayer = 'player'; // Attacker = player, Defender = opponent
  const windows = new TimingWindowManager(game);

  let firstPriorityCaptured = [];
  game.events.on('FLASH_WINDOW_OPEN', (e) => {
    firstPriorityCaptured.push(e.firstPriority);
  });

  // Prompt resolver passes immediately
  game.resolver.promptResolver = {
    choose: async () => ({ action: 'PASS' })
  };

  await windows.runFlashWindow('FLASH_1');
  await windows.runFlashWindow('FLASH_2');

  // Both Flash 1 and Flash 2 must grant first priority to defending player ('opponent')
  assert.equal(firstPriorityCaptured[0], 'opponent');
  assert.equal(firstPriorityCaptured[1], 'opponent');
});
