f = open('index.html', encoding='utf-8').read()
idx = f.find('function loadFeaturedXRares')
print(f[idx:idx+800].encode('ascii', errors='replace').decode('ascii'))
