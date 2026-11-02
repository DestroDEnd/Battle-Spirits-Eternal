import sqlite3, json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']
all_cards = {}

for col in colors:
    c.execute("""
        SELECT name, cost, color, type, family, rarity, image_url, card_number, effect, levels
        FROM cards
        WHERE color = ?
          AND (rarity LIKE '%X%' OR rarity LIKE '%XX%')
          AND image_url IS NOT NULL AND image_url != ''
        ORDER BY RANDOM() LIMIT 20
    """, (col,))
    rows = c.fetchall()
    cards_list = []
    for r in rows:
        cards_list.append({
            'name': r[0],
            'cost': r[1],
            'color': r[2],
            'type': r[3],
            'family': r[4],
            'rarity': r[5],
            'image_url': r[6],
            'card_number': r[7],
            'effect': r[8],
            'levels': r[9]
        })
    all_cards[col] = cards_list
    print(f'{col}: found {len(cards_list)} X-Rares')

# Also create general pool (4 of each color = 24 cards)
general_pool = []
for col in colors:
    general_pool.extend(all_cards[col][:4])

payload = {
    'cards': general_pool,
    'by_color': all_cards
}

with open('featured_x_rares.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, indent=2)

print('featured_x_rares.json generated successfully!')
