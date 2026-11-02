import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i in range(4580, 4640):
    print(f'{i+1}: {lines[i]}')
