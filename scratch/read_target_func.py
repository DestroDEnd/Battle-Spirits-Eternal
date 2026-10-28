import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'function openTargetSelectionModal', text)]
for idx in matches:
    print(text[idx:idx+800])
