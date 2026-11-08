/**
 * engine/keywords/wave5.js
 * 
 * Wave 5 Keywords: Diva & Collaboration Mechanics.
 * On Stage, Show Up, Friend, Appeal, My Unit, Solo Part, Duet Part,
 * Digivolution, Trans-Am, Clock Up, Funnel, Barrage.
 */

import { moveCard, moveCore, commitStackExit } from '../zones.js';

export const ClockUpKeyword = {
  id: 'Clock Up',
  name: 'Clock Up',
  wave: 5,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.onlyBlockableByKeyword = 'Clock Up';
      }
    }
  }
};

export const OnStageKeyword = {
  id: 'On Stage',
  name: 'On Stage',
  wave: 5,
  async executeOnStage(game, stack, stageStyleCard, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];

    if (!stack || !stageStyleCard) {
      return { success: false, reason: 'INVALID_TARGET' };
    }

    const oldTop = stack.top;

    // Return current spirit to deckbottom
    p.deck.push(oldTop);

    // Remove stage style card from hand
    p.hand = p.hand.filter(c => c.id !== stageStyleCard.id);

    // Place stage style card on stack in REFRESHED state, preserving stack cores
    stack.top = stageStyleCard;
    stack.state = 'REFRESHED';

    if (events) {
      await events.emit({
        type: 'ON_STAGE_SUMMONED',
        stack,
        card: stageStyleCard,
        returnedCard: oldTop,
        player: playerSide
      });
    }

    return { success: true, stack };
  }
};

export const ShowUpKeyword = {
  id: 'Show Up',
  name: 'Show Up',
  wave: 5,
  async executeShowUp(game, stack, costumeCard, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    const oldTop = stack.top;

    p.hand = p.hand.filter(c => c.id !== costumeCard.id);
    p.hand.push(oldTop);

    stack.top = costumeCard;
    stack.state = 'REFRESHED';

    if (events) {
      await events.emit({
        type: 'SHOW_UP',
        stack,
        card: costumeCard,
        player: playerSide
      });
    }

    return { success: true, stack };
  }
};

export const FriendKeyword = {
  id: 'Friend',
  name: 'Friend',
  wave: 5,
  async executeFriend(game, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    if (p.deck.length === 0) return { success: false, reason: 'EMPTY_DECK' };

    const topCard = p.deck[0];
    if (events) {
      await events.emit({
        type: 'FRIEND_TRIGGERED',
        player: playerSide,
        revealedCard: topCard
      });
    }
    return { success: true, card: topCard };
  }
};

export const AppealKeyword = {
  id: 'Appeal',
  name: 'Appeal',
  wave: 5,
  hooks: {
    async onAttackDeclared({ state, attackerStack, game }) {
      // Diva performance life/core bonus
    }
  }
};

export const MyUnitKeyword = {
  id: 'My Unit',
  name: 'My Unit',
  wave: 5,
  async executeMyUnit(game, attackerStack, requiredCount = 1, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    const exhaustedDivas = (p.field || []).filter(st => st.id !== attackerStack.id && st.state === 'EXHAUSTED' && (st.top?.family?.includes('Diva') || st.top?.family?.includes('Stage Style')));
    if (exhaustedDivas.length < requiredCount) {
      return { success: false, reason: 'INSUFFICIENT_EXHAUSTED_DIVAS' };
    }
    await events.emit({
      type: 'MY_UNIT_ACTIVATED',
      attacker: attackerStack,
      divas: exhaustedDivas.slice(0, requiredCount),
      player: playerSide
    });
    return { success: true, count: requiredCount };
  }
};

export const SoloPartKeyword = {
  id: 'Solo Part',
  name: 'Solo Part',
  wave: 5,
  isActive(state, stack) {
    if (!stack) return false;
    const p = state.players[stack.owner];
    const battlingCount = (p.field || []).filter(st => st.state === 'EXHAUSTED').length;
    return battlingCount <= 1;
  }
};

export const DuetPartKeyword = {
  id: 'Duet Part',
  name: 'Duet Part',
  wave: 5,
  isActive(state, stack) {
    if (!stack) return false;
    const p = state.players[stack.owner];
    const divaCount = (p.field || []).filter(st => st.top?.family?.includes('Diva') || st.top?.family?.includes('Stage Style')).length;
    return divaCount >= 2;
  }
};

export const DigivolutionKeyword = {
  id: 'Digivolution',
  name: 'Digivolution',
  wave: 5,
  async executeDigivolution(game, stack, evolvedCard, playerSide = 'player') {
    const { state, events } = game;
    const p = state.players[playerSide];
    p.hand = p.hand.filter(c => c.id !== evolvedCard.id);
    if (!stack.under) stack.under = [];
    stack.under.push(stack.top);
    stack.top = evolvedCard;
    stack.state = 'REFRESHED';

    if (events) {
      await events.emit({
        type: 'DIGIVOLUTION',
        stack,
        card: evolvedCard,
        player: playerSide
      });
    }
    return { success: true, stack };
  }
};

export const TransAmKeyword = {
  id: 'Trans-Am',
  name: 'Trans-Am',
  wave: 5,
  hooks: {
    async onAttackDeclared({ attackerStack }) {
      if (attackerStack) {
        attackerStack.transAmActive = true;
      }
    }
  }
};

export const FunnelKeyword = {
  id: 'Funnel',
  name: 'Funnel',
  wave: 5,
  async executeFunnel(game, attackerStack, count = 1, targetStack = null) {
    const { state, events } = game;
    if (targetStack) {
      await commitStackExit(state, targetStack, 'grave', { cause: 'funnel', by: attackerStack.owner }, events);
    }
    await events.emit({
      type: 'FUNNEL_FIRED',
      attacker: attackerStack,
      target: targetStack,
      count
    });
    return { success: true };
  }
};

export const BarrageKeyword = {
  id: 'Barrage',
  name: 'Barrage',
  wave: 5,
  hooks: {
    async onAttackDeclared({ attackerStack }) {
      if (attackerStack) {
        attackerStack.barrageActive = true;
      }
    }
  }
};

export function registerWave5Keywords(registry) {
  registry.register(ClockUpKeyword);
  registry.register({ ...ClockUpKeyword, id: 'Hyper Cast Off' });
  registry.register(OnStageKeyword);
  registry.register({ ...OnStageKeyword, id: 'Stage' });
  registry.register({ ...OnStageKeyword, id: 'Solo Stage' });
  registry.register({ ...OnStageKeyword, id: 'Aikatsu On Stage' });
  registry.register(ShowUpKeyword);
  registry.register(FriendKeyword);
  registry.register(AppealKeyword);
  registry.register(MyUnitKeyword);
  registry.register(SoloPartKeyword);
  registry.register(DuetPartKeyword);
  registry.register(DigivolutionKeyword);
  registry.register({ ...DigivolutionKeyword, id: 'Digivolve' });
  registry.register({ ...DigivolutionKeyword, id: 'Warp Digivolve' });
  registry.register(TransAmKeyword);
  registry.register(FunnelKeyword);
  registry.register(BarrageKeyword);
}
