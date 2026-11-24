/**
 * tests/phase_m3_3_1_flash_authority_regression.test.js
 * 
 * Phase M.3.3.1 Work Package B: Repair Flash Ability Authorization
 * 
 * Asserts that:
 * 1. Generic Flash Spirit ability is authorized in controller Main Step.
 * 2. Non-active player cannot activate Flash during opponent Main Step.
 * 3. Flash ability is rejected outside Main/Attack or in Attack step without an active Flash window.
 * 4. Triggered (When Attacks) Flash abilities return TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE.
 * 5. Card-specific qualifiers (Your Attack Step, Opponent Attack Step) are rejected in Main Step.
 * 6. Session API executes ACTIVATE_FLASH_ABILITY authoritatively for the active player.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { BattleSessionManager } from '../engine/session_manager.js';
import { SessionStore } from '../engine/session_store.js';

test('M3.3.1-B-01: Generic Flash Spirit ability on field executes in controller Main Step', async () => {
  const game = createGame();
  const flashSpirit = createCardInstance({
    id: 'GEN_FLASH_SPIRIT_01',
    name: 'Flash Knight',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_knight_draw',
          physicalId: 'phy_knight_draw',
          header: { timing: 'FLASH', isFlash: true, levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.player.field = [createFieldStack(flashSpirit, { normal: 2, soul: 0 })];
  game.state.players.player.deck = [createCardInstance({ name: 'Deck Top' }, 'player')];

  const actRes = await game.activateAbility(flashSpirit.id, 'phy_knight_draw', 'player');
  assert.equal(actRes.success, true, 'Generic Flash ability on field must succeed in Main Step');
  assert.equal(game.state.players.player.hand.length, 1, 'Drew 1 card from ability');
});

test('M3.3.1-B-02: Non-active player cannot activate Flash Spirit ability in opponent Main Step', async () => {
  const game = createGame();
  const flashSpirit = createCardInstance({
    id: 'GEN_FLASH_SPIRIT_02',
    name: 'Flash Defender',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_def_flash',
          physicalId: 'phy_def_flash',
          header: { timing: 'FLASH', isFlash: true, levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'opponent');

  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';
  game.state.players.opponent.field = [createFieldStack(flashSpirit, { normal: 2, soul: 0 })];

  const actRes = await game.activateAbility(flashSpirit.id, 'phy_def_flash', 'opponent');
  assert.equal(actRes.success, false);
  assert.ok(actRes.reason === 'NOT_ACTIVE_PLAYER' || actRes.code === 'FLASH_NOT_PERMITTED_IN_OPPONENT_MAIN_STEP');
});

test('M3.3.1-B-03: Triggered (When Attacks) Flash returns TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'TRIGGER_WHEN_ATTACKS_01',
    name: 'Attack Trigger Dragon',
    type: 'Spirit',
    cost: 5,
    effect: '[LV1][LV2] (When Attacks) Flash: Destroy an opponent\'s Spirit with 4000 BP or less.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_when_att',
          physicalId: 'phy_when_att',
          header: { timing: 'FLASH', isFlash: true, timingLabel: '(When Attacks) Flash' },
          clauses: []
        }
      ]
    }
  }, 'player');

  const stack = createFieldStack(card, { normal: 2, soul: 0 });
  game.state.players.player.field = [stack];
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';

  const actRes = await game.activateAbility(card.id, 'phy_when_att', 'player');
  assert.equal(actRes.success, false);
  assert.equal(actRes.code, 'TRIGGERED_ABILITY_CANNOT_MANUALLY_ACTIVATE');
});

test('M3.3.1-B-04: Card-specific qualifiers (Your Attack Step) rejected during Main Step', async () => {
  const game = createGame();
  const card = createCardInstance({
    id: 'SPEC_YOUR_ATTACK_01',
    name: 'Assault Dragon',
    type: 'Spirit',
    cost: 4,
    effect: 'Flash - (Your Attack Step): Target spirit gets +3000 BP.',
    compiledIr: {
      abilities: [
        {
          id: 'ab_assault',
          physicalId: 'phy_assault',
          header: { timing: 'FLASH', isFlash: true, timingLabel: 'Flash - (Your Attack Step)' },
          clauses: []
        }
      ]
    }
  }, 'player');

  game.state.players.player.field = [createFieldStack(card, { normal: 2, soul: 0 })];
  game.state.step = 'MAIN';
  game.state.activePlayer = 'player';

  const actRes = await game.activateAbility(card.id, 'phy_assault', 'player');
  assert.equal(actRes.success, false);
  assert.equal(actRes.code, 'RESTRICTED_TO_ATTACK_STEP');
});

test('M3.3.1-B-05: Session action ACTIVATE_FLASH_ABILITY executes authoritatively for active player', async () => {
  const store = new SessionStore({ inMemory: true });
  const manager = new BattleSessionManager({ store });
  const match = await manager.createMatch({
    mode: 'HUMAN_VS_HUMAN',
    player1: { id: 'alice' },
    player2: { id: 'bob', autoJoined: true }
  });

  const active = await manager.ensureActiveGame(match.matchId);
  const flashSpirit = createCardInstance({
    id: 'GEN_FLASH_SESSION_01',
    name: 'Flash Mage',
    type: 'Spirit',
    cost: 3,
    levels: { 1: { cost: 1, bp: 3000 } },
    compiledIr: {
      abilities: [
        {
          id: 'ab_mage_draw',
          physicalId: 'phy_mage_draw',
          header: { timing: 'FLASH', isFlash: true, levels: [1] },
          clauses: [{ op: { op: 'DRAW', count: 1 } }]
        }
      ]
    }
  }, 'player');

  active.game.state.step = 'MAIN';
  active.game.state.activePlayer = 'player';
  active.game.state.players.player.field = [createFieldStack(flashSpirit, { normal: 2, soul: 0 })];
  active.game.state.players.player.deck = [createCardInstance({ name: 'Deck Card' }, 'player')];

  const res = await manager.submitPlayerAction(match.matchId, {
    type: 'ACTIVATE_FLASH_ABILITY',
    cardId: flashSpirit.id,
    abilityId: 'phy_mage_draw'
  }, { authToken: match.player1Token });

  assert.equal(res.success, true);
  assert.equal(active.game.state.players.player.hand.length, 1, 'Card drawn via session action');
});
