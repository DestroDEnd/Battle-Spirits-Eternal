import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, type, effect FROM cards")
all_cards = c.fetchall()

restrictions = []
for name, ctype, effect in all_cards:
    if not effect:
        continue
    eff_lower = effect.lower()
    
    # 1. Turn restriction
    if any(phrase in eff_lower for phrase in [
        "can't be used on your turn",
        "cannot be used on your turn",
        "can't be used during your turn",
        "cannot be used during your turn",
        "can only be used on opponent",
        "can only be used during opponent",
        "can only be used on opposing",
        "can only be used during opposing",
        "usable only on opponent",
        "usable only during opponent",
        "usable only on opposing",
        "can't be used on opponent",
        "cannot be used on opponent",
        "can only be used on your turn",
        "can only be used during your turn"
    ]):
        restrictions.append(('TURN', name, ctype, effect))
        
    # 2. Step restriction
    elif any(phrase in eff_lower for phrase in [
        "can't be used in main step",
        "cannot be used in main step",
        "can't be used during main step",
        "cannot be used during main step",
        "can only be used in attack step",
        "can only be used during attack step",
        "can only be used in your attack step",
        "can only be used in opponent",
        "can't be used in attack step",
        "cannot be used in attack step"
    ]):
        restrictions.append(('STEP', name, ctype, effect))

print(f"Total restricted cards found: {len(restrictions)}")
for rtype, name, ctype, effect in restrictions[:30]:
    for line in effect.split('\n'):
        if any(w in line.lower() for w in ["can't be used", "cannot be used", "can only be used", "usable only"]):
            print(f"[{rtype}] {name} ({ctype}): {line.strip()}")
            break
