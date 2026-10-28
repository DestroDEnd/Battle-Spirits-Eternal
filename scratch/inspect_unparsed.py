import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    parsed_cards = set(json.load(f).keys())

c.execute("SELECT name, type, effect FROM cards WHERE effect IS NOT NULL AND TRIM(effect) != ''")
unparsed = []
for name, ctype, eff in c.fetchall():
    if name not in parsed_cards:
        unparsed.append((name, ctype, eff))

print(f"Total unparsed cards: {len(unparsed)}")
for name, ctype, eff in unparsed[:10]:
    print(f"\n--- {name} ({ctype}) ---")
    print(eff[:200])
