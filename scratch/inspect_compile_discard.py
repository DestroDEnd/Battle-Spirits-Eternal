import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/compile_universal_card_effects.py', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i in range(335, 355):
    print(f'{i+1}: {lines[i]}')
