f = open('arena.html', encoding='utf-8').read()
print(f[62450:63200].encode('ascii', errors='replace').decode('ascii'))
