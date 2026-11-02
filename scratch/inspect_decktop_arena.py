import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i, l in enumerate(lines):
    if 'decktop' in l.lower() or 'top of your deck' in l.lower() or 'from your deck' in l.lower():
        print(f'{i+1}: {l.strip()[:140]}')
