import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', c.fetchall())

c.execute("SELECT count(*) FROM cards")
print('Total cards in table:', c.fetchone()[0])

c.execute("PRAGMA table_info(cards)")
cols = [r[1] for r in c.fetchall()]
print('Columns:', cols)

# Check vacuum / size
c.execute("PRAGMA freelist_count")
print('Free pages:', c.fetchone()[0])
