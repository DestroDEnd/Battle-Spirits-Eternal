import re, glob

html_files = glob.glob('*.html')

replacements = [
    # Navigation and pages
    (r'href="/arena(\?[^"]*)?"', r'href="./arena.html\1"'),
    (r'href="/browse(\?[^"]*)?"', r'href="./browse.html\1"'),
    (r'href="/deck(\?[^"]*)?"', r'href="./deck.html\1"'),
    (r'href="/family(\?[^"]*)?"', r'href="./family.html\1"'),
    (r'href="/sets(\?[^"]*)?"', r'href="./sets.html\1"'),
    (r'href="/login(\?[^"]*)?"', r'href="./login.html\1"'),
    (r'href="/register(\?[^"]*)?"', r'href="./register.html\1"'),
    (r'href="/index\.html"', r'href="./index.html"'),
    (r'href="/"', r'href="./index.html"'),
    
    # CSS & JS assets
    (r'href="/styles\.css(\?[^"]*)?"', r'href="./styles.css\1"'),
    (r'src="/app\.js(\?[^"]*)?"', r'src="./app.js\1"'),
    (r'src="/battle_arena\.js(\?[^"]*)?"', r'src="./battle_arena.js\1"'),
    (r'src="/wasm_db\.js(\?[^"]*)?"', r'src="./wasm_db.js\1"'),
    (r'src="/firebase_service\.js(\?[^"]*)?"', r'src="./firebase_service.js\1"'),
    (r'src="/multiplayer_service\.js(\?[^"]*)?"', r'src="./multiplayer_service.js\1"'),
    (r'src="/assets/', r'src="./assets/'),
    (r'src="/images/', r'src="./images/'),
]

for fn in html_files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content
    for pattern, repl in replacements:
        modified = re.sub(pattern, repl, modified)
    
    if modified != content:
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Updated links in {fn}")
    else:
        print(f"No changes needed in {fn}")
