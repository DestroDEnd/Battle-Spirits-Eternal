f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function applyMagicEffect')
print(f[idx:idx+1200].encode('ascii', errors='replace').decode('ascii'))
