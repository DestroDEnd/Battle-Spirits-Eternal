/**
 * engine/windows.js
 * 
 * Timing Windows & Priority Resolution for Battle Spirits Eternal.
 * Manages Burst Windows and Flash Windows with priority passing.
 */

import { moveCard } from './zones.js';
import { calculateEffectiveCost } from './payment.js';

export class TimingWindowManager {
  constructor(game) {
    this.game = game;
  }

  /**
   * Evaluates Burst triggers following an event.
   * In Eternal 17.0: Simultaneous declaration with hand triggers.
   * Declaration Priority: Non-turn player declares first, then Turn player.
   * Resolution: Declared Bursts resolve in FIFO order.
   */
  async openBurstWindow(triggerEvent) {
    const { state, resolver } = this.game;
    const activePlayer = state.activePlayer;
    const inactivePlayer = activePlayer === 'player' ? 'opponent' : 'player';

    // Eternal 17.0: Non-turn player declares first, followed by turn player
    const declarationOrder = [inactivePlayer, activePlayer];
    const declaredBursts = [];

    for (const side of declarationOrder) {
      const p = state.players[side];
      if (!p.burst) continue;

      const burstCard = p.burst;
      if (!this.matchesBurstCondition(burstCard, triggerEvent, side)) {
        continue;
      }

      // Check BURST_LOCK
      const isLocked = state.modifiers.some(m => m.type === 'BURST_LOCK' && m.side === side);
      if (isLocked) continue;

      // Prompt player to declare burst
      const decision = await resolver.promptResolver.choose({
        type: 'BURST_TRIGGER',
        title: `Activate Burst [${burstCard.name}]?`,
        burstCard,
        chooser: side
      });

      if (decision && decision.activate) {
        // Declared! Remove from burst slot immediately
        p.burst = null;
        declaredBursts.push({ side, burstCard });

        // Emit declaration event (allows interrupters like Spitzer Dragon to hook)
        await this.game.events.emit({
          type: 'BURST_DECLARED',
          card: burstCard,
          player: side,
          triggerEvent
        });
      }
    }

    // Resolve declared Bursts in FIFO declaration order
    for (const { side, burstCard } of declaredBursts) {
      const p = state.players[side];

      await this.game.events.emit({
        type: 'BURST_ACTIVATED',
        card: burstCard,
        player: side,
        triggerEvent
      });

      // Resolve Burst abilities
      if (burstCard.compiledIr && burstCard.compiledIr.abilities) {
        for (const ab of burstCard.compiledIr.abilities) {
          if (ab.header.timing === 'BURST') {
            await resolver.resolveAbility(state, ab, { controller: side, sourceCard: burstCard }, this.game.events);
          }
        }
      }

      // If burst card was not summoned to field by effect, send to grave
      const onField = p.field.some(st => st.top.id === burstCard.id);
      if (!onField) {
        await moveCard(state, burstCard, 'grave', side, { cause: 'burst_resolved' }, this.game.events);
      }
    }
  }

  matchesBurstCondition(burstCard, event, side) {
    if (!burstCard.compiledIr || !burstCard.compiledIr.abilities) {
      // Fallback text check
      const eff = (burstCard.effect || '').toLowerCase();
      if (event.type === 'LIFE_REDUCED' && eff.includes('life is reduced') && event.player === side) return true;
      if (event.type === 'DESTROYED' && eff.includes('destroyed by the opponent') && (!event.card || event.card.owner === side) && event.by !== side) return true;
      return false;
    }

    const burstAb = burstCard.compiledIr.abilities.find(a => a.header.timing === 'BURST');
    if (!burstAb || !burstAb.header.burstCondition) return false;

    const cond = burstAb.header.burstCondition;
    const oppSide = side === 'player' ? 'opponent' : 'player';

    // R20: Sacrifice destroys own spirit -> NOT destroyed by opponent!
    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side) && event.by === oppSide;
    }

    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side);
    }

    // R21: Life reduced only triggers AFTER_YOUR_LIFE_REDUCED
    if (cond === 'AFTER_YOUR_LIFE_REDUCED') {
      return event.type === 'LIFE_REDUCED' && event.player === side;
    }

    // R22: Vanilla summon does NOT trigger AFTER_OPPONENT_SUMMON_EFFECT
    if (cond === 'AFTER_OPPONENT_SUMMON_EFFECT') {
      return event.type === 'SUMMONED' && event.player === oppSide && (!event.card || !event.card.isVanilla);
    }

    if (cond === 'AFTER_OPPONENT_ATTACK') {
      return event.type === 'ATTACK_DECLARED' && event.player === oppSide;
    }

    return false;
  }

  /**
   * Executes a Flash Window with alternating priority until both players pass consecutively.
   * In Battle Spirits: Defending (non-turn) player ALWAYS gets first priority in both Flash 1 and Flash 2.
   */
  async runFlashWindow(flashTiming = 'FLASH_1') {
    const { state, resolver } = this.game;
    const attackerSide = state.activePlayer;
    const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';

    // Defending player always gets first priority in both Flash timings
    let currentPriority = defenderSide;
    let consecutivePasses = 0;

    await this.game.events.emit({
      type: 'FLASH_WINDOW_OPEN',
      timing: flashTiming,
      firstPriority: currentPriority
    });

    while (consecutivePasses < 2 && !state.winner) {
      const p = state.players[currentPriority];
      const availableActions = this.getAvailableFlashActions(currentPriority, attackerSide);

      const decision = await resolver.promptResolver.choose({
        type: 'FLASH_ACTION',
        title: `Flash Window (${flashTiming}) - ${currentPriority}'s Turn`,
        availableActions,
        chooser: currentPriority
      });

      if (!decision || decision.action === 'PASS' || !decision.action) {
        consecutivePasses++;
      } else {
        consecutivePasses = 0; // Reset consecutive pass count
        await this.executeFlashAction(decision, currentPriority);
      }

      // Switch priority to the other player
      currentPriority = currentPriority === 'player' ? 'opponent' : 'player';
    }

    await this.game.events.emit({
      type: 'FLASH_WINDOW_CLOSED',
      timing: flashTiming
    });
  }

  getAvailableFlashActions(playerSide, turnAttackerSide) {
    const { state } = this.game;
    const p = state.players[playerSide];
    const actions = [{ action: 'PASS', label: 'Pass Priority' }];
    const isOwnerTurn = playerSide === turnAttackerSide;

    // Check Flash Magic in hand
    for (const card of p.hand || []) {
      if (card.type === 'Magic') {
        // R17: Check turn restrictions (e.g. "Opposing Attack Step" when it's your turn)
        if (card.compiledIr && card.compiledIr.abilities) {
          const flashAb = card.compiledIr.abilities.find(a => a.header.isFlash);
          if (flashAb) {
            const timingLabel = (flashAb.header.timingLabel || '').toLowerCase();
            if (isOwnerTurn && (timingLabel.includes('opposing') || timingLabel.includes('opponent'))) {
              continue; // Not castable on your turn!
            }
            if (!isOwnerTurn && timingLabel.includes('your attack step')) {
              continue; // Not castable on opponent's turn!
            }

            const cost = calculateEffectiveCost(state, card, playerSide);
            actions.push({
              action: 'CAST_FLASH_MAGIC',
              card,
              cost,
              label: `[Flash] ${card.name} (Cost: ${cost})`
            });
          }
        }
      }
    }

    // Check High Speed spirits in hand
    for (const card of p.hand || []) {
      if (card.effect && card.effect.includes('High Speed')) {
        const cost = card.cost || 1;
        if (p.reserve.normal >= cost + 1) {
          actions.push({
            action: 'HIGH_SPEED_SUMMON',
            card,
            cost,
            label: `[High Speed] ${card.name} (Cost: ${cost})`
          });
        }
      }
    }

    return actions;
  }

  async executeFlashAction(decision, playerSide) {
    if (decision.action === 'CAST_FLASH_MAGIC' && decision.card) {
      await this.game.playCard(decision.card.id, [], playerSide);
    } else if (decision.action === 'HIGH_SPEED_SUMMON' && decision.card) {
      const { HighSpeedKeyword } = await import('./keywords/wave2.js');
      await HighSpeedKeyword.executeHighSpeedSummon(this.game, decision.card, playerSide);
    }
  }
}
