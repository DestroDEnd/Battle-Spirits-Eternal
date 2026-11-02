with open('styles.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/css_hc.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'hc-img' in l or 'hand-card' in l or 'card-art' in l:
            for j in range(max(0, i-2), min(len(lines), i+15)):
                out.write(f'{j+1}: {lines[j]}')
