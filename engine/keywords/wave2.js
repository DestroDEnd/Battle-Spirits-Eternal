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

export const SoulDriveKeyword = {
  id: 'Soul Drive',
  name: 'Soul Drive',
  wave: 2,
  async executeSoulDrive(game, ultimateStack, effectFn) {
    const { state, events } = game;
    if (!ultimateStack || !ultimateStack.cores || ultimateStack.cores.soul < 1) {
      return { success: false, reason: 'NO_SOUL_CORE_ON_ULTIMATE' };
    }
    const ownerSide = ultimateStack.owner;
    const p = state.players[ownerSide];
    if (p.soulDriveUsed) {
      return { success: false, reason: 'SOUL_DRIVE_ALREADY_USED' };
    }

    // Move Soul Core from Ultimate stack to Void (banished from the game)
    ultimateStack.cores.soul -= 1;
    p.soulDriveUsed = true;

    await events.emit({
      type: 'SOUL_DRIVE_ACTIVATED',
      stack: ultimateStack,
      player: ownerSide
    });

    if (typeof effectFn === 'function') {
      await effectFn();
    }
    return { success: true };
  }
};

export const ViolentHighSpeedKeyword = {
  id: 'Violent High Speed',
  name: 'Violent High Speed',
  wave: 2,
  async executeViolentHighSpeedSummon(game, card, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];

    // Official Bandai ruling: Must have 5 or more cores in Trash
    const trashNormal = p.trash.normal || 0;
    const trashSoul = p.trash.soul ? 1 : 0;
    const totalTrash = trashNormal + trashSoul;
    if (totalTrash < 5) return { success: false, reason: 'REQUIRE_AT_LEAST_5_TRASH_CORES' };

    // Summoned without paying cost; all cores in Trash move to field/reserve, with at least 1 placed on this spirit
    let spiritNormal = 0;
    let spiritSoul = 0;
    let remainingNormal = trashNormal;
    let remainingSoul = trashSoul;

    if (remainingNormal >= 1) {
      spiritNormal = 1;
      remainingNormal -= 1;
    } else if (remainingSoul >= 1) {
      spiritSoul = 1;
      remainingSoul -= 1;
    }

    // Clear trash completely
    p.trash.normal = 0;
    p.trash.soul = 0;

    // Remaining trash cores go to reserve
    p.reserve.normal = (p.reserve.normal || 0) + remainingNormal;
    if (remainingSoul > 0) {
      p.reserve.soul = 1;
    }

    const newStack = createFieldStack(card, { normal: spiritNormal, soul: spiritSoul });
    p.field.push(newStack);
    p.hand = p.hand.filter(c => c.id !== card.id);

    await events.emit({
      type: 'SUMMONED',
      card,
      stack: newStack,
      player: playerSide,
      cause: 'violent_high_speed'
    });

    return { success: true, stack: newStack };
  }
};

export const UnleashKeyword = {
  id: 'Unleash',
  name: 'Unleash',
  wave: 2,
  async executeUnleash(game, stack, effectFn) {
    const { events } = game;
    if (!stack || !stack.top) return { success: false, reason: 'INVALID_STACK' };
    const ownerSide = stack.owner;

    // Move Soul Core to this spirit
    stack.cores.soul = 1;

    await events.emit({
      type: 'UNLEASH_ACTIVATED',
      stack,
      player: ownerSide
    });

    if (typeof effectFn === 'function') {
      await effectFn();
    }
    return { success: true, stack };
  }
};

export const RushKeyword = {
  id: 'Rush',
  name: 'Rush',
  wave: 2,
  hasRushActive(state, playerSide, requiredColor) {
    const p = state.players[playerSide];
    if (!p) return false;
    const targetColor = String(requiredColor || '').toLowerCase();
    const friendlyUnits = [...(p.field || []), ...(p.nexus || [])];
    return friendlyUnits.some(st => {
      const colors = (st.top?.colors || [st.top?.color]).filter(Boolean).map(c => String(c).toLowerCase());
      return colors.includes(targetColor);
    });
  }
};

export const SixHeavenRushKeyword = {
  id: 'Six Heaven Rush',
  name: 'Six Heaven Rush',
  wave: 2,
  hasSixHeavenRushActive(state, playerSide, requiredUniqueColorsCount = 3) {
    const p = state.players[playerSide];
    if (!p) return false;
    const colorSet = new Set();
    const friendlyUnits = [...(p.field || []), ...(p.nexus || [])];
    for (const st of friendlyUnits) {
      const colors = (st.top?.colors || [st.top?.color]).filter(Boolean).map(c => String(c).toLowerCase());
      for (const col of colors) colorSet.add(col);
    }
    return colorSet.size >= requiredUniqueColorsCount;
  }
};

export const CatalyzeKeyword = {
  id: 'Catalyze',
  name: 'Catalyze',
  wave: 2,
  async executeCatalyze(game, activatingStack, targetBurstCard = null) {
    const { state, events } = game;
    const ownerSide = activatingStack?.owner || 'player';
    const p = state.players[ownerSide];

    // Bandai Official Ruling:
    // By sending [Soul Core] from this Spirit to Trash, immediately activate your set Soul Burst
    if (!activatingStack || activatingStack.cores.soul <= 0) {
      return { success: false, reason: 'NO_SOUL_CORE_ON_SPIRIT' };
    }

    activatingStack.cores.soul -= 1;
    p.trash.soul = (p.trash.soul || 0) + 1;

    const burst = targetBurstCard || p.burst;
    if (!burst) return { success: false, reason: 'NO_BURST_SET' };

    if (events) {
      await events.emit({
        type: 'CATALYZE_ACTIVATED',
        stack: activatingStack,
        burstCard: burst,
        player: ownerSide
      });
    }

    return { success: true, burstCard: burst };
  }
};

export const AdventKeyword = {
  id: 'Advent',
  hooks: {}
};

export const BurstKeyword = {
  id: 'Burst',
  hooks: {}
};

export const ChargeKeyword = {
  id: 'Charge',
  hooks: {}
};

export function registerWave2Keywords(registry) {
  registry.register(AdventKeyword);
  registry.register({ ...AdventKeyword, id: 'Contract Advent' });
  registry.register({ ...AdventKeyword, id: 'Grand Advent' });
  registry.register({ ...AdventKeyword, id: 'Reverse Contract Advent' });
  registry.register({ ...AdventKeyword, id: 'Ultra Contract Advent' });
  registry.register(BurstKeyword);
  registry.register({ ...BurstKeyword, id: 'Soul Burst' });
  registry.register({ ...BurstKeyword, id: 'Burst Seal' });
  registry.register(AccelKeyword);
  registry.register(MirageKeyword);
  registry.register({ ...MirageKeyword, id: 'Mirage Boost' });
  registry.register({ ...MirageKeyword, id: 'Mirage Drain' });
  registry.register({ ...MirageKeyword, id: 'Mirage Flash' });
  registry.register({ ...MirageKeyword, id: 'Mirage Trance' });
  registry.register({ ...MirageKeyword, id: 'Mirage Synchro' });
  registry.register(ChangeKeyword);
  registry.register(HighSpeedKeyword);
  registry.register({ ...HighSpeedKeyword, id: 'Absolute Sound Speed' });
  registry.register({ ...HighSpeedKeyword, id: 'Sound Speed' });
  registry.register({ ...HighSpeedKeyword, id: 'Soul Swift' });
  registry.register({ ...HighSpeedKeyword, id: 'Thunder Swift' });
  registry.register(ViolentHighSpeedKeyword);
  registry.register({ ...ViolentHighSpeedKeyword, id: 'Flashing Swift' });
  registry.register(ContractKeyword);
  registry.register({ ...ContractKeyword, id: 'Soul State' });
  registry.register({ ...ContractKeyword, id: 'Contract Pre-Advent' });
  registry.register({ ...ContractKeyword, id: 'Final Contract Advent' });
  registry.register(RebirthKeyword);
  registry.register({ ...RebirthKeyword, id: 'Zero Rebirth' });
  registry.register({ ...RebirthKeyword, id: 'Sortie Rebirth' });
  registry.register({ ...RebirthKeyword, id: 'Six Heaven Rebirth' });
  registry.register({ ...RebirthKeyword, id: 'Absolute Rebirth' });
  registry.register({ ...RebirthKeyword, id: 'Illusive Rebirth' });
  registry.register(SealKeyword);
  registry.register({ ...SealKeyword, id: 'Super Seal' });
  registry.register({ ...SealKeyword, id: 'Pyroxene Seal' });
  registry.register({ ...SealKeyword, id: 'Constellation Seal' });
  registry.register({ ...SealKeyword, id: 'Twinkle Seal' });
  registry.register({ ...SealKeyword, id: 'Sky Seal' });
  registry.register({ ...SealKeyword, id: 'Moonlight Seal' });
  registry.register(UnleashKeyword);
  registry.register({ ...UnleashKeyword, id: 'Nether Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Yomi Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Kamiumi Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Contract Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Celestial Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Super Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Absolute Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Astral Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Dark Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Flame Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Ice Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Moon Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Thunder Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Chaos Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Silver Arm Unleash' });
  registry.register({ ...UnleashKeyword, id: 'Time Unleash' });
  registry.register(SoulDriveKeyword);
  registry.register({ ...SoulDriveKeyword, id: 'Light-Dark Soul Drive' });
  registry.register(RushKeyword);
  registry.register(SixHeavenRushKeyword);
  registry.register({ ...RushKeyword, id: 'Six Pentan Rush' });
  registry.register(ChargeKeyword);
  registry.register({ ...ChargeKeyword, id: 'Ringing Charge' });
  registry.register(CatalyzeKeyword);
  registry.register({ ...CatalyzeKeyword, id: 'True Catalyze' });
  registry.register({ ...CatalyzeKeyword, id: 'War Catalyze' });
  registry.register({ ...CatalyzeKeyword, id: 'Twinkle Catalyze' });
}
