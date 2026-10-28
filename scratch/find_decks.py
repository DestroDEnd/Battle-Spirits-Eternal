import sys, json
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'standardDecks|STANDARD_DECKS', text)]
for idx in matches:
    print(text[max(0, idx-50):min(len(text), idx+400)])
    print("="*50)
