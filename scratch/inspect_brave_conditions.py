import sqlite3, re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE type='Brave'")
conds = set()
for name, eff in c.fetchall():
    m = re.findall(r'(?:Brave Condition|合体条件)[：:]\s*([^\n\r.]+)', eff, re.IGNORECASE)
    for match in m:
        conds.add(match.strip())

print(f"Found {len(conds)} unique conditions. Sample 20:")
for s in sorted(list(conds))[:20]:
    print("-", s)
