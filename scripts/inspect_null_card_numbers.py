import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("""
SELECT id, name, type, image_filename, image_url, sets_json
FROM cards
WHERE card_number IS NULL OR card_number = ''
LIMIT 20
""")

print("Inspect 20 cards with null card_number:")
for row in cursor.fetchall():
    cid, name, ctype, img_file, img_url, sets = row
    print(f"ID {cid}: {name} ({ctype}) | img_file: {img_file} | img_url: {img_url} | sets: {sets}")

# Check how many of the 3492 have card numbers extractable from image_filename or image_url
cursor.execute("""
SELECT id, name, image_filename, image_url, sets_json
FROM cards
WHERE card_number IS NULL OR card_number = ''
""")
all_empty = cursor.fetchall()

card_num_re = re.compile(r'([A-Z0-9]{2,10}(?:-[A-Z0-9]+)+)', re.I)
found_from_img = 0
found_from_url = 0
not_found = []

for row in all_empty:
    cid, name, img_file, img_url, sets = row
    m1 = card_num_re.search(img_file or '')
    m2 = card_num_re.search(img_url or '')
    if m1:
        found_from_img += 1
    elif m2:
        found_from_url += 1
    else:
        not_found.append((cid, name, img_file, img_url, sets))

print(f"\nOut of {len(all_empty)} null card_numbers:")
print(f"  Found regex match in image_filename: {found_from_img}")
print(f"  Found regex match in image_url: {found_from_url}")
print(f"  Still missing: {len(not_found)}")

if not_found:
    print("\nSamples still missing:")
    for x in not_found[:15]:
        print(" ", x)

conn.close()
