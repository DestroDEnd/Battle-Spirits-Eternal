import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_range(title, start, count):
    print(f"=== {title} (lines {start}-{start+count}) ===")
    print(''.join(lines[start-1:start-1+count]))

print_range("executePlayerAttack", 4520, 25)
print_range("resolveClash", 4710, 30)
print_range("runAiAttackStep", 5230, 30)
print_range("takeLifeDamage", 5505, 30)
print_range("endTurn", 4940, 25)
