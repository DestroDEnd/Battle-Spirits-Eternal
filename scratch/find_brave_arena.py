f = open('battle_arena.js', encoding='utf-8').read()
import re

matches = re.findall(r'.{0,40}brave.{0,40}', f, re.I)
print('Total matches for brave:', len(matches))
for m in matches[:10]:
    print('  ', repr(m))
