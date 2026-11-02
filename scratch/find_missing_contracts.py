import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import json
import sqlite3

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

contract_cats = [
    'Category:Contract Ultimate',
    'Category:Contract Spirit',
    'Category:Contract Brave',
    'Category:Contract Nexus'
]

missing_by_cat = {}
all_missing = []

for cat in contract_cats:
    url = f"https://battle-spirits.fandom.com/api.php?action=query&list=categorymembers&cmtitle={urllib.parse.quote(cat)}&cmtype=page&cmlimit=500&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = [m['title'] for m in data.get('query', {}).get('categorymembers', []) if m.get('ns') == 0]
            cat_missing = []
            for p in pages:
                cursor.execute("SELECT id, name FROM cards WHERE name = ? OR name = ?", (p, p.replace('［', '[').replace('］', ']')))
                if not cursor.fetchone():
                    cat_missing.append(p)
                    all_missing.append((cat, p))
            missing_by_cat[cat] = cat_missing
            print(f"{cat}: {len(cat_missing)} missing out of {len(pages)}")
    except Exception as e:
        print(f"{cat}: {e}")

print(f"\nTOTAL MISSING CONTRACT CARDS: {len(all_missing)}")
for cat, p in all_missing:
    print(f"  [{cat}] {p}")
