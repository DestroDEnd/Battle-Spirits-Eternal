/**
 * engine/triggers.js
 *
 * Unified Trigger Registration, Deterministic Queue & Lifecycle Manager (Phase 4C.3.4).
 *
 * Lifecycle States:
 *   DETECTED -> PENDING -> [OFFERED -> ACCEPTED | DECLINED] -> RESOLVING -> RESOLVED | FAILED
 *   (DETECTED | PENDING | OFFERED -> CANCELLED)
 *
 * Engine Ordering Convention:
 *   When simultaneous triggers are detected from a single event, active player's
 *   triggers are queued before the non-turn player's triggers, and within each player
 *   ordered deterministically by (zoneOrder, stackIndex, abilityIndex).
 */

import { computeLevel } from './continuous.js';
import { reserveRestriction, RESTRICTION_STATUS } from './restrictions.js';

export const TRIGGER_STATUS = {
  DETECTED: 'DETECTED',
  PENDING: 'PENDING',
  OFFERED: 'OFFERED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  RESOLVING: 'RESOLVING',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

export const LEGAL_TRIGGER_TRANSITIONS = {
  DETECTED: new Set(['PENDING', 'CANCELLED']),
  PENDING: new Set(['OFFERED', 'ACCEPTED', 'RESOLVING', 'CANCELLED']),
  OFFERED: new Set(['ACCEPTED', 'DECLINED', 'CANCELLED']),
  ACCEPTED: new Set(['RESOLVING', 'CANCELLED']),
  DECLINED: new Set([]),
  RESOLVING: new Set(['RESOLVED', 'FAILED']),
  RESOLVED: new Set([]),
  CANCELLED: new Set([]),
  FAILED: new Set([])
};

export function transitionTriggerStatus(trigger, nextStatus, reason = null) {
  const allowed = LEGAL_TRIGGER_TRANSITIONS[trigger.status];
  if (!allowed || !allowed.has(nextStatus)) {
    throw new Error(`ILLEGAL_TRIGGER_TRANSITION: Cannot move trigger ${trigger.id} from ${trigger.status} to ${nextStatus}`);
  }
  trigger.status = nextStatus;
  if (reason) trigger.statusReason = reason;
  return trigger;
}

const EVENT_TO_TIMINGS = {
  SUMMONED: new Set(['WHEN_SUMMONED', 'WHEN_SUMMONED_OR_DESTROYED']),
  DEPLOYED: new Set(['WHEN_DEPLOYED']),
  DESTROYED: new Set(['WHEN_DESTROYED', 'WHEN_SUMMONED_OR_DESTROYED']),
  ATTACK_DECLARED: new Set(['WHEN_ATTACKS', 'WHEN_ATTACKS_OR_BLOCKS', 'WHEN_BATTLES']),
  BLOCK_DECLARED: new Set(['WHEN_BLOCKS', 'WHEN_ATTACKS_OR_BLOCKS', 'WHEN_BATTLES']),
  STEP_START: new Set(['AT_START_OF_STEP']),
  STEP_END: new Set(['AT_END_OF_STEP']),
  TURN_START: new Set(['AT_START_OF_TURN']),
  TURN_END: new Set(['AT_END_OF_TURN'])
};

export class TriggerQueueManager {
  constructor(game) {
    this.game = game;
    this.queue = [];
    this.history = [];
    this.seenEventTriggerKeys = new Set();
    this.nextTriggerSeq = 1;
    this.nextEventSeq = 1;
  }

  /**
   * Detects matching compiled abilities for an event and queues them deterministically
   * without duplicating triggers for the same event.
   */
  detectAndQueue(event, options = {}) {
    if (!event || !event.type) return [];
    const { state } = this.game;
    const validTimings = EVENT_TO_TIMINGS[event.type];
    if (!validTimings) return [];

    const eventKey = event._eventId || `${event.type}_${this.nextEventSeq++}`;
    event._eventId = eventKey;

    const active = state.activePlayer || 'player';
    const inactive = active === 'player' ? 'opponent' : 'player';
    const playerOrder = [active, inactive];

    const detected = [];

    for (const side of playerOrder) {
      const p = state.players?.[side];
      if (!p) continue;

      // Candidate cards depend on event type
      const candidates = [];
      if (event.type === 'DESTROYED' && event.card && (event.fromSide === side || event.card.owner === side)) {
        candidates.push({ card: event.card, stack: null, zone: 'grave', index: 0, canLeaveField: true });
      } else if ((event.type === 'SUMMONED' || event.type === 'DEPLOYED') && event.card && event.player === side) {
        const stack = event.stack || (p.field || []).find(st => st.top?.id === event.card.id) || null;
        candidates.push({ card: event.card, stack, zone: 'field', index: 0, canLeaveField: false });
      } else if (event.type === 'ATTACK_DECLARED' && event.attacker && event.player === side) {
        candidates.push({ card: event.attacker.top, stack: event.attacker, zone: 'field', index: 0, canLeaveField: false });
      } else if (event.type === 'BLOCK_DECLARED' && event.blocker && event.player === side) {
        candidates.push({ card: event.blocker.top, stack: event.blocker, zone: 'field', index: 0, canLeaveField: false });
      } else if (event.type === 'TURN_START' || event.type === 'TURN_END' || event.type === 'STEP_START' || event.type === 'STEP_END') {
        (p.field || []).forEach((st, idx) => {
          if (st?.top) candidates.push({ card: st.top, stack: st, zone: 'field', index: idx, canLeaveField: false });
        });
      }

      for (const cand of candidates) {
        const abilities = cand.card?.compiledIr?.abilities || [];
        for (let abIdx = 0; abIdx < abilities.length; abIdx++) {
          const ab = abilities[abIdx];
          const timing = String(ab.header?.timing || '').toUpperCase();
          if (!validTimings.has(timing)) continue;

          if (timing === 'AT_START_OF_STEP' || timing === 'AT_END_OF_STEP') {
            if (ab.header?.step && String(ab.header.step).toUpperCase() !== String(event.step || '').toUpperCase()) {
              continue;
            }
          }

          if (cand.stack && ab.header?.levels?.length) {
            const lv = computeLevel(cand.stack, state);
            if (!ab.header.levels.includes(lv)) continue;
          } else if (event.level && ab.header?.levels?.length && !ab.header.levels.includes(event.level)) {
            continue;
          }

          const abId = ab.physicalId || ab.id || `ab_${abIdx}`;
          const dedupKey = `${eventKey}:${cand.card.id}:${abId}`;
          if (this.seenEventTriggerKeys.has(dedupKey)) {
            continue; // Never register the same trigger twice for one event
          }
          this.seenEventTriggerKeys.add(dedupKey);

          const triggerRecord = {
            id: `trig_${this.nextTriggerSeq++}`,
            dedupKey,
            sourceCard: cand.card,
            sourceCardId: cand.card.id,
            sourceStack: cand.stack,
            ability: ab,
            physicalAbilityId: ab.physicalId || null,
            semanticAbilityId: ab.semanticId || null,
            legacyId: ab.legacyId || null,
            controllerAtTrigger: side,
            owner: cand.card.owner || side,
            timing,
            triggerType: ab.header?.trigger || timing,
            triggeringEvent: event,
            isOptional: Boolean(ab.header?.isOptional || options.isOptional),
            requiresSourceInZone: cand.canLeaveField ? null : 'field',
            canResolveAfterLeavingField: Boolean(cand.canLeaveField),
            status: TRIGGER_STATUS.DETECTED,
            statusReason: null,
            sequenceOrder: this.nextTriggerSeq
          };

          transitionTriggerStatus(triggerRecord, TRIGGER_STATUS.PENDING);
          this.queue.push(triggerRecord);
          this.history.push(triggerRecord);
          detected.push(triggerRecord);
        }
      }
    }

    return detected;
  }

  /**
   * Cancels pending triggers belonging to `cardId` when the source leaves its required zone.
   */
  cancelTriggersForCard(cardId, reason = 'SOURCE_LEFT_FIELD') {
    let count = 0;
    for (const trig of this.queue) {
      if (
        trig.sourceCardId === cardId &&
        !trig.canResolveAfterLeavingField &&
        (trig.status === TRIGGER_STATUS.DETECTED || trig.status === TRIGGER_STATUS.PENDING || trig.status === TRIGGER_STATUS.OFFERED)
      ) {
        transitionTriggerStatus(trig, TRIGGER_STATUS.CANCELLED, reason);
        count++;
      }
    }
    return count;
  }

  /**
   * Resolves all currently queued pending triggers in deterministic FIFO/priority order.
   */
  async resolvePendingQueue(contextExtras = {}) {
    const { state, resolver, events } = this.game;
    const results = [];

    while (this.queue.length > 0) {
      const trig = this.queue.shift();
      if (trig.status === TRIGGER_STATUS.CANCELLED || trig.status === TRIGGER_STATUS.RESOLVED || trig.status === TRIGGER_STATUS.DECLINED) {
        continue;
      }

      // 1. Validate source zone requirement
      if (trig.requiresSourceInZone === 'field' && !trig.canResolveAfterLeavingField) {
        const currentOwner = trig.controllerAtTrigger;
        const stillOnField = (state.players?.[currentOwner]?.field || []).some(st => st.top?.id === trig.sourceCardId);
        if (!stillOnField) {
          transitionTriggerStatus(trig, TRIGGER_STATUS.CANCELLED, 'SOURCE_LEFT_FIELD');
          results.push({ triggerId: trig.id, status: trig.status, reason: trig.statusReason });
          continue;
        }
      }

      // 2. Optional trigger offer
      if (trig.isOptional) {
        transitionTriggerStatus(trig, TRIGGER_STATUS.OFFERED);
        const decision = await resolver.promptResolver.choose({
          type: 'OPTIONAL_TRIGGER',
          title: `Activate triggered ability of ${trig.sourceCard?.name || 'card'}?`,
          trigger: trig,
          chooser: trig.controllerAtTrigger
        });
        if (!decision || decision.declined || decision.activate === false) {
          transitionTriggerStatus(trig, TRIGGER_STATUS.DECLINED, 'PLAYER_DECLINED');
          results.push({ triggerId: trig.id, status: trig.status, reason: trig.statusReason });
          continue;
        }
        transitionTriggerStatus(trig, TRIGGER_STATUS.ACCEPTED);
      } else {
        transitionTriggerStatus(trig, TRIGGER_STATUS.ACCEPTED);
      }

      // 3. Reserve activation capacity before RESOLVING
      const context = {
        controller: trig.controllerAtTrigger,
        sourceCard: trig.sourceCard,
        sourceStack: trig.sourceStack,
        placementId: trig.sourceStack?.placementId || trig.sourceCard?.placementId,
        triggerOrigin: trig.id,
        ...contextExtras
      };

      const reservation = reserveRestriction(state, trig.ability, context);
      if (!reservation.success) {
        transitionTriggerStatus(trig, TRIGGER_STATUS.CANCELLED, reservation.status || RESTRICTION_STATUS.LIMIT_REACHED);
        results.push({ triggerId: trig.id, status: trig.status, reason: trig.statusReason });
        continue;
      }
      context.reservation = reservation;

      transitionTriggerStatus(trig, TRIGGER_STATUS.RESOLVING);
      try {
        const res = await resolver.resolveAbility(state, trig.ability, context, events);
        transitionTriggerStatus(trig, TRIGGER_STATUS.RESOLVED);
        results.push({ triggerId: trig.id, status: trig.status, result: res });
      } catch (err) {
        transitionTriggerStatus(trig, TRIGGER_STATUS.FAILED, err?.message || 'RESOLUTION_ERROR');
        throw err;
      } finally {
        if (!context.isCommitted) {
          reservation.release();
        }
      }
    }

    return results;
  }
}
