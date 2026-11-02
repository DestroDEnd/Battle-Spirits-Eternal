with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/index_featured.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'loadfeatured' in l.lower() or 'featured-x-rares' in l.lower() or 'failed to load cards' in l.lower():
            for j in range(max(0, i-5), min(len(lines), i+30)):
                out.write(f'{j+1}: {lines[j]}')
            break
