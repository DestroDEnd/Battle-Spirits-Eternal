const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

// Replace showToast in addCoreToSpirit and removeCoreFromSpirit with safe check
js = js.replace(/showToast\(([^)]+)\);/g, "if (typeof showToast === 'function') showToast($1);");

fs.writeFileSync('battle_arena.js', js, 'utf8');
console.log('[OK] Guarded showToast in battle_arena.js');
