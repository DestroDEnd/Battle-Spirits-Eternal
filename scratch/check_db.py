import sqlite3

conn = sqlite3.connect('cards.db')
c = conn.cursor()
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", tables)

for t in tables:
    tname = t[0]
    schema = c.execute(f"PRAGMA table_info({tname})").fetchall()
    print(f"Schema of {tname}:", [col[1] for col in schema])
    rows = c.execute(f"SELECT * FROM {tname} WHERE name LIKE '%Suiren%'").fetchall()
    if rows:
        print(f"Suiren in {tname}:", rows[0])
