import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, color, cost, type, effect FROM cards WHERE type = 'Ultimate' OR effect LIKE '%[Summon Condition%' OR effect LIKE '%[SuAdcon%' OR effect LIKE '%【召喚条件%'")
rows = c.fetchall()

cards = []
for r in rows:
    cards.append({
        'name': r[0],
        'color': r[1],
        'cost': r[2],
        'type': r[3],
        'effect': r[4]
    })

with open('scratch/sample_ultimates.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, indent=2, ensure_ascii=False)

print(f"Dumped {len(cards)} ultimate cards to scratch/sample_ultimates.json")
conn.close()
