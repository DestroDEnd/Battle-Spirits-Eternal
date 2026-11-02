import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT type, symbol, count(*) FROM cards GROUP BY type, symbol ORDER BY type, count(*) DESC")
for row in c.fetchall():
    print(row)
conn.close()
