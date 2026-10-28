import sqlite3, re, sys

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%this Spirit gains%symbol%' OR effect LIKE '%this Spirit gets%symbol%' OR effect LIKE '%this Spirit has%symbol%' OR effect LIKE '%シンボル%'")
rows = c.fetchall()

print(f"Total rows matching symbol: {len(rows)}")
for name, eff in rows[:25]:
    for block in re.split(r'\n(?=\[LV)', eff):
        if re.search(r'this Spirit (?:gains|gets|has)\b.*?symbol|シンボル', block, re.I):
            print(f"  {name:35s}: {block[:90].replace(chr(10), ' ')}")

conn.close()
