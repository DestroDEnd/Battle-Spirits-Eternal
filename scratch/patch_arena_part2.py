with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Burst replacement in hand rendering
t1 = """      // Burst can only be set during the MAIN step
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && !DuelState.player.burst && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">🔒 Set as Burst</button>` : '';"""

r1 = """      // Burst can only be set during the MAIN step (or replaced if one is already set)
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">${burstBtnLabel}</button>` : '';"""

# 2. Burst replacement in inspector
t2 = """    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && !DuelState.player.burst && isBurstCard;
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        🔒 Set as Burst
      </button>
    ` : '';"""

r2 = """    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && isMainStep && isBurstCard;
    const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        ${burstBtnLabel}
      </button>
    ` : '';"""

# 3. Burst replacement in setBurst
t3 = """  function setBurst(uid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot set Burst on opponent's turn!", 'warning');
      return;
    }
    if (DuelState.player.burst) {
      if (typeof showToast === 'function') showToast("You already have a Burst set in your Burst Zone! Only 1 Burst allowed.", 'warning');
      return;
    }
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;
    const card = DuelState.player.hand.splice(idx, 1)[0];
    DuelState.player.burst = card;"""

r3 = """  function setBurst(uid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot set Burst on opponent's turn!", 'warning');
      return;
    }
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;

    // Official Rule: Player can replace an existing set Burst during Main Step.
    // The previous Burst card is sent to the Trash (Graveyard).
    if (DuelState.player.burst) {
      const oldBurst = DuelState.player.burst;
      sendToTrash(oldBurst, 'player', 'Replaced by setting a new Burst');
      addLog(`♻️ **[BURST REPLACED]**: Previous Burst "${oldBurst.name}" sent to Trash to set new Burst!`, 'step');
      if (typeof showToast === 'function') {
        showToast(`♻️ Replaced Burst: "${oldBurst.name}" sent to Trash.`, 'info');
      }
    }

    const card = DuelState.player.hand.splice(idx, 1)[0];
    DuelState.player.burst = card;"""

# 4. Check burst trigger with pause callback
t4 = """  function checkBurstTrigger(side, eventType = 'AFTER_LIFE_DECREASED', eventContext = {}) {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return false;

    const cond = parseBurstCondition(burstCard.effect);

    // Strict validation: eventType must match the card's specific condition
    const matches = (cond.type === eventType) || (cond.type === 'GENERIC_BURST');
    if (!matches) {
      // Condition does NOT match: card remains securely set in Burst Area
      return false;
    }

    if (isPlayer) {
      openBurstPromptModal(burstCard, cond, eventType, eventContext);
      return true;
    } else {
      // Opponent AI automatically resolves
      addLog(`🃏 Opponent's Burst Trap met condition [${cond.label}]!`, 'magic');
      safeTimeout(() => activateBurst('opponent', true), 500);
      return true;
    }
  }"""

r4 = """  function checkBurstTrigger(side, eventType = 'AFTER_LIFE_DECREASED', eventContext = {}, onResume = null) {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return false;

    const cond = parseBurstCondition(burstCard.effect);

    // Strict validation: eventType must match the card's specific condition
    const matches = (cond.type === eventType) || (cond.type === 'GENERIC_BURST');
    if (!matches) {
      // Condition does NOT match: card remains securely set in Burst Area
      return false;
    }

    if (isPlayer) {
      DuelState.pendingBurstResume = onResume || null;
      openBurstPromptModal(burstCard, cond, eventType, eventContext);
      return true;
    } else {
      // Opponent AI automatically resolves
      addLog(`🃏 Opponent's Burst Trap met condition [${cond.label}]!`, 'magic');
      safeTimeout(() => {
        activateBurst('opponent', true);
        if (typeof onResume === 'function') onResume();
      }, 500);
      return true;
    }
  }"""

# 5. Confirm & decline burst callbacks
t5 = """  function confirmBurstTrigger() {
    closeBurstPromptModal();
    if (DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player') {
      activateBurst('player', true);
    }
  }

  function declineBurstTrigger() {
    closeBurstPromptModal();
    if (DuelState.activeBurstTrigger) {
      const cardName = DuelState.activeBurstTrigger.card?.name || 'Burst';
      addLog(`🛡️ **[BURST HELD]**: Player chose not to trigger "${cardName}" this time. Card remains safely set in Burst Area.`, 'step');
      DuelState.activeBurstTrigger = null;
      renderBurstZones();
    }
  }"""

r5 = """  function confirmBurstTrigger() {
    closeBurstPromptModal();
    const resume = DuelState.pendingBurstResume;
    DuelState.pendingBurstResume = null;
    if (DuelState.activeBurstTrigger && DuelState.activeBurstTrigger.side === 'player') {
      activateBurst('player', true);
    }
    if (typeof resume === 'function') {
      safeTimeout(resume, 700);
    }
  }

  function declineBurstTrigger() {
    closeBurstPromptModal();
    const resume = DuelState.pendingBurstResume;
    DuelState.pendingBurstResume = null;
    if (DuelState.activeBurstTrigger) {
      const cardName = DuelState.activeBurstTrigger.card?.name || 'Burst';
      addLog(`🛡️ **[BURST HELD]**: Player chose not to trigger "${cardName}" this time. Card remains safely set in Burst Area.`, 'step');
      DuelState.activeBurstTrigger = null;
      renderBurstZones();
    }
    if (typeof resume === 'function') {
      safeTimeout(resume, 300);
    }
  }"""

# 6. runAiAttackStep pause on burst
t6 = """        if (DuelState.player.life > 0) {
          checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
          const isAttackerAlive = DuelState.opponent.field.some(s => s.uid === attacker.uid);
          const finishAiTurn = () => {
            const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
            const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= aggroThreshold);
            if (viable.length > 0) {
              safeTimeout(runAiAttackStep, 1000);
            } else {
              safeTimeout(endTurn, 900);
            }
          };

          if (isAttackerAlive) {
            checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
              endOfBattleBpReset(attacker);
              finishAiTurn();
            });
          } else {
            endOfBattleBpReset(attacker);
            finishAiTurn();
          }
        }"""

r6 = """        if (DuelState.player.life > 0) {
          const continueAfterDamage = () => {
            const isAttackerAlive = DuelState.opponent.field.some(s => s.uid === attacker.uid);
            const finishAiTurn = () => {
              const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
              const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= aggroThreshold);
              if (viable.length > 0) {
                safeTimeout(runAiAttackStep, 1000);
              } else {
                safeTimeout(endTurn, 900);
              }
            };

            if (isAttackerAlive) {
              checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
                endOfBattleBpReset(attacker);
                finishAiTurn();
              });
            } else {
              endOfBattleBpReset(attacker);
              finishAiTurn();
            }
          };

          const burstTriggered = checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', {}, continueAfterDamage);
          if (!burstTriggered) {
            continueAfterDamage();
          }
        }"""

# 7. takeLifeDamage pause on burst
t7 = """    if (DuelState.player.life > 0) {
      checkLifeDecreasedEffects('player');
      checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
      const isAttackerAlive = attacker && DuelState.opponent.field.some(s => s.uid === attacker.uid);
      const continueOpponent = () => {
        if (DuelState.activePlayer === 'opponent') {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeEndOpponentTurn(900);
          }
        }
      };

      if (isAttackerAlive) {
        checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
          if (attacker) endOfBattleBpReset(attacker);
          continueOpponent();
        });
      } else {
        if (attacker) endOfBattleBpReset(attacker);
        continueOpponent();
      }
    }"""

r7 = """    if (DuelState.player.life > 0) {
      checkLifeDecreasedEffects('player');
      const isAttackerAlive = attacker && DuelState.opponent.field.some(s => s.uid === attacker.uid);
      const continueOpponent = () => {
        if (DuelState.activePlayer === 'opponent') {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeEndOpponentTurn(900);
          }
        }
      };

      const finishBlockDamage = () => {
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
            if (attacker) endOfBattleBpReset(attacker);
            continueOpponent();
          });
        } else {
          if (attacker) endOfBattleBpReset(attacker);
          continueOpponent();
        }
      };

      const burstTriggered = checkBurstTrigger('player', 'AFTER_LIFE_DECREASED', {}, finishBlockDamage);
      if (!burstTriggered) {
        finishBlockDamage();
      }
    }"""

c_norm = c.replace('\r\n', '\n')
for i, (t, r) in enumerate([(t1, r1), (t2, r2), (t3, r3), (t4, r4), (t5, r5), (t6, r6), (t7, r7)]):
    t_n = t.replace('\r\n', '\n')
    r_n = r.replace('\r\n', '\n')
    assert t_n in c_norm, f"Target {i+1} not found in battle_arena.js!"
    c_norm = c_norm.replace(t_n, r_n)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(c_norm)

print("Part 2 of battle_arena.js patched successfully!")
