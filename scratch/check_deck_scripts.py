import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('deck.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'<script[^>]*src=["\']([^"\']+)["\']', text):
    print(m.group(1))
