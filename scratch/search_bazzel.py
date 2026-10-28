import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'Bazzel|Burning-Souldragon|Burning Souldragon', text, re.IGNORECASE)]
print(f"Matches count: {len(matches)}")
for idx in matches:
    print(text[max(0, idx-50):min(len(text), idx+200)])
    print("="*50)
