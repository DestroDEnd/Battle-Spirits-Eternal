wasm_tags = """  <!-- WebAssembly SQLite Engine (sql.js) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js"></script>
  <script src="/wasm_db.js?v=1.0"></script>
"""

files = ['browse.html', 'deck.html', 'index.html', 'family.html', 'sets.html']

for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'wasm_db.js' not in content:
        # Find where app.js is included
        idx = content.find('<script src="/app.js')
        if idx != -1:
            content = content[:idx] + wasm_tags + '  ' + content[idx:]
            with open(fn, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Injected wasm_db to {fn}")
        else:
            print(f"Could not find app.js script tag in {fn}")
    else:
        print(f"Already injected in {fn}")
