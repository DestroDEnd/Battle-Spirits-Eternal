import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i, l in enumerate(lines):
    if 'function executeWhenDeployedEffects' in l:
        print(f'{i+1}: {l}')
        for j in range(i, min(len(lines), i + 40)):
            print(f'  {j+1}: {lines[j]}')
