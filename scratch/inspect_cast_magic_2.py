f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function castMagic(')
print(f[idx+1100:idx+2400].encode('ascii', errors='replace').decode('ascii'))
