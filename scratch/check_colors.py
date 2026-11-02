import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT color, count(*) FROM cards GROUP BY color ORDER BY count(*) DESC LIMIT 20")
for r in c.fetchall():
    print(r)
conn.close()
