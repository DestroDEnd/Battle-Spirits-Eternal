import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

with open('data/cards_detailed.json', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} cards from data/cards_detailed.json")

sample_names = [
    'Evil Flame', 'Evil Draw', 'Birgoyle', 'The TwinkleDragonEmperor New-Siegfried',
    'The SacredEmperor Siegfrieden XV', 'Makai Soldier Curse Swordsman', 'Makai Holy Grail',
    'Leading Sieg', 'Chakrambat', 'The PartnerDemonLord Javad', 'The EarthDeitySword Gaianohoko'
]

for name in sample_names:
    for c in cards.values():
        if c['name'] == name:
            print("=" * 60)
            print(f"{c['card_number']}: {c['name']} [{c['type']}]")
            print(c['effect'])
            break
