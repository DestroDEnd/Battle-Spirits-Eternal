import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix Opponent Life container comment
target_opp_life = "// renderLifeCores('opponentLifeContainer', DuelState.opponent.life);"
repl_opp_life = "renderLifeCores('opponentLifeContainer', DuelState.opponent.life);"

if target_opp_life in code:
    code = code.replace(target_opp_life, repl_opp_life, 1)
    print("1. Successfully uncommented opponentLifeContainer call!")
else:
    print("1. Opponent life target not found (may already be uncommented)")

# 2. Update renderLifeCores for dynamic slots
target_render_life = """  function renderLifeCores(containerId, lifeCount) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < lifeCount) {
        html += `<span class="life-hex-gem gem-active" title="Life Core ${i+1}">${getHexCoreSvg('life-active', 22)}</span>`;
      } else {
        html += `<span class="life-hex-gem gem-empty" title="Shattered Core">${getHexCoreSvg('life-empty', 22)}</span>`;
      }
    }
    el.innerHTML = html;
  }"""

repl_render_life = """  function renderLifeCores(containerId, lifeCount) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    const count = (typeof lifeCount === 'number') ? lifeCount : 0;
    const totalSlots = Math.max(5, count);
    for (let i = 0; i < totalSlots; i++) {
      if (i < count) {
        html += `<span class="life-hex-gem gem-active" title="Life Core ${i+1}">${getHexCoreSvg('life-active', 22)}</span>`;
      } else {
        html += `<span class="life-hex-gem gem-empty" title="Shattered Core">${getHexCoreSvg('life-empty', 22)}</span>`;
      }
    }
    el.innerHTML = html;
  }"""

if target_render_life in code:
    code = code.replace(target_render_life, repl_render_life, 1)
    print("2. Successfully updated renderLifeCores!")
else:
    print("2. renderLifeCores target not found")

# 3. Update formatEffectKeywords timing regex in battle_arena.js
target_kw_timing = "safe = safe.replace(/\\((When Attacks(?:\\/[^)]+)?|When Summoned(?:\\/[^)]+)?|When Advents(?:\\/[^)]+)?|When Destroyed|When Blocks|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\\)/gi, (match) => {"
repl_kw_timing = "safe = safe.replace(/\\((When Attacks(?:\\/[^)]+)?|When Summoned(?:\\/[^)]+)?|When Advents(?:\\/[^)]+)?|When Battles(?:\\/[^)]+)?|When Blocks(?:\\/[^)]+)?|When Manifests(?:\\/[^)]+)?|When Reborn(?:\\/[^)]+)?|When Destroyed(?:\\/[^)]+)?|When Brave Attacks(?:\\/[^)]+)?|After Your Burst Activates|After a Burst Activates|After your Burst activates|After an? opposing [^)]+|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Opposing Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\\)/gi, (match) => {"

if target_kw_timing in code:
    code = code.replace(target_kw_timing, repl_kw_timing, 1)
    print("3. Successfully updated formatEffectKeywords timing triggers!")
else:
    print("3. formatEffectKeywords timing target not found")

# 4. Insert checkAfterBurstEffects and hook it into activateBurst
target_activate_burst = """    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }

    renderDuelTable();
  }"""

repl_activate_burst = """    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }

    // Trigger universal (After Your Burst Activates) across all allied Spirits on field!
    checkAfterBurstEffects(side, burstCard);

    renderDuelTable();
  }

  function checkAfterBurstEffects(side, activatedBurstCard) {
    if (!activatedBurstCard) return;
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    if (!myField || !myField.length) return;

    for (const spirit of [...myField]) {
      if (!spirit || !spirit.effect) continue;
      const blocks = getCardAbilityBlocks(spirit.effect);
      const eligibleBlocks = blocks.filter(b => /(?:After Your Burst Activates|After a Burst Activates)/i.test(b));
      if (!eligibleBlocks.length) continue;

      for (const b of eligibleBlocks) {
        const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        const levelTag = lvlMatch ? lvlMatch[1] : '';
        if (!isEffectLevelMet(levelTag, spirit.currentLevel)) continue;

        // Check Cost condition (e.g. "If the card activated was Cost 5 or less")
        const costMatch = b.match(/If the card activated was Cost\\s*(\\d+)\\s*or\\s*(less|more)/i);
        if (costMatch) {
          const reqCost = parseInt(costMatch[1], 10);
          const isLess = costMatch[2].toLowerCase() === 'less';
          const cardCost = activatedBurstCard.cost !== undefined ? activatedBurstCard.cost : 0;
          if (isLess && cardCost > reqCost) continue;
          if (!isLess && cardCost < reqCost) continue;
        }

        // Check Family condition (e.g. "if the activated Burst was a 'Primordial'/'Cloudbuilt' family card")
        const famMatch = b.match(/if the activated Burst was a\\s+["']?([^"']+)["']?\\s+family/i);
        if (famMatch) {
          const reqFam = famMatch[1].toLowerCase();
          const cardFams = (activatedBurstCard.family || '').toLowerCase();
          if (!cardFams.includes(reqFam)) continue;
        }

        addLog(`⚡ **[AFTER BURST ACTIVATES: ${spirit.name}]**: Resonating with activated Burst "${activatedBurstCard.name}"!`, 'magic');
        executeAbilityActions(b, spirit, side, 'AFTER_BURST_ACTIVATES', { burstCard: activatedBurstCard });
      }
    }
  }"""

if target_activate_burst in code:
    code = code.replace(target_activate_burst, repl_activate_burst, 1)
    print("4. Successfully hooked checkAfterBurstEffects into activateBurst!")
else:
    print("4. activateBurst target not found")

# 5. Hook checkEndOfBattleEffects into resolveClash
target_clash_end = """    if (DuelState.combatEvent) {
      DuelState.combatEvent.result = resultMsg;
    }
    renderDuelTable();

    setTimeout(() => {
      DuelState.combatEvent = null;
      renderDuelTable();
      checkGameOver();
    }, 1200);
  }"""

repl_clash_end = """    if (DuelState.combatEvent) {
      DuelState.combatEvent.result = resultMsg;
    }
    renderDuelTable();

    setTimeout(() => {
      const attAlive = (attSide === 'player' ? DuelState.player.field : DuelState.opponent.field).some(s => s.uid === att.uid);
      const blkAlive = (defSide === 'player' ? DuelState.player.field : DuelState.opponent.field).some(s => s.uid === blk.uid);
      const survivors = [];
      if (attAlive) survivors.push(att);
      if (blkAlive) survivors.push(blk);

      checkEndOfBattleEffects(survivors, attSide, defSide, () => {
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.activePlayer === 'opponent' && DuelState.player.life > 0 && DuelState.opponent.life > 0) {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 800);
          } else {
            safeTimeout(endTurn, 700);
          }
        }
      });
    }, 1200);
  }"""

if target_clash_end in code:
    code = code.replace(target_clash_end, repl_clash_end, 1)
    print("5. Successfully hooked checkEndOfBattleEffects into resolveClash!")
else:
    print("5. resolveClash target not found")

# 6. Hook checkEndOfBattleEffects into executePlayerAttack (direct hit)
target_player_life_hit = """        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.opponent.life > 0) {
          checkBurstTrigger('opponent', 'AFTER_LIFE_DECREASED');
        }
      }, 900);"""

repl_player_life_hit = """        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.opponent.life > 0) {
          checkBurstTrigger('opponent', 'AFTER_LIFE_DECREASED');
        }

        const isAttackerAlive = DuelState.player.field.some(s => s.uid === attacker.uid);
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'player', 'opponent', () => {
            renderDuelTable();
          });
        }
      }, 900);"""

if target_player_life_hit in code:
    code = code.replace(target_player_life_hit, repl_player_life_hit, 1)
    print("6. Successfully hooked checkEndOfBattleEffects into executePlayerAttack!")
else:
    print("6. executePlayerAttack direct hit target not found")

# 7. Hook checkEndOfBattleEffects into runAiAttackStep (direct hit)
target_ai_attack_hit = """        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.player.life > 0) {
          checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
          // Expectimax check for remaining ready attackers
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= aggroThreshold);
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeTimeout(endTurn, 900);
          }
        }"""

repl_ai_attack_hit = """        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();

        if (DuelState.player.life > 0) {
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
              finishAiTurn();
            });
          } else {
            finishAiTurn();
          }
        }"""

if target_ai_attack_hit in code:
    code = code.replace(target_ai_attack_hit, repl_ai_attack_hit, 1)
    print("7. Successfully hooked checkEndOfBattleEffects into runAiAttackStep!")
else:
    print("7. runAiAttackStep target not found")

# 8. Hook checkEndOfBattleEffects into takeLifeDamage
target_take_life = """    DuelState.combatEvent = null;
    renderDuelTable();
    checkGameOver();

    if (DuelState.player.life > 0) {
      checkBurstTrigger('player', 'AFTER_LIFE_DECREASED');
      if (DuelState.activePlayer === 'opponent') {
        const profile = getActiveAiProfile('opponent');
        const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
        const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
        if (viable.length > 0) {
          safeTimeout(runAiAttackStep, 1000);
        } else {
          safeTimeout(endTurn, 900);
        }
      } else {
        safeTimeout(endTurn, 900);
      }
    }"""

repl_take_life = """    DuelState.combatEvent = null;
    renderDuelTable();
    checkGameOver();

    if (DuelState.player.life > 0) {
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
            safeTimeout(endTurn, 900);
          }
        } else {
          safeTimeout(endTurn, 900);
        }
      };

      if (isAttackerAlive) {
        checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
          continueOpponent();
        });
      } else {
        continueOpponent();
      }
    }"""

if target_take_life in code:
    code = code.replace(target_take_life, repl_take_life, 1)
    print("8. Successfully hooked checkEndOfBattleEffects into takeLifeDamage!")
else:
    print("8. takeLifeDamage target not found")

# 9. In chooseBlocker, clean up redundant timer conflict with resolveClash
target_choose_blocker_timer = """    setTimeout(() => {
      resolveClash(attacker, blocker, 'opponent', 'player');
      if (DuelState.player.life > 0 && DuelState.opponent.life > 0 && DuelState.activePlayer === 'opponent') {
        const profile = getActiveAiProfile('opponent');
        const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
        const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
        if (viable.length > 0) {
          safeTimeout(runAiAttackStep, 1100);
        } else {
          safeTimeout(endTurn, 1000);
        }
      } else {
        safeTimeout(endTurn, 1400);
      }
    }, 900);"""

repl_choose_blocker_timer = """    setTimeout(() => {
      resolveClash(attacker, blocker, 'opponent', 'player');
    }, 900);"""

if target_choose_blocker_timer in code:
    code = code.replace(target_choose_blocker_timer, repl_choose_blocker_timer, 1)
    print("9. Cleaned chooseBlocker clash timer dispatch!")
else:
    print("9. chooseBlocker timer target not found")

# 10. Add checkEndOfBattleEffects and Burst Discard modal functions before export
end_of_battle_functions = """
  // ── UNIVERSAL END OF BATTLE RESOLUTION ──
  function checkEndOfBattleEffects(spirits, attSide, defSide, onComplete) {
    if (!spirits || !spirits.length) {
      if (onComplete) onComplete();
      return;
    }

    const queue = [...spirits];

    function processNext() {
      if (!queue.length) {
        if (onComplete) onComplete();
        return;
      }

      const spirit = queue.shift();
      const isPlayer = (DuelState.player.field || []).some(s => s.uid === spirit.uid);
      const isOpponent = (DuelState.opponent.field || []).some(s => s.uid === spirit.uid);
      if (!isPlayer && !isOpponent) {
        processNext();
        return;
      }

      const side = isPlayer ? 'player' : 'opponent';
      const eff = spirit.effect || '';
      const effLower = eff.toLowerCase();

      if (!effLower.includes('end of battle') && !effLower.includes('when battles')) {
        processNext();
        return;
      }

      const blocks = getCardAbilityBlocks(eff);
      const battleBlocks = blocks.filter(b => 
        /\\(When Battles(?:[^)]*)\\)/i.test(b) || 
        /At the end of battle/i.test(b)
      );

      if (!battleBlocks.length) {
        processNext();
        return;
      }

      let handledAsync = false;

      for (const b of battleBlocks) {
        const lvlMatch = b.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
        const levelTag = lvlMatch ? lvlMatch[1] : '';
        if (!isEffectLevelMet(levelTag, spirit.currentLevel)) continue;

        const bLower = b.toLowerCase();

        // 1. By discarding one of your Bursts, refresh this Spirit
        if (/discarding\\s+(?:one\\s+of\\s+your\\s+bursts|your\\s+set\\s+burst|a\\s+burst).*?refresh\\s+this\\s+spirit/i.test(bLower) ||
            /discard.*burst.*refresh/i.test(bLower)) {
          
          const setBurst = DuelState[side].burst;
          const hand = DuelState[side].hand || [];
          const handBursts = hand.filter(c => c && c.effect && c.effect.includes('[Burst:'));

          const totalBursts = [];
          if (setBurst) {
            totalBursts.push({ source: 'set', card: setBurst, label: `🔒 Set Burst: ${setBurst.name} (Cost ${setBurst.cost || 0})` });
          }
          for (const hb of handBursts) {
            totalBursts.push({ source: 'hand', card: hb, label: `🎴 Hand Burst: ${hb.name} (Cost ${hb.cost || 0})` });
          }

          if (totalBursts.length > 0 && spirit.isExhausted) {
            if (side === 'player' && !DuelState.autoPlay) {
              handledAsync = true;
              openBurstDiscardModal(spirit, totalBursts, (chosenOpt) => {
                executeBurstDiscardRefresh(spirit, chosenOpt, 'player');
                processNext();
              }, () => {
                addLog(`ℹ️ **[WHEN BATTLES: ${spirit.name}]**: Chose not to discard a Burst. Spirit remains exhausted.`, 'step');
                processNext();
              });
              return; // Halt sync loop until player responds
            } else {
              // AI or Auto-play picks first available Burst
              const chosen = totalBursts[0];
              executeBurstDiscardRefresh(spirit, chosen, side);
            }
          }
        }

        // 2. Unconditional end of battle refresh
        else if (/at the end of battle.*?this spirit refreshes/i.test(bLower)) {
          if (spirit.isExhausted) {
            spirit.isExhausted = false;
            spirit.hasAttacked = false;
            AudioFX.summon();
            addLog(`🔄 **[END OF BATTLE: ${spirit.name}]**: Refreshed to Ready stance!`, 'magic');
            if (side === 'player' && typeof showToast === 'function') {
              showToast(`🔄 [${spirit.name}]: Refreshed at end of battle!`, 'success');
            }
          }
        }

        // 3. Life reduction at end of battle
        else if (/at the end of battle.*?send\\s+(?:an?|one|\\d+)?\\s*opposing\\s+life\\s+to\\s+the\\s+reserve/i.test(bLower)) {
          const enemySide = side === 'player' ? 'opponent' : 'player';
          if (DuelState[enemySide].life > 0) {
            DuelState[enemySide].life = Math.max(0, DuelState[enemySide].life - 1);
            DuelState[enemySide].reserve += 1;
            AudioFX.lifeDamage();
            addLog(`💥 **[END OF BATTLE: ${spirit.name}]**: Drained 1 opposing Life to Reserve! (${enemySide === 'player' ? 'Player' : 'Opponent'} Life: ${DuelState[enemySide].life})`, 'damage');
            checkGameOver();
          }
        }

        // 4. Life recovery at end of battle
        else if (/at the end of battle.*?put\\s+a\\s+core\\s+from\\s+the\\s+void\\s+to\\s+your\\s+life/i.test(bLower)) {
          if (DuelState[side].life < 5) {
            DuelState[side].life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[END OF BATTLE: ${spirit.name}]**: Restored +1 Life from Void! (Life: ${DuelState[side].life})`, 'magic');
            if (side === 'player' && typeof showToast === 'function') {
              showToast(`✨ [${spirit.name}]: +1 Life from Void!`, 'success');
            }
          }
        }

        // 5. General abilities
        else {
          executeAbilityActions(b, spirit, side, 'END_OF_BATTLE');
        }
      }

      if (!handledAsync) {
        processNext();
      }
    }

    processNext();
  }

  function executeBurstDiscardRefresh(spirit, chosenOpt, side) {
    const isPlayer = side === 'player';
    const card = chosenOpt.card;

    if (chosenOpt.source === 'set') {
      DuelState[side].burst = null;
      sendToTrash(card, side, `Discarded from Burst Zone for [When Battles] of ${spirit.name}`);
      renderBurstZones();
    } else if (chosenOpt.source === 'hand') {
      const hand = DuelState[side].hand || [];
      const idx = hand.findIndex(c => c.uid === card.uid);
      if (idx !== -1) hand.splice(idx, 1);
      sendToTrash(card, side, `Discarded from Hand for [When Battles] of ${spirit.name}`);
      if (isPlayer) renderPlayerHand();
    }

    spirit.isExhausted = false;
    spirit.hasAttacked = false;
    AudioFX.burstIgnite();
    addLog(`⚔️ **[WHEN BATTLES: ${spirit.name}]**: Discarded Burst "${card.name}" to refresh this Spirit! Ready for combat!`, 'magic');
    if (isPlayer && typeof showToast === 'function') {
      showToast(`⚔️ [${spirit.name}]: Discarded Burst "${card.name}" and Refreshed!`, 'success');
    }
    renderDuelTable();
  }

  let pendingBurstDiscardState = null;

  function openBurstDiscardModal(spirit, options, onConfirm, onDecline) {
    pendingBurstDiscardState = { spirit, options, onConfirm, onDecline };
    const modal = document.getElementById('battleBurstDiscardModal');
    if (!modal) {
      if (onConfirm && options.length > 0) onConfirm(options[0]);
      return;
    }

    const titleEl = document.getElementById('burstDiscardTitle');
    const descEl = document.getElementById('burstDiscardDesc');
    const optsEl = document.getElementById('burstDiscardOptions');

    if (titleEl) titleEl.textContent = `⚔️ Trigger [When Battles] for "${spirit.name}"?`;
    if (descEl) {
      descEl.innerHTML = `At the end of battle, by discarding one of your Bursts, refresh <strong>"${spirit.name}"</strong>. Select an available Burst card to discard:`;
    }

    if (optsEl) {
      optsEl.innerHTML = options.map((opt, i) => `
        <button class="burst-discard-opt" onclick="BattleArena.confirmBurstDiscard(${i})">
          <div>
            <div class="burst-discard-opt-title">${opt.label}</div>
            <div class="burst-discard-opt-sub">${opt.source === 'set' ? 'Currently face-down in your Burst Zone' : 'In your hand'}</div>
          </div>
          <span style="font-size:1.1rem; color:#f97316;">🔥 Discard &amp; Refresh</span>
        </button>
      `).join('');
    }

    modal.classList.add('active');
  }

  function confirmBurstDiscard(index) {
    const state = pendingBurstDiscardState;
    closeBurstDiscardModal();
    if (state && state.options[index] && state.onConfirm) {
      state.onConfirm(state.options[index]);
    }
  }

  function declineBurstDiscard() {
    const state = pendingBurstDiscardState;
    closeBurstDiscardModal();
    if (state && state.onDecline) {
      state.onDecline();
    }
  }

  function closeBurstDiscardModal() {
    pendingBurstDiscardState = null;
    const modal = document.getElementById('battleBurstDiscardModal');
    if (modal) modal.classList.remove('active');
  }
"""

# Insert before `window.BattleArena = {`
target_export = "  window.BattleArena = {"
if target_export in code:
    code = code.replace(target_export, end_of_battle_functions + "\n" + target_export, 1)
    print("10. Successfully added end-of-battle and burst discard modal functions!")
else:
    print("10. export target not found")

# 11. Add new functions to window.BattleArena export
target_export_end = """    grantExtraSymbols
};"""

repl_export_end = """    grantExtraSymbols,
    checkAfterBurstEffects,
    checkEndOfBattleEffects,
    openBurstDiscardModal,
    confirmBurstDiscard,
    declineBurstDiscard,
    closeBurstDiscardModal,
    executeBurstDiscardRefresh
};"""

if target_export_end in code:
    code = code.replace(target_export_end, repl_export_end, 1)
    print("11. Successfully updated window.BattleArena export!")
else:
    print("11. export end target not found")

with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
    f.write(code)

print("battle_arena.js updated successfully!")
