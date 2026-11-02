/**
 * engine/keywords/registry.js
 * 
 * Modular Keyword Registry for Battle Spirits Eternal.
 * Manages keyword definitions and connects keyword lifecycle hooks to the EventBus.
 */

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
  }

  extractCardKeywords(card) {
    if (!card) return [];
    if (card.compiledIr && card.compiledIr.keywords) {
      return card.compiledIr.keywords;
    }
    // Fallback: extract from text directly if compiledIr not attached
    const text = card.effect || '';
    const keywords = [];
    const known = ['Clash', 'Curse', 'Crush', 'Holy Life', 'Assault', 'Windstorm', 'Awaken', 'Heavy Armor', 'Armor', 'Accel', 'Mirage', 'Change', 'High Speed', 'Rebirth', 'Ultimate Trigger', 'A.T. Field'];
    for (const k of known) {
      if (text.toLowerCase().includes(k.toLowerCase())) {
        keywords.push({ name: k });
      }
    }
    return keywords;
  }
}
