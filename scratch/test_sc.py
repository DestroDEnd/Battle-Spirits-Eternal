import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE type = 'Ultimate' OR effect LIKE '%[Summon Condition%' OR effect LIKE '%[SuAdcon%' OR effect LIKE '%【召喚条件%'")
rows = c.fetchall()

unmatched = []
pattern = re.compile(r'(?:\[(?:Summon Condition|SuAdcon):?|【(?:召喚条件|召喚\/煌臨条件)：?)\s*([^\]】\n]+)', re.I)

for name, eff in rows:
    if not eff: continue
    m = pattern.search(eff)
    if not m:
        unmatched.append(name)

print(f"Total: {len(rows)}, Unmatched: {len(unmatched)}")
if unmatched:
    print("Unmatched:", unmatched)
conn.close()
