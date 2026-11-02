import re

for f in ['arena.html', 'battle_arena.js', 'styles.css', 'app.js']:
    txt = open(f, encoding='utf-8', errors='ignore').read()
    matches = re.findall(r'.{0,40}fullscreen.{0,40}', txt, re.I)
    print(f, len(matches))
    for m in matches[:3]:
        print('  ', repr(m))
