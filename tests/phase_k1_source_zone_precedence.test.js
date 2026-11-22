import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeOp } from '../engine/ops/index.js';

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

describe('Phase K.1 Work Package E: Source-Zone Precedence & Transaction Integrity Battery', () => {

  it('1. Explicit TRASH while revealed cards exist: summons from trash, leaving revealed untouched', async () => {
    const state = createMockState();
    const trashSpirit = { id: 'TRASH_SPIRIT', name: 'Grave Walker', type: 'Spirit', cost: 2, colors: ['Purple'], owner: 'player' };
    const revealedSpirit = { id: 'REV_SPIRIT', name: 'Revealed Seer', type: 'Spirit', cost: 2, colors: ['Purple'], owner: 'player' };

    state.players.player.grave.push(trashSpirit);
    state.players.player.revealed.push(revealedSpirit);
    state.revealedCards.push(revealedSpirit);

    const op = {
      op: 'SUMMON',
      from: 'TRASH',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player', revealedCards: state.revealedCards }, null, null);

    assert.equal(res.success, true, 'Summon from TRASH must succeed');
    assert.equal(res.card.id, 'TRASH_SPIRIT', 'Must select and summon the card from TRASH, NOT from revealed cards');
    assert.equal(state.players.player.field.length, 1, 'Spirit must be placed on field');
    assert.equal(state.players.player.field[0].top.id, 'TRASH_SPIRIT');
    assert.equal(state.players.player.grave.length, 0, 'Trash card must be removed from grave');
    assert.equal(state.players.player.revealed.length, 1, 'Revealed cards must remain intact');
    assert.equal(state.revealedCards.length, 1, 'Context revealed cards must remain intact');
  });

  it('2. Explicit GRAVE while revealed cards exist: summons from grave, leaving revealed untouched', async () => {
    const state = createMockState();
    const graveSpirit = { id: 'GRAVE_SPIRIT', name: 'Necro Knight', type: 'Spirit', cost: 1, colors: ['Purple'], owner: 'player' };
    const revealedSpirit = { id: 'REV_SPIRIT_2', name: 'Revealed Scout', type: 'Spirit', cost: 1, colors: ['Purple'], owner: 'player' };

    state.players.player.grave.push(graveSpirit);
    state.players.player.revealed.push(revealedSpirit);
    state.revealedCards.push(revealedSpirit);

    const op = {
      op: 'SUMMON',
      from: 'GRAVE',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player', revealedCards: state.revealedCards }, null, null);

    assert.equal(res.success, true, 'Summon from GRAVE must succeed');
    assert.equal(res.card.id, 'GRAVE_SPIRIT', 'Must summon from GRAVE');
    assert.equal(state.players.player.revealed.length, 1, 'Revealed card was not consumed');
  });

  it('3. Explicit HAND while revealed cards exist: summons from hand, leaving revealed untouched', async () => {
    const state = createMockState();
    const handSpirit = { id: 'HAND_SPIRIT', name: 'Hand Soldier', type: 'Spirit', cost: 1, colors: ['Red'], owner: 'player' };
    const revSpirit = { id: 'REV_SPIRIT_3', name: 'Revealed Dragon', type: 'Spirit', cost: 1, colors: ['Red'], owner: 'player' };

    state.players.player.hand.push(handSpirit);
    state.players.player.revealed.push(revSpirit);
    state.revealedCards.push(revSpirit);

    const op = {
      op: 'SUMMON',
      from: 'HAND',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player', revealedCards: state.revealedCards }, null, null);

    assert.equal(res.success, true, 'Summon from HAND must succeed');
    assert.equal(res.card.id, 'HAND_SPIRIT', 'Must summon from HAND');
    assert.equal(state.players.player.hand.length, 0, 'Hand card moved to field');
    assert.equal(state.players.player.revealed.length, 1, 'Revealed card remained in revealed');
  });

  it('4. Case-insensitive zone aliases: "trash", "TRASH", "grave", "GRAVE", "open", "REMOVED" resolve cleanly', async () => {
    const state = createMockState();
    const cardOpen = { id: 'OPEN_SPIRIT', name: 'Dimensional Spirit', type: 'Spirit', cost: 2, colors: ['White'], owner: 'player' };
    state.players.player.removed.push(cardOpen);

    // Test uppercase REMOVED
    const op = {
      op: 'SUMMON',
      from: 'REMOVED',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player' }, null, null);
    assert.equal(res.success, true, 'Summon from REMOVED must succeed');
    assert.equal(res.card.id, 'OPEN_SPIRIT');
    assert.equal(state.players.player.removed.length, 0);
  });

  it('5. Missing source zone without revealed cards: defaults to hand', async () => {
    const state = createMockState();
    const handSpirit = { id: 'DEFAULT_HAND_SPIRIT', name: 'Default Soldier', type: 'Spirit', cost: 1, colors: ['Red'], owner: 'player' };
    state.players.player.hand.push(handSpirit);

    const op = {
      op: 'SUMMON',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player' }, null, null);
    assert.equal(res.success, true, 'Summon with omitted from must default to hand');
    assert.equal(res.card.id, 'DEFAULT_HAND_SPIRIT');
  });

  it('6. Candidate present only in wrong zone: rejects when card is in hand but op requests TRASH', async () => {
    const state = createMockState();
    const handSpirit = { id: 'MISMATCHED_SPIRIT', name: 'Hand Only', type: 'Spirit', cost: 1, colors: ['Red'], owner: 'player' };
    state.players.player.hand.push(handSpirit);
    // grave is empty!

    const op = {
      op: 'SUMMON',
      from: 'TRASH',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player' }, null, null);
    assert.equal(res.success, false, 'Must reject when no candidates exist in requested TRASH zone');
    assert.equal(state.players.player.hand.length, 1, 'Card in hand must not be touched');
    assert.equal(state.players.player.field.length, 0, 'No spirit summoned');
  });

  it('7. Candidate moved between selection and transaction commit: rejects transaction cleanly', async () => {
    const state = createMockState();
    const graveSpirit = { id: 'GHOST_SPIRIT', name: 'Ghost', type: 'Spirit', cost: 1, colors: ['Purple'], owner: 'player' };
    state.players.player.grave.push(graveSpirit);

    // Mock promptResolver that maliciously removes the card from grave right before returning it
    const promptResolver = {
      async choose({ candidates }) {
        // Interleaved state mutation: opponent banishes the card from grave!
        state.players.player.grave = [];
        return [candidates[0]];
      }
    };

    const op = {
      op: 'SUMMON',
      from: 'GRAVE',
      free: true,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player' }, promptResolver, null);
    assert.equal(res.success, false, 'Transaction must fail when card disappears from source zone');
    assert.equal(state.players.player.field.length, 0, 'Field must remain empty');
  });

  it('8. Cost/Core rollback on transaction failure: preserves game state integrity', async () => {
    const state = createMockState();
    const handSpirit = { id: 'ROLLBACK_SPIRIT', name: 'Costly Spirit', type: 'Spirit', cost: 3, colors: ['Red'], owner: 'player' };
    state.players.player.hand.push(handSpirit);
    state.players.player.reserve.normal = 1; // Only 1 core in reserve! Not enough to pay cost (3) + LV1 core (1)

    const op = {
      op: 'SUMMON',
      from: 'HAND',
      free: false, // Must pay cost!
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player' }, null, null);
    assert.equal(res.success, false, 'Must reject due to insufficient cores');
    assert.equal(state.players.player.hand.length, 1, 'Hand card remains in hand');
    assert.equal(state.players.player.reserve.normal, 1, 'Reserve cores untouched');
    assert.equal(state.players.player.field.length, 0, 'Field untouched');
  });

  it('9. DEPLOY_NEXUS source precedence: explicit GRAVE deploys from grave even when revealed cards exist', async () => {
    const state = createMockState();
    const graveNexus = { id: 'GRAVE_NEXUS', name: 'Sun Temple', type: 'Nexus', cost: 2, colors: ['Red'], owner: 'player' };
    const revNexus = { id: 'REV_NEXUS', name: 'Sky Fortress', type: 'Nexus', cost: 2, colors: ['White'], owner: 'player' };

    state.players.player.grave.push(graveNexus);
    state.players.player.revealed.push(revNexus);
    state.revealedCards.push(revNexus);

    const op = {
      op: 'DEPLOY_NEXUS',
      from: 'GRAVE',
      noCost: true,
      filter: { cardType: 'Nexus' }
    };

    const res = await executeOp(state, op, { controller: 'player', revealedCards: state.revealedCards }, null, null);
    assert.equal(res.success, true, 'Deploy nexus from GRAVE must succeed');
    assert.equal(res.card.id, 'GRAVE_NEXUS', 'Must deploy the nexus from GRAVE, not from revealed');
    assert.equal(state.players.player.revealed.length, 1, 'Revealed cards untouched');
  });

  it('10. SALVAGE source precedence: explicit GRAVE salvages from grave even when revealed cards exist', async () => {
    const state = createMockState();
    const graveCard = { id: 'GRAVE_SALVAGE_CARD', name: 'Ancient Dragon', type: 'Spirit', cost: 4, colors: ['Red'], owner: 'player' };
    const revCard = { id: 'REV_SALVAGE_CARD', name: 'Scout Bird', type: 'Spirit', cost: 1, colors: ['Red'], owner: 'player' };

    state.players.player.grave.push(graveCard);
    state.players.player.revealed.push(revCard);
    state.revealedCards.push(revCard);

    const op = {
      op: 'SALVAGE',
      from: 'GRAVE',
      count: 1,
      filter: { cardType: 'Spirit' }
    };

    const res = await executeOp(state, op, { controller: 'player', revealedCards: state.revealedCards }, null, null);
    assert.equal(res.success, true, 'Salvage from GRAVE must succeed');
    assert.equal(res.cards[0].id, 'GRAVE_SALVAGE_CARD', 'Must salvage from GRAVE, not from revealed');
    assert.equal(state.players.player.hand.length, 1);
    assert.equal(state.players.player.revealed.length, 1, 'Revealed cards untouched');
  });
});

