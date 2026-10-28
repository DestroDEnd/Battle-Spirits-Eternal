import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '// 5. DESTROY OPPOSING SPIRIT BY COST' in line:
        print(''.join(lines[i-5:i+40]))
        break
