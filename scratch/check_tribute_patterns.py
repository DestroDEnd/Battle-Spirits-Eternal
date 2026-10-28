import sqlite3, re

conn = sqlite3.connect('battle_spirits.db')
cur = conn.cursor()
cur.execute("SELECT name, cost, effect FROM cards WHERE effect LIKE '%Tribute%'")
rows = cur.fetchall()

patterns = set()
for r in rows:
    matches = re.findall(r'\[Tribute:[^\]]+\]', r[2], re.IGNORECASE)
    for m in matches:
        patterns.add(m)

print(f"Total unique Tribute patterns ({len(patterns)}):")
for p in sorted(patterns):
    print(ascii(p))
