import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_func(fn_name, length=120):
    for i, line in enumerate(lines):
        if f'function {fn_name}(' in line:
            print(f"=== {fn_name} (line {i+1}) ===")
            print(''.join(lines[i:i+length]))
            break

print_func('runAiAttackStep', 100)
