import sqlite3, json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute('SELECT COUNT(*) FROM cards')
total_cards = c.fetchone()[0]
print('Total cards in database:', total_cards)

c.execute("SELECT COUNT(*) FROM cards WHERE effect IS NOT NULL AND TRIM(effect) != ''")
cards_with_effect = c.fetchone()[0]
print('Cards with non-empty effect:', cards_with_effect)

c.execute("SELECT type, count(*) FROM cards GROUP BY type")
print('Card types in database:')
for row in c.fetchall():
    print(' ', row)

try:
    with open('card_effects_db.json', 'r', encoding='utf-8') as f:
        effects_db = json.load(f)
    print('Cards in card_effects_db.json:', len(effects_db))
except Exception as e:
    print('Error loading card_effects_db.json:', e)
