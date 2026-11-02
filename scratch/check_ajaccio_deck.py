import json
with open('standard_decks_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
decks = d if isinstance(d, list) else d.get('decks', [])
for dk in decks:
    for c in dk.get('cards', []):
        if 'Ajaccio' in str(c):
            print(dk.get('color'), c)
