with open('arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('id="battleTargetModal"')
print(repr(text[idx-60:idx+40]))
