import re

print("--- Applying Fullscreen Mode & Battle Spirits Keywords ---")

# 1. UPDATE styles.css with Keyword Pills and Fullscreen styles
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

keyword_and_fs_css = """
/* ════════════════ EXPANDED BATTLE SPIRITS KEYWORD PILLS ════════════════ */
.kw-holylife {
  background: #b45309;
  color: #fef08a;
  border: 1px solid #fcd34d;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.45);
}
.kw-windstorm {
  background: #047857;
  color: #d1fae5;
  border: 1px solid #6ee7b7;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.45);
}
.kw-assault {
  background: #1d4ed8;
  color: #dbeafe;
  border: 1px solid #93c5fd;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.45);
}
.kw-highspeed {
  background: #0e7490;
  color: #cffafe;
  border: 1px solid #67e8f9;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.45);
}
.kw-awaken {
  background: #b91c1c;
  color: #fee2e2;
  border: 1px solid #fca5a5;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.45);
}
.kw-immortality {
  background: #6b21a8;
  color: #f3e8ff;
  border: 1px solid #d8b4fe;
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.45);
}
.kw-souldrive {
  background: linear-gradient(135deg, #be123c, #9f1239);
  color: #ffe4e6;
  border: 1px solid #f43f5e;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
}
.kw-icewall {
  background: #334155;
  color: #e0f2fe;
  border: 1px solid #94a3b8;
  box-shadow: 0 0 8px rgba(148, 163, 184, 0.45);
}
.kw-armor {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #64748b;
  box-shadow: 0 0 6px rgba(148, 163, 184, 0.4);
}
.kw-consecutive {
  background: #c2410c;
  color: #ffedd5;
  border: 1px solid #fdba74;
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.45);
}
.kw-mirage {
  background: #7e22ce;
  color: #faf5ff;
  border: 1px solid #e9d5ff;
  box-shadow: 0 0 8px rgba(192, 132, 252, 0.45);
}
.kw-spellbind {
  background: #312e81;
  color: #e0e7ff;
  border: 1px solid #818cf8;
  box-shadow: 0 0 8px rgba(129, 140, 248, 0.45);
}

/* ════════════════ IMMERSIVE FULLSCREEN ARENA MODE ════════════════ */
#battleArena:fullscreen,
#battleArena:-webkit-full-screen,
.battle-arena-section.is-fullscreen-arena {
  width: 100vw !important;
  height: 100vh !important;
  overflow-y: auto !important;
  background: radial-gradient(circle at 50% 15%, #1e1b4b 0%, #0b0f19 55%, #030712 100%) !important;
  padding: 1rem 1.5rem 3rem 1.5rem !important;
  box-sizing: border-box !important;
  z-index: 999999;
}

#battleArena:fullscreen .arena-header,
#battleArena:-webkit-full-screen .arena-header,
.is-fullscreen-arena .arena-header {
  margin-bottom: 0.6rem;
  padding: 0.35rem 0;
}

#battleArena:fullscreen .arena-title,
#battleArena:-webkit-full-screen .arena-title,
.is-fullscreen-arena .arena-title {
  font-size: 1.45rem;
}

#battleArena:fullscreen .arena-sub,
#battleArena:-webkit-full-screen .arena-sub,
.is-fullscreen-arena .arena-sub {
  display: none;
}

#battleArena:fullscreen .battle-duel-table,
#battleArena:-webkit-full-screen .battle-duel-table,
.is-fullscreen-arena .battle-duel-table {
  max-width: 1600px;
  margin: 0 auto;
}

.btn-fullscreen-toggle {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #f1f5f9;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-fullscreen-toggle:hover {
  background: rgba(51, 65, 85, 0.95);
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.btn-fullscreen-toggle.active-fullscreen {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border-color: #7dd3fc;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
}
"""

if 'kw-holylife' not in css:
    css = css + "\n" + keyword_and_fs_css
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("[PASS] 1. styles.css updated with keyword glow pills & fullscreen rules.")
else:
    print("[SKIP] 1. styles.css already contains keyword pills.")

# 2. UPDATE index.html with Fullscreen Toggle button
with open('index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

old_toolbar_target = """          <div class="toolbar-actions">
            <button class="btn-duel-tool" onclick="BattleArena.openZoneModal('player-trash')"""

new_toolbar_button = """          <div class="toolbar-actions">
            <button class="btn-duel-tool btn-fullscreen-toggle" id="btnDuelFullscreen" onclick="BattleArena.toggleFullscreen()" title="Toggle Fullscreen Arena Mode">⛶ Fullscreen</button>
            <button class="btn-duel-tool" onclick="BattleArena.openZoneModal('player-trash')"""

if 'btnDuelFullscreen' not in idx_content and old_toolbar_target in idx_content:
    idx_content = idx_content.replace(old_toolbar_target, new_toolbar_button, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(idx_content)
    print("[PASS] 2. index.html updated with Fullscreen Toggle button in duel toolbar.")
else:
    print("[SKIP] 2. index.html already contains btnDuelFullscreen or target not found.")

# 3. UPDATE app.js formatEffectKeywordsInModal
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

old_app_kw = """function formatEffectKeywordsInModal(text) {
  if (!text) return '<span style="color:var(--muted);font-style:italic;">No special effects or abilities.</span>';
  let safe = esc(text);
  safe = safe.replace(/\\[(Clash|Curse|Crush|Armor:[^\\]]+|Burst:[^\\]]+|Flash|When Attacks|When Destroyed|When Summoned)\\]/gi, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    return `<span class=\"effect-keyword-pill ${cls}\">${match}</span>`;
  });
  return safe.replace(/\\n/g, '<br>');
}"""

new_app_kw = """function formatEffectKeywordsInModal(text) {
  if (!text) return '<span style="color:var(--muted);font-style:italic;">No special effects or abilities.</span>';
  let safe = esc(text);
  safe = safe.replace(/\\[(Clash|True-Clash|Supreme Clash|Curse|True-Curse|Grudging Curse|Crush|Great Crush|Wave Crush|Holy Life|Ultra Holy Life|Heavenly Light|Windstorm(?::\\s*\\d+)?|Fierce Windstorm|Assault(?::\\s*\\d+)?|Great Assault|High Speed|Violent High Speed|Flashing Swift|Awaken|True-Awaken|Dragon Awaken|Immortality(?::[^\\]]+)?|Revive|Soul Drive|Ice Wall(?::[^\\]]+)?|Armor(?::[^\\]]+)?|Heavy Armor(?::[^\\]]+)?|Ultra Armor(?::[^\\]]+)?|A\\.T\\.\\s*Field|Burst(?::[^\\]]+)?|Tribute(?::[^\\]]+)?|Flash|Consecutive Blade|Rekka Consecutive Blade|Mirage(?::[^\\]]+)?|Spellbind|When Attacks|When Destroyed|When Summoned|When Blocks|Soul Core|Soul Core:[^\\]]+)\\]/gi, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
    else if (low.includes('assault')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift')) cls = 'kw-highspeed';
    else if (low.includes('awaken')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
    else if (low.includes('soul drive')) cls = 'kw-souldrive';
    else if (low.includes('ice wall')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
    else if (low.includes('mirage')) cls = 'kw-mirage';
    else if (low.includes('spellbind')) cls = 'kw-spellbind';
    else if (low.includes('soul core')) cls = 'kw-soul-core';
    return `<span class=\"effect-keyword-pill ${cls}\">${match}</span>`;
  });
  return safe.replace(/\\n/g, '<br>');
}"""

if old_app_kw in app_js:
    app_js = app_js.replace(old_app_kw, new_app_kw, 1)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)
    print("[PASS] 3. app.js formatEffectKeywordsInModal updated with full Wiki keywords support.")
else:
    print("[INFO] 3. app.js target pattern check...")

print("\nStep 1-3 complete!")
