with open('firebase_service.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/fb_login_code.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'login(' in l or 'loginwith' in l.lower() or 'signinwithemail' in l.lower():
            for j in range(max(0, i-2), min(len(lines), i+30)):
                out.write(f'{j+1}: {lines[j]}')
            break
