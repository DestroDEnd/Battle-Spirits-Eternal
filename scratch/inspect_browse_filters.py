with open('browse.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/browse_filters_code.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'filters' in l.lower() or 'loadfilters' in l.lower():
            for j in range(max(0, i-2), min(len(lines), i+25)):
                out.write(f'{j+1}: {lines[j]}')
            break
