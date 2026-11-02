import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, levels, effect FROM cards WHERE type='Brave' LIMIT 10")
for r in c.fetchall():
    print("NAME:", r[0])
    print("LEVELS:", repr(r[1]))
    print("EFFECT:", r[2][:120].replace('\n', ' '))
    print("-" * 40)
