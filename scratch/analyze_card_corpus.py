import sqlite3, re
from collections import Counter

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT effect FROM cards WHERE effect IS NOT NULL AND TRIM(effect) != ''")
rows = c.fetchall()

headers = Counter()
keywords = Counter()

for (eff,) in rows:
    # find [Brackets]
    for m in re.finditer(r'\[([^\]]+)\]', eff):
        headers[m.group(1)] += 1
    # find (Parentheses)
    for m in re.finditer(r'\(([^\)]+)\)', eff):
        keywords[m.group(1)] += 1

print(f"Total cards analyzed: {len(rows)}")
print("\nTop 20 Bracket Headers:")
for k, v in headers.most_common(20):
    print(f"  [{k}]: {v}")

print("\nTop 20 Parentheses Timings/Conditions:")
for k, v in keywords.most_common(20):
    print(f"  ({k}): {v}")
