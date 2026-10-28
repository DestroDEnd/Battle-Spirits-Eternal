import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, cost, type, effect FROM cards WHERE type='Magic' AND (name LIKE '%Aura%' OR effect LIKE '%BP%') LIMIT 15")
rows = c.fetchall()
for r in rows:
    print(r[0], '| Cost:', r[1], '| Effect:', ascii(r[3][:120]))
