with open('login.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/login_inputs.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'input' in l.lower() or 'email' in l.lower() or 'username' in l.lower():
            out.write(f'{i+1}: {l}')
