import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('styles.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'life-container|life-hex-gem|gem-active', text)]
for idx in matches:
    print(text[idx-50:idx+250])
    print("="*40)
