import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize newlines
c = content.replace('\r\n', '\n')

# 1. Update getPlayerAvailableCores
target_cores = '''  function getPlayerAvailableCores() {
    const reserve = DuelState.player.reserve || 0;
    const fieldCores = DuelState.player.field.reduce((sum, s) => sum + (s.currentCores || 0), 0);
    return {
      reserve,
      fieldCores,
      total: reserve + fieldCores
    };
  }'''

repl_cores = '''  function getPlayerAvailableCores() {
    const regularReserve = DuelState.player.reserve || 0;
    const hasSoulCoreInReserve = (DuelState.player.soulCoreLocation === 'reserve');
    const reserve = regularReserve + (hasSoulCoreInReserve ? 1 : 0);
    const fieldCores = DuelState.player.field.reduce((sum, s) => sum + (s.currentCores || 0), 0);
    return {
      reserve,
      regularReserve,
      hasSoulCoreInReserve,
      fieldCores,
      total: reserve + fieldCores
    };
  }'''

assert target_cores in c, "target_cores not found!"
c = c.replace(target_cores, repl_cores, 1)

# 2. Update renderFieldSpirit to add drag-and-drop, drag handle, and move buttons
target_render_spirit = '''    return `
      <div class="${classes}" id="spirit_${spirit.uid}" onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
      </div>
    `;'''

repl_render_spirit = '''    const dragAttrs = isPlayer
      ? `draggable="true" data-spirit-uid="${spirit.uid}" ondragstart="BattleArena.handleFieldDragStart(event, '${spirit.uid}')" ondragover="BattleArena.handleFieldDragOver(event, '${spirit.uid}')" ondragleave="BattleArena.handleFieldDragLeave(event, '${spirit.uid}')" ondrop="BattleArena.handleFieldDrop(event, '${spirit.uid}')" ondragend="BattleArena.handleFieldDragEnd(event)"`
      : '';

    const dragHandleHtml = isPlayer
      ? `<div class="fsc-drag-handle" title="Click and drag to reposition card on the board">⋮⋮</div>`
      : '';

    const reorderButtonsHtml = isPlayer
      ? `<div class="fsc-reorder-bar">
          <button class="fsc-move-btn" onclick="event.stopPropagation(); BattleArena.moveFieldSpirit('${spirit.uid}', -1)" title="Move Spirit Left">◀</button>
          <button class="fsc-move-btn" onclick="event.stopPropagation(); BattleArena.moveFieldSpirit('${spirit.uid}', 1)" title="Move Spirit Right">▶</button>
        </div>`
      : '';

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${dragHandleHtml}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;'''

assert target_render_spirit in c, "target_render_spirit not found!"
c = c.replace(target_render_spirit, repl_render_spirit, 1)

# 3. Add Drag-and-Drop handler functions right before pendingSacrifice
target_after_render_spirit = '  let pendingSacrifice = null;'
drag_functions_code = '''  // ── FIELD CARD REORDERING & DRAG-AND-DROP CONTROLLER ──
  let draggedSpiritUid = null;

  function handleFieldDragStart(event, spiritUid) {
    if (DuelState.activePlayer !== 'player') return;
    draggedSpiritUid = spiritUid;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', spiritUid);
      event.dataTransfer.effectAllowed = 'move';
    }
    const el = document.getElementById(`spirit_${spiritUid}`);
    if (el) el.classList.add('is-dragging');
  }

  function handleFieldDragOver(event, targetUid) {
    if (!draggedSpiritUid || draggedSpiritUid === targetUid) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const targetEl = document.getElementById(`spirit_${targetUid}`);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      if (relX < rect.width / 2) {
        targetEl.classList.add('drag-over-left');
        targetEl.classList.remove('drag-over-right');
      } else {
        targetEl.classList.add('drag-over-right');
        targetEl.classList.remove('drag-over-left');
      }
    }
  }

  function handleFieldDragLeave(event, targetUid) {
    const targetEl = document.getElementById(`spirit_${targetUid}`);
    if (targetEl) {
      targetEl.classList.remove('drag-over-left', 'drag-over-right');
    }
  }

  function handleFieldDrop(event, targetUid) {
    event.preventDefault();
    const sourceUid = draggedSpiritUid || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);
    handleFieldDragEnd();
    if (!sourceUid || sourceUid === targetUid) return;

    const sourceIdx = DuelState.player.field.findIndex(s => s.uid === sourceUid);
    const targetIdx = DuelState.player.field.findIndex(s => s.uid === targetUid);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const [moved] = DuelState.player.field.splice(sourceIdx, 1);
    DuelState.player.field.splice(targetIdx, 0, moved);

    AudioFX.coreChime();
    renderDuelTable();
    if (typeof showToast === 'function') {
      showToast(`↔️ Repositioned "${moved.name}" to slot ${targetIdx + 1}!`, 'info');
    }
  }

  function handleFieldDragEnd() {
    draggedSpiritUid = null;
    document.querySelectorAll('.field-spirit-card').forEach(el => {
      el.classList.remove('is-dragging', 'drag-over-left', 'drag-over-right');
    });
  }

  function moveFieldSpirit(spiritUid, delta) {
    if (DuelState.activePlayer !== 'player') return;
    const curIdx = DuelState.player.field.findIndex(s => s.uid === spiritUid);
    if (curIdx === -1) return;
    const newIdx = curIdx + delta;
    if (newIdx < 0 || newIdx >= DuelState.player.field.length) return;

    const [moved] = DuelState.player.field.splice(curIdx, 1);
    DuelState.player.field.splice(newIdx, 0, moved);

    AudioFX.coreChime();
    renderDuelTable();
  }

  let pendingSacrifice = null;'''

assert target_after_render_spirit in c, "target_after_render_spirit not found!"
c = c.replace(target_after_render_spirit, drag_functions_code, 1)

# 4. Update summonCard to recognize Soul Core in Reserve
target_summon = '''    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;

    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Spirit), but only have ${total} across Reserve and Field Spirits.`, 'warning');
      return;
    }

    // Direct summon from Reserve
    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    DuelState.player.hand.splice(cardIdx, 1);'''

repl_summon = '''    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;
    const hasScInReserve = (DuelState.player.soulCoreLocation === 'reserve');
    const totalReserveWithSc = DuelState.player.reserve + (hasScInReserve ? 1 : 0);

    let usedSoulCoreFromReserve = false;

    if (DuelState.player.reserve < totalNeeded) {
      if (totalReserveWithSc >= totalNeeded) {
        // Can afford directly by using the Soul Core in Reserve!
        usedSoulCoreFromReserve = true;
        const regularNeeded = totalNeeded - 1;
        DuelState.player.reserve -= regularNeeded;
        DuelState.player.trash += cost;
        DuelState.player.hand.splice(cardIdx, 1);
      } else {
        const { total } = getPlayerAvailableCores();
        if (total >= totalNeeded) {
          openSacrificeModal(uid);
          return;
        }
        showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Spirit), but only have ${total} across Reserve and Field Spirits.`, 'warning');
        return;
      }
    } else {
      // Direct summon from regular Reserve
      DuelState.player.reserve -= totalNeeded;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
    }'''

assert target_summon in c, "target_summon not found!"
c = c.replace(target_summon, repl_summon, 1)

# 4b. Also handle Soul Core placement on the summoned spirit when usedSoulCoreFromReserve is true
target_post_summon = '''    const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
    card.currentCores = coresToPlace;
    card.currentLevel = level;
    card.currentBp = bp;
    card.isExhausted = false;
    card.hasAttacked = false;'''

repl_post_summon = '''    if (usedSoulCoreFromReserve) {
      card.hasSoulCore = true;
      DuelState.player.soulCoreLocation = 'field';
      DuelState.player.soulCoreSpiritUid = card.uid;
    }
    const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace, !!card.hasSoulCore, card.effect);
    card.currentCores = coresToPlace;
    card.currentLevel = level;
    card.currentBp = bp;
    card.isExhausted = false;
    card.hasAttacked = false;'''

assert target_post_summon in c, "target_post_summon not found!"
c = c.replace(target_post_summon, repl_post_summon, 1)

# 5. Fix placeSoulCoreOnSpirit and removeSoulCoreFromSpirit so spirit with 0 cores DOES NOT SURVIVE!
target_place_sc = '''    // If Soul Core was on another spirit, detach it
    if (DuelState.player.soulCoreLocation === 'field' && DuelState.player.soulCoreSpiritUid) {
      const prev = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      if (prev && prev.uid !== spirit.uid) {
        prev.hasSoulCore = false;
        prev.currentCores = Math.max(1, prev.currentCores - 1);
        const { level, bp } = calculateBpAndLevel(prev.levels, prev.currentCores, false, prev.effect);
        prev.currentLevel = level;
        prev.currentBp = bp;
      }
    }'''

repl_place_sc = '''    // If Soul Core was on another spirit, detach it
    if (DuelState.player.soulCoreLocation === 'field' && DuelState.player.soulCoreSpiritUid) {
      const prev = DuelState.player.field.find(s => s.uid === DuelState.player.soulCoreSpiritUid);
      if (prev && prev.uid !== spirit.uid) {
        prev.hasSoulCore = false;
        prev.currentCores -= 1;
        if (prev.currentCores <= 0) {
          // Official Rule: Spirit with 0 cores CANNOT survive! Depletes to Trash.
          const pIdx = DuelState.player.field.findIndex(s => s.uid === prev.uid);
          if (pIdx !== -1) {
            const depleted = DuelState.player.field.splice(pIdx, 1)[0];
            sendToTrash(depleted, 'player', 'Depleted to 0 cores upon Soul Core transfer');
            AudioFX.destroy ? AudioFX.destroy() : AudioFX.slash();
            addLog(`💀 **[DEPLETED TO TRASH]**: "${depleted.name}" had 0 cores remaining after Soul Core was transferred and was sent to Trash!`, 'damage');
            if (typeof showToast === 'function') {
              showToast(`💀 "${depleted.name}" had 0 cores left and depleted to Trash!`, 'warning');
            }
          }
        } else {
          const { level, bp } = calculateBpAndLevel(prev.levels, prev.currentCores, false, prev.effect);
          prev.currentLevel = level;
          prev.currentBp = bp;
        }
      }
    }'''

assert target_place_sc in c, "target_place_sc not found!"
c = c.replace(target_place_sc, repl_place_sc, 1)

target_remove_sc = '''    if (spirit.currentCores <= 1) {
      if (typeof showToast === 'function') showToast(`Cannot remove Soul Core: "${spirit.name}" requires at least 1 core to remain on field!`, 'warning');
      return;
    }

    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    DuelState.player.soulCoreLocation = 'reserve';
    DuelState.player.soulCoreSpiritUid = null;'''

repl_remove_sc = '''    spirit.hasSoulCore = false;
    spirit.currentCores -= 1;
    DuelState.player.soulCoreLocation = 'reserve';
    DuelState.player.soulCoreSpiritUid = null;

    if (spirit.currentCores <= 0) {
      // Depletes spirit with 0 cores to Trash!
      const pIdx = DuelState.player.field.findIndex(s => s.uid === spirit.uid);
      if (pIdx !== -1) {
        const depleted = DuelState.player.field.splice(pIdx, 1)[0];
        sendToTrash(depleted, 'player', 'Depleted to 0 cores upon Soul Core return');
        AudioFX.destroy ? AudioFX.destroy() : AudioFX.slash();
        addLog(`💀 **[DEPLETED TO TRASH]**: "${depleted.name}" had 0 cores remaining after Soul Core returned to Reserve and was sent to Trash!`, 'damage');
        if (typeof showToast === 'function') {
          showToast(`💀 "${depleted.name}" had 0 cores left and depleted to Trash!`, 'warning');
        }
      }
    } else {
      const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, false, spirit.effect);
      spirit.currentLevel = level;
      spirit.currentBp = bp;
    }'''

assert target_remove_sc in c, "target_remove_sc not found!"
c = c.replace(target_remove_sc, repl_remove_sc, 1)

# 6. Update renderCoreCounters in renderDuelTable to populate both Trash Cores and Grave Cards
target_opp_hud = '''    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) oTrashEl.textContent = DuelState.opponent.trash;
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Trash: ${DuelState.opponent.trash} Cores, ${(DuelState.opponent.trashCards || []).length} Cards (Click to view Graveyard)`;
    }'''

repl_opp_hud = '''    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) {
      const oScInTrash = (DuelState.opponent.soulCoreLocation === 'trash');
      oTrashEl.textContent = oScInTrash ? `${DuelState.opponent.trash} (+1 🔥)` : DuelState.opponent.trash;
    }
    const oGraveEl = document.getElementById('opponentGraveCount');
    if (oGraveEl) {
      oGraveEl.textContent = (DuelState.opponent.trashCards || []).length;
    }
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Cores in Trash: ${DuelState.opponent.trash} Cores${DuelState.opponent.soulCoreLocation === 'trash' ? ' + 1 Soul Core' : ''}`;
    }
    const oGravePill = document.getElementById('opponentGravePill');
    if (oGravePill) {
      oGravePill.title = `Opponent's Graveyard: ${(DuelState.opponent.trashCards || []).length} Defeated Cards (Click to view Graveyard)`;
    }'''

assert target_opp_hud in c, "target_opp_hud not found!"
c = c.replace(target_opp_hud, repl_opp_hud, 1)

target_player_hud = '''    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) pTrashEl.textContent = DuelState.player.trash;
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Trash: ${DuelState.player.trash} Cores, ${(DuelState.player.trashCards || []).length} Cards (Click to view Graveyard)`;
    }'''

repl_player_hud = '''    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) {
      const pScInTrash = (DuelState.player.soulCoreLocation === 'trash');
      pTrashEl.textContent = pScInTrash ? `${DuelState.player.trash} (+1 🔥)` : DuelState.player.trash;
    }
    const pGraveEl = document.getElementById('playerGraveCount');
    if (pGraveEl) {
      pGraveEl.textContent = (DuelState.player.trashCards || []).length;
    }
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Cores in Trash: ${DuelState.player.trash} Cores${DuelState.player.soulCoreLocation === 'trash' ? ' + 1 Soul Core' : ''} (Refreshes to Reserve at Refresh Step)`;
    }
    const pGravePill = document.getElementById('playerGravePill');
    if (pGravePill) {
      pGravePill.title = `Your Graveyard: ${(DuelState.player.trashCards || []).length} Defeated Cards (Click to view Graveyard)`;
    }'''

assert target_player_hud in c, "target_player_hud not found!"
c = c.replace(target_player_hud, repl_player_hud, 1)

# 7. Add setupFieldWheelScroll inside renderDuelTable
target_table_end = '''    if (oBurstEl) {
      if (DuelState.opponent.burst) {
        oBurstEl.className = 'burst-slot-pill has-burst';
        oBurstEl.innerHTML = `🚨 Burst: [SET 💥]`;
        oBurstEl.title = 'Opponent has set a secret Burst card!';
      } else {
        oBurstEl.className = 'burst-slot-pill';
        oBurstEl.innerHTML = `🔒 Burst: Empty`;
        oBurstEl.title = 'Opponent Burst Slot is empty';
      }
    }
  }'''

repl_table_end = '''    if (oBurstEl) {
      if (DuelState.opponent.burst) {
        oBurstEl.className = 'burst-slot-pill has-burst';
        oBurstEl.innerHTML = `🚨 Burst: [SET 💥]`;
        oBurstEl.title = 'Opponent has set a secret Burst card!';
      } else {
        oBurstEl.className = 'burst-slot-pill';
        oBurstEl.innerHTML = `🔒 Burst: Empty`;
        oBurstEl.title = 'Opponent Burst Slot is empty';
      }
    }

    // Enable horizontal mouse wheel scrolling across Battle Lines without full-page shift
    if (typeof document !== 'undefined') {
      ['playerField', 'opponentField'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.wheelBound) {
          el.dataset.wheelBound = '1';
          el.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
              el.scrollLeft += e.deltaY;
            }
          }, { passive: false });
        }
      });
    }
  }'''

assert target_table_end in c, "target_table_end not found!"
c = c.replace(target_table_end, repl_table_end, 1)

# 8. Export new drag and drop functions on window.BattleArena
target_exports = '''    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,'''

repl_exports = '''    deployNexus,
    addCoreToNexus,
    removeCoreFromNexus,
    handleFieldDragStart,
    handleFieldDragOver,
    handleFieldDragLeave,
    handleFieldDrop,
    handleFieldDragEnd,
    moveFieldSpirit,'''

assert target_exports in c, "target_exports not found!"
c = c.replace(target_exports, repl_exports, 1)

# Restore CRLF if needed
if '\r\n' in content:
    c = c.replace('\n', '\r\n')

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS: Soul Core reserve identification, depletion on transfer, separated trash/graveyard counters, and field drag-and-drop applied cleanly to battle_arena.js!")
