import sqlite3, json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM cards WHERE effect IS NULL OR TRIM(effect) = ''")
empty_effect_count = c.fetchone()[0]
print(f'Cards with completely empty effect: {empty_effect_count}')

c.execute("SELECT name, type, color, cost FROM cards WHERE effect IS NULL OR TRIM(effect) = '' LIMIT 10")
print('Samples of cards with empty effect (vanilla spirits/etc.):')
for row in c.fetchall():
    print(' ', row)

with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    existing_db = json.load(f)

c.execute("SELECT name, type, effect FROM cards WHERE effect IS NOT NULL AND TRIM(effect) != ''")
rows = c.fetchall()

missing_from_json = [r for r in rows if r[0] not in existing_db]
print(f'Total cards with effect in DB: {len(rows)}')
print(f'Cards currently missing from card_effects_db.json: {len(missing_from_json)}')
print('Sample missing cards:')
for r in missing_from_json[:10]:
    print(f' - {r[0]} ({r[1]}): {repr(r[2][:80])}...')
