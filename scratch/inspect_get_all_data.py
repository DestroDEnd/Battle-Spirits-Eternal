f = open('app.js', encoding='utf-8').read()
idx = f.find('getAllData()')
print(f[idx:idx+800].encode('ascii', errors='replace').decode('ascii'))
