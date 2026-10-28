with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function') {
      try {
        const res = await fetch('/api/card-effects-db');
        if (res.ok) {
          CardEffectsDB = await res.json();
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to fetch /api/card-effects-db:', e);
      }
    }
  }"""

replacement = """  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.origin) {
      try {
        const res = await fetch(window.location.origin + '/api/card-effects-db');
        if (res.ok) {
          CardEffectsDB = await res.json();
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to fetch /api/card-effects-db:', e);
      }
    } else if (typeof require === 'function') {
      try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.resolve(__dirname, 'card_effects_db.json');
        if (fs.existsSync(dbPath)) {
          CardEffectsDB = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        }
      } catch (e) {}
    }
  }"""

assert target in code, "target not found"
code = code.replace(target, replacement, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated loadCardEffectsDB!")
