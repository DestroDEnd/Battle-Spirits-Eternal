with open('wasm_db.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/wasm_db_tail.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines[-60:]):
        out.write(f'{len(lines)-60+i+1}: {l}')
