import re, sys
sys.stdout.reconfigure(encoding='utf-8')

files_to_check = ['app.js', 'battle_arena.js', 'index.html', 'arena.html']

for fn in files_to_check:
    try:
        with open(fn, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        print(f"\n--- Checking {fn} ---")
        for idx, line in enumerate(lines, 1):
            if re.search(r'(?:upper\s*limit|max.*?cards|limit|>=?\s*40|<=?\s*40|===?\s*40|\/ 40|count\s*>\s*40|count\s*==\s*40|40\s*cards)', line, re.I):
                print(f"{idx}: {line.strip()[:100]}")
    except Exception as e:
        print(f"Error {fn}: {e}")
