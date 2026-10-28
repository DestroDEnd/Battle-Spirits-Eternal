import urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')

endpoints = ['/deck', '/deck-view', '/deck/view', '/arena', '/']
for ep in endpoints:
    url = f"http://127.0.0.1:8000{ep}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"GET {ep} -> {resp.status} {resp.reason}")
    except Exception as e:
        print(f"GET {ep} -> FAILED: {e}")
