import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, cards_json FROM decks")
decks = cursor.fetchall()

all_deck_cards = {}

for d_id, d_name, cards_json in decks:
    cards = json.loads(cards_json) if cards_json else []
    for c in cards:
        name = c.get('name')
        num = c.get('card_number')
        key = (num, name)
        if key not in all_deck_cards:
            all_deck_cards[key] = {
                'card_number': num,
                'name': name,
                'type': c.get('type'),
                'cost': c.get('cost'),
                'color': c.get('color'),
                'effect': c.get('effect'),
                'decks': [d_name]
            }
        else:
            all_deck_cards[key]['decks'].append(d_name)

print(f"Total unique cards across all decks: {len(all_deck_cards)}\n")

for (num, name), c in sorted(all_deck_cards.items(), key=lambda x: (x[1]['type'] or '', x[1]['name'] or '')):
    eff = c['effect'] or 'None'
    eff_single = eff.replace('\n', ' ')
    print(f"[{c['card_number']}] {c['name']} ({c['type']}, {c['color']}, Cost {c['cost']})")
    print(f"   Effect: {eff_single[:120]}")
