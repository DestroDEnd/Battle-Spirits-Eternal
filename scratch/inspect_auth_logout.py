f = open('app.js', encoding='utf-8').read()
idx = f.find('const AuthManager = {')
print(f[idx:idx+1100].encode('ascii', errors='replace').decode('ascii'))
