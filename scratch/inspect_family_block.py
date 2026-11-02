with open('family.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/family_load_block.txt', 'w', encoding='utf-8') as out:
    for i in range(208, 226):
        out.write(f'{i+1}: {lines[i]}')
