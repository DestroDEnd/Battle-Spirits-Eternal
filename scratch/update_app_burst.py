with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    if (duelBtn) {
      duelBtn.style.display = 'block';
      const handCard = (DuelState.player.hand || []).find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
      if (handCard) {"""

replacement = """    if (duelBtn) {
      duelBtn.style.display = 'block';
      const handCard = (DuelState.player.hand || []).find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
      const isSetBurst = DuelState.player && DuelState.player.burst && (DuelState.player.burst.name || '').toLowerCase() === (name || '').toLowerCase();

      if (isSetBurst) {
        duelBtn.textContent = '⚡ Trigger Set Burst';
        duelBtn.disabled = false;
        duelBtn.style.opacity = '1';
        duelBtn.style.background = '#ef4444';
        duelBtn.onclick = () => {
          closeModal();
          BattleArena.activateBurst('player');
        };
      } else if (handCard) {"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm, "target not found in app.js"
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated app.js with isSetBurst support")
