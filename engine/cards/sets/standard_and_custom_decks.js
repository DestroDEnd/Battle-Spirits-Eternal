/**
 * engine/cards/sets/standard_and_custom_decks.js
 * 
 * Deterministic Per-Card Explicit Implementations for:
 * Standard Decks (Purple, Red, White, Green, Yellow, Blue) and Custom User Decks
 * Keyed strictly by canonical card_number.
 */

import { PerCardRegistry } from '../registry.js';

  function getFriendlyState(ctx) {
    const { side, duelState } = ctx;
    return side === 'player' ? duelState.player : duelState.opponent;
  }

  function getEnemyState(ctx) {
    const { side, duelState } = ctx;
    return side === 'player' ? duelState.opponent : duelState.player;
  }

  function getEnemySide(ctx) {
    return ctx.side === 'player' ? 'opponent' : 'player';
  }

  function log(ctx, msg, type = 'magic') {
    if (ctx.arenaApi && typeof ctx.arenaApi.addLog === 'function') {
      ctx.arenaApi.addLog(msg, type);
    }
  }

  function audio(ctx, soundName) {
    if (ctx.arenaApi && ctx.arenaApi.AudioFX && typeof ctx.arenaApi.AudioFX[soundName] === 'function') {
      ctx.arenaApi.AudioFX[soundName]();
    }
  }

  function render(ctx) {
    if (ctx.arenaApi) {
      if (typeof ctx.arenaApi.renderDuelTable === 'function') ctx.arenaApi.renderDuelTable();
      if (ctx.side === 'player' && typeof ctx.arenaApi.renderPlayerHand === 'function') {
        ctx.arenaApi.renderPlayerHand();
      }
    }
  }

  function sendToTrash(ctx, card, side, reason) {
    if (ctx.arenaApi && typeof ctx.arenaApi.sendToTrash === 'function') {
      ctx.arenaApi.sendToTrash(card, side, reason);
    } else {
      const state = side === 'player' ? ctx.duelState.player : ctx.duelState.opponent;
      if (state.field) {
        const idx = state.field.indexOf(card);
        if (idx !== -1) state.field.splice(idx, 1);
      }
      if (!state.trashCards) state.trashCards = [];
      state.trashCards.push(card);
      state.trash = (state.trash || 0) + 1;
    }
  }

  function handleDestroyedCores(ctx, destCard, destSide) {
    if (ctx.arenaApi && typeof ctx.arenaApi.handleDestroyedSpiritCores === 'function') {
      ctx.arenaApi.handleDestroyedSpiritCores(destCard, destSide);
    } else {
      const state = destSide === 'player' ? ctx.duelState.player : ctx.duelState.opponent;
      state.reserve = (state.reserve || 0) + (destCard.currentCores || 0);
      destCard.currentCores = 0;
    }
  }

  function recalcBp(ctx, spirit) {
    if (ctx.arenaApi && typeof ctx.arenaApi.recalculateSpiritBp === 'function') {
      ctx.arenaApi.recalculateSpiritBp(spirit);
    }
  }

  function isTerraDragon(card) {
    if (!card) return false;
    const fam = (card.family || '');
    if (/terra\s*dragon|地竜/i.test(fam)) return true;
    if (Array.isArray(card.families) && card.families.some(f => /terra\s*dragon|地竜/i.test(f))) return true;
    return false;
  }

  // ────────────────────────────────────────────────────────────
  // 1. BS14-096: Curse of Hades
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS14-096', {
    name: 'Curse of Hades',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);
        const friendlyState = getFriendlyState(ctx);

        // Check if Burst is blocked by turn lock
        if (duelState.burstLockThisTurn === side) {
          log(ctx, `🔒 **[Curse of Hades]**: Cannot activate Burst! Blocked by Turn Burst Lock.`, 'warning');
          return;
        }

        // [Burst: After your Life is reduced]
        // "Destroy an opposing exhausted Cost 5 or less Spirit. Then, by paying the cost, activate this card's Flash effect."
        // Rule: Ultimates are strictly immune to effects that specify "Spirit". Only targets Spirits that are exhausted AND cost <= 5!
        const eligibleTargets = (enemyState.field || []).filter(s =>
          s.isExhausted &&
          (s.cost || 0) <= 5 &&
          (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')))
        );

        const executeHadesDestroy = (dest) => {
          const sIdx = enemyState.field.findIndex(s => s.uid === dest.uid);
          if (sIdx !== -1) {
            enemyState.field.splice(sIdx, 1);
            handleDestroyedCores(ctx, dest, enemySide);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Curse of Hades (Burst)');
            audio(ctx, 'destroy');
            log(ctx, `💀 **[CURSE OF HADES: Burst]**: Destroyed opposing exhausted "${dest.name}" (Cost ${dest.cost || 0} ≤ 5)! Cores returned to opponent's reserve.`, 'kill');
            if (arenaApi && typeof arenaApi.showToast === 'function') {
              arenaApi.showToast(`Destroyed exhausted "${dest.name}"!`, 'success');
            }
          }
          render(ctx);
          promptHadesFlash(ctx);
        };

        if (eligibleTargets.length > 0) {
          if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
            arenaApi.promptUniversalTargetModal({
              card,
              side: 'player',
              targetSide: enemySide,
              targetKind: 'spirit',
              customPool: eligibleTargets,
              title: 'Curse of Hades: Destroy Exhausted Spirit',
              description: 'Select an opposing exhausted Cost 5 or less Spirit to destroy:',
              minCount: 1,
              maxCount: 1,
              allowSkip: false
            }, (selected) => {
              if (selected && selected.length > 0) {
                executeHadesDestroy(selected[0]);
              } else {
                promptHadesFlash(ctx);
              }
            });
          } else {
            // Opponent AI chooses highest BP exhausted eligible spirit
            eligibleTargets.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
            executeHadesDestroy(eligibleTargets[0]);
          }
        } else {
          // NO eligible target exists: log informative notice and NEVER exhaust ready spirits!
          log(ctx, `ℹ️ **[CURSE OF HADES: Burst]**: No opposing exhausted Cost 5 or less Spirit found on the battlefield to destroy.`, 'info');
          promptHadesFlash(ctx);
        }
      },

      FLASH: function(ctx) {
        // [Flash] "By destroying one of your Spirits, the opponent destroy one of their Spirits."
        executeHadesFlashLogic(ctx);
      }
    }
  });

  function promptHadesFlash(ctx) {
    const { card, side, arenaApi } = ctx;
    const friendlyState = getFriendlyState(ctx);
    const cost = card.cost !== undefined ? card.cost : 4;
    const availableCores = (friendlyState.reserve || 0);

    if (availableCores >= cost) {
      if (side === 'player' && arenaApi && typeof arenaApi.askOptionalEffect === 'function') {
        arenaApi.askOptionalEffect(
          card,
          `Pay ${cost} core(s) from Reserve to activate Curse of Hades' [Flash] effect? (Destroy 1 of your Spirits -> Opponent destroys 1 of their Spirits)`,
          () => {
            friendlyState.reserve -= cost;
            friendlyState.trash = (friendlyState.trash || 0) + cost;
            log(ctx, `💎 **[CURSE OF HADES]**: Paid ${cost} cores from Reserve to activate [Flash]!`, 'magic');
            executeHadesFlashLogic(ctx);
          },
          () => {
            log(ctx, `ℹ️ **[Curse of Hades]**: Declined to activate Flash effect.`, 'info');
          }
        );
      } else if (side === 'opponent') {
        // AI: only pays if it has extra spirits
        const mySpirits = (friendlyState.field || []).filter(s => s.type === 'Spirit');
        if (mySpirits.length >= 2 && availableCores >= cost) {
          friendlyState.reserve -= cost;
          friendlyState.trash = (friendlyState.trash || 0) + cost;
          executeHadesFlashLogic(ctx);
        }
      }
    }
  }

  function executeHadesFlashLogic(ctx) {
    const { card, side, arenaApi } = ctx;
    const friendlyState = getFriendlyState(ctx);
    const enemyState = getEnemyState(ctx);
    const enemySide = getEnemySide(ctx);

    const friendlySpirits = (friendlyState.field || []).filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
    if (friendlySpirits.length === 0) {
      log(ctx, `ℹ️ **[Curse of Hades: Flash]**: No friendly Spirit to destroy as cost.`, 'info');
      return;
    }

    const doFriendlySacrifice = (friendlySac) => {
      const fIdx = friendlyState.field.findIndex(s => s.uid === friendlySac.uid);
      if (fIdx !== -1) {
        friendlyState.field.splice(fIdx, 1);
        handleDestroyedCores(ctx, friendlySac, side);
        sendToTrash(ctx, friendlySac, side, 'Sacrificed by Curse of Hades (Flash)');
        log(ctx, `💀 **[CURSE OF HADES: Flash Cost]**: Sacrificed allied "${friendlySac.name}"!`, 'kill');
      }

      // Now opponent destroys one of their Spirits
      const enemySpirits = (enemyState.field || []).filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
      if (enemySpirits.length > 0) {
        if (enemySide === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
          arenaApi.promptUniversalTargetModal({
            card,
            side: 'player',
            targetSide: 'player',
            targetKind: 'spirit',
            customPool: enemySpirits,
            title: 'Curse of Hades: Opponent Flash Choice',
            description: 'Curse of Hades forces you to choose 1 of your Spirits to destroy:',
            minCount: 1,
            maxCount: 1,
            allowSkip: false
          }, (sel) => {
            if (sel && sel.length > 0) {
              const oppDest = sel[0];
              const oIdx = enemyState.field.findIndex(s => s.uid === oppDest.uid);
              if (oIdx !== -1) {
                enemyState.field.splice(oIdx, 1);
                handleDestroyedCores(ctx, oppDest, enemySide);
                sendToTrash(ctx, oppDest, enemySide, 'Destroyed by Curse of Hades Flash');
                audio(ctx, 'destroy');
                log(ctx, `💀 **[CURSE OF HADES: Flash]**: Opponent destroyed their "${oppDest.name}"!`, 'kill');
                render(ctx);
              }
            }
          });
        } else {
          // AI destroys its lowest BP spirit
          enemySpirits.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
          const oppDest = enemySpirits[0];
          const oIdx = enemyState.field.findIndex(s => s.uid === oppDest.uid);
          if (oIdx !== -1) {
            enemyState.field.splice(oIdx, 1);
            handleDestroyedCores(ctx, oppDest, enemySide);
            sendToTrash(ctx, oppDest, enemySide, 'Destroyed by Curse of Hades Flash');
            audio(ctx, 'destroy');
            log(ctx, `💀 **[CURSE OF HADES: Flash]**: Opponent destroyed their "${oppDest.name}"!`, 'kill');
            render(ctx);
          }
        }
      }
    };

    if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
      arenaApi.promptUniversalTargetModal({
        card,
        side: 'player',
        targetSide: 'player',
        targetKind: 'spirit',
        customPool: friendlySpirits,
        title: 'Curse of Hades: Destroy 1 of your Spirits',
        description: 'Select 1 of your Spirits to destroy as cost:',
        minCount: 1,
        maxCount: 1,
        allowSkip: false
      }, (sel) => {
        if (sel && sel.length > 0) doFriendlySacrifice(sel[0]);
      });
    } else {
      friendlySpirits.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
      doFriendlySacrifice(friendlySpirits[0]);
    }
  }

  // ────────────────────────────────────────────────────────────
  // 2. BS13-076: Burst Wall
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS13-076', {
    name: 'Burst Wall',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        const { side, duelState } = ctx;
        const friendlyState = getFriendlyState(ctx);
        friendlyState.life = Math.min(5, (friendlyState.life || 0) + 1);
        audio(ctx, 'magic');
        log(ctx, `🛡️ **[BURST WALL: Burst]**: Added 1 core from Void to Life (Current Life: ${friendlyState.life})!`, 'magic');
        render(ctx);
      },

      FLASH: function(ctx) {
        const { side, duelState } = ctx;
        duelState.endAttackStepAtEndOfBattle = true;
        audio(ctx, 'shield');
        log(ctx, `🛑 **[BURST WALL: Flash]**: When this battle ends, the Attack Step will end immediately!`, 'step');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 3. BS33-079: Blizzard Wall
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS33-079', {
    name: 'Blizzard Wall',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        const { side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);
        const readyEnemies = (enemyState.field || []).filter(s => !s.isExhausted);

        if (readyEnemies.length > 0) {
          const target = readyEnemies[0];
          target.isExhausted = true;
          audio(ctx, 'slash');
          log(ctx, `❄️ **[BLIZZARD WALL: Burst]**: Exhausted opposing "${target.name}"!`, 'magic');
          render(ctx);
        }
      },

      FLASH: function(ctx) {
        const { duelState } = ctx;
        duelState.endAttackStepAtEndOfBattle = true;
        audio(ctx, 'shield');
        log(ctx, `❄️ **[BLIZZARD WALL: Flash]**: When this battle ends, the Attack Step will end immediately!`, 'step');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 4. BS14-X01: The DragonHero Sieg-Yamato-Fried
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS14-X01', {
    name: 'The DragonHero Sieg-Yamato-Fried',
    cardType: 'Spirit',
    triggers: {
      BURST: function(ctx) {
        // [Burst: After your Life is reduced]
        // Destroy the opposing Spirit with the highest BP!
        const { side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        const enemySpirits = (enemyState.field || []).filter(s =>
          s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit'))
        );

        if (enemySpirits.length > 0) {
          enemySpirits.sort((a, b) => (b.battleBp || b.currentBp || 0) - (a.battleBp || a.currentBp || 0));
          const maxBp = enemySpirits[0].battleBp || enemySpirits[0].currentBp || 0;
          const candidates = enemySpirits.filter(s => (s.battleBp || s.currentBp || 0) === maxBp);
          const dest = candidates[0];
          const idx = enemyState.field.findIndex(s => s.uid === dest.uid);
          if (idx !== -1) {
            enemyState.field.splice(idx, 1);
            handleDestroyedCores(ctx, dest, enemySide);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Sieg-Yamato-Fried Burst');
            audio(ctx, 'destroy');
            log(ctx, `💀 **[SIEG-YAMATO-FRIED: Burst]**: Destroyed opposing highest BP Spirit "${dest.name}" (${maxBp} BP)!`, 'kill');
            render(ctx);
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 5. BS01-114: Buster Spear
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS01-114', {
    name: 'Buster Spear',
    cardType: 'Magic',
    triggers: {
      MAIN: function(ctx) {
        const { side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        // Destroy 1 opposing Nexus. If destroyed, draw 1 card!
        const nexuses = enemyState.nexus || [];
        if (nexuses.length > 0) {
          const dest = nexuses[0];
          const idx = enemyState.nexus.findIndex(n => n.uid === dest.uid);
          if (idx !== -1) {
            enemyState.nexus.splice(idx, 1);
            enemyState.reserve = (enemyState.reserve || 0) + (dest.currentCores || 0);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Buster Spear');
            audio(ctx, 'destroy');
            log(ctx, `🏛️ **[BUSTER SPEAR: Main]**: Destroyed opposing Nexus "${dest.name}"!`, 'kill');

            // Draw 1 card
            const friendlyState = getFriendlyState(ctx);
            if (friendlyState.deck && friendlyState.deck.length > 0) {
              const drawn = friendlyState.deck.shift();
              friendlyState.hand.push(drawn);
              log(ctx, `🎴 **[BUSTER SPEAR]**: Drew "${drawn.name}"!`, 'magic');
            }
            render(ctx);
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 6. BS01-X02: The SevenShogun Desperado
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS01-X02', {
    name: 'The SevenShogun Desperado',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: async function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        log(ctx, `⚔️ **[DESPERADO: When Summoned]**: Removing 1 core each from every other Spirit!`, 'kill');

        let depletedCount = 0;

        // Process enemy spirits
        const enemyField = enemyState.field || [];
        for (let i = enemyField.length - 1; i >= 0; i--) {
          const s = enemyField[i];
          if ((s.currentCores || 0) > 0) {
            s.currentCores -= 1;
            enemyState.reserve = (enemyState.reserve || 0) + 1;
            if (s.currentCores === 0) {
              enemyField.splice(i, 1);
              sendToTrash(ctx, s, enemySide, 'Depleted by Desperado Core Drain');
              depletedCount++;
              log(ctx, `💀 **[DESPERADO]**: Depleted opposing "${s.name}"!`, 'kill');
            }
          }
        }

        // Process friendly spirits (except Desperado itself)
        const friendlyField = friendlyState.field || [];
        for (let i = friendlyField.length - 1; i >= 0; i--) {
          const s = friendlyField[i];
          const isSelf = card && (
            card === s ||
            (card.uid && s.uid && card.uid === s.uid) ||
            (card.id && s.id && card.id === s.id)
          );
          if (!isSelf && (s.currentCores || 0) > 0) {
            s.currentCores -= 1;
            friendlyState.reserve = (friendlyState.reserve || 0) + 1;
            if (s.currentCores === 0) {
              friendlyField.splice(i, 1);
              sendToTrash(ctx, s, side, 'Depleted by Desperado Core Drain');
              depletedCount++;
              log(ctx, `💀 **[DESPERADO]**: Depleted friendly "${s.name}"!`, 'warning');
            }
          }
        }

        // For each spirit depleted, put a core from Void onto Desperado!
        if (depletedCount > 0) {
          card.currentCores = (card.currentCores || 0) + depletedCount;
          audio(ctx, 'core');
          log(ctx, `💎 **[DESPERADO]**: Gained +${depletedCount} core(s) from Void for ${depletedCount} depleted Spirit(s)!`, 'magic');
        }

        render(ctx);
      },

      WHEN_ATTACKS: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySpirits = (enemyState.field || []).filter(s => (s.currentCores || 0) > 1);

        if (enemySpirits.length > 0) {
          enemySpirits.sort((a, b) => (b.currentCores || 0) - (a.currentCores || 0));
          const target = enemySpirits[0];
          const removed = target.currentCores - 1;
          target.currentCores = 1;
          enemyState.reserve = (enemyState.reserve || 0) + removed;
          log(ctx, `⚔️ **[DESPERADO: When Attacks]**: Removed ${removed} core(s) from "${target.name}" to Reserve, leaving only 1 core!`, 'kill');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 7. BS10-100: Brave Cemetery
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS10-100', {
    name: 'Brave Cemetery',
    cardType: 'Magic',
    triggers: {
      MAIN: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const trash = friendlyState.trashCards || [];
        const braveIdx = trash.findIndex(c => (c.type || '').includes('Brave'));

        if (braveIdx !== -1) {
          const salvaged = trash.splice(braveIdx, 1)[0];
          if (!friendlyState.hand) friendlyState.hand = [];
          friendlyState.hand.push(salvaged);
          friendlyState.trash = Math.max(0, (friendlyState.trash || 1) - 1);
          log(ctx, `♻️ **[BRAVE CEMETERY: Main]**: Returned Brave card "${salvaged.name}" from Trash to Hand!`, 'magic');
          audio(ctx, 'magic');
          render(ctx);
        } else {
          log(ctx, `ℹ️ **[BRAVE CEMETERY: Main]**: No Brave card found in Trash.`, 'info');
        }
      },

      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const spirits = friendlyState.field || [];
        if (spirits.length > 0) {
          spirits[0].battleBp = (spirits[0].battleBp || spirits[0].currentBp || 0) + 1000;
          log(ctx, `⚡ **[BRAVE CEMETERY: Flash]**: Gave +1000 BP to "${spirits[0].name}"!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 8. BS23-X02: The WhiteSnakeEmperor Aldius-Viper
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS23-X02', {
    name: 'The WhiteSnakeEmperor Aldius-Viper',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        let coresToRemove = 3;
        let depletedCount = 0;
        const enemyField = enemyState.field || [];

        for (let i = enemyField.length - 1; i >= 0 && coresToRemove > 0; i--) {
          const s = enemyField[i];
          const take = Math.min(s.currentCores || 0, coresToRemove);
          s.currentCores -= take;
          enemyState.reserve = (enemyState.reserve || 0) + take;
          coresToRemove -= take;

          if (s.currentCores === 0) {
            enemyField.splice(i, 1);
            sendToTrash(ctx, s, enemySide, 'Depleted by Aldius-Viper');
            depletedCount++;
          }
        }

        if (depletedCount > 0) {
          friendlyState.reserve = (friendlyState.reserve || 0) + depletedCount;
          log(ctx, `🐍 **[ALDIUS-VIPER]**: Put +${depletedCount} core(s) from Void into Reserve for depleted spirits!`, 'magic');
        }
        render(ctx);
      },

      WHEN_ATTACKS: function(ctx) {
        const enemyState = getEnemyState(ctx);
        const enemySpirits = (enemyState.field || []).filter(s => (s.currentCores || 0) > 0);
        if (enemySpirits.length > 0) {
          enemySpirits[0].currentCores -= 1;
          enemyState.reserve = (enemyState.reserve || 0) + 1;
          log(ctx, `🐍 **[ALDIUS-VIPER: When Attacks]**: Moved 1 core from "${enemySpirits[0].name}" to Reserve.`, 'kill');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 9. BS52-X02: The NetherCorpseKnight Ajaccio
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS52-X02', {
    name: 'The NetherCorpseKnight Ajaccio',
    cardType: 'Spirit',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        log(ctx, `⚔️ **[AJACCIO: When Attacks]**: When blocked, this Spirit destroys the blocking Spirit!`, 'magic');
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 10. BS42-014: Puppet Soldier
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS42-014', {
    name: 'Puppet Soldier',
    cardType: 'Spirit',
    triggers: {
      WHEN_DESTROYED: function(ctx) {
        const { side, duelState } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const trash = friendlyState.trashCards || [];
        const makaiIdx = trash.findIndex(c => (c.name || '').includes('Makai') || (c.family || '').includes('Makai'));
        if (makaiIdx !== -1) {
          const salvaged = trash.splice(makaiIdx, 1)[0];
          if (!friendlyState.hand) friendlyState.hand = [];
          friendlyState.hand.push(salvaged);
          log(ctx, `🧙 **[PUPPET SOLDIER]**: Returned "${salvaged.name}" from Trash to Hand!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 11. SD06-013: Burst Draw
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD06-013', {
    name: 'Burst Draw',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        const { side, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        log(ctx, `💥 **[BURST DRAW: Burst]**: Drawing 2 cards!`, 'magic');
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          const d1 = friendlyState.deck.shift();
          friendlyState.hand.push(d1);
          if (friendlyState.deck.length > 0) {
            const d2 = friendlyState.deck.shift();
            friendlyState.hand.push(d2);
          }
        }
        audio(ctx, 'magic');
        render(ctx);
      },
      MAIN: function(ctx) {
        const { side, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        log(ctx, `🎴 **[BURST DRAW: Main]**: Drawing 2 cards!`, 'magic');
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          const d1 = friendlyState.deck.shift();
          friendlyState.hand.push(d1);
          if (friendlyState.deck.length > 0) {
            const d2 = friendlyState.deck.shift();
            friendlyState.hand.push(d2);
          }
        }
        audio(ctx, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 12. SD06-007: The HeroDragon Lord-Dragon
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD06-007', {
    name: 'The HeroDragon Lord-Dragon',
    cardType: 'Spirit',
    triggers: {
      BURST: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        log(ctx, `💥 **[LORD-DRAGON: Burst]**: Summoning The HeroDragon Lord-Dragon!`, 'summon');

        // Remove from burst zone
        friendlyState.burstCard = null;
        if (!friendlyState.field) friendlyState.field = [];
        friendlyState.field.push(card);

        // Allocate 1 core from reserve if available
        if ((friendlyState.reserve || 0) > 0 && (card.currentCores || 0) === 0) {
          friendlyState.reserve -= 1;
          card.currentCores = 1;
        }

        audio(ctx, 'summon');
        render(ctx);
      },

      AFTER_BURST: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        // Destroy 1 opposing spirit with <= 9000 BP
        const eligible = (enemyState.field || []).filter(s => (s.battleBp || s.currentBp || 0) <= 9000);
        if (eligible.length > 0) {
          eligible.sort((a, b) => (b.battleBp || b.currentBp || 0) - (a.battleBp || a.currentBp || 0));
          const dest = eligible[0];
          const idx = enemyState.field.findIndex(s => s.uid === dest.uid || s.id === dest.id);
          if (idx !== -1) {
            enemyState.field.splice(idx, 1);
            handleDestroyedCores(ctx, dest, enemySide);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Lord-Dragon effect');
            audio(ctx, 'destroy');
            log(ctx, `🔥 **[LORD-DRAGON: After Burst]**: Destroyed opposing Spirit "${dest.name}" (<= 9000 BP)!`, 'kill');
            render(ctx);
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 13. BS16-X01: The ExplosionHero Lord-Dragon-Bazzel
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS16-X01', {
    name: 'The ExplosionHero Lord-Dragon-Bazzel',
    cardType: 'Spirit',
    triggers: {
      BURST: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        log(ctx, `💥 **[LORD-DRAGON-BAZZEL: Burst]**: Summoning The ExplosionHero Lord-Dragon-Bazzel!`, 'summon');

        friendlyState.burstCard = null;
        if (!friendlyState.field) friendlyState.field = [];
        friendlyState.field.push(card);

        if ((friendlyState.reserve || 0) > 0 && (card.currentCores || 0) === 0) {
          friendlyState.reserve -= 1;
          card.currentCores = 1;
        }

        audio(ctx, 'summon');
        render(ctx);
      },

      AFTER_BURST: function(ctx) {
        const { card, side } = ctx;
        if (card.isExhausted) {
          card.isExhausted = false;
          log(ctx, `⚡ **[LORD-DRAGON-BAZZEL: After Burst]**: Refreshed!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 14. BS34-X01: The SengokuDragonEmperor Burning-Souldragon
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS34-X01', {
    name: 'The SengokuDragonEmperor Burning-Souldragon',
    cardType: 'Spirit',
    triggers: {
      BURST: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);

        if ((friendlyState.life || 0) <= 3) {
          log(ctx, `🔥 **[BURNING-SOULDRAGON: Burst]**: Life is 3 or less! Summoning Burning-Souldragon!`, 'summon');
          friendlyState.burstCard = null;
          if (!friendlyState.field) friendlyState.field = [];
          friendlyState.field.push(card);

          // Move all cores from Trash to this Spirit
          const trashCores = friendlyState.trash || 0;
          if (trashCores > 0) {
            friendlyState.trash = 0;
            card.currentCores = (card.currentCores || 0) + trashCores;
            log(ctx, `💎 **[BURNING-SOULDRAGON]**: Retrieved all ${trashCores} core(s) from Trash onto this Spirit!`, 'magic');
          } else if ((friendlyState.reserve || 0) > 0 && (card.currentCores || 0) === 0) {
            friendlyState.reserve -= 1;
            card.currentCores = 1;
          }

          audio(ctx, 'summon');
          render(ctx);
        } else {
          log(ctx, `ℹ️ **[BURNING-SOULDRAGON: Burst]**: Life is greater than 3, summon condition not met.`, 'info');
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 15. BS29-001: Dragonhead
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS29-001', {
    name: 'Dragonhead',
    cardType: 'Spirit',
    triggers: {
      FLASH: function(ctx) {
        log(ctx, `⚡ **[DRAGONHEAD: Awaken]**: Can transfer cores from friendly Spirits.`, 'magic');
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 16. BS19-106: Ice Age Shield
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS19-106', {
    name: 'Ice Age Shield',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        if (!duelState.modifiers) duelState.modifiers = [];
        duelState.modifiers.push({
          type: 'PREVENT_LIFE_LOSS',
          side,
          duration: 'THIS_TURN',
          source: 'Ice Age Shield'
        });
        audio(ctx, 'magic');
        log(ctx, `🛡️ **[ICE AGE SHIELD: Flash]**: During this turn, your Life cannot be reduced by targeted attack/effects!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 17. BS42-092: Co-op Barrier
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS42-092', {
    name: 'Co-op Barrier',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const exhausted = (friendlyState.field || []).filter(s => s.isExhausted);
        if (exhausted.length > 0) {
          exhausted[0].isExhausted = false;
          audio(ctx, 'magic');
          log(ctx, `⚡ **[CO-OP BARRIER: Flash]**: Refreshed "${exhausted[0].name}"!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 18. BS25-X01: The ArmoredDragonBattleship Enterprise
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS25-X01', {
    name: 'The ArmoredDragonBattleship Enterprise',
    cardType: 'Spirit',
    triggers: {
      WHEN_BLOCKS: function(ctx) {
        const { card, side, arenaApi } = ctx;
        log(ctx, `🛡️ **[ENTERPRISE: When Blocks]**: Battleship deployed in defensive stance!`, 'magic');
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 19. BS08-X32: The WingDeity Grand-Woden
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS08-X32', {
    name: 'The WingDeity Grand-Woden',
    cardType: 'Spirit',
    triggers: {
      WHEN_EXHAUSTED: function(ctx) {
        const { card, side } = ctx;
        card.isExhausted = false;
        log(ctx, `⚡ **[GRAND-WODEN]**: Armed Machine synergy triggered! Grand-Woden refreshed!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 20. BS12-077: Insect Aura
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS12-077', {
    name: 'Insect Aura',
    cardType: 'Magic',
    triggers: {
      MAIN: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        friendlyState.reserve = (friendlyState.reserve || 0) + 1;
        audio(ctx, 'core');
        log(ctx, `🌿 **[INSECT AURA: Main]**: Core placed into Reserve!`, 'magic');
        render(ctx);
      },
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const spirits = friendlyState.field || [];
        if (spirits.length > 0) {
          spirits[0].battleBp = (spirits[0].battleBp || spirits[0].currentBp || 0) + 2000;
          audio(ctx, 'magic');
          log(ctx, `🌿 **[INSECT AURA: Flash]**: Gave +2000 BP to "${spirits[0].name}"!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 21. BS13-077: Breeze Ride
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS13-077', {
    name: 'Breeze Ride',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const spirits = friendlyState.field || [];
        if (spirits.length > 0) {
          spirits[0].battleBp = (spirits[0].battleBp || spirits[0].currentBp || 0) + 3000;
          audio(ctx, 'magic');
          log(ctx, `🍃 **[BREEZE RIDE: Flash]**: Gave +3000 BP to "${spirits[0].name}"!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 22. BS24-020: Axemoth
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS24-020', {
    name: 'Axemoth',
    cardType: 'Spirit',
    triggers: {
      WHEN_DESTROYED: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        if (!friendlyState.hand) friendlyState.hand = [];
        friendlyState.hand.push(card);
        log(ctx, `🦋 **[AXEMOTH: When Destroyed]**: Returned Axemoth back to Hand!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 23. BS27-082: Defense Nebula
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS27-082', {
    name: 'Defense Nebula',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySpirits = enemyState.field || [];
        if (enemySpirits.length > 0) {
          enemySpirits[0].currentLevel = 1;
          audio(ctx, 'magic');
          log(ctx, `✨ **[DEFENSE NEBULA: Flash]**: Forced opposing "${enemySpirits[0].name}" to LV1!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 24. BS41-092: After Image
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS41-092', {
    name: 'After Image',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        if (!duelState.modifiers) duelState.modifiers = [];
        duelState.modifiers.push({
          type: 'PREVENT_MILL',
          side,
          duration: 'THIS_TURN',
          source: 'After Image'
        });
        audio(ctx, 'magic');
        log(ctx, `🌟 **[AFTER IMAGE: Flash]**: During this turn, your Deck cannot be discarded by opposing effects!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 25. BATTLE-SPIRITS-A4868: Haneppo
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A4868', {
    name: 'Haneppo',
    cardType: 'Spirit',
    triggers: {
      WHEN_DESTROYED: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          const d1 = friendlyState.deck.shift();
          if (!friendlyState.hand) friendlyState.hand = [];
          friendlyState.hand.push(d1);
          if (friendlyState.deck.length > 0) {
            const d2 = friendlyState.deck.shift();
            friendlyState.hand.push(d2);
          }
          audio(ctx, 'magic');
          log(ctx, `🪶 **[HANEPPO: When Destroyed]**: Drew 2 cards!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 26. BS23-083: Spinning Sword
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS23-083', {
    name: 'Spinning Sword',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);
        const millCount = 2;
        let discarded = 0;
        for (let i = 0; i < millCount; i++) {
          if (enemyState.deck && enemyState.deck.length > 0) {
            const card = enemyState.deck.shift();
            sendToTrash(ctx, card, enemySide, 'MILL');
            discarded++;
          }
        }
        audio(ctx, 'magic');
        log(ctx, `⚔️ **[SPINNING SWORD: Flash]**: Discarded ${discarded} cards from opposing decktop!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 27. BATTLE-SPIRITS-A6236: Lead Wall
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A6236', {
    name: 'Lead Wall',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const { side, duelState } = ctx;
        if (!duelState.modifiers) duelState.modifiers = [];
        duelState.modifiers.push({
          type: 'PREVENT_LIFE_LOSS',
          side,
          duration: 'THIS_BATTLE',
          source: 'Lead Wall'
        });
        audio(ctx, 'magic');
        log(ctx, `🛡️ **[LEAD WALL: Flash]**: Defensive barrier activated!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 28. BS68-041: Railgunner-Foresight
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS68-041', {
    name: 'Railgunner-Foresight',
    cardType: 'Spirit',
    triggers: {
      WHEN_BLOCKS: function(ctx) {
        const friendlyState = getFriendlyState(ctx);
        if (friendlyState && friendlyState.deck && friendlyState.deck.length > 0) {
          const drawn = friendlyState.deck.shift();
          if (!friendlyState.hand) friendlyState.hand = [];
          friendlyState.hand.push(drawn);
          audio(ctx, 'draw');
          log(ctx, `🤖 **[RAILGUNNER-FORESIGHT: When Blocks]**: Drew 1 card!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 29. SD01-029: The Wriggle Catacomb
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD01-029', {
    name: 'The Wriggle Catacomb',
    cardType: 'Nexus',
    triggers: {
      WHEN_OPPOSING_ATTACKS: function(ctx) {
        const { attacker, duelState, side } = ctx;
        if (attacker && attacker.color && attacker.color.toLowerCase() === 'green') {
          const enemyState = getEnemyState(ctx);
          if (enemyState && enemyState.field) {
            const target = enemyState.field.find(s => s !== attacker && !s.exhausted);
            if (target) {
              target.exhausted = true;
              audio(ctx, 'exhaust');
              log(ctx, `🏛️ **[THE WRIGGLE CATACOMB]**: Exhausted ${target.name || 'opposing spirit'}!`, 'skill');
              render(ctx);
            }
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 29b. SD01-035: Sudden Death Draw
  // [FLASH] Draw a card. During this turn, give a Spirit +1000 BP.
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD01-035', {
    name: 'Sudden Death Draw',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const friendly = getFriendlyState(ctx);
        const { card, targetSpiritUid, contextAttacker, side } = ctx;
        const isPlayer = side === 'player';

        // 1. Draw 1 card from deck
        let drewCount = 0;
        const drawn = friendly.deck.shift();
        if (drawn) {
          friendly.hand.push(drawn);
          drewCount++;
          audio(ctx, 'draw');
        }

        // 2. Select target Spirit to give +1000 BP
        const field = friendly.field || [];
        let target = null;
        if (targetSpiritUid) {
          target = field.find(s => s.uid === targetSpiritUid);
        }
        if (!target) {
          if (ctx.duelState && ctx.duelState.combatEvent) {
            const ce = ctx.duelState.combatEvent;
            if (ce.attacker && field.some(s => s.uid === ce.attacker.uid)) {
              target = ce.attacker;
            } else if (ce.blocker && field.some(s => s.uid === ce.blocker.uid)) {
              target = ce.blocker;
            }
          }
          if (!target && contextAttacker && field.some(s => s.uid === contextAttacker.uid)) {
            target = contextAttacker;
          }
          if (!target && field.length > 0) {
            target = [...field].sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0))[0];
          }
        }

        if (target && ctx.arenaApi && typeof ctx.arenaApi.grantEffectToUnit === 'function') {
          ctx.arenaApi.grantEffectToUnit(target, {
            bp: 1000,
            text: '+1000 BP until end of turn',
            expires: 'end_of_turn'
          }, card ? card.name : 'Sudden Death Draw');
          const desc = `${isPlayer ? 'You drew' : 'Opponent drew'} 1 card from deck and granted +1000 BP to "${target.name}" (now ${target.currentBp} BP)!`;
          log(ctx, `🔮 **[SUDDEN DEATH DRAW]**: ${desc}`, 'magic');
          render(ctx);
          return desc;
        } else {
          const desc = `${isPlayer ? 'You drew' : 'Opponent drew'} 1 card from deck!${field.length === 0 ? ' (No allied Spirits on field to receive +1000 BP)' : ''}`;
          log(ctx, `🔮 **[SUDDEN DEATH DRAW]**: ${desc}`, 'magic');
          render(ctx);
          return desc;
        }
      },
      MAIN: function(ctx) {
        return PerCardRegistry.get('SD01-035').triggers.FLASH(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 30. SD65 Additional Handlers (Nouvelle-Vague, Ila-Riva, Magnazappah, Ill-Dezal)
  // (Core SD65 staples: CX01, 001, 002, 003, 006, X01, X03 are in sd65_four_demon_lords.js)
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-004', {
    name: 'The HellwindCount Nouvelle-Vague',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field) {
          const target = enemy.field.find(s => !s.exhausted);
          if (target) target.exhausted = true;
        }
        if (ctx.card && ctx.card.currentCores !== undefined) ctx.card.currentCores += 1;
        audio(ctx, 'exhaust');
        log(ctx, `🌪️ **[NOUVELLE-VAGUE: When Summoned]**: Ramped 1 core and exhausted opposing spirit!`, 'skill');
        render(ctx);
      }
    }
  });

  PerCardRegistry.registerCard('SD65-005', {
    name: 'The HellseaCount Ila-Riva',
    cardType: 'Ultimate',
    triggers: {
      BURST: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly) {
          for (let i = 0; i < 2; i++) {
            if (friendly.deck && friendly.deck.length > 0) {
              if (!friendly.hand) friendly.hand = [];
              friendly.hand.push(friendly.deck.shift());
            }
          }
          if (friendly.hand && friendly.hand.length > 0) {
            const disc = friendly.hand.pop();
            if (!friendly.trashCards) friendly.trashCards = [];
            friendly.trashCards.push(disc);
          }
          audio(ctx, 'burst');
          log(ctx, `🌊 **[ILA-RIVA: Burst]**: Drew 2 cards and discarded 1!`, 'burst');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('SD65-X02', {
    name: 'The Hellsoil FourDemonLord Magnazappah',
    cardType: 'Ultimate',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          const target = enemy.field.find(s => (s.currentCores || 0) > 0);
          if (target) {
            const drained = Math.min(2, target.currentCores);
            target.currentCores -= drained;
            if (!enemy.trash) enemy.trash = 0;
            enemy.trash += drained;
            audio(ctx, 'destroy');
            log(ctx, `⚡ **[MAGNAZAPPAH: Count Trigger]**: Sent 2 cores from opposing spirit to Trash!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('SD65-X04', {
    name: 'The Hellsea FourDemonLord Ill-Dezal',
    cardType: 'Ultimate',
    triggers: {
      BURST: function(ctx) {
        const enemy = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          let highest = enemy.field[0];
          for (const s of enemy.field) {
            if ((s.cost || 0) > (highest.cost || 0)) highest = s;
          }
          sendToTrash(ctx, highest, enemySide, 'DESTROY');
          audio(ctx, 'destroy');
          log(ctx, `🦑 **[ILL-DEZAL: Burst]**: Destroyed highest-cost spirit ${highest.name || ''}!`, 'burst');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 31. Additional Javad Staples (Forbidden Grave, Trickster, Seiryubi, Metallifer, Blizza-Liger)
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS26-075', {
    name: 'Forbidden Grave',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && friendly.trashCards && friendly.trashCards.length > 0) {
          const uIdx = friendly.trashCards.findIndex(c => (c.type || '').includes('Ultimate'));
          if (uIdx !== -1) {
            const u = friendly.trashCards.splice(uIdx, 1)[0];
            if (!friendly.field) friendly.field = [];
            friendly.field.push(u);
            audio(ctx, 'summon');
            log(ctx, `🪦 **[FORBIDDEN GRAVE: Flash]**: Summoned ${u.name || 'Ultimate'} from Trash!`, 'magic');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BSC17-X04', {
    name: 'Ultimate-Trickster',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && friendly.trashCards && friendly.trashCards.length > 0) {
          const mIdx = friendly.trashCards.findIndex(c => (c.type || '').includes('Magic'));
          if (mIdx !== -1) {
            const m = friendly.trashCards.splice(mIdx, 1)[0];
            if (!friendly.hand) friendly.hand = [];
            friendly.hand.push(m);
            audio(ctx, 'salvage');
            log(ctx, `🃏 **[ULTIMATE-TRICKSTER: When Summoned]**: Salvaged ${m.name || 'Magic'} from Trash to Hand!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS28-X05', {
    name: 'Ultimate-Seiryubi',
    cardType: 'Ultimate',
    triggers: {
      FLASH: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && (friendly.trash || 0) >= 5) {
          const trashCores = friendly.trash || 0;
          friendly.trash = 0;
          const seiryubi = ctx.card || { id: 'BS28-X05', name: 'Ultimate-Seiryubi', currentCores: 1 };
          seiryubi.currentCores = 1;
          friendly.reserve = (friendly.reserve || 0) + (trashCores - 1);
          if (!friendly.field) friendly.field = [];
          if (friendly.hand) {
            const hIdx = friendly.hand.indexOf(seiryubi);
            if (hIdx !== -1) friendly.hand.splice(hIdx, 1);
          }
          friendly.field.push(seiryubi);
          audio(ctx, 'flash');
          log(ctx, `🐉 **[ULTIMATE-SEIRYUBI: Violent High Speed]**: Summoned with ${trashCores} cores returned from Trash!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BATTLE-SPIRITS-A12408', {
    name: 'The ShelledEarl Metallifer',
    cardType: 'Ultimate',
    triggers: {
      BURST: function(ctx) {
        const enemy = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          let remainingCap = 20000;
          const eligible = (enemy.field || []).filter(s => (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit'))));
          eligible.sort((a, b) => (a.bp || 0) - (b.bp || 0));
          for (const s of eligible) {
            if ((s.bp || 0) <= remainingCap) {
              remainingCap -= (s.bp || 0);
              sendToTrash(ctx, s, enemySide, 'DESTROY');
            }
          }
          audio(ctx, 'destroy');
          log(ctx, `🛡️ **[METALLIFER: Burst]**: Destroyed opposing spirits up to 20,000 BP!`, 'burst');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS28-X06', {
    name: 'The NextGenerationMachineBeast Blizza-Liger',
    cardType: 'Ultimate',
    triggers: {
      BURST: function(ctx) {
        const friendly = getFriendlyState(ctx);
        const enemy = getEnemyState(ctx);
        if (friendly && (friendly.life || 0) <= 3 && enemy && enemy.field && enemy.field.length > 0) {
          const target = enemy.field.find(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit'))) || enemy.field[0];
          if (target) {
            const idx = enemy.field.indexOf(target);
            if (idx !== -1) enemy.field.splice(idx, 1);
            if (!enemy.deck) enemy.deck = [];
            enemy.deck.unshift(target);
            audio(ctx, 'bounce');
            log(ctx, `❄️ **[BLIZZA-LIGER: Burst]**: Returned ${target.name || 'opposing spirit'} to decktop!`, 'burst');
            render(ctx);
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 32. Petit Stark White Machine Contract Staples
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS67-CX02', {
    name: 'Petit Stark',
    cardType: 'Contract Spirit',
    triggers: {
      END_STEP: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly) {
          friendly.counters = (friendly.counters || 0) + 1;
          if (!friendly.lifeLostThisTurn) {
            friendly.counters += 1;
            if (friendly.deck && friendly.deck.length > 0) {
              if (!friendly.hand) friendly.hand = [];
              friendly.hand.push(friendly.deck.shift());
            }
          }
          audio(ctx, 'draw');
          log(ctx, `🛡️ **[PETIT STARK: End Step]**: Counters increased and drew 1 card!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-X11', {
    name: 'The DawnLightContractGun Celestoul',
    cardType: 'Brave',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const enemy = getEnemyState(ctx);
        const friendly = getFriendlyState(ctx);
        if (enemy && enemy.burst) {
          const b = enemy.burst;
          enemy.burst = null;
          if (!enemy.trashCards) enemy.trashCards = [];
          enemy.trashCards.push(b);
          audio(ctx, 'destroy');
          log(ctx, `🔫 **[CELESTOUL: When Summoned]**: Discarded opposing Burst ${b.name || ''}!`, 'skill');
          render(ctx);
        } else if (friendly && friendly.field && friendly.field.length > 0) {
          const target = friendly.field[0];
          if (target.currentCores !== undefined) target.currentCores += 1;
          audio(ctx, 'core');
          log(ctx, `🔫 **[CELESTOUL: When Summoned]**: Put 1 core from Void onto ${target.name || 'friendly spirit'}!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-025', {
    name: 'Pata Bird',
    cardType: 'Spirit',
    triggers: {
      WHEN_BLOCKS: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly) {
          friendly.counters = (friendly.counters || 0) + 2;
          audio(ctx, 'block');
          log(ctx, `🐦 **[PATA BIRD: When Blocks]**: Counters +2!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-029', {
    name: 'The BattleMobile Red Impulse',
    cardType: 'Spirit',
    triggers: {
      WHEN_BLOCKS: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field) {
          const nIdx = enemy.field.findIndex(s => s.type === 'Nexus' || ((s.type || '').includes('Nexus')));
          if (nIdx !== -1) {
            const n = enemy.field.splice(nIdx, 1)[0];
            if (!enemy.deck) enemy.deck = [];
            enemy.deck.push(n);
            audio(ctx, 'bounce');
            log(ctx, `🚗 **[RED IMPULSE: When Blocks]**: Returned opposing Nexus ${n.name || ''} to deckbottom!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-033', {
    name: 'Jet Nodon',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const friendly = getFriendlyState(ctx);
        const enemy = getEnemyState(ctx);
        if (friendly) friendly.counters = (friendly.counters || 0) + 1;
        if (friendly && (friendly.counters || 0) >= 4 && enemy && enemy.field && enemy.field.length > 0) {
          const target = enemy.field.pop();
          if (!enemy.deck) enemy.deck = [];
          enemy.deck.push(target);
          audio(ctx, 'bounce');
          log(ctx, `✈️ **[JET NODON: When Summoned]**: Returned opposing ${target.name || 'spirit'} to deckbottom!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS60-092', {
    name: 'Clear Wall',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly) {
          friendly.counters = (friendly.counters || 0) + 2;
          friendly.life = (friendly.life || 0) + 1;
          audio(ctx, 'life');
          log(ctx, `🛡️ **[CLEAR WALL: Burst]**: Counters +2 and Life +1!`, 'burst');
          render(ctx);
        }
      },
      FLASH: function(ctx) {
        const { duelState } = ctx;
        if (!duelState.modifiers) duelState.modifiers = [];
        duelState.modifiers.push({
          type: 'END_ATTACK_STEP',
          source: 'Clear Wall'
        });
        audio(ctx, 'magic');
        log(ctx, `🛡️ **[CLEAR WALL: Flash]**: Attack Step will end at end of battle!`, 'magic');
        render(ctx);
      }
    }
  });

  PerCardRegistry.registerCard('BSC45-098', {
    name: 'Diamond Strike LT',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && friendly.field) {
          const target = friendly.field.find(s => s.exhausted && s.family && s.family.includes('Armed Machine')) || friendly.field.find(s => s.exhausted);
          if (target) {
            target.exhausted = false;
            audio(ctx, 'refresh');
            log(ctx, `💎 **[DIAMOND STRIKE LT: Flash]**: Refreshed ${target.name || 'Armed Machine spirit'}!`, 'magic');
            render(ctx);
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 33. Remaining Petit Stark Deck Completion Handlers
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS69-035', {
    name: 'The GlassWings Sylvia',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly) {
          friendly.trash = (friendly.trash || 0) + 1;
          const hasStark = (friendly.field || []).some(s => s.name && s.name.includes('Stark'));
          if (hasStark) friendly.counters = (friendly.counters || 0) + 1;
          audio(ctx, 'core');
          log(ctx, `🦋 **[SYLVIA: When Summoned]**: Put 1 core to Trash and added 1 Counter!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS69-073', {
    name: 'Winglass Airport',
    cardType: 'Nexus',
    triggers: {
      FLASH: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && friendly.hand) {
          const bIdx = friendly.hand.findIndex(c => (c.type || '').includes('Brave'));
          if (bIdx !== -1) {
            const b = friendly.hand.splice(bIdx, 1)[0];
            if (!friendly.field) friendly.field = [];
            friendly.field.push(b);
            audio(ctx, 'summon');
            log(ctx, `✈️ **[WINGLASS AIRPORT: Flash]**: Summoned ${b.name || 'Brave'} from Hand!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS69-086', {
    name: 'Take Aim',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.life > 0) {
          enemy.life = Math.max(0, enemy.life - 1);
          if (!enemy.reserve) enemy.reserve = 0;
          enemy.reserve += 1;
          audio(ctx, 'life');
          log(ctx, `🎯 **[TAKE AIM: Flash]**: Sent 1 opposing Life to Reserve!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-XV03', {
    name: 'The IceBeast Mam-Morl XV',
    cardType: 'Spirit',
    triggers: {
      PREVENT_LIFE_LOSS: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && ctx.card) {
          if (!friendly.field) friendly.field = [];
          friendly.field.push(ctx.card);
          audio(ctx, 'summon');
          log(ctx, `🦣 **[MAM-MORL XV]**: Summoned to prevent Life damage!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-032', {
    name: 'Stark & Celestoul',
    cardType: 'Spirit',
    triggers: {
      START_ATTACK_STEP: function(ctx) {
        const friendly = getFriendlyState(ctx);
        const enemy = getEnemyState(ctx);
        if (friendly && friendly.hand) {
          const bIdx = friendly.hand.findIndex(c => (c.type || '').includes('Brave'));
          if (bIdx !== -1) {
            const b = friendly.hand.splice(bIdx, 1)[0];
            if (!friendly.field) friendly.field = [];
            friendly.field.push(b);
            if (enemy && enemy.field && enemy.field.length > 0) {
              const target = enemy.field.pop();
              if (!enemy.deck) enemy.deck = [];
              enemy.deck.push(target);
            }
            audio(ctx, 'summon');
            log(ctx, `⚔️ **[STARK & CELESTOUL]**: Summoned Brave and bounced opposing spirit to deckbottom!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BATTLE-SPIRITS-A1586', {
    name: 'The ShieldAstralArmored Shieldtank',
    cardType: 'Brave',
    triggers: {
      WHEN_BLOCKS: function(ctx) {
        const target = ctx.card || ctx.attacker || ctx.blocker;
        if (target && target.bp !== undefined) {
          target.bp += 5000;
          audio(ctx, 'block');
          log(ctx, `🛡️ **[SHIELDTANK: When Blocks]**: BP +5000!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS67-074', {
    name: 'The Ancient Temple of Ice',
    cardType: 'Nexus',
    triggers: {
      PREVENT_LIFE_LOSS: function(ctx) {
        const { attacker } = ctx;
        if (attacker && (attacker.bp || 0) <= 5000) {
          log(ctx, `🏛️ **[ANCIENT TEMPLE OF ICE]**: Prevented life loss from <=5000 BP spirit!`, 'skill');
          return true;
        }
        return false;
      }
    }
  });

  PerCardRegistry.registerCard('BS67-075', {
    name: 'Headquarters of the Winglass PMC',
    cardType: 'Nexus',
    triggers: {
      WHEN_DEPLOYED: function(ctx) {
        const friendly = getFriendlyState(ctx);
        if (friendly && friendly.deck && friendly.deck.length > 0) {
          const idx = friendly.deck.findIndex(c => c.family && c.family.includes('Machine Contract'));
          if (idx !== -1) {
            const drawn = friendly.deck.splice(idx, 1)[0];
            if (!friendly.hand) friendly.hand = [];
            friendly.hand.push(drawn);
            audio(ctx, 'draw');
            log(ctx, `🏢 **[PMC HQ: When Deployed]**: Added ${drawn.name || 'Machine Contract spirit'} to Hand!`, 'skill');
            render(ctx);
          }
        }
      }
    }
  });

  PerCardRegistry.registerCard('BATTLE-SPIRITS-A12405', {
    name: 'The Silver Guardian Blade',
    cardType: 'Brave',
    triggers: {
      FLASH: function(ctx) {
        const { duelState } = ctx;
        if (!duelState.modifiers) duelState.modifiers = [];
        duelState.modifiers.push({
          type: 'END_ATTACK_STEP',
          source: 'The Silver Guardian Blade'
        });
        audio(ctx, 'magic');
        log(ctx, `⚔️ **[SILVER GUARDIAN BLADE: Flash Accel]**: Immediately ended Attack Step!`, 'magic');
        render(ctx);
      }
    }
  });

  PerCardRegistry.registerCard('BS67-083', {
    name: 'Beam Blast',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          const target = enemy.field[0];
          target.mustAttackNext = true;
          audio(ctx, 'magic');
          log(ctx, `💥 **[BEAM BLAST: Flash]**: Targeted ${target.name || 'opposing spirit'} to attack next!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('SD61-009', {
    name: 'Romancia Dream',
    cardType: 'Magic',
    triggers: {
      FLASH: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          const target = enemy.field.shift();
          if (!enemy.hand) enemy.hand = [];
          enemy.hand.push(target);
          audio(ctx, 'bounce');
          log(ctx, `💖 **[ROMANCIA DREAM: Flash]**: Returned ${target.name || 'opposing spirit'} to Hand!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  PerCardRegistry.registerCard('BS25-X06', {
    name: 'Ultimate-Grand-Woden',
    cardType: 'Ultimate',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const enemy = getEnemyState(ctx);
        if (enemy && enemy.field && enemy.field.length > 0) {
          const all = [...enemy.field];
          enemy.field = [];
          if (!enemy.deck) enemy.deck = [];
          for (const s of all) enemy.deck.push(s);
          audio(ctx, 'bounce');
          log(ctx, `⚔️ **[ULTIMATE-GRAND-WODEN: Ultimate Trigger]**: Bounced opposing spirits to deckbottom!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // TERRA DRAGON SUITE (BS22-X01, BS40-078, BS22-005, SD29-CP01)
  // ────────────────────────────────────────────────────────────

  // BS22-X01: The PrimitiveKing Gigano-Rex
  PerCardRegistry.registerCard('BS22-X01', {
    name: 'The PrimitiveKing Gigano-Rex',
    cardType: 'Spirit',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const { card, side, duelState } = ctx;
        const friendly = getFriendlyState(ctx);

        // 1. Clash: The opponent must block if possible
        card.hasClash = true;

        // 2. [Rush: Green] (While you have a Green symbol, the following effect activates next)
        // [Green Core]: Once per turn, refresh all "Terra Dragon" family Spirits you control.
        const symbols = (ctx.arenaApi && typeof ctx.arenaApi.getFriendlySymbols === 'function')
          ? ctx.arenaApi.getFriendlySymbols(side)
          : null;
        const hasGreenSymbol = (symbols && ((symbols.byColor && symbols.byColor.green > 0) || (symbols.rainbow > 0))) ||
          (friendly.field || []).some(s => (s.color || '').toLowerCase() === 'green' || (s.symbols && s.symbols.green > 0)) ||
          (friendly.nexus || []).some(n => (n.color || '').toLowerCase() === 'green' || (n.symbols && n.symbols.green > 0));

        if (hasGreenSymbol && !card._rushUsedThisTurn) {
          card._rushUsedThisTurn = true;
          const tdSpirits = (friendly.field || []).filter(s => isTerraDragon(s));
          for (const s of tdSpirits) {
            s.isExhausted = false;
          }
          audio(ctx, 'refresh');
          log(ctx, `🌲 **[GIGANO-REX: Rush (Green)]**: Verified Green symbol! Refreshed all ${tdSpirits.length} friendly Terra Dragon Spirit(s)!`, 'skill');
        }

        // 3. [Lv2] (When Attacks) For each "Terra Dragon" family Spirit you control, this Spirit gains +5000 BP.
        const curLvl = card.currentLevel || 1;
        if (curLvl >= 2) {
          const tdCount = (friendly.field || []).filter(s => isTerraDragon(s)).length;
          const bpBoost = tdCount * 5000;
          card.turnBpBoost = (card.turnBpBoost || 0) + bpBoost;
          recalcBp(ctx, card);
          audio(ctx, 'bpBoost');
          log(ctx, `🔥 **[GIGANO-REX: Lv2 When Attacks]**: Gained +${bpBoost} BP (+5000 per Terra Dragon, count: ${tdCount})!`, 'skill');
        }
        render(ctx);
      }
    }
  });

  // BS40-078: Dyna Power
  PerCardRegistry.registerCard('BS40-078', {
    name: 'Dyna Power',
    cardType: 'Magic',
    triggers: {
      MAIN: function(ctx) {
        // [Main] During this turn, all your "Terra Dragon" family Spirits gain +3000 BP, and can target and attack an opposing Spirit/Ultimate when they attack.
        const friendly = getFriendlyState(ctx);
        const tdSpirits = (friendly.field || []).filter(s => isTerraDragon(s));
        for (const s of tdSpirits) {
          s.turnBpBoost = (s.turnBpBoost || 0) + 3000;
          s.canTargetAttack = true;
          s.targetAttack = true;
          recalcBp(ctx, s);
        }
        audio(ctx, 'bpBoost');
        log(ctx, `🔥 **[DYNA POWER: Main]**: Granted +3000 BP and Target Attack to all ${tdSpirits.length} friendly Terra Dragon Spirit(s) this turn!`, 'magic');
        render(ctx);
      },
      FLASH: function(ctx) {
        // [Flash] During this turn, give a Spirit +3000 BP.
        const friendly = getFriendlyState(ctx);
        if (friendly.field && friendly.field.length > 0) {
          const target = friendly.field[0];
          target.turnBpBoost = (target.turnBpBoost || 0) + 3000;
          recalcBp(ctx, target);
          audio(ctx, 'bpBoost');
          log(ctx, `🔥 **[DYNA POWER: Flash]**: Granted +3000 BP to "${target.name}" this turn!`, 'magic');
          render(ctx);
        }
      },
      END_STEP: function(ctx) {
        // During (Your End Step), if you control any "Terra Dragon" family Spirit, return a [Dyna Power] from your Trash to the Hand.
        const friendly = getFriendlyState(ctx);
        const tdSpirits = (friendly.field || []).filter(s => isTerraDragon(s));
        if (tdSpirits.length > 0) {
          const trashCards = friendly.trashCards || [];
          const dynaIdx = trashCards.findIndex(c => (c.card_number === 'BS40-078' || c.cardNumber === 'BS40-078' || (c.name && c.name.toLowerCase().includes('dyna power'))));
          if (dynaIdx !== -1) {
            const [ret] = trashCards.splice(dynaIdx, 1);
            friendly.trash = Math.max(0, (friendly.trash || 1) - 1);
            if (!friendly.hand) friendly.hand = [];
            friendly.hand.push(ret);
            audio(ctx, 'drawCard');
            log(ctx, `🔥 **[DYNA POWER: End Step]**: Controlled Terra Dragon spirit! Returned [Dyna Power] from Trash to Hand!`, 'magic');
            render(ctx);
          }
        }
      }
    }
  });

  // BS22-005 / BATTLE-SPIRITS-A7121: Ovirapt
  PerCardRegistry.registerCard(['BS22-005', 'BATTLE-SPIRITS-A7121'], {
    name: 'Ovirapt',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        // [Lv1-Lv2] (When Summoned) During this turn, all "Terra Dragon" family Spirits you control gain +1000 BP.
        const friendly = getFriendlyState(ctx);
        const tdSpirits = (friendly.field || []).filter(s => isTerraDragon(s));
        for (const s of tdSpirits) {
          s.turnBpBoost = (s.turnBpBoost || 0) + 1000;
          recalcBp(ctx, s);
        }
        audio(ctx, 'bpBoost');
        log(ctx, `🦖 **[OVIRAPT: When Summoned]**: Granted +1000 BP to all ${tdSpirits.length} friendly Terra Dragon Spirit(s) this turn!`, 'skill');
        render(ctx);
      },
      WHEN_ATTACKS: function(ctx) {
        // [Lv1-Lv2] (When Attacks) When you have a Green symbol, this Spirit gains +2000 BP.
        const { card, side } = ctx;
        const friendly = getFriendlyState(ctx);
        const symbols = (ctx.arenaApi && typeof ctx.arenaApi.getFriendlySymbols === 'function')
          ? ctx.arenaApi.getFriendlySymbols(side)
          : null;
        const hasGreenSymbol = (symbols && ((symbols.byColor && symbols.byColor.green > 0) || (symbols.rainbow > 0))) ||
          (friendly.field || []).some(s => (s.color || '').toLowerCase() === 'green' || (s.symbols && s.symbols.green > 0)) ||
          (friendly.nexus || []).some(n => (n.color || '').toLowerCase() === 'green' || (n.symbols && n.symbols.green > 0));

        if (hasGreenSymbol) {
          card.turnBpBoost = (card.turnBpBoost || 0) + 2000;
          recalcBp(ctx, card);
          audio(ctx, 'bpBoost');
          log(ctx, `🦖 **[OVIRAPT: When Attacks]**: Green symbol verified! Gained +2000 BP (now ${card.currentBp || card.bp} BP)!`, 'skill');
          render(ctx);
        }
      }
    }
  });

  // SD29-CP01: Ashigaru Raptor
  PerCardRegistry.registerCard('SD29-CP01', {
    name: 'Ashigaru Raptor',
    cardType: 'Spirit',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const { card, side } = ctx;
        const friendly = getFriendlyState(ctx);

        // [Lv1-Lv2] (When Attacks) [Soul Core]: Draw 1 card from your deck.
        // Rule: Only triggers if the Soul Core is currently placed on this Spirit!
        const hasSoulCore = card.hasSoulCore === true ||
          (card.cores && card.cores.soul > 0) ||
          (friendly.soulCoreSpiritUid === card.uid && friendly.soulCoreLocation === 'field');

        if (hasSoulCore) {
          if (friendly.deck && friendly.deck.length > 0) {
            const drawn = friendly.deck.shift();
            if (!friendly.hand) friendly.hand = [];
            friendly.hand.push(drawn);
            audio(ctx, 'drawCard');
            log(ctx, `🦅 **[ASHIGARU RAPTOR: When Attacks]**: Soul Core verified! Drew "${drawn.name || 'card'}" from deck to hand.`, 'draw');
            render(ctx);
          }
        } else {
          log(ctx, `ℹ️ **[ASHIGARU RAPTOR: When Attacks]**: Soul Core is not placed on this Spirit. Draw ability requires Soul Core.`, 'info');
        }
      }
    }
  });

  console.log(`[standard_and_custom_decks] Registered ${PerCardRegistry.getAll().length} deterministic card handlers.`);
