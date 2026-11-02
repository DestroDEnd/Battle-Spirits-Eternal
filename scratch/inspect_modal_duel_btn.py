f = open('app.js', encoding='utf-8').read()
idx = f.find('modalDuelSummonBtn')
print(f[idx:idx+1500].encode('ascii', errors='replace').decode('ascii'))
