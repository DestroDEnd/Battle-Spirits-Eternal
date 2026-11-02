import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

with open('filters_data.json', 'r', encoding='utf-8') as f:
    filters_data = json.load(f)

families = filters_data.get('families', [])

discrepancies = []
for fam in families:
    name = fam['name']
    expected_count = fam.get('wiki_count', fam.get('count', 0))
    # Query db
    cursor.execute("SELECT COUNT(*) FROM cards WHERE family = ? OR family LIKE ? OR family LIKE ? OR family LIKE ? OR families_json LIKE ?",
                   (name, f"{name},%", f"%,{name}", f"%,{name},%", f'%"{name}"%'))
    db_count = cursor.fetchone()[0]
    if db_count != expected_count:
        discrepancies.append((name, expected_count, db_count))

print(f"Total families with count discrepancy: {len(discrepancies)}")
for d in discrepancies[:25]:
    print(d)
