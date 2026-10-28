import sys, re

sys.stdout.reconfigure(encoding='utf-8')
print('=== Applying Step Navigator State & Reset Fix ===')

# 1. Update battle_arena.js
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Locate renderStepNavigator block
start_marker = '  // ── STEP NAVIGATOR RENDERER ──\n  function renderStepNavigator() {'
end_marker = '  // ── STEP TIMING & FLASH VERIFICATION ──'

idx_start = js_content.find(start_marker)
idx_end = js_content.find(end_marker)

if idx_start == -1 or idx_end == -1:
    print(f'ERROR: bounds not found: idx_start={idx_start}, idx_end={idx_end}')
    sys.exit(1)

new_block = '''  // ── STEP NAVIGATOR HELPERS ──
  function getPlayerStepLabel(p) {
    if (p === 'START') {
      return '✨ Begin Turn';
    } else if (p === 'CORE') {
      return `<span class="btn-hex-icon">${getHexCoreSvg('blue', 14)}</span> Take +1 Core from Void`;
    } else if (p === 'DRAW') {
      return '🎴 Draw 1 Card';
    } else if (p === 'REFRESH') {
      const tCores = (DuelState.player && DuelState.player.trash) || 0;
      const hasScTrash = DuelState.player && DuelState.player.soulCoreLocation === 'trash';
      if (tCores > 0 && hasScTrash) {
        return `🔄 Return ${tCores} Cores + 🔥 SC & Ready`;
      } else if (tCores > 0) {
        return `🔄 Return ${tCores} Core(s) & Ready Spirits`;
      } else if (hasScTrash) {
        return `🔄 Return 🔥 Soul Core & Ready`;
      } else {
        return '🔄 Ready All Spirits';
      }
    } else if (p === 'MAIN') {
      if (DuelState.turn === 1) {
        return '🛑 End Turn (Turn 1: No Attacks) →';
      } else {
        return '⚔️ Proceed to Attack Step →';
      }
    } else if (p === 'ATTACK') {
      return '🛑 Done Attacking →';
    } else if (p === 'END') {
      return '🏁 Pass Turn to Opponent';
    }
    return 'Awaiting Step...';
  }

  function getPlayerStepActionClass(p) {
    if (p === 'START') {
      return 'btn-step-action btn-step-start';
    } else if (p === 'CORE') {
      return 'btn-step-action btn-step-core';
    } else if (p === 'DRAW') {
      return 'btn-step-action btn-step-draw';
    } else if (p === 'REFRESH') {
      return 'btn-step-action btn-step-refresh';
    } else if (p === 'MAIN') {
      return DuelState.turn === 1 ? 'btn-step-action btn-step-pass' : 'btn-step-action btn-step-proceed';
    } else if (p === 'ATTACK') {
      return 'btn-step-action btn-step-proceed';
    } else if (p === 'END') {
      return 'btn-step-action btn-step-pass';
    }
    return 'btn-step-action';
  }

  function setStepButtonContent(btnEl, labelHtml, actionClass, isDisabled) {
    if (!btnEl) return;
    btnEl.disabled = isDisabled;
    if (labelHtml.includes('<')) {
      btnEl.innerHTML = labelHtml;
      if (typeof HTMLElement === 'undefined' || !(btnEl instanceof HTMLElement)) {
        btnEl.textContent = labelHtml.replace(/<[^>]*>/g, '');
      }
    } else {
      btnEl.textContent = labelHtml;
      btnEl.innerHTML = labelHtml;
    }
    btnEl.className = actionClass;
  }

  // ── STEP NAVIGATOR RENDERER ──
  function renderStepNavigator() {
    const isPlayer = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    const currentIdx = DuelState.phaseIndex;

    const navTurnTitle = document.getElementById('navTurnTitle');
    const navSubtitle = document.getElementById('navStepSubtitle');
    if (navTurnTitle) {
      navTurnTitle.textContent = isPlayer ? `Turn ${DuelState.turn} • Your Turn` : `Turn ${DuelState.turn} • Opponent's Turn`;
      navTurnTitle.style.color = isPlayer ? '#fff' : '#f87171';
    }
    if (navSubtitle) {
      navSubtitle.textContent = isPlayer ? 'Execute steps in order to advance the duel.' : 'Opponent is carrying out turn phases.';
    }

    DuelState.phases.forEach((p, idx) => {
      const cardEl = document.getElementById(`stepCard_${p}`);
      const statusEl = document.getElementById(`stepStatus_${p}`);
      const btnEl = document.getElementById(`btnStep_${p}`);
      if (!cardEl) return;

      if (isPlayer) {
        if (idx < currentIdx) {
          // Completed step in player's turn
          cardEl.className = 'step-card is-completed-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-done';
            statusEl.textContent = 'Done ✓';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Step Complete ✓', 'btn-step-action btn-step-done', true);
          }
        } else if (idx === currentIdx) {
          // Currently active step in player's turn (e.g. Start Step on Turn 2)
          cardEl.className = 'step-card is-active-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-active';
            statusEl.textContent = 'Active';
          }
          if (btnEl) {
            const label = getPlayerStepLabel(p);
            const cls = getPlayerStepActionClass(p);
            setStepButtonContent(btnEl, label, cls, false);
          }
        } else {
          // Future / Pending step in player's turn (Reset cleanly from any previous turn)
          cardEl.className = 'step-card is-locked-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-pending';
            statusEl.textContent = 'Pending';
          }
          if (btnEl) {
            const label = getPlayerStepLabel(p);
            setStepButtonContent(btnEl, label, 'btn-step-action btn-step-pending', true);
          }
        }
      } else {
        // Opponent turn active
        if (idx < currentIdx) {
          cardEl.className = 'step-card is-completed-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-done';
            statusEl.textContent = 'Done ✓';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Step Complete ✓', 'btn-step-action btn-step-done', true);
          }
        } else if (idx === currentIdx) {
          cardEl.className = 'step-card is-active-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-active';
            statusEl.textContent = 'AI Active';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, '⏳ Opponent AI Thinking...', 'btn-step-action btn-step-ai-thinking', true);
          }
        } else {
          cardEl.className = 'step-card is-locked-step';
          if (statusEl) {
            statusEl.className = 'sc-status status-pending';
            statusEl.textContent = 'Pending';
          }
          if (btnEl) {
            setStepButtonContent(btnEl, 'Awaiting Phase...', 'btn-step-action btn-step-pending', true);
          }
        }
      }
    });

    const oppControls = document.getElementById('navOpponentControls');
    if (oppControls) {
      oppControls.style.display = isPlayer ? 'none' : 'block';
    }
  }

'''

js_content = js_content[:idx_start] + new_block + js_content[idx_end:]
with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print('✅ Updated battle_arena.js renderStepNavigator')

# 2. Update styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

extra_css = '''
.step-card.is-active-step .btn-step-start {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  border-color: #60a5fa !important;
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.5) !important;
  color: #fff !important;
  font-weight: 800 !important;
}

.step-card.is-active-step .btn-step-draw {
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
  border-color: #a78bfa !important;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.5) !important;
  color: #fff !important;
  font-weight: 800 !important;
}
'''

if '.btn-step-start' not in css_content:
    target_needle = '.step-card.is-active-step .btn-step-core {'
    idx_css = css_content.find(target_needle)
    if idx_css != -1:
        css_content = css_content[:idx_css] + extra_css + '\n' + css_content[idx_css:]
        with open('styles.css', 'w', encoding='utf-8') as f:
            f.write(css_content)
        print('✅ Added .btn-step-start and .btn-step-draw to styles.css')
    else:
        print('Warning: target needle for styles.css not found, appending to end')
        with open('styles.css', 'a', encoding='utf-8') as f:
            f.write(extra_css)
        print('✅ Appended styles to styles.css')
else:
    print('Styles already present in styles.css')

# 3. Update index.html cache-buster
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = html_content.replace('styles.css?v=4.7', 'styles.css?v=4.8')
html_content = html_content.replace('battle_arena.js?v=4.7', 'battle_arena.js?v=4.8')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
print('✅ Updated cache-buster in index.html to v=4.8')
