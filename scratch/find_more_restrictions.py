import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, type, effect FROM cards")
all_cards = c.fetchall()

found = []
for name, ctype, effect in all_cards:
    if not effect:
        continue
    eff_lower = effect.lower()
    
    # Check for keywords related to can't / cannot be used or timing restriction
    if re.search(r"(can't|cannot|can not|unable to|not able to)\s+(be\s+used|be\s+cast|be\s+played|use\s+this|activate)", eff_lower):
        found.append((name, ctype, effect))
    elif re.search(r"(only\s+be\s+used|only\s+usable|usable\s+only|only\s+during|only\s+on\s+opponent)", eff_lower):
        found.append((name, ctype, effect))

print(f"Total found with regex: {len(found)}")
for name, ctype, effect in found[:30]:
    for line in effect.split('\n'):
        if re.search(r"(can't|cannot|only\s+be\s+used|usable\s+only|can\s+only|not\s+be\s+used)", line, re.I):
            print(f"- {name} ({ctype}): {line.strip()}")
            break
