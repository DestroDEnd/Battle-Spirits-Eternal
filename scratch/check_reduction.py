import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, cost, effect FROM cards LIMIT 1000")
patterns = [
    re.compile(r'reduction', re.I),
    re.compile(r'軽減'),
    re.compile(r'symbols? of this card', re.I),
]
found = 0
for name, cost, effect in c.fetchall():
    if not effect: continue
    for p in patterns:
        if p.search(effect):
            found += 1
            break
print(f"Cards with reduction in effect out of 1000: {found}")
conn.close()
