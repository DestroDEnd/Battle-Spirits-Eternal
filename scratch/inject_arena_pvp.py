html_to_inject = """      <!-- ARENA MODE SWITCHER -->
      <div class="arena-mode-switch">
        <button class="arena-mode-tab active" id="tabModeAi" onclick="BattleArena.switchMode('ai')">
          <span>🤖 Champion Duels (vs AI)</span>
        </button>
        <button class="arena-mode-tab" id="tabModePvp" onclick="BattleArena.switchMode('pvp')">
          <span>🌐 Online 1v1 Multiplayer (PvP)</span>
        </button>
      </div>

      <!-- ONLINE PVP MULTIPLAYER LOBBY -->
      <div class="online-pvp-lobby" id="onlinePvpLobby">
        <div class="pvp-header-grid">
          <!-- 1. Player's Identity & 8-Digit Duelist ID -->
          <div class="duelist-id-card">
            <div>
              <div class="duelist-badge-row">
                <span style="font-size:0.8rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Your Official Duelist Identity</span>
                <span id="pvpAuthStatusBadge" style="font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:9999px;background:rgba(34,197,94,0.2);color:#4ade80;font-weight:700;">🟢 Online</span>
              </div>
              <div style="font-size:1.1rem;font-weight:800;color:#f1f5f9;margin-bottom:0.6rem;" id="pvpDuelistName">Duelist Challenger</div>
            </div>
            <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
              <div>
                <div style="font-size:0.7rem;color:#94a3b8;font-weight:700;margin-bottom:0.2rem;">UNIQUE 8-DIGIT DUELIST ID</div>
                <div class="duelist-id-pill" id="myDuelistIdVal">8492-0153</div>
              </div>
              <button class="btn-copy-id" onclick="BattleArena.copyMyDuelistId()" id="btnCopyDuelistId">📋 Copy ID</button>
            </div>
          </div>

          <!-- 2. Track & Find Another Duelist -->
          <div class="duelist-tracker-card">
            <span style="font-size:0.8rem;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:1px;">🔍 Track &amp; Challenge Duelist</span>
            <p style="font-size:0.78rem;color:#94a3b8;margin:0.25rem 0 0.5rem 0;">Enter any player's 8-digit Duelist ID to inspect their active deck and send a direct duel challenge.</p>
            <div class="tracker-input-group">
              <input type="text" class="tracker-input" id="trackerInputId" placeholder="e.g. 8492-0153" maxlength="9">
              <button class="btn-track-submit" onclick="BattleArena.trackDuelist()">Track</button>
            </div>
            <div class="tracker-result-box" id="trackerResultBox">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <strong id="trackResultName" style="color:#e2e8f0;">Duelist</strong>
                  <div style="font-size:0.75rem;color:#94a3b8;" id="trackResultStats">Active Deck: Hero Dragon</div>
                </div>
                <button class="btn-copy-id" style="background:#8b5cf6;color:#fff;border-color:#a855f7;" onclick="BattleArena.challengeTrackedDuelist()">⚔️ Challenge</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. PvP Match Actions: Host & Join -->
        <div class="pvp-actions-grid">
          <!-- Host Room Box -->
          <div class="pvp-action-box">
            <div>
              <div style="font-size:1.05rem;font-weight:800;color:#f97316;margin-bottom:0.35rem;">🔥 Host a 1v1 Match</div>
              <p style="font-size:0.8rem;color:#94a3b8;margin-bottom:1rem;">Generate a duel room code and invite friends or duelists by their 8-digit ID.</p>
              <label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.35rem;font-weight:700;">SELECT YOUR BATTLE DECK</label>
              <select class="arena-deck-select" id="pvpHostDeckSelect">
                <!-- Injected from registered decks -->
              </select>
            </div>
            <button class="btn-pvp-host" onclick="BattleArena.hostOnlineDuel()">⚔️ CREATE DUEL ROOM</button>
          </div>

          <!-- Join Room Box -->
          <div class="pvp-action-box">
            <div>
              <div style="font-size:1.05rem;font-weight:800;color:#38bdf8;margin-bottom:0.35rem;">⚡ Join a 1v1 Match</div>
              <p style="font-size:0.8rem;color:#94a3b8;margin-bottom:1rem;">Enter your friend's room code to connect and clash in real-time combat.</p>
              <label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.35rem;font-weight:700;">ENTER ROOM CODE</label>
              <input type="text" class="tracker-input" id="pvpJoinRoomCode" placeholder="e.g. BSE-7492" maxlength="8" style="width:100%;margin-bottom:0.85rem;text-transform:uppercase;">
              <label style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:0.35rem;font-weight:700;">SELECT YOUR BATTLE DECK</label>
              <select class="arena-deck-select" id="pvpJoinDeckSelect">
                <!-- Injected from registered decks -->
              </select>
            </div>
            <button class="btn-pvp-join" onclick="BattleArena.joinOnlineDuel()">🔥 JOIN &amp; ENTER DUEL</button>
          </div>
        </div>
      </div>

      <!-- WAITING MODAL FOR HOST -->
      <div class="pvp-waiting-modal" id="pvpWaitingModal">
        <div class="pvp-waiting-content">
          <div class="vs-crest" style="margin:0 auto 1rem auto;animation:pulse 2s infinite;">⚔️</div>
          <h3 style="font-size:1.35rem;font-weight:800;color:#fff;margin-bottom:0.5rem;">Waiting for Challenger...</h3>
          <p style="font-size:0.85rem;color:#94a3b8;">Share this room code with your opponent to begin the battle:</p>
          <div class="room-code-display" id="pvpWaitingRoomCode">BSE-0000</div>
          <button class="btn-copy-id" style="padding:0.6rem 1.25rem;font-size:0.9rem;" onclick="BattleArena.copyRoomLink()">📋 Copy Room Link</button>
          <div style="margin-top:1.5rem;">
            <button class="btn-zone-close" style="padding:0.4rem 1rem;" onclick="BattleArena.cancelHostRoom()">Cancel Duel</button>
          </div>
        </div>
      </div>

"""

scripts_to_inject = """<!-- WebAssembly SQLite Engine (sql.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js"></script>
<script src="/wasm_db.js?v=1.0"></script>

<!-- Firebase Client SDK (Compat CDN for GitHub Pages) -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
<script src="/firebase_service.js?v=1.0"></script>
<script src="/multiplayer_service.js?v=1.0"></script>
"""

with open('arena.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Inject mode switch & pvp lobby before <div class="battle-lobby" id="battleLobby">
target1 = '<div class="battle-lobby" id="battleLobby">'
if target1 in html and 'arena-mode-switch' not in html:
    html = html.replace(target1, html_to_inject + '      ' + target1, 1)

# 2. Inject scripts before <script src="/app.js?v=5.0"></script>
target2 = '<script src="/app.js?v=5.0"></script>'
if target2 in html and 'wasm_db.js' not in html:
    html = html.replace(target2, scripts_to_inject + target2, 1)

with open('arena.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated arena.html with Online PvP UI, WebAssembly SQLite, and Firebase SDKs!")
