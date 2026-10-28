import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('database.py', 'r', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'standard_deck|canonical|Chakrambat', text, re.IGNORECASE)]
for idx in matches:
    print(text[max(0, idx-50):min(len(text), idx+250)])
    print("="*50)
