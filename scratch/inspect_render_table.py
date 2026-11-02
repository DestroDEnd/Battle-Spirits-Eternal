import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for j in range(2020, 2125):
    print(f'{j+1}: {lines[j]}')
