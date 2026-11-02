import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM cards WHERE card_number = 'BS64-059'")
row = cursor.fetchone()
cursor.execute("PRAGMA table_info(cards)")
cols = [c[1] for c in cursor.fetchall()]
for k, v in zip(cols, row):
    print(f"{k} : {repr(v)[:120]}")
