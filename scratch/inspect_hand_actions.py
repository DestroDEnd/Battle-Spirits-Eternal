f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('function renderPlayerHand()')
print(f[idx+2000:idx+4000].encode('ascii', errors='replace').decode('ascii'))
