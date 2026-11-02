f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function renderFieldSpirit')
print(f[idx:idx+1500].encode('ascii', errors='replace').decode('ascii'))
