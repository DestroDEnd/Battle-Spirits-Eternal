import sys, os
sys.path.insert(0, os.path.abspath('.'))
import standard_decks

decks = standard_decks.get_all_standard_decks()
for d in decks:
    name = d.get('name')
    color = d.get('color')
    cards = d.get('validated_cards') or d.get('cards') or []
    magics = [c for c in cards if c.get('type') == 'Magic']
    print(f"=== {name} ({color}) ===")
    for m in magics:
        eff = (m.get('effect') or '').replace('\n', ' ')
        print(f"  - {m.get('name')} (Cost {m.get('cost')})")
        print(f"    Effect: {ascii(eff[:120])}")
