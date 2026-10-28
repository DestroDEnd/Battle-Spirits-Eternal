const fs = require('fs');

function getHexCoreSvg(type = 'blue', size = 24) {
  const height = Math.round(size * 1.16);
  if (type === 'life-active') {
    return `<svg class="hex-core-svg hex-life-active" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Life Core">
      <defs>
        <linearGradient id="hexLifeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="30%" stop-color="#fbbf24" />
          <stop offset="70%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <linearGradient id="hexLifeSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#fef08a" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexLifeGrad)" stroke="#fef08a" stroke-width="1.2" />
      <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#b45309" fill-opacity="0.5" stroke="#fef08a" stroke-width="0.8" />
      <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fef08a" stroke-width="0.8" />
      <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
      <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#92400e" stroke-width="0.8" />
      <line x1="12" y1="27" x2="12" y2="21.2" stroke="#92400e" stroke-width="0.8" />
      <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#92400e" stroke-width="0.8" />
      <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fef08a" stroke-width="0.8" />
      <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexLifeSheen)" />
      <circle cx="12" cy="14" r="2.2" fill="#ffffff" />
    </svg>`;
  } else if (type === 'life-empty') {
    return `<svg class="hex-core-svg hex-life-empty" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Shattered Core">
      <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="rgba(30,41,59,0.3)" stroke="#475569" stroke-width="1" stroke-dasharray="2,2" />
      <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="transparent" stroke="#334155" stroke-width="0.6" />
    </svg>`;
  } else if (type === 'soul') {
    return `<svg class="hex-core-svg hex-soul-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Soul Core">
      <defs>
        <linearGradient id="hexSoulGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f87171" />
          <stop offset="25%" stop-color="#ef4444" />
          <stop offset="60%" stop-color="#dc2626" />
          <stop offset="100%" stop-color="#991b1b" />
        </linearGradient>
        <radialGradient id="hexSoulCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#fef08a" />
          <stop offset="70%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#ef4444" />
        </radialGradient>
      </defs>
      <!-- Outer Flame Hexagon -->
      <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexSoulGrad)" stroke="#f59e0b" stroke-width="1.3" />
      <!-- Inner Faceted Hexagon -->
      <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#991b1b" fill-opacity="0.6" stroke="#fbbf24" stroke-width="0.9" />
      <line x1="12" y1="1" x2="12" y2="6.8" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#7f1d1d" stroke-width="0.8" />
      <line x1="12" y1="27" x2="12" y2="21.2" stroke="#7f1d1d" stroke-width="0.8" />
      <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#7f1d1d" stroke-width="0.8" />
      <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#fbbf24" stroke-width="0.8" />
      <!-- Radiant Blazing Sunburst/Flame Diamond Center -->
      <polygon points="12,9 15.5,14 12,19 8.5,14" fill="url(#hexSoulCenter)" stroke="#fff" stroke-width="0.5" />
      <!-- Center Soul Glint -->
      <circle cx="12" cy="14" r="1.8" fill="#ffffff" />
    </svg>`;
  } else {
    // Default: Blue Core (Reserve / Field / Void)
    return `<svg class="hex-core-svg hex-blue-core" viewBox="0 0 24 28" width="${size}" height="${height}" aria-label="Core">
      <defs>
        <linearGradient id="hexBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7dd3fc" />
          <stop offset="30%" stop-color="#38bdf8" />
          <stop offset="70%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
        <linearGradient id="hexBlueSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <!-- Outer Hexagon -->
      <polygon points="12,1 23,7.5 23,20.5 12,27 1,20.5 1,7.5" fill="url(#hexBlueGrad)" stroke="#7dd3fc" stroke-width="1.2" />
      <!-- Inner Faceted Hexagon -->
      <polygon points="12,6.8 18,10.4 18,17.6 12,21.2 6,17.6 6,10.4" fill="#0369a1" fill-opacity="0.55" stroke="#bae6fd" stroke-width="0.8" />
      <line x1="12" y1="1" x2="12" y2="6.8" stroke="#bae6fd" stroke-width="0.8" />
      <line x1="23" y1="7.5" x2="18" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
      <line x1="23" y1="20.5" x2="18" y2="17.6" stroke="#075985" stroke-width="0.8" />
      <line x1="12" y1="27" x2="12" y2="21.2" stroke="#075985" stroke-width="0.8" />
      <line x1="1" y1="20.5" x2="6" y2="17.6" stroke="#075985" stroke-width="0.8" />
      <line x1="1" y1="7.5" x2="6" y2="10.4" stroke="#bae6fd" stroke-width="0.8" />
      <!-- Top Highlight Sheen -->
      <polygon points="12,2 22,8 17.5,10.4 12,7.5 6.5,10.4 2,8" fill="url(#hexBlueSheen)" />
      <!-- Center Glint -->
      <circle cx="12" cy="14" r="2" fill="#ffffff" />
    </svg>`;
  }
}

// Write a small preview HTML to scratch to inspect
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #0b1120; color: #fff; font-family: sans-serif; padding: 2rem; }
    .row { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
    .hex-core-svg { vertical-align: middle; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.5)); transition: transform 0.2s; }
    .hex-core-svg:hover { transform: scale(1.15); }
    .hex-life-active { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8)); }
    .hex-soul-core { filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)); }
  </style>
</head>
<body>
  <h2>Battle Spirits Hexagonal Cores Preview</h2>
  <div class="row">
    <div><strong>Regular Core (Blue):</strong> ${getHexCoreSvg('blue', 28)} ${getHexCoreSvg('blue', 22)} ${getHexCoreSvg('blue', 16)}</div>
    <div><strong>Soul Core (Flame):</strong> ${getHexCoreSvg('soul', 28)} ${getHexCoreSvg('soul', 22)} ${getHexCoreSvg('soul', 16)}</div>
    <div><strong>Life Cores (Gold & Empty):</strong> ${getHexCoreSvg('life-active', 26)} ${getHexCoreSvg('life-active', 26)} ${getHexCoreSvg('life-active', 26)} ${getHexCoreSvg('life-empty', 26)} ${getHexCoreSvg('life-empty', 26)}</div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/hex_cores_preview.html', testHtml, 'utf8');
console.log('Generated scratch/hex_cores_preview.html');
