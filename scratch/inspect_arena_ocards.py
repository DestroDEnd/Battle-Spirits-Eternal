f = open('battle_arena.js', encoding='utf-8').read()
idx = f.find('oCards')
print(f[idx-50:idx+900])
