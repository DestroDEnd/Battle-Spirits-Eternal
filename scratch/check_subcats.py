import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import json

types = ['Category:Spirit', 'Category:Brave', 'Category:Magic', 'Category:Nexus', 'Category:Ultimate']
for t in types:
    url = f"https://battle-spirits.fandom.com/api.php?action=query&list=categorymembers&cmtitle={urllib.parse.quote(t)}&cmtype=subcat&cmlimit=50&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            subcats = [m['title'] for m in data.get('query', {}).get('categorymembers', [])]
            print(f'{t} subcategories:', subcats)
    except Exception as e:
        print(f'{t}:', e)
