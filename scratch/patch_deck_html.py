with open('deck.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update builderDeckSelect attributes
t1 = '<select class="dm-deck-select" id="builderDeckSelect" onchange="DeckManagerUI.onDeckSelectChange(this.value)">'
r1 = '<select class="dm-deck-select" id="builderDeckSelect" onchange="DeckManagerUI.onDeckSelectChange(this.value)" onclick="DeckManagerUI.onDeckSelectClick(this.value)" oninput="DeckManagerUI.onDeckSelectChange(this.value)">'

if t1 not in html:
    print('Error: t1 not found')
    exit(1)
html = html.replace(t1, r1, 1)

# 2. Update DeckManagerUI in deck.html
t2 = """    selectEl.innerHTML = decks.map(d => {
      let count = 40;
      if (!d.isStandard || (d.cards && Object.keys(d.cards).length > 0)) {
        count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
      }
      const isBattle = d.id === battleId;
      const tag = isBattle ? ' ⚔️ [Active Battle Deck]' : '';
      return `<option value="${d.id}">${d.name} (${count} cards)${tag}</option>`;
    }).join('');"""

r2 = """    selectEl.innerHTML = decks.map(d => {
      const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
      const isBattle = d.id === battleId;
      const tag = isBattle ? ' ⚔️ [Active Battle Deck]' : '';
      return `<option value="${d.id}">${d.name} (${count} cards)${tag}</option>`;
    }).join('');"""

if t2 not in html:
    print('Error: t2 not found')
    exit(1)
html = html.replace(t2, r2, 1)

# 3. Update onDeckSelectChange and add onDeckSelectClick and improve syncActiveDeck
t3 = """  onDeckSelectChange(newId) {
    if (!newId || !window.DeckManager) return;
    DeckManager.setActiveDeckId(newId);
    this.syncActiveDeck();
    renderDeckView();
    showToast(`Switched to "${DeckManager.getActiveDeck()?.name}"`, 'info');
  },

  syncActiveDeck() {
    if (!window.DeckManager) return;
    const active = DeckManager.getActiveDeck();
    if (active) {
      S.deck = { ...(active.cards || {}) };
      updateDeckBadge();
    }
  },"""

r3 = """  async onDeckSelectChange(newId) {
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
  },"""

if t3 not in html:
    print('Error: t3 not found')
    exit(1)
html = html.replace(t3, r3, 1)

# 4. Update empty state in renderDeckView
t4 = """  if (!entries.length) {
    const emptyHtml = `
      <div style="grid-column: 1 / -1; text-align:center; padding:3.5rem 1rem; color:var(--muted); width:100%;">
        <div style="font-size:2.8rem;margin-bottom:0.75rem;">🃏</div>
        <div style="font-size:1.15rem;font-weight:700;color:#fff;">Your deck is empty</div>
        <div style="font-size:0.85rem;margin-top:0.4rem;max-width:380px;margin-left:auto;margin-right:auto;">
          Select a Standard Deck above or browse the card library to begin building.
        </div>
        <a class="btn-modal-primary" style="display:inline-block;margin-top:1.25rem;text-decoration:none;padding:0.6rem 1.4rem;" href="/browse">🎴 Browse Cards Library</a>
      </div>`;"""

r4 = """  if (!entries.length) {
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
      </div>`;"""

if t4 not in html:
    print('Error: t4 not found')
    exit(1)
html = html.replace(t4, r4, 1)

# 5. Update DOMContentLoaded in deck.html
t5 = """document.addEventListener('DOMContentLoaded', () => {
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();
  renderDeckView();
});"""

r5 = """document.addEventListener('DOMContentLoaded', async () => {
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();
  await renderDeckView();
});"""

if t5 not in html:
    print('Error: t5 not found')
    exit(1)
html = html.replace(t5, r5, 1)

# Bump cache buster in deck.html to v=3.2
html = html.replace('/app.js?v=3.1', '/app.js?v=3.2')
html = html.replace('/styles.css?v=3.1', '/styles.css?v=3.2')

with open('deck.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('deck.html patched successfully!')
