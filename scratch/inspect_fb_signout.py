f = open('firebase_service.js', encoding='utf-8').read()
idx = f.find('async function signOut')
print(f[idx:idx+400].encode('ascii', errors='replace').decode('ascii'))
