import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'id="battleArena"' in l or 'id="featuredXRares"' in l:
        print(f"Line {i+1}: {repr(l)}")
        for k in range(max(0, i-3), min(len(lines), i+4)):
            print(f"  {k+1}: {repr(lines[k])}")
