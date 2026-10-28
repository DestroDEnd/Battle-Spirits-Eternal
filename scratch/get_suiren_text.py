import sqlite3
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, effect FROM cards WHERE name LIKE '%Suiren%'")
for row in c.fetchall():
    print("NAME:", row[0])
    print("TYPE:", row[1])
    print("EFFECT:\n", row[2])
    print("="*40)
