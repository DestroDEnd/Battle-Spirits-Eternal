import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

import standard_decks
decks = standard_decks.get_all_standard_decks()

for d in decks:
    color = d.get('color')
    cards = d.get('validated_cards', [])
    print(f"==================================================")
    print(f"DECK: {d.get('name')} ({color}) - {len(cards)} unique cards")
    print(f"==================================================")
    for i, c in enumerate(cards, 1):
        print(f"\n[{i}] {c.get('name')} | Type: {c.get('type')} | Cost: {c.get('cost')}")
        print(f"    Raw Levels: {c.get('raw_levels')}")
        print(f"    Effect:\n{c.get('effect')}")
