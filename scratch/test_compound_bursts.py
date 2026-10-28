import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
rows = c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%[Burst:%' OR effect LIKE '%【バースト%'").fetchall()

compound = []
for name, eff in rows:
    m = re.search(r'\[Burst:\s*([^\]]+)\](?:\s*\(([^)]+)\))?', eff, re.IGNORECASE)
    if m:
        text = (m.group(1) + ' ' + (m.group(2) or '')).lower()
        count = 0
        if 'life is reduced' in text or 'life is decreased' in text: count += 1
        if 'when summoned' in text or 'summoned/advents' in text: count += 1
        if 'attacks' in text and ('opposing' in text or 'opponent' in text): count += 1
        if 'destroyed' in text and ('opponent' in text or 'depleted' in text): count += 1
        if 'hand increase' in text or 'hand increases' in text: count += 1
        if count > 1:
            compound.append((name, m.group(0)))

print(f"Total compound burst cards: {len(compound)}")
for n, c_str in compound[:15]:
    print(f" - {n}: {c_str}")
