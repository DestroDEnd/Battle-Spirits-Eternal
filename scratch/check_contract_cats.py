import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import json

contract_cats = [
    'Category:Contract Ultimate',
    'Category:Contract Spirit',
    'Category:Contract Brave',
    'Category:Contract Nexus'
]

for cat in contract_cats:
    url = f"https://battle-spirits.fandom.com/api.php?action=query&list=categorymembers&cmtitle={urllib.parse.quote(cat)}&cmtype=page&cmlimit=500&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = [m['title'] for m in data.get('query', {}).get('categorymembers', []) if m.get('ns') == 0]
            print(f"{cat}: {len(pages)} pages")
            for p in pages[:10]:
                print(f"  {p}")
    except Exception as e:
        print(f"{cat}: {e}")
