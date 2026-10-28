import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
rows = conn.execute("SELECT name, effect FROM cards WHERE effect LIKE '%[Burst:%' OR effect LIKE '%【バースト%'").fetchall()
cards = [{'name': r[0], 'effect': r[1]} for r in rows]
with open('scratch/burst_cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)
print(f"Exported {len(cards)} burst cards")
