with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add soulCoreIgnite to AudioFX
target_audiofx = """    burstIgnite() {
      this.init();
      this.playTone(280, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(420, 'square', 0.2, 0.12), 70);
      setTimeout(() => this.playTone(560, 'sawtooth', 0.35, 0.16), 140);
    },"""

replacement_audiofx = """    burstIgnite() {
      this.init();
      this.playTone(280, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(420, 'square', 0.2, 0.12), 70);
      setTimeout(() => this.playTone(560, 'sawtooth', 0.35, 0.16), 140);
    },
    soulCoreIgnite() {
      this.init();
      this.playTone(220, 'sawtooth', 0.25, 0.15);
      setTimeout(() => this.playTone(440, 'triangle', 0.25, 0.15), 60);
      setTimeout(() => this.playTone(660, 'sawtooth', 0.3, 0.18), 120);
    },"""

assert target_audiofx in code, "target_audiofx not found"
code = code.replace(target_audiofx, replacement_audiofx, 1)

# 2. DuelState player & opponent initial state
target_init_state = """    player: {
      name: 'Player',
      color: 'Red',
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      burst: null,
      deck: [],
      hand: [],
      field: [] // { uid, name, cost, type, color, image_url, levels, currentCores, currentLevel, currentBp, isExhausted, hasAttacked }
    },
    
    opponent: {
      name: 'AI Champion',
      color: 'Purple',
      life: 5,
      reserve: 5,
      trash: 0,
      trashCards: [],
      voidCards: [],
      burst: null,
      deck: [],
      hand: [],
      field: []
    },"""

replacement_init_state = """    player: {
      name: 'Player',
      color: 'Red',
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve', // 'reserve' | 'field' | 'trash' | 'void'
      soulCoreSpiritUid: null,
      burst: null,
      deck: [],
      hand: [],
      field: [] // { uid, name, cost, type, color, image_url, levels, currentCores, currentLevel, currentBp, hasSoulCore, isExhausted, hasAttacked }
    },
    
    opponent: {
      name: 'AI Champion',
      color: 'Purple',
      life: 5,
      reserve: 5,
      trash: 0,
      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: [],
      hand: [],
      field: []
    },"""

assert target_init_state in code, "target_init_state not found"
code = code.replace(target_init_state, replacement_init_state, 1)

# 3. calculateBpAndLevel update
target_calc_bp = """  // Calculate BP given allocated cores
  function calculateBpAndLevel(parsedLevels, cores) {
    if (!parsedLevels || !parsedLevels.length) {
      return { level: 1, bp: 2000 };
    }
    // Sort ascending by cores required
    const sorted = [...parsedLevels].sort((a, b) => a.cores - b.cores);
    let best = sorted[0];
    for (const lvl of sorted) {
      if (cores >= lvl.cores) {
        best = lvl;
      }
    }
    return { level: best.level, bp: best.bp };
  }"""

replacement_calc_bp = """  // Calculate BP given allocated cores and Soul Core empowerment
  function calculateBpAndLevel(parsedLevels, cores, hasSoulCore = false, cardEffect = '') {
    if (!parsedLevels || !parsedLevels.length) {
      let bp = 2000;
      if (hasSoulCore) bp += 1000;
      return { level: 1, bp };
    }
    const sorted = [...parsedLevels].sort((a, b) => a.cores - b.cores);
    let best = sorted[0];
    for (const lvl of sorted) {
      if (cores >= lvl.cores) {
        best = lvl;
      }
    }
    let bp = best.bp;
    if (hasSoulCore) {
      let bonus = 1000;
      const eff = (cardEffect || '').toLowerCase();
      if (eff.includes('soul core') && eff.includes('+5000 bp')) bonus = 5000;
      else if (eff.includes('soul core') && eff.includes('+4000 bp')) bonus = 4000;
      else if (eff.includes('soul core') && eff.includes('+3000 bp')) bonus = 3000;
      else if (eff.includes('soul core') && eff.includes('+2000 bp')) bonus = 2000;
      bp += bonus;
    }
    return { level: best.level, bp };
  }"""

assert target_calc_bp in code, "target_calc_bp not found"
code = code.replace(target_calc_bp, replacement_calc_bp, 1)

# 4. startDuel player & opponent initialization
target_start_duel = """    DuelState.player = {
      name: pName,
      color: pColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      burst: null,
      deck: shuffledP,
      hand: pHand,
      field: []
    };

    DuelState.opponent = {
      name: oName,
      color: oColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      burst: null,
      deck: shuffledO,
      hand: oHand,
      field: []
    };"""

replacement_start_duel = """    DuelState.player = {
      name: pName,
      color: pColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledP,
      hand: pHand,
      field: []
    };

    DuelState.opponent = {
      name: oName,
      color: oColor,
      life: 5,
      reserve: 4,
      trash: 0,
      trashCards: [],
      voidCards: [],
      soulCoreLocation: 'reserve',
      soulCoreSpiritUid: null,
      burst: null,
      deck: shuffledO,
      hand: oHand,
      field: []
    };"""

assert target_start_duel in code, "target_start_duel not found"
code = code.replace(target_start_duel, replacement_start_duel, 1)

# 5. renderDuelTable: Render Soul Core HUD pills
target_hud_render = """    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) oTrashEl.textContent = DuelState.opponent.trash;
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Trash: ${DuelState.opponent.trash} Cores, ${(DuelState.opponent.trashCards || []).length} Cards (Click to view Graveyard)`;
    }"""

replacement_hud_render = """    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) oTrashEl.textContent = DuelState.opponent.trash;
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Trash: ${DuelState.opponent.trash} Cores, ${(DuelState.opponent.trashCards || []).length} Cards (Click to view Graveyard)`;
    }

    // Render Opponent Soul Core Status
    const oScLabel = document.getElementById('opponentSoulCoreLabel');
    const oScPill = document.getElementById('opponentSoulCorePill');
    if (oScLabel && oScPill) {
      const loc = DuelState.opponent.soulCoreLocation || 'reserve';
      if (loc === 'reserve') {
        oScLabel.textContent = 'Soul Core: Reserve';
        oScPill.className = 'soul-core-pill in-reserve';
        oScPill.title = "Opponent's Soul Core is in Reserve";
      } else if (loc === 'field') {
        const sp = DuelState.opponent.field.find(s => s.uid === DuelState.opponent.soulCoreSpiritUid);
        const spName = sp ? sp.name : 'Spirit';
        oScLabel.textContent = `Soul Core: On ${spName}`;
        oScPill.className = 'soul-core-pill on-field';
        oScPill.title = `Opponent's Soul Core is empowering "${spName}"!`;
      } else if (loc === 'trash') {
        oScLabel.textContent = 'Soul Core: Trash';
        oScPill.className = 'soul-core-pill in-trash';
        oScPill.title = "Opponent's Soul Core is in Trash";
      }
    }"""

assert target_hud_render in code, "target_hud_render not found"
code = code.replace(target_hud_render, replacement_hud_render, 1)

target_player_hud_sc = """    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) pTrashEl.textContent = DuelState.player.trash;
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Trash: ${DuelState.player.trash} Cores, ${(DuelState.player.trashCards || []).length} Cards (Click to view Graveyard)`;
    }"""

replacement_player_hud_sc = """    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) pTrashEl.textContent = DuelState.player.trash;
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Trash: ${DuelState.player.trash} Cores, ${(DuelState.player.trashCards || []).length} Cards (Click to view Graveyard)`;
    }

    // Render Player Soul Core Status
    const pScLabel = document.getElementById('playerSoulCoreLabel');
    const pScPill = document.getElementById('playerSoulCorePill');
    if (pScLabel && pScPill) {
      const loc = DuelState.player.soulCoreLocation || 'reserve';
      if (loc === 'reserve') {
        pScLabel.textContent = 'Soul Core: Reserve';
        pScPill.className = 'soul-core-pill in-reserve';
        pScPill.title = 'Your Soul Core is in Reserve! Available to place on a Spirit or pay costs.';
      } else if (loc === 'field') {
        const sp = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
        const spName = sp ? sp.name : 'Spirit';
        pScLabel.textContent = `Soul Core: On ${spName}`;
        pScPill.className = 'soul-core-pill on-field';
        pScPill.title = `Soul Core is empowering "${spName}"!`;
      } else if (loc === 'trash') {
        pScLabel.textContent = 'Soul Core: Trash 🪦';
        pScPill.className = 'soul-core-pill in-trash';
        pScPill.title = 'Soul Core is in Trash. Will return to Reserve during Refresh Step!';
      } else {
        pScLabel.textContent = 'Soul Core: Void 🌌';
        pScPill.className = 'soul-core-pill in-void';
      }
    }"""

assert target_player_hud_sc in code, "target_player_hud_sc not found"
code = code.replace(target_player_hud_sc, replacement_player_hud_sc, 1)

# 6. renderFieldSpirit: replace using find/slice
start_str = "  function renderFieldSpirit(spirit, side) {"
end_str = "  let pendingSacrifice = null;"
s_idx = code.find(start_str)
e_idx = code.find(end_str)
assert s_idx != -1 and e_idx != -1, "renderFieldSpirit boundaries not found"

new_field_spirit = """  function renderFieldSpirit(spirit, side) {
    const isAttacker = DuelState.selectedAttacker && DuelState.selectedAttacker.uid === spirit.uid;
    let classes = `field-spirit-card card-color-${(spirit.color || "Red").toLowerCase()}`;
    if (spirit.isExhausted) classes += ' is-exhausted';
    if (isAttacker) classes += ' is-selected-attacker';
    const hasSC = !!spirit.hasSoulCore;
    if (hasSC) classes += ' has-soul-core';

    const safeSpName = (spirit.name || '').replace(/'/g, "\\\\'");

    const isPlayer = side === 'player';
    const isMainStep = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
    let soulCoreActionBtn = '';
    if (isPlayer && isMainStep) {
      if (hasSC) {
        soulCoreActionBtn = `<button class="fsc-sc-btn remove" onclick="event.stopPropagation(); BattleArena.removeSoulCoreFromSpirit('${spirit.uid}')" title="Return Soul Core to Reserve">🔥 Remove SC</button>`;
      } else if (DuelState.player.soulCoreLocation === 'reserve') {
        soulCoreActionBtn = `<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('${spirit.uid}')" title="Place Soul Core on this Spirit">🔥 Place SC</button>`;
      } else if (DuelState.player.soulCoreLocation === 'field') {
        soulCoreActionBtn = `<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('${spirit.uid}')" title="Transfer Soul Core to this Spirit">🔥 Transfer SC</button>`;
      }
    }

    const coresDisplay = hasSC
      ? `💎 ${Math.max(0, spirit.currentCores - 1)} + 🔥 SC`
      : `💎 ${spirit.currentCores}`;

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!"><span class="flame-icon">🔥</span> SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-top">
          <span class="fsc-level">LV${spirit.currentLevel}</span>
          <span class="fsc-cores">${coresDisplay}</span>
          <span class="fsc-bp">${spirit.currentBp} BP</span>
        </div>
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="fsc-name">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
      </div>
    `;
  }

"""
code = code[:s_idx] + new_field_spirit + code[e_idx:]

# 7. updateActionButtons for REFRESH
target_action_btn_refresh = """        } else if (phase === 'REFRESH') {
          nextBtn.textContent = '🔄 Ready All Spirits';"""

replacement_action_btn_refresh = """        } else if (phase === 'REFRESH') {
          const tCores = DuelState.player.trash;
          const hasScTrash = DuelState.player.soulCoreLocation === 'trash';
          if (tCores > 0 && hasScTrash) {
            nextBtn.textContent = `🔄 Return ${tCores} Cores + 🔥 Soul Core & Ready Spirits`;
          } else if (tCores > 0) {
            nextBtn.textContent = `🔄 Return ${tCores} Core(s) from Trash & Ready Spirits`;
          } else {
            nextBtn.textContent = '🔄 Ready All Spirits';
          }"""

assert target_action_btn_refresh in code, "target_action_btn_refresh not found"
code = code.replace(target_action_btn_refresh, replacement_action_btn_refresh, 1)

# 8. renderStepNavigator: dynamic button label for REFRESH
target_step_nav_main = """            if (p === 'MAIN') {"""

replacement_step_nav_main = """            if (p === 'REFRESH') {
              const tCores = DuelState.player.trash;
              const hasScTrash = DuelState.player.soulCoreLocation === 'trash';
              if (tCores > 0 && hasScTrash) {
                btnEl.textContent = `🔄 Return ${tCores} Cores + 🔥 SC & Ready`;
              } else if (tCores > 0) {
                btnEl.textContent = `🔄 Return ${tCores} Core(s) & Ready Spirits`;
              } else if (hasScTrash) {
                btnEl.textContent = `🔄 Return 🔥 Soul Core & Ready`;
              } else {
                btnEl.textContent = '🔄 Ready All Spirits';
              }
              btnEl.className = 'btn-step-action btn-step-refresh';
            } else if (p === 'MAIN') {"""

assert target_step_nav_main in code, "target_step_nav_main not found"
code = code.replace(target_step_nav_main, replacement_step_nav_main, 1)

# 9. renderCardInspector: show Soul Core controls when selecting a spirit on field
target_inspector_field = """    } else {
      // On battlefield spirit
      actionBtnHtml = `<div style="font-size:0.7rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.3rem 0;">⚔️ Current BP: ${card.currentBp || card.bp || '—'} (LV${card.currentLevel || 1})</div>`;
    }"""

replacement_inspector_field = """    } else {
      // On battlefield spirit
      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.hasSoulCore) {
          scBtn = `<button class="btn-inspector-action btn-remove-soul-core" onclick="BattleArena.removeSoulCoreFromSpirit('${card.uid}')">🔥 Return Soul Core to Reserve</button>`;
        } else if (DuelState.player.soulCoreLocation === 'reserve') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Place Soul Core on this Spirit</button>`;
        } else if (DuelState.player.soulCoreLocation === 'field') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Transfer Soul Core to this Spirit</button>`;
        }
      }
      actionBtnHtml = `
        <div style="font-size:0.75rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.2rem 0;">
          ⚔️ Battle Line: ${card.currentBp || card.bp || '—'} BP (LV${card.currentLevel || 1})
          ${card.hasSoulCore ? ' • <span style="color:#f59e0b;font-weight:800;">🔥 SOUL CORE ACTIVE</span>' : ''}
        </div>
        ${scBtn}
      `;
    }"""

assert target_inspector_field in code, "target_inspector_field not found"
code = code.replace(target_inspector_field, replacement_inspector_field, 1)

# 10. REFRESH STEP in manualStep: guaranteed core and soul core return
target_manual_refresh = """    } else if (step === 'REFRESH') {
      let count = 0;
      DuelState.player.field.forEach(s => {
        if (s.isExhausted) count++;
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.player.trash > 0) {
        coresReturned = DuelState.player.trash;
        DuelState.player.reserve += coresReturned;
        DuelState.player.trash = 0;
      }
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Refreshed ${count} Spirit(s) to Ready${coresReturned > 0 ? ` and returned ${coresReturned} Core(s) from Trash to Reserve` : ''}.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();"""

replacement_manual_refresh = """    } else if (step === 'REFRESH') {
      let count = 0;
      DuelState.player.field.forEach(s => {
        if (s.isExhausted) count++;
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.player.trash > 0) {
        coresReturned = DuelState.player.trash;
        DuelState.player.reserve += coresReturned;
        DuelState.player.trash = 0;
      }
      let scReturned = false;
      if (DuelState.player.soulCoreLocation === 'trash') {
        DuelState.player.soulCoreLocation = 'reserve';
        DuelState.player.soulCoreSpiritUid = null;
        scReturned = true;
      }

      AudioFX.coreChime();
      setTimeout(() => AudioFX.shield(), 150);

      const pResEl = document.getElementById('playerReserveCores');
      if (pResEl) {
        pResEl.classList.remove('core-pulse-active');
        void pResEl.offsetWidth;
        pResEl.classList.add('core-pulse-active');
        setTimeout(() => pResEl.classList.remove('core-pulse-active'), 900);
      }

      let returnMsg = '';
      if (coresReturned > 0 && scReturned) {
        returnMsg = ` and returned ${coresReturned} Core(s) + 🔥 Soul Core from Trash to Reserve`;
      } else if (coresReturned > 0) {
        returnMsg = ` and returned ${coresReturned} Core(s) from Trash to Reserve`;
      } else if (scReturned) {
        returnMsg = ` and returned your 🔥 Soul Core from Trash to Reserve`;
      }

      addLog(`🔄 **REFRESH STEP**: Refreshed ${count} Spirit(s) to Ready${returnMsg}. (Reserve: ${DuelState.player.reserve})`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();"""

assert target_manual_refresh in code, "target_manual_refresh not found"
code = code.replace(target_manual_refresh, replacement_manual_refresh, 1)

# 11. AI REFRESH STEP
target_ai_refresh = """    } else if (currentPhase === 'REFRESH') {
      DuelState.opponent.field.forEach(s => {
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.opponent.trash > 0) {
        coresReturned = DuelState.opponent.trash;
        DuelState.opponent.reserve += coresReturned;
        DuelState.opponent.trash = 0;
      }
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Opponent refreshed all Spirits to Ready${coresReturned > 0 ? ` and returned ${coresReturned} Core(s) from Trash to Reserve` : ''}.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);"""

replacement_ai_refresh = """    } else if (currentPhase === 'REFRESH') {
      DuelState.opponent.field.forEach(s => {
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      let coresReturned = 0;
      if (DuelState.opponent.trash > 0) {
        coresReturned = DuelState.opponent.trash;
        DuelState.opponent.reserve += coresReturned;
        DuelState.opponent.trash = 0;
      }
      if (DuelState.opponent.soulCoreLocation === 'trash') {
        DuelState.opponent.soulCoreLocation = 'reserve';
        DuelState.opponent.soulCoreSpiritUid = null;
      }
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Opponent refreshed all Spirits to Ready${coresReturned > 0 ? ` and returned ${coresReturned} Core(s) from Trash to Reserve` : ''}.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);"""

assert target_ai_refresh in code, "target_ai_refresh not found"
code = code.replace(target_ai_refresh, replacement_ai_refresh, 1)

# 12. Soul Core functions before EXPOSE PUBLIC API
target_expose = """  // ── EXPOSE PUBLIC API ──"""

soul_core_functions = """  // ── SOUL CORE (ソウルコア) LOGIC & CONTROLS ──
  function placeSoulCoreOnSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Can only move Soul Core on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Soul Core can only be moved during the MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    // If Soul Core was on another spirit, detach it
    if (DuelState.player.soulCoreLocation === 'field' && DuelState.player.soulCoreSpiritUid) {
      const prev = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      if (prev && prev.uid !== spirit.uid) {
        prev.hasSoulCore = false;
        prev.currentCores = Math.max(1, prev.currentCores - 1);
        const { level, bp } = calculateBpAndLevel(prev.levels, prev.currentCores, false, prev.effect);
        prev.currentLevel = level;
        prev.currentBp = bp;
      }
    } else if (DuelState.player.soulCoreLocation === 'reserve') {
      if (DuelState.player.reserve > 0) {
        DuelState.player.reserve -= 1;
      }
    }

    spirit.hasSoulCore = true;
    spirit.currentCores += 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, true, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.soulCoreLocation = 'field';
    DuelState.player.soulCoreSpiritUid = spirit.uid;

    AudioFX.soulCoreIgnite();
    addLog(`🔥 **SOUL CORE ATTACHED**: Placed Soul Core onto "${spirit.name}"! Empowered to Lv${level} with ${bp} BP.`, 'step');
    renderDuelTable();
  }

  function removeSoulCoreFromSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Can only move Soul Core on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Soul Core can only be moved during the MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit || !spirit.hasSoulCore) return;

    if (spirit.currentCores <= 1) {
      showToast(`Cannot remove Soul Core: "${spirit.name}" requires at least 1 core to remain on field!`, 'warning');
      return;
    }

    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.reserve += 1;
    DuelState.player.soulCoreLocation = 'reserve';
    DuelState.player.soulCoreSpiritUid = null;

    AudioFX.coreChime();
    addLog(`🔥 **SOUL CORE RETURNED**: Removed Soul Core from "${spirit.name}" back to Reserve.`, 'step');
    renderDuelTable();
  }

  function inspectSoulCore() {
    const loc = DuelState.player.soulCoreLocation || 'reserve';
    let locStr = 'in Reserve';
    if (loc === 'field') {
      const sp = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      locStr = `placed on "${sp ? sp.name : 'Spirit'}"`;
    } else if (loc === 'trash') {
      locStr = 'in Trash (returns to Reserve at Refresh Step)';
    }
    showToast(`🔥 Soul Core: Currently ${locStr}. Counts as 1 Core and awakens enhanced BP & abilities on Spirits!`, 'info');
  }

"""

assert target_expose in code, "target_expose not found"
code = code.replace(target_expose, soul_core_functions + target_expose, 1)

# 13. Export Soul Core functions in window.BattleArena
target_exports = """    sendToTrash,
    sendToVoid
  };"""

replacement_exports = """    sendToTrash,
    sendToVoid,
    placeSoulCoreOnSpirit,
    removeSoulCoreFromSpirit,
    inspectSoulCore
  };"""

assert target_exports in code, "target_exports not found"
code = code.replace(target_exports, replacement_exports, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] battle_arena.js successfully updated with Soul Core & Refresh logic")
