import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT count(*) FROM cards WHERE effect IS NOT NULL AND TRIM(effect) != ''")
with_effects = c.fetchone()[0]

c.execute("SELECT count(*) FROM cards")
total = c.fetchone()[0]

print(f"Total cards: {total}")
print(f"Cards with effects: {with_effects}")

c.execute("SELECT type, count(*) FROM cards GROUP BY type")
for row in c.fetchall():
    print(f"Type: {row[0]} -> {row[1]}")
