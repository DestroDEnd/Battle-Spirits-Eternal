import sqlite3
import re
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

# 1. Check Advent step specifications
c.execute("SELECT name, type, effect FROM cards WHERE effect LIKE '%Advent%' OR effect LIKE '%煌臨%'")
advent_cards = c.fetchall()
print(f"Total Advent cards found: {len(advent_cards)}")

advent_steps = {}
for name, ctype, effect in advent_cards:
    m = re.search(r'\[Advent:[^\]]+\]\s*\(([^)]+)\)', effect, re.IGNORECASE)
    if m:
        step = m.group(1).strip()
        advent_steps[step] = advent_steps.get(step, 0) + 1
    else:
        # Check without brackets or japanese
        m2 = re.search(r'煌臨:[^』]+』\s*『([^』]+)』', effect)
        if m2:
            step = m2.group(1).strip()
            advent_steps[step] = advent_steps.get(step, 0) + 1

print("\nAdvent timing breakdown:")
for step, count in sorted(advent_steps.items(), key=lambda x: -x[1])[:20]:
    print(f"  '{step}': {count}")

# 2. Check cards with "can't be used" or "cannot be used" or "only during"
c.execute("SELECT name, type, effect FROM cards WHERE effect LIKE '%can%t be used%' OR effect LIKE '%cannot be used%' OR effect LIKE '%can only be used%'")
restrict_cards = c.fetchall()
print(f"\nTotal cards with usage restrictions: {len(restrict_cards)}")
for name, ctype, effect in restrict_cards[:15]:
    # Extract the sentence with restriction
    sentences = [s.strip() for s in effect.split('.') if any(k in s.lower() for k in ["can't be used", "cannot be used", "can only be used", "usable only"])]
    print(f"- {name} ({ctype}): {' | '.join(sentences[:2])}")
