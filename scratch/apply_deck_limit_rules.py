import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Update deck.html
with open('deck.html', 'r', encoding='utf-8') as f:
    deck_html = f.read()

deck_html = deck_html.replace(
    'Total Cards (Standard: 40)',
    'Total Cards (Min: 40, No Upper Limit)'
)
deck_html = deck_html.replace(
    '<div class="deck-total" id="deckTotal">0 / 40</div>',
    '<div class="deck-total" id="deckTotal">0 Cards</div>'
)
deck_html = deck_html.replace(
    '<span class="pane-count-badge" id="listDeckCount">0 / 40</span>',
    '<span class="pane-count-badge" id="listDeckCount">0 Cards</span>'
)

old_render_deck = """  const total = entries.reduce((a, [, c]) => a + c, 0);
  const totalEl = document.getElementById('deckTotal');
  if (totalEl) totalEl.textContent = `${total} / 40`;
  
  const listCountEl = document.getElementById('listDeckCount');
  if (listCountEl) listCountEl.textContent = `${total} / 40`;"""

new_render_deck = """  const total = entries.reduce((a, [, c]) => a + c, 0);
  const totalEl = document.getElementById('deckTotal');
  if (totalEl) {
    if (total >= 40) {
      totalEl.textContent = `${total} Cards`;
      totalEl.style.color = '#34d399';
    } else {
      totalEl.textContent = `${total} / 40 Min`;
      totalEl.style.color = '#fbbf24';
    }
  }
  
  const listCountEl = document.getElementById('listDeckCount');
  if (listCountEl) {
    if (total >= 40) {
      listCountEl.textContent = `${total} Cards`;
      listCountEl.style.borderColor = 'rgba(16,185,129,0.5)';
      listCountEl.style.color = '#34d399';
    } else {
      listCountEl.textContent = `${total} / 40 Min`;
      listCountEl.style.borderColor = 'rgba(245,158,11,0.5)';
      listCountEl.style.color = '#fbbf24';
    }
  }"""

if old_render_deck in deck_html:
    deck_html = deck_html.replace(old_render_deck, new_render_deck)
    print("deck.html: Updated renderDeckView counts!")
else:
    print("deck.html: old_render_deck not found directly, checking variations...")
    # Normalize line endings
    deck_html_norm = deck_html.replace('\r\n', '\n')
    old_norm = old_render_deck.replace('\r\n', '\n')
    new_norm = new_render_deck.replace('\r\n', '\n')
    if old_norm in deck_html_norm:
        deck_html_norm = deck_html_norm.replace(old_norm, new_norm)
        deck_html = deck_html_norm
        print("deck.html: Updated renderDeckView counts via newline normalization!")

deck_html = deck_html.replace(
    '(${count}/40 cards - Incomplete)',
    '(${count}/40 min cards - Incomplete)'
)
deck_html = deck_html.replace(
    '(${activeCount}/40 cards — minimum 40 required)',
    '(${activeCount}/40 cards — minimum 40 required, no upper limit)'
)
deck_html = deck_html.replace(
    '⚠️ Needs 40 Cards (${activeCount}/40)',
    '⚠️ Needs 40+ Cards (${activeCount}/40 Min)'
)
deck_html = deck_html.replace(
    'title = \'Decks require at least 40 cards to register for battle\';',
    'title = \'Decks require at least 40 cards to register for battle (no upper limit)\';'
)
deck_html = deck_html.replace(
    'Decks require at least 40 cards (${count}/40). Add ${40 - count} more cards.',
    'Decks require at least 40 cards (${count}/40 min, no upper limit). Add ${40 - count} more cards.'
)

with open('deck.html', 'w', encoding='utf-8') as f:
    f.write(deck_html)
print("deck.html: Saved successfully!")

# 2. Update battle_arena.js
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_js = f.read()

arena_js = arena_js.replace(
    '(${count}/40 Cards - Incomplete)',
    '(${count}/40 min Cards - Incomplete)'
)
arena_js = arena_js.replace(
    '⚠️ <strong>Incomplete Deck (${totalCount} / 40 Cards)</strong><br>\n            Battle Spirits rules require at least 40 cards to enter battle.',
    '⚠️ <strong>Incomplete Deck (${totalCount} / 40 Min Cards)</strong><br>\n            Battle Spirits rules require at least 40 cards (no upper limit) to enter battle.'
)
arena_js = arena_js.replace(
    '⚠️ <strong>Incomplete Deck (${totalCount} / 40 Cards)</strong><br>\r\n            Battle Spirits rules require at least 40 cards to enter battle.',
    '⚠️ <strong>Incomplete Deck (${totalCount} / 40 Min Cards)</strong><br>\r\n            Battle Spirits rules require at least 40 cards (no upper limit) to enter battle.'
)
arena_js = arena_js.replace(
    'startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Cards)`;\n            startBtn.title = \'Cannot enter battle with less than 40 cards!\';',
    'startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Min Cards)`;\n            startBtn.title = \'Cannot enter battle with less than 40 cards (minimum 40 cards required, no upper limit)!\';'
)
arena_js = arena_js.replace(
    'startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Cards)`;\r\n            startBtn.title = \'Cannot enter battle with less than 40 cards!\';',
    'startBtn.innerHTML = `⚠️ Deck Incomplete (${totalCount}/40 Min Cards)`;\r\n            startBtn.title = \'Cannot enter battle with less than 40 cards (minimum 40 cards required, no upper limit)!\';'
)
arena_js = arena_js.replace(
    'Battle Spirits requires at least 40 cards!',
    'Battle Spirits requires at least 40 cards (no upper limit)!'
)
arena_js = arena_js.replace(
    'Minimum 40 cards required!',
    'Minimum 40 cards required (no upper limit)!'
)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena_js)
print("battle_arena.js: Saved successfully!")

# 3. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

index_html = index_html.replace(
    'Construct tournament-ready 40-card Battle Spirits decks with automated mana curve charts, 3-copy limits, and clipboard export.',
    'Construct tournament-ready Battle Spirits decks (minimum 40 cards, no upper limit) with automated mana curve charts, 3-copy limits, and clipboard export.'
)
index_html = index_html.replace(
    '<span class="hero-badge-pill">🎴 40-Card Deck Builder</span>',
    '<span class="hero-badge-pill">🎴 40+ Card Deck Builder</span>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)
print("index.html: Saved successfully!")
