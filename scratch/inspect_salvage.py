import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find("actType === 'SALVAGE'")
if idx != -1:
    print(text[idx-20:idx+800])
