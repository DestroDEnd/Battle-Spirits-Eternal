import json, sqlite3

with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print('Sample entries:')
for k in list(db.keys())[:5]:
    print(k, json.dumps(db[k], indent=2))

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute('SELECT name, type, color, cost, effect FROM cards LIMIT 5')
print('\nSample cards from SQLite:')
for row in c.fetchall():
    print(row[0], row[1], row[2], row[3])
    print(' Effect:', repr(row[4]))
