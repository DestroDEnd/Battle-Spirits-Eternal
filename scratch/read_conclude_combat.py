import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
for i, line in enumerate(lines):
    if 'function concludeCombat(' in line:
        start = i
        break

if start != -1:
    print(''.join(lines[start:start+130]))
