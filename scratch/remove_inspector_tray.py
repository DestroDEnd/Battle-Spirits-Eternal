with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target_hand_zone = """        <!-- Player Hand Cards & Card Inspector -->
        <div class="player-hand-zone">
          <div class="hand-label">
            <span>Your Hand &amp; Card Details Inspector</span>
            <span style="font-size:0.75rem;color:#60a5fa;">Tip: Click any card in hand or on field to inspect complete stats, levels &amp; abilities</span>
          </div>
          <div class="hand-inspector-row">
            <div class="hand-track" id="playerHand">
              <!-- Injected hand cards -->
            </div>
            <!-- In-Duel Card Details Inspector Tray -->
            <div class="card-inspector-tray" id="cardInspectorTray">
              <!-- Dynamically populated by BattleArena.renderCardInspector() -->
            </div>
          </div>
        </div>"""

replacement_hand_zone = """        <!-- Player Hand Cards -->
        <div class="player-hand-zone">
          <div class="hand-label">
            <span>Your Hand</span>
            <span style="font-size:0.75rem;color:#94a3b8;">Click any card to inspect full stats, levels &amp; abilities</span>
          </div>
          <div class="hand-track" id="playerHand">
            <!-- Injected hand cards -->
          </div>
        </div>"""

assert target_hand_zone in html, "target_hand_zone not found in index.html"
html = html.replace(target_hand_zone, replacement_hand_zone, 1)

# Cache bust to v2.3
html = html.replace('/battle_arena.js?v=2.2', '/battle_arena.js?v=2.3')
html = html.replace('/styles.css', '/styles.css?v=2.3')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("[OK] Removed inspector tray from index.html")

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

target_hand_css = """.hand-track {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.35rem 0.2rem 0.5rem 0.2rem;
  flex: 0 1 auto;
  max-width: 52%;
  scrollbar-width: thin;
  scrollbar-color: rgba(245, 158, 11, 0.4) rgba(15, 23, 42, 0.6);
}

.card-inspector-tray {
  flex: 1 1 0;
  min-width: 320px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
  display: flex;
  box-shadow: inset 0 2px 14px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.25s ease-out;
}"""

replacement_hand_css = """.hand-track {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  overflow-x: auto;
  padding: 0.5rem 0.25rem;
  width: 100%;
  max-width: 100%;
  flex: 1 1 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(245, 158, 11, 0.4) rgba(15, 23, 42, 0.6);
}

.card-inspector-tray {
  display: none !important;
}"""

assert target_hand_css in css, "target_hand_css not found in styles.css"
css = css.replace(target_hand_css, replacement_hand_css, 1)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("[OK] Updated styles.css: hand-track is full width, inspector tray completely removed")
