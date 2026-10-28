import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('arena.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(''.join(lines[710:735]))
