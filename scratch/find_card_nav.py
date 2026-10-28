import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'Card \d+ of \d+|modalNavCounter', text)]
for idx in matches:
    print(text[max(0, idx-100):min(len(text), idx+300)])
    print("="*50)
