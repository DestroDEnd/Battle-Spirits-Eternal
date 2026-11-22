/**
 * engine/windows.js
 *
 * Unified Timing Windows & Priority Resolution for Battle Spirits Eternal.
 * Supports nested timing windows, priority enforcement, Burst windows, and Flash windows.
 */

import { moveCard } from './zones.js';
import { calculateEffectiveCost } from './payment.js';
import { evaluateStructuredCondition, CONDITION_RESULT } from './conditions.js';
import { computeLevel } from './continuous.js';

export const WINDOW_TYPES = {
  MAIN_ACTION: 'MAIN_ACTION',
  ATTACK_DECLARATION: 'ATTACK_DECLARATION',
  FLASH: 'FLASH',
  BLOCK_DECLARATION: 'BLOCK_DECLARATION',
  BATTLE_RESOLUTION: 'BATTLE_RESOLUTION',
  BURST: 'BURST',
  TRIGGER_RESOLUTION: 'TRIGGER_RESOLUTION',
  CARD_PLAY: 'CARD_PLAY',
  EFFECT_RESOLUTION: 'EFFECT_RESOLUTION',
  INTERRUPT: 'INTERRUPT',
  REPLACEMENT: 'REPLACEMENT',
  OPTIONAL_DECISION: 'OPTIONAL_DECISION',
  END_OF_STEP: 'END_OF_STEP',
  END_OF_TURN: 'END_OF_TURN'
};

export const WINDOW_STATUS = {
  OPEN: 'OPEN',
  SUSPENDED: 'SUSPENDED',
  RESOLVING: 'RESOLVING',
  CLOSED: 'CLOSED'
};

export class TimingWindowManager {
  constructor(game) {
    this.game = game;
    this.windowStack = [];
    this.nextWindowSeq = 1;
  }

  /**
   * Opens a new timing window, suspending any active parent window.
   */
  async openWindow({
    type,
    activePlayer = null,
    priorityPlayer = null,
    eligibleActions = ['PASS'],
    entryConditions = null,
    exitConditions = null,
    sourceEvent = null,
    sourceAbility = null,
    interruptible = true,
    resumable = true
  }) {
    const { state, events } = this.game;
    const parent = this.getCurrentWindow();
    if (parent && !parent.interruptible) {
      throw new Error(`WINDOW_NOT_INTERRUPTIBLE: Cannot open ${type} inside ${parent.type}`);
    }
    if (parent && parent.status === WINDOW_STATUS.OPEN) {
      parent.status = WINDOW_STATUS.SUSPENDED;
    }

    const active = activePlayer || state.activePlayer;
    const priority = priorityPlayer || active;
    const win = {
      id: `win_${this.nextWindowSeq++}`,
      type,
      activePlayer: active,
      priorityPlayer: priority,
      eligibleActions: [...eligibleActions],
      entryConditions,
      exitConditions,
      pendingTriggers: [],
      parentWindowId: parent ? parent.id : null,
      status: WINDOW_STATUS.OPEN,
      sourceEvent,
      sourceAbility,
      interruptible: Boolean(interruptible),
      resumable: Boolean(resumable),
      consecutivePasses: 0
    };

    this.windowStack.push(win);
    if (events) {
      await events.emit({
        type: 'TIMING_WINDOW_OPENED',
        windowId: win.id,
        windowType: win.type,
        parentWindowId: win.parentWindowId,
        priorityPlayer: win.priorityPlayer
      });
    }
    return win;
  }

  /**
   * Closes the specified (or top) timing window and resumes its parent window if any.
   */
  async closeWindow(windowId = null) {
    if (this.windowStack.length === 0) return null;
    const top = this.windowStack[this.windowStack.length - 1];
    if (windowId && top.id !== windowId) {
      throw new Error(`WINDOW_STACK_ORDER_ERROR: Expected top window ${top.id}, got ${windowId}`);
    }
    const closed = this.windowStack.pop();
    closed.status = WINDOW_STATUS.CLOSED;

    const parent = this.getCurrentWindow();
    if (parent && parent.status === WINDOW_STATUS.SUSPENDED && parent.resumable) {
      parent.status = WINDOW_STATUS.OPEN;
    }

    if (this.game.events) {
      await this.game.events.emit({
        type: 'TIMING_WINDOW_CLOSED',
        windowId: closed.id,
        windowType: closed.type,
        resumedParentWindowId: parent ? parent.id : null
      });
    }
    return closed;
  }

  getCurrentWindow() {
    return this.windowStack.length > 0 ? this.windowStack[this.windowStack.length - 1] : null;
  }

  /**
   * Validates whether `playerSide` is legally permitted to perform `actionType`
   * under the currently active timing window.
   */
  canPerformAction(actionType, playerSide) {
    const win = this.getCurrentWindow();
    if (!win) {
      return { allowed: true, window: null };
    }
    if (win.status !== WINDOW_STATUS.OPEN) {
      return { allowed: false, reason: 'WINDOW_NOT_OPEN', window: win };
    }
    if (win.priorityPlayer !== playerSide) {
      return { allowed: false, reason: 'NOT_PRIORITY_PLAYER', window: win };
    }
    if (!win.eligibleActions.includes(actionType)) {
      return { allowed: false, reason: 'ACTION_NOT_ELIGIBLE_IN_WINDOW', window: win };
    }
    return { allowed: true, window: win };
  }

  /**
   * Passes priority in the active window. Closes the window after 2 consecutive passes.
   */
  async passPriority(playerSide) {
    const check = this.canPerformAction('PASS', playerSide);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }
    const win = check.window;
    if (!win) return { success: true, closed: false };

    win.consecutivePasses++;
    if (win.consecutivePasses >= 2) {
      const closed = await this.closeWindow(win.id);
      return { success: true, closed: true, window: closed };
    }
    win.priorityPlayer = playerSide === 'player' ? 'opponent' : 'player';
    return { success: true, closed: false, nextPriority: win.priorityPlayer };
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

    const win = await this.openWindow({
      type: WINDOW_TYPES.BURST,
      activePlayer,
      priorityPlayer: inactivePlayer,
      eligibleActions: ['ACTIVATE_BURST', 'PASS'],
      sourceEvent: triggerEvent
    });

    try {
      const declarationOrder = [inactivePlayer, activePlayer];
      const declaredBursts = [];

      for (const side of declarationOrder) {
        const p = state.players[side];
        if (!p.burst) continue;

        const burstCard = p.burst;
        if (!this.matchesBurstCondition(burstCard, triggerEvent, side)) {
          continue;
        }

        const isLocked = (state.modifiers || []).some(m =>
          (m.type === 'BURST_LOCK' && (!m.side || m.side === 'both' || m.side === side)) ||
          (m.type === 'SET_RESTRICTION' && (!m.side || m.side === 'both' || m.side === side) && String(m.restriction || '').toUpperCase() === 'CANNOT_ACTIVATE_BURST')
        );
        if (isLocked) continue;

        win.priorityPlayer = side;
        const decision = await resolver.promptResolver.choose({
          type: 'BURST_TRIGGER',
          title: `Activate Burst [${burstCard.name}]?`,
          burstCard,
          chooser: side
        });

        if (decision && decision.activate) {
          p.burst = null;
          declaredBursts.push({ side, burstCard });

          await this.game.events.emit({
            type: 'BURST_DECLARED',
            card: burstCard,
            player: side,
            triggerEvent
          });
        }
      }

      win.status = WINDOW_STATUS.RESOLVING;
      for (const { side, burstCard } of declaredBursts) {
        const p = state.players[side];

        await this.game.events.emit({
          type: 'BURST_ACTIVATED',
          card: burstCard,
          player: side,
          triggerEvent
        });

        if (burstCard.compiledIr && burstCard.compiledIr.abilities) {
          for (const ab of burstCard.compiledIr.abilities) {
            if (ab.header.timing === 'BURST') {
              await resolver.resolveAbility(state, ab, { controller: side, sourceCard: burstCard, activeBurstCard: burstCard }, this.game.events);
            }
          }
        }

        const onField = p.field.some(st => st.top.id === burstCard.id);
        if (!onField) {
          await moveCard(state, burstCard, 'grave', side, { cause: 'burst_resolved' }, this.game.events);
        }
      }
    } finally {
      if (this.getCurrentWindow()?.id === win.id) {
        await this.closeWindow(win.id);
      }
    }
  }

  matchesBurstCondition(burstCard, event, side) {
    if (!burstCard.compiledIr || !burstCard.compiledIr.abilities) {
      // Explicit legacy compatibility fallback for uncompiled test cards without compiledIr
      const eff = (burstCard.effect || '').toLowerCase();
      if (event.type === 'LIFE_REDUCED' && eff.includes('life is reduced') && event.player === side) return true;
      if (event.type === 'DESTROYED' && eff.includes('destroyed by the opponent') && (!event.card || event.card.owner === side) && event.by !== side) return true;
      return false;
    }

    const burstAb = burstCard.compiledIr.abilities.find(a => a.header.timing === 'BURST');
    if (!burstAb || !burstAb.header.burstCondition) return false;

    // Evaluate structured condition AST on burst ability if present
    if (burstAb.condition) {
      const evalRes = evaluateStructuredCondition(this.game.state, burstAb.condition, {
        controller: side,
        sourceCard: burstCard,
        triggerEvent: event
      });
      if (evalRes.result !== CONDITION_RESULT.TRUE) {
        return false;
      }
    }

    const cond = burstAb.header.burstCondition;
    const oppSide = side === 'player' ? 'opponent' : 'player';

    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side) && event.by === oppSide;
    }

    if (cond === 'AFTER_YOUR_SPIRIT_DESTROYED') {
      return event.type === 'DESTROYED' && (!event.card || event.card.owner === side);
    }

    if (cond === 'AFTER_YOUR_SPIRIT_DEPLETED') {
      return (event.type === 'DESTROYED' && event.cause === 'depletion' && (!event.card || event.card.owner === side)) ||
        (event.type === 'SPIRIT_DEPLETED' && (event.card ? event.card.owner === side : event.player === side));
    }

    if (cond === 'AFTER_YOUR_LIFE_REDUCED') {
      return event.type === 'LIFE_REDUCED' && event.player === side;
    }

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
   * Defending (non-turn) player ALWAYS gets first priority in both Flash 1 and Flash 2.
   */
  async runFlashWindow(flashTiming = 'FLASH_1') {
    const { state, resolver } = this.game;
    const attackerSide = state.activePlayer;
    const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';

    const win = await this.openWindow({
      type: WINDOW_TYPES.FLASH,
      activePlayer: attackerSide,
      priorityPlayer: defenderSide,
      eligibleActions: ['PASS', 'CAST_FLASH_MAGIC', 'HIGH_SPEED_SUMMON', 'ACTIVATE_FLASH_ABILITY'],
      sourceEvent: { type: 'FLASH_WINDOW', timing: flashTiming }
    });

    await this.game.events.emit({
      type: 'FLASH_WINDOW_OPEN',
      timing: flashTiming,
      firstPriority: defenderSide,
      windowId: win.id
    });

    try {
      while (win.consecutivePasses < 2 && !state.winner) {
        const currentPriority = win.priorityPlayer;
        const availableActions = this.getAvailableFlashActions(currentPriority, attackerSide);

        const decision = await resolver.promptResolver.choose({
          type: 'FLASH_ACTION',
          title: `Flash Window (${flashTiming}) - ${currentPriority}'s Turn`,
          availableActions,
          chooser: currentPriority,
          windowId: win.id
        });

        if (!decision || decision.action === 'PASS' || !decision.action) {
          win.consecutivePasses++;
          win.priorityPlayer = currentPriority === 'player' ? 'opponent' : 'player';
        } else {
          const check = this.canPerformAction(decision.action, currentPriority);
          if (!check.allowed) {
            throw new Error(`ILLEGAL_FLASH_ACTION: ${check.reason}`);
          }
          win.consecutivePasses = 0;
          await this.executeFlashAction(decision, currentPriority);
          win.priorityPlayer = currentPriority === 'player' ? 'opponent' : 'player';
        }
      }

      await this.game.events.emit({
        type: 'FLASH_WINDOW_CLOSED',
        timing: flashTiming,
        windowId: win.id
      });
    } finally {
      if (this.getCurrentWindow()?.id === win.id) {
        await this.closeWindow(win.id);
      }
    }
  }

  getAvailableFlashActions(playerSide, turnAttackerSide) {
    const { state } = this.game;
    const p = state.players[playerSide];
    const actions = [{ action: 'PASS', label: 'Pass Priority' }];
    const isOwnerTurn = playerSide === turnAttackerSide;

    for (const card of p.hand || []) {
      if (card.type === 'Magic') {
        if (card.compiledIr && card.compiledIr.abilities) {
          const flashAb = card.compiledIr.abilities.find(a => a.header?.isFlash || a.header?.timing === 'FLASH');
          if (flashAb) {
            // Prefer structured timing metadata over timingLabel compatibility fallback
            const turnRest = String(flashAb.header?.turnRestriction || '').toUpperCase();
            const timingStep = String(flashAb.header?.timingStep || '').toUpperCase();
            if (turnRest === 'OPPOSING_ATTACK_STEP' || timingStep === 'OPPOSING_ATTACK_STEP') {
              if (isOwnerTurn) continue;
            } else if (turnRest === 'YOUR_ATTACK_STEP' || timingStep === 'YOUR_ATTACK_STEP') {
              if (!isOwnerTurn) continue;
            } else {
              const timingLabel = (flashAb.header.timingLabel || '').toLowerCase();
              if (isOwnerTurn && (timingLabel.includes('opposing') || timingLabel.includes('opponent'))) {
                continue;
              }
              if (!isOwnerTurn && timingLabel.includes('your attack step')) {
                continue;
              }
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

    // Field Spirits/Nexuses with Flash abilities
    for (const stack of p.field || []) {
      const card = stack.top;
      if (!card?.compiledIr?.abilities) continue;
      const lv = computeLevel(stack, state);
      for (const ab of card.compiledIr.abilities) {
        const timing = String(ab.header?.timing || '').toUpperCase();
        if (timing !== 'FLASH' && timing !== 'FLASH_TIMING') continue;
        if (ab.header?.levels?.length && !ab.header.levels.includes(lv)) continue;
        const turnRest = String(ab.header?.turnRestriction || '').toUpperCase();
        const timingStep = String(ab.header?.timingStep || '').toUpperCase();
        if ((turnRest === 'OPPOSING_ATTACK_STEP' || turnRest === 'OPPONENT_TURN' || timingStep === 'OPPOSING_ATTACK_STEP') && isOwnerTurn) continue;
        if ((turnRest === 'YOUR_ATTACK_STEP' || turnRest === 'YOUR_TURN' || timingStep === 'YOUR_ATTACK_STEP') && !isOwnerTurn) continue;
        actions.push({
          action: 'ACTIVATE_FLASH_ABILITY',
          card,
          abilityId: ab.physicalId || ab.id,
          label: `[Flash] ${card.name} Ability`
        });
      }
    }

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
      } else if (card.type === 'Spirit' || card.type === 'Ultimate' || card.type === 'Brave') {
        const effectText = String(card.effect || card.raw_effect || '');
        const hasAccel = Boolean(
          (card.compiledIr?.abilities || []).some(a => /accel/i.test(String(a.header?.keyword || '')) || (a.header?.prefixes || []).some(pr => /accel/i.test(String(pr)))) ||
          /\[accel/i.test(effectText)
        );
        if (hasAccel) {
          const isFlash = Boolean(
            (card.compiledIr?.abilities || []).some(a => a.header?.isFlash || String(a.header?.timing || '').toUpperCase() === 'FLASH') ||
            /(?:^|\s|\b)Flash\s*-\s*\[Accel/i.test(effectText) ||
            /\[Accel[^\]]*\(Flash[^)]*\)\]/i.test(effectText) ||
            /(?:^|\s|\b)Flash(?:\s*-\s*|:|\s*\()/i.test(effectText)
          );
          if (isFlash) {
            const m = effectText.match(/\[Accel:\s*Cost\s+(\d+)/i);
            const rawCost = m ? parseInt(m[1], 10) : (card.accelCost ?? 0);
            const accelShim = { ...card, cost: Number(rawCost) || 0 };
            const cost = calculateEffectiveCost(state, accelShim, playerSide);
            actions.push({
              action: 'USE_ACCEL',
              card,
              cost,
              label: `[Accel] ${card.name} (Cost: ${cost})`
            });
          }
        }
      }
    }

    return actions;
  }

  async executeFlashAction(decision, playerSide) {
    if (decision.action === 'CAST_FLASH_MAGIC' && decision.card) {
      await this.game.playCard(decision.card.id, [], playerSide);
    } else if (decision.action === 'ACTIVATE_FLASH_ABILITY' && decision.card && decision.abilityId) {
      await this.game.activateAbility(decision.card.id, decision.abilityId, playerSide);
    } else if (decision.action === 'HIGH_SPEED_SUMMON' && decision.card) {
      const { HighSpeedKeyword } = await import('./keywords/wave2.js');
      await HighSpeedKeyword.executeHighSpeedSummon(this.game, decision.card, playerSide);
    } else if (decision.action === 'USE_ACCEL' && decision.card) {
      if (typeof this.game.executeAccel === 'function') {
        await this.game.executeAccel(playerSide, decision.card.id);
      }
    }
  }
}
