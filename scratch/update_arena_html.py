import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('arena.html', 'r', encoding='utf-8') as f:
    content = f.read()

target = '<!-- MAGIC TARGET SELECTION MODAL -->'
replacement = '''<!-- WHEN BATTLES BURST DISCARD MODAL -->
      <div class="battle-modal-overlay" id="battleBurstDiscardModal">
        <div class="battle-modal-card" style="max-width:540px; text-align:left;">
          <div class="result-badge" style="background:linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,88,12,0.3)); color:#fb923c; border:1px solid #f97316; margin-bottom:0.75rem;">⚔️ [WHEN BATTLES] EFFECT</div>
          <h3 class="modal-title" style="margin-bottom:0.35rem;" id="burstDiscardTitle">Discard a Burst to Refresh?</h3>
          <p class="modal-desc" id="burstDiscardDesc" style="margin-bottom:0.9rem; font-size:0.85rem; color:#94a3b8;">
            At the end of battle, by discarding one of your Bursts, refresh this Spirit. Choose an available Burst card to discard:
          </p>
          <div id="burstDiscardOptions" style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem;">
            <!-- Injected options -->
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <button class="duel-ctrl-btn" style="background:#334155; border:1px solid #475569; color:#cbd5e1;" onclick="BattleArena.declineBurstDiscard()">✕ Decline (Keep Bursts)</button>
          </div>
        </div>
      </div>

      <!-- MAGIC TARGET SELECTION MODAL -->'''

if target in content:
    content = content.replace(target, replacement, 1)
    # Also update script cache-buster to v=5.1
    content = content.replace('battle_arena.js?v=5.0', 'battle_arena.js?v=5.1')
    content = content.replace('styles.css?v=5.0', 'styles.css?v=5.1')
    with open('arena.html', 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print("Successfully updated arena.html!")
else:
    print("Target not found!")
