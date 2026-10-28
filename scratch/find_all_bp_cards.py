import sys, os, re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

import standard_decks
decks = standard_decks.get_all_standard_decks()

bp_cards = []
for d in decks:
    for c in d.get('validated_cards', []):
        eff = c.get('effect') or ''
        if re.search(r'\+\d+\s*bp|gains\s*\+\d+|gets\s*\+\d+|bp\+\d+', eff, re.IGNORECASE):
            bp_cards.append((d.get('color'), c.get('name'), c.get('type'), eff))

print(f"Cards with BP boost in Standard Decks: {len(bp_cards)}")
for col, name, ctype, eff in bp_cards:
    print(f"[{col}] {name} ({ctype}):")
    for line in eff.splitlines():
        if re.search(r'bp', line, re.IGNORECASE):
            print(f"   {line.strip()}")
    print("-" * 40)
