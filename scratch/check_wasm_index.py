f = open('index.html', encoding='utf-8').read()
print('wasm_db in index.html:', 'wasm_db.js' in f)
