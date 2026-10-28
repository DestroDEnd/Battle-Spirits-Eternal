import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update hasFlashTiming
old_has_flash = """  function hasFlashTiming(card) {
    if (!card || !card.effect) return false;
    const eff = card.effect.toLowerCase();
    return eff.includes('[flash]') || eff.includes('(flash)') || eff.includes('flash:') || eff.includes('flash -') || eff.includes('swift') || eff.includes('神速');
  }"""

new_has_flash = """  function hasFlashTiming(card) {
    if (!card || !card.effect) return false;
    const cardType = (card.type || '').toLowerCase();
    const eff = card.effect.toLowerCase();

    // 1. Nexuses NEVER have Flash timing to be deployed from Hand!
    // A Nexus can only be deployed during the MAIN step.
    // Any Flash effect on a Nexus (such as Grand Skill) is an ON-FIELD ability usable only when the Nexus is played on the field.
    if (cardType.includes('nexus')) {
      return false;
    }

    // 2. Spirits can only be summoned from Hand during Flash timing if they have Swift (神速) or an explicit Flash-summon ability
    if (cardType.includes('spirit')) {
      if (eff.includes('swift') || eff.includes('神速')) return true;
      if (/flash.*?(?:you can\\s+)?summon this (?:spirit\\s+)?card from (?:your\\s+)?hand/i.test(card.effect)) return true;
      return false;
    }

    // 3. Magic cards have Flash timing if they have [Flash], (Flash), Flash:, or Flash -
    if (cardType === 'magic') {
      return eff.includes('[flash]') || eff.includes('(flash)') || eff.includes('flash:') || eff.includes('flash -');
    }

    // 4. Braves / Ultimates
    if (eff.includes('swift') || eff.includes('神速')) return true;
    if (/flash.*?(?:you can\\s+)?summon this card from (?:your\\s+)?hand/i.test(card.effect)) return true;

    return false;
  }"""

assert old_has_flash in code, "old_has_flash not found"
code = code.replace(old_has_flash, new_has_flash, 1)

# 2. Update renderPlayerHand for Nexus: Nexuses can NEVER be deployed during the Attack Step!
old_hand_nexus = """      } else if (canPlayStep && isNexus) {
        const btnLabel = isAttackStep ? '🏛️ Flash Deploy' : '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${btnLabel} (${cost})</button>`;
        }
      }"""

new_hand_nexus = """      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${btnLabel} (${cost})</button>`;
        }
      }"""

assert old_hand_nexus in code, "old_hand_nexus not found"
code = code.replace(old_hand_nexus, new_hand_nexus, 1)

# 3. Update deployNexus step requirement: strictly MAIN step only!
old_deploy_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Nexuses can only be deployed during MAIN step!", 'warning');
      return;
    }
    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Cannot deploy "${card.name}" during Attack Step without [Flash] timing!`, 'warning');
      return;
    }"""

new_deploy_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast(`Official Rule: Nexuses can only be deployed during the Main Step! Flash effects on "${card.name}" can only be used once the Nexus is played on the field.`, 'warning');
      return;
    }"""

assert old_deploy_check in code, "old_deploy_check not found"
code = code.replace(old_deploy_check, new_deploy_check, 1)

# 4. Add Grand Skill and Core Charge engines
grand_skill_engine = """
  // ── GRAND SKILL & ON-FIELD NEXUS FLASH ENGINE ──
  function parseGrandSkill(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\\[Grand Skill:\\s*(\\d+)\\]\\s*(?:\\[LV\\d+\\]\\s*)*Flash(?:\\s*-\\s*\\(([^)]+)\\))?/i);
    if (!m) return null;
    const cost = parseInt(m[1], 10);
    const timing = m[2] ? m[2].trim().toLowerCase() : 'either';

    let timingLabel = 'Flash';
    let timingType = 'either';
    if (timing.includes('your turn') || timing.includes('your attack step')) {
      timingLabel = 'Your Turn Flash';
      timingType = 'your_turn';
    } else if (timing.includes('opposing') || timing.includes("opponent's")) {
      timingLabel = "Opponent's Turn Flash";
      timingType = 'opposing_turn';
    }

    return {
      cost,
      timingLabel,
      timingType,
      effectText: card.effect
    };
  }

  function canActivateGrandSkill(nexus, side = 'player') {
    if (!nexus) return { allowed: false, reason: 'No card' };
    const gs = parseGrandSkill(nexus);
    if (!gs) return { allowed: false, reason: 'No Grand Skill' };

    const isOurTurn = (DuelState.activePlayer === side);
    const phase = DuelState.phases[DuelState.phaseIndex];

    const currentCores = nexus.currentCores || 0;
    if (currentCores < gs.cost) {
      return { 
        allowed: false, 
        reason: `Need ${gs.cost} cores on ${nexus.name} (currently has ${currentCores})`,
        gs
      };
    }

    if (gs.timingType === 'your_turn' && !isOurTurn) {
      return { 
        allowed: false, 
        reason: `Grand Skill timing is [${gs.timingLabel}], but it is currently Opponent's Turn`,
        gs
      };
    }
    if (gs.timingType === 'opposing_turn' && isOurTurn) {
      return { 
        allowed: false, 
        reason: `Grand Skill timing is [${gs.timingLabel}], but it is currently Your Turn`,
        gs
      };
    }

    if (phase !== 'ATTACK' && phase !== 'MAIN') {
      return { 
        allowed: false, 
        reason: `Grand Skills can only activate during Main or Attack Step`,
        gs
      };
    }

    return { allowed: true, gs };
  }

  function activateGrandSkill(nexusUid, side = 'player') {
    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const enemyState = side === 'player' ? DuelState.opponent : DuelState.player;

    const nexus = (sideState.nexus || []).find(n => n.uid === nexusUid);
    if (!nexus) {
      if (typeof showToast === 'function') showToast("Nexus not found on field!", 'error');
      return;
    }

    const check = canActivateGrandSkill(nexus, side);
    if (!check.allowed) {
      if (typeof showToast === 'function') showToast(check.reason, 'warning');
      return;
    }

    const gs = check.gs;
    nexus.currentCores -= gs.cost;
    const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
    const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
    nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;

    AudioFX.burstIgnite ? AudioFX.burstIgnite() : AudioFX.coreChime();

    const effLower = nexus.effect.toLowerCase();
    if (effLower.includes('destroy an opposing exhausted spirit') || effLower.includes('destroy 1 opposing exhausted spirit') || effLower.includes('destroy an opposing spirit')) {
      const exhaustedEnemies = (enemyState.field || []).filter(s => s.isExhausted);
      const targetList = exhaustedEnemies.length > 0 ? exhaustedEnemies : (enemyState.field || []);

      if (targetList.length > 0) {
        targetList.sort((a, b) => (b.battleBp || b.currentBp || 0) - (a.battleBp || a.currentBp || 0));
        const victim = targetList[0];
        const vIdx = enemyState.field.findIndex(s => s.uid === victim.uid);
        if (vIdx !== -1) {
          const popped = enemyState.field.splice(vIdx, 1)[0];
          recycleSpiritCoresToReserve(popped, enemySide);
          sendToTrash(popped, enemySide, `Destroyed by ${nexus.name}'s [Grand Skill: ${gs.cost}]`);
          AudioFX.destroy();
          addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! Destroyed opposing exhausted Spirit "${popped.name}"!`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`⚡ [Grand Skill: ${gs.cost}]: Destroyed opposing "${popped.name}"!`, 'success');
          }
        }
      } else {
        addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! (No opposing exhausted spirits on field).`, 'magic');
      }
    } else {
      executeUniversalCardEffect(nexus, side, 'FLASH');
      addLog(`⚡🏛️ **[GRAND SKILL: ${gs.cost} ACTIVATED: ${nexus.name}]**: Sent ${gs.cost} Cores from Nexus to Void! Triggered Flash effect.`, 'magic');
    }

    renderDuelTable();
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }

    const blockModal = document.getElementById('battleBlockModal');
    if (blockModal && blockModal.classList.contains('active')) {
      const attacker = DuelState.selectedAttacker || (DuelState.opponent.field || [])[0];
      const readyBlockers = (DuelState.player.field || []).filter(s => !s.isExhausted);
      if (attacker) {
        showBlockPrompt(attacker, readyBlockers);
      }
    }
  }

  // ── CORE CHARGE ENGINE (Grandwalker Nexuses) ──
  function executeCoreCharge(nexus, side = 'player', trigger = 'DEPLOY', context = {}) {
    if (!nexus || !nexus.effect) return;
    const eff = nexus.effect;
    if (!eff.includes('[Core Charge:')) return;

    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;

    if (trigger === 'DEPLOY') {
      if (sideState.deck && sideState.deck.length > 0) {
        const milled = sideState.deck.splice(0, Math.min(3, sideState.deck.length));
        let chargedCores = 0;

        milled.forEach(c => {
          sendToTrash(c, side, `Milled for [Core Charge] by ${nexus.name}`);
          const cFam = (c.family || '').toLowerCase();
          const cName = (c.name || '').toLowerCase();
          const cost = c.cost || 0;

          const isMatch = cFam.includes('makai') || cFam.includes('ogre wizard') || cFam.includes('worldswalker') || cFam.includes('avatar') || cName.includes('makai') || cost >= 3 || c.type === 'Spirit' || c.type === 'Ultimate';
          if (isMatch) {
            chargedCores++;
          }
        });

        if (chargedCores > 0) {
          nexus.currentCores = (nexus.currentCores || 0) + chargedCores;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Sent 3 cards to Trash. Charged +${chargedCores} Core(s) from Void onto this Nexus! (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel})`, 'magic');
          if (side === 'player' && typeof showToast === 'function') {
            showToast(`✨ [Core Charge]: +${chargedCores} Core(s) onto ${nexus.name}!`, 'success');
          }
        }
      }
    } else if (trigger === 'SUMMON') {
      const summonedSpirit = context.spirit;
      if (summonedSpirit) {
        const sFam = (summonedSpirit.family || '').toLowerCase();
        const sName = (summonedSpirit.name || '').toLowerCase();
        const isMatch = sFam.includes('makai') || sFam.includes('ogre wizard') || sFam.includes('worldswalker') || sFam.includes('avatar') || sName.includes('makai') || (summonedSpirit.cost || 0) >= 3;
        if (isMatch) {
          nexus.currentCores = (nexus.currentCores || 0) + 1;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Channeled summon of "${summonedSpirit.name}"! Added +1 Core from Void onto this Nexus (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel}).`, 'magic');
        }
      }
    }
  }

  // ── GRAND FIELD PASSIVE TRIGGERS ──
  function checkGrandFieldOnOpponentExhaust(side = 'opponent') {
    const friendlySide = side === 'opponent' ? 'player' : 'opponent';
    const friendlyState = DuelState[friendlySide];
    if (!friendlyState || !friendlyState.nexus) return;

    for (const n of friendlyState.nexus) {
      if (!n || !n.effect) continue;
      // Suiren: [Grand Field] [LV2] (Opposing Turn) When an opposing Spirit/Ultimate is exhausted, you can draw a card.
      if (n.effect.includes('[Grand Field]') && (n.currentLevel || 1) >= 2) {
        if (/when an opposing spirit\/ultimate is exhausted.*?(?:you can\s+)?draw/i.test(n.effect)) {
          if (friendlyState.deck && friendlyState.deck.length > 0) {
            const drawn = friendlyState.deck.shift();
            if (drawn) {
              friendlyState.hand.push(drawn);
              AudioFX.magic();
              addLog(`✨🎴 **[GRAND FIELD: ${n.name}]**: Opposing Spirit was exhausted! Channeled sacred domain and drew "${drawn.name}"!`, 'magic');
              if (friendlySide === 'player' && typeof showToast === 'function') {
                showToast(`✨ [Grand Field]: Drew "${drawn.name}"!`, 'success');
              }
            }
          }
        }
      }
    }
  }
"""

anchor_after_deploy = "  function executeWhenDeployedEffects(nexusCard, side = 'player') {"
assert anchor_after_deploy in code, "anchor_after_deploy not found"
code = code.replace(anchor_after_deploy, grand_skill_engine + "\n" + anchor_after_deploy, 1)

# 5. Hook executeCoreCharge into executeWhenDeployedEffects
deploy_eff_anchor = "    if (typeof executeUniversalCardEffect === 'function') {\n      executeUniversalCardEffect(nexusCard, side, 'WHEN_DEPLOYED');\n    }"
deploy_eff_repl = """    executeCoreCharge(nexusCard, side, 'DEPLOY');
    if (typeof executeUniversalCardEffect === 'function') {
      executeUniversalCardEffect(nexusCard, side, 'WHEN_DEPLOYED');
    }"""
assert deploy_eff_anchor in code, "deploy_eff_anchor not found"
code = code.replace(deploy_eff_anchor, deploy_eff_repl, 1)

# 6. Hook executeCoreCharge into executeWhenSummonedEffects
summon_corecharge_anchor = "    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit });\n  }"
summon_corecharge_repl = """    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit });
    const sideNexuses = (side === 'player' ? DuelState.player.nexus : DuelState.opponent.nexus) || [];
    for (const n of sideNexuses) {
      executeCoreCharge(n, side, 'SUMMON', { spirit });
    }
  }"""
assert summon_corecharge_anchor in code, "summon_corecharge_anchor not found"
code = code.replace(summon_corecharge_anchor, summon_corecharge_repl, 1)

# 7. Hook checkGrandFieldOnOpponentExhaust into runAiAttackStep
ai_exhaust_anchor = "    attacker.isExhausted = true;\n    attacker.hasAttacked = true;"
ai_exhaust_repl = """    attacker.isExhausted = true;
    attacker.hasAttacked = true;
    checkGrandFieldOnOpponentExhaust('opponent');"""
assert ai_exhaust_anchor in code, "ai_exhaust_anchor not found"
code = code.replace(ai_exhaust_anchor, ai_exhaust_repl, 1)

# 8. Update showBlockPrompt to render On-Field Nexus Flash abilities
block_prompt_anchor = "    // Identify playable Flash cards in hand (both Magic & Swift spirits)"
block_prompt_repl = """    // Identify playable on-field Nexuses with Grand Skill Flash
    const fieldFlashNexuses = (DuelState.player.nexus || []).filter(n => {
      const check = canActivateGrandSkill(n, 'player');
      return check.allowed;
    });

    // Identify playable Flash cards in hand (both Magic & Swift spirits)"""
assert block_prompt_anchor in code, "block_prompt_anchor not found"
code = code.replace(block_prompt_anchor, block_prompt_repl, 1)

flash_container_anchor = "            <div class=\"flash-spells-title\">⚡ FLASH TIMING WINDOW (Cast before blocking):</div>"
flash_container_repl = """            <div class=\"flash-spells-title\">⚡ FLASH TIMING WINDOW (Cast spells or activate on-field Grand Skills):</div>
            ${fieldFlashNexuses.map(n => {
              const gs = parseGrandSkill(n);
              return `
                <button class=\"flash-spell-btn flash-nexus-btn\" onclick=\"BattleArena.activateGrandSkill('${n.uid}')\" title=\"${n.effect}\">
                  <div class=\"fsb-left\">
                    <span class=\"fsb-name\">🏛️ ${n.name} [Grand Skill: ${gs ? gs.cost : 4}]</span>
                    <span class=\"fsb-desc\">Send ${gs ? gs.cost : 4} Cores from Nexus to Void → Destroy an opposing exhausted Spirit</span>
                  </div>
                  <span class=\"fsb-cost\">🔮 ${n.currentCores}c on Nexus</span>
                </button>
              `;
            }).join('')}"""
assert flash_container_anchor in code, "flash_container_anchor not found"
code = code.replace(flash_container_anchor, flash_container_repl, 1)

# 9. Update Center Nexus Zone rendering to display Grand Skill button if usable
center_nexus_anchor = """            <div class=\"bnz-nexus-info\">
              <span class=\"bnz-nexus-name\">${n.name}</span>
              <div class=\"bnz-nexus-stats\">
                <span>LV${n.currentLevel || 1}</span>
                <span>🔮 ${n.currentCores || 0}c</span>
              </div>
            </div>"""

center_nexus_repl = """            <div class=\"bnz-nexus-info\">
              <span class=\"bnz-nexus-name\">${n.name}</span>
              <div class=\"bnz-nexus-stats\">
                <span>LV${n.currentLevel || 1}</span>
                <span>🔮 ${n.currentCores || 0}c</span>
                ${(() => {
                  const check = canActivateGrandSkill(n, 'player');
                  if (check.allowed && check.gs) {
                    return `<button class=\"btn-grand-skill\" onclick=\"event.stopPropagation(); BattleArena.activateGrandSkill('${n.uid}')\" title=\"Activate [Grand Skill: ${check.gs.cost}] Flash\">⚡ GS:${check.gs.cost}</button>`;
                  }
                  return '';
                })()}
              </div>
            </div>"""
assert center_nexus_anchor in code, "center_nexus_anchor not found"
code = code.replace(center_nexus_anchor, center_nexus_repl, 1)

# 10. Update exports on BattleArena
export_old = """    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    executeWhenDeployedEffects,"""

export_new = """    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    executeWhenDeployedEffects,
    parseGrandSkill,
    canActivateGrandSkill,
    activateGrandSkill,
    executeCoreCharge,
    checkGrandFieldOnOpponentExhaust,"""

assert export_old in code, "export_old not found"
code = code.replace(export_old, export_new, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Nexus Flash rules, Grand Skills, and Core Charge successfully applied to battle_arena.js!")
