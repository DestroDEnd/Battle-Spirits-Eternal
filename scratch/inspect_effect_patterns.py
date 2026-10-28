import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

print("--- EXAMINING (WHEN SUMMONED) EFFECTS ---")
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%(When Summoned)%' LIMIT 25")
for name, eff in c.fetchall():
    # Extract the when summoned block
    m = re.search(r'(\[LV\d.*?\(When Summoned\)[\s\S]*?)(?=\n\s*\n|\[LV|$)', eff)
    snippet = m.group(1).replace('\n', ' ') if m else eff[:100]
    print(f"• {name}: {ascii(snippet[:120])}")

print("\n--- EXAMINING (WHEN ATTACKS) EFFECTS ---")
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%(When Attacks)%' LIMIT 25")
for name, eff in c.fetchall():
    m = re.search(r'(\[LV\d.*?\(When Attacks\)[\s\S]*?)(?=\n\s*\n|\[LV|$)', eff)
    snippet = m.group(1).replace('\n', ' ') if m else eff[:100]
    print(f"• {name}: {ascii(snippet[:120])}")
