import sqlite3, re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
rows = c.execute("SELECT name, effect FROM cards WHERE effect IS NOT NULL AND (effect LIKE '%decktop%' OR effect LIKE '%top of your deck%' OR effect LIKE '%top of the deck%' OR effect LIKE '%from your deck%')").fetchall()

patterns = [
    r'discard\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?',
    r'send\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?\s+to\s+(?:the\s+)?trash',
    r'send\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+)?top\s+of\s+your\s+deck\s+to\s+(?:the\s+)?trash'
]

matches = []
for name, eff in rows:
    eff_lower = eff.lower()
    for p in patterns:
        m = re.search(p, eff_lower)
        if m:
            matches.append((name, m.group(0)))
            break

print(f"Total self-mill/deck discard card effects found: {len(matches)}")
for name, m in matches[:25]:
    print(f"  {name}: {m}")
