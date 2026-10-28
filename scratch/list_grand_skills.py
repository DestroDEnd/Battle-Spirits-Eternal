import sqlite3
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, effect FROM cards WHERE type LIKE '%Nexus%' AND (effect LIKE '%Grand Skill%' OR effect LIKE '%Flash%')")
rows = c.fetchall()
print(f"Total Nexus cards with Grand Skill or Flash: {len(rows)}")
for name, ctype, eff in rows[:8]:
    gs = re.search(r'\[Grand Skill:\s*(\d+)\]', eff)
    gs_cost = gs.group(1) if gs else 'N/A'
    timing = 'Unknown'
    if 'Flash' in eff:
        timing = 'Flash'
    print(f"• {name} ({ctype}) | Grand Skill Cost: {gs_cost} | Timing: {timing}")
