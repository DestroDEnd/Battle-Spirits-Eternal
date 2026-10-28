import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Line 479 ===')
print(''.join(lines[475:515]))

print('\n=== Line 6185 ===')
print(''.join(lines[6180:6220]))
