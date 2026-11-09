/**
 * engine/cards/sets/soul_drive_cards.js
 * 
 * Deterministic Per-Card Explicit Implementations for:
 * All 21 Soul Drive Ultimates & Support Cards (Rule 8.4)
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

  // ═══════════════════════════════════════════════════════════════
  // SOUL DRIVE ULTIMATES & SUPPORT SUITE (ALL 21 CARDS)
  // ═══════════════════════════════════════════════════════════════

  // 1. The SengokuSixGeneral Mudou (BS33-X02)
  PerCardRegistry.registerCard('BS33-X02', {
    name: 'The SengokuSixGeneral Mudou',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        const level = card.currentLevel || 3;
        const coresToVoid = level * 2; // Lv3: 6 cores, Lv4: 8 cores
        let removed = 0;

        // Remove from opposing Spirits/Ultimates first
        const enemyUnits = enemyState.field || [];
        for (const unit of [...enemyUnits]) {
          if (removed >= coresToVoid) break;
          const available = unit.currentCores || unit.cores || 1;
          const take = Math.min(available, coresToVoid - removed);
          if (take > 0) {
            unit.currentCores = Math.max(0, (unit.currentCores || 1) - take);
            removed += take;
            if (unit.currentCores === 0) {
              const idx = enemyUnits.findIndex(u => u.uid === unit.uid);
              if (idx !== -1) {
                const dest = enemyUnits.splice(idx, 1)[0];
                if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
                  arenaApi.sendToTrash(dest, enemySide, 'Depleted to 0 cores by Mudou [Soul Drive]');
                } else {
                  if (!enemyState.trashCards) enemyState.trashCards = [];
                  enemyState.trashCards.push(dest);
                  enemyState.trash = (enemyState.trash || 0) + 1;
                }
              }
            }
          }
        }

        // Remove remaining quota from opposing Trash to Void
        if (removed < coresToVoid && enemyState.trash > 0) {
          const fromTrash = Math.min(enemyState.trash, coresToVoid - removed);
          enemyState.trash -= fromTrash;
          removed += fromTrash;
        }

        audio(ctx, 'dark');
        log(ctx, `💀 **[MUDOU: SOUL DRIVE]**: Banished ${removed} cores from opposing field/trash to the Void! (Lv${level}: Target was ${coresToVoid} cores)`, 'damage');
        render(ctx);
      }
    }
  });

  // 2. The WarParamountRoaringGeneral Mudou (BS74-AX01)
  PerCardRegistry.registerCard('BS74-AX01', {
    name: 'The WarParamountRoaringGeneral Mudou',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;

        // 1. Send two opposing Lives to the Void!
        const lifeToVoid = Math.min(2, enemyState.life || 0);
        enemyState.life -= lifeToVoid;
        enemyState.void = (enemyState.void || 0) + lifeToVoid;

        // 2. For each LV this Ultimate has, destroy an opposing Spirit/Ultimate (effects can't activate)
        const lv = card.currentLevel || 4;
        let destroyedCount = 0;
        const enemyUnits = enemyState.field || [];
        for (let i = 0; i < lv && enemyUnits.length > 0; i++) {
          const target = enemyUnits.shift();
          destroyedCount++;
          if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
            arenaApi.recycleSpiritCoresToReserve(target, enemySide);
          } else {
            enemyState.reserve = (enemyState.reserve || 0) + (target.currentCores || 0);
            target.currentCores = 0;
          }
          if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
            arenaApi.sendToTrash(target, enemySide, 'Destroyed by WarParamount Mudou (effects cannot activate)');
          } else {
            if (!enemyState.trashCards) enemyState.trashCards = [];
            enemyState.trashCards.push(target);
            enemyState.trash = (enemyState.trash || 0) + 1;
          }
        }

        audio(ctx, 'dark');
        log(ctx, `💀 **[WAR PARAMOUNT MUDOU: LIGHT-DARK SOUL DRIVE]**: Sent ${lifeToVoid} opposing Life to the Void and destroyed ${destroyedCount} opposing unit(s)!`, 'damage');
        render(ctx);
      }
    }
  });

  // 3. The Hellflame FourDemonLord Bram-Zand (SD36-X01 & BRAM-ZAND)
  const bramZandSoulDriveHandler = {
    name: 'The Hellflame FourDemonLord Bram-Zand',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;

        // Destroy every opposing Spirit
        let destroyedCount = 0;
        const enemyUnits = [...(enemyState.field || [])];
        enemyState.field = enemyUnits.filter(unit => {
          if (!unit.type || unit.type === 'Spirit') {
            destroyedCount++;
            if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
              arenaApi.recycleSpiritCoresToReserve(unit, enemySide);
            } else {
              enemyState.reserve = (enemyState.reserve || 0) + (unit.currentCores || 0);
              unit.currentCores = 0;
            }
            if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
              arenaApi.sendToTrash(unit, enemySide, `Destroyed by Bram-Zand [Soul Drive]`);
            } else {
              if (!enemyState.trashCards) enemyState.trashCards = [];
              enemyState.trashCards.push(unit);
              enemyState.trash = (enemyState.trash || 0) + 1;
            }
            return false;
          }
          return true;
        });

        // Opponent cannot summon Spirit cards until your next Start Step!
        duelState.opponentCantSummonSpiritsUntilNextStart = true;
        duelState.summonLockPlacedBy = side;

        // Banishes 2 Life to Void (legacy tactical compatibility)
        const lifeDamage = Math.min(2, enemyState.life || 0);
        enemyState.life = Math.max(0, (enemyState.life || 0) - lifeDamage);

        audio(ctx, 'destroy');
        log(ctx, `💥 **[BRAM-ZAND: SOUL DRIVE]**: Destroyed ${destroyedCount} opposing Spirit(s) and locked opponent from summoning Spirits until your next Start Step! (Banished ${lifeDamage} Life to Void)`, 'damage');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('SD36-X01', bramZandSoulDriveHandler);
  PerCardRegistry.registerCard('BRAM-ZAND', bramZandSoulDriveHandler);

  // 4. The Hellflame Duke Bram-Zand-Noir (P16-21)
  PerCardRegistry.registerCard('P16-21', {
    name: 'The Hellflame Duke Bram-Zand-Noir',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        let coresSent = 0;

        // Send two cores each from every opposing Spirit/Nexus to Trash
        const enemyUnits = [...(enemyState.field || [])];
        enemyState.field = enemyUnits.filter(unit => {
          const take = Math.min(2, unit.currentCores || 1);
          unit.currentCores = Math.max(0, (unit.currentCores || 1) - take);
          enemyState.trash = (enemyState.trash || 0) + take;
          coresSent += take;
          if (unit.currentCores === 0) {
            if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
              arenaApi.sendToTrash(unit, enemySide, 'Depleted to 0 cores by Bram-Zand-Noir [Soul Drive]');
            } else {
              if (!enemyState.trashCards) enemyState.trashCards = [];
              enemyState.trashCards.push(unit);
            }
            return false;
          }
          return true;
        });

        // Nexuses
        for (const n of (enemyState.nexus || [])) {
          const take = Math.min(2, n.currentCores || 0);
          n.currentCores = Math.max(0, (n.currentCores || 0) - take);
          enemyState.trash = (enemyState.trash || 0) + take;
          coresSent += take;
        }

        // Opponent cannot return cores from Trash to Reserve on next Refresh Step
        enemyState.preventRefreshTrashCores = true;

        audio(ctx, 'destroy');
        log(ctx, `🔥 **[BRAM-ZAND-NOIR: SOUL DRIVE]**: Sent ${coresSent} core(s) from opposing field to Trash! Opponent cannot return cores from Trash to Reserve on their next Refresh Step.`, 'damage');
        render(ctx);
      }
    }
  });

  // 5. The SengokuSixGeneral Senryuukaku (BS33-X04)
  PerCardRegistry.registerCard('BS33-X04', {
    name: 'The SengokuSixGeneral Senryuukaku',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        const enemyUnits = [...(enemyState.field || [])];
        const bouncedUnits = [];

        enemyState.field = enemyUnits.filter(unit => {
          if (unit.type === 'Spirit' || unit.type === 'Ultimate') {
            if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
              arenaApi.recycleSpiritCoresToReserve(unit, enemySide);
            } else {
              enemyState.reserve = (enemyState.reserve || 0) + (unit.currentCores || 0);
              unit.currentCores = 0;
            }
            bouncedUnits.push(unit);
            return false;
          }
          return true;
        });

        if (!enemyState.deck) enemyState.deck = [];
        enemyState.deck = [...bouncedUnits, ...enemyState.deck];

        audio(ctx, 'bounce');
        log(ctx, `🌪️ **[SENRYUUKAKU: SOUL DRIVE]**: Returned all opposing Spirits and Ultimates (${bouncedUnits.length} unit(s)) to the top of the deck!`, 'step');
        render(ctx);
      }
    }
  });

  // 6. Senryuukaku-Kagetora (P15-21)
  PerCardRegistry.registerCard('P15-21', {
    name: 'Senryuukaku-Kagetora',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;

        const enemyUnits = enemyState.field || [];
        const targetIdx = enemyUnits.findIndex(u => (u.type === 'Spirit' || u.type === 'Ultimate') && (u.cost || 0) <= 5);
        let bouncedName = null;
        if (targetIdx !== -1) {
          const bounced = enemyUnits.splice(targetIdx, 1)[0];
          bouncedName = bounced.name;
          if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
            arenaApi.recycleSpiritCoresToReserve(bounced, enemySide);
          } else {
            enemyState.reserve = (enemyState.reserve || 0) + (bounced.currentCores || 0);
            bounced.currentCores = 0;
          }
          if (!enemyState.hand) enemyState.hand = [];
          enemyState.hand.push(bounced);
        }

        card.cantBeBlocked = true;
        card.unblockable = true;

        audio(ctx, 'bounce');
        const bounceMsg = bouncedName ? `Returned "${bouncedName}" to opponent's Hand, and this` : 'This';
        log(ctx, `🌪️ **[KAGETORA: SOUL DRIVE]**: ${bounceMsg} Ultimate cannot be blocked for this battle!`, 'buff');
        render(ctx);
      }
    }
  });

  // 7. The SengokuSixGeneral Tensei (BS33-029)
  PerCardRegistry.registerCard('BS33-029', {
    name: 'The SengokuSixGeneral Tensei',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        const friendlyUnits = friendlyState.field || [];

        // Count total cores currently in Reserve and on friendly Spirits/Ultimates
        const fieldCores = friendlyUnits.reduce((sum, u) => sum + (u.currentCores || 0), 0);
        const reserveCores = friendlyState.reserve || 0;
        const totalCores = fieldCores + reserveCores;

        if (totalCores > 0 && friendlyUnits.length > 0) {
          // Put totalCores from the Void to Spirits/Ultimates in any way you like
          // First, empower Tensei to reach max level (Lv5: 5 cores)
          let remaining = totalCores;
          if (card && friendlyUnits.some(u => u.uid === card.uid)) {
            const neededForMax = Math.max(0, 5 - (card.currentCores || 0));
            const giveActive = Math.min(neededForMax, remaining);
            card.currentCores = (card.currentCores || 0) + giveActive;
            remaining -= giveActive;
          }

          // Distribute remaining cores evenly among other friendly Spirits/Ultimates
          if (remaining > 0) {
            const others = friendlyUnits.filter(u => !card || u.uid !== card.uid);
            const recipients = others.length > 0 ? others : friendlyUnits;
            const perUnit = Math.floor(remaining / recipients.length);
            let rem = remaining % recipients.length;
            recipients.forEach((u, i) => {
              u.currentCores = (u.currentCores || 0) + perUnit + (i < rem ? 1 : 0);
            });
          }

          // Recalculate BP for all units on friendly field
          for (const u of friendlyUnits) {
            if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
              arenaApi.recalculateSpiritBp(u);
            }
          }
        }

        audio(ctx, 'coreChime');
        log(ctx, `🌿 **[TENSEI: SOUL DRIVE]**: Claimed ${totalCores} core(s) from the Void (equal to ${fieldCores} on Spirits/Ultimates + ${reserveCores} in Reserve) and distributed them across your Spirits/Ultimates!`, 'magic');
        render(ctx);
      }
    }
  });

  // 8. The SengokuSixGeneral Bakelkatze (BS33-049)
  PerCardRegistry.registerCard('BS33-049', {
    name: 'The SengokuSixGeneral Bakelkatze',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;

        // 1. Put cores from Void to Life until Life is 6
        const currentLife = friendlyState.life || 0;
        let gainedLife = 0;
        if (currentLife < 6) {
          gainedLife = 6 - currentLife;
          friendlyState.life = 6;
        }

        // 2. Free summon Cost 6 or less Yellow Spirit/Ultimate from Hand
        let summonedName = null;
        if (friendlyState.hand && friendlyState.hand.length > 0) {
          const eligibleIdx = friendlyState.hand.findIndex(c => {
            const cost = c.cost !== undefined ? c.cost : 99;
            const isYellow = c.color === 'Yellow' || (c.colors && c.colors.includes('Yellow'));
            const isUnit = c.type === 'Spirit' || c.type === 'Ultimate';
            return isUnit && isYellow && cost <= 6;
          });
          if (eligibleIdx !== -1) {
            const summonedCard = friendlyState.hand.splice(eligibleIdx, 1)[0];
            summonedCard.currentCores = 1;
            if (!friendlyState.field) friendlyState.field = [];
            friendlyState.field.push(summonedCard);
            summonedName = summonedCard.name;
            if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
              arenaApi.recalculateSpiritBp(summonedCard);
            }
          }
        }

        audio(ctx, 'magic');
        const summonMsg = summonedName ? ` and summoned "${summonedName}" without paying cost` : '';
        log(ctx, `🛡️ **[BAKELKATZE: SOUL DRIVE]**: Put ${gainedLife} core(s) from the Void into Life (Life is now ${friendlyState.life})${summonMsg}!`, 'magic');
        render(ctx);
      }
    }
  });

  // 9. The SengokuSixGeneral LeonLancer (BS34-CP07)
  PerCardRegistry.registerCard('BS34-CP07', {
    name: 'The SengokuSixGeneral LeonLancer',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        const enemyUnits = [...(enemyState.field || [])];
        const destroyed = [];

        enemyState.field = enemyUnits.filter(unit => {
          const bp = unit.battleBp || unit.currentBp || 0;
          if ((unit.type === 'Spirit' || unit.type === 'Ultimate') && bp <= 20000) {
            destroyed.push(unit);
            if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
              arenaApi.recycleSpiritCoresToReserve(unit, enemySide);
            } else {
              enemyState.reserve = (enemyState.reserve || 0) + (unit.currentCores || 0);
              unit.currentCores = 0;
            }
            if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
              arenaApi.sendToTrash(unit, enemySide, 'Destroyed by LeonLancer [Soul Drive] (<=20000 BP)');
            } else {
              if (!enemyState.trashCards) enemyState.trashCards = [];
              enemyState.trashCards.push(unit);
              enemyState.trash = (enemyState.trash || 0) + 1;
            }
            return false;
          }
          return true;
        });

        audio(ctx, 'destroy');
        log(ctx, `⚔️ **[LEONLANCER: SOUL DRIVE]**: Destroyed every opposing Spirit/Ultimate with 20000 BP or less (${destroyed.length} destroyed)!`, 'step');
        render(ctx);
      }
    }
  });

  // 10. The SengokuSixGeneral LeonLancer X (BS74-X12)
  PerCardRegistry.registerCard('BS74-X12', {
    name: 'The SengokuSixGeneral LeonLancer X',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        const enemyUnits = [...(enemyState.field || [])];
        const destroyed = [];

        enemyState.field = enemyUnits.filter(unit => {
          if (unit.type === 'Spirit' || unit.type === 'Ultimate') {
            destroyed.push(unit);
            if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
              arenaApi.recycleSpiritCoresToReserve(unit, enemySide);
            } else {
              enemyState.reserve = (enemyState.reserve || 0) + (unit.currentCores || 0);
              unit.currentCores = 0;
            }
            if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
              arenaApi.sendToTrash(unit, enemySide, 'Destroyed by LeonLancer X [Soul Drive]');
            } else {
              if (!enemyState.trashCards) enemyState.trashCards = [];
              enemyState.trashCards.push(unit);
              enemyState.trash = (enemyState.trash || 0) + 1;
            }
            return false;
          }
          return true;
        });

        const isAttackStep = (duelState.phases && duelState.phases[duelState.phaseIndex] === 'ATTACK') || duelState.phase === 'ATTACK';
        let lifeDamage = 0;
        if (isAttackStep && destroyed.length > 0) {
          lifeDamage = Math.min(3, destroyed.length, enemyState.life || 0);
          enemyState.life -= lifeDamage;
          enemyState.reserve = (enemyState.reserve || 0) + lifeDamage;
        }

        audio(ctx, 'destroy');
        const lifeMsg = lifeDamage > 0 ? ` and sent ${lifeDamage} opposing Life to Reserve` : '';
        log(ctx, `⚔️ **[LEONLANCER X: SOUL DRIVE]**: Destroyed every opposing Spirit/Ultimate (${destroyed.length} destroyed)${lifeMsg}!`, 'step');
        render(ctx);
      }
    }
  });

  // 11. The SengokuSixGeneral Tidal-Blue (BS33-X06 & BATTLE-SPIRITS-A12187)
  const tidalBlueSoulDriveHandler = {
    name: 'The SengokuSixGeneral Tidal-Blue',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;

        // 1. Destroy opposing Cost 7 or less Spirit (or Ultimate if Lv4)
        const isLv4 = (card && (card.currentLevel || 3) >= 4);
        const enemyUnits = enemyState.field || [];
        const targetIdx = enemyUnits.findIndex(u => {
          const cost = u.cost || 0;
          if (cost > 7) return false;
          if (u.type === 'Spirit') return true;
          if (isLv4 && u.type === 'Ultimate') return true;
          return false;
        });

        let destroyedName = null;
        if (targetIdx !== -1) {
          const dest = enemyUnits.splice(targetIdx, 1)[0];
          destroyedName = dest.name;
          if (arenaApi && typeof arenaApi.recycleSpiritCoresToReserve === 'function') {
            arenaApi.recycleSpiritCoresToReserve(dest, enemySide);
          } else {
            enemyState.reserve = (enemyState.reserve || 0) + (dest.currentCores || 0);
            dest.currentCores = 0;
          }
          if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
            arenaApi.sendToTrash(dest, enemySide, 'Destroyed by Tidal-Blue [When Attacks]');
          }
        }

        // 2. Opposing Refresh Step and Opposing Main Step do NOT occur on opponent's next turn!
        enemyState.skipNextRefreshAndMain = true;

        audio(ctx, 'magic');
        const destMsg = destroyedName ? `Destroyed "${destroyedName}". ` : '';
        log(ctx, `🌊 **[TIDAL-BLUE: SOUL DRIVE]**: ${destMsg}Opponent's Refresh Step and Main Step will NOT occur on their next turn!`, 'damage');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('BS33-X06', tidalBlueSoulDriveHandler);
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A12187', tidalBlueSoulDriveHandler);

  // 12. The Hellsea FourDemonLord Ill-Immersio (SD36-X04 & IL-IMARJO)
  const illImmersioSoulDriveHandler = {
    name: 'The Hellsea FourDemonLord Ill-Immersio',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        let activatedBursts = 0;

        if (friendlyState.hand && friendlyState.hand.length > 0) {
          const burstCards = friendlyState.hand.filter(c => c.burst || /\[burst/i.test(c.effect || ''));
          for (const bCard of burstCards) {
            const idx = friendlyState.hand.findIndex(c => c.uid === bCard.uid);
            if (idx !== -1) {
              friendlyState.hand.splice(idx, 1);
              activatedBursts++;
              if (bCard.type === 'Spirit' || bCard.type === 'Ultimate') {
                bCard.currentCores = 1;
                if (!friendlyState.field) friendlyState.field = [];
                friendlyState.field.push(bCard);
                if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
                  arenaApi.recalculateSpiritBp(bCard);
                }
              } else {
                if (!friendlyState.trashCards) friendlyState.trashCards = [];
                friendlyState.trashCards.push(bCard);
                friendlyState.trash = (friendlyState.trash || 0) + 1;
              }
            }
          }
        }

        audio(ctx, 'burstIgnite');
        log(ctx, `🌊 **[ILL-IMMERSIO: SOUL DRIVE]**: Activated Burst effect of ${activatedBursts} card(s) from Hand, ignoring conditions!`, 'damage');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('SD36-X04', illImmersioSoulDriveHandler);
  PerCardRegistry.registerCard('IL-IMARJO', illImmersioSoulDriveHandler);

  // 13. The Hellwind FourDemonLord Vandiel (SD36-X02 & BATTLE-SPIRITS-A10766)
  const vandielSoulDriveHandler = {
    name: 'The Hellwind FourDemonLord Vandiel',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        const summonedUltimates = [];
        const discarded = [];

        if (friendlyState.deck && friendlyState.deck.length > 0) {
          while (friendlyState.deck.length > 0 && summonedUltimates.length < 3) {
            const card = friendlyState.deck.shift();
            if (card.type === 'Ultimate' || (card.card_type && card.card_type.includes('Ultimate'))) {
              summonedUltimates.push(card);
            } else {
              discarded.push(card);
            }
          }

          // Summon revealed Ultimates without paying cost ignoring summon conditions
          if (!friendlyState.field) friendlyState.field = [];
          for (const ult of summonedUltimates) {
            ult.currentCores = 1;
            friendlyState.field.push(ult);
            if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
              arenaApi.recalculateSpiritBp(ult);
            }
          }

          // Discard remainder to trash
          if (!friendlyState.trashCards) friendlyState.trashCards = [];
          for (const d of discarded) {
            friendlyState.trashCards.push(d);
          }
          friendlyState.trash = (friendlyState.trash || 0) + discarded.length;
        }

        audio(ctx, 'summon');
        const names = summonedUltimates.map(u => u.name).join(', ') || 'None';
        log(ctx, `🌪️ **[VANDIEL: SOUL DRIVE]**: Revealed decktop, summoned ${summonedUltimates.length} Ultimate(s) (${names}) without paying cost ignoring summon conditions, and discarded ${discarded.length} card(s)!`, 'magic');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('SD36-X02', vandielSoulDriveHandler);
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A10766', vandielSoulDriveHandler);

  // 14. The SengokuDragonGod Tenkafubu (BS34-XX01 & BATTLE-SPIRITS-A12227)
  const tenkafubuSoulDriveHandler = {
    name: 'The SengokuDragonGod Tenkafubu',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        const colors = ['Red', 'Yellow', 'White', 'Green', 'Purple', 'Blue'];
        const triggeredColors = [];

        for (const col of colors) {
          const ally = (friendlyState.field || []).find(u => {
            if (!u || u.uid === (card && card.uid)) return false;
            if (u.type !== 'Ultimate') return false;
            const matchCol = u.color === col || (u.colors && u.colors.includes(col));
            return matchCol;
          });
          if (ally) {
            const pRegistry = (typeof window !== 'undefined' && window.PerCardRegistry) || (typeof globalThis !== 'undefined' && globalThis.PerCardRegistry);
            const cNum = ally.card_number || ally.cardNumber || ally.id;
            if (pRegistry && cNum && pRegistry.has(cNum, 'SOUL_DRIVE')) {
              pRegistry.execute(cNum, 'SOUL_DRIVE', {
                card: ally,
                sourceCard: ally,
                side,
                duelState,
                arenaApi
              });
              triggeredColors.push(col);
            }
          }
        }

        audio(ctx, 'slash');
        log(ctx, `🔥 **[TENKAFUBU: SOUL DRIVE]**: Activated the Soul Drive of allied Ultimates across ${triggeredColors.length} color(s) (${triggeredColors.join(', ')})!`, 'warning');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('BS34-XX01', tenkafubuSoulDriveHandler);
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A12227', tenkafubuSoulDriveHandler);

  // 15. The SengokuSnakeGeneral Ultimate-Asklepiooze (BS46-10THX03)
  PerCardRegistry.registerCard('BS46-10THX03', {
    name: 'The SengokuSnakeGeneral Ultimate-Asklepiooze',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        let totalSent = 0;
        const enemyUnits = [...(enemyState.field || [])];

        enemyState.field = enemyUnits.filter(unit => {
          if (unit.type === 'Spirit') {
            const take = Math.min(3, unit.currentCores || 1);
            unit.currentCores = Math.max(0, (unit.currentCores || 1) - take);
            totalSent += take;
            if (unit.currentCores === 0) {
              if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
                arenaApi.sendToTrash(unit, enemySide, 'Depleted to 0 cores by Asklepiooze [Soul Drive]');
              } else {
                if (!enemyState.trashCards) enemyState.trashCards = [];
                enemyState.trashCards.push(unit);
                enemyState.trash = (enemyState.trash || 0) + 1;
              }
              return false;
            }
          }
          return true;
        });

        audio(ctx, 'destroy');
        log(ctx, `🐍 **[ASKLEPIOOZE: SOUL DRIVE]**: Sent 3 cores each from all opposing Spirits to the Void (${totalSent} total cores sent to Void)!`, 'damage');
        render(ctx);
      }
    }
  });

  // 16. The HellsoilSorcerer Denial (BS38-051)
  PerCardRegistry.registerCard('BS38-051', {
    name: 'The HellsoilSorcerer Denial',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const enemySide = side === 'player' ? 'opponent' : 'player';
        const enemyState = side === 'player' ? duelState.opponent : duelState.player;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        let coresMoved = 0;

        const enemyUnits = enemyState.field || [];
        if (enemyUnits.length > 0) {
          enemyUnits.sort((a, b) => (b.currentCores || 0) - (a.currentCores || 0));
          const target = enemyUnits.shift();
          coresMoved = target.currentCores || 1;
          target.currentCores = 0;
          enemyState.reserve = (enemyState.reserve || 0) + coresMoved;
          if (arenaApi && typeof arenaApi.sendToTrash === 'function') {
            arenaApi.sendToTrash(target, enemySide, 'Depleted of all cores by Denial [Soul Drive]');
          } else {
            if (!enemyState.trashCards) enemyState.trashCards = [];
            enemyState.trashCards.push(target);
            enemyState.trash = (enemyState.trash || 0) + 1;
          }
        }

        // For each core sent, summon 1 Purple Spirit card from Trash without paying cost
        let summonedCount = 0;
        if (coresMoved > 0 && friendlyState.trashCards && friendlyState.trashCards.length > 0) {
          for (let i = 0; i < coresMoved; i++) {
            const pIdx = friendlyState.trashCards.findIndex(c => {
              const isPurple = c.color === 'Purple' || (c.colors && c.colors.includes('Purple'));
              return c.type === 'Spirit' && isPurple;
            });
            if (pIdx === -1) break;
            const pSpirit = friendlyState.trashCards.splice(pIdx, 1)[0];
            pSpirit.currentCores = 1;
            if (!friendlyState.field) friendlyState.field = [];
            friendlyState.field.push(pSpirit);
            summonedCount++;
            if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
              arenaApi.recalculateSpiritBp(pSpirit);
            }
          }
          friendlyState.trash = Math.max(0, (friendlyState.trash || 0) - summonedCount);
        }

        audio(ctx, 'magic');
        log(ctx, `💀 **[DENIAL: SOUL DRIVE]**: Sent ${coresMoved} core(s) from opposing unit to Reserve and summoned ${summonedCount} Purple Spirit(s) from Trash without paying cost!`, 'magic');
        render(ctx);
      }
    }
  });

  // 17. The DarkKnight Dusk Dragon (BATTLE-SPIRITS-A9226 & BS33-018 & BS33-066)
  const duskDragonSoulDriveHandler = {
    name: 'The DarkKnight Dusk Dragon',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        let refreshedCount = 0;
        for (const u of (friendlyState.field || [])) {
          if (u.type === 'Ultimate' && u.isExhausted) {
            u.isExhausted = false;
            refreshedCount++;
          }
        }
        audio(ctx, 'refresh');
        log(ctx, `⚔️ **[DUSK DRAGON: SOUL DRIVE]**: Refreshed ${refreshedCount} friendly Ultimate(s)!`, 'step');
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A9226', duskDragonSoulDriveHandler);
  PerCardRegistry.registerCard('BS33-018', duskDragonSoulDriveHandler);
  PerCardRegistry.registerCard('BS33-066', duskDragonSoulDriveHandler);

  // 18. Unmasked Antarc (P15-15)
  PerCardRegistry.registerCard('P15-15', {
    name: 'Unmasked Antarc',
    cardType: 'Ultimate',
    triggers: {
      SOUL_DRIVE: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        let summoned = 0;
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          const countToReveal = Math.min(20, friendlyState.deck.length);
          const revealed = friendlyState.deck.splice(0, countToReveal);
          for (const c of revealed) {
            const fam = Array.isArray(c.family) ? c.family.join(' ') : (c.family || '');
            if (c.type === 'Spirit' && /Investigator/i.test(fam)) {
              c.currentCores = 1;
              if (!friendlyState.field) friendlyState.field = [];
              friendlyState.field.push(c);
              summoned++;
              if (arenaApi && typeof arenaApi.recalculateSpiritBp === 'function') {
                arenaApi.recalculateSpiritBp(c);
              }
            } else {
              if (!friendlyState.trashCards) friendlyState.trashCards = [];
              friendlyState.trashCards.push(c);
              friendlyState.trash = (friendlyState.trash || 0) + 1;
            }
          }
        }
        audio(ctx, 'summon');
        log(ctx, `🕵️ **[ANTARC: SOUL DRIVE]**: Revealed top 20 cards and summoned ${summoned} Investigator Spirit(s) without paying cost!`, 'step');
        render(ctx);
      }
    }
  });

  // 19. The HellflameCount Deffert (BATTLE-SPIRITS-A10745 & SD36-003)
  const deffertHandler = {
    name: 'The HellflameCount Deffert',
    cardType: 'Spirit',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        if (friendlyState.soulCoreLocation === 'void' || friendlyState.soulDriveUsed) {
          const bramZand = (friendlyState.field || []).find(u =>
            (u.card_number === 'SD36-X01' || u.card_number === 'BRAM-ZAND' || (u.name || '').includes('Bram-Zand'))
          );
          if (bramZand) {
            const pRegistry = (typeof window !== 'undefined' && window.PerCardRegistry) || (typeof globalThis !== 'undefined' && globalThis.PerCardRegistry);
            const cNum = bramZand.card_number || bramZand.id || 'BRAM-ZAND';
            if (pRegistry && pRegistry.has(cNum, 'SOUL_DRIVE')) {
              pRegistry.execute(cNum, 'SOUL_DRIVE', {
                card: bramZand,
                sourceCard: bramZand,
                side,
                duelState,
                arenaApi
              });
              log(ctx, `🔥 **[DEFFERT: WHEN SUMMONED]**: Soul Core is banished! Activated Soul Drive of "${bramZand.name}"!`, 'warning');
            }
          }
        }
        render(ctx);
      }
    }
  };
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A10745', deffertHandler);
  PerCardRegistry.registerCard('SD36-003', deffertHandler);

  // 20. Taiga Kazuya (BATTLE-SPIRITS-A8150)
  PerCardRegistry.registerCard('BATTLE-SPIRITS-A8150', {
    name: 'Taiga Kazuya',
    cardType: 'Nexus',
    triggers: {
      LV2_SOUL_DRIVE_PROXY: function(ctx) {
        // [Lv2] When an allied "Evil God" Ultimate attacks, you may send all cores on this Nexus to the Void to activate its Soul Drive.
        const { card, side, duelState } = ctx;
        const sentCores = card.currentCores || 0;
        card.currentCores = 0;
        audio(ctx, 'soulCoreIgnite');
        log(ctx, `🏛️ **[TAIGA KAZUYA (LV2)]**: Sent all ${sentCores} core(s) on Taiga Kazuya to the Void to activate Soul Drive without banishing Soul Core!`, 'warning');
      }
    }
  });

  // 21. The Messenger Genet (BS33-021)
  PerCardRegistry.registerCard('BS33-021', {
    name: 'The Messenger Genet',
    cardType: 'Spirit',
    triggers: {
      ON_SOUL_DRIVE_RESOLVED: function(ctx) {
        // [Lv2] When your [Soul Drive] activates and resolves, put 3 cores from the Void to your Reserve.
        const { side, duelState } = ctx;
        const friendlyState = side === 'player' ? duelState.player : duelState.opponent;
        friendlyState.reserve = (friendlyState.reserve || 0) + 3;
        audio(ctx, 'coreChime');
        log(ctx, `🌿 **[The Messenger Genet (LV2)]**: Put 3 cores from Void to Reserve after Soul Drive resolved!`, 'magic');
      }
    }
  });

  console.log(`[soul_drive_cards] Registered ${PerCardRegistry.getAll().length} deterministic card handlers.`);
