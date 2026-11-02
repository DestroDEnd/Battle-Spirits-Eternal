import sys
sys.stdout.reconfigure(encoding='utf-8')
import re
import sqlite3

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

with open('scratch/sd65_fandom.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Find card links or card lines in wikitext
cards = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', text)
print(f'Found {len(cards)} links in SD65:')
for c in cards:
    if any(k in c.lower() for k in ['the ', 'javad', 'four', 'hell', 'count', 'demon']):
        cursor.execute("SELECT card_number, name FROM cards WHERE name = ? OR name LIKE ?", (c, f'%{c}%'))
        res = cursor.fetchall()
        print(f"  {c} -> in db: {res}")
