import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. DuelState player & opponent initial state
target_initial_state = """    player: {
      name: 'Player',
      color: 'Red',
      life: 5,
      reserve: 4,
      trash: 0,
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
      deck: [],
      hand: [],
      field: []
    },"""

replacement_initial_state = """    player: {
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
    },
    currentZoneTab: 'player-trash',"""

assert target_initial_state in content, "target_initial_state not found"
content = content.replace(target_initial_state, replacement_initial_state, 1)

# 2. startDuel() player & opponent initialization
target_start_duel = """    DuelState.player = {
      name: pName,
      color: pColor,
      life: 5,
      reserve: 4,
      trash: 0,
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
    };
    DuelState.currentZoneTab = 'player-trash';"""

assert target_start_duel in content, "target_start_duel not found"
content = content.replace(target_start_duel, replacement_start_duel, 1)

# 3. renderDuelTable HUD pills
target_hud_render = """    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) oTrashEl.textContent = DuelState.opponent.trash;
    const oDeckCount = document.getElementById('opponentDeckCount');"""

replacement_hud_render = """    const oTrashEl = document.getElementById('opponentTrashCores');
    if (oTrashEl) oTrashEl.textContent = DuelState.opponent.trash;
    const oTrashPill = document.getElementById('opponentTrashPill');
    if (oTrashPill) {
      oTrashPill.title = `Opponent's Trash: ${DuelState.opponent.trash} Cores, ${(DuelState.opponent.trashCards || []).length} Cards (Click to view Graveyard)`;
    }
    const oDeckCount = document.getElementById('opponentDeckCount');"""

assert target_hud_render in content, "target_hud_render not found"
content = content.replace(target_hud_render, replacement_hud_render, 1)

target_player_hud_render = """    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) pTrashEl.textContent = DuelState.player.trash;
    const pDeckCount = document.getElementById('playerDeckCount');"""

replacement_player_hud_render = """    const pTrashEl = document.getElementById('playerTrashCores');
    if (pTrashEl) pTrashEl.textContent = DuelState.player.trash;
    const pTrashPill = document.getElementById('playerTrashPill');
    if (pTrashPill) {
      pTrashPill.title = `Your Trash: ${DuelState.player.trash} Cores, ${(DuelState.player.trashCards || []).length} Cards (Click to view Graveyard)`;
    }
    const pDeckCount = document.getElementById('playerDeckCount');"""

assert target_player_hud_render in content, "target_player_hud_render not found"
content = content.replace(target_player_hud_render, replacement_player_hud_render, 1)

# 4. Add sendToTrash & sendToVoid helpers before applyMagicEffect
target_helpers_insert = """  function applyMagicEffect(card, side = 'player') {"""

replacement_helpers_insert = """  // ── GRAVEYARD & VOID CARD TRACKING HELPERS ──
  function sendToTrash(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!target.trashCards) target.trashCards = [];
    card.graveyardReason = reason || 'Sent to Trash';
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }

  function sendToVoid(card, side, reason) {
    if (!card) return;
    const target = side === 'player' ? DuelState.player : DuelState.opponent;
    if (!target.voidCards) target.voidCards = [];
    card.voidReason = reason || 'Banished to The Void';
    card.voidTurn = DuelState.turn;
    target.voidCards.unshift(card);
    const zoneModal = document.getElementById('battleZoneModal');
    if (zoneModal && zoneModal.style.display === 'flex') {
      renderZoneModal();
    }
  }

  function applyMagicEffect(card, side = 'player') {"""

assert target_helpers_insert in content, "target_helpers_insert not found"
content = content.replace(target_helpers_insert, replacement_helpers_insert, 1)

# 5. Track incinerated spirit in applyMagicEffect
target_incinerate = """        const destroyed = enemyField.shift();
        enemyReserve.reserve += destroyed.currentCores;
        enemyReserve.trash += 1;
        effectDesc = `Incinerated enemy "${destroyed.name}" (${destroyed.currentBp} BP)! Cores returned to reserve.`;"""

replacement_incinerate = """        const destroyed = enemyField.shift();
        enemyReserve.reserve += destroyed.currentCores;
        enemyReserve.trash += 1;
        sendToTrash(destroyed, isPlayer ? 'opponent' : 'player', `Incinerated by ${card.name} (${card.type || 'Magic'})`);
        effectDesc = `Incinerated enemy "${destroyed.name}" (${destroyed.currentBp} BP)! Cores returned to reserve.`;"""

assert target_incinerate in content, "target_incinerate not found"
content = content.replace(target_incinerate, replacement_incinerate, 1)

# 6. castMagic - send magic card to trash
target_cast_magic = """    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);"""

replacement_cast_magic = """    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);
    sendToTrash(card, 'player', 'Cast Magic from Hand');"""

assert target_cast_magic in content, "target_cast_magic not found"
content = content.replace(target_cast_magic, replacement_cast_magic, 1)

# 7. executeSacrificeSummon - send sacrificed spirits & sacrificed magic to trash
target_sac_spirits = """    DuelState.player.field = survivingSpirits;
    DuelState.player.trash += cost;"""

replacement_sac_spirits = """    DuelState.player.field = survivingSpirits;
    DuelState.player.trash += cost;
    if (sacrificedSpirits.length > 0) {
      sacrificedSpirits.forEach(s => {
        sendToTrash(s, 'player', `Depleted cores for ${card.name} summon`);
      });
    }
    if (!isSpirit) {
      sendToTrash(card, 'player', 'Cast Magic from Hand (Field Sacrifice)');
    }"""

assert target_sac_spirits in content, "target_sac_spirits not found"
content = content.replace(target_sac_spirits, replacement_sac_spirits, 1)

# 8. activateBurst - send burst magic to trash
target_burst_magic = """    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      // Consume magic card to trash
      if (isPlayer) DuelState.player.trash += 1;
      else DuelState.opponent.trash += 1;
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }"""

replacement_burst_magic = """    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      // Consume magic card to trash
      if (isPlayer) DuelState.player.trash += 1;
      else DuelState.opponent.trash += 1;
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }"""

assert target_burst_magic in content, "target_burst_magic not found"
content = content.replace(target_burst_magic, replacement_burst_magic, 1)

# 9. [Crush] milling
target_crush_mill = """        for (let m = 0; m < mill; m++) {
          const c = DuelState.opponent.deck.shift();
          if (c) DuelState.opponent.trash += 1;
        }"""

replacement_crush_mill = """        for (let m = 0; m < mill; m++) {
          const c = DuelState.opponent.deck.shift();
          if (c) {
            DuelState.opponent.trash += 1;
            sendToTrash(c, 'opponent', `Milled by [Crush] of ${attacker.name}`);
          }
        }"""

assert target_crush_mill in content, "target_crush_mill not found"
content = content.replace(target_crush_mill, replacement_crush_mill, 1)

# 10. resolveClash - combat deaths & curse
target_clash_att_wins = """      const idx = defList.findIndex(s => s.uid === blk.uid);
      if (idx !== -1) {
        const dest = defList.splice(idx, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${blk.name}" fell in battle!`, 'kill');

      if (hasCurse(blk)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${blk.name}" activates Curse! Dragged "${att.name}" into the grave with it!`, 'kill');
        const attIdx = attList.findIndex(s => s.uid === att.uid);
        if (attIdx !== -1) {
          const destAtt = attList.splice(attIdx, 1)[0];
          if (attSide === 'player') DuelState.player.reserve += destAtt.currentCores;
          else DuelState.opponent.reserve += destAtt.currentCores;
        }
      }"""

replacement_clash_att_wins = """      const idx = defList.findIndex(s => s.uid === blk.uid);
      if (idx !== -1) {
        const dest = defList.splice(idx, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        sendToTrash(dest, defSide, `Destroyed in combat by ${att.name} (${attBp} vs ${blkBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${blk.name}" fell in battle!`, 'kill');

      if (hasCurse(blk)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${blk.name}" activates Curse! Dragged "${att.name}" into the grave with it!`, 'kill');
        const attIdx = attList.findIndex(s => s.uid === att.uid);
        if (attIdx !== -1) {
          const destAtt = attList.splice(attIdx, 1)[0];
          if (attSide === 'player') DuelState.player.reserve += destAtt.currentCores;
          else DuelState.opponent.reserve += destAtt.currentCores;
          sendToTrash(destAtt, attSide, `Dragged to Trash by [Curse] of ${blk.name}`);
        }
      }"""

assert target_clash_att_wins in content, "target_clash_att_wins not found"
content = content.replace(target_clash_att_wins, replacement_clash_att_wins, 1)

target_clash_blk_wins = """      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      if (hasCurse(att)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${att.name}" activates Curse! Dragged "${blk.name}" into the grave with it!`, 'kill');
        const blkIdx = defList.findIndex(s => s.uid === blk.uid);
        if (blkIdx !== -1) {
          const destBlk = defList.splice(blkIdx, 1)[0];
          if (defSide === 'player') DuelState.player.reserve += destBlk.currentCores;
          else DuelState.opponent.reserve += destBlk.currentCores;
        }
      }"""

replacement_clash_blk_wins = """      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      if (hasCurse(att)) {
        addLog(`💀 **[CURSE TRIGGERED]**: "${att.name}" activates Curse! Dragged "${blk.name}" into the grave with it!`, 'kill');
        const blkIdx = defList.findIndex(s => s.uid === blk.uid);
        if (blkIdx !== -1) {
          const destBlk = defList.splice(blkIdx, 1)[0];
          if (defSide === 'player') DuelState.player.reserve += destBlk.currentCores;
          else DuelState.opponent.reserve += destBlk.currentCores;
          sendToTrash(destBlk, defSide, `Dragged to Trash by [Curse] of ${att.name}`);
        }
      }"""

assert target_clash_blk_wins in content, "target_clash_blk_wins not found"
content = content.replace(target_clash_blk_wins, replacement_clash_blk_wins, 1)

target_mutual_clash = """      const idx1 = attList.findIndex(s => s.uid === att.uid);
      if (idx1 !== -1) {
        const d1 = attList.splice(idx1, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += d1.currentCores;
        else DuelState.opponent.reserve += d1.currentCores;
      }
      const idx2 = defList.findIndex(s => s.uid === blk.uid);
      if (idx2 !== -1) {
        const d2 = defList.splice(idx2, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += d2.currentCores;
        else DuelState.opponent.reserve += d2.currentCores;
      }"""

replacement_mutual_clash = """      const idx1 = attList.findIndex(s => s.uid === att.uid);
      if (idx1 !== -1) {
        const d1 = attList.splice(idx1, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += d1.currentCores;
        else DuelState.opponent.reserve += d1.currentCores;
        sendToTrash(d1, attSide, `Mutual destruction in clash with ${blk.name}`);
      }
      const idx2 = defList.findIndex(s => s.uid === blk.uid);
      if (idx2 !== -1) {
        const d2 = defList.splice(idx2, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += d2.currentCores;
        else DuelState.opponent.reserve += d2.currentCores;
        sendToTrash(d2, defSide, `Mutual destruction in clash with ${att.name}`);
      }"""

assert target_mutual_clash in content, "target_mutual_clash not found"
content = content.replace(target_mutual_clash, replacement_mutual_clash, 1)

# 11. Refresh Step core returns
target_player_refresh = """    } else if (step === 'REFRESH') {
      let count = 0;
      DuelState.player.field.forEach(s => {
        if (s.isExhausted) count++;
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Refreshed ${count} Spirit(s) on your field back to Ready position.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();"""

replacement_player_refresh = """    } else if (step === 'REFRESH') {
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

assert target_player_refresh in content, "target_player_refresh not found"
content = content.replace(target_player_refresh, replacement_player_refresh, 1)

target_opponent_refresh = """    } else if (currentPhase === 'REFRESH') {
      DuelState.opponent.field.forEach(s => {
        s.isExhausted = false;
        s.hasAttacked = false;
      });
      AudioFX.shield();
      addLog(`🔄 **REFRESH STEP**: Opponent refreshed all Spirits to Ready.`, 'step');
      DuelState.phaseIndex = 4; // to MAIN
      renderDuelTable();
      safeTimeout(advanceOpponentStep, 800);"""

replacement_opponent_refresh = """    } else if (currentPhase === 'REFRESH') {
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

assert target_opponent_refresh in content, "target_opponent_refresh not found"
content = content.replace(target_opponent_refresh, replacement_opponent_refresh, 1)

# 12. Zone Viewer Modal Functions & Export
target_before_export = """    scrollToBattleArena,
    updateLobbyPreviews
  };"""

replacement_before_export = """    scrollToBattleArena,
    updateLobbyPreviews,
    openZoneModal,
    closeZoneModal,
    closeZoneModalBg,
    switchZoneTab,
    inspectZoneCard,
    renderZoneModal,
    sendToTrash,
    sendToVoid
  };"""

assert target_before_export in content, "target_before_export not found"

zone_functions = """
  // ── ZONE VIEWER MODAL CONTROLLERS (TRASH & VOID) ──
  function openZoneModal(tab = 'player-trash') {
    DuelState.currentZoneTab = tab;
    renderZoneModal();
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'flex';
    AudioFX.buttonTick();
  }

  function closeZoneModal() {
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'none';
    AudioFX.buttonTick();
  }

  function closeZoneModalBg(e) {
    if (e.target && e.target.id === 'battleZoneModal') {
      closeZoneModal();
    }
  }

  function switchZoneTab(tab) {
    DuelState.currentZoneTab = tab;
    AudioFX.buttonTick();
    renderZoneModal();
  }

  function inspectZoneCard(cardName) {
    const decoded = decodeURIComponent(cardName);
    openCardDetail(decoded);
  }

  function renderZoneModal() {
    const tab = DuelState.currentZoneTab || 'player-trash';
    const pTrash = DuelState.player.trashCards || [];
    const oTrash = DuelState.opponent.trashCards || [];
    const pVoid = DuelState.player.voidCards || [];
    const oVoid = DuelState.opponent.voidCards || [];
    const totalVoidCards = pVoid.length + oVoid.length;

    // Update tab count badges
    const pCountEl = document.getElementById('tabCountPlayerTrash');
    if (pCountEl) pCountEl.textContent = pTrash.length;
    const oCountEl = document.getElementById('tabCountOpponentTrash');
    if (oCountEl) oCountEl.textContent = oTrash.length;
    const vCountEl = document.getElementById('tabCountVoid');
    if (vCountEl) vCountEl.textContent = totalVoidCards;

    // Update active tab buttons
    const btnPT = document.getElementById('tabPlayerTrash');
    if (btnPT) btnPT.classList.toggle('active', tab === 'player-trash');
    const btnOT = document.getElementById('tabOpponentTrash');
    if (btnOT) btnOT.classList.toggle('active', tab === 'opponent-trash');
    const btnV = document.getElementById('tabVoid');
    if (btnV) btnV.classList.toggle('active', tab === 'void');

    // Update Title & Subtitle
    const titleEl = document.getElementById('zoneModalTitle');
    const subEl = document.getElementById('zoneModalSubtitle');
    const bodyEl = document.getElementById('zoneModalBody');
    if (!bodyEl) return;

    if (tab === 'player-trash') {
      if (titleEl) titleEl.textContent = '🪦 Your Trash (Graveyard)';
      if (subEl) subEl.textContent = `Cards and spirits sent to your graveyard (${pTrash.length} Card${pTrash.length === 1 ? '' : 's'} • ${DuelState.player.trash} Core${DuelState.player.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!pTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🪦</div>
            <div class="zone-empty-text">Your Trash is Empty</div>
            <div class="zone-empty-subtext">Spirits destroyed in battle, depleted of cores by sacrifices, or used magic spells will be placed here.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'opponent-trash') {
      if (titleEl) titleEl.textContent = `💀 Opponent's Trash (Graveyard)`;
      if (subEl) subEl.textContent = `Cards and spirits sent to opponent's graveyard (${oTrash.length} Card${oTrash.length === 1 ? '' : 's'} • ${DuelState.opponent.trash} Core${DuelState.opponent.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!oTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">💀</div>
            <div class="zone-empty-text">Opponent's Trash is Empty</div>
            <div class="zone-empty-subtext">No enemy spirits have fallen or been milled to the graveyard yet.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${oTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'void') {
      if (titleEl) titleEl.textContent = '🌌 The Void (Cosmic Reservoir & Removed Zone)';
      if (subEl) subEl.textContent = 'Infinite source of Cores and the dimensional void for banished cards';
      const allVoidCards = [...pVoid, ...oVoid];
      
      let voidHtml = `
        <div class="void-cosmic-overview">
          <div class="void-cosmic-banner">
            <div class="void-cosmic-icon">🌌</div>
            <div class="void-cosmic-text">
              <div class="void-cosmic-title">Cosmic Void Reservoir (ボイド)</div>
              <div class="void-cosmic-desc">
                In official Battle Spirits rules, The Void is the boundless reservoir of universal energy from which all Cores materialize. At each player's <strong>Core Step</strong>, 1 Core is transferred from the Void directly into their Reserve.
              </div>
            </div>
          </div>

          <div class="void-stats-grid">
            <div class="void-stat-box">
              <div class="void-stat-num">∞</div>
              <div class="void-stat-lbl">Void Cores Remaining</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${DuelState.turn}</div>
              <div class="void-stat-lbl">Duel Round / Turn</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${totalVoidCards}</div>
              <div class="void-stat-lbl">Cards Banished to Void</div>
            </div>
          </div>
      `;

      if (allVoidCards.length > 0) {
        voidHtml += `
          <div class="void-cards-section-header">🌌 Cards Banished to The Void (${allVoidCards.length})</div>
          <div class="zone-cards-grid">
            ${allVoidCards.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.voidReason ? `<div class="zone-card-reason" style="border-left-color:#c084fc;">🌌 ${c.voidReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        voidHtml += `
          <div class="zone-empty-state" style="padding: 1.5rem 1rem;">
            <div class="zone-empty-icon" style="font-size:2.5rem;">✨</div>
            <div class="zone-empty-text">No Cards Currently Banished in The Void</div>
            <div class="zone-empty-subtext">Cards removed completely from the game by Void banishment effects will be held here.</div>
          </div>
        `;
      }

      voidHtml += `</div>`;
      bodyEl.innerHTML = voidHtml;
    }
  }

"""

content = content.replace(target_before_export, zone_functions + replacement_before_export, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated battle_arena.js with Grave & Void Zone viewer logic!")
