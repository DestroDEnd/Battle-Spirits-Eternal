f = open('app.js', encoding='utf-8').read()
idx = f.find('modalDuelSummonBtn')
print(f[idx+2700:idx+4000].encode('ascii', errors='replace').decode('ascii'))
