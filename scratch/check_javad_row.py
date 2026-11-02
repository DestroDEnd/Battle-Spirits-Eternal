import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT * FROM cards WHERE name = 'The PartnerDemonLord Javad'")
row = c.fetchone()
cols = [desc[0] for desc in c.description]
data = dict(zip(cols, row))
print(json.dumps(data, indent=2, ensure_ascii=False))
