with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/app_avatar_dropdown.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'nav-avatar' in l.lower() or 'authdropdown' in l.lower() or 'changeduelistavatar' in l.lower():
            for j in range(max(0, i-5), min(len(lines), i+45)):
                out.write(f'{j+1}: {lines[j]}')
            break
