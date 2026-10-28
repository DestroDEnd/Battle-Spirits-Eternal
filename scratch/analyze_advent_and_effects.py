import sqlite3
import re
from collections import Counter

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

# 1. Advent conditions
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%Advent%' OR effect LIKE '%煌臨%'")
advent_cards = c.fetchall()
print(f"Total Advent cards: {len(advent_cards)}")

advent_reqs = []
for name, eff in advent_cards:
    m = re.search(r'\[Advent:\s*([^\]]+)\]|【煌臨：([^】]+)】', eff, re.I)
    if m:
        req = (m.group(1) or m.group(2)).strip()
        advent_reqs.append(req)

print("Top 20 Advent requirement types:")
for req, cnt in Counter(advent_reqs).most_common(20):
    print(f"  {cnt:4d}x {req}")

# 2. When Summoned effect patterns
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%(When Summoned%' OR effect LIKE '%(When Summoned/Attacks%' OR effect LIKE '%(When Advents%'")
summon_cards = c.fetchall()
print(f"\nTotal When Summoned / When Advents cards: {len(summon_cards)}")

patterns = {
    'opponent_destroys': r"opponent destroys a (?:spirit|ultimate)",
    'destroy_opposing_spirit': r"destroy (?:an|one|\d+)? opposing (?:spirit|ultimate|brave|nexus)",
    'send_cores_reserve_trash': r"send .*? cores? from .*? to the (?:reserve|trash)",
    'draw_cards': r"draw .*? cards?",
    'void_to_reserve_field': r"put .*? cores? from the void",
    'summon_from_trash': r"summon .*? from (?:your |the )?trash",
    'bounce_to_hand_deck': r"return .*? opposing .*? to (?:the )?(?:hand|deck)",
    'cant_be_blocked': r"(?:can't|cannot) be blocked"
}

pattern_counts = Counter()
for name, eff in summon_cards:
    for pat_name, pat in patterns.items():
        if re.search(pat, eff, re.I):
            pattern_counts[pat_name] += 1

print("\nFrequency of Summon/Advents effect patterns:")
for pat_name, cnt in pattern_counts.most_common():
    print(f"  {cnt:4d} cards: {pat_name}")

conn.close()
