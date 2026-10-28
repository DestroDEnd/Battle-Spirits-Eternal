with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target_block = """        <!-- AI Engine & Multi-Step Lookahead Dashboard -->
        <div class="arena-ai-dashboard" id="arenaAiDashboard">
          <div class="ai-dashboard-header">
            <div class="ai-dash-title-wrap">
              <span class="ai-dash-badge">PARADOXES ENGINE</span>
              <h3 class="ai-dash-title">🧠 AI Neural Heuristics & Expectimax Profiles</h3>
              <p class="ai-dash-sub">Trained State-Action-Result Lookahead weights across all 6 Color Archetypes inspired by Game-AI-Development-Toolkit.</p>
            </div>
            <div class="ai-dash-controls">
              <div class="ai-control-group">
                <label for="aiTrainGamesSelect" class="ai-ctrl-lbl">Simulations:</label>
                <select id="aiTrainGamesSelect" class="ai-select-games">
                  <option value="60">60 Matches (Quick)</option>
                  <option value="120" selected>120 Matches (Standard)</option>
                  <option value="300">300 Matches (Deep Tournament)</option>
                </select>
              </div>
              <button id="btnTrainAi" class="btn-train-ai" onclick="BattleArena.triggerAiTraining(document.getElementById('aiTrainGamesSelect').value)">
                ⚡ Train AI (Self-Play Tournament)
              </button>
            </div>
          </div>
          <div id="aiTrainStatus" class="ai-train-status ready">
            🟢 Trained Heuristics Active: Opponent AI calculates multi-step Expectimax utility for all summons and attacks.
          </div>
          <div class="ai-archetypes-grid" id="aiArchetypesGrid">
            <!-- Dynamically populated by BattleArena.renderAiDashboard() -->
          </div>
        </div>
"""

parts = content.split(target_block)
print(f'Found {len(parts)-1} occurrences')
# Keep the first split (first occurrence) and join remaining without target_block
restored = parts[0] + target_block + ''.join(parts[1:])

# Bump cache busters to v=3.0
restored = restored.replace('styles.css?v=2.9', 'styles.css?v=3.0')
restored = restored.replace('battle_arena.js?v=2.9', 'battle_arena.js?v=3.0')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(restored)

print('Cleaned up index.html successfully')
