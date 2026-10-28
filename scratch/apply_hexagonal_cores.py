import re

print("--- 1. Updating battle_arena.js with getHexCoreSvg & Hex Core Rendering ---")
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Define getHexCoreSvg function to insert at top level
hex_svg_function = """  // ── HEXAGONAL CORE RENDERING ENGINE (ANIME & GAME ACCURATE) ──
  function getHexCoreSvg(type = 'blue', size = 18) {
    const height = Math.round(size * 1.16);
    if (type === 'life-active') {
      return `<svg class="hex-core-svg hex-life-active" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Life Core">
        <defs>
          <linearGradient id="hexLifeGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="30%" stop-color="#fbbf24" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="hexLifeSheen_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#fef08a" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexLifeGrad_${size})" stroke="#fef08a" stroke-width="1.2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#b45309" fill-opacity="0.5" stroke="#fef08a" stroke-width="0.8" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fef08a" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#92400e" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#92400e" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#92400e" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
        <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexLifeSheen_${size})" />
        <circle cx="12" cy="14" r="2.2" fill="#ffffff" />
      </svg>`;
    } else if (type === 'life-empty') {
      return `<svg class="hex-core-svg hex-life-empty" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Shattered Core">
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="rgba(30,41,59,0.35)" stroke="#475569" stroke-width="1.2" stroke-dasharray="2,2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="transparent" stroke="#334155" stroke-width="0.6" />
      </svg>`;
    } else if (type === 'soul') {
      return `<svg class="hex-core-svg hex-soul-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Soul Core">
        <defs>
          <linearGradient id="hexSoulGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fca5a5" />
            <stop offset="25%" stop-color="#ef4444" />
            <stop offset="60%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#881337" />
          </linearGradient>
          <radialGradient id="hexSoulCenter_${size}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#fef08a" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#ef4444" />
          </radialGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexSoulGrad_${size})" stroke="#f59e0b" stroke-width="1.3" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#881337" fill-opacity="0.6" stroke="#fbbf24" stroke-width="0.9" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fbbf24" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#4c0519" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
        <polygon points="12,8.5 16,14 12,19.5 8,14" fill="url(#hexSoulCenter_${size})" stroke="#ffffff" stroke-width="0.6" />
        <circle cx="12" cy="14" r="1.8" fill="#ffffff" />
      </svg>`;
    } else {
      // Default: Blue Hexagonal Crystal Core
      return `<svg class="hex-core-svg hex-blue-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Core">
        <defs>
          <linearGradient id="hexBlueGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bae6fd" />
            <stop offset="25%" stop-color="#38bdf8" />
            <stop offset="65%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>
          <linearGradient id="hexBlueSheen_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexBlueGrad_${size})" stroke="#7dd3fc" stroke-width="1.2" />
        <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#0369a1" fill-opacity="0.55" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="12" y1="1" x2="12" y2="6.8" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
        <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#075985" stroke-width="0.8" />
        <line x1="12" y1="27" x2="12" y2="21.2" stroke="#075985" stroke-width="0.8" />
        <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#075985" stroke-width="0.8" />
        <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
        <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexBlueSheen_${size})" />
        <circle cx="12" cy="14" r="2" fill="#ffffff" />
      </svg>`;
    }
  }

"""

# Insert getHexCoreSvg right before calculateBpAndLevel
target_before_calc = """  // Calculate BP given allocated cores and Soul Core empowerment
  function calculateBpAndLevel"""

assert target_before_calc in code, "target_before_calc not found"
code = code.replace(target_before_calc, hex_svg_function + target_before_calc, 1)

# Update renderLifeCores to use hexagonal SVGs
target_life_render = """  function renderLifeCores(containerId, lifeCount) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < lifeCount) {
        html += `<span class="life-gem gem-active" title="Life Core ${i+1}">🟡</span>`;
      } else {
        html += `<span class="life-gem gem-empty" title="Shattered Core">⚪</span>`;
      }
    }
    el.innerHTML = html;
  }"""

replacement_life_render = """  function renderLifeCores(containerId, lifeCount) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < lifeCount) {
        html += `<span class="life-hex-gem gem-active" title="Life Core ${i+1}">${getHexCoreSvg('life-active', 22)}</span>`;
      } else {
        html += `<span class="life-hex-gem gem-empty" title="Shattered Core">${getHexCoreSvg('life-empty', 22)}</span>`;
      }
    }
    el.innerHTML = html;
  }"""

assert target_life_render in code, "target_life_render not found"
code = code.replace(target_life_render, replacement_life_render, 1)

# Update renderFieldSpirit to use hexagonal SVGs for cores on cards
target_spirit_cores = """    const coresDisplay = hasSC
      ? `💎 ${Math.max(0, spirit.currentCores - 1)} + 🔥 SC`
      : `💎 ${spirit.currentCores}`;"""

replacement_spirit_cores = """    const coresDisplay = hasSC
      ? `<span class="fsc-hex-group">${getHexCoreSvg('blue', 14)} <span class="fsc-core-num">${Math.max(0, spirit.currentCores - 1)}</span> + ${getHexCoreSvg('soul', 14)} <span class="fsc-sc-tag">SC</span></span>`
      : `<span class="fsc-hex-group">${getHexCoreSvg('blue', 14)} <span class="fsc-core-num">${spirit.currentCores}</span></span>`;"""

assert target_spirit_cores in code, "target_spirit_cores not found"
code = code.replace(target_spirit_cores, replacement_spirit_cores, 1)

# Update soul core badge in renderFieldSpirit
target_sc_badge = """${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!"><span class="flame-icon">🔥</span> SOUL CORE</div>` : ''}"""
replacement_sc_badge = """${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 14)} SOUL CORE</div>` : ''}"""
assert target_sc_badge in code, "target_sc_badge not found"
code = code.replace(target_sc_badge, replacement_sc_badge, 1)

# Export getHexCoreSvg on window.BattleArena
target_export = """    inspectSoulCore
  };"""

replacement_export = """    inspectSoulCore,
    getHexCoreSvg
  };"""

assert target_export in code, "target_export not found"
code = code.replace(target_export, replacement_export, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] battle_arena.js updated with getHexCoreSvg")
