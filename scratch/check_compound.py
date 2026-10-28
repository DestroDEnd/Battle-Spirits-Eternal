import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT count(*) FROM cards WHERE effect LIKE '%destroy%' AND (effect LIKE '%draw%' OR effect LIKE '%void%' OR effect LIKE '%exhaust%')")
print('Cards with compound multi-action effects:', c.fetchone()[0])
