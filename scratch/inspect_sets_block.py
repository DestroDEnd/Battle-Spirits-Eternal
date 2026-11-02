with open('sets.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/sets_load_block.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'loadsetsdirectory' in l.lower():
            for j in range(max(0, i-2), min(len(lines), i+20)):
                out.write(f'{j+1}: {lines[j]}')
            break
