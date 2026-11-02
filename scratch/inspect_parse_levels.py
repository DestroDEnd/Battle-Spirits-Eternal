f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function parseLevels')
print(f[idx:idx+800].encode('ascii', errors='replace').decode('ascii'))
