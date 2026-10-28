import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'formatEffectKeywordsInModal' in line:
        print(''.join(lines[i:i+60]))
        break
