pvp_code = """
  // ── ONLINE 1v1 MULTIPLAYER & 8-DIGIT DUELIST ID CONTROLLER ──
  let activeArenaMode = 'ai';
  let trackedDuelistId = null;

  function switchArenaMode(mode) {
    activeArenaMode = mode;
    const tabAi = document.getElementById('tabModeAi');
    const tabPvp = document.getElementById('tabModePvp');
    const lobbyAi = document.getElementById('battleLobby');
    const lobbyPvp = document.getElementById('onlinePvpLobby');

    if (mode === 'pvp') {
      if (tabAi) tabAi.classList.remove('active');
      if (tabPvp) tabPvp.classList.add('active');
      if (lobbyAi) lobbyAi.style.display = 'none';
      if (lobbyPvp) lobbyPvp.classList.add('active');
      initPvpLobbyView();
    } else {
      if (tabPvp) tabPvp.classList.remove('active');
      if (tabAi) tabAi.classList.add('active');
      if (lobbyPvp) lobbyPvp.classList.remove('active');
      if (lobbyAi) lobbyAi.style.display = 'block';
    }
  }

  function initPvpLobbyView() {
    const myIdEl = document.getElementById('myDuelistIdVal');
    const myNameEl = document.getElementById('pvpDuelistName');
    if (window.FirebaseService) {
      const user = window.FirebaseService.getUser();
      if (user && myNameEl) myNameEl.textContent = user.displayName || user.email || 'Duelist';
      const dId = window.FirebaseService.getFormattedDuelistId();
      if (dId && myIdEl) myIdEl.textContent = dId;
    }
    populatePvpDeckSelects();
  }

  function populatePvpDeckSelects() {
    const hostSel = document.getElementById('pvpHostDeckSelect');
    const joinSel = document.getElementById('pvpJoinDeckSelect');
    const registered = (window.DeckManager && window.DeckManager.getRegisteredDecks) ? window.DeckManager.getRegisteredDecks() : [];

    [hostSel, joinSel].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '';
      if (registered && registered.length > 0) {
        registered.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `🃏 ${d.name} (${d.cardCount || 40} Cards)`;
          sel.appendChild(opt);
        });
      } else {
        const stdOptions = [
          { val: 'deck_std_red', label: '🔴 Red: Hero Dragon (Standard)' },
          { val: 'deck_std_purple', label: '🟣 Purple: Netherworld (Standard)' },
          { val: 'deck_std_green', label: '🟢 Green: Emerald Gale (Standard)' },
          { val: 'deck_std_white', label: '⚪ White: Armed Fortress (Standard)' },
          { val: 'deck_std_yellow', label: '🟡 Yellow: Celestial Symphony (Standard)' },
          { val: 'deck_std_blue', label: '🔵 Blue: Colosseum Titans (Standard)' }
        ];
        stdOptions.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.val;
          opt.textContent = s.label;
          sel.appendChild(opt);
        });
      }
    });
  }

  function copyMyDuelistId() {
    let id = '8492-0153';
    if (window.FirebaseService) {
      id = window.FirebaseService.getFormattedDuelistId() || id;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        if (typeof showToast === 'function') showToast(`📋 Copied Duelist ID #${id} to clipboard!`, 'success');
      });
    }
  }

  async function trackDuelist() {
    const input = document.getElementById('trackerInputId');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    if (window.FirebaseService) {
      const res = await window.FirebaseService.lookupDuelist(rawId);
      const resBox = document.getElementById('trackerResultBox');
      const nameEl = document.getElementById('trackResultName');
      const statsEl = document.getElementById('trackResultStats');

      if (res.success && res.duelist) {
        trackedDuelistId = res.duelist.id;
        if (nameEl) nameEl.textContent = `${res.duelist.username} (ID: #${res.duelist.formattedId})`;
        if (statsEl) statsEl.textContent = `Deck: ${res.duelist.activeDeckName} • Record: ${res.duelist.victories} Wins`;
        if (resBox) resBox.style.display = 'block';
        if (typeof showToast === 'function') showToast(`Found Duelist ${res.duelist.username}!`, 'success');
      } else {
        if (typeof showToast === 'function') showToast(res.error || 'Duelist not found', 'error');
        if (resBox) resBox.style.display = 'none';
      }
    }
  }

  function challengeTrackedDuelist() {
    if (!trackedDuelistId) return;
    hostOnlineDuel(trackedDuelistId);
  }

  async function hostOnlineDuel(targetId = null) {
    const sel = document.getElementById('pvpHostDeckSelect');
    const deckId = sel ? sel.value : 'deck_std_red';
    const deck = (window.DeckManager && window.DeckManager.getDeckById) ? window.DeckManager.getDeckById(deckId) : { name: 'Standard Red' };

    if (window.MultiplayerService) {
      try {
        const { roomId } = await window.MultiplayerService.createRoom(deck, targetId);
        const modal = document.getElementById('pvpWaitingModal');
        const codeEl = document.getElementById('pvpWaitingRoomCode');
        if (codeEl) codeEl.textContent = roomId;
        if (modal) modal.style.display = 'flex';

        window.addEventListener('bse_opponent_joined', (e) => {
          if (modal) modal.style.display = 'none';
          if (typeof showToast === 'function') showToast(`⚔️ Opponent "${e.detail.name}" joined the duel!`, 'success');
          startOnlineDuelMatch(deckId, e.detail.deck, true);
        }, { once: true });
      } catch (err) {
        if (typeof showToast === 'function') showToast(`Failed to host room: ${err.message}`, 'error');
      }
    }
  }

  async function joinOnlineDuel() {
    const codeInput = document.getElementById('pvpJoinRoomCode');
    const sel = document.getElementById('pvpJoinDeckSelect');
    if (!codeInput || !codeInput.value.trim()) {
      if (typeof showToast === 'function') showToast('Please enter a 6-letter room code (e.g. BSE-7492)', 'warning');
      return;
    }
    const roomCode = codeInput.value.trim().toUpperCase();
    const deckId = sel ? sel.value : 'deck_std_blue';
    const deck = (window.DeckManager && window.DeckManager.getDeckById) ? window.DeckManager.getDeckById(deckId) : { name: 'Standard Blue' };

    if (window.MultiplayerService) {
      try {
        const { roomId, host } = await window.MultiplayerService.joinRoom(roomCode, deck);
        if (typeof showToast === 'function') showToast(`Connected to ${host.name}'s room! Entering battle...`, 'success');
        startOnlineDuelMatch(deckId, host.deck, false);
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'error');
      }
    }
  }

  function cancelHostRoom() {
    const modal = document.getElementById('pvpWaitingModal');
    if (modal) modal.style.display = 'none';
    if (window.MultiplayerService) window.MultiplayerService.leaveRoom();
    if (typeof showToast === 'function') showToast('Cancelled duel room.', 'info');
  }

  function copyRoomLink() {
    const codeEl = document.getElementById('pvpWaitingRoomCode');
    const code = codeEl ? codeEl.textContent : '';
    const link = `${window.location.origin}/arena?room=${encodeURIComponent(code)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        if (typeof showToast === 'function') showToast('📋 Copied direct room link to clipboard!', 'success');
      });
    }
  }

  function startOnlineDuelMatch(playerDeckId, opponentDeckOrId, isHostRole) {
    DuelState.isOnline = true;
    DuelState.isHost = isHostRole;

    startDuel(playerDeckId, opponentDeckOrId);

    if (window.MultiplayerService) {
      window.MultiplayerService.onOpponentAction((action) => {
        handleIncomingMultiplayerAction(action);
      });
    }
  }

  function handleIncomingMultiplayerAction(action) {
    if (!action || !action.type) return;
    const { type, payload } = action;

    if (type === 'ATTACK_DECLARE') {
      const attackerName = payload.attackerName || 'Opposing Spirit';
      addLog(`⚔️ **ONLINE OPPONENT STRIKE**: Opponent declared attack with "${attackerName}"!`, 'damage');
      if (typeof AudioFX !== 'undefined' && AudioFX.slash) AudioFX.slash();
      if (typeof openBlockPromptModal === 'function') {
        openBlockPromptModal(payload.attacker);
      }
    } else if (type === 'BLOCK_DECLARE') {
      const blockerName = payload.blockerName || 'Opposing Spirit';
      addLog(`🛡️ **ONLINE OPPONENT BLOCK**: Opponent blocked with "${blockerName}"!`, 'damage');
    } else if (type === 'FLASH_CAST') {
      addLog(`✨ **ONLINE OPPONENT FLASH**: Opponent channeled "${payload.magicName}"!`, 'magic');
      if (typeof AudioFX !== 'undefined' && AudioFX.magic) AudioFX.magic();
    } else if (type === 'STEP_ADVANCE') {
      addLog(`⏩ **STEP ADVANCE**: Opponent advanced to ${payload.step} Step.`, 'step');
    } else if (type === 'LIFE_DAMAGE') {
      DuelState.opponent.life = payload.remainingLife;
      if (typeof AudioFX !== 'undefined' && AudioFX.lifeDamage) AudioFX.lifeDamage();
      renderDuelTable();
      checkGameOver();
    }
  }
"""

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = "  window.BattleArena = {"
if pvp_code not in js:
    js = js.replace(target, pvp_code + "\n  window.BattleArena = {\n    switchMode: switchArenaMode,\n    copyMyDuelistId,\n    trackDuelist,\n    challengeTrackedDuelist,\n    hostOnlineDuel,\n    joinOnlineDuel,\n    cancelHostRoom,\n    copyRoomLink,", 1)
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Injected PvP and Duelist ID methods into battle_arena.js!")
else:
    print("Already present in battle_arena.js")
