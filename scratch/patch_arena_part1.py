with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Patch loadTrainedAiWeights
t1 = """  async function loadTrainedAiWeights() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        const res = await fetch('/api/ai-weights');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            DuelState.aiWeights = data;
          }
        }
      }
    } catch (e) {
      // Graceful fallback to embedded DEFAULT_AI_WEIGHTS
    }
  }"""

r1 = """  async function loadTrainedAiWeights() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        let data = null;
        try {
          const sRes = await fetch('./ai_weights.json');
          if (sRes.ok) data = await sRes.json();
        } catch (e) {}
        if (!data) {
          try {
            const res = await fetch('/api/ai-weights');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) data = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          DuelState.aiWeights = data;
        }
      }
    } catch (e) {
      // Graceful fallback to embedded DEFAULT_AI_WEIGHTS
    }
  }"""

# 2. Patch loadCardEffectsDB
t2 = """  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.origin) {
      try {
        const res = await fetch(window.location.origin + '/api/card-effects-db');
        if (res.ok) {
          CardEffectsDB = await res.json();
          if (typeof window !== 'undefined' && window.BattleArena) window.BattleArena.CardEffectsDB = CardEffectsDB;
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to fetch /api/card-effects-db:', e);
      }"""

r2 = """  let CardEffectsDB = {};
  async function loadCardEffectsDB() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.origin) {
      try {
        let data = null;
        try {
          const sRes = await fetch('./card_effects_db.json');
          if (sRes.ok) data = await sRes.json();
        } catch (e) {}
        if (!data) {
          try {
            const res = await fetch(window.location.origin + '/api/card-effects-db');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) data = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (data && typeof data === 'object') {
          CardEffectsDB = data;
          if (typeof window !== 'undefined' && window.BattleArena) window.BattleArena.CardEffectsDB = CardEffectsDB;
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);
        }
      } catch (e) {
        console.warn('[NLP Effects Engine] Failed to load card effects db:', e);
      }"""

# 3. Patch initBattleArena standard-decks fetch
t3 = """  async function initBattleArena() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        const res = await fetch('/api/standard-decks');
        if (res.ok) {
          const data = await res.json();
          const list = data.decks || [];
          list.forEach(d => {
            DuelState.standardDecks[d.color.toLowerCase()] = d;
          });
        }
      }
    } catch (e) {
      // Graceful fallback in test or offline environment
    }"""

r3 = """  async function initBattleArena() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        let stdData = null;
        try {
          const sRes = await fetch('./standard_decks_data.json');
          if (sRes.ok) stdData = await sRes.json();
        } catch (e) {}
        if (!stdData) {
          try {
            const res = await fetch('/api/standard-decks');
            if (res.ok) {
              const text = await res.text();
              if (text.trim().startsWith('{')) stdData = JSON.parse(text);
            }
          } catch (e) {}
        }
        if (stdData) {
          const list = stdData.decks || (Array.isArray(stdData) ? stdData : []);
          list.forEach(d => {
            DuelState.standardDecks[d.color.toLowerCase()] = d;
          });
        }
      }
    } catch (e) {
      // Graceful fallback in test or offline environment
    }"""

c_norm = c.replace('\r\n', '\n')
for i, (t, r) in enumerate([(t1, r1), (t2, r2), (t3, r3)]):
    t_n = t.replace('\r\n', '\n')
    r_n = r.replace('\r\n', '\n')
    assert t_n in c_norm, f"Target {i+1} not found!"
    c_norm = c_norm.replace(t_n, r_n)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(c_norm)

print("Part 1 of battle_arena.js patched successfully!")
