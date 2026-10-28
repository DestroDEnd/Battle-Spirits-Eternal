import sys, re
sys.stdout.reconfigure(encoding='utf-8')

for fname in ['battle_arena.js', 'app.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        text = f.read()
    matches = [m.start() for m in re.finditer(r'Active on Battlefield', text, re.IGNORECASE)]
    print(f"=== {fname} ===")
    for idx in matches:
        print(text[max(0, idx-50):min(len(text), idx+150)])
