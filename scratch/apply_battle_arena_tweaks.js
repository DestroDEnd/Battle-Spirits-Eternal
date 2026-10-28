const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

// 1. Line 1023: nextBtn.textContent = '💎 Take +1 Core from Void';
js = js.replace(
  "nextBtn.textContent = '💎 Take +1 Core from Void';",
  "nextBtn.innerHTML = `<span class=\"btn-hex-icon\">${getHexCoreSvg('blue', 14)}</span> Take +1 Core from Void`;"
);

// 2. Line 1113: btnEl.textContent = '💎 Take +1 Core from Void';
js = js.replace(
  "btnEl.textContent = '💎 Take +1 Core from Void';",
  "btnEl.innerHTML = `<span class=\"btn-hex-icon\">${getHexCoreSvg('blue', 14)}</span> Take +1 Core from Void`;"
);

// 3. Line 1650: <span class="ssc-core-count">💎 ${allocated} / ${s.currentCores}</span>
js = js.replace(
  '<span class="ssc-core-count">💎 ${allocated} / ${s.currentCores}</span>',
  '<span class="ssc-core-count">${getHexCoreSvg(\'blue\', 14)} ${allocated} / ${s.currentCores}</span>'
);

// 4. Line 2856: <div class="void-stat-num">∞</div>
js = js.replace(
  '<div class="void-stat-num">∞</div>',
  '<div class="void-stat-num" style="display:flex;align-items:center;justify-content:center;gap:6px;">${getHexCoreSvg(\'blue\', 22)} <span>∞</span></div>'
);

// 5. In renderDuelTable, ensure void cores visual is populated if empty or needed
const rdtTarget = "renderBurstZones();";
const rdtAdd = `renderBurstZones();

    // Ensure Void Reservoir visual shows 5 animated Hexagonal Crystals
    const voidVisual = document.getElementById('voidCoresVisual');
    if (voidVisual && !voidVisual.dataset.renderedHex) {
      voidVisual.dataset.renderedHex = '1';
      voidVisual.innerHTML = [0, 1, 2, 3, 4].map(i => \`
        <span class="void-hex-core" style="animation-delay: \${i * 0.4}s;" title="Void Core #\${i+1}">
          \${getHexCoreSvg('blue', 20)}
        </span>
      \`).join('');
    }`;

if (js.includes(rdtTarget)) {
  js = js.replace(rdtTarget, rdtAdd);
  console.log('[OK] Added voidVisual check to renderDuelTable');
}

fs.writeFileSync('battle_arena.js', js, 'utf8');
console.log('[DONE] battle_arena.js updated successfully!');
