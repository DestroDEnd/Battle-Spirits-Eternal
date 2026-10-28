import sys

with open('deck.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_marker = '<!-- ═══════════════ STANDARD COLOR DECKS (6 REALMS) ═══════════════ -->'
end_marker = '<div class="deck-view" id="deckView">'

start = html.find(start_marker)
end = html.find(end_marker)

if start == -1 or end == -1:
    print('Error: markers not found in deck.html')
    sys.exit(1)

compact_section = """<!-- ═══════════════ STANDARD COLOR DECKS (6 REALMS) ═══════════════ -->
  <section class="std-decks-section" id="stdDecksSection">
    <div class="std-decks-header">
      <div class="std-decks-header-left">
        <div class="std-decks-badge">
          <span class="pulse-dot"></span>
          <span>STARTER DECKS</span>
        </div>
        <h2 class="std-decks-title">Standard Starter Decks</h2>
        <span class="std-decks-sub">Official 40-card archetype decklists for each of the 6 colors</span>
      </div>
      <div class="std-decks-header-right">
        <!-- Quick realm chips visible when collapsed -->
        <div class="std-header-chips" id="stdHeaderChips" style="display:none;">
          <button class="chip-btn chip-red" onclick="loadStandardDeck('red')" title="Load Red Starter">🔴 Red</button>
          <button class="chip-btn chip-purple" onclick="loadStandardDeck('purple')" title="Load Purple Starter">🟣 Purple</button>
          <button class="chip-btn chip-green" onclick="loadStandardDeck('green')" title="Load Green Starter">🟢 Green</button>
          <button class="chip-btn chip-white" onclick="loadStandardDeck('white')" title="Load White Starter">⚪ White</button>
          <button class="chip-btn chip-yellow" onclick="loadStandardDeck('yellow')" title="Load Yellow Starter">🟡 Yellow</button>
          <button class="chip-btn chip-blue" onclick="loadStandardDeck('blue')" title="Load Blue Starter">🔵 Blue</button>
        </div>
        <button class="btn-std-toggle" id="btnStdToggle" onclick="toggleStdDecksCollapse()" title="Toggle compact/collapsed view">
          ▾ Hide Starters
        </button>
      </div>
    </div>

    <!-- 6 Color Deck Cards Grid (Compact Single-Row on Desktop) -->
    <div class="std-decks-grid" id="stdDecksGrid">
      <!-- Red Deck Card -->
      <div class="std-deck-card card-color-red" title="Hero Dragon's Blazing Soul (Standard Red)">
        <div class="std-deck-top">
          <span class="std-deck-icon">🔴</span>
          <span class="std-deck-tag tag-red">RED AGGRO</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Hero Dragon's Blazing Soul</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Lord-Dragon</span>
          <span class="ace-pill">Burning-Soul</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('red')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('red')" title="Preview Deck List">👁️</button>
        </div>
      </div>

      <!-- Purple Deck Card -->
      <div class="std-deck-card card-color-purple" title="Netherworld Curse & Seven Shoguns (Standard Purple)">
        <div class="std-deck-top">
          <span class="std-deck-icon">🟣</span>
          <span class="std-deck-tag tag-purple">PURPLE CONTROL</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Netherworld Curse</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Desperado</span>
          <span class="ace-pill">Dark-Clymenus</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('purple')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('purple')" title="Preview Deck List">👁️</button>
        </div>
      </div>

      <!-- Green Deck Card -->
      <div class="std-deck-card card-color-green" title="Emerald Gale of Insect Sovereigns (Standard Green)">
        <div class="std-deck-top">
          <span class="std-deck-icon">🟢</span>
          <span class="std-deck-tag tag-green">GREEN RAMP</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Emerald Gale Insects</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Kingtaurus</span>
          <span class="ace-pill">Kaiseratlas</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('green')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('green')" title="Preview Deck List">👁️</button>
        </div>
      </div>

      <!-- White Deck Card -->
      <div class="std-deck-card card-color-white" title="Armed Fortress & Mobile Machine Deity (Standard White)">
        <div class="std-deck-top">
          <span class="std-deck-icon">⚪</span>
          <span class="std-deck-tag tag-white">WHITE DEFENSE</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Armed Fortress</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Grand-Woden</span>
          <span class="ace-pill">Enterprise</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('white')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('white')" title="Preview Deck List">👁️</button>
        </div>
      </div>

      <!-- Yellow Deck Card -->
      <div class="std-deck-card card-color-yellow" title="Celestial Symphony of Seraphs (Standard Yellow)">
        <div class="std-deck-top">
          <span class="std-deck-icon">🟡</span>
          <span class="std-deck-tag tag-yellow">YELLOW MAGIC</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Celestial Symphony</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Tzaphkiel</span>
          <span class="ace-pill">Mikafar XV</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('yellow')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('yellow')" title="Preview Deck List">👁️</button>
        </div>
      </div>

      <!-- Blue Deck Card -->
      <div class="std-deck-card card-color-blue" title="Colosseum Titans & Golem Mill (Standard Blue)">
        <div class="std-deck-top">
          <span class="std-deck-icon">🔵</span>
          <span class="std-deck-tag tag-blue">BLUE MILL</span>
          <span class="std-deck-count">40</span>
        </div>
        <h3 class="std-deck-name">Colosseum Titans</h3>
        <div class="std-deck-aces">
          <span class="ace-pill">Alexander</span>
          <span class="ace-pill">Titus</span>
        </div>
        <div class="std-deck-actions">
          <button class="btn-load-std" onclick="loadStandardDeck('blue')">⚡ Load Deck</button>
          <button class="btn-preview-std" onclick="previewStandardDeck('blue')" title="Preview Deck List">👁️</button>
        </div>
      </div>
    </div>
  </section>

  """

html = html[:start] + compact_section + html[end:]

# Add helper functions for collapsing/expanding
toggle_script = """
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
"""

# Insert toggle_script before DOMContentLoaded
dom_idx = html.find("document.addEventListener('DOMContentLoaded'")
if dom_idx != -1:
    html = html[:dom_idx] + toggle_script + "\n" + html[dom_idx:]
    # In DOMContentLoaded, call initStdDecksCollapseState()
    html = html.replace("if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();",
                        "initStdDecksCollapseState();\n  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();")

# Bump cache buster in deck.html
html = html.replace('styles.css?v=3.2', 'styles.css?v=3.3')
html = html.replace('app.js?v=3.2', 'app.js?v=3.3')

with open('deck.html', 'wb') as f:
    f.write(html.encode('utf-8'))

print('deck.html updated with compact section!')
