import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
modals = re.findall(r'<div class="[^"]*modal[^"]*" id="([^"]+)"', text, re.IGNORECASE)
print("Modals in arena.html:", modals)
