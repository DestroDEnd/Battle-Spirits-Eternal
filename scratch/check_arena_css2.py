import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'\.battle-arena-section\s*\{[^}]*\}', text)
if m:
    print(m.group(0))
