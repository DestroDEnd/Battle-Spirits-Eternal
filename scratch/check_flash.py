import sqlite3

conn = sqlite3.connect('cards.db')
c = conn.cursor()

c.execute("SELECT name, type, effect FROM cards WHERE effect LIKE '%Flash%' LIMIT 5")
for r in c.fetchall():
    print(r[0], '|', r[1], '|', r[2][:80])

c.execute("SELECT name, type, effect FROM cards WHERE effect LIKE '%Swift%' LIMIT 5")
for r in c.fetchall():
    print(r[0], '|', r[1], '|', r[2][:80])
