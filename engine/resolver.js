/**
 * engine/resolver.js
 * 
 * Asynchronous IR Ability Resolver.
 * Processes connected clauses with grammar link semantics (then, byDoing, or, instead, afterResolves).
 */

import { executeOp } from './ops/index.js';

export class AsyncResolver {
  constructor(promptResolver) {
    this.promptResolver = promptResolver || new DefaultPromptResolver();
  }

  async resolveAbility(state, ability, context, events = null) {
    if (!ability || !ability.clauses || ability.clauses.length === 0) {
      return { success: true };
    }

    const results = [];
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
        if (chosenBranch === 'first') {
          continue; // Player chose first branch, skip "or" branch
        }
      }

      // Check if previous clause was an "Or" option
      if (i + 1 < mainClauses.length && mainClauses[i + 1].link === 'or') {
        const choice = await this.promptResolver.choose({
          type: 'CHOOSE_OR_BRANCH',
          title: 'Select one effect to resolve',
          options: [
            { id: 'first', label: clause.rawText },
            { id: 'second', label: mainClauses[i + 1].rawText }
          ],
          chooser: context.controller || 'player'
        });
        if (choice && choice.id === 'second') {
          chosenBranch = 'second';
          continue; // Skip first clause
        } else {
          chosenBranch = 'first';
        }
      }

      // Handle "byDoing" / "ifYouDo" / "whenYouveDoneSo": Prerequisite check
      if (clause.link === 'byDoing' || clause.link === 'ifYouDo' || clause.link === 'whenYouveDoneSo') {
        if (!previousResult || !previousResult.success) {
          // Prerequisite failed, cannot execute derived effect
          continue;
        }

        // Rule Manual 17.0: If previous action depleted or leveled down the activating card below required level,
        // derived follow-up clauses ("when you've done so", "by doing", etc.) fail to resolve.
        if (context.sourceCard) {
          const p = state.players[context.controller || 'player'];
          const sourceStack = p && p.field && p.field.find(st => st.top.id === context.sourceCard.id);
          if (sourceStack) {
            const totalCores = (sourceStack.cores.normal || 0) + (sourceStack.cores.soul ? 1 : 0);
            const reqLevel = (ability.header && ability.header.level) || 1;
            const levels = sourceStack.top.levels || {};
            const minReqCores = (levels[reqLevel] && levels[reqLevel].cost) || 1;
            if (totalCores < minReqCores) {
              previousResult = { success: false, depleted: true };
              continue;
            }
          }
        }
      }

      // Handle condition check (e.g. "if [Soul Core] was used to pay the cost", "if you control no Spirits", etc.)
      if (clause.condition) {
        const condMet = evaluateCondition(state, clause.condition, context);
        if (!condMet) {
          continue;
        }
      }

      // Handle optionality ("you can", "you may")
      if (clause.isOptional) {
        const confirm = await this.promptResolver.choose({
          type: 'CONFIRM_OPTIONAL',
          title: `Activate optional effect: "${clause.cleanText}"?`,
          chooser: context.controller || 'player'
        });
        if (!confirm || confirm.declined) {
          previousResult = { success: false, optionalDeclined: true };
          continue;
        }
      }

      // Execute typed operation
      const res = await executeOp(state, clause.op, context, this.promptResolver, events);
      results.push(res);
      previousResult = res;
    }

    // 2. Resolve "afterResolves" follow-up clauses
    for (const fClause of followUpClauses) {
      const fRes = await executeOp(state, fClause.op, context, this.promptResolver, events);
      results.push(fRes);
    }

    return {
      success: true,
      results
    };
  }
}

export class DefaultPromptResolver {
  async choose(prompt) {
    // Default deterministic headless fallback
    if (prompt.type === 'CONFIRM_OPTIONAL') {
      return { accepted: true };
    }
    if (prompt.type === 'CHOOSE_OR_BRANCH') {
      return prompt.options[0];
    }
    if (prompt.type === 'BURST_TRIGGER') {
      return { activate: true };
    }
    if (prompt.type === 'FLASH_ACTION') {
      return { action: 'PASS' };
    }
    if (prompt.type === 'BLOCK_CHOICE') {
      return { block: false };
    }
    if (prompt.type === 'MULLIGAN_CHOICE') {
      return { mulligan: false };
    }
    if (prompt.candidates && prompt.candidates.length > 0) {
      const count = prompt.count || 1;
      return prompt.candidates.slice(0, count);
    }
    return [];
  }
}

function evaluateCondition(state, conditionStr, context) {
  if (!conditionStr) return true;
  const s = conditionStr.toLowerCase();
  const controller = context.controller || 'player';
  const p = state.players[controller];

  if (s.includes('soul core') && (s.includes('pay') || s.includes('used') || s.includes('cost'))) {
    return Boolean(context.soulCoreUsed);
  }

  if (s.includes('no spirits') || s.includes('control no spirits')) {
    const spiritCount = (p.field || []).filter(st => st.top && st.top.type === 'Spirit').length;
    return spiritCount === 0;
  }

  if (s.includes('life is at two or more')) {
    return p.life >= 2;
  }

  return true;
}
