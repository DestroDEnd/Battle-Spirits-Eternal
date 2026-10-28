import sys

sys.stdout.reconfigure(encoding='utf-8')
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add isArenaPage helper and update startDuel
target_start_duel = '''  // ── STARTING A DUEL (WITH COIN TOSS) ──
  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {'''

replacement_start_duel = '''  function isArenaPage() {
    if (typeof window === 'undefined' || !window.location) return true;
    const path = (window.location.pathname || '').toLowerCase();
    return path.includes('arena') || path.includes('battle') || !!document.getElementById('battleArena');
  }

  // ── STARTING A DUEL (WITH COIN TOSS) ──
  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {
    if (!isArenaPage()) {
      const p = pDeckKey || 'deck_std_red';
      const o = oDeckKey || 'purple';
      window.location.href = `/arena?start=1&deck=${encodeURIComponent(p)}&opp=${encodeURIComponent(o)}`;
      return false;
    }'''

if target_start_duel in code:
    code = code.replace(target_start_duel, replacement_start_duel)
    print("✅ Updated startDuel with isArenaPage check")
else:
    print("Error: target_start_duel not found")

# 2. Update quickLaunchDuel and scrollToBattleArena
target_quick = '''  // ── QUICK LAUNCH ──
  function quickLaunchDuel() {
    startDuel('red', 'purple');
  }

  function scrollToBattleArena(e) {
    if (e && e.preventDefault) e.preventDefault();
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl) {
      if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }'''

replacement_quick = '''  // ── QUICK LAUNCH & ARENA REDIRECT ──
  function quickLaunchDuel() {
    if (!isArenaPage()) {
      window.location.href = '/arena?duel=quick';
      return;
    }
    startDuel('red', 'purple');
  }

  function scrollToBattleArena(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isArenaPage()) {
      window.location.href = '/arena';
      return;
    }
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl) {
      if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }'''

if target_quick in code:
    code = code.replace(target_quick, replacement_quick)
    print("✅ Updated quickLaunchDuel and scrollToBattleArena")
else:
    print("Error: target_quick not found")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Saved battle_arena.js")
