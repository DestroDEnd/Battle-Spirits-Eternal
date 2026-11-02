import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE type = 'Ultimate' OR effect LIKE '%[Summon Condition%' OR effect LIKE '%【召喚条件%'")
rows = c.fetchall()
print(f"Total Ultimate/Summon Condition cards: {len(rows)}")

conditions = {}
pattern = re.compile(r'\[summon condition:\s*([^\]]+)\]|【召喚条件：([^】]+)】', re.I)

for name, eff in rows:
    if not eff: continue
    m = pattern.search(eff)
    if m:
        cond = (m.group(1) or m.group(2)).strip()
        # strip subsequent lines if multiline
        cond_first_line = cond.split('\n')[0].strip()
        conditions[cond_first_line] = conditions.get(cond_first_line, 0) + 1
    else:
        # maybe doesn't have closing bracket on first line
        m2 = re.search(r'\[summon condition:[^\n]+', eff, re.I)
        if m2:
            conditions[m2.group(0)] = conditions.get(m2.group(0), 0) + 1

print(f"Unique conditions count: {len(conditions)}")
for cond, cnt in sorted(conditions.items(), key=lambda x: -x[1])[:30]:
    print(f"({cnt}) {cond}")

conn.close()
