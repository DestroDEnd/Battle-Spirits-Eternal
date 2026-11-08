/**
 * engine/cards/sets/sd65_four_demon_lords.js
 * 
 * Deterministic Per-Card Explicit Implementations for:
 * Mega Deck: Four Demon Lords / Evil God Archetype (SD65 + BS64 + SD36 staples)
 * Strictly keyed by canonical card_number.
 */

import { PerCardRegistry } from '../registry.js';

  // Helper utility functions for card scripts
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

  function getCard(ctx) {
    return ctx.card || ctx.sourceCard || ctx.attacker || {};
  }

  // ────────────────────────────────────────────────────────────
  // 1. SD65-X01: The Hellflame FourDemonLord Bram-Zahfag
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-X01', {
    name: 'The Hellflame FourDemonLord Bram-Zahfag',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const enemySide = getEnemySide(ctx);
        const enemyState = getEnemyState(ctx);
        const friendlyState = getFriendlyState(ctx);

        // [LV3][LV4][LV5] Destroy every opposing Spirit!
        const enemySpirits = (enemyState.field || []).filter(s =>
          s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit'))
        );

        if (enemySpirits.length > 0) {
          for (const sp of [...enemySpirits]) {
            const idx = enemyState.field.findIndex(s => s.uid === sp.uid);
            if (idx !== -1) {
              const destroyed = enemyState.field.splice(idx, 1)[0];
              handleDestroyedCores(ctx, destroyed, enemySide);
              sendToTrash(ctx, destroyed, enemySide, 'Destroyed by Bram-Zahfag (When Summoned)');
            }
          }
          audio(ctx, 'destroy');
          log(ctx, `🔥 **[BRAM-ZAHFAG: When Summoned]**: Hellflame catastrophe destroyed all ${enemySpirits.length} opposing Spirit(s)!`, 'kill');
          if (arenaApi && typeof arenaApi.showToast === 'function') {
            arenaApi.showToast(`🔥 Bram-Zahfag wiped ${enemySpirits.length} opposing Spirit(s)!`, 'danger');
          }
        } else {
          log(ctx, `ℹ️ **[BRAM-ZAHFAG: When Summoned]**: Opponent controls no Spirits to destroy.`, 'info');
        }

        render(ctx);

        // Then, (Once per Game: Same Name) by sending 1 Life to Void -> Opponent cannot summon Spirit cards until your next Start Step!
        const alreadyUsed = !!friendlyState.usedBramZahfagOncePerGame;
        if (!alreadyUsed && friendlyState.life >= 1) {
          const executeLock = () => {
            friendlyState.life = Math.max(0, friendlyState.life - 1);
            friendlyState.usedBramZahfagOncePerGame = true;
            duelState.spiritSummonLock = {
              lockedSide: enemySide,
              untilStartStepOf: side
            };
            duelState[enemySide + 'CantSummonSpirits'] = true;
            audio(ctx, 'lifeDamage');
            log(ctx, `🔥 **[BRAM-ZAHFAG ONCE PER GAME]**: Sent 1 Life to the Void! Opponent cannot summon Spirit cards until your next Start Step!`, 'kill');
            if (arenaApi && typeof arenaApi.showToast === 'function') {
              arenaApi.showToast(`🔥 Bram-Zahfag locked opposing Spirit summons until your next turn!`, 'warning');
            }
            render(ctx);
          };

          if (side === 'player' && arenaApi && typeof arenaApi.askOptionalEffect === 'function') {
            arenaApi.askOptionalEffect(
              card,
              "Activate Bram-Zahfag Once per Game effect? Send 1 of your Lives to the Void to prevent opponent from summoning Spirit cards until your next Start Step?",
              executeLock,
              () => {
                log(ctx, `ℹ️ **[Bram-Zahfag]**: Declined Once-per-Game Life sacrifice summon lock.`, 'info');
              }
            );
          } else if (side === 'opponent') {
            // Opponent AI uses it if life >= 2
            if (friendlyState.life >= 2) {
              executeLock();
            }
          }
        }
      },

      CONTINUOUS: function(ctx) {
        // [LV4][LV5] While your "Evil God" family Ultimate is attacking, the opponent cannot end the Attack Step via effects
        const { card, side, duelState } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel >= 4) {
          const attacker = duelState.combatAttacker;
          if (attacker && (attacker.type === 'Ultimate' || (attacker.type || '').includes('Ultimate'))) {
            const fam = ((attacker.family || '') + ' ' + (attacker.families ? attacker.families.join(' ') : '')).toLowerCase();
            if (fam.includes('evil god')) {
              duelState.opponentCannotEndAttackStep = true;
            }
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 2. SD65-X03: The Hellwind FourDemonLord Van-Tous
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-X03', {
    name: 'The Hellwind FourDemonLord Van-Tous',
    cardType: 'Ultimate',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const { card, side, duelState, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const friendlyState = getFriendlyState(ctx);
        const enemySide = getEnemySide(ctx);

        // [LV3][LV4][LV5] (When Attacks):
        // By returning a card from Hand to decktop -> put 2 cores from Void to any of your Ultimates -> Opponent cannot activate Burst effects during this turn!
        if (friendlyState.hand && friendlyState.hand.length > 0) {
          const resolveVanTousBuff = (returnedCard) => {
            const hIdx = friendlyState.hand.findIndex(h => h.uid === returnedCard.uid);
            if (hIdx !== -1) {
              friendlyState.hand.splice(hIdx, 1);
              if (!friendlyState.deck) friendlyState.deck = [];
              friendlyState.deck.unshift(returnedCard);
            }

            // Put 2 cores from Void to any Ultimate (defaults to Van-Tous or chosen Ultimate)
            const friendlyUlts = (friendlyState.field || []).filter(s =>
              s.type === 'Ultimate' || (s.type || '').includes('Ultimate')
            );
            const targetUlt = friendlyUlts.find(u => u.uid === card.uid) || friendlyUlts[0] || card;
            targetUlt.currentCores = (targetUlt.currentCores || 0) + 2;
            recalcBp(ctx, targetUlt);

            // Turn-wide Burst Lock
            duelState.burstLockThisTurn = enemySide;
            audio(ctx, 'coreChime');
            log(ctx, `🌪️ **[VAN-TOUS: When Attacks]**: Returned "${returnedCard.name}" to decktop! Placed 2 cores from Void onto "${targetUlt.name}" and locked opponent from activating Burst effects during this turn!`, 'magic');
            if (arenaApi && typeof arenaApi.showToast === 'function') {
              arenaApi.showToast(`🌪️ Van-Tous locked opposing Bursts for the turn! (+2 cores from Void)`, 'success');
            }
            render(ctx);

            // Check LV4-5 ability after resolving LV3-5
            checkVanTousLv4(ctx);
          };

          if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
            arenaApi.promptUniversalTargetModal({
              card,
              side: 'player',
              targetSide: 'player',
              targetKind: 'card',
              customPool: friendlyState.hand,
              title: 'Van-Tous: Return Card to Decktop',
              description: 'Select 1 card from your Hand to return to the decktop for +2 Void Cores & Burst Lock:',
              minCount: 1,
              maxCount: 1,
              allowSkip: true
            }, (selectedCards) => {
              if (selectedCards && selectedCards.length > 0) {
                resolveVanTousBuff(selectedCards[0]);
              } else {
                log(ctx, `ℹ️ **[Van-Tous]**: Skipped Hand-to-decktop Burst lock effect.`, 'info');
                checkVanTousLv4(ctx);
              }
            });
            return;
          } else {
            // AI returns first card in hand
            const returnedCard = friendlyState.hand[0];
            resolveVanTousBuff(returnedCard);
            return;
          }
        } else {
          log(ctx, `ℹ️ **[Van-Tous]**: Hand is empty; cannot return card to decktop for Burst lock.`, 'info');
          checkVanTousLv4(ctx);
        }
      }
    }
  });

  function checkVanTousLv4(ctx) {
    const { card, side, duelState, arenaApi } = ctx;
    const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
    if (curLevel < 4) return;

    const friendlyState = getFriendlyState(ctx);
    // (Once per Turn: Same Name) Besides [Soul Core], by sending 1 core from Trash to Void, reveal cards up to Count
    if (friendlyState.usedVanTousLv4ThisTurn) return;
    if ((friendlyState.trash || 0) < 1) return;

    const executeLv4 = () => {
      friendlyState.usedVanTousLv4ThisTurn = true;
      friendlyState.trash = Math.max(0, friendlyState.trash - 1); // 1 core to Void
      const counterCount = friendlyState.counters || 0;
      const revealCount = Math.min(counterCount, friendlyState.deck.length);

      if (revealCount <= 0) {
        log(ctx, `ℹ️ **[Van-Tous LV4]**: Count is ${counterCount} or deck empty; no cards revealed.`, 'info');
        return;
      }

      const revealed = friendlyState.deck.splice(0, revealCount);
      log(ctx, `🎴 **[VAN-TOUS LV4]**: Sent 1 core from Trash to Void! Revealed ${revealCount} card(s) from decktop: ${revealed.map(c => `"${c.name}"`).join(', ')}!`, 'magic');

      const isDemonLord = (c) => {
        const fam = ((c.family || '') + ' ' + (c.families ? c.families.join(' ') : '')).toLowerCase();
        const nm = (c.name || '').toLowerCase();
        return fam.includes('demonlord') || fam.includes('evil god') || nm.includes('demonlord') || nm.includes('fourdemonlord');
      };

      const eligible = revealed.filter(isDemonLord);

      if (eligible.length > 0 && side === 'player' && arenaApi && typeof arenaApi.promptScryRevealModal === 'function') {
        arenaApi.promptScryRevealModal({
          sourceCard: card,
          side: 'player',
          title: 'Van-Tous: Summon up to 3 DemonLord Cards',
          description: `Select up to 3 DemonLord cards to summon for free (Remaining cards will be banished to Trash):`,
          cards: revealed,
          filterFn: isDemonLord
        }, (chosen) => {
          if (chosen) {
            const chosenList = Array.isArray(chosen) ? chosen.slice(0, 3) : [chosen];
            for (const ch of chosenList) {
              const rIdx = revealed.findIndex(r => r.uid === ch.uid);
              if (rIdx !== -1) revealed.splice(rIdx, 1);
              ch.currentCores = 1;
              friendlyState.field.push(ch);
              recalcBp(ctx, ch);
              log(ctx, `✨ **[VAN-TOUS LV4]**: Summoned "${ch.name}" for free!`, 'step');
              if (arenaApi.executeWhenSummonedEffects) arenaApi.executeWhenSummonedEffects(ch, side);
            }
          }
          // Banish remaining revealed cards
          for (const rem of revealed) {
            sendToTrash(ctx, rem, side, 'Banished by Van-Tous LV4');
          }
          render(ctx);
        });
      } else {
        // AI or fallback: summon up to 3
        const toSummon = eligible.slice(0, 3);
        for (const ch of toSummon) {
          const rIdx = revealed.findIndex(r => r.uid === ch.uid);
          if (rIdx !== -1) revealed.splice(rIdx, 1);
          ch.currentCores = 1;
          friendlyState.field.push(ch);
          recalcBp(ctx, ch);
          log(ctx, `✨ **[VAN-TOUS LV4]**: Summoned "${ch.name}" for free!`, 'step');
        }
        for (const rem of revealed) {
          sendToTrash(ctx, rem, side, 'Banished by Van-Tous LV4');
        }
        render(ctx);
      }
    };

    if (side === 'player' && arenaApi && typeof arenaApi.askOptionalEffect === 'function') {
      arenaApi.askOptionalEffect(
        card,
        `Activate Van-Tous LV4 effect? Send 1 core from Trash to Void to reveal up to ${friendlyState.counters || 0} cards and summon up to 3 DemonLord cards for free?`,
        executeLv4,
        null
      );
    } else {
      executeLv4();
    }
  }

  // ────────────────────────────────────────────────────────────
  // 3. SD65-CX01: The PartnerDemonLord Javad
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-CX01', {
    name: 'The PartnerDemonLord Javad',
    cardType: 'Ultimate',
    triggers: {
      SOUL_STATE: function(ctx) {
        // [Soul State][Contract Pre-Advent]/[Ultimate] [LV3][LV4]
        // When your cores or opposing cores are sent to Void/Trash from Life/Field/Reserve/Trash by your "Evil God" family effects, counters +2!
        const { side, duelState } = ctx;
        const friendlyState = getFriendlyState(ctx);
        if (!friendlyState.javadCountBoostUsedThisTurn) {
          friendlyState.javadCountBoostUsedThisTurn = true;
          friendlyState.counters = (friendlyState.counters || 0) + 2;
          log(ctx, `✨ **[JAVAD SOUL STATE]**: Evil God core drain triggered! Count +2 (Total: ${friendlyState.counters})!`, 'step');
          render(ctx);
        }
      },

      FLASH: function(ctx) {
        // [LV3][LV4] Flash - Once per turn: send 1 core from Field/Reserve to Trash -> send 2 cores from opposing Spirit/Ultimate to Reserve!
        const { card, side, duelState, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        if (friendlyState.javadFlashUsedThisTurn) {
          log(ctx, `ℹ️ **[Javad Flash]**: Once per turn effect was already used.`, 'info');
          return;
        }

        const canPay = (friendlyState.reserve >= 1) || (card.currentCores > 1);
        if (!canPay) return;

        const executeFlash = () => {
          friendlyState.javadFlashUsedThisTurn = true;
          if (friendlyState.reserve >= 1) {
            friendlyState.reserve -= 1;
          } else {
            card.currentCores -= 1;
            recalcBp(ctx, card);
          }
          friendlyState.trash = (friendlyState.trash || 0) + 1;

          // Target opposing Spirit/Ultimate to drain 2 cores to Reserve
          const oppUnits = (enemyState.field || []).filter(s => (s.currentCores || 0) > 0);
          if (oppUnits.length > 0) {
            if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
              arenaApi.promptUniversalTargetModal({
                card,
                side: 'player',
                targetSide: enemySide,
                targetKind: 'spirit',
                customPool: oppUnits,
                title: 'Javad: Drain 2 Cores to Reserve',
                description: 'Select an opposing Spirit/Ultimate to send 2 cores from to Reserve:',
                minCount: 1,
                maxCount: 1,
                allowSkip: false
              }, (targets) => {
                if (targets && targets.length > 0) {
                  const target = targets[0];
                  const drained = Math.min(2, target.currentCores || 0);
                  target.currentCores -= drained;
                  enemyState.reserve = (enemyState.reserve || 0) + drained;
                  recalcBp(ctx, target);
                  audio(ctx, 'coreChime');
                  log(ctx, `🔮 **[JAVAD FLASH]**: Sent ${drained} core(s) from "${target.name}" to opponent Reserve!`, 'magic');
                  if (target.currentCores <= 0) {
                    const tIdx = enemyState.field.findIndex(s => s.uid === target.uid);
                    if (tIdx !== -1) {
                      const depleted = enemyState.field.splice(tIdx, 1)[0];
                      sendToTrash(ctx, depleted, enemySide, 'Depleted by Javad Flash core drain');
                      log(ctx, `💀 **[DEPLETED]**: "${target.name}" had 0 cores and was sent to Trash!`, 'kill');
                    }
                  }
                  render(ctx);
                }
              });
            } else {
              // AI drains from highest BP unit
              oppUnits.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
              const target = oppUnits[0];
              const drained = Math.min(2, target.currentCores || 0);
              target.currentCores -= drained;
              enemyState.reserve = (enemyState.reserve || 0) + drained;
              recalcBp(ctx, target);
              log(ctx, `🔮 **[OPPONENT JAVAD FLASH]**: Sent ${drained} core(s) from "${target.name}" to your Reserve!`, 'magic');
              if (target.currentCores <= 0) {
                const tIdx = enemyState.field.findIndex(s => s.uid === target.uid);
                if (tIdx !== -1) {
                  const depleted = enemyState.field.splice(tIdx, 1)[0];
                  sendToTrash(ctx, depleted, enemySide, 'Depleted by Javad Flash');
                }
              }
              render(ctx);
            }
          }
        };

        executeFlash();
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 4. SD65-003: The Ruler of FourDemonLords Lord-Javad
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-003', {
    name: 'The Ruler of FourDemonLords Lord-Javad',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        executeLordJavadSummonAdvent(ctx);
      },
      WHEN_ADVENTS: function(ctx) {
        executeLordJavadSummonAdvent(ctx);
      }
    }
  });

  function executeLordJavadSummonAdvent(ctx) {
    const { card, side, arenaApi } = ctx;
    const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
    if (curLevel < 3) return;

    const friendlyState = getFriendlyState(ctx);
    const enemyState = getEnemyState(ctx);
    const enemySide = getEnemySide(ctx);

    if (!friendlyState.hand || friendlyState.hand.length === 0) {
      log(ctx, `ℹ️ **[Lord-Javad]**: Hand is empty; cannot discard a card to draw 2.`, 'info');
      return;
    }

    const doDiscardAndDraw = (discardedCard) => {
      const hIdx = friendlyState.hand.findIndex(h => h.uid === discardedCard.uid);
      if (hIdx !== -1) {
        friendlyState.hand.splice(hIdx, 1);
        sendToTrash(ctx, discardedCard, side, 'Discarded by Lord-Javad');
      }

      // Draw 2 cards
      let drawnCount = 0;
      for (let i = 0; i < 2; i++) {
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          friendlyState.hand.push(friendlyState.deck.shift());
          drawnCount++;
        }
      }
      audio(ctx, 'magic');
      log(ctx, `🎴 **[LORD-JAVAD]**: Discarded "${discardedCard.name}" and drew ${drawnCount} card(s)!`, 'magic');

      // If Evil God discarded -> Send 2 cores from opposing Field to Reserve!
      const fam = ((discardedCard.family || '') + ' ' + (discardedCard.families ? discardedCard.families.join(' ') : '')).toLowerCase();
      if (fam.includes('evil god') || (discardedCard.name || '').includes('DemonLord')) {
        const oppUnits = (enemyState.field || []).filter(s => (s.currentCores || 0) > 0);
        if (oppUnits.length > 0) {
          let coresToDrain = 2;
          for (const u of oppUnits) {
            if (coresToDrain <= 0) break;
            const drain = Math.min(coresToDrain, u.currentCores || 0);
            u.currentCores -= drain;
            enemyState.reserve = (enemyState.reserve || 0) + drain;
            coresToDrain -= drain;
            recalcBp(ctx, u);
          }
          log(ctx, `🔮 **[LORD-JAVAD: Evil God Discard Bonus]**: Drained 2 cores from opposing Field to Reserve!`, 'magic');
        }
      }
      render(ctx);
    };

    if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
      arenaApi.promptUniversalTargetModal({
        card,
        side: 'player',
        targetSide: 'player',
        targetKind: 'card',
        customPool: friendlyState.hand,
        title: 'Lord-Javad: Discard 1 Card to Draw 2',
        description: 'Select a card to discard (Discarding an "Evil God" card sends 2 opposing cores to Reserve):',
        minCount: 1,
        maxCount: 1,
        allowSkip: true
      }, (selected) => {
        if (selected && selected.length > 0) {
          doDiscardAndDraw(selected[0]);
        } else {
          log(ctx, `ℹ️ **[Lord-Javad]**: Skipped hand discard.`, 'info');
        }
      });
    } else {
      doDiscardAndDraw(friendlyState.hand[0]);
    }
  }

  // ────────────────────────────────────────────────────────────
  // 5. BS38-CP05: The Hellwind Searcher Kagerou-Seeker
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('BS38-CP05', {
    name: 'The Hellwind Searcher Kagerou-Seeker',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const friendlyState = getFriendlyState(ctx);
        if (!card.usedSoulCore && !card.paidWithSoulCore) {
          log(ctx, `ℹ️ **[Kagerou-Seeker]**: Soul Core was not used for summon payment; search effect does not trigger.`, 'info');
          return;
        }

        const revealCount = Math.min(3, (friendlyState.deck || []).length);
        if (revealCount <= 0) {
          log(ctx, `ℹ️ **[Kagerou-Seeker]**: Deck is empty; cannot reveal cards.`, 'info');
          return;
        }

        const revealed = friendlyState.deck.splice(0, revealCount);
        log(ctx, `🎴 **[KAGEROU-SEEKER: When Summoned]**: Revealed ${revealCount} card(s) from decktop: ${revealed.map(c => `"${c.name}"`).join(', ')}!`, 'magic');

        const isUlt = (c) => (c.type || '').includes('Ultimate');

        if (side === 'player' && arenaApi && typeof arenaApi.promptScryRevealModal === 'function') {
          arenaApi.promptScryRevealModal({
            sourceCard: card,
            side: 'player',
            title: 'Kagerou-Seeker: Revealed Cards',
            description: 'Select an Ultimate card to add to your Hand. Remaining cards will be sent to Trash:',
            cards: revealed,
            filterFn: isUlt
          }, (chosenUlt) => {
            if (chosenUlt) {
              const uIdx = revealed.findIndex(c => c.uid === chosenUlt.uid);
              if (uIdx !== -1) revealed.splice(uIdx, 1);
              friendlyState.hand.push(chosenUlt);
              log(ctx, `✨ **[KAGEROU-SEEKER]**: Added Ultimate card "${chosenUlt.name}" to Hand!`, 'step');
              if (arenaApi.showToast) arenaApi.showToast(`Added "${chosenUlt.name}" to Hand!`, 'success');
            }
            for (const rem of revealed) {
              sendToTrash(ctx, rem, side, 'Sent to Trash by Kagerou-Seeker');
            }
            render(ctx);
          });
        } else {
          // AI adds first Ultimate found
          const ultIdx = revealed.findIndex(isUlt);
          if (ultIdx !== -1) {
            const added = revealed.splice(ultIdx, 1)[0];
            friendlyState.hand.push(added);
            log(ctx, `✨ **[OPPONENT KAGEROU-SEEKER]**: Added Ultimate card "${added.name}" to Hand!`, 'step');
          }
          for (const rem of revealed) {
            sendToTrash(ctx, rem, side, 'Sent to Trash by Kagerou-Seeker');
          }
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 6. SD36-001 / BATTLE-SPIRITS-A27: Birgoyle
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard(['SD36-001', 'BATTLE-SPIRITS-A27'], {
    name: 'Birgoyle',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        const doCoreBoost = () => {
          card.currentCores = (card.currentCores || 0) + 1;
          recalcBp(ctx, card);
          audio(ctx, 'coreChime');
          log(ctx, `🔮 **[CORE BOOST: Birgoyle]**: Put 1 core from Void onto "${card.name}"!`, 'magic');
          render(ctx);
        };

        const doDestroy = (target) => {
          const sIdx = enemyState.field.findIndex(s => s.uid === target.uid);
          if (sIdx !== -1) {
            const dest = enemyState.field.splice(sIdx, 1)[0];
            handleDestroyedCores(ctx, dest, enemySide);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Birgoyle (When Summoned)');
            audio(ctx, 'destroy');
            log(ctx, `💀 **[BP DESTRUCTION: Birgoyle]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP ≤ 5000 BP)!`, 'kill');
            render(ctx);
          }
        };

        if (side === 'player' && arenaApi && typeof arenaApi.promptChoiceModal === 'function') {
          arenaApi.promptChoiceModal({
            card,
            side: 'player',
            title: 'Birgoyle: (When Summoned) Choice',
            description: 'Select which effect to activate:',
            choices: [
              { icon: '💀', label: 'Destroy Opposing Spirit (≤ 5000 BP)', desc: 'Choose an opposing Spirit with 5000 BP or less to destroy' },
              { icon: '🔮', label: 'Put Core from Void to this Ultimate', desc: 'Place 1 core from Void onto Birgoyle' }
            ]
          }, (choiceIdx) => {
            if (choiceIdx === 0) {
              const eligible = (enemyState.field || []).filter(s =>
                (s.battleBp || s.currentBp || 0) <= 5000 &&
                (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')))
              );
              if (eligible.length > 0) {
                arenaApi.promptUniversalTargetModal({
                  card,
                  side: 'player',
                  targetSide: enemySide,
                  targetKind: 'spirit',
                  customPool: eligible,
                  title: 'Birgoyle: Destroy Spirit',
                  description: 'Select an opposing Spirit with 5000 BP or less to destroy:',
                  minCount: 1,
                  maxCount: 1,
                  allowSkip: false
                }, (selected) => {
                  if (selected && selected.length > 0) doDestroy(selected[0]);
                });
              } else {
                log(ctx, `ℹ️ **[Birgoyle]**: No opposing Spirit ≤ 5000 BP found; putting core from Void instead.`, 'info');
                doCoreBoost();
              }
            } else {
              doCoreBoost();
            }
          });
        } else {
          // AI: if killable target exists, destroy it; otherwise core boost
          const eligible = (enemyState.field || []).filter(s =>
            (s.battleBp || s.currentBp || 0) <= 5000 &&
            (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')))
          );
          if (eligible.length > 0) {
            eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
            doDestroy(eligible[0]);
          } else {
            doCoreBoost();
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 7. SD28-X02: The EarthDeitySword Gaianohoko
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD28-X02', {
    name: 'The EarthDeitySword Gaianohoko',
    cardType: 'Brave',
    triggers: {
      DURING_BRAVE: function(ctx) {
        // [During Brave] (When Attacks/Blocks): The opposing Burst cannot activate!
        const { side, duelState } = ctx;
        const enemySide = getEnemySide(ctx);
        duelState.burstLockThisTurn = enemySide;
        log(ctx, `⚔️ **[GAIANOHOKO: During Brave]**: The opposing Burst cannot activate during this battle!`, 'magic');
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 8. SD65-006 / SD65-011: The Four Towers of Limbo
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard(['SD65-006', 'SD65-011'], {
    name: 'The Four Towers of Limbo',
    cardType: 'Nexus',
    triggers: {
      WHEN_ATTACKS: function(ctx) {
        const { side, duelState, arenaApi } = ctx;
        const attacker = duelState.combatAttacker;
        if (!attacker) return;

        const isUlt = attacker.type === 'Ultimate' || (attacker.type || '').includes('Ultimate');
        const fam = ((attacker.family || '') + ' ' + (attacker.families ? attacker.families.join(' ') : '')).toLowerCase();
        if (!isUlt || !fam.includes('evil god')) return;

        const friendlyState = getFriendlyState(ctx);
        friendlyState.counters = (friendlyState.counters || 0) + 1;
        log(ctx, `💠 **[The Four Towers of Limbo]**: Count +1 upon "${attacker.name}" attack! (Total Count: ${friendlyState.counters})`, 'step');

        if (!friendlyState.usedLimboAttackStepChoiceThisTurn) {
          friendlyState.usedLimboAttackStepChoiceThisTurn = true;
          if (side === 'player' && arenaApi && typeof arenaApi.promptChoiceModal === 'function') {
            arenaApi.promptChoiceModal({
              card: ctx.card,
              side: 'player',
              title: 'The Four Towers of Limbo (Once per Turn)',
              description: 'Select an effect to activate:',
              choices: [
                { icon: '🎴', label: 'Draw 1 Card', desc: 'Draw 1 card from deck' },
                { icon: '🔮', label: `Core Boost to "${attacker.name}"`, desc: `Put 1 core from Void onto "${attacker.name}"` }
              ]
            }, (cIdx) => {
              if (cIdx === 0) {
                if (friendlyState.deck && friendlyState.deck.length > 0) {
                  const drawn = friendlyState.deck.shift();
                  friendlyState.hand.push(drawn);
                  audio(ctx, 'magic');
                  log(ctx, `🎴 **[The Four Towers of Limbo]**: Drew "${drawn.name}"!`, 'magic');
                }
              } else {
                attacker.currentCores = (attacker.currentCores || 0) + 1;
                recalcBp(ctx, attacker);
                audio(ctx, 'coreChime');
                log(ctx, `🔮 **[The Four Towers of Limbo]**: Put 1 core from Void onto "${attacker.name}"!`, 'magic');
              }
              render(ctx);
            });
          } else {
            // AI draws
            if (friendlyState.deck && friendlyState.deck.length > 0) {
              friendlyState.hand.push(friendlyState.deck.shift());
            }
          }
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 9. SD65-001: The HellflameCount Zan-Zival
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-001', {
    name: 'The HellflameCount Zan-Zival',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const curLevel = card.currentLevel !== undefined ? card.currentLevel : 3;
        if (curLevel < 3) return;

        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        const eligibleSpirits = (enemyState.field || []).filter(s =>
          (s.battleBp || s.currentBp || 0) <= 15000 &&
          (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')))
        );
        const eligibleNexuses = (enemyState.nexus || []);

        if (side === 'player' && arenaApi && typeof arenaApi.promptChoiceModal === 'function') {
          arenaApi.promptChoiceModal({
            card,
            side: 'player',
            title: 'Zan-Zival: Destroy Spirit or Nexus',
            description: 'Select target category to destroy:',
            choices: [
              { icon: '💀', label: 'Destroy 15000 BP or less Spirit', desc: `${eligibleSpirits.length} eligible target(s)` },
              { icon: '🏛️', label: 'Destroy opposing Nexus', desc: `${eligibleNexuses.length} eligible target(s)` }
            ]
          }, (cIdx) => {
            if (cIdx === 0 && eligibleSpirits.length > 0) {
              arenaApi.promptUniversalTargetModal({
                card,
                side: 'player',
                targetSide: enemySide,
                targetKind: 'spirit',
                customPool: eligibleSpirits,
                title: 'Zan-Zival: Destroy Spirit',
                description: 'Select an opposing Spirit with 15000 BP or less to destroy:',
                minCount: 1,
                maxCount: 1
              }, (sel) => {
                if (sel && sel.length > 0) {
                  const dest = sel[0];
                  const sIdx = enemyState.field.findIndex(s => s.uid === dest.uid);
                  if (sIdx !== -1) {
                    enemyState.field.splice(sIdx, 1);
                    handleDestroyedCores(ctx, dest, enemySide);
                    sendToTrash(ctx, dest, enemySide, 'Destroyed by Zan-Zival');
                    audio(ctx, 'destroy');
                    log(ctx, `💀 **[ZAN-ZIVAL]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP ≤ 15000 BP)!`, 'kill');
                    render(ctx);
                  }
                }
              });
            } else if (cIdx === 1 && eligibleNexuses.length > 0) {
              arenaApi.promptUniversalTargetModal({
                card,
                side: 'player',
                targetSide: enemySide,
                targetKind: 'nexus',
                customPool: eligibleNexuses,
                title: 'Zan-Zival: Destroy Nexus',
                description: 'Select an opposing Nexus to destroy:',
                minCount: 1,
                maxCount: 1
              }, (sel) => {
                if (sel && sel.length > 0) {
                  const dest = sel[0];
                  const nIdx = enemyState.nexus.findIndex(n => n.uid === dest.uid);
                  if (nIdx !== -1) {
                    enemyState.nexus.splice(nIdx, 1);
                    enemyState.reserve = (enemyState.reserve || 0) + (dest.currentCores || 0);
                    sendToTrash(ctx, dest, enemySide, 'Destroyed by Zan-Zival');
                    audio(ctx, 'destroy');
                    log(ctx, `🏛️ **[ZAN-ZIVAL]**: Destroyed opposing Nexus "${dest.name}"!`, 'kill');
                    render(ctx);
                  }
                }
              });
            }
          });
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 10. SD65-002: The HellsoilCount Grey-Tude
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard('SD65-002', {
    name: 'The HellsoilCount Grey-Tude',
    cardType: 'Ultimate',
    triggers: {
      WHEN_SUMMONED: function(ctx) {
        const { side } = ctx;
        const curLevel = ctx.card.currentLevel !== undefined ? ctx.card.currentLevel : 3;
        if (curLevel < 3) return;

        const friendlyState = getFriendlyState(ctx);
        friendlyState.counters = (friendlyState.counters || 0) + 1;
        let drawn = null;
        if (friendlyState.deck && friendlyState.deck.length > 0) {
          drawn = friendlyState.deck.shift();
          friendlyState.hand.push(drawn);
        }
        audio(ctx, 'magic');
        log(ctx, `🌱 **[GREY-TUDE: When Summoned]**: Count +1 (Total: ${friendlyState.counters}) and drew ${drawn ? `"${drawn.name}"` : 'a card'}!`, 'magic');
        render(ctx);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 11. SD65-013 / BATTLE-SPIRITS-A4233: Evil Draw
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard(['SD65-013', 'BATTLE-SPIRITS-A4233'], {
    name: 'Evil Draw',
    cardType: 'Magic',
    triggers: {
      MAIN: function(ctx) {
        const { card, side, arenaApi } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        // Draw 2 cards
        let drawnCount = 0;
        for (let i = 0; i < 2; i++) {
          if (friendlyState.deck && friendlyState.deck.length > 0) {
            friendlyState.hand.push(friendlyState.deck.shift());
            drawnCount++;
          }
        }
        audio(ctx, 'magic');
        log(ctx, `🎴 **[EVIL DRAW: Main]**: Drew ${drawnCount} card(s)!`, 'magic');

        // Also, if [Soul Core] was used to pay the cost, destroy an opposing 4000 BP or less Spirit!
        if (card.paidWithSoulCore || card.usedSoulCore) {
          const eligible = (enemyState.field || []).filter(s =>
            (s.battleBp || s.currentBp || 0) <= 4000 &&
            (s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')))
          );
          if (eligible.length > 0) {
            if (side === 'player' && arenaApi && typeof arenaApi.promptUniversalTargetModal === 'function') {
              arenaApi.promptUniversalTargetModal({
                card,
                side: 'player',
                targetSide: enemySide,
                targetKind: 'spirit',
                customPool: eligible,
                title: 'Evil Draw: Destroy Spirit (≤ 4000 BP)',
                description: 'Soul Core bonus: Select an opposing Spirit with 4000 BP or less to destroy:',
                minCount: 1,
                maxCount: 1
              }, (sel) => {
                if (sel && sel.length > 0) {
                  const target = sel[0];
                  const sIdx = enemyState.field.findIndex(s => s.uid === target.uid);
                  if (sIdx !== -1) {
                    enemyState.field.splice(sIdx, 1);
                    handleDestroyedCores(ctx, target, enemySide);
                    sendToTrash(ctx, target, enemySide, 'Destroyed by Evil Draw');
                    audio(ctx, 'destroy');
                    log(ctx, `💀 **[EVIL DRAW: Soul Core Bonus]**: Destroyed opposing "${target.name}" (${target.currentBp} BP ≤ 4000 BP)!`, 'kill');
                    render(ctx);
                  }
                }
              });
            } else {
              eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
              const target = eligible[0];
              const sIdx = enemyState.field.findIndex(s => s.uid === target.uid);
              if (sIdx !== -1) {
                enemyState.field.splice(sIdx, 1);
                handleDestroyedCores(ctx, target, enemySide);
                sendToTrash(ctx, target, enemySide, 'Destroyed by Evil Draw');
                audio(ctx, 'destroy');
                log(ctx, `💀 **[EVIL DRAW: Soul Core Bonus]**: Destroyed opposing "${target.name}"!`, 'kill');
                render(ctx);
              }
            }
          }
        }
        render(ctx);
      },

      FLASH: function(ctx) {
        // [Flash]: During this turn, give a Spirit/Ultimate +2000 BP
        const { side, duelState } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const units = friendlyState.field || [];
        if (units.length > 0) {
          const target = units[0]; // buff first or active attacker
          target.battleBpBoost = (target.battleBpBoost || 0) + 2000;
          recalcBp(ctx, target);
          log(ctx, `⚔️ **[EVIL DRAW: Flash]**: Granted +2000 BP to "${target.name}" for this turn!`, 'magic');
          render(ctx);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // 12. SD65-014 / BS38-067: Evil Flame
  // ────────────────────────────────────────────────────────────
  PerCardRegistry.registerCard(['SD65-014', 'BS38-067'], {
    name: 'Evil Flame',
    cardType: 'Magic',
    triggers: {
      BURST: function(ctx) {
        // [Burst: After your Life is reduced]
        // Destroy two opposing one-symbol Spirits/Ultimates!
        const { side, arenaApi } = ctx;
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        const eligible = (enemyState.field || []).filter(s => (s.symbolCount !== undefined ? s.symbolCount : 1) === 1);
        const toDestroy = eligible.slice(0, 2);
        for (const dest of toDestroy) {
          const sIdx = enemyState.field.findIndex(s => s.uid === dest.uid);
          if (sIdx !== -1) {
            enemyState.field.splice(sIdx, 1);
            handleDestroyedCores(ctx, dest, enemySide);
            sendToTrash(ctx, dest, enemySide, 'Destroyed by Evil Flame Burst');
            log(ctx, `💀 **[EVIL FLAME: Burst]**: Destroyed opposing 1-symbol "${dest.name}"!`, 'kill');
          }
        }
        audio(ctx, 'destroy');
        render(ctx);
      },

      FLASH: function(ctx) {
        // [Flash] Destroy any number of opposing Spirits up to a total of 5000 BP.
        // If you control no Spirits, instead, up to a total of 10000 BP!
        const { side } = ctx;
        const friendlyState = getFriendlyState(ctx);
        const enemyState = getEnemyState(ctx);
        const enemySide = getEnemySide(ctx);

        const mySpirits = (friendlyState.field || []).filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
        const cap = mySpirits.length === 0 ? 10000 : 5000;

        const enemySpirits = (enemyState.field || []).filter(s => s.type === 'Spirit' || (!((s.type || '').includes('Ultimate')) && (s.type || '').includes('Spirit')));
        enemySpirits.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));

        let accumulatedBp = 0;
        const destroyed = [];
        for (const sp of enemySpirits) {
          const bp = sp.currentBp || 0;
          if (accumulatedBp + bp <= cap) {
            accumulatedBp += bp;
            destroyed.push(sp);
          }
        }

        for (const d of destroyed) {
          const idx = enemyState.field.findIndex(s => s.uid === d.uid);
          if (idx !== -1) {
            enemyState.field.splice(idx, 1);
            handleDestroyedCores(ctx, d, enemySide);
            sendToTrash(ctx, d, enemySide, 'Destroyed by Evil Flame Flash');
            log(ctx, `💀 **[EVIL FLAME: Flash]**: Destroyed opposing "${d.name}" (${d.currentBp} BP, total destroyed BP: ${accumulatedBp}/${cap})!`, 'kill');
          }
        }
        audio(ctx, 'destroy');
        render(ctx);
      }
    }
  });

  console.log(`[sd65_four_demon_lords] Registered ${PerCardRegistry.getAll().length} deterministic card handlers.`);
