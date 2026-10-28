import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'function quickLaunchDuel' in l:
        print(''.join(lines[i-2:i+15]))
        break
