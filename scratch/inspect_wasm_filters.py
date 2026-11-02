with open('wasm_db.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/wasm_filters.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if '/api/filters' in l or '/api/standard-decks' in l:
            for j in range(max(0, i-2), min(len(lines), i+30)):
                out.write(f'{j+1}: {lines[j]}')
            break
