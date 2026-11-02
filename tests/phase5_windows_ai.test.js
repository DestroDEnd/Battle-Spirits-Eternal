import test from 'node:test';
import assert from 'node:assert/strict';
import { PromptManager } from '../engine/prompt_manager.js';
import { TimingWindowManager } from '../engine/windows.js';
import { AIDecider } from '../engine/ai.js';
import { setupOpeningHands } from '../engine/mulligan.js';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

test('Phase 5 - PromptManager handles async promise request and resolution', async () => {
  const pm = new PromptManager();

  const promise = pm.request({
    type: 'CONFIRM_OPTIONAL',
    title: 'Activate effect?',
    chooser: 'player'
  });

  assert.equal(pm.hasPendingPrompt('player'), true);
  const active = pm.getActivePrompt();
  assert.ok(active);
  assert.equal(active.type, 'CONFIRM_OPTIONAL');

  // Resolve asynchronously
  setTimeout(() => {
    pm.resolve(active.id, { accepted: true });
  }, 10);

  const res = await promise;
  assert.deepEqual(res, { accepted: true });
  assert.equal(pm.hasPendingPrompt(), false);
});

test('Phase 5 - Burst Window: R20 Sacrifice does NOT trigger Burgu-Hearts', async () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);

  // Player sets Burgu-Hearts (Burst: After your spirit is destroyed by the opponent)
  const burguHearts = createCardInstance({
    name: 'Burgu-Hearts',
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT' },
          clauses: [{ op: { op: 'DRAW', count: 2 } }]
        }
      ]
    }
  }, 'player');
  game.state.players.player.burst = burguHearts;

  // Event: Player's own spirit was destroyed by sacrifice (by: 'player', not 'opponent')
  const ownSpirit = createCardInstance({ name: 'Sacrificed Unit' }, 'player');
  const sacrificeEvent = {
    type: 'DESTROYED',
    card: ownSpirit,
    fromSide: 'player',
    by: 'player',
    cause: 'cost_payment'
  };

  const matches = windows.matchesBurstCondition(burguHearts, sacrificeEvent, 'player');
  assert.equal(matches, false, 'Burgu-Hearts must not match self-sacrifice destruction');
});

test('Phase 5 - Burst Window: R21 Siegfrieden XV does not trigger on Life loss', () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);

  // Siegfrieden XV: Burst: After your Spirit is depleted/destroyed by the Opponent
  const siegfriedenXV = createCardInstance({
    name: 'Siegfrieden XV',
    type: 'Spirit',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST', burstCondition: 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT' },
          clauses: []
        }
      ]
    }
  }, 'player');

  const lifeLossEvent = {
    type: 'LIFE_REDUCED',
    player: 'player',
    damage: 1,
    cause: 'combat_damage'
  };

  const matches = windows.matchesBurstCondition(siegfriedenXV, lifeLossEvent, 'player');
  assert.equal(matches, false, 'Siegfrieden XV does not match Life reduction');
});

test('Phase 5 - Burst Window: R22 Vanilla summon does not trigger summon-effect burst', () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);

  const burstOnSummon = createCardInstance({
    name: 'Summon Trap',
    type: 'Magic',
    compiledIr: {
      abilities: [
        {
          header: { timing: 'BURST', burstCondition: 'AFTER_OPPONENT_SUMMON_EFFECT' },
          clauses: []
        }
      ]
    }
  }, 'player');

  // Opponent summons a vanilla spirit (no effect)
  const vanillaCard = createCardInstance({ name: 'Vanilla Dino', is_vanilla: true }, 'opponent');
  vanillaCard.isVanilla = true;

  const summonEvent = {
    type: 'SUMMONED',
    player: 'opponent',
    card: vanillaCard,
    cause: 'summon'
  };

  const matches = windows.matchesBurstCondition(burstOnSummon, summonEvent, 'player');
  assert.equal(matches, false, 'Vanilla summon does not trigger summon-effect burst');
});

test('Phase 5 - Flash Window: R17 Turn restriction check', () => {
  const game = createGame();
  const windows = new TimingWindowManager(game);
  const p = game.state.players.player;

  // Flash Magic restricted to opponent attack step
  const oppFlashMagic = createCardInstance({
    name: 'Defense Wall',
    type: 'Magic',
    cost: 3,
    compiledIr: {
      abilities: [
        {
          header: { isFlash: true, timingLabel: 'Opposing Attack Step' },
          clauses: []
        }
      ]
    }
  }, 'player');
  p.hand.push(oppFlashMagic);

  // During player's OWN turn (attacker side = 'player')
  let actions = windows.getAvailableFlashActions('player', 'player');
  assert.ok(!actions.some(a => a.card && a.card.id === oppFlashMagic.id), 'Defense Wall not castable on player turn');

  // During OPPONENT's turn (attacker side = 'opponent')
  actions = windows.getAvailableFlashActions('player', 'opponent');
  assert.ok(actions.some(a => a.card && a.card.id === oppFlashMagic.id), 'Defense Wall castable on opponent turn');
});

test('Phase 5 - AIDecider selects highest strategic threat candidate', async () => {
  const ai = new AIDecider({ side: 'opponent' });
  const game = createGame();

  // Opponent (AI) evaluating player's spirits:
  // Spirit A: 2000 BP, Cost 2
  // Spirit B: 10000 BP, Cost 7 (High threat boss!)
  // Spirit C: 4000 BP, Cost 3
  const spA = { stack: createFieldStack(createCardInstance({ name: 'Weak', cost: 2, levels: { 1: { bp: 2000 } } })), bp: 2000, cost: 2 };
  const spB = { stack: createFieldStack(createCardInstance({ name: 'Boss Siegfried', cost: 7, levels: { 1: { bp: 10000 } } })), bp: 10000, cost: 7 };
  const spC = { stack: createFieldStack(createCardInstance({ name: 'Mid', cost: 3, levels: { 1: { bp: 4000 } } })), bp: 4000, cost: 3 };

  const prompt = {
    type: 'SELECT_DESTROY',
    candidates: [spA, spB, spC],
    count: 1
  };

  const chosen = await ai.decide(prompt, game.state);
  assert.equal(chosen.length, 1);
  assert.equal(chosen[0].stack.top.name, 'Boss Siegfried', 'AI must pick the highest threat target, not [0]');
});

test('Phase 5 - Mulligan & Contract Partner guarantee (R39 & R41)', async () => {
  const contractPartner = {
    name: 'The PartnerDemonLord Javad',
    cardNumber: 'SD65-CX01',
    cost: 3,
    type: 'Spirit',
    is_contract_partner: true
  };

  const regularDeck = Array.from({ length: 39 }, (_, i) => ({
    name: `Card ${i}`,
    cardNumber: `SD65-${String(i + 1).padStart(3, '0')}`,
    cost: 4,
    type: 'Spirit'
  }));

  // Put contract partner at the bottom of deck
  const fullDeck = [...regularDeck, contractPartner];

  const game = createGame({
    playerDeck: fullDeck,
    opponentDeck: fullDeck,
    promptResolver: {
      choose: async (prompt) => {
        if (prompt.type === 'MULLIGAN_CHOICE') {
          return { mulligan: true }; // Take mulligan once
        }
        return null;
      }
    }
  });

  await setupOpeningHands(game);

  const p = game.state.players.player;
  assert.equal(p.hand.length, 4);
  assert.ok(p.hand.some(c => c.isContractPartner), 'Contract partner guaranteed in hand after mulligan');
  assert.equal(p.hasUsedMulligan, true, 'Mulligan used flag set');
});
