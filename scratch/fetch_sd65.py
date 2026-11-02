import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json
import sqlite3

url = 'https://battle-spirits.fandom.com/api.php?action=parse&page=SD65&prop=wikitext&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        wikitext = data['parse']['wikitext']['*']
        with open('scratch/sd65_fandom.txt', 'w', encoding='utf-8') as out:
            out.write(wikitext)
        print('SAVED SD65 WIKITEXT SUCCESSFULLY!')
except Exception as e:
    print('Error:', e)
