f = open('battle_arena.js', encoding='utf-8').read()
import re
idx = 0
found = []
while True:
    m = re.search(r'type\s*===?\s*[\'"]Brave[\'"]|\.type\s*===\s*[\'"]Brave[\'"]|includes\([\'"]Brave[\'"]\)', f[idx:], re.I)
    if not m: break
    pos = idx + m.start()
    found.append((pos, f[pos-40:pos+80]))
    idx = pos + m.end()

print('Found type Brave checks:', len(found))
for pos, s in found[:10]:
    print(pos, repr(s))
