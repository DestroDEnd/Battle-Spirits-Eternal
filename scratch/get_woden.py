import sqlite3

conn = sqlite3.connect('battle_spirits.db')
cur = conn.cursor()
cur.execute("SELECT name, cost, type, color, effect FROM cards WHERE name LIKE '%Woden%'")
rows = cur.fetchall()
for r in rows:
    print(r[0], "Cost:", r[1], "Type:", r[2], "Color:", r[3])
    print(ascii(r[4]))
