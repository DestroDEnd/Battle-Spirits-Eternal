import re

files = ['index.html', 'browse.html', 'family.html', 'sets.html', 'deck.html']

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match the entire <nav class="nav-tabs">...</nav>
    match = re.search(r'<nav class="nav-tabs">[\s\S]*?</nav>', content)
    if not match:
        print(f"Warning: nav-tabs not found in {fname}")
        continue

    old_nav = match.group(0)

    # 1. Remove the tabHome link: <a class="tab-btn..." id="tabHome"...>...</a>
    new_nav = re.sub(r'\s*<a\s+class="tab-btn[^"]*"\s+id="tabHome"[^>]*>[\s\S]*?</a>', '', old_nav)

    # 2. Remove the tabImport button: <button class="tab-btn[^"]*"\s+id="tabImport"[^>]*>[\s\S]*?</button>
    new_nav = re.sub(r'\s*<button\s+class="tab-btn[^"]*"\s+id="tabImport"[^>]*>[\s\S]*?</button>', '', new_nav)

    # 3. Add the login slot right before </nav>
    auth_slot = '''\n    <div class="nav-auth-slot" id="navAuthSlot">\n      <a class="tab-btn tab-btn-auth" id="tabAuth" href="/login">👤 Login</a>\n    </div>\n  '''
    new_nav = re.sub(r'\s*</nav>', auth_slot + '</nav>', new_nav)

    # Ensure styles.css?v=3.7 and app.js?v=3.7
    content = content.replace('styles.css?v=3.6', 'styles.css?v=3.7')
    content = content.replace('app.js?v=3.6', 'app.js?v=3.7')
    content = content.replace('battle_arena.js?v=3.6', 'battle_arena.js?v=3.7')

    content = content.replace(old_nav, new_nav)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated navbar in {fname} successfully!")
