f = open('index.html', encoding='utf-8').read()
idx = f.find('shuffleFeaturedXRares')
print(f[idx-50:idx+600].encode('ascii', errors='replace').decode('ascii'))
