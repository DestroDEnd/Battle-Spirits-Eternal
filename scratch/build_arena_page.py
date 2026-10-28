import sys, os

sys.stdout.reconfigure(encoding='utf-8')
print("=== Building Dedicated Battle Arena Page & Routes ===")

# 1. Read extracted arena section and cardModal
with open('scratch/extracted_arena_section.html', 'r', encoding='utf-8') as f:
    arena_section = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Extract cardModal from index.html
card_modal_start = index_html.find('<!-- ════════════════ CARD DETAIL MODAL ════════════════ -->')
card_modal_end = index_html.find('<!-- ════════════════ DECK IMPORT MODAL ════════════════ -->')
if card_modal_start != -1 and card_modal_end != -1:
    card_modal_html = index_html[card_modal_start:card_modal_end].strip()
else:
    print("Warning: cardModal boundaries not found cleanly, using empty fallback")
    card_modal_html = ""

# 2. Compose arena.html
arena_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="referrer" content="no-referrer"/>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
  <meta http-equiv="Pragma" content="no-cache"/>
  <meta http-equiv="Expires" content="0"/>
  <title>Destro's Colosseum Battle Arena | Battle Spirits</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=5.0">
</head>
<body class="arena-page-body">

<!-- ╔══════════════════ NAVBAR ══════════════════╗ -->
<header class="navbar">
  <a class="brand" href="/">
    <span class="brand-icon">⚔️</span>
    <span class="brand-title">Destro's BATTLE SPIRITS Colosseum</span>
  </a>
  <nav class="nav-tabs">
    <a class="tab-btn tab-btn-battle active" id="tabBattle" href="/arena">⚔️ Battle Arena</a>
    <a class="tab-btn" id="tabBrowse" href="/browse">🎴 Browse Cards</a>
    <a class="tab-btn" id="tabFamily" href="/family">📖 Family</a>
    <a class="tab-btn" id="tabSets" href="/sets">📦 Card Sets</a>
    <a class="tab-btn" id="tabDeck" href="/deck">🃏 Deck Builder <span class="deck-badge" id="deckBadge">0</span></a>
    <div class="nav-auth-slot" id="navAuthSlot">
      <a class="tab-btn tab-btn-auth" id="tabAuth" href="/login">👤 Login</a>
    </div>
  </nav>
</header>

<main class="main" style="max-width: 1440px; margin: 0 auto; padding: 1rem 1.25rem 3.5rem 1.25rem;">
  {arena_section}
</main>

{card_modal_html}

<!-- Global Toast Container -->
<div class="toast-container" id="toastContainer"></div>

<!-- Scripts -->
<script src="/app.js?v=5.0"></script>
<script src="/battle_arena.js?v=5.0"></script>
<script>
  // Check for auto-start or query parameters on dedicated arena page
  (function() {{
    window.addEventListener('load', () => {{
      const params = new URLSearchParams(window.location.search);
      const isQuick = params.get('duel') === 'quick' || params.get('quick') === '1';
      const autoStart = params.get('start') === '1' || params.get('start') === 'true' || isQuick;
      const playerDeck = params.get('deck');
      const oppDeck = params.get('opp');

      if (typeof BattleArena !== 'undefined') {{
        if (isQuick) {{
          setTimeout(() => BattleArena.quickLaunchDuel(), 150);
        }} else if (autoStart) {{
          setTimeout(() => BattleArena.startDuel(playerDeck || 'deck_std_red', oppDeck || 'deck_std_purple'), 150);
        }} else if (playerDeck) {{
          const sel = document.getElementById('arenaPlayerDeckSelect');
          if (sel) {{
            sel.value = playerDeck;
            if (BattleArena.renderLobbyDeckPreview) BattleArena.renderLobbyDeckPreview();
          }}
        }}
      }}
    }});
  }})();
</script>
</body>
</html>
'''

with open('arena.html', 'w', encoding='utf-8') as f:
    f.write(arena_html)
print("✅ Created arena.html")

# 3. Update server.py PAGE_ROUTES
with open('server.py', 'r', encoding='utf-8') as f:
    srv = f.read()

route_target = "            '/': 'index.html',\n            '/index.html': 'index.html',"
route_repl = "            '/': 'index.html',\n            '/index.html': 'index.html',\n            '/arena': 'arena.html',\n            '/arena.html': 'arena.html',\n            '/battle': 'arena.html',\n            '/battle.html': 'arena.html',"

if route_target in srv and "'/arena': 'arena.html'" not in srv:
    srv = srv.replace(route_target, route_repl)
    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(srv)
    print("✅ Added /arena and /battle to server.py PAGE_ROUTES")
else:
    print("server.py PAGE_ROUTES already contains /arena or target not matched")

# 4. Update index.html:
# - Navbar tabBattle: href="/arena"
# - Hero buttons: href="/arena" and href="/arena?duel=quick"
# - Remove embedded battle arena section (lines 90 to 867)
with open('index.html', 'r', encoding='utf-8') as f:
    idx_lines = f.readlines()

# Clean navbar link
for i in range(min(50, len(idx_lines))):
    if 'id="tabBattle"' in idx_lines[i]:
        idx_lines[i] = '    <a class="tab-btn tab-btn-battle" id="tabBattle" href="/arena">⚔️ Battle Arena</a>\n'

# Update hero buttons in lines 60-85
for i in range(50, min(100, len(idx_lines))):
    if 'btn-hero-battle' in idx_lines[i]:
        idx_lines[i] = '            <a class="btn-hero-battle" href="/arena">⚔️ Launch Battle Arena</a>\n'
    if 'btn-hero-quick-duel' in idx_lines[i]:
        idx_lines[i] = '            <a class="btn-hero-quick-duel" href="/arena?duel=quick">⚡ Quick Duel (Red vs Purple)</a>\n'

# Find start and end of battle-arena-section in index.html
start_sec = -1
end_sec = -1
for i, l in enumerate(idx_lines):
    if 'id="battleArena"' in l:
        start_sec = i - 1 # include comment line if any
    if 'id="featuredXRares"' in l:
        end_sec = i - 2 # right before featured showcase comment
        break

if start_sec != -1 and end_sec != -1:
    print(f"Removing embedded battleArena from index.html (lines {start_sec+1} to {end_sec+1})")
    idx_lines = idx_lines[:start_sec] + idx_lines[end_sec:]

new_idx_content = ''.join(idx_lines)
new_idx_content = new_idx_content.replace('styles.css?v=4.9', 'styles.css?v=5.0')
new_idx_content = new_idx_content.replace('battle_arena.js?v=4.9', 'battle_arena.js?v=5.0')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_idx_content)
print("✅ Updated index.html: removed embedded arena and updated hero/nav links to /arena")

# 5. Update navbars in browse.html, deck.html, family.html, sets.html, login.html, register.html
other_pages = ['browse.html', 'deck.html', 'family.html', 'sets.html', 'login.html', 'register.html']
for p in other_pages:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        updated = content.replace('href="/#battleArena"', 'href="/arena"').replace('href="#battleArena"', 'href="/arena"')
        updated = updated.replace('styles.css?v=4.7', 'styles.css?v=5.0').replace('styles.css?v=4.8', 'styles.css?v=5.0').replace('styles.css?v=4.9', 'styles.css?v=5.0')
        with open(p, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f"✅ Updated navbar link in {p}")

print("=== Build Completed Successfully ===")
