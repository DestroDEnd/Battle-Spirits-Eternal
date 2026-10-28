import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'function activateBurst(' in line:
        print(f"activateBurst at line {i+1}")
        print(''.join(lines[i:i+60]))
        break
