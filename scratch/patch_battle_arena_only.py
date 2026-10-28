with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_js = f.read()

start_marker = '  let pendingDuelDecks = null;'
end_marker = '  // ── STARTING A DUEL (WITH COIN TOSS) ──'

idx_start = arena_js.find(start_marker)
idx_end = arena_js.find(end_marker)

if idx_start == -1 or idx_end == -1:
    print('Error: start or end marker not found')
    exit(1)

new_coin_block = """  let pendingDuelDecks = null;
  let coinFlipWinner = null;
  let coinFlipAutoTimer = null;

  function launchCoinFlip(pDeckKey, oDeckKey) {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || 'red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    const userDeck = window.DeckManager ? DeckManager.getDeck(pDeckKey) : null;
    const pCount = userDeck ? Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0) : 0;
    if (pCount < 40) {
      if (typeof showToast === 'function') {
        showToast(`⚠️ Cannot battle! "${userDeck ? userDeck.name : 'Deck'}" only has ${pCount}/40 cards. Battle Spirits requires at least 40 cards!`, 'error');
      } else {
        alert(`Cannot battle! Deck only has ${pCount}/40 cards.`);
      }
      return;
    }

    pendingDuelDecks = { pDeckKey, oDeckKey };

    const modalEl = document.getElementById('battleCoinModal');
    if (!modalEl) {
      // Fallback if modal not present: 50/50 flip directly
      const fp = Math.random() < 0.5 ? 'player' : 'opponent';
      executeStartDuel(pDeckKey, oDeckKey, fp);
      return;
    }

    // Reset coin modal elements
    const coinEl = document.getElementById('coinFlipCoin');
    if (coinEl) {
      coinEl.className = 'coin-3d-disc';
    }
    const resultBox = document.getElementById('coinFlipResultBox');
    if (resultBox) {
      resultBox.style.display = 'none';
      resultBox.innerHTML = '';
    }
    const choiceRow = document.getElementById('coinChoiceRow');
    if (choiceRow) {
      choiceRow.style.display = 'none';
      choiceRow.innerHTML = '';
    }
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.style.display = 'inline-flex';
      triggerBtn.disabled = false;
      triggerBtn.textContent = '🪙 Flip Coin for First Turn!';
    }
    const proceedBtn = document.getElementById('btnCoinProceed');
    if (proceedBtn) {
      proceedBtn.style.display = 'none';
    }

    modalEl.classList.add('active');
  }

  function flipCoin() {
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.textContent = 'Spinning in the air...';
    }

    const coinEl = document.getElementById('coinFlipCoin');
    const isHeads = Math.random() < 0.5; // Heads = player, Tails = opponent
    coinFlipWinner = isHeads ? 'player' : 'opponent';

    AudioFX.coinFlip();

    if (coinEl) {
      coinEl.classList.remove('is-flipping', 'lands-heads', 'lands-tails');
      void coinEl.offsetWidth; // trigger reflow
      coinEl.classList.add('is-flipping');
    }

    setTimeout(() => {
      if (coinEl) {
        coinEl.classList.remove('is-flipping');
        coinEl.classList.add(isHeads ? 'lands-heads' : 'lands-tails');
      }

      const resultBox = document.getElementById('coinFlipResultBox');
      const choiceRow = document.getElementById('coinChoiceRow');
      const proceedBtn = document.getElementById('btnCoinProceed');
      if (triggerBtn) triggerBtn.style.display = 'none';

      if (isHeads) {
        // Player won the coin toss! Player gets to choose who goes first!
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.className = 'coin-result-banner heads';
          resultBox.innerHTML = `
            <div class="crb-icon">🎉</div>
            <div class="crb-title">HEADS — YOU WON THE COIN TOSS!</div>
            <div class="crb-sub">Official rules: As the toss winner, you choose who takes Turn 1:</div>
          `;
        }
        if (choiceRow) {
          choiceRow.style.display = 'grid';
          choiceRow.innerHTML = `
            <button class="btn-coin-choice btn-choice-first" onclick="BattleArena.selectFirstPlayer('player')">
              <span>⚔️ I'll Go First</span>
              <span class="btn-choice-tag">Take Turn 1 (Opening Initiative)</span>
            </button>
            <button class="btn-coin-choice btn-choice-second" onclick="BattleArena.selectFirstPlayer('opponent')">
              <span>🛡️ Opponent Goes First</span>
              <span class="btn-choice-tag">Take Turn 2 (Core & Flash Advantage)</span>
            </button>
          `;
        }
        if (proceedBtn) proceedBtn.style.display = 'none';
      } else {
        // Opponent won the toss! Opponent AI decides who goes first
        const oppChoosesFirst = Math.random() < 0.8;
        const chosenFirstPlayer = oppChoosesFirst ? 'opponent' : 'player';

        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.className = 'coin-result-banner tails';
          resultBox.innerHTML = `
            <div class="crb-icon">👑</div>
            <div class="crb-title">TAILS — OPPONENT WON THE COIN TOSS!</div>
            <div class="crb-sub">${oppChoosesFirst ? 'Opponent elected to take <strong>Turn 1</strong>!' : 'Opponent elected to have <strong>YOU</strong> take Turn 1!'}</div>
          `;
        }
        if (choiceRow) {
          choiceRow.style.display = 'none';
        }
        if (proceedBtn) {
          proceedBtn.style.display = 'inline-flex';
          proceedBtn.textContent = chosenFirstPlayer === 'player' ? '⚔️ Begin Duel (Your Turn 1) →' : '⚔️ Begin Duel (Opponent Turn 1) →';
          proceedBtn.onclick = () => selectFirstPlayer(chosenFirstPlayer);
        }

        // Auto proceed after 3s if player doesn't click
        coinFlipAutoTimer = setTimeout(() => {
          selectFirstPlayer(chosenFirstPlayer);
        }, 3000);
      }

    }, 1400);
  }

  function selectFirstPlayer(chosenFirstPlayer) {
    if (coinFlipAutoTimer) {
      clearTimeout(coinFlipAutoTimer);
      coinFlipAutoTimer = null;
    }
    const modalEl = document.getElementById('battleCoinModal');
    if (modalEl) modalEl.classList.remove('active');

    const pDeckKey = pendingDuelDecks ? pendingDuelDecks.pDeckKey : null;
    const oDeckKey = pendingDuelDecks ? pendingDuelDecks.oDeckKey : null;
    executeStartDuel(pDeckKey, oDeckKey, chosenFirstPlayer);
  }

  function proceedWithDuel() {
    selectFirstPlayer(coinFlipWinner || 'player');
  }

"""

arena_js = arena_js[:idx_start] + new_coin_block + arena_js[idx_end:]

# In renderArenaLobby: show incomplete tags
t_arena_opt = """      pOptions = registeredDecks.map(d => {
        let count = 40;
        if (!d.isStandard || (d.cards && Object.keys(d.cards).length > 0)) {
          count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
        }
        const colorIcons = { red: '🔴', purple: '🟣', green: '🟢', white: '⚪', yellow: '🟡', blue: '🔵' };
        const icon = colorIcons[(d.color || 'red').toLowerCase()] || '🃏';
        const isBattle = d.id === battleDeckId;
        const battleTag = isBattle ? ' ⚔️ [Battle Deck]' : '';
        return `<option value="${d.id}">${icon} ${d.name} (${count} Cards)${battleTag}</option>`;
      }).join('');"""

r_arena_opt = """      pOptions = registeredDecks.map(d => {
        const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
        const colorIcons = { red: '🔴', purple: '🟣', green: '🟢', white: '⚪', yellow: '🟡', blue: '🔵' };
        const icon = colorIcons[(d.color || 'red').toLowerCase()] || '🃏';
        const isBattle = d.id === battleDeckId;
        const battleTag = isBattle ? ' ⚔️ [Battle Deck]' : '';
        if (count < 40) {
          return `<option value="${d.id}" data-count="${count}">⚠️ ${d.name} (${count}/40 Cards - Incomplete)${battleTag}</option>`;
        }
        return `<option value="${d.id}" data-count="${count}">${icon} ${d.name} (${count} Cards)${battleTag}</option>`;
      }).join('');"""

if t_arena_opt in arena_js:
    arena_js = arena_js.replace(t_arena_opt, r_arena_opt, 1)

# In updateLobbyPreviews: add warning and block battle button if < 40 cards
t_update_prev = """        pCardEl.innerHTML = `
          <div class="deck-preview-badge color-badge-${color}">${userDeck.color.toUpperCase()} • ${totalCount} CARDS</div>
          <div class="deck-preview-name">${userDeck.name}</div>
          <div class="deck-preview-desc">${desc}</div>
          <div class="deck-preview-aces">
            ${aces.map(name => `<span class="preview-ace-pill">${name}</span>`).join('')}
          </div>
        `;"""

r_update_prev = """        const warningHtml = totalCount < 40 ? `
          <div class="lobby-deck-warning-box">
            ⚠️ <strong>Incomplete Deck (${totalCount} / 40 Cards)</strong><br>
            Battle Spirits rules require at least 40 cards to enter battle.<br>
            <a href="/deck" class="lobby-goto-builder">🎴 Build / Add Cards in Deck Builder →</a>
          </div>
        ` : '';

        pCardEl.innerHTML = `
          <div class="deck-preview-badge color-badge-${color}">${userDeck.color.toUpperCase()} • ${totalCount} CARDS</div>
          <div class="deck-preview-name">${userDeck.name}</div>
          <div class="deck-preview-desc">${desc}</div>
          <div class="deck-preview-aces">
            ${aces.map(name => `<span class="preview-ace-pill">${name}</span>`).join('')}
          </div>
          ${warningHtml}
        `;

        const startBtn = document.getElementById('btnEnterColosseum') || document.querySelector('.btn-start-duel');
        if (startBtn) {
          if (totalCount < 40) {
            startBtn.classList.add('btn-blocked');
            startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Cards)`;
            startBtn.title = 'Cannot enter battle with less than 40 cards!';
          } else {
            startBtn.classList.remove('btn-blocked');
            startBtn.innerHTML = '🔥 ENTER COLOSSEUM';
            startBtn.title = 'Enter the Colosseum Arena!';
          }
        }"""

if t_update_prev in arena_js:
    arena_js = arena_js.replace(t_update_prev, r_update_prev, 1)

# In startDuel: block if count < 40
t_start_duel = """  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {
    if (!firstPlayer) {
      launchCoinFlip(pDeckKey, oDeckKey);
      return;
    }
    return executeStartDuel(pDeckKey, oDeckKey, firstPlayer);
  }"""

r_start_duel = """  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value;
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';

    const userDeck = window.DeckManager ? DeckManager.getDeck(pDeckKey) : null;
    const pCount = userDeck ? Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0) : 0;
    if (pCount < 40) {
      if (typeof showToast === 'function') {
        showToast(`⚠️ Cannot battle! "${userDeck ? userDeck.name : 'Deck'}" only has ${pCount}/40 cards. Battle Spirits requires at least 40 cards!`, 'error');
      } else {
        alert(`Cannot battle! "${userDeck ? userDeck.name : 'Deck'}" only has ${pCount}/40 cards. Battle Spirits requires at least 40 cards!`);
      }
      return false;
    }

    if (!firstPlayer) {
      launchCoinFlip(pDeckKey, oDeckKey);
      return;
    }
    return executeStartDuel(pDeckKey, oDeckKey, firstPlayer);
  }"""

if t_start_duel in arena_js:
    arena_js = arena_js.replace(t_start_duel, r_start_duel, 1)

# In executeStartDuel: also guard against < 40 cards
t_exec_duel = """    // 1. Check DeckManager registered decks
    const userDeck = window.DeckManager ? DeckManager.getDeck(pDeckKey) : null;
    if (userDeck) {"""

r_exec_duel = """    // 1. Check DeckManager registered decks
    const userDeck = window.DeckManager ? DeckManager.getDeck(pDeckKey) : null;
    if (userDeck) {
      const userDeckCount = Object.values(userDeck.cards || {}).reduce((a, b) => a + b, 0);
      if (userDeckCount < 40) {
        if (typeof showToast === 'function') {
          showToast(`⚠️ Cannot start battle! Deck "${userDeck.name}" has only ${userDeckCount}/40 cards. Minimum 40 cards required!`, 'error');
        }
        return false;
      }"""

if t_exec_duel in arena_js:
    arena_js = arena_js.replace(t_exec_duel, r_exec_duel, 1)

# In window.BattleArena exports, add selectFirstPlayer
if 'selectFirstPlayer,' not in arena_js:
    arena_js = arena_js.replace('launchCoinFlip,', 'launchCoinFlip,\n    selectFirstPlayer,', 1)

with open('battle_arena.js', 'wb') as f:
    f.write(arena_js.encode('utf-8'))
print('battle_arena.js patched successfully!')
