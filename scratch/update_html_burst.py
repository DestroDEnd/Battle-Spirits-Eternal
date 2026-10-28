with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target_opp = """        <!-- Opponent Field (Battle Line) -->
        <div class="field-zone opponent-field-zone" id="opponentField">
          <!-- Opponent Spirits -->
        </div>"""

replacement_opp = """        <!-- Opponent Field Row (Battle Line + Burst Zone) -->
        <div class="battlefield-row">
          <div class="field-zone opponent-field-zone" id="opponentField">
            <!-- Opponent Spirits -->
          </div>
          <div class="burst-field-zone opponent-burst-zone" id="opponentBurstZone" onclick="BattleArena.inspectOpponentBurst()" title="Opponent Burst Zone">
            <!-- Opponent Burst Slot -->
          </div>
        </div>"""

target_player = """        <!-- Player Field (Battle Line) -->
        <div class="field-zone player-field-zone" id="playerField">
          <!-- Player Spirits -->
        </div>"""

replacement_player = """        <!-- Player Field Row (Battle Line + Burst Zone) -->
        <div class="battlefield-row">
          <div class="field-zone player-field-zone" id="playerField">
            <!-- Player Spirits -->
          </div>
          <div class="burst-field-zone player-burst-zone" id="playerBurstZone" onclick="BattleArena.inspectBurst()" title="Your Set Burst Zone (Click to inspect or activate)">
            <!-- Player Burst Slot -->
          </div>
        </div>"""

content_norm = content.replace('\r\n', '\n')
target_opp_norm = target_opp.replace('\r\n', '\n')
replacement_opp_norm = replacement_opp.replace('\r\n', '\n')
target_player_norm = target_player.replace('\r\n', '\n')
replacement_player_norm = replacement_player.replace('\r\n', '\n')

assert target_opp_norm in content_norm, "target_opp not found"
assert target_player_norm in content_norm, "target_player not found"

content_norm = content_norm.replace(target_opp_norm, replacement_opp_norm, 1)
content_norm = content_norm.replace(target_player_norm, replacement_player_norm, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated index.html with battlefield-row and burst zones")
