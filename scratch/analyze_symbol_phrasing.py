import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, levels, effect FROM cards WHERE effect LIKE '%symbol%' OR effect LIKE '%シンボル%'")
rows = c.fetchall()
print(f"Total cards mentioning symbols: {len(rows)}")

patterns = [
    r'(?:this\s+(?:spirit|ultimate)\s+)?(?:gets|gains?|has)\s+(?:an?|one|\+?1|\+?2)\s+(?:additional\s+)?(?:[a-zA-Z]+\s+)?symbols?',
    r'gets\s+\+?\d+\s+symbols?',
    r'gains?\s+\+?\d+\s+symbols?',
    r'has\s+(?:two|three|four)\s+(?:[a-zA-Z]+\s+)?symbols',
    r'add\s+(?:an?|one|\d+)\s+(?:[a-zA-Z]+\s+)?symbols?',
    r'give\s+(?:an?|one|\d+)\s+(?:[a-zA-Z]+\s+)?symbols?',
    r'all\s+(?:your\s+)?(?:[a-zA-Z"\'-]+\s+)*spirits\s+(?:get|gain)\s+(?:an?|one|\+?1)\s+(?:additional\s+)?symbols?',
    r'シンボル(?:1つ|２つ|\+1|を\+1)を追加',
    r'シンボル\+1',
]

matched_cards = []
for name, levels, eff in rows:
    for pat in patterns:
        m = re.search(pat, eff, re.I)
        if m:
            matched_cards.append((name, m.group(0), eff))
            break

print(f"Matched symbol-granting cards: {len(matched_cards)}")
print("\nSample 25 matches:")
for name, match_text, eff in matched_cards[:25]:
    print(f"  {name:40s} | Match: {match_text}")

conn.close()
