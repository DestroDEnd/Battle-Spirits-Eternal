with open('family.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/family_lines.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if any(k in l.lower() for k in ['fetch', 'api', 'load', 'filter', 'error']):
            out.write(f'{i+1}: {l}')
