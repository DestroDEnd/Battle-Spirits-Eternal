import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'.{0,40}After (?:Your|a) Burst.{0,40}', text, re.IGNORECASE)
print(f"Matches count: {len(matches)}")
for m in matches:
    print(m)
