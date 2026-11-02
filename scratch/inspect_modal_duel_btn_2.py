f = open('app.js', encoding='utf-8').read()
idx = f.find('modalDuelSummonBtn')
print(f[idx+1400:idx+2800].encode('ascii', errors='replace').decode('ascii'))
