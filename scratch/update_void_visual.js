const fs = require('fs');

function getHexBlueSvg(size = 20, id = 'hexBlue') {
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

let html = fs.readFileSync('index.html', 'utf8');

const newVoidVisual = `<div class="bvz-cores" id="voidCoresVisual">
              <span class="void-hex-core" style="animation-delay: 0s;" title="Void Core 1">${getHexBlueSvg(20, 'voidCore1')}</span>
              <span class="void-hex-core" style="animation-delay: 0.4s;" title="Void Core 2">${getHexBlueSvg(20, 'voidCore2')}</span>
              <span class="void-hex-core" style="animation-delay: 0.8s;" title="Void Core 3">${getHexBlueSvg(20, 'voidCore3')}</span>
              <span class="void-hex-core" style="animation-delay: 1.2s;" title="Void Core 4">${getHexBlueSvg(20, 'voidCore4')}</span>
              <span class="void-hex-core" style="animation-delay: 1.6s;" title="Void Core 5">${getHexBlueSvg(20, 'voidCore5')}</span>
            </div>`;

if (html.match(/<div class="bvz-cores" id="voidCoresVisual">[\s\S]*?<\/div>/)) {
  html = html.replace(/<div class="bvz-cores" id="voidCoresVisual">[\s\S]*?<\/div>/, newVoidVisual);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('[OK] voidCoresVisual updated in index.html!');
} else {
  console.log('[FAIL] voidCoresVisual pattern not found');
}
