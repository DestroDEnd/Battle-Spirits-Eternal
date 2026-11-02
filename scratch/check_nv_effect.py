import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, effect FROM cards WHERE name LIKE '%Nouvelle-Vague%'")
row1 = c.fetchone()
print("Nouvelle-Vague Effect:")
print(repr(row1[1]))

c.execute("SELECT name, effect FROM cards WHERE name LIKE '%Magnazappah%'")
row2 = c.fetchone()
print("\nMagnazappah Effect:")
print(repr(row2[1]))
