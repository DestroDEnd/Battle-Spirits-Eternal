import sqlite3

conn = sqlite3.connect('battle_spirits.db')
cur = conn.cursor()
cur.execute("SELECT name, cost, type, color, effect FROM cards WHERE effect LIKE '%Tribute%'")
rows = cur.fetchall()
print(f"Found {len(rows)} tribute cards in battle_spirits.db:")
for r in rows:
    print(f"- {r[0]} ({r[2]}, Cost {r[1]}, {r[3]})")
    print(f"  Effect preview: {r[4][:140]}...")
