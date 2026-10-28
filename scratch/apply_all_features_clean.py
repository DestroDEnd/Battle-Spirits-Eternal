import sys

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update initial DuelState object (player & opponent)
ds_player_old = """      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve', // 'reserve' | 'field' | 'trash' | 'void'"""
ds_player_new = """      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve', // 'reserve' | 'field' | 'trash' | 'void'"""
assert ds_player_old in code, "ds_player_old not found"
code = code.replace(ds_player_old, ds_player_new, 1)

ds_opp_old = """      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,"""
ds_opp_new = """      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,"""
assert ds_opp_old in code, "ds_opp_old not found"
code = code.replace(ds_opp_old, ds_opp_new, 1)

# 2. Update executeStartDuel reset objects
start_player_old = """      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledP,"""
start_player_new = """      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledP,"""
assert start_player_old in code, "start_player_old not found"
code = code.replace(start_player_old, start_player_new, 1)

start_opp_old = """      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledO,"""
start_opp_new = """      trashCards: [],
      voidCards: [],
      nexus: [],
      nexusCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledO,"""
assert start_opp_old in code, "start_opp_old not found"
code = code.replace(start_opp_old, start_opp_new, 1)

# 3. Enhance parseLevels for Nexus (0 BP)
parselevels_old = """  function parseLevels(levelsStr) {
    if (!levelsStr || typeof levelsStr !== 'string') {
      return [{ level: 1, cores: 1, bp: 2000 }];
    }
    const results = [];
    const re = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?,\\s*(\\d+)\\s*BP/gi;
    let m;
    while ((m = re.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: parseInt(m[3], 10)
      });
    }
    return results.length ? results : [{ level: 1, cores: 1, bp: 2000 }];
  }"""

parselevels_new = """  function parseLevels(levelsStr) {
    if (!levelsStr || typeof levelsStr !== 'string') {
      return [{ level: 1, cores: 1, bp: 2000 }];
    }
    const results = [];
    const re = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?,\\s*(\\d+)\\s*BP/gi;
    let m;
    while ((m = re.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: parseInt(m[3], 10)
      });
    }
    if (results.length) return results;

    const reNoBp = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?/gi;
    while ((m = reNoBp.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: 0
      });
    }
    return results.length ? results : [{ level: 1, cores: 0, bp: 0 }];
  }"""
assert parselevels_old in code, "parselevels_old not found"
code = code.replace(parselevels_old, parselevels_new, 1)

# 4. Enhance calculateBpAndLevel to preserve 0 BP
calcbp_old = "    let bp = (best && best.bp) ? best.bp : 2000;"
calcbp_new = "    let bp = (best && best.bp !== undefined) ? best.bp : 2000;"
assert calcbp_old in code, "calcbp_old not found"
code = code.replace(calcbp_old, calcbp_new, 1)

# 5. Add safeEndOpponentTurn and update AI Watchdog
watchdog_old = """  // ── AI TURN WATCHDOG (Prevents Opponent Hangs/Freezes) ──
  let aiWatchdogTimer = null;
  function resetAiWatchdog() {
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
    if (DuelState.activePlayer === 'opponent') {
      const stepAtCheck = DuelState.phaseIndex;
      const turnAtCheck = DuelState.turn;
      aiWatchdogTimer = setTimeout(() => {
        if (DuelState.activePlayer === 'opponent' && DuelState.turn === turnAtCheck && DuelState.phaseIndex === stepAtCheck) {
          console.warn(`[AI Watchdog] Opponent AI delayed at phase ${DuelState.phases[stepAtCheck]} (Turn ${turnAtCheck}). Resuming flow...`);
          if (stepAtCheck >= 5) {
            endTurn();
          } else {
            DuelState.phaseIndex = Math.min(6, stepAtCheck + 1);
            renderDuelTable();
            safeTimeout(advanceOpponentStep, 400);
          }
        }
      }, 4000);
    }
  }"""

watchdog_new = """  // ── SAFE END OPPONENT TURN HELPER (Guarantees turn is NEVER ended on player's behalf) ──
  function safeEndOpponentTurn(delay = 800) {
    safeTimeout(() => {
      if (DuelState.activePlayer === 'opponent') {
        endTurn();
      }
    }, delay);
  }

  // ── AI TURN WATCHDOG (Prevents Opponent Hangs/Freezes without interrupting player) ──
  let aiWatchdogTimer = null;
  function resetAiWatchdog() {
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
    if (DuelState.activePlayer === 'opponent') {
      const stepAtCheck = DuelState.phaseIndex;
      const turnAtCheck = DuelState.turn;
      aiWatchdogTimer = setTimeout(() => {
        if (DuelState.activePlayer === 'opponent' && DuelState.turn === turnAtCheck && DuelState.phaseIndex === stepAtCheck) {
          const hasModal = typeof document !== 'undefined' && document.querySelector && 
            (document.querySelector('.battle-modal-overlay.active, .battle-modal-overlay[style*="display: flex"]') ||
             document.getElementById('battleBlockModal')?.classList.contains('active') ||
             document.getElementById('battleBurstPromptModal')?.classList.contains('active'));
          if (hasModal || DuelState.combatEvent || DuelState.activeBurstTrigger) {
            resetAiWatchdog();
            return;
          }
          console.warn(`[AI Watchdog] Opponent AI delayed at phase ${DuelState.phases[stepAtCheck]} (Turn ${turnAtCheck}). Resuming flow...`);
          if (stepAtCheck >= 5) {
            safeEndOpponentTurn(200);
          } else {
            DuelState.phaseIndex = Math.min(6, stepAtCheck + 1);
            renderDuelTable();
            safeTimeout(advanceOpponentStep, 400);
          }
        }
      }, 12000);
    }
  }"""
assert watchdog_old in code, "watchdog_old not found"
code = code.replace(watchdog_old, watchdog_new, 1)

# 6. Fix continueOpponent callback in takeLifeDamage
continue_old = """      const continueOpponent = () => {
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
      };"""

continue_new = """      const continueOpponent = () => {
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
      };"""
assert continue_old in code, "continue_old not found"
code = code.replace(continue_old, continue_new, 1)

# 7. Update renderPlayerHand for Nexus
old_hand_type = """      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isSpirit = card.type === 'Spirit';
      const isMagic = card.type === 'Magic';
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;"""

new_hand_type = """      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;"""
assert old_hand_type in code, "old_hand_type not found"
code = code.replace(old_hand_type, new_hand_type, 1)

old_hand_btns = """      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost})</button>`;
        }
      }"""

new_hand_btns = """      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost})</button>`;
        }
      } else if (canPlayStep && isNexus) {
        const btnLabel = isAttackStep ? '🏛️ Flash Deploy' : '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${btnLabel} (${cost})</button>`;
        }
      }"""
assert old_hand_btns in code, "old_hand_btns not found"
code = code.replace(old_hand_btns, new_hand_btns, 1)

# 8. Update renderCardInspector for Nexus
old_insp_type = """    const isSpirit = card.type === 'Spirit';
    const isMagic = card.type === 'Magic';
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;"""

new_insp_type = """    const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;"""
assert old_insp_type in code, "old_insp_type not found"
code = code.replace(old_insp_type, new_insp_type, 1)

old_insp_btns = """      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `✨ Flash Cast (${cost})` : `✨ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      }"""

new_insp_btns = """      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `✨ Flash Cast (${cost})` : `✨ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      } else if (canPlayStep && isNexus) {
        const btnText = (phase === 'ATTACK') ? `🏛️ Flash Deploy Nexus (${cost})` : `🏛️ Deploy Nexus (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="BattleArena.deployNexus('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Deploy (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      }"""
assert old_insp_btns in code, "old_insp_btns not found"
code = code.replace(old_insp_btns, new_insp_btns, 1)

# 9. Add deployNexus, addCoreToNexus, removeCoreFromNexus, executeWhenDeployedEffects
nexus_engine_code = """
  // ── NEXUS MANAGEMENT ENGINE (Center Field Zone & Cores) ──
  function deployNexus(uid, customCoresToPlace = 0) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot deploy during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Nexuses can only be deployed during MAIN step!", 'warning');
      return;
    }
    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Cannot deploy "${card.name}" during Attack Step without [Flash] timing!`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;

    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost}), but only have ${total} available across Reserve and Field.`, 'warning');
      return;
    }

    // Direct deploy from Reserve
    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    DuelState.player.hand.splice(cardIdx, 1);

    if (!DuelState.player.nexus) DuelState.player.nexus = [];
    DuelState.player.nexusCards = DuelState.player.nexus;

    card.currentCores = coresOnNexus;
    const pLevels = card.levels || parseLevels(card.levels || card.raw_levels);
    card.levels = pLevels;
    const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
    card.currentLevel = (coresOnNexus >= lv2req) ? 2 : 1;
    card.isExhausted = false;

    DuelState.player.nexus.push(card);
    DuelState.selectedPlayerCard = null;

    AudioFX.summon();
    addLog(`🏛️ **DEPLOYED**: Nexus "${card.name}" placed in the Center Field Nexus Zone! Paid ${cost} cores (Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    if (typeof showToast === 'function') {
      showToast(`🏛️ Deployed Nexus: ${card.name}!`, 'success');
    }

    executeWhenDeployedEffects(card, 'player');
    renderDuelTable();
  }

  function addCoreToNexus(uid) {
    if (DuelState.activePlayer !== 'player') return;
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be reallocated during the MAIN step!", 'warning');
      return;
    }
    const card = (DuelState.player.nexus || []).find(n => n.uid === uid);
    if (!card) return;
    if (DuelState.player.reserve < 1) {
      showToast("No cores available in Reserve to move to this Nexus!", 'warning');
      return;
    }
    DuelState.player.reserve -= 1;
    card.currentCores = (card.currentCores || 0) + 1;
    const lv2req = (card.levels && card.levels[1] && card.levels[1].cores !== undefined) ? card.levels[1].cores : 999;
    card.currentLevel = (card.currentCores >= lv2req) ? 2 : 1;
    AudioFX.coreChime();
    addLog(`🔮 **CORE ALLOCATED**: Moved 1 Core from Reserve to Nexus "${card.name}" (Now Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }

  function removeCoreFromNexus(uid) {
    if (DuelState.activePlayer !== 'player') return;
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be reallocated during the MAIN step!", 'warning');
      return;
    }
    const card = (DuelState.player.nexus || []).find(n => n.uid === uid);
    if (!card) return;
    if ((card.currentCores || 0) <= 0) {
      showToast("No cores on this Nexus to remove!", 'warning');
      return;
    }
    card.currentCores = Math.max(0, card.currentCores - 1);
    DuelState.player.reserve += 1;
    const lv2req = (card.levels && card.levels[1] && card.levels[1].cores !== undefined) ? card.levels[1].cores : 999;
    card.currentLevel = (card.currentCores >= lv2req) ? 2 : 1;
    AudioFX.coreChime();
    addLog(`🔮 **CORE RETRIEVED**: Returned 1 Core from Nexus "${card.name}" to Reserve (Now Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');
    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }

  function executeWhenDeployedEffects(nexusCard, side = 'player') {
    if (!nexusCard || !nexusCard.effect) return;
    const eff = nexusCard.effect;
    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;

    if (/when deployed/i.test(eff)) {
      const coreMatch = eff.match(/place\\s+(\\d+|a|an|one|two)\\s+cores?\\s+from\\s+(?:the\\s+)?(void|trash)\\s+(?:onto|to)\\s+(?:this\\s+nexus|your\\s+reserve)/i);
      if (coreMatch) {
        const count = parseWordNumber(coreMatch[1]);
        if (/this nexus/i.test(coreMatch[0])) {
          nexusCard.currentCores = (nexusCard.currentCores || 0) + count;
          addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Placed ${count} Core from Void onto this Nexus!`, 'step');
        } else {
          sideState.reserve += count;
          addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Placed ${count} Core from Void into Reserve!`, 'step');
        }
        AudioFX.coreChime();
      }

      if (/draw\\s+(\\d+|a|an|one|two)\\s+cards?/i.test(eff)) {
        const m = eff.match(/draw\\s+(\\d+|a|an|one|two)\\s+cards?/i);
        const count = parseWordNumber(m[1]);
        for (let i = 0; i < count; i++) {
          const c = sideState.deck.shift();
          if (c) {
            sideState.hand.push(c);
            addLog(`✨ **[WHEN DEPLOYED: ${nexusCard.name}]**: Drew "${c.name}" from deck!`, 'magic');
          }
        }
        AudioFX.magic();
      }

      if (/destroy\\s+(?:an|one|\\d+)?\\s*opposing\\s+spirit/i.test(eff)) {
        if (enemyState.field && enemyState.field.length > 0) {
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          sendToTrash(popped, enemySide, `Destroyed by ${nexusCard.name}`);
          AudioFX.destroy();
          addLog(`💥 **[WHEN DEPLOYED: ${nexusCard.name}]**: Obliterated opposing "${popped.name}"!`, 'damage');
        }
      }
    }

    if (typeof executeUniversalCardEffect === 'function') {
      executeUniversalCardEffect(nexusCard, side, 'WHEN_DEPLOYED');
    }
  }
"""

summon_card_end = "    executeWhenSummonedEffects(card, 'player');\n    renderDuelTable();\n  }"
assert summon_card_end in code, "summon_card_end not found"
code = code.replace(summon_card_end, summon_card_end + "\n" + nexus_engine_code, 1)

# 10. Update renderDuelTable to render center Nexus Zone
rendertable_anchor = "    // Phase Indicator\n    const currentPhase = DuelState.phases[DuelState.phaseIndex];"
rendertable_nexus = """    // Render Center Nexus Zone (Field Hub)
    const nexusZoneContent = document.getElementById('battleNexusZoneContent');
    const pNexusBadge = document.getElementById('playerNexusCountBadge');
    const pNexuses = DuelState.player.nexus || [];
    const oNexuses = DuelState.opponent.nexus || [];

    if (pNexusBadge) {
      pNexusBadge.textContent = `${pNexuses.length} Active`;
    }

    if (nexusZoneContent) {
      if (pNexuses.length === 0) {
        nexusZoneContent.innerHTML = `
          <div class="bnz-empty-state">
            <span class="bnz-empty-icon">🏛️</span>
            <span class="bnz-empty-text">No Nexuses on Field</span>
            <span class="bnz-empty-hint">Click to inspect Nexus Zone</span>
          </div>
        `;
      } else {
        nexusZoneContent.innerHTML = pNexuses.map(n => `
          <div class="bnz-nexus-mini" onclick="event.stopPropagation(); BattleArena.openZoneModal('player-nexus');" title="${n.name} (Lv${n.currentLevel || 1} • ${n.currentCores || 0} Cores) - Click to inspect">
            <img src="${n.image_url || '/placeholder.png'}" class="bnz-card-thumb" alt="${n.name}" onerror="this.src='/placeholder.png';">
            <div class="bnz-nexus-info">
              <span class="bnz-nexus-name">${n.name}</span>
              <div class="bnz-nexus-stats">
                <span>LV${n.currentLevel || 1}</span>
                <span>🔮 ${n.currentCores || 0}c</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Phase Indicator
    const currentPhase = DuelState.phases[DuelState.phaseIndex];"""
assert rendertable_anchor in code, "rendertable_anchor not found"
code = code.replace(rendertable_anchor, rendertable_nexus, 1)

# 11. Add viewBoardAsIs and reopenResultModal
viewboard_code = """
  // ── VIEW BOARD AS IS (Inspect field after match end) ──
  function viewBoardAsIs() {
    const modal = document.getElementById('battleResultModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    const bar = document.getElementById('matchFinishedBar');
    if (bar) bar.style.display = 'flex';
    if (typeof showToast === 'function') {
      showToast('Inspecting final board state. Click "Show Results" or "Rematch" when done.', 'info');
    }
  }

  function reopenResultModal() {
    const modal = document.getElementById('battleResultModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }
    const bar = document.getElementById('matchFinishedBar');
    if (bar) bar.style.display = 'none';
  }
"""

close_result_anchor = "  function closeResultModal() {\n    clearAllTimers();\n    const modal = document.getElementById('battleResultModal');\n    if (modal) modal.classList.remove('active');\n    DuelState.inDuel = false;\n    renderArenaLobby();\n  }"
assert close_result_anchor in code, "close_result_anchor not found"
code = code.replace(close_result_anchor, close_result_anchor + "\n" + viewboard_code, 1)

# 12. Update renderZoneModal to support player-nexus and opponent-nexus
zone_modal_anchor = "    // Update tab count badges\n    const pCountEl = document.getElementById('tabCountPlayerTrash');"
zone_modal_top_repl = """    // Update tab count badges
    const pNexuses = DuelState.player.nexus || [];
    const oNexuses = DuelState.opponent.nexus || [];
    const pNexCountEl = document.getElementById('tabCountPlayerNexus');
    if (pNexCountEl) pNexCountEl.textContent = pNexuses.length;
    const oNexCountEl = document.getElementById('tabCountOpponentNexus');
    if (oNexCountEl) oNexCountEl.textContent = oNexuses.length;

    const btnPN = document.getElementById('tabPlayerNexus');
    if (btnPN) btnPN.classList.toggle('active', tab === 'player-nexus');
    const btnON = document.getElementById('tabOpponentNexus');
    if (btnON) btnON.classList.toggle('active', tab === 'opponent-nexus');

    const pCountEl = document.getElementById('tabCountPlayerTrash');"""
assert zone_modal_anchor in code, "zone_modal_anchor not found"
code = code.replace(zone_modal_anchor, zone_modal_top_repl, 1)

zone_tab_end_anchor = "      bodyEl.innerHTML = voidHtml;\n    }"
zone_tab_nexus_repl = """      bodyEl.innerHTML = voidHtml;\n    } else if (tab === 'player-nexus') {
      if (titleEl) titleEl.textContent = '🏛️ Your Active Nexuses';
      if (subEl) subEl.textContent = `Continuous field facilities providing persistent symbols and effects (${pNexuses.length} Active Nexus${pNexuses.length === 1 ? '' : 'es'})`;
      if (!pNexuses.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🏛️</div>
            <div class="zone-empty-text">No Nexuses Deployed</div>
            <div class="zone-empty-subtext">Deploy Nexus cards from your hand during the Main Step to activate ongoing abilities and establish continuous battle presence.</div>
          </div>
        `;
      } else {
        const isMain = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pNexuses.map(n => `
              <div class="zone-card-item" style="border:1.5px solid #38bdf8;">
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')">${n.name}</div>
                  <div class="zone-card-sub">
                    <span style="color:#38bdf8;font-weight:700;">LV${n.currentLevel || 1}</span>
                    <span>Cost ${n.cost ?? 0}</span>
                    <span style="color:#bae6fd;">🔮 ${n.currentCores || 0} Core${n.currentCores === 1 ? '' : 's'}</span>
                  </div>
                  <div style="font-size:0.75rem; color:#cbd5e1; margin-top:0.35rem; line-height:1.3;">
                    ${formatEffectKeywords(n.effect || n.summary || '')}
                  </div>
                  ${isMain ? `
                    <div style="display:flex; gap:0.4rem; margin-top:0.5rem;">
                      <button class="btn-duel-tool" style="padding:0.25rem 0.6rem; font-size:0.7rem;" onclick="event.stopPropagation(); BattleArena.addCoreToNexus('${n.uid}')">+1 Core</button>
                      <button class="btn-duel-tool" style="padding:0.25rem 0.6rem; font-size:0.7rem;" onclick="event.stopPropagation(); BattleArena.removeCoreFromNexus('${n.uid}')">-1 Core</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'opponent-nexus') {
      if (titleEl) titleEl.textContent = `🏛️ Opponent's Active Nexuses`;
      if (subEl) subEl.textContent = `Opponent's continuous field cards (${oNexuses.length} Active Nexus${oNexuses.length === 1 ? '' : 'es'})`;
      if (!oNexuses.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🏛️</div>
            <div class="zone-empty-text">Opponent Has No Nexuses Deployed</div>
            <div class="zone-empty-subtext">The opponent has not placed any Nexus structures on the battlefield.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${oNexuses.map(n => `
              <div class="zone-card-item" style="border:1.5px solid #c084fc;">
                <img src="${n.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${n.name}" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(n.name)}')">${n.name}</div>
                  <div class="zone-card-sub">
                    <span style="color:#c084fc;font-weight:700;">LV${n.currentLevel || 1}</span>
                    <span>Cost ${n.cost ?? 0}</span>
                    <span style="color:#e9d5ff;">🔮 ${n.currentCores || 0} Core${n.currentCores === 1 ? '' : 's'}</span>
                  </div>
                  <div style="font-size:0.75rem; color:#cbd5e1; margin-top:0.35rem; line-height:1.3;">
                    ${formatEffectKeywords(n.effect || n.summary || '')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }"""
assert zone_tab_end_anchor in code, "zone_tab_end_anchor not found"
code = code.replace(zone_tab_end_anchor, zone_tab_nexus_repl, 1)

# 13. Universal NLP Card Effect Engine
universal_nlp_engine = """
  // ── UNIVERSAL NLP CARD EFFECT EXECUTION ENGINE (14,529 CARDS DATABASE) ──
  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function') {
      try {
        const res = await fetch('/api/card-effects-db');
        if (res.ok) {
          CardEffectsDB = await res.json();
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to fetch /api/card-effects-db:', e);
      }
    }
  }

  function executeUniversalCardEffect(card, side, trigger, context = {}) {
    if (!card) return;
    const cardData = CardEffectsDB[card.name];
    if (!cardData || !cardData.triggers) return;

    const actions = cardData.triggers[trigger];
    if (!actions || !Array.isArray(actions) || !actions.length) return;

    const friendlyState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;
    const curLevel = card.currentLevel || 1;

    for (const act of actions) {
      if (act.min_level && curLevel < act.min_level) continue;

      const actType = act.type;
      if (actType === 'DRAW_CARDS') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          const drawn = friendlyState.deck.shift();
          if (drawn) {
            friendlyState.hand.push(drawn);
            if (side === 'player') {
              AudioFX.playTone(390, 'sine', 0.15, 0.08);
              addLog(`🎴 **[${card.name}]**: Channeled ability! Drew "${drawn.name}" into your hand.`, 'magic');
            }
          }
        }
      } else if (actType === 'CORE_BOOST') {
        const count = act.count || 1;
        const src = act.source || 'void';
        const dst = act.destination || 'reserve';
        if (dst === 'life') {
          if (friendlyState.life < 5) {
            friendlyState.life = Math.min(5, friendlyState.life + count);
            AudioFX.coreChime();
            addLog(`✨ **[${card.name}]**: Restored +${count} Life Core from the Void!`, 'magic');
          }
        } else if (dst === 'spirit' && card.uid) {
          card.currentCores = (card.currentCores || 1) + count;
          recalculateSpiritBp(card);
          AudioFX.coreChime();
          addLog(`🔮 **[${card.name}]**: Placed +${count} Core onto this Spirit (Total: ${card.currentCores}).`, 'step');
        } else {
          friendlyState.reserve += count;
          AudioFX.coreChime();
          addLog(`🔮 **[${card.name}]**: Added +${count} Core from ${src} to Reserve (Reserve: ${friendlyState.reserve}).`, 'step');
        }
      } else if (actType === 'CORE_DRAIN') {
        const count = act.count || 1;
        const dest = act.destination || 'reserve';
        const targetKind = act.target || 'spirit';
        if (targetKind === 'nexus' && enemyState.nexus && enemyState.nexus.length > 0) {
          const targetNex = enemyState.nexus.find(n => (n.currentCores || 0) >= 1) || enemyState.nexus[0];
          if (targetNex && targetNex.currentCores > 0) {
            const num = Math.min(count, targetNex.currentCores);
            targetNex.currentCores -= num;
            if (dest === 'reserve') enemyState.reserve += num;
            else if (dest === 'trash') enemyState.trash += num;
            addLog(`🔮 **[${card.name}]**: Sent ${num} Core from opposing Nexus "${targetNex.name}" to ${dest}!`, 'magic');
          }
        } else if (enemyState.field && enemyState.field.length > 0) {
          const targetSp = enemyState.field.find(s => (s.currentCores || 0) >= 1) || enemyState.field[0];
          if (targetSp && targetSp.currentCores > 0) {
            const num = Math.min(count, targetSp.currentCores);
            targetSp.currentCores -= num;
            if (dest === 'reserve') enemyState.reserve += num;
            else if (dest === 'trash') enemyState.trash += num;
            recalculateSpiritBp(targetSp);
            addLog(`🔮 **[${card.name}]**: Drained ${num} Core from opposing "${targetSp.name}" to ${dest}!`, 'magic');
            if (targetSp.currentCores <= 0) {
              const spIdx = enemyState.field.findIndex(s => s.uid === targetSp.uid);
              if (spIdx !== -1) {
                const depleted = enemyState.field.splice(spIdx, 1)[0];
                sendToTrash(depleted, enemySide, `Depleted by ${card.name}`);
                addLog(`💀 **DEPLETED**: Opposing "${depleted.name}" depleted of cores and sent to Trash!`, 'damage');
              }
            }
          }
        }
      } else if (actType === 'BP_BUFF') {
        const boost = act.amount || 1000;
        if (act.target === 'all') {
          for (const s of friendlyState.field || []) {
            s.battleBpBoost = (s.battleBpBoost || 0) + boost;
            s.battleBp = (s.baseBp || s.currentBp) + s.battleBpBoost;
            s.currentBp = s.battleBp;
          }
          addLog(`⚡ **[${card.name}]**: Granted +${boost} BP to all friendly Spirits!`, 'magic');
        } else {
          card.battleBpBoost = (card.battleBpBoost || 0) + boost;
          card.battleBp = (card.baseBp || card.currentBp) + card.battleBpBoost;
          card.currentBp = card.battleBp;
          addLog(`⚡ **[${card.name}]**: Powered up with +${boost} BP! (Current BP: ${card.currentBp})`, 'magic');
        }
      } else if (actType === 'DESTROY_SPIRIT_BP') {
        const maxBp = act.max_bp || 5000;
        const count = act.count || 1;
        let destroyed = 0;
        const victims = (enemyState.field || []).filter(s => (s.battleBp || s.currentBp || 0) <= maxBp);
        for (const vic of victims) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (${maxBp} BP or less)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Obliterated opposing "${popped.name}" (${popped.currentBp} BP <= ${maxBp} BP limit)!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_DIRECT') {
        const count = act.count || 1;
        const requireExhausted = act.require_exhausted || false;
        let destroyed = 0;
        const candidates = (enemyState.field || []).filter(s => !requireExhausted || s.isExhausted);
        for (const vic of candidates) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name}`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Destroyed opposing "${popped.name}"!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_NEXUS') {
        if (enemyState.nexus && enemyState.nexus.length > 0) {
          const popped = enemyState.nexus.shift();
          sendToTrash(popped, enemySide, `Nexus destroyed by ${card.name}`);
          AudioFX.destroy();
          addLog(`💥 **[${card.name}]**: Smashed opposing Nexus "${popped.name}"!`, 'damage');
        }
      } else if (actType === 'RETURN_TO_HAND') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          if (!enemyState.field || !enemyState.field.length) break;
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          enemyState.hand.push(popped);
          AudioFX.magic();
          addLog(`🍃 **[${card.name}]**: Bounced opposing "${popped.name}" back to opponent's Hand!`, 'magic');
        }
      } else if (actType === 'EXHAUST_ENEMY') {
        const count = act.count || 1;
        const readyEnemies = (enemyState.field || []).filter(s => !s.isExhausted);
        for (let i = 0; i < Math.min(count, readyEnemies.length); i++) {
          readyEnemies[i].isExhausted = true;
          AudioFX.slash();
          addLog(`💤 **[${card.name}]**: Forced opposing "${readyEnemies[i].name}" into Exhausted rest state!`, 'step');
        }
      } else if (actType === 'REFRESH_SELF') {
        card.isExhausted = false;
        AudioFX.shield();
        addLog(`🔄 **[${card.name}]**: Refreshed to Ready state!`, 'step');
      } else if (actType === 'REFRESH_ALLIES') {
        for (const s of friendlyState.field || []) {
          s.isExhausted = false;
        }
        AudioFX.shield();
        addLog(`🔄 **[${card.name}]**: Refreshed all friendly Spirits to Ready state!`, 'step');
      } else if (actType === 'LIFE_BURN') {
        if (enemyState.life > 0) {
          enemyState.life = Math.max(0, enemyState.life - 1);
          enemyState.reserve += 1;
          AudioFX.lifeDamage();
          addLog(`💥 **[${card.name}]**: Inflicted 1 direct Life Damage to opponent! (Opponent Life: ${enemyState.life})`, 'damage');
          checkGameOver();
        }
      } else if (actType === 'CANNOT_BE_BLOCKED') {
        card.cannotBeBlocked = true;
        addLog(`💨 **[${card.name}]**: Became Unblockable for this battle!`, 'step');
      }
    }
  }
"""

init_anchor = "  async function initBattleArena() {"
assert init_anchor in code, "init_anchor not found"
code = code.replace(init_anchor, universal_nlp_engine + "\n" + init_anchor, 1)

# Call loadCardEffectsDB inside initBattleArena
init_call_anchor = "    await loadTrainedAiWeights();"
assert init_call_anchor in code, "init_call_anchor not found"
code = code.replace(init_call_anchor, "    await loadTrainedAiWeights();\n    await loadCardEffectsDB();", 1)

# Hook into executeWhenSummonedEffects
summon_eff_anchor = "      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {\n        executeAbilityActions(b, spirit, side, 'SUMMON');\n      }\n    }"
assert summon_eff_anchor in code, "summon_eff_anchor not found"
summon_eff_repl = "      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {\n        executeAbilityActions(b, spirit, side, 'SUMMON');\n      }\n    }\n    executeUniversalCardEffect(spirit, side, 'WHEN_SUMMONED');"
code = code.replace(summon_eff_anchor, summon_eff_repl, 1)

# Hook into executeWhenAttacksEffects
attacks_eff_anchor = "  function executeWhenAttacksEffects(attacker, side = 'player') {\n    if (!attacker || !attacker.effect) return;"
assert attacks_eff_anchor in code, "attacks_eff_anchor not found"
attacks_eff_repl = "  function executeWhenAttacksEffects(attacker, side = 'player') {\n    if (!attacker || !attacker.effect) return;\n    executeUniversalCardEffect(attacker, side, 'WHEN_ATTACKS');"
code = code.replace(attacks_eff_anchor, attacks_eff_repl, 1)

# Hook into executeWhenAdventsEffects
advents_eff_anchor = "      if (isEffectLevelMet(levelTag, spirit.currentLevel || 1)) {\n        executeAbilityActions(b, spirit, side, 'ADVENT');\n      }\n    }"
assert advents_eff_anchor in code, "advents_eff_anchor not found"
advents_eff_repl = "      if (isEffectLevelMet(levelTag, spirit.currentLevel || 1)) {\n        executeAbilityActions(b, spirit, side, 'ADVENT');\n      }\n    }\n    executeUniversalCardEffect(spirit, side, 'WHEN_ADVENTS');"
code = code.replace(advents_eff_anchor, advents_eff_repl, 1)

# Hook into sendToTrash
trash_eff_anchor = "    if (!target.trashCards) target.trashCards = [];\n    card.graveyardReason = reason || 'Sent to Trash';"
assert trash_eff_anchor in code, "trash_eff_anchor not found"
trash_eff_repl = "    if (!target.trashCards) target.trashCards = [];\n    card.graveyardReason = reason || 'Sent to Trash';\n    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });"
code = code.replace(trash_eff_anchor, trash_eff_repl, 1)

# Hook into startDuel to reset matchFinishedBar
startduel_reset_anchor = "    clearAllTimers();"
assert startduel_reset_anchor in code, "startduel_reset_anchor not found"
startduel_reset_repl = """    clearAllTimers();
    const finishedBar = document.getElementById('matchFinishedBar');
    if (finishedBar) finishedBar.style.display = 'none';"""
code = code.replace(startduel_reset_anchor, startduel_reset_repl, 1)

# 14. Export all on BattleArena
export_anchor = "    getWhenBlocksBpBoost\n};"
assert export_anchor in code, "export_anchor not found"
export_repl = """    getWhenBlocksBpBoost,
    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    executeWhenDeployedEffects,
    viewBoardAsIs,
    reopenResultModal,
    executeUniversalCardEffect,
    CardEffectsDB,
    loadCardEffectsDB,
    safeEndOpponentTurn
};"""
code = code.replace(export_anchor, export_repl, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: All features cleanly applied to battle_arena.js!")
