import glob

html_files = glob.glob('*.html')
for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'wasm_db.js?v=1.0' in c:
        c = c.replace('wasm_db.js?v=1.0', 'wasm_db.js?v=2.2')
        with open(hf, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated {hf}")
