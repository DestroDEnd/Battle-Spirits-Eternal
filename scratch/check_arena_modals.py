import re

f = open('arena.html', encoding='utf-8').read()
modals = re.findall(r'id=["\'][^"\']*modal[^"\']*["\']', f, re.I)
print('Modals in arena.html:', modals)
print('cardModal in arena.html:', 'id="cardModal"' in f or "id='cardModal'" in f)
