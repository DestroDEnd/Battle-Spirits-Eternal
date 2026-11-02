import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function markLegacyHandled')
if idx != -1:
    print(text[idx:idx+800])
