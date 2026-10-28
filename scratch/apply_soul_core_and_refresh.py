import re

print("--- 1. Updating index.html ---")
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Opponent HUD: Add opponentSoulCorePill
target_opp_hud = """            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>"""

replacement_opp_hud = """            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <div class="soul-core-pill in-reserve" id="opponentSoulCorePill" title="Opponent's Soul Core">
              <span class="sc-icon">🔥</span> <span class="sc-label" id="opponentSoulCoreLabel">Soul Core: Reserve</span>
            </div>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>"""

assert target_opp_hud in html, "target_opp_hud not found in index.html"
html = html.replace(target_opp_hud, replacement_opp_hud, 1)

# 2. Player HUD: Add playerSoulCorePill
target_player_hud = """            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="playerReserveCores">4</span></span>"""

replacement_player_hud = """            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <div class="soul-core-pill in-reserve" id="playerSoulCorePill" onclick="BattleArena.inspectSoulCore()" title="Click to view Soul Core rules & status">
              <span class="sc-icon">🔥</span> <span class="sc-label" id="playerSoulCoreLabel">Soul Core: Reserve</span>
            </div>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="playerReserveCores">4</span></span>"""

assert target_player_hud in html, "target_player_hud not found in index.html"
html = html.replace(target_player_hud, replacement_player_hud, 1)

# 3. Step 4 REFRESH: Update description and button
target_step_refresh = """          <!-- Step 4: REFRESH -->
          <div class="step-card" id="stepCard_REFRESH">
            <div class="sc-header">
              <span class="sc-num">4</span>
              <span class="sc-name">REFRESH STEP</span>
              <span class="sc-status status-pending" id="stepStatus_REFRESH">Pending</span>
            </div>
            <p class="sc-desc">Return all exhausted Spirits on field to Ready.</p>
            <button class="btn-step-action" id="btnStep_REFRESH" onclick="BattleArena.manualStep('REFRESH')">🔄 Ready All Spirits</button>
          </div>"""

replacement_step_refresh = """          <!-- Step 4: REFRESH -->
          <div class="step-card" id="stepCard_REFRESH">
            <div class="sc-header">
              <span class="sc-num">4</span>
              <span class="sc-name">REFRESH STEP</span>
              <span class="sc-status status-pending" id="stepStatus_REFRESH">Pending</span>
            </div>
            <p class="sc-desc">Return all used Cores from Trash to Reserve, and restore exhausted Spirits to Ready.</p>
            <button class="btn-step-action" id="btnStep_REFRESH" onclick="BattleArena.manualStep('REFRESH')">🔄 Return Cores &amp; Ready Spirits</button>
          </div>"""

assert target_step_refresh in html, "target_step_refresh not found in index.html"
html = html.replace(target_step_refresh, replacement_step_refresh, 1)

# 4. Cache bust battle_arena.js
target_script = '<script src="/battle_arena.js"></script>'
replacement_script = '<script src="/battle_arena.js?v=2.2"></script>'
if target_script in html:
    html = html.replace(target_script, replacement_script, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] index.html successfully updated")

print("\n--- 2. Updating styles.css ---")
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

soul_core_styles = """
/* ═══════════════════════════════════════════════════════════════════════
   BATTLE ARENA: SOUL CORE (ソウルコア) MECHANIC STYLING
   ═══════════════════════════════════════════════════════════════════════ */
.soul-core-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}

.soul-core-pill.in-reserve {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25));
  border: 1px solid rgba(245, 158, 11, 0.6);
  color: #fef08a;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
}
.soul-core-pill.in-reserve:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 18px rgba(245, 158, 11, 0.55);
}

.soul-core-pill.on-field {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(168, 85, 247, 0.3));
  border: 1px solid #ef4444;
  color: #ffedd5;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.45);
}

.soul-core-pill.in-trash {
  background: rgba(30, 41, 59, 0.8);
  border: 1px dashed rgba(245, 158, 11, 0.4);
  color: #cbd5e1;
}

.soul-core-pill .sc-icon {
  font-size: 0.95rem;
  animation: soulFlamePulse 1.8s infinite alternate ease-in-out;
}

@keyframes soulFlamePulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.6)); }
  100% { transform: scale(1.18); filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)); }
}

/* Spirit Card Soul Core State on Battlefield */
.field-spirit-card.has-soul-core {
  border-color: #f59e0b !important;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.65), 0 0 35px rgba(239, 68, 68, 0.35) !important;
}

.spirit-soul-core-badge {
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.9), inset 0 0 4px #ffffff;
  z-index: 6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: soulBadgeFloat 2s ease-in-out infinite alternate;
  pointer-events: none;
  white-space: nowrap;
}

@keyframes soulBadgeFloat {
  0% { transform: translateX(-50%) translateY(0); box-shadow: 0 0 10px rgba(245, 158, 11, 0.7); }
  100% { transform: translateX(-50%) translateY(-2px); box-shadow: 0 0 20px rgba(239, 68, 68, 1); }
}

.fsc-sc-btn {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.22rem 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.25rem;
  width: 100%;
}
.fsc-sc-btn.place {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}
.fsc-sc-btn.place:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.7);
}
.fsc-sc-btn.remove {
  background: rgba(30, 41, 59, 0.85);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}
.fsc-sc-btn.remove:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fff;
}

/* Inspector Tray Soul Core Controls */
.inspector-soul-core-banner {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25));
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  color: #fef08a;
  font-size: 0.74rem;
  font-weight: 800;
  text-align: center;
  margin: 0.4rem 0;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.btn-place-soul-core {
  background: linear-gradient(135deg, #f59e0b, #ef4444) !important;
  color: #fff !important;
  font-weight: 800 !important;
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.45) !important;
}
.btn-place-soul-core:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.7) !important;
}

.btn-remove-soul-core {
  background: linear-gradient(135deg, #334155, #1e293b) !important;
  color: #fca5a5 !important;
  border: 1px solid rgba(239, 68, 68, 0.5) !important;
  font-weight: 800 !important;
}
.btn-remove-soul-core:hover {
  background: rgba(239, 68, 68, 0.25) !important;
  color: #fff !important;
}

.btn-step-refresh {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35) !important;
}
"""

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css + soul_core_styles)
print("[OK] styles.css successfully updated with Soul Core styles")
