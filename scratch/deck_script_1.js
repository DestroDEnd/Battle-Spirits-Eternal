
// Cache for card data objects
const deckCardCache = {};
let currentVisualFilter = 'all';

// ── DECK BUILDER MULTI-DECK MANAGER CONTROLLER ──
const DeckManagerUI = {
  init() {
    this.syncActiveDeck();
    this.renderDeckSelector();
  },

  renderDeckSelector() {
    const selectEl = document.getElementById('builderDeckSelect');
    const badgeEl = document.getElementById('dmDeckCountBadge');
    const statusEl = document.getElementById('dmActiveStatusBadge');
    const btnBattle = document.getElementById('dmBtnSetBattle');
    if (!selectEl || !window.DeckManager) return;

    const data = DeckManager.getAllData();
    const decks = data.decks || [];
    const activeId = DeckManager.getActiveDeckId();
    const battleId = DeckManager.getBattleDeckId();

    if (badgeEl) badgeEl.textContent = `${decks.length} Deck${decks.length !== 1 ? 's' : ''}`;

    selectEl.innerHTML = decks.map(d => {
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
    }
  },

  async onDeckSelectChange(newId) {
    if (!newId || !window.DeckManager) return;
    DeckManager.setActiveDeckId(newId);
    this.syncActiveDeck();
    this.renderDeckSelector();
    await renderDeckView();
    const active = DeckManager.getActiveDeck();
    const count = Object.values(S.deck || {}).reduce((a, b) => a + b, 0);
    showToast(`Switched to "${active?.name}" (${count} cards)`, 'info');
  },

  async onDeckSelectClick(val) {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    const sCount = Object.values(S.deck || {}).reduce((a, b) => a + b, 0);
    const aCount = Object.values(active?.cards || {}).reduce((a, b) => a + b, 0);
    if (sCount !== aCount || (sCount === 0 && aCount > 0)) {
      this.syncActiveDeck();
      this.renderDeckSelector();
      await renderDeckView();
    }
  },

  syncActiveDeck() {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    if (active) {
      if (active.isStandard && Object.keys(active.cards || {}).length === 0) {
        const canon = DeckManager.CANONICAL_STANDARD_DECKS ? DeckManager.CANONICAL_STANDARD_DECKS[(active.standardKey || 'red').toLowerCase()] : null;
        if (canon) active.cards = { ...canon.cards };
      }
      S.deck = { ...(active.cards || {}) };
      updateDeckBadge();
    }
  },

  setAsBattleDeck() {
    if (!window.DeckManager) return;
    const activeId = DeckManager.getActiveDeckId();
    DeckManager.setBattleDeckId(activeId);
    localStorage.setItem('colosseum_p1_deck_id', activeId);
    this.renderDeckSelector();
    const active = DeckManager.getActiveDeck();
    showToast(`⚔️ "${active?.name}" set as your Active Battle Deck for the Colosseum!`, 'success');
  },

  createNewDeckPrompt() {
    if (!window.DeckManager) return;
    const name = prompt('Enter a name for the new deck:', 'New Custom Deck');
    if (!name || !name.trim()) return;
    const newDeck = DeckManager.createDeck(name.trim(), 'Red', {});
    this.syncActiveDeck();
    this.renderDeckSelector();
    renderDeckView();
    showToast(`Created new deck "${newDeck.name}"!`, 'success');
  },

  renameCurrentDeckPrompt() {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    if (!active) return;
    const newName = prompt('Rename deck:', active.name);
    if (!newName || !newName.trim()) return;
    DeckManager.renameDeck(active.id, newName.trim());
    this.renderDeckSelector();
    renderDeckView();
    showToast(`Deck renamed to "${newName.trim()}"!`, 'success');
  },

  deleteCurrentDeckPrompt() {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    if (!active) return;
    if (!confirm(`Are you sure you want to delete deck "${active.name}"?`)) return;
    DeckManager.deleteDeck(active.id);
    this.syncActiveDeck();
    this.renderDeckSelector();
    renderDeckView();
    showToast(`Deck deleted. Switched to next deck.`, 'info');
  },

  async addStandardDeck(colorKey) {
    if (!colorKey || !window.DeckManager) return;
    try {
      showToast(`Registering standard ${colorKey.toUpperCase()} deck…`, 'info');
      const reg = await DeckManager.registerStandardDeck(colorKey);
      this.syncActiveDeck();
      this.renderDeckSelector();
      renderDeckView();
      showToast(`⚡ Registered "${reg.name}" into your decks! Available in Colosseum.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to register standard deck.', 'error');
    }
  }
};

function setVisualFilter(filterType) {
  currentVisualFilter = filterType;
  const tabs = ['all', 'spirit', 'brave', 'magic', 'nexus'];
  tabs.forEach(t => {
    const btn = document.getElementById('vTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle('active', t === filterType);
  });
  renderVisualCardsGrid();
}

function deleteFromDeck(name) {
  if (S.deck[name]) {
    delete S.deck[name];
    saveDeck();
    updateDeckBadge();
    renderDeckView();
    showToast(`Removed all copies of ${name}`, 'info');
  }
}

async function fetchCardsBatch(names) {
  const missing = names.filter(n => !deckCardCache[n]);
  if (!missing.length) return;
  try {
    const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(missing.join('|')));
    if (res.ok) {
      const data = await res.json();
      Object.assign(deckCardCache, data);
    }
  } catch (err) {
    console.error('Batch fetch error:', err);
  }
}

async function renderDeckView() {
  const entries = Object.entries(S.deck);
  const total = entries.reduce((a, [, c]) => a + c, 0);
  const totalEl = document.getElementById('deckTotal');
  if (totalEl) totalEl.textContent = `${total} / 40`;
  
  const listCountEl = document.getElementById('listDeckCount');
  if (listCountEl) listCountEl.textContent = `${total} / 40`;

  const visualCountEl = document.getElementById('visualDeckCount');
  if (visualCountEl) visualCountEl.textContent = `${entries.length} Unique • ${total} Cards`;
  
  updateDeckBadge();
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();

  const visualGridEl = document.getElementById('deckVisualGrid');
  const rowsEl = document.getElementById('deckRows');

  if (!entries.length) {
    const active = window.DeckManager ? DeckManager.getActiveDeck() : null;
    const isStd = active && active.isStandard;
    const stdKey = active ? (active.standardKey || 'red') : 'red';
    const restoreBtnHtml = isStd ? `
      <div style="margin-top:1rem;">
        <button class="btn-modal-primary" onclick="loadStandardDeck('${stdKey}')" style="background:linear-gradient(135deg,#e11d48,#be123c);border:none;padding:0.6rem 1.4rem;font-weight:700;border-radius:8px;cursor:pointer;">
          ⚡ Load All 40 Starter Cards
        </button>
      </div>` : '';

    const emptyHtml = `
      <div style="grid-column: 1 / -1; text-align:center; padding:3.5rem 1rem; color:var(--muted); width:100%;">
        <div style="font-size:2.8rem;margin-bottom:0.75rem;">🃏</div>
        <div style="font-size:1.15rem;font-weight:700;color:#fff;">${active ? active.name : 'Your deck'} is empty</div>
        <div style="font-size:0.85rem;margin-top:0.4rem;max-width:380px;margin-left:auto;margin-right:auto;">
          Select a Standard Deck above or browse the card library to begin building.
        </div>
        ${restoreBtnHtml}
        <a class="btn-modal-primary" style="display:inline-block;margin-top:1rem;text-decoration:none;padding:0.6rem 1.4rem;" href="/browse">🎴 Browse Cards Library</a>
      </div>`;
    if (visualGridEl) visualGridEl.innerHTML = emptyHtml;
    if (rowsEl) rowsEl.innerHTML = `<div style="text-align:center;padding:2rem 1rem;color:var(--muted);font-size:0.85rem;">No cards in deck yet.</div>`;
    renderCurveFromBins({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8+': 0 });
    updateTypeStats({ spirit: 0, brave: 0, magic: 0, nexus: 0 });
    return;
  }

  // Pre-fetch all card details in one instant batch call
  await fetchCardsBatch(entries.map(([name]) => name));

  // Render both visual cards and text list
  renderVisualCardsGrid();
  renderDeckRowsList();
  calculateAndRenderStats();
}

function renderVisualCardsGrid() {
  const visualGridEl = document.getElementById('deckVisualGrid');
  if (!visualGridEl) return;

  const entries = Object.entries(S.deck);
  if (!entries.length) return;

  // Filter entries if type filter active
  const filtered = entries.filter(([name]) => {
    if (currentVisualFilter === 'all') return true;
    const card = deckCardCache[name] || {};
    const type = (card.type || '').toLowerCase();
    if (currentVisualFilter === 'spirit') return type.includes('spirit');
    if (currentVisualFilter === 'brave') return type.includes('brave');
    if (currentVisualFilter === 'magic') return type.includes('magic');
    if (currentVisualFilter === 'nexus') return type.includes('nexus');
    return true;
  });

  if (!filtered.length) {
    visualGridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:2.5rem 1rem; color:var(--muted);">
        No ${currentVisualFilter} cards found in your deck.
      </div>`;
    return;
  }

  // Sort by Cost ascending, then Name
  filtered.sort(([a], [b]) => {
    const cA = deckCardCache[a] ? (deckCardCache[a].cost ?? 99) : 99;
    const cB = deckCardCache[b] ? (deckCardCache[b].cost ?? 99) : 99;
    if (cA !== cB) return cA - cB;
    return a.localeCompare(b);
  });

  visualGridEl.innerHTML = filtered.map(([name, count]) => {
    const card = deckCardCache[name] || {};
    const colorClass = (card.color || 'red').toLowerCase();
    const cost = card.cost !== null && card.cost !== undefined ? card.cost : '-';
    const cardNum = card.card_number || 'BS';
    const artUrl = card.image_url || FALLBACK_CARD_ART;

    return `
      <div class="deck-card-tile tile-color-${colorClass}" onclick="openCardDetail('${escapeJsStr(name)}')">
        <div class="tile-top-badges">
          <span class="tile-cost-pill">Cost ${cost}</span>
          <span class="tile-qty-pill">${count}x</span>
        </div>
        <div class="tile-img-box">
          <img class="tile-img" src="${artUrl}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" data-art="${artUrl}" onerror="if(!this.dataset.retried && this.dataset.art && this.dataset.art.startsWith(\'http\')){this.dataset.retried=\'1\'; this.src=\'/api/proxy-image?url=\' + encodeURIComponent(this.dataset.art);} else { this.onerror=null; this.src=FALLBACK_CARD_ART; }" />
        </div>
        <div class="tile-meta-bar">
          <span class="tile-code-tag">${esc(cardNum)}</span>
          <div class="tile-card-name" title="${esc(name)}">${esc(name)}</div>
        </div>
        <!-- Quick Action Overlay -->
        <div class="tile-hover-actions" onclick="event.stopPropagation()">
          <button class="tile-act-btn" onclick="removeFromDeck('${escapeJsStr(name)}')" title="Remove 1 Copy">-</button>
          <span class="tile-act-count">${count}</span>
          <button class="tile-act-btn" onclick="addToDeck('${escapeJsStr(name)}')" title="Add 1 Copy">+</button>
          <button class="tile-act-btn tile-del-btn" onclick="deleteFromDeck('${escapeJsStr(name)}')" title="Remove All Copies">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderDeckRowsList() {
  const rowsEl = document.getElementById('deckRows');
  if (!rowsEl) return;

  const entries = Object.entries(S.deck);
  if (!entries.length) return;

  // Sort rows by Cost then Name
  entries.sort(([a], [b]) => {
    const cA = deckCardCache[a] ? (deckCardCache[a].cost ?? 99) : 99;
    const cB = deckCardCache[b] ? (deckCardCache[b].cost ?? 99) : 99;
    if (cA !== cB) return cA - cB;
    return a.localeCompare(b);
  });

  rowsEl.innerHTML = entries.map(([name, count]) => {
    const card = deckCardCache[name] || {};
    const colorClass = (card.color || 'red').toLowerCase();
    const cost = card.cost !== null && card.cost !== undefined ? card.cost : '-';
    const cardNum = card.card_number || 'BS';
    const type = card.type || 'Card';

    return `
      <div class="deck-list-row row-${colorClass}">
        <span class="row-card-code">${esc(cardNum)}</span>
        <span class="row-color-dot dot-${colorClass}"></span>
        <div class="deck-row-info" onclick="openCardDetail('${escapeJsStr(name)}')">
          <div class="deck-row-name" title="${esc(name)}">${esc(name)}</div>
          <div class="deck-row-details">Cost ${cost} • ${esc(type)}</div>
        </div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="removeFromDeck('${escapeJsStr(name)}')">-</button>
          <span class="qty-val">${count}</span>
          <button class="qty-btn" onclick="addToDeck('${escapeJsStr(name)}')">+</button>
        </div>
        <button class="row-del-btn" onclick="deleteFromDeck('${escapeJsStr(name)}')" title="Remove All">✕</button>
      </div>
    `;
  }).join('');
}

function calculateAndRenderStats() {
  const entries = Object.entries(S.deck);
  const bins = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8+': 0 };
  const typeStats = { spirit: 0, brave: 0, magic: 0, nexus: 0 };

  for (const [name, count] of entries) {
    const card = deckCardCache[name] || {};
    const cost = (card.cost !== null && card.cost !== undefined) ? parseInt(card.cost) : 0;
    const key = cost >= 8 ? '8+' : String(Math.max(1, cost));
    if (bins[key] !== undefined) bins[key] += count;

    const t = (card.type || '').toLowerCase();
    if (t.includes('spirit')) typeStats.spirit += count;
    else if (t.includes('brave')) typeStats.brave += count;
    else if (t.includes('magic')) typeStats.magic += count;
    else if (t.includes('nexus')) typeStats.nexus += count;
    else typeStats.spirit += count;
  }

  renderCurveFromBins(bins);
  updateTypeStats(typeStats);
}

function updateTypeStats(stats) {
  const sp = document.getElementById('statSpirits');
  const br = document.getElementById('statBraves');
  const mg = document.getElementById('statMagic');
  const nx = document.getElementById('statNexus');
  if (sp) sp.textContent = `${stats.spirit} Spirits`;
  if (br) br.textContent = `${stats.brave} Braves`;
  if (mg) mg.textContent = `${stats.magic} Magic`;
  if (nx) nx.textContent = `${stats.nexus} Nexus`;
}

function renderCurveFromBins(bins) {
  const max = Math.max(...Object.values(bins), 1);
  const container = document.getElementById('curveBars');
  if (!container) return;

  container.innerHTML = Object.entries(bins).map(([lbl, cnt]) => `
    <div class="curve-col">
      <div class="curve-bar" style="height:${Math.round((cnt / max) * 60) + 4}px" title="${cnt} cards of cost ${lbl}"></div>
      <span class="curve-lbl">${lbl}</span>
    </div>`).join('');
}


function toggleStdDecksCollapse() {
  const section = document.getElementById('stdDecksSection');
  const btn = document.getElementById('btnStdToggle');
  const chips = document.getElementById('stdHeaderChips');
  if (!section) return;

  const isCollapsed = section.classList.toggle('is-collapsed');
  localStorage.setItem('std_decks_collapsed', isCollapsed ? '1' : '0');
  if (btn) {
    btn.innerHTML = isCollapsed ? '▸ Show Starters (6 Decks)' : '▾ Hide Starters';
  }
  if (chips) {
    chips.style.display = isCollapsed ? 'flex' : 'none';
  }
}

function initStdDecksCollapseState() {
  const isCollapsed = localStorage.getItem('std_decks_collapsed') === '1';
  const section = document.getElementById('stdDecksSection');
  const btn = document.getElementById('btnStdToggle');
  const chips = document.getElementById('stdHeaderChips');
  if (!section) return;
  if (isCollapsed) {
    section.classList.add('is-collapsed');
    if (btn) btn.innerHTML = '▸ Show Starters (6 Decks)';
    if (chips) chips.style.display = 'flex';
  } else {
    section.classList.remove('is-collapsed');
    if (btn) btn.innerHTML = '▾ Hide Starters';
    if (chips) chips.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initStdDecksCollapseState();
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();
  await renderDeckView();
});
