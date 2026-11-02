f = open('wasm_db.js', encoding='utf-8').read()
idx = f.find('getCardsBatch')
print(f[idx-50:idx+700])
