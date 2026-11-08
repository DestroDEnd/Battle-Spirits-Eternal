/**
 * engine/keywords/registry.js
 * 
 * Modular Keyword Registry for Battle Spirits Eternal.
 * Manages keyword definitions and connects keyword lifecycle hooks to the EventBus.
 */

import { extractKeywords } from '../../compiler/keyword_compiler.js';
import { computeLevel } from '../continuous.js';

export class KeywordRegistry {
  constructor() {
    this.keywords = new Map();
  }

  register(keywordDef) {
    if (!keywordDef || !keywordDef.id) {
      throw new Error('Keyword definition must have an id');
    }
    this.keywords.set(keywordDef.id.toLowerCase(), keywordDef);
  }

  get(id) {
    if (!id) return null;
    return this.keywords.get(id.toLowerCase()) || null;
  }

  has(id) {
    if (!id) return false;
    return this.keywords.has(id.toLowerCase());
  }

  getAll() {
    return Array.from(this.keywords.values());
  }

  /**
   * Attaches keyword hooks to the game's event bus and resolver.
   */
  attachToGame(game) {
    const { events, state, resolver } = game;

    // 1. Attack declared hook: Clash, Crush, Assault, Consecutive Blade, U-Trigger
    events.on('ATTACK_DECLARED', async (event) => {
      const attackerStack = event.attacker;
      if (!attackerStack || !attackerStack.top) return;

      const cardKeywords = this.getActiveKeywords(attackerStack, { timing: 'WHEN_ATTACKS' }, state);
      for (const kwItem of cardKeywords) {
        const handler = this.get(kwItem.name);
        if (handler && handler.hooks && handler.hooks.onAttackDeclared) {
          await handler.hooks.onAttackDeclared({
            game,
            state,
            stack: attackerStack,
            attackerStack,
            card: attackerStack.top,
            keyword: kwItem,
            event,
            resolver
          });
        }
      }
    });

    // 2. Block declared hook: Windstorm
    events.on('BLOCK_DECLARED', async (event) => {
      const blockerStack = event.blocker;
      const combat = state.combat;
      if (!combat || !combat.attackerStackId) return;

      const attackerStack = state.players[event.player === 'player' ? 'opponent' : 'player'].field.find(st => st.id === combat.attackerStackId);
      if (!attackerStack || !attackerStack.top) return;

      const cardKeywords = this.getActiveKeywords(attackerStack, { timing: 'WHEN_ATTACKS' }, state);
      for (const kwItem of cardKeywords) {
        const handler = this.get(kwItem.name);
        if (handler && handler.hooks && handler.hooks.onBlockDeclared) {
          await handler.hooks.onBlockDeclared({
            game,
            state,
            attackerStack,
            blockerStack,
            keyword: kwItem,
            event,
            resolver
          });
        }
      }
    });

    // 3. Life reduced / combat damage hook: Holy Life
    events.on('LIFE_REDUCED', async (event) => {
      if (event.cause !== 'combat_damage') return;
      const combat = state.combat;
      if (!combat || !combat.attackerStackId) return;

      const attackerSide = event.player === 'player' ? 'opponent' : 'player';
      const attackerStack = state.players[attackerSide].field.find(st => st.id === combat.attackerStackId);
      if (!attackerStack || !attackerStack.top) return;

      const cardKeywords = this.getActiveKeywords(attackerStack, { timing: 'WHEN_ATTACKS' }, state);
      for (const kwItem of cardKeywords) {
        const handler = this.get(kwItem.name);
        if (handler && handler.hooks && handler.hooks.onLifeDamage) {
          await handler.hooks.onLifeDamage({
            game,
            state,
            attackerStack,
            damagePlayer: event.player,
            keyword: kwItem,
            event,
            resolver
          });
        }
      }
    });

    // 4. Unit Destroyed hook: Curse, True-Curse, Stampede, Immortality
    events.on('DESTROYED', async (event) => {
      const destroyedCard = event.card;
      if (!destroyedCard) return;

      // 4a. Trigger onBattleDestroyed hooks on the destroyed card itself (e.g. True-Curse, Immortality)
      if (event.cause === 'battle' || event.cause === 'destroy') {
        const destroyedKeywords = event.stack
          ? this.getActiveKeywords(event.stack, { timing: 'WHEN_DESTROYED' }, state)
          : this.extractCardKeywords(destroyedCard);
        for (const kwItem of destroyedKeywords) {
          const handler = this.get(kwItem.name);
          if (handler && handler.hooks && handler.hooks.onBattleDestroyed) {
            await handler.hooks.onBattleDestroyed({
              game,
              state,
              card: destroyedCard,
              destroyedCard,
              keyword: kwItem,
              event,
              resolver
            });
          }
        }
      }

      // 4b. Trigger onBattleDestroyed hooks on the surviving attacker when opposing card is destroyed in battle (e.g. Stampede)
      if (event.cause === 'battle' && state.combat) {
        const combat = state.combat;
        const attackerStackId = combat.attackerStackId;
        const attackerSide = combat.attackerSide || (state.players.player.field.some(st => st.id === attackerStackId) ? 'player' : 'opponent');
        const attackerStack = state.players[attackerSide]?.field?.find(st => st.id === attackerStackId);
        if (attackerStack && attackerStack.top && destroyedCard.owner !== attackerSide) {
          const cardKeywords = this.getActiveKeywords(attackerStack, { timing: 'WHEN_ATTACKS' }, state);
          for (const kwItem of cardKeywords) {
            const handler = this.get(kwItem.name);
            if (handler && handler.hooks && handler.hooks.onBattleDestroyed) {
              await handler.hooks.onBattleDestroyed({
                game,
                state,
                attackerStack,
                destroyedCard,
                keyword: kwItem,
                event,
                resolver
              });
            }
          }
        }
      }
    });

    // 5. Battle end hook: Soar, Rumble, etc.
    events.on('BATTLE_END', async (event) => {
      const combat = state.combat;
      if (!combat) return;

      const attackerStack = combat.attacker || (combat.attackerStackId && 
        [...(state.players.player.field || []), ...(state.players.opponent.field || [])].find(st => st.id === combat.attackerStackId));
      const blockerCard = combat.blockerCard || (combat.blocker && combat.blocker.top);

      if (attackerStack && attackerStack.top) {
        const cardKeywords = this.extractCardKeywords(attackerStack.top);
        for (const kwItem of cardKeywords) {
          const handler = this.get(kwItem.name);
          if (handler && handler.hooks && handler.hooks.onBattleEnd) {
            await handler.hooks.onBattleEnd({
              game,
              state,
              attackerStack,
              blockerCard,
              keyword: kwItem,
              event,
              resolver
            });
          }
        }
      }
    });

    // 6. Magic used hook: Ice Wall, Amplify, Dispersion
    events.on('MAGIC_USED', async (event) => {
      if (!event || !event.player) return;
      const opposingSide = event.player === 'player' ? 'opponent' : 'player';
      const opposingStacks = state.players[opposingSide]?.field || [];

      for (const st of opposingStacks) {
        if (!st.top) continue;
        const cardKeywords = this.extractCardKeywords(st.top);
        for (const kwItem of cardKeywords) {
          const handler = this.get(kwItem.name);
          if (handler && handler.hooks && handler.hooks.onMagicUsed) {
            await handler.hooks.onMagicUsed({
              game,
              state,
              stack: st,
              event,
              keyword: kwItem,
              resolver
            });
          }
        }
      }

      const friendlyStacks = state.players[event.player]?.field || [];
      for (const st of friendlyStacks) {
        if (!st.top) continue;
        const cardKeywords = this.getActiveKeywords(st, { timing: 'PASSIVE' }, state);
        for (const kwItem of cardKeywords) {
          const handler = this.get(kwItem.name);
          if (handler && handler.hooks && handler.hooks.onMagicUsed) {
            await handler.hooks.onMagicUsed({
              game,
              state,
              stack: st,
              event,
              playerSide: event.player,
              keyword: kwItem,
              resolver
            });
          }
        }
      }
    });

    // 7. BP comparison hook: Ultra Awaken
    events.on('BP_COMPARE', async (event) => {
      const combat = state.combat;
      if (!combat) return;
      const attackerStack = event.attacker || combat.attacker || (combat.attackerStackId && 
        [...(state.players.player.field || []), ...(state.players.opponent.field || [])].find(st => st.id === combat.attackerStackId));
      const blockerStack = event.blocker || combat.blocker || (combat.blockerStackId && 
        [...(state.players.player.field || []), ...(state.players.opponent.field || [])].find(st => st.id === combat.blockerStackId));

      for (const st of [attackerStack, blockerStack]) {
        if (!st || !st.top) continue;
        const cardKeywords = this.getActiveKeywords(st, {}, state);
        for (const kwItem of cardKeywords) {
          const handler = this.get(kwItem.name);
          if (handler && handler.hooks && handler.hooks.onBPCompare) {
            await handler.hooks.onBPCompare({
              game,
              state,
              attackerStack,
              blockerStack,
              stack: st,
              keyword: kwItem,
              resolver
            });
          }
        }
      }
    });

    // 8. Refresh Step hook: Spellbind
    events.on('STEP_START', async (event) => {
      if (event.step === 'REFRESH') {
        const p = state.players[event.player];
        for (const st of (p?.field || [])) {
          if (!st.top) continue;
          const cardKeywords = this.getActiveKeywords(st, { step: event.step }, state);
          for (const kwItem of cardKeywords) {
            const handler = this.get(kwItem.name);
            if (handler && handler.hooks && handler.hooks.onRefreshStep) {
              await handler.hooks.onRefreshStep({
                game,
                state,
                stack: st,
                playerSide: event.player,
                keyword: kwItem
              });
            }
          }
        }
      }
    });
  }

  /**
   * Evaluates and returns active keywords for a given field stack, strictly enforcing:
   * 1. Level gating (stack cores must meet or exceed level cost in kw.levels)
   * 2. Card Face gating (Face A vs Face B on Rebirth / Double-sided cards)
   * 3. State gating (Soul State, Sealed, Advent)
   * 4. Trigger timing / step window compatibility
   */
  getActiveKeywords(stack, context = {}, state = null) {
    if (!stack || !stack.top) return [];
    const allKeywords = this.extractCardKeywords(stack.top);
    if (!allKeywords || allKeywords.length === 0) return [];

    const currentLevel = computeLevel(stack, state);
    const isFlipped = Boolean(stack.isFlipped || stack.isReborn || stack.currentFace === 'B');
    const isSoulState = Boolean(stack.isSoulState);
    const isSealed = Boolean(state?.players?.[stack.owner]?.isSealed);
    const isDuringAdvent = Boolean(stack.under && stack.under.length > 0);

    return allKeywords.filter(kw => {
      // 1. Level check: If keyword has explicit levels, current level must be one of them
      if (kw.levelExplicit && Array.isArray(kw.levels) && kw.levels.length > 0) {
        if (!kw.levels.includes(currentLevel)) {
          return false;
        }
      }

      // 2. Face check: If keyword is bound to Face B and stack is on Face A, or Face A when flipped
      if (kw.face) {
        if (kw.face === 'B' && !isFlipped) return false;
        if (kw.face === 'A' && isFlipped) return false;
      }

      // 3. Soul State check: Soul State cards only activate Soul State keywords
      if (isSoulState) {
        const isSoulStateKw = kw.isSoulState || kw.prefixes?.some(p => /soul state/i.test(p)) || kw.name === 'Soul State' || kw.name === 'Contract Pre-Advent';
        if (!isSoulStateKw) return false;
      }

      // 4. Advent check: If keyword requires "During Advent"
      if (kw.duringAdvent && !isDuringAdvent) {
        return false;
      }

      // 5. Seal check: If keyword requires "During Seal" / "When Sealed"
      if (kw.duringSeal && !isSealed) {
        return false;
      }

      // 6. Timing window check (if specified in context)
      if (context.timing && kw.timing && kw.timing !== 'PASSIVE') {
        const ctxT = String(context.timing).toUpperCase();
        const kwT = String(kw.timing).toUpperCase();
        if (ctxT !== kwT) {
          const battlesMatch = kwT === 'WHEN_BATTLES' && (ctxT === 'WHEN_ATTACKS' || ctxT === 'WHEN_BLOCKS');
          const attackBlockMatch = kwT === 'WHEN_ATTACKING_OR_BLOCKING' && (ctxT === 'WHEN_ATTACKS' || ctxT === 'WHEN_BLOCKS');
          if (!battlesMatch && !attackBlockMatch) {
            return false;
          }
        }
      }

      // 7. Step check (if specified in context)
      if (context.step && kw.timingStep && kw.timingStep !== 'ANY') {
        if (String(context.step).toUpperCase() !== String(kw.timingStep).toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }

  extractCardKeywords(card) {
    if (!card) return [];
    if (Array.isArray(card.keywords) && card.keywords.length > 0) {
      return card.keywords;
    }
    if (card.compiledIr && Array.isArray(card.compiledIr.keywords) && card.compiledIr.keywords.length > 0) {
      return card.compiledIr.keywords;
    }
    const text = card.effect || card.raw_effect || '';
    if (!text) return [];
    try {
      return extractKeywords(text);
    } catch {
      return [];
    }
  }
}
