import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/canonical_standard_decks.json', 'r', encoding='utf-8') as f:
    decks = json.load(f)

print(type(decks))
if isinstance(decks, dict):
    for k, v in decks.items():
        cards = v.get('validated_cards', [])
        print(f"Deck Key '{k}': {v.get('name')} ({v.get('color')}) - {len(cards)} unique cards")
        card_names = [c.get('name') for c in cards]
        print(f"Card count: {len(cards)} | Names: {card_names}")
        print("="*60)
