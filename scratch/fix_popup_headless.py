import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open('battle_arena.js', encoding='utf-8').read()
old = """    box.querySelector('[data-opt="yes"]').onclick = () => finish(true);
    box.querySelector('[data-opt="no"]').onclick = () => finish(false);
    document.body.appendChild(box);"""
new = """    const yesBtn = box.querySelector('[data-opt="yes"]');
    const noBtn = box.querySelector('[data-opt="no"]');
    if (!yesBtn || !noBtn) {
      // No usable DOM (headless / mocked environment): resolve automatically.
      _optBusy = false;
      try { if (item.onYes) item.onYes(); } catch (e) { console.error(e); }
      pumpOptionalQueue();
      return;
    }
    yesBtn.onclick = () => finish(true);
    noBtn.onclick = () => finish(false);
    document.body.appendChild(box);"""
print(old in c)
c = c.replace(old, new, 1)
open('battle_arena.js', 'w', encoding='utf-8').write(c)

p = 'scratch/test_canva_arena_handlers.js'
t = open(p, encoding='utf-8').read()
t = t.replace("arenaCode.indexOf('function executeUniversalCardEffect')", "arenaCode.indexOf('function isOptionalEffectText')")
open(p, 'w', encoding='utf-8').write(t)
print('done')
