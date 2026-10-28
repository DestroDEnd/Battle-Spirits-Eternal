import sqlite3
import re
from collections import Counter

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
rows = c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%[Burst:%' OR effect LIKE '%【バースト%'").fetchall()
print(f"Total cards with Burst: {len(rows)}")

en_triggers = Counter()
jp_triggers = Counter()

for name, eff in rows:
    en_matches = re.findall(r'\[Burst:\s*([^\]\n]+)\]', eff, re.IGNORECASE)
    for m in en_matches:
        # Normalize slightly
        clean = m.strip()
        en_triggers[clean] += 1
    jp_matches = re.findall(r'【バースト[：:]([^】\n]+)】', eff)
    for m in jp_matches:
        jp_triggers[m.strip()] += 1

print("\n--- Top English Burst Conditions ---")
for trig, count in en_triggers.most_common(40):
    print(f"{count:4d} | {trig}")

print("\n--- Top Japanese Burst Conditions ---")
for trig, count in jp_triggers.most_common(20):
    print(f"{count:4d} | {trig}")
