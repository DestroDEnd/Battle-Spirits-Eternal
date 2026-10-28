import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, effect FROM cards WHERE type LIKE '%Nexus%' AND effect LIKE '%Flash%' LIMIT 5")
for name, ctype, eff in c.fetchall():
    print(f"=== {name} ({ctype}) ===")
    print(eff[:300])
    print()
