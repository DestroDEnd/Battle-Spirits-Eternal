import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';

test('Autonomy Remediation - Assault requires explicit player choice and rejects silent fallback', async () => {
  const game = createGame();
  const { state, keywords } = game;
  const handler = keywords.get('Assault');

  const p = state.players.player;
  const n1 = { id: 'nex-1', state: 'REFRESHED' };
  const n2 = { id: 'nex-2', state: 'REFRESHED' };
  p.nexus = [n1, n2];

  const attacker = {
    id: 'atk-assault',
    owner: 'player',
    state: 'EXHAUSTED',
    top: { id: 'A1', type: 'Spirit' }
  };
  p.field = [attacker];

  // Case 1: Player explicitly selects nexus 2
  game.resolver.promptResolver = {
    choose: async () => ({ accepted: true, nexus: n2 })
  };

  await handler.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: attacker,
    resolver: game.resolver
  });

  assert.strictEqual(n1.state, 'REFRESHED', 'Nexus 1 must remain refreshed when Nexus 2 was chosen');
  assert.strictEqual(n2.state, 'EXHAUSTED', 'Nexus 2 must be exhausted as explicitly chosen');
  assert.strictEqual(attacker.state, 'REFRESHED', 'Attacker must refresh upon valid choice');

  // Case 2: Player declines activation
  attacker.state = 'EXHAUSTED';
  n1.state = 'REFRESHED';
  n2.state = 'REFRESHED';

  game.resolver.promptResolver = {
    choose: async () => ({ accepted: false })
  };

  await handler.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: attacker,
    resolver: game.resolver
  });

  assert.strictEqual(n1.state, 'REFRESHED', 'Nexus 1 must not be exhausted on declined choice');
  assert.strictEqual(n2.state, 'REFRESHED', 'Nexus 2 must not be exhausted on declined choice');
  assert.strictEqual(attacker.state, 'EXHAUSTED', 'Attacker must remain exhausted on declined choice');

  // Case 3: Prompt returns empty/invalid selection (No silent fallback to n1)
  attacker.state = 'EXHAUSTED';
  n1.state = 'REFRESHED';
  n2.state = 'REFRESHED';

  game.resolver.promptResolver = {
    choose: async () => ({ accepted: true, nexus: null })
  };

  await handler.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: attacker,
    resolver: game.resolver
  });

  assert.strictEqual(n1.state, 'REFRESHED', 'Nexus 1 must NOT be silently exhausted when selection is null');
  assert.strictEqual(attacker.state, 'EXHAUSTED', 'Attacker must remain exhausted when selection is null');
});

test('Autonomy Remediation - Great Crush and Supreme Clash respect player choice without fallback', async () => {
  const game = createGame();
  const { state, keywords } = game;
  const opp = state.players.opponent;

  const sp1 = { id: 'opp-sp-1', owner: 'opponent', state: 'REFRESHED', top: { id: 'S1', type: 'Spirit' } };
  const sp2 = { id: 'opp-sp-2', owner: 'opponent', state: 'REFRESHED', top: { id: 'S2', type: 'Spirit' } };
  opp.field = [sp1, sp2];

  state.combat = { stage: 'ATTACK_DECLARED' };
  const supremeClash = keywords.get('Supreme Clash');

  // Player selects sp2 to exhaust
  game.resolver.promptResolver = {
    choose: async () => sp2
  };

  await supremeClash.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: { owner: 'player' },
    resolver: game.resolver
  });

  assert.strictEqual(sp1.state, 'REFRESHED', 'sp1 must remain refreshed when sp2 was selected');
  assert.strictEqual(sp2.state, 'EXHAUSTED', 'sp2 must be exhausted as explicitly selected');

  // Declining / null choice must NOT exhaust sp1
  sp2.state = 'REFRESHED';
  game.resolver.promptResolver = {
    choose: async () => null
  };

  await supremeClash.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: { owner: 'player' },
    resolver: game.resolver
  });

  assert.strictEqual(sp1.state, 'REFRESHED', 'sp1 must NOT be exhausted when choice is null');
  assert.strictEqual(sp2.state, 'REFRESHED', 'sp2 must remain refreshed when choice is null');
});

test('Autonomy Remediation - Leap presents selection prompt and bounces chosen unit', async () => {
  const game = createGame();
  const { state, keywords } = game;
  const opp = state.players.opponent;

  const unit1 = { id: 'opp-u-1', owner: 'opponent', state: 'EXHAUSTED', cores: { normal: 1, soul: 0 }, top: { id: 'U1', type: 'Spirit' } };
  const unit2 = { id: 'opp-u-2', owner: 'opponent', state: 'EXHAUSTED', cores: { normal: 1, soul: 0 }, top: { id: 'U2', type: 'Spirit' } };
  opp.field = [unit1, unit2];
  opp.hand = [];
  opp.life = 5;
  opp.reserve = { normal: 0 };

  const leap = keywords.get('Leap');

  // Player explicitly chooses unit2
  let promptCalled = false;
  game.resolver.promptResolver = {
    choose: async (prompt) => {
      promptCalled = true;
      assert.strictEqual(prompt.type, 'SELECT_LEAP_BOUNCE');
      assert.strictEqual(prompt.candidates.length, 2);
      return unit2;
    }
  };

  await leap.hooks.onAttackDeclared({
    game,
    state,
    attackerStack: { owner: 'player' },
    resolver: game.resolver
  });

  assert.ok(promptCalled, 'Leap must call promptResolver.choose');
  assert.ok(opp.hand.some(c => c.id === 'U2'), 'unit2 must be returned to Hand');
  assert.ok(!opp.hand.some(c => c.id === 'U1'), 'unit1 must NOT be bounced');
  assert.strictEqual(opp.life, 4, 'Opponent life reduced by 1');
  assert.strictEqual(opp.reserve.normal, 2, 'Cores from bounced unit and life sent to reserve');
});
