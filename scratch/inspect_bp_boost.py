import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("--- Searching for bpBoost, battleBp, getWhenAttacksBpBoost in battle_arena.js ---")
matches = [m.start() for m in re.finditer(r'getWhenAttacksBpBoost|battleBp|Chakrambat', text, re.IGNORECASE)]
for idx in matches:
    print(text[max(0, idx-100):min(len(text), idx+250)])
    print("="*50)
