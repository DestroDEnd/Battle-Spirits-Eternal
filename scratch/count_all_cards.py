import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM cards")
total = c.fetchone()[0]

c.execute("SELECT type, COUNT(*) as cnt FROM cards GROUP BY type ORDER BY cnt DESC")
types = c.fetchall()

c.execute("SELECT effect FROM cards WHERE effect IS NOT NULL AND effect != '' LIMIT 5")
samples = c.fetchall()

print(f"Total cards: {total}")
print("\nBreakdown by type:")
for t, cnt in types:
    print(f"  {t}: {cnt}")

print("\nSample effects:")
for (eff,) in samples[:3]:
    print("  ---")
    print("  " + eff[:200].replace('\n', '\n  '))
