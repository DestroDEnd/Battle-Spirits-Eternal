import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'([^\n]*battle[^\n]*)', text, re.I):
    print(m.group(1).strip()[:100])
