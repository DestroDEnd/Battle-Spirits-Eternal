with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = """          CardEffectsDB = await res.json();
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);"""

replacement = """          CardEffectsDB = await res.json();
          if (typeof window !== 'undefined' && window.BattleArena) window.BattleArena.CardEffectsDB = CardEffectsDB;
          console.log(`[NLP Effects Engine] Loaded operational database for ${Object.keys(CardEffectsDB).length} cards.`);"""

c_norm = c.replace('\r\n', '\n')
if target in c_norm:
    c_norm = c_norm.replace(target, replacement, 1)

target2 = """    executeUniversalCardEffect,
    CardEffectsDB,
    loadCardEffectsDB,"""

replacement2 = """    executeUniversalCardEffect,
    CardEffectsDB,
    getCardEffectsDB: () => CardEffectsDB,
    loadCardEffectsDB,"""

if target2 in c_norm:
    c_norm = c_norm.replace(target2, replacement2, 1)

with open('battle_arena.js', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c_norm)

print("Updated battle_arena.js exports!")
