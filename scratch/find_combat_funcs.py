import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', text)
combat_funcs = [fn for fn in funcs if any(k in fn.lower() for k in ['combat', 'attack', 'block', 'battle', 'clash', 'damage', 'end'])]
print("Combat/Attack related functions:")
for fn in combat_funcs:
    print(fn)
