import sqlite3, json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT id, name, type, cost, color, levels, effect, symbol, family, card_number FROM cards WHERE name LIKE '%Alphard%'")
rows = c.fetchall()
with open('scratch/alphard_data.json', 'w', encoding='utf-8') as f:
    results = []
    for r in rows:
        results.append({
            'id': r[0],
            'name': r[1],
            'type': r[2],
            'cost': r[3],
            'color': r[4],
            'levels': r[5],
            'effect': r[6],
            'symbol': r[7],
            'family': r[8],
            'card_number': r[9]
        })
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Found {len(rows)} cards matching Alphard.")
