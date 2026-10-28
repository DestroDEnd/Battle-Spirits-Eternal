import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = [m.start() for m in re.finditer(r'currentList', text)]
for idx in matches:
    print(text[max(0, idx-50):min(len(text), idx+200)])
    print("="*50)
