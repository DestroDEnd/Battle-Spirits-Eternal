import re

def check_missing_calls():
    with open('index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()

    with open('deck.html', 'r', encoding='utf-8') as f:
        deck_html = f.read()

    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    with open('battle_arena.js', 'r', encoding='utf-8') as f:
        battle_arena_js = f.read()

    # Extract all inline calls from index.html
    raw_handlers_index = re.findall(r'on(?:click|change|submit|input)\s*=\s*["\']([^"\']+)["\']', index_html)
    calls_index = set()
    for h in raw_handlers_index:
        for c in re.findall(r'([a-zA-Z0-9_$.]+)\s*\(', h):
            if c not in ('event.stopPropagation', 'document.getElementById', 'if'):
                calls_index.add(c)

    # Extract all inline calls from deck.html
    raw_handlers_deck = re.findall(r'on(?:click|change|submit|input)\s*=\s*["\']([^"\']+)["\']', deck_html)
    calls_deck = set()
    for h in raw_handlers_deck:
        for c in re.findall(r'([a-zA-Z0-9_$.]+)\s*\(', h):
            if c not in ('event.stopPropagation', 'document.getElementById', 'if'):
                calls_deck.add(c)

    # Find BattleArena exports
    ba_exports_match = re.search(r'window\.BattleArena\s*=\s*\{([\s\S]*?)\};', battle_arena_js)
    ba_exports = set()
    if ba_exports_match:
        for line in ba_exports_match.group(1).split(','):
            line = line.strip()
            if line:
                key = line.split(':')[0].strip()
                ba_exports.add(key)

    # Find DeckManagerUI methods in deck.html
    dm_methods = set(re.findall(r'([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{', deck_html))

    # Find functions in app.js
    app_funcs = set(re.findall(r'(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)', app_js))

    # Find functions in deck.html
    deck_funcs = set(re.findall(r'(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)', deck_html))

    print(f"Total BattleArena exports: {len(ba_exports)}")
    print(f"Checking index.html calls ({len(calls_index)})...")
    for c in sorted(calls_index):
        if c.startswith('BattleArena.'):
            method = c.replace('BattleArena.', '')
            if method not in ba_exports:
                print(f"  [MISSING EXPORT] BattleArena.{method}")
            else:
                pass
        else:
            if c not in app_funcs and c not in deck_funcs:
                print(f"  [MISSING FUNCTION in index.html] {c}")

    print(f"\nChecking deck.html calls ({len(calls_deck)})...")
    for c in sorted(calls_deck):
        if c.startswith('DeckManagerUI.'):
            method = c.replace('DeckManagerUI.', '')
            if method not in dm_methods:
                print(f"  [MISSING METHOD in DeckManagerUI] {method}")
        elif c.startswith('BattleArena.'):
            method = c.replace('BattleArena.', '')
            if method not in ba_exports:
                print(f"  [MISSING EXPORT] BattleArena.{method}")
        else:
            if c not in app_funcs and c not in deck_funcs:
                print(f"  [MISSING FUNCTION in deck.html] {c}")

check_missing_calls()
