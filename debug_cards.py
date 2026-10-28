import database
import fetch_card
import urllib.request
import urllib.parse
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

conn = database.get_connection()
rows = conn.execute('SELECT name, image_filename, image_url, sets_json FROM cards WHERE image_url IS NULL OR image_url = ""').fetchall()
print('Cards with no image_url:', len(rows))
for r in rows:
    print(' -', r[0], '| file:', r[1])
conn.close()

# Also check: try fetching Generator-Siegfried image
test_card = 'The CreationDragonEmperor Generator-Siegfried'
print('\nChecking wikitext for:', test_card)
headers = {'User-Agent': 'BattleSpiritsCardFetcher/1.0'}
import re
url = 'https://battle-spirits.fandom.com/api.php?action=parse&page=' + urllib.parse.quote(test_card) + '&prop=wikitext|images&format=json'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode())
wt = data['parse']['wikitext']['*']
images = data['parse']['images']
print('Wiki images list:', images[:5])
# Check image field
img_fields = re.findall(r'^\s*\|\s*image\s*=\s*(.+)$', wt, re.MULTILINE)
print('image= fields:', img_fields[:5])
# Check tabber
print('Has tabber:', '<tabber>' in wt)
print('First 500 chars of wt:')
print(wt[:500])
