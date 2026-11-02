f = open('app.js', encoding='utf-8').read()
idx = f.find('async logout()')
print(f[idx:idx+600].encode('ascii', errors='replace').decode('ascii'))
