import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('arena.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="opponentLifeContainer"' in line:
        print(f"Line {i+1}")
        print(''.join(lines[i-10:i+20]))
        break
