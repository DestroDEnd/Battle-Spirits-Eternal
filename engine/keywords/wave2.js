/**
 * engine/keywords/wave2.js
 * 
 * Wave 2 Keywords: Modern Game Mechanics for Battle Spirits Eternal.
 * Accel, Mirage, Change, High Speed, Contract / Soul State, Rebirth, Seal / Unleash.
 */

import { moveCard, moveCore } from '../zones.js';
import { createFieldStack } from '../state.js';

export const AccelKeyword = {
  id: 'Accel',
  name: 'Accel',
  wave: 2,
  async executeAccel(game, card, playerSide = 'player') {
    const { state, events, resolver } = game;
    // Resolve Accel ability clauses
    if (card.compiledIr && card.compiledIr.abilities) {
      for (const ab of card.compiledIr.abilities) {
        if (ab.header.keyword === 'Accel' || ab.header.isFlash) {
          await resolver.resolveAbility(state, ab, { controller: playerSide, sourceCard: card }, events);
        }
      }
    }
    // After resolution, card moves face-up to Removed/Open Zone (Eternal Rule 3.5)
    await moveCard(state, card, 'removed', playerSide, { cause: 'accel' }, events);
    return { success: true, zone: 'removed' };
  }
};

export const MirageKeyword = {
  id: 'Mirage',
  name: 'Mirage',
  wave: 2,
  async setMirage(game, card, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    if (p.mirageSetThisTurn) return { success: false, reason: 'MIRAGE_ALREADY_SET' };

    await moveCard(state, card, 'mirage', playerSide, { cause: 'set_mirage' }, events);
    return { success: true, mirageCard: card };
  }
};

export const ChangeKeyword = {
  id: 'Change',
  name: 'Change',
  wave: 2,
  async executeChange(game, handCard, targetStackId, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    const targetStack = p.field.find(st => st.id === targetStackId);
    if (!targetStack) return { success: false, reason: 'TARGET_NOT_FOUND' };

    const oldTop = targetStack.top;

    // Swap oldTop to hand, handCard onto field as new top in refreshed state
    p.hand = p.hand.filter(c => c.id !== handCard.id);
    p.hand.push(oldTop);

    targetStack.top = handCard;
    targetStack.state = 'REFRESHED';

    await events.emit({
      type: 'CHANGE',
      card: handCard,
      returnedCard: oldTop,
      stack: targetStack,
      player: playerSide
    });

    return { success: true, stack: targetStack };
  }
};

export const HighSpeedKeyword = {
  id: 'High Speed',
  name: 'High Speed',
  wave: 2,
  async executeHighSpeedSummon(game, card, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    const cost = card.cost || 1;

    // Must pay strictly from reserve cores
    if (p.reserve.normal < cost) return { success: false, reason: 'INSUFFICIENT_RESERVE_CORES' };

    p.reserve.normal -= cost;
    p.trash.normal += cost;

    // Allocate 1 core to field for LV1
    if (p.reserve.normal >= 1) {
      p.reserve.normal -= 1;
    }

    const newStack = createFieldStack(card, { normal: 1, soul: 0 });
    p.field.push(newStack);
    p.hand = p.hand.filter(c => c.id !== card.id);

    await events.emit({
      type: 'SUMMONED',
      card,
      stack: newStack,
      player: playerSide,
      cause: 'high_speed'
    });

    return { success: true, stack: newStack };
  }
};

export const ContractKeyword = {
  id: 'Contract',
  name: 'Contract',
  wave: 2,
  hooks: {
    async onSoulStateEntered({ state, card, playerSide }) {
      const p = state.players[playerSide];
      p.counters += 1;
    }
  }
};

export const RebirthKeyword = {
  id: 'Rebirth',
  name: 'Rebirth',
  wave: 2,
  async flipCard(game, stack, bSideData) {
    const { events } = game;
    const oldTop = stack.top;
    stack.top = {
      ...oldTop,
      ...bSideData,
      isReborn: true
    };

    await events.emit({
      type: 'REBORN',
      stack,
      card: stack.top
    });

    return { success: true, rebornCard: stack.top };
  }
};

export const SealKeyword = {
  id: 'Seal',
  name: 'Seal',
  wave: 2,
  async executeSeal(game, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    if (p.reserve.soul < 1) return { success: false, reason: 'NO_SOUL_CORE_IN_RESERVE' };

    // Move Soul Core from Reserve to Life (Seal exception)
    p.reserve.soul -= 1;
    p.life += 1;

    await events.emit({
      type: 'SEAL_ACTIVATED',
      player: playerSide
    });

    return { success: true };
  }
};

export function registerWave2Keywords(registry) {
  registry.register(AccelKeyword);
  registry.register(MirageKeyword);
  registry.register(ChangeKeyword);
  registry.register(HighSpeedKeyword);
  registry.register({ ...HighSpeedKeyword, id: 'Violent High Speed' });
  registry.register(ContractKeyword);
  registry.register({ ...ContractKeyword, id: 'Soul State' });
  registry.register({ ...ContractKeyword, id: 'Contract Pre-Advent' });
  registry.register(RebirthKeyword);
  registry.register(SealKeyword);
  registry.register({ ...SealKeyword, id: 'Unleash' });
}
