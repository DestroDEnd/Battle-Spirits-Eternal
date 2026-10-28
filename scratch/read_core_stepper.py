import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'function addCoreToSpirit(' in line:
        print(''.join(lines[i:i+35]))
        break
