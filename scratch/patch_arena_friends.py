import os
import re

def patch_arena():
    # 1. Patch arena.html
    with open('arena.html', 'r', encoding='utf-8') as f:
        html = f.read()

    old_tracker_pattern = r'<!-- 2\. Track & Find Another Duelist -->[\s\S]*?<!-- 3\. PvP Match Actions'
    new_tracker = '''<!-- 2. Add Friend & Challenge Duelist -->
          <div class="duelist-tracker-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
              <span style="font-size:0.8rem;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:1px;">👥 Add Friend &amp; Duel Challenge</span>
              <button class="btn-sm-view-friends" onclick="window.DuelistSocial && DuelistSocial.openFriendsModal()" style="background:rgba(139,92,246,0.25);border:1px solid rgba(139,92,246,0.4);color:#c084fc;padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:700;cursor:pointer;">My Friends</button>
            </div>
            <p style="font-size:0.78rem;color:#94a3b8;margin:0.25rem 0 0.5rem 0;">Enter any player's 8-digit Duelist ID to add them to your friends list or send a direct 1v1 duel challenge.</p>
            <div class="tracker-input-group">
              <input type="text" class="tracker-input" id="trackerInputId" placeholder="e.g. 8492-0153" maxlength="9">
              <button class="btn-track-submit" onclick="BattleArena.findDuelist()">Search</button>
            </div>
            <div class="tracker-result-box" id="trackerResultBox" style="display:none;margin-top:0.6rem;padding:0.75rem;background:rgba(15,23,42,0.85);border-radius:8px;border:1px solid rgba(96,165,250,0.3);">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                <div>
                  <strong id="trackResultName" style="color:#e2e8f0;font-size:0.9rem;">Duelist</strong>
                  <div style="font-size:0.75rem;color:#4ade80;font-weight:600;margin-top:2px;" id="trackResultStats">🟢 Ready to Duel</div>
                </div>
                <div style="display:flex;gap:0.4rem;">
                  <button class="btn-copy-id" style="background:#3b82f6;color:#fff;border-color:#60a5fa;" onclick="BattleArena.addTrackedFriend()">🤝 Add Friend</button>
                  <button class="btn-copy-id" style="background:#8b5cf6;color:#fff;border-color:#a855f7;" onclick="BattleArena.challengeTrackedDuelist()">⚔️ Challenge</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. PvP Match Actions'''

    if re.search(old_tracker_pattern, html):
        html = re.sub(old_tracker_pattern, new_tracker, html)
        with open('arena.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('arena.html patched!')
    else:
        print('Could not find tracker pattern in arena.html')

    # 2. Patch battle_arena.js
    with open('battle_arena.js', 'r', encoding='utf-8') as f:
        js = f.read()

    old_funcs = '''  async function trackDuelist() {
    const input = document.getElementById('trackerInputId');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    if (window.FirebaseService) {
      const res = await window.FirebaseService.lookupDuelist(rawId);
      const resBox = document.getElementById('trackerResultBox');
      const nameEl = document.getElementById('trackResultName');
      const statsEl = document.getElementById('trackResultStats');

      if (res.success && res.duelist) {
        trackedDuelistId = res.duelist.id;
        if (nameEl) nameEl.textContent = `${res.duelist.username} (ID: #${res.duelist.formattedId})`;
        if (statsEl) statsEl.textContent = `Deck: ${res.duelist.activeDeckName} • Record: ${res.duelist.victories} Wins`;
        if (resBox) resBox.style.display = 'block';
        if (typeof showToast === 'function') showToast(`Found Duelist ${res.duelist.username}!`, 'success');
      } else {
        if (typeof showToast === 'function') showToast(res.error || 'Duelist not found', 'error');
        if (resBox) resBox.style.display = 'none';
      }
    }
  }

  function challengeTrackedDuelist() {
    if (!trackedDuelistId) return;
    hostOnlineDuel(trackedDuelistId);
  }'''

    new_funcs = '''  let trackedDuelistObj = null;

  async function findDuelist() {
    const input = document.getElementById('trackerInputId');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    let duelist = null;
    if (window.FirebaseService && window.FirebaseService.lookupDuelist) {
      try {
        const res = await window.FirebaseService.lookupDuelist(rawId);
        if (res.success && res.duelist) {
          duelist = res.duelist;
        }
      } catch (e) {}
    }

    const formatted = rawId.slice(0, 4) + '-' + rawId.slice(4);
    if (!duelist) {
      duelist = {
        id: rawId,
        formattedId: formatted,
        username: `Duelist #${formatted}`,
        avatar: '⚔️'
      };
    }

    trackedDuelistId = duelist.id;
    trackedDuelistObj = duelist;

    const resBox = document.getElementById('trackerResultBox');
    const nameEl = document.getElementById('trackResultName');
    const statsEl = document.getElementById('trackResultStats');

    if (nameEl) nameEl.textContent = `${duelist.username} (#${duelist.formattedId || formatted})`;
    if (statsEl) statsEl.textContent = '🟢 Ready to Duel';
    if (resBox) resBox.style.display = 'block';
    if (typeof showToast === 'function') showToast(`Found Duelist ${duelist.username}!`, 'success');
  }

  function addTrackedFriend() {
    if (!trackedDuelistObj) return;
    if (window.DuelistSocial) {
      const res = window.DuelistSocial.addFriend({
        id: trackedDuelistObj.id,
        formattedId: trackedDuelistObj.formattedId,
        name: trackedDuelistObj.username,
        avatar: trackedDuelistObj.avatar || '⚔️'
      });
      if (res.success) {
        if (typeof showToast === 'function') showToast(`🤝 Added ${trackedDuelistObj.username} to your friends!`, 'success');
      } else {
        if (typeof showToast === 'function') showToast(res.error || 'Could not add friend', 'warning');
      }
    }
  }

  function challengeTrackedDuelist() {
    if (!trackedDuelistId) return;
    hostOnlineDuel(trackedDuelistId);
  }'''

    if old_funcs in js:
        js = js.replace(old_funcs, new_funcs)
    else:
        # Fallback regex replace
        js = re.sub(r'async function trackDuelist\(\) \{[\s\S]*?function challengeTrackedDuelist\(\) \{[\s\S]*?\}', new_funcs, js)

    # Expose findDuelist and addTrackedFriend on BattleArena
    if 'trackDuelist,' in js:
        js = js.replace('trackDuelist,', 'trackDuelist: findDuelist,\n    findDuelist,\n    addTrackedFriend,')

    # Also handle ?duelWith= in initBattleArena or DOMContentLoaded
    init_check = '''  // Check if opened with ?duelWith=
  const urlParams = new URLSearchParams(window.location.search);
  const duelWithParam = urlParams.get('duelWith');
  if (duelWithParam) {
    setTimeout(() => {
      const input = document.getElementById('trackerInputId');
      if (input) {
        input.value = duelWithParam.slice(0, 4) + '-' + duelWithParam.slice(4);
        findDuelist();
      }
    }, 400);
  }'''

    if 'initBattleArena();' in js and init_check not in js:
        js = js.replace('initBattleArena();', 'initBattleArena();\n' + init_check)

    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('battle_arena.js patched!')

if __name__ == '__main__':
    patch_arena()
