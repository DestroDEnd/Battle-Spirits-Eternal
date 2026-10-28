import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("--- Inspecting calculateBpAndLevel ---")
matches = [m.start() for m in re.finditer(r'function calculateBpAndLevel', text)]
for idx in matches:
    print(text[idx:idx+700])
    print("="*50)
