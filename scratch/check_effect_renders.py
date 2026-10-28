import sys, re
sys.stdout.reconfigure(encoding='utf-8')

for fname in ['battle_arena.js', 'scripts.js']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            text = f.read()
        print(f"=== {fname} ===")
        matches = [m.start() for m in re.finditer(r'\.effect', text)]
        print(f"Occurrences of .effect: {len(matches)}")
    except Exception as e:
        print(fname, e)
