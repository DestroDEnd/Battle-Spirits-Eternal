import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('deck.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace std-decks-section with saved-decks-section
saved_decks_section = """  <!-- ═══════════════ SAVED DECKS LIST ═══════════════ -->
  <section class="saved-decks-section" id="savedDecksSection">
    <div class="saved-decks-header">
      <div class="saved-decks-header-left">
        <div class="saved-decks-badge">
          <span class="pulse-dot"></span>
          <span>MY SAVED DECKS</span>
        </div>
        <h2 class="saved-decks-title">Saved Decks Library</h2>
        <span class="saved-decks-sub">Click any deck to view all its cards in the dedicated Deck Viewer page, or edit / delete it.</span>
      </div>
      <div class="saved-decks-header-right">
        <button class="btn-create-deck-top" onclick="DeckManagerUI.startNewDeck()">
          + Build New Deck
        </button>
      </div>
    </div>

    <!-- Saved Decks Grid -->
    <div class="saved-decks-grid" id="savedDecksGrid">
      <!-- Populated dynamically by DeckManagerUI.renderSavedDecksList() -->
    </div>
  </section>"""

content = re.sub(
    r'<!-- ═══════════════ STANDARD COLOR DECKS \(6 REALMS\) ═══════════════ -->.*?<!-- Left Sidebar: Controls & Curve -->',
    saved_decks_section + '\n\n  <div class="deck-view" id="deckView">\n    \n    <!-- Left Sidebar: Controls & Curve -->',
    content,
    flags=re.DOTALL
)

# 2. Add inline rename box under dm-btn-grid and remove sidebar-std-box
rename_box_html = """        <div class="dm-btn-grid">
          <button class="dm-btn dm-btn-battle" id="dmBtnSetBattle" onclick="DeckManagerUI.setAsBattleDeck()" title="Mark this deck as your active deck in the Colosseum">
            ⚔️ Set for Battle
          </button>
          <button class="dm-btn dm-btn-new" onclick="DeckManagerUI.startNewDeck()" title="Create a new empty deck">
            + New Deck
          </button>
          <button class="dm-btn dm-btn-rename" onclick="DeckManagerUI.renameCurrentDeckPrompt()" title="Rename this deck">
            ✏️ Rename
          </button>
          <button class="dm-btn dm-btn-delete" onclick="DeckManagerUI.deleteCurrentDeckPrompt()" title="Delete this deck">
            🗑️ Delete
          </button>
        </div>
        <!-- Inline Rename Box (replaces browser popup) -->
        <div class="dm-rename-box" id="dmRenameBox" style="display:none;margin-top:0.6rem;">
          <div style="font-size:0.7rem;font-weight:700;color:#fbbf24;margin-bottom:0.3rem;">RENAME DECK:</div>
          <div style="display:flex;gap:0.35rem;">
            <input type="text" class="dm-rename-input" id="dmRenameInput" placeholder="Deck name..." maxlength="40" onkeydown="if(event.key==='Enter')DeckManagerUI.saveInlineRename();if(event.key==='Escape')DeckManagerUI.cancelInlineRename();">
            <button onclick="DeckManagerUI.saveInlineRename()" style="background:#10b981;border:none;border-radius:0.4rem;color:#fff;font-weight:700;padding:0.4rem 0.65rem;cursor:pointer;font-size:0.8rem;" title="Save">✓</button>
            <button onclick="DeckManagerUI.cancelInlineRename()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.4rem;color:#cbd5e1;padding:0.4rem 0.6rem;cursor:pointer;font-size:0.8rem;" title="Cancel">✕</button>
          </div>
        </div>
      </div>"""

content = re.sub(
    r'<div class="dm-btn-grid">.*?</div>\s*</div>\s*<!-- Quick Standard Deck Registration -->.*?</div>\s*<div>',
    rename_box_html + '\n\n      <div>',
    content,
    flags=re.DOTALL
)

# 3. Update Save Deck button
content = content.replace(
    '<button class="btn-page" onclick="saveDeckPrompt()">💾 Save Deck</button>',
    '<button class="btn-page" style="background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.3));border-color:rgba(16,185,129,0.5);color:#6ee7b7;font-weight:700;" onclick="DeckManagerUI.saveActiveDeckAndReset()">💾 Save Deck</button>'
)

# 4. Update DeckManagerUI script
new_dm_methods = """  async renderSavedDecksList() {
    const grid = document.getElementById('savedDecksGrid');
    if (!grid || !window.DeckManager) return;
    const decks = DeckManager.getDecks();
    const battleId = DeckManager.getBattleDeckId();

    const COLOR_ICONS = { red: '🔴', purple: '🟣', green: '🟢', white: '⚪', yellow: '🟡', blue: '🔵' };

    if (!decks || !decks.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--muted);background:rgba(15,23,42,0.5);border:1px dashed rgba(255,255,255,0.15);border-radius:1rem;"><h3>No saved decks yet</h3><p>Build a deck above and click "Save Deck" to add it to your library!</p></div>';
      return;
    }

    grid.innerHTML = decks.map(d => {
      const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
      const unique = Object.keys(d.cards || {}).length;
      const colorKey = (d.color || 'red').toLowerCase();
      const icon = COLOR_ICONS[colorKey] || '🃏';
      const isBattle = d.id === battleId;

      const statusHtml = isBattle 
        ? '<span class="saved-deck-badge-battle">⚔️ Active Battle Deck</span>'
        : (count >= 40 
          ? '<span class="saved-deck-badge-ready">✓ Ready (40+ Min)</span>'
          : '<span class="saved-deck-badge-incomplete">⚠️ Incomplete</span>');

      const coverCards = Object.keys(d.cards || {}).slice(0, 3);
      const coverHtml = coverCards.map(cName => {
        const cached = deckCardCache[cName];
        const art = cached ? (cached.image_url || '/assets/card_back.png') : '/assets/card_back.png';
        return `<img class="saved-deck-mini-art" src="${art}" alt="${esc(cName)}" title="${esc(cName)}" onerror="this.src='/assets/card_back.png'">`;
      }).join('');

      return `
        <div class="saved-deck-card card-theme-${colorKey}" onclick="window.location.href='/deck-view?id=${encodeURIComponent(d.id)}'" title="Click to view all cards in ${esc(d.name)}">
          <div class="saved-deck-top">
            <div class="saved-deck-title-row">
              <span class="saved-deck-icon">${icon}</span>
              <span class="saved-deck-name">${esc(d.name)}</span>
            </div>
            ${statusHtml}
          </div>

          <div class="saved-deck-meta-row">
            <span class="saved-deck-count-pill">${count} Cards</span>
            <span class="saved-deck-unique-pill">${unique} Unique</span>
            <span class="saved-deck-color-pill">${(d.color || 'Red').toUpperCase()}</span>
          </div>

          <div class="saved-deck-covers-row">
            ${coverHtml || '<div style="font-size:0.75rem;color:var(--muted);font-style:italic;">No cards in deck</div>'}
          </div>

          <div class="saved-deck-actions" onclick="event.stopPropagation()">
            <button class="btn-saved-action btn-saved-view" onclick="window.location.href='/deck-view?id=${encodeURIComponent(d.id)}'" title="View all cards in separate page">
              👁️ View
            </button>
            <button class="btn-saved-action btn-saved-edit" onclick="DeckManagerUI.editDeck('${esc(d.id)}')" title="Load deck into builder to edit">
              ✏️ Edit
            </button>
            <button class="btn-saved-action btn-saved-battle" onclick="DeckManagerUI.setAsBattleDeckById('${esc(d.id)}')" title="Set as Colosseum Battle Deck">
              ⚔️ Battle
            </button>
            <button class="btn-saved-action btn-saved-delete" onclick="DeckManagerUI.deleteDeckById('${esc(d.id)}')" title="Delete this deck">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  startNewDeck() {
    if (!window.DeckManager) return;
    const newDeck = DeckManager.createDeck('New Custom Deck', 'Red', {});
    S.deck = {};
    saveDeck();
    updateDeckBadge();
    this.renderDeckSelector();
    this.renderSavedDecksList();
    renderDeckView();
    showToast('✨ Clean new deck ready! Browse or add cards to build.', 'success');
    const builder = document.getElementById('deckView');
    if (builder) builder.scrollIntoView({ behavior: 'smooth' });
  },

  async editDeck(deckId) {
    if (!deckId || !window.DeckManager) return;
    const deck = DeckManager.getDeck(deckId);
    if (!deck) return;
    DeckManager.setActiveDeckId(deckId);
    S.deck = { ...(deck.cards || {}) };
    saveDeck();
    updateDeckBadge();
    this.renderDeckSelector();
    await renderDeckView();
    showToast(`✏️ Loaded "${deck.name}" into Deck Builder!`, 'info');
    const builder = document.getElementById('deckView');
    if (builder) builder.scrollIntoView({ behavior: 'smooth' });
  },

  async saveActiveDeckAndReset() {
    const cardEntries = Object.entries(S.deck || {});
    const total = cardEntries.reduce((a, [, c]) => a + c, 0);
    if (total === 0) {
      showToast('⚠️ Cannot save an empty deck! Add cards first.', 'warning');
      return;
    }
    const active = DeckManager.getActiveDeck();
    const deckName = active ? active.name : 'Custom Deck';

    // Save cards into current active deck
    if (active) {
      active.cards = { ...S.deck };
      active.updatedAt = Date.now();
      const data = DeckManager.getAllData();
      const idx = data.decks.findIndex(d => d.id === active.id);
      if (idx !== -1) {
        data.decks[idx].cards = { ...S.deck };
        data.decks[idx].updatedAt = Date.now();
      }
      DeckManager.saveAllData(data);
    }

    // Also sync to server API
    try {
      const cardsList = cardEntries.map(([n, c]) => ({ name: n, count: c }));
      await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: active ? active.id : undefined, name: deckName, cards: cardsList })
      });
    } catch (err) {
      console.warn('Server sync failed:', err);
    }

    showToast(`💾 Deck "${deckName}" saved to Saved Decks Library!`, 'success');

    // Empty the cards in deck section as requested
    S.deck = {};
    saveDeck();
    updateDeckBadge();

    // Create a new blank deck for the builder
    DeckManager.createDeck('New Custom Deck', 'Red', {});
    this.renderDeckSelector();
    this.renderSavedDecksList();
    await renderDeckView();

    // Scroll to Saved Decks list so user can see it
    const savedSection = document.getElementById('savedDecksSection');
    if (savedSection) savedSection.scrollIntoView({ behavior: 'smooth' });
  },

  renameCurrentDeckPrompt() {
    const box = document.getElementById('dmRenameBox');
    const input = document.getElementById('dmRenameInput');
    if (!box || !input) return;
    const active = DeckManager.getActiveDeck();
    if (!active) return;
    if (box.style.display === 'none' || !box.style.display) {
      box.style.display = 'block';
      input.value = active.name;
      input.focus();
      input.select();
    } else {
      box.style.display = 'none';
    }
  },

  saveInlineRename() {
    const input = document.getElementById('dmRenameInput');
    const box = document.getElementById('dmRenameBox');
    if (!input) return;
    const newName = input.value.trim();
    if (!newName) {
      showToast('Please enter a valid deck name.', 'error');
      return;
    }
    const active = DeckManager.getActiveDeck();
    if (!active) return;
    DeckManager.renameDeck(active.id, newName);
    if (box) box.style.display = 'none';
    this.renderDeckSelector();
    this.renderSavedDecksList();
    renderDeckView();
    showToast(`Deck renamed to "${newName}"!`, 'success');
  },

  cancelInlineRename() {
    const box = document.getElementById('dmRenameBox');
    if (box) box.style.display = 'none';
  },

  setAsBattleDeckById(id) {
    if (!window.DeckManager) return;
    const deck = DeckManager.getDeck(id);
    if (!deck) return;
    const count = Object.values(deck.cards || {}).reduce((a, b) => a + b, 0);
    if (count < 40) {
      showToast(`⚠️ Cannot register "${deck.name}" for battle! Decks require at least 40 cards (currently ${count}/40 min).`, 'error');
      return;
    }
    DeckManager.setBattleDeckId(id);
    localStorage.setItem('colosseum_p1_deck_id', id);
    this.renderDeckSelector();
    this.renderSavedDecksList();
    showToast(`🏆 "${deck.name}" is now your Active Colosseum Battle Deck!`, 'success');
  },

  deleteDeckById(id) {
    if (!window.DeckManager) return;
    const deck = DeckManager.getDeck(id);
    if (!deck) return;
    if (!confirm(`Are you sure you want to delete deck "${deck.name}"?`)) return;
    DeckManager.deleteDeck(id);
    fetch(`/api/decks?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    this.syncActiveDeck();
    this.renderDeckSelector();
    this.renderSavedDecksList();
    renderDeckView();
    showToast(`Deck "${deck.name}" deleted.`, 'info');
  },"""

# Replace in DeckManagerUI definition
content = re.sub(
    r'  createNewDeckPrompt\(\) \{.*?deleteCurrentDeckPrompt\(\) \{.*?\},',
    new_dm_methods,
    content,
    flags=re.DOTALL
)

# Update DOMContentLoaded to render saved decks list and handle ?edit=
content = re.sub(
    r'document\.addEventListener\(\'DOMContentLoaded\', async \(\) => \{.*?if \(typeof DeckManagerUI !== \'undefined\'\) DeckManagerUI\.init\(\);.*?await renderDeckView\(\);.*?\}\);',
    """document.addEventListener('DOMContentLoaded', async () => {
  if (typeof DeckManagerUI !== 'undefined') {
    DeckManagerUI.init();
    await DeckManagerUI.renderSavedDecksList();
  }
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId && typeof DeckManagerUI !== 'undefined') {
    await DeckManagerUI.editDeck(editId);
  } else {
    await renderDeckView();
  }
});""",
    content,
    flags=re.DOTALL
)

with open('deck.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("deck.html updated successfully!")
