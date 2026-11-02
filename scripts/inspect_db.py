import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in battle_spirits.db:", tables)

cursor.execute("SELECT * FROM cards LIMIT 1")
row = cursor.fetchone()
cursor.execute("PRAGMA table_info(cards)")
col_names = [c[1] for c in cursor.fetchall()]
sample_dict = dict(zip(col_names, row))
print("\nSample card from 'cards':")
print(json.dumps({k: v for k, v in sample_dict.items() if k not in ('effect', 'image_data')}, indent=2, ensure_ascii=True))
print("Effect sample:", repr((sample_dict.get('effect') or '')[:200]))

# Check card_number statistics
cursor.execute("SELECT COUNT(*), COUNT(DISTINCT card_number), COUNT(DISTINCT name) FROM cards")
total, dist_num, dist_name = cursor.fetchone()
print(f"\nStats: Total rows: {total}, Distinct card_numbers: {dist_num}, Distinct names: {dist_name}")

cursor.execute("SELECT COUNT(*) FROM cards WHERE card_number IS NULL OR card_number = ''")
empty_nums = cursor.fetchone()[0]
print(f"Cards with empty/null card_number: {empty_nums}")

cursor.execute("SELECT type, COUNT(*) FROM cards GROUP BY type ORDER BY COUNT(*) DESC")
types_breakdown = cursor.fetchall()
print("\nCard types breakdown in battle_spirits.db:")
for row in types_breakdown:
    print(f"  {repr(row[0])}: {row[1]}")

# Let's inspect some samples of cards where card_number is empty or weird
if empty_nums > 0:
    cursor.execute("SELECT id, name, type, card_number, sets_json FROM cards WHERE card_number IS NULL OR card_number = '' LIMIT 10")
    print("\nSamples of cards with empty card_number:")
    for row in cursor.fetchall():
        print(" ", row)

conn.close()
