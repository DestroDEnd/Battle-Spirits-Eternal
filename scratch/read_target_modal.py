import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('id="battleTargetModal"')
if start != -1:
    print(text[start-50:start+600])
