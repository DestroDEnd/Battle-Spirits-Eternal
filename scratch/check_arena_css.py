import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'(\.battle-arena-section[^{]*)\{', text):
    print(m.group(1).strip())
