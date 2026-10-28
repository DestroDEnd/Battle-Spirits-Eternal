import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("PRAGMA table_info(cards)")
cols = [r[1] for r in c.fetchall()]
print("Columns:", cols)
