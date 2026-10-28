import sqlite3, sys, re
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT card_number, name, color, cost, type, effect FROM cards WHERE effect LIKE '%When Battles%' OR effect LIKE '%At the end of battle%'")
rows = c.fetchall()
print(f"Cards with When Battles / At the end of battle: {len(rows)}")
for r in rows[:15]:
    print(f"[{r['card_number']}] {r['name']}")
    print(r['effect'])
    print("-" * 50)
