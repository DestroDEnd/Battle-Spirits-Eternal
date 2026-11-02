f = open('app.js', encoding='utf-8').read()
idx = f.find('const DeckManager = {')
print(f[idx:idx+1200].encode('ascii', errors='replace').decode('ascii'))
