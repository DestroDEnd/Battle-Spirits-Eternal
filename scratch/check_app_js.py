import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("app.js length:", len(text))
matches = [m.start() for m in re.finditer(r'openCardModal|cardEffect|formatEffect', text, re.IGNORECASE)]
for idx in matches:
    print(text[idx-50:idx+250])
