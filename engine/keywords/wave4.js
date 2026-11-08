/**
 * engine/keywords/wave4.js
 * 
 * Wave 4 Keywords: Advanced Color & Strategic Battle Mechanics.
 * Immortality, Tribute, Unsheathe, Bombardment, Pursuit, Showdown, Poison Blade,
 * Spellbind, Spell Blight, Soar, Bunshin, Ice Wall, Kagemusha, Silver Wheel,
 * Excite, Load, Fast Draw, Dispersion, Summon Bolt, AFO, Stampede.
 */

import { moveCard, moveCore, commitStackExit } from '../zones.js';
import { createFieldStack } from '../state.js';
import { computeLevel } from '../continuous.js';

export const PursuitKeyword = {
  id: 'Pursuit',
  name: 'Pursuit',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, stack, attackerStack }) {
      const target = attackerStack || stack;
      if (target) {
        target.state = 'HEAVY_EXHAUSTED';
      }
    }
  }
};

export const SoarKeyword = {
  id: 'Soar',
  name: 'Soar',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.soarActive = true;
      }
    },
    async onBattleEnd({ state, attackerStack }) {
      if (attackerStack) {
        attackerStack.state = 'REFRESHED';
      }
      if (state.combat) {
        state.combat.soarActive = false;
      }
    }
  }
};

export const BunshinKeyword = {
  id: 'Bunshin',
  name: 'Bunshin',
  wave: 4,
  async executeBunshin(game, playerSide = 'player', count = 1) {
    const { state, events } = game;
    const p = state.players[playerSide];

    if (!p.deck || p.deck.length < count) {
      return { success: false, reason: 'INSUFFICIENT_DECK' };
    }

    const createdStacks = [];
    for (let i = 0; i < count; i++) {
      if (p.deck.length === 0) break;
      const topCard = p.deck.shift();
      topCard.isBunshin = true;
      topCard.cost = 0;
      topCard.type = 'Spirit';
      topCard.levels = { 1: { cost: 1, bp: 3000 } };

      let corePaid = false;
      if (p.reserve.normal > 0) {
        p.reserve.normal -= 1;
        corePaid = true;
      } else if (p.reserve.soul > 0) {
        p.reserve.soul -= 1;
        corePaid = true;
      }

      const stack = createFieldStack(topCard, { normal: corePaid ? 1 : 0, soul: 0 });
      stack.state = 'REFRESHED';
      stack.owner = playerSide;
      p.field.push(stack);
      createdStacks.push(stack);

      if (events) {
        await events.emit({
          type: 'BUNSHIN_SUMMONED',
          player: playerSide,
          stack,
          card: topCard
        });
      }
    }

    return { success: true, stacks: createdStacks };
  }
};

export const IceWallKeyword = {
  id: 'Ice Wall',
  name: 'Ice Wall',
  wave: 4,
  hooks: {
    async onMagicUsed({ state, stack, event, keyword }) {
      if (!stack || stack.state !== 'REFRESHED') return;
      if (!event || !event.card) return;

      const param = (keyword && keyword.parameter) ? keyword.parameter : '';
      const allowedColors = param.split(/[\/,]/).map(s => s.trim().toLowerCase()).filter(Boolean);

      const magicColors = (event.card.colors || [event.card.color || 'White']).map(c => c.toLowerCase());
      const matches = allowedColors.length === 0 ||
                      allowedColors.includes('all') ||
                      magicColors.some(c => allowedColors.includes(c));

      if (matches) {
        event.negated = true;
        stack.state = 'EXHAUSTED';
      }
    }
  }
};

export const LoadKeyword = {
  id: 'Load',
  name: 'Load',
  wave: 4,
  async executeLoad(game, playerSide = 'player', count = 1) {
    const { state, events } = game;
    const p = state.players[playerSide];

    const partnerStack = (p.field || []).find(st => st.top && (st.top.isContractPartner || st.top.isContract));
    if (!partnerStack) {
      return { success: false, reason: 'NO_CONTRACT_PARTNER' };
    }

    if (!partnerStack.under) {
      partnerStack.under = [];
    }

    let loaded = 0;
    for (let i = 0; i < count; i++) {
      if (!p.deck || p.deck.length === 0) break;
      const topCard = p.deck.shift();
      partnerStack.under.push(topCard);
      p.counters = (p.counters || 0) + 1;
      loaded++;
    }

    if (events) {
      await events.emit({
        type: 'LOAD_RESOLVED',
        player: playerSide,
        partnerStack,
        count: loaded,
        newCounter: p.counters
      });
    }

    return { success: true, loadedCount: loaded, partnerStack };
  }
};

export const ImmortalityKeyword = {
  id: 'Immortality',
  name: 'Immortality',
  wave: 4,
  canReviveOnDestruction(destroyedCard, immortalityCard) {
    if (!immortalityCard || !destroyedCard) return false;
    const param = immortalityCard.effect && immortalityCard.effect.match(/\[Immortality:\s*([^\]]+)\]/i)?.[1] || '';
    if (!param) return true;
    const p = param.toLowerCase();
    const costMatch = p.match(/cost\s*(\d+)(?:\/(\d+))?/i);
    if (costMatch) {
      const allowedCosts = [parseInt(costMatch[1], 10)];
      if (costMatch[2]) allowedCosts.push(parseInt(costMatch[2], 10));
      if (allowedCosts.includes(destroyedCard.cost)) return true;
    }
    if (destroyedCard.family && destroyedCard.family.toLowerCase().includes(p)) return true;
    if (destroyedCard.type && destroyedCard.type.toLowerCase().includes(p)) return true;
    return false;
  },
  async executeRevival(game, immortalityCard, playerSide = 'player', placedCores = 1) {
    const { events } = game;
    const p = game.state.players[playerSide];
    p.grave = p.grave.filter(c => c.id !== immortalityCard.id);
    let coresFromReserve = 0;
    if (p.reserve.normal >= placedCores) {
      p.reserve.normal -= placedCores;
      coresFromReserve = placedCores;
    }
    const stack = createFieldStack(immortalityCard, { normal: coresFromReserve, soul: 0 });
    stack.owner = playerSide;
    p.field.push(stack);

    await events.emit({
      type: 'SUMMONED',
      card: immortalityCard,
      stack,
      player: playerSide,
      cause: 'immortality'
    });
    return { success: true, stack };
  }
};

export const TributeKeyword = {
  id: 'Tribute',
  name: 'Tribute',
  wave: 4,
  async executeTribute(game, sacrificeStack, playerSide = 'player', destZone = 'grave') {
    const { state, events } = game;
    const p = state.players[playerSide];
    const idx = p.field.indexOf(sacrificeStack);
    if (idx !== -1) {
      p.field.splice(idx, 1);
      if (destZone === 'void') {
        state.voidCards = (state.voidCards || []).concat(sacrificeStack.top);
      } else {
        p.grave.push(sacrificeStack.top);
      }
      p.reserve.normal += (sacrificeStack.cores.normal || 0);
      p.reserve.soul += (sacrificeStack.cores.soul || 0);

      await events.emit({
        type: 'TRIBUTE_OFFERED',
        sacrificedStack: sacrificeStack,
        destZone,
        player: playerSide
      });
      return { success: true };
    }
    return { success: false, reason: 'SACRIFICE_NOT_FOUND' };
  }
};

export const UnsheatheKeyword = {
  id: 'Unsheathe',
  name: 'Unsheathe',
  wave: 4,
  async executeUnsheathe(game, swordBraveCard, targetStack, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    if (!swordBraveCard || !targetStack) return { success: false, reason: 'INVALID_ARGS' };

    p.hand = p.hand.filter(c => c.id !== swordBraveCard.id);
    if (!targetStack.braves) targetStack.braves = [];
    targetStack.braves.push(swordBraveCard);

    await events.emit({
      type: 'UNSHEATHE_SUMMON',
      braveCard: swordBraveCard,
      targetStack,
      player: playerSide
    });

    return { success: true, stack: targetStack };
  }
};

export const BombardmentKeyword = {
  id: 'Bombardment',
  name: 'Bombardment',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, attackerStack, keyword, game }) {
      // Official Bandai ruling: (When Attacks) You can reveal card(s) from your decktop.
      // If that card is an Emperor Beast family Spirit card (or meets condition), send 1 opposing Life to their Reserve.
      // Add the revealed card to the Hand.
      const ownerSide = attackerStack?.owner || 'player';
      const oppSide = ownerSide === 'player' ? 'opponent' : 'player';
      const owner = state.players[ownerSide];
      const opp = state.players[oppSide];
      if (!owner || !owner.deck || owner.deck.length === 0) return;

      const revealCount = parseInt(keyword?.parameter, 10) || 1;
      const revealed = [];

      for (let i = 0; i < revealCount; i++) {
        if (owner.deck.length === 0) break;
        const topCard = owner.deck.shift();
        revealed.push(topCard);

        const fam = ((topCard.family || '') + ' ' + (topCard.families ? topCard.families.join(' ') : '')).toLowerCase();
        const isEmperorBeast = fam.includes('emperor beast') || fam.includes('emperorbeast') || fam.includes('z') || fam.includes('steel');

        if (isEmperorBeast && opp && opp.life > 0) {
          // Send 1 opposing Life to their Reserve
          opp.life -= 1;
          opp.reserve.normal = (opp.reserve.normal || 0) + 1;
          if (game.events) {
            await game.events.emit({
              type: 'LIFE_REDUCED',
              player: oppSide,
              amount: 1,
              to: 'reserve',
              cause: 'bombardment'
            });
          }
        }

        // Add revealed card to Hand
        owner.hand.push(topCard);
      }

      if (game.events) {
        await game.events.emit({
          type: 'BOMBARDMENT_RESOLVED',
          attacker: attackerStack,
          player: ownerSide,
          revealedCards: revealed,
          count: revealed.length
        });
      }
    }
  }
};

export const ShowdownKeyword = {
  id: 'Showdown',
  name: 'Showdown',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
        state.combat.showdownDuel = true;
      }
    }
  }
};

export const PoisonBladeKeyword = {
  id: 'Poison Blade',
  name: 'Poison Blade',
  wave: 4,
  async executePoisonBlade(game, targetStack, count = 1) {
    const oppSide = targetStack.owner;
    const opp = game.state.players[oppSide];
    if (!targetStack.under) targetStack.under = [];
    for (let i = 0; i < count; i++) {
      if (opp.deck.length === 0) break;
      targetStack.under.push(opp.deck.shift());
    }
    return { success: true, count };
  }
};

export const SpellbindKeyword = {
  id: 'Spellbind',
  name: 'Spellbind',
  wave: 4,
  hooks: {
    async onRefreshStep({ state, playerSide }) {
      const p = state.players[playerSide];
      if (p && p.field) {
        for (const st of p.field) {
          if (st.spellbound) {
            st.state = 'EXHAUSTED';
          }
        }
      }
    }
  }
};

export const SpellBlightKeyword = {
  id: 'Spell Blight',
  name: 'Spell Blight',
  wave: 4,
  async executeSpellBlight(game, stack, destroyingPlayerSide = 'opponent') {
    const { state, events } = game;
    const oppSide = stack.owner === 'player' ? 'opponent' : 'player';
    const opp = state.players[oppSide];

    // Check if opponent has at least 1 life core to send to Trash
    if (!opp || opp.life <= 0) return { success: false, reason: 'NO_OPPONENT_LIFE_CORES' };

    // Official Bandai ruling: Send 1 core from opponent's Life to opponent's Trash
    opp.life -= 1;
    opp.trash.normal = (opp.trash.normal || 0) + 1;

    // This Spirit remains on the field in a refreshed state
    stack.state = 'REFRESHED';

    await events.emit({
      type: 'SPELL_BLIGHT_ACTIVATED',
      stack,
      owner: stack.owner,
      opponent: oppSide,
      cause: 'spell_blight'
    });

    return { success: true, preventedDestruction: true };
  }
};

export const KagemushaKeyword = {
  id: 'Kagemusha',
  name: 'Kagemusha',
  wave: 4,
  async executeKagemusha(game, kagemushaCard, originalTargetStack, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    p.hand = p.hand.filter(c => c.id !== kagemushaCard.id);
    let cores = 0;
    if (p.reserve.normal > 0) {
      p.reserve.normal -= 1;
      cores = 1;
    }
    const interceptorStack = createFieldStack(kagemushaCard, { normal: cores, soul: 0 });
    interceptorStack.state = 'EXHAUSTED';
    p.field.push(interceptorStack);

    await events.emit({
      type: 'KAGEMUSHA_INTERCEPT',
      interceptorStack,
      originalTargetStack,
      player: playerSide
    });
    return { success: true, interceptorStack };
  }
};

export const SilverWheelKeyword = {
  id: 'Silver Wheel',
  name: 'Silver Wheel',
  wave: 4,
  hooks: {
    async onAttackDeclared({ stack }) {
      if (stack && stack.state === 'REFRESHED') {
        stack.silverWheelReady = true;
      }
    }
  }
};

export const ExciteKeyword = {
  id: 'Excite',
  name: 'Excite',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state }) {
      if (state.combat) {
        state.combat.mustBlockIfAble = true;
      }
    }
  }
};

export const FastDrawKeyword = {
  id: 'Fast Draw',
  name: 'Fast Draw',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, attackerStack }) {
      const p = state.players[attackerStack.owner];
      if (p.deck.length > 0) {
        p.hand.push(p.deck.shift());
      }
    }
  }
};

export const DispersionKeyword = {
  id: 'Dispersion',
  name: 'Dispersion',
  wave: 4,
  hooks: {
    async onMagicUsed({ event }) {
      if (event) {
        event.dispersionAvailable = true;
      }
    }
  }
};

export const SummonBoltKeyword = {
  id: 'Summon Bolt',
  name: 'Summon Bolt',
  wave: 4,
  async executeSummonBolt(game, boltStack, candidateCard, playerSide = 'player') {
    const { events } = game;
    const p = game.state.players[playerSide];
    const idx = p.field.indexOf(boltStack);
    if (idx !== -1) {
      p.field.splice(idx, 1);
      p.grave.push(boltStack.top);
      p.reserve.normal += (boltStack.cores.normal || 0);
    }
    p.hand = p.hand.filter(c => c.id !== candidateCard.id);
    p.grave = p.grave.filter(c => c.id !== candidateCard.id);

    let cores = 0;
    if (p.reserve.normal > 0) {
      p.reserve.normal -= 1;
      cores = 1;
    }
    const newStack = createFieldStack(candidateCard, { normal: cores, soul: 0 });
    p.field.push(newStack);

    await events.emit({
      type: 'SUMMON_BOLT_RESOLVED',
      newStack,
      player: playerSide
    });
    return { success: true, stack: newStack };
  }
};

export const AFOKeyword = {
  id: 'AFO',
  name: 'AFO',
  wave: 4,
  hooks: {
    async onAttackDeclared({ attackerStack }) {
      if (attackerStack) {
        attackerStack.afoActive = true;
      }
    }
  }
};

export const FortressKeyword = {
  id: 'Fortress',
  name: 'Fortress',
  wave: 4,
  isProtected(stack) {
    // Refreshed Spirits are unaffected by opposing effects
    return Boolean(stack && stack.state === 'REFRESHED');
  }
};

export const TrueFortressKeyword = {
  id: 'True Fortress',
  name: 'True Fortress',
  wave: 4,
  isProtected(stack) {
    // This refreshed Spirit is unaffected by opposing effects
    return Boolean(stack && stack.state === 'REFRESHED');
  }
};

export const LeapKeyword = {
  id: 'Leap',
  name: 'Leap',
  wave: 4,
  hooks: {
    async onAttackDeclared({ state, attackerStack, resolver, game }) {
      // Official Bandai ruling: (When Attacks/Blocks) Return an opposing exhausted Spirit/Ultimate to Hand,
      // and send an opposing Life to Reserve.
      const ownerSide = attackerStack?.owner || 'player';
      const oppSide = ownerSide === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      const exhaustedUnits = (opp?.field || []).filter(st => st.state === 'EXHAUSTED');
      if (exhaustedUnits.length > 0) {
        const target = exhaustedUnits[0];
        await commitStackExit(state, target, 'hand', { cause: 'leap', by: ownerSide }, game.events);
        if (opp.life > 0) {
          opp.life -= 1;
          opp.reserve.normal = (opp.reserve.normal || 0) + 1;
        }
      }
    }
  },
  async executeLeap(game, spiritStack) {
    const { events } = game;
    if (!spiritStack) return { success: false };
    spiritStack.cannotBeBlockedByGround = true;
    if (events) {
      await events.emit({
        type: 'LEAP_ACTIVATED',
        stack: spiritStack
      });
    }
    return { success: true, stack: spiritStack };
  }
};

export const StampedeKeyword = {
  id: 'Stampede',
  name: 'Stampede',
  wave: 4,
  hooks: {
    async onBattleDestroyed({ state, attackerStack, game }) {
      if (!attackerStack) return;
      const oppSide = attackerStack.owner === 'player' ? 'opponent' : 'player';
      const opp = state.players[oppSide];
      if (opp.life > 0) {
        await moveCore(state, 1, { zone: 'life', side: oppSide }, { zone: 'reserve', side: oppSide }, {
          cause: 'stampede',
          by: attackerStack.owner
        }, game.events);
      }
    }
  }
};

export const ZeroCounterKeyword = {
  id: 'Zero Counter',
  name: 'Zero Counter',
  wave: 4,
  async executeZeroCounter(game, zeroCounterCard, summonedStack, playerSide = 'player') {
    const { state, events } = game;
    const oppSide = playerSide === 'player' ? 'opponent' : 'player';
    const opp = state.players[oppSide];
    const p = state.players[playerSide];

    p.hand = p.hand.filter(c => c.id !== zeroCounterCard.id);

    if (summonedStack) {
      await commitStackExit(state, summonedStack, 'grave', { cause: 'zero_counter', by: playerSide }, events);
    } else if (opp.field.length > 0) {
      const target = opp.field[opp.field.length - 1];
      await commitStackExit(state, target, 'grave', { cause: 'zero_counter', by: playerSide }, events);
    }

    let returned = false;
    if (p.reserve.normal > 0) {
      p.reserve.normal -= 1;
      p.trash.normal = (p.trash.normal || 0) + 1;
      p.hand.push(zeroCounterCard);
      returned = true;
    } else {
      p.grave.push(zeroCounterCard);
    }

    if (events) {
      await events.emit({
        type: 'ZERO_COUNTER_ACTIVATED',
        card: zeroCounterCard,
        target: summonedStack,
        player: playerSide,
        returnedToHand: returned
      });
    }

    return { success: true, returnedToHand: returned };
  }
};

export const EnchainKeyword = {
  id: 'Enchain',
  name: 'Enchain',
  wave: 4,
  hasChainActive(state, playerSide, requiredSymbolColor) {
    const p = state.players[playerSide];
    if (!p) return false;
    const targetColor = String(requiredSymbolColor || '').toLowerCase();
    const friendlyUnits = [...(p.field || []), ...(p.nexus || [])];
    return friendlyUnits.some(st => {
      const colors = (st.top?.colors || [st.top?.color]).filter(Boolean).map(c => String(c).toLowerCase());
      return colors.includes(targetColor);
    });
  },
  async executeEnchainSkipStep(game, chosenStep, oppSide = 'opponent') {
    const { state, events } = game;
    state.skipStepOnce = state.skipStepOnce || {};
    state.skipStepOnce[oppSide] = state.skipStepOnce[oppSide] || [];
    state.skipStepOnce[oppSide].push(chosenStep);

    if (events) {
      await events.emit({
        type: 'ENCHAIN_STEP_CHOSEN',
        step: chosenStep,
        opponent: oppSide
      });
    }
    return { success: true, chosenStep };
  }
};

export const PlunderKeyword = {
  id: 'Plunder',
  name: 'Plunder',
  wave: 4,
  async executePlunder(game, playerSide, discardedMagicCard, effectChoice = 'FLASH') {
    const { state, events } = game;
    const oppSide = playerSide === 'player' ? 'opponent' : 'player';
    const opp = state.players[oppSide];
    const p = state.players[playerSide];
    if (!opp || !p) return { success: false, reason: 'invalid_players' };

    // Discard selected Magic card from opp hand to opp trash
    const idx = opp.hand.findIndex(c => c.id === discardedMagicCard.id || c.name === discardedMagicCard.name);
    if (idx !== -1) {
      const [discarded] = opp.hand.splice(idx, 1);
      opp.trash.cards = opp.trash.cards || [];
      opp.trash.cards.push(discarded);
    }

    if (events) {
      await events.emit({
        type: 'PLUNDER_ACTIVATED',
        player: playerSide,
        opponent: oppSide,
        magicCard: discardedMagicCard,
        effectChoice
      });
    }

    return {
      success: true,
      discardedCard: discardedMagicCard,
      effectChoice
    };
  }
};

export const DrawLockKeyword = {
  id: 'Draw Lock',
  name: 'Draw Lock',
  wave: 4,
  async executeDrawLock(game, revealCount = 3) {
    const { state, events } = game;
    state.drawLockActive = true;
    state.drawCapPerEffect = 1;

    for (const side of ['player', 'opponent']) {
      const p = state.players[side];
      p.faceUpDecktopCards = p.faceUpDecktopCards || [];
      for (let i = 0; i < revealCount && p.deck.length > 0; i++) {
        const topCard = p.deck[i];
        if (topCard) {
          topCard.isFaceUp = true;
          p.faceUpDecktopCards.push(topCard);
        }
      }
    }

    if (events) {
      await events.emit({
        type: 'DRAW_LOCK_ACTIVATED',
        revealCount,
        drawCap: 1
      });
    }

    return { success: true, drawCap: 1 };
  }
};

export const GodArmyKeyword = {
  id: 'God-Army',
  name: 'God-Army',
  wave: 4,
  async executeGodArmy(game, playerSide, handCard, trashCard) {
    const { state, events } = game;
    const p = state.players[playerSide];
    if (!p) return { success: false, reason: 'no_player' };

    const summoned = [];
    if (handCard) {
      const hIdx = p.hand.findIndex(c => c.id === handCard.id || c.name === handCard.name);
      if (hIdx !== -1) {
        const [c] = p.hand.splice(hIdx, 1);
        const stack = createFieldStack(c, { normal: 1, soul: 0 });
        stack.state = 'REFRESHED';
        p.field.push(stack);
        summoned.push(stack);
      }
    }
    if (trashCard) {
      const tIdx = (p.trash.cards || []).findIndex(c => c.id === trashCard.id || c.name === trashCard.name);
      if (tIdx !== -1) {
        const [c] = p.trash.cards.splice(tIdx, 1);
        const stack = createFieldStack(c, { normal: 1, soul: 0 });
        stack.state = 'REFRESHED';
        p.field.push(stack);
        summoned.push(stack);
      }
    }

    if (events) {
      await events.emit({
        type: 'GOD_ARMY_SUMMONED',
        player: playerSide,
        summoned
      });
    }

    return { success: true, summoned };
  }
};

export const GodStrikeKeyword = {
  id: 'God Strike',
  name: 'God Strike',
  wave: 4,
  isGodStrikeActive(state, playerSide, attackerStack) {
    if (!attackerStack || !attackerStack.top) return false;
    const families = attackerStack.top.families || [attackerStack.top.family].filter(Boolean);
    const isGodKing = families.some(f => /god-king|god king/i.test(f));
    return isGodKing;
  },
  async executeGodStrikeBlockCost(game, blockerSide) {
    const { state, events } = game;
    const p = state.players[blockerSide];
    if (!p || p.life <= 0) return { success: false, reason: 'insufficient_life' };

    p.life -= 1;
    state.void = (state.void || 0) + 1;

    if (events) {
      await events.emit({
        type: 'GOD_STRIKE_LIFE_PAID',
        player: blockerSide,
        remainingLife: p.life
      });
    }

    return { success: true, remainingLife: p.life };
  }
};

export const MealtiplyKeyword = {
  id: 'Mealtiply',
  name: 'Mealtiply',
  wave: 4,
  async executeMealtiply(game, playerSide, maxCost = 6, revealCount = 2) {
    const { state, events } = game;
    const p = state.players[playerSide];
    if (!p || !p.deck || p.deck.length === 0) return { success: false, reason: 'empty_deck' };

    const revealed = [];
    for (let i = 0; i < revealCount && p.deck.length > 0; i++) {
      revealed.push(p.deck.shift());
    }

    // Find eligible Drifting Spirit card with cost <= maxCost
    let summonedStack = null;
    let eligibleIdx = revealed.findIndex(c => {
      const fams = c.families || [c.family].filter(Boolean);
      const isDrifting = fams.some(f => /drifting spirit/i.test(f));
      const cost = parseInt(c.cost, 10) || 0;
      return isDrifting && cost <= maxCost && String(c.type || '').toLowerCase().includes('spirit');
    });

    if (eligibleIdx !== -1) {
      const [chosen] = revealed.splice(eligibleIdx, 1);
      summonedStack = createFieldStack(chosen, { normal: 1, soul: 0 });
      summonedStack.state = 'REFRESHED';
      p.field.push(summonedStack);
    }

    // Discard any remaining/unsummoned cards to Trash
    p.trash.cards = p.trash.cards || [];
    for (const rem of revealed) {
      p.trash.cards.push(rem);
    }

    if (events) {
      await events.emit({
        type: 'MEALTIPLY_RESOLVED',
        player: playerSide,
        summoned: summonedStack,
        discardedCount: revealed.length
      });
    }

    return {
      success: true,
      summoned: summonedStack,
      discarded: revealed
    };
  }
};

export const BarrierKeyword = {
  id: 'Barrier',
  name: 'Barrier',
  wave: 4,
  isProtected(card, sourceEffect) {
    return true;
  }
};

export const HollowSkyKeyword = {
  id: 'Hollow Sky',
  hooks: {}
};

export const TwinkleNecromancyKeyword = {
  id: 'Twinkle Necromancy',
  hooks: {}
};

export const EvilLightKeyword = {
  id: 'Evil Light',
  hooks: {}
};

export function registerWave4Keywords(registry) {
  registry.register(PursuitKeyword);
  registry.register({ ...PursuitKeyword, id: 'Great Pursuit' });
  registry.register(SoarKeyword);
  registry.register({ ...SoarKeyword, id: 'True-Soar' });
  registry.register({ ...SoarKeyword, id: 'Grand Soar' });
  registry.register({ ...SoarKeyword, id: 'Grand Twinkle Soar' });
  registry.register({ ...SoarKeyword, id: 'Thundering Soar' });
  registry.register({ ...SoarKeyword, id: 'Twinkle Soar' });
  registry.register(BunshinKeyword);
  registry.register(IceWallKeyword);
  registry.register({ ...IceWallKeyword, id: 'Grand Ice Wall' });
  registry.register(LoadKeyword);
  registry.register({ ...LoadKeyword, id: 'Steel Load' });
  registry.register(ImmortalityKeyword);
  registry.register({ ...ImmortalityKeyword, id: 'Nether Immortality' });
  registry.register({ ...ImmortalityKeyword, id: 'Illusive Immortality' });
  registry.register(TributeKeyword);
  registry.register({ ...TributeKeyword, id: 'Burst Tribute' });
  registry.register(UnsheatheKeyword);
  registry.register({ ...UnsheatheKeyword, id: 'Great Unsheathe' });
  registry.register({ ...UnsheatheKeyword, id: 'Ultimate Unsheathe' });
  registry.register(BombardmentKeyword);
  registry.register({ ...BombardmentKeyword, id: 'Bombardment-D' });
  registry.register({ ...BombardmentKeyword, id: 'Bombardment-Zero' });
  registry.register({ ...BombardmentKeyword, id: 'Twinkle Bombardment' });
  registry.register({ ...BombardmentKeyword, id: 'Grand Bombardment' });
  registry.register({ ...BombardmentKeyword, id: 'Thunder God Bombardment' });
  registry.register(ShowdownKeyword);
  registry.register({ ...ShowdownKeyword, id: 'Rekka Showdown' });
  registry.register(PoisonBladeKeyword);
  registry.register(SpellbindKeyword);
  registry.register({ ...SpellbindKeyword, id: 'Twinkle Spellbind' });
  registry.register(SpellBlightKeyword);
  registry.register(KagemushaKeyword);
  registry.register({ ...KagemushaKeyword, id: 'True-Kagemusha' });
  registry.register({ ...KagemushaKeyword, id: 'Tenma-Kagemusha' });
  registry.register(SilverWheelKeyword);
  registry.register(ExciteKeyword);
  registry.register({ ...ExciteKeyword, id: 'Ultra Excite' });
  registry.register(FastDrawKeyword);
  registry.register(DispersionKeyword);
  registry.register({ ...DispersionKeyword, id: 'Disp' });
  registry.register(SummonBoltKeyword);
  registry.register(AFOKeyword);
  registry.register(StampedeKeyword);
  registry.register({ ...StampedeKeyword, id: 'Roaring Stampede' });
  registry.register(FortressKeyword);
  registry.register(TrueFortressKeyword);
  registry.register({ ...FortressKeyword, id: 'Twinkle Fortress' });
  registry.register(LeapKeyword);
  registry.register({ ...LeapKeyword, id: 'Grand Leap' });
  registry.register(ZeroCounterKeyword);
  registry.register(EnchainKeyword);
  registry.register({ ...EnchainKeyword, id: 'Chain' });
  registry.register(PlunderKeyword);
  registry.register(DrawLockKeyword);
  registry.register(GodArmyKeyword);
  registry.register({ ...GodArmyKeyword, id: 'Banner God-Army' });
  registry.register(GodStrikeKeyword);
  registry.register({ ...GodStrikeKeyword, id: 'Banner God Strike' });
  registry.register(MealtiplyKeyword);
  registry.register({ ...MealtiplyKeyword, id: 'Meal' });
  registry.register(BarrierKeyword);
  registry.register(HollowSkyKeyword);
  registry.register(TwinkleNecromancyKeyword);
  registry.register(EvilLightKeyword);
  registry.register({ ...EvilLightKeyword, id: 'Heavenly Light' });
  registry.register({ ...EvilLightKeyword, id: 'Twinkle Revolution' });
  registry.register({ ...EvilLightKeyword, id: 'Type: Song' });
  registry.register({ ...EvilLightKeyword, id: 'Type: Field' });
  registry.register({ ...EvilLightKeyword, id: 'Type: Flower' });
  registry.register({ ...EvilLightKeyword, id: 'Type: Vision' });
}
