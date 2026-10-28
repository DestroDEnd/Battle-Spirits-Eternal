import sqlite3, re, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

# Check tables in database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in battle_spirits.db:", tables)

for (tbl,) in tables:
    cursor.execute(f"PRAGMA table_info({tbl})")
    cols = [c[1] for c in cursor.fetchall()]
    cursor.execute(f"SELECT count(*) FROM {tbl}")
    cnt = cursor.fetchone()[0]
    print(f"Table '{tbl}' ({cnt} rows): cols={cols}")
