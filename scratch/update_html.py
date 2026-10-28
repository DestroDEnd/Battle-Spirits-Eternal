with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """        <!-- Player Hand Cards -->
        <div class="player-hand-zone">
          <div class="hand-label">
            <span>Your Hand (Click to Summon or Cast)</span>
            <span style="font-size:0.7rem;color:#60a5fa;">Tip: Spirits require 1+ core on field to stay active</span>
          </div>
          <div class="hand-track" id="playerHand">
            <!-- Injected hand cards -->
          </div>
        </div>"""

replacement1 = """        <!-- Player Hand Cards & Card Inspector -->
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

target2 = """      <div class="modal-actions">
        <button class="btn-modal-primary" onclick="addModalCardToDeck()">+ Add to Deck</button>
        <a class="btn-modal-outline" id="modalDownload" href="#" target="_blank">⬇️ Save Art</a>"""

replacement2 = """      <div class="modal-actions">
        <button class="btn-modal-primary" id="modalDeckBtn" onclick="addModalCardToDeck()">+ Add to Deck</button>
        <button class="btn-modal-primary" id="modalDuelSummonBtn" style="display:none;background:#22c55e;">⚡ Summon in Duel</button>
        <a class="btn-modal-outline" id="modalDownload" href="#" target="_blank">⬇️ Save Art</a>"""

# Normalize CRLF
content_norm = content.replace('\r\n', '\n')
target1_norm = target1.replace('\r\n', '\n')
target2_norm = target2.replace('\r\n', '\n')
replacement1_norm = replacement1.replace('\r\n', '\n')
replacement2_norm = replacement2.replace('\r\n', '\n')

assert target1_norm in content_norm, 'target1 not found in index.html'
assert target2_norm in content_norm, 'target2 not found in index.html'

content_norm = content_norm.replace(target1_norm, replacement1_norm, 1)
content_norm = content_norm.replace(target2_norm, replacement2_norm, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content_norm)
print('Successfully updated index.html')
