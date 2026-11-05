/**
 * engine/keywords/registry.js
 * 
 * Modular Keyword Registry for Battle Spirits Eternal.
 * Manages keyword definitions and connects keyword lifecycle hooks to the EventBus.
 */

import { extractKeywords } from '../../compiler/keyword_compiler.js';

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

      const cardKeywords = this.extractCardKeywords(attackerStack.top);
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

      const cardKeywords = this.extractCardKeywords(attackerStack.top);
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

      const cardKeywords = this.extractCardKeywords(attackerStack.top);
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

    // 4. Unit Destroyed hook: Curse, Immortality
    events.on('DESTROYED', async (event) => {
      const destroyedCard = event.card;
      if (!destroyedCard) return;

      // Check Curse on combat opponent
      if (event.cause === 'battle' && state.combat) {
        const combat = state.combat;
        const attackerSide = event.by === 'player' ? 'player' : 'opponent';
        const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';

        const attackerStack = state.players[attackerSide].field.find(st => st.id === combat.attackerStackId);
        if (attackerStack && attackerStack.top) {
          const cardKeywords = this.extractCardKeywords(attackerStack.top);
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

    // 6. Magic used hook: Ice Wall
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
    });
  }

  extractCardKeywords(card) {
    if (!card) return [];
    if (card.compiledIr && card.compiledIr.keywords) {
      return card.compiledIr.keywords;
    }
    const text = card.effect || '';
    if (!text) return [];
    try {
      return extractKeywords(text);
    } catch {
      return [];
    }
  }
}
