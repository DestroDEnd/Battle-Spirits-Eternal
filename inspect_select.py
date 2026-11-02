import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'<select[^>]*id=["\']arenaPlayerDeckSelect["\'][\s\S]*?</select>', text)
if m:
    print(m.group(0))
else:
    print("Not found")
