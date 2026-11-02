import sqlite3
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, image_url FROM cards WHERE name LIKE '%Ajaccio%'")
print(c.fetchall())
