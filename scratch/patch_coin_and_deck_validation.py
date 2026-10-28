import sys

# ── 1. PATCH app.js ──
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Replace getBattleDeckId and setBattleDeckId in DeckManager
t_get_battle = """  getBattleDeckId() {
    const saved = localStorage.getItem(this.BATTLE_KEY);
    const data = this.getAllData();
    if (saved && data.decks.some(d => d.id === saved)) {
      return saved;
    }
    if (data.battleDeckId && data.decks.some(d => d.id === data.battleDeckId)) {
      return data.battleDeckId;
    }
    return data.decks[0] ? data.decks[0].id : null;
  },

  setBattleDeckId(id) {
    const data = this.getAllData();
    if (!data.decks.some(d => d.id === id)) return;
    data.battleDeckId = id;
    localStorage.setItem(this.BATTLE_KEY, id);
    this.saveAllData(data);
  },"""

r_get_battle = """  getBattleDeckId() {
    const saved = localStorage.getItem(this.BATTLE_KEY);
    const data = this.getAllData();
    const countCards = (d) => Object.values(d?.cards || {}).reduce((a, b) => a + b, 0);

    if (saved) {
      const d = data.decks.find(x => x.id === saved);
      if (d && countCards(d) >= 40) return saved;
    }
    if (data.battleDeckId) {
      const d = data.decks.find(x => x.id === data.battleDeckId);
      if (d && countCards(d) >= 40) return data.battleDeckId;
    }
    // Fallback to first registered deck that has >= 40 cards
    const validDeck = data.decks.find(d => countCards(d) >= 40);
    if (validDeck) {
      data.battleDeckId = validDeck.id;
      localStorage.setItem(this.BATTLE_KEY, validDeck.id);
      return validDeck.id;
    }
    return data.decks[0] ? data.decks[0].id : null;
  },

  setBattleDeckId(id) {
    const data = this.getAllData();
    const deck = data.decks.find(d => d.id === id);
    if (!deck) return false;
    const count = Object.values(deck.cards || {}).reduce((a, b) => a + b, 0);
    if (count < 40) {
      console.warn(`Cannot set deck "${deck.name}" as battle deck: only has ${count}/40 cards.`);
      return false;
    }
    data.battleDeckId = id;
    localStorage.setItem(this.BATTLE_KEY, id);
    this.saveAllData(data);
    return true;
  },"""

if t_get_battle not in app_js:
    print('Error: t_get_battle not found in app.js')
    sys.exit(1)

app_js = app_js.replace(t_get_battle, r_get_battle, 1)

# In _migrateInitialDecks, make battleId point to a >= 40 card deck
t_init_battle = """    const activeId = decks[0].id;
    const battleId = decks[0].id;"""

r_init_battle = """    const activeId = decks[0].id;
    const battleDeck = decks.find(d => Object.values(d.cards || {}).reduce((a, b) => a + b, 0) >= 40) || decks[decks.length - 1];
    const battleId = battleDeck ? battleDeck.id : activeId;"""

if t_init_battle in app_js:
    app_js = app_js.replace(t_init_battle, r_init_battle, 1)

with open('app.js', 'wb') as f:
    f.write(app_js.encode('utf-8'))
print('app.js patched!')

# ── 2. PATCH deck.html ──
with open('deck.html', 'r', encoding='utf-8') as f:
    deck_html = f.read()

t_deck_sel = """    selectEl.innerHTML = decks.map(d => {
      const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
      const isBattle = d.id === battleId;
      const tag = isBattle ? ' ⚔️ [Active Battle Deck]' : '';
      return `<option value="${d.id}">${d.name} (${count} cards)${tag}</option>`;
    }).join('');

    // Ensure cursor is on previously selected deck!
    selectEl.value = activeId;

    // Update active battle status display
    const isCurrentBattle = activeId === battleId;
    if (statusEl) {
      if (isCurrentBattle) {
        statusEl.className = 'dm-active-status is-active';
        statusEl.innerHTML = `🏆 Active Battle Deck in Colosseum`;
      } else {
        statusEl.className = 'dm-active-status is-inactive';
        statusEl.innerHTML = `Standby Deck (Click "Set for Battle" to fight with this deck)`;
      }
    }
    if (btnBattle) {
      btnBattle.classList.toggle('is-battle-active', isCurrentBattle);
      btnBattle.innerHTML = isCurrentBattle ? '✅ Current Battle Deck' : '⚔️ Set for Battle';
    }"""

r_deck_sel = """    const active = DeckManager.getActiveDeck();
    const activeCount = Object.values(active?.cards || {}).reduce((a, b) => a + b, 0);

    selectEl.innerHTML = decks.map(d => {
      const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
      const isBattle = d.id === battleId;
      const tag = isBattle ? ' ⚔️ [Active Battle Deck]' : '';
      if (count < 40) {
        return `<option value="${d.id}">⚠️ ${d.name} (${count}/40 cards - Incomplete)${tag}</option>`;
      }
      return `<option value="${d.id}">${d.name} (${count} cards)${tag}</option>`;
    }).join('');

    // Ensure cursor is on previously selected deck!
    selectEl.value = activeId;

    // Update active battle status display
    const isCurrentBattle = activeId === battleId;
    if (statusEl) {
      if (activeCount < 40) {
        statusEl.className = 'dm-active-status is-ineligible';
        statusEl.innerHTML = `⚠️ Ineligible for Battle (${activeCount}/40 cards — minimum 40 required)`;
      } else if (isCurrentBattle) {
        statusEl.className = 'dm-active-status is-active';
        statusEl.innerHTML = `🏆 Active Battle Deck in Colosseum`;
      } else {
        statusEl.className = 'dm-active-status is-inactive';
        statusEl.innerHTML = `Standby Deck (Click "Set for Battle" to fight with this deck)`;
      }
    }
    if (btnBattle) {
      btnBattle.classList.remove('is-battle-active', 'is-ineligible');
      if (activeCount < 40) {
        btnBattle.classList.add('is-ineligible');
        btnBattle.innerHTML = `⚠️ Needs 40 Cards (${activeCount}/40)`;
        btnBattle.title = 'Decks require at least 40 cards to register for battle';
      } else if (isCurrentBattle) {
        btnBattle.classList.add('is-battle-active');
        btnBattle.innerHTML = '✅ Current Battle Deck';
        btnBattle.title = 'This deck is active in the Colosseum';
      } else {
        btnBattle.innerHTML = '⚔️ Set for Battle';
        btnBattle.title = 'Mark this deck as your active deck in the Colosseum';
      }
    }"""

if t_deck_sel not in deck_html:
    print('Error: t_deck_sel not found in deck.html')
    sys.exit(1)

deck_html = deck_html.replace(t_deck_sel, r_deck_sel, 1)

t_set_battle = """  setAsBattleDeck() {
    if (!window.DeckManager) return;
    const activeId = DeckManager.getActiveDeckId();
    DeckManager.setBattleDeckId(activeId);
    localStorage.setItem('colosseum_p1_deck_id', activeId);
    this.renderDeckSelector();
    const active = DeckManager.getActiveDeck();
    showToast(`⚔️ "${active?.name}" set as your Active Battle Deck for the Colosseum!`, 'success');
  },"""

r_set_battle = """  setAsBattleDeck() {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    if (!active) return;
    const count = Object.values(active.cards || {}).reduce((a, b) => a + b, 0);
    if (count < 40) {
      showToast(`⚠️ Cannot register "${active.name}" for battle! Decks require at least 40 cards (${count}/40). Add ${40 - count} more cards.`, 'error');
      return;
    }
    const ok = DeckManager.setBattleDeckId(active.id);
    if (ok) {
      localStorage.setItem('colosseum_p1_deck_id', active.id);
      this.renderDeckSelector();
      showToast(`⚔️ "${active.name}" set as your Active Battle Deck for the Colosseum!`, 'success');
    }
  },"""

if t_set_battle not in deck_html:
    print('Error: t_set_battle not found in deck.html')
    sys.exit(1)

deck_html = deck_html.replace(t_set_battle, r_set_battle, 1)

with open('deck.html', 'wb') as f:
    f.write(deck_html.encode('utf-8'))
print('deck.html patched!')

# ── 3. PATCH index.html ──
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Add ID to ENTER COLOSSEUM button if not present
if 'id="btnEnterColosseum"' not in index_html:
    index_html = index_html.replace(
        '<button class="btn-start-duel" onclick="BattleArena.startDuel()">🔥 ENTER COLOSSEUM</button>',
        '<button class="btn-start-duel" id="btnEnterColosseum" onclick="BattleArena.startDuel()">🔥 ENTER COLOSSEUM</button>'
    )

# Add coinChoiceRow to battleCoinModal
t_coin_modal = """          <!-- Result Announcement Banner -->
          <div id="coinFlipResultBox" style="display:none;"></div>

          <!-- Controls -->"""

r_coin_modal = """          <!-- Result Announcement Banner -->
          <div id="coinFlipResultBox" style="display:none;"></div>

          <!-- First Turn Selection Choice (when Player wins toss) -->
          <div class="coin-choice-grid" id="coinChoiceRow" style="display:none;"></div>

          <!-- Controls -->"""

if t_coin_modal not in index_html:
    print('Error: t_coin_modal not found in index.html')
    sys.exit(1)

index_html = index_html.replace(t_coin_modal, r_coin_modal, 1)

with open('index.html', 'wb') as f:
    f.write(index_html.encode('utf-8'))
print('index.html patched!')

# ── 4. PATCH battle_arena.js ──
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_js = f.read()

# Replace coin flip block
t_coin_block = """  let pendingDuelDecks = null;
  let coinFlipWinner = null;
  let coinFlipAutoTimer = null;

  function launchCoinFlip(pDeckKey, oDeckKey) {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || 'red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';
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
      if (resultBox) {
        resultBox.style.display = 'block';
        if (isHeads) {
          resultBox.className = 'coin-result-banner heads';
          resultBox.innerHTML = `
            <div class="crb-icon">🛡️</div>
            <div class="crb-title">HEADS — YOU GO FIRST!</div>
            <div class="crb-sub">Challenger won the coin toss and takes Turn 1!</div>
          `;
        } else {
          resultBox.className = 'coin-result-banner tails';
          resultBox.innerHTML = `
            <div class="crb-icon">👑</div>
            <div class="crb-title">TAILS — OPPONENT GOES FIRST!</div>
            <div class="crb-sub">Champion won the coin toss and takes Turn 1!</div>
          `;
        }
      }

      if (triggerBtn) triggerBtn.style.display = 'none';
      const proceedBtn = document.getElementById('btnCoinProceed');
      if (proceedBtn) {
        proceedBtn.style.display = 'inline-flex';
        proceedBtn.textContent = isHeads ? '⚔️ Begin Duel (Your Turn) →' : '⚔️ Begin Duel (Opponent Turn) →';
      }

      // Auto proceed after 2.5s if player doesn't click
      coinFlipAutoTimer = setTimeout(() => {
        proceedWithDuel();
      }, 2500);

    }, 1400);
  }

  function proceedWithDuel() {
    if (coinFlipAutoTimer) {
      clearTimeout(coinFlipAutoTimer);
      coinFlipAutoTimer = null;
    }
    const modalEl = document.getElementById('battleCoinModal');
    if (modalEl) modalEl.classList.remove('active');

    const pDeckKey = pendingDuelDecks ? pendingDuelDecks.pDeckKey : null;
    const oDeckKey = pendingDuelDecks ? pendingDuelDecks.oDeckKey : null;
    executeStartDuel(pDeckKey, oDeckKey, coinFlipWinner || 'player');
  }"""

r_coin_block = """  let pendingDuelDecks = null;
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
  }"""

if t_coin_block not in arena_js:
    print('Error: t_coin_block not found in battle_arena.js')
    sys.exit(1)

arena_js = arena_js.replace(t_coin_block, r_coin_block, 1)

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

if t_arena_opt not in arena_js:
    print('Error: t_arena_opt not found in battle_arena.js')
    sys.exit(1)

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

if t_update_prev not in arena_js:
    print('Error: t_update_prev not found in battle_arena.js')
    sys.exit(1)

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

if t_start_duel not in arena_js:
    print('Error: t_start_duel not found in battle_arena.js')
    sys.exit(1)

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

if t_exec_duel not in arena_js:
    print('Error: t_exec_duel not found in battle_arena.js')
    sys.exit(1)

arena_js = arena_js.replace(t_exec_duel, r_exec_duel, 1)

# In window.BattleArena exports, add selectFirstPlayer
if 'selectFirstPlayer,' not in arena_js:
    arena_js = arena_js.replace('launchCoinFlip,', 'launchCoinFlip,\n    selectFirstPlayer,', 1)

with open('battle_arena.js', 'wb') as f:
    f.write(arena_js.encode('utf-8'))
print('battle_arena.js patched!')

# ── 5. PATCH styles.css ──
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

extra_css = """
/* ── COIN FLIP CHOICE GRID (WHEN PLAYER WINS TOSS) ── */
.coin-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: 1.25rem;
}

.btn-coin-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 0.6rem;
  border-radius: 0.75rem;
  font-family: var(--font);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid transparent;
}

.btn-choice-first {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(30, 58, 138, 0.7));
  border-color: #3b82f6;
  color: #93c5fd;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
}

.btn-choice-first:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.6);
}

.btn-choice-second {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 95, 70, 0.7));
  border-color: #10b981;
  color: #a7f3d0;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
}

.btn-choice-second:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.6);
}

.btn-choice-tag {
  font-size: 0.68rem;
  opacity: 0.8;
  font-weight: 600;
}

/* ── INCOMPLETE DECK WARNINGS & BLOCKED BATTLE BUTTON ── */
.lobby-deck-warning-box {
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  font-size: 0.75rem;
  line-height: 1.4;
}

.lobby-goto-builder {
  display: inline-block;
  margin-top: 0.25rem;
  color: #fbbf24;
  font-weight: 700;
  text-decoration: underline;
}

.btn-start-duel.btn-blocked {
  background: linear-gradient(135deg, #475569, #334155) !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  opacity: 0.85;
}

.btn-start-duel.btn-blocked:hover {
  transform: none !important;
  box-shadow: none !important;
}

.dm-btn-battle.is-ineligible {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #fca5a5 !important;
  cursor: pointer;
}

.dm-active-status.is-ineligible {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #fca5a5 !important;
}
"""

if '.coin-choice-grid' not in css:
    css += extra_css
    with open('styles.css', 'wb') as f:
        f.write(css.encode('utf-8'))
    print('styles.css patched!')

print('ALL FILES PATCHED SUCCESSFULLY!')
