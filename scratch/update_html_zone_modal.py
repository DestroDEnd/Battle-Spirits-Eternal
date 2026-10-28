with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Opponent HUD pills
target_opp_hud = """            <div class="burst-slot-pill" id="opponentBurstSlot" title="Opponent Burst Zone">🔒 Burst: Empty</div>
            <span class="core-counter-pill void-counter-pill" title="The Void: Infinite Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>
            <span class="core-counter-pill">🪦 Trash: <span class="core-val" id="opponentTrashCores">0</span></span>"""

replacement_opp_hud = """            <div class="burst-slot-pill" id="opponentBurstSlot" onclick="BattleArena.inspectOpponentBurst()" title="Opponent Burst Zone">🔒 Burst: Empty</div>
            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>
            <span class="core-counter-pill clickable-zone-pill" id="opponentTrashPill" onclick="BattleArena.openZoneModal('opponent-trash')" title="Click to view cards in Opponent's Trash (Graveyard)">🪦 Trash: <span class="core-val" id="opponentTrashCores">0</span></span>"""

# 2. Update Void Zone on Battlefield
target_void_zone = """          <div class="battle-void-zone" id="battleVoidZone" title="The Void: Infinite reservoir of Cores in the Battle Spirits universe">"""
replacement_void_zone = """          <div class="battle-void-zone" id="battleVoidZone" onclick="BattleArena.openZoneModal('void')" style="cursor:pointer;" title="The Void: Click to inspect Void cards & Cosmic Core Reservoir">"""

# 3. Update Player HUD pills
target_player_hud = """            <div class="burst-slot-pill" id="playerBurstSlot" onclick="BattleArena.inspectBurst()" title="Your Set Burst Zone (Click to inspect)">🔒 Burst: Empty</div>
            <span class="core-counter-pill void-counter-pill" title="The Void: Infinite Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="playerReserveCores">4</span></span>
            <span class="core-counter-pill">🪦 Trash: <span class="core-val" id="playerTrashCores">0</span></span>"""

replacement_player_hud = """            <div class="burst-slot-pill" id="playerBurstSlot" onclick="BattleArena.inspectBurst()" title="Your Set Burst Zone (Click to inspect)">🔒 Burst: Empty</div>
            <span class="core-counter-pill void-counter-pill clickable-zone-pill" onclick="BattleArena.openZoneModal('void')" title="Click to view cards in The Void (Removed Zone) & Core Reservoir">🌌 Void: <span class="core-val">∞</span></span>
            <span class="core-counter-pill">💎 Reserve: <span class="core-val" id="playerReserveCores">4</span></span>
            <span class="core-counter-pill clickable-zone-pill" id="playerTrashPill" onclick="BattleArena.openZoneModal('player-trash')" title="Click to view cards in your Trash (Graveyard)">🪦 Trash: <span class="core-val" id="playerTrashCores">0</span></span>"""

# 4. Add Toolbar Buttons
target_toolbar = """          <div class="toolbar-actions">
            <button class="btn-duel-tool" onclick="BattleArena.startDuel()">🔄 Restart Match</button>
            <button class="btn-duel-tool" onclick="document.getElementById('battleDuelTable').style.display='none'; document.getElementById('battleLobby').style.display='block';">📋 Switch Decks</button>
          </div>"""

replacement_toolbar = """          <div class="toolbar-actions">
            <button class="btn-duel-tool" onclick="BattleArena.openZoneModal('player-trash')" title="View cards in your Trash (Graveyard)">🪦 View Grave</button>
            <button class="btn-duel-tool" onclick="BattleArena.openZoneModal('void')" title="View cards in The Void & Cosmic Reservoir">🌌 View Void</button>
            <button class="btn-duel-tool" onclick="BattleArena.startDuel()">🔄 Restart Match</button>
            <button class="btn-duel-tool" onclick="document.getElementById('battleDuelTable').style.display='none'; document.getElementById('battleLobby').style.display='block';">📋 Switch Decks</button>
          </div>"""

# 5. Insert battleZoneModal before closing tag of battleArenaSection
target_modal_insert = """            <button class="btn-hero-quick-duel" onclick="BattleArena.closeResultModal(); window.location.href='/deck';" style="padding:0.75rem 1.5rem;">🃏 Edit in Deck Builder</button>
          </div>
        </div>
      </div>

    </section>"""

replacement_modal_insert = """            <button class="btn-hero-quick-duel" onclick="BattleArena.closeResultModal(); window.location.href='/deck';" style="padding:0.75rem 1.5rem;">🃏 Edit in Deck Builder</button>
          </div>
        </div>
      </div>

      <!-- ════════════════ ZONE VIEWER MODAL (TRASH / GRAVEYARD & VOID) ════════════════ -->
      <div class="battle-modal-overlay" id="battleZoneModal" onclick="BattleArena.closeZoneModalBg(event)">
        <div class="battle-modal-card zone-modal-card">
          <div class="zone-modal-header">
            <div class="zone-modal-title-group">
              <h3 class="zone-modal-title" id="zoneModalTitle">🪦 The Trash (Graveyard)</h3>
              <span class="zone-modal-subtitle" id="zoneModalSubtitle">View all cards sent to the graveyard</span>
            </div>
            <button class="zone-modal-close" onclick="BattleArena.closeZoneModal()">&times;</button>
          </div>

          <!-- Tab navigation: Player Trash | Opponent Trash | The Void -->
          <div class="zone-tabs-bar">
            <button class="zone-tab-btn active" id="tabPlayerTrash" onclick="BattleArena.switchZoneTab('player-trash')">
              🪦 Your Trash (<span id="tabCountPlayerTrash">0</span>)
            </button>
            <button class="zone-tab-btn" id="tabOpponentTrash" onclick="BattleArena.switchZoneTab('opponent-trash')">
              💀 Opponent Trash (<span id="tabCountOpponentTrash">0</span>)
            </button>
            <button class="zone-tab-btn" id="tabVoid" onclick="BattleArena.switchZoneTab('void')">
              🌌 The Void (<span id="tabCountVoid">0</span>)
            </button>
          </div>

          <!-- Modal Body / Cards Gallery -->
          <div class="zone-modal-body" id="zoneModalBody">
            <!-- Injected list of cards or cosmic void display -->
          </div>

          <!-- Modal Footer -->
          <div class="zone-modal-footer">
            <span class="zone-modal-tip" id="zoneModalTip">💡 Click any card to inspect full details, stats, levels &amp; abilities</span>
            <button class="btn-zone-close" onclick="BattleArena.closeZoneModal()">Close Zone View</button>
          </div>
        </div>
      </div>

    </section>"""

content_norm = content.replace('\r\n', '\n')

for t, r, name in [
    (target_opp_hud, replacement_opp_hud, 'target_opp_hud'),
    (target_void_zone, replacement_void_zone, 'target_void_zone'),
    (target_player_hud, replacement_player_hud, 'target_player_hud'),
    (target_toolbar, replacement_toolbar, 'target_toolbar'),
    (target_modal_insert, replacement_modal_insert, 'target_modal_insert')
]:
    t_norm = t.replace('\r\n', '\n')
    r_norm = r.replace('\r\n', '\n')
    assert t_norm in content_norm, f"{name} not found"
    content_norm = content_norm.replace(t_norm, r_norm, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated index.html with Zone Viewer Modal and triggers")
