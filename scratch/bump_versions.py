import re

files = ['browse.html', 'deck.html', 'family.html', 'index.html', 'login.html', 'register.html', 'sets.html']
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'styles\.css(?:\?v=[^"\'\s>]+)?', 'styles.css?v=4.7', content)
    content = re.sub(r'app\.js(?:\?v=[^"\'\s>]+)?', 'app.js?v=4.7', content)
    content = re.sub(r'battle_arena\.js(?:\?v=[^"\'\s>]+)?', 'battle_arena.js?v=4.7', content)
    with open(fn, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
print('Bumped cache busters across all pages to v=4.7')
