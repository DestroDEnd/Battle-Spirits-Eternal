import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name FROM cards WHERE name LIKE '%Hephaestus%'")
print('Hephaestus:', c.fetchall())
c.execute("SELECT name FROM cards WHERE name LIKE '%Judgment%'")
print('Judgment:', c.fetchall())
