const fs = require('fs');

// Generate SVG definitions
function getHexBlueSvg(size = 16, id = 'hexBlue') {
  const height = Math.round(size * 1.16);
  return `<svg class="hex-core-svg hex-blue-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Core">
    <defs>
      <linearGradient id="${id}Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" />
        <stop offset="25%" stop-color="#38bdf8" />
        <stop offset="65%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0369a1" />
      </linearGradient>
      <linearGradient id="${id}Sheen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#${id}Grad)" stroke="#7dd3fc" stroke-width="1.2" />
    <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#0369a1" fill-opacity="0.55" stroke="#bae6fd" stroke-width="0.8" />
    <line x1="12" y1="1" x2="12" y2="6.8" stroke="#bae6fd" stroke-width="0.8" />
    <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
    <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#075985" stroke-width="0.8" />
    <line x1="12" y1="27" x2="12" y2="21.2" stroke="#075985" stroke-width="0.8" />
    <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#075985" stroke-width="0.8" />
    <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
    <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#${id}Sheen)" />
    <circle cx="12" cy="14" r="2" fill="#ffffff" />
  </svg>`;
}

function getHexSoulSvg(size = 16, id = 'hexSoul') {
  const height = Math.round(size * 1.16);
  return `<svg class="hex-core-svg hex-soul-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Soul Core">
    <defs>
      <linearGradient id="${id}Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fca5a5" />
        <stop offset="25%" stop-color="#ef4444" />
        <stop offset="60%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#881337" />
      </linearGradient>
      <radialGradient id="${id}Center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="35%" stop-color="#fef08a" />
        <stop offset="70%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#ef4444" />
      </radialGradient>
    </defs>
    <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#${id}Grad)" stroke="#f59e0b" stroke-width="1.3" />
    <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#881337" fill-opacity="0.6" stroke="#fbbf24" stroke-width="0.9" />
    <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fbbf24" stroke-width="0.8" />
    <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
    <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
    <line x1="12" y1="27" x2="12" y2="21.2" stroke="#4c0519" stroke-width="0.8" />
    <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#4c0519" stroke-width="0.8" />
    <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
    <polygon points="12,8.5 16,14 12,19.5 8,14" fill="url(#${id}Center)" stroke="#ffffff" stroke-width="0.6" />
    <circle cx="12" cy="14" r="1.8" fill="#ffffff" />
  </svg>`;
}

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update Opponent HUD Soul Core
const oldOppSc = `<span class="sc-icon">🔥</span> <span class="sc-label" id="opponentSoulCoreLabel">Soul Core: Reserve</span>`;
const newOppSc = `<span class="sc-icon">${getHexSoulSvg(16, 'oppSc')}</span> <span class="sc-label" id="opponentSoulCoreLabel">Soul Core: Reserve</span>`;
if (html.includes(oldOppSc)) {
  html = html.replace(oldOppSc, newOppSc);
  console.log('[OK] Opponent Soul Core pill updated with Hexagonal SVG');
} else {
  console.warn('[WARN] Old Opponent Soul Core not matched');
}

// 2. Update Opponent Reserve Pill
const oldOppRes = `<span class="core-counter-pill">💎 Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>`;
const newOppRes = `<span class="core-counter-pill"><span class="hex-icon-wrap">${getHexBlueSvg(15, 'oppRes')}</span> Reserve: <span class="core-val" id="opponentReserveCores">5</span></span>`;
if (html.includes(oldOppRes)) {
  html = html.replace(oldOppRes, newOppRes);
  console.log('[OK] Opponent Reserve pill updated with Hexagonal Core SVG');
} else {
  console.warn('[WARN] Old Opponent Reserve not matched');
}

// 3. Update Player HUD Soul Core
const oldPlayerSc = `<span class="sc-icon">🔥</span> <span class="sc-label" id="playerSoulCoreLabel">Soul Core: Reserve</span>`;
const newPlayerSc = `<span class="sc-icon">${getHexSoulSvg(16, 'playerSc')}</span> <span class="sc-label" id="playerSoulCoreLabel">Soul Core: Reserve</span>`;
if (html.includes(oldPlayerSc)) {
  html = html.replace(oldPlayerSc, newPlayerSc);
  console.log('[OK] Player Soul Core pill updated with Hexagonal SVG');
} else {
  console.warn('[WARN] Old Player Soul Core not matched');
}

// 4. Update Player Reserve Pill
const oldPlayerRes = `<span class="core-counter-pill">💎 Reserve: <span class="core-val" id="playerReserveCores">4</span></span>`;
const newPlayerRes = `<span class="core-counter-pill"><span class="hex-icon-wrap">${getHexBlueSvg(15, 'playerRes')}</span> Reserve: <span class="core-val" id="playerReserveCores">4</span></span>`;
if (html.includes(oldPlayerRes)) {
  html = html.replace(oldPlayerRes, newPlayerRes);
  console.log('[OK] Player Reserve pill updated with Hexagonal Core SVG');
} else {
  console.warn('[WARN] Old Player Reserve not matched');
}

// 5. Update The Void Central Zone
const oldVoidVisual = `<div class="bvz-cores" id="voidCoresVisual">
              <span class="void-gem">💎</span>
              <span class="void-gem">💎</span>
              <span class="void-gem">💎</span>
              <span class="void-gem">💎</span>
              <span class="void-gem">💎</span>
            </div>`;

const newVoidVisual = `<div class="bvz-cores" id="voidCoresVisual">
              <span class="void-hex-core" style="animation-delay: 0s;" title="Void Core 1">${getHexBlueSvg(20, 'voidCore1')}</span>
              <span class="void-hex-core" style="animation-delay: 0.4s;" title="Void Core 2">${getHexBlueSvg(20, 'voidCore2')}</span>
              <span class="void-hex-core" style="animation-delay: 0.8s;" title="Void Core 3">${getHexBlueSvg(20, 'voidCore3')}</span>
              <span class="void-hex-core" style="animation-delay: 1.2s;" title="Void Core 4">${getHexBlueSvg(20, 'voidCore4')}</span>
              <span class="void-hex-core" style="animation-delay: 1.6s;" title="Void Core 5">${getHexBlueSvg(20, 'voidCore5')}</span>
            </div>`;

if (html.includes(oldVoidVisual)) {
  html = html.replace(oldVoidVisual, newVoidVisual);
  console.log('[OK] Void Reservoir updated with 5 animated Hexagonal Crystals');
} else {
  console.warn('[WARN] Old Void visual not matched exactly, checking regex');
}

// 6. Update Step 2 CORE Step button in navigator
const oldBtnCore = `<button class="btn-step-action btn-step-core" id="btnStep_CORE" onclick="BattleArena.manualStep('CORE')">💎 Take +1 Core from Void</button>`;
const newBtnCore = `<button class="btn-step-action btn-step-core" id="btnStep_CORE" onclick="BattleArena.manualStep('CORE')"><span class="btn-hex-icon">${getHexBlueSvg(14, 'btnCore')}</span> Take +1 Core from Void</button>`;
if (html.includes(oldBtnCore)) {
  html = html.replace(oldBtnCore, newBtnCore);
  console.log('[OK] Step 2 Core button updated with Hexagonal Core SVG');
}

// 7. Bump cache version to v=2.4
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css?v=2.4');
html = html.replace(/battle_arena\.js\?v=[0-9.]+/g, 'battle_arena.js?v=2.4');

fs.writeFileSync('index.html', html, 'utf8');
console.log('[DONE] index.html updated successfully!');
