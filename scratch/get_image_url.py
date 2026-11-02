import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json

url = 'https://battle-spirits.fandom.com/api.php?action=query&titles=File:SD65-CX01.png&prop=imageinfo&iiprop=url&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        for pid, page in pages.items():
            if 'imageinfo' in page:
                print('Image URL:', page['imageinfo'][0]['url'])
except Exception as e:
    print('Error:', e)
