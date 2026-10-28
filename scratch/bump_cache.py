import glob

for f in glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace('styles.css?v=3.7', 'styles.css?v=3.8')
    c = c.replace('app.js?v=3.7', 'app.js?v=3.8')
    c = c.replace('battle_arena.js?v=3.7', 'battle_arena.js?v=3.8')
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(c)
print('Bumped cache busters to v=3.8 across all HTML files!')
