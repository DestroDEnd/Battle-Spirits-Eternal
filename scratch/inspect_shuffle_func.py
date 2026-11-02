f = open('index.html', encoding='utf-8').read()
idx = f.find('function shuffleFeaturedCards')
print(f[idx:idx+600].encode('ascii', errors='replace').decode('ascii'))
