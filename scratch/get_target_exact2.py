with open('arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('<!-- MAGIC TARGET SELECTION MODAL -->')
print(repr(text[idx-100:idx+60]))
