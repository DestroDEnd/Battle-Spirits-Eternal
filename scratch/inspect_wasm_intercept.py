with open('wasm_db.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/wasm_fetch_intercept.txt', 'w', encoding='utf-8') as out:
    for i in range(430, 470):
        out.write(f'{i+1}: {lines[i]}')
