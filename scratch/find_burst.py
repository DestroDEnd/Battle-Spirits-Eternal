import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'function activateBurst|function confirmBurst|After Your Burst|After a Burst', text, re.IGNORECASE)]
for idx in matches:
    start = max(0, idx - 100)
    end = min(len(text), idx + 300)
    print("--- MATCH ---")
    print(text[start:end])
