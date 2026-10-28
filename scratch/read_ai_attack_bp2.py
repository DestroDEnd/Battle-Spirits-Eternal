import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const attacker = bestAttacker;' in line:
        print(''.join(lines[i:i+40]))
        break
