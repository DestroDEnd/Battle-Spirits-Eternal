f = open('firebase_service.js', encoding='utf-8').read()
idx = f.find('onAuthStateChanged')
print(f[idx:idx+1100].encode('ascii', errors='replace').decode('ascii'))
