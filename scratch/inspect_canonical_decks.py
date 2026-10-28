import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/canonical_standard_decks.json', 'r', encoding='utf-8') as f:
    decks = json.load(f)

print(f"Total decks: {len(decks)}")
for d in decks:
    cards = d.get('validated_cards', [])
    print(f"Deck: {d.get('name')} ({d.get('color')}) - {len(cards)} unique cards")
    card_names = [c.get('name') for c in cards]
    print("Cards:", card_names)
    print("="*60)
