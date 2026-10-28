import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT * FROM cards WHERE name LIKE '%The HeroDragon Lord-Dragon%' OR name LIKE '%The Hero Dragon Lord%'")
rows = c.fetchall()
print(f"Total matching: {len(rows)}")
for r in rows:
    print(f"Card Number: {r['card_number']} | Name: {r['name']} | Color: {r['color']} | Cost: {r['cost']} | Type: {r['type']}")
    print(f"Effect: {r['effect']}")
    print(f"Levels: {r['levels']}")
    print("=" * 60)
