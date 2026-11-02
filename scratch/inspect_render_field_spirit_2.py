f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function renderFieldSpirit')
print(f[idx+1400:idx+3200].encode('ascii', errors='replace').decode('ascii'))
