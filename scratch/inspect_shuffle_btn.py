f = open('index.html', encoding='utf-8').read()
idx = f.find('Shuffle')
print(f[idx-100:idx+400].encode('ascii', errors='replace').decode('ascii'))
