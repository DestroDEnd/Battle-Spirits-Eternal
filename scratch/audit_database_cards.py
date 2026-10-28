import sqlite3, sys, re
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT id, name, type, color, cost, levels, effect FROM cards")
all_cards = c.fetchall()
print(f"Total cards audited: {len(all_cards)}")

# Check for null/empty fields
missing_name = sum(1 for c in all_cards if not c[1])
missing_type = sum(1 for c in all_cards if not c[2])
missing_cost = sum(1 for c in all_cards if c[4] is None)
missing_levels = sum(1 for c in all_cards if c[2] == 'Spirit' and not c[5])
print(f"Data integrity: missing_name={missing_name}, missing_type={missing_type}, missing_cost={missing_cost}, Spirits missing levels={missing_levels}")

# Timing / Trigger audit
timing_patterns = {
    'When Summoned': r'\(When Summoned(?:[^)]*)\)',
    'When Attacks': r'\(When Attacks(?:[^)]*)\)',
    'When Blocks': r'\(When Blocks(?:[^)]*)\)',
    'When Attacks/Blocks': r'\(When Attacks/Blocks(?:[^)]*)\)',
    'When Battles': r'\(When Battles(?:[^)]*)\)',
    'When Destroyed': r'\(When (?:Depleted/)?Destroyed(?:[^)]*)\)',
    'When Advents': r'\(When Advents(?:[^)]*)\)',
    'Burst': r'\[Burst:',
    'Advent': r'\[Advent:',
    'Mirage': r'\[Mirage:',
    'Flash': r'\[Flash\]',
    'Main': r'\[Main\]',
}

timing_counts = {}
for tname, pat in timing_patterns.items():
    cnt = sum(1 for c in all_cards if c[6] and re.search(pat, c[6], re.IGNORECASE))
    timing_counts[tname] = cnt
    print(f"  Timing [{tname}]: {cnt} cards")

# Major effect verbs across all cards
verbs = {
    'Destroy Spirit': r'destroy\s+(?:an?|the|one|all|\d+)?\s*(?:opposing|exhausted|depleted)?\s*(?:spirit|brave|nexus|ultimate)',
    'Destroy Exhausted Spirit': r'destroy\s+(?:an?|the|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+spirit',
    'Core to Void/Reserve': r'cores?\s+(?:from\s+(?:the\s+)?void)?\s+to\s+(?:your\s+)?(?:reserve|spirit|field)',
    'Remove Cores (Deplete)': r'send\s+(?:up to\s+)?(?:\d+|a|an|one|two|three|\w+)?\s*cores?\s+from.*?to\s+the\s+(?:reserve|trash)',
    'Draw Card': r'draw\s+(?:\d+|a|an|one|two|three|\w+)?\s*cards?',
    'Exhaust Spirit': r'exhaust\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit',
    'Refresh Spirit': r'refresh\s+(?:this|an?|one|all|\d+)?\s*spirit',
    'Return to Hand': r'return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?hand',
    'Return to Deck': r'return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?(?:top|bottom\s+of\s+the\s+)?deck',
    'BP Boost': r'(?:gets?|gains?)\s*\+\d+000\s*BP',
    'Cant be Blocked': r'(?:can\'t|cannot)\s+be\s+blocked',
    'Must Block / Clash': r'must\s+block|\[Clash\]',
    'Immortal / Reanimation': r'summon.*?from\s+(?:your\s+)?trash|\[Immortal'
}

print("\n=== Effect Action Distribution across Database ===")
for vname, pat in verbs.items():
    cnt = sum(1 for c in all_cards if c[6] and re.search(pat, c[6], re.IGNORECASE))
    print(f"  {vname}: {cnt} cards")
