import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

import standard_decks
decks = standard_decks.get_all_standard_decks()
print(f"Total standard decks: {len(decks)}")
for d in decks:
    cards = d.get('validated_cards', [])
    print(f"Deck: {d.get('name')} ({d.get('color')}) - {len(cards)} unique cards, total {sum(c.get('count', 1) for c in cards)} cards")
    for i, c in enumerate(cards, 1):
        print(f"  {i}. {c.get('name')} (Count: {c.get('count')}, Cost: {c.get('cost')}, Type: {c.get('type')})")
        eff = c.get('effect')
        if eff:
            first_line = eff.splitlines()[0] if eff else ''
            print(f"     Effect: {first_line[:90]}")
    print("="*60)
