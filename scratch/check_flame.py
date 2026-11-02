import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
conn.row_factory = sqlite3.Row
r = conn.execute('SELECT * FROM cards WHERE name LIKE ?', ('%Flame Dance%',)).fetchone()
if r:
    d = dict(r)
    for k, v in d.items():
        print(f"{k}: {v}")
else:
    print("NOT FOUND")
