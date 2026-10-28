import re, sys, shutil

print("=== Starting Battle Spirits Advent, Summon & Block Effects Implementation ===")

# Create backups first
shutil.copyfile('battle_arena.js', 'battle_arena.js.bak')
shutil.copyfile('styles.css', 'styles.css.bak')
shutil.copyfile('index.html', 'index.html.bak')
shutil.copyfile('app.js', 'app.js.bak')
print("Backed up battle_arena.js, styles.css, index.html, app.js")

# 1. Update index.html to add battleAdventModal
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

advent_modal_html = '''
      <!-- BATTLE ADVENT MODAL -->
      <div class="battle-modal-overlay" id="battleAdventModal">
        <div class="battle-modal-card" style="max-width:560px; text-align:left;">
          <div class="result-badge" style="background:linear-gradient(135deg, rgba(147,51,234,0.35), rgba(79,70,229,0.35)); color:#c084fc; border:1px solid #a855f7; margin-bottom:0.75rem;">🌟 FLASH - [ADVENT / 煌臨]</div>
          <h3 class="modal-title" style="margin-bottom:0.35rem;" id="adventModalTitle">Select Target Spirit to Stack [Advent]</h3>
          <p class="modal-desc" id="adventModalDesc" style="margin-bottom:0.9rem; font-size:0.85rem; color:#cbd5e1;">
            To stack this Spirit, your [Soul Core] will be sent to the Trash. Select an eligible Spirit on your battlefield.
          </p>
          <div class="tribute-spirit-choices" id="adventSpiritChoices">
            <!-- Injected advent target choices -->
          </div>
          <div style="margin-top:1rem; text-align:right;">
            <button class="btn-cancel-advent" onclick="BattleArena.cancelAdvent()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer; font-weight:700;">✕ Cancel Advent</button>
          </div>
        </div>
      </div>
'''

if 'id="battleAdventModal"' not in html:
    tribute_modal_idx = html.find('id="battleTributeModal"')
    if tribute_modal_idx != -1:
        end_tribute = html.find('</div>\n      </div>', tribute_modal_idx)
        if end_tribute != -1:
            insert_pos = end_tribute + len('</div>\n      </div>')
            html = html[:insert_pos] + '\n' + advent_modal_html + html[insert_pos:]
            with open('index.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("✓ Added #battleAdventModal to index.html")
        else:
            print("ERROR: Could not find end of battleTributeModal in index.html")
    else:
        print("ERROR: battleTributeModal not found in index.html")
else:
    print("✓ #battleAdventModal already present in index.html")

# 2. Update styles.css for all Keyword Badges and Advent Buttons
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

keyword_css_additions = '''
/* ── COMPREHENSIVE BATTLE SPIRITS KEYWORD PILLS ── */
.effect-keyword-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 0.35rem;
  font-weight: 800;
  font-size: 0.72rem;
  margin: 0.12rem 0.25rem 0.12rem 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  user-select: none;
}

.kw-advent, .kw-twinkle {
  background: linear-gradient(135deg, #7e22ce, #a855f7);
  color: #fff;
  border: 1px solid #c084fc;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  font-weight: 900;
}

.kw-clash {
  background: #dc2626;
  color: #fff;
  border: 1px solid #f87171;
}

.kw-curse {
  background: #7c3aed;
  color: #fff;
  border: 1px solid #c084fc;
}

.kw-crush {
  background: #0284c7;
  color: #fff;
  border: 1px solid #38bdf8;
}

.kw-burst {
  background: #d97706;
  color: #fff;
  border: 1px solid #fbbf24;
}

.kw-flash {
  background: #059669;
  color: #fff;
  border: 1px solid #34d399;
}

.kw-generic {
  background: #334155;
  color: #f1f5f9;
  border: 1px solid #64748b;
  font-weight: 800;
}

.kw-tribute {
  background: linear-gradient(135deg, #b45309, #d97706);
  border: 1px solid #f59e0b;
  color: #fff;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

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

.kw-soul-core {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: #fff;
  border: 1px solid #60a5fa;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
}

.kw-armor {
  background: #475569;
  color: #f8fafc;
  border: 1px solid #94a3b8;
}

.kw-mirage {
  background: linear-gradient(135deg, #4338ca, #6366f1);
  color: #e0e7ff;
  border: 1px solid #818cf8;
}

.kw-accel {
  background: #ea580c;
  color: #fff;
  border: 1px solid #fdba74;
}

.kw-change {
  background: #0f766e;
  color: #ccfbf1;
  border: 1px solid #5eead4;
}

.kw-charge {
  background: #0369a1;
  color: #e0f2fe;
  border: 1px solid #38bdf8;
}

.kw-rush {
  background: #be185d;
  color: #fce7f3;
  border: 1px solid #f472b6;
}

.kw-icewall {
  background: #0891b2;
  color: #cffafe;
  border: 1px solid #22d3ee;
}

.kw-spellbind {
  background: #581c87;
  color: #f3e8ff;
  border: 1px solid #a855f7;
}

.kw-consecutive {
  background: #991b1b;
  color: #fee2e2;
  border: 1px solid #f87171;
}

.kw-rebirth {
  background: linear-gradient(135deg, #059669, #0284c7);
  color: #fff;
  border: 1px solid #34d399;
}

.kw-unleash {
  background: linear-gradient(135deg, #b91c1c, #d97706);
  color: #fff;
  border: 1px solid #f59e0b;
}

.kw-grand {
  background: linear-gradient(135deg, #7c2d12, #c2410c);
  color: #ffedd5;
  border: 1px solid #fb923c;
}

.kw-timing {
  background: #1e293b;
  color: #38bdf8;
  border: 1px solid #38bdf8;
  font-weight: 800;
}

.kw-level {
  background: #0f172a;
  color: #f59e0b;
  border: 1px solid #f59e0b;
  font-weight: 800;
}

.btn-quick-advent {
  background: linear-gradient(135deg, #7e22ce, #9333ea);
  border: 1px solid #c084fc;
  color: #fff;
  padding: 0.28rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  animation: advent-btn-glow 2s infinite alternate;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@keyframes advent-btn-glow {
  0% { box-shadow: 0 0 6px rgba(168, 85, 247, 0.4); }
  100% { box-shadow: 0 0 16px rgba(192, 132, 252, 0.85); transform: translateY(-1px); }
}

.btn-inspect-advent {
  background: linear-gradient(135deg, #7e22ce, #9333ea) !important;
  border-color: #c084fc !important;
  color: #fff !important;
  font-weight: 800 !important;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.6) !important;
}
'''

if '.kw-advent' not in css:
    css = css + '\n' + keyword_css_additions
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("✓ Added keyword pill styles and Advent button animations to styles.css")
else:
    print("✓ .kw-advent styles already present in styles.css")

print("=== Phase 1 Complete ===")
