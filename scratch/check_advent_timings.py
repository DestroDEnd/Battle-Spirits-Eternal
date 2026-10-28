import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%Advent%' OR effect LIKE '%煌臨%'")
rows = c.fetchall()

timings = set()
examples = {}

for name, effect in rows:
    # Look for Flash - [Advent: ...] (Timing) or [Advent: ...] (Timing)
    m = re.search(r'\[Advent:[^\]]+\]\s*(?:\(?\s*\(([^)]+)\)\)?|\(([^)]+)\))', effect, re.IGNORECASE)
    if m:
        t = (m.group(1) or m.group(2)).strip()
        timings.add(t)
        if t not in examples:
            examples[t] = (name, effect[:120].replace('\n', ' '))
    else:
        # Check japanese
        m2 = re.search(r'『([^』]+)』\s*【煌臨', effect)
        if m2:
            t = m2.group(1).strip()
            timings.add(t)
            if t not in examples:
                examples[t] = (name, effect[:120].replace('\n', ' '))

print("Distinct timings found:")
for t in sorted(timings):
    print(f"- {t} ==> e.g. {examples[t][0]}")
