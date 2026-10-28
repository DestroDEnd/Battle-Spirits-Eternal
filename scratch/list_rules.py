import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Find executeAbilityActions
m = re.search(r'function executeAbilityActions\(.*?\)\s*\{(.*?)\n  \}', code, re.DOTALL)
if m:
    body = m.group(1)
    rules = re.findall(r'//\s*(\d+\..*?)(?=\n\s*//\s*\d+\.|\Z)', body, re.DOTALL)
    print(f"Found {len(rules)} rules in executeAbilityActions:")
    for r in rules:
        first_line = r.strip().split('\n')[0]
        print(f"  {first_line}")
else:
    print("executeAbilityActions not found!")
