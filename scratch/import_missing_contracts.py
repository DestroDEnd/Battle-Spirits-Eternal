import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import json
import sqlite3
import fetch_card
import database
import time

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

contract_cats = [
    'Category:Contract Ultimate',
    'Category:Contract Spirit',
    'Category:Contract Brave',
    'Category:Contract Nexus'
]

to_fetch = []
for cat in contract_cats:
    url = f"https://battle-spirits.fandom.com/api.php?action=query&list=categorymembers&cmtitle={urllib.parse.quote(cat)}&cmtype=page&cmlimit=500&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = [m['title'] for m in data.get('query', {}).get('categorymembers', []) if m.get('ns') == 0]
            for p in pages:
                cursor.execute("SELECT id FROM cards WHERE name = ? OR name = ?", (p, p.replace('［', '[').replace('］', ']')))
                if not cursor.fetchone():
                    to_fetch.append(p)
    except Exception as e:
        print(f"Error fetching {cat}: {e}")

print(f"Total missing contract cards to fetch: {len(to_fetch)}")

# Batch fetch in chunks of 20
BATCH_SIZE = 20
imported_count = 0

for i in range(0, len(to_fetch), BATCH_SIZE):
    batch = to_fetch[i:i+BATCH_SIZE]
    print(f"Fetching batch {i//BATCH_SIZE + 1}/{(len(to_fetch) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} cards)...")
    res = fetch_card.fetch_cards_batch(batch)
    imported_count += len(res)
    time.sleep(1)

print(f"\nFINISHED IMPORT! Successfully imported {imported_count} contract cards into battle_spirits.db!")

# Also update wiki_all_card_titles.json so titles cache is complete
try:
    with open('wiki_all_card_titles.json', 'r', encoding='utf-8') as f:
        titles = set(json.load(f))
    for p in to_fetch:
        titles.add(p)
    with open('wiki_all_card_titles.json', 'w', encoding='utf-8') as f:
        json.dump(sorted(list(titles)), f, indent=1)
    print(f"Updated wiki_all_card_titles.json with all new contract card titles! (Total: {len(titles)})")
except Exception as e:
    print("Error updating titles cache:", e)

# Also compile card effects for any new cards into card_effects_db.json
conn.close()
