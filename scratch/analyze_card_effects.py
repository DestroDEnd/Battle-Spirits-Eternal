import sqlite3
import re
from collections import Counter

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT count(*) FROM cards")
total_cards = c.fetchone()[0]
print(f"Total cards in DB: {total_cards}")

# Let's inspect trigger patterns
c.execute("SELECT effect FROM cards WHERE effect IS NOT NULL AND effect != ''")
effects = [r[0] for r in c.fetchall()]

triggers = Counter()
keywords = Counter()

trigger_regexes = [
    r'\(When Summoned\)',
    r'\(When Attacks\)',
    r'\(When Blocks\)',
    r'\(When Destroyed\)',
    r'\(When Depleted\)',
    r'\(At the start of',
    r'\(Your Main Phase\)',
    r'\(During.*Turn\)',
    r'\[Burst:.*\]',
    r'\[Flash\]',
    r'\[Tribute:.*\]'
]

keyword_regexes = [
    r'\[Clash\]',
    r'\[Crush\]',
    r'\[Great Crush\]',
    r'\[Curse\]',
    r'\[Swift\]',
    r'\[Armor:[^\]]+\]',
    r'\[Heavy Armor:[^\]]+\]',
    r'\[Consecutive Attack:[^\]]+\]',
    r'\[Awaken\]',
    r'BP comparison',
    r'from the Void to',
    r'destroy.*Spirit',
    r'draw.*card',
    r'exhaust.*Spirit',
    r'refresh.*Spirit',
    r'cannot be blocked',
    r'send.*Life to.*Reserve',
    r'return.*to.*hand'
]

for eff in effects:
    for tr in trigger_regexes:
        if re.search(tr, eff, re.IGNORECASE):
            triggers[tr] += 1
    for kw in keyword_regexes:
        if re.search(kw, eff, re.IGNORECASE):
            keywords[kw] += 1

print("\n--- TOP TRIGGER PATTERNS ---")
for tr, count in triggers.most_common():
    print(f"{tr:25}: {count} cards ({count/total_cards*100:.1f}%)")

print("\n--- TOP EFFECT MECHANICS ---")
for kw, count in keywords.most_common():
    print(f"{kw:25}: {count} cards ({count/total_cards*100:.1f}%)")
