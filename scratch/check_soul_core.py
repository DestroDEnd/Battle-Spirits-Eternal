import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, cost, effect FROM cards WHERE effect LIKE '%Soul Core%' OR effect LIKE '%soul core%' OR effect LIKE '%ソウルコア%'")
rows = c.fetchall()
print(f"Total cards mentioning Soul Core: {len(rows)}")
for i, r in enumerate(rows[:25]):
    print(f"{i+1}. [{r[1]}] {r[0]} (Cost {r[2]}): {r[3][:120]}...")

print("\n--- CARDS WITH SOUL CORE ON SPIRIT ---")
c.execute("SELECT name, type, cost, effect FROM cards WHERE effect LIKE '%[Soul Core] on this Spirit%' OR effect LIKE '%Soul Core is on this%' OR effect LIKE '%has [Soul Core]%' OR effect LIKE '%Soul Core is placed%' LIMIT 10")
rows = c.fetchall()
for r in rows:
    print(f"[{r[1]}] {r[0]}: {r[3][:150]}...")
