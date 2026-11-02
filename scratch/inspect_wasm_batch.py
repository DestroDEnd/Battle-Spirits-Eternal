with open('wasm_db.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/wasm_batch_func.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'getcardsbatch' in l.lower():
            for j in range(max(0, i-2), min(len(lines), i+40)):
                out.write(f'{j+1}: {lines[j]}')
            break
