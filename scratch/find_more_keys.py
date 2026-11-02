import glob, re

for f in ['app.js', 'battle_arena.js', 'firebase_service.js']:
    txt = open(f, encoding='utf-8', errors='ignore').read()
    # Find patterns like const KEY = '...' or safeGetStorage('...')
    matches1 = re.findall(r'safe[GS]etStorage\s*\(\s*[\'"]([^\'"]+)[\'"]', txt)
    matches2 = re.findall(r'[A-Z0-9_]*KEY\s*[:=]\s*[\'"]([^\'"]+)[\'"]', txt)
    print(f, 'safeStorage:', set(matches1))
    print(f, 'KEY:', set(matches2))
