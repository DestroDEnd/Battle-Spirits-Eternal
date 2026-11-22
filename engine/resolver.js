/**
 * engine/resolver.js
 * 
 * Asynchronous IR Ability Resolver.
 * Processes connected clauses with grammar link semantics (then, byDoing, or, instead, afterResolves).
 */

import { executeOp } from './ops/index.js';
import { executeTargeting } from './selectors.js';
import { evaluateStructuredCondition, CONDITION_RESULT } from './conditions.js';
import { evaluateRestriction, commitRestriction, reserveRestriction, RESTRICTION_STATUS } from './restrictions.js';
import { isActionRestricted } from './continuous.js';
import { evaluateAbilityPrefixPrerequisites } from './prerequisites.js';

export { CONDITION_RESULT, RESTRICTION_STATUS };

export function evaluateCondition(state, conditionStr, context = null) {
  return evaluateStructuredCondition(state, conditionStr, context);
}

const TARGET_OP_NAMES = new Set([
  'TARGET',
  'TARGET_CARD',
  'TARGET_SELECT',
  'SELECT_TARGET',
  'TARGET_CARDS',
  'CHOOSE_TARGETS'
]);

const TARGET_PROPAGATING_OPS = new Set(['DESTROY', 'BOUNCE']);

/**
 * Checks whether an operation is an explicit targeting operation.
 */
function isTargetingOperation(clause, res) {
  if (!res) return false;
  if (res.isTargetingResult === true) return true;
  // If execution never reached the operation handler (e.g. skipped due to condition),
  // do not treat as an executed targeting operation.
  if (res.skipped && !res.optionalDeclined) return false;
  const opName = clause?.op?.op;
  return Boolean(opName && TARGET_OP_NAMES.has(opName));
}

/**
 * Checks whether any of the remaining clauses in the effect require
 * referencing the previous target or affected target.
 */
function subsequentClausesRequireTarget(remainingClauses) {
  if (!Array.isArray(remainingClauses) || remainingClauses.length === 0) {
    return false;
  }
  for (const c of remainingClauses) {
    if (!c) continue;
    const cop = c.op || {};
    // Check target: PREVIOUS_TARGET / previous / usePreviousTarget
    if (
      cop.target === 'PREVIOUS_TARGET' ||
      cop.target?.target === 'PREVIOUS_TARGET' ||
      cop.target === 'previous' ||
      Boolean(cop.usePreviousTarget) ||
      cop.from === 'previous' ||
      cop.from === 'PREVIOUS_TARGET'
    ) {
      return true;
    }
    // Check filter: sameFamilyAsPrevious
    if (
      cop.sameFamilyAsPrevious ||
      cop.filter?.sameFamilyAsPrevious ||
      cop.filters?.sameFamilyAsPrevious ||
      cop.target?.filter?.sameFamilyAsPrevious ||
      cop.target?.filters?.sameFamilyAsPrevious
    ) {
      return true;
    }
    // Check condition text referencing previous / destroyed / returned / bounced
    if (typeof c.condition === 'string' && /previous|destroyed|bounced|returned/i.test(c.condition)) {
      return true;
    }
    // Check cleanText / rawText referring to the previous / destroyed / returned target
    const text = (c.cleanText || c.rawText || '').toLowerCase();
    if (
      /\b(the destroyed|the returned|the bounced|same family as the destroyed|that spirit|that ultimate|that card|that nexus|that brave)\b/i.test(text)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Determines whether a successful operation should propagate its affected
 * cards into targeting context for downstream clauses.
 */
function shouldPropagateAffectedTargets(clause, res, remainingClauses) {
  if (!res || !res.success || res.declined) return false;
  if (!Array.isArray(res.cards) || res.cards.length === 0) return false;

  // 1. Explicit clause or result contract
  if (res.propagatesTarget === true || res.propagatesAffectedTargets === true || clause?.op?.propagatesTarget === true) {
    return true;
  }
  if (res.propagatesTarget === false || clause?.op?.propagatesTarget === false) {
    return false;
  }

  // 2. Only designated operations can propagate
  const opName = clause?.op?.op;
  if (!opName || !TARGET_PROPAGATING_OPS.has(opName)) {
    return false;
  }

  // 3. For designated operations (DESTROY, BOUNCE), verify that effect grammar
  // in subsequent clauses requires referencing the affected cards
  return subsequentClausesRequireTarget(remainingClauses);
}

/**
 * Synchronizes targeting context across both main clauses and afterResolves follow-up clauses.
 * 
 * Context Lifecycle Rules:
 * 1. Condition & Prerequisite Skips: When a clause is skipped before execution due to condition
 *    evaluation (FALSE or UNSUPPORTED) or unfulfilled prerequisites, existing targeting context
 *    is strictly PRESERVED. Do not infer targeting occurred from clause op name alone when execution
 *    never reached the operation handler.
 * 2. Optional Clause Decline Policy: When an optional targeting clause is declined before
 *    execution (res.optionalDeclined === true), targeting context is explicitly CLEARED so downstream
 *    clauses cannot act on an unchosen target.
 * 3. Executed Targeting Result (res.isTargetingResult === true):
 *    - On Success (and not declined): Updates previousTarget, previousTargets, and selectedTargets.
 *    - On Failure or In-Op Decline: Clears previousTarget (null), previousTargets ([]), and selectedTargets ([]).
 * 4. Designated Propagating Operations (DESTROY, BOUNCE):
 *    - When downstream grammar requires the affected cards (e.g. sameFamilyAsPrevious), updates
 *      previousTarget and previousTargets. selectedTargets remains untouched.
 * 5. Ordinary Operations (DRAW, SUMMON, REVEAL, etc.):
 *    - Preserve targeting context without modification.
 */
function synchronizeTargetingContext(clause, res, abilityContext, remainingClauses) {
  if (!res) return;

  // 1. If the clause was skipped before execution (e.g. condition FALSE or UNSUPPORTED,
  // prerequisite failed, or OR-branch not chosen), execution never reached the targeting handler.
  // Existing targeting context must be preserved without modification.
  if (res.skipped && !res.optionalDeclined) {
    return;
  }

  // 2. Documented Optional Decline Policy:
  // If an optional targeting clause was declined by the player before execution (at clause prompt),
  // clear targeting context so downstream clauses do not execute on a declined target.
  if (res.optionalDeclined && clause?.op?.op && (TARGET_OP_NAMES.has(clause.op.op) || TARGET_PROPAGATING_OPS.has(clause.op.op) || clause.op.target)) {
    abilityContext.previousTarget = null;
    abilityContext.previousTargets = [];
    abilityContext.selectedTargets = [];
    return;
  }

  // 3. Executed targeting operations:
  // An actual targeting operation that reached the handler must have isTargetingResult === true.
  if (res.isTargetingResult === true) {
    if (res.success && !res.declined) {
      const cards = Array.isArray(res.cards) && res.cards.length > 0
        ? res.cards
        : (Array.isArray(res.selected) && res.selected.length > 0
          ? res.selected.map(s => s.card || s)
          : (res.target ? [res.target.card || res.target] : []));

      if (cards.length > 0) {
        abilityContext.previousTarget = cards[0];
        abilityContext.previousTargets = cards;
      } else if (res.target) {
        abilityContext.previousTarget = res.target.card || res.target;
        abilityContext.previousTargets = [abilityContext.previousTarget];
      }
      if (Array.isArray(res.selected) && res.selected.length > 0) {
        abilityContext.selectedTargets = res.selected;
      } else if (cards.length > 0) {
        abilityContext.selectedTargets = cards;
      }
    } else {
      // Targeting failed (e.g. no legal candidates) or was declined during execution:
      // Clear targeting context so earlier targets cannot be silently reused.
      abilityContext.previousTarget = null;
      abilityContext.previousTargets = [];
      abilityContext.selectedTargets = [];
    }
    return;
  }

  // 4. Designated propagating operations (DESTROY, BOUNCE)
  if (shouldPropagateAffectedTargets(clause, res, remainingClauses)) {
    // Only explicitly designated operations (e.g. DESTROY, BOUNCE) whose downstream clauses
    // require referencing the affected cards propagate to previousTarget/previousTargets.
    // Ordinary operations (DRAW, SUMMON, REVEAL, etc.) never reach here.
    abilityContext.previousTarget = res.cards[0];
    abilityContext.previousTargets = res.cards;
  }
}

export class ResolutionDepthExceededError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ResolutionDepthExceededError';
    this.code = 'MAX_RESOLUTION_DEPTH_EXCEEDED';
    this.depth = details.depth ?? 0;
    this.maxDepth = details.maxDepth ?? 32;
  }
}

export class AsyncResolver {
  constructor(promptResolver, options = {}) {
    this.promptResolver = promptResolver || new DefaultPromptResolver();
    this.resolutionStack = [];
    this.nextFrameSeq = 1;
    this.maxResolutionDepth = options.maxResolutionDepth || 32;
  }

  async resolveClause(state, ability, clause, abilityContext, events) {
    // 1. Condition check
    if (clause.condition) {
      const condEval = evaluateCondition(state, clause.condition, abilityContext);
      if (condEval.result === CONDITION_RESULT.INVALID_CONTEXT) {
        return {
          success: false,
          supported: true,
          skipped: true,
          conditionResult: CONDITION_RESULT.INVALID_CONTEXT,
          reason: condEval.reason || 'INVALID_CONDITION_CONTEXT',
          condition: clause.condition
        };
      }
      if (condEval.result === CONDITION_RESULT.UNSUPPORTED) {
        return {
          success: false,
          supported: false,
          skipped: true,
          conditionResult: CONDITION_RESULT.UNSUPPORTED,
          reason: 'UNSUPPORTED_CONDITION',
          condition: clause.condition
        };
      }
      if (condEval.result !== CONDITION_RESULT.TRUE) {
        return {
          success: false,
          skipped: true,
          conditionResult: CONDITION_RESULT.FALSE,
          reason: 'CONDITION_NOT_MET',
          condition: clause.condition
        };
      }
    }

    // 1b. Operation-level condition check (e.g., KEYWORD_ABILITY Rush / PLAY_CONDITION)
    if (clause.op && clause.op.condition != null && clause.op.op !== 'UNBLOCKABLE') {
      const opCondEval = evaluateCondition(state, clause.op.condition, abilityContext);
      if (opCondEval.result === CONDITION_RESULT.INVALID_CONTEXT) {
        return {
          success: false,
          supported: true,
          skipped: true,
          conditionResult: CONDITION_RESULT.INVALID_CONTEXT,
          reason: opCondEval.reason || 'INVALID_CONDITION_CONTEXT',
          condition: clause.op.condition
        };
      }
      if (opCondEval.result === CONDITION_RESULT.UNSUPPORTED) {
        return {
          success: false,
          supported: false,
          skipped: true,
          conditionResult: CONDITION_RESULT.UNSUPPORTED,
          reason: 'UNSUPPORTED_CONDITION',
          condition: clause.op.condition
        };
      }
      if (opCondEval.result !== CONDITION_RESULT.TRUE) {
        return {
          success: false,
          skipped: true,
          conditionResult: CONDITION_RESULT.FALSE,
          reason: 'CONDITION_NOT_MET',
          condition: clause.op.condition
        };
      }
    }

    // 2. Optionality check ("you can", "you may")
    if (clause.isOptional || clause.op?.optional || clause.op?.isOptional) {
      const confirm = await this.promptResolver.choose({
        type: 'CONFIRM_OPTIONAL',
        title: `Activate optional effect: "${clause.cleanText || clause.op?.op}"?`,
        chooser: abilityContext.controller || 'player',
        context: abilityContext
      });
      if (!confirm || confirm.declined) {
        return {
          success: false,
          paid: false,
          skipped: true,
          optionalDeclined: true,
          reason: 'OPTIONAL_DECLINED'
        };
      }
    }

    // 3. Execution and Stage 4 Commitment
    const isTargeting = Boolean(clause?.op && TARGET_OP_NAMES.has(clause.op.op));

    const opToRun = (clause.duration && clause.op && !clause.op.duration)
      ? { ...clause.op, duration: clause.duration }
      : clause.op;

    abilityContext.currentClause = clause;

    if (clause.isCost) {
      // Cost clause: execute cost first
      const res = await executeOp(state, opToRun, abilityContext, this.promptResolver, events);
      const normalized = res && typeof res === 'object' ? { ...res } : { success: Boolean(res) };

      let costPaid = normalized.success !== false && normalized.paid !== false;
      const requiredCount = typeof opToRun?.count === 'number' ? opToRun.count : 1;
      if (normalized.coresMoved !== undefined && normalized.coresMoved < requiredCount) costPaid = false;
      if (normalized.discardedCount !== undefined && normalized.discardedCount < requiredCount) costPaid = false;
      if (normalized.banishedCount !== undefined && normalized.banishedCount < requiredCount) costPaid = false;
      if (normalized.exhaustedCount !== undefined && normalized.exhaustedCount < requiredCount) costPaid = false;
      if (normalized.destroyedCount !== undefined && normalized.destroyedCount < requiredCount) costPaid = false;

      if (!costPaid) {
        normalized.success = false;
        normalized.paid = false;
        if (!normalized.reason) normalized.reason = 'COST_NOT_PAID';
      } else {
        normalized.paid = true;
        // Stage 4 Atomic Commit upon successful cost payment
        if (typeof abilityContext.commitActivation === 'function') {
          const commitRes = await abilityContext.commitActivation();
          if (commitRes && !commitRes.success) {
            return {
              success: false,
              paid: false,
              isCommitted: false,
              commitFailure: true,
              reason: commitRes.status,
              restrictionStatus: commitRes.status
            };
          }
        }
      }
      return normalized;
    }

    if (isTargeting) {
      // Dedicated targeting clause: execute targeting first
      const tRes = await executeTargeting(state, opToRun, abilityContext, this.promptResolver);
      const normalized = tRes && typeof tRes === 'object' ? { ...tRes } : { success: Boolean(tRes) };

      // If targeting succeeded and was not declined: commit activation
      if (normalized.success && !normalized.declined) {
        if (!abilityContext.isCommitted && typeof abilityContext.commitActivation === 'function') {
          const commitRes = await abilityContext.commitActivation();
          if (commitRes && !commitRes.success) {
            return {
              success: false,
              isCommitted: false,
              commitFailure: true,
              reason: commitRes.status,
              restrictionStatus: commitRes.status
            };
          }
        }
      }
      return normalized;
    }

    // Non-cost, non-targeting clause: commit before executing effect operation
    if (!abilityContext.isCommitted && typeof abilityContext.commitActivation === 'function') {
      const hasPriorTargetingClause = (ability?.clauses || []).some(c => c?.op && TARGET_OP_NAMES.has(c.op.op));
      const targetingFailed = hasPriorTargetingClause && (!abilityContext.previousTarget && (!abilityContext.selectedTargets || abilityContext.selectedTargets.length === 0));

      if (!targetingFailed) {
        const commitRes = await abilityContext.commitActivation();
        if (commitRes && !commitRes.success) {
          return {
            success: false,
            isCommitted: false,
            commitFailure: true,
            reason: commitRes.status,
            restrictionStatus: commitRes.status
          };
        }
      }
    }

    // Check NEGATE_EFFECT modifiers post-commitment
    const card = abilityContext.sourceCard || abilityContext.sourceStack?.top;
    const cardColors = card ? (Array.isArray(card.colors) ? card.colors : [card.color || 'Red']) : [];
    const isNegated = (state.modifiers || []).some(m => {
      if (m.type !== 'NEGATE_EFFECT') return false;
      const side = abilityContext.controller || 'player';
      if (m.side && m.side !== 'both' && m.side !== side) return false;
      if (card) {
        if (m.targetType && m.targetType !== 'ALL' && m.targetType !== card.type) return false;
        if (Array.isArray(m.colors) && m.colors.length > 0 && !cardColors.some(c => m.colors.includes(c))) return false;
      }
      return true;
    });

    if (isNegated) {
      if (events) {
        await events.emit({
          type: 'EFFECT_NEGATED',
          card,
          player: abilityContext.controller || 'player'
        });
      }
      return {
        success: false,
        negated: true,
        reason: 'EFFECT_NEGATED'
      };
    }

    const res = await executeOp(state, opToRun, abilityContext, this.promptResolver, events);
    const normalized = res && typeof res === 'object' ? { ...res } : { success: Boolean(res) };
    return normalized;
  }

  async resolveAbility(state, ability, context = {}, events = null) {
    if (!ability || !ability.clauses || ability.clauses.length === 0) {
      return { success: true, hasUnsupported: false, hasFailure: false, results: [] };
    }

    const resTiming = String(ability.header?.timing || '').toUpperCase();
    const hasDuringSetPrefix = (ability.header?.prefixes || []).some(p => /during\s+set/i.test(String(p)));
    if (context.enforcePrefixPrerequisites === true || (hasDuringSetPrefix && context.enforcePrefixPrerequisites !== false)) {
      const prefRes = evaluateAbilityPrefixPrerequisites(state, ability, context);
      if (!prefRes.allowed) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          skipped: true,
          reason: prefRes.reason || 'PREFIX_PREREQUISITE_NOT_MET',
          hasFailure: false,
          results: []
        };
      }
    }
    const srcObj = context.sourceStack || context.sourceCard || null;
    if (resTiming !== 'PASSIVE' && context.checkActivationRestriction !== false) {
      const targetCtrl = context.controller || 'player';
      const srcId = srcObj?.id || srcObj?.stackId || null;
      const srcCardId = srcObj?.top?.id || srcObj?.id || null;
      const lostEffects = (state?.modifiers || []).some(m => {
        if (!m || (m.type !== 'LOSE_EFFECTS' && m.type !== 'TREAT_AS_VANILLA')) return false;
        if (m.targetStackId && m.targetStackId !== srcId && m.targetStackId !== srcCardId) return false;
        if (m.targetCardId && m.targetCardId !== srcCardId && m.targetCardId !== srcId) return false;
        if (m.side && m.side !== 'both' && m.side !== targetCtrl) return false;
        return Boolean(m.targetStackId || m.targetCardId || m.side);
      });
      if (lostEffects) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: 'EFFECTS_LOST',
          hasFailure: true,
          results: []
        };
      }
      if (isActionRestricted(state, 'CANNOT_USE_ABILITY', targetCtrl, srcObj, {
        ability,
        timingWindow: resTiming,
        isEffectResolution: true,
        isVoluntaryActivation: Boolean(context.isVoluntaryActivation)
      })) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: 'ABILITY_RESTRICTED',
          hasFailure: true,
          results: []
        };
      }
    }

    if (this.resolutionStack.length >= this.maxResolutionDepth) {
      throw new ResolutionDepthExceededError(
        `Maximum ability resolution depth (${this.maxResolutionDepth}) exceeded`,
        { depth: this.resolutionStack.length + 1, maxDepth: this.maxResolutionDepth }
      );
    }

    const parentFrame = this.resolutionStack.length > 0 ? this.resolutionStack[this.resolutionStack.length - 1] : null;
    const abilityContext = context;
    abilityContext.resolver = this;
    if (!abilityContext.selectedTargets) abilityContext.selectedTargets = [];
    if (!abilityContext.previousTargets) abilityContext.previousTargets = [];
    if (!('previousTarget' in abilityContext)) abilityContext.previousTarget = null;
    abilityContext.sourceAbility = ability;
    if (ability) {
      abilityContext.physicalAbilityId = ability.physicalId || ability.id || null;
      abilityContext.semanticAbilityId = ability.semanticId || null;
    }

    const frame = {
      frameId: `frame_${this.nextFrameSeq++}`,
      parentFrameId: parentFrame ? parentFrame.frameId : null,
      depth: this.resolutionStack.length + 1,
      ability,
      physicalAbilityId: abilityContext.physicalAbilityId || null,
      semanticAbilityId: abilityContext.semanticAbilityId || null,
      sourceCard: abilityContext.sourceCard || null,
      controller: abilityContext.controller || 'player',
      triggerOrigin: abilityContext.triggerOrigin || null
    };
    abilityContext.resolutionFrame = frame;
    this.resolutionStack.push(frame);

    // 0. Pre-flight capacity reservation check
    let ownReservation = null;
    if (!abilityContext.reservation) {
      const res = reserveRestriction(state, ability, abilityContext);
      if (!res.success) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: res.status === RESTRICTION_STATUS.LIMIT_REACHED ? 'ABILITY_LIMIT_REACHED' : res.status,
          restrictionStatus: res.status,
          hasUnsupported: res.status === RESTRICTION_STATUS.UNSUPPORTED_RESTRICTION,
          hasFailure: true,
          results: []
        };
      }
      abilityContext.reservation = res;
      ownReservation = res;
    }

    abilityContext.isCommitted = false;
    abilityContext.commitActivation = async () => {
      if (abilityContext.isCommitted) {
        return {
          success: false,
          status: RESTRICTION_STATUS.DUPLICATE_COMMIT,
          reason: 'DUPLICATE_COMMIT'
        };
      }
      let commitRes;
      if (abilityContext.reservation && typeof abilityContext.reservation.commit === 'function') {
        commitRes = abilityContext.reservation.commit();
      } else {
        commitRes = commitRestriction(state, ability, abilityContext);
      }
      if (commitRes && commitRes.success && commitRes.status === 'COMMITTED') {
        abilityContext.isCommitted = true;
        if (events) {
          await events.emit({
            type: 'ACTIVATION_COMMITTED',
            ability,
            card: abilityContext.sourceCard,
            stack: abilityContext.sourceStack,
            player: abilityContext.controller,
            key: commitRes.key
          });
        }
      }
      return commitRes;
    };

    const results = [];
    try {
    let previousResult = null;
    let chosenBranch = null; // Used for "Or" clauses

    // Collect afterResolves clauses to run at the very end
    const mainClauses = [];
    const followUpClauses = [];

    for (const c of ability.clauses) {
      if (c.link === 'afterResolves') {
        followUpClauses.push(c);
      } else {
        mainClauses.push(c);
      }
    }

    // 1. Resolve main clauses sequentially
    for (let i = 0; i < mainClauses.length; i++) {
      const clause = mainClauses[i];

      // Handle "Or" connector: player chooses one of the branches
      if (clause.link === 'or') {
        const picked = chosenBranch;
        chosenBranch = null;
        if (picked === 'first') {
          results.push({ success: false, skipped: true, branchDeclined: true, reason: 'OR_BRANCH_NOT_CHOSEN' });
          continue;
        }
      }

      // Check if next clause is an "Or" option
      if (i + 1 < mainClauses.length && mainClauses[i + 1].link === 'or') {
        const choice = await this.promptResolver.choose({
          type: 'CHOOSE_OR_BRANCH',
          title: 'Select one effect to resolve',
          options: [
            { id: 'first', label: clause.rawText },
            { id: 'second', label: mainClauses[i + 1].rawText }
          ],
          chooser: abilityContext.controller || 'player',
          context: abilityContext
        });
        if (choice && choice.id === 'second') {
          chosenBranch = 'second';
          results.push({ success: false, skipped: true, branchDeclined: true, reason: 'OR_BRANCH_NOT_CHOSEN' });
          continue; // Skip first clause
        } else {
          chosenBranch = 'first';
        }
      }

      // Handle "byDoing" / "ifYouDo" / "whenYouveDoneSo": Prerequisite check
      if (clause.link === 'byDoing' || clause.link === 'ifYouDo' || clause.link === 'whenYouveDoneSo') {
        if (!previousResult || !previousResult.success || previousResult.paid === false) {
          const skipRes = {
            success: false,
            paid: false,
            skipped: true,
            reason: 'PREREQUISITE_FAILED'
          };
          results.push(skipRes);
          previousResult = skipRes;
          abilityContext.previousResult = skipRes;
          continue;
        }

        // Rule Manual 17.0: If previous action depleted or leveled down the activating card below required level,
        // derived follow-up clauses ("when you've done so", "by doing", etc.) fail to resolve.
        if (abilityContext.sourceCard) {
          const p = state.players[abilityContext.controller || 'player'];
          const sourceStack = p && p.field && p.field.find(st => st.top.id === abilityContext.sourceCard.id);
          if (sourceStack) {
            const totalCores = (sourceStack.cores.normal || 0) + (sourceStack.cores.soul ? 1 : 0);
            const reqLevel = (ability.header && ability.header.level) || 1;
            const levels = sourceStack.top.levels || {};
            const minReqCores = (levels[reqLevel] && levels[reqLevel].cost) || 1;
            if (totalCores < minReqCores) {
              const depletedRes = { success: false, paid: false, depleted: true, skipped: true, reason: 'SOURCE_DEPLETED_OR_LEVELED_DOWN' };
              results.push(depletedRes);
              previousResult = depletedRes;
              abilityContext.previousResult = depletedRes;
              continue;
            }
          }
        }
      }

      const res = await this.resolveClause(state, ability, clause, abilityContext, events);
      results.push(res);
      previousResult = res;
      abilityContext.previousResult = res;

      // Fail-fast on commitment failure: prevent subsequent clauses from executing
      if (res && res.commitFailure) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: res.reason,
          restrictionStatus: res.restrictionStatus || res.reason,
          hasFailure: true,
          results,
          context: abilityContext
        };
      }

      // If cost payment failed, abort ability resolution immediately
      if (clause.isCost && (res.paid === false || res.success === false)) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: res.reason || 'COST_NOT_PAID',
          hasFailure: true,
          results,
          context: abilityContext
        };
      }

      const remainingMain = mainClauses.slice(i + 1);
      const remainingClauses = [...remainingMain, ...followUpClauses];
      synchronizeTargetingContext(clause, res, abilityContext, remainingClauses);
    }

    // 2. Resolve "afterResolves" follow-up clauses (with full condition, optionality, cost checks)
    for (let j = 0; j < followUpClauses.length; j++) {
      const fClause = followUpClauses[j];
      const remainingAfterResolves = followUpClauses.slice(j + 1);
      const fRes = await this.resolveClause(state, ability, fClause, abilityContext, events);
      results.push(fRes);
      previousResult = fRes;
      abilityContext.previousResult = fRes;

      if (fRes && fRes.commitFailure) {
        return {
          success: false,
          activated: false,
          isCommitted: false,
          reason: fRes.reason,
          restrictionStatus: fRes.restrictionStatus || fRes.reason,
          hasFailure: true,
          results,
          context: abilityContext
        };
      }

      synchronizeTargetingContext(fClause, fRes, abilityContext, remainingAfterResolves);
    }
    } finally {
      if (this.resolutionStack.length > 0 && this.resolutionStack[this.resolutionStack.length - 1].frameId === frame.frameId) {
        this.resolutionStack.pop();
      }
      if (ownReservation && !abilityContext.isCommitted) {
        ownReservation.release();
      }
    }

    const hasUnsupported = results.some(r =>
      r && (
        r.status === 'UNSUPPORTED' ||
        r.supported === false ||
        r.reason === 'UNHANDLED_OPERATION' ||
        r.reason === 'UNSUPPORTED_OPERATION' ||
        r.reason === 'UNSUPPORTED_CONDITION'
      )
    );
    const hasFailure = results.some(r => r && r.success === false && !r.skipped);

    const isCommitted = Boolean(abilityContext.isCommitted);
    const wasNegated = results.some(r => r && r.negated);

    return {
      success: !hasUnsupported && !hasFailure && !wasNegated,
      activated: Boolean(isCommitted || results.some(r => r && !r.skipped)),
      isCommitted,
      negated: wasNegated,
      restrictionStatus: abilityContext.reservation?.status || RESTRICTION_STATUS.ALLOWED,
      hasUnsupported,
      hasFailure: hasFailure || wasNegated,
      results,
      context: abilityContext
    };
  }
}

export class DefaultPromptResolver {
  async choose(prompt) {
    // Default deterministic headless fallback for automated tests
    const pType = prompt.requestType || prompt.type;
    if (pType === 'CONFIRM_OPTIONAL' || pType === 'CONFIRM_ACTION' || pType === 'SELECT_OPTIONAL_ACTION') {
      return { accepted: true, declined: false };
    }
    if (pType === 'CHOOSE_OR_BRANCH' || pType === 'CHOOSE_OPTION' || pType === 'SELECT_BRANCH' || pType === 'SELECT_MODE') {
      return prompt.options?.[0] || null;
    }
    if (pType === 'BURST_TRIGGER' || pType === 'OPTIONAL_TRIGGER' || pType === 'ACTIVATE_EFFECT') {
      return { activate: true, accepted: true };
    }
    if (pType === 'FLASH_ACTION') {
      return { action: 'PASS' };
    }
    if (pType === 'BLOCK_CHOICE' || pType === 'SELECT_BLOCKER') {
      return { block: false, selected: [] };
    }
    if (pType === 'MULLIGAN_CHOICE') {
      return { mulligan: false };
    }
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = prompt.count || 1;
      return prompt.candidates.slice(0, count);
    }
    return [];
  }
}
