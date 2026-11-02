import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import urllib.parse
import json

# Check all categories containing "Card" or related to types
url = "https://battle-spirits.fandom.com/api.php?action=query&list=allcategories&acprefix=Contract&aclimit=50&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        cats = [c['*'] for c in data.get('query', {}).get('allcategories', [])]
        print("Categories starting with 'Contract':", cats)
except Exception as e:
    print(e)
