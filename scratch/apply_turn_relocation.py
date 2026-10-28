import re, sys, shutil

sys.stdout.reconfigure(encoding='utf-8')
print("=== Starting Turn Relocation & Phase Strip Removal ===")

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Pattern for phase-track-bar
phase_bar_pattern = re.compile(r'\s*<!-- Phase Track HUD -->\s*<div class="phase-track-bar">.*?</div>\s*</div>', re.DOTALL)
match_bar = phase_bar_pattern.search(html)
if match_bar:
    html = html[:match_bar.start()] + html[match_bar.end():]
    print("✓ Removed phase-track-bar from top of main battlefield")
else:
    print("Warning: phase-track-bar pattern not matched directly, trying fallback...")
    idx_bar = html.find('<div class="phase-track-bar">')
    if idx_bar != -1:
        end_bar = html.find('</div>\n        </div>', idx_bar)
        if end_bar != -1:
            end_bar += len('</div>\n        </div>')
            html = html[:idx_bar] + html[end_bar:]
            print("✓ Removed phase-track-bar via fallback")

# Insert burst-center-turn-slot into battle-center-hub
hub_marker = '<div class="battle-clash-center" id="battleClashCenter">'
idx_hub = html.find(hub_marker)
if idx_hub == -1:
    print("ERROR: battleClashCenter not found in index.html")
    sys.exit(1)

# Find closing </div> of battleClashCenter
end_clash_center = html.find('</div>\n          </div>\n        </div>', idx_hub)
if end_clash_center == -1:
    end_clash_center = html.find('</div>\n        </div>\n\n        <!-- Player Field Row', idx_hub)

# Let's inspect the exact lines around closing battle-center-hub
idx_player_row = html.find('<!-- Player Field Row')
idx_close_hub = html.rfind('</div>', idx_hub, idx_player_row)

turn_slot_html = '''
          <!-- Center Turn Slot (Positioned Between Opponent and Player Burst Zones) -->
          <div class="burst-center-turn-slot" id="burstCenterTurnSlot">
            <div id="duelTurnLabel" class="turn-badge turn-player">
              <div class="turn-badge-label">TURN 1</div>
              <div class="turn-badge-player">Player's Turn</div>
              <div class="turn-badge-step">[MAIN STEP]</div>
            </div>
          </div>
'''

if 'id="burstCenterTurnSlot"' not in html:
    html = html[:idx_close_hub] + turn_slot_html + '        ' + html[idx_close_hub:]
    print("✓ Inserted #burstCenterTurnSlot between Opponent and Player Burst Zones")
else:
    print("✓ #burstCenterTurnSlot already present")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("✓ Saved index.html")

# 2. Update styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

turn_slot_css = '''
/* ── BURST CENTER TURN SLOT (Between Opponent & Player Burst Zones) ── */
.battle-center-hub {
  display: flex !important;
  gap: 0.85rem !important;
  align-items: stretch !important;
  width: 100% !important;
  margin: 0.65rem 0 !important;
}

.battle-void-zone {
  flex: 0 0 240px;
  width: 240px;
}

.battle-clash-center {
  flex: 1 1 0;
  min-width: 0;
}

.burst-center-turn-slot {
  flex: 0 0 148px;
  width: 148px;
  min-height: 84px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
}

.burst-center-turn-slot .turn-badge {
  width: 100%;
  border-radius: 0.75rem;
  padding: 0.45rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.burst-center-turn-slot .turn-badge.turn-player {
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.5), rgba(15, 23, 42, 0.95)) !important;
  border: 1.5px solid rgba(96, 165, 250, 0.6) !important;
  box-shadow: 0 0 14px rgba(59, 130, 246, 0.4), inset 0 0 12px rgba(59, 130, 246, 0.2) !important;
}

.burst-center-turn-slot .turn-badge.turn-opponent {
  background: linear-gradient(135deg, rgba(88, 28, 135, 0.5), rgba(15, 23, 42, 0.95)) !important;
  border: 1.5px solid rgba(192, 132, 252, 0.6) !important;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.4), inset 0 0 12px rgba(168, 85, 247, 0.2) !important;
}

.turn-badge-label {
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
  line-height: 1.1;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
}

.turn-badge-player {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.turn-badge.turn-player .turn-badge-player {
  color: #93c5fd;
  text-shadow: 0 0 8px rgba(147, 197, 253, 0.5);
}

.turn-badge.turn-opponent .turn-badge-player {
  color: #f472b6;
  text-shadow: 0 0 8px rgba(244, 114, 182, 0.5);
}

.turn-badge-step {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.03em;
  margin-top: 0.2rem;
  text-transform: uppercase;
}
'''

if '.burst-center-turn-slot' not in css:
    css = css + '\n' + turn_slot_css
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("✓ Added .burst-center-turn-slot styles to styles.css")
else:
    print("✓ .burst-center-turn-slot already present in styles.css")

# 3. Update battle_arena.js to render structured turn info
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena = f.read()

idx_tl = arena.find('const turnLabel = document.getElementById(\'duelTurnLabel\');')
if idx_tl != -1:
    idx_tl_end = arena.find('renderLifeCores(\'opponentLifeContainer\'', idx_tl)
    new_tl_code = '''const turnLabel = document.getElementById('duelTurnLabel');
    if (turnLabel) {
      const isPlayer = DuelState.activePlayer === 'player';
      const activeText = isPlayer ? "Player's Turn" : "Opponent's Turn";
      turnLabel.innerHTML = `
        <div class="turn-badge-label">TURN ${DuelState.turn}</div>
        <div class="turn-badge-player">${activeText}</div>
        <div class="turn-badge-step">[${currentPhase} STEP]</div>
      `;
      turnLabel.className = isPlayer ? 'turn-badge turn-player' : 'turn-badge turn-opponent';
      turnLabel.dataset.turn = DuelState.turn;
    }

    // '''
    arena = arena[:idx_tl] + new_tl_code + arena[idx_tl_end:]
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(arena)
    print("✓ Updated renderDuelTable in battle_arena.js to render structured turn info in #duelTurnLabel")

print("=== Turn Relocation Completed Successfully ===")
