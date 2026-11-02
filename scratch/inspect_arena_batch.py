f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('/api/cards-batch')
print(f[idx-100:idx+900])
