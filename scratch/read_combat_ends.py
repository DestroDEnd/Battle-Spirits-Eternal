import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- CLASH END ---")
print(''.join(lines[4700:4735]))

print("--- PLAYER ATTACK LIFE DAMAGE END ---")
print(''.join(lines[4630:4655]))
