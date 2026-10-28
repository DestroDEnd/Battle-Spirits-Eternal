import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for idx, line in enumerate(lines[2268:2786], start=2269):
    depth += line.count('{') - line.count('}')
    if idx >= 2770 or depth <= 1:
        print(f'{idx}: depth={depth} -> {line.strip()[:60]}')
print('Final depth at line 2785:', depth)
