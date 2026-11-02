import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

with open('filters_data.json', 'r', encoding='utf-8') as f:
    filters_data = json.load(f)

# Update family counts
for fam in filters_data.get('families', []):
    name = fam['name']
    cursor.execute("SELECT COUNT(*) FROM cards WHERE family = ? OR family LIKE ? OR family LIKE ? OR family LIKE ? OR families_json LIKE ?",
                   (name, f"{name},%", f"%,{name}", f"%,{name},%", f'%"{name}"%'))
    actual_count = cursor.fetchone()[0]
    fam['count'] = actual_count
    fam['wiki_count'] = actual_count

# Update set counts
for s in filters_data.get('sets', []):
    name = s.get('code') or s.get('name')
    if name:
        cursor.execute("SELECT COUNT(*) FROM cards WHERE card_number LIKE ? OR sets_json LIKE ?",
                       (f"{name}-%", f'%"{name}"%'))
        actual_count = cursor.fetchone()[0]
        s['count'] = actual_count

with open('filters_data.json', 'w', encoding='utf-8') as f:
    json.dump(filters_data, f, indent=2, ensure_ascii=False)

print("SUCCESSFULLY SYNCHRONIZED filters_data.json WITH battle_spirits.db!")
conn.close()
