import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import re
import json

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

card_num_re = re.compile(r'([A-Z0-9]{2,10}(?:-[A-Z0-9]+)+)', re.I)

cursor.execute("""
SELECT id, name, type, image_filename, image_url, sets_json
FROM cards
WHERE card_number IS NULL OR card_number = ''
""")
rows = cursor.fetchall()

missing = []
for r in rows:
    cid, name, ctype, img_f, img_u, sets = r
    m1 = card_num_re.search(img_f or '')
    m2 = card_num_re.search(img_u or '')
    if not m1 and not m2:
        missing.append((cid, name, ctype, img_f, img_u, sets))

print(f"Total remaining without regex in filename/url: {len(missing)}")
for cid, name, ctype, img_f, img_u, sets in missing:
    print(f"{cid} | {name} | {ctype} | img: {img_f} | sets: {sets}")

conn.close()
