import urllib.request
import json

try:
    url = "http://localhost:8000/api/card?name=The%20PartnerDemonLord%20Javad"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("API Card Response:")
        print("Name:", data.get('card', {}).get('name') or data.get('name'))
        print("Card Number:", data.get('card', {}).get('card_number') or data.get('card_number'))
except Exception as e:
    print("API Error:", e)

try:
    url2 = "http://localhost:8000/battle_spirits.db?v=2.2"
    req2 = urllib.request.Request(url2, method='HEAD')
    with urllib.request.urlopen(req2) as resp2:
        print("\nStatic DB Response:")
        print("Status:", resp2.status)
        print("Content-Length:", resp2.headers.get('content-length'))
except Exception as e:
    print("Static DB Error:", e)
